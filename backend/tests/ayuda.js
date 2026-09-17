/* ═══════════════════════════════════════════════════════════
   ayuda.js — Entorno de las pruebas de aceptación
   ───────────────────────────────────────────────────────────
   Cada archivo de pruebas:
     1. recrea la base «pmbok8_test» desde cero (migraciones + semilla),
     2. levanta la API real en un puerto libre,
     3. la usa por HTTP como lo haría la interfaz.
   La base de trabajo «pmbok8» nunca se toca.
   ═══════════════════════════════════════════════════════════ */

'use strict';

process.env.NODE_ENV = 'test';
process.env.PGDATABASE = process.env.PGDATABASE_TEST || 'pmbok8_test';

const { migrar } = require('../db/migrar');
const { sembrar } = require('../db/semilla');
const db = require('../src/db');
const { crearApp } = require('../src/app');

const ADMIN = { correo: 'admin@pmbok.local', clave: 'admin123' };

function cliente(base, token) {
  async function pedir(metodo, ruta, cuerpo, cabeceras = {}) {
    const headers = { ...cabeceras };
    if (token) headers.Authorization = 'Bearer ' + token;
    let body;
    if (cuerpo instanceof FormData) {
      body = cuerpo;
    } else if (typeof cuerpo === 'string') {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
      body = cuerpo;
    } else if (cuerpo !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(cuerpo);
    }
    const r = await fetch(base + ruta, { method: metodo, headers, body });
    const tipo = r.headers.get('content-type') || '';
    let datos = null;
    if (r.status !== 204) {
      datos = tipo.includes('application/json') ? await r.json() : Buffer.from(await r.arrayBuffer());
    }
    return { estado: r.status, datos, cabeceras: r.headers };
  }
  return {
    base,
    token,
    get: (ruta, h) => pedir('GET', ruta, undefined, h),
    post: (ruta, c, h) => pedir('POST', ruta, c, h),
    put: (ruta, c, h) => pedir('PUT', ruta, c, h),
    patch: (ruta, c, h) => pedir('PATCH', ruta, c, h),
    del: (ruta, h) => pedir('DELETE', ruta, undefined, h),
    con: (otroToken) => cliente(base, otroToken)
  };
}

/* Punto de partida de casi todas las historias: cuentas que ya cambiaron
   su contraseña inicial. El cambio obligatorio se prueba en HU-11. */
function yaCambioSuClave(usuarioId) {
  return db.consulta('UPDATE usuarios SET debe_cambiar_clave = false WHERE id = $1', [usuarioId]);
}

async function iniciar({ claveInicialPendiente = false } = {}) {
  await migrar({ reiniciar: true });
  await db.transaccion((cx) => sembrar(cx));
  if (!claveInicialPendiente) await yaCambioSuClave('u-admin');
  require('../src/servicios/sesiones').reiniciarLimites();
  require('../src/servicios/invitaciones').reiniciarLimites();

  const servidor = await new Promise((resolver) => {
    const s = crearApp().listen(0, '127.0.0.1', () => resolver(s));
  });
  const base = 'http://127.0.0.1:' + servidor.address().port;
  const anonimo = cliente(base);

  async function entrar(correo, clave) {
    const r = await anonimo.post('/api/auth/entrar', { correo, clave });
    if (r.estado !== 200) throw new Error('No se pudo entrar como ' + correo + ': ' + JSON.stringify(r.datos));
    const c = cliente(base, r.datos.token);
    c.usuario = r.datos.usuario;
    return c;
  }

  const admin = await entrar(ADMIN.correo, ADMIN.clave);

  /* Crea una cuenta con el rol pedido y devuelve su cliente con sesión.
     Con pendiente = true la cuenta conserva la obligación de cambiar la clave. */
  let n = 0;
  async function crearUsuario(rol, nombre, { pendiente = false } = {}) {
    n++;
    const correo = rol + n + '@prueba.local';
    const r = await admin.post('/api/usuarios', { nombre: nombre || rol + ' ' + n, correo, clave: 'secreta' + n, rol });
    if (r.estado !== 201) throw new Error('No se pudo crear usuario: ' + JSON.stringify(r.datos));
    if (!pendiente) await yaCambioSuClave(r.datos.id);
    const c = await entrar(correo, 'secreta' + n);
    c.clave = 'secreta' + n;
    return c;
  }

  async function cerrar() {
    servidor.closeAllConnections();
    await new Promise((resolver) => servidor.close(resolver));
    await db.cerrar();
  }

  return { base, anonimo, admin, entrar, crearUsuario, yaCambioSuClave, cerrar, db };
}

/* Fecha local de hoy en AAAA-MM-DD, igual que CURRENT_DATE en Bogotá */
async function hoyBd() {
  return (await db.uno('SELECT CURRENT_DATE::text AS hoy')).hoy;
}

module.exports = { iniciar, cliente, hoyBd, ADMIN };
