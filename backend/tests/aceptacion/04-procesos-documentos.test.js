/* HU-04 · Como director quiero recorrer los 40 procesos, saber cuál
   sigue y producir sus documentos con la plantilla del artefacto. */

'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciar } = require('../ayuda');

describe('HU-04 Procesos y documentos', () => {
  let e;
  let dir;
  let p;
  let base;
  before(async () => {
    e = await iniciar();
    dir = await e.crearUsuario('director');
    p = (await dir.post('/api/proyectos', { nombre: 'Ciclo completo', metodologia: 'agil' })).datos;
    base = '/api/proyectos/' + p.id;
  });
  after(async () => { await e.cerrar(); });

  it('CA-01 el proyecto tiene 40 procesos repartidos en 2·19·8·10·1 y los iterativos de Scrum', async () => {
    const r = await dir.get(base + '/procesos');
    assert.equal(r.estado, 200);
    assert.equal(r.datos.length, 40);
    const porBanda = {};
    r.datos.forEach((x) => { porBanda[x.banda] = (porBanda[x.banda] || 0) + 1; });
    assert.deepEqual(porBanda, { inicio: 2, planificacion: 19, ejecucion: 8, monitoreo: 10, cierre: 1 });
    assert.equal(r.datos.filter((x) => x.iterativo).length, 14);
    assert.ok(r.datos.every((x) => x.estado === 'pendiente' && x.codigo && x.nombre));
  });

  it('CA-02 el siguiente paso de un proyecto nuevo es 2.1.1 con los documentos que produce', async () => {
    const s = (await dir.get(base + '/siguiente')).datos.siguiente;
    assert.equal(s.procesoId, 'p-gob-01');
    assert.equal(s.codigo, '2.1.1');
    assert.equal(s.nombre, 'Iniciar el Proyecto o Fase');
    assert.deepEqual(s.documentos.map((d) => d.artefactoId), ['art-acta-proyecto', 'art-registro-supuestos']);
    assert.equal(s.documentos[0].nombre, 'Acta de Constitución del Proyecto');
  });

  it('CA-03 lo que está en curso va primero y el avance descuenta los omitidos', async () => {
    const inic = await dir.put(base + '/procesos/p-int-01', { estado: 'iniciado' });
    assert.equal(inic.estado, 200);
    assert.equal(typeof inic.datos.fecha, 'number');
    assert.equal((await dir.get(base + '/siguiente')).datos.siguiente.procesoId, 'p-int-01');

    await dir.put(base + '/procesos/p-int-01', { estado: 'completado' });
    await dir.put(base + '/procesos/p-gob-01', { estado: 'completado' });
    await dir.put(base + '/procesos/p-alc-01', { estado: 'omitido' });
    const pr = (await dir.get(base + '/progreso')).datos;
    assert.deepEqual(pr, { completados: 2, omitidos: 1, total: 40, aplicables: 39, porcentaje: 5 });

    const s = (await dir.get(base + '/siguiente')).datos.siguiente;
    assert.equal(s.banda, 'planificacion');
    assert.notEqual(s.procesoId, 'p-alc-01', 'un omitido no se propone');
    assert.equal((await dir.get(base)).datos.progreso.porcentaje, 5);
    const lista = (await dir.get('/api/proyectos')).datos.find((x) => x.id === p.id);
    assert.equal(lista.progreso.completados, 2);
  });

  it('CA-04 las notas se guardan sin tocar el estado ni su fecha', async () => {
    const antes = (await dir.put(base + '/procesos/p-gob-01', { notas: 'Firmada por la gerente' })).datos;
    assert.equal(antes.estado, 'completado');
    assert.equal(antes.notas, 'Firmada por la gerente');
    const detalle = (await dir.get(base + '/procesos/p-gob-01')).datos;
    assert.equal(detalle.notas, 'Firmada por la gerente');
    assert.equal(detalle.fecha, antes.fecha);
    assert.ok(Array.isArray(detalle.entradas) && Array.isArray(detalle.salidas));
  });

  it('CA-05 estados o procesos inexistentes se rechazan', async () => {
    assert.equal((await dir.put(base + '/procesos/p-gob-01', { estado: 'terminado' })).estado, 400);
    assert.equal((await dir.put(base + '/procesos/p-gob-01', {})).estado, 400);
    const r = await dir.put(base + '/procesos/p-xyz-99', { estado: 'iniciado' });
    assert.equal(r.estado, 404);
    assert.match(r.datos.error, /p-xyz-99/);
    assert.equal((await dir.get(base + '/procesos/p-xyz-99')).estado, 404);
  });

  it('CA-06 un proceso se arrastra a otra banda y al volver a la suya se borra el ajuste', async () => {
    const r = await dir.put(base + '/procesos/p-rie-02/banda', { banda: 'ejecucion' });
    assert.equal(r.estado, 200);
    assert.equal(r.datos.bandaOriginal, 'planificacion');
    const movido = (await dir.get(base + '/procesos')).datos.find((x) => x.procesoId === 'p-rie-02');
    assert.equal(movido.banda, 'ejecucion');
    assert.equal((await dir.get(base)).datos.orden['p-rie-02'], 'ejecucion');

    await dir.put(base + '/procesos/p-rie-02/banda', { banda: 'planificacion' });
    assert.equal((await dir.get(base)).datos.orden['p-rie-02'], undefined);
    assert.equal((await dir.put(base + '/procesos/p-rie-02/banda', { banda: 'limbo' })).estado, 400);
  });

  let acta;

  it('CA-07 generar un documento es idempotente y lo vuelve disponible como entrada', async () => {
    const antes = (await dir.get(base + '/procesos/p-int-01/entradas')).datos;
    assert.equal(antes.find((x) => x.artefactoId === 'art-acta-proyecto').disponible, false);

    const r = await dir.post(base + '/documentos', { artefactoId: 'art-acta-proyecto', procesoId: 'p-gob-01' });
    assert.equal(r.estado, 201);
    assert.equal(r.datos.yaExistia, false);
    acta = r.datos.documento;
    assert.equal(acta.nombre, 'Acta de Constitución del Proyecto');
    assert.equal(acta.version, 1);
    assert.equal(acta.estado, 'borrador');
    assert.equal(acta.autorId, dir.usuario.id);
    assert.equal(acta.plantilla.length, 9);
    assert.equal(acta.completitud, 0);

    const otra = await dir.post(base + '/documentos', { artefactoId: 'art-acta-proyecto' });
    assert.equal(otra.estado, 200);
    assert.equal(otra.datos.yaExistia, true);
    assert.equal(otra.datos.documento.id, acta.id);

    const despues = (await dir.get(base + '/procesos/p-int-01/entradas')).datos;
    const entrada = despues.find((x) => x.artefactoId === 'art-acta-proyecto');
    assert.equal(entrada.disponible, true);
    assert.equal(entrada.documento.id, acta.id);
    const salidas = (await dir.get(base + '/procesos/p-gob-01/salidas')).datos;
    assert.deepEqual(salidas.map((s) => s.disponible), [true, false]);
  });

  it('CA-08 los bloques se guardan en vivo y la completitud refleja la plantilla', async () => {
    const d = '/api/documentos/' + acta.id;
    const t = await dir.put(d + '/bloques/0', { valor: 'Reducir un 30 % el tiempo de atención' });
    assert.equal(t.estado, 200);
    assert.equal(t.datos.completitud, 11);

    const tabla = await dir.put(d + '/bloques/4', { valor: [['Acta firmada', '2026-10-05', 'Firma'], ['', '', '']] });
    assert.equal(tabla.estado, 200);
    assert.equal(tabla.datos.completitud, 22);
    assert.deepEqual(tabla.datos.contenido['4'][0], ['Acta firmada', '2026-10-05', 'Firma']);

    assert.equal((await dir.put(d + '/bloques/4', { valor: 'no es tabla' })).estado, 400);
    const fuera = await dir.put(d + '/bloques/99', { valor: 'x' });
    assert.equal(fuera.estado, 400);
    assert.match(fuera.datos.error, /0 a 8/);
    assert.equal((await dir.put(d + '/bloques/-1', { valor: 'x' })).estado, 400);

    const borrado = await dir.put(d + '/bloques/0', { valor: '' });
    assert.equal(borrado.datos.completitud, 11);
    assert.equal(borrado.datos.contenido['0'], undefined);

    const lista = (await dir.get(base + '/documentos')).datos;
    assert.equal(lista[0].id, acta.id);
    assert.equal(lista[0].completitud, 11);
  });

  it('CA-09 el documento pasa de borrador a revisión y a aprobado; una nueva versión vuelve a borrador', async () => {
    const d = '/api/documentos/' + acta.id;
    assert.equal((await dir.patch(d, { estado: 'revision' })).datos.estado, 'revision');
    const aprob = (await dir.patch(d, { estado: 'aprobado' })).datos;
    assert.equal(aprob.estado, 'aprobado');
    assert.equal(typeof aprob.aprobado, 'number');
    assert.equal((await dir.patch(d, { estado: 'firmado' })).estado, 400);

    const v2 = (await dir.post(d + '/versiones')).datos;
    assert.equal(v2.version, 2);
    assert.equal(v2.estado, 'borrador');
    assert.equal(v2.aprobado, aprob.aprobado, 'se conserva la fecha de la última aprobación');
    assert.equal((await dir.get(d)).datos.version, 2);
  });

  it('CA-10 artefactos inexistentes se rechazan y quien solo ve no puede editar', async () => {
    const r = await dir.post(base + '/documentos', { artefactoId: 'art-inventado' });
    assert.equal(r.estado, 400);
    assert.match(r.datos.error, /catálogo/);
    assert.equal((await dir.post(base + '/documentos', { artefactoId: 'art-lecciones', procesoId: 'p-nada' })).estado, 400);

    const lector = await e.crearUsuario('miembro');
    await e.admin.post('/api/permisos', { usuarioId: lector.usuario.id, ambito: 'proyecto', refId: p.id, nivel: 'ver' });
    assert.equal((await lector.get('/api/documentos/' + acta.id)).estado, 200);
    assert.equal((await lector.put('/api/documentos/' + acta.id + '/bloques/0', { valor: 'x' })).estado, 403);
    assert.equal((await lector.patch('/api/documentos/' + acta.id, { estado: 'aprobado' })).estado, 403);
    assert.equal((await lector.post(base + '/documentos', { artefactoId: 'art-lecciones' })).estado, 403);
    assert.equal((await lector.put(base + '/procesos/p-gob-02', { estado: 'iniciado' })).estado, 403);
  });

  it('CA-11 un documento se puede eliminar', async () => {
    const doc = (await dir.post(base + '/documentos', { artefactoId: 'art-lecciones' })).datos.documento;
    assert.equal((await dir.del('/api/documentos/' + doc.id)).estado, 204);
    assert.equal((await dir.get('/api/documentos/' + doc.id)).estado, 404);
  });
});
