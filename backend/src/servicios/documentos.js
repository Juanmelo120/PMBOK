/* ═══════════════════════════════════════════════════════════
   documentos.js — Documentos generados por los procesos
   ═══════════════════════════════════════════════════════════ */

'use strict';

const db = require('../db');
const repo = require('../repositorio');
const catalogo = require('../catalogo');
const D = require('../definiciones');
const { z } = require('../validacion');
const { peticionInvalida, noEncontrado } = require('../errores');

function artefacto(id) {
  return catalogo.cargar().artefactosPorId[id] || null;
}

/* Porcentaje de bloques de la plantilla con contenido */
function completitud(doc) {
  const art = artefacto(doc.artefactoId);
  if (!art || !art.plantilla.length) return 0;
  const llenos = art.plantilla.filter((b, i) => {
    const v = (doc.contenido || {})[i];
    if (b.t === 'tabla') {
      return Array.isArray(v) && v.some((fila) => Array.isArray(fila) && fila.some((c) => String(c || '').trim()));
    }
    return v !== undefined && v !== null && String(v).trim() !== '';
  }).length;
  return Math.round((llenos / art.plantilla.length) * 100);
}

function enriquecer(doc, conPlantilla) {
  if (!doc) return null;
  const r = { ...doc, completitud: completitud(doc) };
  if (conPlantilla) {
    const art = artefacto(doc.artefactoId);
    r.plantilla = art ? art.plantilla : [];
    r.descripcion = art ? art.descripcion : '';
  }
  return r;
}

async function listar(proyectoId) {
  const docs = await repo.listar(D.documentos, { proyecto_id: proyectoId });
  return docs.map((d) => enriquecer(d, false));
}

/* Idempotente: si el documento ya existe se devuelve tal cual */
async function generar(proyectoId, artefactoId, procesoId, autorId, id) {
  const art = artefacto(artefactoId);
  if (!art) throw peticionInvalida('El artefacto «' + artefactoId + '» no existe en el catálogo.');
  if (procesoId && !catalogo.cargar().flujoPorId[procesoId]) {
    throw peticionInvalida('El proceso «' + procesoId + '» no existe en el catálogo.');
  }
  const fila = await db.uno(
    `INSERT INTO documentos (id, proyecto_id, artefacto_id, nombre, categoria, proceso_id, autor_id)
     VALUES (COALESCE($7, gen_random_uuid()::text), $1, $2, $3, $4, $5, $6)
     ON CONFLICT (proyecto_id, artefacto_id) DO NOTHING RETURNING id`,
    [proyectoId, artefactoId, art.nombre, art.categoria, procesoId || null, autorId || null, id || null]);
  if (fila) return { documento: enriquecer(await repo.obtener(D.documentos, fila.id), true), yaExistia: false };

  const existente = await db.uno('SELECT id FROM documentos WHERE proyecto_id = $1 AND artefacto_id = $2',
    [proyectoId, artefactoId]);
  return { documento: enriquecer(await repo.obtener(D.documentos, existente.id), true), yaExistia: true };
}

const celda = z.union([z.string().max(5000), z.number()]).transform(String);
const valorTabla = z.array(z.array(celda).max(30)).max(500);
const valorTexto = z.union([z.string().max(50000), z.array(z.string().max(5000)).max(500)]);

/* Guarda un bloque de la plantilla; vacío o null lo borra */
async function guardarBloque(documentoId, indice, valor) {
  const doc = await repo.obtener(D.documentos, documentoId);
  if (!doc) throw noEncontrado('No existe el documento.');
  const art = artefacto(doc.artefactoId);
  const n = Number(indice);
  if (!Number.isInteger(n) || n < 0 || !art || n >= art.plantilla.length) {
    throw peticionInvalida('El bloque ' + indice + ' no existe en la plantilla (0 a ' + ((art ? art.plantilla.length : 1) - 1) + ').');
  }
  const bloque = art.plantilla[n];

  if (valor === null || valor === undefined || valor === '') {
    await db.consulta('UPDATE documentos SET contenido = contenido - $2 WHERE id = $1', [documentoId, String(n)]);
  } else {
    const limpio = bloque.t === 'tabla' ? valorTabla.parse(valor) : valorTexto.parse(valor);
    await db.consulta(
      'UPDATE documentos SET contenido = jsonb_set(contenido, ARRAY[$2], $3::jsonb) WHERE id = $1',
      [documentoId, String(n), JSON.stringify(limpio)]);
  }
  return enriquecer(await repo.obtener(D.documentos, documentoId), false);
}

async function cambiarEstado(documentoId, estado) {
  const fila = await db.uno(
    `UPDATE documentos SET estado = $2,
       aprobado = CASE WHEN $2 = 'aprobado' THEN now() ELSE aprobado END
     WHERE id = $1 RETURNING id`, [documentoId, estado]);
  if (!fila) throw noEncontrado('No existe el documento.');
  return enriquecer(await repo.obtener(D.documentos, documentoId), false);
}

async function nuevaVersion(documentoId) {
  const fila = await db.uno(
    "UPDATE documentos SET version = version + 1, estado = 'borrador' WHERE id = $1 RETURNING id", [documentoId]);
  if (!fila) throw noEncontrado('No existe el documento.');
  return enriquecer(await repo.obtener(D.documentos, documentoId), false);
}

/* Entradas (¿existe ya el documento?) o salidas (¿se generó?) de un proceso */
async function artefactosDeProceso(proyectoId, procesoId, tipo) {
  const f = catalogo.cargar().flujoPorId[procesoId];
  if (!f) throw noEncontrado('No existe el proceso «' + procesoId + '».');
  const ids = tipo === 'entradas' ? f.entradas : f.salidas;
  const docs = await db.varios(
    'SELECT id, artefacto_id, estado, version FROM documentos WHERE proyecto_id = $1 AND artefacto_id = ANY($2::text[])',
    [proyectoId, ids]);
  const porArt = {};
  docs.forEach((d) => { porArt[d.artefacto_id] = d; });
  return ids.map((aid) => {
    const art = artefacto(aid);
    const d = porArt[aid];
    return {
      artefactoId: aid,
      nombre: art ? art.nombre : aid,
      categoria: art ? art.categoria : '',
      documento: d ? { id: d.id, estado: d.estado, version: d.version } : null,
      disponible: !!d
    };
  });
}

module.exports = {
  artefacto, completitud, enriquecer, listar, generar, guardarBloque, cambiarEstado, nuevaVersion, artefactosDeProceso
};
