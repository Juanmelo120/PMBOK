/* ═══════════════════════════════════════════════════════════
   flujo.js — El flujo de ejecución de los 40 procesos
   ───────────────────────────────────────────────────────────
   Coloca cada proceso en su banda del ciclo de vida, declara
   qué artefactos consume y cuáles produce, y añade el consejo
   que evita el error más común. Es lo que convierte el catálogo
   de estudio en una secuencia ejecutable sobre un proyecto real.
   ═══════════════════════════════════════════════════════════ */

window.PMBOK = window.PMBOK || {};

/* ── Metodologías y su adaptación (tailoring) ────────────── */
PMBOK.metodologias = [
  {
    id: 'predictivo', nombre: 'Predictivo (Cascada)', icono: '🏔️',
    lema: 'Líneas base y fases secuenciales',
    tailoring:
      'Los requisitos se definen y aprueban antes de construir. Las tres líneas base —alcance, cronograma y costo— ' +
      'se congelan y solo cambian por solicitud aprobada. El avance se mide contra el plan con valor ganado y ruta crítica. ' +
      'Cada fase termina en una puerta de decisión que autoriza la siguiente.',
    fases: ['Inicio', 'Planificación', 'Ejecución', 'Cierre'],
    iterativos: []
  },
  {
    id: 'agil', nombre: 'Ágil (Scrum)', icono: '🏃',
    lema: 'Sprints, DoD, ceremonias y velocidad',
    tailoring:
      'Los requisitos viven en el backlog como historias de usuario con criterios de aceptación. El cronograma se gestiona ' +
      'con sprints, velocidad y burndown, no con ruta crítica. El backlog priorizado ES la línea base del alcance: los cambios ' +
      'se negocian reordenando el backlog. Los procesos marcados como iterativos se ejecutan en cada sprint, no una sola vez.',
    fases: ['Sprint 0 — Preparación', 'Sprints de desarrollo (iterativos)', 'Release'],
    iterativos: ['p-alc-02', 'p-alc-05', 'p-alc-06', 'p-cro-02', 'p-cro-03', 'p-gob-04', 'p-gob-06',
                 'p-gob-07', 'p-int-04', 'p-int-05', 'p-rie-02', 'p-rie-05', 'p-rie-06', 'p-fin-04']
  },
  {
    id: 'hibrido', nombre: 'Híbrido', icono: '🔀',
    lema: 'Planificación predictiva y ejecución iterativa',
    tailoring:
      'Lo que está fijado por contrato, normativa o integración se planifica de forma predictiva con línea base; lo que tiene ' +
      'requisitos inestables se construye en iteraciones con demostración. Declara explícitamente qué parte es cuál: un híbrido ' +
      'sin esa frontera escrita degenera en un predictivo que incumple o en un ágil sin disciplina.',
    fases: ['Inicio', 'Planificación', 'Iteraciones de construcción', 'Estabilización', 'Cierre'],
    iterativos: ['p-alc-02', 'p-alc-05', 'p-gob-04', 'p-gob-06', 'p-int-05', 'p-rie-02', 'p-rie-06']
  },
  {
    id: 'kanban', nombre: 'Kanban', icono: '🌊',
    lema: 'Flujo continuo, límites de WIP y lead time',
    tailoring:
      'No hay sprints: el trabajo fluye de forma continua y se tira (pull) cuando hay capacidad. Se limita el trabajo en curso ' +
      'por columna y se mide el lead time y el throughput en lugar de la velocidad. La planificación es continua: se repone el ' +
      'backlog cuando baja de un umbral, no en una ceremonia fija.',
    fases: ['Preparación', 'Flujo continuo', 'Cierre'],
    iterativos: ['p-alc-02', 'p-alc-05', 'p-alc-06', 'p-gob-04', 'p-gob-07', 'p-int-05', 'p-rie-02', 'p-rie-06']
  }
];

