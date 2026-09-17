/* ═══════════════════════════════════════════════════════════
   servidor.js — Punto de entrada
   Al arrancar: crea la base si falta, aplica migraciones
   pendientes, sincroniza el catálogo y garantiza un administrador.
   ═══════════════════════════════════════════════════════════ */

'use strict';

const config = require('./config');
const db = require('./db');
const { migrar } = require('../db/migrar');
const { sembrar } = require('../db/semilla');
const { crearApp } = require('./app');
const sesiones = require('./servicios/sesiones');

/* Por defecto solo el propio equipo, en IPv4 y en IPv6: «localhost»
   resuelve a ::1 en muchos clientes de Windows */
const HOSTS = process.env.HOST ? [process.env.HOST] : ['127.0.0.1', '::1'];

function escuchar(app, host) {
  return new Promise((resolver, rechazar) => {
    const s = app.listen(config.puerto, host);
    s.once('listening', () => resolver(s));
    s.once('error', rechazar);
  });
}

async function arrancar() {
  const m = await migrar();
  if (m.creada) console.log('[bd] base «' + config.bd.database + '» creada');
  if (m.aplicadas.length) console.log('[bd] migraciones aplicadas: ' + m.aplicadas.join(', '));
  const s = await db.transaccion((cx) => sembrar(cx));
  console.log('[bd] catálogo: ' + s.procesos + ' procesos, ' + s.artefactos + ' artefactos' +
    (s.adminCreado ? ' · administrador creado (' + config.admin.correo + ')' : ''));

  const purgar = () => sesiones.purgar()
    .then((n) => { if (n) console.log('[bd] sesiones caducadas eliminadas: ' + n); })
    .catch((err) => console.error('[bd] no se pudieron purgar las sesiones:', err.message));
  await purgar();
  setInterval(purgar, 60 * 60 * 1000).unref();

  const app = crearApp();
  const servidores = [];
  for (const host of HOSTS) {
    try {
      servidores.push(await escuchar(app, host));
    } catch (err) {
      /* Sin IPv6 en el equipo basta con IPv4; cualquier otro fallo es real */
      if (host === '::1' && servidores.length && err.code === 'EADDRNOTAVAIL') continue;
      throw err;
    }
  }
  const direcciones = servidores.map((s) => {
    const a = s.address();
    return 'http://' + (a.family === 'IPv6' ? '[' + a.address + ']' : a.address) + ':' + a.port;
  });
  console.log('[api] Gestor PMBOK 8 escuchando en ' + direcciones.join(' y '));
  console.log('[api] interfaz: http://localhost:' + config.puerto + '/  ·  salud: /api/salud');

  const parar = (senal) => {
    console.log('[api] ' + senal + ' recibido, cerrando…');
    let pendientes = servidores.length;
    servidores.forEach((s) => s.close(() => {
      if (--pendientes === 0) db.cerrar().then(() => process.exit(0));
    }));
    setTimeout(() => process.exit(1), 5000).unref();
  };
  process.on('SIGINT', parar);
  process.on('SIGTERM', parar);
}

arrancar().catch((err) => {
  console.error('[api] no se pudo arrancar:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error('      El puerto ' + config.puerto + ' ya está ocupado: ¿hay otra copia del servidor abierta? Cambia PORT en backend/.env si lo necesitas.');
  } else if (err.code === 'ECONNREFUSED') {
    console.error('      ¿Está PostgreSQL en marcha en ' + config.bd.host + ':' + config.bd.port + '?');
  } else if (err.code === '28P01') {
    console.error('      Una contraseña de backend/.env no coincide: PGADMIN_PASSWORD (' + config.bdAdmin.user +
      ') o PGPASSWORD (' + config.bd.user + ').');
  }
  process.exit(1);
});
