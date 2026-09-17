/* ═══════════════════════════════════════════════════════════
   catalogo.js — Contenido de la guía para el servidor
   ───────────────────────────────────────────────────────────
   Lee los mismos archivos assets/js/datos/*.js que usa la interfaz
   dentro de un contexto aislado (vm), de modo que metodologías,
   flujo de los 40 procesos y plantillas de artefactos tienen una
   sola fuente de verdad. Al llegar el libro oficial basta con
   editar esos archivos: el backend los recoge al arrancar.
   ═══════════════════════════════════════════════════════════ */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const config = require('./config');

const ARCHIVOS = ['meta.js', 'principios.js', 'dominios.js', 'procesos.js', 'artefactos.js',
  'herramientas.js', 'flujo.js', 'eos.js'];

const BANDAS_ORDEN = { inicio: 1, planificacion: 2, ejecucion: 3, monitoreo: 4, cierre: 5 };

let cache = null;

function cargar() {
  if (cache) return cache;

  const contexto = {};
  contexto.window = contexto;
  vm.createContext(contexto);

  ARCHIVOS.forEach((nombre) => {
    const ruta = path.join(config.catalogoDir, nombre);
    const codigo = fs.readFileSync(ruta, 'utf8');
    vm.runInContext(codigo, contexto, { filename: ruta, timeout: 5000 });
  });

  const P = contexto.PMBOK;
  if (!P || !Array.isArray(P.flujo) || !Array.isArray(P.procesos) || !Array.isArray(P.artefactos)) {
    throw new Error('El catálogo de ' + config.catalogoDir + ' no tiene flujo, procesos y artefactos.');
  }

  /* Se copian a objetos del contexto principal para que JSON y
     comparaciones se comporten igual que con datos propios */
  const clonar = (x) => JSON.parse(JSON.stringify(x));

  const procesosPorId = {};
  clonar(P.procesos).forEach((p) => { procesosPorId[p.id] = p; });

  const flujo = clonar(P.flujo).map((f) => {
    const p = procesosPorId[f.id] || {};
    return {
      id: f.id, banda: f.banda, orden: f.orden,
      codigo: p.cod || '', nombre: p.nombre || f.id, dominio: p.dominio || '',
      entradas: f.entradas || [], salidas: f.salidas || [], consejo: f.consejo || ''
    };
  });
  const flujoPorId = {};
  flujo.forEach((f) => { flujoPorId[f.id] = f; });

  const artefactos = clonar(P.artefactos).map((a) => ({
    id: a.id, nombre: a.nombre, categoria: a.categoria,
    descripcion: a.descripcion || '', plantilla: a.plantilla || []
  }));
  const artefactosPorId = {};
  artefactos.forEach((a) => { artefactosPorId[a.id] = a; });

  const metodologias = clonar(P.metodologias || []);
  const metodologiasPorId = {};
  metodologias.forEach((m) => { metodologiasPorId[m.id] = m; });

  cache = {
    metodologias, metodologiasPorId,
    bandas: clonar(P.bandas || []),
    flujo, flujoPorId,
    artefactos, artefactosPorId,
    estadosRoca: clonar((P.eos && P.eos.estadosRoca) || []),
    bandasOrden: BANDAS_ORDEN
  };
  return cache;
}

function metodologia(id) {
  const c = cargar();
  return c.metodologiasPorId[id] || c.metodologias[0];
}

/* Vuelca procesos y artefactos a las tablas de catálogo (upsert) */
async function sincronizar(cx) {
  const c = cargar();
  await cx.query(
    `INSERT INTO catalogo_procesos (id, codigo, nombre, dominio, banda, orden)
     SELECT * FROM unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::int[])
     ON CONFLICT (id) DO UPDATE SET codigo = EXCLUDED.codigo, nombre = EXCLUDED.nombre,
       dominio = EXCLUDED.dominio, banda = EXCLUDED.banda, orden = EXCLUDED.orden`,
    [c.flujo.map((f) => f.id), c.flujo.map((f) => f.codigo), c.flujo.map((f) => f.nombre),
     c.flujo.map((f) => f.dominio), c.flujo.map((f) => f.banda), c.flujo.map((f) => f.orden)]
  );
  await cx.query(
    `INSERT INTO catalogo_artefactos (id, nombre, categoria, bloques)
     SELECT * FROM unnest($1::text[], $2::text[], $3::text[], $4::int[])
     ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre, categoria = EXCLUDED.categoria,
       bloques = EXCLUDED.bloques`,
    [c.artefactos.map((a) => a.id), c.artefactos.map((a) => a.nombre),
     c.artefactos.map((a) => a.categoria), c.artefactos.map((a) => a.plantilla.length)]
  );
  return { procesos: c.flujo.length, artefactos: c.artefactos.length };
}

module.exports = { cargar, metodologia, sincronizar };
