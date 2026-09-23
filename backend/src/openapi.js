/* ═══════════════════════════════════════════════════════════
   openapi.js — Documento OpenAPI 3.1 de la API
   ───────────────────────────────────────────────────────────
   Los cuerpos de las peticiones NO se escriben a mano: salen de
   los mismos esquemas zod de «definiciones.js» que valida la API
   (z.toJSONSchema), así que la documentación no se queda atrás
   cuando cambia una validación. Aquí solo se declaran las rutas,
   los permisos que exigen y las respuestas.

   Lo sirve «rutas/docs.js»: el JSON en /api/openapi.json y la
   página de Scalar en /api/docs.
   ═══════════════════════════════════════════════════════════ */

'use strict';

const paquete = require('../package.json');
const D = require('./definiciones');
const { z } = require('./validacion');

/* ══════════════ Esquemas a partir de los zod ══════════════ */

/* io: 'input' describe lo que se acepta, no lo que queda guardado.
   unrepresentable: 'any' deja en «cualquier valor» los campos con
   conversiones propias («» → null, texto → número) en vez de fallar. */
function aEsquema(esquemaZod) {
  const j = z.toJSONSchema(esquemaZod, { io: 'input', unrepresentable: 'any' });
  delete j.$schema;
  return j;
}

const ID = { type: 'string', pattern: '^[A-Za-z0-9_.:-]{1,100}$', examples: ['r-7f3a91'] };
const MS = { type: 'integer', description: 'Milisegundos desde 1970' };

/* Campos que pone la base y devuelve siempre la API */
const SALIDA_FIJA = {
  id: ID,
  proyectoId: ID,
  creado: MS,
  actualizado: { type: ['integer', 'null'], description: 'Milisegundos desde 1970' }
};

/* Lo que la API calcula al responder y no existe en ningún esquema de entrada */
const SALIDA_EXTRA = {
  Proyecto: {
    nivel: { type: 'integer', enum: [1, 2, 3], description: 'Nivel de quien pregunta: 1 ver, 2 editar, 3 dirigir' },
    progreso: { type: 'object', description: 'Procesos por banda y cuántos van completados' },
    siguiente: { description: 'Siguiente proceso sugerido del ciclo de vida, o null' }
  },
  Riesgo: { severidad: { type: 'integer', description: 'p × i, calculado por la API' } },
  Sprint: {
    historial: { type: 'object', description: 'Burndown: fecha AAAA-MM-DD → { restante, comprometido }' },
    cierre: { type: ['integer', 'null'], description: 'Milisegundos del cierre' },
    entregado: { type: ['number', 'null'], description: 'Puntos entregados al cerrar' }
  },
  Metrica: { valores: { type: 'object', description: 'Semana → valor del scorecard' } },
  Documento: {
    contenido: { type: 'object', description: 'Índice del bloque de la plantilla → valor' },
    aprobado: { type: ['integer', 'null'], description: 'Milisegundos de la aprobación' }
  },
  Roca: { metas: { type: 'array', items: { type: 'object' }, description: 'Metas de la roca' } },
  Invitacion: {
    codigo: { type: 'string', description: 'Ocho letras y dígitos sin ambigüedades, por ejemplo ABCD2345' },
    expira: { type: ['integer', 'null'], description: 'Milisegundos de la caducidad, o null si no caduca' },
    usos: { type: 'integer', description: 'Cuántas personas han entrado con el código' }
  }
};

/* Una propiedad por cada campo de la definición: su forma sale del esquema
   de creación cuando ese campo se puede escribir, y de las tablas de arriba
   cuando lo pone la base o lo calcula la API. */
function esquemaSalida(nombre, def) {
  const entrada = def.esquemas ? (aEsquema(def.esquemas.crear).properties || {}) : {};
  const extra = SALIDA_EXTRA[nombre] || {};
  const propiedades = {};
  def.campos.forEach(([campo]) => {
    propiedades[campo] = SALIDA_FIJA[campo] || extra[campo] || entrada[campo] || {};
  });
  return { type: 'object', properties: { ...propiedades, ...extra } };
}

/* Colecciones con definición: [nombre del esquema, definición] */
const COLECCIONES = [
  ['Usuario', D.usuarios], ['Permiso', D.permisos], ['Portafolio', D.portafolios], ['Programa', D.programas],
  ['Proyecto', D.proyectos], ['Miembro', D.miembros], ['Riesgo', D.riesgos], ['Interesado', D.interesados],
  ['Cambio', D.cambios], ['Leccion', D.lecciones], ['Sprint', D.sprints], ['Tarea', D.tareas],
  ['Medicion', D.mediciones], ['Comentario', D.comentarios], ['ProcesoDeProyecto', D.procesosProyecto],
  ['Documento', D.documentos], ['Archivo', D.archivos], ['Invitacion', D.invitaciones],
  ['Roca', D.rocas], ['Metrica', D.metricas], ['Asiento', D.asientos]
];

function esquemas() {
  const s = {
    Id: ID,
    Error: {
      type: 'object',
      description: 'Forma de cualquier respuesta de error de la API',
      properties: {
        error: { type: 'string', description: 'Mensaje legible, listo para mostrar' },
        codigo: { type: 'string', description: 'Clave estable para tratarlo en el código', examples: ['NO_ENCONTRADO'] },
        detalles: {
          type: 'array',
          description: 'Solo en los 400 de validación: un elemento por campo rechazado',
          items: { type: 'object', properties: { campo: { type: 'string' }, mensaje: { type: 'string' } } }
        }
      },
      required: ['error', 'codigo']
    }
  };
  COLECCIONES.forEach(([nombre, def]) => {
    s[nombre] = esquemaSalida(nombre, def);
    if (def.esquemas && def.esquemas.crear) s[nombre + 'Crear'] = aEsquema(def.esquemas.crear);
    if (def.esquemas && def.esquemas.actualizar) s[nombre + 'Actualizar'] = aEsquema(def.esquemas.actualizar);
  });
  return s;
}

/* ══════════════ Piezas de las operaciones ══════════════ */

const ref = (nombre) => ({ $ref: '#/components/schemas/' + nombre });
const lista = (nombre) => ({ type: 'array', items: ref(nombre) });

const RESPUESTA_ERROR = {
  400: 'Invalida', 401: 'SinSesion', 403: 'SinPermiso', 404: 'NoEncontrado',
  409: 'Conflicto', 410: 'Caducado', 413: 'DemasiadoGrande', 429: 'DemasiadosIntentos'
};

