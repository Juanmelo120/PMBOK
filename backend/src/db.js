/* ═══════════════════════════════════════════════════════════
   db.js — Pool de conexiones a PostgreSQL y transacciones
   ═══════════════════════════════════════════════════════════ */

'use strict';

const { Pool, types } = require('pg');
const config = require('./config');

/* DATE llega como 'AAAA-MM-DD' y no como Date: evita que la zona
   horaria del servidor mueva el día. NUMERIC y BIGINT, como número. */
types.setTypeParser(1082, (v) => v);
types.setTypeParser(1700, (v) => (v === null ? null : parseFloat(v)));
types.setTypeParser(20, (v) => (v === null ? null : parseInt(v, 10)));

const pool = new Pool(config.bd);

pool.on('error', (err) => {
  console.error('[bd] error inesperado en una conexión inactiva:', err.message);
});

function consulta(sql, parametros, cx) {
  return (cx || pool).query(sql, parametros);
}

async function uno(sql, parametros, cx) {
  const r = await consulta(sql, parametros, cx);
  return r.rows[0] || null;
}

async function varios(sql, parametros, cx) {
  const r = await consulta(sql, parametros, cx);
  return r.rows;
}

/* Ejecuta fn(cliente) dentro de BEGIN/COMMIT; cualquier error deshace todo */
async function transaccion(fn) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const resultado = await fn(cliente);
    await cliente.query('COMMIT');
    return resultado;
  } catch (err) {
    await cliente.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    cliente.release();
  }
}

function cerrar() {
  return pool.end();
}

module.exports = { pool, consulta, uno, varios, transaccion, cerrar };
