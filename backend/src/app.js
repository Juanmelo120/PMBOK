/* ═══════════════════════════════════════════════════════════
   app.js — Aplicación Express
   ───────────────────────────────────────────────────────────
   /api/...        API REST (JSON)
   /api/docs       documentación de la API (Scalar)
   /  y /assets    la interfaz existente del proyecto, servida
                   desde la carpeta raíz (solo index.html y assets)
   ═══════════════════════════════════════════════════════════ */

'use strict';

const path = require('path');
const express = require('express');
const cors = require('cors');
const config = require('./config');
const db = require('./db');
const catalogo = require('./catalogo');
const errores = require('./errores');
const { requerirSesion } = require('./middleware/auth');
const rutasAuth = require('./rutas/auth');
const rutasDocs = require('./rutas/docs');
const { usuarios, permisos } = require('./rutas/usuarios');
const { proyectos, planas } = require('./rutas/proyectos');
const org = require('./rutas/organizacion');

function cabecerasSeguridad(_req, res, next) {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'same-origin'
  });
  next();
}

function crearApp() {
  const app = express();
  app.disable('x-powered-by');
  if (config.confiarProxy) app.set('trust proxy', config.confiarProxy);
  app.use(cabecerasSeguridad);

  app.use('/api', cors({
    origin: (origen, cb) => cb(null, !origen || config.corsOrigenes.includes(origen)),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600
  }));
  app.use('/api/datos/importar', express.json({ limit: '50mb' }));
  app.use('/api', express.json({ limit: '5mb' }));
  app.use('/api', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

  /* ── Públicas ── */
  app.get('/api/salud', async (_req, res) => {
    const fila = await db.uno(
      `SELECT current_database() AS base, version() AS version,
              (SELECT count(*) FROM catalogo_procesos) AS procesos,
              (SELECT count(*) FROM catalogo_artefactos) AS artefactos,
              (SELECT count(*) = 1 AND bool_and(debe_cambiar_clave) FROM usuarios) AS primer_uso`);
    res.json({
      ok: true,
      bd: 'conectada',
      base: fila.base,
      postgres: fila.version.split(' ').slice(0, 2).join(' '),
      catalogo: { procesos: fila.procesos, artefactos: fila.artefactos, enMemoria: catalogo.cargar().flujo.length },
      /* Solo existe la cuenta inicial y aún tiene su contraseña por defecto */
      primerUso: fila.primer_uso === true,
      /* La pantalla de acceso ofrece «Crear cuenta» solo si está abierto */
      registroAbierto: config.registro.abierto,
      registroRol: config.registro.rol,
      hora: new Date().toISOString()
    });
  });
  app.use('/api/catalogo', org.catalogo);
  app.use('/api/auth', rutasAuth);
  /* La documentación describe la API, no devuelve datos: va sin sesión */
  if (config.docs.activas) app.use('/api', rutasDocs);

  /* ── Con sesión ── */
  app.use('/api', requerirSesion);
  app.use('/api/usuarios', usuarios);
  app.use('/api/permisos', permisos);
  app.use('/api/proyectos', proyectos);
  app.use('/api/portafolios', org.portafolios);
  app.use('/api/programas', org.programas);
  app.use('/api/rocas', org.rocas);
  app.use('/api/metricas', org.metricas);
  app.use('/api/asientos', org.asientos);
  app.use('/api/vto', org.vto);
  app.use('/api/datos', org.datos);
  app.use('/api', org.general);
  app.use('/api', planas);

  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'No existe la ruta ' + req.method + ' ' + req.originalUrl, codigo: 'NO_ENCONTRADO' });
  });

  /* ── Interfaz ── */
  app.use('/assets', express.static(path.join(config.frontendDir, 'assets'), { index: false, dotfiles: 'ignore' }));
  app.get(['/', '/index.html'], (_req, res) => res.sendFile(path.join(config.frontendDir, 'index.html')));
  app.use((_req, res) => res.status(404).type('text/plain').send('No encontrado'));

  app.use(errores.manejador);
  return app;
}

module.exports = { crearApp };
