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

/* Errores que PostgreSQL resuelve deshaciendo una de las dos transacciones
   en conflicto: no son fallos, es la señal de «vuelve a intentarlo».
   40P01 interbloqueo · 40001 la transacción no se pudo serializar */
const REINTENTABLES = new Set(['40P01', '40001']);
const INTENTOS = 3;

/* Ejecuta fn(cliente) dentro de BEGIN/COMMIT; cualquier error deshace todo.
   Si PostgreSQL aborta la transacción por un choque con otra, se repite
   tras una espera corta y desigual, para no volver a chocar en el mismo
   instante. Repetir es seguro porque fn solo toca la base: lo deshecho
   por el ROLLBACK se vuelve a hacer desde cero. */
async function transaccion(fn) {
  for (let intento = 1; ; intento++) {
    const cliente = await pool.connect();
    try {
      await cliente.query('BEGIN');
      const resultado = await fn(cliente);
      await cliente.query('COMMIT');
      return resultado;
    } catch (err) {
      await cliente.query('ROLLBACK').catch(() => {});
      if (!REINTENTABLES.has(err.code) || intento >= INTENTOS) throw err;
      /* Que quede constancia: el reintento salva la petición, pero que
         haya choques repetidos avisa de un orden de bloqueo mal puesto */
      console.warn('[bd] transacción repetida (' + err.code + '), intento ' + (intento + 1) + ' de ' + INTENTOS);
      await new Promise((seguir) => setTimeout(seguir, intento * 20 + Math.floor(Math.random() * 40)));
    } finally {
      cliente.release();
    }
  }
}

function cerrar() {
  return pool.end();
}

module.exports = { pool, consulta, uno, varios, transaccion, cerrar };
