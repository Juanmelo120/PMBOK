/* HU-11 · Como usuario quiero que la interfaz cargue de una vez todo lo
   que puedo ver, que se me obligue a cambiar una contraseña que otros
   conocen, y que la aplicación trabaje con los mínimos permisos. */

'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciar, ADMIN } = require('../ayuda');
const sesiones = require('../../src/servicios/sesiones');

describe('HU-11 Estado para la interfaz y seguridad básica', () => {
  let e;
  before(async () => { e = await iniciar({ claveInicialPendiente: true }); });
  after(async () => { await e.cerrar(); });

  it('CA-01 la cuenta inicial debe cambiar admin123 antes de hacer nada más', async () => {
    const r = await e.anonimo.post('/api/auth/entrar', ADMIN);
    assert.equal(r.estado, 200);
    assert.equal(r.datos.usuario.debeCambiarClave, true);

    for (const ruta of ['/api/estado', '/api/proyectos', '/api/usuarios', '/api/panel']) {
      const b = await e.admin.get(ruta);
      assert.equal(b.estado, 403, ruta);
      assert.equal(b.datos.codigo, 'CLAVE_PENDIENTE', ruta);
    }
    assert.equal((await e.admin.get('/api/auth/yo')).estado, 200, 'el perfil sí se consulta');

    const igual = await e.admin.put('/api/auth/clave', { actual: ADMIN.clave, nueva: ADMIN.clave });
    assert.equal(igual.estado, 400);
    assert.match(igual.datos.error, /distinta/);

    assert.equal((await e.admin.put('/api/auth/clave', { actual: ADMIN.clave, nueva: 'Admin-2026' })).estado, 200);
    assert.equal((await e.admin.get('/api/auth/yo')).datos.usuario.debeCambiarClave, false);
    assert.equal((await e.admin.get('/api/proyectos')).estado, 200);
    assert.equal((await e.anonimo.post('/api/auth/entrar', ADMIN)).estado, 401, 'admin123 ya no vale');
  });

  it('CA-02 una cuenta creada o restablecida por un administrador también pide el cambio', async () => {
    const u = await e.crearUsuario('miembro', 'Nueva', { pendiente: true });
    assert.equal(u.usuario.debeCambiarClave, true);
    assert.equal((await u.get('/api/proyectos')).estado, 403);
    assert.equal((await u.put('/api/auth/clave', { actual: u.clave, nueva: 'propia-123' })).estado, 200);
    assert.equal((await u.get('/api/proyectos')).estado, 200);

    await e.admin.put('/api/usuarios/' + u.usuario.id + '/clave', { clave: 'temporal-1' });
    const otra = await e.entrar(u.usuario.correo, 'temporal-1');
    assert.equal(otra.usuario.debeCambiarClave, true);

    const propia = await e.admin.put('/api/usuarios/u-admin/clave', { clave: 'Admin-2027' });
    assert.equal(propia.estado, 200);
    assert.equal((await e.admin.get('/api/auth/yo')).datos.usuario.debeCambiarClave, false,
      'un administrador que cambia su propia clave no queda marcado');
  });

  it('CA-03 /api/estado trae solo lo visible, con el nivel de cada proyecto', async () => {
    const dir = await e.crearUsuario('director', 'Dir');
    const otro = await e.crearUsuario('director', 'Otro');
    const mio = (await dir.post('/api/proyectos', { nombre: 'Mío', metodologia: 'agil' })).datos;
    const ajeno = (await otro.post('/api/proyectos', { nombre: 'Ajeno' })).datos;
    await dir.post('/api/proyectos/' + mio.id + '/riesgos', { titulo: 'Visible' });
    await otro.post('/api/proyectos/' + ajeno.id + '/riesgos', { titulo: 'Oculto' });
    await dir.post('/api/portafolios', { nombre: 'Cartera' });
    await dir.put('/api/vto/nicho', { texto: 'Pymes' });
    await e.admin.post('/api/permisos', { usuarioId: otro.usuario.id, ambito: 'proyecto', refId: mio.id, nivel: 'ver' });

    const r = await dir.get('/api/estado');
    assert.equal(r.estado, 200);
    const s = r.datos;
    assert.equal(s.formato, 'pmbok8-gestor');
    assert.equal(s.sesion.usuarioId, dir.usuario.id);
    assert.equal(s.usuario.id, dir.usuario.id);
    assert.deepEqual(s.proyectos.map((p) => [p.nombre, p.nivel]), [['Mío', 3]]);
    assert.deepEqual(s.riesgos.map((x) => x.titulo), ['Visible']);
    assert.equal(s.sprints.length, 1);
    assert.equal(s.sprints[0].nombre, 'Sprint 0 — Preparación');
    assert.deepEqual(s.sprints[0].historial, {});
    assert.equal(s.miembros.length, 1);
    for (const c of ['procesos', 'documentos', 'archivos', 'interesados', 'cambios', 'lecciones', 'tareas',
      'mediciones', 'comentarios', 'rocas', 'metricas', 'asientos', 'programas']) {
      assert.ok(Array.isArray(s[c]), 'falta ' + c);
    }
    assert.equal(s.portafolios.length, 1);
    assert.deepEqual(s.vto, { nicho: 'Pymes' });
    assert.ok(s.usuarios.length >= 4);
    assert.ok(!/clave_hash|claveHash|\$2[aby]\$/.test(JSON.stringify(s)));
    assert.deepEqual(s.permisos, [], 'un director no ve los permisos de otros');

    const delOtro = (await otro.get('/api/estado')).datos;
    assert.deepEqual(delOtro.proyectos.map((p) => [p.nombre, p.nivel]).sort(), [['Ajeno', 3], ['Mío', 1]]);
    assert.equal(delOtro.permisos.length, 1, 've sus propios permisos');
    const delAdmin = (await e.admin.get('/api/estado')).datos;
    assert.equal(delAdmin.proyectos.length, 2);
    assert.equal(delAdmin.permisos.length, 1);
  });

  it('CA-04 la interfaz puede fijar los identificadores de lo que crea', async () => {
    const dir = await e.crearUsuario('director');
    const p = await dir.post('/api/proyectos', { id: 'pro-cliente-1', nombre: 'Con id', creado: 1767225600000 });
    assert.equal(p.estado, 201);
    assert.equal(p.datos.id, 'pro-cliente-1');
    assert.equal(p.datos.creado, 1767225600000);
    assert.equal((await dir.post('/api/proyectos', { id: 'pro-cliente-1', nombre: 'Repetido' })).estado, 409);
    assert.equal((await dir.post('/api/proyectos', { id: 'con espacios', nombre: 'X' })).estado, 400);

    const d = await dir.post('/api/proyectos/pro-cliente-1/documentos', { id: 'doc-cliente-1', artefactoId: 'art-acta-proyecto' });
    assert.equal(d.datos.documento.id, 'doc-cliente-1');

    const u = await e.admin.post('/api/usuarios', { id: 'usu-cliente-1', correo: 'cliente@x.local', clave: 'clave123' });
    assert.equal(u.datos.id, 'usu-cliente-1');
    const pe = await e.admin.post('/api/permisos', { id: 'per-cliente-1', usuarioId: 'usu-cliente-1', ambito: 'proyecto', refId: 'pro-cliente-1', nivel: 'ver' });
    assert.equal(pe.datos.id, 'per-cliente-1');

    const f = new FormData();
    f.append('id', 'arc-cliente-1');
    f.append('categoria', 'actas');
    f.append('archivo', new Blob(['hola'], { type: 'text/plain' }), 'hola.txt');
    const a = await dir.post('/api/proyectos/pro-cliente-1/archivos', f);
    assert.equal(a.estado, 201);
    assert.equal(a.datos.id, 'arc-cliente-1');
    const repetido = new FormData();
    repetido.append('id', 'arc-cliente-1');
    repetido.append('archivo', new Blob(['x']), 'x.txt');
    assert.equal((await dir.post('/api/proyectos/pro-cliente-1/archivos', repetido)).estado, 409);
    const malo = new FormData();
    malo.append('id', '../../etc');
    malo.append('archivo', new Blob(['x']), 'x.txt');
    assert.equal((await dir.post('/api/proyectos/pro-cliente-1/archivos', malo)).estado, 400);
  });

  it('CA-05 la purga borra sesiones caducadas y cerradas hace tiempo, no las vigentes', async () => {
    const vigente = await e.entrar(ADMIN.correo, 'Admin-2027');
    await e.db.consulta(
      `INSERT INTO sesiones (id, usuario_id, expira, revocada) VALUES
         ('s-caducada', 'u-admin', now() - interval '1 hour', NULL),
         ('s-cerrada-vieja', 'u-admin', now() + interval '1 hour', now() - interval '2 days'),
         ('s-cerrada-hoy', 'u-admin', now() + interval '1 hour', now() - interval '1 hour')`);
    const borradas = await sesiones.purgar();
    assert.equal(borradas, 2);
    const quedan = (await e.db.varios("SELECT id FROM sesiones WHERE id LIKE 's-%'")).map((x) => x.id);
    assert.deepEqual(quedan, ['s-cerrada-hoy']);
    assert.equal((await vigente.get('/api/auth/yo')).estado, 200);
  });

  it('CA-06 la API trabaja con un rol sin privilegios de administración', async () => {
    const r = await e.db.uno(
      `SELECT current_user AS rol, r.rolsuper, r.rolcreatedb, r.rolcreaterole
       FROM pg_roles r WHERE r.rolname = current_user`);
    assert.equal(r.rol, 'pmbok8_app');
    assert.deepEqual([r.rolsuper, r.rolcreatedb, r.rolcreaterole], [false, false, false]);
    const prohibidas = [
      'CREATE TABLE intrusa (x int)',
      'DROP TABLE riesgos',
      'ALTER TABLE usuarios ADD COLUMN x int',
      'DELETE FROM schema_migraciones',
      'SELECT rolpassword FROM pg_authid'
    ];
    for (const sql of prohibidas) {
      await assert.rejects(e.db.consulta(sql), (err) => err.code === '42501', sql);
    }
  });
});
