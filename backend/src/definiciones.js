/* ═══════════════════════════════════════════════════════════
   definiciones.js — Tablas, campos y validación de cada recurso
   ═══════════════════════════════════════════════════════════ */

'use strict';

const v = require('./validacion');
const { z } = v;

const MARCAS = [['creado', 'creado'], ['actualizado', 'actualizado']];

/* crear: los requeridos obligatorios y el resto opcional; id y creado
   pueden llegar para que «Deshacer» recree el registro tal como era.
   actualizar: todo opcional, nunca id ni claves del padre. */
const creado = z.number().int().positive().optional();

function esquemas(forma, requeridos) {
  const base = z.object(forma).partial();
  const marca = {};
  (requeridos || []).forEach((k) => { marca[k] = true; });
  return {
    crear: base.extend({ id: v.id.optional(), creado }).required(marca),
    actualizar: base
  };
}

/* ══════════════ Enumeraciones ══════════════ */

const E = {
  roles: ['admin', 'director', 'miembro', 'ejecutor'],
  nivelesPermiso: ['ver', 'editar', 'dirigir'],
  ambitos: ['portafolio', 'programa', 'proyecto'],
  metodologias: ['predictivo', 'agil', 'hibrido', 'kanban'],
  estadosProyecto: ['activo', 'pausa', 'cerrado', 'cancelado'],
  bandas: ['inicio', 'planificacion', 'ejecucion', 'monitoreo', 'cierre'],
  estadosProceso: ['pendiente', 'iniciado', 'completado', 'omitido'],
  estadosDocumento: ['borrador', 'revision', 'aprobado'],
  rolesMiembro: ['lider', 'po', 'sm', 'equipo', 'ejecutor', 'observador'],
  /* Un código de invitación nunca da el rol de líder */
  rolesInvitacion: ['po', 'sm', 'equipo', 'ejecutor', 'observador'],
  estrategiasRiesgo: ['', 'mitigar', 'evitar', 'transferir', 'aceptar', 'escalar', 'explotar', 'mejorar', 'compartir'],
  decisiones: ['pendiente', 'aprobado', 'rechazado', 'diferido'],
  estadosTarea: ['backlog', 'pendiente', 'curso', 'revision', 'hecho'],
  estadosSprint: ['planificado', 'activo', 'cerrado'],
  estadosRoca: ['encamino', 'riesgo', 'fuera', 'lograda'],
  direcciones: ['mayor', 'menor']
};

const NIVELES = { ver: 1, editar: 2, dirigir: 3 };

/* ══════════════ Usuarios, permisos, portafolios ══════════════ */

const usuarios = {
  tabla: 'usuarios',
  campos: [['id', 'id'], ['nombre', 'nombre'], ['correo', 'correo'], ['rol', 'rol'], ['activo', 'activo'],
    ['debeCambiarClave', 'debe_cambiar_clave'], ['origen', 'origen'], ...MARCAS],
  orden: 't.nombre, t.creado'
};

const correo = z.string().trim().toLowerCase().max(200)
  .regex(/^[^@\s]+@[^@\s]+$/, 'Debe ser un correo válido');
const clave = z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.').max(200);

usuarios.esquemas = {
  crear: z.object({
    id: v.id.optional(),
    nombre: v.texto(200).optional(),
    correo: correo,
    clave: clave,
    rol: z.enum(E.roles).optional()
  }),
  actualizar: z.object({
    nombre: v.textoRequerido(200), correo: correo, rol: z.enum(E.roles), activo: v.booleano,
    debeCambiarClave: v.booleano
  }).partial()
};

const permisos = {
  tabla: 'permisos',
  campos: [['id', 'id'], ['usuarioId', 'usuario_id'], ['ambito', 'ambito'], ['refId', 'ref_id'], ['nivel', 'nivel'], ...MARCAS],
  esquemas: {
    crear: z.object({
      id: v.id.optional(),
      usuarioId: v.id, ambito: z.enum(E.ambitos), refId: v.id, nivel: z.enum(E.nivelesPermiso)
    })
  }
};

const portafolios = {
  tabla: 'portafolios',
  campos: [['id', 'id'], ['nombre', 'nombre'], ['descripcion', 'descripcion'], ...MARCAS],
  orden: 't.nombre',
  esquemas: esquemas({ nombre: v.textoRequerido(200), descripcion: v.texto(5000) }, ['nombre'])
};

const programas = {
  tabla: 'programas',
  campos: [['id', 'id'], ['portafolioId', 'portafolio_id'], ['nombre', 'nombre'], ['descripcion', 'descripcion'], ...MARCAS],
  orden: 't.nombre',
  esquemas: esquemas({ nombre: v.textoRequerido(200), descripcion: v.texto(5000) }, ['nombre'])
};

