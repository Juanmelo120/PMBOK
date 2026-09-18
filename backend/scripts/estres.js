/* ═══════════════════════════════════════════════════════════
   estres.js — Prueba de carga con usuarios simultáneos
   ───────────────────────────────────────────────────────────
   Uso:
     node scripts/estres.js [URL] [--usuarios=50] [--iteraciones=20] [--equipos=5]
     npm run estres                (levanta su propio servidor y su base)

   Simula un aula entera trabajando a la vez:
     1. todos se registran al mismo tiempo,
     2. unos cuantos crean su proyecto y reparten códigos de invitación,
     3. el resto se une y todos trabajan en paralelo sobre el mismo
        proyecto: leen el estado, mueven procesos, escriben documentos,
        crean tareas, riesgos, comentarios y mediciones,
     4. una tormenta final concentra a todo un equipo escribiendo en el
        mismo sprint, que es donde aparecen los choques entre transacciones.

   No inventa nada: usa las mismas rutas que la interfaz. Al terminar
   informa del reparto de códigos de estado, de los tiempos por ruta y
   de cada error con su cuerpo, para poder corregirlo.
   ═══════════════════════════════════════════════════════════ */

'use strict';

const argumentos = process.argv.slice(2);
const opcion = (nombre, porDefecto) => {
  const a = argumentos.find((x) => x.startsWith('--' + nombre + '='));
  return a ? Number(a.split('=')[1]) : porDefecto;
};
const BASE = (argumentos.find((a) => !a.startsWith('--')) || 'http://127.0.0.1:3200').replace(/\/+$/, '');
const USUARIOS = opcion('usuarios', 50);
const ITERACIONES = opcion('iteraciones', 20);
const EQUIPOS = opcion('equipos', 5);
const MARCA = Date.now().toString(36);
const CLAVE = 'estres-2026';

/* ══════════════ Medición ══════════════ */

const muestras = new Map();   // ruta → { n, estados, ms[] }
const fallos = [];            // hasta 40 ejemplos con su cuerpo
let enVuelo = 0;
let picoEnVuelo = 0;

function anotar(etiqueta, estado, ms, cuerpo) {
  let m = muestras.get(etiqueta);
  if (!m) { m = { n: 0, estados: new Map(), ms: [] }; muestras.set(etiqueta, m); }
  m.n++;
  m.ms.push(ms);
  m.estados.set(estado, (m.estados.get(estado) || 0) + 1);
  if ((typeof estado !== 'number' || estado >= 400) && fallos.length < 40) {
    fallos.push({ etiqueta: etiqueta, estado: estado, ms: Math.round(ms), cuerpo: cuerpo });
  }
}

async function pedir(metodo, ruta, cuerpo, token, etiqueta) {
  const headers = {};
  if (cuerpo !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = 'Bearer ' + token;
  const t0 = performance.now();
  enVuelo++;
  if (enVuelo > picoEnVuelo) picoEnVuelo = enVuelo;
  try {
    const r = await fetch(BASE + '/api' + ruta, {
      method: metodo,
      headers: headers,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo)
    });
    const datos = r.status === 204 ? null : await r.json().catch(() => null);
    anotar(etiqueta || (metodo + ' ' + ruta), r.status, performance.now() - t0, datos);
    return { estado: r.status, datos: datos };
  } catch (err) {
    const causa = err.cause ? (err.cause.code || err.cause.message) : err.message;
    anotar(etiqueta || (metodo + ' ' + ruta), 'RED:' + causa, performance.now() - t0, String(err.message));
    return { estado: 0, datos: null, error: err };
  } finally {
    enVuelo--;
  }
}

/* ══════════════ Utilidades ══════════════ */

const azar = (n) => Math.floor(Math.random() * n);
const elegir = (lista) => lista[azar(lista.length)];
const HOY = new Date().toISOString().slice(0, 10);

function percentil(ordenados, p) {
  if (!ordenados.length) return 0;
  const i = Math.min(ordenados.length - 1, Math.floor((p / 100) * ordenados.length));
  return ordenados[i];
}

async function esperarServidor() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(BASE + '/api/salud');
      if (r.ok) return r.json();
    } catch (e) { /* todavía no escucha */ }
    await new Promise((s) => setTimeout(s, 500));
  }
  throw new Error('El servidor de ' + BASE + ' no respondió a /api/salud en 30 s.');
}

/* ══════════════ Guion de cada persona ══════════════ */

const PROCESOS = ['p-gob-01', 'p-int-01', 'p-gob-02', 'p-gob-03', 'p-alc-01', 'p-alc-02',
  'p-alc-03', 'p-cro-01', 'p-cro-02', 'p-fin-01'];
const ARTEFACTOS = ['art-acta-proyecto', 'art-caso-negocio', 'art-plan-direccion',
  'art-plan-calidad', 'art-registro-cambios'];

