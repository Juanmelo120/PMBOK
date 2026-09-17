/* HU-03 · Como director quiero crear y configurar proyectos con su
   metodología, portafolio y fechas, y que solo los vea quien debe. */

'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciar } = require('../ayuda');

describe('HU-03 Proyectos', () => {
  let e;
  let dir;
  before(async () => {
    e = await iniciar();
    dir = await e.crearUsuario('director', 'Dana Directora');
  });
  after(async () => { await e.cerrar(); });

  it('CA-01 un proyecto ágil nace con sus fases, su líder y el Sprint 0 activo', async () => {
    const r = await dir.post('/api/proyectos', {
      nombre: '  Portal de clientes ', descripcion: 'Autoservicio', metodologia: 'agil',
      inicio: '2026-10-01', fin: '2027-03-31', presupuesto: '150000', moneda: 'cop'
    });
    assert.equal(r.estado, 201);
    const p = r.datos;
    assert.equal(p.nombre, 'Portal de clientes');
    assert.equal(p.directorId, dir.usuario.id);
    assert.equal(p.presupuesto, 150000);
    assert.equal(p.moneda, 'COP');
    assert.equal(p.estado, 'activo');
    assert.equal(p.nivel, 3);
    assert.deepEqual(p.fases.map((f) => f.nombre),
      ['Sprint 0 — Preparación', 'Sprints de desarrollo (iterativos)', 'Release']);
    assert.deepEqual(p.progreso, { completados: 0, omitidos: 0, total: 40, aplicables: 40, porcentaje: 0 });
    assert.equal(typeof p.creado, 'number');

    const miembros = (await dir.get('/api/proyectos/' + p.id + '/miembros')).datos;
    assert.equal(miembros.length, 1);
    assert.equal(miembros[0].rol, 'lider');
    const activo = (await dir.get('/api/proyectos/' + p.id + '/sprint-activo')).datos.sprint;
    assert.equal(activo.nombre, 'Sprint 0 — Preparación');
    assert.equal(activo.estado, 'activo');
  });

  it('CA-02 un proyecto predictivo tiene cuatro fases y ningún sprint', async () => {
    const p = (await dir.post('/api/proyectos', { nombre: 'Sede nueva' })).datos;
    assert.equal(p.metodologia, 'predictivo');
    assert.deepEqual(p.fases.map((f) => f.nombre), ['Inicio', 'Planificación', 'Ejecución', 'Cierre']);
    assert.deepEqual((await dir.get('/api/proyectos/' + p.id + '/sprints')).datos, []);
  });

  it('CA-03 se rechazan datos inválidos con un mensaje que nombra el campo', async () => {
    const casos = [
      [{ descripcion: 'sin nombre' }, /nombre/],
      [{ nombre: '   ' }, /nombre/],
      [{ nombre: 'X', metodologia: 'cascada' }, /metodologia/],
      [{ nombre: 'X', inicio: '2026-05-01', fin: '2026-04-01' }, /fin no puede ser anterior/],
      [{ nombre: 'X', presupuesto: -5 }, /presupuesto/],
      [{ nombre: 'X', moneda: 'US' }, /moneda/],
      [{ nombre: 'X', inicio: '2026-02-30' }, /inicio/],
      [{ nombre: 'X', portafolioId: 'no-existe' }, /portafolioId/]
    ];
    for (const [cuerpo, patron] of casos) {
      const r = await dir.post('/api/proyectos', cuerpo);
      assert.equal(r.estado, 400, JSON.stringify(cuerpo));
      assert.match(r.datos.error, patron, JSON.stringify(cuerpo));
    }
  });

  it('CA-04 miembros y ejecutores no crean proyectos', async () => {
    for (const rol of ['miembro', 'ejecutor']) {
      const u = await e.crearUsuario(rol);
      assert.equal((await u.post('/api/proyectos', { nombre: 'Intento' })).estado, 403);
    }
  });

  it('CA-05 el programa determina el portafolio y deben ser coherentes', async () => {
    const pf1 = (await dir.post('/api/portafolios', { nombre: 'Cartera A' })).datos;
    const pf2 = (await dir.post('/api/portafolios', { nombre: 'Cartera B' })).datos;
    const prog = (await dir.post('/api/portafolios/' + pf1.id + '/programas', { nombre: 'Nómina' })).datos;

    const p = await dir.post('/api/proyectos', { nombre: 'Liquidación', programaId: prog.id });
    assert.equal(p.estado, 201);
    assert.equal(p.datos.portafolioId, pf1.id, 'el portafolio se deduce del programa');

    const mal = await dir.post('/api/proyectos', { nombre: 'Cruzado', programaId: prog.id, portafolioId: pf2.id });
    assert.equal(mal.estado, 400);
    assert.match(mal.datos.error, /no pertenece/);

    const incoherente = await dir.patch('/api/proyectos/' + p.datos.id, { portafolioId: pf2.id, programaId: prog.id });
    assert.equal(incoherente.estado, 400, 'no puede quedar en un programa de otro portafolio');
    const mover = await dir.patch('/api/proyectos/' + p.datos.id, { portafolioId: pf2.id });
    assert.equal(mover.estado, 200, 'mover de portafolio desde la fila lo saca de su programa');
    assert.equal(mover.datos.portafolioId, pf2.id);
    assert.equal(mover.datos.programaId, null);
  });

  it('CA-06 un miembro del equipo edita hitos y DoD, pero la configuración es del líder', async () => {
    const p = (await dir.post('/api/proyectos', { nombre: 'App móvil', metodologia: 'agil' })).datos;
    const m = await e.crearUsuario('miembro');
    const alta = await dir.post('/api/proyectos/' + p.id + '/miembros', { usuarioId: m.usuario.id, rol: 'equipo' });
    assert.equal(alta.estado, 201);

    const hitos = await m.patch('/api/proyectos/' + p.id, {
      hitos: [{ nombre: 'Beta', fecha: '2026-12-01', critico: true }, { nombre: 'Lanzamiento', fecha: '' }],
      dod: ['Probado', 'Revisado']
    });
    assert.equal(hitos.estado, 200);
    assert.equal(hitos.datos.nivel, 2);
    assert.equal(hitos.datos.hitos.length, 2);
    assert.ok(hitos.datos.hitos.every((h) => h.id), 'cada hito recibe identificador');
    assert.equal(hitos.datos.hitos[1].fecha, null);
    assert.deepEqual(hitos.datos.dod, ['Probado', 'Revisado']);

    for (const cambio of [{ nombre: 'Otro' }, { estado: 'pausa' }, { presupuesto: 1 }, { hitos: [], nombre: 'Mixto' }]) {
      assert.equal((await m.patch('/api/proyectos/' + p.id, cambio)).estado, 403, JSON.stringify(cambio));
    }
    const lider = await dir.patch('/api/proyectos/' + p.id, { estado: 'pausa', wip: 5 });
    assert.equal(lider.estado, 200);
    assert.equal(lider.datos.estado, 'pausa');
    assert.equal(lider.datos.wip, 5);
    assert.equal((await dir.patch('/api/proyectos/' + p.id, { estado: 'olvidado' })).estado, 400);
  });

  it('CA-07 cambiar de metodología rehace las fases y devuelve el flujo a su orden original', async () => {
    const p = (await dir.post('/api/proyectos', { nombre: 'Migración' })).datos;
    await dir.put('/api/proyectos/' + p.id + '/procesos/p-gob-01/banda', { banda: 'cierre' });
    assert.deepEqual((await dir.get('/api/proyectos/' + p.id)).datos.orden, { 'p-gob-01': 'cierre' });

    const r = await dir.patch('/api/proyectos/' + p.id, { metodologia: 'kanban' });
    assert.equal(r.estado, 200);
    assert.deepEqual(r.datos.fases.map((f) => f.nombre), ['Preparación', 'Flujo continuo', 'Cierre']);
    assert.deepEqual(r.datos.orden, {});

    const fases = await dir.patch('/api/proyectos/' + p.id, { fases: [...r.datos.fases, { nombre: 'Estabilización' }] });
    assert.equal(fases.datos.fases.length, 4);
    assert.equal(fases.datos.fases[3].orden, 4);
  });

  it('CA-08 un usuario ajeno recibe 404 en lectura, edición y borrado', async () => {
    const p = (await dir.post('/api/proyectos', { nombre: 'Confidencial' })).datos;
    const ajeno = await e.crearUsuario('director');
    assert.equal((await ajeno.get('/api/proyectos/' + p.id)).estado, 404);
    assert.equal((await ajeno.patch('/api/proyectos/' + p.id, { nombre: 'Mío' })).estado, 404);
    assert.equal((await ajeno.del('/api/proyectos/' + p.id)).estado, 404);
    assert.equal((await ajeno.get('/api/proyectos/' + p.id + '/riesgos')).estado, 404);
    assert.ok(!(await ajeno.get('/api/proyectos')).datos.some((x) => x.id === p.id));
    assert.equal((await e.admin.get('/api/proyectos/' + p.id)).datos.nivel, 3, 'el administrador lo ve todo');
  });

  it('CA-09 borrar un proyecto elimina en cascada todo lo que contiene', async () => {
    const p = (await dir.post('/api/proyectos', { nombre: 'Efímero', metodologia: 'agil' })).datos;
    const base = '/api/proyectos/' + p.id;
    await dir.post(base + '/riesgos', { titulo: 'R' });
    await dir.post(base + '/tareas', { titulo: 'T', puntos: 3 });
    await dir.post(base + '/mediciones', { pv: 1, ev: 1, ac: 1 });
    await dir.post(base + '/documentos', { artefactoId: 'art-acta-proyecto' });
    await dir.put(base + '/procesos/p-gob-01', { estado: 'completado' });

    const m = await e.crearUsuario('miembro');
    await dir.post(base + '/miembros', { usuarioId: m.usuario.id });
    assert.equal((await m.del(base)).estado, 403, 'un miembro no borra el proyecto');

    assert.equal((await dir.del(base)).estado, 204);
    assert.equal((await dir.get(base)).estado, 404);
    const tablas = ['riesgos', 'tareas', 'mediciones', 'documentos', 'proyecto_procesos', 'sprints', 'miembros'];
    for (const t of tablas) {
      const n = await e.db.uno('SELECT count(*) AS n FROM ' + t + ' WHERE proyecto_id = $1', [p.id]);
      assert.equal(n.n, 0, 'quedaron filas en ' + t);
    }
  });

  it('CA-10 el panel y la agenda global solo cuentan lo visible para cada usuario', async () => {
    const nuevo = await e.crearUsuario('director');
    const vacio = await nuevo.get('/api/panel');
    assert.equal(vacio.estado, 200);
    assert.equal(vacio.datos.cifras.proyectos, 0);

    const p = (await nuevo.post('/api/proyectos', { nombre: 'Único', inicio: '2026-11-02', fin: '2026-12-20' })).datos;
    const panel = (await nuevo.get('/api/panel')).datos;
    assert.equal(panel.cifras.proyectos, 1);
    assert.equal(panel.cifras.activos, 1);
    assert.equal(panel.siguientes[0].proyectoId, p.id);
    assert.equal(panel.siguientes[0].siguiente.codigo, '2.1.1');

    const agenda = (await nuevo.get('/api/calendario')).datos;
    assert.deepEqual(agenda.map((x) => x.fecha), ['2026-11-02', '2026-12-20']);
    assert.ok(agenda.every((x) => x.ref === p.id));
    assert.ok((await e.admin.get('/api/panel')).datos.cifras.proyectos > 1);
  });
});