/* ══════════════ Proyectos ══════════════ */

const hito = z.object({
  id: v.id.optional(),
  nombre: v.textoRequerido(300),
  fecha: v.fechaNula.optional(),
  critico: v.booleano.optional()
});
const fase = z.object({ id: v.id.optional(), nombre: v.textoRequerido(200), orden: v.entero.optional() });

const proyectos = {
  tabla: 'proyectos',
  campos: [
    ['id', 'id'], ['nombre', 'nombre'], ['descripcion', 'descripcion'], ['metodologia', 'metodologia'],
    ['portafolioId', 'portafolio_id'], ['programaId', 'programa_id'], ['rocaId', 'roca_id'],
    ['inicio', 'inicio'], ['fin', 'fin'], ['presupuesto', 'presupuesto'], ['moneda', 'moneda'],
    ['estado', 'estado'], ['directorId', 'director_id'], ['wip', 'wip'],
    ['fases', 'fases'], ['orden', 'orden'], ['hitos', 'hitos'], ['dod', 'dod'], ['calidad', 'calidad'],
    ...MARCAS
  ],
  json: ['fases', 'orden', 'hitos', 'dod', 'calidad'],
  orden: 't.creado'
};

const formaProyecto = {
  nombre: v.textoRequerido(200),
  descripcion: v.texto(10000),
  metodologia: z.enum(E.metodologias),
  portafolioId: v.idNulo,
  programaId: v.idNulo,
  rocaId: v.idNulo,
  inicio: v.fechaNula,
  fin: v.fechaNula,
  presupuesto: z.preprocess((x) => (x === '' ? null : x), v.numeroNulo.refine((n) => n === null || n >= 0, 'No puede ser negativo')),
  moneda: z.string().trim().regex(/^[A-Za-z]{3}$/, 'Código de moneda de 3 letras').transform((s) => s.toUpperCase()),
  wip: v.entero.refine((n) => n >= 1, 'Debe ser al menos 1')
};

proyectos.esquemas = {
  /* La interfaz genera el id para poder abrir el proyecto sin esperar */
  crear: z.object(formaProyecto).partial().extend({ id: v.id.optional(), creado }).required({ nombre: true }),
  actualizar: z.object({
    ...formaProyecto,
    estado: z.enum(E.estadosProyecto),
    directorId: v.idNulo,
    fases: z.array(fase).max(50),
    orden: z.record(z.string(), z.enum(E.bandas)),
    hitos: z.array(hito).max(500),
    dod: z.array(v.texto(500)).max(100).nullable(),
    calidad: z.record(z.string(), z.any()).nullable()
  }).partial()
};

/* Campos que un editor puede tocar; el resto de la configuración exige dirigir */
proyectos.camposDeEdicion = ['hitos', 'dod', 'calidad', 'orden'];

/* ══════════════ Recursos dentro de un proyecto ══════════════ */

const DE_PROYECTO = [['id', 'id'], ['proyectoId', 'proyecto_id']];

const miembros = {
  tabla: 'miembros',
  campos: [...DE_PROYECTO, ['usuarioId', 'usuario_id'], ['rol', 'rol'], ...MARCAS],
  esquemas: {
    crear: z.object({ id: v.id.optional(), usuarioId: v.id, rol: z.enum(E.rolesMiembro).optional() }),
    actualizar: z.object({ rol: z.enum(E.rolesMiembro) }).partial()
  },
  nivelEscritura: 'dirigir'
};

const riesgos = {
  tabla: 'riesgos',
  campos: [...DE_PROYECTO, ['titulo', 'titulo'], ['p', 'p'], ['i', 'i'], ['estrategia', 'estrategia'],
    ['respuesta', 'respuesta'], ['responsableId', 'responsable_id'], ['estado', 'estado'], ...MARCAS],
  esquemas: esquemas({
    titulo: v.textoRequerido(1000), p: v.escala15, i: v.escala15,
    estrategia: z.enum(E.estrategiasRiesgo), respuesta: v.texto(5000),
    responsableId: v.idNulo, estado: v.textoRequerido(40)
  }, ['titulo'])
};

const interesados = {
  tabla: 'interesados',
  campos: [...DE_PROYECTO, ['nombre', 'nombre'], ['rol', 'rol'], ['poder', 'poder'], ['influencia', 'influencia'],
    ['actual', 'actual'], ['deseado', 'deseado'], ['estrategia', 'estrategia'], ...MARCAS],
  esquemas: esquemas({
    nombre: v.textoRequerido(300), rol: v.texto(300), poder: v.escala15, influencia: v.escala15,
    actual: v.texto(100), deseado: v.texto(100), estrategia: v.texto(5000)
  }, ['nombre'])
};