/* Lecturas: lo que la interfaz pide al abrir cada pestaña */
function lecturas(u) {
  const p = u.proyectoId;
  return [
    () => pedir('GET', '/estado', undefined, u.token, 'GET /estado'),
    () => pedir('GET', '/proyectos', undefined, u.token, 'GET /proyectos'),
    () => pedir('GET', '/proyectos/' + p, undefined, u.token, 'GET /proyectos/:id'),
    () => pedir('GET', '/proyectos/' + p + '/procesos', undefined, u.token, 'GET /proyectos/:id/procesos'),
    () => pedir('GET', '/proyectos/' + p + '/tareas', undefined, u.token, 'GET /proyectos/:id/tareas'),
    () => pedir('GET', '/proyectos/' + p + '/riesgos', undefined, u.token, 'GET /proyectos/:id/riesgos'),
    () => pedir('GET', '/proyectos/' + p + '/documentos', undefined, u.token, 'GET /proyectos/:id/documentos'),
    () => pedir('GET', '/proyectos/' + p + '/evm', undefined, u.token, 'GET /proyectos/:id/evm'),
    () => pedir('GET', '/proyectos/' + p + '/calendario', undefined, u.token, 'GET /proyectos/:id/calendario'),
    () => pedir('GET', '/proyectos/' + p + '/sprint-activo', undefined, u.token, 'GET /proyectos/:id/sprint-activo'),
    () => pedir('GET', '/panel', undefined, u.token, 'GET /panel')
  ];
}

/* Escrituras: lo que la gente hace de verdad en una sesión de trabajo */
function escrituras(u) {
  const p = u.proyectoId;
  return [
    async () => {
      const r = await pedir('POST', '/proyectos/' + p + '/tareas',
        { titulo: 'Tarea ' + u.n + '-' + azar(9999), puntos: 1 + azar(8), estado: 'pendiente', sprintId: u.sprintId },
        u.token, 'POST /proyectos/:id/tareas');
      if (r.estado === 201 && r.datos && r.datos.id) u.tareas.push(r.datos.id);
    },
    async () => {
      if (!u.tareas.length) return;
      await pedir('PATCH', '/tareas/' + elegir(u.tareas),
        { estado: elegir(['pendiente', 'curso', 'revision', 'hecho']) }, u.token, 'PATCH /tareas/:id');
    },
    () => pedir('POST', '/proyectos/' + p + '/riesgos',
      { titulo: 'Riesgo ' + u.n + '-' + azar(9999), p: 1 + azar(5), i: 1 + azar(5), estrategia: 'mitigar' },
      u.token, 'POST /proyectos/:id/riesgos'),
    () => pedir('POST', '/proyectos/' + p + '/comentarios',
      { texto: 'Comentario de ' + u.correo + ' #' + azar(9999) }, u.token, 'POST /proyectos/:id/comentarios'),
    () => pedir('POST', '/proyectos/' + p + '/mediciones',
      { fecha: HOY, pv: 1000 + azar(500), ev: 900 + azar(500), ac: 950 + azar(500), nota: 'corte' },
      u.token, 'POST /proyectos/:id/mediciones'),
    () => pedir('PUT', '/proyectos/' + p + '/procesos/' + elegir(PROCESOS),
      { estado: elegir(['iniciado', 'completado']), notas: 'Avance de ' + u.correo },
      u.token, 'PUT /proyectos/:id/procesos/:pid'),
    async () => {
      const r = await pedir('POST', '/proyectos/' + p + '/documentos', { artefactoId: elegir(ARTEFACTOS) },
        u.token, 'POST /proyectos/:id/documentos');
      const doc = r.datos && r.datos.documento;
      if (!doc || !doc.id) return;
      /* Cada bloque de la plantilla tiene su forma: una tabla no admite texto */
      const plantilla = doc.plantilla || [];
      const i = plantilla.findIndex((b) => b.t !== 'tabla');
      if (i < 0) return;
      await pedir('PUT', '/documentos/' + doc.id + '/bloques/' + i, { valor: 'Redactado por ' + u.correo },
        u.token, 'PUT /documentos/:id/bloques/:i');
    },
    () => pedir('PATCH', '/proyectos/' + p, { hitos: [{ nombre: 'Hito ' + azar(999), fecha: HOY }] },
      u.token, 'PATCH /proyectos/:id')
  ];
}

async function sesion(u) {
  const leer = lecturas(u);
  const escribir = escrituras(u);
  for (let i = 0; i < ITERACIONES; i++) {
    /* Dos lecturas por escritura: el reparto habitual de una aplicación de gestión */
    await elegir(leer)();
    await elegir(leer)();
    await elegir(escribir)();
  }
}

/* ══════════════ Fases ══════════════ */

