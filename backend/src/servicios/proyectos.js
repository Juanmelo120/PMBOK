/* ═══════════════════════════════════════════════════════════
   proyectos.js — Reglas de negocio de los proyectos
   Creación con su metodología, los 40 procesos, avance,
   siguiente paso, valor ganado, riesgos y calendario.
   Replica la lógica de assets/js/gestor.js en el servidor.
   ═══════════════════════════════════════════════════════════ */

'use strict';

const crypto = require('crypto');
const db = require('../db');
const repo = require('../repositorio');
const catalogo = require('../catalogo');
const D = require('../definiciones');
const { peticionInvalida, noEncontrado } = require('../errores');

function nuevoId(prefijo) {
  return prefijo + '-' + crypto.randomUUID();
}

function fasesDe(metodologiaId) {
  return catalogo.metodologia(metodologiaId).fases
    .map((nombre, i) => ({ id: nuevoId('fase'), nombre, orden: i + 1 }));
}

/* Un programa pertenece a un portafolio: si llega el programa, el
   portafolio se deduce; si llegan los dos, tienen que cuadrar. */
async function coherenciaCartera(datos, actual, cx) {
  const programaId = datos.programaId !== undefined ? datos.programaId : actual && actual.programaId;
  if (!programaId) return;
  const prog = await db.uno('SELECT portafolio_id FROM programas WHERE id = $1', [programaId], cx);
  if (!prog) throw peticionInvalida('El programa indicado no existe.');
  /* Mover el proyecto a otro portafolio (como hace la fila del listado)
     lo saca del programa, que pertenece al portafolio anterior */
  if (actual && datos.programaId === undefined && datos.portafolioId !== undefined &&
      datos.portafolioId !== prog.portafolio_id) {
    datos.programaId = null;
    return;
  }
  const portafolioId = datos.portafolioId !== undefined ? datos.portafolioId : actual && actual.portafolioId;
  if (datos.programaId !== undefined && datos.portafolioId === undefined) {
    datos.portafolioId = prog.portafolio_id;
  } else if (portafolioId !== prog.portafolio_id) {
    throw peticionInvalida('El programa no pertenece al portafolio indicado.');
  }
}

async function crear(usuario, datos) {
  return db.transaccion(async (cx) => {
    const metodologia = datos.metodologia || 'predictivo';
    await coherenciaCartera(datos, null, cx);
    const proyecto = await repo.insertar(D.proyectos, {
      ...datos,
      metodologia,
      estado: 'activo',
      directorId: usuario.id,
      fases: fasesDe(metodologia),
      orden: {},
      hitos: []
    }, cx);

    await repo.insertar(D.miembros, { proyectoId: proyecto.id, usuarioId: usuario.id, rol: 'lider' }, cx);

    if (metodologia === 'agil' || metodologia === 'hibrido') {
      await repo.insertar(D.sprints, {
        proyectoId: proyecto.id,
        nombre: 'Sprint 0 — Preparación',
        objetivo: 'Preparar el entorno, el backlog inicial y los acuerdos de trabajo.',
        dias: 14, estado: 'activo', comprometido: 0
      }, cx);
    }
    return proyecto;
  });
}

async function actualizar(proyectoId, cambios) {
  return db.transaccion(async (cx) => {
    const actual = await repo.obtener(D.proyectos, proyectoId, cx);
    if (!actual) throw noEncontrado('No existe el proyecto.');
    const datos = { ...cambios };

    await coherenciaCartera(datos, actual, cx);

    /* Cambiar de metodología rehace fases y devuelve el flujo a su orden original */
    if (datos.metodologia && datos.metodologia !== actual.metodologia) {
      if (datos.fases === undefined) datos.fases = fasesDe(datos.metodologia);
      if (datos.orden === undefined) datos.orden = {};
    }
    if (datos.fases) {
      datos.fases = datos.fases.map((f, i) => ({ id: f.id || nuevoId('fase'), nombre: f.nombre, orden: f.orden || i + 1 }));
    }
    if (datos.hitos) {
      datos.hitos = datos.hitos.map((h) => ({
        id: h.id || nuevoId('hito'), nombre: h.nombre, fecha: h.fecha || null, critico: !!h.critico
      }));
    }
    if (datos.orden) {
      const flujo = catalogo.cargar().flujoPorId;
      const ajenos = Object.keys(datos.orden).filter((k) => !flujo[k]);
      if (ajenos.length) throw peticionInvalida('Procesos desconocidos en «orden»: ' + ajenos.join(', '));
    }
    return repo.actualizar(D.proyectos, proyectoId, datos, cx);
  });
}

