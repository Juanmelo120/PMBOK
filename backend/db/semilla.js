/* ═══════════════════════════════════════════════════════════
   semilla.js — Datos mínimos para arrancar
   ───────────────────────────────────────────────────────────
   · Sincroniza el catálogo (40 procesos y 42 artefactos).
   · Crea la cuenta de administrador si no hay ninguna.
   Es idempotente: ejecutarlo varias veces no duplica nada.
   ═══════════════════════════════════════════════════════════ */

'use strict';

const bcrypt = require('bcryptjs');
const config = require('../src/config');
const db = require('../src/db');
const catalogo = require('../src/catalogo');

async function sembrar(cx) {
  const catalogoRes = await catalogo.sincronizar(cx);

  const hayAdmin = await db.uno("SELECT 1 FROM usuarios WHERE rol = 'admin' AND activo LIMIT 1", [], cx);
  let adminCreado = false;
  if (!hayAdmin) {
    const hash = await bcrypt.hash(config.admin.clave, 10);
    /* La contraseña inicial es conocida: hay que cambiarla al entrar */
    await db.consulta(
      `INSERT INTO usuarios (id, nombre, correo, clave_hash, rol, debe_cambiar_clave)
       VALUES ('u-admin', $1, $2, $3, 'admin', true)
       ON CONFLICT (correo) DO UPDATE SET rol = 'admin', activo = true`,
      [config.admin.nombre, config.admin.correo, hash], cx);
    adminCreado = true;
  }
  return { ...catalogoRes, adminCreado };
}

module.exports = { sembrar };

if (require.main === module) {
  db.transaccion((cx) => sembrar(cx))
    .then((r) => {
      console.log('Catálogo sincronizado: ' + r.procesos + ' procesos, ' + r.artefactos + ' artefactos.');
      console.log(r.adminCreado
        ? 'Administrador creado: ' + config.admin.correo
        : 'Ya existía un administrador activo.');
    })
    .catch((err) => {
      console.error('Error al sembrar:', err.message);
      process.exitCode = 1;
    })
    .finally(() => db.cerrar());
}
