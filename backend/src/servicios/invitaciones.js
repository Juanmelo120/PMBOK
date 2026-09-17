/* ═══════════════════════════════════════════════════════════
   invitaciones.js — Códigos para entrar al equipo de un proyecto
   ───────────────────────────────────────────────────────────
   · Quien dirige el proyecto crea códigos, cada uno con el rol que
     da (nunca «lider») y, si quiere, una caducidad en días.
   · Cualquier cuenta con sesión se une con el código: queda como
     miembro con ese rol y su nivel sale de nivel_en() como siempre.
   · Probar códigos al azar tiene límite por usuario.
   ═══════════════════════════════════════════════════════════ */

'use strict';

const crypto = require('crypto');
const config = require('../config');
const db = require('../db');
const repo = require('../repositorio');
const D = require('../definiciones');
const { ErrorHttp, noEncontrado, conflicto } = require('../errores');

/* Sin 0/O ni 1/I: se dictan en voz alta en clase sin confusiones */
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generarCodigo() {
  const bytes = crypto.randomBytes(8);
  let s = '';
  for (const b of bytes) s += ALFABETO[b % ALFABETO.length];
  return s;
}

const fallos = new Map();

function comprobarLimite(usuarioId) {
  const r = fallos.get(usuarioId);
  const ventana = config.invitaciones.ventanaMinutos * 60 * 1000;
  if (r && Date.now() - r.desde > ventana) fallos.delete(usuarioId);
  const vigente = fallos.get(usuarioId);
  if (vigente && vigente.n >= config.invitaciones.intentosMaximos) {
    throw new ErrorHttp(429, 'Demasiados códigos incorrectos. Espera unos minutos y revisa el código con tu líder.', 'DEMASIADOS_INTENTOS');
  }
}

function anotarFallo(usuarioId) {
  const r = fallos.get(usuarioId) || { n: 0, desde: Date.now() };
  r.n++;
  fallos.set(usuarioId, r);
}

function listar(proyectoId) {
  return repo.listar(D.invitaciones, { proyecto_id: proyectoId });
}

async function crear(usuario, proyectoId, datos) {
  const expira = datos.dias ? new Date(Date.now() + datos.dias * 24 * 3600 * 1000) : null;
  /* El navegador puede proponer el código para mostrarlo sin esperar;
     si choca con uno existente (improbable), se genera otro */
  let codigo = datos.codigo || generarCodigo();
  for (let intento = 0; intento < 5; intento++) {
    try {
      const fila = await db.uno(
        `INSERT INTO invitaciones (id, proyecto_id, codigo, rol, expira, creado_por, creado)
         VALUES (COALESCE($1, gen_random_uuid()::text), $2, $3, $4, $5, $6, COALESCE($7, now()))
         RETURNING id`,
        [datos.id || null, proyectoId, codigo, datos.rol || 'equipo', expira, usuario.id,
         datos.creado ? new Date(datos.creado) : null]);
      return repo.obtener(D.invitaciones, fila.id);
    } catch (err) {
      if (err.constraint !== 'invitaciones_codigo_uk' || datos.codigo) throw err;
      codigo = generarCodigo();
    }
  }
  throw conflicto('No se pudo generar un código único. Inténtalo de nuevo.');
}

/* Resultado: { proyecto: { id, nombre }, rol, nivel, yaEraMiembro } */
async function unirse(usuario, codigo) {
  comprobarLimite(usuario.id);
  return db.transaccion(async (cx) => {
    const inv = await db.uno(
      `SELECT i.*, p.nombre AS proyecto_nombre FROM invitaciones i
       JOIN proyectos p ON p.id = i.proyecto_id
       WHERE i.codigo = $1 FOR UPDATE OF i`, [codigo], cx);
    if (!inv) {
      anotarFallo(usuario.id);
      throw noEncontrado('Ese código no existe. Revísalo con el líder de tu proyecto.');
    }
    if (inv.expira && inv.expira < new Date()) {
      throw new ErrorHttp(410, 'El código caducó. Pide al líder de tu proyecto uno nuevo.', 'CODIGO_CADUCADO');
    }
    fallos.delete(usuario.id);

    const previo = await db.uno('SELECT rol FROM miembros WHERE proyecto_id = $1 AND usuario_id = $2',
      [inv.proyecto_id, usuario.id], cx);
    if (!previo) {
      await repo.insertar(D.miembros, { proyectoId: inv.proyecto_id, usuarioId: usuario.id, rol: inv.rol }, cx);
      await db.consulta('UPDATE invitaciones SET usos = usos + 1 WHERE id = $1', [inv.id], cx);
    }
    const n = await db.uno('SELECT nivel_en($1, $2) AS nivel', [inv.proyecto_id, usuario.id], cx);
    return {
      proyecto: { id: inv.proyecto_id, nombre: inv.proyecto_nombre },
      /* Unirse de nuevo no rebaja a quien ya estaba: conserva su rol */
      rol: previo ? previo.rol : inv.rol,
      nivel: n.nivel,
      yaEraMiembro: !!previo
    };
  });
}

function reiniciarLimites() {
  fallos.clear();
}

module.exports = { generarCodigo, listar, crear, unirse, reiniciarLimites, ALFABETO };