/* ══════════════ Procesos ══════════════ */

function bandaEfectiva(proyecto, procesoId) {
  const f = catalogo.cargar().flujoPorId[procesoId];
  return (proyecto.orden && proyecto.orden[procesoId]) || (f ? f.banda : 'planificacion');
}

async function estadosDe(proyectoId, cx) {
  const filas = await db.varios('SELECT * FROM proyecto_procesos WHERE proyecto_id = $1', [proyectoId], cx);
  const mapa = {};
  filas.forEach((f) => { mapa[f.proceso_id] = f; });
  return mapa;
}

async function procesos(proyectoId, cx) {
  const p = await repo.obtener(D.proyectos, proyectoId, cx);
  const c = catalogo.cargar();
  const met = catalogo.metodologia(p.metodologia);
  const estados = await estadosDe(proyectoId, cx);
  return c.flujo.map((f) => {
    const e = estados[f.id];
    return {
      procesoId: f.id, codigo: f.codigo, nombre: f.nombre, dominio: f.dominio,
      banda: bandaEfectiva(p, f.id), bandaOriginal: f.banda, orden: f.orden,
      iterativo: (met.iterativos || []).includes(f.id),
      estado: e ? e.estado : 'pendiente',
      notas: e ? e.notas : '',
      fecha: e && e.fecha ? e.fecha.getTime() : null,
      entradas: f.entradas, salidas: f.salidas
    };
  });
}

function exigirProceso(procesoId) {
  const f = catalogo.cargar().flujoPorId[procesoId];
  if (!f) throw noEncontrado('No existe el proceso «' + procesoId + '».');
  return f;
}

async function fijarEstadoProceso(proyectoId, procesoId, { estado, notas }) {
  exigirProceso(procesoId);
  const fila = await db.uno(
    `INSERT INTO proyecto_procesos (proyecto_id, proceso_id, estado, notas, fecha)
     VALUES ($1, $2, COALESCE($3::text, 'pendiente'), COALESCE($4::text, ''),
             CASE WHEN $3::text IS NOT NULL THEN now() END)
     ON CONFLICT (proyecto_id, proceso_id) DO UPDATE SET
       estado = COALESCE($3::text, proyecto_procesos.estado),
       notas  = COALESCE($4::text, proyecto_procesos.notas),
       fecha  = CASE WHEN $3::text IS NOT NULL THEN now() ELSE proyecto_procesos.fecha END
     RETURNING *`,
    [proyectoId, procesoId, estado === undefined ? null : estado, notas === undefined ? null : notas]);
  return {
    proyectoId, procesoId, estado: fila.estado, notas: fila.notas,
    fecha: fila.fecha ? fila.fecha.getTime() : null,
    actualizado: (fila.actualizado || fila.creado).getTime()
  };
}

/* Mover un proceso a otra banda; volver a la original borra el ajuste */
async function moverProceso(proyectoId, procesoId, banda) {
  const f = exigirProceso(procesoId);
  const sql = banda === f.banda
    ? 'UPDATE proyectos SET orden = orden - $2 WHERE id = $1'
    : 'UPDATE proyectos SET orden = jsonb_set(orden, ARRAY[$2], to_jsonb($3::text)) WHERE id = $1';
  await db.consulta(sql, banda === f.banda ? [proyectoId, procesoId] : [proyectoId, procesoId, banda]);
  return { procesoId, banda, bandaOriginal: f.banda };
}

async function progreso(proyectoId, cx) {
  const fila = await db.uno('SELECT * FROM v_progreso_proyecto WHERE proyecto_id = $1', [proyectoId], cx);
  const total = catalogo.cargar().flujo.length;
  const completados = fila ? fila.completados : 0;
  const omitidos = fila ? fila.omitidos : 0;
  const aplicables = total - omitidos;
  return {
    completados, omitidos, total, aplicables,
    porcentaje: aplicables ? Math.round((completados / aplicables) * 100) : 0
  };
}

