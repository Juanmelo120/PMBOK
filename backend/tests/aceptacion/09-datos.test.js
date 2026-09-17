/* HU-09 · Como administrador quiero exportar la base, importar lo que ya
   tenía guardado en el navegador y poder reiniciar todo. */

'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciar, ADMIN } = require('../ayuda');

const T0 = Date.UTC(2026, 0, 10, 15, 0, 0);

/* Una exportación tal como la genera assets/js/gestor.js (exportarTodo) */
function exportacionNavegador() {
  return {
    version: 1, creada: T0, formato: 'pmbok8-gestor', exportado: '2026-09-01T10:00:00.000Z', sesion: null,
    vto: { valores: 'Servicio', 'meta-10': 'Líder regional' },
    usuarios: [
      { id: 'u-admin', nombre: 'Administrador', correo: 'admin@pmbok.local', rol: 'admin', activo: true, creado: T0 },
      { id: 'usu-ana-1', nombre: 'Ana Pérez', correo: 'ANA@empresa.co', rol: 'director', activo: true, creado: T0 + 1 },
      { id: 'usu-leo-2', nombre: 'Leo', correo: 'ana@empresa.co', rol: 'miembro', activo: true, creado: T0 + 2 }
    ],
    portafolios: [{ id: 'por-1', nombre: 'Cartera 2026', descripcion: '', creado: T0 }],
    programas: [{ id: 'pro-1', portafolioId: 'por-1', nombre: 'Clientes', creado: T0 }],
    rocas: [{ id: 'roc-1', trimestre: 'Q3-2026', titulo: 'Portal', responsableId: 'usu-ana-1', estado: 'riesgo',
      metas: [{ texto: 'Beta', hecho: true }], creado: T0 }],
    metricas: [{ id: 'met-1', nombre: 'Ventas', meta: '≥ 10', responsableId: 'usu-ana-1', direccion: 'mayor',
      valores: { '2026-08-31': '12', '2026-09-07': '9' }, creado: T0 }],
    asientos: [
      { id: 'asi-hijo', nombre: 'Integrador', gwt: '', personaId: 'usu-ana-1', padreId: 'asi-raiz', creado: T0 },
      { id: 'asi-raiz', nombre: 'Visionario', gwt: '', personaId: null, padreId: null, creado: T0 }
    ],
    proyectos: [{
      id: 'pro-lx1-1', nombre: 'Portal clientes', descripcion: 'Desde el navegador', metodologia: 'agil',
      portafolioId: 'por-1', programaId: 'pro-1', rocaId: 'roc-1', inicio: '2026-07-01', fin: '2026-12-15',
      presupuesto: 50000, moneda: 'USD', estado: 'activo', directorId: 'usu-ana-1',
      fases: [{ id: 'fase-a', nombre: 'Sprint 0', orden: 1 }], orden: { 'p-rie-02': 'ejecucion', 'p-falso': 'cierre' },
      hitos: [{ id: 'hito-1', nombre: 'Beta', fecha: '2026-09-30', critico: true }],
      dod: ['Probado'], calidad: { campos: { s1: { c1: 'texto' } }, historial: [] },
      wip: 4, creado: T0, actualizado: T0 + 5000
    }],
    miembros: [
      { id: 'mie-1', proyectoId: 'pro-lx1-1', usuarioId: 'usu-ana-1', rol: 'lider', creado: T0 },
      { id: 'mie-2', proyectoId: 'pro-lx1-1', usuarioId: 'usu-fantasma', rol: 'equipo', creado: T0 }
    ],
    permisos: [{ id: 'per-1', usuarioId: 'usu-ana-1', ambito: 'portafolio', refId: 'por-1', nivel: 'dirigir', creado: T0 }],
    procesos: [
      { id: 'pro-e1', proyectoId: 'pro-lx1-1', procesoId: 'p-gob-01', estado: 'completado', notas: 'ok', fecha: T0 },
      { id: 'pro-e2', proyectoId: 'pro-lx1-1', procesoId: 'p-int-01', estado: 'iniciado', notas: '', fecha: T0 }
    ],
    documentos: [
      { id: 'doc-1', proyectoId: 'pro-lx1-1', artefactoId: 'art-acta-proyecto', nombre: 'Acta de Constitución del Proyecto',
        categoria: 'gobernanza', version: 2, estado: 'aprobado', procesoId: 'p-gob-01',
        contenido: { 0: 'Propósito', 4: [['Beta', '2026-09-30', 'Demo']] }, autorId: 'usu-ana-1', aprobado: T0 + 10, creado: T0 },
      { id: 'doc-2', proyectoId: 'pro-lx1-1', artefactoId: 'art-que-no-existe', nombre: 'X', contenido: {}, creado: T0 }
    ],
    archivos: [{ id: 'arc-1', proyectoId: 'pro-lx1-1', nombre: 'foto.png', tipo: 'image/png', tamano: 10, almacen: 'idb' }],
    riesgos: [
      { id: 'rie-1', proyectoId: 'pro-lx1-1', titulo: 'Proveedor', p: 4, i: 5, estrategia: 'transferir', respuesta: 'Seguro',
        responsableId: 'usu-ana-1', estado: 'activo', creado: T0 },
      { id: 'rie-2', proyectoId: 'pro-borrado', titulo: 'Huérfano', p: 1, i: 1, creado: T0 }
    ],
    interesados: [{ id: 'int-1', proyectoId: 'pro-lx1-1', nombre: 'Gerencia', rol: 'Patrocinio', poder: 5, influencia: 5, creado: T0 }],
    cambios: [{ id: 'cam-1', proyectoId: 'pro-lx1-1', titulo: 'Chat', decision: 'aprobado', creado: T0 }],
    lecciones: [{ id: 'lec-1', proyectoId: 'pro-lx1-1', situacion: 'Demora', causa: 'x', recomendacion: 'y', dominio: 'riesgos', creado: T0 }],
    sprints: [
      { id: 'spr-0', proyectoId: 'pro-lx1-1', nombre: 'Sprint 0', objetivo: '', dias: 14, estado: 'activo',
        comprometido: 0, entregado: 0, creado: T0, historial: {} },
      { id: 'spr-1', proyectoId: 'pro-lx1-1', nombre: 'Sprint 1', objetivo: 'Login', dias: 10, estado: 'activo',
        comprometido: 13, entregado: 0, inicio: '2026-09-01', creado: T0 + 100,
        historial: { '2026-09-01': { restante: 13, comprometido: 13 }, '2026-09-02': { restante: 8, comprometido: 13 } } }
    ],
    tareas: [
      { id: 'tar-1', proyectoId: 'pro-lx1-1', titulo: 'Login', puntos: 5, estado: 'hecho', sprintId: 'spr-1', prioridad: 1, creado: T0 },
      { id: 'tar-2', proyectoId: 'pro-lx1-1', titulo: 'Registro', puntos: 8, estado: 'curso', sprintId: 'spr-1',
        responsableId: 'usu-ana-1', fechaLimite: '2026-09-10', prioridad: 2, creado: T0 },
      { id: 'tar-3', proyectoId: 'pro-lx1-1', titulo: 'Sprint inexistente', puntos: 1, estado: 'backlog', sprintId: 'spr-x', prioridad: 3, creado: T0 }
    ],
    mediciones: [
      { id: 'med-1', proyectoId: 'pro-lx1-1', fecha: '2026-08-31', pv: 10000, ev: 9000, ac: 12000, nota: '', creado: T0 }
    ],
    comentarios: []
  };
}

