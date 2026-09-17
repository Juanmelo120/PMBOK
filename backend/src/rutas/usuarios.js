/* ═══════════════════════════════════════════════════════════
   usuarios.js — /api/usuarios y /api/permisos
   Listar usuarios: cualquier sesión (los selectores de responsable
   lo necesitan). Todo lo demás: solo administradores.
   Nunca se devuelve el hash de la contraseña.
   ═══════════════════════════════════════════════════════════ */

'use strict';

const express = require('express');
const db = require('../db');
const repo = require('../repositorio');
const D = require('../definiciones');
const sesiones = require('../servicios/sesiones');
const { z, validar, limpiar } = require('../validacion');
const { requerirRol } = require('../middleware/auth');
const { noEncontrado, peticionInvalida, conflicto } = require('../errores');

const soloAdmin = requerirRol('admin');

/* ══════════════ Usuarios ══════════════ */

const usuarios = express.Router();

usuarios.get('/', async (_req, res) => {
  res.json(await repo.listar(D.usuarios, {}));
});

usuarios.get('/roles', (_req, res) => {
  res.json([
    { id: 'admin', nombre: 'Administrador', descripcion: 'Ve y edita todo; gestiona usuarios y permisos.' },
    { id: 'director', nombre: 'Director de proyecto', descripcion: 'Crea y dirige proyectos propios.' },
    { id: 'miembro', nombre: 'Miembro de equipo', descripcion: 'Trabaja en los proyectos donde se le asigna.' },
    { id: 'ejecutor', nombre: 'Ejecutor', descripcion: 'Ve sus tareas y comenta; no edita planes.' }
  ]);
});

usuarios.get('/:id', async (req, res) => {
  const u = await repo.obtener(D.usuarios, req.params.id);
  if (!u) throw noEncontrado('No existe el usuario.');
  res.json(u);
});

/* Quien crea la cuenta conoce la contraseña: su dueño la cambia al entrar */
usuarios.post('/', soloAdmin, async (req, res) => {
  const d = validar(D.usuarios.esquemas.crear, req.body);
  const hash = await sesiones.hashear(d.clave);
  const fila = await db.uno(
    `INSERT INTO usuarios (id, nombre, correo, clave_hash, rol, debe_cambiar_clave)
     VALUES (COALESCE($1, gen_random_uuid()::text), $2, $3, $4, $5, true) RETURNING id`,
    [d.id || null, (d.nombre || '').trim() || d.correo, d.correo, hash, d.rol || 'miembro']);
  res.status(201).json(await repo.obtener(D.usuarios, fila.id));
});

/* No dejar la organización sin ningún administrador activo */
async function quedariaSinAdmin(usuarioId, cx) {
  const r = await db.uno(
    "SELECT count(*) AS n FROM usuarios WHERE rol = 'admin' AND activo AND id <> $1", [usuarioId], cx);
  return r.n === 0;
}

usuarios.patch('/:id', soloAdmin, async (req, res) => {
  const cambios = limpiar(validar(D.usuarios.esquemas.actualizar, req.body));
  const id = req.params.id;
  const u = await db.transaccion(async (cx) => {
    const actual = await db.uno('SELECT * FROM usuarios WHERE id = $1 FOR UPDATE', [id], cx);
    if (!actual) throw noEncontrado('No existe el usuario.');
    const pierdeAdmin = actual.rol === 'admin' && actual.activo &&
      ((cambios.rol && cambios.rol !== 'admin') || cambios.activo === false);
    if (id === req.usuario.id && cambios.activo === false) {
      throw conflicto('No puedes desactivar tu propia cuenta.');
    }
    if (pierdeAdmin && await quedariaSinAdmin(id, cx)) {
      throw conflicto('Debe quedar al menos un administrador activo.');
    }
    await repo.actualizar(D.usuarios, id, cambios, cx);
    if (cambios.activo === false) await sesiones.revocarDe(id, null, cx);
    return repo.obtener(D.usuarios, id, cx);
  });
  res.json(u);
});

usuarios.put('/:id/clave', soloAdmin, async (req, res) => {
  const { clave } = validar(z.object({ clave: D.clave }), req.body);
  const propia = req.params.id === req.usuario.id;
  await db.transaccion(async (cx) => {
    /* Una contraseña puesta por un administrador la cambia luego su dueño */
    const r = await db.consulta('UPDATE usuarios SET clave_hash = $2, debe_cambiar_clave = $3 WHERE id = $1',
      [req.params.id, await sesiones.hashear(clave), !propia], cx);
    if (!r.rowCount) throw noEncontrado('No existe el usuario.');
    await sesiones.revocarDe(req.params.id, propia ? req.sesionId : null, cx);
  });
  res.json({ ok: true, mensaje: propia ? 'Contraseña actualizada.' : 'Contraseña restablecida: se pedirá cambiarla al entrar.' });
});

usuarios.delete('/:id', soloAdmin, async (req, res) => {
  const id = req.params.id;
  if (id === req.usuario.id) throw conflicto('No puedes eliminar tu propia cuenta.');
  await db.transaccion(async (cx) => {
    const actual = await db.uno('SELECT rol, activo FROM usuarios WHERE id = $1 FOR UPDATE', [id], cx);
    if (!actual) throw noEncontrado('No existe el usuario.');
    if (actual.rol === 'admin' && actual.activo && await quedariaSinAdmin(id, cx)) {
      throw conflicto('Debe quedar al menos un administrador activo.');
    }
    await db.consulta('DELETE FROM usuarios WHERE id = $1', [id], cx);
  });
  res.status(204).end();
});

/* ══════════════ Permisos ══════════════ */

const permisos = express.Router();
permisos.use(soloAdmin);

permisos.get('/', async (req, res) => {
  const filtro = {};
  if (typeof req.query.usuarioId === 'string') filtro.usuario_id = req.query.usuarioId;
  res.json(await repo.listar(D.permisos, filtro));
});

/* Conceder: si ya había un permiso para ese usuario y ámbito, se cambia el nivel */
permisos.post('/', async (req, res) => {
  const d = validar(D.permisos.esquemas.crear, req.body);
  const u = await db.uno('SELECT id FROM usuarios WHERE id = $1', [d.usuarioId]);
  if (!u) throw peticionInvalida('El usuario del permiso no existe.');
  const fila = await db.uno(
    `INSERT INTO permisos (id, usuario_id, ambito, ref_id, nivel)
     VALUES (COALESCE($5, gen_random_uuid()::text), $1, $2, $3, $4)
     ON CONFLICT (usuario_id, ambito, ref_id) DO UPDATE SET nivel = EXCLUDED.nivel
     RETURNING id, (xmax = 0) AS nuevo`,
    [d.usuarioId, d.ambito, d.refId, d.nivel, d.id || null]);
  res.status(fila.nuevo ? 201 : 200).json(await repo.obtener(D.permisos, fila.id));
});

permisos.delete('/:id', async (req, res) => {
  if (!(await repo.borrar(D.permisos, req.params.id))) throw noEncontrado('No existe el permiso.');
  res.status(204).end();
});

module.exports = { usuarios, permisos };