/* El primer proceso que falta en el orden del ciclo de vida;
   lo que ya está en curso va antes que lo no empezado. */
async function siguiente(proyectoId, cx) {
  const lista = await procesos(proyectoId, cx);
  const orden = catalogo.cargar().bandasOrden;
  const pendientes = lista
    .filter((x) => x.estado !== 'completado' && x.estado !== 'omitido')
    .sort((a, b) => ((a.estado === 'iniciado' ? 0 : 1) - (b.estado === 'iniciado' ? 0 : 1)) ||
      ((orden[a.banda] || 9) - (orden[b.banda] || 9)) || (a.orden - b.orden));
  const s = pendientes[0];
  if (!s) return null;
  const arts = catalogo.cargar().artefactosPorId;
  return {
    ...s,
    documentos: s.salidas.map((id) => ({ artefactoId: id, nombre: arts[id] ? arts[id].nombre : id }))
  };
}

/* ══════════════ Valor ganado ══════════════ */

async function evm(proyectoId, cx) {
  const p = await repo.obtener(D.proyectos, proyectoId, cx);
  const ms = await repo.listar(D.mediciones, { proyecto_id: proyectoId }, cx);
  const bac = p && p.presupuesto !== null ? Number(p.presupuesto) : null;
  if (!ms.length) return { mediciones: [], ultima: null, bac };

  const r4 = (n) => (n === null ? null : Math.round(n * 10000) / 10000);
  const r2 = (n) => (n === null ? null : Math.round(n * 100) / 100);

  const calculadas = ms.map((m) => {
    const pv = Number(m.pv) || 0;
    const ev = Number(m.ev) || 0;
    const ac = Number(m.ac) || 0;
    const cpi = ac ? ev / ac : null;
    const spi = pv ? ev / pv : null;
    return {
      id: m.id, fecha: m.fecha, pv, ev, ac, nota: m.nota || '',
      cv: r2(ev - ac), sv: r2(ev - pv), cpi: r4(cpi), spi: r4(spi),
      eac: cpi && bac ? r2(bac / cpi) : null,
      etc: cpi && bac ? r2((bac - ev) / cpi) : null,
      vac: cpi && bac ? r2(bac - bac / cpi) : null,
      tcpi: bac && bac - ac ? r4((bac - ev) / (bac - ac)) : null
    };
  });
  return { mediciones: calculadas, ultima: calculadas[calculadas.length - 1], bac };
}

async function salud(proyectoId, cx) {
  const e = await evm(proyectoId, cx);
  if (!e.ultima) return { estado: 'sin-datos', etiqueta: 'Sin mediciones' };
  const { cpi, spi } = e.ultima;
  if (cpi === null || spi === null) return { estado: 'sin-datos', etiqueta: 'Datos incompletos' };
  if (cpi >= 0.95 && spi >= 0.95) return { estado: 'ok', etiqueta: 'Saludable', cpi, spi };
  if (cpi >= 0.9 && spi >= 0.9) return { estado: 'aviso', etiqueta: 'Bajo vigilancia', cpi, spi };
  return { estado: 'falla', etiqueta: 'Requiere acción', cpi, spi };
}

/* ══════════════ Riesgos ══════════════ */

function severidad(p, i) {
  const v = (Number(p) || 0) * (Number(i) || 0);
  if (v >= 15) return { nivel: 'critico', etiqueta: 'Crítico', color: 'falla', valor: v };
  if (v >= 8) return { nivel: 'alto', etiqueta: 'Alto', color: 'aviso', valor: v };
  return { nivel: 'bajo', etiqueta: 'Bajo', color: 'ok', valor: v };
}

async function matrizRiesgos(proyectoId) {
  const riesgos = await repo.listar(D.riesgos, { proyecto_id: proyectoId });
  const celdas = {};
  riesgos.forEach((r) => {
    const k = r.p + 'x' + r.i;
    if (!celdas[k]) celdas[k] = [];
    celdas[k].push({ ...r, severidad: severidad(r.p, r.i) });
  });
  return celdas;
}

