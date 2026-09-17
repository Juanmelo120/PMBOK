/* ═══════════════════════════════════════════════════════════
   principios.js — Los 6 principios de la 8.ª edición
   ───────────────────────────────────────────────────────────
   Criterios de juicio, no procedimientos. La sección 9 de la
   verificación de calidad pide evidencia de cada uno en una
   decisión concreta del proyecto.
   ═══════════════════════════════════════════════════════════ */

window.PMBOK = window.PMBOK || {};

PMBOK.principios = [
  {
    id: 'pr-1', n: '3.1',
    titulo: 'Adoptar una Visión Holística',
    lema: 'Ver el proyecto como parte de un sistema, no como una isla.',
    enunciado: 'Reconocer, evaluar y responder a las interacciones dinámicas dentro y fuera del proyecto, entendiéndolo como un componente de un sistema mayor de entrega de valor.',
    resumen: 'Consolida el pensamiento sistémico, la navegación de la complejidad y el reconocimiento de interacciones que en la 7.ª edición eran tres principios separados.',
    impacto: [
      'Se anticipan efectos de segundo orden: una decisión en un dominio se evalúa por lo que provoca en los demás.',
      'Se reducen las optimizaciones locales que degradan el resultado global.',
      'Las decisiones se alinean con la estrategia organizacional, no solo con los objetivos del proyecto.',
      'La complejidad se gestiona explícitamente en lugar de negarse o simplificarse de forma engañosa.'
    ],
    enAccion: [
      'Antes de aprobar un cambio, recorrer los siete dominios preguntando por su efecto en cada uno.',
      'Mantener visible el vínculo entre los entregables y los beneficios estratégicos que justifican el proyecto.',
      'Identificar dependencias con otros proyectos, programas y con la operación diaria.',
      'Distinguir problemas *complicados* (analizables, con solución conocida) de problemas *complejos* (emergentes, que requieren experimentar y adaptar).',
      'Usar diagramas de interacción y análisis de causa raíz antes de actuar sobre síntomas.',
      'Revisar periódicamente si el proyecto sigue siendo la mejor forma de obtener el beneficio buscado.'
    ],
    dominios: ['gobernanza', 'alcance', 'riesgos', 'interesados'],
    senales: {
      presente: [
        'El equipo pregunta «¿a quién más afecta esto?» de forma espontánea.',
        'Las dependencias externas aparecen en el registro de riesgos.',
        'Se mide el resultado, no solo el entregable.'
      ],
      ausente: [
        'Cada área optimiza su parte y el conjunto empeora.',
        'Los cambios sorprenden a áreas que nadie consultó.',
        'El proyecto avanza aunque su justificación estratégica ya no exista.'
      ]
    }
  },
  {
    id: 'pr-2', n: '3.2',
    titulo: 'Centrarse en el Valor',
    lema: 'El éxito no es cumplir el plan; es producir el resultado que importa.',
    enunciado: 'Evaluar y ajustar continuamente la alineación del proyecto con los objetivos de negocio y los beneficios previstos, priorizando el valor por encima del cumplimiento formal.',
    resumen: 'Desplaza el criterio de éxito desde el cumplimiento de restricciones hacia la realización efectiva de beneficios para los interesados.',
    impacto: [
      'El caso de negocio deja de ser un trámite inicial y se convierte en referencia viva a lo largo del proyecto.',
      'La priorización se hace por valor entregado, no por facilidad de ejecución ni por antigüedad de la solicitud.',
      'Se hace posible —y respetable— terminar anticipadamente un proyecto que dejó de crear valor.',
      'El equipo entiende para qué trabaja, lo que mejora la calidad de las decisiones técnicas cotidianas.'
    ],
    enAccion: [
      'Revisar el caso de negocio en cada puerta de fase, no solo al inicio.',
      'Definir indicadores de resultado (no solo de entregable) desde la planificación.',
      'Priorizar el trabajo pendiente por valor y por costo del retraso, no por orden de llegada.',
      'Entregar de forma incremental cuando sea posible, para adelantar la realización de valor.',
      'Cuestionar requisitos que no trazan a ningún beneficio identificado.',
      'Dejar establecido quién medirá los beneficios después del cierre y con qué periodicidad.'
    ],
    dominios: ['alcance', 'finanzas', 'interesados', 'gobernanza'],
    senales: {
      presente: [
        'Existe un plan de realización de beneficios con responsable nombrado.',
        'Se descartan requisitos que no trazan a un beneficio.',
        'El caso de negocio se revisa y a veces cambia.'
      ],
      ausente: [
        'El éxito se declara al entregar, sin medir resultado.',
        'Se construyen funcionalidades que nadie usa.',
        'Nadie sabe decir cuánto valor generó el proyecto un año después.'
      ]
    }
  },
  {
    id: 'pr-3', n: '3.3',
    titulo: 'Incorporar la Calidad en los Procesos y Entregables',
    lema: 'La calidad se construye; no se inspecciona al final.',
    enunciado: 'Integrar la calidad en la forma de trabajar y en los productos desde el inicio, previniendo defectos en lugar de detectarlos tarde.',
    resumen: 'Traslada el énfasis de la inspección final hacia la prevención, con criterios de aceptación definidos antes de construir.',
    impacto: [
      'Los defectos se detectan cerca de su origen, donde corregirlos es mucho más barato.',
      'Se reduce el retrabajo y la variabilidad del resultado.',
      'Los criterios de aceptación explícitos eliminan la discusión sobre «si está terminado».',
      'La confianza de los interesados crece porque el resultado es predecible.'
    ],
    enAccion: [
      'Definir criterios de aceptación y «definición de terminado» antes de comenzar a construir.',
      'Incorporar revisiones entre pares, pruebas automatizadas y validación temprana en el flujo normal de trabajo.',
      'Medir el costo de la calidad: prevención y evaluación frente a fallos internos y externos.',
      'Aplicar análisis de causa raíz a los defectos recurrentes en lugar de corregirlos uno a uno.',
      'Auditar procesos —aseguramiento— y no solo inspeccionar productos —control—.',
      'Ajustar el nivel de rigor a la criticidad: la calidad se adapta, no se abandona.'
    ],
    dominios: ['alcance', 'gobernanza', 'riesgos'],
    senales: {
      presente: [
        'Existe definición de terminado y se respeta.',
        'Los defectos se analizan por causa, no solo por síntoma.',
        'Las pruebas ocurren durante, no solo al final.'
      ],
      ausente: [
        'Fase de estabilización sorpresa al final del proyecto.',
        'Discusiones recurrentes sobre si un entregable está completo.',
        'El mismo tipo de defecto reaparece cada mes.'
      ]
    }
  },
  {
    id: 'pr-4', n: '3.4',
    titulo: 'Ser un Líder Responsable',
    lema: 'Autoridad delegada, responsabilidad indelegable.',
    enunciado: 'Actuar con integridad, cuidado y confiabilidad, cumpliendo compromisos internos y externos, y demostrando comportamientos de liderazgo apropiados al contexto.',
    resumen: 'Consolida la administración diligente, los comportamientos de liderazgo y la práctica respetuosa que en la 7.ª edición eran principios separados.',
    impacto: [
      'La confianza se convierte en el activo que permite decidir rápido con menos control formal.',
      'Los compromisos se cumplen o se renegocian a tiempo, no se incumplen en silencio.',
      'Los dilemas éticos se afrontan de forma explícita en lugar de posponerse.',
      'El estilo de liderazgo se ajusta a la madurez del equipo y a la urgencia de la situación.'
    ],
    enAccion: [
      'Comunicar las malas noticias temprano, con opciones y con impacto cuantificado.',
      'Cumplir el Código de Ética y Conducta Profesional del PMI: responsabilidad, respeto, equidad y honestidad.',
      'Reconocer el error propio y corregirlo, en lugar de administrarlo políticamente.',
      'Proteger al equipo de la sobrecarga sostenida y de las interrupciones evitables.',
      'Dar crédito al equipo por los logros y asumir personalmente los fallos de dirección.',
      'Ajustar el estilo: directivo ante crisis o equipos noveles; servicial y delegativo ante equipos maduros.'
    ],
    dominios: ['gobernanza', 'interesados', 'recursos'],
    senales: {
      presente: [
        'Las malas noticias llegan pronto y con propuesta.',
        'El equipo plantea problemas sin miedo.',
        'Las decisiones difíciles quedan documentadas con su razón.'
      ],
      ausente: [
        'Los informes de estado son siempre verdes hasta que dejan de serlo.',
        'Se busca culpables antes que causas.',
        'Los compromisos se aceptan sabiendo que no se cumplirán.'
      ]
    }
  },
  {
    id: 'pr-5', n: '3.5',
    titulo: 'Integrar la Sostenibilidad',
    lema: 'Un resultado no es bueno si su costo lo pagan otros o el futuro.',
    enunciado: 'Considerar los impactos ambientales, sociales, económicos y de gobernanza del proyecto y de su producto a lo largo de todo su ciclo de vida, y actuar en consecuencia.',
    resumen: 'Novedad de la 8.ª edición: la sostenibilidad deja de ser una mención dispersa y se convierte en principio con criterios propios.',
    impacto: [
      'El horizonte de evaluación se extiende más allá del cierre: alcanza el uso y el retiro del producto.',
      'Los criterios ESG entran en las decisiones de diseño, de adquisición y de selección de proveedores.',
      'Se reduce el riesgo regulatorio y reputacional a medio plazo.',
      'Se amplía la definición de interesado para incluir a comunidades afectadas y generaciones futuras.'
    ],
    enAccion: [
      'Incluir criterios ambientales, sociales y de gobernanza en la evaluación de alternativas de diseño.',
      'Evaluar el ciclo de vida completo del producto: fabricación, uso, mantenimiento y retiro.',
      'Considerar impactos en comunidades afectadas, condiciones laborales de la cadena de suministro y accesibilidad.',
      'Medir y reportar indicadores de sostenibilidad junto a los de costo y plazo.',
      'Preferir soluciones duraderas y mantenibles sobre atajos que trasladan el costo al futuro.',
      'Verificar el cumplimiento de estándares y marcos aplicables al sector.'
    ],
    dominios: ['gobernanza', 'alcance', 'finanzas', 'interesados', 'riesgos'],
    senales: {
      presente: [
        'Los criterios de selección de proveedores incluyen dimensiones ESG.',
        'Se evalúa el costo total de propiedad, no solo el de adquisición.',
        'Las comunidades afectadas figuran en el registro de interesados.'
      ],
      ausente: [
        'Se elige siempre la opción más barata a corto plazo.',
        'El impacto se descubre después de la entrega, vía reclamación o sanción.',
        'La sostenibilidad aparece solo en el informe anual de la empresa.'
      ]
    }
  },
  {
    id: 'pr-6', n: '3.6',
    titulo: 'Construir una Cultura de Empoderamiento',
    lema: 'Las personas rinden cuando tienen contexto, límites claros y seguridad para equivocarse.',
    enunciado: 'Crear un entorno colaborativo, seguro e inclusivo donde los equipos tengan autonomía dentro de límites explícitos, y donde los interesados participen de forma efectiva.',
    resumen: 'Integra el entorno colaborativo, el involucramiento efectivo de interesados y la adaptabilidad y resiliencia que en la 7.ª edición eran principios distintos.',
    impacto: [
      'Las decisiones se toman más cerca de donde está la información, lo que acelera el proyecto.',
      'La seguridad psicológica hace que los problemas emerjan pronto, cuando aún son baratos.',
      'La diversidad de perspectivas mejora la calidad de las soluciones y reduce puntos ciegos.',
      'La resiliencia del equipo aumenta: se recupera antes de los contratiempos.'
    ],
    enAccion: [
      'Definir explícitamente qué decide el equipo, qué decide el director y qué escala al patrocinador, con umbrales concretos.',
      'Dar contexto —el porqué— antes que instrucciones, para que el equipo pueda decidir bien sin consultar.',
      'Tratar los errores como información: analizar la causa sin buscar culpables.',
      'Facilitar la participación de perfiles diversos y de quienes no hablan por defecto en las reuniones.',
      'Involucrar a los interesados de forma continua, no solo en hitos de aprobación.',
      'Proteger la capacidad de recuperación: holgura razonable, rotación de conocimiento, documentación mínima suficiente.'
    ],
    dominios: ['recursos', 'interesados', 'gobernanza'],
    senales: {
      presente: [
        'El equipo toma decisiones técnicas sin pedir permiso.',
        'Los errores se comparten en retrospectiva sin consecuencias personales.',
        'Personas de distinto perfil intervienen en las decisiones.'
      ],
      ausente: [
        'Todo pasa por el director, que se convierte en cuello de botella.',
        'Los problemas se conocen cuando ya son irreversibles.',
        'Siempre hablan las mismas tres personas.'
      ]
    }
  }
];
