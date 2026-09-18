/* ═══════════════════════════════════════════════════════════
   sesiones.js — Acceso, tokens y contraseñas
   ───────────────────────────────────────────────────────────
   · Contraseñas con bcrypt (coste 10), cifradas en hilos aparte
     para que un acceso masivo no detenga la API (clave.js).
   · El token JWT solo lleva el usuario y el id de sesión; la sesión
     vive en la tabla «sesiones», así que salir, desactivar la cuenta
     o cambiar la contraseña invalida los tokens al instante.
   · Límite de intentos fallidos por IP y correo.
   ═══════════════════════════════════════════════════════════ */

'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db');
const repo = require('../repositorio');
const clave_ = require('./clave');
const D = require('../definiciones');
const { ErrorHttp, noAutenticado } = require('../errores');

const COSTE = clave_.COSTE;
/* Hash de relleno: comparar contra él cuando el correo no existe
   iguala el tiempo de respuesta y no delata qué cuentas hay */
const HASH_RELLENO = bcrypt.hashSync('relleno-sin-uso', COSTE);

/* Los contadores de intentos no pueden crecer sin fin: cada IP y cada
   correo probado deja una entrada, y solo se borraba al volver a
   aparecer. Se barren las caducadas de vez en cuando. */
const LIMITE_ENTRADAS = 20000;

function barrer(mapa, vidaMs) {
  const ahora = Date.now();
  for (const [k, r] of mapa) {
    if (ahora - r.desde > vidaMs) mapa.delete(k);
  }
  /* Si aun así no cabe, manda la seguridad: se conservan las más recientes */
  if (mapa.size > LIMITE_ENTRADAS) {
    [...mapa.entries()].sort((a, b) => a[1].desde - b[1].desde)
      .slice(0, mapa.size - LIMITE_ENTRADAS)
      .forEach(([k]) => mapa.delete(k));
  }
}

const intentos = new Map();

function claveIntento(ip, correo) {
  return String(ip || '') + '|' + String(correo || '').toLowerCase();
}

function comprobarLimite(clave) {
  const ahora = Date.now();
  const ventana = config.acceso.ventanaMinutos * 60 * 1000;
  const r = intentos.get(clave);
  if (r && ahora - r.desde > ventana) intentos.delete(clave);
  const vigente = intentos.get(clave);
  if (vigente && vigente.fallos >= config.acceso.intentosMaximos) {
    throw new ErrorHttp(429, 'Demasiados intentos fallidos. Espera unos minutos antes de volver a intentarlo.', 'DEMASIADOS_INTENTOS');
  }
}

function anotarFallo(clave) {
  const r = intentos.get(clave) || { fallos: 0, desde: Date.now() };
  r.fallos++;
  intentos.set(clave, r);
}

function hashear(texto) {
  return clave_.hashear(texto, COSTE);
}

async function entrar(correo, clave, { ip, agente } = {}) {
  const correoNorm = String(correo || '').trim().toLowerCase();
  const k = claveIntento(ip, correoNorm);
  comprobarLimite(k);

  const fila = await db.uno('SELECT * FROM usuarios WHERE correo = $1', [correoNorm]);
  const coincide = await clave_.comparar(String(clave || ''), fila ? fila.clave_hash : HASH_RELLENO);

  if (!fila || !coincide) {
    anotarFallo(k);
    throw noAutenticado('Correo o contraseña incorrectos.');
  }
  if (!fila.activo) {
    throw new ErrorHttp(403, 'La cuenta está desactivada. Pide a un administrador que la reactive.', 'CUENTA_DESACTIVADA');
  }
  intentos.delete(k);
  return abrirSesion(fila, { ip, agente });
}

async function abrirSesion(fila, { ip, agente } = {}, cx) {
  const expira = new Date(Date.now() + config.jwt.expiraHoras * 3600 * 1000);
  const sesion = await db.uno(
    'INSERT INTO sesiones (usuario_id, expira, ip, agente) VALUES ($1, $2, $3, $4) RETURNING id',
    [fila.id, expira, ip || null, agente ? String(agente).slice(0, 300) : null], cx);

  const token = jwt.sign({ sid: sesion.id }, config.jwt.secreto, {
    algorithm: 'HS256', subject: fila.id, expiresIn: config.jwt.expiraHoras * 3600
  });

  return { token, expira: expira.getTime(), usuario: repo.aObjeto(D.usuarios, fila) };
}

/* ── Registro propio ──
   La cuenta nace activa, con la contraseña que eligió su dueño y con el
   rol de REGISTRO_ROL (director por defecto: crea su proyecto y forma su
   equipo). El rol nunca lo elige quien se registra, y nunca es «admin». */
const altas = new Map();

