/* ═══════════════════════════════════════════════════════════
   errores.js — Errores HTTP y traducción de errores de la BD
   Toda respuesta de error tiene la forma
     { error: 'mensaje legible', codigo: 'CLAVE', detalles?: [...] }
   ═══════════════════════════════════════════════════════════ */

'use strict';

const { ZodError } = require('zod');

class ErrorHttp extends Error {
  constructor(estado, mensaje, codigo, detalles) {
    super(mensaje);
    this.estado = estado;
    this.codigo = codigo || 'ERROR';
    this.detalles = detalles;
  }
}

const peticionInvalida = (msg, detalles) => new ErrorHttp(400, msg, 'PETICION_INVALIDA', detalles);
const noAutenticado = (msg) => new ErrorHttp(401, msg || 'Necesitas iniciar sesión.', 'NO_AUTENTICADO');
const prohibido = (msg) => new ErrorHttp(403, msg || 'No tienes permiso para esta acción.', 'PROHIBIDO');
const noEncontrado = (msg) => new ErrorHttp(404, msg || 'No se encontró el recurso.', 'NO_ENCONTRADO');
const conflicto = (msg) => new ErrorHttp(409, msg, 'CONFLICTO');

/* Mensajes para las restricciones con nombre propio del esquema */
const RESTRICCIONES = {
  usuarios_correo_uk: [409, 'Ya existe una cuenta con ese correo.'],
  miembros_proyecto_usuario_uk: [409, 'Ese usuario ya es miembro del proyecto.'],
  invitaciones_codigo_uk: [409, 'Ese código de invitación ya existe.'],
  documentos_proyecto_artefacto_uk: [409, 'Ese documento ya existe en el proyecto.'],
  proyecto_procesos_uk: [409, 'El proceso ya tiene estado en este proyecto.'],
  permisos_usuario_ambito_ref_uk: [409, 'Ese permiso ya existe.'],
  sprints_un_activo_uk: [409, 'El proyecto ya tiene un sprint activo. Ciérralo antes de activar otro.'],
  proyectos_fechas_ck: [400, 'La fecha de fin no puede ser anterior a la de inicio.'],
  tareas_sprint_fk: [400, 'El sprint indicado no existe en este proyecto.'],
  permisos_ref_fk: [400, 'El portafolio, programa o proyecto del permiso no existe.']
};

function camel(col) {
  return String(col).replace(/_([a-z])/g, (_, l) => l.toUpperCase());
}

/* «riesgos_responsable_id_fkey» → «responsableId» */
function campoDeRestriccion(restriccion, tabla) {
  let s = String(restriccion || '');
  if (tabla && s.startsWith(tabla + '_')) s = s.slice(tabla.length + 1);
  s = s.replace(/_(fkey|check|key|pkey)$/, '');
  return camel(s);
}

function traducirPg(err) {
  const r = RESTRICCIONES[err.constraint];
  if (r) return new ErrorHttp(r[0], r[1], r[0] === 409 ? 'CONFLICTO' : 'PETICION_INVALIDA');

  switch (err.code) {
    case '23505':
      if (/_pkey$/.test(err.constraint || '')) return conflicto('Ya existe un registro con ese identificador.');
      return conflicto('Ya existe un registro con esos datos.');
    case '23503':
      return peticionInvalida('La referencia «' + campoDeRestriccion(err.constraint, err.table) + '» no existe.');
    case '23514':
      return peticionInvalida('Valor no permitido para «' + campoDeRestriccion(err.constraint, err.table) + '».');
    case '23502':
      return peticionInvalida('Falta el campo obligatorio «' + camel(err.column) + '».');
    case '22P02':
    case '22003':
    case '22007':
    case '22008':
      return peticionInvalida('Algún valor tiene un formato no válido.');
    default:
      return null;
  }
}

function traducirZod(err) {
  const detalles = err.issues.map((i) => ({
    campo: i.path.join('.') || '(cuerpo)',
    mensaje: i.message
  }));
  const primero = detalles[0];
  return peticionInvalida(
    primero ? 'Datos no válidos en «' + primero.campo + '»: ' + primero.mensaje : 'Datos no válidos.',
    detalles);
}

/* Middleware final de Express */
function manejador(err, req, res, _next) {
  let e = err;
  if (err instanceof ZodError) e = traducirZod(err);
  else if (err && err.type === 'entity.parse.failed') e = peticionInvalida('El cuerpo de la petición no es JSON válido.');
  else if (err && err.type === 'entity.too.large') e = new ErrorHttp(413, 'La petición es demasiado grande.', 'DEMASIADO_GRANDE');
  else if (err && err.code === 'LIMIT_FILE_SIZE') e = new ErrorHttp(413, 'El archivo supera el tamaño máximo permitido.', 'DEMASIADO_GRANDE');
  else if (err && err.code && /^LIMIT_/.test(err.code)) e = peticionInvalida('La subida del archivo no es válida: ' + err.message);
  else if (err && typeof err.code === 'string' && /^\d{2}[0-9A-Z]{3}$/.test(err.code)) e = traducirPg(err) || err;

  if (e instanceof ErrorHttp) {
    const cuerpo = { error: e.message, codigo: e.codigo };
    if (e.detalles) cuerpo.detalles = e.detalles;
    return res.status(e.estado).json(cuerpo);
  }

  console.error('[error]', req.method, req.originalUrl, err);
  res.status(500).json({ error: 'Error interno del servidor.', codigo: 'ERROR_INTERNO' });
}

module.exports = {
  ErrorHttp, peticionInvalida, noAutenticado, prohibido, noEncontrado, conflicto, manejador
};
