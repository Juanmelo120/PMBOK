/* ═══════════════════════════════════════════════════════════
   clave-hilo.js — El hilo que cifra y compara contraseñas
   ───────────────────────────────────────────────────────────
   Aquí se usan a propósito las variantes «Sync» de bcrypt: este
   hilo no tiene nada más que hacer y bloquearlo es justo lo que
   deja libre el hilo principal de la API.
   ═══════════════════════════════════════════════════════════ */

'use strict';

const { parentPort } = require('node:worker_threads');
const bcrypt = require('bcryptjs');

parentPort.on('message', (m) => {
  try {
    const valor = m.op === 'hash'
      ? bcrypt.hashSync(m.texto, m.coste)
      : bcrypt.compareSync(m.texto, m.hash);
    parentPort.postMessage({ id: m.id, valor: valor });
  } catch (err) {
    parentPort.postMessage({ id: m.id, error: err.message });
  }
});
