/* ═══════════════════════════════════════════════════════════
   proyectos.js — /api/proyectos y todo lo que cuelga de ellos
   ═══════════════════════════════════════════════════════════ */

'use strict';

const express = require('express');
const multer = require('multer');
const config = require('../config');
const db = require('../db');
const repo = require('../repositorio');
const D = require('../definiciones');
const svc = require('../servicios/proyectos');
const trabajo = require('../servicios/trabajo');
const docs = require('../servicios/documentos');
const invitaciones = require('../servicios/invitaciones');
const { z, validar, limpiar, id: esquemaId } = require('../validacion');
const { exigirProyecto, requerirGestion } = require('../middleware/auth');
const { recursoDeProyecto, proyectoDeRegistro } = require('./recursos');
const { noEncontrado, peticionInvalida } = require('../errores');

const r = express.Router();
const P = '/:proyectoId';

/* ══════════════ Proyecto ══════════════ */

r.get('/', async (req, res) => {
  res.json(await svc.visibles(req.usuario));
});

r.post('/', requerirGestion, async (req, res) => {
  const datos = limpiar(validar(D.proyectos.esquemas.crear, req.body));
  const p = await svc.crear(req.usuario, datos);
  res.status(201).json({ ...p, nivel: 3, progreso: await svc.progreso(p.id) });
});

r.get(P, async (req, res) => {
  const pid = req.params.proyectoId;
  const nivel = await exigirProyecto(req.usuario, pid, 'ver');
  const p = await repo.obtener(D.proyectos, pid);
  res.json({ ...p, nivel, progreso: await svc.progreso(pid), siguiente: await svc.siguiente(pid) });
});

r.patch(P, async (req, res) => {
  const pid = req.params.proyectoId;
  const cambios = limpiar(validar(D.proyectos.esquemas.actualizar, req.body));
  const soloEdicion = Object.keys(cambios).every((k) => D.proyectos.camposDeEdicion.includes(k));
  const nivel = await exigirProyecto(req.usuario, pid, soloEdicion ? 'editar' : 'dirigir');
  const p = await svc.actualizar(pid, cambios);
  res.json({ ...p, nivel, progreso: await svc.progreso(pid) });
});

r.delete(P, async (req, res) => {
  await exigirProyecto(req.usuario, req.params.proyectoId, 'dirigir');
  await repo.borrar(D.proyectos, req.params.proyectoId);
  res.status(204).end();
});

/* ══════════════ Procesos del ciclo de vida ══════════════ */

r.get(P + '/progreso', async (req, res) => {
  await exigirProyecto(req.usuario, req.params.proyectoId, 'ver');
  res.json(await svc.progreso(req.params.proyectoId));
});

r.get(P + '/siguiente', async (req, res) => {
  await exigirProyecto(req.usuario, req.params.proyectoId, 'ver');
  res.json({ siguiente: await svc.siguiente(req.params.proyectoId) });
});

r.get(P + '/procesos', async (req, res) => {
  await exigirProyecto(req.usuario, req.params.proyectoId, 'ver');
  res.json(await svc.procesos(req.params.proyectoId));
});

r.get(P + '/procesos/:procesoId', async (req, res) => {
  const { proyectoId, procesoId } = req.params;
  await exigirProyecto(req.usuario, proyectoId, 'ver');
  svc.exigirProceso(procesoId);
  const todos = await svc.procesos(proyectoId);
  res.json({
    ...todos.find((x) => x.procesoId === procesoId),
    entradas: await docs.artefactosDeProceso(proyectoId, procesoId, 'entradas'),
    salidas: await docs.artefactosDeProceso(proyectoId, procesoId, 'salidas')
  });
});

const esquemaEstadoProceso = z.object({
  estado: z.enum(D.E.estadosProceso).optional(),
  notas: z.string().max(20000).optional()
}).refine((x) => x.estado !== undefined || x.notas !== undefined, 'Indica «estado» o «notas»');

r.put(P + '/procesos/:procesoId', async (req, res) => {
  const { proyectoId, procesoId } = req.params;
  await exigirProyecto(req.usuario, proyectoId, 'editar');
  const d = validar(esquemaEstadoProceso, req.body);
  res.json(await svc.fijarEstadoProceso(proyectoId, procesoId, d));
});

