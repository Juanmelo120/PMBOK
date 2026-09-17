/* ═══════════════════════════════════════════════════════════
   migrar.js — Crea la base de datos y aplica las migraciones
   ───────────────────────────────────────────────────────────
   Uso:
     node db/migrar.js              crea la BD si falta y aplica lo pendiente
     node db/migrar.js --reiniciar  borra la BD y la crea de cero

   Todo se hace con la cuenta administradora (PGADMIN_USER).
   Cada archivo de db/migraciones se aplica una sola vez, en orden
   alfabético y dentro de una transacción; queda anotado en la
   tabla schema_migraciones. Al final se garantiza que la cuenta de
   la API (PGUSER) exista y tenga solo los permisos que necesita.
   ═══════════════════════════════════════════════════════════ */

'use strict';

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const config = require('../src/config');

const DIR = path.join(__dirname, 'migraciones');

const rolPropio = () => config.bd.user !== config.bdAdmin.user;

async function conAdmin(baseDatos, fn) {
  const cliente = new Client({ ...config.bdAdmin, database: baseDatos });
  await cliente.connect();
  try {
    return await fn(cliente);
  } finally {
    await cliente.end();
  }
}

/* Crea el rol de la API o sincroniza su contraseña con .env */
async function asegurarRol(admin) {
  const { user, password } = config.bd;
  if (!/^[a-z_][a-z0-9_]{0,62}$/.test(user)) throw new Error('PGUSER no es un nombre de rol válido: ' + user);
  if (!password) throw new Error('PGPASSWORD no puede estar vacío para el rol ' + user);
  const existe = await admin.query('SELECT rolsuper FROM pg_roles WHERE rolname = $1', [user]);
  if (existe.rowCount && existe.rows[0].rolsuper) {
    throw new Error('El rol ' + user + ' es superusuario: la API debe usar una cuenta de permisos mínimos.');
  }
  const orden = existe.rowCount
    ? "SELECT format('ALTER ROLE %I WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD %L', $1::text, $2::text) AS sql"
    : "SELECT format('CREATE ROLE %I WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD %L', $1::text, $2::text) AS sql";
  const sql = (await admin.query(orden, [user, password])).rows[0].sql;
  await admin.query(sql);
  return !existe.rowCount;
}

async function asegurarBaseDatos({ reiniciar = false } = {}) {
  const nombre = config.bd.database;
  try {
    return await conAdmin('postgres', async (admin) => {
      if (rolPropio()) await asegurarRol(admin);
      if (reiniciar) {
        await admin.query(`DROP DATABASE IF EXISTS "${nombre}" WITH (FORCE)`);
      }
      const existe = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [nombre]);
      if (!existe.rowCount) {
        await admin.query(`CREATE DATABASE "${nombre}" ENCODING 'UTF8' TEMPLATE template0`);
        await admin.query(`REVOKE ALL ON DATABASE "${nombre}" FROM PUBLIC`);
        return true;
      }
      return false;
    });
  } catch (err) {
    /* Un PostgreSQL gestionado entrega la base ya creada y no siempre deja
       entrar a «postgres». Si la de trabajo responde, no hay nada que crear. */
    if (reiniciar) throw err;
    await conAdmin(nombre, (cx) => cx.query('SELECT 1'));
    console.log('[bd] la base «' + nombre + '» ya existe (no se pudo consultar «postgres»: ' + err.message + ')');
    return false;
  }
}

async function aplicarMigraciones() {
  return conAdmin(config.bd.database, async (cliente) => {
    const aplicadas = [];
    await cliente.query(`CREATE TABLE IF NOT EXISTS schema_migraciones (
      version  TEXT PRIMARY KEY,
      aplicada TIMESTAMPTZ NOT NULL DEFAULT now())`);

    const hechas = new Set((await cliente.query('SELECT version FROM schema_migraciones')).rows
      .map((r) => r.version));
    const archivos = fs.readdirSync(DIR).filter((f) => f.endsWith('.sql')).sort();

    for (const archivo of archivos) {
      if (hechas.has(archivo)) continue;
      const sql = fs.readFileSync(path.join(DIR, archivo), 'utf8');
      await cliente.query('BEGIN');
      try {
        await cliente.query(sql);
        await cliente.query('INSERT INTO schema_migraciones (version) VALUES ($1)', [archivo]);
        await cliente.query('COMMIT');
        aplicadas.push(archivo);
      } catch (err) {
        await cliente.query('ROLLBACK');
        err.message = 'Migración ' + archivo + ': ' + err.message;
        throw err;
      }
    }

    if (rolPropio()) await concederPermisos(cliente);
    return aplicadas;
  });
}

/* Solo datos: leer y escribir filas y ejecutar las funciones.
   Nada de crear, alterar o borrar objetos, ni tocar las migraciones. */
async function concederPermisos(cliente) {
  const q = (plantilla, ...args) => cliente.query(
    `SELECT format('${plantilla}', ${args.map((_, i) => '$' + (i + 1) + '::text').join(', ')}) AS sql`, args)
    .then((r) => cliente.query(r.rows[0].sql));
  const rol = config.bd.user;
  await q('GRANT CONNECT, TEMPORARY ON DATABASE %I TO %I', config.bd.database, rol);
  await q('REVOKE CREATE ON SCHEMA public FROM %I', rol);
  await q('GRANT USAGE ON SCHEMA public TO %I', rol);
  await q('GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public TO %I', rol);
  await q('REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON schema_migraciones FROM %I', rol);
  await q('GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO %I', rol);
}

async function migrar(opciones) {
  const creada = await asegurarBaseDatos(opciones);
  const aplicadas = await aplicarMigraciones();
  return { creada, aplicadas };
}

module.exports = { migrar, asegurarBaseDatos, aplicarMigraciones };

if (require.main === module) {
  const reiniciar = process.argv.includes('--reiniciar');
  migrar({ reiniciar })
    .then((r) => {
      console.log('Base de datos «' + config.bd.database + '» ' +
        (reiniciar ? 'reiniciada' : r.creada ? 'creada' : 'ya existía') + '.');
      console.log(r.aplicadas.length
        ? 'Migraciones aplicadas: ' + r.aplicadas.join(', ')
        : 'Sin migraciones pendientes.');
      if (rolPropio()) console.log('La API usa el rol «' + config.bd.user + '» con permisos solo de datos.');
    })
    .catch((err) => {
      console.error('Error al migrar:', err.message);
      process.exitCode = 1;
    });
}
