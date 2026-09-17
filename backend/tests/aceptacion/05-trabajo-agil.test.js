/* HU-05 · Como equipo Scrum queremos un backlog, sprints con un único
   activo, un burndown real registrado cada día y la velocidad. */

'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciar, hoyBd } = require('../ayuda');

describe('HU-05 Trabajo ágil: backlog, sprints y burndown', () => {
  let e;
  let dir;
  let p;
  let base;
  let sprint0;
  const t = {};
  before(async () => {
    e = await iniciar();
    dir = await e.crearUsuario('director');
    p = (await dir.post('/api/proyectos', { nombre: 'Tienda online', metodologia: 'agil' })).datos;
    base = '/api/proyectos/' + p.id;
    sprint0 = (await dir.get(base + '/sprint-activo')).datos.sprint;
  });
  after(async () => { await e.cerrar(); });

  it('CA-01 el backlog recibe elementos con prioridad creciente y datos validados', async () => {
    for (const [clave, puntos] of [['carrito', 5], ['pago', 8], ['login', 3], ['buscador', 2]]) {
      const r = await dir.post(base + '/tareas', { titulo: 'Historia ' + clave, puntos, criterios: 'Dado… cuando… entonces…' });
      assert.equal(r.estado, 201);
      assert.equal(r.datos.estado, 'backlog');
      assert.equal(r.datos.sprintId, null);
      t[clave] = r.datos;
    }
    assert.deepEqual([t.carrito, t.pago, t.login, t.buscador].map((x) => x.prioridad), [1, 2, 3, 4]);
    assert.equal((await dir.post(base + '/tareas', { titulo: 'X', puntos: -1 })).estado, 400);
    assert.equal((await dir.post(base + '/tareas', { titulo: '' })).estado, 400);
    assert.equal((await dir.post(base + '/tareas', { titulo: 'X', estado: 'bloqueada' })).estado, 400);
    assert.equal((await dir.post(base + '/tareas', { titulo: 'X', fechaLimite: '31/12/2026' })).estado, 400);
    const lista = (await dir.get(base + '/tareas')).datos;
    assert.deepEqual(lista.map((x) => x.id), [t.carrito.id, t.pago.id, t.login.id, t.buscador.id]);
  });

  it('CA-02 comprometer trabajo al sprint registra la fotografía del día', async () => {
    const hoy = await hoyBd();
    for (const k of ['carrito', 'pago', 'login']) {
      const r = await dir.patch('/api/tareas/' + t[k].id, { sprintId: sprint0.id, estado: 'pendiente' });
      assert.equal(r.estado, 200);
    }
    const s = (await dir.get('/api/sprints/' + sprint0.id)).datos;
    assert.equal(s.inicio, hoy, 'el sprint empieza el día que se le compromete trabajo');
    assert.equal(s.comprometido, 16);
    assert.deepEqual(s.historial[hoy], { restante: 16, comprometido: 16 });
  });

  it('CA-03 al terminar una historia baja lo restante del día', async () => {
    const hoy = await hoyBd();
    await dir.patch('/api/tareas/' + t.pago.id, { estado: 'curso' });
    await dir.patch('/api/tareas/' + t.pago.id, { estado: 'hecho' });
    const s = (await dir.get('/api/sprints/' + sprint0.id)).datos;
    assert.deepEqual(s.historial[hoy], { restante: 8, comprometido: 16 });
    assert.equal(Object.keys(s.historial).length, 1, 'una sola fotografía por día');
  });

  it('CA-04 el burndown compara la línea ideal con la real día a día', async () => {
    const hoy = await hoyBd();
    const b = (await dir.get('/api/sprints/' + sprint0.id + '/burndown')).datos;
    assert.equal(b.puntos.length, 15, '14 días + el día 0');
    assert.equal(b.puntos[0], hoy);
    assert.equal(b.ideal[0], 16);
    assert.equal(b.ideal[14], 0);
    assert.equal(b.real[0], 8);
    assert.ok(b.real.slice(1).every((x) => x === null));
    const foto = await dir.post('/api/sprints/' + sprint0.id + '/burndown');
    assert.equal(foto.estado, 200);
    assert.equal(foto.datos.real[0], 8);
  });

  it('CA-05 borrar una historia del sprint también actualiza el burndown', async () => {
    const hoy = await hoyBd();
    const extra = (await dir.post(base + '/tareas', { titulo: 'Extra', puntos: 4, sprintId: sprint0.id, estado: 'pendiente' })).datos;
    assert.equal((await dir.get('/api/sprints/' + sprint0.id)).datos.historial[hoy].restante, 12);
    assert.equal((await dir.del('/api/tareas/' + extra.id)).estado, 204);
    assert.equal((await dir.get('/api/sprints/' + sprint0.id)).datos.historial[hoy].restante, 8);
  });

  it('CA-06 cerrar el sprint suma lo entregado y devuelve lo pendiente al backlog', async () => {
    const r = await dir.post('/api/sprints/' + sprint0.id + '/cerrar');
    assert.equal(r.estado, 200);
    assert.equal(r.datos.entregado, 8);
    assert.equal(r.datos.devueltas, 2);
    assert.equal(r.datos.sprint.estado, 'cerrado');
    assert.equal(typeof r.datos.sprint.cierre, 'number');

    const tareas = (await dir.get(base + '/tareas')).datos;
    const porId = Object.fromEntries(tareas.map((x) => [x.id, x]));
    assert.equal(porId[t.pago.id].estado, 'hecho');
    assert.equal(porId[t.pago.id].sprintId, sprint0.id, 'lo hecho se queda en su sprint');
    for (const k of ['carrito', 'login']) {
      assert.equal(porId[t[k].id].estado, 'backlog');
      assert.equal(porId[t[k].id].sprintId, null);
    }
    assert.equal((await dir.post('/api/sprints/' + sprint0.id + '/cerrar')).estado, 409);
    assert.equal((await dir.post('/api/sprints/' + sprint0.id + '/burndown')).estado, 400);
    assert.equal((await dir.get(base + '/sprint-activo')).datos.sprint, null);
  });

  it('CA-07 la velocidad lista los sprints cerrados y su media', async () => {
    const v = (await dir.get(base + '/velocidad')).datos;
    assert.deepEqual(v.sprints.map((s) => [s.nombre, s.entregado]), [['Sprint 0 — Preparación', 8]]);
    assert.equal(v.media, 8);
  });

  it('CA-08 empezar un sprint nuevo cierra el activo: nunca hay dos a la vez', async () => {
    const s1 = await dir.post(base + '/sprints', { nombre: 'Sprint 1', objetivo: 'Comprar', dias: 10 });
    assert.equal(s1.estado, 201);
    assert.equal(s1.datos.estado, 'activo');
    assert.equal(s1.datos.sprintCerrado, null);
    await dir.patch('/api/tareas/' + t.carrito.id, { sprintId: s1.datos.id, estado: 'hecho' });

    const s2 = await dir.post(base + '/sprints', { nombre: 'Sprint 2', dias: 10 });
    assert.equal(s2.estado, 201);
    assert.equal(s2.datos.sprintCerrado.sprintId, s1.datos.id);
    assert.equal(s2.datos.sprintCerrado.entregado, 5);
    const activos = (await dir.get(base + '/sprints')).datos.filter((s) => s.estado === 'activo');
    assert.deepEqual(activos.map((s) => s.id), [s2.datos.id]);

    const plan = await dir.post(base + '/sprints', { nombre: 'Sprint 3', estado: 'planificado' });
    assert.equal(plan.estado, 201);
    assert.equal((await dir.get(base + '/sprint-activo')).datos.sprint.id, s2.datos.id, 'planificar no cierra el activo');
    const choque = await dir.patch('/api/sprints/' + plan.datos.id, { estado: 'activo' });
    assert.equal(choque.estado, 409);
    assert.match(choque.datos.error, /sprint activo/);
    assert.equal((await dir.patch('/api/sprints/' + s2.datos.id, { estado: 'cerrado' })).estado, 400, 'cerrar tiene su propia acción');
    assert.equal((await dir.post(base + '/sprints', { nombre: 'Largo', dias: 400 })).estado, 400);

    const v = (await dir.get(base + '/velocidad')).datos;
    assert.equal(v.sprints.length, 2);
    assert.equal(v.media, 6.5);
  });

  it('CA-09 una tarea no puede apuntar a un sprint de otro proyecto', async () => {
    const otro = (await dir.post('/api/proyectos', { nombre: 'Otro ágil', metodologia: 'agil' })).datos;
    const ajeno = (await dir.get('/api/proyectos/' + otro.id + '/sprint-activo')).datos.sprint;
    const r = await dir.patch('/api/tareas/' + t.login.id, { sprintId: ajeno.id });
    assert.equal(r.estado, 400);
    assert.match(r.datos.error, /sprint indicado no existe en este proyecto/);
    const c = await dir.post(base + '/tareas', { titulo: 'Cruzada', sprintId: ajeno.id });
    assert.equal(c.estado, 400);
  });

  it('CA-10 una tarea se consulta por su ruta anidada o plana, y no desde otro proyecto', async () => {
    const plano = await dir.get('/api/tareas/' + t.login.id);
    const anidado = await dir.get(base + '/tareas/' + t.login.id);
    assert.equal(plano.estado, 200);
    assert.deepEqual(plano.datos, anidado.datos);
    const otro = (await dir.get('/api/proyectos')).datos.find((x) => x.id !== p.id);
    assert.equal((await dir.get('/api/proyectos/' + otro.id + '/tareas/' + t.login.id)).estado, 404);
  });
});