r.put(P + '/procesos/:procesoId/banda', async (req, res) => {
  const { proyectoId, procesoId } = req.params;
  await exigirProyecto(req.usuario, proyectoId, 'editar');
  const { banda } = validar(z.object({ banda: z.enum(D.E.bandas) }), req.body);
  res.json(await svc.moverProceso(proyectoId, procesoId, banda));
});

for (const tipo of ['entradas', 'salidas']) {
  r.get(P + '/procesos/:procesoId/' + tipo, async (req, res) => {
    await exigirProyecto(req.usuario, req.params.proyectoId, 'ver');
    res.json(await docs.artefactosDeProceso(req.params.proyectoId, req.params.procesoId, tipo));
  });
}

/* ══════════════ Indicadores ══════════════ */

const lecturas = {
  evm: (pid) => svc.evm(pid),
  salud: (pid) => svc.salud(pid),
  'matriz-riesgos': (pid) => svc.matrizRiesgos(pid),
  calendario: (pid) => svc.calendario([pid]),
  velocidad: (pid) => trabajo.velocidad(pid),
  'sprint-activo': async (pid) => ({ sprint: await trabajo.sprintActivo(pid) })
};
Object.entries(lecturas).forEach(([ruta, fn]) => {
  r.get(P + '/' + ruta, async (req, res) => {
    await exigirProyecto(req.usuario, req.params.proyectoId, 'ver');
    res.json(await fn(req.params.proyectoId));
  });
});

/* ══════════════ Documentos ══════════════ */

r.get(P + '/documentos', async (req, res) => {
  await exigirProyecto(req.usuario, req.params.proyectoId, 'ver');
  res.json(await docs.listar(req.params.proyectoId));
});

const esquemaGenerar = z.object({
  id: esquemaId.optional(),
  artefactoId: esquemaId,
  procesoId: esquemaId.nullable().optional()
});

r.post(P + '/documentos', async (req, res) => {
  const pid = req.params.proyectoId;
  await exigirProyecto(req.usuario, pid, 'editar');
  const d = validar(esquemaGenerar, req.body);
  const resultado = await docs.generar(pid, d.artefactoId, d.procesoId, req.usuario.id, d.id);
  res.status(resultado.yaExistia ? 200 : 201).json(resultado);
});

/* ══════════════ Archivos ══════════════ */

const subida = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.archivos.limiteBytes, files: 1, fields: 5 },
  defParamCharset: 'utf8'
});

r.get(P + '/archivos', async (req, res) => {
  await exigirProyecto(req.usuario, req.params.proyectoId, 'ver');
  res.json(await repo.listar(D.archivos, { proyecto_id: req.params.proyectoId }));
});