/* Sonda: pregunta por /salud cada 50 ms mientras dura una fase. Es la
   consulta más barata de todas, así que lo que tarde de más mide lo que
   el servidor tiene atascado: el hilo de Node o el pozo de conexiones. */
function sonda(etiqueta) {
  let seguir = true;
  const bucle = (async () => {
    while (seguir) {
      await pedir('GET', '/salud', undefined, undefined, etiqueta);
      await new Promise((s) => setTimeout(s, 50));
    }
  })();
  return async () => { seguir = false; await bucle; };
}

async function registrar(n) {
  const correo = 'estres' + MARCA + '-' + n + '@prueba.local';
  const r = await pedir('POST', '/auth/registrar', { nombre: 'Persona ' + n, correo: correo, clave: CLAVE },
    undefined, 'POST /auth/registrar');
  if (r.estado !== 201) return null;
  return { n: n, correo: correo, token: r.datos.token, id: r.datos.usuario.id, tareas: [], equipo: null };
}

async function montarEquipos(usuarios) {
  const equipos = [];
  const lideres = usuarios.slice(0, EQUIPOS);
  await Promise.all(lideres.map(async (lider, i) => {
    const r = await pedir('POST', '/proyectos',
      { nombre: 'Proyecto de carga ' + (i + 1) + ' · ' + MARCA, metodologia: 'agil', presupuesto: 100000, moneda: 'EUR' },
      lider.token, 'POST /proyectos');
    if (r.estado !== 201) throw new Error('No se pudo crear el proyecto ' + (i + 1) + ': ' + JSON.stringify(r.datos));
    const inv = await pedir('POST', '/proyectos/' + r.datos.id + '/invitaciones', { rol: 'equipo' },
      lider.token, 'POST /proyectos/:id/invitaciones');
    const sp = await pedir('GET', '/proyectos/' + r.datos.id + '/sprint-activo', undefined, lider.token,
      'GET /proyectos/:id/sprint-activo');
    equipos[i] = {
      proyectoId: r.datos.id,
      codigo: inv.estado === 201 ? inv.datos.codigo : null,
      sprintId: sp.datos && sp.datos.sprint ? sp.datos.sprint.id : null
    };
    lider.proyectoId = equipos[i].proyectoId;
    lider.sprintId = equipos[i].sprintId;
    lider.equipo = i;
  }));

  /* El resto se une a la vez con el código de su equipo */
  await Promise.all(usuarios.slice(EQUIPOS).map(async (u, j) => {
    const e = equipos[j % EQUIPOS];
    u.equipo = j % EQUIPOS;
    u.proyectoId = e.proyectoId;
    u.sprintId = e.sprintId;
    if (e.codigo) await pedir('POST', '/invitaciones/unirse', { codigo: e.codigo }, u.token, 'POST /invitaciones/unirse');
  }));
  return equipos;
}

/* Todo un equipo escribiendo tareas del mismo sprint mientras su líder
   abre otro y fotografía el burndown: las tres operaciones tocan las mismas
   filas de «sprints» y «sprint_burndown», que es donde chocan las
   transacciones. Es el escenario que destapa los interbloqueos. */
async function tormentaDeSprint(usuarios, lideres) {
  for (let k = 0; k < 6; k++) {
    const trabajo = usuarios.map((u) => pedir('POST', '/proyectos/' + u.proyectoId + '/tareas',
      { titulo: 'Tormenta ' + k + '-' + u.n, puntos: 1 + azar(5), estado: 'pendiente', sprintId: u.sprintId },
      u.token, 'POST tormenta /tareas'));

    const cambiosDeSprint = lideres.map(async (l) => {
      await pedir('POST', '/sprints/' + l.sprintId + '/burndown', undefined, l.token, 'POST tormenta /burndown');
      const r = await pedir('POST', '/proyectos/' + l.proyectoId + '/sprints',
        { nombre: 'Sprint ' + k + '-' + l.n, dias: 14, estado: 'activo' }, l.token, 'POST tormenta /sprints');
      /* El sprint recién abierto es el activo: es el que se fotografía luego */
      if (r.estado === 201 && r.datos && r.datos.id) l.sprintId = r.datos.id;
    });

    await Promise.all(trabajo.concat(cambiosDeSprint));
  }
}

/* ══════════════ Informe ══════════════ */

