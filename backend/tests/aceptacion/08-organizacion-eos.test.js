/* HU-08 · Como gerencia queremos organizar la cartera en portafolios y
   programas y llevar la capa EOS: rocas, scorecard, organigrama y VTO. */

'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciar } = require('../ayuda');

describe('HU-08 Cartera y gerencia EOS', () => {
  let e;
  let dir;
  let ejec;
  before(async () => {
    e = await iniciar();
    dir = await e.crearUsuario('director');
    ejec = await e.crearUsuario('ejecutor');
  });
  after(async () => { await e.cerrar(); });

  it('CA-01 la cartera se organiza en portafolios y programas; todos la leen, solo la gerencia la cambia', async () => {
    const pf = await dir.post('/api/portafolios', { nombre: 'Transformación digital', descripcion: '2026-2027' });
    assert.equal(pf.estado, 201);
    const prog = await dir.post('/api/portafolios/' + pf.datos.id + '/programas', { nombre: 'Canales' });
    assert.equal(prog.estado, 201);
    assert.equal(prog.datos.portafolioId, pf.datos.id);
    assert.equal((await dir.post('/api/portafolios/no-existe/programas', { nombre: 'X' })).estado, 404);

    assert.equal((await ejec.get('/api/portafolios')).datos.length, 1);
    assert.equal((await ejec.get('/api/programas?portafolioId=' + pf.datos.id)).datos.length, 1);
    assert.equal((await ejec.get('/api/portafolios/' + pf.datos.id + '/programas')).datos[0].nombre, 'Canales');
    assert.equal((await ejec.post('/api/portafolios', { nombre: 'Mía' })).estado, 403);
    assert.equal((await ejec.patch('/api/portafolios/' + pf.datos.id, { nombre: 'Mía' })).estado, 403);
    assert.equal((await ejec.del('/api/programas/' + prog.datos.id)).estado, 403);

    const ren = await dir.patch('/api/programas/' + prog.datos.id, { nombre: 'Canales digitales' });
    assert.equal(ren.datos.nombre, 'Canales digitales');
    assert.equal((await dir.post('/api/portafolios', { nombre: '' })).estado, 400);
    assert.equal((await dir.patch('/api/portafolios/no-existe', { nombre: 'X' })).estado, 404);
  });

  it('CA-02 borrar un portafolio deja sus proyectos sin portafolio ni programa', async () => {
    const pf = (await dir.post('/api/portafolios', { nombre: 'Temporal' })).datos;
    const prog = (await dir.post('/api/portafolios/' + pf.id + '/programas', { nombre: 'Prog' })).datos;
    const p = (await dir.post('/api/proyectos', { nombre: 'Huérfano', programaId: prog.id })).datos;
    assert.equal(p.portafolioId, pf.id);

    assert.equal((await dir.del('/api/portafolios/' + pf.id)).estado, 204);
    const tras = (await dir.get('/api/proyectos/' + p.id)).datos;
    assert.equal(tras.portafolioId, null);
    assert.equal(tras.programaId, null);
    assert.equal((await dir.get('/api/programas/' + prog.id)).estado, 404);
    assert.equal((await dir.del('/api/portafolios/' + pf.id)).estado, 404);
  });

  it('CA-03 las rocas del trimestre tienen metas medibles, estado y proyectos vinculados', async () => {
    const r = await dir.post('/api/rocas', {
      trimestre: 'Q4-2026', titulo: 'Lanzar el portal', responsableId: dir.usuario.id, estado: 'encamino',
      metas: [{ texto: 'Beta con 50 clientes' }, { texto: 'NPS ≥ 40' }]
    });
    assert.equal(r.estado, 201);
    assert.deepEqual(r.datos.metas, [{ texto: 'Beta con 50 clientes' }, { texto: 'NPS ≥ 40' }]);
    await dir.post('/api/rocas', { trimestre: 'Q1-2027', titulo: 'Otra' });

    const q4 = (await ejec.get('/api/rocas?trimestre=Q4-2026')).datos;
    assert.deepEqual(q4.map((x) => x.titulo), ['Lanzar el portal']);

    const metas = r.datos.metas.map((m, i) => ({ ...m, hecho: i === 0 }));
    const hecha = await dir.patch('/api/rocas/' + r.datos.id, { metas, estado: 'riesgo' });
    assert.equal(hecha.datos.metas[0].hecho, true);
    assert.equal(hecha.datos.estado, 'riesgo');

    assert.equal((await dir.post('/api/rocas', { trimestre: '2026-Q4', titulo: 'X' })).estado, 400);
    assert.equal((await dir.post('/api/rocas', { trimestre: 'Q4-2026', titulo: 'X', estado: 'perdida' })).estado, 400);
    assert.equal((await ejec.post('/api/rocas', { trimestre: 'Q4-2026', titulo: 'X' })).estado, 403);

    const p = (await dir.post('/api/proyectos', { nombre: 'Portal', rocaId: r.datos.id })).datos;
    assert.equal(p.rocaId, r.datos.id);
    assert.equal((await dir.del('/api/rocas/' + r.datos.id)).estado, 204);
    assert.equal((await dir.get('/api/proyectos/' + p.id)).datos.rocaId, null, 'el proyecto pierde solo el vínculo');
  });

  it('CA-04 el scorecard guarda un valor por métrica y semana', async () => {
    const m = await dir.post('/api/metricas', {
      nombre: 'Tickets abiertos', meta: '≤ 20', direccion: 'menor', responsableId: dir.usuario.id,
      valores: { '2026-09-07': '25', '2026-09-14': 18 }
    });
    assert.equal(m.estado, 201);
    assert.deepEqual(m.datos.valores, { '2026-09-07': '25', '2026-09-14': '18' });

    const url = '/api/metricas/' + m.datos.id + '/valores/';
    assert.deepEqual((await dir.put(url + '2026-09-21', { valor: '15' })).datos.valores['2026-09-21'], '15');
    assert.equal((await dir.put(url + '2026-09-21', { valor: '12' })).datos.valores['2026-09-21'], '12');
    const sin = (await dir.put(url + '2026-09-07', { valor: '' })).datos;
    assert.equal(sin.valores['2026-09-07'], undefined, 'vaciar la celda la borra');
    assert.equal((await ejec.put(url + '2026-09-28', { valor: '1' })).estado, 403);

    const reemplazo = await dir.patch('/api/metricas/' + m.datos.id, { valores: { '2026-10-05': '9' } });
    assert.deepEqual(reemplazo.datos.valores, { '2026-10-05': '9' });
    const soloNombre = await dir.patch('/api/metricas/' + m.datos.id, { nombre: 'Tickets' });
    assert.deepEqual(soloNombre.datos.valores, { '2026-10-05': '9' }, 'editar otro campo no borra el historial');
    assert.equal((await dir.post('/api/metricas', { nombre: 'X', direccion: 'lateral' })).estado, 400);
    assert.equal((await dir.put('/api/metricas/no-existe/valores/2026-09-07', { valor: '1' })).estado, 404);

    assert.equal((await dir.del('/api/metricas/' + m.datos.id)).estado, 204);
    const n = await e.db.uno('SELECT count(*) AS n FROM metrica_valores WHERE metrica_id = $1', [m.datos.id]);
    assert.equal(n.n, 0, 'el historial se va con la métrica');
  });

  it('CA-05 el organigrama es un árbol sin ciclos y borrar una rama borra sus asientos', async () => {
    const vis = (await dir.post('/api/asientos', { nombre: 'Visionario', personaId: dir.usuario.id })).datos;
    const int = (await dir.post('/api/asientos', { nombre: 'Integrador', padreId: vis.id, gwt: 'Coordina' })).datos;
    const ops = (await dir.post('/api/asientos', { nombre: 'Operaciones', padreId: int.id })).datos;
    const ven = (await dir.post('/api/asientos', { nombre: 'Ventas', padreId: int.id })).datos;

    const ciclo = await dir.patch('/api/asientos/' + vis.id, { padreId: ops.id });
    assert.equal(ciclo.estado, 400);
    assert.match(ciclo.datos.error, /subordinados/);
    assert.equal((await dir.patch('/api/asientos/' + vis.id, { padreId: vis.id })).estado, 400);
    assert.equal((await dir.post('/api/asientos', { nombre: 'X', padreId: 'no-existe' })).estado, 400);
    const mover = await dir.patch('/api/asientos/' + ven.id, { padreId: vis.id });
    assert.equal(mover.datos.padreId, vis.id);

    assert.equal((await dir.del('/api/asientos/' + int.id)).estado, 204);
    const quedan = (await ejec.get('/api/asientos')).datos.map((a) => a.nombre).sort();
    assert.deepEqual(quedan, ['Ventas', 'Visionario']);
  });

  it('CA-06 el VTO guarda cada bloque; vaciarlo lo elimina', async () => {
    assert.deepEqual((await ejec.get('/api/vto')).datos, {});
    assert.equal((await dir.put('/api/vto/valores', { texto: 'Integridad\nServicio' })).estado, 200);
    await dir.put('/api/vto/nicho', { texto: 'Pymes de la región' });
    assert.deepEqual((await ejec.get('/api/vto')).datos, { nicho: 'Pymes de la región', valores: 'Integridad\nServicio' });
    await dir.put('/api/vto/nicho', { texto: '   ' });
    assert.deepEqual(Object.keys((await ejec.get('/api/vto')).datos), ['valores']);
    assert.equal((await ejec.put('/api/vto/valores', { texto: 'Mío' })).estado, 403);
    assert.equal((await dir.put('/api/vto/con espacio', { texto: 'x' })).estado, 400);
  });

  it('CA-07 al eliminar a una persona, sus rocas y asientos quedan sin responsable', async () => {
    const temporal = await e.crearUsuario('director');
    const roca = (await temporal.post('/api/rocas', { trimestre: 'Q4-2026', titulo: 'Suya', responsableId: temporal.usuario.id })).datos;
    const asiento = (await temporal.post('/api/asientos', { nombre: 'Finanzas', personaId: temporal.usuario.id })).datos;
    assert.equal((await e.admin.del('/api/usuarios/' + temporal.usuario.id)).estado, 204);
    assert.equal((await dir.get('/api/rocas/' + roca.id)).datos.responsableId, null);
    assert.equal((await dir.get('/api/asientos/' + asiento.id)).datos.personaId, null);
  });
});