const TEXTO_ERROR = {
  Invalida: 'Datos no válidos: el cuerpo no pasó la validación',
  SinSesion: 'Falta la cabecera Authorization, el token no vale o la contraseña está pendiente de cambio',
  SinPermiso: 'La sesión no tiene el rol o el nivel que exige la ruta',
  NoEncontrado: 'No existe el recurso; también cuando el proyecto existe pero no se tiene acceso',
  Conflicto: 'Choca con algo que ya existe o con una regla de la base',
  Caducado: 'El código de invitación caducó',
  DemasiadoGrande: 'El cuerpo o el archivo pasa del límite',
  DemasiadosIntentos: 'Se agotaron los intentos permitidos: hay que esperar unos minutos'
};

function respuestasError() {
  const r = {};
  Object.entries(TEXTO_ERROR).forEach(([nombre, descripcion]) => {
    r[nombre] = { description: descripcion, content: { 'application/json': { schema: ref('Error') } } };
  });
  return r;
}

const param = (nombre, descripcion) => ({
  name: nombre, in: 'path', required: true, description: descripcion, schema: ref('Id')
});
const filtro = (nombre, descripcion, esquema) => ({
  name: nombre, in: 'query', required: false, description: descripcion, schema: esquema || ref('Id')
});

const P_PROYECTO = param('proyectoId', 'Proyecto dueño de la colección');
const P_ID = param('id', 'Identificador del registro');

/* op('Etiqueta', 'resumen', { ... })
     nivel       qué permiso exige; se añade al final de la descripción
     parametros  de ruta o de consulta
     cuerpo      esquema del cuerpo JSON
     multipart   esquema del cuerpo de formulario
     ok          [código, descripción, esquema] de la respuesta buena
     mas         respuestas buenas adicionales, con la misma forma
     errores     códigos de error, además del 401 de toda ruta con sesión
     publica     sin sesión: ni Authorization ni 401 */
function op(etiqueta, resumen, opciones = {}) {
  const o = { tags: [etiqueta], summary: resumen, responses: {} };
  const descripcion = [opciones.descripcion, opciones.nivel && 'Exige ' + opciones.nivel + '.']
    .filter(Boolean).join(' ');
  if (descripcion) o.description = descripcion;
  if (opciones.parametros) o.parameters = opciones.parametros;
  if (opciones.cuerpo) {
    o.requestBody = { required: true, content: { 'application/json': { schema: opciones.cuerpo } } };
  }
  if (opciones.multipart) {
    o.requestBody = { required: true, content: { 'multipart/form-data': { schema: opciones.multipart } } };
  }
  if (opciones.publica) o.security = [];

  [opciones.ok, ...(opciones.mas || [])].filter(Boolean).forEach(([estado, texto, esquema]) => {
    o.responses[estado] = { description: texto };
    if (esquema) o.responses[estado].content = { 'application/json': { schema: esquema } };
  });
  const errores = [...(opciones.publica ? [] : [401]), ...(opciones.errores || [])];
  [...new Set(errores)].sort().forEach((codigo) => {
    o.responses[codigo] = { $ref: '#/components/responses/' + RESPUESTA_ERROR[codigo] };
  });
  return o;
}

const rutas = {};
function ruta(camino, operaciones) {
  rutas[camino] = { ...(rutas[camino] || {}), ...operaciones };
}

/* ══════════════ Fábricas: las mismas de rutas/recursos.js ══════════════ */

/* recursoDeProyecto(): la colección cuelga del proyecto y cada registro se
   toca por su identificador. Las rutas planas /<colección>/{id} existen
   también anidadas bajo /proyectos/{proyectoId}/: son la misma operación. */
function rutasDeProyecto(coleccion, nombre, etiqueta, opciones = {}) {
  const def = D[coleccion];
  const escritura = opciones.escritura || 'nivel «editar» en el proyecto';
  const singular = opciones.singular || nombre.toLowerCase();

  ruta('/proyectos/{proyectoId}/' + coleccion, {
    get: op(etiqueta, 'Listar ' + coleccion + ' del proyecto', {
      parametros: [P_PROYECTO], nivel: 'nivel «ver» en el proyecto',
      ok: [200, 'Registros del proyecto', lista(nombre)], errores: [404]
    }),
    post: op(etiqueta, 'Crear ' + singular, {
      descripcion: opciones.descripcionCrear,
      parametros: [P_PROYECTO], nivel: escritura,
      cuerpo: ref(nombre + 'Crear'),
      ok: [201, 'Creado', ref(nombre)], errores: [400, 403, 404, 409]
    })
  });

  const item = {
    get: op(etiqueta, 'Ver un ' + singular, {
      descripcion: 'Vale también como /proyectos/{proyectoId}/' + coleccion + '/{id}.',
      parametros: [P_ID], nivel: 'nivel «ver» en el proyecto del registro',
      ok: [200, 'El registro', ref(nombre)], errores: [403, 404]
    }),
    delete: op(etiqueta, 'Borrar un ' + singular, {
      parametros: [P_ID], nivel: escritura,
      ok: [204, 'Borrado'], errores: [403, 404]
    })
  };
  if (def && def.esquemas && def.esquemas.actualizar) {
    item.patch = op(etiqueta, 'Cambiar un ' + singular, {
      descripcion: 'Solo se toca lo que llega en el cuerpo.',
      parametros: [P_ID], nivel: escritura,
      cuerpo: ref(nombre + 'Actualizar'),
      ok: [200, 'El registro ya cambiado', ref(nombre)], errores: [400, 403, 404, 409]
    });
  }
  ruta('/' + coleccion + '/{id}', item);
}

/* recursoGlobal(): registros de la organización. Leer, cualquier sesión;
   escribir, administrador o director. */
function rutasGlobales(coleccion, nombre, etiqueta, opciones = {}) {
  const singular = opciones.singular || nombre.toLowerCase();
  const gestion = 'rol de administrador o director';
  ruta('/' + coleccion, {
    get: op(etiqueta, 'Listar ' + coleccion, {
      parametros: opciones.filtros,
      ok: [200, 'Todos los registros', lista(nombre)]
    }),
    post: op(etiqueta, 'Crear ' + singular, {
      nivel: gestion, cuerpo: ref(nombre + 'Crear'),
      ok: [201, 'Creado', ref(nombre)], errores: [400, 403, 409]
    })
  });
  ruta('/' + coleccion + '/{id}', {
    get: op(etiqueta, 'Ver un ' + singular, {
      parametros: [P_ID], ok: [200, 'El registro', ref(nombre)], errores: [404]
    }),
    patch: op(etiqueta, 'Cambiar un ' + singular, {
      parametros: [P_ID], nivel: gestion, cuerpo: ref(nombre + 'Actualizar'),
      ok: [200, 'El registro ya cambiado', ref(nombre)], errores: [400, 403, 404, 409]
    }),
    delete: op(etiqueta, 'Borrar un ' + singular, {
      parametros: [P_ID], nivel: gestion, ok: [204, 'Borrado'], errores: [403, 404]
    })
  });
}