function informe(duracionMs) {
  const filas = [...muestras.entries()].sort((a, b) => b[1].n - a[1].n);
  let total = 0;
  let malos = 0;
  const porEstado = new Map();

  console.log('\n┌─ Tiempos por ruta (ms) ' + '─'.repeat(56));
  console.log('│ ' + 'ruta'.padEnd(38) + 'n'.padStart(6) + 'p50'.padStart(8) + 'p95'.padStart(8) +
    'p99'.padStart(8) + 'máx'.padStart(9) + '  códigos');
  for (const [etiqueta, m] of filas) {
    const ord = m.ms.slice().sort((a, b) => a - b);
    total += m.n;
    const codigos = [...m.estados.entries()].sort((a, b) => b[1] - a[1]).map((e) => e[0] + '×' + e[1]).join(' ');
    m.estados.forEach((n, e) => {
      porEstado.set(e, (porEstado.get(e) || 0) + n);
      if (typeof e !== 'number' || e >= 400) malos += n;
    });
    console.log('│ ' + etiqueta.slice(0, 37).padEnd(38) +
      String(m.n).padStart(6) +
      percentil(ord, 50).toFixed(0).padStart(8) +
      percentil(ord, 95).toFixed(0).padStart(8) +
      percentil(ord, 99).toFixed(0).padStart(8) +
      ord[ord.length - 1].toFixed(0).padStart(9) + '  ' + codigos);
  }
  console.log('└' + '─'.repeat(79));

  console.log('\nPeticiones: ' + total + ' en ' + (duracionMs / 1000).toFixed(1) + ' s · ' +
    (total / (duracionMs / 1000)).toFixed(1) + ' pet/s · pico de ' + picoEnVuelo + ' simultáneas');
  console.log('Códigos: ' + [...porEstado.entries()].sort((a, b) => b[1] - a[1])
    .map((e) => e[0] + '×' + e[1]).join('  '));

  if (fallos.length) {
    console.log('\n┌─ Fallos (primeros ' + fallos.length + ') ' + '─'.repeat(50));
    fallos.forEach((f) => {
      const c = f.cuerpo && typeof f.cuerpo === 'object'
        ? (f.cuerpo.codigo || '') + ' ' + (f.cuerpo.error || JSON.stringify(f.cuerpo).slice(0, 120))
        : String(f.cuerpo).slice(0, 140);
      console.log('│ ' + String(f.estado).padEnd(7) + f.etiqueta.slice(0, 35).padEnd(36) + f.ms + 'ms  ' + c.trim());
    });
    console.log('└' + '─'.repeat(79));
  }
  return malos;
}

/* ══════════════ Guion completo ══════════════ */

(async () => {
  console.log('Prueba de carga contra ' + BASE);
  console.log(USUARIOS + ' usuarios simultáneos · ' + ITERACIONES + ' iteraciones cada uno · ' +
    EQUIPOS + ' equipos\n');

  const salud = await esperarServidor();
  console.log('  · ' + salud.postgres + ', base «' + salud.base + '», ' +
    salud.catalogo.procesos + ' procesos y ' + salud.catalogo.artefactos + ' artefactos');

  const t0 = performance.now();

  console.log('\n[1/5] Registro simultáneo de ' + USUARIOS + ' cuentas…');
  let parar = sonda('GET /salud · durante el registro');
  const brutos = await Promise.all(Array.from({ length: USUARIOS }, (_, i) => registrar(i + 1)));
  await parar();
  const usuarios = brutos.filter(Boolean);
  console.log('      ' + usuarios.length + '/' + USUARIOS + ' cuentas creadas');
  if (usuarios.length < EQUIPOS) throw new Error('No hay cuentas suficientes para montar los equipos.');

  console.log('[2/5] Todos entrando a la vez, como a primera hora de clase…');
  parar = sonda('GET /salud · durante el acceso');
  await Promise.all(usuarios.map(async (u) => {
    const r = await pedir('POST', '/auth/entrar', { correo: u.correo, clave: CLAVE }, undefined, 'POST /auth/entrar');
    if (r.estado === 200) u.token = r.datos.token;
  }));
  await parar();

  console.log('[3/5] ' + EQUIPOS + ' proyectos y el resto uniéndose por código…');
  await montarEquipos(usuarios);
  const conProyecto = usuarios.filter((u) => u.proyectoId);
  console.log('      ' + conProyecto.length + ' personas con proyecto');

  console.log('[4/5] Sesiones de trabajo en paralelo…');
  parar = sonda('GET /salud · durante el trabajo');
  await Promise.all(conProyecto.map(sesion));
  await parar();

  console.log('[5/5] Tormenta: todo el equipo escribiendo mientras sus líderes rotan el sprint…');
  await tormentaDeSprint(conProyecto, usuarios.slice(0, EQUIPOS).filter((u) => u.sprintId));

  const malos = informe(performance.now() - t0);
  if (malos) {
    console.log('\n✖ ' + malos + ' peticiones terminaron en error.');
    process.exitCode = 1;
  } else {
    console.log('\n✔ Ninguna petición falló.');
  }
})().catch((err) => {
  console.error('\n✖ La prueba se interrumpió:', err.message);
  informe(1);
  process.exit(1);
});
