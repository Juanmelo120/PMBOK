/* ═══════════════════════════════════════════════════════════
   datos.js — Exportar, importar y reiniciar la base
   ───────────────────────────────────────────────────────────
   El formato es el mismo que produce «Exportar datos» en la
   interfaz del navegador (formato 'pmbok8-gestor'), así que el
   trabajo guardado en localStorage se puede llevar a PostgreSQL.
   La importación sanea cada registro: las referencias rotas se
   anulan o el registro se omite, y todo ocurre en una transacción.
   ═══════════════════════════════════════════════════════════ */

'use strict';

const crypto = require('crypto');
const db = require('../db');
const repo = require('../repositorio');
const catalogo = require('../catalogo');
const D = require('../definiciones');
const sesiones = require('./sesiones');
const { sembrar } = require('../../db/semilla');
const { fechaValida } = require('../validacion');
const { peticionInvalida } = require('../errores');

const FORMATO = 'pmbok8-gestor';
const CLAVE_PROVISIONAL = 'cambiar123';

/* colección del formato → definición */
const COLECCIONES = [
  ['usuarios', D.usuarios], ['permisos', D.permisos], ['portafolios', D.portafolios],
  ['programas', D.programas], ['proyectos', D.proyectos], ['miembros', D.miembros],
  ['procesos', D.procesosProyecto], ['documentos', D.documentos], ['archivos', D.archivos],
  ['riesgos', D.riesgos], ['interesados', D.interesados], ['cambios', D.cambios],
  ['lecciones', D.lecciones], ['tareas', D.tareas], ['sprints', D.sprints],
  ['mediciones', D.mediciones], ['comentarios', D.comentarios], ['rocas', D.rocas],
  ['metricas', D.metricas], ['asientos', D.asientos]
];

const TABLAS_DATOS = [
  'usuarios', 'sesiones', 'permisos', 'portafolios', 'programas', 'rocas', 'metricas', 'metrica_valores',
  'asientos', 'vto', 'proyectos', 'miembros', 'proyecto_procesos', 'documentos', 'archivos',
  'archivo_contenidos', 'riesgos', 'interesados', 'cambios', 'lecciones', 'sprints', 'sprint_burndown',
  'tareas', 'mediciones', 'comentarios', 'invitaciones'
];

async function vaciar(cx) {
  await db.consulta('TRUNCATE ' + TABLAS_DATOS.join(', ') + ' CASCADE', [], cx);
}

/* ══════════════ Exportar ══════════════ */

async function exportar() {
  const salida = { version: 1, formato: FORMATO, exportado: new Date().toISOString(), sesion: null };
  for (const [nombre, def] of COLECCIONES) {
    salida[nombre] = await repo.listar(def, {});
  }
  const vto = await db.varios('SELECT bloque_id, texto FROM vto ORDER BY bloque_id');
  salida.vto = {};
  vto.forEach((f) => { salida.vto[f.bloque_id] = f.texto; });
  return salida;
}

/* ══════════════ Saneadores ══════════════ */

const RE_ID = /^[A-Za-z0-9_.:-]{1,100}$/;
const esObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const txt = (x, max = 20000) => (x === null || x === undefined ? '' : String(x)).slice(0, max);
const requerido = (x, max) => { const s = txt(x, max).trim(); return s || null; };
const enumOr = (x, lista, def) => (lista.includes(x) ? x : def);
const ms = (x) => (typeof x === 'number' && isFinite(x) && x > 0 ? x : undefined);
const fecha = (x) => { const s = typeof x === 'string' ? x.slice(0, 10) : ''; return fechaValida(s) ? s : null; };
const num = (x) => { const n = Number(x); return x === null || x === '' || x === undefined || !isFinite(n) ? null : n; };
const noNeg = (x) => { const n = num(x); return n === null || n < 0 ? null : n; };
const escala = (x) => { const n = Math.round(Number(x)); return isFinite(n) ? Math.min(5, Math.max(1, n)) : 3; };
const idDe = (x) => (typeof x === 'string' && RE_ID.test(x) ? x : crypto.randomUUID());
const ref = (conjunto, x) => (typeof x === 'string' && conjunto.has(x) ? x : null);

/* ══════════════ Importar ══════════════ */