/* ══════════════ Acceso ══════════════ */

const T = {
  acceso: 'Acceso',
  estado: 'Estado y paneles',
  usuarios: 'Usuarios y permisos',
  proyectos: 'Proyectos',
  ciclo: 'Ciclo de vida',
  documentos: 'Documentos',
  archivos: 'Archivos',
  equipo: 'Equipo e invitaciones',
  agil: 'Trabajo ágil',
  dominios: 'Dominios de desempeño',
  indicadores: 'Indicadores',
  cartera: 'Cartera',
  eos: 'EOS',
  catalogo: 'Catálogo del PMBOK',
  datos: 'Datos'
};

/* Qué agrupa cada etiqueta. El orden es el del menú de la izquierda. */
const DESCRIPCION_ETIQUETA = {
  [T.acceso]: 'Entrar, crear la cuenta uno mismo, saber quién soy, cambiar la contraseña y salir.',
  [T.estado]: 'La fotografía que carga la interfaz al entrar, el panel de inicio, la agenda y la comprobación de salud del servidor.',
  [T.usuarios]: 'Cuentas de la organización, sus roles y los permisos sobre portafolios, programas y proyectos. Casi todo exige ser administrador.',
  [T.proyectos]: 'Crear, ver, configurar y borrar proyectos. Cada respuesta trae el nivel de quien pregunta.',
  [T.ciclo]: 'Los 40 procesos de la guía dentro de un proyecto: su estado, sus notas, la banda del flujo en que están y los artefactos que entran y salen de cada uno.',
  [T.documentos]: 'Documentos generados desde las plantillas del catálogo: bloques, versiones y el paso de borrador a aprobado.',
  [T.archivos]: 'Adjuntos de un proyecto. La ficha va en JSON y el contenido se descarga aparte.',
  [T.equipo]: 'Quién trabaja en el proyecto y con qué rol, y los códigos con los que un compañero se une.',
  [T.agil]: 'Sprints, tareas, burndown y velocidad.',
  [T.dominios]: 'Los registros del proyecto: riesgos, interesados, solicitudes de cambio, lecciones aprendidas y comentarios.',
  [T.indicadores]: 'Mediciones de valor ganado y todo lo que se calcula con ellas: EVM, salud, matriz de riesgos y agenda.',
  [T.cartera]: 'Portafolios y programas donde se agrupan los proyectos.',
  [T.eos]: 'Capa EOS de la organización: rocas del trimestre, scorecard de métricas, organigrama de asientos y visión.',
  [T.catalogo]: 'Contenido de la guía: metodologías, bandas, los 40 procesos con su ITTO y los artefactos con su plantilla. Es de lectura y no necesita sesión.',
  [T.datos]: 'Copia completa de la base: exportar, importar y borrar. Solo para administradores.'
};

const SESION = {
  type: 'object',
  properties: {
    token: { type: 'string', description: 'JWT para la cabecera Authorization: Bearer …' },
    expira: MS,
    usuario: ref('Usuario')
  }
};

ruta('/auth/entrar', {
  post: op(T.acceso, 'Iniciar sesión', {
    descripcion: 'Devuelve el token que hay que enviar en Authorization. Se limitan los intentos fallidos por IP y por correo.',
    publica: true,
    cuerpo: {
      type: 'object',
      properties: { correo: { type: 'string', examples: ['admin@pmbok.local'] }, clave: { type: 'string' } },
      required: ['correo', 'clave']
    },
    ok: [200, 'Sesión abierta', SESION],
    errores: [400, 401, 403, 429]
  })
});

ruta('/auth/registrar', {
  post: op(T.acceso, 'Crear la cuenta uno mismo', {
    descripcion: 'Solo si REGISTRO_ABIERTO. El rol lo fija el servidor (REGISTRO_ROL, nunca «admin») y la cuenta nace sin proyectos.',
    publica: true,
    cuerpo: {
      type: 'object',
      properties: {
        nombre: { type: 'string', maxLength: 200 },
        correo: { type: 'string', maxLength: 200 },
        clave: { type: 'string', minLength: 6, maxLength: 200 }
      },
      required: ['correo', 'clave']
    },
    ok: [201, 'Cuenta creada y sesión abierta', SESION],
    errores: [400, 403, 409, 429]
  })
});

ruta('/auth/yo', {
  get: op(T.acceso, 'Quién soy', {
    descripcion: 'Se puede consultar aunque la contraseña esté pendiente de cambio.',
    ok: [200, 'La cuenta de la sesión', { type: 'object', properties: { usuario: ref('Usuario') } }]
  })
});

ruta('/auth/clave', {
  put: op(T.acceso, 'Cambiar mi contraseña', {
    descripcion: 'Cierra las demás sesiones. Es lo único que puede hacer una cuenta con el cambio pendiente.',
    cuerpo: {
      type: 'object',
      properties: { actual: { type: 'string' }, nueva: { type: 'string', minLength: 6, maxLength: 200 } },
      required: ['actual', 'nueva']
    },
    ok: [200, 'Contraseña cambiada', { type: 'object', properties: { ok: { type: 'boolean' }, mensaje: { type: 'string' } } }],
    errores: [400]
  })
});

ruta('/auth/salir', {
  post: op(T.acceso, 'Cerrar la sesión', {
    descripcion: 'Revoca el token que se está usando.',
    ok: [204, 'Sesión cerrada']
  })
});

/* ══════════════ Estado, panel y salud ══════════════ */

ruta('/salud', {
  get: op(T.estado, 'Comprobar que el servidor y la base responden', {
    descripcion: 'La pantalla de acceso la usa para saber si el registro está abierto y si es el primer arranque.',
    publica: true,
    ok: [200, 'Estado del servidor', {
      type: 'object',
      properties: {
        ok: { type: 'boolean' },
        bd: { type: 'string' },
        base: { type: 'string' },
        postgres: { type: 'string' },
        catalogo: { type: 'object', description: 'Procesos y artefactos sembrados, y los que hay en memoria' },
        primerUso: { type: 'boolean', description: 'Solo existe la cuenta inicial y conserva su contraseña' },
        registroAbierto: { type: 'boolean' },
        registroRol: { type: 'string' },
        hora: { type: 'string', format: 'date-time' }
      }
    }]
  })
});