const cambios = {
  tabla: 'cambios',
  campos: [...DE_PROYECTO, ['titulo', 'titulo'], ['descripcion', 'descripcion'], ['solicitante', 'solicitante'],
    ['impacto', 'impacto'], ['decision', 'decision'], ...MARCAS],
  esquemas: esquemas({
    titulo: v.textoRequerido(500), descripcion: v.texto(10000), solicitante: v.texto(300),
    impacto: v.texto(5000), decision: z.enum(E.decisiones)
  }, ['titulo'])
};

const lecciones = {
  tabla: 'lecciones',
  campos: [...DE_PROYECTO, ['situacion', 'situacion'], ['causa', 'causa'], ['recomendacion', 'recomendacion'],
    ['dominio', 'dominio'], ...MARCAS],
  esquemas: esquemas({
    situacion: v.textoRequerido(5000), causa: v.texto(5000), recomendacion: v.texto(5000), dominio: v.texto(80)
  }, ['situacion'])
};

const sprints = {
  tabla: 'sprints',
  campos: [...DE_PROYECTO, ['nombre', 'nombre'], ['objetivo', 'objetivo'], ['dias', 'dias'], ['estado', 'estado'],
    ['comprometido', 'comprometido'], ['entregado', 'entregado'], ['inicio', 'inicio'], ['fin', 'fin'],
    ['cierre', 'cierre'], ['historial', 'historial'], ...MARCAS],
  soloLectura: ['historial', 'cierre', 'entregado'],
  seleccion: `COALESCE((SELECT jsonb_object_agg(b.fecha::text,
                 jsonb_build_object('restante', b.restante, 'comprometido', b.comprometido))
               FROM sprint_burndown b WHERE b.sprint_id = t.id), '{}'::jsonb) AS historial`,
  esquemas: esquemas({
    nombre: v.textoRequerido(200), objetivo: v.texto(2000),
    dias: v.entero.refine((n) => n >= 1 && n <= 365, 'Entre 1 y 365 días'),
    /* Cerrar un sprint tiene reglas propias: POST /api/sprints/:id/cerrar */
    estado: z.enum(['planificado', 'activo']),
    comprometido: v.numero, inicio: v.fechaNula, fin: v.fechaNula
  }, ['nombre'])
};

const tareas = {
  tabla: 'tareas',
  campos: [...DE_PROYECTO, ['sprintId', 'sprint_id'], ['titulo', 'titulo'], ['puntos', 'puntos'],
    ['fechaLimite', 'fecha_limite'], ['responsableId', 'responsable_id'], ['criterios', 'criterios'],
    ['estado', 'estado'], ['prioridad', 'prioridad'], ...MARCAS],
  orden: 't.prioridad NULLS LAST, t.creado',
  esquemas: esquemas({
    titulo: v.textoRequerido(500),
    puntos: v.numeroNulo.refine((n) => n === null || n >= 0, 'No puede ser negativo'),
    fechaLimite: v.fechaNula, responsableId: v.idNulo, criterios: v.texto(5000),
    estado: z.enum(E.estadosTarea), sprintId: v.idNulo,
    prioridad: z.preprocess((x) => (x === '' ? null : x), v.entero.nullable())
  }, ['titulo'])
};

const mediciones = {
  tabla: 'mediciones',
  campos: [...DE_PROYECTO, ['fecha', 'fecha'], ['pv', 'pv'], ['ev', 'ev'], ['ac', 'ac'], ['nota', 'nota'], ...MARCAS],
  orden: 't.fecha, t.creado',
  esquemas: (function () {
    const noNegativo = v.numero.refine((n) => n >= 0, 'No puede ser negativo');
    /* Sin fecha, la BD pone la de hoy */
    const fechaOpcional = z.preprocess((x) => (x === '' || x === null ? undefined : x), v.fecha.optional());
    return esquemas({ fecha: fechaOpcional, pv: noNegativo, ev: noNegativo, ac: noNegativo, nota: v.texto(2000) }, []);
  })()
};

const comentarios = {
  tabla: 'comentarios',
  campos: [...DE_PROYECTO, ['autorId', 'autor_id'], ['refTipo', 'ref_tipo'], ['refId', 'ref_id'], ['texto', 'texto'], ...MARCAS],
  esquemas: esquemas({ texto: v.textoRequerido(10000), refTipo: v.texto(40), refId: v.idNulo }, ['texto']),
  nivelEscritura: 'ver'
};

const procesosProyecto = {
  tabla: 'proyecto_procesos',
  campos: [...DE_PROYECTO, ['procesoId', 'proceso_id'], ['estado', 'estado'], ['notas', 'notas'], ['fecha', 'fecha'], ...MARCAS]
};