async function importar(datos, usuarioActual, sesionId) {
  if (!esObj(datos) || datos.formato !== FORMATO) {
    throw peticionInvalida('El archivo no es una exportación del gestor (formato «' + FORMATO + '»).');
  }
  for (const [nombre] of COLECCIONES) {
    if (datos[nombre] !== undefined && !Array.isArray(datos[nombre])) {
      throw peticionInvalida('La colección «' + nombre + '» debe ser una lista.');
    }
  }

  const c = catalogo.cargar();
  const lista = (nombre) => (datos[nombre] || []).filter(esObj);
  const importados = {};
  const omitidos = {};
  const avisos = [];
  const cuenta = (nombre, ok) => {
    const destino = ok ? importados : omitidos;
    destino[nombre] = (destino[nombre] || 0) + 1;
  };

  return db.transaccion(async (cx) => {
    const previos = await db.varios('SELECT id, correo, clave_hash, nombre, rol, debe_cambiar_clave, origen FROM usuarios', [], cx);
    const sesion = sesionId ? await db.uno('SELECT * FROM sesiones WHERE id = $1', [sesionId], cx) : null;
    const hashProvisional = await sesiones.hashear(CLAVE_PROVISIONAL);
    let restablecidas = 0;

    await vaciar(cx);

    /* ── Usuarios ── */
    const U = new Set();
    const correos = new Set();
    for (const u of lista('usuarios')) {
      const correo = txt(u.correo, 200).trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+$/.test(correo) || correos.has(correo)) { cuenta('usuarios', false); continue; }
      const id = idDe(u.id);
      if (U.has(id)) { cuenta('usuarios', false); continue; }
      const previo = previos.find((p) => p.id === id) || previos.find((p) => p.correo === correo);
      if (!previo) restablecidas++;
      /* La exportación no trae contraseñas: se conserva la de la cuenta
         que ya existía (mismo id o correo), con su obligación de cambiarla,
         o se asigna la provisional, que su dueño cambiará al entrar */
      await db.consulta(
        `INSERT INTO usuarios (id, correo, nombre, rol, activo, clave_hash, debe_cambiar_clave, creado, origen)
         VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, now()), $9)`,
        [id, correo, requerido(u.nombre, 200) || correo, enumOr(u.rol, D.E.roles, 'miembro'),
         u.activo !== false, previo ? previo.clave_hash : hashProvisional,
         previo ? previo.debe_cambiar_clave : true,
         ms(u.creado) ? new Date(u.creado) : null,
         previo ? previo.origen : 'importacion'], cx);
      U.add(id); correos.add(correo);
      cuenta('usuarios', true);
    }

    /* Quien importa no se queda fuera: si su cuenta no viene en el archivo, se conserva */
    const yo = previos.find((p) => p.id === usuarioActual.id);
    if (yo && !U.has(yo.id) && !correos.has(yo.correo)) {
      await db.consulta(
        "INSERT INTO usuarios (id, nombre, correo, clave_hash, rol, debe_cambiar_clave) VALUES ($1, $2, $3, $4, 'admin', $5)",
        [yo.id, yo.nombre, yo.correo, yo.clave_hash, yo.debe_cambiar_clave], cx);
      U.add(yo.id); correos.add(yo.correo);
      avisos.push('Tu cuenta no estaba en el archivo y se ha conservado como administrador.');
    }
    const hayAdmin = await db.uno("SELECT 1 FROM usuarios WHERE rol = 'admin' AND activo", [], cx);
    if (!hayAdmin && yo) {
      await db.consulta("UPDATE usuarios SET rol = 'admin', activo = true WHERE correo = $1", [yo.correo], cx);
      avisos.push('El archivo no tenía administradores activos: tu cuenta mantiene ese rol.');
    }
    if (restablecidas) {
      avisos.push(restablecidas + ' cuenta(s) nueva(s) reciben la contraseña provisional «' + CLAVE_PROVISIONAL + '».');
    }

    /* ── Portafolios y programas ── */
    const PF = new Set();
    for (const x of lista('portafolios')) {
      const nombre = requerido(x.nombre, 200);
      const id = idDe(x.id);
      if (!nombre || PF.has(id)) { cuenta('portafolios', false); continue; }
      await repo.insertarSimple(D.portafolios, { id, nombre, descripcion: txt(x.descripcion, 5000), creado: ms(x.creado) }, cx);
      PF.add(id); cuenta('portafolios', true);
    }
    const PG = new Map();
    for (const x of lista('programas')) {
      const nombre = requerido(x.nombre, 200);
      const id = idDe(x.id);
      const pf = ref(PF, x.portafolioId);
      if (!nombre || !pf || PG.has(id)) { cuenta('programas', false); continue; }
      await repo.insertarSimple(D.programas, { id, portafolioId: pf, nombre, descripcion: txt(x.descripcion, 5000), creado: ms(x.creado) }, cx);
      PG.set(id, pf); cuenta('programas', true);
    }

    /* ── EOS ── */
    const RO = new Set();
    for (const x of lista('rocas')) {
      const titulo = requerido(x.titulo, 500);
      const id = idDe(x.id);
      if (!titulo || !/^Q[1-4]-\d{4}$/.test(x.trimestre || '') || RO.has(id)) { cuenta('rocas', false); continue; }
      const metas = (Array.isArray(x.metas) ? x.metas : []).filter(esObj)
        .map((m) => ({ texto: txt(m.texto, 500).trim(), hecho: !!m.hecho })).filter((m) => m.texto).slice(0, 50);
      await repo.insertarSimple(D.rocas, {
        id, trimestre: x.trimestre, titulo, descripcion: txt(x.descripcion, 5000),
        responsableId: ref(U, x.responsableId), estado: enumOr(x.estado, D.E.estadosRoca, 'encamino'),
        metas, creado: ms(x.creado)
      }, cx);
      RO.add(id); cuenta('rocas', true);
    }

    const ME = new Set();
    for (const x of lista('metricas')) {
      const nombre = requerido(x.nombre, 300);
      const id = idDe(x.id);
      if (!nombre || ME.has(id)) { cuenta('metricas', false); continue; }
      await repo.insertarSimple(D.metricas, {
        id, nombre, meta: txt(x.meta, 100), responsableId: ref(U, x.responsableId),
        direccion: enumOr(x.direccion, D.E.direcciones, 'mayor'), creado: ms(x.creado)
      }, cx);
      for (const [semana, valor] of Object.entries(esObj(x.valores) ? x.valores : {})) {
        const v = txt(valor, 50).trim();
        if (v && semana.length <= 20) {
          await db.consulta('INSERT INTO metrica_valores (metrica_id, semana, valor) VALUES ($1, $2, $3)', [id, semana, v], cx);
        }
      }
      ME.add(id); cuenta('metricas', true);
    }

    /* Asientos: primero los padres; un padre inexistente deja el asiento en la raíz */
    const AS = new Set();
    let pendientes = lista('asientos').map((x) => ({ ...x, id: idDe(x.id) }));
    const idsAsiento = new Set(pendientes.map((x) => x.id));
    while (pendientes.length) {
      const listos = pendientes.filter((x) => !x.padreId || !idsAsiento.has(x.padreId) || AS.has(x.padreId));
      const tanda = listos.length ? listos : pendientes.map((x) => ({ ...x, padreId: null })); /* ciclos */
      for (const x of tanda) {
        const nombre = requerido(x.nombre, 200);
        if (!nombre || AS.has(x.id)) { cuenta('asientos', false); continue; }
        await repo.insertarSimple(D.asientos, {
          id: x.id, nombre, gwt: txt(x.gwt, 5000), personaId: ref(U, x.personaId),
          padreId: x.padreId && AS.has(x.padreId) ? x.padreId : null, creado: ms(x.creado)
        }, cx);
        AS.add(x.id); cuenta('asientos', true);
      }
      const hechos = new Set(tanda.map((x) => x.id));
      pendientes = pendientes.filter((x) => !hechos.has(x.id));
    }

    for (const [bloque, texto] of Object.entries(esObj(datos.vto) ? datos.vto : {})) {
      const t = txt(texto, 20000);
      if (t.trim() && bloque.length <= 100) {
        await db.consulta('INSERT INTO vto (bloque_id, texto) VALUES ($1, $2)', [bloque, t], cx);
      }
    }

    /* ── Proyectos ── */
    const PR = new Set();
    for (const x of lista('proyectos')) {
      const nombre = requerido(x.nombre, 200);
      const id = idDe(x.id);
      if (!nombre || PR.has(id)) { cuenta('proyectos', false); continue; }
      const metodologia = enumOr(x.metodologia, D.E.metodologias, 'predictivo');
      const programaId = PG.has(x.programaId) ? x.programaId : null;
      const inicio = fecha(x.inicio);
      let fin = fecha(x.fin);
      if (inicio && fin && fin < inicio) fin = null;
      const orden = {};
      Object.entries(esObj(x.orden) ? x.orden : {}).forEach(([k, b]) => {
        if (c.flujoPorId[k] && D.E.bandas.includes(b)) orden[k] = b;
      });
      const fases = (Array.isArray(x.fases) ? x.fases : []).filter(esObj)
        .map((f, i) => ({ id: idDe(f.id), nombre: txt(f.nombre, 200).trim(), orden: Number(f.orden) || i + 1 }))
        .filter((f) => f.nombre);
      const hitos = (Array.isArray(x.hitos) ? x.hitos : []).filter(esObj)
        .map((h) => ({ id: idDe(h.id), nombre: txt(h.nombre, 300).trim(), fecha: fecha(h.fecha), critico: !!h.critico }))
        .filter((h) => h.nombre);
      const moneda = typeof x.moneda === 'string' && /^[A-Za-z]{3}$/.test(x.moneda) ? x.moneda.toUpperCase() : 'USD';
      const wip = Math.round(Number(x.wip));

      await repo.insertarSimple(D.proyectos, {
        id, nombre, descripcion: txt(x.descripcion, 10000), metodologia,
        portafolioId: programaId ? PG.get(programaId) : ref(PF, x.portafolioId),
        programaId, rocaId: ref(RO, x.rocaId), inicio, fin,
        presupuesto: noNeg(x.presupuesto), moneda,
        estado: enumOr(x.estado, D.E.estadosProyecto, 'activo'),
        directorId: ref(U, x.directorId), wip: wip >= 1 ? wip : 3,
        fases: fases.length ? fases : catalogo.metodologia(metodologia).fases
          .map((n, i) => ({ id: crypto.randomUUID(), nombre: n, orden: i + 1 })),
        orden, hitos,
        dod: Array.isArray(x.dod) ? x.dod.map((d) => txt(d, 500)).filter((d) => d.trim()) : null,
        calidad: esObj(x.calidad) ? x.calidad : null,
        creado: ms(x.creado)
      }, cx);
      PR.add(id); cuenta('proyectos', true);
    }

    /* ── Pertenencias y permisos ── */
    const parMiembro = new Set();
    for (const x of lista('miembros')) {
      const p = ref(PR, x.proyectoId);
      const u = ref(U, x.usuarioId);
      if (!p || !u || parMiembro.has(p + '|' + u)) { cuenta('miembros', false); continue; }
      await repo.insertarSimple(D.miembros, {
        id: idDe(x.id), proyectoId: p, usuarioId: u, rol: enumOr(x.rol, D.E.rolesMiembro, 'equipo'), creado: ms(x.creado)
      }, cx);
      parMiembro.add(p + '|' + u); cuenta('miembros', true);
    }

    const ambitos = { portafolio: PF, programa: new Set(PG.keys()), proyecto: PR };
    const triosPermiso = new Set();
    for (const x of lista('permisos')) {
      const u = ref(U, x.usuarioId);
      const destino = ambitos[x.ambito];
      const clave = u + '|' + x.ambito + '|' + x.refId;
      if (!u || !destino || !destino.has(x.refId) || !D.E.nivelesPermiso.includes(x.nivel) || triosPermiso.has(clave)) {
        cuenta('permisos', false); continue;
      }
      await repo.insertarSimple(D.permisos, {
        id: idDe(x.id), usuarioId: u, ambito: x.ambito, refId: x.refId, nivel: x.nivel, creado: ms(x.creado)
      }, cx);
      triosPermiso.add(clave); cuenta('permisos', true);
    }

    /* ── Procesos y documentos ── */
    const parProceso = new Set();
    for (const x of lista('procesos')) {
      const p = ref(PR, x.proyectoId);
      if (!p || !c.flujoPorId[x.procesoId] || parProceso.has(p + '|' + x.procesoId)) { cuenta('procesos', false); continue; }
      await repo.insertarSimple(D.procesosProyecto, {
        id: idDe(x.id), proyectoId: p, procesoId: x.procesoId,
        estado: enumOr(x.estado, D.E.estadosProceso, 'pendiente'), notas: txt(x.notas, 20000),
        fecha: ms(x.fecha) || null, creado: ms(x.creado)
      }, cx);
      parProceso.add(p + '|' + x.procesoId); cuenta('procesos', true);
    }

    const parDoc = new Set();
    for (const x of lista('documentos')) {
      const p = ref(PR, x.proyectoId);
      const art = c.artefactosPorId[x.artefactoId];
      if (!p || !art || parDoc.has(p + '|' + x.artefactoId)) { cuenta('documentos', false); continue; }
      const version = Math.round(Number(x.version));
      await repo.insertarSimple(D.documentos, {
        id: idDe(x.id), proyectoId: p, artefactoId: x.artefactoId,
        nombre: requerido(x.nombre, 300) || art.nombre, categoria: txt(x.categoria || art.categoria, 80),
        version: version >= 1 ? version : 1, estado: enumOr(x.estado, D.E.estadosDocumento, 'borrador'),
        procesoId: c.flujoPorId[x.procesoId] ? x.procesoId : null,
        contenido: esObj(x.contenido) ? x.contenido : {},
        autorId: ref(U, x.autorId), aprobado: ms(x.aprobado) || null, creado: ms(x.creado)
      }, cx);
      parDoc.add(p + '|' + x.artefactoId); cuenta('documentos', true);
    }

    const archivosExport = lista('archivos').length;
    if (archivosExport) {
      omitidos.archivos = archivosExport;
      avisos.push(archivosExport + ' archivo(s) no se importan: su contenido vive en el navegador de origen y no viaja en la exportación. Súbelos de nuevo.');
    }

    /* ── Registros de dominio ── */
    const simples = [
      ['riesgos', D.riesgos, (x) => {
        const titulo = requerido(x.titulo, 1000);
        return titulo && {
          titulo, p: escala(x.p), i: escala(x.i),
          estrategia: enumOr(x.estrategia, D.E.estrategiasRiesgo, 'mitigar'), respuesta: txt(x.respuesta, 5000),
          responsableId: ref(U, x.responsableId), estado: requerido(x.estado, 40) || 'activo'
        };
      }],
      ['interesados', D.interesados, (x) => {
        const nombre = requerido(x.nombre, 300);
        return nombre && {
          nombre, rol: txt(x.rol, 300), poder: escala(x.poder), influencia: escala(x.influencia),
          actual: txt(x.actual, 100), deseado: txt(x.deseado, 100), estrategia: txt(x.estrategia, 5000)
        };
      }],
      ['cambios', D.cambios, (x) => {
        const titulo = requerido(x.titulo, 500);
        return titulo && {
          titulo, descripcion: txt(x.descripcion, 10000), solicitante: txt(x.solicitante, 300),
          impacto: txt(x.impacto, 5000), decision: enumOr(x.decision, D.E.decisiones, 'pendiente')
        };
      }],
      ['lecciones', D.lecciones, (x) => {
        const situacion = requerido(x.situacion, 5000);
        return situacion && {
          situacion, causa: txt(x.causa, 5000), recomendacion: txt(x.recomendacion, 5000), dominio: txt(x.dominio, 80)
        };
      }],
      ['mediciones', D.mediciones, (x) => ({
        fecha: fecha(x.fecha) || undefined,
        pv: noNeg(x.pv) || 0, ev: noNeg(x.ev) || 0, ac: noNeg(x.ac) || 0, nota: txt(x.nota, 2000)
      })],
      ['comentarios', D.comentarios, (x) => {
        const texto = requerido(x.texto, 10000);
        return texto && { texto, autorId: ref(U, x.autorId), refTipo: txt(x.refTipo, 40), refId: typeof x.refId === 'string' ? x.refId.slice(0, 100) : null };
      }]
    ];
    for (const [nombre, def, sanear] of simples) {
      const vistos = new Set();
      for (const x of lista(nombre)) {
        const p = ref(PR, x.proyectoId);
        const id = idDe(x.id);
        const limpio = p && !vistos.has(id) ? sanear(x) : null;
        if (!limpio) { cuenta(nombre, false); continue; }
        await repo.insertarSimple(def, { id, proyectoId: p, ...limpio, creado: ms(x.creado) }, cx);
        vistos.add(id); cuenta(nombre, true);
      }
    }

    /* ── Sprints: un solo activo por proyecto (el más reciente) ── */
    const SP = new Map();
    const sprintsOrdenados = lista('sprints').slice().sort((a, b) => (ms(b.creado) || 0) - (ms(a.creado) || 0));
    const conActivo = new Set();
    for (const x of sprintsOrdenados) {
      const p = ref(PR, x.proyectoId);
      const nombre = requerido(x.nombre, 200);
      const id = idDe(x.id);
      if (!p || !nombre || SP.has(id)) { cuenta('sprints', false); continue; }
      let estado = enumOr(x.estado, D.E.estadosSprint, 'cerrado');
      if (estado === 'activo') {
        if (conActivo.has(p)) { estado = 'cerrado'; avisos.push('El sprint «' + nombre + '» se importa cerrado: su proyecto ya tenía otro activo.'); }
        conActivo.add(p);
      }
      const dias = Math.round(Number(x.dias));
      await repo.insertarSimple(D.sprints, {
        id, proyectoId: p, nombre, objetivo: txt(x.objetivo, 2000),
        dias: dias >= 1 && dias <= 365 ? dias : 14, estado,
        comprometido: noNeg(x.comprometido) || 0, inicio: fecha(x.inicio), fin: fecha(x.fin),
        creado: ms(x.creado)
      }, cx);
      await db.consulta('UPDATE sprints SET entregado = $2, cierre = $3 WHERE id = $1',
        [id, noNeg(x.entregado) || 0, ms(x.cierre) ? new Date(x.cierre) : null], cx);
      for (const [dia, punto] of Object.entries(esObj(x.historial) ? x.historial : {})) {
        if (fechaValida(dia) && esObj(punto)) {
          await db.consulta('INSERT INTO sprint_burndown (sprint_id, fecha, restante, comprometido) VALUES ($1, $2, $3, $4)',
            [id, dia, noNeg(punto.restante) || 0, noNeg(punto.comprometido) || 0], cx);
        }
      }
      SP.set(id, p); cuenta('sprints', true);
    }

    const vistasT = new Set();
    for (const x of lista('tareas')) {
      const p = ref(PR, x.proyectoId);
      const titulo = requerido(x.titulo, 500);
      const id = idDe(x.id);
      if (!p || !titulo || vistasT.has(id)) { cuenta('tareas', false); continue; }
      const prioridad = Math.round(Number(x.prioridad));
      await repo.insertarSimple(D.tareas, {
        id, proyectoId: p, titulo,
        sprintId: SP.get(x.sprintId) === p ? x.sprintId : null,
        puntos: noNeg(x.puntos), fechaLimite: fecha(x.fechaLimite), responsableId: ref(U, x.responsableId),
        criterios: txt(x.criterios, 5000), estado: enumOr(x.estado, D.E.estadosTarea, 'backlog'),
        prioridad: isFinite(prioridad) && x.prioridad !== null && x.prioridad !== '' ? prioridad : null,
        creado: ms(x.creado)
      }, cx);
      vistasT.add(id); cuenta('tareas', true);
    }

    /* La sesión de quien importa sigue valiendo si su cuenta conserva el id */
    let sesionConservada = false;
    if (sesion && U.has(sesion.usuario_id)) {
      await db.consulta(
        'INSERT INTO sesiones (id, usuario_id, creada, expira, ip, agente) VALUES ($1, $2, $3, $4, $5, $6)',
        [sesion.id, sesion.usuario_id, sesion.creada, sesion.expira, sesion.ip, sesion.agente], cx);
      sesionConservada = true;
    }

    return { importados, omitidos, avisos, sesionConservada };
  });
}

/* ══════════════ Reiniciar ══════════════ */

async function reiniciar(sesionId) {
  return db.transaccion(async (cx) => {
    const sesion = sesionId ? await db.uno('SELECT * FROM sesiones WHERE id = $1', [sesionId], cx) : null;
    await vaciar(cx);
    await sembrar(cx);
    let sesionConservada = false;
    if (sesion && await db.uno('SELECT 1 FROM usuarios WHERE id = $1', [sesion.usuario_id], cx)) {
      await db.consulta('INSERT INTO sesiones (id, usuario_id, creada, expira) VALUES ($1, $2, $3, $4)',
        [sesion.id, sesion.usuario_id, sesion.creada, sesion.expira], cx);
      sesionConservada = true;
    }
    return { ok: true, sesionConservada };
  });
}

module.exports = { exportar, importar, reiniciar, FORMATO, CLAVE_PROVISIONAL };