/* ══════════════ Calendario ══════════════ */

async function calendario(proyectoIds) {
  if (!proyectoIds.length) return [];
  const ev = [];
  const agrega = (fecha, tipo, titulo, ref, extra) => {
    if (fecha) ev.push({ fecha: String(fecha).slice(0, 10), tipo, titulo, ref, extra: extra || '' });
  };

  const proyectos = await db.varios(
    'SELECT id, nombre, inicio, fin, hitos FROM proyectos WHERE id = ANY($1::text[])', [proyectoIds]);
  const nombres = {};
  proyectos.forEach((p) => {
    nombres[p.id] = p.nombre;
    agrega(p.inicio, 'proyecto', 'Inicio · ' + p.nombre, p.id);
    agrega(p.fin, 'proyecto', 'Fin previsto · ' + p.nombre, p.id);
    (p.hitos || []).forEach((h) => agrega(h.fecha, 'hito', h.nombre, p.id, h.critico ? 'critico' : ''));
  });

  const [tareas, sprints, mediciones] = await Promise.all([
    db.varios('SELECT proyecto_id, titulo, fecha_limite, estado FROM tareas WHERE proyecto_id = ANY($1::text[]) AND fecha_limite IS NOT NULL', [proyectoIds]),
    db.varios('SELECT proyecto_id, nombre, inicio, fin FROM sprints WHERE proyecto_id = ANY($1::text[])', [proyectoIds]),
    db.varios('SELECT proyecto_id, fecha FROM mediciones WHERE proyecto_id = ANY($1::text[])', [proyectoIds])
  ]);
  tareas.forEach((t) => agrega(t.fecha_limite, 'tarea', t.titulo, t.proyecto_id, t.estado));
  sprints.forEach((s) => {
    agrega(s.inicio, 'sprint', 'Inicio ' + s.nombre, s.proyecto_id);
    agrega(s.fin, 'sprint', 'Fin ' + s.nombre, s.proyecto_id);
  });
  mediciones.forEach((m) => agrega(m.fecha, 'evm', 'Corte de valor ganado · ' + nombres[m.proyecto_id], m.proyecto_id));

  return ev.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/* ══════════════ Visibilidad y panel ══════════════ */

async function visibles(usuario) {
  const filas = await db.varios(
    `SELECT t.*, nivel_en(t.id, $1) AS nivel,
            v.completados, v.omitidos, v.total
     FROM proyectos t JOIN v_progreso_proyecto v ON v.proyecto_id = t.id
     WHERE nivel_en(t.id, $1) > 0
     ORDER BY t.creado`, [usuario.id]);
  return filas.map((f) => {
    const aplicables = f.total - f.omitidos;
    return {
      ...repo.aObjeto(D.proyectos, f),
      nivel: f.nivel,
      progreso: {
        completados: f.completados, omitidos: f.omitidos, total: f.total, aplicables,
        porcentaje: aplicables ? Math.round((f.completados / aplicables) * 100) : 0
      }
    };
  });
}

async function panel(usuario) {
  const proyectos = await visibles(usuario);
  const ids = proyectos.map((p) => p.id);
  const docs = ids.length
    ? await db.uno('SELECT count(*) AS n FROM documentos WHERE proyecto_id = ANY($1::text[])', [ids])
    : { n: 0 };
  const portafolios = await db.uno('SELECT count(*) AS n FROM portafolios');
  const activos = proyectos.filter((p) => p.estado === 'activo');

  const siguientes = [];
  for (const p of activos) {
    siguientes.push({ proyectoId: p.id, nombre: p.nombre, porcentaje: p.progreso.porcentaje, siguiente: await siguiente(p.id) });
  }

  return {
    cifras: {
      proyectos: proyectos.length,
      activos: activos.length,
      procesosCompletados: proyectos.reduce((n, p) => n + p.progreso.completados, 0),
      documentos: docs.n,
      portafolios: portafolios.n
    },
    siguientes
  };
}

module.exports = {
  crear, actualizar, procesos, fijarEstadoProceso, moverProceso, exigirProceso,
  progreso, siguiente, evm, salud, severidad, matrizRiesgos, calendario, visibles, panel, nuevoId
};