const documentos = {
  tabla: 'documentos',
  campos: [...DE_PROYECTO, ['artefactoId', 'artefacto_id'], ['nombre', 'nombre'], ['categoria', 'categoria'],
    ['version', 'version'], ['estado', 'estado'], ['procesoId', 'proceso_id'], ['contenido', 'contenido'],
    ['autorId', 'autor_id'], ['aprobado', 'aprobado'], ...MARCAS],
  json: ['contenido'],
  orden: 'COALESCE(t.actualizado, t.creado) DESC'
};

const archivos = {
  tabla: 'archivos',
  campos: [...DE_PROYECTO, ['nombre', 'nombre'], ['tipo', 'tipo'], ['tamano', 'tamano'], ['categoria', 'categoria'],
    ['autorId', 'autor_id'], ['almacen', 'almacen'], ...MARCAS],
  orden: 't.creado DESC'
};

/* Códigos con los que un compañero entra al equipo de un proyecto.
   Solo los ve y los gestiona quien dirige el proyecto. */
const RE_CODIGO = /^[A-HJ-NP-Z2-9]{8}$/;
/* Acepta «abcd-2345» o «ABCD 2345»: se quitan separadores y se pasa a mayúsculas */
const codigoInvitacion = z.string().max(40)
  .transform((s) => s.toUpperCase().replace(/[^A-Z0-9]/g, ''))
  .refine((s) => RE_CODIGO.test(s), 'El código tiene 8 letras y números, por ejemplo ABCD-2345');

const invitaciones = {
  tabla: 'invitaciones',
  campos: [...DE_PROYECTO, ['codigo', 'codigo'], ['rol', 'rol'], ['expira', 'expira'], ['usos', 'usos'],
    ['creadoPor', 'creado_por'], ...MARCAS],
  orden: 't.creado DESC',
  esquemas: {
    crear: z.object({
      id: v.id.optional(),
      codigo: codigoInvitacion.optional(),
      rol: z.enum(E.rolesInvitacion).optional(),
      /* Días de validez; sin ellos, el código no caduca */
      dias: z.preprocess((x) => (x === '' ? null : x),
        v.entero.refine((n) => n >= 1 && n <= 365, 'Entre 1 y 365 días').nullable()).optional(),
      creado
    })
  }
};

/* ══════════════ EOS ══════════════ */

const rocas = {
  tabla: 'rocas',
  campos: [['id', 'id'], ['trimestre', 'trimestre'], ['titulo', 'titulo'], ['descripcion', 'descripcion'],
    ['responsableId', 'responsable_id'], ['estado', 'estado'], ['metas', 'metas'], ...MARCAS],
  json: ['metas'],
  esquemas: esquemas({
    trimestre: z.string().regex(/^Q[1-4]-\d{4}$/, 'Formato Q1-2026'),
    titulo: v.textoRequerido(500), descripcion: v.texto(5000), responsableId: v.idNulo,
    estado: z.enum(E.estadosRoca),
    metas: z.array(z.object({ texto: v.textoRequerido(500), hecho: v.booleano.optional() })).max(50)
  }, ['trimestre', 'titulo'])
};

const metricas = {
  tabla: 'metricas',
  campos: [['id', 'id'], ['nombre', 'nombre'], ['meta', 'meta'], ['responsableId', 'responsable_id'],
    ['direccion', 'direccion'], ['valores', 'valores'], ...MARCAS],
  soloLectura: ['valores'],
  seleccion: `COALESCE((SELECT jsonb_object_agg(mv.semana, mv.valor)
               FROM metrica_valores mv WHERE mv.metrica_id = t.id), '{}'::jsonb) AS valores`,
  esquemas: (function () {
    const valores = z.record(z.string().min(1).max(20), z.union([z.string().max(50), z.number()]));
    const base = esquemas({
      nombre: v.textoRequerido(300), meta: v.texto(100), responsableId: v.idNulo,
      direccion: z.enum(E.direcciones)
    }, ['nombre']);
    return { crear: base.crear.extend({ valores: valores.optional() }), actualizar: base.actualizar.extend({ valores: valores.optional() }) };
  })()
};

const asientos = {
  tabla: 'asientos',
  campos: [['id', 'id'], ['nombre', 'nombre'], ['gwt', 'gwt'], ['personaId', 'persona_id'], ['padreId', 'padre_id'], ...MARCAS],
  esquemas: esquemas({
    nombre: v.textoRequerido(200), gwt: v.texto(5000), personaId: v.idNulo, padreId: v.idNulo
  }, ['nombre'])
};

module.exports = {
  E, NIVELES, correo, clave, codigoInvitacion,
  usuarios, permisos, portafolios, programas, proyectos,
  miembros, riesgos, interesados, cambios, lecciones, sprints, tareas, mediciones, comentarios,
  procesosProyecto, documentos, archivos, invitaciones, rocas, metricas, asientos
};
