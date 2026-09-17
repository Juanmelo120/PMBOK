/* HU-07 · Como equipo queremos un repositorio de evidencias por
   proyecto, guardado en la base de datos y descargable intacto. */

'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciar } = require('../ayuda');

function formulario(nombre, contenido, tipo, extra = {}) {
  const f = new FormData();
  Object.entries(extra).forEach(([k, v]) => f.append(k, v));
  f.append('archivo', new Blob([contenido], { type: tipo }), nombre);
  return f;
}

describe('HU-07 Repositorio de archivos', () => {
  let e;
  let dir;
  let p;
  let base;
  let texto;
  before(async () => {
    e = await iniciar();
    dir = await e.crearUsuario('director');
    p = (await dir.post('/api/proyectos', { nombre: 'Evidencias' })).datos;
    base = '/api/proyectos/' + p.id;
  });
  after(async () => { await e.cerrar(); });

  it('CA-01 se sube un archivo y conserva su nombre con tildes, tipo, tamaño y categoría', async () => {
    const contenido = 'Acta firmada el 5 de octubre — versión definitiva ñ';
    const r = await dir.post(base + '/archivos',
      formulario('Acta de constitución ñ.txt', contenido, 'text/plain', { categoria: 'actas' }));
    assert.equal(r.estado, 201);
    texto = r.datos;
    assert.equal(texto.nombre, 'Acta de constitución ñ.txt');
    assert.match(texto.tipo, /^text\/plain/);
    assert.equal(texto.tamano, Buffer.byteLength(contenido));
    assert.equal(texto.categoria, 'actas');
    assert.equal(texto.almacen, 'bd');
    assert.equal(texto.autorId, dir.usuario.id);

    const lista = (await dir.get(base + '/archivos')).datos;
    assert.deepEqual(lista.map((a) => a.id), [texto.id]);
    assert.equal(lista[0].datos, undefined, 'el listado no arrastra el contenido');
  });

  it('CA-02 la descarga devuelve exactamente los mismos bytes y se fuerza como adjunto', async () => {
    const r = await dir.get('/api/archivos/' + texto.id + '/contenido');
    assert.equal(r.estado, 200);
    assert.equal(r.datos.toString('utf8'), 'Acta firmada el 5 de octubre — versión definitiva ñ');
    const disp = r.cabeceras.get('content-disposition');
    assert.match(disp, /^attachment;/);
    assert.match(disp, /filename\*=UTF-8''Acta%20de%20constituci%C3%B3n%20%C3%B1\.txt/);
    assert.match(r.cabeceras.get('content-security-policy'), /sandbox/);
    const enLinea = await dir.get('/api/archivos/' + texto.id + '/contenido?enLinea=1');
    assert.match(enLinea.cabeceras.get('content-disposition'), /^inline;/, 'texto plano sí puede verse en línea');
  });

  it('CA-03 un binario con todos los valores de byte llega íntegro', async () => {
    const bytes = Buffer.alloc(256 * 40);
    for (let i = 0; i < bytes.length; i++) bytes[i] = i % 256;
    const r = await dir.post(base + '/archivos', formulario('datos.bin', bytes, 'application/octet-stream'));
    assert.equal(r.estado, 201);
    assert.equal(r.datos.categoria, 'general');
    const d = await dir.get('/api/archivos/' + r.datos.id + '/contenido');
    assert.ok(Buffer.compare(d.datos, bytes) === 0, 'contenido idéntico');
  });

  it('CA-04 un HTML subido nunca se sirve en línea', async () => {
    const r = await dir.post(base + '/archivos', formulario('pagina.html', '<script>alert(1)</script>', 'text/html'));
    const d = await dir.get('/api/archivos/' + r.datos.id + '/contenido?enLinea=1');
    assert.match(d.cabeceras.get('content-disposition'), /^attachment;/);
    assert.equal(d.cabeceras.get('x-content-type-options'), 'nosniff');
  });

  it('CA-05 un archivo de más de 10 MB se rechaza con 413', async () => {
    const grande = Buffer.alloc(10 * 1024 * 1024 + 10, 1);
    const r = await dir.post(base + '/archivos', formulario('enorme.bin', grande, 'application/octet-stream'));
    assert.equal(r.estado, 413);
    assert.match(r.datos.error, /tamaño máximo/);
    assert.equal((await dir.get(base + '/archivos')).datos.length, 3);
  });

  it('CA-06 subir sin archivo o sin permiso de edición falla; un ajeno no descarga', async () => {
    const vacio = new FormData();
    vacio.append('categoria', 'x');
    const r = await dir.post(base + '/archivos', vacio);
    assert.equal(r.estado, 400);
    assert.match(r.datos.error, /Falta el archivo/);

    const lector = await e.crearUsuario('miembro');
    await e.admin.post('/api/permisos', { usuarioId: lector.usuario.id, ambito: 'proyecto', refId: p.id, nivel: 'ver' });
    assert.equal((await lector.post(base + '/archivos', formulario('a.txt', 'x', 'text/plain'))).estado, 403);
    assert.equal((await lector.get('/api/archivos/' + texto.id + '/contenido')).estado, 200, 'leer sí puede');
    assert.equal((await lector.del('/api/archivos/' + texto.id)).estado, 403);

    const ajeno = await e.crearUsuario('director');
    assert.equal((await ajeno.get('/api/archivos/' + texto.id + '/contenido')).estado, 404);
    assert.equal((await ajeno.get(base + '/archivos')).estado, 404);
  });

  it('CA-07 borrar un archivo elimina también su contenido', async () => {
    assert.equal((await dir.del('/api/archivos/' + texto.id)).estado, 204);
    assert.equal((await dir.get('/api/archivos/' + texto.id + '/contenido')).estado, 404);
    const n = await e.db.uno('SELECT count(*) AS n FROM archivo_contenidos WHERE archivo_id = $1', [texto.id]);
    assert.equal(n.n, 0);
  });
});