const TIPO_MIME = /^[a-z0-9][a-z0-9!#$&^_.+-]{0,126}\/[a-z0-9][a-z0-9!#$&^_.+-]{0,126}$/i;

r.post(P + '/archivos',
  async (req, _res, next) => {
    /* Permiso antes de aceptar el cuerpo: nadie sube 10 MB para recibir un 403 */
    await exigirProyecto(req.usuario, req.params.proyectoId, 'editar');
    next();
  },
  subida.single('archivo'),
  async (req, res) => {
    if (!req.file) throw peticionInvalida('Falta el archivo (campo «archivo» del formulario).');
    const nombre = String((req.body && req.body.nombre) || req.file.originalname || '').trim().slice(0, 255);
    if (!nombre) throw peticionInvalida('El archivo necesita un nombre.');
    const categoria = String((req.body && req.body.categoria) || 'general').trim().slice(0, 80) || 'general';
    const tipo = TIPO_MIME.test(req.file.mimetype || '') ? req.file.mimetype.toLowerCase() : 'application/octet-stream';
    /* Al migrar desde el navegador el archivo conserva su identificador */
    const id = req.body && req.body.id ? validar(esquemaId, req.body.id) : undefined;

    const archivo = await db.transaccion(async (cx) => {
      const a = await repo.insertar(D.archivos, {
        id, proyectoId: req.params.proyectoId, nombre, tipo, tamano: req.file.size,
        categoria, autorId: req.usuario.id, almacen: 'bd'
      }, cx);
      await db.consulta('INSERT INTO archivo_contenidos (archivo_id, datos) VALUES ($1, $2)', [a.id, req.file.buffer], cx);
      return a;
    });
    res.status(201).json(archivo);
  });

/* ══════════════ Invitaciones al equipo ══════════════ */
/* Los códigos son del líder: ni verlos ni crearlos con menos de «dirigir» */

r.get(P + '/invitaciones', async (req, res) => {
  await exigirProyecto(req.usuario, req.params.proyectoId, 'dirigir');
  res.json(await invitaciones.listar(req.params.proyectoId));
});

r.post(P + '/invitaciones', async (req, res) => {
  const pid = req.params.proyectoId;
  await exigirProyecto(req.usuario, pid, 'dirigir');
  const datos = validar(D.invitaciones.esquemas.crear, req.body);
  res.status(201).json(await invitaciones.crear(req.usuario, pid, datos));
});

/* ══════════════ Registros de dominio y trabajo ══════════════ */

const conSeveridad = (x) => ({ ...x, severidad: svc.severidad(x.p, x.i) });
const fotografiar = (pid, cx) => trabajo.fotografiarProyecto(pid, cx);

const recursos = {
  miembros: recursoDeProyecto(D.miembros),
  riesgos: recursoDeProyecto(D.riesgos, { salida: conSeveridad }),
  interesados: recursoDeProyecto(D.interesados),
  cambios: recursoDeProyecto(D.cambios),
  lecciones: recursoDeProyecto(D.lecciones),
  mediciones: recursoDeProyecto(D.mediciones),
  comentarios: recursoDeProyecto(D.comentarios, {
    antesDeCrear: async (req, _pid, datos) => { datos.autorId = req.usuario.id; },
    /* Cada cual edita lo suyo; editores y directores, cualquiera */
    puedeModificar: (req, reg) => reg.fila.autor_id === req.usuario.id || reg.nivel >= D.NIVELES.editar
  }),
  tareas: recursoDeProyecto(D.tareas, {
    antesDeCrear: async (_req, pid, datos, cx) => {
      if (datos.prioridad === undefined) {
        const n = await db.uno('SELECT count(*) AS n FROM tareas WHERE proyecto_id = $1', [pid], cx);
        datos.prioridad = n.n + 1;
      }
    },
    despues: fotografiar
  }),
  sprints: recursoDeProyecto(D.sprints, {
    crear: async (_req, pid, datos) => {
      const { sprint, cerrado } = await trabajo.crearSprint(pid, datos);
      return { ...sprint, sprintCerrado: cerrado };
    },
    despues: fotografiar
  })
};

Object.entries(recursos).forEach(([nombre, rec]) => {
  r.use(P + '/' + nombre, rec.lista);
  r.use(P + '/' + nombre, rec.item);
});

/* ══════════════ Rutas planas por id ══════════════ */

const planas = express.Router();
Object.entries(recursos).forEach(([nombre, rec]) => planas.use('/' + nombre, rec.item));

/* Documentos */
planas.get('/documentos/:id', async (req, res) => {
  await proyectoDeRegistro('documentos', req.params.id, req.usuario, 'ver');
  res.json(docs.enriquecer(await repo.obtener(D.documentos, req.params.id), true));
});

const esquemaDoc = z.object({
  estado: z.enum(D.E.estadosDocumento),
  nombre: z.string().trim().min(1).max(300),
  contenido: z.record(z.string().regex(/^\d{1,3}$/), z.any())
}).partial();

planas.patch('/documentos/:id', async (req, res) => {
  await proyectoDeRegistro('documentos', req.params.id, req.usuario, 'editar');
  const d = limpiar(validar(esquemaDoc, req.body));
  if (d.contenido) await repo.actualizar(D.documentos, req.params.id, { contenido: d.contenido });
  if (d.nombre) await repo.actualizar(D.documentos, req.params.id, { nombre: d.nombre });
  const doc = d.estado
    ? await docs.cambiarEstado(req.params.id, d.estado)
    : docs.enriquecer(await repo.obtener(D.documentos, req.params.id), false);
  res.json(doc);
});

planas.put('/documentos/:id/bloques/:indice', async (req, res) => {
  await proyectoDeRegistro('documentos', req.params.id, req.usuario, 'editar');
  const cuerpo = validar(z.object({ valor: z.any() }), req.body);
  res.json(await docs.guardarBloque(req.params.id, req.params.indice, cuerpo.valor));
});

planas.post('/documentos/:id/versiones', async (req, res) => {
  await proyectoDeRegistro('documentos', req.params.id, req.usuario, 'editar');
  res.json(await docs.nuevaVersion(req.params.id));
});

planas.delete('/documentos/:id', async (req, res) => {
  await proyectoDeRegistro('documentos', req.params.id, req.usuario, 'editar');
  await repo.borrar(D.documentos, req.params.id);
  res.status(204).end();
});

/* Archivos */
planas.get('/archivos/:id', async (req, res) => {
  await proyectoDeRegistro('archivos', req.params.id, req.usuario, 'ver');
  res.json(await repo.obtener(D.archivos, req.params.id));
});

const INLINE_SEGURO = /^(image\/(png|jpeg|gif|webp)|application\/pdf|text\/plain)$/;

planas.get('/archivos/:id/contenido', async (req, res) => {
  await proyectoDeRegistro('archivos', req.params.id, req.usuario, 'ver');
  const f = await db.uno(
    `SELECT a.nombre, a.tipo, c.datos FROM archivos a
     JOIN archivo_contenidos c ON c.archivo_id = a.id WHERE a.id = $1`, [req.params.id]);
  if (!f) throw noEncontrado('El archivo no tiene contenido guardado.');
  const enLinea = req.query.enLinea === '1' && INLINE_SEGURO.test(f.tipo);
  const ascii = f.nombre.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
  res.set({
    'Content-Type': f.tipo,
    'Content-Length': f.datos.length,
    'Content-Disposition': (enLinea ? 'inline' : 'attachment') +
      '; filename="' + ascii + '"; filename*=UTF-8\'\'' + encodeURIComponent(f.nombre),
    /* Un HTML subido no puede ejecutarse con el origen de la aplicación */
    'Content-Security-Policy': "sandbox; default-src 'none'",
    'Cache-Control': 'private, no-store'
  });
  res.end(f.datos);
});

planas.delete('/archivos/:id', async (req, res) => {
  await proyectoDeRegistro('archivos', req.params.id, req.usuario, 'editar');
  await repo.borrar(D.archivos, req.params.id);
  res.status(204).end();
});

/* Invitaciones: unirse con un código (cualquier sesión) y retirar un código */
const esquemaUnirse = z.object({ codigo: D.codigoInvitacion });

planas.post('/invitaciones/unirse', async (req, res) => {
  const { codigo } = validar(esquemaUnirse, req.body);
  const r = await invitaciones.unirse(req.usuario, codigo);
  res.status(r.yaEraMiembro ? 200 : 201).json(r);
});

planas.delete('/invitaciones/:id', async (req, res) => {
  await proyectoDeRegistro('invitaciones', req.params.id, req.usuario, 'dirigir');
  await repo.borrar(D.invitaciones, req.params.id);
  res.status(204).end();
});

/* Sprints: cierre y burndown */
planas.post('/sprints/:id/cerrar', async (req, res) => {
  await proyectoDeRegistro('sprints', req.params.id, req.usuario, 'editar');
  const resultado = await trabajo.cerrarSprint(req.params.id);
  res.json({ ...resultado, sprint: await repo.obtener(D.sprints, req.params.id) });
});

planas.post('/sprints/:id/burndown', async (req, res) => {
  await proyectoDeRegistro('sprints', req.params.id, req.usuario, 'editar');
  const foto = await trabajo.registrarBurndown(req.params.id);
  if (!foto) throw peticionInvalida('Solo se fotografía el burndown de un sprint activo.');
  res.json(await trabajo.burndown(req.params.id));
});

planas.get('/sprints/:id/burndown', async (req, res) => {
  await proyectoDeRegistro('sprints', req.params.id, req.usuario, 'ver');
  res.json(await trabajo.burndown(req.params.id));
});

module.exports = { proyectos: r, planas };
