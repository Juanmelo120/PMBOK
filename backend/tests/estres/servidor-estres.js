/* ═══════════════════════════════════════════════════════════
   servidor-estres.js — API real para la prueba de carga
   Base propia «pmbok8_estres», recreada en cada arranque, y puerto
   3200: nunca toca la base de trabajo ni el servidor del usuario.
   ═══════════════════════════════════════════════════════════ */

'use strict';

process.env.PGDATABASE = process.env.PGDATABASE_ESTRES || 'pmbok8_estres';
process.env.PORT = process.env.PORT_ESTRES || '3200';
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

const config = require('../../src/config');
const db = require('../../src/db');
const { migrar } = require('../../db/migrar');
const { sembrar } = require('../../db/semilla');
const { crearApp } = require('../../src/app');

(async () => {
  await migrar({ reiniciar: process.env.CONSERVAR !== '1' });
  await db.transaccion((cx) => sembrar(cx));
  await db.consulta("UPDATE usuarios SET debe_cambiar_clave = false WHERE correo = $1", [config.admin.correo]);

  /* Cuánto tarda el bucle de eventos en atender un temporizador: si la
     cifra sube, el hilo de Node está bloqueado (bcrypt, JSON enormes…). */
  let retrasoMax = 0;
  let ultimo = Date.now();
  setInterval(() => {
    const d = Date.now() - ultimo - 200;
    if (d > retrasoMax) retrasoMax = d;
    ultimo = Date.now();
  }, 200).unref();
  process.on('SIGUSR2', () => { console.log('[estres] retrasoBucleMs=' + retrasoMax); retrasoMax = 0; });

  crearApp().listen(config.puerto, '127.0.0.1', () => {
    console.log('[estres] API en http://127.0.0.1:' + config.puerto + ' con la base ' + config.bd.database +
      ' · pool=' + config.bd.max);
  });
})().catch((err) => {
  console.error('[estres] no arrancó:', err);
  process.exit(1);
});
