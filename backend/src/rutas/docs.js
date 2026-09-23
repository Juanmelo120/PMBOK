/* ═══════════════════════════════════════════════════════════
   docs.js — Documentación de la API
   ───────────────────────────────────────────────────────────
   /api/openapi.json   el documento OpenAPI 3.1 que arma openapi.js
   /api/docs           Scalar: lo pinta y deja probar las rutas
                       pegando el token de una sesión

   Las dos son públicas: no devuelven ningún dato, solo la forma de
   la API. Se apagan con DOCS_ACTIVAS=false.
   ═══════════════════════════════════════════════════════════ */

'use strict';

const express = require('express');
const config = require('../config');
const openapi = require('../openapi');

/* @scalar/express-api-reference es ESM y el backend es CommonJS: require()
   de un módulo ESM funciona desde Node 20.19. Con una versión anterior la
   página no se pinta, pero el servidor arranca y el documento sigue ahí. */
let apiReference = null;
try {
  apiReference = require('@scalar/express-api-reference').apiReference;
} catch (err) {
  console.warn('[docs] Scalar no se pudo cargar (' + (err.code || err.message) + '). ' +
    'Actualiza Node a 20.19 o posterior; /api/openapi.json sigue disponible.');
}

/* El documento no cambia mientras el proceso vive: se arma una sola vez */
let documento = null;

const r = express.Router();

r.get('/openapi.json', (_req, res) => {
  if (!documento) documento = openapi.documento();
  res.json(documento);
});

const pagina = apiReference && apiReference({
  url: '/api/openapi.json',
  pageTitle: 'API del Gestor PMBOK 8',
  theme: 'purple',
  /* Scalar trae su interfaz de jsdelivr: esta página es lo único del
     proyecto que pide internet. Con DOCS_CDN se apunta a una copia
     propia (por ejemplo /assets/vendor/scalar.js) y funciona sin red. */
  cdn: config.docs.cdn || undefined
});

r.get('/docs', pagina || ((_req, res) => {
  res.status(503).json({
    error: 'La página de documentación necesita Node 20.19 o posterior. El documento está en /api/openapi.json.',
    codigo: 'DOCS_NO_DISPONIBLE'
  });
}));

module.exports = r;
