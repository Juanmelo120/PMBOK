/* ═══════════════════════════════════════════════════════════
   dominios.js — Los 7 dominios de desempeño
   Estructura oficial de cada dominio:
   Conceptos Clave · Procesos · Consideraciones de Adaptación ·
   Interacciones con otros Dominios · Verificar Resultados
   ═══════════════════════════════════════════════════════════ */

window.PMBOK = window.PMBOK || {};

PMBOK.dominios = [

/* ══════════════ 1 · GOBERNANZA ══════════════ */
{
  id: 'd-gobernanza',
  clave: 'gobernanza',
  n: '2.1',
  titulo: 'Dominio de la Gobernanza',
  clase: 'd-gobernanza',
  lema: 'Autoridad, decisiones e integración',
  resumen: 'Aborda el marco de autoridad, decisión y supervisión del proyecto: cómo se autoriza, cómo se integran los planes, cómo se dirige la ejecución, cómo se controla el desempeño, cómo se deciden los cambios y cómo se cierra. Es el dominio integrador y el que más procesos concentra (9 de 40).',
  conceptosClave: [
    { t: 'Autoridad y umbrales de decisión', d: 'Quién puede decidir qué y hasta qué monto o impacto. Sin umbrales explícitos, todas las decisiones ascienden y el proyecto se ralentiza; o bien se toman en el nivel equivocado y se pierde control.' },
    { t: 'Acta de constitución', d: 'Documento que autoriza formalmente la existencia del proyecto y confiere autoridad al director. Contiene propósito, objetivos medibles, requisitos de alto nivel, riesgos iniciales, hitos, presupuesto de referencia, interesados clave y criterios de éxito.' },
    { t: 'Plan de dirección del proyecto', d: 'Documento integrador que consolida los planes subsidiarios y las líneas base. No es la suma mecánica de planes: su valor está en resolver las inconsistencias entre ellos.' },
    { t: 'Puertas de fase', d: 'Puntos formales de decisión al final de una fase, con cuatro salidas posibles: continuar, continuar con modificaciones, repetir o terminar.' },
    { t: 'Control integrado de cambios', d: 'Proceso por el que toda solicitud de cambio se evalúa por su impacto en todos los dominios antes de aprobarse o rechazarse. «Integrado» significa que no se aprueba un cambio de alcance sin ver su efecto en costo, plazo y riesgo.' },
    { t: 'Línea base para la medición del desempeño', d: 'Combinación aprobada de las líneas base de alcance, cronograma y costos, usada como referencia de comparación.' },
    { t: 'Gestión del conocimiento', d: 'Captura, transferencia y reutilización de conocimiento explícito (documentable) y tácito (experiencial). El segundo se transfiere por interacción, no por documento.' },
    { t: 'Aseguramiento de la calidad', d: 'Auditoría del proceso de trabajo para prevenir defectos, a diferencia del control de calidad, que inspecciona el producto.' },
    { t: 'Estrategia de abastecimiento', d: 'Decisión de hacer o comprar y diseño del esquema contractual y de la relación con proveedores.' }
  ],
  adaptacion: [
    'Número de puertas de fase: de una única revisión en un proyecto corto a cuatro o más en uno regulado.',
    'Formalidad del control de cambios: desde acuerdo verbal registrado en acta hasta comité formal con quórum y actas firmadas.',
    'Umbrales de decisión: proporcionales al presupuesto, a la criticidad y a la madurez del equipo.',
    'Alcance del aseguramiento de la calidad: autoevaluación del equipo frente a auditoría independiente o externa.',
    'Profundidad de la estrategia de abastecimiento: se omite si todo el trabajo es interno; se intensifica en proyectos multi-proveedor.',
    'Formalidad del cierre: reunión breve con acta de una página frente a cierre contractual, auditoría y transferencia documentada.'
  ],
  interacciones: [
    { con: 'alcance', d: 'Toda modificación de la línea base del alcance pasa por el control integrado de cambios; la gobernanza es quien la aprueba o rechaza.' },
    { con: 'finanzas', d: 'Los umbrales de decisión se expresan típicamente en dinero, y el uso de la reserva de gestión requiere autorización de gobernanza.' },
    { con: 'riesgos', d: 'La gobernanza fija el apetito de riesgo, aprueba las respuestas costosas y decide sobre riesgos escalados.' },
    { con: 'interesados', d: 'El patrocinador es a la vez interesado clave y autoridad de gobernanza: los conflictos entre ambos roles deben hacerse explícitos.' },
    { con: 'cronograma', d: 'Las puertas de fase son hitos del cronograma; el cambio de fecha comprometida exige aprobación de gobernanza.' },
    { con: 'recursos', d: 'La asignación y liberación de recursos escasos suele exceder la autoridad del director y escalar a gobernanza.' }
  ],
  verificar: [
    { ind: 'Tiempo medio de decisión', ok: 'Las decisiones dentro de umbral se resuelven en horas, no en días.' },
    { ind: 'Decisiones tomadas en el nivel correcto', ok: 'Menos del 10 % de las decisiones escala innecesariamente.' },
    { ind: 'Trazabilidad', ok: 'Toda decisión relevante tiene registro de quién decidió, cuándo y con qué información.' },
    { ind: 'Solicitudes de cambio evaluadas de forma integrada', ok: 'El 100 % de los cambios aprobados tiene impacto documentado en alcance, plazo, costo y riesgo.' },
    { ind: 'Cierre efectivo', ok: 'No quedan obligaciones contractuales, financieras ni documentales abiertas tras el cierre.' },
    { ind: 'Conocimiento reutilizado', ok: 'Las lecciones aprendidas de proyectos previos son consultables y efectivamente se consultaron.' }
  ],
  ejemplos: [
    {
      titulo: 'La matriz de decisiones como instrumento de gobernanza',
      contexto: 'Proyecto de 1,2 M USD y 10 meses, con equipo interno y dos proveedores.',
      aplicacion: 'El acta define cuatro niveles con umbrales numéricos: <b>equipo</b> (< 2.000 USD y < 3 días de holgura), <b>director</b> (< 25.000 USD y < 15 días, sin tocar línea base), <b>patrocinador</b> (cualquier cambio de línea base o hasta 120.000 USD) y <b>comité de inversión</b> (por encima de esos límites o cambio del caso de negocio). Cada nivel tiene un plazo máximo de respuesta comprometido.',
      resultado: 'En el mes 6 aparece un cambio regulatorio que exige 90.000 USD adicionales. Como el umbral está definido, la solicitud llega directamente al patrocinador con impacto evaluado y se resuelve en 4 días. Sin la matriz, la solicitud habría rebotado entre niveles durante semanas.'
    },
    {
      titulo: 'Control integrado de cambios en funcionamiento',
      contexto: 'El área comercial solicita añadir un módulo de informes «que es pequeño, dos semanas de trabajo».',
      aplicacion: 'La gobernanza no evalúa solo el esfuerzo. El análisis integrado revela: <b>alcance</b> +1 entregable con criterios de aceptación por definir; <b>cronograma</b> +2 semanas de desarrollo, pero la actividad está en la ruta crítica, así que el impacto real es +2 semanas al fin del proyecto; <b>finanzas</b> +18.400 USD incluyendo pruebas y documentación; <b>recursos</b> requiere al analista de datos que estaba asignado a otra tarea crítica; <b>riesgos</b> el módulo accede a datos personales y activa una revisión de privacidad de 3 semanas.',
      resultado: 'El impacto real es de 5 semanas y 31.000 USD, no de 2 semanas. Con esa información el patrocinador decide diferir el módulo a una segunda fase. La solicitud «pequeña» habría costado el 12 % del presupuesto sin que nadie lo advirtiera.'
    }
  ],
  preguntas: [
    { q: '¿Gobernanza es lo mismo que burocracia?',
      a: 'No. La burocracia es procedimiento sin propósito; la gobernanza es <b>autoridad y decisión con propósito</b>. Un proyecto de dos semanas con una sola persona autorizada a decidir y un criterio claro de aceptación tiene gobernanza excelente y cero burocracia. La prueba práctica: si un mecanismo de gobernanza no cambia ninguna decisión, es burocracia y debe eliminarse.' },
    { q: '¿Por qué la gobernanza reemplazó a la Gestión de la Integración?',
      a: 'Porque «integración» describía la <b>actividad</b> (juntar las partes) pero no la <b>autoridad</b> (quién decide cuando las partes entran en conflicto). Al renombrarlo como gobernanza, la 8.ª edición pone el énfasis en la decisión, que es donde ocurren la mayoría de los fracasos. La integración sigue estando presente —el proceso «Integrar y Alinear los Planes del Proyecto» lo demuestra— pero subordinada al marco de autoridad.' },
    { q: '¿Quién debe formar el comité de control de cambios?',
      a: 'Debe reunir <b>autoridad de decisión</b> (patrocinador o su delegado), <b>conocimiento del impacto técnico</b> (arquitecto o líder técnico), <b>conocimiento del impacto de negocio</b> (propietario de producto o representante del usuario) y <b>visión del proyecto</b> (director). Comités más grandes deliberan peor y deciden más lento; el criterio es el mínimo que garantice decisión informada.' },
    { q: '¿Puede el director de proyecto aprobar cambios?',
      a: 'Sí, dentro de los umbrales que le delega el acta de constitución. Fuera de esos umbrales no puede, y aprobar por su cuenta un cambio que excede su autoridad es una falta de gobernanza aunque la decisión técnica sea acertada. El límite no depende del acierto, sino de la autoridad.' },
    { q: '¿Qué diferencia hay entre acción correctiva, preventiva y reparación de defectos?',
      a: '<b>Correctiva</b>: realinea el desempeño futuro con el plan tras una desviación ya ocurrida. <b>Preventiva</b>: actúa sobre una desviación que aún no ha ocurrido pero se anticipa. <b>Reparación de defectos</b>: corrige un componente no conforme ya producido. Las tres son salidas del control integrado de cambios y las tres requieren registro.' }
  ],
  relacionados: ['e1', 'g4', 'pr-4']
},

/* ══════════════ 2 · ALCANCE ══════════════ */
{
  id: 'd-alcance',
  clave: 'alcance',
  n: '2.2',
  titulo: 'Dominio del Alcance',
  clase: 'd-alcance',
  lema: 'Qué entra, qué queda fuera y por qué',
  resumen: 'Define y controla la totalidad del trabajo requerido —y solo ese trabajo— para entregar el resultado. Abarca la obtención de requisitos, su análisis, la definición del alcance, su estructuración, su validación con el cliente y su control frente a la corrupción silenciosa.',
  conceptosClave: [
    { t: 'Alcance del producto', d: 'Características y funciones que definen el producto, servicio o resultado. Se verifica contra los requisitos.' },
    { t: 'Alcance del proyecto', d: 'Trabajo necesario para entregar ese producto con las características especificadas. Incluye trabajo que no es producto: gestión, pruebas, formación, documentación.' },
    { t: 'Requisito', d: 'Condición o capacidad que debe cumplir el resultado. Se clasifica en: de negocio, de interesados, de solución (funcionales y no funcionales), de transición, de proyecto y de calidad.' },
    { t: 'Enunciado del alcance', d: 'Descripción del alcance, entregables principales, exclusiones explícitas, supuestos y restricciones. Las exclusiones son tan importantes como las inclusiones.' },
    { t: 'Estructura del alcance (EDT / backlog)', d: 'Descomposición jerárquica del trabajo en paquetes gestionables, o su equivalente adaptativo: un backlog priorizado con historias y criterios de aceptación.' },
    { t: 'Paquete de trabajo', d: 'Nivel más bajo de la EDT, donde el trabajo puede estimarse, asignarse y controlarse con fiabilidad.' },
    { t: 'Matriz de trazabilidad de requisitos', d: 'Vincula cada requisito con su origen, su entregable, su prueba y su criterio de aceptación. Permite responder «¿por qué estamos construyendo esto?».' },
    { t: 'Criterios de aceptación', d: 'Condiciones que un entregable debe cumplir para ser aceptado. Se acuerdan antes de construir.' },
    { t: 'Corrupción del alcance (scope creep)', d: 'Expansión no controlada ni aprobada del alcance. Se distingue del <b>gold plating</b>: añadir características no solicitadas por iniciativa del equipo.' }
  ],
  adaptacion: [
    'EDT jerárquica en enfoques predictivos; backlog priorizado con refinamiento continuo en adaptativos.',
    'Nivel de descomposición: la regla de 8/80 horas por paquete es orientativa, no dogma.',
    'Formalidad de la matriz de trazabilidad: obligatoria en entornos regulados, opcional en proyectos internos pequeños.',
    'Momento de la validación: al final en predictivo, por incremento en adaptativo.',
    'Profundidad de la obtención de requisitos: entrevistas y talleres extensos frente a conversación con el propietario de producto.',
    'Gestión de exclusiones: siempre explícitas, aunque el proyecto sea pequeño.'
  ],
  interacciones: [
    { con: 'cronograma', d: 'La estructura del alcance es el insumo de la definición de actividades: sin alcance descompuesto no hay cronograma fiable.' },
    { con: 'finanzas', d: 'La estimación de costos se construye sobre los paquetes de trabajo; cambiar alcance cambia presupuesto.' },
    { con: 'interesados', d: 'Los requisitos provienen de los interesados; requisitos incompletos casi siempre son síntoma de interesados no identificados.' },
    { con: 'gobernanza', d: 'Toda modificación de la línea base del alcance requiere solicitud de cambio aprobada.' },
    { con: 'riesgos', d: 'El alcance ambiguo es fuente primaria de riesgo; las exclusiones explícitas reducen el riesgo de expectativa.' },
    { con: 'recursos', d: 'El tipo de trabajo definido determina los perfiles necesarios.' }
  ],
  verificar: [
    { ind: 'Trazabilidad completa', ok: 'Todo requisito traza a un beneficio y a una prueba; ningún entregable carece de requisito de origen.' },
    { ind: 'Tasa de rechazo en validación', ok: 'Baja y decreciente; un rechazo alto indica criterios de aceptación mal definidos.' },
    { ind: 'Cambios de alcance no aprobados', ok: 'Cero: todo cambio pasa por control de cambios.' },
    { ind: 'Exclusiones documentadas', ok: 'Existen y los interesados las conocen; no aparecen sorpresas al final.' },
    { ind: 'Estabilidad de la línea base', ok: 'Las variaciones se explican por decisiones registradas, no por deriva.' },
    { ind: 'Ausencia de gold plating', ok: 'No se entregan características no solicitadas ni aprobadas.' }
  ],
  ejemplos: [
    {
      titulo: 'Las exclusiones que evitaron un conflicto',
      contexto: 'Proyecto de implantación de un ERP para una empresa manufacturera.',
      aplicacion: 'El enunciado del alcance dedica una sección a exclusiones explícitas: <i>«No incluye: migración de datos históricos anteriores a 2020; integración con el sistema de la filial de Perú; formación de usuarios de la planta 3; licencias del módulo de calidad; soporte posterior a los 60 días de estabilización.»</i> Cada exclusión se revisa y firma en la reunión de aprobación del alcance.',
      resultado: 'En el mes 7 el director financiero pregunta por los datos históricos de 2018. La conversación dura cinco minutos: la exclusión estaba documentada y firmada. Se abre una solicitud de cambio con presupuesto propio en lugar de un conflicto sobre quién dijo qué en una reunión de hace siete meses.'
    },
    {
      titulo: 'Corrupción del alcance frente a gold plating',
      contexto: 'Dos situaciones en el mismo proyecto de aplicación móvil.',
      aplicacion: '<b>Corrupción del alcance:</b> en cada reunión quincenal el cliente pide «un pequeño ajuste». Ninguno pasa por control de cambios porque «son menores». Tras cuatro meses, la suma equivale a 6 semanas de trabajo no presupuestado.<br><b>Gold plating:</b> un desarrollador añade por iniciativa propia un modo oscuro elegante que nadie pidió. Consume 3 días y añade superficie de pruebas y de mantenimiento.',
      resultado: 'Ambos son fallos de este dominio, con causas distintas. La corrupción se combate con <b>disciplina de control de cambios</b>, incluso para lo pequeño. El gold plating se combate con <b>definición de terminado</b> y con la comprensión de que añadir valor no solicitado no es un favor: es consumir presupuesto ajeno sin permiso.'
    }
  ],
  preguntas: [
    { q: '¿Cuál es la diferencia entre validar y controlar el alcance?',
      a: '<b>Validar</b> es obtener la <b>aceptación formal del cliente</b> sobre los entregables completados: es una actividad externa, orientada a la aceptación. <b>Controlar</b> es <b>vigilar el estado del alcance</b> y gestionar los cambios sobre la línea base: es una actividad interna, orientada a la desviación. Un entregable puede pasar el control de calidad interno y ser rechazado en la validación si no responde a lo que el cliente esperaba.' },
    { q: '¿Hasta qué nivel debo descomponer la EDT?',
      a: 'Hasta que cada paquete de trabajo pueda estimarse con confianza, asignarse a un responsable único y controlarse con la periodicidad del proyecto. La regla orientativa 8/80 —entre 8 y 80 horas por paquete— funciona en muchos contextos, pero el criterio real es la <b>gestionabilidad</b>. Descomponer de más genera costo de gestión sin mejorar el control.' },
    { q: '¿Cómo gestiono el alcance en un proyecto adaptativo?',
      a: 'El alcance de alto nivel se fija en el acta y se mantiene estable; el detalle vive en un <b>backlog priorizado</b> que se refina de forma continua. Lo que cambia libremente es la <b>prioridad y el detalle</b>; lo que sigue requiriendo control formal es el <b>alcance de alto nivel</b>, el presupuesto y la fecha. La flexibilidad del backlog no es ausencia de control: es control desplazado de nivel.' },
    { q: '¿Los requisitos no funcionales forman parte del alcance?',
      a: 'Sí, y su omisión es una de las causas más frecuentes de rechazo en la validación. Rendimiento, seguridad, disponibilidad, accesibilidad, mantenibilidad y cumplimiento normativo deben tener criterios de aceptación <b>medibles</b>. «Debe ser rápido» no es un requisito; «el 95 % de las consultas deben responder en menos de 2 segundos con 500 usuarios concurrentes» sí lo es.' },
    { q: '¿Qué hago si el cliente cambia de opinión constantemente?',
      a: 'Primero, distinguir causa: si el negocio es genuinamente volátil, el enfoque predictivo es el problema y conviene migrar a incrementos cortos. Si la causa es que los requisitos se obtuvieron mal —interesados no identificados, necesidades no exploradas—, la solución es un taller de requisitos serio. En ambos casos, mantener la disciplina de control de cambios: cada cambio con su impacto visible educa al cliente sobre el costo real de cambiar de opinión tarde.' }
  ],
  relacionados: ['d-cronograma', 'd-interesados', 'pr-2']
},

/* ══════════════ 3 · CRONOGRAMA ══════════════ */
{
  id: 'd-cronograma',
  clave: 'cronograma',
  n: '2.3',
  titulo: 'Dominio del Cronograma',
  clase: 'd-cronograma',
  lema: 'Secuencia, ritmo y compromiso temporal',
  resumen: 'Gestiona la dimensión temporal: cómo se secuencia el trabajo, cuánto dura, qué determina la fecha de fin y cómo se controla la desviación. Con solo 3 procesos es el dominio más compacto, porque la 8.ª edición trata las técnicas de programación como herramientas y no como procesos separados.',
  conceptosClave: [
    { t: 'Ruta crítica', d: 'Secuencia más larga de actividades dependientes; determina la duración mínima del proyecto. Cualquier retraso en ella retrasa el proyecto entero.' },
    { t: 'Holgura total y libre', d: 'Holgura total: tiempo que una actividad puede retrasarse sin afectar la fecha de fin. Holgura libre: sin afectar el inicio temprano de la actividad siguiente. Las actividades de la ruta crítica tienen holgura total cero.' },
    { t: 'Dependencias', d: 'Obligatorias (lógica dura, impuestas por la naturaleza del trabajo), discrecionales (lógica blanda, por preferencia o buena práctica), externas y internas.' },
    { t: 'Adelantos y retrasos (lead / lag)', d: 'Adelanto: solapamiento que permite iniciar antes. Retraso: espera obligada entre actividades, como el curado del hormigón.' },
    { t: 'Estimación de duración', d: 'Análoga, paramétrica, de tres valores (PERT) o ascendente. La duración no es igual al esfuerzo: 40 horas de esfuerzo con una persona al 50 % son 2 semanas de duración.' },
    { t: 'Compresión del cronograma', d: 'Intensificación (añadir recursos, cuesta dinero) y ejecución rápida (solapar actividades, aumenta el riesgo).' },
    { t: 'Planificación por olas (rolling wave)', d: 'Detallar lo cercano y mantener lo lejano en alto nivel, refinando progresivamente.' },
    { t: 'Cadencia y velocidad', d: 'En enfoques adaptativos, la programación se expresa como capacidad por iteración y trabajo pendiente, no como fechas por actividad.' },
    { t: 'Cronograma comprimido frente a comprometido', d: 'El cronograma técnicamente posible y el que se comunica al cliente deben coincidir; comprometer fechas sin respaldo técnico es la causa más común del fracaso temporal.' }
  ],
  adaptacion: [
    'Diagrama de red y ruta crítica en predictivo; tablero de flujo con límites de trabajo en curso en adaptativo.',
    'Granularidad: actividades de días en proyectos cortos, de semanas en programas largos.',
    'Planificación por olas cuando el horizonte lejano es incierto.',
    'Frecuencia de actualización: diaria en proyectos críticos, semanal o quincenal en el resto.',
    'Uso de reservas de tiempo: contingencia por actividad frente a amortiguador de proyecto (cadena crítica).',
    'Nivel de formalidad del control: valor ganado del cronograma frente a seguimiento visual de flujo.'
  ],
  interacciones: [
    { con: 'alcance', d: 'La estructura del alcance define las actividades; ampliar alcance sin ajustar cronograma es la vía más rápida al incumplimiento.' },
    { con: 'recursos', d: 'La disponibilidad y el calendario de recursos condicionan la duración real; la nivelación de recursos suele alargar la ruta crítica.' },
    { con: 'finanzas', d: 'La compresión por intensificación consume presupuesto; el retraso genera costos indirectos por tiempo.' },
    { con: 'riesgos', d: 'La reserva de contingencia de tiempo se dimensiona con el análisis de riesgos; la ejecución rápida crea riesgos nuevos.' },
    { con: 'gobernanza', d: 'Cambiar la fecha comprometida exige cambio de línea base aprobado.' },
    { con: 'interesados', d: 'Las expectativas de fecha se gestionan comunicando rangos y su probabilidad, no un único número.' }
  ],
  verificar: [
    { ind: 'SPI (índice de desempeño del cronograma)', ok: 'Cercano o superior a 1,0 y estable; una tendencia descendente sostenida anticipa incumplimiento.' },
    { ind: 'Estabilidad de la ruta crítica', ok: 'La ruta crítica no cambia constantemente; si lo hace, la red de dependencias es frágil o la estimación es pobre.' },
    { ind: 'Cumplimiento de hitos', ok: 'Los hitos intermedios se cumplen; los hitos son la señal temprana, la fecha final es la tardía.' },
    { ind: 'Consumo de reserva de tiempo', ok: 'Proporcional al avance; consumir el 60 % de la reserva con el 20 % de avance es una alerta seria.' },
    { ind: 'Precisión de la estimación', ok: 'La desviación entre duración estimada y real disminuye a lo largo del proyecto.' },
    { ind: 'Velocidad estable (adaptativo)', ok: 'La capacidad por iteración es predecible dentro de un rango del ±15 %.' }
  ],
  ejemplos: [
    {
      titulo: 'Comprimir la actividad equivocada',
      contexto: 'Un proyecto lleva 3 semanas de retraso. El director asigna dos personas más a la actividad que va más atrasada: la elaboración de manuales de usuario, con 4 semanas de retraso.',
      aplicacion: 'El análisis de la red muestra que los manuales tienen <b>holgura total de 7 semanas</b>: no están en la ruta crítica. La ruta crítica pasa por la integración con el sistema de facturación, que lleva 3 semanas de retraso y holgura cero. Comprimir los manuales gasta recursos sin acortar el proyecto ni un día.',
      resultado: 'Se reasignan los recursos a la integración, aplicando intensificación con un especialista externo. El proyecto recupera 2 de las 3 semanas. La lección: <b>comprimir solo tiene efecto en la ruta crítica</b>, y saber cuál es exige mantener el diagrama de red actualizado.'
    },
    {
      titulo: 'Duración frente a esfuerzo: el error de estimación más común',
      contexto: 'Un analista estima que una tarea requiere «40 horas». El director la programa como una semana.',
      aplicacion: 'La conversación correcta separa las variables: 40 horas es <b>esfuerzo</b>. El analista está asignado al proyecto al 60 % y tiene dos reuniones fijas semanales. Su capacidad real es de 22 horas semanales sobre esta tarea. Además, la tarea requiere dos revisiones del cliente con 2 días de espera cada una.',
      resultado: 'La <b>duración</b> real es de aproximadamente 2,8 semanas, no 1. Programar por esfuerzo e ignorar disponibilidad y esperas genera cronogramas que se incumplen desde la primera semana y erosionan la credibilidad de todo el plan.'
    }
  ],
  preguntas: [
    { q: '¿Por qué el dominio del Cronograma solo tiene 3 procesos?',
      a: 'Porque la 8.ª edición reclasificó como <b>herramientas y técnicas</b> lo que la 6.ª edición trataba como procesos independientes: definir actividades, secuenciarlas y estimar duraciones son ahora pasos dentro de «Desarrollar el Cronograma». El razonamiento es que separarlos inducía una lectura secuencial rígida que no se sostiene en la práctica, especialmente en enfoques iterativos.' },
    { q: '¿Puede haber más de una ruta crítica?',
      a: 'Sí. Varias rutas pueden tener la misma duración total, y eso <b>aumenta el riesgo</b>: hay más caminos por los que el proyecto puede retrasarse y menos margen de maniobra. Un proyecto con cuatro rutas críticas paralelas requiere vigilancia mucho más intensa que uno con una sola.' },
    { q: '¿Qué es la holgura negativa?',
      a: 'Aparece cuando existe una restricción de fecha —«debe terminar el 30 de junio»— que el cronograma calculado no puede cumplir. Una holgura de −10 días significa que el proyecto termina 10 días después de la fecha exigida. No es un error del cálculo: es un <b>hecho que debe comunicarse</b> y resolverse con compresión, reducción de alcance o renegociación de la fecha.' },
    { q: '¿Cómo estimo en un proyecto donde nunca se ha hecho algo similar?',
      a: 'Combina técnicas: estimación de <b>tres valores</b> para incorporar la incertidumbre de forma explícita; <b>juicio de expertos</b> externos si no hay experiencia interna; <b>planificación por olas</b> para no comprometer detalle sobre lo que no conoces; y un <b>prototipo o prueba de concepto</b> temprano que convierta la incertidumbre en información. Comprometer una fecha firme sobre trabajo nunca hecho, sin ninguna de estas medidas, no es estimar: es adivinar.' },
    { q: '¿La nivelación de recursos cambia la ruta crítica?',
      a: 'Sí, con frecuencia. Al limitar la asignación a la disponibilidad real, algunas actividades se desplazan y la ruta crítica puede cambiar de camino y alargarse. Por eso la nivelación debe hacerse <b>antes</b> de comprometer la fecha, no después: un cronograma no nivelado suele ser optimista en varias semanas.' }
  ],
  relacionados: ['d-alcance', 'd-recursos', 'g5']
},

/* ══════════════ 4 · FINANZAS ══════════════ */
{
  id: 'd-finanzas',
  clave: 'finanzas',
  n: '2.4',
  titulo: 'Dominio de las Finanzas',
  clase: 'd-finanzas',
  lema: 'Costo, presupuesto y salud económica',
  resumen: 'Amplía lo que en ediciones anteriores era «Gestión de los Costos». No se limita a estimar y controlar el gasto: incorpora la financiación, el flujo de caja, la evaluación de la inversión y la salud económica del proyecto en relación con el caso de negocio. Es uno de los cambios estructurales más significativos de la 8.ª edición.',
  conceptosClave: [
    { t: 'Estimación de costos', d: 'Aproximación al costo de los recursos necesarios. Su precisión mejora con el avance: orden de magnitud (−25 % a +75 %) frente a definitiva (−5 % a +10 %).' },
    { t: 'Línea base de costos', d: 'Presupuesto aprobado por fase temporal, excluida la reserva de gestión. Es la referencia contra la que se mide el desempeño.' },
    { t: 'Reserva de contingencia', d: 'Fondo para riesgos <b>identificados</b>. Forma parte de la línea base de costos y la administra el director de proyecto.' },
    { t: 'Reserva de gestión', d: 'Fondo para riesgos <b>no identificados</b> (incógnitas desconocidas). Está fuera de la línea base y su uso requiere autorización de gobernanza.' },
    { t: 'Presupuesto hasta la conclusión (BAC)', d: 'Suma de la línea base de costos: el total autorizado para el trabajo del proyecto.' },
    { t: 'Valor ganado (EV)', d: 'Valor del trabajo realmente completado, expresado en el presupuesto autorizado para ese trabajo. Permite comparar avance físico con gasto.' },
    { t: 'Índices CPI y SPI', d: 'CPI = EV/AC mide eficiencia del costo; SPI = EV/PV mide eficiencia del cronograma. Por debajo de 1,0 indican desempeño desfavorable.' },
    { t: 'Flujo de caja y financiación', d: 'Cuándo se necesita el dinero y de dónde proviene. Un proyecto rentable puede fracasar por falta de liquidez en un momento concreto.' },
    { t: 'Evaluación de la inversión', d: 'VAN, TIR, período de recuperación y costo de oportunidad: instrumentos para juzgar si el proyecto sigue valiendo la pena.' },
    { t: 'Costo de la calidad', d: 'Prevención y evaluación frente a fallos internos y externos; permite justificar económicamente la inversión en calidad.' }
  ],
  adaptacion: [
    'Valor ganado completo en proyectos grandes; seguimiento simple de consumo contra presupuesto en pequeños.',
    'Precisión de la estimación proporcional a la fase y a la decisión que sustenta.',
    'Reservas: método de porcentaje fijo, análisis de riesgo individual o simulación Monte Carlo.',
    'Frecuencia de reporte financiero: mensual, quincenal o por iteración.',
    'Presupuesto por proyecto frente a financiación continua de producto.',
    'Moneda, inflación e impacto cambiario en proyectos internacionales.'
  ],
  interacciones: [
    { con: 'alcance', d: 'La estimación se construye sobre los paquetes de trabajo; sin alcance estable el presupuesto es ficticio.' },
    { con: 'cronograma', d: 'La distribución temporal del presupuesto sigue al cronograma; comprimir por intensificación aumenta el costo.' },
    { con: 'riesgos', d: 'El análisis cuantitativo de riesgos dimensiona la reserva de contingencia; los riesgos materializados la consumen.' },
    { con: 'recursos', d: 'El costo del personal suele ser la mayor partida; cambios de asignación impactan directamente el presupuesto.' },
    { con: 'gobernanza', d: 'Los umbrales de decisión se expresan en dinero y el uso de la reserva de gestión requiere autorización.' },
    { con: 'interesados', d: 'La transparencia sobre el estado financiero sostiene la confianza del patrocinador y del comité de inversión.' }
  ],
  verificar: [
    { ind: 'CPI', ok: 'Cercano o superior a 1,0 y estable; una caída sostenida indica subestimación sistemática.' },
    { ind: 'Consumo de reservas', ok: 'Proporcional al avance y al riesgo restante; no agotarse antes del 70 % de avance.' },
    { ind: 'Precisión del pronóstico (EAC)', ok: 'La estimación a la conclusión se estabiliza y converge en lugar de oscilar.' },
    { ind: 'Flujo de caja', ok: 'No hay períodos con necesidad de fondos superior a la disponibilidad comprometida.' },
    { ind: 'Vigencia del caso de negocio', ok: 'El VAN sigue siendo positivo con los datos actualizados.' },
    { ind: 'Costo de la calidad', ok: 'La inversión en prevención supera al costo de los fallos externos.' }
  ],
  ejemplos: [
    {
      titulo: 'Valor ganado: un cálculo completo',
      contexto: 'Proyecto de 12 meses y 600.000 USD. Al final del mes 6 se ha gastado 340.000 USD y el avance físico verificado es del 45 %.',
      aplicacion: '<b>PV</b> (valor planificado) = 50 % × 600.000 = 300.000 USD<br><b>EV</b> (valor ganado) = 45 % × 600.000 = 270.000 USD<br><b>AC</b> (costo real) = 340.000 USD<br><b>CV</b> = EV − AC = −70.000 USD → sobrecosto<br><b>SV</b> = EV − PV = −30.000 USD → retraso<br><b>CPI</b> = 270.000 / 340.000 = <b>0,79</b> → por cada dólar gastado se obtienen 0,79 de valor<br><b>SPI</b> = 270.000 / 300.000 = <b>0,90</b> → se avanza al 90 % del ritmo previsto<br><b>EAC</b> (si la tendencia continúa) = BAC / CPI = 600.000 / 0,79 ≈ <b>759.500 USD</b>',
      resultado: 'La proyección indica un sobrecosto de 159.500 USD, un 27 % sobre el presupuesto. El dato relevante no es el gasto acumulado —340.000 sobre 600.000 parece razonable— sino la <b>relación entre gasto y avance real</b>. Sin valor ganado, el problema se habría descubierto en el mes 10, cuando ya no había margen de reacción.'
    },
    {
      titulo: 'Contingencia y gestión: dos reservas, dos autoridades',
      contexto: 'Presupuesto: 800.000 USD de línea base (incluye 60.000 de contingencia) + 80.000 USD de reserva de gestión.',
      aplicacion: 'En el mes 4 se materializa un riesgo <b>identificado</b> en el registro: el proveedor de hardware retrasa la entrega y hay que alquilar equipamiento temporal por 22.000 USD. El director <b>usa la contingencia</b> por su propia autoridad y lo registra.<br>En el mes 7 aparece algo <b>no identificado</b>: un cambio normativo obliga a rehacer el módulo de reportes por 55.000 USD. El director <b>no puede</b> usar la reserva de gestión: eleva la solicitud al patrocinador.',
      resultado: 'La distinción no es contable, es de <b>autoridad</b>. La contingencia responde a lo que se anticipó y por eso el director puede disponer de ella; la reserva de gestión responde a lo imprevisible y su uso es una decisión de gobernanza que además señala que el análisis de riesgos tuvo un punto ciego.'
    }
  ],
  preguntas: [
    { q: '¿Por qué la 8.ª edición renombra Costos como Finanzas?',
      a: 'Porque «costos» sugiere solo control del gasto, mientras que la dirección de proyectos moderna exige entender <b>financiación, flujo de caja, evaluación de inversión y salud económica</b>. Un director que sabe si el proyecto sigue teniendo VAN positivo toma mejores decisiones que uno que solo sabe cuánto lleva gastado. El cambio de nombre refleja una ampliación real de responsabilidad, no una preferencia terminológica.' },
    { q: '¿Cuál es la diferencia entre contingencia y reserva de gestión?',
      a: 'Tres diferencias que conviene memorizar juntas. <b>Propósito</b>: contingencia para riesgos identificados, gestión para no identificados. <b>Ubicación</b>: contingencia dentro de la línea base de costos, gestión fuera. <b>Autoridad</b>: contingencia la usa el director, gestión requiere autorización de gobernanza. La pregunta de examen suele girar sobre la tercera.' },
    { q: '¿Qué significa un CPI de 0,85?',
      a: 'Que por cada dólar gastado se está obteniendo 0,85 dólares de valor: el proyecto tiene un sobrecosto del 15 % en el trabajo ya realizado. Si la causa es sistémica —subestimación general—, la proyección adecuada es EAC = BAC / CPI. Si la causa fue un evento puntual ya resuelto, se usa EAC = AC + (BAC − EV), que asume desempeño futuro según lo planificado. Elegir la fórmula correcta exige <b>diagnosticar la causa</b>, no aplicar una receta.' },
    { q: '¿Un proyecto rentable puede fracasar por finanzas?',
      a: 'Sí, y es más común de lo que parece: por <b>flujo de caja</b>. Un proyecto con VAN positivo a tres años puede quedarse sin liquidez en el mes 5 si los desembolsos se concentran al inicio y los cobros llegan al final. Por eso la 8.ª edición incorpora explícitamente la financiación y el flujo de caja al dominio: rentabilidad y liquidez son problemas distintos.' },
    { q: '¿Cómo se calcula la reserva de contingencia?',
      a: 'Tres métodos con distinto rigor. <b>Porcentaje fijo</b> sobre el presupuesto (5–15 %): rápido y grueso, aceptable en proyectos pequeños. <b>Suma de riesgos individuales</b>: probabilidad × impacto de cada riesgo del registro; más defendible. <b>Simulación Monte Carlo</b>: distribución de resultados posibles, permite elegir el percentil de confianza (P80, P90). El tercero es el estándar en proyectos grandes o de alta incertidumbre.' }
  ],
  relacionados: ['d-riesgos', 'd-alcance', 'g5']
},

/* ══════════════ 5 · INTERESADOS ══════════════ */
{
  id: 'd-interesados',
  clave: 'interesados',
  n: '2.5',
  titulo: 'Dominio de los Interesados',
  clase: 'd-interesados',
  lema: 'Personas, influencia y comunicación',
  resumen: 'Abarca la identificación, el análisis y el involucramiento de todas las personas y organizaciones que afectan o son afectadas por el proyecto, junto con la gestión de las comunicaciones. La 8.ª edición fusiona aquí lo que antes eran dos áreas separadas —Interesados y Comunicaciones— porque en la práctica son inseparables.',
  conceptosClave: [
    { t: 'Interesado', d: 'Individuo, grupo u organización que puede afectar, ser afectado o percibirse afectado por el proyecto. La percepción cuenta: quien se cree afectado actúa como afectado.' },
    { t: 'Análisis de interesados', d: 'Clasificación por poder, interés, influencia, impacto, actitud y proximidad. Instrumentos: matriz poder/interés, modelo de prominencia, cubo de interesados.' },
    { t: 'Registro de interesados', d: 'Documento vivo con identificación, evaluación y clasificación. Se actualiza a lo largo de todo el proyecto, no solo al inicio.' },
    { t: 'Matriz de evaluación del involucramiento', d: 'Compara el nivel actual con el deseado en cinco grados: desconocedor, reticente, neutral, partidario y líder.' },
    { t: 'Canales de comunicación', d: 'Con n interesados existen n(n−1)/2 canales posibles. Con 10 personas hay 45; con 20, 190. El crecimiento cuadrático explica por qué la comunicación se degrada con el tamaño.' },
    { t: 'Métodos de comunicación', d: 'Interactiva (bidireccional, máxima riqueza), de tipo push (enviada, sin garantía de recepción) y de tipo pull (disponible para consulta).' },
    { t: 'Plan de comunicaciones', d: 'Define qué se comunica, a quién, cuándo, por qué canal, en qué formato y quién es responsable.' },
    { t: 'Involucramiento frente a información', d: 'Informar es enviar; involucrar es que el interesado influya en decisiones. Confundirlos genera resistencia tardía.' },
    { t: 'Interesado silencioso', d: 'El que tiene alto poder pero baja visibilidad —área legal, seguridad, auditoría—. Aparece tarde y bloquea; identificarlo pronto es crítico.' }
  ],
  adaptacion: [
    'Matriz poder/interés formal frente a mapa ligero revisado por iteración.',
    'Frecuencia de actualización del registro: por hito o continua.',
    'Formalidad de las comunicaciones: informes estructurados frente a tableros visibles y conversación diaria.',
    'Multiculturalidad y husos horarios: proporción entre comunicación síncrona y asíncrona.',
    'Proyectos con interesados externos regulados: comunicaciones formales, trazables y a veces auditables.',
    'Idioma, accesibilidad y canales según el perfil de la audiencia.'
  ],
  interacciones: [
    { con: 'alcance', d: 'Los requisitos vienen de los interesados; un interesado no identificado es un requisito que aparecerá tarde y caro.' },
    { con: 'gobernanza', d: 'El patrocinador y los órganos de decisión son interesados con rol formal de autoridad.' },
    { con: 'riesgos', d: 'La resistencia de un interesado influyente es un riesgo con probabilidad e impacto, y debe registrarse como tal.' },
    { con: 'recursos', d: 'Los jefes funcionales son interesados que controlan la disponibilidad del equipo.' },
    { con: 'cronograma', d: 'Las expectativas de fecha se gestionan por comunicación; la sorpresa es el peor enemigo de la confianza.' },
    { con: 'finanzas', d: 'El comité de inversión decide sobre la continuidad basándose en la información que este dominio le entrega.' }
  ],
  verificar: [
    { ind: 'Cobertura del registro', ok: 'No aparecen interesados relevantes después de la planificación inicial.' },
    { ind: 'Brecha de involucramiento', ok: 'La distancia entre nivel actual y deseado se reduce para los interesados de alto poder.' },
    { ind: 'Sorpresas', ok: 'Ningún interesado se entera de una decisión que le afecta por un canal informal.' },
    { ind: 'Tiempo de respuesta', ok: 'Las solicitudes de decisión a interesados clave se resuelven dentro del plazo acordado.' },
    { ind: 'Retrabajo por requisitos tardíos', ok: 'Bajo y decreciente; el retrabajo tardío casi siempre traza a un interesado omitido.' },
    { ind: 'Percepción de los interesados', ok: 'Encuestas o conversaciones estructuradas muestran comprensión correcta del estado del proyecto.' }
  ],
  ejemplos: [
    {
      titulo: 'El interesado silencioso que apareció en el mes 8',
      contexto: 'Proyecto de plataforma de comercio electrónico. Se identificaron 14 interesados: negocio, tecnología, marketing, logística, atención al cliente y proveedores.',
      aplicacion: 'En el mes 8, a tres semanas del lanzamiento, el <b>oficial de protección de datos</b> —no identificado en el registro— revisa la solución y detecta que el tratamiento de datos de menores incumple la normativa. Exige cambios en el registro de usuarios, la política de consentimiento y la retención de datos.',
      resultado: 'Seis semanas de retraso y 40.000 USD de retrabajo. Un análisis de interesados que hubiese preguntado sistemáticamente «¿quién tiene <b>poder de veto</b> aunque no participe en el día a día?» —legal, seguridad, auditoría, cumplimiento, sindicatos, reguladores— habría identificado el rol en la semana 2, cuando incorporarlo costaba una reunión.'
    },
    {
      titulo: 'De reticente a partidario: una estrategia de involucramiento',
      contexto: 'El jefe de operaciones, con alto poder y actitud abiertamente contraria, considera que el nuevo sistema «va a paralizar la planta».',
      aplicacion: 'La matriz de involucramiento sitúa su nivel actual en <b>reticente</b> y el deseado en <b>partidario</b>. La estrategia no consiste en enviarle más informes —eso es informar, no involucrar—: se le pide que <b>defina personalmente los criterios de aceptación</b> del módulo de operaciones y que designe a dos operarios de su equipo para las pruebas. Se acuerda con él un plan de contingencia de vuelta atrás por si el sistema falla en el arranque.',
      resultado: 'A los dos meses su posición pasa a <b>partidario</b>: defiende el proyecto ante la dirección porque el diseño incorpora sus condiciones. Su resistencia inicial no era irracional: era la respuesta previsible de quien tiene responsabilidad sobre un riesgo operativo y ninguna influencia sobre la decisión que lo genera.'
    }
  ],
  preguntas: [
    { q: '¿Por qué se fusionaron Interesados y Comunicaciones?',
      a: 'Porque separarlas producía un efecto perverso: planes de comunicación diseñados como calendarios de envío, desconectados de qué necesita cada interesado y de qué se busca lograr con él. Al unirlas, la comunicación se convierte en el <b>instrumento del involucramiento</b>: primero se determina qué nivel de involucramiento se necesita de cada interesado, y de ahí se deriva qué comunicar, cómo y con qué frecuencia.' },
    { q: '¿Cómo identifico interesados que nadie menciona?',
      a: 'Cuatro preguntas sistemáticas que rescatan a los invisibles: <b>¿quién puede decir que no?</b> (poder de veto: legal, seguridad, auditoría, cumplimiento); <b>¿quién sufre el cambio sin haberlo pedido?</b> (usuarios finales, operaciones, soporte); <b>¿quién pierde algo si el proyecto tiene éxito?</b> (áreas que ceden presupuesto, personal o poder); <b>¿quién tendrá que mantener esto dentro de dos años?</b> (operaciones, soporte, el equipo de producto).' },
    { q: '¿Cuántos canales de comunicación hay en un equipo de 15 personas?',
      a: 'n(n−1)/2 = 15 × 14 / 2 = <b>105 canales</b>. El dato importa porque explica un fenómeno real: al pasar de 10 a 15 personas los canales crecen de 45 a 105, más del doble. La comunicación se degrada de forma cuadrática, no lineal, y por eso los equipos grandes necesitan estructura de comunicación explícita mientras que los pequeños funcionan por conversación.' },
    { q: '¿Qué hago con un interesado de alto poder y bajo interés?',
      a: 'Mantenerlo <b>satisfecho</b>: informado de lo esencial, sin saturarlo. El riesgo con este perfil es doble: si lo saturas, deja de leer y pierdes el canal cuando lo necesites; si lo ignoras, puede activarse en el peor momento con poder suficiente para bloquear. La forma habitual es un resumen breve y periódico, más contacto directo inmediato ante cualquier decisión que le afecte.' },
    { q: '¿Informar es involucrar?',
      a: 'No, y confundirlos es la causa más frecuente de resistencia tardía. <b>Informar</b> es unidireccional: el interesado recibe. <b>Involucrar</b> es bidireccional: el interesado influye en la decisión. Un interesado al que solo se informa cumple formalmente pero no se compromete, y cuando el proyecto le exija un cambio real de comportamiento, no lo hará. Involucrar cuesta más tiempo al principio y muchísimo menos al final.' }
  ],
  relacionados: ['d-alcance', 'pr-6', 'd-riesgos']
},

/* ══════════════ 6 · RECURSOS ══════════════ */
{
  id: 'd-recursos',
  clave: 'recursos',
  n: '2.6',
  titulo: 'Dominio de los Recursos',
  clase: 'd-recursos',
  lema: 'Equipo, materiales y capacidad',
  resumen: 'Cubre la planificación, adquisición, desarrollo, liderazgo y control de todos los recursos del proyecto: personas, materiales, equipamiento e instalaciones. Integra lo que en la 7.ª edición era el dominio de Equipo, sumando la gestión de recursos físicos bajo una lógica común de capacidad.',
  conceptosClave: [
    { t: 'Recursos humanos y físicos', d: 'Personas, y también materiales, equipamiento, instalaciones e infraestructura. Ambos comparten la lógica de disponibilidad, capacidad y consumo.' },
    { t: 'Matriz RACI', d: 'Asignación de responsabilidades: Responsable de ejecutar, Aprobador (accountable, uno y solo uno), Consultado e Informado.' },
    { t: 'Calendario de recursos', d: 'Disponibilidad real de cada recurso considerando vacaciones, festivos, dedicación parcial y compromisos con otros proyectos.' },
    { t: 'Histograma de recursos', d: 'Representación de la carga a lo largo del tiempo; revela sobreasignaciones y valles de subutilización.' },
    { t: 'Nivelación y equilibrio de recursos', d: 'Nivelación: ajustar el cronograma a la disponibilidad (puede alargar el proyecto). Equilibrio: usar la holgura sin cambiar la fecha de fin.' },
    { t: 'Desarrollo del equipo', d: 'Modelo de Tuckman: formación, turbulencia, normalización, desempeño y disolución. La turbulencia es una etapa necesaria, no un fallo de liderazgo.' },
    { t: 'Equipos virtuales y distribuidos', d: 'Exigen protocolos explícitos de comunicación asíncrona, superposición horaria acordada y documentación de decisiones.' },
    { t: 'Teorías de motivación', d: 'Maslow (jerarquía de necesidades), Herzberg (factores de higiene frente a motivadores), McGregor (teoría X e Y), McClelland (logro, poder, afiliación).' },
    { t: 'Capacidad frente a disponibilidad', d: 'Una persona asignada al 100 % no rinde 40 horas de trabajo de proyecto: entre reuniones, cambio de contexto y trabajo administrativo, la capacidad efectiva ronda el 60–70 %.' }
  ],
  adaptacion: [
    'Equipo dedicado a tiempo completo frente a asignación parcial matricial.',
    'Formalidad de la matriz RACI: obligatoria en equipos grandes o multi-organización, opcional en equipos pequeños y estables.',
    'Equipos colocados frente a distribuidos en varios husos horarios.',
    'Recursos físicos: proyectos de construcción o manufactura exigen logística y almacenamiento; los de software, casi ninguno.',
    'Modelo de asignación: recursos por proyecto frente a equipos de producto estables.',
    'Estrategia de desarrollo: formación formal frente a aprendizaje en el puesto y rotación de conocimiento.'
  ],
  interacciones: [
    { con: 'cronograma', d: 'La disponibilidad real determina la duración; la nivelación puede alargar la ruta crítica.' },
    { con: 'finanzas', d: 'El costo del personal es normalmente la mayor partida presupuestaria.' },
    { con: 'riesgos', d: 'La dependencia de una única persona clave es un riesgo de alta severidad que exige respuesta explícita.' },
    { con: 'alcance', d: 'El tipo de trabajo definido determina qué perfiles son necesarios y cuándo.' },
    { con: 'gobernanza', d: 'La asignación de recursos escasos suele exceder la autoridad del director y escalar a gobernanza.' },
    { con: 'interesados', d: 'Los jefes funcionales son interesados que controlan la disponibilidad efectiva del equipo.' }
  ],
  verificar: [
    { ind: 'Sobreasignación', ok: 'Ningún recurso supera su capacidad efectiva de forma sostenida.' },
    { ind: 'Rotación no planificada', ok: 'Baja; la rotación alta señala problemas de liderazgo, carga o claridad de rol.' },
    { ind: 'Factor de bus', ok: 'Ninguna función crítica depende de una sola persona sin respaldo ni documentación.' },
    { ind: 'Claridad de rol', ok: 'Cada miembro puede enunciar sus responsabilidades sin ambigüedad; la RACI tiene un único A por actividad.' },
    { ind: 'Disponibilidad real frente a comprometida', ok: 'La desviación es menor al 15 %; una brecha mayor invalida el cronograma.' },
    { ind: 'Clima y sostenibilidad del ritmo', ok: 'Las horas extra son excepcionales y no sistemáticas.' }
  ],
  ejemplos: [
    {
      titulo: 'El 100 % que en realidad era el 55 %',
      contexto: 'El cronograma asume que cinco analistas están asignados al 100 %, es decir, 200 horas semanales de capacidad de proyecto.',
      aplicacion: 'Se mide la capacidad efectiva durante tres semanas: reuniones de coordinación y de organización (6 h/semana/persona), soporte a incidencias del sistema anterior (5 h), formación y administración (2 h), y pérdida por cambio de contexto entre dos proyectos (≈4 h). Capacidad real: <b>23 h/semana por persona</b>, es decir 115 horas semanales de equipo, un 57 % de lo supuesto.',
      resultado: 'El cronograma estaba sobrestimado en un 43 % desde el primer día. Se toman tres medidas: se retira el soporte al sistema anterior a un equipo dedicado, se agrupan las reuniones en dos días y se elimina el trabajo en dos proyectos paralelos. La capacidad sube a 32 h/semana por persona y el cronograma se replanifica sobre datos reales en lugar de sobre un supuesto de dedicación total que nunca existió.'
    },
    {
      titulo: 'Factor de bus: cuando el riesgo tiene nombre propio',
      contexto: 'Un único desarrollador conoce el motor de cálculo de comisiones. No hay documentación ni nadie más ha trabajado en ese componente.',
      aplicacion: 'Se registra explícitamente como riesgo: «Indisponibilidad de [rol] → detención del componente de comisiones», probabilidad media (vacaciones previstas, oferta laboral externa conocida), impacto alto (ruta crítica). Respuesta de <b>mitigación</b>: programación en pareja dos días por semana durante un mes, documentación de las reglas de negocio y una sesión grabada de recorrido del código.',
      resultado: 'El desarrollador renuncia en el mes 6. El componente sigue avanzando con dos semanas de desaceleración en lugar de detenerse. El costo de la mitigación fue de unas 60 horas; el costo de no haberla hecho se estimó en 8 semanas de proyecto.'
    }
  ],
  preguntas: [
    { q: '¿Qué diferencia hay entre nivelación y equilibrio de recursos?',
      a: 'La <b>nivelación</b> ajusta el cronograma a la disponibilidad de recursos y <b>puede alargar la fecha de fin</b>: se usa cuando el recurso es la restricción dura. El <b>equilibrio</b> (resource smoothing) redistribuye el trabajo aprovechando la holgura disponible <b>sin cambiar la fecha de fin</b>: solo actúa sobre actividades con holgura y por tanto nunca toca la ruta crítica.' },
    { q: 'En una matriz RACI, ¿puede haber dos «A» en la misma actividad?',
      a: 'No. La <b>A (accountable)</b> es única por definición: es la persona que rinde cuentas del resultado. Dos «A» significa que nadie rinde cuentas, porque cada uno asume que el otro responde. Puede haber varias «R» (quienes ejecutan), varias «C» y varias «I», pero una sola «A».' },
    { q: '¿Cómo lidero un equipo sobre el que no tengo autoridad formal?',
      a: 'Con influencia construida antes de necesitarla: <b>claridad</b> (que cada persona sepa exactamente qué se espera y por qué importa), <b>reciprocidad</b> (facilitar el trabajo de otros antes de pedir), <b>credibilidad</b> (cumplir compromisos pequeños de forma consistente), <b>reconocimiento visible</b> ante los jefes funcionales de quienes contribuyen, y <b>eliminación de impedimentos</b>, que es lo que más rápido genera adhesión real.' },
    { q: '¿La etapa de turbulencia del equipo es un fracaso?',
      a: 'No: es <b>necesaria</b>. En la turbulencia el equipo negocia roles, límites y formas de trabajar. Los equipos que la evitan por exceso de cortesía no llegan a la etapa de desempeño: mantienen una armonía superficial que se rompe ante la primera presión real. El papel del líder no es evitar el conflicto, sino <b>que sea sobre ideas y no sobre personas</b>, y que se resuelva.' },
    { q: '¿Los recursos físicos se gestionan igual que las personas?',
      a: 'Comparten la lógica de <b>capacidad, disponibilidad y consumo</b>, y por eso la 8.ª edición los reúne en un dominio. Pero divergen en aspectos críticos: los recursos físicos requieren logística, almacenamiento, mantenimiento y control de inventario; las personas requieren desarrollo, motivación, seguridad psicológica y liderazgo. Un director que trata a las personas como capacidad fungible destruye equipo aunque el cronograma cuadre.' }
  ],
  relacionados: ['d-cronograma', 'pr-6', 'pr-4']
},

/* ══════════════ 7 · RIESGOS ══════════════ */
{
  id: 'd-riesgos',
  clave: 'riesgos',
  n: '2.7',
  titulo: 'Dominio de los Riesgos',
  clase: 'd-riesgos',
  lema: 'Incertidumbre, amenazas y oportunidades',
  resumen: 'Gestiona la incertidumbre: identificar lo que puede ocurrir, analizarlo, decidir qué hacer al respecto, ejecutar esas decisiones y vigilar la evolución. Cubre tanto amenazas como oportunidades, y trata la incertidumbre general —no solo los eventos discretos— como objeto de gestión.',
  conceptosClave: [
    { t: 'Riesgo', d: 'Evento o condición incierta que, de ocurrir, tiene efecto positivo (oportunidad) o negativo (amenaza) sobre uno o más objetivos.' },
    { t: 'Riesgo individual y riesgo general', d: 'Individual: un evento concreto del registro. General: la exposición agregada del proyecto, que no es la suma de los individuales por efecto de correlaciones.' },
    { t: 'Apetito, tolerancia y umbral', d: 'Apetito: cuánto riesgo está dispuesta a asumir la organización. Tolerancia: rango aceptable. Umbral: punto concreto de actuación o escalamiento.' },
    { t: 'Estructura de desglose de riesgos (RBS)', d: 'Categorización jerárquica —técnico, externo, organizacional, de dirección— que asegura cobertura sistemática en la identificación.' },
    { t: 'Análisis cualitativo', d: 'Prioriza por probabilidad e impacto, con matriz P×I. Rápido, subjetivo y suficiente en la mayoría de los proyectos.' },
    { t: 'Análisis cuantitativo', d: 'Modela numéricamente el efecto agregado: simulación Monte Carlo, análisis de sensibilidad (diagrama de tornado), árboles de decisión y valor monetario esperado.' },
    { t: 'Respuestas a amenazas', d: 'Escalar, evitar, transferir, mitigar y aceptar (activa o pasivamente).' },
    { t: 'Respuestas a oportunidades', d: 'Escalar, explotar, compartir, mejorar y aceptar.' },
    { t: 'Riesgo residual y secundario', d: 'Residual: el que permanece tras aplicar la respuesta. Secundario: el que <b>surge de</b> aplicar la respuesta.' },
    { t: 'Disparador (trigger)', d: 'Señal observable de que un riesgo está a punto de materializarse o ya lo está haciendo. Sin disparadores definidos, la vigilancia es reactiva.' },
    { t: 'Propietario del riesgo', d: 'Persona nombrada, responsable de vigilar el riesgo y ejecutar la respuesta. Un riesgo sin propietario no se gestiona.' }
  ],
  adaptacion: [
    'Análisis cualitativo solamente en proyectos pequeños; cuantitativo con simulación en proyectos grandes o críticos.',
    'Frecuencia de revisión del registro: semanal en proyectos volátiles, mensual en estables, por iteración en adaptativos.',
    'Escalas de probabilidad e impacto: cualitativas (alto/medio/bajo) o numéricas calibradas.',
    'Método de cálculo de reservas: porcentaje fijo, suma de riesgos o simulación a un percentil de confianza.',
    'Amplitud del registro: en proyectos ágiles, riesgos integrados como elementos del backlog con prioridad propia.',
    'Nivel de formalidad del escalamiento: informal en equipos pequeños, con procedimiento en organizaciones grandes.'
  ],
  interacciones: [
    { con: 'finanzas', d: 'El análisis cuantitativo dimensiona la reserva de contingencia; los riesgos materializados la consumen.' },
    { con: 'cronograma', d: 'La reserva de tiempo se dimensiona con el análisis de riesgos; la ejecución rápida genera riesgos secundarios.' },
    { con: 'alcance', d: 'El alcance ambiguo es fuente primaria de riesgo; reducir alcance es una respuesta legítima de evitación.' },
    { con: 'recursos', d: 'La dependencia de personas clave y la escasez de perfiles son riesgos frecuentes y de alto impacto.' },
    { con: 'gobernanza', d: 'La gobernanza fija el apetito de riesgo, aprueba respuestas costosas y recibe los riesgos escalados.' },
    { con: 'interesados', d: 'La resistencia de un interesado influyente es un riesgo con probabilidad, impacto y respuesta.' }
  ],
  verificar: [
    { ind: 'Cobertura de la identificación', ok: 'Los problemas que ocurren estaban en el registro; una alta proporción de sorpresas indica identificación deficiente.' },
    { ind: 'Riesgos con propietario y respuesta', ok: '100 % de los riesgos de severidad alta tienen ambos.' },
    { ind: 'Efectividad de las respuestas', ok: 'La exposición agregada disminuye tras ejecutar las respuestas planificadas.' },
    { ind: 'Consumo de contingencia', ok: 'Proporcional al avance; el agotamiento temprano indica subestimación del riesgo.' },
    { ind: 'Riesgos cerrados', ok: 'El registro se depura: los riesgos que ya no aplican se cierran formalmente.' },
    { ind: 'Oportunidades gestionadas', ok: 'El registro no contiene solo amenazas; se identifican y explotan oportunidades.' }
  ],
  ejemplos: [
    {
      titulo: 'Las cinco respuestas a una misma amenaza',
      contexto: 'Riesgo: «El proveedor único del componente crítico puede incumplir el plazo de entrega». Probabilidad media, impacto alto sobre la ruta crítica.',
      aplicacion: '<b>Evitar</b> — rediseñar la solución para no depender de ese componente. Elimina el riesgo, pero cuesta 3 semanas de rediseño.<br><b>Transferir</b> — cláusula contractual con penalización por retraso y seguro de cumplimiento. El impacto financiero pasa al proveedor, pero el impacto en plazo sigue siendo del proyecto.<br><b>Mitigar</b> — homologar un segundo proveedor y adelantar el pedido con pago parcial. Reduce probabilidad e impacto; cuesta 12.000 USD.<br><b>Aceptar activamente</b> — asumir el riesgo y preparar un plan de contingencia: alquiler de un componente sustituto si el disparador se activa.<br><b>Escalar</b> — si la relación con ese proveedor es una decisión corporativa fuera del proyecto, elevarla a gobernanza.',
      resultado: 'Se elige <b>mitigar</b> combinado con <b>aceptar activamente</b>: segundo proveedor homologado más plan de contingencia. Nótese que transferir <b>no elimina el impacto en plazo</b>: es el error más común en la elección de respuestas, porque una penalización cobrada no entrega el proyecto a tiempo.'
    },
    {
      titulo: 'Riesgo secundario: la respuesta que crea un riesgo nuevo',
      contexto: 'Para mitigar el riesgo de retraso, se decide subcontratar a un equipo externo el desarrollo de un módulo.',
      aplicacion: 'La respuesta reduce el riesgo original, pero genera dos riesgos <b>secundarios</b> que deben registrarse con el mismo rigor: (1) el equipo externo desconoce el dominio de negocio, lo que puede provocar retrabajo; (2) la integración de código de dos equipos con estándares distintos puede generar defectos. Además queda un riesgo <b>residual</b>: aun con el equipo externo, el retraso podría ocurrir si la especificación llega tarde.',
      resultado: 'Se registran los tres —dos secundarios y uno residual— con sus propias respuestas: taller de inmersión en el dominio, definición conjunta de estándares y revisión cruzada de código. Ignorar los riesgos secundarios es la forma más habitual de que una respuesta bien intencionada empeore la situación.'
    }
  ],
  preguntas: [
    { q: '¿Cuál es la diferencia entre un riesgo y un incidente?',
      a: 'Un <b>riesgo</b> es futuro e incierto: puede ocurrir. Un <b>incidente</b> (issue) es presente y cierto: ya ocurrió y hay que resolverlo. Viven en registros distintos y se gestionan de forma distinta: al riesgo se le asigna respuesta preventiva; al incidente, un responsable y una fecha de resolución. Cuando un riesgo se materializa, deja el registro de riesgos y pasa al de incidentes.' },
    { q: '¿Cuándo escalo un riesgo en lugar de gestionarlo?',
      a: 'Cuando está <b>fuera del ámbito de autoridad del proyecto</b>: un cambio regulatorio, una decisión corporativa sobre proveedores, un riesgo que afecta a todo el portafolio. Escalar no es delegar la incomodidad: es reconocer que el nivel adecuado de decisión está por encima. Una vez escalado y aceptado por ese nivel, el riesgo <b>sale</b> del registro del proyecto, aunque conviene dejar constancia del escalamiento.' },
    { q: '¿Cómo se calcula el valor monetario esperado?',
      a: 'VME = probabilidad × impacto monetario, con signo negativo para amenazas y positivo para oportunidades. Ejemplo: un riesgo con 30 % de probabilidad y 200.000 USD de impacto tiene VME = −60.000 USD. Su utilidad principal es <b>comparar alternativas de respuesta</b>: si mitigarlo cuesta 25.000 USD y reduce la probabilidad al 5 %, el VME pasa a −10.000, con un beneficio neto de 25.000 USD. Su límite: no captura eventos catastróficos de baja probabilidad, donde la decisión no debe tomarse por valor esperado.' },
    { q: '¿Los proyectos ágiles gestionan riesgos?',
      a: 'Sí, con mecanismos distintos y a veces más eficaces. Las iteraciones cortas <b>reducen estructuralmente</b> la exposición porque acortan el horizonte de incertidumbre; la retroalimentación frecuente detecta problemas antes; y los riesgos suelen integrarse en el backlog como elementos priorizables (los «spikes» son literalmente trabajo de reducción de incertidumbre). Lo que cambia es la forma, no la existencia de la gestión.' },
    { q: '¿Por qué la 8.ª edición fusiona el análisis cualitativo y cuantitativo en un solo proceso?',
      a: 'Porque en la práctica son un continuo de profundidad y no dos actividades separadas: todo proyecto realiza análisis cualitativo, y solo algunos profundizan con cuantitativo cuando el tamaño, la criticidad o la política lo justifican. Unificarlos en «Realizar el Análisis de Riesgos» refuerza el mensaje de adaptación: eliges la profundidad, no si analizas o no.' },
    { q: '¿Aceptar un riesgo es no hacer nada?',
      a: 'Depende del tipo. La aceptación <b>pasiva</b> es efectivamente no hacer nada más que documentarlo, y es adecuada para riesgos de baja severidad. La aceptación <b>activa</b> implica preparar un plan de contingencia y, con frecuencia, reservar fondos o tiempo: se decide no actuar ahora, pero se está listo para actuar si el disparador se activa. Confundirlas hace que riesgos «aceptados» encuentren al equipo desprevenido.' }
  ],
  relacionados: ['d-finanzas', 'd-cronograma', 'g5']
}

];
