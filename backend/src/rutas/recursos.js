/* ═══════════════════════════════════════════════════════════
   recursos.js — Fábricas de rutas CRUD
   ───────────────────────────────────────────────────────────
   recursoDeProyecto(def): registros que cuelgan de un proyecto.
     lista → /api/proyectos/:proyectoId/<recurso>   GET, POST
     item  → /api/<recurso>/:id  (y anidado)        GET, PATCH, DELETE
   recursoGlobal(def): registros de la organización (EOS, cartera).
     Leer: cualquier sesión. Escribir: administrador o director.
   ═══════════════════════════════════════════════════════════ */

'use strict';

const express = require('express');
const db = require('../db');
const repo = require('../repositorio');
const D = require('../definiciones');
const { validar, limpiar } = require('../validacion');
const { exigirProyecto, requerirGestion } = require('../middleware/auth');
const { noEncontrado, prohibido } = require('../errores');

const NOMBRE_NIVEL = { 1: 'ver', 2: 'editar', 3: 'dirigir' };

/* Carga el proyecto dueño de un registro y comprueba el nivel pedido */
async function proyectoDeRegistro(tabla, id, usuario, nivel, proyectoEsperado) {
  const fila = await db.uno('SELECT * FROM ' + tabla + ' WHERE id = $1', [id]);
  if (!fila || (proyectoEsperado && fila.proyecto_id !== proyectoEsperado)) {
    throw noEncontrado('No se encontró el registro.');
  }
  const tiene = await exigirProyecto(usuario, fila.proyecto_id, 'ver');
  if (nivel && tiene < D.NIVELES[nivel]) {
    throw prohibido('Necesitas permiso de «' + nivel + '» en este proyecto; tienes «' + NOMBRE_NIVEL[tiene] + '».');
  }
  return { fila, nivel: tiene, proyectoId: fila.proyecto_id };
}

function recursoDeProyecto(def, ganchos = {}) {
  const nivelEscritura = def.nivelEscritura || 'editar';
  const salida = (o) => (ganchos.salida ? ganchos.salida(o) : o);
  const lista = express.Router({ mergeParams: true });
  const item = express.Router({ mergeParams: true });

  lista.get('/', async (req, res) => {
    await exigirProyecto(req.usuario, req.params.proyectoId, 'ver');
    const filas = await repo.listar(def, { proyecto_id: req.params.proyectoId });
    res.json(filas.map(salida));
  });

  lista.post('/', async (req, res) => {
    const pid = req.params.proyectoId;
    await exigirProyecto(req.usuario, pid, nivelEscritura);
    const datos = limpiar(validar(def.esquemas.crear, req.body));
    const creado = ganchos.crear
      ? await ganchos.crear(req, pid, datos)
      : await db.transaccion(async (cx) => {
        if (ganchos.antesDeCrear) await ganchos.antesDeCrear(req, pid, datos, cx);
        const o = await repo.insertar(def, { ...datos, proyectoId: pid }, cx);
        if (ganchos.despues) await ganchos.despues(pid, cx);
        return repo.obtener(def, o.id, cx);
      });
    res.status(201).json(salida(creado));
  });

  /* Quién puede modificar un registro existente */
  async function paraEscribir(req) {
    const r = await proyectoDeRegistro(def.tabla, req.params.id, req.usuario, null, req.params.proyectoId);
    const permitido = ganchos.puedeModificar
      ? ganchos.puedeModificar(req, r)
      : r.nivel >= D.NIVELES[nivelEscritura];
    if (!permitido) {
      throw prohibido('Necesitas permiso de «' + nivelEscritura + '» en este proyecto; tienes «' + NOMBRE_NIVEL[r.nivel] + '».');
    }
    return r;
  }

  item.get('/:id', async (req, res) => {
    await proyectoDeRegistro(def.tabla, req.params.id, req.usuario, 'ver', req.params.proyectoId);
    res.json(salida(await repo.obtener(def, req.params.id)));
  });

  item.patch('/:id', async (req, res) => {
    const r = await paraEscribir(req);
    const cambios = limpiar(validar(def.esquemas.actualizar, req.body));
    const actualizado = await db.transaccion(async (cx) => {
      if (ganchos.antesDeActualizar) await ganchos.antesDeActualizar(req, r, cambios, cx);
      await repo.actualizar(def, req.params.id, cambios, cx);
      if (ganchos.despues) await ganchos.despues(r.proyectoId, cx);
      return repo.obtener(def, req.params.id, cx);
    });
    res.json(salida(actualizado));
  });

  item.delete('/:id', async (req, res) => {
    const r = await paraEscribir(req);
    await db.transaccion(async (cx) => {
      await repo.borrar(def, req.params.id, cx);
      if (ganchos.despues) await ganchos.despues(r.proyectoId, cx);
    });
    res.status(204).end();
  });

  return { lista, item };
}

/* filtros: { parametroQuery: columna } para GET /?parametro=valor */
function recursoGlobal(def, ganchos = {}) {
  const r = express.Router({ mergeParams: true });
  const salida = (o) => (ganchos.salida ? ganchos.salida(o) : o);

  r.get('/', async (req, res) => {
    const filtro = {};
    Object.entries(ganchos.filtros || {}).forEach(([param, col]) => {
      if (typeof req.query[param] === 'string') filtro[col] = req.query[param];
    });
    const filas = await repo.listar(def, filtro);
    res.json(filas.map(salida));
  });

  r.post('/', requerirGestion, async (req, res) => {
    const datos = limpiar(validar(def.esquemas.crear, req.body));
    const creado = await db.transaccion(async (cx) => {
      if (ganchos.antesDeGuardar) await ganchos.antesDeGuardar(req, datos, null, cx);
      const o = await repo.insertar(def, datos, cx);
      if (ganchos.despuesDeGuardar) await ganchos.despuesDeGuardar(req, o.id, datos, cx);
      return repo.obtener(def, o.id, cx);
    });
    res.status(201).json(salida(creado));
  });

  r.get('/:id', async (req, res) => {
    const o = await repo.obtener(def, req.params.id);
    if (!o) throw noEncontrado();
    res.json(salida(o));
  });

  r.patch('/:id', requerirGestion, async (req, res) => {
    const cambios = limpiar(validar(def.esquemas.actualizar, req.body));
    const o = await db.transaccion(async (cx) => {
      const existe = await db.uno('SELECT id FROM ' + def.tabla + ' WHERE id = $1 FOR UPDATE', [req.params.id], cx);
      if (!existe) throw noEncontrado();
      if (ganchos.antesDeGuardar) await ganchos.antesDeGuardar(req, cambios, req.params.id, cx);
      await repo.actualizar(def, req.params.id, cambios, cx);
      if (ganchos.despuesDeGuardar) await ganchos.despuesDeGuardar(req, req.params.id, cambios, cx);
      return repo.obtener(def, req.params.id, cx);
    });
    res.json(salida(o));
  });

  r.delete('/:id', requerirGestion, async (req, res) => {
    if (!(await repo.borrar(def, req.params.id))) throw noEncontrado();
    res.status(204).end();
  });

  return r;
}

module.exports = { recursoDeProyecto, recursoGlobal, proyectoDeRegistro };