function comprobarAltas(ip) {
  const clave = String(ip || '');
  const r = altas.get(clave);
  if (r && Date.now() - r.desde > 3600 * 1000) altas.delete(clave);
  const vigente = altas.get(clave);
  if (vigente && vigente.n >= config.registro.porHora) {
    throw new ErrorHttp(429, 'Se han creado demasiadas cuentas desde este equipo. Espera una hora o pide la cuenta a un administrador.', 'DEMASIADOS_REGISTROS');
  }
}

async function registrar({ nombre, correo, clave }, { ip, agente } = {}) {
  if (!config.registro.abierto) {
    throw new ErrorHttp(403, 'El registro está cerrado. Pide una cuenta a un administrador.', 'REGISTRO_CERRADO');
  }
  comprobarAltas(ip);
  const hash = await hashear(clave);
  const resultado = await db.transaccion(async (cx) => {
    const fila = await db.uno(
      `INSERT INTO usuarios (nombre, correo, clave_hash, rol, debe_cambiar_clave, origen)
       VALUES ($1, $2, $3, $4, false, 'registro') RETURNING *`,
      [nombre || correo.split('@')[0], correo, hash, config.registro.rol], cx);
    return abrirSesion(fila, { ip, agente }, cx);
  });
  const r = altas.get(String(ip || '')) || { n: 0, desde: Date.now() };
  r.n++;
  altas.set(String(ip || ''), r);
  return resultado;
}

/* Devuelve { usuario, sesionId } o lanza 401 */
async function verificar(token) {
  let datos;
  try {
    datos = jwt.verify(token, config.jwt.secreto, { algorithms: ['HS256'] });
  } catch (e) {
    throw noAutenticado(e.name === 'TokenExpiredError' ? 'La sesión caducó. Vuelve a entrar.' : 'El token no es válido.');
  }
  const fila = await db.uno(
    `SELECT u.* FROM sesiones s JOIN usuarios u ON u.id = s.usuario_id
     WHERE s.id = $1 AND s.usuario_id = $2 AND s.revocada IS NULL AND s.expira > now() AND u.activo`,
    [datos.sid, datos.sub]);
  if (!fila) throw noAutenticado('La sesión ya no es válida. Vuelve a entrar.');
  return { usuario: repo.aObjeto(D.usuarios, fila), sesionId: datos.sid };
}

function salir(sesionId) {
  return db.consulta('UPDATE sesiones SET revocada = now() WHERE id = $1 AND revocada IS NULL', [sesionId]);
}

/* Revoca todas las sesiones de un usuario salvo, si se indica, la actual */
function revocarDe(usuarioId, excepto, cx) {
  return db.consulta(
    'UPDATE sesiones SET revocada = now() WHERE usuario_id = $1 AND revocada IS NULL AND ($2::text IS NULL OR id <> $2)',
    [usuarioId, excepto || null], cx);
}

async function cambiarPropiaClave(usuarioId, sesionId, actual, nueva) {
  const fila = await db.uno('SELECT clave_hash FROM usuarios WHERE id = $1', [usuarioId]);
  if (!fila || !(await clave_.comparar(String(actual || ''), fila.clave_hash))) {
    throw new ErrorHttp(400, 'La contraseña actual no coincide.', 'CLAVE_INCORRECTA');
  }
  if (String(actual) === String(nueva)) {
    throw new ErrorHttp(400, 'La nueva contraseña debe ser distinta de la actual.', 'CLAVE_REPETIDA');
  }
  /* Cifrar antes de abrir la transacción: si no, la conexión se queda
     retenida durante todo el cifrado y bajo carga eso vacía el pozo. */
  const hash = await hashear(nueva);
  await db.transaccion(async (cx) => {
    await db.consulta('UPDATE usuarios SET clave_hash = $1, debe_cambiar_clave = false WHERE id = $2',
      [hash, usuarioId], cx);
    await revocarDe(usuarioId, sesionId, cx);
  });
}

/* Borra las sesiones caducadas y las cerradas hace más de un día */
async function purgar(cx) {
  const r = await db.consulta(
    "DELETE FROM sesiones WHERE expira < now() OR revocada < now() - interval '1 day'", [], cx);
  return r.rowCount;
}

/* Cada diez minutos se tiran las anotaciones ya caducadas de los dos
   mapas; sin esto, un servidor de meses acumula una entrada por cada
   IP y correo que alguien haya probado. */
setInterval(() => {
  barrer(intentos, config.acceso.ventanaMinutos * 60 * 1000);
  barrer(altas, 3600 * 1000);
}, 10 * 60 * 1000).unref();

function reiniciarLimites() {
  intentos.clear();
  altas.clear();
}

module.exports = { entrar, registrar, verificar, salir, revocarDe, cambiarPropiaClave, hashear, purgar, reiniciarLimites };
