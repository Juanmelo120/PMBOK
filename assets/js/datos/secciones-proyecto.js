/* ═══════════════════════════════════════════════════════════
   secciones-proyecto.js — Guion de aplicación del PMBOK 8
   ───────────────────────────────────────────────────────────
   Define las diez SECCIONES por las que pasa un proyecto real
   al aplicarle la metodología, los campos que hay que redactar
   en cada una y las REGLAS DE CALIDAD con que se verifica cada
   campo. Es contenido: la lógica vive en calidad.js.
   ═══════════════════════════════════════════════════════════ */

window.PMBOK = window.PMBOK || {};

/* ── Vocabulario que delata redacción imprecisa ─────────── */
PMBOK.terminosVagos = [
  'adecuado', 'adecuada', 'apropiado', 'apropiada', 'óptimo', 'óptima',
  'lo antes posible', 'cuanto antes', 'a la brevedad', 'en su momento',
  'varios', 'varias', 'algunos', 'algunas', 'muchos', 'muchas', 'diversos',
  'etc', 'entre otros', 'entre otras', 'y demás',
  'mejorar', 'optimizar', 'eficiente', 'eficiencia general',
  'de calidad', 'buena calidad', 'alto nivel', 'gran impacto',
  'aproximadamente', 'más o menos', 'alrededor de', 'tal vez', 'quizá',
  'suficiente', 'razonable', 'considerable', 'significativo',
  'a corto plazo', 'a mediano plazo', 'a largo plazo', 'próximamente',
  'se buscará', 'se intentará', 'se procurará', 'en la medida de lo posible'
];

