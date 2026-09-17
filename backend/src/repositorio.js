/* ═══════════════════════════════════════════════════════════
   repositorio.js — Acceso genérico a tablas
   ───────────────────────────────────────────────────────────
   Cada tabla se describe con una definición:
     { tabla, campos: [[propiedadJson, columna], ...],
       json: [propiedades JSONB], orden: 'SQL ORDER BY',
       seleccion: 'columnas extra calculadas (alias t)' }
   La API habla en camelCase y fechas-hora en milisegundos, igual
   que la base local del navegador; la BD en snake_case y timestamptz.
   Los nombres de tabla y columna salen siempre de estas
   definiciones, nunca de la petición.
   ═══════════════════════════════════════════════════════════ */

'use strict';

const db = require('./db');

function aObjeto(def, fila) {
  if (!fila) return null;
  const o = {};
  for (const [prop, col] of def.campos) {
    let v = fila[col];
    if (v === undefined) continue;
    if (v instanceof Date) v = v.getTime();
    o[prop] = v;
  }
  return o;
}

function aColumnas(def, datos) {
  const columnas = [];
  const valores = [];
  for (const [prop, col] of def.campos) {
    if (!Object.prototype.hasOwnProperty.call(datos, prop) || datos[prop] === undefined) continue;
    if (def.soloLectura && def.soloLectura.includes(prop)) continue;
    let v = datos[prop];
    if (def.json && def.json.includes(prop) && v !== null) v = JSON.stringify(v);
    /* Fechas-hora que llegan en milisegundos (DATE, como mediciones.fecha, llega en texto) */
    const esMarca = /^(creado|actualizado|aprobado|cierre)$/.test(prop) ||
      (prop === 'fecha' && def.tabla === 'proyecto_procesos');
    if (esMarca && typeof v === 'number') v = new Date(v);
    columnas.push(col);
    valores.push(v);
  }
  return { columnas, valores };
}

function marcadores(n) {
  return Array.from({ length: n }, (_, i) => '$' + (i + 1)).join(', ');
}

function selectBase(def) {
  return 'SELECT t.*' + (def.seleccion ? ', ' + def.seleccion : '') + ' FROM ' + def.tabla + ' t';
}

async function obtener(def, id, cx) {
  const fila = await db.uno(selectBase(def) + ' WHERE t.id = $1', [id], cx);
  return aObjeto(def, fila);
}

/* filtro: { columna_sql: valor } — las claves vienen del código */
async function listar(def, filtro, cx) {
  const condiciones = [];
  const valores = [];
  Object.keys(filtro || {}).forEach((col) => {
    valores.push(filtro[col]);
    condiciones.push('t.' + col + ' = $' + valores.length);
  });
  const sql = selectBase(def) +
    (condiciones.length ? ' WHERE ' + condiciones.join(' AND ') : '') +
    ' ORDER BY ' + (def.orden || 't.creado');
  const filas = await db.varios(sql, valores, cx);
  return filas.map((f) => aObjeto(def, f));
}

/* Filas cuya columna está en la lista (p. ej. todos los riesgos de varios proyectos) */
async function listarEn(def, columna, valores, cx) {
  if (!valores.length) return [];
  const sql = selectBase(def) + ' WHERE t.' + columna + ' = ANY($1::text[]) ORDER BY ' + (def.orden || 't.creado');
  const filas = await db.varios(sql, [valores], cx);
  return filas.map((f) => aObjeto(def, f));
}

async function insertar(def, datos, cx) {
  const { columnas, valores } = aColumnas(def, datos);
  const sql = columnas.length
    ? 'INSERT INTO ' + def.tabla + ' (' + columnas.join(', ') + ') VALUES (' + marcadores(valores.length) + ') RETURNING id'
    : 'INSERT INTO ' + def.tabla + ' DEFAULT VALUES RETURNING id';
  const fila = await db.uno(sql, valores, cx);
  return obtener(def, fila.id, cx);
}

/* Inserción masiva (importación): no relee la fila */
async function insertarSimple(def, datos, cx) {
  const { columnas, valores } = aColumnas(def, datos);
  await db.consulta('INSERT INTO ' + def.tabla + ' (' + columnas.join(', ') + ') VALUES (' +
    marcadores(valores.length) + ')', valores, cx);
}

async function actualizar(def, id, cambios, cx) {
  const { columnas, valores } = aColumnas(def, cambios);
  if (!columnas.length) return obtener(def, id, cx);
  valores.push(id);
  const sql = 'UPDATE ' + def.tabla + ' SET ' +
    columnas.map((c, i) => c + ' = $' + (i + 1)).join(', ') +
    ' WHERE id = $' + valores.length + ' RETURNING id';
  const fila = await db.uno(sql, valores, cx);
  return fila ? obtener(def, id, cx) : null;
}

async function borrar(def, id, cx) {
  const r = await db.consulta('DELETE FROM ' + def.tabla + ' WHERE id = $1', [id], cx);
  return r.rowCount > 0;
}

module.exports = { aObjeto, aColumnas, obtener, listar, listarEn, insertar, insertarSimple, actualizar, borrar };
