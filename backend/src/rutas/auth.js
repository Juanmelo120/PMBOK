/* ═══════════════════════════════════════════════════════════
   auth.js — /api/auth: entrar, salir, quién soy, mi contraseña
   ═══════════════════════════════════════════════════════════ */

'use strict';

const express = require('express');
const sesiones = require('../servicios/sesiones');
const D = require('../definiciones');
const { z, validar } = require('../validacion');
const { requerirSesionAunConClavePendiente: requerirSesion } = require('../middleware/auth');

const r = express.Router();

const esquemaEntrar = z.object({
  correo: z.string().max(200),
  clave: z.string().max(200)
});

r.post('/entrar', async (req, res) => {
  const { correo, clave } = validar(esquemaEntrar, req.body);
  const resultado = await sesiones.entrar(correo, clave, { ip: req.ip, agente: req.get('user-agent') });
  res.json(resultado);
});

/* Registro propio: el rol no se acepta en el cuerpo (lo fija REGISTRO_ROL).
   Correo y contraseña se validan igual que cuando un administrador crea la cuenta. */
const esquemaRegistro = z.object({
  nombre: z.string().trim().max(200).optional(),
  correo: D.correo,
  clave: D.clave
}).strip();

r.post('/registrar', async (req, res) => {
  const datos = validar(esquemaRegistro, req.body);
  const resultado = await sesiones.registrar(datos, { ip: req.ip, agente: req.get('user-agent') });
  res.status(201).json(resultado);
});

r.post('/salir', requerirSesion, async (req, res) => {
  await sesiones.salir(req.sesionId);
  res.status(204).end();
});

r.get('/yo', requerirSesion, (req, res) => {
  res.json({ usuario: req.usuario });
});

const esquemaClave = z.object({ actual: z.string().max(200), nueva: D.clave });

r.put('/clave', requerirSesion, async (req, res) => {
  const { actual, nueva } = validar(esquemaClave, req.body);
  await sesiones.cambiarPropiaClave(req.usuario.id, req.sesionId, actual, nueva);
  res.json({ ok: true, mensaje: 'Contraseña actualizada. Las demás sesiones se han cerrado.' });
});

module.exports = r;
