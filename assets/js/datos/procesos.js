/* ═══════════════════════════════════════════════════════════
   procesos.js — Los 40 procesos de la 8.ª edición
   Nombres y ubicación (dominio × área de enfoque) según el
   índice público. Propósito, ITTO, ejemplos y preguntas son
   desarrollo propio de apoyo al estudio.
   ═══════════════════════════════════════════════════════════ */

window.PMBOK = window.PMBOK || {};

PMBOK.procesos = [

/* ══════════ DOMINIO 1 · GOBERNANZA (9) ══════════ */
{
  id: 'p-gob-01', cod: '2.1.1', nombre: 'Iniciar el Proyecto o Fase',
  dominio: 'gobernanza', area: 'inicio',
  proposito: 'Autorizar formalmente la existencia del proyecto o de una fase, designar al director y conferirle autoridad sobre los recursos.',
  descripcion: [
    'Es el único proceso del área de enfoque de Inicio, y esa singularidad es deliberada: iniciar es un acto de autoridad, no un conjunto de actividades. Su salida principal, el **acta de constitución**, es lo que convierte una intención en un proyecto.',
    'Sin acta —o con un acta ambigua sobre autoridad y criterios de éxito— todo lo que sigue queda expuesto: nadie sabrá quién decide ante un conflicto ni contra qué se juzgará el resultado.'
  ],
  entradas: ['Caso de negocio y documentos de negocio', 'Acuerdos y contratos marco', 'Factores ambientales de la empresa', 'Activos de los procesos de la organización', 'Plan de beneficios previsto'],
  herramientas: ['Juicio de expertos', 'Recopilación de datos (tormenta de ideas, entrevistas, grupos focales)', 'Habilidades interpersonales (facilitación, gestión de conflictos)', 'Reuniones de arranque', 'Análisis de alternativas'],
  salidas: ['Acta de constitución del proyecto', 'Registro de supuestos', 'Identificación preliminar de interesados', 'Riesgos de alto nivel'],
  ejemplo: {
    titulo: 'Un acta que resolvió un conflicto antes de que ocurriera',
    contexto: 'Proyecto de modernización de un sistema de nóminas, con Recursos Humanos y Tecnología como áreas involucradas.',
    aplicacion: 'El acta define explícitamente: patrocinador único (director de RR. HH.), autoridad del director de proyecto hasta 20.000 USD y 10 días de holgura, criterios de éxito medibles («procesar la nómina de 3.200 empleados en menos de 4 horas con cero errores durante tres ciclos consecutivos»), y una cláusula sobre resolución de discrepancias entre RR. HH. y Tecnología: decide el patrocinador tras oír a ambos, en un plazo máximo de 48 horas.',
    resultado: 'En el mes 3 surge un desacuerdo sobre la plataforma de despliegue. Se resuelve en dos días aplicando la cláusula. En proyectos comparables sin esa previsión, disputas equivalentes han consumido semanas de escalamiento informal.'
  },
  errores: ['Iniciar el trabajo antes de tener el acta aprobada', 'Redactar criterios de éxito no medibles', 'Omitir los límites de autoridad del director de proyecto', 'Confundir el acta con el plan de dirección del proyecto'],
  preguntas: [
    { q: '¿Quién redacta y quién aprueba el acta de constitución?',
      a: 'La <b>redacta</b> normalmente el director de proyecto o el iniciador, en colaboración con el patrocinador. La <b>aprueba y firma</b> el patrocinador o el órgano de gobernanza: debe ser alguien externo al proyecto con autoridad sobre los fondos. Un acta firmada por el propio director de proyecto no confiere autoridad alguna.' },
    { q: '¿Qué diferencia hay entre el acta y el plan de dirección del proyecto?',
      a: 'El acta <b>autoriza y define el qué y el porqué</b> a alto nivel: es breve, estable y aprobada por gobernanza. El plan <b>define el cómo</b>: es extenso, evolutivo y elaborado por el equipo. El acta responde «¿por qué existe este proyecto y quién manda?»; el plan responde «¿cómo lo vamos a lograr?».' }
  ]
},
{
  id: 'p-gob-02', cod: '2.1.2', nombre: 'Integrar y Alinear los Planes del Proyecto',
  dominio: 'gobernanza', area: 'planificacion',
  proposito: 'Consolidar los planes subsidiarios de todos los dominios en un plan de dirección coherente, resolviendo las inconsistencias entre ellos.',
  descripcion: [
    'El valor de este proceso no está en juntar documentos, sino en **detectar y resolver las contradicciones** que aparecen cuando cada dominio planifica por separado: el cronograma asume una disponibilidad de recursos que el plan de recursos no confirma; el presupuesto no contempla la respuesta a riesgos que el plan de riesgos exige.',
    'El resultado incluye las líneas base de alcance, cronograma y costos, que en conjunto forman la **línea base para la medición del desempeño**.'
  ],
  entradas: ['Acta de constitución del proyecto', 'Planes subsidiarios de cada dominio', 'Salidas de todos los procesos de planificación', 'Factores ambientales y activos de la organización'],
  herramientas: ['Juicio de expertos', 'Análisis de alternativas', 'Reuniones de planificación e integración', 'Habilidades interpersonales (facilitación, gestión de conflictos)', 'Sistema de información para la dirección de proyectos'],
  salidas: ['Plan de dirección del proyecto', 'Líneas base de alcance, cronograma y costos', 'Registro de adaptación', 'Planes subsidiarios actualizados'],
  ejemplo: {
    titulo: 'Las tres inconsistencias que solo aparecen al integrar',
    contexto: 'Seis planes subsidiarios elaborados en paralelo por distintos responsables durante tres semanas.',
    aplicacion: 'El taller de integración de un día detecta: <b>(1)</b> el cronograma programa la fase de pruebas en agosto, cuando el plan de recursos indica que el 60 % del equipo tiene vacaciones; <b>(2)</b> el plan de riesgos propone contratar un especialista en seguridad por 35.000 USD, importe ausente del presupuesto; <b>(3)</b> el plan de comunicaciones promete informes semanales de valor ganado, pero el plan financiero solo prevé cierre contable mensual.',
    resultado: 'Las tres se resuelven antes de aprobar las líneas base: se mueven las pruebas a septiembre, se incorporan los 35.000 USD a la contingencia y se ajusta la frecuencia del informe a mensual con un avance semanal cualitativo. Descubrir cualquiera de las tres en ejecución habría costado semanas.'
  },
  errores: ['Grapar planes sin buscar contradicciones', 'Aprobar líneas base sin verificar coherencia entre dominios', 'Elaborar el plan sin participación de quienes lo ejecutarán', 'Confundir el plan de dirección con un cronograma detallado'],
  preguntas: [
    { q: '¿El plan de dirección del proyecto es un documento único?',
      a: 'Es un <b>documento integrador</b> que puede materializarse como un archivo o como un conjunto de documentos referenciados. Lo que lo define no es el formato sino su función: contener o remitir a todos los planes subsidiarios y a las líneas base, y ser el punto único de consulta sobre cómo se gestionará el proyecto.' },
    { q: '¿Cada cuánto se actualiza?',
      a: 'Los <b>planes subsidiarios</b> se actualizan cuando cambia la forma de gestionar algo. Las <b>líneas base</b> solo cambian mediante solicitud de cambio aprobada. Esta asimetría es el corazón del control: si ambas cambiaran igual de fácil, ninguna desviación sería detectable.' }
  ]
},
{
  id: 'p-gob-03', cod: '2.1.3', nombre: 'Planificar la Estrategia de Abastecimiento',
  dominio: 'gobernanza', area: 'planificacion',
  proposito: 'Decidir qué se hace internamente y qué se adquiere, y diseñar el esquema contractual y la relación con los proveedores.',
  descripcion: [
    'La 8.ª edición eleva las adquisiciones a decisión de gobernanza, no de logística. La razón: **el tipo de contrato distribuye el riesgo** entre comprador y vendedor, y esa es una decisión estratégica con consecuencias durante todo el proyecto.',
    'El análisis de hacer o comprar considera costo, capacidad interna disponible, criticidad estratégica, propiedad intelectual y riesgo de dependencia del proveedor.'
  ],
  entradas: ['Acta de constitución', 'Línea base del alcance y documentación de requisitos', 'Registro de riesgos', 'Condiciones del mercado y capacidad interna', 'Políticas de contratación de la organización'],
  herramientas: ['Análisis de hacer o comprar', 'Juicio de expertos y asesoría legal', 'Investigación de mercado', 'Análisis de selección de proveedores', 'Reuniones con proveedores potenciales'],
  salidas: ['Estrategia de abastecimiento', 'Plan de gestión de las adquisiciones', 'Enunciados del trabajo relativo a adquisiciones', 'Criterios de selección de proveedores', 'Decisiones de hacer o comprar'],
  ejemplo: {
    titulo: 'El tipo de contrato como decisión de riesgo',
    contexto: 'Dos componentes a contratar: (A) suministro e instalación de cableado estructurado, alcance perfectamente definido; (B) desarrollo de un algoritmo de recomendación, alcance exploratorio.',
    aplicacion: '<b>Componente A → precio fijo cerrado.</b> El alcance es claro, así que el riesgo de sobrecosto se traslada al proveedor y el comprador obtiene certeza de precio.<br><b>Componente B → costo reembolsable con honorario por incentivo.</b> Un precio fijo sobre alcance exploratorio provocaría una de dos cosas: un precio inflado por la incertidumbre, o un proveedor que recorta calidad al descubrir que subestimó.',
    resultado: 'A cierra en el precio pactado. B consume un 12 % más de lo estimado, pero el incentivo por cumplimiento de hitos mantuvo alineado al proveedor. Aplicar precio fijo a B habría producido, con alta probabilidad, un litigio por cambios de alcance.'
  },
  errores: ['Elegir el tipo de contrato por costumbre y no por perfil de riesgo', 'Contratar sobre un enunciado del trabajo ambiguo', 'Ignorar el riesgo de dependencia de un proveedor único', 'Omitir criterios de sostenibilidad en la selección'],
  preguntas: [
    { q: '¿Cuándo conviene precio fijo y cuándo costo reembolsable?',
      a: '<b>Precio fijo</b> cuando el alcance está bien definido y es estable: traslada el riesgo de costo al vendedor y da certeza al comprador. <b>Costo reembolsable</b> cuando el alcance es incierto o exploratorio: el comprador asume el riesgo de costo pero evita pagar la prima de incertidumbre que el vendedor incorporaría a un precio fijo. La regla: <b>el riesgo de costo debe recaer en quien mejor puede controlarlo</b>.' },
    { q: '¿Qué es un contrato por tiempo y materiales?',
      a: 'Un híbrido: se pagan tarifas unitarias acordadas (por hora, por unidad) sin un total cerrado. Es apropiado para <b>ampliación de personal</b> o trabajos de alcance pequeño e indeterminado. Su riesgo es la falta de tope, por lo que se acompaña casi siempre de un <b>importe máximo no superable</b> que reintroduce el control de costo.' }
  ]
},
{
  id: 'p-gob-04', cod: '2.1.4', nombre: 'Dirigir la Ejecución del Proyecto',
  dominio: 'gobernanza', area: 'ejecucion',
  proposito: 'Liderar y realizar el trabajo definido en el plan de dirección del proyecto, e implementar los cambios aprobados.',
  descripcion: [
    'Es el proceso donde se consume la mayor parte del presupuesto y donde se produce el trabajo real. Su contenido de gobernanza está en **decidir de forma continua**: priorizar, desbloquear, reasignar y mantener el rumbo cuando la realidad se aparta del plan.',
    'Genera los datos de desempeño del trabajo, materia prima de todo el monitoreo posterior.'
  ],
  entradas: ['Plan de dirección del proyecto', 'Documentos del proyecto (registros de riesgos, incidentes, lecciones)', 'Solicitudes de cambio aprobadas', 'Factores ambientales y activos de la organización'],
  herramientas: ['Juicio de expertos', 'Sistema de información para la dirección de proyectos', 'Reuniones de coordinación y de decisión', 'Habilidades interpersonales (liderazgo, gestión de conflictos)'],
  salidas: ['Entregables', 'Datos de desempeño del trabajo', 'Registro de incidentes', 'Solicitudes de cambio', 'Actualizaciones al plan y a los documentos del proyecto'],
  ejemplo: {
    titulo: 'Dirigir no es supervisar',
    contexto: 'Un equipo de 14 personas en la fase de ejecución de un proyecto de 9 meses.',
    aplicacion: 'El director dedica su tiempo a tres actividades que solo él puede hacer: <b>desbloquear</b> (obtener del área de infraestructura un entorno de pruebas que llevaba tres semanas pendiente), <b>decidir</b> (elegir entre dos alternativas técnicas cuando el equipo está dividido, tras oír ambos argumentos) y <b>proteger</b> (rechazar tres solicitudes informales de trabajo adicional que llegaron por fuera del control de cambios). No revisa el código ni asigna tareas individuales: eso lo hace el equipo.',
    resultado: 'El equipo mantiene su ritmo porque los impedimentos se resuelven en horas. El director que dedica su jornada a supervisar tareas suele ser el mismo que deja los impedimentos sin resolver durante semanas.'
  },
  errores: ['Microgestionar en lugar de desbloquear', 'Implementar cambios no aprobados «porque son pequeños»', 'No registrar los incidentes que se resuelven informalmente', 'Dejar que el trabajo no planificado entre sin trazabilidad'],
  preguntas: [
    { q: '¿Qué son exactamente los datos de desempeño del trabajo?',
      a: 'Las <b>observaciones y mediciones crudas</b> del trabajo en curso: actividades iniciadas y terminadas, porcentaje de avance, costos incurridos, defectos encontrados, horas dedicadas. Aún no están analizados ni contextualizados: eso ocurre en «Monitorear y Controlar el Desempeño del Proyecto», que los convierte en información.' },
    { q: '¿Puedo implementar un cambio urgente sin aprobación?',
      a: 'Solo si el plan de gestión de cambios prevé un <b>procedimiento de emergencia</b>, y siempre con regularización posterior documentada. Fuera de ese caso, implementar sin aprobación es una falta de gobernanza aunque el cambio sea acertado. Si tu proyecto necesita cambios urgentes con frecuencia, el problema no es el procedimiento: es que los umbrales están mal calibrados.' }
  ]
},
{
  id: 'p-gob-05', cod: '2.1.5', nombre: 'Gestionar el Aseguramiento de la Calidad',
  dominio: 'gobernanza', area: 'ejecucion',
  proposito: 'Auditar que los procesos de trabajo son adecuados y se aplican, de modo que los entregables cumplan los requisitos por construcción y no por inspección.',
  descripcion: [
    'Es la materialización del principio «incorporar la calidad en los procesos y entregables». Actúa sobre el **proceso**, no sobre el producto: la inspección del producto corresponde al control de calidad, dentro del monitoreo del alcance.',
    'Su instrumento característico es la auditoría de calidad, junto con el análisis de causa raíz de los defectos recurrentes y el diseño de mejoras de proceso.'
  ],
  entradas: ['Plan de dirección del proyecto (gestión de la calidad)', 'Métricas de calidad', 'Documentos del proyecto (registro de lecciones, informes de control)', 'Datos de desempeño del trabajo'],
  herramientas: ['Auditorías de calidad', 'Análisis de causa raíz (5 porqués, diagrama de Ishikawa)', 'Listas de verificación y hojas de control', 'Diseño de experimentos', 'Análisis de alternativas y de procesos'],
  salidas: ['Informes de calidad', 'Solicitudes de cambio (acciones correctivas y preventivas)', 'Actualizaciones al plan de dirección', 'Mejoras de proceso documentadas'],
  ejemplo: {
    titulo: 'Auditar el proceso en vez de inspeccionar más',
    contexto: 'El 22 % de los entregables se rechaza en la revisión del cliente. La reacción inicial propuesta es aumentar la inspección interna.',
    aplicacion: 'La auditoría de calidad revisa el proceso y encuentra tres causas: los criterios de aceptación se acuerdan después de construir; no existe revisión entre pares; y el 40 % de los rechazos corresponde a un mismo tipo de requisito no funcional (rendimiento) que nunca se probó porque no había entorno de carga.',
    resultado: 'Se corrigen las tres causas de proceso. La tasa de rechazo baja al 5 % <b>sin aumentar</b> el esfuerzo de inspección. Más inspección habría detectado los mismos defectos un poco antes, con el mismo costo de producirlos.'
  },
  errores: ['Confundir aseguramiento con control de calidad', 'Auditar sin actuar sobre los hallazgos', 'Aplicar el mismo rigor de calidad a todos los entregables', 'Tratar el defecto individual y no su causa'],
  preguntas: [
    { q: '¿Quién debe realizar la auditoría de calidad?',
      a: 'Idealmente alguien <b>independiente del equipo que produce el trabajo</b>: una PMO, un área de calidad o un auditor externo. En proyectos pequeños puede hacerla el propio equipo mediante autoevaluación estructurada, aceptando que la independencia es menor. Lo que no funciona es que la audite quien tiene incentivo en que el resultado sea favorable.' },
    { q: '¿Qué es el costo de la calidad?',
      a: 'La suma de cuatro categorías. <b>Conformidad</b>: prevención (formación, diseño robusto, definición de proceso) y evaluación (pruebas, inspecciones, auditorías). <b>No conformidad</b>: fallos internos (retrabajo, desecho antes de entregar) y fallos externos (garantías, retiradas, sanciones, pérdida de reputación). Su utilidad es económica: permite defender la inversión en prevención con números en lugar de con principios.' }
  ]
},
{
  id: 'p-gob-06', cod: '2.1.6', nombre: 'Gestionar el Conocimiento del Proyecto',
  dominio: 'gobernanza', area: 'ejecucion',
  proposito: 'Utilizar el conocimiento existente y crear conocimiento nuevo para lograr los objetivos del proyecto y contribuir al aprendizaje organizacional.',
  descripcion: [
    'Distingue dos tipos de conocimiento con implicaciones prácticas muy distintas. El **explícito** se documenta y se transfiere por escrito. El **tácito** —criterio, intuición, experiencia— **no se documenta bien** y se transfiere por interacción: trabajo en pareja, mentoría, comunidades de práctica, observación.',
    'El error más común es creer que basta con exigir documentación. Buena parte del conocimiento valioso de un proyecto es tácito y se pierde si el único mecanismo es un repositorio.'
  ],
  entradas: ['Plan de dirección del proyecto', 'Documentos del proyecto y entregables', 'Repositorios de conocimiento de la organización', 'Experiencia del equipo y de expertos'],
  herramientas: ['Gestión del conocimiento (comunidades de práctica, mentoría, programación en pareja, narración de casos)', 'Gestión de la información (repositorios, bibliotecas, indexación)', 'Habilidades interpersonales (escucha activa, facilitación, liderazgo)', 'Revisiones posteriores a la acción y retrospectivas'],
  salidas: ['Registro de lecciones aprendidas', 'Actualizaciones a los activos de los procesos de la organización', 'Actualizaciones al plan de dirección del proyecto'],
  ejemplo: {
    titulo: 'Lo tácito no cabe en un documento',
    contexto: 'Una consultora quiere transferir la capacidad de estimar proyectos de migración de datos, hoy concentrada en dos personas.',
    aplicacion: 'Primero se intentó con documentación: una guía de 40 páginas. Los estimadores nuevos la siguieron y erraron un 60 %. El diagnóstico: la guía capturaba el <b>método</b> pero no el <b>criterio</b> —cuándo un cliente subestima la suciedad de sus datos, qué señales anticipan problemas de integración—. Se cambia el mecanismo: cada estimación nueva la hacen en pareja un experto y un aprendiz, y después se comparan la estimación conjunta y la real en una sesión de 30 minutos.',
    resultado: 'Tras seis estimaciones en pareja, el error de los nuevos baja al 18 %. El conocimiento tácito se transfirió por <b>práctica acompañada y conversación</b>, no por documento. La guía siguió siendo útil, pero como complemento y no como sustituto.'
  },
  errores: ['Capturar lecciones solo al cierre', 'Documentar sin indexar: repositorios que nadie encuentra', 'Ignorar el conocimiento tácito', 'No consultar lecciones de proyectos previos al planificar'],
  preguntas: [
    { q: '¿Cuándo se capturan las lecciones aprendidas?',
      a: '<b>Durante todo el proyecto</b>, no solo al cierre. El registro de lecciones aprendidas es un documento vivo que se alimenta en cada retrospectiva, tras cada incidente relevante y en cada puerta de fase. Al cierre se <b>consolida</b> y se transfiere al repositorio de la organización. Situar la captura únicamente en el cierre garantiza perder el detalle y el contexto de lo ocurrido meses antes.' },
    { q: '¿Cómo hago que las lecciones se usen y no solo se archiven?',
      a: 'Tres medidas concretas. <b>Indexar por situación</b>, no por proyecto: alguien busca «migración de datos con proveedor externo», no «Proyecto Fénix 2023». <b>Incorporar la consulta al proceso</b>: hacer obligatorio revisar lecciones relevantes al planificar, con evidencia en el plan. <b>Convertirlas en activos</b>: la lección que realmente se usa termina siendo una lista de verificación, una plantilla o un criterio de estimación, no un párrafo en un documento.' }
  ]
},
{
  id: 'p-gob-07', cod: '2.1.7', nombre: 'Monitorear y Controlar el Desempeño del Proyecto',
  dominio: 'gobernanza', area: 'monitoreo',
  proposito: 'Dar seguimiento, revisar e informar el avance global frente a las líneas base, y determinar las acciones necesarias para corregir el rumbo.',
  descripcion: [
    'Es el proceso integrador del monitoreo: consolida la información de todos los dominios en una visión única del desempeño del proyecto y genera los pronósticos.',
    'Su producto característico son los **informes de desempeño del trabajo**, resultado de convertir datos crudos en información con significado para la decisión.'
  ],
  entradas: ['Plan de dirección del proyecto y líneas base', 'Datos de desempeño del trabajo', 'Información de desempeño de cada dominio', 'Pronósticos de costo y de cronograma', 'Registro de riesgos e incidentes'],
  herramientas: ['Análisis de datos (valor ganado, variación, tendencias, causa raíz, alternativas)', 'Juicio de expertos', 'Toma de decisiones', 'Reuniones de revisión de desempeño', 'Sistema de información para la dirección de proyectos'],
  salidas: ['Informes de desempeño del trabajo', 'Solicitudes de cambio', 'Actualizaciones al plan de dirección y a los documentos del proyecto', 'Pronósticos actualizados'],
  ejemplo: {
    titulo: 'De dato a decisión en tres pasos',
    contexto: 'Al cierre del mes 5, el sistema reporta 47 tareas completadas de 80 previstas y un gasto de 412.000 USD.',
    aplicacion: '<b>Dato:</b> 47/80 tareas, 412.000 USD gastados.<br><b>Información:</b> EV = 58,75 % × BAC; con BAC = 900.000, EV = 528.750; PV = 562.500 (62,5 % del calendario). CPI = 528.750/412.000 = <b>1,28</b>; SPI = 528.750/562.500 = <b>0,94</b>. Es decir: se gasta menos de lo previsto para el trabajo hecho, pero se avanza algo más lento.<br><b>Decisión:</b> el análisis de causa raíz muestra que el buen CPI proviene de que dos perfiles senior presupuestados fueron sustituidos por perfiles junior más baratos, y que esa misma sustitución explica el SPI bajo.',
    resultado: 'El informe no dice «vamos bien en costo y algo mal en plazo»: dice que existe un <b>intercambio no decidido</b> entre costo y plazo que alguien hizo sin evaluarlo. Se eleva a gobernanza la decisión de reforzar con perfiles senior usando el ahorro acumulado.'
  },
  errores: ['Informar datos sin análisis ni recomendación', 'Medir avance por esfuerzo consumido en lugar de por valor ganado', 'Informes idénticos para todas las audiencias', 'Reportar siempre en verde hasta que es demasiado tarde'],
  preguntas: [
    { q: '¿Qué diferencia hay entre monitorear y controlar?',
      a: '<b>Monitorear</b> es observar, medir y analizar el estado: producir conocimiento sobre la situación. <b>Controlar</b> es actuar sobre la desviación: decidir y ejecutar acciones correctivas o preventivas. Monitorear sin controlar produce informes decorativos; controlar sin monitorear produce reacciones improvisadas sobre datos que nadie verificó.' },
    { q: '¿Cómo calculo el pronóstico a la conclusión?',
      a: 'Depende del diagnóstico. Si la desviación es <b>sistémica</b> (subestimación general que continuará): <code>EAC = BAC / CPI</code>. Si fue un <b>evento puntual ya resuelto</b>: <code>EAC = AC + (BAC − EV)</code>. Si la desviación es sistémica y además hay que recuperar cronograma: <code>EAC = AC + (BAC − EV) / (CPI × SPI)</code>. Elegir la fórmula es un acto de juicio sobre la causa, no una aplicación mecánica.' }
  ]
},
{
  id: 'p-gob-08', cod: '2.1.8', nombre: 'Evaluar e Implementar Cambios',
  dominio: 'gobernanza', area: 'monitoreo',
  proposito: 'Revisar todas las solicitudes de cambio, evaluar su impacto integrado, aprobarlas o rechazarlas, y gestionar la implementación de las aprobadas.',
  descripcion: [
    'Sucesor del «control integrado de cambios». El adjetivo *integrado* es la clave: ninguna solicitud se evalúa solo en su dominio de origen. Un cambio de alcance se examina también por su efecto en cronograma, costo, recursos, riesgos e interesados.',
    'Toda solicitud, se apruebe o se rechace, queda en el **registro de cambios** con su decisión y su justificación. El registro de los rechazos es tan valioso como el de las aprobaciones: evita reabrir discusiones cerradas.'
  ],
  entradas: ['Plan de dirección del proyecto (gestión de cambios y configuración)', 'Solicitudes de cambio', 'Informes de desempeño del trabajo', 'Documentos del proyecto', 'Líneas base vigentes'],
  herramientas: ['Análisis de impacto integrado', 'Herramientas de control de cambios y de configuración', 'Toma de decisiones (votación, análisis multicriterio, autocrática)', 'Juicio de expertos', 'Reuniones del comité de control de cambios'],
  salidas: ['Solicitudes de cambio aprobadas o rechazadas', 'Registro de cambios actualizado', 'Actualizaciones al plan de dirección y a las líneas base', 'Actualizaciones a documentos del proyecto'],
  ejemplo: {
    titulo: 'Plantilla de evaluación integrada',
    contexto: 'Solicitud SC-034: «Añadir autenticación biométrica al inicio de sesión».',
    aplicacion: '<b>Origen:</b> área de seguridad. <b>Motivo:</b> nueva política corporativa.<br><b>Alcance:</b> +1 entregable, requiere 4 criterios de aceptación nuevos.<br><b>Cronograma:</b> +11 días; la actividad está en ruta crítica → +11 días al fin del proyecto.<br><b>Finanzas:</b> +26.800 USD (desarrollo, licencia SDK, pruebas de seguridad).<br><b>Recursos:</b> requiere un perfil de seguridad móvil no disponible internamente.<br><b>Riesgos:</b> introduce dependencia de un proveedor de SDK y un riesgo de rechazo en tiendas de aplicaciones.<br><b>Interesados:</b> el área legal debe validar el tratamiento de datos biométricos.<br><b>Alternativas:</b> (a) implementar ahora; (b) diferir a la fase 2; (c) autenticación en dos factores por SMS, con menor costo y sin datos biométricos.',
    resultado: 'El comité aprueba la alternativa (c): cumple la política de seguridad con +3 días y 6.200 USD, sin riesgo regulatorio de datos biométricos. La evaluación integrada no solo cuantificó la solicitud: <b>hizo aparecer una alternativa mejor</b> que nadie había planteado.'
  },
  errores: ['Aprobar por el impacto declarado y no por el impacto analizado', 'No registrar los cambios rechazados', 'Permitir cambios informales por ser «pequeños»', 'Evaluar el cambio solo en su dominio de origen'],
  preguntas: [
    { q: '¿Todo cambio requiere pasar por este proceso?',
      a: 'Todo cambio que afecte a una <b>línea base</b> aprobada: alcance, cronograma o costos. Las decisiones dentro de los umbrales delegados al equipo o al director no requieren comité, pero sí <b>registro</b>. La proporcionalidad está en el nivel de aprobación, nunca en saltarse la trazabilidad.' },
    { q: '¿Qué hago si el cliente pide un cambio directamente al equipo?',
      a: 'Redirigirlo al proceso de cambios, con cortesía y sin excepciones. El equipo debe tener una respuesta preparada: «lo registramos como solicitud, evaluamos el impacto y te confirmamos en X días». La alternativa —aceptar por evitar la incomodidad— es exactamente el mecanismo por el que se produce la corrupción del alcance: nunca por un cambio grande, siempre por veinte pequeños.' }
  ]
},
{
  id: 'p-gob-09', cod: '2.1.9', nombre: 'Cerrar el Proyecto o Fase',
  dominio: 'gobernanza', area: 'cierre',
  proposito: 'Finalizar formalmente todas las actividades del proyecto o de una fase, obtener la aceptación, transferir el resultado y capturar el aprendizaje.',
  descripcion: [
    'Único proceso del área de enfoque de Cierre. Se ejecuta tanto si el proyecto termina con éxito como si se **termina anticipadamente**: un proyecto cancelado también se cierra formalmente, y sus lecciones son con frecuencia las más valiosas.',
    'Un cierre incompleto deja obligaciones contractuales abiertas, presupuesto bloqueado, licencias activas y conocimiento sin capturar.'
  ],
  entradas: ['Acta de constitución y plan de dirección del proyecto', 'Entregables aceptados', 'Documentos de negocio (caso de negocio, plan de beneficios)', 'Acuerdos y documentación de adquisiciones', 'Registro de lecciones aprendidas'],
  herramientas: ['Juicio de expertos', 'Análisis de documentos, de regresión y de tendencias', 'Reuniones de cierre y retrospectivas', 'Auditoría de adquisiciones', 'Listas de verificación de cierre'],
  salidas: ['Transferencia del producto, servicio o resultado final', 'Informe final del proyecto', 'Actualizaciones a los activos de la organización', 'Cierre de adquisiciones y liberación de recursos', 'Aceptación formal del patrocinador'],
  ejemplo: {
    titulo: 'Lista de verificación de cierre',
    contexto: 'Cierre de un proyecto de implantación de sistema con dos proveedores y equipo de 11 personas.',
    aplicacion: '<b>Producto:</b> ☑ entregables aceptados por escrito · ☑ documentación técnica entregada · ☑ código y credenciales transferidos · ☑ garantía y soporte acordados por 90 días.<br><b>Financiero:</b> ☑ facturas pendientes cerradas · ☑ presupuesto no consumido liberado · ☑ costos reales registrados para el histórico.<br><b>Contractual:</b> ☑ auditoría de adquisiciones · ☑ liquidación de ambos contratos · ☑ reclamaciones resueltas · ☑ evaluación de proveedores registrada.<br><b>Personas:</b> ☑ evaluaciones de desempeño enviadas a los jefes funcionales · ☑ equipo liberado formalmente · ☑ reconocimiento comunicado.<br><b>Conocimiento:</b> ☑ retrospectiva final · ☑ lecciones consolidadas e indexadas · ☑ métricas reales al histórico de estimación.<br><b>Beneficios:</b> ☑ responsable de la medición designado · ☑ indicadores y línea base definidos · ☑ primera medición agendada a 90 días.',
    resultado: 'El último bloque es el que más se omite y el que determina si el valor llegará a realizarse. Un cierre que no deja nombrado al responsable de medir beneficios convierte la evaluación de valor en un asunto de nadie.'
  },
  errores: ['Cerrar sin aceptación formal por escrito', 'Omitir el cierre de un proyecto cancelado', 'No liberar formalmente al equipo ni comunicar su desempeño', 'Terminar sin designar responsable de la medición de beneficios'],
  preguntas: [
    { q: '¿Se cierra igual un proyecto cancelado?',
      a: 'Sí, y con el mismo rigor. Hay que documentar el motivo de la cancelación, cerrar contratos —normalmente con liquidación parcial—, liberar recursos, conservar los entregables parciales que puedan reutilizarse y, sobre todo, capturar las lecciones. La información de por qué un proyecto se canceló suele ser más útil para la organización que la de por qué otro tuvo éxito.' },
    { q: '¿Qué es la transferencia y por qué se planifica desde el inicio?',
      a: 'Es la entrega del resultado a quien lo operará: operaciones, soporte, el cliente o el equipo de producto. Se planifica desde el inicio porque determina requisitos que hay que construir <b>durante</b> el proyecto: documentación operativa, formación, período de acompañamiento, criterios de aceptación operativa y niveles de servicio. Planificarla al final obliga a improvisar o a dejar el resultado huérfano.' }
  ]
},

/* ══════════ DOMINIO 2 · ALCANCE (6) ══════════ */
{
  id: 'p-alc-01', cod: '2.2.1', nombre: 'Planificar la Gestión del Alcance',
  dominio: 'alcance', area: 'planificacion',
  proposito: 'Definir cómo se elaborará, validará y controlará el alcance del proyecto y del producto.',
  descripcion: [
    'Es un proceso sobre el **método**, no sobre el contenido: no define qué incluye el proyecto, sino cómo se decidirá y gestionará lo que incluye.',
    'Produce dos planes: el de gestión del alcance y el de gestión de requisitos, que suelen tratarse juntos.'
  ],
  entradas: ['Acta de constitución del proyecto', 'Plan de dirección del proyecto (enfoque de desarrollo)', 'Factores ambientales de la empresa', 'Activos de los procesos de la organización'],
  herramientas: ['Juicio de expertos', 'Análisis de datos y de alternativas', 'Reuniones de planificación'],
  salidas: ['Plan de gestión del alcance', 'Plan de gestión de los requisitos'],
  ejemplo: {
    titulo: 'Qué contiene un plan de gestión del alcance útil',
    contexto: 'Proyecto de 8 meses con alcance parcialmente incierto en dos de sus cinco componentes.',
    aplicacion: 'El plan define: <b>método de definición</b> (talleres de requisitos para los componentes ciertos, prototipado para los inciertos); <b>estructura</b> (EDT para tres componentes, backlog para los dos inciertos); <b>criterios de aceptación</b> (formato estándar, quién los aprueba, cuándo se acuerdan: siempre antes de construir); <b>validación</b> (revisión quincenal con el cliente sobre incrementos, aceptación formal por entregable); <b>control</b> (umbral de cambio menor gestionado por el director, mayor por el comité).',
    resultado: 'El plan permite que dos componentes evolucionen con flexibilidad sin que el conjunto pierda control. Sin él, la mezcla de enfoques habría producido ambigüedad sobre qué estaba comprometido y qué no.'
  },
  errores: ['Copiar el plan de otro proyecto sin adaptarlo', 'Definir el método sin considerar el enfoque de desarrollo elegido', 'Omitir el mecanismo de validación con el cliente'],
  preguntas: [
    { q: '¿Este proceso define el alcance del proyecto?',
      a: 'No. Define <b>cómo se definirá</b>. La distinción importa: el plan de gestión del alcance es estable durante todo el proyecto, mientras que el alcance mismo puede evolucionar. Confundirlos lleva a rehacer el plan cada vez que cambia un requisito.' }
  ]
},
{
  id: 'p-alc-02', cod: '2.2.2', nombre: 'Obtener y Analizar los Requisitos',
  dominio: 'alcance', area: 'planificacion',
  proposito: 'Determinar, documentar, analizar y priorizar las necesidades de los interesados para cumplir los objetivos del proyecto.',
  descripcion: [
    'Fusiona lo que en la 6.ª edición era «Recopilar Requisitos» y añade explícitamente el **análisis**: los requisitos no se recogen como se recoge correo, se elicitan e interpretan.',
    'La causa raíz de la mayoría de los requisitos defectuosos no es la técnica de recolección: es que se preguntó a las personas equivocadas o se documentó la **solución propuesta** por el interesado en lugar de su **necesidad real**.'
  ],
  entradas: ['Acta de constitución', 'Plan de gestión del alcance y de los requisitos', 'Registro de interesados', 'Documentos de negocio', 'Acuerdos y normativa aplicable'],
  herramientas: ['Entrevistas, grupos focales y talleres facilitados', 'Cuestionarios y encuestas', 'Observación y estudios comparativos', 'Prototipos, guiones gráficos y mapas mentales', 'Análisis de documentos', 'Toma de decisiones (votación, MoSCoW, multicriterio)', 'Diagramas de contexto y de afinidad'],
  salidas: ['Documentación de requisitos', 'Matriz de trazabilidad de requisitos', 'Actualizaciones al registro de interesados'],
  ejemplo: {
    titulo: 'De la solución propuesta a la necesidad real',
    contexto: 'Un usuario solicita: «Necesito un botón para exportar el informe a Excel».',
    aplicacion: 'El analista no documenta el botón: pregunta para qué. La conversación revela que exporta a Excel para <b>calcular manualmente un total por región</b> y enviarlo por correo a su director cada lunes. La necesidad real es «que mi director reciba el total por región cada lunes».',
    resultado: 'La solución final no es un botón de exportación: es un informe automático por región enviado cada lunes. Elimina 40 minutos semanales de trabajo manual y una fuente recurrente de error de cálculo. Documentar la solución propuesta habría entregado el botón y conservado el problema.'
  },
  errores: ['Documentar la solución propuesta en lugar de la necesidad', 'Consultar solo a quien encarga y no a quien usa', 'Omitir requisitos no funcionales', 'No priorizar: tratar 200 requisitos como igualmente obligatorios'],
  preguntas: [
    { q: '¿Qué tipos de requisitos debo recoger?',
      a: 'Seis familias: <b>de negocio</b> (necesidad de alto nivel de la organización), <b>de interesados</b> (lo que necesita cada grupo), <b>de solución funcionales</b> (qué hace el producto), <b>de solución no funcionales</b> (rendimiento, seguridad, disponibilidad, accesibilidad, usabilidad), <b>de transición</b> (migración de datos, formación, coexistencia con el sistema anterior) y <b>de proyecto y de calidad</b> (restricciones y criterios de aceptación). Las no funcionales y las de transición son las que más se omiten y las que más retrabajo tardío provocan.' },
    { q: '¿Cómo priorizo requisitos cuando todo es «obligatorio»?',
      a: 'Con un método que fuerce la distinción. <b>MoSCoW</b> con una regla dura: los <i>Must</i> no pueden superar el 60 % del esfuerzo total. <b>Comparación por pares</b> cuando la lista es corta. <b>Costo del retraso</b> cuando hay ventana de mercado. Y siempre la pregunta decisiva: «si lanzamos sin esto, ¿qué ocurre exactamente?». Si la respuesta no describe una consecuencia concreta, el requisito no es obligatorio.' }
  ]
},
{
  id: 'p-alc-03', cod: '2.2.3', nombre: 'Definir el Alcance',
  dominio: 'alcance', area: 'planificacion',
  proposito: 'Desarrollar una descripción detallada del proyecto y del producto, incluyendo lo que queda explícitamente fuera.',
  descripcion: [
    'Convierte los requisitos en un **enunciado del alcance**: descripción del producto, entregables principales, criterios de aceptación, exclusiones, supuestos y restricciones.',
    'Las **exclusiones explícitas** son la parte más subestimada y la que más conflictos evita. Lo que no se declara fuera se asume dentro.'
  ],
  entradas: ['Acta de constitución', 'Plan de gestión del alcance', 'Documentación de requisitos', 'Registro de riesgos y de supuestos'],
  herramientas: ['Juicio de expertos', 'Análisis del producto (descomposición, análisis de valor, análisis de sistemas)', 'Análisis de alternativas', 'Toma de decisiones multicriterio', 'Talleres facilitados'],
  salidas: ['Enunciado del alcance del proyecto', 'Actualizaciones a los documentos del proyecto'],
  ejemplo: {
    titulo: 'Estructura de un enunciado del alcance',
    contexto: 'Proyecto de aplicación móvil de banca para una entidad regional.',
    aplicacion: '<b>Descripción del producto:</b> aplicación iOS y Android para consulta de saldos, transferencias nacionales y pago de servicios.<br><b>Entregables:</b> aplicación en ambas tiendas · API de integración · manual de usuario · plan de formación para 40 asesores.<br><b>Criterios de aceptación:</b> tiempo de respuesta inferior a 2 s en el percentil 95 · aprobación en ambas tiendas · superar la auditoría de seguridad externa sin hallazgos críticos.<br><b>Exclusiones:</b> transferencias internacionales · apertura de cuentas en línea · integración con billeteras de terceros · versión para tabletas · soporte a versiones de sistema operativo con más de 4 años.<br><b>Supuestos:</b> la API del core bancario estará disponible el 1 de marzo · el área de marketing entregará los recursos gráficos en la semana 4.<br><b>Restricciones:</b> presupuesto de 480.000 USD · lanzamiento antes del 30 de septiembre por compromiso regulatorio.',
    resultado: 'Las cinco exclusiones evitaron cinco discusiones. Los dos supuestos, registrados y con fecha, se convirtieron en riesgos vigilados: el segundo se incumplió y, por estar registrado, se detectó en la semana 4 en lugar de en la 9.'
  },
  errores: ['Omitir las exclusiones', 'Criterios de aceptación no medibles', 'Confundir enunciado del alcance con lista de requisitos', 'Registrar supuestos sin fecha de validación ni responsable'],
  preguntas: [
    { q: '¿Cuál es la diferencia entre supuesto y restricción?',
      a: 'Un <b>supuesto</b> es algo que damos por cierto sin haberlo verificado y que, si resulta falso, afecta al proyecto: «el proveedor entregará en marzo». Una <b>restricción</b> es un límite conocido e impuesto que acota las opciones: «el presupuesto es de 480.000 USD». Los supuestos se <b>validan</b> y son fuente de riesgo; las restricciones se <b>respetan</b> o se renegocian formalmente.' },
    { q: '¿El enunciado del alcance cambia durante el proyecto?',
      a: 'Solo mediante cambio aprobado, porque forma parte de la línea base del alcance junto con la estructura del alcance y su diccionario. En enfoques adaptativos el enunciado se mantiene a alto nivel y estable, mientras el detalle evoluciona en el backlog: es la forma de conservar control sin bloquear la adaptación.' }
  ]
},
{
  id: 'p-alc-04', cod: '2.2.4', nombre: 'Desarrollar la Estructura del Alcance',
  dominio: 'alcance', area: 'planificacion',
  proposito: 'Descomponer los entregables y el trabajo del proyecto en componentes más pequeños y manejables.',
  descripcion: [
    'Sucesor de «Crear la EDT», con un nombre que abarca deliberadamente sus equivalentes adaptativos: **EDT** en enfoques predictivos, **backlog estructurado** —épicas, funcionalidades, historias— en adaptativos.',
    'La regla del 100 % gobierna la descomposición: la estructura debe contener **todo** el trabajo del proyecto y **solo** ese trabajo. Lo que no está en la estructura no está en el proyecto.'
  ],
  entradas: ['Plan de gestión del alcance', 'Enunciado del alcance del proyecto', 'Documentación de requisitos', 'Activos de los procesos de la organización'],
  herramientas: ['Descomposición', 'Juicio de expertos', 'Plantillas y estructuras de referencia del sector', 'Refinamiento progresivo del backlog', 'Planificación por olas'],
  salidas: ['Línea base del alcance (enunciado + estructura + diccionario)', 'Actualizaciones a los documentos del proyecto'],
  ejemplo: {
    titulo: 'EDT y backlog: dos formas de la misma regla',
    contexto: 'El mismo proyecto de aplicación móvil, planificado de dos maneras.',
    aplicacion: '<b>EDT (predictivo):</b><br>1. Aplicación móvil → 1.1 Diseño (1.1.1 Investigación de usuarios, 1.1.2 Prototipo, 1.1.3 Diseño visual) · 1.2 Desarrollo (1.2.1 Autenticación, 1.2.2 Consultas, 1.2.3 Transferencias) · 1.3 Pruebas · 1.4 Despliegue · 1.5 Dirección del proyecto.<br><b>Backlog (adaptativo):</b><br>Épica «Autenticación» → funcionalidad «Inicio de sesión biométrico» → historias con criterios de aceptación, priorizadas por valor.',
    resultado: 'Ambas cumplen la regla del 100 %. La diferencia está en <b>cuándo</b> se detalla: la EDT lo hace por completo al inicio; el backlog detalla en profundidad solo los elementos próximos y mantiene los lejanos como enunciados gruesos. Nótese que 1.5, la dirección del proyecto, es trabajo del proyecto y debe estar: omitirla es el error de descomposición más frecuente.'
  },
  errores: ['Descomponer por áreas de la organización en lugar de por entregables', 'Omitir el trabajo de dirección del proyecto', 'Descomponer hasta un detalle ingestionable', 'Confundir la estructura del alcance con el cronograma'],
  preguntas: [
    { q: '¿Qué es la regla del 100 %?',
      a: 'La estructura del alcance debe incluir el <b>100 % del trabajo</b> definido en el enunciado del alcance —incluida la gestión del proyecto— y nada más. Cada nivel de descomposición debe sumar exactamente el nivel superior. Si algo no está en la estructura, no está en el proyecto y nadie lo hará; si algo está de más, se pagará trabajo no comprometido.' },
    { q: '¿Qué es el diccionario de la EDT?',
      a: 'El documento que detalla cada paquete de trabajo: descripción, entregable asociado, criterios de aceptación, responsable, hitos, recursos requeridos, estimación de costo y duración, y supuestos. Es lo que convierte una EDT de un diagrama bonito en un instrumento de gestión: sin diccionario, dos personas leen el mismo cuadro y entienden cosas distintas.' }
  ]
},
{
  id: 'p-alc-05', cod: '2.2.5', nombre: 'Validar el Alcance',
  dominio: 'alcance', area: 'monitoreo',
  proposito: 'Formalizar la aceptación de los entregables completados por parte del cliente o patrocinador.',
  descripcion: [
    'Es un proceso **externo**: participa el cliente. Se distingue del control de calidad, que es interno y verifica la conformidad del entregable con sus especificaciones.',
    'La secuencia correcta es siempre: primero control de calidad (¿está bien construido?), después validación del alcance (¿es lo que el cliente esperaba?). Enviar a validación algo que no pasó el control de calidad desperdicia el tiempo del cliente y erosiona la confianza.'
  ],
  entradas: ['Plan de dirección del proyecto (alcance y requisitos)', 'Documentación de requisitos y matriz de trazabilidad', 'Entregables verificados (salidos del control de calidad)', 'Datos de desempeño del trabajo'],
  herramientas: ['Inspección (revisión, auditoría del producto, recorrido guiado)', 'Toma de decisiones (votación, aceptación por consenso)', 'Demostraciones y revisiones de incremento'],
  salidas: ['Entregables aceptados', 'Información de desempeño del trabajo', 'Solicitudes de cambio', 'Actualizaciones a los documentos del proyecto'],
  ejemplo: {
    titulo: 'Control de calidad y validación en secuencia',
    contexto: 'Entregable: módulo de generación de reportes financieros.',
    aplicacion: '<b>Control de calidad (interno):</b> se verifica que los 14 reportes se generan sin error, que los totales cuadran con la base de datos, que el tiempo de generación es inferior a 30 segundos y que el formato cumple el estándar corporativo. Se detectan y corrigen 3 defectos.<br><b>Validación del alcance (con el cliente):</b> el director financiero revisa los reportes contra los criterios de aceptación acordados y confirma que responden a su necesidad. Firma la aceptación de 13 y rechaza uno porque la agrupación por centro de costo no refleja la nueva estructura organizativa.',
    resultado: 'El rechazo no es un fallo de calidad —el reporte funcionaba correctamente— sino de alcance: el criterio se definió antes de una reorganización interna. Se abre una solicitud de cambio. La distinción entre ambos controles permitió identificar con precisión de qué tipo era el problema.'
  },
  errores: ['Enviar a validación entregables que no pasaron el control de calidad', 'Aceptación verbal sin registro', 'Validar todo al final en lugar de por incremento', 'Validar contra criterios no acordados previamente'],
  preguntas: [
    { q: '¿Validar el alcance o controlar la calidad primero?',
      a: '<b>Primero controlar la calidad</b>, después validar el alcance. El control de calidad verifica internamente que el entregable cumple sus especificaciones; la validación obtiene la aceptación formal del cliente. Invertir el orden significa hacer que el cliente descubra defectos que el equipo debía haber detectado.' },
    { q: '¿Qué pasa si el cliente rechaza un entregable?',
      a: 'Se documenta el rechazo con su motivo y se determina la causa. Si el entregable <b>no cumple</b> los criterios acordados, se genera una reparación de defectos: el retrabajo lo asume el proyecto. Si <b>cumple los criterios pero el cliente quiere algo distinto</b>, se genera una solicitud de cambio con impacto en plazo y costo. Distinguir ambos casos requiere tener los criterios acordados por escrito antes de construir.' }
  ]
},
{
  id: 'p-alc-06', cod: '2.2.6', nombre: 'Monitorear y Controlar el Alcance',
  dominio: 'alcance', area: 'monitoreo',
  proposito: 'Vigilar el estado del alcance del proyecto y del producto, y gestionar los cambios sobre la línea base del alcance.',
  descripcion: [
    'Su función principal es detectar la **corrupción del alcance**: la expansión gradual y no aprobada que no llega por un cambio grande, sino por acumulación de pequeños ajustes que nadie registró.',
    'También detecta el **gold plating**: trabajo añadido por iniciativa del equipo sin haber sido solicitado ni aprobado.'
  ],
  entradas: ['Plan de dirección del proyecto (alcance, requisitos, cambios, líneas base)', 'Documentación de requisitos y matriz de trazabilidad', 'Datos de desempeño del trabajo', 'Activos de los procesos de la organización'],
  herramientas: ['Análisis de variación y de tendencias', 'Análisis de causa raíz', 'Inspección y auditoría del alcance', 'Sistema de información para la dirección de proyectos'],
  salidas: ['Información de desempeño del trabajo', 'Solicitudes de cambio', 'Actualizaciones al plan de dirección y a las líneas base', 'Actualizaciones a documentos del proyecto'],
  ejemplo: {
    titulo: 'Detectar la corrupción del alcance con números',
    contexto: 'Proyecto de 6 meses. En el mes 3 el equipo reporta retraso sin causa aparente: no hubo cambios aprobados.',
    aplicacion: 'La auditoría del alcance compara los entregables producidos con la línea base. Encuentra 11 elementos de trabajo no trazables a ningún requisito aprobado: 4 «pequeñas mejoras» solicitadas verbalmente por usuarios, 5 ajustes de interfaz pedidos en reuniones informales y 2 funcionalidades añadidas por el equipo por considerarlas convenientes.',
    resultado: 'La suma equivale a 19 días de trabajo, un 14 % del esfuerzo consumido. Se toman dos medidas: los 9 elementos de origen externo se convierten en solicitudes de cambio formales para decidir si se conservan o se retiran; y las 2 adiciones del equipo (gold plating) se retiran. Se refuerza además la disciplina: toda solicitud, sin importar su tamaño, entra por el proceso de cambios.'
  },
  errores: ['Detectar la corrupción del alcance solo al final', 'No auditar la trazabilidad entre trabajo realizado y requisitos', 'Tolerar cambios verbales', 'Confundir refinamiento del backlog con corrupción del alcance'],
  preguntas: [
    { q: '¿En un proyecto ágil no existe corrupción del alcance?',
      a: 'Existe, y adopta otra forma. El backlog puede cambiar libremente en <b>contenido y prioridad</b>: eso es refinamiento, no corrupción. Hay corrupción cuando el <b>tamaño total del alcance comprometido crece</b> sin ajustar presupuesto, fecha o capacidad. La señal es concreta: el backlog crece más rápido de lo que se consume, iteración tras iteración, y nadie renegocia el compromiso.' },
    { q: '¿Por qué el gold plating es un problema si añade valor?',
      a: 'Por tres razones. Consume presupuesto y tiempo que el cliente no autorizó. Añade superficie de pruebas, documentación y mantenimiento futuro. Y a menudo el «valor» es una suposición del equipo que el usuario no comparte. Si el equipo detecta una mejora genuina, el camino correcto es proponerla como cambio y dejar que decida quien tiene autoridad sobre el presupuesto.' }
  ]
},

/* ══════════ DOMINIO 3 · CRONOGRAMA (3) ══════════ */
{
  id: 'p-cro-01', cod: '2.3.1', nombre: 'Planificar la Gestión del Cronograma',
  dominio: 'cronograma', area: 'planificacion',
  proposito: 'Establecer las políticas, procedimientos y documentación para planificar, desarrollar, gestionar y controlar el cronograma.',
  descripcion: [
    'Define las **reglas del juego temporal**: qué herramienta se usa, con qué unidades se mide, qué nivel de precisión se exige, cuáles son las tolerancias de desviación y con qué frecuencia se actualiza.',
    'Su omisión produce un problema recurrente: cada persona actualiza el cronograma con criterios distintos y el conjunto pierde significado.'
  ],
  entradas: ['Acta de constitución', 'Plan de dirección del proyecto (alcance y enfoque de desarrollo)', 'Factores ambientales y activos de la organización'],
  herramientas: ['Juicio de expertos', 'Análisis de datos y de alternativas', 'Reuniones de planificación'],
  salidas: ['Plan de gestión del cronograma'],
  ejemplo: {
    titulo: 'Reglas que evitan cronogramas sin significado',
    contexto: 'Proyecto con 5 responsables de paquete que actualizan el avance semanalmente.',
    aplicacion: 'El plan fija reglas concretas: <b>unidad</b> días laborables; <b>regla de avance</b> 0/100 para actividades de menos de 5 días y 0/50/100 para las mayores —prohibido el «80 % completado» subjetivo—; <b>umbral de alerta</b> desviación superior a 3 días o SPI inferior a 0,95; <b>frecuencia</b> actualización cada viernes antes de las 15:00; <b>autoridad</b> reprogramar dentro de la holgura la decide el responsable del paquete, consumir holgura de la ruta crítica la decide el director.',
    resultado: 'La regla de avance 0/50/100 elimina el fenómeno del «90 % terminado durante seis semanas», que es la forma más común de ocultar retraso sin mentir explícitamente.'
  },
  errores: ['No definir la regla de medición del avance', 'Omitir las tolerancias de desviación', 'Elegir la herramienta antes que el método'],
  preguntas: [
    { q: '¿Qué es la regla 0/50/100 y por qué se usa?',
      a: 'Una actividad no iniciada reporta 0 % de avance, una iniciada reporta 50 % y una terminada 100 %. Elimina el juicio subjetivo del porcentaje intermedio, que es donde se esconde sistemáticamente el retraso. Su costo es cierta imprecisión en actividades largas; su beneficio es que el dato es <b>verificable</b> en lugar de opinable.' }
  ]
},
{
  id: 'p-cro-02', cod: '2.3.2', nombre: 'Desarrollar el Cronograma',
  dominio: 'cronograma', area: 'planificacion',
  proposito: 'Analizar secuencias, duraciones, recursos y restricciones para crear el modelo de cronograma del proyecto y establecer su línea base.',
  descripcion: [
    'Concentra lo que en la 6.ª edición eran cuatro procesos separados: definir actividades, secuenciarlas, estimar duraciones y desarrollar el cronograma. La 8.ª edición los trata como **pasos internos de un único proceso**, porque en la práctica son iterativos y no secuenciales.',
    'Los pasos: definir actividades a partir de los paquetes de trabajo → secuenciarlas con sus dependencias → estimar duraciones → aplicar recursos y restricciones → calcular la ruta crítica → nivelar → comprimir si es necesario → aprobar la línea base.'
  ],
  entradas: ['Plan de gestión del cronograma', 'Línea base del alcance y diccionario', 'Estimaciones de recursos y calendarios', 'Registro de riesgos y de supuestos', 'Acuerdos y restricciones externas'],
  herramientas: ['Método de la ruta crítica', 'Diagramación por precedencia (PDM)', 'Estimación análoga, paramétrica, de tres valores y ascendente', 'Nivelación y equilibrio de recursos', 'Compresión (intensificación y ejecución rápida)', 'Planificación por olas', 'Análisis de escenarios y simulación', 'Método de la cadena crítica'],
  salidas: ['Línea base del cronograma', 'Cronograma del proyecto', 'Datos y calendarios del cronograma', 'Requisitos de financiación relacionados con el tiempo', 'Actualizaciones a los documentos del proyecto'],
  ejemplo: {
    titulo: 'Cálculo de la ruta crítica paso a paso',
    contexto: 'Cinco actividades: A (5 días, sin predecesoras) · B (3 d, tras A) · C (7 d, tras A) · D (4 d, tras B) · E (2 d, tras C y D).',
    aplicacion: '<b>Rutas posibles:</b><br>A → B → D → E = 5 + 3 + 4 + 2 = <b>14 días</b><br>A → C → E = 5 + 7 + 2 = <b>14 días</b><br>Hay <b>dos rutas críticas</b> de 14 días. Todas las actividades tienen holgura cero.',
    resultado: 'Dos rutas críticas simultáneas significan que <b>cualquier</b> retraso en cualquier actividad retrasa el proyecto: no hay margen en ningún camino. La consecuencia práctica es que se requiere vigilancia sobre las cinco actividades y que la compresión debe aplicarse a ambas rutas a la vez para tener efecto: acortar solo C no adelanta el proyecto ni un día.'
  },
  errores: ['Confundir duración con esfuerzo', 'No nivelar recursos antes de comprometer la fecha', 'Comprimir actividades fuera de la ruta crítica', 'Programar sin holgura ni reservas'],
  preguntas: [
    { q: '¿Cómo se calculan holgura total y holgura libre?',
      a: '<b>Holgura total</b> = Inicio Tardío − Inicio Temprano (equivalente a Fin Tardío − Fin Temprano): cuánto puede retrasarse la actividad sin afectar la fecha de fin del proyecto. <b>Holgura libre</b> = Inicio Temprano de la actividad sucesora − Fin Temprano de esta actividad: cuánto puede retrasarse sin afectar el inicio temprano de la siguiente. La holgura libre nunca supera a la total.' },
    { q: '¿Qué es el método de la cadena crítica?',
      a: 'Una variante que considera además la <b>disponibilidad de recursos</b>, no solo las dependencias lógicas. Retira los márgenes de seguridad ocultos dentro de cada actividad —donde se consumen inevitablemente— y los agrupa en <b>amortiguadores</b> explícitos: uno de proyecto al final y otros de alimentación en las rutas que confluyen con la crítica. El seguimiento se hace sobre el consumo del amortiguador, no sobre el cumplimiento de cada fecha individual.' }
  ]
},
{
  id: 'p-cro-03', cod: '2.3.3', nombre: 'Monitorear y Controlar el Cronograma',
  dominio: 'cronograma', area: 'monitoreo',
  proposito: 'Dar seguimiento al estado del proyecto para actualizar el avance y gestionar los cambios sobre la línea base del cronograma.',
  descripcion: [
    'Compara el avance real con la línea base, identifica desviaciones, analiza sus causas y determina si se requieren acciones correctivas o un cambio formal de la línea base.',
    'Su valor está en la **anticipación**: detectar la tendencia antes de que la desviación sea irrecuperable. Un SPI que baja de 0,98 a 0,95 y a 0,92 en tres períodos consecutivos es una señal más importante que su valor absoluto.'
  ],
  entradas: ['Plan de dirección del proyecto (cronograma y líneas base)', 'Cronograma del proyecto y datos de desempeño del trabajo', 'Calendarios de recursos', 'Activos de los procesos de la organización'],
  herramientas: ['Análisis del valor ganado del cronograma (SV, SPI)', 'Análisis de la ruta crítica y de tendencias', 'Método de la cadena crítica (consumo de amortiguadores)', 'Compresión del cronograma', 'Análisis de escenarios «¿qué pasa si?»', 'Sistema de información para la dirección de proyectos'],
  salidas: ['Información de desempeño del trabajo (SV, SPI)', 'Pronósticos del cronograma', 'Solicitudes de cambio', 'Actualizaciones al plan de dirección y a los documentos del proyecto'],
  ejemplo: {
    titulo: 'La tendencia dice más que el valor',
    contexto: 'Tres proyectos reportan SPI de 0,93 en el mismo período.',
    aplicacion: '<b>Proyecto A:</b> SPI de 0,93 tras cuatro períodos en 0,99, 0,97, 0,95, 0,93. Tendencia descendente sostenida → problema estructural, probablemente subestimación sistemática o pérdida de capacidad.<br><b>Proyecto B:</b> SPI de 0,93 tras 0,88, 0,90, 0,92, 0,93. Tendencia ascendente → una acción correctiva previa está funcionando; mantener el rumbo.<br><b>Proyecto C:</b> SPI de 0,93 tras 1,02, 0,99, 1,01, 0,93. Caída abrupta puntual → buscar el evento específico que la causó.',
    resultado: 'El mismo número exige tres respuestas distintas: replanificar en A, mantener en B, investigar el evento en C. Reportar el SPI sin su serie histórica hace imposible esta distinción.'
  },
  errores: ['Reportar el valor sin la tendencia', 'Actualizar la línea base para ocultar el retraso', 'Comprimir sin analizar la causa de la desviación', 'Ignorar los hitos intermedios y vigilar solo la fecha final'],
  preguntas: [
    { q: '¿Qué hago si el proyecto lleva retraso?',
      a: 'En orden: <b>(1)</b> determinar la causa raíz —no comprimir sobre un síntoma—; <b>(2)</b> verificar si la desviación está en la ruta crítica, porque fuera de ella puede no importar; <b>(3)</b> evaluar opciones cuantificadas: recuperar con holgura, intensificar, ejecutar en paralelo, reducir alcance o renegociar la fecha; <b>(4)</b> presentar el análisis a quien tenga autoridad para decidir. Comprimir de inmediato sin diagnóstico es la reacción más común y la que más veces empeora la situación.' },
    { q: '¿Puedo cambiar la línea base del cronograma?',
      a: 'Solo mediante solicitud de cambio aprobada, y con conciencia de lo que implica: al mover la línea base, la desviación acumulada <b>desaparece del registro</b>. Se pierde la capacidad de aprender de ella y de estimar mejor en el futuro. Por eso muchas organizaciones conservan la línea base original junto a la revisada, para poder medir la desviación total.' }
  ]
},

/* ══════════ DOMINIO 4 · FINANZAS (4) ══════════ */
{
  id: 'p-fin-01', cod: '2.4.1', nombre: 'Planificar la Gestión Financiera',
  dominio: 'finanzas', area: 'planificacion',
  proposito: 'Establecer cómo se estimarán, presupuestarán, financiarán, gestionarán y controlarán los costos del proyecto.',
  descripcion: [
    'Va más allá de la antigua «planificación de la gestión de los costos»: incorpora la **financiación y el flujo de caja**, es decir, de dónde sale el dinero y cuándo se necesita.',
    'Define también las reglas de medición del desempeño financiero, los umbrales de control y el método de cálculo de reservas.'
  ],
  entradas: ['Acta de constitución', 'Plan de dirección del proyecto (alcance, cronograma, riesgos)', 'Caso de negocio y plan de beneficios', 'Políticas financieras de la organización', 'Factores ambientales (inflación, tipo de cambio, tasas)'],
  herramientas: ['Juicio de expertos', 'Análisis de datos y de alternativas de financiación', 'Reuniones con el área financiera'],
  salidas: ['Plan de gestión financiera (o de los costos)'],
  ejemplo: {
    titulo: 'El flujo de caja que casi detuvo un proyecto rentable',
    contexto: 'Proyecto de 18 meses y 2,4 M USD con VAN positivo de 3,1 M a cinco años.',
    aplicacion: 'El plan financiero modela el flujo de caja mes a mes y detecta un problema que el presupuesto agregado ocultaba: entre los meses 4 y 7 se concentran los pagos de licencias y hardware (1,1 M USD), mientras que la financiación aprobada libera fondos en tramos trimestrales iguales de 400.000 USD. En el mes 6 habría un déficit de 340.000 USD.',
    resultado: 'Se renegocian dos calendarios: la liberación de fondos pasa a tramos desiguales alineados con la necesidad, y el pago de licencias se fracciona en tres cuotas. El proyecto era rentable y habría fracasado igualmente por iliquidez en el mes 6. <b>Rentabilidad y liquidez son problemas distintos.</b>'
  },
  errores: ['Presupuestar sin modelar el flujo de caja', 'No definir el método de cálculo de reservas', 'Ignorar inflación y tipo de cambio en proyectos plurianuales o internacionales', 'Omitir los umbrales de control'],
  preguntas: [
    { q: '¿Qué debe contener el plan de gestión financiera?',
      a: 'Unidades de medida y moneda; nivel de precisión y de exactitud exigidos; umbrales de control y tolerancias; reglas de medición del desempeño (método de valor ganado, fórmula de EAC a usar); formatos y frecuencia de reporte; método de cálculo y gobierno de las reservas; fuentes de financiación y calendario de liberación de fondos; y tratamiento de la inflación y del riesgo cambiario cuando aplique.' }
  ]
},
{
  id: 'p-fin-02', cod: '2.4.2', nombre: 'Estimar los Costos',
  dominio: 'finanzas', area: 'planificacion',
  proposito: 'Desarrollar una aproximación de los recursos monetarios necesarios para completar el trabajo del proyecto.',
  descripcion: [
    'La estimación es **progresiva**: su precisión mejora conforme avanza el proyecto y se conoce más. Comprometer un número definitivo sobre información de orden de magnitud es una de las causas más frecuentes de fracaso presupuestario.',
    'Una estimación profesional siempre incluye su **rango y sus supuestos**, nunca un número aislado.'
  ],
  entradas: ['Plan de gestión financiera', 'Línea base del alcance y diccionario de la EDT', 'Cronograma y estimaciones de recursos', 'Registro de riesgos', 'Datos históricos y estimaciones de proyectos previos'],
  herramientas: ['Estimación análoga, paramétrica, ascendente y de tres valores', 'Juicio de expertos', 'Análisis de reserva', 'Costo de la calidad', 'Análisis de propuestas de proveedores', 'Toma de decisiones grupal (póquer de planificación, Delphi)'],
  salidas: ['Estimaciones de costos', 'Base de las estimaciones (supuestos, rango, nivel de confianza)', 'Actualizaciones a los documentos del proyecto'],
  ejemplo: {
    titulo: 'La misma actividad, tres estimaciones legítimas',
    contexto: 'Desarrollo de un módulo de integración con un sistema externo.',
    aplicacion: '<b>Análoga:</b> «El módulo equivalente del proyecto anterior costó 78.000 USD; este es algo más complejo → 90.000 USD, rango −25 % a +75 %.» Tiempo de elaboración: 20 minutos.<br><b>Paramétrica:</b> «Históricamente cada punto de integración cuesta 11.500 USD; este módulo tiene 7 puntos → 80.500 USD, ±20 %.» Tiempo: 2 horas.<br><b>Tres valores (PERT):</b> O = 62.000, M = 79.000, P = 130.000 → (62.000 + 4×79.000 + 130.000)/6 = <b>84.667 USD</b>; desviación estándar = (130.000 − 62.000)/6 ≈ 11.333. Tiempo: medio día con el equipo.',
    resultado: 'Las tres son válidas en momentos distintos. La de tres valores aporta algo que las otras no: cuantifica la <b>asimetría del riesgo</b> —el pesimista está mucho más lejos del más probable que el optimista—, lo que indica que la exposición al sobrecosto es alta y justifica una reserva mayor.'
  },
  errores: ['Comprometer un número sin rango ni supuestos', 'Estimar sin registrar la base de la estimación', 'Confundir estimación con objetivo impuesto', 'Omitir costos indirectos, de calidad o de gestión'],
  preguntas: [
    { q: '¿Qué es la «base de las estimaciones» y por qué importa?',
      a: 'La documentación de <b>cómo se llegó al número</b>: método usado, supuestos, restricciones consideradas, rango de confianza y riesgos identificados. Importa por dos razones prácticas: permite <b>revisar la estimación</b> cuando un supuesto cambia, en lugar de rehacerla desde cero; y permite <b>defenderla</b> ante quien la cuestione con argumentos verificables en lugar de con autoridad.' },
    { q: '¿Cómo respondo si me imponen un presupuesto menor al estimado?',
      a: 'No aceptando en silencio ni rechazando de plano. La respuesta profesional presenta las <b>consecuencias cuantificadas</b>: con este presupuesto, qué alcance es alcanzable, qué riesgos quedan sin reserva y cuál es la probabilidad de cumplimiento. Después se ofrecen alternativas: reducir alcance, extender el plazo o aceptar mayor riesgo con reserva insuficiente. La decisión pertenece a quien tiene autoridad presupuestaria; la información completa, a quien estima.' }
  ]
},
{
  id: 'p-fin-03', cod: '2.4.3', nombre: 'Desarrollar el Presupuesto',
  dominio: 'finanzas', area: 'planificacion',
  proposito: 'Sumar los costos estimados de las actividades para establecer una línea base de costos autorizada y distribuida en el tiempo.',
  descripcion: [
    'Agrega las estimaciones individuales, añade reservas y distribuye el resultado a lo largo del cronograma, produciendo la **curva S** de costo acumulado.',
    'La estructura es acumulativa y su orden importa: estimaciones de actividad → cuentas de control → reserva de contingencia → **línea base de costos** → reserva de gestión → **presupuesto total del proyecto**.'
  ],
  entradas: ['Plan de gestión financiera', 'Estimaciones de costos y su base', 'Línea base del alcance y cronograma del proyecto', 'Registro de riesgos', 'Acuerdos y decisiones de hacer o comprar'],
  herramientas: ['Agregación de costos', 'Análisis de reserva', 'Revisión de información histórica', 'Conciliación del límite de financiamiento', 'Financiamiento y análisis de flujo de caja'],
  salidas: ['Línea base de costos', 'Requisitos de financiación del proyecto', 'Actualizaciones a los documentos del proyecto'],
  ejemplo: {
    titulo: 'Construcción del presupuesto capa por capa',
    contexto: 'Proyecto con cuatro cuentas de control.',
    aplicacion: 'Estimaciones de paquetes de trabajo: 1.240.000 USD<br>+ Reserva de contingencia (riesgos identificados, calculada por suma de VME): 148.000 USD<br>= <b>Línea base de costos: 1.388.000 USD</b> ← contra esto se mide el desempeño y se calcula el valor ganado<br>+ Reserva de gestión (riesgos no identificados, 8 % de la línea base): 111.000 USD<br>= <b>Presupuesto total del proyecto: 1.499.000 USD</b>',
    resultado: 'La distinción tiene consecuencias operativas inmediatas: el BAC usado en los cálculos de valor ganado es <b>1.388.000</b>, no 1.499.000. Usar el presupuesto total como BAC produce un CPI artificialmente favorable y oculta desviaciones reales.'
  },
  errores: ['Incluir la reserva de gestión en la línea base de costos', 'No distribuir el presupuesto en el tiempo', 'Ignorar el límite de financiación por período', 'Usar el presupuesto total como BAC en los cálculos de valor ganado'],
  preguntas: [
    { q: '¿Qué es la conciliación del límite de financiamiento?',
      a: 'El ajuste del cronograma de trabajo cuando el gasto planificado en un período supera los fondos disponibles en ese período. Puede obligar a <b>reprogramar actividades</b> para diferir gasto, aunque técnicamente pudieran ejecutarse antes. Es un caso claro de restricción financiera que condiciona el cronograma, y una de las razones por las que Finanzas y Cronograma deben planificarse de forma coordinada.' },
    { q: '¿Qué es la curva S y qué revela?',
      a: 'La representación del costo acumulado planificado a lo largo del tiempo. Su forma de S refleja un patrón real: gasto lento al inicio (planificación), acelerado en el medio (ejecución) y lento al final (cierre). Comparar la curva de costo real con la planificada revela desviaciones visualmente; su pendiente indica el ritmo de consumo, que suele ser más informativo que el acumulado.' }
  ]
},
{
  id: 'p-fin-04', cod: '2.4.4', nombre: 'Monitorear y Controlar las Finanzas',
  dominio: 'finanzas', area: 'monitoreo',
  proposito: 'Dar seguimiento al estado financiero del proyecto, gestionar los cambios sobre la línea base de costos y verificar la vigencia del caso de negocio.',
  descripcion: [
    'Además del control clásico del gasto mediante valor ganado, la 8.ª edición incorpora explícitamente la **verificación de que el proyecto sigue valiendo la pena**: el caso de negocio se revisa con datos actualizados, no se da por válido hasta el final.',
    'Un proyecto puede estar dentro de presupuesto y haber dejado de ser una buena inversión.'
  ],
  entradas: ['Plan de dirección del proyecto (finanzas y líneas base)', 'Requisitos de financiación', 'Datos de desempeño del trabajo', 'Documentos de negocio actualizados', 'Registro de lecciones aprendidas'],
  herramientas: ['Análisis del valor ganado (CV, CPI, EAC, ETC, TCPI)', 'Análisis de variación y de tendencias', 'Análisis de reserva', 'Índice de desempeño del trabajo por completar (TCPI)', 'Revisión del caso de negocio (VAN, TIR, período de recuperación)', 'Sistema de información para la dirección de proyectos'],
  salidas: ['Información de desempeño del trabajo (CV, CPI)', 'Pronósticos de costos (EAC, ETC)', 'Solicitudes de cambio', 'Actualizaciones al plan de dirección y a los documentos del proyecto'],
  ejemplo: {
    titulo: 'Dentro de presupuesto y aun así mala inversión',
    contexto: 'En el mes 9 de 14, el proyecto reporta CPI de 1,02 y SPI de 0,99: desempeño impecable.',
    aplicacion: 'La revisión del caso de negocio con datos actualizados cuenta otra historia: el mercado objetivo se contrajo un 35 % desde la aprobación, y un competidor lanzó una solución equivalente hace dos meses. Los ingresos proyectados caen de 4,2 M a 1,6 M USD. El VAN pasa de +1,9 M a −0,3 M.',
    resultado: 'Se eleva a gobernanza con tres opciones: continuar (VAN negativo), reorientar a un segmento no atendido por el competidor (VAN estimado +0,7 M) o terminar y recuperar el 30 % restante del presupuesto. Se aprueba la reorientación. <b>Un CPI de 1,02 no dice nada sobre si el proyecto merece existir</b>, y ese es exactamente el vacío que este proceso cubre en la 8.ª edición.'
  },
  errores: ['Medir solo el gasto y no el valor ganado', 'No revisar el caso de negocio durante la ejecución', 'Usar la reserva de gestión sin autorización', 'Aplicar la fórmula de EAC sin diagnosticar la causa de la desviación'],
  preguntas: [
    { q: '¿Qué es el TCPI y para qué sirve?',
      a: 'El índice de desempeño del trabajo por completar: la eficiencia de costo que hace falta <b>a partir de ahora</b> para terminar dentro del objetivo. <code>TCPI = (BAC − EV) / (BAC − AC)</code>. Si el resultado es 1,15, significa que el proyecto debe gastar un 15 % más eficientemente de lo previsto en todo el trabajo restante. Un TCPI muy superior al CPI histórico indica que el objetivo ya no es alcanzable de forma realista, y esa conclusión debe comunicarse en lugar de esperar.' },
    { q: '¿Cuándo se usa cada fórmula de EAC?',
      a: '<code>EAC = BAC / CPI</code> cuando la desviación es <b>sistémica</b> y continuará. <code>EAC = AC + (BAC − EV)</code> cuando fue un <b>evento puntual</b> ya resuelto y el resto se ejecutará según lo planificado. <code>EAC = AC + (BAC − EV)/(CPI × SPI)</code> cuando la desviación es sistémica <b>y</b> además hay presión de cronograma que encarecerá el trabajo restante. La elección es un diagnóstico, no un cálculo.' }
  ]
},

/* ══════════ DOMINIO 5 · INTERESADOS (7) ══════════ */
{
  id: 'p-int-01', cod: '2.5.1', nombre: 'Identificar a los Interesados',
  dominio: 'interesados', area: 'inicio',
  proposito: 'Identificar periódicamente a las personas, grupos y organizaciones que afectan o son afectados por el proyecto, y documentar su influencia e interés.',
  descripcion: [
    'La palabra clave es **periódicamente**: no es una actividad única de arranque. Los interesados cambian a lo largo del proyecto, y los que aparecen tarde son los que más daño causan.',
    'La identificación deficiente es la causa raíz de la mayoría de los requisitos que aparecen en el último tercio del proyecto.'
  ],
  entradas: ['Acta de constitución', 'Documentos de negocio', 'Plan de dirección del proyecto', 'Acuerdos y contratos', 'Factores ambientales (cultura, estructura, regulación)'],
  herramientas: ['Tormenta de ideas y cuestionarios', 'Análisis de interesados (poder, interés, influencia, impacto, actitud)', 'Análisis de documentos', 'Matriz poder/interés, modelo de prominencia, cubo de interesados', 'Juicio de expertos', 'Reuniones'],
  salidas: ['Registro de interesados', 'Solicitudes de cambio', 'Actualizaciones al plan de dirección y a los documentos del proyecto'],
  ejemplo: {
    titulo: 'Cuatro preguntas que rescatan interesados invisibles',
    contexto: 'Taller de identificación en un proyecto de digitalización de trámites municipales.',
    aplicacion: 'Tras la lista obvia (alcaldía, tecnología, atención al ciudadano), se aplican cuatro preguntas sistemáticas:<br><b>¿Quién puede decir que no?</b> → oficina de protección de datos, archivo municipal (custodia legal de documentos), interventoría.<br><b>¿Quién sufre el cambio sin haberlo pedido?</b> → funcionarios de ventanilla, ciudadanos sin acceso digital, gestores externos.<br><b>¿Quién pierde algo si esto funciona?</b> → tramitadores informales, imprenta que produce los formularios.<br><b>¿Quién mantendrá esto en dos años?</b> → soporte técnico municipal, proveedor de hospedaje.',
    resultado: 'La lista pasa de 8 a 19 interesados. Tres de los nuevos —protección de datos, archivo municipal e interventoría— tienen poder de veto y habrían aparecido en la fase de pruebas. La de ciudadanos sin acceso digital generó un requisito de canal presencial asistido que se convirtió en criterio de aceptación político.'
  },
  errores: ['Identificar solo una vez, al inicio', 'Omitir interesados negativos o con poder de veto', 'Confundir el cargo con la persona: quien decide puede no ser quien firma', 'No registrar la actitud, solo el rol'],
  preguntas: [
    { q: '¿Qué información debe contener el registro de interesados?',
      a: 'Tres bloques. <b>Identificación</b>: nombre, cargo, organización, rol en el proyecto, datos de contacto. <b>Evaluación</b>: requisitos principales, expectativas, influencia potencial, fase de mayor interés. <b>Clasificación</b>: interno o externo, partidario o reticente, poder e interés. El registro es confidencial en su sección de evaluación: contiene juicios sobre personas que no deben circular sin criterio.' },
    { q: '¿Qué es el modelo de prominencia (salience)?',
      a: 'Clasifica a los interesados por tres atributos: <b>poder</b> (capacidad de imponer su voluntad), <b>legitimidad</b> (que su participación sea apropiada) y <b>urgencia</b> (que su demanda requiera atención inmediata). Quien reúne los tres es un interesado <b>definitivo</b> y exige atención prioritaria. Su utilidad es distinguir a quien grita mucho pero carece de legitimidad de quien tiene poder real aunque no lo esté ejerciendo.' }
  ]
},
{
  id: 'p-int-02', cod: '2.5.2', nombre: 'Planificar el Involucramiento de los Interesados',
  dominio: 'interesados', area: 'planificacion',
  proposito: 'Desarrollar estrategias para involucrar a los interesados de acuerdo con sus necesidades, expectativas, intereses y su impacto potencial en el proyecto.',
  descripcion: [
    'Traduce el análisis en **acción**: para cada interesado o grupo, define el nivel de involucramiento deseado y qué hacer para alcanzarlo.',
    'Su instrumento característico es la matriz de evaluación del involucramiento, que compara el nivel actual (C) con el deseado (D) en cinco grados: desconocedor, reticente, neutral, partidario y líder.'
  ],
  entradas: ['Acta de constitución', 'Plan de dirección del proyecto', 'Registro de interesados', 'Registro de riesgos y de cambios', 'Factores ambientales y activos de la organización'],
  herramientas: ['Análisis de interesados y de supuestos', 'Matriz de evaluación del involucramiento', 'Análisis de causa raíz de la resistencia', 'Toma de decisiones y priorización', 'Reuniones y juicio de expertos'],
  salidas: ['Plan de involucramiento de los interesados'],
  ejemplo: {
    titulo: 'Matriz de involucramiento con estrategias',
    contexto: 'Cinco interesados clave de un proyecto de cambio operativo.',
    aplicacion: '<table><tr><th>Interesado</th><th>Actual</th><th>Deseado</th><th>Estrategia</th></tr><tr><td>Patrocinador</td><td>Partidario</td><td>Líder</td><td>Pedirle que abra personalmente cada revisión de fase ante la dirección</td></tr><tr><td>Jefe de operaciones</td><td>Reticente</td><td>Partidario</td><td>Que defina los criterios de aceptación operativa y designe probadores de su equipo</td></tr><tr><td>Área legal</td><td>Desconocedor</td><td>Neutral</td><td>Sesión de contexto de 1 hora + informar solo ante decisiones con implicación jurídica</td></tr><tr><td>Usuarios de ventanilla</td><td>Neutral</td><td>Partidario</td><td>Grupo de 6 usuarios en pruebas quincenales, con sus aportes visibles en el producto</td></tr><tr><td>Proveedor</td><td>Partidario</td><td>Partidario</td><td>Mantener: reunión quincenal de coordinación</td></tr></table>',
    resultado: 'Nótese que no todos deben llegar a «líder»: llevar al área legal de desconocedor a neutral es suficiente y evita consumir su tiempo sin necesidad. Sobre-involucrar es tan disfuncional como sub-involucrar.'
  },
  errores: ['Aspirar a que todos sean «líderes»', 'Confundir estrategia de involucramiento con calendario de envío de informes', 'No analizar la causa de la resistencia antes de diseñar la estrategia', 'Hacer público el plan con las evaluaciones de actitud'],
  preguntas: [
    { q: '¿Los cinco niveles de involucramiento?',
      a: '<b>Desconocedor</b> (no sabe del proyecto ni de sus impactos), <b>reticente</b> (conoce y se resiste al cambio), <b>neutral</b> (conoce, ni apoya ni se opone), <b>partidario</b> (conoce y apoya) y <b>líder</b> (conoce y participa activamente en asegurar el éxito). Se marcan con C el actual y con D el deseado; la brecha entre ambos define la estrategia.' },
    { q: '¿Debo compartir el plan de involucramiento con los interesados?',
      a: 'La <b>sección de estrategias generales</b> puede compartirse, y hacerlo transmite transparencia. La <b>evaluación individual de actitud</b> no: contiene juicios sobre personas concretas («reticente», «bloqueador potencial») cuya circulación destruye la confianza que el plan pretende construir. Es información de trabajo del equipo de dirección, no un documento público.' }
  ]
},
{
  id: 'p-int-03', cod: '2.5.3', nombre: 'Planificar la Gestión de las Comunicaciones',
  dominio: 'interesados', area: 'planificacion',
  proposito: 'Desarrollar un enfoque y un plan apropiados para las comunicaciones del proyecto, basados en las necesidades de información de cada interesado.',
  descripcion: [
    'Deriva directamente del plan de involucramiento: primero se determina qué nivel de involucramiento se busca de cada interesado, y de ahí se deduce qué comunicar, con qué frecuencia y por qué canal.',
    'Un plan de comunicaciones que no derive del análisis de interesados es un calendario de envíos, no una estrategia.'
  ],
  entradas: ['Acta de constitución', 'Plan de dirección del proyecto (recursos e involucramiento)', 'Registro de interesados', 'Requisitos de comunicación de los interesados', 'Factores ambientales (idioma, cultura, husos horarios, tecnología)'],
  herramientas: ['Análisis de requisitos de comunicación (cálculo de canales)', 'Tecnología, modelos y métodos de comunicación', 'Habilidades interpersonales y de comunicación', 'Representación de datos (matriz de evaluación del involucramiento)', 'Reuniones'],
  salidas: ['Plan de gestión de las comunicaciones', 'Actualizaciones al plan de dirección y a los documentos del proyecto'],
  ejemplo: {
    titulo: 'Una fila del plan de comunicaciones',
    contexto: 'Fragmento del plan para un proyecto con 22 interesados.',
    aplicacion: '<table><tr><th>Qué</th><th>A quién</th><th>Cuándo</th><th>Canal</th><th>Formato</th><th>Responsable</th></tr><tr><td>Informe ejecutivo de desempeño</td><td>Patrocinador y comité</td><td>Último viernes de cada mes</td><td>Correo + reunión de 30 min</td><td>1 página: semáforo, 3 riesgos, 2 decisiones requeridas</td><td>Director de proyecto</td></tr><tr><td>Estado detallado</td><td>Equipo y líderes técnicos</td><td>Lunes 9:00</td><td>Tablero + reunión de 15 min</td><td>Tablero visual, impedimentos</td><td>Líder técnico</td></tr><tr><td>Aviso de cambio aprobado</td><td>Todos los afectados</td><td>Dentro de 24 h de la aprobación</td><td>Correo</td><td>Qué cambia, desde cuándo, qué hacer</td><td>Director de proyecto</td></tr><tr><td>Demostración de incremento</td><td>Usuarios y propietario de producto</td><td>Cada 2 semanas</td><td>Sesión en vivo</td><td>Demostración + recogida de retroalimentación</td><td>Equipo</td></tr></table>',
    resultado: 'Cada fila responde las seis preguntas. El punto crítico es el <b>formato</b>: enviar al comité el mismo informe detallado que al equipo garantiza que no lo lea. La adaptación del formato a la audiencia es lo que distingue un plan útil de una lista de envíos.'
  },
  errores: ['Mismo formato para todas las audiencias', 'Comunicar en exceso hasta que dejan de leer', 'No definir responsable de cada comunicación', 'Olvidar la comunicación de cambios aprobados'],
  preguntas: [
    { q: '¿Cuáles son los métodos de comunicación y cuándo usar cada uno?',
      a: '<b>Interactiva</b> (reunión, llamada, conversación): bidireccional e inmediata, la más rica; obligatoria para temas complejos, negociaciones o conflictos. <b>Push</b> (correo, informe, memorando): se envía a destinatarios específicos, asegura distribución pero no comprensión ni recepción; adecuada para información que debe constar. <b>Pull</b> (repositorio, tablero, portal): el receptor accede cuando lo necesita; adecuada para volúmenes grandes y audiencias amplias. El error habitual es usar push para lo que exige interactiva: comunicar una mala noticia por correo.' },
    { q: '¿Qué es el modelo emisor–receptor y qué implica?',
      a: 'Codificar → transmitir → decodificar, con <b>ruido</b> en cada etapa (idioma, cultura, supuestos, distracción, tecnología) y <b>retroalimentación</b> para confirmar la comprensión. Su implicación práctica es directa: la responsabilidad de que el mensaje se entienda es del <b>emisor</b>, no del receptor. «Se lo envié» no es comunicación; «confirmó que lo entendió» sí.' }
  ]
},
{
  id: 'p-int-04', cod: '2.5.4', nombre: 'Gestionar el Involucramiento de los Interesados',
  dominio: 'interesados', area: 'ejecucion',
  proposito: 'Comunicarse y trabajar con los interesados para satisfacer sus necesidades, abordar incidentes y fomentar su participación en el proyecto.',
  descripcion: [
    'Es la ejecución del plan de involucramiento. Su contenido real es **relacional**: conversaciones, negociaciones, resolución de conflictos y construcción de confianza.',
    'La medida de su éxito no es el número de reuniones celebradas, sino el movimiento observable de los interesados hacia el nivel de involucramiento deseado.'
  ],
  entradas: ['Plan de dirección del proyecto (involucramiento, comunicaciones, riesgos, cambios)', 'Registro de interesados, de incidentes y de cambios', 'Factores ambientales y activos de la organización'],
  herramientas: ['Habilidades de comunicación (retroalimentación, escucha activa)', 'Habilidades interpersonales (gestión de conflictos, negociación, conciencia cultural, liderazgo)', 'Reglas básicas y facilitación', 'Toma de decisiones y juicio de expertos', 'Reuniones'],
  salidas: ['Solicitudes de cambio', 'Actualizaciones al plan de dirección y a los documentos del proyecto', 'Registro de incidentes actualizado'],
  ejemplo: {
    titulo: 'Gestionar una resistencia con causa legítima',
    contexto: 'La jefa de contabilidad bloquea sistemáticamente las reuniones de definición del nuevo sistema. Su equipo no asiste y no entrega la información solicitada.',
    aplicacion: 'La lectura superficial la califica de obstruccionista. Una conversación individual revela la causa: en la implantación anterior, su equipo trabajó tres meses en horas extra no reconocidas y el sistema resultante duplicó su carga administrativa. Su resistencia es una <b>protección aprendida</b>, no un capricho.<br>La estrategia se ajusta: se acuerda por escrito un límite de dedicación de su equipo (máximo 4 h/semana), se incorporan dos de sus indicadores como criterios de aceptación del sistema, y se le da autoridad de veto sobre el arranque si esos indicadores no se cumplen en pruebas.',
    resultado: 'La participación se normaliza en tres semanas. La resistencia de un interesado casi nunca es irracional: es la respuesta previsible de quien asume el costo del cambio sin control sobre él. Escalar antes de entender la causa habría producido cumplimiento formal y sabotaje real.'
  },
  errores: ['Escalar la resistencia antes de entender su causa', 'Tratar el involucramiento como envío de información', 'Gestionar solo a los interesados agradables', 'No registrar los compromisos adquiridos en las conversaciones'],
  preguntas: [
    { q: '¿Cómo manejo a un interesado que siempre se opone?',
      a: 'Primero, <b>entender la causa</b> mediante conversación individual: casi siempre hay un interés legítimo detrás —temor a perder control, experiencia previa negativa, carga de trabajo, riesgo operativo que asumirá—. Segundo, buscar la forma de <b>incorporar ese interés</b> al diseño de la solución. Tercero, si tras entenderlo la oposición persiste y bloquea el proyecto, escalar con hechos documentados. El orden importa: escalar primero convierte una diferencia en un conflicto de poder.' },
    { q: '¿Cuál es la técnica preferida para resolver conflictos?',
      a: '<b>Colaborar / resolver el problema</b>: buscar una solución que integre las necesidades de ambas partes. Produce el resultado más sostenible porque nadie queda con una pérdida que reactive el conflicto. Es también la más costosa en tiempo. <b>Comprometer</b> (ambos ceden) es aceptable cuando el tiempo apremia. <b>Forzar</b> resuelve rápido y deteriora la relación; se reserva para emergencias. <b>Suavizar</b> y <b>retirarse</b> posponen el problema y rara vez son adecuadas salvo para enfriar una discusión y retomarla.' }
  ]
},
{
  id: 'p-int-05', cod: '2.5.5', nombre: 'Gestionar las Comunicaciones',
  dominio: 'interesados', area: 'ejecucion',
  proposito: 'Asegurar la recopilación, creación, distribución, almacenamiento, recuperación y disposición final de la información del proyecto de forma oportuna y adecuada.',
  descripcion: [
    'Ejecuta el plan de comunicaciones, pero no de forma mecánica: exige **adaptar el mensaje a la audiencia** y verificar que la información llegó y se comprendió.',
    'La responsabilidad de la comprensión recae en el emisor. Enviar no es comunicar.'
  ],
  entradas: ['Plan de dirección del proyecto (comunicaciones e involucramiento)', 'Informes de desempeño del trabajo', 'Registro de cambios, incidentes y lecciones aprendidas', 'Factores ambientales y activos de la organización'],
  herramientas: ['Tecnología y métodos de comunicación', 'Habilidades de comunicación (competencia, retroalimentación, no verbal, presentaciones)', 'Sistema de información para la dirección de proyectos', 'Presentación de informes y gestión de reuniones', 'Habilidades interpersonales (escucha activa, conciencia cultural)'],
  salidas: ['Comunicaciones del proyecto', 'Actualizaciones al plan de dirección y a los documentos del proyecto', 'Actualizaciones a los activos de la organización'],
  ejemplo: {
    titulo: 'El mismo hecho, tres mensajes',
    contexto: 'Hecho: un defecto crítico en el módulo de pagos obliga a posponer el lanzamiento dos semanas.',
    aplicacion: '<b>Al patrocinador</b> (decisión y consecuencias): «Retrasamos el lanzamiento del 15 al 29 de marzo por un defecto crítico en pagos. Impacto: 18.000 USD adicionales, absorbidos por la contingencia. Alternativa evaluada y descartada: lanzar sin el módulo de pagos, porque haría inviable el caso de negocio. Necesito tu confirmación antes del jueves.»<br><b>Al equipo</b> (acción y foco): «Lanzamiento el 29. Prioridad absoluta: corrección del defecto INC-441. Congelamos nuevas funcionalidades hasta el cierre. Revisión diaria a las 9:30 hasta resolverlo.»<br><b>A los usuarios</b> (efecto práctico y confianza): «El nuevo sistema estará disponible el 29 de marzo, dos semanas después de lo previsto. La demora nos permite corregir un problema en los pagos antes de que os afecte. La formación se traslada a la semana del 24.»',
    resultado: 'Un mismo hecho comunicado en tres registros. Enviar el mensaje del patrocinador a los usuarios generaría alarma innecesaria; enviar el de los usuarios al patrocinador ocultaría la decisión que debe tomar.'
  },
  errores: ['Enviar el mismo mensaje a todas las audiencias', 'Comunicar malas noticias por canal escrito unidireccional', 'No verificar la comprensión', 'Saturar hasta que los destinatarios dejan de leer'],
  preguntas: [
    { q: '¿Cómo verifico que la comunicación fue efectiva?',
      a: 'Con <b>retroalimentación explícita</b>: pedir que el receptor resuma lo entendido o lo que hará a continuación. En comunicaciones críticas, confirmación de recepción y comprensión por escrito. Como indicador agregado: si aparecen sorpresas —alguien se entera tarde de algo que le afectaba— la comunicación no fue efectiva por muchos correos que se hayan enviado.' },
    { q: '¿Qué proporción del tiempo dedica un director de proyecto a comunicar?',
      a: 'Los estudios del PMI sitúan la cifra en torno al <b>90 %</b> de su jornada, en todas sus formas: reuniones, informes, negociaciones, conversaciones y escucha. El dato tiene una implicación práctica: la competencia comunicativa no es una habilidad complementaria del rol, es su actividad principal.' }
  ]
},
{
  id: 'p-int-06', cod: '2.5.6', nombre: 'Monitorear el Involucramiento de los Interesados',
  dominio: 'interesados', area: 'monitoreo',
  proposito: 'Vigilar las relaciones con los interesados y ajustar las estrategias para involucrarlos de forma efectiva.',
  descripcion: [
    'Verifica si las estrategias están funcionando: si los interesados se mueven hacia el nivel deseado, si aparecen nuevos, y si alguno cambió de actitud.',
    'Los indicadores son en buena medida cualitativos, pero pueden observarse: asistencia a reuniones, velocidad de respuesta, calidad de la retroalimentación, tono de las comunicaciones.'
  ],
  entradas: ['Plan de dirección del proyecto (involucramiento, comunicaciones, recursos)', 'Registro de interesados y de incidentes', 'Datos de desempeño del trabajo', 'Factores ambientales y activos de la organización'],
  herramientas: ['Análisis de alternativas, de causa raíz y de interesados', 'Matriz de evaluación del involucramiento', 'Encuestas de satisfacción y entrevistas', 'Habilidades de comunicación e interpersonales', 'Reuniones'],
  salidas: ['Información de desempeño del trabajo', 'Solicitudes de cambio', 'Actualizaciones al plan de dirección y a los documentos del proyecto'],
  ejemplo: {
    titulo: 'Señales tempranas de desconexión',
    contexto: 'Revisión trimestral del involucramiento en un proyecto de 12 meses.',
    aplicacion: 'Se revisan indicadores observables por interesado: <b>asistencia</b> (el patrocinador pasó de asistir al 100 % de las revisiones a delegar en las dos últimas), <b>tiempo de respuesta</b> (el área legal pasó de 2 a 9 días), <b>calidad de la retroalimentación</b> (los usuarios ya no proponen mejoras, solo aprueban), <b>tono</b> (el proveedor introduce lenguaje contractual defensivo en sus correos).',
    resultado: 'Las cuatro señales se investigan. La del patrocinador resulta ser la más grave: fue asignado a otra iniciativa prioritaria y su atención se desplazó. Se acuerda una reunión mensual breve y protegida en su agenda, más un delegado con autoridad formal para las decisiones intermedias. Detectarlo por la asistencia permitió actuar antes de que una decisión quedara bloqueada.'
  },
  errores: ['Medir solo el cumplimiento del calendario de comunicaciones', 'No detectar el desplazamiento de atención del patrocinador', 'Asumir que quien no se queja está satisfecho', 'No actualizar el registro de interesados durante la ejecución'],
  preguntas: [
    { q: '¿Cómo mido algo tan cualitativo como el involucramiento?',
      a: 'Con <b>proxies observables</b>: tasa de asistencia a reuniones convocadas, tiempo medio de respuesta a solicitudes, número y calidad de aportes en revisiones, proporción de decisiones tomadas dentro del plazo acordado, resultados de una encuesta breve de dos o tres preguntas. Ninguno es preciso por sí solo; su <b>tendencia conjunta</b> sí es informativa.' },
    { q: '¿Qué hago si el patrocinador pierde interés?',
      a: 'Es un riesgo de gobernanza de severidad alta y debe registrarse como tal, con su impacto concreto: decisiones que se detendrán, umbrales sin resolver, respaldo político que desaparece. Respuestas posibles: acordar una delegación formal con autoridad explícita, reducir la frecuencia pero aumentar el valor de cada interacción, o vincular de nuevo el proyecto a un objetivo que sí ocupe su atención actual. Lo que no funciona es enviarle más informes.' }
  ]
},
{
  id: 'p-int-07', cod: '2.5.7', nombre: 'Monitorear las Comunicaciones',
  dominio: 'interesados', area: 'monitoreo',
  proposito: 'Asegurar que se satisfacen las necesidades de información del proyecto y de sus interesados.',
  descripcion: [
    'Verifica la **efectividad** de las comunicaciones, no su volumen. Detecta información que no llega, que llega tarde, que no se comprende o que sobra.',
    'Su señal más fiable es la aparición de sorpresas: si un interesado se entera tarde de algo que le afectaba, hay un fallo de comunicación con independencia de cuántos informes se enviaran.'
  ],
  entradas: ['Plan de dirección del proyecto (comunicaciones e involucramiento)', 'Comunicaciones del proyecto', 'Datos de desempeño del trabajo', 'Registro de incidentes', 'Factores ambientales y activos de la organización'],
  herramientas: ['Juicio de expertos', 'Sistema de información para la dirección de proyectos', 'Análisis de datos (matriz de evaluación del involucramiento)', 'Habilidades interpersonales (observación, conversación)', 'Encuestas de efectividad y reuniones'],
  salidas: ['Información de desempeño del trabajo', 'Solicitudes de cambio', 'Actualizaciones al plan de dirección y a los documentos del proyecto'],
  ejemplo: {
    titulo: 'Auditoría de comunicaciones a mitad de proyecto',
    contexto: 'Encuesta de tres preguntas a los 22 interesados en el mes 6.',
    aplicacion: 'Preguntas: (1) ¿Recibes la información que necesitas para hacer tu trabajo? (2) ¿Recibes información que no necesitas? (3) ¿Ha habido algo de lo que te enteraste demasiado tarde?<br><b>Resultados:</b> 4 personas del área de operaciones responden que no reciben información sobre fechas de despliegue, algo esencial para preparar sus turnos. 11 personas reciben el informe técnico semanal y no lo leen. 3 mencionan haberse enterado tarde de un cambio en el alcance que afectaba a su trabajo.',
    resultado: 'Tres ajustes: se añade a operaciones a la comunicación de despliegues con dos semanas de anticipación; se reduce la distribución del informe técnico de 14 a 3 destinatarios; y se establece que todo cambio aprobado se comunique a los afectados en 24 horas. La encuesta costó 15 minutos por persona y corrigió problemas que llevaban seis meses.'
  },
  errores: ['Medir volumen de comunicaciones en lugar de efectividad', 'No preguntar nunca a los interesados si la comunicación les sirve', 'Mantener listas de distribución que nadie revisa', 'Confundir ausencia de quejas con satisfacción'],
  preguntas: [
    { q: '¿Cuál es la diferencia entre este proceso y monitorear el involucramiento?',
      a: 'Este verifica el <b>canal</b>: ¿la información correcta llega a quien la necesita, a tiempo y de forma comprensible? El otro verifica la <b>relación</b>: ¿los interesados están donde queremos que estén en términos de apoyo y participación? Puede haber comunicación impecable e involucramiento pésimo —informes perfectos a un interesado que sigue oponiéndose— y también lo contrario.' }
  ]
},

/* ══════════ DOMINIO 6 · RECURSOS (5) ══════════ */
{
  id: 'p-rec-01', cod: '2.6.1', nombre: 'Planificar la Gestión de los Recursos',
  dominio: 'recursos', area: 'planificacion',
  proposito: 'Definir cómo se estimarán, adquirirán, gestionarán y utilizarán los recursos físicos y del equipo del proyecto.',
  descripcion: [
    'Cubre por igual **personas y recursos físicos**. Define roles y responsabilidades, organigrama del proyecto, estrategia de adquisición, plan de desarrollo del equipo y criterios de liberación.',
    'Su producto más utilizado en la práctica es la asignación clara de responsabilidades, típicamente en una matriz RACI.'
  ],
  entradas: ['Acta de constitución', 'Plan de dirección del proyecto (calidad y alcance)', 'Documentos del proyecto (cronograma, requisitos, riesgos, interesados)', 'Factores ambientales y activos de la organización'],
  herramientas: ['Juicio de expertos', 'Representación de datos (matriz RACI, organigramas, formatos de tipo texto)', 'Teoría organizacional', 'Análisis de alternativas', 'Reuniones'],
  salidas: ['Plan de gestión de los recursos', 'Acta de constitución del equipo', 'Actualizaciones a los documentos del proyecto'],
  ejemplo: {
    titulo: 'Matriz RACI que elimina la ambigüedad',
    contexto: 'Actividades críticas de un proyecto con cinco roles.',
    aplicacion: '<table><tr><th>Actividad</th><th>Dir. proyecto</th><th>Arquitecto</th><th>Analista</th><th>Prop. producto</th><th>Legal</th></tr><tr><td>Definir requisitos</td><td>A</td><td>C</td><td>R</td><td>C</td><td>I</td></tr><tr><td>Diseñar arquitectura</td><td>I</td><td>A/R</td><td>C</td><td>I</td><td>—</td></tr><tr><td>Priorizar backlog</td><td>C</td><td>C</td><td>I</td><td>A/R</td><td>—</td></tr><tr><td>Aprobar tratamiento de datos</td><td>I</td><td>C</td><td>C</td><td>I</td><td>A/R</td></tr><tr><td>Aceptar entregables</td><td>R</td><td>C</td><td>I</td><td>A</td><td>I</td></tr></table>',
    resultado: 'Cada fila tiene <b>una sola A</b>. La última fila resuelve una ambigüedad habitual: el director ejecuta la aceptación (R) pero quien rinde cuentas de que lo aceptado sea lo correcto es el propietario de producto (A). Sin esa distinción, ante un entregable aceptado que resulta inadecuado, ninguno de los dos responde.'
  },
  errores: ['Dos «A» en la misma actividad', 'Planificar personas y olvidar recursos físicos', 'No definir criterios de liberación del equipo', 'Omitir el plan de desarrollo de competencias'],
  preguntas: [
    { q: '¿Qué es el acta de constitución del equipo?',
      a: 'Un documento elaborado <b>por el propio equipo</b> que establece sus reglas de convivencia y trabajo: valores compartidos, normas de comunicación, horarios de disponibilidad, criterios de toma de decisiones, proceso de resolución de conflictos y expectativas de reuniones. Su valor está en el proceso de elaboración: acordar las reglas antes del primer conflicto es mucho más fácil que después.' }
  ]
},
{
  id: 'p-rec-02', cod: '2.6.2', nombre: 'Estimar los Recursos',
  dominio: 'recursos', area: 'planificacion',
  proposito: 'Estimar los recursos del equipo, y el tipo y cantidad de materiales, equipamiento e instalaciones necesarios.',
  descripcion: [
    'Determina qué se necesita, cuánto y cuándo. Su error más frecuente y más costoso es confundir **asignación con capacidad efectiva**: una persona asignada al 100 % no aporta 40 horas semanales de trabajo productivo al proyecto.',
    'Alimenta directamente la estimación de duraciones y la de costos, por lo que un error aquí se propaga a los dos dominios.'
  ],
  entradas: ['Plan de gestión de los recursos', 'Línea base del alcance y cronograma', 'Registro de supuestos y de riesgos', 'Estimaciones de costos', 'Disponibilidad y calendarios de recursos'],
  herramientas: ['Estimación análoga, paramétrica y ascendente', 'Análisis de datos y de alternativas', 'Juicio de expertos', 'Sistema de información para la dirección de proyectos', 'Reuniones'],
  salidas: ['Requisitos de recursos', 'Base de las estimaciones', 'Estructura de desglose de recursos', 'Actualizaciones a los documentos del proyecto'],
  ejemplo: {
    titulo: 'Capacidad efectiva frente a asignación nominal',
    contexto: 'Estimación de la capacidad de un equipo de 6 personas «asignadas al 100 %».',
    aplicacion: 'Cálculo por persona y semana: 40 h nominales − 5 h de reuniones de coordinación − 3 h de soporte a sistemas en producción − 2 h de administración y formación − 4 h de pérdida por cambio de contexto entre dos proyectos = <b>26 h de capacidad efectiva</b> (65 %).<br>Capacidad del equipo: 6 × 26 = <b>156 h/semana</b>, no las 240 que asume el cronograma.',
    resultado: 'El cronograma estaba sobrestimado en un 54 %. Se toman medidas correctivas —agrupar reuniones, trasladar el soporte a un equipo dedicado, eliminar la asignación dual— que elevan la capacidad a 32 h/persona. El resto se refleja en una replanificación honesta. <b>Estimar sobre asignación nominal produce cronogramas que fallan desde la primera semana.</b>'
  },
  errores: ['Estimar sobre asignación nominal en lugar de capacidad efectiva', 'Olvidar el tiempo de coordinación y de cambio de contexto', 'No considerar la curva de aprendizaje de incorporaciones nuevas', 'Ignorar los recursos físicos y su logística'],
  preguntas: [
    { q: '¿Qué es la estructura de desglose de recursos?',
      a: 'Una representación jerárquica de los recursos por categoría y tipo: personas (por rol y competencia), equipamiento, materiales, instalaciones y suministros. Su utilidad es doble: asegura que ningún tipo de recurso se olvide en la estimación, y facilita la agregación para el análisis de disponibilidad y de costo.' },
    { q: '¿Cómo estimo la capacidad efectiva de un equipo?',
      a: 'Midiéndola durante dos o tres semanas en lugar de suponerla. Registra las horas realmente dedicadas al trabajo del proyecto frente a las nominales. En la mayoría de organizaciones el resultado se sitúa entre el <b>60 % y el 75 %</b>. Usar ese factor medido, y no el 100 % teórico, es la corrección más simple y de mayor impacto que puede hacerse a un cronograma.' }
  ]
},
{
  id: 'p-rec-03', cod: '2.6.3', nombre: 'Adquirir Recursos',
  dominio: 'recursos', area: 'ejecucion',
  proposito: 'Obtener los miembros del equipo, instalaciones, equipamiento, materiales y suministros necesarios para completar el trabajo.',
  descripcion: [
    'Incluye la negociación con los jefes funcionales por personas, la contratación externa y la adquisición de recursos físicos. En estructuras matriciales es uno de los procesos que más **habilidad de negociación** exige.',
    'Los recursos preasignados en el acta de constitución no requieren negociación, pero sí confirmación de disponibilidad real.'
  ],
  entradas: ['Plan de gestión de los recursos y de las adquisiciones', 'Requisitos de recursos', 'Registro de interesados', 'Calendarios y estructura de desglose de recursos', 'Factores ambientales y activos de la organización'],
  herramientas: ['Toma de decisiones (análisis multicriterio de candidatos)', 'Habilidades interpersonales (negociación, influencia)', 'Asignación previa', 'Equipos virtuales', 'Adquisición externa'],
  salidas: ['Asignaciones de recursos físicos y del equipo', 'Calendarios de recursos', 'Solicitudes de cambio', 'Actualizaciones al plan de dirección y a los documentos del proyecto'],
  ejemplo: {
    titulo: 'Negociar recursos en una estructura matricial',
    contexto: 'El director necesita a una analista concreta durante 3 meses. Su jefe funcional se niega: la tiene comprometida en la operación diaria.',
    aplicacion: 'La negociación débil apela a la prioridad del proyecto. La efectiva construye un intercambio: se cuantifica lo que el jefe funcional pierde (40 h/semana de capacidad operativa) y se ofrecen tres alternativas: (a) 50 % de dedicación durante 6 meses en lugar de 100 % durante 3; (b) dedicación completa con un contratista financiado por el proyecto para cubrir su operación; (c) participación de la analista solo en las 6 semanas críticas, con otro perfil en el resto.<br>Se añade un incentivo real: al terminar, la analista habrá adquirido conocimiento del nuevo sistema, lo que beneficia al área funcional.',
    resultado: 'Se acuerda la opción (b). La negociación funcionó porque reconoció el costo para la otra parte y ofreció compensarlo, en lugar de exigir que lo absorbiera.'
  },
  errores: ['Asumir la disponibilidad sin confirmarla por escrito', 'Negociar por autoridad en lugar de por intercambio', 'No documentar los acuerdos de asignación', 'Ignorar la curva de aprendizaje de recursos nuevos'],
  preguntas: [
    { q: '¿Qué hago si no consigo el recurso que necesito?',
      a: 'Cuantificar y escalar. Documenta el impacto concreto: qué actividades se retrasan, cuántos días, qué costo adicional, qué riesgo se genera. Presenta alternativas evaluadas —perfil distinto, contratación externa, replanificación— y escala por la vía de gobernanza. La escalada con impacto cuantificado obtiene decisión; la queja sin números obtiene comprensión y ningún recurso.' }
  ]
},
{
  id: 'p-rec-04', cod: '2.6.4', nombre: 'Liderar al Equipo',
  dominio: 'recursos', area: 'ejecucion',
  proposito: 'Mejorar las competencias, la interacción y el ambiente del equipo, y dar seguimiento a su desempeño para optimizar los resultados.',
  descripcion: [
    'Fusiona lo que en la 6.ª edición eran «Desarrollar el Equipo» y «Dirigir el Equipo», señalando que desarrollo y dirección son la misma actividad continua.',
    'Es donde el principio de **cultura de empoderamiento** se hace operativo: contexto, límites explícitos, seguridad para equivocarse y eliminación de impedimentos.'
  ],
  entradas: ['Plan de gestión de los recursos', 'Asignaciones del equipo y calendarios', 'Acta de constitución del equipo', 'Informes de desempeño del trabajo', 'Registro de incidentes y de lecciones aprendidas'],
  herramientas: ['Habilidades interpersonales (liderazgo, inteligencia emocional, influencia, gestión de conflictos, negociación)', 'Actividades de construcción de equipo', 'Capacitación y desarrollo de competencias', 'Reconocimiento y recompensas', 'Coubicación y equipos virtuales', 'Evaluaciones individuales y de equipo'],
  salidas: ['Evaluaciones de desempeño del equipo', 'Solicitudes de cambio', 'Actualizaciones al plan de dirección y a los documentos del proyecto', 'Actualizaciones a los factores ambientales de la empresa'],
  ejemplo: {
    titulo: 'Atravesar la etapa de turbulencia sin evitarla',
    contexto: 'Semana 4 de un equipo nuevo de 9 personas. Dos líderes técnicos discuten públicamente sobre la arquitectura y el resto del equipo se paraliza.',
    aplicacion: 'La reacción común —imponer una decisión para restaurar la calma— resolvería el síntoma y dejaría el conflicto latente. En su lugar se aplica <b>colaborar</b>: se convoca una sesión de 2 horas con reglas explícitas (cada uno expone la propuesta del otro antes que la propia, se decide contra criterios acordados previamente: costo de mantenimiento, tiempo de entrega, capacidad del equipo, riesgo técnico).',
    resultado: 'La solución final combina ambas propuestas y es mejor que cualquiera de las dos. Más importante: el equipo aprende que el desacuerdo técnico se resuelve con criterios y no con jerarquía. Es la <b>turbulencia</b> del modelo de Tuckman cumpliendo su función: los equipos que la evitan por cortesía no llegan a la etapa de desempeño.'
  },
  errores: ['Evitar el conflicto en lugar de encauzarlo', 'Reconocer solo el resultado y nunca el esfuerzo o el aprendizaje', 'Delegar sin dar contexto', 'No proteger al equipo de la sobrecarga sostenida'],
  preguntas: [
    { q: '¿Cuáles son las etapas de desarrollo de un equipo?',
      a: 'El modelo de Tuckman: <b>formación</b> (cortesía, dependencia del líder), <b>turbulencia</b> (conflicto por roles y formas de trabajar), <b>normalización</b> (acuerdos y confianza), <b>desempeño</b> (autonomía y alto rendimiento) y <b>disolución</b> (cierre y transición). Dos advertencias prácticas: los equipos <b>retroceden</b> al cambiar un miembro o el contexto; y la turbulencia no es un fallo, es la etapa donde se negocia lo que permitirá el desempeño posterior.' },
    { q: '¿Qué teorías de motivación conviene conocer?',
      a: '<b>Maslow</b>: las necesidades superiores solo motivan si las básicas están cubiertas. <b>Herzberg</b>: los factores de higiene (salario, condiciones) evitan la insatisfacción pero no motivan; los motivadores (logro, reconocimiento, responsabilidad, crecimiento) sí. <b>McGregor</b>: la teoría X supone que las personas evitan el trabajo, la Y que buscan responsabilidad; el supuesto del líder tiende a cumplirse. <b>McClelland</b>: cada persona se orienta predominantemente al logro, al poder o a la afiliación, y conviene asignar trabajo en consecuencia.' }
  ]
},
{
  id: 'p-rec-05', cod: '2.6.5', nombre: 'Monitorear y Controlar los Recursos',
  dominio: 'recursos', area: 'monitoreo',
  proposito: 'Asegurar que los recursos asignados están disponibles según lo planificado, vigilar su utilización y tomar acciones correctivas cuando sea necesario.',
  descripcion: [
    'Cubre tanto la disponibilidad y el rendimiento del equipo como el consumo y el estado de los recursos físicos.',
    'Su indicador más relevante suele ser la **brecha entre disponibilidad comprometida y real**: es la causa silenciosa de la mayoría de los retrasos que se atribuyen a otras razones.'
  ],
  entradas: ['Plan de dirección del proyecto (recursos)', 'Asignaciones y calendarios de recursos', 'Datos de desempeño del trabajo', 'Acuerdos y contratos', 'Registro de incidentes y de riesgos'],
  herramientas: ['Análisis de alternativas, de costo-beneficio, de desempeño y de tendencias', 'Resolución de problemas', 'Habilidades interpersonales (negociación, influencia)', 'Sistema de información para la dirección de proyectos'],
  salidas: ['Información de desempeño del trabajo', 'Solicitudes de cambio', 'Actualizaciones al plan de dirección y a los documentos del proyecto'],
  ejemplo: {
    titulo: 'La brecha entre lo comprometido y lo real',
    contexto: 'Seguimiento mensual de la disponibilidad efectiva del equipo.',
    aplicacion: '<table><tr><th>Recurso</th><th>Comprometido</th><th>Real</th><th>Brecha</th><th>Causa</th></tr><tr><td>Analista senior</td><td>100 %</td><td>62 %</td><td>−38 %</td><td>Incidencias del sistema anterior</td></tr><tr><td>Arquitecto</td><td>50 %</td><td>28 %</td><td>−22 %</td><td>Asignado a otros dos proyectos</td></tr><tr><td>Equipo de pruebas</td><td>100 %</td><td>95 %</td><td>−5 %</td><td>Normal</td></tr><tr><td>Entorno de pruebas</td><td>24×7</td><td>60 %</td><td>−40 %</td><td>Compartido con otro proyecto</td></tr></table>',
    resultado: 'Dos brechas superiores al 20 % explican por completo el retraso que se venía atribuyendo a «complejidad técnica». Las acciones son distintas para cada una: para el analista, trasladar el soporte a otro equipo; para el arquitecto, escalar a gobernanza la asignación triple; para el entorno, financiar uno dedicado. Sin la medición, el diagnóstico habría seguido siendo erróneo.'
  },
  errores: ['No medir la disponibilidad real', 'Atribuir a complejidad técnica lo que es falta de capacidad', 'Ignorar el estado y consumo de recursos físicos', 'No actuar sobre brechas persistentes'],
  preguntas: [
    { q: '¿Qué hago si un recurso clave se va del proyecto?',
      a: 'Cuatro acciones inmediatas y en este orden: <b>(1)</b> evaluar el impacto en la ruta crítica y en el alcance comprometido; <b>(2)</b> activar el plan de respaldo si el riesgo estaba identificado —y si no lo estaba, es un hallazgo para el registro de riesgos—; <b>(3)</b> priorizar la transferencia de conocimiento con el tiempo disponible, aunque sea poco; <b>(4)</b> comunicar el impacto a gobernanza con opciones cuantificadas. Buscar reemplazo sin hacer lo anterior suele resultar en un reemplazo que tarda meses en ser productivo.' }
  ]
},

/* ══════════ DOMINIO 7 · RIESGOS (6) ══════════ */
{
  id: 'p-rie-01', cod: '2.7.1', nombre: 'Planificar la Gestión de los Riesgos',
  dominio: 'riesgos', area: 'planificacion',
  proposito: 'Definir cómo se conducirán las actividades de gestión de riesgos del proyecto.',
  descripcion: [
    'Establece la **metodología**: roles y responsabilidades, categorías (RBS), escalas de probabilidad e impacto, apetito y umbrales de riesgo, presupuesto y calendario de las actividades de riesgo, y formatos de reporte.',
    'Sin escalas definidas de antemano, «probabilidad alta» significa cosas distintas para cada persona y la priorización pierde sentido.'
  ],
  entradas: ['Acta de constitución', 'Plan de dirección del proyecto', 'Registro de interesados', 'Factores ambientales (apetito de riesgo de la organización)', 'Activos de los procesos de la organización'],
  herramientas: ['Juicio de expertos', 'Análisis de datos (análisis de interesados para determinar el apetito de riesgo)', 'Reuniones de planificación de riesgos'],
  salidas: ['Plan de gestión de los riesgos'],
  ejemplo: {
    titulo: 'Escalas calibradas en lugar de adjetivos',
    contexto: 'Definición de escalas para un proyecto de 2 M USD y 14 meses.',
    aplicacion: '<b>Probabilidad:</b> Muy baja ≤ 10 % · Baja 11–30 % · Media 31–50 % · Alta 51–70 % · Muy alta > 70 %.<br><b>Impacto en costo:</b> Muy bajo < 10.000 · Bajo 10–40.000 · Medio 40–100.000 · Alto 100–250.000 · Muy alto > 250.000 USD.<br><b>Impacto en plazo:</b> Muy bajo < 3 d · Bajo 3–10 d · Medio 10–20 d · Alto 20–40 d · Muy alto > 40 d.<br><b>Umbral de escalamiento:</b> todo riesgo con severidad Alta o Muy alta se eleva al patrocinador en un plazo máximo de 5 días.',
    resultado: 'Con las escalas calibradas, dos personas evaluando el mismo riesgo llegan a resultados comparables. Sin ellas, «impacto alto» puede significar 20.000 USD para el analista y 300.000 para el arquitecto, y la matriz de priorización deja de ser un instrumento para convertirse en una colección de opiniones.'
  },
  errores: ['Usar escalas cualitativas sin calibrar', 'No definir el apetito de riesgo con el patrocinador', 'Omitir el presupuesto de las actividades de gestión de riesgos', 'No definir los umbrales de escalamiento'],
  preguntas: [
    { q: '¿Qué es la estructura de desglose de riesgos?',
      a: 'Una categorización jerárquica de las fuentes de riesgo que asegura cobertura sistemática en la identificación. Categorías típicas de primer nivel: <b>técnico</b> (requisitos, tecnología, complejidad, calidad), <b>externo</b> (proveedores, regulación, mercado, clima), <b>organizacional</b> (financiación, priorización, recursos, dependencias) y <b>de dirección de proyectos</b> (estimación, planificación, control, comunicación). Recorrer las categorías evita la concentración en los riesgos que el equipo tiene más presentes.' }
  ]
},
{
  id: 'p-rie-02', cod: '2.7.2', nombre: 'Identificar los Riesgos',
  dominio: 'riesgos', area: 'planificacion',
  proposito: 'Identificar los riesgos individuales del proyecto y las fuentes de riesgo general, y documentar sus características.',
  descripcion: [
    'Es un proceso **iterativo**: se ejecuta a lo largo de todo el proyecto porque aparecen riesgos nuevos y desaparecen otros. Identificar una sola vez al inicio es el error más común.',
    'Participan el equipo, los interesados y, cuando aporta, expertos externos. La diversidad de perspectivas es lo que determina la cobertura.'
  ],
  entradas: ['Plan de gestión de los riesgos y demás planes subsidiarios', 'Documentos del proyecto (supuestos, requisitos, estimaciones, interesados)', 'Acuerdos y documentación de adquisiciones', 'Factores ambientales y activos de la organización'],
  herramientas: ['Tormenta de ideas, listas de ideas rápidas y listas de verificación', 'Entrevistas y técnica Delphi', 'Análisis de causa raíz, de supuestos y restricciones, DAFO y de documentos', 'Análisis de datos históricos', 'Habilidades de facilitación', 'Reuniones de identificación'],
  salidas: ['Registro de riesgos', 'Informe de riesgos', 'Actualizaciones a los documentos del proyecto'],
  ejemplo: {
    titulo: 'Enunciar riesgos con estructura causa–evento–efecto',
    contexto: 'Comparación entre enunciados deficientes y correctos.',
    aplicacion: '<b>Deficiente:</b> «Riesgo de retraso.» No permite evaluar ni responder: no dice qué lo causa ni qué afecta.<br><b>Correcto:</b> «<i>Debido a</i> que el proveedor del componente de cifrado es único en el mercado, <i>puede ocurrir</i> que la entrega se retrase más de 20 días, <i>lo que provocaría</i> el desplazamiento de la fecha de despliegue y un costo indirecto de 45.000 USD.»<br><b>Deficiente:</b> «Falta de personal.»<br><b>Correcto:</b> «<i>Debido a</i> la alta demanda de perfiles de seguridad en el mercado local, <i>puede ocurrir</i> que el especialista asignado renuncie durante la fase de desarrollo, <i>lo que provocaría</i> una detención del módulo de autenticación de 4 a 6 semanas.»',
    resultado: 'La estructura <b>causa → evento → efecto</b> convierte un temor difuso en un riesgo gestionable: la causa indica dónde actuar preventivamente, el evento define el disparador a vigilar y el efecto permite cuantificar el impacto y priorizar.'
  },
  errores: ['Identificar riesgos solo al inicio', 'Enunciar efectos sin causa', 'Confundir riesgos con incidentes ya ocurridos', 'Identificar solo amenazas y ninguna oportunidad'],
  preguntas: [
    { q: '¿Cómo se enuncia correctamente un riesgo?',
      a: 'Con la estructura <b>causa → evento → efecto</b>: «Debido a [causa cierta], puede ocurrir [evento incierto], lo que provocaría [efecto sobre un objetivo]». La causa es un hecho verificable; el evento es lo incierto; el efecto se expresa sobre un objetivo concreto (costo, plazo, alcance, calidad). Un enunciado sin causa no orienta la prevención; uno sin efecto no permite priorizar.' },
    { q: '¿Qué es el informe de riesgos y en qué se diferencia del registro?',
      a: 'El <b>registro</b> es la lista detallada de riesgos individuales, con su evaluación, respuesta y propietario. El <b>informe</b> presenta el panorama del <b>riesgo general del proyecto</b>: fuentes principales de incertidumbre, exposición agregada, distribución por categoría y tendencia. Uno sirve para gestionar riesgo por riesgo; el otro, para que la gobernanza entienda el perfil de riesgo del proyecto en conjunto.' }
  ]
},
{
  id: 'p-rie-03', cod: '2.7.3', nombre: 'Realizar el Análisis de Riesgos',
  dominio: 'riesgos', area: 'planificacion',
  proposito: 'Priorizar los riesgos individuales evaluando su probabilidad e impacto, y analizar numéricamente el efecto agregado sobre los objetivos cuando corresponda.',
  descripcion: [
    'Unifica el análisis cualitativo y el cuantitativo de la 6.ª edición en un único proceso, con un mensaje explícito de adaptación: **todo proyecto hace análisis cualitativo; solo algunos profundizan al cuantitativo**.',
    'El cualitativo prioriza; el cuantitativo modela el efecto agregado y permite dimensionar reservas con un nivel de confianza declarado.'
  ],
  entradas: ['Plan de gestión de los riesgos', 'Registro de riesgos y registro de supuestos', 'Línea base del alcance, cronograma y costos', 'Estimaciones de costos y duraciones', 'Activos de los procesos de la organización'],
  herramientas: ['Matriz de probabilidad e impacto', 'Evaluación de la calidad de los datos sobre riesgos', 'Categorización y evaluación de urgencia', 'Simulación Monte Carlo', 'Análisis de sensibilidad (diagrama de tornado)', 'Árboles de decisión y valor monetario esperado', 'Juicio de expertos y facilitación'],
  salidas: ['Actualizaciones al registro de riesgos (prioridad, severidad, categorización)', 'Actualizaciones al informe de riesgos', 'Estimación de reservas de contingencia'],
  ejemplo: {
    titulo: 'De la matriz cualitativa a la reserva cuantitativa',
    contexto: 'Proyecto con 34 riesgos identificados y presupuesto base de 1,24 M USD.',
    aplicacion: '<b>Análisis cualitativo:</b> la matriz P×I clasifica 6 riesgos como severidad alta, 11 media y 17 baja. Los 6 altos concentran el 70 % de la exposición estimada y se priorizan para respuesta inmediata.<br><b>Análisis cuantitativo</b> (justificado por el tamaño del proyecto): simulación Monte Carlo con 10.000 iteraciones sobre las distribuciones de costo de los 17 riesgos más relevantes. Resultado: P50 = 1,29 M; P80 = 1,38 M; P95 = 1,47 M.',
    resultado: 'La organización adopta el criterio P80 según su política de riesgo, lo que fija la reserva de contingencia en <b>140.000 USD</b> (1,38 M − 1,24 M). El valor no es una estimación por porcentaje ni una intuición: es una decisión con nivel de confianza declarado y defendible ante el comité de inversión.'
  },
  errores: ['Aplicar análisis cuantitativo sin datos de calidad suficiente', 'Usar la matriz P×I sin escalas calibradas', 'Analizar y no actualizar el registro', 'Omitir el análisis de la calidad de los datos'],
  preguntas: [
    { q: '¿Cuándo justifica un proyecto el análisis cuantitativo?',
      a: 'Cuando concurren varias de estas condiciones: presupuesto o criticidad elevados; exigencia del cliente, del regulador o de la política interna; necesidad de defender la reserva ante un comité; disponibilidad de <b>datos de calidad suficiente</b> para alimentar el modelo. Esta última es la condición limitante: una simulación Monte Carlo sobre estimaciones inventadas produce un número preciso y falso, que es peor que una estimación cualitativa honesta.' },
    { q: '¿Qué muestra un diagrama de tornado?',
      a: 'El resultado del <b>análisis de sensibilidad</b>: qué variables tienen mayor influencia sobre el resultado del proyecto, ordenadas de mayor a menor impacto —de ahí la forma de tornado—. Su utilidad práctica es dirigir el esfuerzo: si la variable «productividad del equipo de desarrollo» mueve el resultado tres veces más que «costo de licencias», la atención de gestión debe ir a la primera.' }
  ]
},
{
  id: 'p-rie-04', cod: '2.7.4', nombre: 'Planificar las Respuestas a los Riesgos',
  dominio: 'riesgos', area: 'planificacion',
  proposito: 'Desarrollar opciones, seleccionar estrategias y acordar acciones para abordar la exposición al riesgo del proyecto.',
  descripcion: [
    'Para cada riesgo priorizado se selecciona una estrategia, se define la acción concreta, se asigna un **propietario** nombrado y se dota de presupuesto y plazo.',
    'Un riesgo con respuesta pero sin propietario ni presupuesto no está gestionado: está documentado.'
  ],
  entradas: ['Plan de gestión de los riesgos y demás planes', 'Registro e informe de riesgos', 'Registro de interesados y de lecciones aprendidas', 'Estimaciones de costos y de recursos'],
  herramientas: ['Estrategias para amenazas (escalar, evitar, transferir, mitigar, aceptar)', 'Estrategias para oportunidades (escalar, explotar, compartir, mejorar, aceptar)', 'Estrategias de respuesta a contingencias', 'Análisis de alternativas y costo-beneficio', 'Toma de decisiones multicriterio', 'Juicio de expertos y habilidades interpersonales'],
  salidas: ['Solicitudes de cambio', 'Actualizaciones al plan de dirección del proyecto', 'Actualizaciones al registro de riesgos (respuestas, propietarios, planes de contingencia, riesgos residuales y secundarios)'],
  ejemplo: {
    titulo: 'Registro de riesgos con respuesta completa',
    contexto: 'Un riesgo de severidad alta con todos sus campos cumplimentados.',
    aplicacion: '<b>ID:</b> R-007 · <b>Categoría:</b> Externo / Proveedor<br><b>Enunciado:</b> Debido a que el componente de cifrado tiene un único proveedor certificado, puede ocurrir que la entrega se retrase más de 20 días, lo que desplazaría la fecha de despliegue.<br><b>Probabilidad:</b> 40 % · <b>Impacto:</b> 120.000 USD · <b>VME:</b> −48.000 USD · <b>Severidad:</b> Alta<br><b>Estrategia:</b> Mitigar + aceptar activamente<br><b>Acciones:</b> (1) homologar un segundo proveedor antes del 15/03 — 8.000 USD; (2) adelantar el pedido con pago del 30 % — mejora la posición en la cola de producción; (3) plan de contingencia: alquiler de módulo sustituto certificado — 34.000 USD si se activa.<br><b>Propietario:</b> Responsable de compras · <b>Disparador:</b> confirmación de fecha de embarque no recibida al 01/03<br><b>Riesgo residual:</b> retraso de hasta 8 días aun con las acciones · <b>Riesgo secundario:</b> el segundo proveedor tiene menor calidad histórica, lo que puede aumentar defectos<br><b>Presupuesto de respuesta:</b> 8.000 USD comprometidos + 34.000 en contingencia',
    resultado: 'El campo <b>disparador</b> es el que convierte la vigilancia en algo operativo: define exactamente qué observar y cuándo activar la contingencia, en lugar de esperar a que el problema sea evidente.'
  },
  errores: ['Respuestas sin propietario nombrado', 'No presupuestar el costo de la respuesta', 'Omitir riesgos residuales y secundarios', 'Confundir transferir con eliminar el impacto'],
  preguntas: [
    { q: '¿Cuáles son las estrategias para amenazas y para oportunidades?',
      a: '<b>Amenazas:</b> escalar (fuera del ámbito del proyecto), evitar (eliminar la causa o la exposición), transferir (trasladar el impacto a un tercero: seguro, garantía, contrato), mitigar (reducir probabilidad o impacto) y aceptar (pasiva o activamente).<br><b>Oportunidades:</b> escalar, explotar (asegurar que ocurra), compartir (aliarse con quien pueda capturarla mejor), mejorar (aumentar probabilidad o impacto) y aceptar. Nótese la simetría: escalar y aceptar aparecen en ambas listas.' },
    { q: '¿Transferir un riesgo lo elimina?',
      a: 'No. Transferir traslada normalmente el <b>impacto financiero</b>, no el impacto en plazo, calidad o reputación. Un seguro compensa la pérdida económica de un retraso, pero no entrega el proyecto a tiempo; una penalización contractual cobra al proveedor, pero el cliente sigue sin su producto. Es el malentendido más frecuente en la elección de respuestas.' }
  ]
},
{
  id: 'p-rie-05', cod: '2.7.5', nombre: 'Implementar las Respuestas a los Riesgos',
  dominio: 'riesgos', area: 'ejecucion',
  proposito: 'Ejecutar los planes de respuesta acordados.',
  descripcion: [
    'Existe como proceso propio por una razón práctica constatada: **muchos proyectos planifican respuestas y no las ejecutan**. El registro de riesgos se convierte en un documento de cumplimiento formal y las acciones nunca se realizan.',
    'Convertirlo en proceso independiente hace visible la brecha entre lo planificado y lo hecho.'
  ],
  entradas: ['Plan de gestión de los riesgos', 'Registro e informe de riesgos', 'Registro de lecciones aprendidas', 'Activos de los procesos de la organización'],
  herramientas: ['Juicio de expertos', 'Habilidades interpersonales (influencia para lograr que los propietarios actúen)', 'Sistema de información para la dirección de proyectos'],
  salidas: ['Solicitudes de cambio', 'Actualizaciones a los documentos del proyecto (registro de riesgos, incidentes, lecciones)'],
  ejemplo: {
    titulo: 'La brecha entre planificar y ejecutar',
    contexto: 'Auditoría del registro de riesgos en el mes 5. Hay 28 riesgos con respuesta documentada.',
    aplicacion: 'Se verifica el estado real de ejecución de cada respuesta: <b>9</b> ejecutadas y verificadas · <b>6</b> en curso dentro de plazo · <b>11</b> no iniciadas pese a tener fecha vencida · <b>2</b> ejecutadas parcialmente y abandonadas.<br>El análisis de las 11 no iniciadas muestra un patrón: 8 tienen como propietario a alguien fuera del equipo del proyecto —compras, legal, infraestructura— que nunca fue informado formalmente de su asignación.',
    resultado: 'La causa no era negligencia sino un fallo de proceso: asignar propietarios sin comunicárselo. Se corrige con una notificación formal por escrito a cada propietario, con la acción, el plazo y el presupuesto asignado, y con seguimiento quincenal. En el mes 7 la proporción de respuestas ejecutadas pasa del 32 % al 81 %.'
  },
  errores: ['Documentar respuestas y no ejecutarlas', 'Asignar propietarios sin notificárselo formalmente', 'No verificar la efectividad de la respuesta ejecutada', 'No registrar los riesgos secundarios que la respuesta genera'],
  preguntas: [
    { q: '¿Por qué la 8.ª edición mantiene este proceso separado de la planificación?',
      a: 'Porque la evidencia de la práctica muestra una brecha sistemática: los proyectos planifican respuestas con diligencia y las ejecutan de forma irregular. Separarlo obliga a <b>medir la ejecución</b> como una actividad con su propio estado y responsable. Es un caso claro de un proceso que existe no por lógica conceptual, sino por corrección de un fallo observado.' }
  ]
},
{
  id: 'p-rie-06', cod: '2.7.6', nombre: 'Monitorear los Riesgos',
  dominio: 'riesgos', area: 'monitoreo',
  proposito: 'Vigilar la implementación de las respuestas, hacer seguimiento a los riesgos identificados, identificar nuevos y evaluar la efectividad del proceso de gestión de riesgos.',
  descripcion: [
    'Cierra el ciclo: comprueba que las respuestas funcionan, que los disparadores se vigilan, que los riesgos cerrados se retiran y que los nuevos entran al registro.',
    'También evalúa el **proceso mismo**: si los problemas que ocurren no estaban en el registro, la identificación es deficiente y hay que corregirla, no solo añadir el riesgo tarde.'
  ],
  entradas: ['Plan de dirección del proyecto (gestión de riesgos)', 'Registro e informe de riesgos', 'Datos e informes de desempeño del trabajo', 'Registro de incidentes y de lecciones aprendidas'],
  herramientas: ['Análisis de desempeño técnico', 'Análisis de reserva', 'Auditorías de riesgos', 'Reuniones de revisión de riesgos', 'Reevaluación de riesgos'],
  salidas: ['Información de desempeño del trabajo', 'Solicitudes de cambio', 'Actualizaciones al plan de dirección y a los documentos del proyecto', 'Actualizaciones a los activos de la organización'],
  ejemplo: {
    titulo: 'Auditar el proceso, no solo los riesgos',
    contexto: 'Revisión de riesgos en el mes 8 de un proyecto de 12.',
    aplicacion: 'Además del repaso riesgo por riesgo, se evalúa el proceso con cuatro preguntas: <b>(1)</b> De los 14 incidentes ocurridos, ¿cuántos estaban previstos en el registro? → 5 de 14 (36 %). <b>(2)</b> ¿Cuánta contingencia se ha consumido frente al avance? → 71 % consumida con 62 % de avance. <b>(3)</b> ¿Cuántos riesgos cerrados siguen en el registro? → 9. <b>(4)</b> ¿Cuántos riesgos nuevos se han añadido en los últimos 3 meses? → 2.',
    resultado: 'El diagnóstico es claro: la identificación es deficiente (solo el 36 % de acierto) y ha dejado de realizarse (2 riesgos nuevos en 3 meses en un proyecto que evoluciona). El consumo desproporcionado de contingencia es la consecuencia, no la causa. Se reinstauran talleres de identificación mensuales con participación de interesados externos al equipo y se depura el registro.'
  },
  errores: ['Revisar riesgos sin evaluar la efectividad del proceso', 'No cerrar formalmente los riesgos que ya no aplican', 'No identificar riesgos nuevos durante la ejecución', 'Consumir contingencia sin registrar la causa'],
  preguntas: [
    { q: '¿Con qué frecuencia se revisa el registro de riesgos?',
      a: 'Depende de la volatilidad: <b>semanal</b> en proyectos de alta incertidumbre o en fases críticas; <b>mensual</b> en proyectos estables; <b>por iteración</b> en enfoques adaptativos. Además, siempre de forma extraordinaria ante un cambio significativo de contexto: nuevo patrocinador, cambio regulatorio, incorporación de un proveedor, desviación importante de costo o plazo.' },
    { q: '¿Qué es una auditoría de riesgos?',
      a: 'Un examen del <b>proceso</b> de gestión de riesgos, no de los riesgos individuales: evalúa si la identificación es suficiente, si las respuestas se ejecutan, si son efectivas y si el proceso en conjunto está funcionando. Es al riesgo lo que el aseguramiento de la calidad es al producto: audita cómo se trabaja, no solo qué resultó.' }
  ]
}

];