/* ── Las diez secciones de aplicación ────────────────────── */
PMBOK.seccionesProyecto = [

/* ══════════ 1 · ENCUADRE ══════════ */
{
  id: 'enc', n: '1', nombre: 'Encuadre y acta de constitución',
  lema: 'Por qué existe el proyecto y quién manda en él',
  dominio: 'gobernanza', areas: ['inicio'],
  proposito:
    'Convertir una intención en un proyecto autorizado. Sin un encuadre con problema cuantificado, ' +
    'objetivos medibles y autoridad designada, todo lo que viene después se construye sobre arena: ' +
    'nadie sabrá quién decide ante un conflicto ni contra qué se juzgará el resultado.',
  fundamento: ['pr-2', 'p-gob-01', 'p-int-01'],
  procesos: ['p-gob-01'],
  campos: [
    {
      id: 'nombre', etiqueta: 'Nombre del proyecto', tipo: 'corto', peso: 1,
      ayuda: 'Un nombre que diga qué se entrega y para quién. Evita nombres de producto sin contexto.',
      pistas: ['proyecto', 'título', 'titulo', 'nombre del proyecto'],
      ejemplo: 'Modernización del sistema de nómina para las 14 sedes de la cooperativa',
      reglas: [
        { r: 'minPalabras', n: 4, etiqueta: 'Nombre descriptivo' },
        { r: 'evita', claves: ['proyecto final', 'trabajo de grado', 'sin título', 'prueba'], etiqueta: 'No es un nombre genérico' }
      ]
    },
    {
      id: 'problema', etiqueta: 'Problema u oportunidad', tipo: 'texto', peso: 3,
      ayuda: 'La situación actual con datos: qué falla hoy, cuánto cuesta y a quién afecta. Sin cifra no hay problema: hay opinión.',
      guia: [
        'Describe el estado actual, no la solución que ya tienes en mente.',
        'Incluye al menos un dato medido: tiempo perdido, dinero, número de afectados, tasa de error.',
        'Nombra a quién le duele el problema hoy.'
      ],
      pistas: ['problema', 'situación actual', 'necesidad', 'oportunidad', 'antecedentes', 'diagnóstico'],
      ejemplo: 'El cierre de nómina consume 9 días hábiles de 3 analistas y en los últimos 12 meses acumuló 214 errores de liquidación, con 38 reclamos formales. Cada corrección cuesta en promedio 1,5 horas de un analista senior y retrasa los pagos a 120 empleados por sede.',
      reglas: [
        { r: 'minPalabras', n: 40, etiqueta: 'Descripción suficiente' },
        { r: 'cifras', n: 2, etiqueta: 'Problema cuantificado', ayuda: 'Añade magnitudes medidas: horas, errores, personas, dinero.' },
        { r: 'sinVaguedad' }
      ]
    },
    {
      id: 'justificacion', etiqueta: 'Caso de negocio y beneficio esperado', tipo: 'texto', peso: 3,
      ayuda: 'Qué gana la organización y cuándo. El beneficio se expresa en la misma unidad que el problema.',
      guia: [
        'Cuantifica el beneficio anual o por ciclo, en dinero o en la unidad del problema.',
        'Indica la inversión estimada y, si puedes, el periodo de recuperación.',
        'El beneficio se realiza después del cierre: di cuándo empieza a contarse.'
      ],
      pistas: ['justificación', 'caso de negocio', 'beneficio', 'retorno', 'roi', 'van', 'valor'],
      ejemplo: 'La automatización libera 6 de los 9 días de cierre (equivalente a 18.000 USD anuales en horas de analista) y reduce los errores de liquidación de 214 a menos de 20 al año. Con una inversión de 45.000 USD, el retorno se alcanza en el mes 20 contado desde la puesta en producción prevista para julio de 2026.',
      reglas: [
        { r: 'minPalabras', n: 35, etiqueta: 'Justificación desarrollada' },
        { r: 'cifras', n: 2, etiqueta: 'Beneficio cuantificado' },
        { r: 'incluye', claves: ['beneficio', 'ahorro', 'ingreso', 'reducción', 'retorno', 'van', 'roi', 'recuperación', 'valor'], etiqueta: 'Nombra el valor que se crea' },
        { r: 'sinVaguedad' }
      ]
    },
    {
      id: 'objetivos', etiqueta: 'Objetivos del proyecto (SMART)', tipo: 'lista', peso: 4,
      ayuda: 'Un objetivo por línea. Cada uno con verbo en infinitivo, magnitud medible y fecha límite.',
      guia: [
        'Estructura: verbo + qué + cuánto + para cuándo.',
        'Dos a cinco objetivos. Más de cinco casi siempre significa que hay varios proyectos.',
        'Si un objetivo no se puede medir, no es objetivo: es una aspiración.'
      ],
      pistas: ['objetivo', 'objetivos', 'meta', 'metas', 'propósito', 'objetivo general', 'objetivos específicos'],
      ejemplo: 'Reducir el cierre de nómina de 9 a 3 días hábiles antes del 30 de septiembre de 2026.\nDisminuir los errores de liquidación de 214 a menos de 20 anuales, medidos en los 6 meses posteriores a la puesta en producción.\nUnificar las 14 sedes en una sola plataforma antes del 15 de agosto de 2026.',
      reglas: [
        { r: 'minLineas', n: 2, etiqueta: 'Al menos dos objetivos' },
        { r: 'smart', etiqueta: 'Objetivos medibles y fechados', peso: 3 },
        { r: 'sinVaguedad' }
      ]
    },
    {
      id: 'criterios_exito', etiqueta: 'Criterios de éxito', tipo: 'lista', peso: 3,
      ayuda: 'Cómo se sabrá que el proyecto tuvo éxito. Un criterio por línea, con umbral numérico y quién lo verifica.',
      guia: [
        'El criterio de éxito se mide sobre el resultado, no sobre el cumplimiento del plan.',
        'Formato sugerido: Criterio | Umbral | Quién lo verifica | Cuándo.',
        'Debe poder responderse con sí o no el día de la medición.'
      ],
      pistas: ['criterio de éxito', 'criterios de éxito', 'indicador', 'kpi', 'medición del éxito'],
      ejemplo: 'Cierre de nómina ejecutado en 3 días o menos | 3 ciclos consecutivos | Jefe de Nómina | Diciembre 2026\nErrores de liquidación por ciclo menores a 2 | 3 ciclos consecutivos | Auditoría interna | Diciembre 2026\nSatisfacción de los 14 jefes de sede igual o superior a 4 sobre 5 | Encuesta al mes 3 | Patrocinador | Octubre 2026',
      reglas: [
        { r: 'minLineas', n: 2, etiqueta: 'Al menos dos criterios' },
        { r: 'lineasCon', patron: 'cifra', min: 0.75, etiqueta: 'Criterios con umbral numérico', peso: 2 },
        { r: 'sinVaguedad' }
      ]
    },
    {
      id: 'alineacion', etiqueta: 'Alineación estratégica', tipo: 'texto', peso: 2,
      ayuda: 'A qué objetivo de la organización sirve este proyecto y qué pasaría si no se hiciera.',
      guia: [
        'Nombra el plan, la meta institucional o la obligación normativa con la que conecta.',
        'Incluye el costo de no hacerlo: es la mitad más convincente del argumento.'
      ],
      pistas: ['alineación', 'estrategia', 'plan estratégico', 'misión', 'objetivo institucional'],
      ejemplo: 'Responde a la meta 3 del plan estratégico 2025-2027 (reducir en 25 % el costo administrativo por empleado) y a la exigencia de la Superintendencia de conservar trazabilidad de liquidaciones por 5 años, que el sistema actual no cumple. No hacerlo mantiene un riesgo de sanción estimado en 60.000 USD.',
      reglas: [
        { r: 'minPalabras', n: 25, etiqueta: 'Alineación explicada' },
        { r: 'sinVaguedad' }
      ]
    },
    {
      id: 'autoridad', etiqueta: 'Patrocinador, director y límites de autoridad', tipo: 'texto', peso: 3,
      ayuda: 'Quién patrocina, quién dirige y hasta dónde puede decidir el director sin escalar.',
      guia: [
        'El patrocinador debe ser una persona con autoridad sobre los fondos, externa al equipo.',
        'Los límites se expresan en cifras: monto, días de holgura, porcentaje de alcance.',
        'Incluye la regla de desempate: quién decide y en qué plazo cuando dos áreas discrepan.'
      ],
      pistas: ['patrocinador', 'sponsor', 'director del proyecto', 'gerente de proyecto', 'autoridad'],
      ejemplo: 'Patrocinadora: directora de Talento Humano. Director del proyecto: coordinador de Sistemas, con autoridad para comprometer hasta 3.000 USD y consumir hasta 10 días de holgura sin aprobación adicional. Por encima de esos límites decide la patrocinadora en un plazo máximo de 5 días hábiles tras oír a las áreas implicadas.',
      reglas: [
        { r: 'incluye', claves: ['patrocinador', 'patrocinadora', 'sponsor'], etiqueta: 'Patrocinador identificado', peso: 2 },
        { r: 'incluye', claves: ['director', 'directora', 'gerente', 'líder', 'coordinador', 'coordinadora'], etiqueta: 'Director del proyecto identificado' },
        { r: 'cifras', n: 1, etiqueta: 'Límites de autoridad cuantificados', peso: 2 },
        { r: 'minPalabras', n: 25, etiqueta: 'Autoridad descrita' }
      ]
    }
  ]
},

/* ══════════ 2 · GOBERNANZA ══════════ */
{
  id: 'gob', n: '2', nombre: 'Gobernanza, integración y cambios',
  lema: 'Quién decide qué, con qué información y bajo qué regla',
  dominio: 'gobernanza', areas: ['planificacion', 'ejecucion', 'monitoreo'],
  proposito:
    'Definir el andamiaje de decisión del proyecto: enfoque de desarrollo, líneas base, control de cambios, ' +
    'aseguramiento de la calidad y captura de conocimiento. Es el dominio que impide que los otros seis se contradigan.',
  fundamento: ['d-gobernanza', 'pr-1', 'p-gob-02', 'p-gob-08'],
  procesos: ['p-gob-02', 'p-gob-04', 'p-gob-05', 'p-gob-06', 'p-gob-07', 'p-gob-08'],
  campos: [
    {
      id: 'enfoque', etiqueta: 'Enfoque de desarrollo y ciclo de vida', tipo: 'texto', peso: 3,
      ayuda: 'Predictivo, adaptativo o híbrido, con las fases del ciclo de vida y la razón de la elección.',
      guia: [
        'La elección se justifica por la estabilidad de los requisitos y la frecuencia de entrega, no por moda.',
        'Enumera las fases con sus puertas de decisión.',
        'En híbrido, di qué parte es predictiva y qué parte iterativa.'
      ],
      pistas: ['metodología', 'enfoque', 'ciclo de vida', 'fases', 'predictivo', 'ágil', 'scrum', 'híbrido'],
      ejemplo: 'Enfoque híbrido. La migración de datos y la integración contable son predictivas (requisitos fijados por normativa, una sola entrega). La interfaz de autoservicio se construye en 6 iteraciones de 3 semanas con demostración al final de cada una. Fases: Inicio (2 sem), Diseño (5 sem), Construcción (18 sem), Estabilización (4 sem), Cierre (2 sem), con puerta de decisión al final de Diseño y de Estabilización.',
      reglas: [
        { r: 'incluye', claves: ['predictivo', 'adaptativo', 'híbrido', 'hibrido', 'iterativo', 'incremental', 'ágil', 'agil', 'cascada'], etiqueta: 'Enfoque declarado', peso: 2 },
        { r: 'incluye', claves: ['fase', 'fases', 'etapa', 'etapas', 'iteración', 'iteraciones', 'sprint'], etiqueta: 'Fases del ciclo de vida' },
        { r: 'minPalabras', n: 35, etiqueta: 'Elección justificada' }
      ]
    },
    {
      id: 'decisiones', etiqueta: 'Estructura de decisión y reuniones de gobernanza', tipo: 'texto', peso: 3,
      ayuda: 'Qué órganos existen, qué decide cada uno, con qué periodicidad se reúnen y con qué información.',
      guia: [
        'Distingue decisiones del equipo, del director y del patrocinador o comité.',
        'Cada instancia con periodicidad fija y entrada documental definida.',
        'Sin plazo máximo de decisión, la gobernanza se convierte en un cuello de botella.'
      ],
      pistas: ['gobernanza', 'comité', 'reunión', 'toma de decisiones', 'seguimiento', 'escalamiento'],
      ejemplo: 'Comité de proyecto (patrocinadora, jefe de Nómina, director del proyecto): mensual, primer martes, decide cambios sobre línea base y liberación de reservas, con plazo máximo de 5 días hábiles. Reunión de seguimiento semanal del equipo: revisa avance, impedimentos y riesgos activos. Informe de desempeño quincenal con SPI, CPI y riesgos en rojo como entrada obligatoria del comité.',
      reglas: [
        { r: 'incluye', claves: ['decide', 'decisión', 'aprueba', 'autoriza', 'resuelve'], etiqueta: 'Autoridad de decisión explícita', peso: 2 },
        { r: 'incluye', claves: ['semanal', 'quincenal', 'mensual', 'diaria', 'periodicidad', 'cada'], etiqueta: 'Periodicidad definida' },
        { r: 'minPalabras', n: 35, etiqueta: 'Estructura descrita' }
      ]
    },
    {
      id: 'cambios', etiqueta: 'Control integrado de cambios', tipo: 'texto', peso: 3,
      ayuda: 'El circuito completo: quién solicita, quién evalúa el impacto, quién aprueba, en qué plazo y dónde se registra.',
      guia: [
        'El impacto se evalúa sobre alcance, cronograma, costo, riesgo y calidad a la vez.',
        'Fija umbrales: qué cambios puede aprobar el director y cuáles van al comité.',
        'Las líneas base solo cambian por cambio aprobado: dilo explícitamente.'
      ],
      pistas: ['control de cambios', 'solicitud de cambio', 'cambios', 'gestión del cambio'],
      ejemplo: 'Cualquier interesado registra la solicitud en el formato SC-01. El director evalúa en 3 días hábiles el impacto en alcance, cronograma, costo, riesgo y calidad. Cambios con impacto menor a 3.000 USD y 10 días los aprueba el director; por encima, el comité en su sesión mensual o en sesión extraordinaria si es urgente. Toda decisión se registra en el log de cambios y, si se aprueba, se actualizan las líneas base afectadas.',
      reglas: [
        { r: 'incluye', claves: ['solicitud', 'solicita', 'registro', 'formato'], etiqueta: 'Cómo se solicita' },
        { r: 'incluye', claves: ['aprueba', 'aprobación', 'autoriza'], etiqueta: 'Quién aprueba', peso: 2 },
        { r: 'incluye', claves: ['impacto', 'evalúa', 'evaluación', 'análisis'], etiqueta: 'Evaluación de impacto' },
        { r: 'cifras', n: 1, etiqueta: 'Umbrales o plazos cuantificados' },
        { r: 'minPalabras', n: 40, etiqueta: 'Circuito completo' }
      ]
    },
    {
      id: 'lineas_base', etiqueta: 'Líneas base y medición del desempeño', tipo: 'texto', peso: 2,
      ayuda: 'Qué líneas base se aprueban, cuándo, y con qué indicadores se mide la desviación.',
      guia: [
        'Las tres líneas base son alcance, cronograma y costo; juntas forman la línea base para la medición del desempeño.',
        'Define umbrales de tolerancia: a partir de qué desviación se actúa.'
      ],
      pistas: ['línea base', 'linea base', 'desempeño', 'indicadores', 'seguimiento', 'valor ganado'],
      ejemplo: 'Las líneas base de alcance, cronograma y costo se aprueban en el comité del 15 de mayo de 2026 y solo cambian por solicitud aprobada. Medición quincenal por valor ganado. Umbrales: CPI o SPI por debajo de 0,95 dispara plan de acción del director; por debajo de 0,90 se escala al comité.',
      reglas: [
        { r: 'incluye', claves: ['línea base', 'linea base', 'líneas base', 'lineas base'], etiqueta: 'Líneas base nombradas' },
        { r: 'incluye', claves: ['cpi', 'spi', 'valor ganado', 'umbral', 'tolerancia', 'desviación', 'variación'], etiqueta: 'Indicador o umbral definido', peso: 2 },
        { r: 'minPalabras', n: 25, etiqueta: 'Medición descrita' }
      ]
    },
    {
      id: 'calidad_conocimiento', etiqueta: 'Aseguramiento de la calidad y conocimiento', tipo: 'texto', peso: 2,
      ayuda: 'Cómo se audita el proceso (no solo el producto) y cómo se captura y comparte el conocimiento.',
      guia: [
        'Aseguramiento audita el proceso; control inspecciona el entregable. Separa ambos.',
        'Di dónde viven las lecciones aprendidas y quién las consulta antes de decidir.'
      ],
      pistas: ['calidad', 'aseguramiento', 'auditoría', 'lecciones aprendidas', 'conocimiento', 'documentación'],
      ejemplo: 'Auditoría de proceso al final de Diseño y de Construcción, ejecutada por el área de Calidad, sobre cumplimiento del procedimiento de pruebas y de criterios de aceptación previos. Las lecciones aprendidas se registran al cierre de cada fase en el repositorio compartido de la PMO y se revisan en el arranque de la fase siguiente.',
      reglas: [
        { r: 'incluye', claves: ['auditoría', 'auditoria', 'revisión', 'aseguramiento', 'verificación'], etiqueta: 'Aseguramiento definido' },
        { r: 'incluye', claves: ['lecciones', 'conocimiento', 'repositorio', 'documenta'], etiqueta: 'Captura de conocimiento' },
        { r: 'minPalabras', n: 25, etiqueta: 'Descripción suficiente' }
      ]
    }
  ]
},

/* ══════════ 3 · ALCANCE ══════════ */
{
  id: 'alc', n: '3', nombre: 'Alcance y requisitos',
  lema: 'Qué entra, qué queda fuera y quién lo acepta',
  dominio: 'alcance', areas: ['planificacion', 'monitoreo'],
  proposito:
    'Fijar la frontera del trabajo. Todo lo que no esté aquí escrito no se construye, y todo lo que esté ' +
    'debe tener un criterio de aceptación acordado antes de empezar a producirlo.',
  fundamento: ['d-alcance', 'pr-3', 'p-alc-03', 'p-alc-05'],
  procesos: ['p-alc-01', 'p-alc-02', 'p-alc-03', 'p-alc-04', 'p-alc-05', 'p-alc-06'],
  campos: [
    {
      id: 'entregables', etiqueta: 'Entregables con criterio de aceptación', tipo: 'tabla', peso: 4,
      formato: 'Entregable | Criterio de aceptación medible | Quién acepta',
      ayuda: 'Un entregable por línea. El criterio se acuerda antes de construir: así la calidad se incorpora en lugar de inspeccionarse.',
      guia: [
        'Un entregable es un producto verificable, no una actividad.',
        'El criterio debe poder responderse con sí o no, con un número de por medio.',
        'Quien acepta debe ser una persona con autoridad, no un área difusa.'
      ],
      pistas: ['entregable', 'entregables', 'productos', 'resultados esperados', 'alcance del producto'],
      ejemplo: 'Motor de liquidación migrado | Liquida 3.200 empleados en menos de 4 horas con 0 diferencias contra el sistema actual en 3 ciclos | Jefe de Nómina\nPortal de autoservicio | 14 sedes acceden y descargan colilla; tiempo de respuesta menor a 2 s con 300 usuarios simultáneos | Jefe de Sistemas\nManual de operación y 4 sesiones de capacitación | 28 usuarios capacitados aprueban evaluación con 80 % o más | Directora de Talento Humano',
      reglas: [
        { r: 'minLineas', n: 3, etiqueta: 'Al menos tres entregables' },
        { r: 'columnas', n: 3, etiqueta: 'Entregable, criterio y aceptante', peso: 2 },
        { r: 'lineasCon', patron: 'cifra', min: 0.7, etiqueta: 'Criterios medibles', peso: 2 },
        { r: 'sinVaguedad' }
      ]
    },
    {
      id: 'edt', etiqueta: 'Estructura de desglose del trabajo (EDT)', tipo: 'lista', peso: 3,
      ayuda: 'Descomposición jerárquica hasta paquetes de trabajo. Usa numeración 1, 1.1, 1.1.1.',
      guia: [
        'La EDT descompone entregables, no tareas: los sustantivos mandan.',
        'Un paquete de trabajo debe poder estimarse en costo y duración con confianza.',
        'Regla del 100 %: la suma de los hijos es exactamente el padre, ni más ni menos.'
      ],
      pistas: ['edt', 'wbs', 'desglose', 'estructura de desglose', 'paquetes de trabajo'],
      ejemplo: '1 Sistema de nómina modernizado\n1.1 Motor de liquidación\n1.1.1 Migración de datos históricos\n1.1.2 Reglas de liquidación parametrizadas\n1.2 Portal de autoservicio\n1.2.1 Módulo de colillas\n1.2.2 Módulo de certificados\n1.3 Gestión del proyecto\n1.3.1 Planificación\n1.3.2 Seguimiento y control',
      reglas: [
        { r: 'minLineas', n: 6, etiqueta: 'Descomposición suficiente' },
        { r: 'lineasCon', patron: 'numeracion', min: 0.6, etiqueta: 'Jerarquía numerada', peso: 2 }
      ]
    },
    {
      id: 'requisitos', etiqueta: 'Requisitos trazables', tipo: 'tabla', peso: 3,
      formato: 'ID | Requisito | Origen (quién lo pide) | Prioridad',
      ayuda: 'Cada requisito con identificador, origen y prioridad. La trazabilidad es lo que permite decir que no a lo que nadie pidió.',
      guia: [
        'El identificador permite rastrear el requisito hasta el entregable y la prueba.',
        'El origen es una persona o un documento, no «el negocio».',
        'Prioriza con una escala explícita: obligatorio, deseable, opcional, o MoSCoW.'
      ],
      pistas: ['requisito', 'requisitos', 'requerimiento', 'especificaciones', 'historias de usuario'],
      ejemplo: 'R-01 | Liquidar retención en la fuente según tabla vigente | Jefe de Nómina | Obligatorio\nR-02 | Exportar archivo plano al banco en formato ACH | Tesorería | Obligatorio\nR-03 | Descargar certificado laboral desde el portal | Encuesta a 84 empleados | Deseable\nR-04 | Firmar digitalmente la colilla | Auditoría interna | Opcional',
      reglas: [
        { r: 'minLineas', n: 4, etiqueta: 'Al menos cuatro requisitos' },
        { r: 'columnas', n: 3, etiqueta: 'Requisito trazable a su origen', peso: 2 },
        { r: 'incluye', claves: ['obligatorio', 'deseable', 'opcional', 'alta', 'media', 'baja', 'must', 'should', 'could', 'crítico'], etiqueta: 'Prioridad declarada' }
      ]
    },
    {
      id: 'exclusiones', etiqueta: 'Exclusiones explícitas', tipo: 'lista', peso: 2,
      ayuda: 'Lo que el proyecto NO hará. Una exclusión por línea. Es la defensa más barata contra la corrupción del alcance.',
      guia: [
        'Escribe lo que un interesado razonable podría suponer incluido y no lo está.',
        'Si alguien pidió algo y se rechazó, aquí queda constancia.'
      ],
      pistas: ['exclusiones', 'fuera de alcance', 'no incluye', 'limitaciones del alcance'],
      ejemplo: 'No incluye la migración de datos anteriores a 2020: permanecen consultables en el sistema legado.\nNo incluye la integración con el sistema de tiempo y asistencia: se evalúa en un proyecto posterior.\nNo incluye equipos ni licencias de terminal para las sedes.\nNo incluye nómina de contratistas por prestación de servicios.',
      reglas: [
        { r: 'minLineas', n: 3, etiqueta: 'Al menos tres exclusiones' },
        { r: 'minPalabras', n: 25, etiqueta: 'Exclusiones explicadas' }
      ]
    },
    {
      id: 'supuestos', etiqueta: 'Supuestos y restricciones', tipo: 'lista', peso: 2,
      ayuda: 'Supuestos: lo que damos por cierto sin confirmar. Restricciones: los límites impuestos. Marca cada línea con S o R.',
      guia: [
        'Todo supuesto es un riesgo latente: si falla, algo se rompe. Anota qué se rompe.',
        'Las restricciones vienen de fuera: presupuesto tope, fecha inamovible, normativa, tecnología obligada.'
      ],
      pistas: ['supuesto', 'supuestos', 'restricción', 'restricciones', 'limitaciones', 'condicionantes'],
      ejemplo: 'S | El proveedor entrega el ambiente de pruebas antes del 1 de junio de 2026. Si falla, la fase de pruebas se retrasa 3 semanas.\nS | Los 3 analistas de nómina dedican 20 % de su jornada al proyecto durante toda la ejecución.\nR | El presupuesto máximo aprobado es 45.000 USD y no admite ampliación.\nR | La puesta en producción debe ocurrir entre ciclos de nómina, es decir el día 16 de cualquier mes.\nR | La normativa exige conservar trazabilidad de liquidaciones por 5 años.',
      reglas: [
        { r: 'minLineas', n: 4, etiqueta: 'Al menos cuatro elementos' },
        { r: 'incluye', claves: ['supuesto', 'restricción', 'restriccion'], etiqueta: 'Supuestos y restricciones distinguidos' },
        { r: 'sinVaguedad' }
      ]
    },
    {
      id: 'validacion', etiqueta: 'Validación y control del alcance', tipo: 'texto', peso: 2,
      ayuda: 'Cómo se revisa formalmente cada entregable con el cliente y cómo se detecta la corrupción del alcance.',
      guia: [
        'Validar el alcance es aceptación formal por el cliente; controlar la calidad es verificación técnica interna. No los confundas.',
        'Define el acta de aceptación y el plazo para firmar o rechazar con motivo.'
      ],
      pistas: ['validación', 'aceptación', 'revisión de entregables', 'control del alcance'],
      ejemplo: 'Cada entregable se presenta en sesión de revisión con su criterio de aceptación a la vista. El aceptante firma el acta o rechaza por escrito con la causa, en un plazo de 5 días hábiles; sin respuesta se entiende aceptado. El director compara mensualmente el trabajo en curso contra la EDT: cualquier tarea sin paquete de trabajo asociado se detiene y se tramita como solicitud de cambio.',
      reglas: [
        { r: 'incluye', claves: ['acta', 'firma', 'aceptación', 'aprueba', 'formal'], etiqueta: 'Aceptación formal definida' },
        { r: 'incluye', claves: ['plazo', 'días', 'dias', 'semana'], etiqueta: 'Plazo de respuesta' },
        { r: 'minPalabras', n: 30, etiqueta: 'Mecanismo descrito' }
      ]
    }
  ]
},

/* ══════════ 4 · CRONOGRAMA ══════════ */
{
  id: 'cro', n: '4', nombre: 'Cronograma',
  lema: 'Secuencia, ritmo y compromiso temporal',
  dominio: 'cronograma', areas: ['planificacion', 'monitoreo'],
  proposito:
    'Convertir la EDT en una secuencia con duraciones, dependencias y holguras. Un cronograma sin ruta crítica ' +
    'identificada es una lista de deseos ordenada por fecha.',
  fundamento: ['d-cronograma', 'p-cro-02', 'p-cro-03'],
  procesos: ['p-cro-01', 'p-cro-02', 'p-cro-03'],
  campos: [
    {
      id: 'calendario', etiqueta: 'Fechas de inicio y fin', tipo: 'corto', peso: 2,
      ayuda: 'Fecha de inicio y fecha de fin previstas del proyecto, con la duración total.',
      pistas: ['fecha de inicio', 'fecha de fin', 'duración del proyecto', 'cronograma general'],
      ejemplo: 'Inicio: 4 de mayo de 2026. Fin previsto: 18 de diciembre de 2026. Duración total: 33 semanas.',
      reglas: [
        { r: 'fechas', n: 2, etiqueta: 'Inicio y fin fechados', peso: 2 },
        { r: 'cifras', n: 1, etiqueta: 'Duración indicada' }
      ]
    },
    {
      id: 'hitos', etiqueta: 'Hitos', tipo: 'tabla', peso: 4,
      formato: 'Hito | Fecha | Criterio de cumplimiento',
      ayuda: 'Un hito por línea. Un hito es un punto de verificación con duración cero: o se cumplió o no.',
      guia: [
        'Entre 4 y 10 hitos. Cubre al menos el cierre de cada fase.',
        'El criterio evita el hito «terminado al 90 %», que no significa nada.',
        'Incluye los hitos que dependen de terceros: son los que más se retrasan.'
      ],
      pistas: ['hito', 'hitos', 'milestone', 'entregas clave', 'fechas clave'],
      ejemplo: 'Línea base aprobada | 15/05/2026 | Acta del comité firmada por la patrocinadora\nDiseño validado | 19/06/2026 | Los 3 documentos de diseño aceptados por Jefe de Nómina\nMigración de datos completa | 21/08/2026 | 0 diferencias en conciliación de 3.200 registros\nPruebas de aceptación superadas | 06/11/2026 | 3 ciclos paralelos sin diferencias\nPuesta en producción | 16/11/2026 | Nómina de noviembre liquidada en el sistema nuevo\nCierre del proyecto | 18/12/2026 | Acta de cierre firmada y recursos liberados',
      reglas: [
        { r: 'minLineas', n: 4, etiqueta: 'Al menos cuatro hitos' },
        { r: 'lineasCon', patron: 'fecha', min: 0.8, etiqueta: 'Hitos fechados', peso: 3 },
        { r: 'columnas', n: 3, etiqueta: 'Hito, fecha y criterio' }
      ]
    },
    {
      id: 'actividades', etiqueta: 'Actividades, duración y dependencias', tipo: 'tabla', peso: 4,
      formato: 'Actividad | Duración | Predecesora | Responsable',
      ayuda: 'Las actividades que sostienen los paquetes de trabajo, con su duración estimada y de qué dependen.',
      guia: [
        'Duración es tiempo transcurrido; esfuerzo es horas-persona. No los mezcles.',
        'La predecesora es lo que hace que la secuencia exista: sin dependencias no hay ruta crítica.',
        'Un responsable por actividad. Dos responsables equivalen a ninguno.'
      ],
      pistas: ['actividades', 'tareas', 'duración', 'dependencias', 'secuencia', 'precedencia'],
      ejemplo: 'A1 Levantar reglas de liquidación vigentes | 10 días | — | Analista de Nómina\nA2 Diseñar modelo de datos | 8 días | A1 | Arquitecto\nA3 Parametrizar reglas del motor de liquidación | 20 días | A2 | Desarrollador 1\nA4 Migrar datos históricos | 15 días | A2 | Desarrollador 2\nA5 Construir el portal de autoservicio | 18 días | A2 | Desarrollador 2\nA6 Pruebas integradas | 12 días | A3, A4, A5 | Analista de Calidad\nA7 Elaborar manual de operación y capacitar a 28 usuarios | 6 días | A6 | Analista de Nómina',
      reglas: [
        { r: 'minLineas', n: 6, etiqueta: 'Al menos seis actividades' },
        { r: 'lineasCon', patron: 'cifra', min: 0.8, etiqueta: 'Duraciones estimadas', peso: 2 },
        { r: 'columnas', n: 3, etiqueta: 'Actividad, duración y dependencia', peso: 2 }
      ]
    },
    {
      id: 'ruta_critica', etiqueta: 'Ruta crítica y holguras', tipo: 'texto', peso: 3,
      ayuda: 'Qué cadena de actividades determina la duración total y cuánta holgura tienen las demás.',
      guia: [
        'La ruta crítica es la secuencia más larga; sus actividades tienen holgura cero.',
        'Comprimir una actividad fuera de la ruta crítica no adelanta nada: es gasto puro.',
        'Nombra las actividades de la ruta, no solo su existencia.'
      ],
      pistas: ['ruta crítica', 'holgura', 'camino crítico', 'compresión', 'intensificación'],
      ejemplo: 'Ruta crítica: A1 → A2 → A3 → A6 → A7, con duración de 56 días y holgura cero. A4 (migración) tiene 5 días de holgura libre y A5 (portal) tiene 2 días. Si hay que recuperar tiempo se comprime A3 añadiendo un desarrollador; la ejecución rápida se descarta por la dependencia obligatoria entre A2 y A3. Comprimir A4 o A5 no adelantaría la fecha de fin: sería gasto sin efecto.',
      reglas: [
        { r: 'incluye', claves: ['ruta crítica', 'ruta critica', 'camino crítico', 'crítica'], etiqueta: 'Ruta crítica identificada', peso: 2 },
        { r: 'incluye', claves: ['holgura', 'flotante', 'margen'], etiqueta: 'Holguras analizadas' },
        { r: 'cifras', n: 1, etiqueta: 'Duraciones cuantificadas' },
        { r: 'minPalabras', n: 25, etiqueta: 'Análisis desarrollado' }
      ]
    },
    {
      id: 'control_tiempo', etiqueta: 'Control del cronograma', tipo: 'texto', peso: 2,
      ayuda: 'Con qué frecuencia se mide el avance, con qué indicador y qué desviación dispara acción.',
      guia: [
        'Define el umbral de SPI o de días de desviación que obliga a actuar.',
        'Di quién actualiza el cronograma y cuándo.'
      ],
      pistas: ['control del cronograma', 'seguimiento', 'avance', 'spi', 'retraso'],
      ejemplo: 'El director actualiza el cronograma cada viernes con el avance reportado por los responsables. Se calcula SPI quincenalmente. Un SPI menor a 0,95 obliga a presentar plan de recuperación en la siguiente reunión semanal; menor a 0,90 escala al comité. Una desviación mayor a 10 días en la ruta crítica se tramita como solicitud de cambio.',
      reglas: [
        { r: 'incluye', claves: ['spi', 'avance', 'desviación', 'umbral', 'seguimiento'], etiqueta: 'Indicador de control' },
        { r: 'incluye', claves: ['semanal', 'quincenal', 'mensual', 'diario', 'cada'], etiqueta: 'Frecuencia definida' },
        { r: 'minPalabras', n: 25, etiqueta: 'Mecanismo descrito' }
      ]
    }
  ]
},

/* ══════════ 5 · FINANZAS ══════════ */
{
  id: 'fin', n: '5', nombre: 'Finanzas y presupuesto',
  lema: 'Costo, reservas y salud económica',
  dominio: 'finanzas', areas: ['planificacion', 'monitoreo'],
  proposito:
    'Estimar el costo, construir el presupuesto con sus reservas y definir cómo se mide la salud económica ' +
    'mientras el proyecto avanza. Distinguir contingencia de gestión es lo que separa un presupuesto de una cifra.',
  fundamento: ['d-finanzas', 'p-fin-02', 'p-fin-03', 'p-fin-04'],
  procesos: ['p-fin-01', 'p-fin-02', 'p-fin-03', 'p-fin-04'],
  campos: [
    {
      id: 'total', etiqueta: 'Presupuesto total', tipo: 'corto', peso: 3,
      ayuda: 'Importe total con moneda, indicando qué incluye: costo base más reservas.',
      pistas: ['presupuesto', 'costo total', 'inversión', 'valor del proyecto'],
      ejemplo: 'Presupuesto total autorizado: 45.000 USD, compuesto por 37.000 USD de costo base, 5.500 USD de reserva de contingencia y 2.500 USD de reserva de gestión.',
      reglas: [
        { r: 'dinero', n: 1, etiqueta: 'Importe con moneda', peso: 2 },
        { r: 'minPalabras', n: 8, etiqueta: 'Composición indicada' }
      ]
    },
    {
      id: 'partidas', etiqueta: 'Partidas de costo y base de estimación', tipo: 'tabla', peso: 4,
      formato: 'Partida | Importe | Base de estimación',
      ayuda: 'Una partida por línea. La base de estimación dice de dónde sale el número: sin ella es una adivinanza con dos decimales.',
      guia: [
        'Bases válidas: cotización recibida, histórico de proyectos similares, estimación análoga, paramétrica, tres valores (PERT).',
        'Las partidas deben sumar el costo base declarado arriba.',
        'Incluye el costo de gestión del proyecto: siempre existe y casi siempre se olvida.'
      ],
      pistas: ['costos', 'partidas', 'presupuesto detallado', 'estimación de costos', 'rubros'],
      ejemplo: 'Licencias de la plataforma | 12.000 USD | Cotización del proveedor del 12/03/2026\nDesarrollo (2 personas × 5 meses) | 15.000 USD | Tarifa interna 1.500 USD por persona y mes\nMigración de datos | 4.000 USD | Estimación análoga: proyecto de cartera 2024 costó 3.800 USD\nCapacitación de 28 usuarios | 2.500 USD | Paramétrica: 90 USD por usuario\nGestión del proyecto | 3.500 USD | 10 % del costo base, histórico de la PMO',
      reglas: [
        { r: 'minLineas', n: 4, etiqueta: 'Al menos cuatro partidas' },
        { r: 'lineasCon', patron: 'dinero', min: 0.8, etiqueta: 'Importes por partida', peso: 2 },
        { r: 'columnas', n: 3, etiqueta: 'Partida, importe y base', peso: 2 },
        { r: 'incluye', claves: ['cotización', 'cotizacion', 'histórico', 'historico', 'análoga', 'analoga', 'paramétrica', 'parametrica', 'pert', 'tarifa', 'ascendente'], etiqueta: 'Método de estimación nombrado' }
      ]
    },
    {
      id: 'reservas', etiqueta: 'Reservas de contingencia y de gestión', tipo: 'texto', peso: 3,
      ayuda: 'Dos reservas, dos autoridades. Contingencia cubre riesgos identificados y la usa el director; gestión cubre lo desconocido y la libera el patrocinador.',
      guia: [
        'Indica el importe de cada reserva y de dónde sale: suma del valor monetario esperado de los riesgos, o porcentaje justificado.',
        'Di quién autoriza el uso de cada una.',
        'La contingencia forma parte de la línea base de costos; la de gestión no.'
      ],
      pistas: ['reserva', 'contingencia', 'reserva de gestión', 'imprevistos'],
      ejemplo: 'Reserva de contingencia: 5.500 USD, calculada como la suma del valor monetario esperado de los 6 riesgos priorizados. La usa el director del proyecto y reporta su consumo en el informe quincenal; forma parte de la línea base de costos. Reserva de gestión: 2.500 USD, cerca del 7 % del costo base, para riesgos no identificados; la libera únicamente la patrocinadora y queda fuera de la línea base.',
      reglas: [
        { r: 'incluye', claves: ['contingencia'], etiqueta: 'Reserva de contingencia', peso: 2 },
        { r: 'incluye', claves: ['gestión', 'gestion'], etiqueta: 'Reserva de gestión', peso: 2 },
        { r: 'dinero', n: 2, etiqueta: 'Importes de ambas reservas', peso: 2 },
        { r: 'incluye', claves: ['autoriza', 'libera', 'aprueba', 'director', 'patrocinador'], etiqueta: 'Autoridad de uso' }
      ]
    },
    {
      id: 'control_costos', etiqueta: 'Control de costos', tipo: 'texto', peso: 3,
      ayuda: 'Con qué técnica se mide el desempeño del costo, cada cuánto y con qué umbral de acción.',
      guia: [
        'Si usas valor ganado, nombra los indicadores: CPI, SPI, EAC, y qué valor dispara acción.',
        'Indica quién consolida el costo real y con qué fuente contable.'
      ],
      pistas: ['control de costos', 'valor ganado', 'cpi', 'seguimiento financiero', 'ejecución presupuestal'],
      ejemplo: 'Medición quincenal por valor ganado con datos del sistema contable consolidados por el analista financiero. Se reportan CPI, SPI y EAC. CPI por debajo de 0,95 obliga a plan de acción del director; por debajo de 0,90 se escala al comité con tres opciones cuantificadas. Cualquier desviación del costo base superior al 10 % se tramita como solicitud de cambio.',
      reglas: [
        { r: 'incluye', claves: ['valor ganado', 'cpi', 'eac', 'ejecución presupuestal', 'variación', 'curva s'], etiqueta: 'Técnica de medición', peso: 2 },
        { r: 'incluye', claves: ['umbral', 'supera', 'por debajo', 'mayor a', 'menor a', '%'], etiqueta: 'Umbral de acción' },
        { r: 'minPalabras', n: 25, etiqueta: 'Control descrito' }
      ]
    },
    {
      id: 'financiacion', etiqueta: 'Fuente de financiación y desembolsos', tipo: 'texto', peso: 1,
      ayuda: 'De dónde sale el dinero y en qué momentos entra. Un proyecto financiado a destiempo se detiene aunque tenga presupuesto.',
      pistas: ['financiación', 'financiamiento', 'desembolso', 'flujo de caja', 'fuente de recursos'],
      ejemplo: 'Financiado con el rubro de inversión tecnológica 2026. Desembolsos: 40 % a la firma del contrato con el proveedor (mayo), 40 % al superar las pruebas de aceptación (noviembre) y 20 % al cierre (diciembre).',
      reglas: [
        { r: 'minPalabras', n: 15, etiqueta: 'Financiación descrita' },
        { r: 'cifras', n: 1, etiqueta: 'Momentos o montos de desembolso' }
      ]
    }
  ]
},

/* ══════════ 6 · INTERESADOS ══════════ */
{
  id: 'int', n: '6', nombre: 'Interesados y comunicaciones',
  lema: 'Personas, influencia y flujo de información',
  dominio: 'interesados', areas: ['planificacion', 'ejecucion', 'monitoreo'],
  proposito:
    'Identificar a quien puede afectar o verse afectado por el proyecto, decidir cómo involucrarlo y ' +
    'establecer qué información recibe, cuándo y por qué canal. El interesado que aparece tarde es el que más cuesta.',
  fundamento: ['d-interesados', 'pr-6', 'p-int-01', 'p-int-03'],
  procesos: ['p-int-01', 'p-int-02', 'p-int-03', 'p-int-04', 'p-int-05', 'p-int-06', 'p-int-07'],
  campos: [
    {
      id: 'registro', etiqueta: 'Registro de interesados', tipo: 'tabla', peso: 4,
      formato: 'Interesado | Rol | Interés en el proyecto | Poder (1-5) | Influencia (1-5) | Estrategia',
      ayuda: 'Una fila por interesado. Valora poder e influencia en escala 1 a 5: sin valoración no hay priorización posible.',
      guia: [
        'Incluye siempre al patrocinador, a los usuarios finales y a quienes pueden bloquear: legal, compras, auditoría, sindicato.',
        'Los interesados externos y los detractores son los que más se olvidan y más cuestan.',
        'La estrategia se deduce del cuadrante: gestionar de cerca, mantener satisfecho, mantener informado, monitorear.'
      ],
      pistas: ['interesados', 'stakeholders', 'involucrados', 'actores', 'partes interesadas'],
      ejemplo: 'Directora de Talento Humano | Patrocinadora | Reducir costo administrativo | 5 | 5 | Gestionar de cerca: comité mensual y decisión sobre reservas\nJefe de Nómina | Usuario clave y aceptante | Que la liquidación no falle | 4 | 5 | Gestionar de cerca: validación de cada entregable\n14 jefes de sede | Usuarios finales | Acceso simple a colillas | 2 | 4 | Mantener informado: boletín mensual y 4 sesiones de capacitación\nÁrea de Auditoría | Control | Trazabilidad por 5 años | 4 | 2 | Mantener satisfecho: revisión de diseño y auditoría de proceso\nProveedor de la plataforma | Ejecutor externo | Cumplir contrato | 3 | 4 | Gestionar de cerca: reunión quincenal de avance\nSindicato de empleados | Afectado | Que no cambien condiciones de pago | 3 | 3 | Mantener informado: comunicación previa a la puesta en producción',
      reglas: [
        { r: 'minLineas', n: 5, etiqueta: 'Al menos cinco interesados' },
        { r: 'columnas', n: 4, etiqueta: 'Rol, interés y valoración', peso: 2 },
        { r: 'lineasCon', patron: 'cifra', min: 0.8, etiqueta: 'Poder e influencia valorados', peso: 2 },
        { r: 'incluye', claves: ['patrocinador', 'patrocinadora', 'sponsor'], etiqueta: 'Patrocinador registrado', peso: 2 }
      ]
    },
    {
      id: 'analisis', etiqueta: 'Análisis y conclusiones', tipo: 'texto', peso: 2,
      ayuda: 'Qué te dice la matriz poder-interés: quién es crítico, quién puede bloquear y qué harás al respecto.',
      guia: [
        'No repitas la tabla: extrae conclusiones y decisiones.',
        'Nombra al interesado con más capacidad de bloqueo y la acción concreta prevista.'
      ],
      pistas: ['análisis de interesados', 'matriz de poder', 'clasificación', 'priorización'],
      ejemplo: 'Tres interesados concentran el riesgo: la patrocinadora, única autoridad sobre reservas y con agenda saturada, por lo que el comité se fija el primer martes con seis meses de antelación; el Jefe de Nómina, que acepta todos los entregables y tiene alta carga en cierre de mes, por lo que las revisiones se programan entre los días 5 y 12; y Auditoría, que puede bloquear la puesta en producción si la trazabilidad no cumple, por lo que se la involucra desde el diseño y no al final.',
      reglas: [
        { r: 'minPalabras', n: 35, etiqueta: 'Análisis desarrollado' },
        { r: 'sinVaguedad' }
      ]
    },
    {
      id: 'comunicaciones', etiqueta: 'Plan de comunicaciones', tipo: 'tabla', peso: 4,
      formato: 'Qué se comunica | A quién | Cuándo o frecuencia | Canal | Responsable',
      ayuda: 'Una fila por flujo de comunicación. Sin responsable o sin frecuencia, el plan no se ejecuta.',
      guia: [
        'Cada interesado del registro debe aparecer al menos una vez aquí.',
        'Incluye la comunicación de malas noticias: cómo y con qué rapidez se informa una desviación.',
        'Distingue informar, que es una vía, de consultar, que son dos.'
      ],
      pistas: ['comunicación', 'comunicaciones', 'informes', 'reportes', 'reuniones'],
      ejemplo: 'Informe de desempeño con avance, CPI, SPI y riesgos | Comité de proyecto | Quincenal, viernes | Documento PDF por correo | Director del proyecto\nReunión de seguimiento | Equipo del proyecto | Semanal, lunes 9:00 | Presencial o videollamada | Director del proyecto\nBoletín de avance | 14 jefes de sede | Mensual | Correo e intranet | Analista de Nómina\nAlerta de desviación crítica | Patrocinadora, Directora de Talento Humano | Dentro de las 24 horas de detectada | Llamada y correo | Director del proyecto\nActa de aceptación de entregable | Jefe de Nómina | Al cierre de cada entregable | Documento firmado | Analista de Calidad\nRevisión de trazabilidad y hallazgos | Área de Auditoría | Al cierre de Diseño y de Construcción | Sesión de revisión con acta | Analista de Calidad\nAvance contractual e incidencias | Proveedor de la plataforma | Quincenal, miércoles | Videollamada y minuta | Área de Compras\nComunicación de cambios en el proceso de pago | Sindicato de empleados | 15 días antes de la puesta en producción | Reunión informativa y circular | Directora de Talento Humano',
      reglas: [
        { r: 'minLineas', n: 4, etiqueta: 'Al menos cuatro flujos' },
        { r: 'columnas', n: 4, etiqueta: 'Qué, a quién, cuándo y responsable', peso: 2 },
        { r: 'incluye', claves: ['semanal', 'quincenal', 'mensual', 'diaria', 'diario', 'horas', 'al cierre'], etiqueta: 'Frecuencias definidas' }
      ]
    },
    {
      id: 'involucramiento', etiqueta: 'Involucramiento: nivel actual y deseado', tipo: 'texto', peso: 2,
      ayuda: 'Para los interesados críticos: en qué nivel están hoy (reticente, neutral, partidario) y a cuál hay que llevarlos.',
      guia: [
        'Escala habitual: desconocedor, reticente, neutral, partidario, líder.',
        'Si actual y deseado coinciden, la acción es mantener, no mejorar.',
        'Define cómo se mide el movimiento: no basta con intuirlo.'
      ],
      pistas: ['involucramiento', 'compromiso', 'engagement', 'nivel de participación'],
      ejemplo: 'Sindicato: actual reticente, deseado neutral. Acción: sesión informativa previa a la puesta en producción mostrando que las condiciones de pago no cambian; se mide con la ausencia de comunicados en contra. Jefes de sede: actual neutral, deseado partidario, porque su adopción determina el beneficio; se mide con el porcentaje de colillas descargadas desde el portal, con meta de 70 % al mes 3. Auditoría: actual neutral, deseado partidario; se mide con su visto bueno documentado en la revisión de diseño.',
      reglas: [
        { r: 'incluye', claves: ['reticente', 'neutral', 'partidario', 'líder', 'lider', 'desconocedor', 'actual', 'deseado'], etiqueta: 'Niveles declarados', peso: 2 },
        { r: 'minPalabras', n: 30, etiqueta: 'Acciones descritas' }
      ]
    }
  ]
},

/* ══════════ 7 · RECURSOS ══════════ */
{
  id: 'rec', n: '7', nombre: 'Recursos y equipo',
  lema: 'Quién hace el trabajo y con qué medios',
  dominio: 'recursos', areas: ['planificacion', 'ejecucion', 'monitoreo'],
  proposito:
    'Definir el equipo, sus responsabilidades sobre cada entregable, los recursos físicos necesarios y lo que ' +
    'se adquiere fuera. Un entregable sin responsable único es un entregable sin dueño.',
  fundamento: ['d-recursos', 'pr-4', 'p-rec-02', 'p-rec-04'],
  procesos: ['p-rec-01', 'p-rec-02', 'p-rec-03', 'p-rec-04', 'p-rec-05', 'p-gob-03'],
  campos: [
    {
      id: 'equipo', etiqueta: 'Equipo del proyecto', tipo: 'tabla', peso: 4,
      formato: 'Rol | Persona o perfil | Dedicación | Responsabilidad principal',
      ayuda: 'Un rol por línea con su dedicación en porcentaje o en horas por semana. La dedicación sin cifra es una promesa vacía.',
      guia: [
        'Incluye a quienes no son del equipo pero dedican tiempo: usuarios clave, área de calidad, proveedor.',
        'Si una persona ocupa dos roles, decláralo: la suma de sus dedicaciones no puede superar el 100 %.',
        'Indica de quién depende jerárquicamente cada persona si la estructura es matricial.'
      ],
      pistas: ['equipo', 'recursos humanos', 'roles', 'personal', 'organigrama'],
      ejemplo: 'Director del proyecto | Coordinador de Sistemas | 50 % | Planificación, control y comité\nArquitecto | Contratista externo | 30 % durante 3 meses | Modelo de datos y diseño de integración\nDesarrollador 1 | Equipo interno de Sistemas | 100 % | Parametrización de reglas de liquidación\nDesarrollador 2 | Equipo interno de Sistemas | 100 % | Migración de datos y portal\nAnalista de Calidad | Área de Calidad | 40 % desde el mes 4 | Pruebas y actas de aceptación\nAnalista de Nómina | Talento Humano | 20 % | Validación funcional y capacitación',
      reglas: [
        { r: 'minLineas', n: 4, etiqueta: 'Al menos cuatro roles' },
        { r: 'columnas', n: 3, etiqueta: 'Rol, perfil y responsabilidad', peso: 2 },
        { r: 'lineasCon', patron: 'cifra', min: 0.7, etiqueta: 'Dedicación cuantificada', peso: 2 }
      ]
    },
    {
      id: 'raci', etiqueta: 'Matriz de responsabilidades (RACI)', tipo: 'tabla', peso: 3,
      formato: 'Entregable o paquete | R (hace) | A (responde) | C (consultado) | I (informado)',
      ayuda: 'Una fila por entregable. Regla de oro: exactamente una A por fila. Dos responsables finales equivalen a ninguno.',
      guia: [
        'R puede ser más de uno; A nunca.',
        'Usa los mismos nombres de entregable que en la sección de Alcance.',
        'Si una fila no tiene C ni I, probablemente falte alguien del registro de interesados.'
      ],
      pistas: ['raci', 'matriz de responsabilidades', 'responsabilidades', 'asignación'],
      ejemplo: 'Motor de liquidación migrado | Desarrollador 1 | Director del proyecto | Jefe de Nómina | Patrocinadora\nMigración de datos históricos | Desarrollador 2 | Director del proyecto | Auditoría | Jefe de Nómina\nPortal de autoservicio | Desarrollador 2 | Director del proyecto | Jefes de sede | Patrocinadora\nPruebas de aceptación | Analista de Calidad | Jefe de Nómina | Director del proyecto | Patrocinadora\nCapacitación | Analista de Nómina | Directora de Talento Humano | Jefes de sede | Comité',
      reglas: [
        { r: 'minLineas', n: 3, etiqueta: 'Al menos tres entregables asignados' },
        { r: 'columnas', n: 4, etiqueta: 'Cuatro roles por fila', peso: 2 }
      ]
    },
    {
      id: 'fisicos', etiqueta: 'Recursos físicos y materiales', tipo: 'lista', peso: 2,
      ayuda: 'Equipos, licencias, espacios y materiales, con cantidad y momento en que se necesitan.',
      guia: [
        'Indica cuándo se necesita cada recurso: disponerlo tarde equivale a no tenerlo.',
        'Si el proyecto no requiere recursos físicos, dilo explícitamente y justifica.'
      ],
      pistas: ['recursos físicos', 'materiales', 'equipos', 'infraestructura', 'licencias'],
      ejemplo: '2 ambientes de servidor, pruebas y producción, disponibles desde el 1 de junio de 2026.\n35 licencias de la plataforma de nómina, adquiridas antes del 15 de mayo de 2026.\nSala de capacitación con 15 puestos, 4 sesiones entre el 9 y el 20 de noviembre de 2026.\n1 herramienta de migración de datos con licencia temporal de 3 meses.',
      reglas: [
        { r: 'minLineas', n: 2, etiqueta: 'Recursos enumerados' },
        { r: 'lineasCon', patron: 'cifra', min: 0.7, etiqueta: 'Cantidades indicadas' }
      ]
    },
    {
      id: 'desarrollo', etiqueta: 'Desarrollo del equipo y reglas de trabajo', tipo: 'texto', peso: 2,
      ayuda: 'Cómo se forma, se coordina y se evalúa al equipo; acuerdos de trabajo y manejo de conflictos.',
      guia: [
        'Incluye las brechas de competencia detectadas y cómo se cubren.',
        'Los acuerdos de trabajo evitan la mitad de los conflictos: franjas de disponibilidad, canales, definición de terminado.',
        'Di cómo se resuelve un desacuerdo técnico y en qué plazo.'
      ],
      pistas: ['desarrollo del equipo', 'capacitación del equipo', 'liderazgo', 'acuerdos de trabajo', 'conflictos'],
      ejemplo: 'Brecha detectada: nadie del equipo interno conoce la herramienta de migración; se cubre con 16 horas de formación del proveedor en la semana 3. Acuerdos: franja común de disponibilidad de 9:00 a 13:00, tablero de tareas actualizado antes de las 17:00, definición de terminado que exige pruebas unitarias y revisión por pares. Los desacuerdos técnicos los resuelve el arquitecto en 48 horas; si persisten, decide el director.',
      reglas: [
        { r: 'incluye', claves: ['capacitación', 'formación', 'brecha', 'competencia', 'entrenamiento'], etiqueta: 'Desarrollo de competencias' },
        { r: 'incluye', claves: ['acuerdo', 'regla', 'norma', 'conflicto', 'definición de terminado'], etiqueta: 'Reglas de trabajo' },
        { r: 'minPalabras', n: 30, etiqueta: 'Descripción suficiente' }
      ]
    },
    {
      id: 'adquisiciones', etiqueta: 'Adquisiciones', tipo: 'texto', peso: 2,
      ayuda: 'Qué se compra o contrata fuera, con qué tipo de contrato y por qué ese tipo.',
      guia: [
        'Precio fijo traslada el riesgo al proveedor y exige alcance cerrado; costo reembolsable lo retiene el comprador; tiempo y materiales sirve para alcance incierto y corto.',
        'Indica los criterios de selección y quién administra el contrato.',
        'Si no hay adquisiciones, decláralo: es una decisión, no un olvido.'
      ],
      pistas: ['adquisiciones', 'compras', 'contratación', 'proveedores', 'contrato'],
      ejemplo: 'Se contrata la plataforma de nómina y su implantación bajo precio fijo cerrado, 12.000 USD en licencias más 8.000 USD de implantación, porque el alcance está definido por los requisitos R-01 a R-12 y conviene trasladar el riesgo de sobrecosto al proveedor. El arquitecto externo se contrata por tiempo y materiales, 30 % de dedicación durante 3 meses, por tratarse de trabajo exploratorio. Criterios de selección: experiencia verificable en 3 implantaciones similares con peso de 40 %, precio 35 % y plazo 25 %. Administra el contrato el área de Compras con visto bueno técnico del director.',
      reglas: [
        { r: 'incluye', claves: ['precio fijo', 'costo reembolsable', 'tiempo y materiales', 'contrato', 'llave en mano', 'no aplica', 'no se requieren'], etiqueta: 'Tipo de contrato o decisión declarada', peso: 2 },
        { r: 'minPalabras', n: 25, etiqueta: 'Decisión justificada' }
      ]
    }
  ]
},

/* ══════════ 8 · RIESGOS ══════════ */
{
  id: 'rie', n: '8', nombre: 'Riesgos e incertidumbre',
  lema: 'Amenazas, oportunidades y umbrales',
  dominio: 'riesgos', areas: ['planificacion', 'ejecucion', 'monitoreo'],
  proposito:
    'Identificar lo que puede desviar el proyecto, valorarlo, decidir la respuesta y asignar un dueño. ' +
    'Un riesgo sin respuesta y sin responsable no está gestionado: está anotado.',
  fundamento: ['d-riesgos', 'pr-1', 'p-rie-02', 'p-rie-04'],
  procesos: ['p-rie-01', 'p-rie-02', 'p-rie-03', 'p-rie-04', 'p-rie-05', 'p-rie-06'],
  campos: [
    {
      id: 'registro', etiqueta: 'Registro de riesgos', tipo: 'tabla', peso: 5,
      formato: 'Riesgo (causa, evento, efecto) | P (1-5) | I (1-5) | Respuesta | Responsable',
      ayuda: 'Un riesgo por línea con probabilidad e impacto valorados. Redáctalo como causa, evento incierto y efecto: así se distingue de un problema ya ocurrido.',
      guia: [
        'Estrategias para amenazas: evitar, transferir, mitigar, escalar, aceptar.',
        'P por I ordena la atención. Los riesgos con producto 12 o más exigen respuesta explícita y dueño nombrado.',
        'El responsable del riesgo es quien vigila el disparador, no necesariamente quien ejecuta la respuesta.'
      ],
      pistas: ['riesgo', 'riesgos', 'matriz de riesgos', 'amenazas', 'contingencia'],
      ejemplo: 'Debido a la carga del cierre mensual, el Jefe de Nómina podría no validar a tiempo, retrasando la aceptación 2 semanas | 4 | 4 | Mitigar: programar revisiones entre los días 5 y 12 y designar suplente validador | Director del proyecto\nDebido a la antigüedad del sistema legado, la migración podría arrojar inconsistencias, provocando reproceso de 3 semanas | 3 | 5 | Mitigar: conciliación por muestreo en la semana 2 de migración y ambiente de pruebas dedicado | Desarrollador 2\nDebido a la dependencia del proveedor, el ambiente de pruebas podría entregarse tarde, retrasando toda la fase | 3 | 4 | Transferir: cláusula de penalización por día de retraso en el contrato | Área de Compras\nDebido a cambios normativos de retención, las reglas parametrizadas podrían quedar obsoletas antes de producción | 2 | 4 | Aceptar activamente: reserva de 1.200 USD para reparametrización | Analista de Nómina\nDebido a la rotación del equipo interno, un desarrollador podría salir, perdiendo 4 semanas de curva de aprendizaje | 2 | 3 | Mitigar: documentación de decisiones y programación por pares | Director del proyecto',
      reglas: [
        { r: 'minLineas', n: 5, etiqueta: 'Al menos cinco riesgos' },
        { r: 'columnas', n: 4, etiqueta: 'Riesgo, valoración, respuesta y responsable', peso: 2 },
        { r: 'lineasCon', patron: 'cifra', min: 0.8, etiqueta: 'Probabilidad e impacto valorados', peso: 2 },
        { r: 'incluye', claves: ['mitigar', 'evitar', 'transferir', 'aceptar', 'escalar', 'explotar', 'compartir', 'mejorar'], etiqueta: 'Estrategias de respuesta nombradas', peso: 2 }
      ]
    },
    {
      id: 'umbrales', etiqueta: 'Apetito de riesgo y umbrales de escalamiento', tipo: 'texto', peso: 2,
      ayuda: 'Cuánta desviación tolera la organización y a partir de qué punto un riesgo deja de gestionarse en el proyecto.',
      guia: [
        'Se escala un riesgo cuando su respuesta está fuera de la autoridad del director, no cuando es grande.',
        'Expresa los umbrales con números: producto P por I, importe, días.'
      ],
      pistas: ['apetito de riesgo', 'tolerancia', 'umbral', 'escalamiento'],
      ejemplo: 'Tolerancia: desviaciones de hasta 10 días y 3.000 USD las absorbe el proyecto con la reserva de contingencia. Un riesgo con producto de probabilidad por impacto igual o mayor a 16, o cuya respuesta cueste más de 3.000 USD, se escala a la patrocinadora en la siguiente sesión del comité, o de forma extraordinaria si el disparador es inminente. Los riesgos que afectan al cumplimiento normativo se escalan siempre, sin importar su valoración.',
      reglas: [
        { r: 'cifras', n: 2, etiqueta: 'Umbrales cuantificados', peso: 2 },
        { r: 'incluye', claves: ['escala', 'escalamiento', 'tolerancia', 'apetito', 'umbral'], etiqueta: 'Regla de escalamiento' },
        { r: 'minPalabras', n: 25, etiqueta: 'Descripción suficiente' }
      ]
    },
    {
      id: 'oportunidades', etiqueta: 'Oportunidades (riesgos positivos)', tipo: 'lista', peso: 2,
      ayuda: 'Riesgos de efecto favorable con su estrategia: explotar, mejorar, compartir o aceptar.',
      guia: [
        'La mayoría de los registros solo listan amenazas. Media gestión de riesgos es media gestión.',
        'Una oportunidad también necesita responsable y disparador.'
      ],
      pistas: ['oportunidad', 'oportunidades', 'riesgos positivos'],
      ejemplo: 'Si la migración termina antes de lo previsto, se puede adelantar la capacitación y liberar al equipo 2 semanas antes | Explotar: preparar el material de capacitación desde el mes 4 | Analista de Nómina\nEl proveedor ofrece un módulo de certificados sin costo adicional si se firma antes de junio, lo que cubriría el requisito R-03 | Mejorar: adelantar la negociación a mayo | Área de Compras',
      reglas: [
        { r: 'minLineas', n: 2, etiqueta: 'Al menos dos oportunidades' },
        { r: 'incluye', claves: ['explotar', 'mejorar', 'compartir', 'aceptar'], etiqueta: 'Estrategia de oportunidad', peso: 2 }
      ]
    },
    {
      id: 'monitoreo', etiqueta: 'Monitoreo de riesgos', tipo: 'texto', peso: 2,
      ayuda: 'Cada cuánto se revisa el registro, quién lo hace y cómo se detectan riesgos nuevos.',
      guia: [
        'Un registro que no se revisa envejece en semanas.',
        'Incluye la reevaluación al cerrar cada fase y la revisión de riesgos secundarios y residuales.'
      ],
      pistas: ['monitoreo de riesgos', 'seguimiento de riesgos', 'revisión de riesgos'],
      ejemplo: 'El registro se revisa en la reunión semanal del equipo: estado de disparadores, riesgos materializados y nuevos. Reevaluación completa al cierre de cada fase, con recálculo de la reserva de contingencia. Cada riesgo materializado se documenta como incidente con su causa raíz y alimenta las lecciones aprendidas. El consumo de contingencia se reporta en el informe quincenal.',
      reglas: [
        { r: 'incluye', claves: ['semanal', 'quincenal', 'mensual', 'cada fase', 'periódic'], etiqueta: 'Frecuencia de revisión' },
        { r: 'minPalabras', n: 25, etiqueta: 'Mecanismo descrito' }
      ]
    }
  ]
},

/* ══════════ 9 · PRINCIPIOS ══════════ */
{
  id: 'pri', n: '9', nombre: 'Verificación de los seis principios',
  lema: 'La prueba de que el plan tiene criterio, no solo formato',
  dominio: null, areas: [],
  esPrincipios: true,
  proposito:
    'Los principios no son procesos: son criterios de juicio. Esta sección obliga a mostrar en qué decisión concreta ' +
    'del proyecto se materializó cada uno. Un plan puede tener los siete dominios completos y seguir siendo malo si ' +
    'ninguna decisión se tomó con criterio.',
  fundamento: ['pr-1', 'pr-2', 'pr-3', 'pr-4', 'pr-5', 'pr-6'],
  procesos: [],
  campos: [
    { id: 'pr-1', etiqueta: 'Adoptar una visión holística', tipo: 'texto', peso: 2, principio: 'pr-1',
      ayuda: 'Qué decisión del proyecto consideró efectos fuera de su propio dominio.',
      pistas: ['visión holística', 'sistémico', 'interacciones'],
      ejemplo: 'La fecha de puesta en producción se fijó el día 16 y no a fin de mes porque el ciclo de nómina, la disponibilidad de Auditoría y el cierre contable interactúan: adelantarla habría ahorrado 5 días de cronograma y generado 3 semanas de conciliación manual.',
      reglas: [{ r: 'minPalabras', n: 25, etiqueta: 'Evidencia concreta' }, { r: 'sinVaguedad' }] },
    { id: 'pr-2', etiqueta: 'Centrarse en el valor', tipo: 'texto', peso: 2, principio: 'pr-2',
      ayuda: 'Cómo se trazó el alcance al beneficio y qué se dejó fuera por no aportar valor.',
      pistas: ['valor', 'beneficio'],
      ejemplo: 'Cada requisito se trazó al beneficio declarado. R-04, la firma digital de la colilla, se movió a opcional porque no incide en los 6 días de cierre ni en los errores de liquidación, que son las dos métricas del caso de negocio.',
      reglas: [{ r: 'minPalabras', n: 25, etiqueta: 'Evidencia concreta' }, { r: 'sinVaguedad' }] },
    { id: 'pr-3', etiqueta: 'Incorporar la calidad en procesos y entregables', tipo: 'texto', peso: 2, principio: 'pr-3',
      ayuda: 'Dónde se acordaron los criterios de aceptación antes de construir y qué se previene con ello.',
      pistas: ['calidad', 'criterios de aceptación', 'prevención'],
      ejemplo: 'Los criterios de aceptación de los tres entregables se acordaron y firmaron en la fase de diseño, antes de escribir código. La conciliación por muestreo en la semana 2 de migración detecta inconsistencias cuando corregirlas cuesta horas y no semanas.',
      reglas: [{ r: 'minPalabras', n: 25, etiqueta: 'Evidencia concreta' }, { r: 'sinVaguedad' }] },
    { id: 'pr-4', etiqueta: 'Ser un líder responsable', tipo: 'texto', peso: 2, principio: 'pr-4',
      ayuda: 'Cómo se ejerce la responsabilidad: transparencia ante malas noticias, cumplimiento y trato al equipo.',
      pistas: ['liderazgo', 'responsabilidad', 'ética'],
      ejemplo: 'Toda desviación crítica se comunica a la patrocinadora dentro de las 24 horas de detectada, con opciones cuantificadas y recomendación. El contratista externo se seleccionó con criterios publicados y el director se abstiene de participar en la evaluación de un proveedor con el que tuvo relación laboral.',
      reglas: [{ r: 'minPalabras', n: 25, etiqueta: 'Evidencia concreta' }, { r: 'sinVaguedad' }] },
    { id: 'pr-5', etiqueta: 'Integrar la sostenibilidad', tipo: 'texto', peso: 2, principio: 'pr-5',
      ayuda: 'Qué decisión evitó trasladar el costo a terceros, al entorno o al futuro.',
      pistas: ['sostenibilidad', 'impacto', 'ambiental', 'social'],
      ejemplo: 'El sistema legado se conserva consultable en lugar de migrar 8 años de historia: ahorra 3 semanas de proceso y evita duplicar 400 GB de almacenamiento. La capacitación es presencial por sede y no centralizada, lo que suprime 28 viajes y deja la competencia instalada en cada sede.',
      reglas: [{ r: 'minPalabras', n: 25, etiqueta: 'Evidencia concreta' }, { r: 'sinVaguedad' }] },
    { id: 'pr-6', etiqueta: 'Construir una cultura de empoderamiento', tipo: 'texto', peso: 2, principio: 'pr-6',
      ayuda: 'Qué decisiones toma el equipo sin pedir permiso, y con qué límites y red de seguridad.',
      pistas: ['equipo', 'autonomía', 'decisiones', 'empoderamiento'],
      ejemplo: 'El equipo decide el diseño técnico sin aprobación previa mientras respete el modelo de datos y el presupuesto de la partida; el arquitecto resuelve los desacuerdos en 48 horas. Los errores detectados en la conciliación semanal se corrigen sin escalar y se registran como lección, no como falta.',
      reglas: [{ r: 'minPalabras', n: 25, etiqueta: 'Evidencia concreta' }, { r: 'sinVaguedad' }] }
  ]
},

/* ══════════ 10 · CIERRE ══════════ */
{
  id: 'cie', n: '10', nombre: 'Cierre y realización de beneficios',
  lema: 'Terminar formalmente y comprobar que sirvió',
  dominio: 'gobernanza', areas: ['cierre'],
  proposito:
    'Cerrar el proyecto es un acto formal, no el momento en que se deja de trabajar. Y el beneficio se mide después ' +
    'del cierre: sin plan de medición, nadie sabrá jamás si el proyecto valió lo que costó.',
  fundamento: ['p-gob-09', 'pr-2', 'p-gob-06'],
  procesos: ['p-gob-09'],
  campos: [
    {
      id: 'criterios_cierre', etiqueta: 'Criterios de cierre', tipo: 'lista', peso: 3,
      ayuda: 'Condiciones que deben cumplirse para firmar el cierre. Una por línea, verificables.',
      guia: [
        'Deben remitir a los criterios de éxito y a la aceptación de todos los entregables.',
        'Incluye el cierre administrativo: contratos liquidados, pagos ejecutados, accesos revocados.'
      ],
      pistas: ['cierre', 'criterios de cierre', 'condiciones de cierre', 'finalización'],
      ejemplo: 'Los 3 entregables aceptados formalmente mediante acta firmada por su aceptante.\n3 ciclos de nómina consecutivos liquidados en el sistema nuevo en 3 días o menos y con menos de 2 errores.\nContrato con el proveedor liquidado y última factura pagada.\n28 usuarios capacitados con evaluación aprobada al 80 % o más.\nDocumentación técnica y manual de operación entregados al área de Sistemas.',
      reglas: [
        { r: 'minLineas', n: 3, etiqueta: 'Al menos tres criterios' },
        { r: 'lineasCon', patron: 'cifra', min: 0.5, etiqueta: 'Criterios verificables' }
      ]
    },
    {
      id: 'transferencia', etiqueta: 'Transferencia del resultado', tipo: 'texto', peso: 2,
      ayuda: 'A quién se entrega el producto, con qué soporte y durante cuánto tiempo se acompaña.',
      guia: [
        'Nombra al receptor operativo: el área que vivirá con el resultado.',
        'Define el periodo de acompañamiento y qué cubre.'
      ],
      pistas: ['transferencia', 'entrega final', 'operación', 'soporte', 'puesta en marcha'],
      ejemplo: 'El sistema se transfiere al área de Sistemas como responsable operativo y a Talento Humano como dueña funcional, con manual de operación, documentación técnica y 4 sesiones de capacitación. El proveedor acompaña con soporte de incidencias durante los 3 primeros ciclos de nómina; a partir del cuarto, la operación es autónoma con mesa de ayuda interna.',
      reglas: [
        { r: 'minPalabras', n: 25, etiqueta: 'Transferencia descrita' },
        { r: 'incluye', claves: ['soporte', 'acompañamiento', 'garantía', 'manual', 'capacitación', 'operación'], etiqueta: 'Soporte posterior definido' }
      ]
    },
    {
      id: 'beneficios', etiqueta: 'Medición de beneficios tras el cierre', tipo: 'texto', peso: 3,
      ayuda: 'Qué se medirá, cuándo, quién lo mide y contra qué línea base. Es la única prueba de que el proyecto creó valor.',
      guia: [
        'Los beneficios se realizan después del cierre: fija fechas posteriores a él.',
        'Usa las mismas métricas del caso de negocio; si cambian, no hay comparación posible.',
        'Nombra al responsable de medir, que normalmente no es el director del proyecto.'
      ],
      pistas: ['beneficios', 'realización de beneficios', 'medición posterior', 'valor entregado', 'roi'],
      ejemplo: 'La Directora de Talento Humano mide a los 3, 6 y 12 meses del cierre: días de cierre de nómina, con línea base 9 y meta 3; errores de liquidación por ciclo, con línea base 17,8 mensuales y meta menos de 2; y porcentaje de colillas descargadas desde el portal, con línea base 0 % y meta 70 %. Los resultados se reportan al comité de inversiones en marzo, junio y diciembre de 2027.',
      reglas: [
        { r: 'cifras', n: 2, etiqueta: 'Métricas con valores', peso: 2 },
        { r: 'incluye', claves: ['mes', 'meses', 'año', 'trimestre', 'cierre', 'posterior'], etiqueta: 'Momento de medición' },
        { r: 'minPalabras', n: 30, etiqueta: 'Plan de medición descrito' }
      ]
    },
    {
      id: 'lecciones', etiqueta: 'Lecciones aprendidas', tipo: 'lista', peso: 2,
      ayuda: 'Cómo y cuándo se capturan, dónde se guardan y quién las consultará. Una lección sin destinatario no sirve a nadie.',
      guia: [
        'Se capturan durante el proyecto, no solo al final: al cierre nadie recuerda el mes 2.',
        'Indica el repositorio concreto y el mecanismo de consulta en proyectos futuros.'
      ],
      pistas: ['lecciones aprendidas', 'retrospectiva', 'conocimiento', 'mejora continua'],
      ejemplo: 'Se registran al cierre de cada fase en una retrospectiva de 1 hora facilitada por el director.\nSe consolidan en el repositorio de la PMO con etiquetas por dominio para que sean recuperables.\nEl arranque de cualquier proyecto de la organización exige revisar las lecciones etiquetadas con su tipo de trabajo.\nLa lección del mes 2 sobre la disponibilidad del Jefe de Nómina ya cambió la programación de revisiones de este proyecto.',
      reglas: [
        { r: 'minLineas', n: 2, etiqueta: 'Mecanismo enumerado' },
        { r: 'incluye', claves: ['repositorio', 'registro', 'documenta', 'pmo', 'archivo', 'base de'], etiqueta: 'Destino definido' }
      ]
    },
    {
      id: 'liberacion', etiqueta: 'Liberación de recursos y cierre administrativo', tipo: 'texto', peso: 1,
      ayuda: 'Cómo vuelven las personas a sus áreas, cómo se cierran contratos y qué pasa con los recursos sobrantes.',
      pistas: ['liberación', 'cierre administrativo', 'contratos', 'recursos liberados'],
      ejemplo: 'El equipo interno regresa a sus áreas en la semana del 14 de diciembre de 2026, con evaluación de desempeño remitida a sus jefes. El contrato del arquitecto externo finaliza el 30 de noviembre. Los saldos no ejecutados de la reserva de gestión se devuelven al rubro de inversión. Los accesos al ambiente de pruebas se revocan el 18 de diciembre.',
      reglas: [
        { r: 'minPalabras', n: 20, etiqueta: 'Cierre administrativo descrito' }
      ]
    }
  ]
}

];

