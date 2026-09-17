/* HU-06 · Como director quiero registrar riesgos, interesados, cambios,
   lecciones, equipo y comentarios, y controlar el valor ganado. */

'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciar, hoyBd } = require('../ayuda');

describe('HU-06 Dominios de desempeño y valor ganado', () => {
  let e;
  let dir;
  let p;
  let base;
  before(async () => {
    e = await iniciar();
    dir = await e.crearUsuario('director');
    p = (await dir.post('/api/proyectos', {
      nombre: 'Planta solar', presupuesto: 100000, inicio: '2026-01-05', fin: '2026-06-30'
    })).datos;
    base = '/api/proyectos/' + p.id;
  });
  after(async () => { await e.cerrar(); });

  it('CA-01 cada riesgo se clasifica por probabilidad × impacto', async () => {
    const casos = [[4, 4, 'critico', 16], [2, 4, 'alto', 8], [1, 2, 'bajo', 2]];
    for (const [pr, im, nivel, valor] of casos) {
      const r = await dir.post(base + '/riesgos', {
        titulo: 'Debido a X podría Y ' + valor, p: String(pr), i: im, estrategia: 'mitigar',
        respuesta: 'Plan B', responsableId: dir.usuario.id
      });
      assert.equal(r.estado, 201);
      assert.equal(r.datos.severidad.nivel, nivel);
      assert.equal(r.datos.severidad.valor, valor);
      assert.equal(r.datos.estado, 'activo');
    }
    const def = (await dir.post(base + '/riesgos', { titulo: 'Sin valores' })).datos;
    assert.deepEqual([def.p, def.i, def.estrategia], [3, 3, 'mitigar']);
  });

  it('CA-02 se validan escala, estrategia y responsable', async () => {
    assert.equal((await dir.post(base + '/riesgos', { titulo: 'R', p: 6 })).estado, 400);
    assert.equal((await dir.post(base + '/riesgos', { titulo: 'R', i: 0 })).estado, 400);
    assert.equal((await dir.post(base + '/riesgos', { titulo: 'R', estrategia: 'ignorar' })).estado, 400);
    const r = await dir.post(base + '/riesgos', { titulo: 'R', responsableId: 'fantasma' });
    assert.equal(r.estado, 400);
    assert.match(r.datos.error, /responsableId/);
    const vacio = await dir.post(base + '/riesgos', { titulo: 'R', responsableId: '' });
    assert.equal(vacio.estado, 201, 'la cadena vacía de un selector significa «sin asignar»');
    assert.equal(vacio.datos.responsableId, null);
  });

  it('CA-03 la matriz agrupa por celda y un riesgo se mueve arrastrándolo', async () => {
    const m = (await dir.get(base + '/matriz-riesgos')).datos;
    assert.equal(m['4x4'].length, 1);
    const id = m['4x4'][0].id;
    const movido = await dir.patch('/api/riesgos/' + id, { p: 2, i: 2 });
    assert.equal(movido.datos.severidad.nivel, 'bajo');
    const m2 = (await dir.get(base + '/matriz-riesgos')).datos;
    assert.equal(m2['4x4'], undefined);
    assert.equal(m2['2x2'][0].id, id);
  });

  it('CA-04 borrar y «Deshacer» recrea el mismo registro con su identificador', async () => {
    const r = (await dir.post(base + '/riesgos', { titulo: 'Para deshacer', p: 5, i: 5 })).datos;
    assert.equal((await dir.del('/api/riesgos/' + r.id)).estado, 204);
    assert.equal((await dir.get('/api/riesgos/' + r.id)).estado, 404);
    const copia = { ...r };
    delete copia.severidad;
    const rehecho = await dir.post(base + '/riesgos', copia);
    assert.equal(rehecho.estado, 201);
    assert.equal(rehecho.datos.id, r.id);
    assert.equal(rehecho.datos.proyectoId, p.id);
    assert.equal(rehecho.datos.creado, r.creado, 'conserva su fecha de creación');
    assert.equal((await dir.post(base + '/riesgos', copia)).estado, 409);
  });

  it('CA-05 interesados con poder e influencia de 1 a 5', async () => {
    const r = await dir.post(base + '/interesados', {
      nombre: 'Alcaldía', rol: 'Regulador', poder: 5, influencia: 4, actual: 'neutral', deseado: 'apoyo', estrategia: 'Reunión mensual'
    });
    assert.equal(r.estado, 201);
    assert.equal((await dir.post(base + '/interesados', { nombre: 'X', poder: 9 })).estado, 400);
    const ed = await dir.patch('/api/interesados/' + r.datos.id, { actual: 'apoyo', proyectoId: 'otro', id: 'otro' });
    assert.equal(ed.estado, 200);
    assert.equal(ed.datos.actual, 'apoyo');
    assert.equal(ed.datos.proyectoId, p.id, 'ni el proyecto ni el id se cambian editando');
    assert.equal(ed.datos.id, r.datos.id);
    assert.equal(typeof ed.datos.actualizado, 'number');
    assert.equal((await dir.del('/api/interesados/' + r.datos.id)).estado, 204);
  });

  it('CA-06 las solicitudes de cambio nacen pendientes y se deciden', async () => {
    const c = (await dir.post(base + '/cambios', { titulo: 'Ampliar potencia', solicitante: 'Cliente', impacto: '+2 semanas' })).datos;
    assert.equal(c.decision, 'pendiente');
    assert.equal((await dir.patch('/api/cambios/' + c.id, { decision: 'aprobado' })).datos.decision, 'aprobado');
    assert.equal((await dir.patch('/api/cambios/' + c.id, { decision: 'quizas' })).estado, 400);
    assert.equal((await dir.get(base + '/cambios')).datos.length, 1);
  });

  it('CA-07 las lecciones aprendidas se registran y se eliminan', async () => {
    const l = await dir.post(base + '/lecciones', { situacion: 'Retraso en permisos', causa: 'Trámite', recomendacion: 'Iniciar antes', dominio: 'cronograma' });
    assert.equal(l.estado, 201);
    assert.equal((await dir.post(base + '/lecciones', { causa: 'sin situación' })).estado, 400);
    assert.equal((await dir.del('/api/lecciones/' + l.datos.id)).estado, 204);
    assert.deepEqual((await dir.get(base + '/lecciones')).datos, []);
  });

  it('CA-08 el valor ganado calcula CV, SV, CPI, SPI, EAC, ETC, VAC y TCPI en orden de fecha', async () => {
    assert.deepEqual((await dir.get(base + '/salud')).datos, { estado: 'sin-datos', etiqueta: 'Sin mediciones' });
    await dir.post(base + '/mediciones', { fecha: '2026-02-28', pv: 20000, ev: 18000, ac: 20000, nota: 'Corte 2' });
    await dir.post(base + '/mediciones', { fecha: '2026-01-31', pv: '10000', ev: 8000, ac: 10000 });

    const r = (await dir.get(base + '/evm')).datos;
    assert.equal(r.bac, 100000);
    assert.deepEqual(r.mediciones.map((m) => m.fecha), ['2026-01-31', '2026-02-28']);
    const u = r.ultima;
    assert.equal(u.cv, -2000);
    assert.equal(u.sv, -2000);
    assert.equal(u.cpi, 0.9);
    assert.equal(u.spi, 0.9);
    assert.equal(u.eac, 111111.11);
    assert.equal(u.etc, 91111.11);
    assert.equal(u.vac, -11111.11);
    assert.equal(u.tcpi, 1.025);
    assert.equal(r.mediciones[0].cpi, 0.8);

    const s = (await dir.get(base + '/salud')).datos;
    assert.equal(s.estado, 'aviso');
    assert.equal(s.etiqueta, 'Bajo vigilancia');
  });

  it('CA-09 una medición sin fecha toma la de hoy y no admite negativos', async () => {
    const r = await dir.post(base + '/mediciones', { fecha: '', pv: 30000, ev: 31000, ac: 29000 });
    assert.equal(r.estado, 201);
    assert.equal(r.datos.fecha, await hoyBd());
    assert.equal((await dir.post(base + '/mediciones', { pv: -1 })).estado, 400);
    assert.equal((await dir.post(base + '/mediciones', { pv: 'mucho' })).estado, 400);
    assert.equal((await dir.get(base + '/salud')).datos.estado, 'ok');
  });

  it('CA-10 el calendario del proyecto reúne inicio, fin, hitos, límites de tareas y cortes', async () => {
    await dir.patch(base, { hitos: [{ nombre: 'Conexión a red', fecha: '2026-05-15', critico: true }] });
    await dir.post(base + '/tareas', { titulo: 'Comprar paneles', fechaLimite: '2026-03-10' });
    const cal = (await dir.get(base + '/calendario')).datos;
    const resumen = cal.filter((x) => x.fecha < '2026-07-01').map((x) => x.fecha + ' ' + x.tipo);
    assert.deepEqual(resumen, [
      '2026-01-05 proyecto', '2026-01-31 evm', '2026-02-28 evm',
      '2026-03-10 tarea', '2026-05-15 hito', '2026-06-30 proyecto'
    ]);
    assert.equal(cal.find((x) => x.tipo === 'hito').extra, 'critico');
  });

  it('CA-11 quien solo ve puede comentar, y cada cual edita sus comentarios', async () => {
    const lector = await e.crearUsuario('ejecutor');
    await e.admin.post('/api/permisos', { usuarioId: lector.usuario.id, ambito: 'proyecto', refId: p.id, nivel: 'ver' });

    const mio = await lector.post(base + '/comentarios', { texto: '¿Cuándo llegan los paneles?', refTipo: 'tarea' });
    assert.equal(mio.estado, 201);
    assert.equal(mio.datos.autorId, lector.usuario.id);
    const suyo = (await dir.post(base + '/comentarios', { texto: 'La semana próxima', autorId: lector.usuario.id })).datos;
    assert.equal(suyo.autorId, dir.usuario.id, 'el autor lo pone el servidor');

    assert.equal((await lector.patch('/api/comentarios/' + mio.datos.id, { texto: 'Editado' })).estado, 200);
    assert.equal((await lector.patch('/api/comentarios/' + suyo.id, { texto: 'Hackeado' })).estado, 403);
    assert.equal((await lector.del('/api/comentarios/' + suyo.id)).estado, 403);
    assert.equal((await dir.del('/api/comentarios/' + mio.datos.id)).estado, 204, 'quien edita el proyecto modera');
    assert.equal((await lector.post(base + '/riesgos', { titulo: 'No puedo' })).estado, 403);
  });

  it('CA-12 el equipo lo gestiona quien dirige el proyecto', async () => {
    const m = await e.crearUsuario('miembro');
    const alta = await dir.post(base + '/miembros', { usuarioId: m.usuario.id, rol: 'po' });
    assert.equal(alta.estado, 201);
    assert.equal((await dir.post(base + '/miembros', { usuarioId: m.usuario.id })).estado, 409);
    assert.equal((await dir.post(base + '/miembros', { usuarioId: 'fantasma' })).estado, 400);
    assert.equal((await dir.post(base + '/miembros', { usuarioId: dir.usuario.id, rol: 'rey' })).estado, 400);

    const otro = await e.crearUsuario('miembro');
    assert.equal((await m.post(base + '/miembros', { usuarioId: otro.usuario.id })).estado, 403, 'un miembro edita pero no dirige');
    assert.equal((await m.patch('/api/miembros/' + alta.datos.id, { rol: 'lider' })).estado, 403);

    const ascenso = await dir.patch('/api/miembros/' + alta.datos.id, { rol: 'lider' });
    assert.equal(ascenso.datos.rol, 'lider');
    assert.equal((await m.get(base)).datos.nivel, 3, 'el líder dirige');
    assert.equal((await dir.del('/api/miembros/' + alta.datos.id)).estado, 204);
    assert.equal((await m.get(base)).estado, 404);
  });
});
