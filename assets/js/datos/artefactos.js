/* ═══════════════════════════════════════════════════════════
   artefactos.js — Los 42 artefactos de la 8.ª edición
   ───────────────────────────────────────────────────────────
   Cada artefacto es un documento que el proyecto produce. Lleva
   su PLANTILLA: los bloques que se rellenan al generarlo desde
   un proceso. Tipos de bloque:
     texto  · una línea
     campo  · párrafo
     lista  · un elemento por línea
     tabla  · filas con columnas fijas
   ═══════════════════════════════════════════════════════════ */

window.PMBOK = window.PMBOK || {};

PMBOK.artefactos = [

/* ══════════ GOBERNANZA ══════════ */
{
  id: 'art-acta-proyecto', nombre: 'Acta de Constitución del Proyecto', categoria: 'gobernanza',
  descripcion: 'Documento que autoriza formalmente la existencia del proyecto y otorga autoridad al director de proyecto.',
  plantilla: [
    { t: 'campo', et: 'Propósito y justificación', ay: 'Por qué existe el proyecto y qué problema medido resuelve.' },
    { t: 'lista', et: 'Objetivos medibles', ay: 'Uno por línea: verbo + magnitud + fecha.' },
    { t: 'lista', et: 'Criterios de éxito', ay: 'Cómo se sabrá que el proyecto tuvo éxito, con umbral numérico.' },
    { t: 'campo', et: 'Descripción de alto nivel y límites', ay: 'Qué incluye y qué queda fuera, a grandes rasgos.' },
    { t: 'tabla', et: 'Hitos principales', col: ['Hito', 'Fecha', 'Criterio de cumplimiento'] },
    { t: 'texto', et: 'Presupuesto preliminar', ay: 'Importe con moneda.' },
    { t: 'lista', et: 'Riesgos de alto nivel', ay: 'Los que podrían impedir la viabilidad.' },
    { t: 'campo', et: 'Autoridad del director del proyecto', ay: 'Hasta qué monto y qué holgura decide sin escalar.' },
    { t: 'texto', et: 'Patrocinador que aprueba', ay: 'Nombre y cargo de quien firma.' }
  ]
},
{
  id: 'art-caso-negocio', nombre: 'Caso de Negocio', categoria: 'gobernanza',
  descripcion: 'Análisis económico que justifica la inversión del proyecto.',
  plantilla: [
    { t: 'campo', et: 'Necesidad de negocio', ay: 'Situación actual con datos medidos.' },
    { t: 'tabla', et: 'Alternativas evaluadas', col: ['Alternativa', 'Costo', 'Beneficio', 'Recomendación'] },
    { t: 'campo', et: 'Beneficios esperados', ay: 'Cuantificados y en la misma unidad que el problema.' },
    { t: 'texto', et: 'Inversión estimada', ay: 'Importe con moneda.' },
    { t: 'texto', et: 'Periodo de recuperación / VAN / TIR' },
    { t: 'campo', et: 'Costo de no hacerlo', ay: 'Qué pasa si el proyecto no se ejecuta.' }
  ]
},
{
  id: 'art-plan-direccion', nombre: 'Plan para la Dirección del Proyecto', categoria: 'gobernanza',
  descripcion: 'Documento integrador que consolida todos los planes subsidiarios y líneas base.',
  plantilla: [
    { t: 'campo', et: 'Enfoque de desarrollo y ciclo de vida', ay: 'Predictivo, adaptativo o híbrido, con sus fases.' },
    { t: 'lista', et: 'Planes subsidiarios incorporados', ay: 'Uno por línea, con su versión.' },
    { t: 'lista', et: 'Líneas base aprobadas', ay: 'Alcance, cronograma y costos, con fecha de aprobación.' },
    { t: 'campo', et: 'Control integrado de cambios', ay: 'Quién solicita, quién evalúa, quién aprueba y en qué plazo.' },
    { t: 'tabla', et: 'Inconsistencias detectadas al integrar', col: ['Inconsistencia', 'Planes afectados', 'Resolución'] },
    { t: 'campo', et: 'Registro de adaptación (tailoring)', ay: 'Qué se ajustó respecto del estándar y por qué.' }
  ]
},
{
  id: 'art-acuerdos', nombre: 'Acuerdos (Contratos)', categoria: 'gobernanza',
  descripcion: 'Documentos contractuales con proveedores o clientes.',
  plantilla: [
    { t: 'texto', et: 'Contraparte' },
    { t: 'campo', et: 'Objeto del acuerdo' },
    { t: 'texto', et: 'Tipo de contrato', ay: 'Precio fijo, costo reembolsable, tiempo y materiales.' },
    { t: 'campo', et: 'Términos clave', ay: 'Plazos, penalizaciones, garantías, propiedad intelectual.' },
    { t: 'tabla', et: 'Hitos de pago', col: ['Hito', 'Monto', 'Condición'] },
    { t: 'texto', et: 'Administrador del contrato' }
  ]
},
{
  id: 'art-plan-beneficios', nombre: 'Plan de Gestión de Beneficios', categoria: 'gobernanza',
  descripcion: 'Cómo y cuándo se lograrán los beneficios del proyecto tras la entrega.',
  plantilla: [
    { t: 'tabla', et: 'Beneficios previstos', col: ['Beneficio', 'Métrica', 'Línea base', 'Meta', 'Fecha de medición'] },
    { t: 'texto', et: 'Responsable de la medición', ay: 'Normalmente no es el director del proyecto.' },
    { t: 'campo', et: 'Supuestos de realización', ay: 'Qué debe ocurrir tras el cierre para que el beneficio aparezca.' },
    { t: 'campo', et: 'Riesgos para la realización de beneficios' }
  ]
},
{
  id: 'art-plan-calidad', nombre: 'Plan de Gestión de la Calidad', categoria: 'gobernanza',
  descripcion: 'Estándares de calidad aplicables y cómo se cumplirán.',
  plantilla: [
    { t: 'lista', et: 'Estándares y normas aplicables' },
    { t: 'tabla', et: 'Métricas de calidad', col: ['Métrica', 'Umbral aceptable', 'Frecuencia', 'Responsable'] },
    { t: 'campo', et: 'Aseguramiento: auditorías del proceso', ay: 'Cuándo, quién y sobre qué procedimiento.' },
    { t: 'campo', et: 'Control: inspección de entregables', ay: 'Cómo se verifica cada entregable antes de presentarlo.' },
    { t: 'campo', et: 'Costo de la calidad', ay: 'Prevención y evaluación frente a fallos internos y externos.' }
  ]
},
{
  id: 'art-plan-abastecimiento', nombre: 'Plan Estratégico de Abastecimiento', categoria: 'gobernanza',
  descripcion: 'Estrategia de compra: qué comprar, a quién y con qué criterios.',
  plantilla: [
    { t: 'tabla', et: 'Decisiones hacer o comprar', col: ['Componente', 'Hacer / Comprar', 'Justificación'] },
    { t: 'tabla', et: 'Adquisiciones previstas', col: ['Qué se adquiere', 'Tipo de contrato', 'Importe estimado', 'Fecha'] },
    { t: 'tabla', et: 'Criterios de selección', col: ['Criterio', 'Peso %', 'Forma de evaluación'] },
    { t: 'campo', et: 'Gestión de proveedores', ay: 'Quién administra el contrato y cómo se mide el desempeño.' }
  ]
},
{
  id: 'art-informe-calidad', nombre: 'Informe de Calidad', categoria: 'gobernanza',
  descripcion: 'Resultado de las auditorías y el estado de la calidad del proyecto.',
  plantilla: [
    { t: 'texto', et: 'Periodo auditado' },
    { t: 'tabla', et: 'Hallazgos', col: ['Hallazgo', 'Severidad', 'Proceso afectado', 'Acción correctiva', 'Responsable'] },
    { t: 'campo', et: 'Estado general de la calidad' },
    { t: 'lista', et: 'Recomendaciones de mejora del proceso' }
  ]
},
{
  id: 'art-informe-rendimiento', nombre: 'Informe de Rendimiento del Trabajo', categoria: 'gobernanza',
  descripcion: 'Representación física o electrónica de la información del rendimiento recolectada.',
  plantilla: [
    { t: 'texto', et: 'Fecha de corte' },
    { t: 'tabla', et: 'Indicadores', col: ['Indicador', 'Valor', 'Umbral', 'Estado'] },
    { t: 'campo', et: 'Análisis de desviaciones', ay: 'Causa y efecto, no solo el número.' },
    { t: 'lista', et: 'Acciones propuestas' },
    { t: 'campo', et: 'Pronóstico', ay: 'EAC, ETC y fecha de fin prevista.' }
  ]
},
{
  id: 'art-registro-cambios', nombre: 'Registro de Cambios', categoria: 'gobernanza',
  descripcion: 'Log de todas las solicitudes de cambio y su estado de procesamiento.',
  plantilla: [
    { t: 'tabla', et: 'Solicitudes de cambio', col: ['ID', 'Descripción', 'Solicitante', 'Impacto', 'Decisión', 'Fecha'] }
  ]
},
{
  id: 'art-registro-incidencias', nombre: 'Registro de Incidencias (Issues)', categoria: 'gobernanza',
  descripcion: 'Log de problemas activos que requieren atención inmediata.',
  plantilla: [
    { t: 'tabla', et: 'Incidencias', col: ['ID', 'Descripción', 'Responsable', 'Prioridad', 'Estado', 'Fecha límite'] }
  ]
},
{
  id: 'art-registro-supuestos', nombre: 'Registro de Supuestos', categoria: 'gobernanza',
  descripcion: 'Bitácora de todas las suposiciones y restricciones que afectan al proyecto.',
  plantilla: [
    { t: 'tabla', et: 'Supuestos', col: ['Supuesto', 'Qué se rompe si falla', 'Responsable de confirmarlo', 'Estado'] },
    { t: 'tabla', et: 'Restricciones', col: ['Restricción', 'Origen', 'Efecto sobre el proyecto'] }
  ]
},
{
  id: 'art-lecciones', nombre: 'Registro de Lecciones Aprendidas', categoria: 'gobernanza',
  descripcion: 'Conocimiento adquirido durante el proyecto: qué funcionó, qué no y recomendaciones.',
  plantilla: [
    { t: 'tabla', et: 'Lecciones', col: ['Situación', 'Qué ocurrió', 'Causa', 'Recomendación', 'Dominio'] },
    { t: 'texto', et: 'Repositorio donde se consolidan' }
  ]
},
{
  id: 'art-informe-final', nombre: 'Informe Final del Proyecto', categoria: 'gobernanza',
  descripcion: 'Resumen final: objetivos, alcance, éxito, desviaciones y lecciones para la organización.',
  plantilla: [
    { t: 'campo', et: 'Resumen ejecutivo' },
    { t: 'tabla', et: 'Objetivos frente a resultados', col: ['Objetivo', 'Meta', 'Resultado', 'Cumplido'] },
    { t: 'campo', et: 'Desempeño de alcance, cronograma y costo', ay: 'Desviaciones finales y sus causas.' },
    { t: 'lista', et: 'Entregables aceptados' },
    { t: 'campo', et: 'Lecciones destacadas' },
    { t: 'campo', et: 'Transferencia y medición de beneficios pendiente' },
    { t: 'texto', et: 'Aprobación del cierre' }
  ]
},

/* ══════════ ALCANCE ══════════ */
{
  id: 'art-plan-alcance', nombre: 'Plan de Gestión del Alcance', categoria: 'alcance',
  descripcion: 'Define cómo se definirá, validará y controlará el alcance.',
  plantilla: [
    { t: 'campo', et: 'Cómo se elaborará la declaración del alcance' },
    { t: 'campo', et: 'Cómo se construirá y mantendrá la EDT' },
    { t: 'campo', et: 'Cómo se aceptarán formalmente los entregables', ay: 'Quién firma, en qué plazo y qué pasa si no responde.' },
    { t: 'campo', et: 'Cómo se controlarán los cambios de alcance' }
  ]
},
{
  id: 'art-plan-requisitos', nombre: 'Plan de Gestión de los Requisitos', categoria: 'alcance',
  descripcion: 'Define cómo se recopilarán, analizarán, documentarán y trazará los requisitos.',
  plantilla: [
    { t: 'campo', et: 'Técnicas de obtención', ay: 'Entrevistas, talleres, prototipos, observación.' },
    { t: 'campo', et: 'Estructura de priorización', ay: 'MoSCoW, obligatorio/deseable/opcional, valor frente a esfuerzo.' },
    { t: 'campo', et: 'Trazabilidad', ay: 'Cómo se vincula cada requisito con entregable y prueba.' },
    { t: 'campo', et: 'Gestión de la configuración', ay: 'Versionado y control de cambios de requisitos.' }
  ]
},
{
  id: 'art-documentacion-requisitos', nombre: 'Documentación de Requisitos', categoria: 'alcance',
  descripcion: 'Catálogo detallado de los requisitos del proyecto y del producto.',
  plantilla: [
    { t: 'tabla', et: 'Requisitos', col: ['ID', 'Requisito', 'Tipo', 'Origen', 'Prioridad', 'Criterio de aceptación'] },
    { t: 'lista', et: 'Requisitos no funcionales', ay: 'Rendimiento, seguridad, disponibilidad, usabilidad.' }
  ]
},
{
  id: 'art-matriz-trazabilidad', nombre: 'Matriz de Trazabilidad de Requisitos', categoria: 'alcance',
  descripcion: 'Tabla que vincula cada requisito con su origen y con los entregables que lo satisfacen.',
  plantilla: [
    { t: 'tabla', et: 'Trazabilidad', col: ['ID requisito', 'Origen', 'Objetivo de negocio', 'Entregable EDT', 'Caso de prueba', 'Estado'] }
  ]
},
{
  id: 'art-declaracion-alcance', nombre: 'Declaración del Alcance del Proyecto', categoria: 'alcance',
  descripcion: 'Descripción detallada del proyecto y del producto, incluyendo exclusiones y criterios de aceptación.',
  plantilla: [
    { t: 'campo', et: 'Descripción del alcance del producto' },
    { t: 'tabla', et: 'Entregables', col: ['Entregable', 'Criterio de aceptación medible', 'Quién acepta'] },
    { t: 'lista', et: 'Exclusiones explícitas', ay: 'Lo que alguien podría suponer incluido y no lo está.' },
    { t: 'lista', et: 'Supuestos' },
    { t: 'lista', et: 'Restricciones' }
  ]
},
{
  id: 'art-edt', nombre: 'Estructura de Desglose del Trabajo (EDT/WBS)', categoria: 'alcance',
  descripcion: 'Descomposición jerárquica orientada a entregables del alcance total del proyecto.',
  plantilla: [
    { t: 'lista', et: 'Descomposición', ay: 'Numeración jerárquica: 1, 1.1, 1.1.1 hasta paquetes de trabajo.' },
    { t: 'campo', et: 'Regla del 100 %', ay: 'Comprobación de que la suma de los hijos equivale al padre.' }
  ]
},
{
  id: 'art-diccionario-edt', nombre: 'Diccionario de la EDT', categoria: 'alcance',
  descripcion: 'Descripción detallada de cada paquete de trabajo de la EDT.',
  plantilla: [
    { t: 'tabla', et: 'Paquetes de trabajo', col: ['Código EDT', 'Descripción', 'Responsable', 'Duración', 'Costo', 'Criterio de aceptación'] }
  ]
},
{
  id: 'art-entregable', nombre: 'Entregable', categoria: 'alcance',
  descripcion: 'Producto o resultado único y verificable definido en la EDT o backlog.',
  plantilla: [
    { t: 'texto', et: 'Nombre del entregable' },
    { t: 'campo', et: 'Descripción' },
    { t: 'lista', et: 'Criterios de aceptación' },
    { t: 'texto', et: 'Estado', ay: 'En construcción, en revisión, aceptado, rechazado.' },
    { t: 'texto', et: 'Aceptado por / fecha' }
  ]
},
{
  id: 'art-backlog', nombre: 'Backlog del Producto', categoria: 'alcance',
  descripcion: 'Lista ordenada y priorizada de todo lo que el producto necesita (entornos ágiles).',
  plantilla: [
    { t: 'tabla', et: 'Historias', col: ['ID', 'Como… quiero… para…', 'Criterios de aceptación', 'Puntos', 'Prioridad'] },
    { t: 'campo', et: 'Criterio de ordenación', ay: 'Valor, riesgo, dependencia o coste de retraso.' }
  ]
},

/* ══════════ CRONOGRAMA ══════════ */
{
  id: 'art-plan-cronograma', nombre: 'Plan de Gestión del Cronograma', categoria: 'cronograma',
  descripcion: 'Define la metodología, herramientas y nivel de detalle para crear y controlar el cronograma.',
  plantilla: [
    { t: 'campo', et: 'Metodología y herramienta de programación' },
    { t: 'texto', et: 'Unidad de medida y nivel de detalle' },
    { t: 'campo', et: 'Umbrales de control', ay: 'Qué desviación dispara acción y a quién se escala.' },
    { t: 'campo', et: 'Reglas de medición del avance', ay: '0-100, 50-50, porcentaje físico completado.' }
  ]
},
{
  id: 'art-lista-actividades', nombre: 'Lista de Actividades', categoria: 'cronograma',
  descripcion: 'Lista de todas las actividades necesarias para ejecutar los paquetes de trabajo.',
  plantilla: [
    { t: 'tabla', et: 'Actividades', col: ['ID', 'Actividad', 'Paquete EDT', 'Duración', 'Predecesora', 'Responsable'] }
  ]
},
{
  id: 'art-lista-hitos', nombre: 'Lista de Hitos', categoria: 'cronograma',
  descripcion: 'Puntos significativos o eventos del proyecto (sin duración).',
  plantilla: [
    { t: 'tabla', et: 'Hitos', col: ['Hito', 'Fecha', 'Obligatorio / Opcional', 'Criterio de cumplimiento'] }
  ]
},
{
  id: 'art-cronograma', nombre: 'Cronograma del Proyecto', categoria: 'cronograma',
  descripcion: 'Modelo gráfico del cronograma con fechas de inicio y fin de cada actividad.',
  plantilla: [
    { t: 'texto', et: 'Fecha de inicio y fin del proyecto' },
    { t: 'tabla', et: 'Programación', col: ['Actividad', 'Inicio', 'Fin', 'Duración', 'Holgura', 'En ruta crítica'] },
    { t: 'campo', et: 'Ruta crítica', ay: 'Secuencia que determina la duración total.' },
    { t: 'campo', et: 'Compresión aplicada', ay: 'Intensificación o ejecución rápida y su costo.' }
  ]
},
{
  id: 'art-linea-base-cronograma', nombre: 'Línea Base del Cronograma', categoria: 'cronograma',
  descripcion: 'Versión aprobada del cronograma contra la que se medirán las desviaciones.',
  plantilla: [
    { t: 'texto', et: 'Versión y fecha de aprobación' },
    { t: 'texto', et: 'Aprobada por' },
    { t: 'tabla', et: 'Fechas comprometidas', col: ['Hito', 'Fecha línea base', 'Fecha real', 'Desviación'] }
  ]
},

/* ══════════ FINANZAS ══════════ */
{
  id: 'art-plan-financiero', nombre: 'Plan de Gestión Financiera', categoria: 'finanzas',
  descripcion: 'Define cómo se estimarán, presupuestarán y controlarán los costos del proyecto.',
  plantilla: [
    { t: 'campo', et: 'Métodos de estimación admitidos' },
    { t: 'texto', et: 'Unidad monetaria y nivel de precisión' },
    { t: 'campo', et: 'Umbrales de control de costos', ay: 'Qué CPI o desviación dispara acción.' },
    { t: 'campo', et: 'Reglas de uso de reservas', ay: 'Quién autoriza contingencia y quién gestión.' }
  ]
},
{
  id: 'art-estimaciones-costos', nombre: 'Estimaciones de Costos', categoria: 'finanzas',
  descripcion: 'Aproximación cuantitativa de los costos de los recursos necesarios.',
  plantilla: [
    { t: 'tabla', et: 'Estimaciones', col: ['Partida', 'Importe', 'Rango', 'Método', 'Confianza'] }
  ]
},
{
  id: 'art-base-estimaciones', nombre: 'Base de las Estimaciones', categoria: 'finanzas',
  descripcion: 'Documentación de cómo se elaboraron las estimaciones: método, supuestos y rango.',
  plantilla: [
    { t: 'campo', et: 'Método empleado', ay: 'Análoga, paramétrica, ascendente, tres valores.' },
    { t: 'lista', et: 'Supuestos de la estimación' },
    { t: 'texto', et: 'Rango de confianza', ay: 'Por ejemplo −10 % / +25 %.' },
    { t: 'campo', et: 'Fuentes de datos' }
  ]
},
{
  id: 'art-linea-base-costos', nombre: 'Línea Base de Costos', categoria: 'finanzas',
  descripcion: 'Presupuesto aprobado por período, contra el que se mide el desempeño del costo.',
  plantilla: [
    { t: 'texto', et: 'Costo base (sin reservas)' },
    { t: 'texto', et: 'Reserva de contingencia', ay: 'Riesgos conocidos. La usa el director.' },
    { t: 'texto', et: 'Reserva de gestión', ay: 'Riesgos desconocidos. La libera el patrocinador.' },
    { t: 'texto', et: 'Presupuesto total autorizado (BAC)' },
    { t: 'tabla', et: 'Curva S por periodo', col: ['Periodo', 'Costo planificado', 'Acumulado'] }
  ]
},
{
  id: 'art-requisitos-financiacion', nombre: 'Requisitos de Financiación del Proyecto', categoria: 'finanzas',
  descripcion: 'Necesidades de fondos del proyecto por período y fuente.',
  plantilla: [
    { t: 'tabla', et: 'Desembolsos', col: ['Periodo', 'Importe', 'Fuente', 'Condición'] },
    { t: 'campo', et: 'Riesgo de financiación', ay: 'Qué pasa si un desembolso llega tarde.' }
  ]
},

/* ══════════ INTERESADOS ══════════ */
{
  id: 'art-registro-interesados', nombre: 'Registro de Partes Interesadas', categoria: 'interesados',
  descripcion: 'Lista de todas las personas u organizaciones afectadas por el proyecto, con su información y clasificación.',
  plantilla: [
    { t: 'tabla', et: 'Interesados', col: ['Interesado', 'Rol', 'Interés', 'Poder 1-5', 'Influencia 1-5', 'Estrategia'] },
    { t: 'campo', et: 'Conclusiones del análisis', ay: 'Quién es crítico y quién puede bloquear.' }
  ]
},
{
  id: 'art-plan-interesados', nombre: 'Plan de Participación de las Partes Interesadas', categoria: 'interesados',
  descripcion: 'Estrategias para involucrar efectivamente a los interesados.',
  plantilla: [
    { t: 'tabla', et: 'Matriz de involucramiento', col: ['Interesado', 'Nivel actual', 'Nivel deseado', 'Acción', 'Cómo se mide'] },
    { t: 'campo', et: 'Reglas de relación', ay: 'Quién es el punto de contacto y con qué frecuencia.' }
  ]
},
{
  id: 'art-plan-comunicaciones', nombre: 'Plan de Gestión de las Comunicaciones', categoria: 'interesados',
  descripcion: 'Define qué se comunica, a quién, cuándo, cómo y por qué canal.',
  plantilla: [
    { t: 'tabla', et: 'Flujos de comunicación', col: ['Qué se comunica', 'A quién', 'Frecuencia', 'Canal', 'Responsable'] },
    { t: 'campo', et: 'Comunicación de malas noticias', ay: 'Plazo máximo y vía para informar una desviación.' },
    { t: 'texto', et: 'Número de canales', ay: 'n(n−1)/2 con el tamaño del grupo.' }
  ]
},

/* ══════════ RECURSOS ══════════ */
{
  id: 'art-plan-recursos', nombre: 'Plan de Gestión de los Recursos', categoria: 'recursos',
  descripcion: 'Define cómo se estimarán, adquirirán, desarrollarán y liberarán los recursos.',
  plantilla: [
    { t: 'tabla', et: 'Roles y responsabilidades', col: ['Rol', 'Responsabilidad', 'Autoridad', 'Competencia requerida'] },
    { t: 'campo', et: 'Adquisición de recursos', ay: 'Internos, contratados o mixtos, y de dónde salen.' },
    { t: 'campo', et: 'Desarrollo del equipo', ay: 'Formación prevista y reglas de trabajo.' },
    { t: 'campo', et: 'Liberación de recursos', ay: 'Cuándo y cómo vuelven a sus áreas.' }
  ]
},
{
  id: 'art-requerimientos-recursos', nombre: 'Requerimientos de Recursos', categoria: 'recursos',
  descripcion: 'Tipos y cantidades de recursos necesarios por paquete de trabajo.',
  plantilla: [
    { t: 'tabla', et: 'Recursos por paquete', col: ['Paquete EDT', 'Recurso', 'Tipo', 'Cantidad', 'Cuándo se necesita'] }
  ]
},
{
  id: 'art-acta-equipo', nombre: 'Acta de Constitución del Equipo (Team Charter)', categoria: 'recursos',
  descripcion: 'Acuerdo del equipo sobre valores, reglas de conducta y formas de trabajo.',
  plantilla: [
    { t: 'lista', et: 'Valores del equipo' },
    { t: 'lista', et: 'Acuerdos de trabajo', ay: 'Horarios de núcleo, canales, definición de terminado.' },
    { t: 'campo', et: 'Toma de decisiones y resolución de conflictos', ay: 'Quién decide y en qué plazo.' },
    { t: 'campo', et: 'Reuniones acordadas', ay: 'Cuáles, cuándo y con qué propósito.' }
  ]
},

/* ══════════ RIESGOS ══════════ */
{
  id: 'art-plan-riesgos', nombre: 'Plan de Gestión de los Riesgos', categoria: 'riesgos',
  descripcion: 'Define cómo se organizarán y ejecutarán las actividades de gestión de riesgos.',
  plantilla: [
    { t: 'campo', et: 'Metodología y roles' },
    { t: 'tabla', et: 'Escalas de probabilidad e impacto', col: ['Nivel', 'Probabilidad', 'Impacto en costo', 'Impacto en plazo'] },
    { t: 'campo', et: 'Apetito de riesgo y umbrales de escalamiento', ay: 'Cuándo deja de gestionarse dentro del proyecto.' },
    { t: 'texto', et: 'Frecuencia de revisión del registro' }
  ]
},
{
  id: 'art-registro-riesgos', nombre: 'Registro de Riesgos', categoria: 'riesgos',
  descripcion: 'Catálogo vivo de riesgos identificados con su análisis y respuestas.',
  plantilla: [
    { t: 'tabla', et: 'Riesgos', col: ['ID', 'Riesgo (causa → evento → efecto)', 'P 1-5', 'I 1-5', 'Estrategia', 'Respuesta', 'Responsable'] },
    { t: 'tabla', et: 'Oportunidades', col: ['ID', 'Oportunidad', 'P 1-5', 'I 1-5', 'Estrategia', 'Responsable'] }
  ]
},
{
  id: 'art-informe-riesgos', nombre: 'Informe de Riesgos', categoria: 'riesgos',
  descripcion: 'Presentación estructurada de la exposición general a los riesgos del proyecto.',
  plantilla: [
    { t: 'campo', et: 'Exposición global', ay: 'Riesgo general del proyecto, no solo la suma de riesgos.' },
    { t: 'tabla', et: 'Riesgos principales', col: ['Riesgo', 'P × I', 'Tendencia', 'Estado de la respuesta'] },
    { t: 'texto', et: 'Reserva de contingencia consumida' },
    { t: 'lista', et: 'Riesgos emergentes del periodo' }
  ]
}

];

/* ── Índice por categoría, para los filtros ─────────────── */
PMBOK.categoriasArtefacto = [
  { id: 'gobernanza', nombre: 'Gobernanza' },
  { id: 'alcance', nombre: 'Alcance' },
  { id: 'cronograma', nombre: 'Cronograma' },
  { id: 'finanzas', nombre: 'Finanzas' },
  { id: 'interesados', nombre: 'Interesados' },
  { id: 'recursos', nombre: 'Recursos' },
  { id: 'riesgos', nombre: 'Riesgos' }
];
