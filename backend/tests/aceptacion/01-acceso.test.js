/* HU-01 · Como usuario quiero entrar con mi correo y contraseña
   para trabajar en mis proyectos, y que mi sesión esté protegida. */

'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciar, ADMIN } = require('../ayuda');
const { sembrar } = require('../../db/semilla');
const db = require('../../src/db');

describe('HU-01 Acceso y sesiones', () => {
  let e;
  before(async () => { e = await iniciar(); });
  after(async () => { await e.cerrar(); });

  it('CA-01 el servidor informa que la base de datos está conectada y el catálogo cargado', async () => {
    const r = await e.anonimo.get('/api/salud');
    assert.equal(r.estado, 200);
    assert.equal(r.datos.bd, 'conectada');
    assert.equal(r.datos.base, 'pmbok8_test');
    /* El backend admite PostgreSQL 15 o superior */
    assert.match(r.datos.postgres, /^PostgreSQL (1[5-9]|[2-9]\d)(\.|$)/);
    assert.equal(r.datos.catalogo.procesos, 40);
    assert.equal(r.datos.catalogo.artefactos, 42);
  });

  it('CA-02 la cuenta inicial entra y recibe un token y su perfil sin contraseña', async () => {
    const r = await e.anonimo.post('/api/auth/entrar', { correo: '  ADMIN@pmbok.local ', clave: ADMIN.clave });
    assert.equal(r.estado, 200);
    assert.ok(r.datos.token.split('.').length === 3, 'token JWT');
    assert.equal(r.datos.usuario.correo, 'admin@pmbok.local');
    assert.equal(r.datos.usuario.rol, 'admin');
    assert.ok(r.datos.expira > Date.now());
    assert.equal(r.datos.usuario.clave, undefined);
    assert.equal(r.datos.usuario.claveHash, undefined);
  });

  it('CA-03 una contraseña incorrecta o un correo inexistente dan el mismo 401', async () => {
    const a = await e.anonimo.post('/api/auth/entrar', { correo: ADMIN.correo, clave: 'mala' });
    const b = await e.anonimo.post('/api/auth/entrar', { correo: 'nadie@pmbok.local', clave: 'mala' });
    assert.equal(a.estado, 401);
    assert.equal(b.estado, 401);
    assert.equal(a.datos.error, b.datos.error, 'no revela qué correos existen');
  });

  it('CA-04 sin token, con token manipulado o con cabecera rara, la API responde 401', async () => {
    assert.equal((await e.anonimo.get('/api/proyectos')).estado, 401);
    const partes = e.admin.token.split('.');
    const falso = partes[0] + '.' + Buffer.from('{"sid":"x","sub":"u-admin"}').toString('base64url') + '.' + partes[2];
    assert.equal((await e.anonimo.con(falso).get('/api/proyectos')).estado, 401);
    assert.equal((await e.anonimo.get('/api/proyectos', { Authorization: 'Basic abc' })).estado, 401);
  });

  it('CA-05 /api/auth/yo devuelve el usuario de la sesión', async () => {
    const r = await e.admin.get('/api/auth/yo');
    assert.equal(r.estado, 200);
    assert.equal(r.datos.usuario.id, 'u-admin');
  });

  it('CA-06 al salir, el token deja de valer inmediatamente', async () => {
    const c = await e.entrar(ADMIN.correo, ADMIN.clave);
    assert.equal((await c.get('/api/auth/yo')).estado, 200);
    assert.equal((await c.post('/api/auth/salir')).estado, 204);
    assert.equal((await c.get('/api/auth/yo')).estado, 401);
  });

  it('CA-07 cambiar la propia contraseña exige la actual y cierra las demás sesiones', async () => {
    const u = await e.crearUsuario('miembro');
    const otraSesion = await e.entrar(u.usuario.correo, u.clave);

    const mala = await u.put('/api/auth/clave', { actual: 'no-es', nueva: 'nuevaClave1' });
    assert.equal(mala.estado, 400);
    const corta = await u.put('/api/auth/clave', { actual: u.clave, nueva: '123' });
    assert.equal(corta.estado, 400);

    const ok = await u.put('/api/auth/clave', { actual: u.clave, nueva: 'nuevaClave1' });
    assert.equal(ok.estado, 200);
    assert.equal((await u.get('/api/auth/yo')).estado, 200, 'la sesión actual sigue');
    assert.equal((await otraSesion.get('/api/auth/yo')).estado, 401, 'las demás se cierran');
    assert.equal((await e.anonimo.post('/api/auth/entrar', { correo: u.usuario.correo, clave: u.clave })).estado, 401);
    assert.equal((await e.anonimo.post('/api/auth/entrar', { correo: u.usuario.correo, clave: 'nuevaClave1' })).estado, 200);
  });

  it('CA-08 una cuenta desactivada no entra y sus sesiones abiertas caducan', async () => {
    const u = await e.crearUsuario('miembro');
    const r = await e.admin.patch('/api/usuarios/' + u.usuario.id, { activo: false });
    assert.equal(r.estado, 200);
    assert.equal(r.datos.activo, false);
    assert.equal((await u.get('/api/auth/yo')).estado, 401);
    const intento = await e.anonimo.post('/api/auth/entrar', { correo: u.usuario.correo, clave: u.clave });
    assert.equal(intento.estado, 403);
    assert.match(intento.datos.error, /desactivada/);
  });

  it('CA-09 tras muchos intentos fallidos se bloquea temporalmente el acceso (429)', async () => {
    const u = await e.crearUsuario('miembro');
    let ultimo;
    for (let i = 0; i < 11; i++) {
      ultimo = await e.anonimo.post('/api/auth/entrar', { correo: u.usuario.correo, clave: 'incorrecta' });
    }
    assert.equal(ultimo.estado, 429);
    const bloqueado = await e.anonimo.post('/api/auth/entrar', { correo: u.usuario.correo, clave: u.clave });
    assert.equal(bloqueado.estado, 429, 'ni con la clave buena mientras dura el bloqueo');
  });

  it('CA-10 un cuerpo que no es JSON válido da 400 con mensaje claro', async () => {
    const r = await e.anonimo.post('/api/auth/entrar', '{"correo": ');
    assert.equal(r.estado, 400);
    assert.match(r.datos.error, /JSON/);
  });

  it('CA-11 una ruta de API inexistente responde 404 en JSON', async () => {
    const r = await e.admin.get('/api/no-existe');
    assert.equal(r.estado, 404);
    assert.equal(r.datos.codigo, 'NO_ENCONTRADO');
  });

  /* Quedarse sin administrador es el peor momento para que el servidor no
     arranque: al reiniciar tiene que recuperar el acceso, no caerse. */
  it('CA-12 si se borra la cuenta de administrador, al reiniciar se vuelve a crear', async () => {
    await db.consulta("DELETE FROM usuarios WHERE rol = 'admin'");
    const r = await db.transaccion((cx) => sembrar(cx));
    assert.equal(r.adminCreado, true);

    const fila = await db.uno("SELECT id, rol, activo, debe_cambiar_clave FROM usuarios WHERE correo = $1",
      [ADMIN.correo]);
    assert.equal(fila.rol, 'admin');
    assert.equal(fila.activo, true);
    assert.equal(fila.debe_cambiar_clave, true, 'la clave inicial es conocida: se cambia al entrar');

    const entrada = await e.anonimo.post('/api/auth/entrar', { correo: ADMIN.correo, clave: ADMIN.clave });
    assert.equal(entrada.estado, 200);
  });

  it('CA-13 se recupera el administrador aunque el id «u-admin» esté ocupado por otra cuenta', async () => {
    await db.consulta("DELETE FROM usuarios WHERE rol = 'admin'");
    /* Una cuenta que conserva el id fijo pero ya no es la administradora:
       reutilizar ese id rompía la clave primaria y el arranque entero. */
    await db.consulta(
      `INSERT INTO usuarios (id, nombre, correo, clave_hash, rol)
       VALUES ('u-admin', 'Antigua cuenta', 'antigua@pmbok.local', 'x', 'director')`);

    await db.transaccion((cx) => sembrar(cx));

    const nuevo = await db.uno("SELECT id, rol, activo FROM usuarios WHERE correo = $1", [ADMIN.correo]);
    assert.ok(nuevo, 'se creó la cuenta administradora');
    assert.equal(nuevo.rol, 'admin');
    assert.notEqual(nuevo.id, 'u-admin', 'con un id propio, sin pisar el ocupado');

    const vieja = await db.uno("SELECT rol FROM usuarios WHERE id = 'u-admin'");
    assert.equal(vieja.rol, 'director', 'la cuenta que ocupaba el id se queda como estaba');
  });
});
