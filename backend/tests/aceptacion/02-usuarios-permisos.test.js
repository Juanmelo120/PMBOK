/* HU-02 · Como administrador quiero gestionar cuentas, roles y permisos
   por portafolio, programa o proyecto, sumando niveles (gana el más alto). */

'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciar } = require('../ayuda');

describe('HU-02 Usuarios, roles y permisos', () => {
  let e;
  before(async () => { e = await iniciar(); });
  after(async () => { await e.cerrar(); });

  it('CA-01 el administrador crea cuentas de cada rol y el listado nunca expone contraseñas', async () => {
    for (const rol of ['director', 'miembro', 'ejecutor']) {
      const r = await e.admin.post('/api/usuarios', { nombre: 'Persona ' + rol, correo: rol + '@Equipo.local', clave: 'clave123', rol });
      assert.equal(r.estado, 201);
      assert.equal(r.datos.rol, rol);
      assert.equal(r.datos.correo, rol + '@equipo.local', 'el correo se guarda en minúsculas');
      assert.equal(r.datos.activo, true);
    }
    const u = await e.crearUsuario('miembro');
    const lista = await u.get('/api/usuarios');
    assert.equal(lista.estado, 200, 'cualquier sesión puede listar usuarios para asignar responsables');
    assert.ok(lista.datos.length >= 5);
    const texto = JSON.stringify(lista.datos);
    assert.ok(!/clave|hash|\$2[aby]\$/.test(texto), 'sin rastro de contraseñas');
    const roles = await u.get('/api/usuarios/roles');
    assert.deepEqual(roles.datos.map((x) => x.id), ['admin', 'director', 'miembro', 'ejecutor']);
  });

  it('CA-02 se validan correo único, formato, longitud de contraseña y rol', async () => {
    const dup = await e.admin.post('/api/usuarios', { correo: 'DIRECTOR@equipo.local', clave: 'clave123' });
    assert.equal(dup.estado, 409);
    assert.match(dup.datos.error, /Ya existe una cuenta/);
    assert.equal((await e.admin.post('/api/usuarios', { correo: 'sin-arroba', clave: 'clave123' })).estado, 400);
    const corta = await e.admin.post('/api/usuarios', { correo: 'x@y.z', clave: '123' });
    assert.equal(corta.estado, 400);
    assert.match(corta.datos.error, /6 caracteres/);
    assert.equal((await e.admin.post('/api/usuarios', { correo: 'x@y.z', clave: 'clave123', rol: 'jefe' })).estado, 400);
    const sinNombre = await e.admin.post('/api/usuarios', { correo: 'solo@correo.local', clave: 'clave123' });
    assert.equal(sinNombre.datos.nombre, 'solo@correo.local', 'sin nombre, se usa el correo');
    assert.equal(sinNombre.datos.rol, 'miembro', 'rol por defecto');
  });

  it('CA-03 quien no es administrador no gestiona cuentas ni permisos (403)', async () => {
    const d = await e.crearUsuario('director');
    assert.equal((await d.post('/api/usuarios', { correo: 'otro@x.local', clave: 'clave123' })).estado, 403);
    assert.equal((await d.patch('/api/usuarios/u-admin', { rol: 'miembro' })).estado, 403);
    assert.equal((await d.put('/api/usuarios/u-admin/clave', { clave: 'hackeada' })).estado, 403);
    assert.equal((await d.get('/api/permisos')).estado, 403);
    assert.equal((await d.post('/api/permisos', {})).estado, 403);
  });

  it('CA-04 siempre queda un administrador activo y nadie se elimina a sí mismo', async () => {
    const a = await e.admin.patch('/api/usuarios/u-admin', { rol: 'director' });
    assert.equal(a.estado, 409);
    const b = await e.admin.patch('/api/usuarios/u-admin', { activo: false });
    assert.equal(b.estado, 409);
    assert.equal((await e.admin.del('/api/usuarios/u-admin')).estado, 409);

    const otro = await e.crearUsuario('admin');
    const baja = await otro.patch('/api/usuarios/u-admin', { rol: 'director' });
    assert.equal(baja.estado, 200, 'con dos administradores, uno puede dejar de serlo');
    assert.equal((await e.admin.get('/api/usuarios')).estado, 200);
    await otro.patch('/api/usuarios/u-admin', { rol: 'admin' });

    const victima = await e.crearUsuario('ejecutor');
    assert.equal((await e.admin.del('/api/usuarios/' + victima.usuario.id)).estado, 204);
    assert.equal((await e.admin.get('/api/usuarios/' + victima.usuario.id)).estado, 404);
    assert.equal((await victima.get('/api/auth/yo')).estado, 401);
  });

  it('CA-05 al restablecer la contraseña de otra persona se cierran sus sesiones', async () => {
    const u = await e.crearUsuario('miembro');
    const r = await e.admin.put('/api/usuarios/' + u.usuario.id + '/clave', { clave: 'restablecida' });
    assert.equal(r.estado, 200);
    assert.equal((await u.get('/api/auth/yo')).estado, 401);
    assert.equal((await e.anonimo.post('/api/auth/entrar', { correo: u.usuario.correo, clave: 'restablecida' })).estado, 200);
    assert.equal((await e.admin.put('/api/usuarios/no-existe/clave', { clave: 'restablecida' })).estado, 404);
  });

  it('CA-06 los permisos por ámbito dan visibilidad y se suman: gana el nivel más alto', async () => {
    const dir = await e.crearUsuario('director');
    const m = await e.crearUsuario('miembro');
    const pf = (await dir.post('/api/portafolios', { nombre: 'Cartera TI' })).datos;
    const pr = (await dir.post('/api/proyectos', { nombre: 'ERP', portafolioId: pf.id })).datos;

    assert.deepEqual((await m.get('/api/proyectos')).datos, [], 'sin permisos no ve nada');
    assert.equal((await m.get('/api/proyectos/' + pr.id)).estado, 404, 'y no se le revela que existe');

    const pVer = await e.admin.post('/api/permisos', { usuarioId: m.usuario.id, ambito: 'portafolio', refId: pf.id, nivel: 'ver' });
    assert.equal(pVer.estado, 201);
    const visto = await m.get('/api/proyectos/' + pr.id);
    assert.equal(visto.estado, 200);
    assert.equal(visto.datos.nivel, 1);
    const hitoProhibido = await m.patch('/api/proyectos/' + pr.id, { hitos: [{ nombre: 'Go-live' }] });
    assert.equal(hitoProhibido.estado, 403);
    assert.match(hitoProhibido.datos.error, /editar/);

    await e.admin.post('/api/permisos', { usuarioId: m.usuario.id, ambito: 'proyecto', refId: pr.id, nivel: 'editar' });
    assert.equal((await m.get('/api/proyectos/' + pr.id)).datos.nivel, 2, 'ver + editar = editar');
    assert.equal((await m.patch('/api/proyectos/' + pr.id, { hitos: [{ nombre: 'Go-live' }] })).estado, 200);
    assert.equal((await m.patch('/api/proyectos/' + pr.id, { nombre: 'Otro' })).estado, 403, 'renombrar exige dirigir');

    const subir = await e.admin.post('/api/permisos', { usuarioId: m.usuario.id, ambito: 'portafolio', refId: pf.id, nivel: 'dirigir' });
    assert.equal(subir.estado, 200, 'conceder de nuevo el mismo ámbito cambia el nivel');
    assert.equal(subir.datos.id, pVer.datos.id);
    assert.equal((await m.get('/api/proyectos/' + pr.id)).datos.nivel, 3);

    const suyos = await e.admin.get('/api/permisos?usuarioId=' + m.usuario.id);
    assert.equal(suyos.datos.length, 2);
    for (const p of suyos.datos) assert.equal((await e.admin.del('/api/permisos/' + p.id)).estado, 204);
    assert.equal((await m.get('/api/proyectos/' + pr.id)).estado, 404, 'al revocar deja de verlo');
    assert.equal((await e.admin.del('/api/permisos/' + pVer.datos.id)).estado, 404);
  });

  it('CA-07 un permiso sobre algo que no existe o con valores inválidos se rechaza', async () => {
    const m = await e.crearUsuario('miembro');
    const r = await e.admin.post('/api/permisos', { usuarioId: m.usuario.id, ambito: 'programa', refId: 'no-existe', nivel: 'ver' });
    assert.equal(r.estado, 400);
    assert.match(r.datos.error, /no existe/);
    assert.equal((await e.admin.post('/api/permisos', { usuarioId: m.usuario.id, ambito: 'empresa', refId: 'x', nivel: 'ver' })).estado, 400);
    assert.equal((await e.admin.post('/api/permisos', { usuarioId: 'fantasma', ambito: 'proyecto', refId: 'x', nivel: 'ver' })).estado, 400);
    assert.equal((await e.admin.post('/api/permisos', { usuarioId: m.usuario.id, ambito: 'proyecto', refId: 'x', nivel: 'total' })).estado, 400);
  });

  it('CA-08 al borrar un portafolio desaparecen los permisos que colgaban de él', async () => {
    const m = await e.crearUsuario('miembro');
    const pf = (await e.admin.post('/api/portafolios', { nombre: 'Temporal' })).datos;
    await e.admin.post('/api/permisos', { usuarioId: m.usuario.id, ambito: 'portafolio', refId: pf.id, nivel: 'editar' });
    assert.equal((await e.admin.get('/api/permisos?usuarioId=' + m.usuario.id)).datos.length, 1);
    assert.equal((await e.admin.del('/api/portafolios/' + pf.id)).estado, 204);
    assert.equal((await e.admin.get('/api/permisos?usuarioId=' + m.usuario.id)).datos.length, 0);
  });
});