ruta('/estado', {
  get: op(T.estado, 'Fotografía de todo lo visible', {
    descripcion: 'Lo que la interfaz carga al entrar, con la misma forma que la base del navegador: proyectos con nivel ≥ 1 y todo lo que cuelga de ellos, usuarios, cartera y EOS. Los códigos de invitación solo van en los proyectos que se dirigen.',
    ok: [200, 'Colecciones en camelCase', {
      type: 'object',
      properties: {
        version: { type: 'integer' },
        formato: { type: 'string', examples: ['pmbok8-gestor'] },
        generado: MS,
        usuario: ref('Usuario'),
        proyectos: lista('Proyecto'),
        miembros: lista('Miembro'),
        procesos: lista('ProcesoDeProyecto'),
        documentos: lista('Documento'),
        archivos: lista('Archivo'),
        riesgos: lista('Riesgo'),
        interesados: lista('Interesado'),
        cambios: lista('Cambio'),
        lecciones: lista('Leccion'),
        tareas: lista('Tarea'),
        sprints: lista('Sprint'),
        mediciones: lista('Medicion'),
        comentarios: lista('Comentario'),
        invitaciones: lista('Invitacion'),
        usuarios: lista('Usuario'),
        permisos: lista('Permiso'),
        portafolios: lista('Portafolio'),
        programas: lista('Programa'),
        rocas: lista('Roca'),
        metricas: lista('Metrica'),
        asientos: lista('Asiento'),
        vto: { type: 'object', description: 'Bloque de la visión → texto' }
      }
    }]
  })
});

ruta('/panel', {
  get: op(T.estado, 'Panel de inicio', {
    descripcion: 'Resumen de los proyectos visibles: avance, salud, riesgos altos y lo que vence pronto.',
    ok: [200, 'Datos del panel', { type: 'object' }]
  })
});

ruta('/calendario', {
  get: op(T.estado, 'Agenda de todos los proyectos visibles', {
    ok: [200, 'Hitos, tareas y sprints con fecha', { type: 'object' }]
  })
});

/* ══════════════ Usuarios y permisos ══════════════ */

ruta('/usuarios', {
  get: op(T.usuarios, 'Listar las cuentas', {
    descripcion: 'Cualquier sesión: los selectores de responsable lo necesitan. Nunca viaja el hash de la contraseña.',
    ok: [200, 'Cuentas de la organización', lista('Usuario')]
  }),
  post: op(T.usuarios, 'Crear una cuenta', {
    descripcion: 'La cuenta nace con el cambio de contraseña pendiente: quien la crea conoce la clave.',
    nivel: 'rol de administrador',
    cuerpo: ref('UsuarioCrear'),
    ok: [201, 'Cuenta creada', ref('Usuario')], errores: [400, 403, 409]
  })
});

ruta('/usuarios/roles', {
  get: op(T.usuarios, 'Listar los roles y qué permite cada uno', {
    ok: [200, 'Roles de la organización', {
      type: 'array',
      items: {
        type: 'object',
        properties: { id: { type: 'string' }, nombre: { type: 'string' }, descripcion: { type: 'string' } }
      }
    }]
  })
});

ruta('/usuarios/{id}', {
  get: op(T.usuarios, 'Ver una cuenta', {
    parametros: [P_ID], ok: [200, 'La cuenta', ref('Usuario')], errores: [404]
  }),
  patch: op(T.usuarios, 'Cambiar una cuenta', {
    descripcion: 'Debe quedar siempre al menos un administrador activo, y nadie desactiva su propia cuenta.',
    parametros: [P_ID], nivel: 'rol de administrador',
    cuerpo: ref('UsuarioActualizar'),
    ok: [200, 'La cuenta ya cambiada', ref('Usuario')], errores: [400, 403, 404, 409]
  }),
  delete: op(T.usuarios, 'Eliminar una cuenta', {
    parametros: [P_ID], nivel: 'rol de administrador',
    ok: [204, 'Cuenta eliminada'], errores: [403, 404, 409]
  })
});

ruta('/usuarios/{id}/clave', {
  put: op(T.usuarios, 'Restablecer la contraseña de una cuenta', {
    descripcion: 'Cierra las sesiones de esa cuenta y le exige cambiarla al entrar, salvo que sea la propia.',
    parametros: [P_ID], nivel: 'rol de administrador',
    cuerpo: { type: 'object', properties: { clave: { type: 'string', minLength: 6, maxLength: 200 } }, required: ['clave'] },
    ok: [200, 'Contraseña restablecida', { type: 'object', properties: { ok: { type: 'boolean' }, mensaje: { type: 'string' } } }],
    errores: [400, 403, 404]
  })
});

ruta('/permisos', {
  get: op(T.usuarios, 'Listar los permisos concedidos', {
    nivel: 'rol de administrador',
    parametros: [filtro('usuarioId', 'Solo los permisos de esa cuenta')],
    ok: [200, 'Permisos', lista('Permiso')], errores: [403]
  }),
  post: op(T.usuarios, 'Conceder un permiso', {
    descripcion: 'Si ya había permiso para ese usuario y ámbito, se cambia el nivel y responde 200.',
    nivel: 'rol de administrador',
    cuerpo: ref('PermisoCrear'),
    ok: [201, 'Permiso concedido', ref('Permiso')],
    mas: [[200, 'Ya había permiso: se cambió el nivel', ref('Permiso')]],
    errores: [400, 403]
  })
});

ruta('/permisos/{id}', {
  delete: op(T.usuarios, 'Retirar un permiso', {
    parametros: [P_ID], nivel: 'rol de administrador',
    ok: [204, 'Permiso retirado'], errores: [403, 404]
  })
});

/* ══════════════ Proyectos ══════════════ */

ruta('/proyectos', {
  get: op(T.proyectos, 'Listar los proyectos visibles', {
    descripcion: 'Cada proyecto llega con el nivel de quien pregunta. Los que no se pueden ver no aparecen.',
    ok: [200, 'Proyectos con nivel ≥ 1', lista('Proyecto')]
  }),
  post: op(T.proyectos, 'Crear un proyecto', {
    descripcion: 'Quien lo crea queda como director, con nivel «dirigir».',
    nivel: 'rol de administrador o director',
    cuerpo: ref('ProyectoCrear'),
    ok: [201, 'Proyecto creado', ref('Proyecto')], errores: [400, 403, 409]
  })
});

