/* ═══════════════════════════════════════════════════════════
   organizacion.js — Cartera (portafolios y programas), EOS,
   panel, agenda global, catálogo y datos
   ═══════════════════════════════════════════════════════════ */

'use strict';

const express = require('express');
const db = require('../db');
const repo = require('../repositorio');
const D = require('../definiciones');
const catalogo = require('../catalogo');
const svc = require('../servicios/proyectos');
const datos = require('../servicios/datos');
const estado = require('../servicios/estado');
const { z, validar, limpiar } = require('../validacion');
const { requerirGestion, requerirRol } = require('../middleware/auth');
const { recursoGlobal } = require('./recursos');
const { noEncontrado, peticionInvalida } = require('../errores');

/* ══════════════ Cartera ══════════════ */

const portafolios = recursoGlobal(D.portafolios);

portafolios.get('/:id/programas', async (req, res) => {
  res.json(await repo.listar(D.programas, { portafolio_id: req.params.id }));
});

portafolios.post('/:id/programas', requerirGestion, async (req, res) => {
  const d = limpiar(validar(D.programas.esquemas.crear, req.body));
  const pf = await db.uno('SELECT id FROM portafolios WHERE id = $1', [req.params.id]);
  if (!pf) throw noEncontrado('No existe el portafolio.');
  res.status(201).json(await repo.insertar(D.programas, { ...d, portafolioId: req.params.id }));
});

const programas = recursoGlobal(D.programas, { filtros: { portafolioId: 'portafolio_id' } });

/* ══════════════ EOS ══════════════ */

const rocas = recursoGlobal(D.rocas, { filtros: { trimestre: 'trimestre' } });

async function guardarValores(metricaId, valores, cx) {
  if (valores === undefined) return;
  await db.consulta('DELETE FROM metrica_valores WHERE metrica_id = $1', [metricaId], cx);
  for (const [semana, valor] of Object.entries(valores)) {
    const v = String(valor).trim();
    if (v) {
      await db.consulta('INSERT INTO metrica_valores (metrica_id, semana, valor) VALUES ($1, $2, $3)',
        [metricaId, semana, v], cx);
    }
  }
}

const metricas = recursoGlobal(D.metricas, {
  despuesDeGuardar: (_req, id, d, cx) => guardarValores(id, d.valores, cx)
});

/* Una celda del scorecard; vacía la borra */
metricas.put('/:id/valores/:semana', requerirGestion, async (req, res) => {
  const { valor } = validar(z.object({ valor: z.union([z.string().max(50), z.number(), z.null()]) }), req.body);
  const semana = req.params.semana;
  if (semana.length > 20) throw peticionInvalida('La semana no es válida.');
  const m = await db.uno('SELECT id FROM metricas WHERE id = $1', [req.params.id]);
  if (!m) throw noEncontrado('No existe la métrica.');
  const texto = valor === null ? '' : String(valor).trim();
  if (texto) {
    await db.consulta(
      `INSERT INTO metrica_valores (metrica_id, semana, valor) VALUES ($1, $2, $3)
       ON CONFLICT (metrica_id, semana) DO UPDATE SET valor = EXCLUDED.valor`, [m.id, semana, texto]);
  } else {
    await db.consulta('DELETE FROM metrica_valores WHERE metrica_id = $1 AND semana = $2', [m.id, semana]);
  }
  res.json(await repo.obtener(D.metricas, m.id));
});

/* Organigrama: un asiento no puede colgar de sí mismo ni de un descendiente */
const asientos = recursoGlobal(D.asientos, {
  antesDeGuardar: async (_req, d, id, cx) => {
    if (!id || !d.padreId) return;
    const ciclo = await db.uno(
      `WITH RECURSIVE rama AS (
         SELECT id FROM asientos WHERE id = $1
         UNION SELECT a.id FROM asientos a JOIN rama ON a.padre_id = rama.id)
       SELECT 1 FROM rama WHERE id = $2`, [id, d.padreId], cx);
    if (ciclo) throw peticionInvalida('Un asiento no puede depender de sí mismo ni de uno de sus subordinados.');
  }
});

const vto = express.Router();

vto.get('/', async (_req, res) => {
  const filas = await db.varios('SELECT bloque_id, texto FROM vto ORDER BY bloque_id');
  const r = {};
  filas.forEach((f) => { r[f.bloque_id] = f.texto; });
  res.json(r);
});

vto.put('/:bloqueId', requerirGestion, async (req, res) => {
  const { texto } = validar(z.object({ texto: z.string().max(20000) }), req.body);
  const bloque = req.params.bloqueId;
  if (!/^[A-Za-z0-9_.-]{1,100}$/.test(bloque)) throw peticionInvalida('El bloque no es válido.');
  if (texto.trim()) {
    await db.consulta(
      `INSERT INTO vto (bloque_id, texto) VALUES ($1, $2)
       ON CONFLICT (bloque_id) DO UPDATE SET texto = EXCLUDED.texto, actualizado = now()`, [bloque, texto]);
  } else {
    await db.consulta('DELETE FROM vto WHERE bloque_id = $1', [bloque]);
  }
  res.json({ bloqueId: bloque, texto: texto.trim() ? texto : '' });
});

/* ══════════════ Panel y agenda ══════════════ */

const general = express.Router();

/* Todo lo visible para quien pregunta, con la forma de la base del navegador */
general.get('/estado', async (req, res) => {
  res.json(await estado.estado(req.usuario));
});

general.get('/panel', async (req, res) => {
  res.json(await svc.panel(req.usuario));
});

general.get('/calendario', async (req, res) => {
  const visibles = await svc.visibles(req.usuario);
  res.json(await svc.calendario(visibles.map((p) => p.id)));
});

/* ══════════════ Catálogo (público) ══════════════ */

const rutasCatalogo = express.Router();

rutasCatalogo.get('/metodologias', (_req, res) => res.json(catalogo.cargar().metodologias));
rutasCatalogo.get('/bandas', (_req, res) => res.json(catalogo.cargar().bandas));
rutasCatalogo.get('/procesos', (_req, res) => res.json(catalogo.cargar().flujo));
rutasCatalogo.get('/artefactos', (_req, res) => {
  res.json(catalogo.cargar().artefactos.map((a) => ({
    id: a.id, nombre: a.nombre, categoria: a.categoria, descripcion: a.descripcion, bloques: a.plantilla.length
  })));
});
rutasCatalogo.get('/artefactos/:id', (req, res) => {
  const a = catalogo.cargar().artefactosPorId[req.params.id];
  if (!a) throw noEncontrado('No existe el artefacto.');
  res.json(a);
});

/* ══════════════ Datos (administración) ══════════════ */

const rutasDatos = express.Router();
rutasDatos.use(requerirRol('admin'));

rutasDatos.get('/exportar', async (_req, res) => {
  const contenido = await datos.exportar();
  res.set('Content-Disposition', 'attachment; filename="pmbok8-gestor.json"');
  res.json(contenido);
});

rutasDatos.post('/importar', async (req, res) => {
  res.json(await datos.importar(req.body, req.usuario, req.sesionId));
});

rutasDatos.post('/reiniciar', async (req, res) => {
  const { confirmacion } = validar(z.object({ confirmacion: z.string() }), req.body);
  if (confirmacion.trim().toUpperCase() !== 'ELIMINAR') {
    throw peticionInvalida('Para borrar todos los datos envía { "confirmacion": "ELIMINAR" }.');
  }
  res.json(await datos.reiniciar(req.sesionId));
});

module.exports = {
  portafolios, programas, rocas, metricas, asientos, vto, general,
  catalogo: rutasCatalogo, datos: rutasDatos
};
