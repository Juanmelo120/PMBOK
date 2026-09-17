/* ═══════════════════════════════════════════════════════════
   trabajo.js — Sprints, burndown y velocidad
   ═══════════════════════════════════════════════════════════ */

'use strict';

const db = require('../db');
const repo = require('../repositorio');
const D = require('../definiciones');
const { noEncontrado, conflicto } = require('../errores');

async function sprintActivo(proyectoId, cx) {
  const fila = await db.uno("SELECT id FROM sprints WHERE proyecto_id = $1 AND estado = 'activo'", [proyectoId], cx);
  return fila ? repo.obtener(D.sprints, fila.id, cx) : null;
}

/* Fotografía de hoy de los puntos pendientes del sprint activo.
   Es lo que permite dibujar un burndown real. */
async function registrarBurndown(sprintId, cx) {
  const s = await db.uno("SELECT id FROM sprints WHERE id = $1 AND estado = 'activo'", [sprintId], cx);
  if (!s) return null;
  const t = await db.uno(
    `SELECT COALESCE(sum(puntos), 0) AS comprometido,
            COALESCE(sum(puntos) FILTER (WHERE estado <> 'hecho'), 0) AS restante
     FROM tareas WHERE sprint_id = $1`, [sprintId], cx);
  await db.consulta(
    `INSERT INTO sprint_burndown (sprint_id, fecha, restante, comprometido)
     VALUES ($1, CURRENT_DATE, $2, $3)
     ON CONFLICT (sprint_id, fecha) DO UPDATE SET restante = EXCLUDED.restante, comprometido = EXCLUDED.comprometido`,
    [sprintId, t.restante, t.comprometido], cx);
  await db.consulta(
    'UPDATE sprints SET inicio = COALESCE(inicio, CURRENT_DATE), comprometido = $2 WHERE id = $1',
    [sprintId, t.comprometido], cx);
  return { restante: t.restante, comprometido: t.comprometido };
}

/* Tras cualquier cambio en tareas, fotografía el sprint activo del proyecto */
async function fotografiarProyecto(proyectoId, cx) {
  const fila = await db.uno("SELECT id FROM sprints WHERE proyecto_id = $1 AND estado = 'activo'", [proyectoId], cx);
  if (fila) await registrarBurndown(fila.id, cx);
}

/* Crear un sprint activo cierra antes el que estuviera en marcha */
async function crearSprint(proyectoId, datos) {
  return db.transaccion(async (cx) => {
    const estado = datos.estado || 'activo';
    let cerrado = null;
    if (estado === 'activo') {
      const previo = await db.uno("SELECT id FROM sprints WHERE proyecto_id = $1 AND estado = 'activo'", [proyectoId], cx);
      if (previo) cerrado = await cerrarSprintEn(previo.id, cx);
    }
    const sprint = await repo.insertar(D.sprints, { ...datos, proyectoId, estado }, cx);
    if (estado === 'activo') await registrarBurndown(sprint.id, cx);
    return { sprint: await repo.obtener(D.sprints, sprint.id, cx), cerrado };
  });
}

async function cerrarSprintEn(sprintId, cx) {
  const s = await db.uno('SELECT id, estado FROM sprints WHERE id = $1 FOR UPDATE', [sprintId], cx);
  if (!s) throw noEncontrado('No existe el sprint.');
  if (s.estado !== 'activo') throw conflicto('Solo se puede cerrar un sprint activo.');

  await registrarBurndown(sprintId, cx);
  const t = await db.uno(
    `SELECT COALESCE(sum(puntos) FILTER (WHERE estado = 'hecho'), 0) AS entregado,
            count(*) FILTER (WHERE estado <> 'hecho') AS devueltas
     FROM tareas WHERE sprint_id = $1`, [sprintId], cx);
  await db.consulta(
    "UPDATE sprints SET estado = 'cerrado', entregado = $2, cierre = now() WHERE id = $1",
    [sprintId, t.entregado], cx);
  /* Lo no terminado vuelve al backlog */
  await db.consulta(
    "UPDATE tareas SET sprint_id = NULL, estado = 'backlog' WHERE sprint_id = $1 AND estado <> 'hecho'",
    [sprintId], cx);
  return { sprintId, entregado: t.entregado, devueltas: t.devueltas };
}

function cerrarSprint(sprintId) {
  return db.transaccion((cx) => cerrarSprintEn(sprintId, cx));
}

function iso(d) {
  return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' +
    String(d.getUTCDate()).padStart(2, '0');
}

async function burndown(sprintId) {
  const s = await repo.obtener(D.sprints, sprintId);
  if (!s) throw noEncontrado('No existe el sprint.');
  const hoy = (await db.uno('SELECT CURRENT_DATE::text AS hoy')).hoy;
  const dias = Number(s.dias) || 14;
  const inicio = new Date((s.inicio || hoy) + 'T00:00:00Z');
  const historial = s.historial || {};
  const claves = Object.keys(historial).sort();
  const comprometido = claves.length ? Number(historial[claves[claves.length - 1]].comprometido) : 0;

  const puntos = [];
  const ideal = [];
  const real = [];
  for (let i = 0; i <= dias; i++) {
    const fecha = iso(new Date(inicio.getTime() + i * 86400000));
    puntos.push(fecha);
    ideal.push(Math.round(comprometido * (1 - i / dias) * 10) / 10);
    real.push(historial[fecha] ? Number(historial[fecha].restante) : null);
  }
  return { sprintId, puntos, ideal, real, comprometido };
}

async function velocidad(proyectoId) {
  const filas = await db.varios(
    "SELECT id, nombre, entregado FROM sprints WHERE proyecto_id = $1 AND estado = 'cerrado' ORDER BY COALESCE(cierre, creado)",
    [proyectoId]);
  const sprints = filas.map((f) => ({ sprintId: f.id, nombre: f.nombre, entregado: Number(f.entregado) || 0 }));
  const media = sprints.length
    ? Math.round((sprints.reduce((n, s) => n + s.entregado, 0) / sprints.length) * 10) / 10
    : null;
  return { sprints, media };
}

module.exports = {
  sprintActivo, registrarBurndown, fotografiarProyecto, crearSprint, cerrarSprint, burndown, velocidad
};