ruta('/proyectos/{proyectoId}', {
  get: op(T.proyectos, 'Ver un proyecto', {
    descripcion: 'Trae además el nivel, el progreso y el siguiente proceso sugerido.',
    parametros: [P_PROYECTO], nivel: 'nivel «ver»',
    ok: [200, 'El proyecto', ref('Proyecto')], errores: [404]
  }),
  patch: op(T.proyectos, 'Cambiar un proyecto', {
    descripcion: 'Hitos, definición de hecho, calidad y orden se tocan con «editar»; el resto de la configuración exige «dirigir».',
    parametros: [P_PROYECTO],
    cuerpo: ref('ProyectoActualizar'),
    ok: [200, 'El proyecto ya cambiado', ref('Proyecto')], errores: [400, 403, 404, 409]
  }),
  delete: op(T.proyectos, 'Borrar un proyecto', {
    descripcion: 'Arrastra en cascada todo lo que cuelga de él.',
    parametros: [P_PROYECTO], nivel: 'nivel «dirigir»',
    ok: [204, 'Proyecto borrado'], errores: [403, 404]
  })
});

/* ══════════════ Ciclo de vida: los 40 procesos ══════════════ */

const P_PROCESO = param('procesoId', 'Identificador del proceso del catálogo');

ruta('/proyectos/{proyectoId}/procesos', {
  get: op(T.ciclo, 'Listar los procesos del proyecto con su estado', {
    parametros: [P_PROYECTO], nivel: 'nivel «ver»',
    ok: [200, 'Un elemento por proceso del catálogo', lista('ProcesoDeProyecto')], errores: [404]
  })
});

ruta('/proyectos/{proyectoId}/procesos/{procesoId}', {
  get: op(T.ciclo, 'Ver un proceso con sus entradas y salidas', {
    parametros: [P_PROYECTO, P_PROCESO], nivel: 'nivel «ver»',
    ok: [200, 'El proceso, con los artefactos de entrada y de salida', {
      allOf: [ref('ProcesoDeProyecto'), {
        type: 'object',
        properties: {
          entradas: { type: 'array', items: { type: 'object' } },
          salidas: { type: 'array', items: { type: 'object' } }
        }
      }]
    }],
    errores: [404]
  }),
  put: op(T.ciclo, 'Fijar el estado o las notas de un proceso', {
    parametros: [P_PROYECTO, P_PROCESO], nivel: 'nivel «editar»',
    cuerpo: {
      type: 'object',
      description: 'Hay que indicar «estado», «notas» o las dos cosas',
      properties: { estado: { type: 'string', enum: D.E.estadosProceso }, notas: { type: 'string', maxLength: 20000 } }
    },
    ok: [200, 'El proceso ya cambiado', ref('ProcesoDeProyecto')], errores: [400, 403, 404]
  })
});

ruta('/proyectos/{proyectoId}/procesos/{procesoId}/banda', {
  put: op(T.ciclo, 'Mover un proceso a otra banda del flujo', {
    parametros: [P_PROYECTO, P_PROCESO], nivel: 'nivel «editar»',
    cuerpo: { type: 'object', properties: { banda: { type: 'string', enum: D.E.bandas } }, required: ['banda'] },
    ok: [200, 'El proceso ya movido', ref('ProcesoDeProyecto')], errores: [400, 403, 404]
  })
});

[['entradas', 'entrada'], ['salidas', 'salida']].forEach(([tipo, singular]) => {
  ruta('/proyectos/{proyectoId}/procesos/{procesoId}/' + tipo, {
    get: op(T.ciclo, 'Artefactos de ' + singular + ' de un proceso', {
      descripcion: 'Cada artefacto dice si el proyecto ya tiene su documento.',
      parametros: [P_PROYECTO, P_PROCESO], nivel: 'nivel «ver»',
      ok: [200, 'Artefactos de ' + singular, { type: 'array', items: { type: 'object' } }], errores: [404]
    })
  });
});

ruta('/proyectos/{proyectoId}/progreso', {
  get: op(T.ciclo, 'Avance del proyecto por bandas', {
    parametros: [P_PROYECTO], nivel: 'nivel «ver»',
    ok: [200, 'Procesos completados sobre el total, por banda', { type: 'object' }], errores: [404]
  })
});

ruta('/proyectos/{proyectoId}/siguiente', {
  get: op(T.ciclo, 'Siguiente proceso sugerido', {
    parametros: [P_PROYECTO], nivel: 'nivel «ver»',
    ok: [200, 'El proceso que toca, o null', { type: 'object', properties: { siguiente: {} } }], errores: [404]
  })
});

/* ══════════════ Documentos ══════════════ */

ruta('/proyectos/{proyectoId}/documentos', {
  get: op(T.documentos, 'Listar los documentos del proyecto', {
    parametros: [P_PROYECTO], nivel: 'nivel «ver»',
    ok: [200, 'Documentos, del más reciente al más antiguo', lista('Documento')], errores: [404]
  }),
  post: op(T.documentos, 'Generar un documento desde su plantilla', {
    descripcion: 'Si el proyecto ya tenía ese artefacto, devuelve el que existe con 200 en vez de duplicarlo.',
    parametros: [P_PROYECTO], nivel: 'nivel «editar»',
    cuerpo: {
      type: 'object',
      properties: {
        artefactoId: ref('Id'),
        procesoId: { anyOf: [ref('Id'), { type: 'null' }], description: 'Proceso al que se atribuye' },
        id: ref('Id')
      },
      required: ['artefactoId']
    },
    ok: [201, 'Documento generado', ref('Documento')],
    mas: [[200, 'Ya existía: llega con yaExistia = true', ref('Documento')]],
    errores: [400, 403, 404]
  })
});

ruta('/documentos/{id}', {
  get: op(T.documentos, 'Ver un documento con su plantilla', {
    parametros: [P_ID], nivel: 'nivel «ver» en su proyecto',
    ok: [200, 'El documento y los bloques de su plantilla', ref('Documento')], errores: [403, 404]
  }),
  patch: op(T.documentos, 'Cambiar el nombre, el contenido o el estado', {
    descripcion: 'El estado recorre borrador → revisión → aprobado.',
    parametros: [P_ID], nivel: 'nivel «editar» en su proyecto',
    cuerpo: {
      type: 'object',
      properties: {
        nombre: { type: 'string', minLength: 1, maxLength: 300 },
        estado: { type: 'string', enum: D.E.estadosDocumento },
        contenido: { type: 'object', description: 'Índice del bloque (texto) → valor' }
      }
    },
    ok: [200, 'El documento ya cambiado', ref('Documento')], errores: [400, 403, 404]
  }),
  delete: op(T.documentos, 'Borrar un documento', {
    parametros: [P_ID], nivel: 'nivel «editar» en su proyecto',
    ok: [204, 'Documento borrado'], errores: [403, 404]
  })
});

