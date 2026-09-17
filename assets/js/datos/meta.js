/* ═══════════════════════════════════════════════════════════
   meta.js — Taxonomía y metadatos de la estructura PMBOK 8
   ───────────────────────────────────────────────────────────
   La ARQUITECTURA (partes, capítulos, principios, dominios,
   áreas de enfoque y nombres de los 40 procesos) reproduce el
   índice público de la 8.ª edición. El DESARROLLO de cada tema
   es una redacción propia de apoyo al estudio: no es texto del
   PMI ni sustituye a la guía oficial.
   ═══════════════════════════════════════════════════════════ */

window.PMBOK = window.PMBOK || {};

PMBOK.meta = {
  titulo: 'Gestor PMBOK® 8',
  subtitulo: 'Dirección de proyectos con la 8.ª edición',
  edicion: '8.ª edición (2025) · Guía y Estándar unificados en un solo volumen',
  aviso:
    'Herramienta educativa independiente. La <b>estructura</b> —6 principios, 7 dominios, ' +
    '5 áreas de enfoque, 40 procesos, 155 herramientas y 42 artefactos— sigue el índice público ' +
    'de la 8.ª edición. Los textos explicativos, plantillas, consejos y ejemplos son ' +
    '<b>elaboración propia</b>: no son texto del PMI ni sustituyen a la guía oficial.',
  cifras: [
    { valor: '6',   etiqueta: 'Principios' },
    { valor: '7',   etiqueta: 'Dominios' },
    { valor: '40',  etiqueta: 'Procesos' },
    { valor: '155', etiqueta: 'Herramientas' },
    { valor: '42',  etiqueta: 'Artefactos' }
  ]
};

/* ── Áreas de enfoque (antes «grupos de procesos») ────────── */
PMBOK.areasEnfoque = [
  { id: 'inicio',      nombre: 'Inicio',              corto: 'Inicio',
    descripcion: 'Autorizar formalmente el proyecto o una fase, definir su propósito y designar autoridad.' },
  { id: 'planificacion', nombre: 'Planificación',      corto: 'Planificación',
    descripcion: 'Establecer el alcance, refinar objetivos y trazar el curso de acción para lograrlos.' },
  { id: 'ejecucion',   nombre: 'Ejecución',            corto: 'Ejecución',
    descripcion: 'Completar el trabajo definido en los planes para satisfacer los requisitos.' },
  { id: 'monitoreo',   nombre: 'Monitoreo y Control',  corto: 'Monitoreo',
    descripcion: 'Dar seguimiento, revisar y regular el avance y el desempeño; identificar cambios necesarios.' },
  { id: 'cierre',      nombre: 'Cierre',               corto: 'Cierre',
    descripcion: 'Finalizar formalmente el proyecto o la fase, transferir el resultado y capturar aprendizajes.' }
];

/* ── Dominios de desempeño ────────────────────────────────── */
PMBOK.dominiosMeta = [
  { id: 'gobernanza',  nombre: 'Gobernanza',  clase: 'd-gobernanza',  procesos: 9,
    lema: 'Autoridad, decisiones e integración' },
  { id: 'alcance',     nombre: 'Alcance',     clase: 'd-alcance',     procesos: 6,
    lema: 'Qué entra, qué queda fuera y por qué' },
  { id: 'cronograma',  nombre: 'Cronograma',  clase: 'd-cronograma',  procesos: 3,
    lema: 'Secuencia, ritmo y compromiso temporal' },
  { id: 'finanzas',    nombre: 'Finanzas',    clase: 'd-finanzas',    procesos: 4,
    lema: 'Costo, presupuesto y salud económica' },
  { id: 'interesados', nombre: 'Interesados', clase: 'd-interesados', procesos: 7,
    lema: 'Personas, influencia y comunicación' },
  { id: 'recursos',    nombre: 'Recursos',    clase: 'd-recursos',    procesos: 5,
    lema: 'Equipo, materiales y capacidad' },
  { id: 'riesgos',     nombre: 'Riesgos',     clase: 'd-riesgos',     procesos: 6,
    lema: 'Incertidumbre, amenazas y oportunidades' }
];

/* ── Índice lateral de la capa de aprendizaje ─────────────── */
PMBOK.navegacion = [
  {
    titulo: 'Aprender',
    items: [
      { ruta: '#/aprender',     etiqueta: 'Guía didáctica' },
      { ruta: '#/procesos',     etiqueta: 'Los 40 procesos' },
      { ruta: '#/herramientas', etiqueta: 'Herramientas (155)' },
      { ruta: '#/artefactos',   etiqueta: 'Artefactos (42)' }
    ]
  },
  {
    titulo: 'Dominios de desempeño',
    tipo: 'dominios'
  },
  {
    titulo: 'Los 6 principios',
    tipo: 'principios'
  }
];