describe('HU-09 Exportar, importar y reiniciar', () => {
  let e;
  before(async () => { e = await iniciar(); });
  after(async () => { await e.cerrar(); });

  it('CA-01 solo el administrador exporta, y la exportación no lleva contraseñas', async () => {
    const d = await e.crearUsuario('director');
    await d.post('/api/proyectos', { nombre: 'Exportable', metodologia: 'agil' });
    assert.equal((await d.get('/api/datos/exportar')).estado, 403);

    const r = await e.admin.get('/api/datos/exportar');
    assert.equal(r.estado, 200);
    assert.match(r.cabeceras.get('content-disposition'), /pmbok8-gestor\.json/);
    assert.equal(r.datos.formato, 'pmbok8-gestor');
    for (const c of ['usuarios', 'permisos', 'portafolios', 'programas', 'proyectos', 'miembros', 'procesos',
      'documentos', 'archivos', 'riesgos', 'interesados', 'cambios', 'lecciones', 'tareas', 'sprints',
      'mediciones', 'comentarios', 'rocas', 'metricas', 'asientos']) {
      assert.ok(Array.isArray(r.datos[c]), 'falta la colección ' + c);
    }
    assert.equal(r.datos.proyectos.length, 1);
    assert.deepEqual(r.datos.sprints[0].historial, {});
    assert.ok(!/clave|\$2[aby]\$/.test(JSON.stringify(r.datos.usuarios)));
  });

  it('CA-02 lo guardado en el navegador se importa saneado a PostgreSQL', async () => {
    const r = await e.admin.post('/api/datos/importar', exportacionNavegador());
    assert.equal(r.estado, 200, JSON.stringify(r.datos));
    const { importados, omitidos, avisos } = r.datos;

    assert.deepEqual(importados, {
      usuarios: 2, portafolios: 1, programas: 1, rocas: 1, metricas: 1, asientos: 2, proyectos: 1,
      miembros: 1, permisos: 1, procesos: 2, documentos: 1, riesgos: 1, interesados: 1, cambios: 1,
      lecciones: 1, mediciones: 1, sprints: 2, tareas: 3
    });
    assert.deepEqual(omitidos, { usuarios: 1, miembros: 1, documentos: 1, archivos: 1, riesgos: 1 });
    assert.ok(avisos.some((a) => /archivo/.test(a)));
    assert.ok(avisos.some((a) => /cambiar123/.test(a)));
    assert.ok(avisos.some((a) => /Sprint 0/.test(a)), 'dos sprints activos: uno se cierra');
    assert.equal(r.datos.sesionConservada, true, 'quien importa sigue dentro');
    assert.equal((await e.admin.get('/api/auth/yo')).estado, 200);
  });

  it('CA-03 las contraseñas: se conservan las existentes y las nuevas reciben una provisional que hay que cambiar', async () => {
    const admin = await e.anonimo.post('/api/auth/entrar', ADMIN);
    assert.equal(admin.estado, 200);
    assert.equal(admin.datos.usuario.debeCambiarClave, false, 'la cuenta existente conserva su estado');

    const ana = await e.entrar('ana@empresa.co', 'cambiar123');
    assert.equal(ana.usuario.id, 'usu-ana-1');
    assert.equal(ana.usuario.nombre, 'Ana Pérez');
    assert.equal(ana.usuario.debeCambiarClave, true);
    const bloqueada = await ana.get('/api/proyectos/pro-lx1-1');
    assert.equal(bloqueada.estado, 403);
    assert.equal(bloqueada.datos.codigo, 'CLAVE_PENDIENTE');
    assert.equal((await ana.put('/api/auth/clave', { actual: 'cambiar123', nueva: 'ana-segura-1' })).estado, 200);
    assert.equal((await ana.get('/api/proyectos/pro-lx1-1')).estado, 200);
  });

  it('CA-04 el proyecto importado conserva estructura, cálculo y relaciones', async () => {
    const ana = await e.entrar('ana@empresa.co', 'ana-segura-1');
    const p = (await ana.get('/api/proyectos/pro-lx1-1')).datos;
    assert.equal(p.nivel, 3);
    assert.equal(p.creado, T0);
    assert.equal(p.portafolioId, 'por-1');
    assert.equal(p.programaId, 'pro-1');
    assert.equal(p.rocaId, 'roc-1');
    assert.deepEqual(p.orden, { 'p-rie-02': 'ejecucion' }, 'se descartan procesos desconocidos');
    assert.deepEqual(p.hitos, [{ id: 'hito-1', nombre: 'Beta', fecha: '2026-09-30', critico: true }]);
    assert.deepEqual(p.calidad, { campos: { s1: { c1: 'texto' } }, historial: [] });
    assert.equal(p.wip, 4);
    assert.equal(p.siguiente.procesoId, 'p-int-01', 'respeta el proceso que estaba en curso');
    assert.deepEqual(p.progreso, { completados: 1, omitidos: 0, total: 40, aplicables: 40, porcentaje: 3 });

    const doc = (await ana.get('/api/documentos/doc-1')).datos;
    assert.equal(doc.version, 2);
    assert.equal(doc.estado, 'aprobado');
    assert.equal(doc.aprobado, T0 + 10);
    assert.equal(doc.completitud, 22);

    const sprints = (await ana.get('/api/proyectos/pro-lx1-1/sprints')).datos;
    const activos = sprints.filter((s) => s.estado === 'activo');
    assert.deepEqual(activos.map((s) => s.id), ['spr-1'], 'queda activo el más reciente');
    const s1 = sprints.find((s) => s.id === 'spr-1');
    assert.deepEqual(s1.historial['2026-09-02'], { restante: 8, comprometido: 13 });
    const b = (await ana.get('/api/sprints/spr-1/burndown')).datos;
    assert.deepEqual(b.real.slice(0, 3), [13, 8, null]);

    const tareas = (await ana.get('/api/proyectos/pro-lx1-1/tareas')).datos;
    assert.equal(tareas.find((t) => t.id === 'tar-3').sprintId, null, 'sprint inexistente → backlog');
    assert.equal(tareas.find((t) => t.id === 'tar-2').responsableId, 'usu-ana-1');

    const evm = (await ana.get('/api/proyectos/pro-lx1-1/evm')).datos;
    assert.equal(evm.ultima.cpi, 0.75);
    assert.equal((await ana.get('/api/proyectos/pro-lx1-1/salud')).datos.estado, 'falla');

    const riesgo = (await ana.get('/api/riesgos/rie-1')).datos;
    assert.equal(riesgo.severidad.nivel, 'critico');
    assert.deepEqual((await ana.get('/api/metricas/met-1')).datos.valores, { '2026-08-31': '12', '2026-09-07': '9' });
    assert.equal((await ana.get('/api/asientos/asi-hijo')).datos.padreId, 'asi-raiz', 'el hijo listado antes que el padre conserva su jerarquía');
    assert.deepEqual((await ana.get('/api/vto')).datos, { 'meta-10': 'Líder regional', valores: 'Servicio' });
    assert.equal((await ana.get('/api/rocas/roc-1')).datos.metas[0].hecho, true);
  });

  it('CA-05 exportar, reiniciar e importar de nuevo reproduce los mismos datos', async () => {
    const antes = (await e.admin.get('/api/datos/exportar')).datos;
    const reinicio = await e.admin.post('/api/datos/reiniciar', { confirmacion: 'eliminar' });
    assert.equal(reinicio.estado, 200);
    assert.equal(reinicio.datos.sesionConservada, true);

    /* Tras reiniciar vuelve la contraseña inicial, así que hay que cambiarla otra vez */
    const pendiente = await e.admin.get('/api/proyectos');
    assert.equal(pendiente.estado, 403);
    assert.equal(pendiente.datos.codigo, 'CLAVE_PENDIENTE');
    assert.equal((await e.admin.put('/api/auth/clave', { actual: ADMIN.clave, nueva: 'admin-nueva-1' })).estado, 200);
    assert.deepEqual((await e.admin.get('/api/proyectos')).datos, []);

    const imp = await e.admin.post('/api/datos/importar', antes);
    assert.equal(imp.estado, 200);
    const despues = (await e.admin.get('/api/datos/exportar')).datos;

    const sinMarcas = (lista) => lista.map((x) => {
      const c = { ...x };
      delete c.actualizado;
      delete c.debeCambiarClave;
      return c;
    });
    for (const c of ['usuarios', 'proyectos', 'procesos', 'documentos', 'riesgos', 'tareas', 'sprints', 'metricas', 'asientos', 'permisos', 'miembros', 'rocas']) {
      assert.deepEqual(sinMarcas(despues[c]), sinMarcas(antes[c]), 'difiere la colección ' + c);
    }
    assert.deepEqual(despues.vto, antes.vto);
  });

  it('CA-06 se rechazan archivos que no son exportaciones del gestor', async () => {
    const a = await e.admin.post('/api/datos/importar', { formato: 'otro', proyectos: [] });
    assert.equal(a.estado, 400);
    assert.match(a.datos.error, /no es una exportación/);
    const b = await e.admin.post('/api/datos/importar', { formato: 'pmbok8-gestor', proyectos: 'muchos' });
    assert.equal(b.estado, 400);
    assert.match(b.datos.error, /proyectos/);
    assert.equal((await e.admin.post('/api/datos/importar', [1, 2])).estado, 400);
    assert.equal((await e.admin.get('/api/proyectos')).datos.length, 1, 'un rechazo no toca los datos');
  });

  it('CA-07 reiniciar exige escribir ELIMINAR y deja solo la cuenta inicial', async () => {
    assert.equal((await e.admin.post('/api/datos/reiniciar', {})).estado, 400);
    assert.equal((await e.admin.post('/api/datos/reiniciar', { confirmacion: 'si' })).estado, 400);
    /* Tras el reinicio y la reimportación de CA-05, Ana vuelve a ser una cuenta nueva */
    const ana = await e.entrar('ana@empresa.co', 'cambiar123');
    assert.equal((await ana.put('/api/auth/clave', { actual: 'cambiar123', nueva: 'ana-segura-2' })).estado, 200);
    const intento = await ana.post('/api/datos/reiniciar', { confirmacion: 'ELIMINAR' });
    assert.equal(intento.estado, 403);
    assert.equal(intento.datos.codigo, 'PROHIBIDO', 'rechazada por su rol, no por la contraseña');

    const r = await e.admin.post('/api/datos/reiniciar', { confirmacion: 'ELIMINAR' });
    assert.equal(r.estado, 200);
    const yo = (await e.admin.get('/api/auth/yo')).datos.usuario;
    assert.equal(yo.debeCambiarClave, true, 'la cuenta inicial vuelve con su contraseña por defecto');
    await e.yaCambioSuClave('u-admin');
    const usuarios = (await e.admin.get('/api/usuarios')).datos;
    assert.deepEqual(usuarios.map((u) => u.correo), ['admin@pmbok.local']);
    assert.equal((await ana.get('/api/auth/yo')).estado, 401);
    const cat = await e.db.uno('SELECT count(*) AS n FROM catalogo_procesos');
    assert.equal(cat.n, 40, 'el catálogo no se borra');
  });
});