ruta('/documentos/{id}/bloques/{indice}', {
  put: op(T.documentos, 'Guardar un solo bloque de la plantilla', {
    descripcion: 'Lo que usa el editor al escribir, para no reenviar el documento entero.',
    parametros: [P_ID, {
      name: 'indice', in: 'path', required: true,
      description: 'Posición del bloque en la plantilla, empezando en 0',
      schema: { type: 'integer', minimum: 0 }
    }],
    nivel: 'nivel «editar» en su proyecto',
    cuerpo: { type: 'object', properties: { valor: { description: 'Texto, lista o tabla, según el tipo del bloque' } } },
    ok: [200, 'El documento ya guardado', ref('Documento')], errores: [400, 403, 404]
  })
});

ruta('/documentos/{id}/versiones', {
  post: op(T.documentos, 'Subir la versión del documento', {
    descripcion: 'Vuelve a borrador y deja constancia de la versión anterior.',
    parametros: [P_ID], nivel: 'nivel «editar» en su proyecto',
    ok: [200, 'El documento en su nueva versión', ref('Documento')], errores: [403, 404]
  })
});

/* ══════════════ Archivos ══════════════ */

ruta('/proyectos/{proyectoId}/archivos', {
  get: op(T.archivos, 'Listar los archivos del proyecto', {
    parametros: [P_PROYECTO], nivel: 'nivel «ver»',
    ok: [200, 'Fichas de los archivos, sin el contenido', lista('Archivo')], errores: [404]
  }),
  post: op(T.archivos, 'Subir un archivo', {
    descripcion: 'Formulario multipart. El permiso se comprueba antes de aceptar el cuerpo, así que un 403 no obliga a subir nada.',
    parametros: [P_PROYECTO], nivel: 'nivel «editar»',
    multipart: {
      type: 'object',
      properties: {
        archivo: { type: 'string', format: 'binary', description: 'El archivo; el límite lo fija ARCHIVO_LIMITE_MB' },
        nombre: { type: 'string', maxLength: 255, description: 'Si falta, se usa el nombre original' },
        categoria: { type: 'string', maxLength: 80 },
        id: ref('Id')
      },
      required: ['archivo']
    },
    ok: [201, 'Archivo guardado', ref('Archivo')], errores: [400, 403, 404, 413]
  })
});

ruta('/archivos/{id}', {
  get: op(T.archivos, 'Ver la ficha de un archivo', {
    parametros: [P_ID], nivel: 'nivel «ver» en su proyecto',
    ok: [200, 'La ficha', ref('Archivo')], errores: [403, 404]
  }),
  delete: op(T.archivos, 'Borrar un archivo', {
    parametros: [P_ID], nivel: 'nivel «editar» en su proyecto',
    ok: [204, 'Archivo borrado'], errores: [403, 404]
  })
});

ruta('/archivos/{id}/contenido', {
  get: {
    tags: [T.archivos],
    summary: 'Descargar el contenido de un archivo',
    description: 'Responde el archivo tal cual, con su tipo. Va aislado (Content-Security-Policy: sandbox) para que un HTML subido no se ejecute con el origen de la aplicación. Exige nivel «ver» en su proyecto.',
    parameters: [P_ID, filtro('enLinea', 'Con 1, y solo en imágenes, PDF y texto, se muestra en el navegador en vez de descargarse', { type: 'string', enum: ['1'] })],
    responses: {
      200: { description: 'El archivo', content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } } },
      401: { $ref: '#/components/responses/SinSesion' },
      403: { $ref: '#/components/responses/SinPermiso' },
      404: { $ref: '#/components/responses/NoEncontrado' }
    }
  }
});

/* ══════════════ Equipo e invitaciones ══════════════ */

rutasDeProyecto('miembros', 'Miembro', T.equipo, {
  singular: 'miembro', escritura: 'nivel «dirigir» en el proyecto',
  descripcionCrear: 'El rol marca el nivel: líder 3, observador 1, el resto 2.'
});

ruta('/proyectos/{proyectoId}/invitaciones', {
  get: op(T.equipo, 'Listar los códigos de invitación del proyecto', {
    descripcion: 'Los códigos son del líder: con menos de «dirigir» no se ven.',
    parametros: [P_PROYECTO], nivel: 'nivel «dirigir»',
    ok: [200, 'Códigos vigentes', lista('Invitacion')], errores: [403, 404]
  }),
  post: op(T.equipo, 'Crear un código de invitación', {
    descripcion: 'Sin «codigo» lo genera el servidor. Un código nunca concede el rol de líder.',
    parametros: [P_PROYECTO], nivel: 'nivel «dirigir»',
    cuerpo: ref('InvitacionCrear'),
    ok: [201, 'Código creado', ref('Invitacion')], errores: [400, 403, 404, 409]
  })
});

ruta('/invitaciones/unirse', {
  post: op(T.equipo, 'Unirse a un proyecto con un código', {
    descripcion: 'Cualquier sesión. Se aceptan separadores y minúsculas: «abcd-2345» vale. Quien ya era miembro conserva su rol.',
    cuerpo: { type: 'object', properties: { codigo: { type: 'string', examples: ['ABCD-2345'] } }, required: ['codigo'] },
    ok: [201, 'Ya es miembro del proyecto', {
      type: 'object',
      properties: {
        proyecto: { type: 'object', properties: { id: ref('Id'), nombre: { type: 'string' } } },
        rol: { type: 'string', enum: D.E.rolesMiembro },
        nivel: { type: 'integer' }
      }
    }],
    mas: [[200, 'Ya era miembro: llega con yaEraMiembro = true', { type: 'object' }]],
    errores: [400, 404, 410, 429]
  })
});

ruta('/invitaciones/{id}', {
  delete: op(T.equipo, 'Retirar un código de invitación', {
    parametros: [P_ID], nivel: 'nivel «dirigir» en su proyecto',
    ok: [204, 'Código retirado'], errores: [403, 404]
  })
});

/* ══════════════ Trabajo ágil ══════════════ */

rutasDeProyecto('sprints', 'Sprint', T.agil, {
  singular: 'sprint',
  descripcionCrear: 'Crear uno activo cierra el que estuviera activo: la base solo admite uno por proyecto. Para cerrar con sus reglas, POST /sprints/{id}/cerrar.'
});
rutasDeProyecto('tareas', 'Tarea', T.agil, {
  singular: 'tarea',
  descripcionCrear: 'Sin «prioridad» se coloca al final del backlog.'
});

ruta('/sprints/{id}/cerrar', {
  post: op(T.agil, 'Cerrar un sprint', {
    descripcion: 'Calcula lo entregado, guarda la última foto del burndown y devuelve las tareas que quedaron sin terminar.',
    parametros: [P_ID], nivel: 'nivel «editar» en su proyecto',
    ok: [200, 'El sprint cerrado y el resumen del cierre', {
      type: 'object', properties: { sprint: ref('Sprint') }
    }],
    errores: [400, 403, 404]
  })
});

