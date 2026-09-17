/* ═══════════════════════════════════════════════════════════
   servidor-e2e.js — API real para las pruebas en navegador
   Base propia «pmbok8_e2e», recreada en cada arranque, y puerto
   3100: nunca toca la base de trabajo ni el servidor del usuario.
   ═══════════════════════════════════════════════════════════ */

'use strict';

process.env.PGDATABASE = process.env.PGDATABASE_E2E || 'pmbok8_e2e';
process.env.PORT = process.env.PORT_E2E || '3100';
process.env.NODE_ENV = 'test';

const config = require('../../src/config');
const db = require('../../src/db');
const { migrar } = require('../../db/migrar');
const { sembrar } = require('../../db/semilla');
const { crearApp } = require('../../src/app');

(async () => {
  await migrar({ reiniciar: true });
  await db.transaccion((cx) => sembrar(cx));
  crearApp().listen(config.puerto, '127.0.0.1', () => {
    console.log('[e2e] API en http://127.0.0.1:' + config.puerto + ' con la base ' + config.bd.database);
  });
})().catch((err) => {
  console.error('[e2e] no arrancó:', err);
  process.exit(1);
});