/* ── Bandas del ciclo de vida ────────────────────────────── */
PMBOK.bandas = [
  { id: 'inicio', nombre: 'Inicio', n: 1 },
  { id: 'planificacion', nombre: 'Planificación', n: 2 },
  { id: 'ejecucion', nombre: 'Ejecución', n: 3 },
  { id: 'monitoreo', nombre: 'Monitoreo y Control', n: 4 },
  { id: 'cierre', nombre: 'Cierre', n: 5 }
];

/* ── Los 40 procesos en orden de ejecución ───────────────── */
PMBOK.flujo = [

/* ══════════ INICIO ══════════ */
{
  id: 'p-gob-01', banda: 'inicio', orden: 1,
  entradas: ['art-caso-negocio', 'art-acuerdos', 'art-plan-beneficios'],
  salidas: ['art-acta-proyecto', 'art-registro-supuestos'],
  consejo: 'El acta de constitución es el documento más importante del proyecto: sin ella el proyecto no existe formalmente ' +
    'y el director no tiene autoridad asignada. Que la firme alguien con poder sobre los fondos, nunca el propio director.'
},
{
  id: 'p-int-01', banda: 'inicio', orden: 2,
  entradas: ['art-acta-proyecto', 'art-acuerdos'],
  salidas: ['art-registro-interesados'],
  consejo: 'Identifica también a quien puede bloquear aunque no participe: legal, compras, auditoría, sindicato. ' +
    'El interesado que aparece en el mes 8 cuesta diez veces más que el que aparece en la semana 1.'
},

/* ══════════ PLANIFICACIÓN ══════════ */
{
  id: 'p-gob-02', banda: 'planificacion', orden: 10,
  entradas: ['art-acta-proyecto', 'art-plan-alcance', 'art-plan-cronograma', 'art-plan-financiero',
             'art-plan-recursos', 'art-plan-riesgos', 'art-plan-comunicaciones'],
  salidas: ['art-plan-direccion', 'art-linea-base-cronograma', 'art-linea-base-costos'],
  consejo: 'Integrar no es grapar documentos: es buscar las contradicciones entre ellos. El cronograma que asume una ' +
    'disponibilidad que el plan de recursos no confirma es el hallazgo típico de este proceso.'
},
{
  id: 'p-gob-03', banda: 'planificacion', orden: 11,
  entradas: ['art-acta-proyecto', 'art-declaracion-alcance', 'art-estimaciones-costos'],
  salidas: ['art-plan-abastecimiento'],
  consejo: 'El tipo de contrato reparte el riesgo: precio fijo lo traslada al proveedor y exige alcance cerrado; ' +
    'costo reembolsable lo retiene el comprador. Elegirlo sin mirar la estabilidad del alcance es el error habitual.'
},
{
  id: 'p-alc-01', banda: 'planificacion', orden: 12,
  entradas: ['art-acta-proyecto', 'art-plan-direccion'],
  salidas: ['art-plan-alcance', 'art-plan-requisitos'],
  consejo: 'Este plan no define el alcance: define cómo se definirá, validará y controlará. Si no fija quién acepta ' +
    'los entregables y en qué plazo, la validación se convertirá en una discusión.'
},
{
  id: 'p-alc-02', banda: 'planificacion', orden: 13,
  entradas: ['art-plan-requisitos', 'art-registro-interesados', 'art-acta-proyecto'],
  salidas: ['art-documentacion-requisitos', 'art-matriz-trazabilidad', 'art-backlog'],
  consejo: 'Un requisito sin origen identificado es un requisito que nadie pidió. La trazabilidad es lo que te permite ' +
    'decir que no sin discutir: se traza al objetivo de negocio o no entra.'
},
{
  id: 'p-alc-03', banda: 'planificacion', orden: 14,
  entradas: ['art-documentacion-requisitos', 'art-acta-proyecto', 'art-registro-supuestos'],
  salidas: ['art-declaracion-alcance'],
  consejo: 'Escribe las exclusiones antes que los entregables. Lo que un interesado razonable podría suponer incluido ' +
    'y no lo está es la fuente número uno de conflicto en ejecución.'
},
{
  id: 'p-alc-04', banda: 'planificacion', orden: 15,
  entradas: ['art-declaracion-alcance', 'art-documentacion-requisitos'],
  salidas: ['art-edt', 'art-diccionario-edt'],
  consejo: 'La EDT descompone entregables, no tareas: manda el sustantivo. Regla del 100 %: la suma de los hijos ' +
    'es exactamente el padre, ni más (gold plating) ni menos (alcance olvidado).'
},
{
  id: 'p-cro-01', banda: 'planificacion', orden: 16,
  entradas: ['art-acta-proyecto', 'art-plan-direccion'],
  salidas: ['art-plan-cronograma'],
  consejo: 'Fija aquí los umbrales de control. Un cronograma sin regla escrita de «a partir de qué desviación actúo» ' +
    'se gestiona por intuición y siempre tarde.'
},
{
  id: 'p-cro-02', banda: 'planificacion', orden: 17,
  entradas: ['art-plan-cronograma', 'art-edt', 'art-requerimientos-recursos', 'art-lista-actividades'],
  salidas: ['art-lista-actividades', 'art-lista-hitos', 'art-cronograma', 'art-linea-base-cronograma'],
  consejo: 'Duración es tiempo transcurrido; esfuerzo es horas-persona. Confundirlos produce cronogramas que parecen ' +
    'razonables y son imposibles. Y sin dependencias declaradas no hay ruta crítica que calcular.'
},
{
  id: 'p-fin-01', banda: 'planificacion', orden: 18,
  entradas: ['art-acta-proyecto', 'art-plan-direccion'],
  salidas: ['art-plan-financiero'],
  consejo: 'Declara desde el principio quién autoriza cada reserva: la contingencia la usa el director, la de gestión ' +
    'la libera el patrocinador. Si no se separan, la primera desviación se come las dos.'
},
{
  id: 'p-fin-02', banda: 'planificacion', orden: 19,
  entradas: ['art-plan-financiero', 'art-edt', 'art-cronograma', 'art-requerimientos-recursos', 'art-registro-riesgos'],
  salidas: ['art-estimaciones-costos', 'art-base-estimaciones'],
  consejo: 'Una estimación sin base documentada es una adivinanza con dos decimales. Anota el método y el rango: ' +
    'un número solo, sin intervalo, se lee como un compromiso.'
},
{
  id: 'p-fin-03', banda: 'planificacion', orden: 20,
  entradas: ['art-estimaciones-costos', 'art-base-estimaciones', 'art-cronograma', 'art-registro-riesgos'],
  salidas: ['art-linea-base-costos', 'art-requisitos-financiacion'],
  consejo: 'Presupuesto no es la suma de estimaciones: es esa suma más las reservas, distribuida en el tiempo. ' +
    'La curva S es lo que permitirá después calcular el valor planificado en cualquier fecha.'
},
{
  id: 'p-int-02', banda: 'planificacion', orden: 21,
  entradas: ['art-registro-interesados', 'art-acta-proyecto'],
  salidas: ['art-plan-interesados'],
  consejo: 'Para cada interesado crítico anota nivel actual y nivel deseado. Si coinciden, la acción es mantener, ' +
    'no mejorar: gastar energía en quien ya es partidario es el desperdicio más común.'
},
{
  id: 'p-int-03', banda: 'planificacion', orden: 22,
  entradas: ['art-registro-interesados', 'art-plan-interesados'],
  salidas: ['art-plan-comunicaciones'],
  consejo: 'Incluye la comunicación de malas noticias con su plazo máximo. El plan que solo prevé informes de avance ' +
    'deja la peor conversación del proyecto a la improvisación.'
},
{
  id: 'p-rec-01', banda: 'planificacion', orden: 23,
  entradas: ['art-acta-proyecto', 'art-edt', 'art-plan-direccion'],
  salidas: ['art-plan-recursos', 'art-acta-equipo'],
  consejo: 'Una A por entregable en la matriz de responsabilidades: quien responde es siempre uno. Dos responsables ' +
    'finales equivalen a ninguno cuando algo sale mal.'
},
{
  id: 'p-rec-02', banda: 'planificacion', orden: 24,
  entradas: ['art-plan-recursos', 'art-edt', 'art-lista-actividades'],
  salidas: ['art-requerimientos-recursos', 'art-base-estimaciones'],
  consejo: 'Indica cuándo se necesita cada recurso, no solo cuánto. Un recurso disponible tarde equivale a no tenerlo, ' +
    'y esa fecha es la que enlaza con el cronograma.'
},
{
  id: 'p-rie-01', banda: 'planificacion', orden: 25,
  entradas: ['art-acta-proyecto', 'art-plan-direccion'],
  salidas: ['art-plan-riesgos'],
  consejo: 'Define aquí las escalas de probabilidad e impacto y el umbral de escalamiento. Sin escalas comunes, ' +
    'cada quien puntúa a su manera y la matriz deja de ordenar nada.'
},
{
  id: 'p-rie-02', banda: 'planificacion', orden: 26,
  entradas: ['art-plan-riesgos', 'art-registro-supuestos', 'art-documentacion-requisitos', 'art-cronograma'],
  salidas: ['art-registro-riesgos', 'art-informe-riesgos'],
  consejo: 'Redacta causa → evento incierto → efecto. «Retraso del proveedor» no es un riesgo: es media frase. ' +
    'Y revisa los supuestos: cada supuesto no confirmado es un riesgo esperando a que lo escribas.'
},
{
  id: 'p-rie-03', banda: 'planificacion', orden: 27,
  entradas: ['art-registro-riesgos', 'art-plan-riesgos'],
  salidas: ['art-registro-riesgos', 'art-informe-riesgos'],
  consejo: 'El análisis cualitativo ordena; el cuantitativo cuesta dinero y solo se justifica en proyectos grandes. ' +
    'Priorizar mal es peor que no priorizar: deja los riesgos altos sin atención mientras se gestiona ruido.'
},
{
  id: 'p-rie-04', banda: 'planificacion', orden: 28,
  entradas: ['art-registro-riesgos', 'art-informe-riesgos', 'art-linea-base-costos'],
  salidas: ['art-registro-riesgos', 'art-registro-cambios'],
  consejo: 'Cada respuesta cuesta: ese costo va a la reserva de contingencia y el sobrante de riesgos no materializados ' +
    'no es ahorro del equipo. Escala solo lo que esté fuera de tu autoridad, no lo que simplemente sea grande.'
},

/* ══════════ EJECUCIÓN ══════════ */
{
  id: 'p-gob-04', banda: 'ejecucion', orden: 40,
  entradas: ['art-plan-direccion', 'art-registro-cambios', 'art-edt'],
  salidas: ['art-entregable', 'art-registro-incidencias', 'art-informe-rendimiento'],
  consejo: 'Dirigir la ejecución es decidir, no vigilar. Lo que llega aquí sin decisión previa —una incidencia sin dueño, ' +
    'un cambio sin evaluar— se convierte en retraso silencioso.'
},
{
  id: 'p-gob-05', banda: 'ejecucion', orden: 41,
  entradas: ['art-plan-calidad', 'art-informe-rendimiento', 'art-documentacion-requisitos'],
  salidas: ['art-informe-calidad', 'art-registro-cambios'],
  consejo: 'Aseguramiento audita el proceso; control inspecciona el entregable. Si tus entregables se rechazan a menudo, ' +
    'el problema no está en la inspección final sino en cuándo se acuerdan los criterios de aceptación.'
},
{
  id: 'p-gob-06', banda: 'ejecucion', orden: 42,
  entradas: ['art-plan-direccion', 'art-entregable', 'art-lecciones'],
  salidas: ['art-lecciones'],
  consejo: 'Captura las lecciones durante el proyecto, no al final: en el cierre nadie recuerda lo que ocurrió en el mes 2. ' +
    'Y una lección sin destinatario ni repositorio no sirve a nadie.'
},
{
  id: 'p-int-04', banda: 'ejecucion', orden: 43,
  entradas: ['art-plan-interesados', 'art-registro-interesados', 'art-registro-incidencias'],
  salidas: ['art-registro-incidencias', 'art-registro-interesados'],
  consejo: 'Involucrar es negociar expectativas antes de que se conviertan en quejas. Cuando un interesado reclama, ' +
    'casi siempre lo que falló fue una expectativa no gestionada, no el trabajo.'
},
{
  id: 'p-int-05', banda: 'ejecucion', orden: 44,
  entradas: ['art-plan-comunicaciones', 'art-informe-rendimiento'],
  salidas: ['art-informe-rendimiento'],
  consejo: 'Comunicar no es enviar: es confirmar que se entendió. El número de canales crece con n(n−1)/2, ' +
    'así que en equipos grandes la ambigüedad se multiplica sola.'
},
{
  id: 'p-rec-03', banda: 'ejecucion', orden: 45,
  entradas: ['art-plan-recursos', 'art-requerimientos-recursos', 'art-plan-abastecimiento'],
  salidas: ['art-acuerdos', 'art-registro-cambios'],
  consejo: 'La negociación por recursos internos se gana con datos: qué entregable se retrasa y cuánto cuesta ' +
    'si esa persona no se asigna. Sin esa cifra, es una petición contra otra petición.'
},
{
  id: 'p-rec-04', banda: 'ejecucion', orden: 46,
  entradas: ['art-plan-recursos', 'art-acta-equipo', 'art-informe-rendimiento'],
  salidas: ['art-acta-equipo', 'art-informe-rendimiento'],
  consejo: 'Los acuerdos de trabajo escritos evitan la mitad de los conflictos. La otra mitad se resuelve nombrando ' +
    'quién decide y en qué plazo cuando el equipo no se pone de acuerdo.'
},
{
  id: 'p-rie-05', banda: 'ejecucion', orden: 47,
  entradas: ['art-registro-riesgos', 'art-plan-riesgos'],
  salidas: ['art-registro-cambios', 'art-registro-incidencias'],
  consejo: 'El registro más pulcro no sirve si nadie ejecuta las respuestas. Vigila los disparadores: la respuesta ' +
    'se activa antes de que el riesgo ocurra, no después.'
},

/* ══════════ MONITOREO Y CONTROL ══════════ */
{
  id: 'p-gob-07', banda: 'monitoreo', orden: 60,
  entradas: ['art-plan-direccion', 'art-informe-rendimiento', 'art-linea-base-costos', 'art-linea-base-cronograma'],
  salidas: ['art-informe-rendimiento', 'art-registro-cambios'],
  consejo: 'Medir sin umbral escrito es mirar números. Fija antes qué CPI o SPI dispara acción y a quién se escala; ' +
    'si lo decides cuando ya está en rojo, decidirás bajo presión.'
},
{
  id: 'p-gob-08', banda: 'monitoreo', orden: 61,
  entradas: ['art-registro-cambios', 'art-plan-direccion'],
  salidas: ['art-registro-cambios', 'art-plan-direccion'],
  consejo: 'Evalúa cada cambio sobre alcance, cronograma, costo, riesgo y calidad a la vez. El cambio «pequeño» que ' +
    'solo se mira desde un dominio es el que descuadra el proyecto.'
},
{
  id: 'p-alc-06', banda: 'monitoreo', orden: 62,
  entradas: ['art-declaracion-alcance', 'art-matriz-trazabilidad', 'art-edt'],
  salidas: ['art-informe-rendimiento', 'art-registro-cambios'],
  consejo: 'Compara el trabajo en curso contra la EDT: toda tarea sin paquete de trabajo asociado es corrupción del ' +
    'alcance o gold plating. Ambas se detienen y se tramitan como cambio.'
},
{
  id: 'p-alc-05', banda: 'monitoreo', orden: 63,
  entradas: ['art-entregable', 'art-declaracion-alcance', 'art-matriz-trazabilidad'],
  salidas: ['art-entregable', 'art-registro-cambios'],
  consejo: 'Validar el alcance es aceptación formal del cliente; controlar la calidad es verificación técnica interna. ' +
    'Presentar a validación algo que no ha pasado control interno quema credibilidad.'
},
{
  id: 'p-cro-03', banda: 'monitoreo', orden: 64,
  entradas: ['art-linea-base-cronograma', 'art-cronograma'],
  salidas: ['art-informe-rendimiento', 'art-registro-cambios'],
  consejo: 'Comprimir una actividad fuera de la ruta crítica no adelanta nada: es gasto puro. Antes de intensificar, ' +
    'comprueba qué cadena determina realmente la fecha de fin.'
},
{
  id: 'p-fin-04', banda: 'monitoreo', orden: 65,
  entradas: ['art-linea-base-costos', 'art-requisitos-financiacion', 'art-informe-rendimiento'],
  salidas: ['art-informe-rendimiento', 'art-registro-cambios'],
  consejo: 'CPI por debajo de 1 significa que cada peso gastado rinde menos de lo planificado, y rara vez se recupera solo. ' +
    'Calcula el EAC con el CPI real antes de prometer que se compensará más adelante.'
},
{
  id: 'p-int-06', banda: 'monitoreo', orden: 66,
  entradas: ['art-plan-interesados', 'art-registro-interesados'],
  salidas: ['art-informe-rendimiento', 'art-registro-interesados'],
  consejo: 'El involucramiento se mide por hechos observables —asistencia, respuestas, decisiones a tiempo—, ' +
    'no por la sensación de que la relación va bien.'
},
{
  id: 'p-int-07', banda: 'monitoreo', orden: 67,
  entradas: ['art-plan-comunicaciones', 'art-informe-rendimiento'],
  salidas: ['art-informe-rendimiento', 'art-registro-cambios'],
  consejo: 'Comprueba que la información llegó y sirvió. Un informe que nadie abre es un costo sin beneficio: ' +
    'cámbialo de formato o de frecuencia en lugar de repetirlo.'
},
{
  id: 'p-rec-05', banda: 'monitoreo', orden: 68,
  entradas: ['art-plan-recursos', 'art-requerimientos-recursos'],
  salidas: ['art-informe-rendimiento', 'art-registro-cambios'],
  consejo: 'Vigila la sobreasignación: una persona al 140 % no rinde un 140 %, entrega tarde en los dos frentes. ' +
    'Nivelar a tiempo cuesta menos que explicar dos retrasos.'
},
{
  id: 'p-rie-06', banda: 'monitoreo', orden: 69,
  entradas: ['art-registro-riesgos', 'art-informe-riesgos'],
  salidas: ['art-informe-riesgos', 'art-registro-cambios'],
  consejo: 'Un registro que no se revisa envejece en semanas. Reevalúa al cerrar cada fase y anota los riesgos ' +
    'secundarios que nacen de tus propias respuestas.'
},

/* ══════════ CIERRE ══════════ */
{
  id: 'p-gob-09', banda: 'cierre', orden: 90,
  entradas: ['art-plan-direccion', 'art-entregable', 'art-acuerdos', 'art-lecciones', 'art-informe-rendimiento'],
  salidas: ['art-informe-final', 'art-lecciones'],
  consejo: 'Cerrar es un acto formal, no el día en que se deja de trabajar. Cierra también lo administrativo: contratos ' +
    'liquidados, accesos revocados, equipo liberado con su evaluación. Y deja fijada la medición de beneficios posterior.'
}

];

/* ── Índice auxiliar ─────────────────────────────────────── */
PMBOK.flujoPorId = (function () {
  var m = {};
  PMBOK.flujo.forEach(function (f) { m[f.id] = f; });
  return m;
})();
