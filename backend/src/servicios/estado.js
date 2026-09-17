/* ═══════════════════════════════════════════════════════════
   estado.js — Fotografía de todo lo que un usuario puede ver
   ───────────────────────────────────────────────────────────
   La interfaz la carga al entrar y trabaja sobre ella en memoria,
   así sus pantallas siguen siendo síncronas. Tiene la misma forma
   que la base del navegador (colecciones en camelCase), filtrada:
     · proyectos con nivel ≥ 1 y todo lo que cuelga de ellos;
     · usuarios (sin contraseñas), cartera y EOS completos;
     · permisos: todos para un administrador, los propios para el resto.
   ═══════════════════════════════════════════════════════════ */

'use strict';

const db = require('../db');
const repo = require('../repositorio');
const D = require('../definiciones');

const DE_PROYECTO = [
  ['miembros', D.miembros], ['procesos', D.procesosProyecto], ['documentos', D.documentos],
  ['archivos', D.archivos], ['riesgos', D.riesgos], ['interesados', D.interesados],
  ['cambios', D.cambios], ['lecciones', D.lecciones], ['tareas', D.tareas],
  ['sprints', D.sprints], ['mediciones', D.mediciones], ['comentarios', D.comentarios]
];

const GLOBALES = [
  ['usuarios', D.usuarios], ['portafolios', D.portafolios], ['programas', D.programas],
  ['rocas', D.rocas], ['metricas', D.metricas], ['asientos', D.asientos]
];

async function estado(usuario) {
  const filas = await db.varios(
    `SELECT t.*, n.nivel FROM proyectos t
     CROSS JOIN LATERAL (SELECT nivel_en(t.id, $1) AS nivel) n
     WHERE n.nivel > 0 ORDER BY t.creado`, [usuario.id]);
  const proyectos = filas.map((f) => ({ ...repo.aObjeto(D.proyectos, f), nivel: f.nivel }));
  const ids = proyectos.map((p) => p.id);

  const salida = {
    version: 1,
    formato: 'pmbok8-gestor',
    generado: Date.now(),
    sesion: { usuarioId: usuario.id },
    usuario,
    proyectos
  };

  for (const [nombre, def] of DE_PROYECTO) {
    salida[nombre] = await repo.listarEn(def, 'proyecto_id', ids);
  }
  for (const [nombre, def] of GLOBALES) {
    salida[nombre] = await repo.listar(def, {});
  }
  /* Los códigos de invitación solo viajan a quien dirige su proyecto */
  const dirigidos = proyectos.filter((p) => p.nivel >= D.NIVELES.dirigir).map((p) => p.id);
  salida.invitaciones = await repo.listarEn(D.invitaciones, 'proyecto_id', dirigidos);

  salida.permisos = usuario.rol === 'admin'
    ? await repo.listar(D.permisos, {})
    : await repo.listar(D.permisos, { usuario_id: usuario.id });

  const vto = await db.varios('SELECT bloque_id, texto FROM vto ORDER BY bloque_id');
  salida.vto = {};
  vto.forEach((f) => { salida.vto[f.bloque_id] = f.texto; });
  return salida;
}

module.exports = { estado };