ruta('/sprints/{id}/burndown', {
  get: op(T.agil, 'Ver el burndown de un sprint', {
    parametros: [P_ID], nivel: 'nivel «ver» en su proyecto',
    ok: [200, 'Serie de puntos restantes por día', { type: 'object' }], errores: [403, 404]
  }),
  post: op(T.agil, 'Fotografiar hoy el burndown', {
    descripcion: 'Solo en un sprint activo. Repetirlo el mismo día sobrescribe la foto.',
    parametros: [P_ID], nivel: 'nivel «editar» en su proyecto',
    ok: [200, 'El burndown ya actualizado', { type: 'object' }], errores: [400, 403, 404]
  })
});

ruta('/proyectos/{proyectoId}/velocidad', {
  get: op(T.agil, 'Velocidad de los sprints cerrados', {
    parametros: [P_PROYECTO], nivel: 'nivel «ver»',
    ok: [200, 'Puntos entregados por sprint y media', { type: 'object' }], errores: [404]
  })
});

ruta('/proyectos/{proyectoId}/sprint-activo', {
  get: op(T.agil, 'Ver el sprint activo del proyecto', {
    parametros: [P_PROYECTO], nivel: 'nivel «ver»',
    ok: [200, 'El sprint activo, o null', { type: 'object', properties: { sprint: {} } }], errores: [404]
  })
});

/* ══════════════ Dominios de desempeño ══════════════ */

rutasDeProyecto('riesgos', 'Riesgo', T.dominios, { singular: 'riesgo' });
rutasDeProyecto('interesados', 'Interesado', T.dominios, { singular: 'interesado' });
rutasDeProyecto('cambios', 'Cambio', T.dominios, { singular: 'cambio' });
rutasDeProyecto('lecciones', 'Leccion', T.dominios, { singular: 'lección' });
rutasDeProyecto('comentarios', 'Comentario', T.dominios, {
  singular: 'comentario', escritura: 'nivel «ver» en el proyecto',
  descripcionCrear: 'El autor es la sesión. Cada cual edita y borra lo suyo; con «editar» o más, cualquiera.'
});

/* ══════════════ Indicadores ══════════════ */

rutasDeProyecto('mediciones', 'Medicion', T.indicadores, {
  singular: 'medición',
  descripcionCrear: 'Valor planificado, ganado y coste real de una fecha. Sin «fecha» se toma la de hoy.'
});

ruta('/proyectos/{proyectoId}/evm', {
  get: op(T.indicadores, 'Valor ganado del proyecto', {
    descripcion: 'CV, SV, CPI, SPI, EAC y las proyecciones a partir de las mediciones.',
    parametros: [P_PROYECTO], nivel: 'nivel «ver»',
    ok: [200, 'Indicadores de valor ganado', { type: 'object' }], errores: [404]
  })
});

ruta('/proyectos/{proyectoId}/salud', {
  get: op(T.indicadores, 'Semáforo de salud del proyecto', {
    parametros: [P_PROYECTO], nivel: 'nivel «ver»',
    ok: [200, 'Señales de alcance, plazo, coste y riesgo', { type: 'object' }], errores: [404]
  })
});

ruta('/proyectos/{proyectoId}/matriz-riesgos', {
  get: op(T.indicadores, 'Matriz de probabilidad e impacto', {
    parametros: [P_PROYECTO], nivel: 'nivel «ver»',
    ok: [200, 'Riesgos repartidos en la cuadrícula de 5 × 5', { type: 'object' }], errores: [404]
  })
});

ruta('/proyectos/{proyectoId}/calendario', {
  get: op(T.indicadores, 'Agenda de un proyecto', {
    parametros: [P_PROYECTO], nivel: 'nivel «ver»',
    ok: [200, 'Hitos, tareas y sprints con fecha', { type: 'object' }], errores: [404]
  })
});

/* ══════════════ Cartera ══════════════ */

rutasGlobales('portafolios', 'Portafolio', T.cartera, { singular: 'portafolio' });
rutasGlobales('programas', 'Programa', T.cartera, {
  singular: 'programa', filtros: [filtro('portafolioId', 'Solo los programas de ese portafolio')]
});

ruta('/portafolios/{id}/programas', {
  get: op(T.cartera, 'Listar los programas de un portafolio', {
    parametros: [P_ID], ok: [200, 'Programas del portafolio', lista('Programa')], errores: [404]
  }),
  post: op(T.cartera, 'Crear un programa dentro de un portafolio', {
    parametros: [P_ID], nivel: 'rol de administrador o director',
    cuerpo: ref('ProgramaCrear'),
    ok: [201, 'Programa creado', ref('Programa')], errores: [400, 403, 404, 409]
  })
});

/* ══════════════ EOS ══════════════ */

rutasGlobales('rocas', 'Roca', T.eos, {
  singular: 'roca', filtros: [filtro('trimestre', 'Solo las rocas de ese trimestre, por ejemplo Q1-2026', { type: 'string' })]
});
rutasGlobales('metricas', 'Metrica', T.eos, { singular: 'métrica' });
rutasGlobales('asientos', 'Asiento', T.eos, { singular: 'asiento' });

ruta('/metricas/{id}/valores/{semana}', {
  put: op(T.eos, 'Guardar una celda del scorecard', {
    descripcion: 'Un valor vacío o null borra la celda.',
    parametros: [P_ID, {
      name: 'semana', in: 'path', required: true,
      description: 'Etiqueta de la semana, hasta 20 caracteres',
      schema: { type: 'string', maxLength: 20 }
    }],
    nivel: 'rol de administrador o director',
    cuerpo: { type: 'object', properties: { valor: { anyOf: [{ type: 'string', maxLength: 50 }, { type: 'number' }, { type: 'null' }] } } },
    ok: [200, 'La métrica con sus valores', ref('Metrica')], errores: [400, 403, 404]
  })
});

ruta('/vto', {
  get: op(T.eos, 'Leer la visión de la organización', {
    ok: [200, 'Bloque de la visión → texto', { type: 'object', additionalProperties: { type: 'string' } }]
  })
});

ruta('/vto/{bloqueId}', {
  put: op(T.eos, 'Guardar un bloque de la visión', {
    descripcion: 'Un texto vacío borra el bloque.',
    parametros: [param('bloqueId', 'Identificador del bloque de la visión')],
    nivel: 'rol de administrador o director',
    cuerpo: { type: 'object', properties: { texto: { type: 'string', maxLength: 20000 } }, required: ['texto'] },
    ok: [200, 'El bloque guardado', {
      type: 'object', properties: { bloqueId: { type: 'string' }, texto: { type: 'string' } }
    }],
    errores: [400, 403]
  })
});

