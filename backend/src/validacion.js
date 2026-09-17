/* ═══════════════════════════════════════════════════════════
   validacion.js — Piezas de validación reutilizables (zod)
   ───────────────────────────────────────────────────────────
   Los esquemas NO llevan valores por defecto: si un campo no llega,
   decide el DEFAULT de la columna al crear y no se toca al editar.
   La interfaz manda '' para «sin valor» en selectores y fechas,
   así que esas cadenas vacías se convierten en null.
   ═══════════════════════════════════════════════════════════ */

'use strict';

const { z } = require('zod');

z.config(z.locales.es());

const vacioANulo = (v) => (v === '' ? null : v);

const texto = (max = 20000) => z.string().max(max);
const textoRequerido = (max = 500) => z.string().trim().min(1, 'No puede estar vacío').max(max);

const id = z.string().regex(/^[A-Za-z0-9_.:-]{1,100}$/, 'Identificador no válido');
const idNulo = z.preprocess(vacioANulo, id.nullable());

function fechaValida(v) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(v + 'T00:00:00Z');
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}
const fecha = z.string().refine(fechaValida, 'Debe ser una fecha AAAA-MM-DD válida');
const fechaNula = z.preprocess(vacioANulo, fecha.nullable());

const aNumero = (v) => (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v)) ? Number(v) : v);
const numero = z.preprocess(aNumero, z.number());
const numeroNulo = z.preprocess((v) => aNumero(vacioANulo(v)), z.number().nullable());
const entero = z.preprocess(aNumero, z.number().int());
const escala15 = z.preprocess(aNumero, z.number().int().min(1).max(5));
const booleano = z.preprocess((v) => (v === 'true' ? true : v === 'false' ? false : v), z.boolean());

/* Lanza ZodError (el manejador lo convierte en 400) */
function validar(esquema, datos) {
  return esquema.parse(datos === undefined ? {} : datos);
}

/* Solo los campos que llegaron: quita las claves con undefined */
function limpiar(obj) {
  const r = {};
  Object.keys(obj).forEach((k) => { if (obj[k] !== undefined) r[k] = obj[k]; });
  return r;
}

module.exports = {
  z, validar, limpiar,
  texto, textoRequerido, id, idNulo, fecha, fechaNula, fechaValida,
  numero, numeroNulo, entero, escala15, booleano
};
