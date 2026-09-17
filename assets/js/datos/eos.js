/* ═══════════════════════════════════════════════════════════
   eos.js — Capa directiva (Entrepreneurial Operating System)
   ───────────────────────────────────────────────────────────
   La gerencia que está por encima de los proyectos: rocas del
   trimestre, scorecard semanal, VTO y organigrama por asientos.
   De las rocas se desprenden portafolios, programas y proyectos.
   ═══════════════════════════════════════════════════════════ */

window.PMBOK = window.PMBOK || {};

PMBOK.eos = {
  intro:
    'La capa directiva sobre la gestión de proyectos: de las rocas de gerencia se desprenden portafolios, programas, ' +
    'proyectos y operación. La operación se mide semanalmente en el scorecard.',

  secciones: [
    { id: 'rocas', icono: '🪨', nombre: 'Rocas del trimestre',
      lema: 'Objetivos de gerencia que originan portafolios y proyectos' },
    { id: 'scorecard', icono: '📊', nombre: 'Scorecard semanal',
      lema: 'Métricas medibles de la operación, 13 semanas' },
    { id: 'vto', icono: '👁️', nombre: 'VTO',
      lema: 'Visión, tracción y salud organizacional' },
    { id: 'organigrama', icono: '🗂️', nombre: 'Organigrama',
      lema: 'Asientos correctos con personas correctas' }
  ],

  ayudaRocas:
    '<b>¿Qué es una roca?</b> El objetivo trimestral más importante: una por empresa y una por persona. Si se logra, ' +
    'el trimestre fue un éxito. Cada roca lleva de una a tres metas medibles, y de ella se desprenden los portafolios, ' +
    'programas, proyectos y la operación: vincúlalos para que el trabajo diario empuje la roca.',

  ayudaScorecard:
    '<b>Scorecard:</b> de 5 a 15 métricas de la <b>operación</b> medidas cada semana (quejas, ventas, nómina, incidencias). ' +
    'Meta clara por métrica: si el número está en verde, la operación está sana y la gerencia puede enfocarse en las rocas.',

  ayudaVto:
    '<b>VTO (Vision/Traction Organizer):</b> las ocho preguntas que toda la organización debe responder igual. ' +
    'Es el documento de una página que alinea a la empresa: visión arriba, tracción abajo.',

  ayudaOrganigrama:
    '<b>Modelo organizacional EOS:</b> primero la estructura de asientos, después las personas. Cada asiento tiene un ' +
    'nombre que dice qué hace en cinco a diez palabras, su responsable y <b>una</b> persona correcta que lo comparta ' +
    'y quiera el puesto.',

  /* Los 8 bloques del VTO, en el orden de la plantilla original */
  vto: [
    { id: 'valores', nombre: 'Valores fundamentales', lado: 'vision',
      ayuda: 'De tres a siete valores que la empresa vive de verdad, no los que le gustaría vivir.' },
    { id: 'proposito', nombre: 'Propósito fundamental', lado: 'vision',
      ayuda: '¿Por qué existimos? La causa que justifica la empresa más allá del dinero.' },
    { id: 'competencias', nombre: 'Competencias básicas', lado: 'vision',
      ayuda: 'De tres a siete cosas que hacemos mejor que nadie.' },
    { id: 'vision10', nombre: 'Visión de 10 años', lado: 'vision',
      ayuda: '¿Dónde queremos estar en diez años? Una meta grande, concreta y audaz.' },
    { id: 'estrategia', nombre: 'Estrategia de mercado', lado: 'vision',
      ayuda: 'Nuestro nicho: quiénes somos, qué ofrecemos y a quién. La «caja blanca» del EOS.' },
    { id: 'meta3', nombre: 'Meta de 3 años', lado: 'traccion',
      ayuda: 'Imagen futura medible a tres años: ingresos, utilidad y tres rasgos observables.' },
    { id: 'meta1', nombre: 'Meta de 1 año', lado: 'traccion',
      ayuda: 'Presupuesto y de tres a siete metas medibles del año en curso.' },
    { id: 'garantia', nombre: 'Garantía de valor', lado: 'traccion',
      ayuda: 'Lo que garantizamos a cada cliente y que la competencia no se atreve a prometer.' }
  ],

  estadosRoca: [
    { id: 'encamino', nombre: 'En camino', color: 'ok' },
    { id: 'riesgo', nombre: 'En riesgo', color: 'aviso' },
    { id: 'fuera', nombre: 'Fuera de camino', color: 'falla' },
    { id: 'lograda', nombre: 'Lograda', color: 'ok' }
  ]
};

/* Trimestres disponibles, calculados alrededor del año en curso */
PMBOK.trimestres = (function () {
  var anio = new Date().getFullYear();
  var salida = [];
  [anio, anio + 1].forEach(function (a) {
    for (var q = 1; q <= 4; q++) salida.push('Q' + q + '-' + a);
  });
  return salida;
})();