/* ── Verificaciones cruzadas entre secciones ─────────────
   Comprueban la coherencia del conjunto, que es donde falla
   la mayoría de los planes: cada sección correcta por su
   cuenta y contradictoria con las demás.
   ──────────────────────────────────────────────────────── */
PMBOK.verificacionesProyecto = [
  {
    id: 'v-obj-crit', titulo: 'Cada objetivo tiene su criterio de éxito',
    severidad: 'alta', tipo: 'conteoMinimo', a: 'enc.criterios_exito', b: 'enc.objetivos',
    explicacion: 'Hay más objetivos que criterios de éxito: algún objetivo no podrá declararse cumplido ni incumplido.',
    comoCorregir: 'Añade en Encuadre un criterio medible por cada objetivo declarado.'
  },
  {
    id: 'v-ent-crono', titulo: 'Los entregables aparecen en el cronograma',
    severidad: 'alta', tipo: 'solapeTexto', a: 'alc.entregables', b: ['cro.hitos', 'cro.actividades'], minSolape: 0.34,
    explicacion: 'Los entregables definidos en Alcance no se reconocen en los hitos ni en las actividades del cronograma.',
    comoCorregir: 'Usa los mismos nombres de entregable en la sección de Cronograma, o añade el hito que falta.'
  },
  {
    id: 'v-ent-raci', titulo: 'Cada entregable tiene responsable asignado',
    severidad: 'alta', tipo: 'solapeTexto', a: 'alc.entregables', b: ['rec.raci'], minSolape: 0.34,
    explicacion: 'Hay entregables del alcance que no figuran en la matriz de responsabilidades.',
    comoCorregir: 'Añade una fila en la matriz RACI de Recursos por cada entregable del alcance.'
  },
  {
    id: 'v-suma-presupuesto', titulo: 'Las partidas son coherentes con el presupuesto total',
    severidad: 'alta', tipo: 'sumaPartidas', a: 'fin.partidas', b: 'fin.total', c: 'fin.reservas', tolerancia: 0.12,
    explicacion: 'La suma de las partidas de costo más las reservas no coincide con el presupuesto total declarado.',
    comoCorregir: 'Revisa Finanzas: el total debe ser el costo base más las reservas, y las partidas deben sumar el costo base.'
  },
  {
    id: 'v-reservas', titulo: 'Las dos reservas están diferenciadas',
    severidad: 'media', tipo: 'contiene', a: 'fin.reservas', claves: ['contingencia', 'gestión'], todas: true,
    explicacion: 'No se distinguen la reserva de contingencia, para riesgos conocidos y bajo autoridad del director, y la de gestión, para lo desconocido y bajo autoridad del patrocinador.',
    comoCorregir: 'Declara ambas reservas con su importe y su autoridad de uso.'
  },
  {
    id: 'v-riesgos-altos', titulo: 'Los riesgos altos tienen respuesta y responsable',
    severidad: 'alta', tipo: 'riesgosAltos', a: 'rie.registro', umbral: 12,
    explicacion: 'Hay riesgos con producto de probabilidad por impacto alto sin estrategia de respuesta o sin responsable nombrado.',
    comoCorregir: 'Completa en el registro la estrategia (evitar, transferir, mitigar, escalar, aceptar) y el dueño de cada riesgo priorizado.'
  },
  {
    id: 'v-riesgo-contingencia', titulo: 'La contingencia se justifica en los riesgos',
    severidad: 'media', tipo: 'ambosNoVacios', a: 'rie.registro', b: 'fin.reservas',
    explicacion: 'La reserva de contingencia debe derivarse del registro de riesgos; falta uno de los dos.',
    comoCorregir: 'Completa el registro de riesgos y calcula la contingencia a partir de él.'
  },
  {
    id: 'v-interesados-comunicacion', titulo: 'Los interesados clave reciben comunicación',
    severidad: 'media', tipo: 'solapeTexto', a: 'int.registro', b: ['int.comunicaciones'], minSolape: 0.34,
    explicacion: 'Hay interesados registrados que no aparecen en ningún flujo del plan de comunicaciones.',
    comoCorregir: 'Añade al plan de comunicaciones una fila por cada interesado con poder o influencia alta.'
  },
  {
    id: 'v-patrocinador', titulo: 'El patrocinador es coherente en todo el plan',
    severidad: 'media', tipo: 'contiene', a: 'int.registro', claves: ['patrocinador', 'patrocinadora', 'sponsor'],
    explicacion: 'El patrocinador designado en el acta no aparece en el registro de interesados.',
    comoCorregir: 'Incluye al patrocinador en el registro de interesados con su valoración y estrategia.'
  },
  {
    id: 'v-hitos-rango', titulo: 'Los hitos caen dentro del calendario del proyecto',
    severidad: 'media', tipo: 'fechasEnRango', a: 'cro.hitos', b: 'cro.calendario',
    explicacion: 'Hay hitos con fechas fuera del periodo de inicio y fin declarado.',
    comoCorregir: 'Ajusta las fechas de los hitos o corrige el calendario general del proyecto.'
  },
  {
    id: 'v-equipo-actividades', titulo: 'Los responsables de actividades pertenecen al equipo',
    severidad: 'baja', tipo: 'solapeTexto', a: 'cro.actividades', b: ['rec.equipo'], minSolape: 0.25,
    explicacion: 'Aparecen responsables en el cronograma que no figuran en el equipo del proyecto.',
    comoCorregir: 'Usa los mismos nombres de rol en Cronograma y en Recursos, o completa el equipo.'
  },
  {
    id: 'v-beneficios-criterios', titulo: 'Los beneficios se miden con las métricas del caso de negocio',
    severidad: 'media', tipo: 'solapeTexto', a: 'enc.criterios_exito', b: ['cie.beneficios'], minSolape: 0.25,
    explicacion: 'El plan de medición de beneficios no reutiliza las métricas declaradas en el encuadre.',
    comoCorregir: 'Mide después del cierre exactamente lo que prometiste en los criterios de éxito.'
  },
  {
    id: 'v-exclusiones', titulo: 'El alcance declara sus exclusiones',
    severidad: 'media', tipo: 'noVacio', a: 'alc.exclusiones',
    explicacion: 'Sin exclusiones explícitas, cualquier expectativa no escrita se convierte en una discusión durante la ejecución.',
    comoCorregir: 'Escribe al menos tres cosas que el proyecto no hará y que alguien podría suponer incluidas.'
  },
  {
    id: 'v-oportunidades', titulo: 'La gestión de riesgos incluye oportunidades',
    severidad: 'baja', tipo: 'noVacio', a: 'rie.oportunidades',
    explicacion: 'El registro solo contempla amenazas. La 8.ª edición trata la incertidumbre en ambos sentidos.',
    comoCorregir: 'Identifica al menos dos riesgos de efecto favorable con su estrategia.'
  },
  {
    id: 'v-principios', titulo: 'Los seis principios tienen evidencia',
    severidad: 'media', tipo: 'principiosCompletos',
    explicacion: 'Algún principio no tiene evidencia de aplicación en una decisión concreta del proyecto.',
    comoCorregir: 'Completa la sección de principios señalando en qué decisión del proyecto se materializó cada uno.'
  }
];