/* ══════════════ Catálogo del PMBOK (público) ══════════════ */

const publicoCatalogo = {
  publica: true,
  descripcion: 'Sale de los archivos de datos de la interfaz, que son la única fuente de verdad del contenido.'
};

ruta('/catalogo/metodologias', {
  get: op(T.catalogo, 'Metodologías y qué procesos usa cada una', {
    ...publicoCatalogo, ok: [200, 'Metodologías', { type: 'array', items: { type: 'object' } }]
  })
});
ruta('/catalogo/bandas', {
  get: op(T.catalogo, 'Bandas del flujo de trabajo', {
    ...publicoCatalogo, ok: [200, 'Bandas, de inicio a cierre', { type: 'array', items: { type: 'object' } }]
  })
});
ruta('/catalogo/procesos', {
  get: op(T.catalogo, 'Los 40 procesos con sus entradas, herramientas y salidas', {
    ...publicoCatalogo, ok: [200, 'Procesos del catálogo', { type: 'array', items: { type: 'object' } }]
  })
});
ruta('/catalogo/artefactos', {
  get: op(T.catalogo, 'Artefactos con plantilla', {
    ...publicoCatalogo,
    ok: [200, 'Fichas de los artefactos, con cuántos bloques tiene su plantilla', {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: ref('Id'), nombre: { type: 'string' }, categoria: { type: 'string' },
          descripcion: { type: 'string' }, bloques: { type: 'integer' }
        }
      }
    }]
  })
});
ruta('/catalogo/artefactos/{id}', {
  get: op(T.catalogo, 'Ver un artefacto con su plantilla completa', {
    ...publicoCatalogo,
    parametros: [P_ID],
    ok: [200, 'El artefacto y los bloques de su plantilla (texto, campo, lista o tabla)', { type: 'object' }],
    errores: [404]
  })
});

/* ══════════════ Datos ══════════════ */

ruta('/datos/exportar', {
  get: op(T.datos, 'Exportar toda la base en un JSON', {
    descripcion: 'Formato «pmbok8-gestor», el mismo que guarda y lee el navegador en modo local.',
    nivel: 'rol de administrador',
    ok: [200, 'Copia completa, lista para descargar', { type: 'object' }], errores: [403]
  })
});

ruta('/datos/importar', {
  post: op(T.datos, 'Importar un JSON «pmbok8-gestor»', {
    descripcion: 'Lo que usa «Llevar al servidor». Admite cuerpos de hasta 50 MB.',
    nivel: 'rol de administrador',
    cuerpo: { type: 'object', description: 'Copia con la forma de /api/datos/exportar' },
    ok: [200, 'Resumen de lo importado', { type: 'object' }], errores: [400, 403, 409, 413]
  })
});

ruta('/datos/reiniciar', {
  post: op(T.datos, 'Borrar todos los datos', {
    descripcion: 'Deja solo la cuenta que lo pide. No se puede deshacer.',
    nivel: 'rol de administrador',
    cuerpo: { type: 'object', properties: { confirmacion: { type: 'string', enum: ['ELIMINAR'] } }, required: ['confirmacion'] },
    ok: [200, 'Resumen de lo borrado', { type: 'object' }], errores: [400, 403]
  })
});

/* ══════════════ El documento ══════════════ */

const DESCRIPCION = [
  'API del Gestor PMBOK® 8: proyectos, los 40 procesos de la guía, documentos desde plantilla,',
  'valor ganado, trabajo ágil, cartera y capa EOS.',
  '',
  '## Cómo se usa',
  '',
  '1. `POST /auth/entrar` devuelve un token.',
  '2. Ese token va en cada petición: `Authorization: Bearer <token>`. Arriba a la derecha se puede pegar una vez y probar las rutas desde aquí.',
  '3. Una cuenta con la contraseña pendiente de cambio recibe `403 CLAVE_PENDIENTE` en todo salvo `/auth/yo`, `/auth/clave` y `/auth/salir`.',
  '',
  '## Permisos',
  '',
  'El **rol** de la cuenta (`admin`, `director`, `miembro`, `ejecutor`) decide quién gestiona usuarios, cartera y EOS.',
  'Dentro de cada proyecto manda el **nivel efectivo** de 0 a 3: sin acceso, ver, editar y dirigir.',
  'Un proyecto con nivel 0 responde **404**, nunca 403: la API no revela que existe.',
  '',
  '## Convenios',
  '',
  '- Los campos van en camelCase; las fechas-hora, en milisegundos desde 1970; las fechas, en `AAAA-MM-DD`.',
  '- Los identificadores los puede generar el cliente (`[A-Za-z0-9_.:-]`, hasta 100 caracteres); si ya existen, la respuesta es 409.',
  '- Todo error tiene la forma `{ error, codigo, detalles? }`.',
  '- Un PATCH solo toca los campos que llegan en el cuerpo.'
].join('\n');

/* Un identificador por operación, sacado del método y del camino
   («get /proyectos/{proyectoId}/riesgos» → getProyectosProyectoIdRiesgos).
   Scalar los usa para los enlaces del menú y las herramientas los piden. */
function conIdentificadores(caminos) {
  Object.entries(caminos).forEach(([camino, operaciones]) => {
    Object.entries(operaciones).forEach(([metodo, operacion]) => {
      operacion.operationId = metodo + camino
        .replace(/[{}]/g, '')
        .replace(/[/-](.)/g, (_, c) => c.toUpperCase());
    });
  });
  return caminos;
}

function documento() {
  return {
    openapi: '3.1.0',
    info: {
      title: 'API del Gestor PMBOK 8',
      version: paquete.version,
      description: DESCRIPCION,
      license: { name: 'Privado', identifier: 'UNLICENSED' }
    },
    servers: [{ url: '/api', description: 'Este mismo servidor' }],
    tags: Object.values(T).map((nombre) => ({ name: nombre, description: DESCRIPCION_ETIQUETA[nombre] })),
    security: [{ sesion: [] }],
    components: {
      securitySchemes: {
        sesion: {
          type: 'http', scheme: 'bearer', bearerFormat: 'JWT',
          description: 'El token que devuelve POST /auth/entrar. Caduca a las JWT_EXPIRA_HORAS.'
        }
      },
      schemas: esquemas(),
      responses: respuestasError()
    },
    paths: conIdentificadores(rutas)
  };
}

module.exports = { documento };
