/* HU-10 · Como usuario quiero abrir la aplicación desde el servidor,
   consultar el catálogo de la guía y que nada sensible quede expuesto. */

'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciar } = require('../ayuda');

describe('HU-10 Interfaz, catálogo y seguridad', () => {
  let e;
  before(async () => { e = await iniciar(); });
  after(async () => { await e.cerrar(); });

  it('CA-01 el servidor entrega la interfaz existente y sus recursos', async () => {
    const r = await e.anonimo.get('/');
    assert.equal(r.estado, 200);
    assert.match(r.cabeceras.get('content-type'), /text\/html/);
    assert.match(r.datos.toString('utf8'), /<script src="assets\/js\/gestor\.js"><\/script>/);
    const js = await e.anonimo.get('/assets/js/gestor.js');
    assert.equal(js.estado, 200);
    assert.match(js.cabeceras.get('content-type'), /javascript/);
    assert.equal((await e.anonimo.get('/assets/css/estilos.css')).estado, 200);
  });

  it('CA-02 no se sirve nada fuera de index.html y assets', async () => {
    for (const ruta of ['/backend/.env', '/backend/package.json', '/README.md', '/.claude/settings.json',
      '/assets/../backend/.env', '/assets/%2e%2e/backend/.env', '/assets/..%2f..%2fbackend%2f.env', '/backend/src/config.js']) {
      const r = await fetch(e.base + ruta);
      assert.equal(r.status, 404, ruta);
      const cuerpo = await r.text();
      assert.ok(!/PGPASSWORD|JWT_SECRETO/.test(cuerpo), ruta);
    }
  });

  it('CA-03 las respuestas llevan cabeceras de seguridad y la API no se cachea', async () => {
    const r = await e.admin.get('/api/proyectos');
    assert.equal(r.cabeceras.get('x-content-type-options'), 'nosniff');
    assert.equal(r.cabeceras.get('x-frame-options'), 'SAMEORIGIN');
    assert.equal(r.cabeceras.get('x-powered-by'), null);
    assert.equal(r.cabeceras.get('cache-control'), 'no-store');
  });

  it('CA-04 CORS solo admite los orígenes configurados', async () => {
    const ok = await fetch(e.base + '/api/salud', { headers: { Origin: 'http://localhost:8000' } });
    assert.equal(ok.headers.get('access-control-allow-origin'), 'http://localhost:8000');
    const archivo = await fetch(e.base + '/api/salud', { headers: { Origin: 'null' } });
    assert.equal(archivo.headers.get('access-control-allow-origin'), 'null', 'index.html abierto desde el disco');
    const malo = await fetch(e.base + '/api/salud', { headers: { Origin: 'https://atacante.example' } });
    assert.equal(malo.headers.get('access-control-allow-origin'), null);
    const previo = await fetch(e.base + '/api/proyectos', {
      method: 'OPTIONS',
      headers: { Origin: 'http://localhost:8000', 'Access-Control-Request-Method': 'PATCH', 'Access-Control-Request-Headers': 'authorization,content-type' }
    });
    assert.equal(previo.status, 204);
    assert.match(previo.headers.get('access-control-allow-methods'), /PATCH/);
  });

  it('CA-05 el catálogo de la guía es público y coincide con los datos de la interfaz', async () => {
    const met = (await e.anonimo.get('/api/catalogo/metodologias')).datos;
    assert.deepEqual(met.map((m) => m.id), ['predictivo', 'agil', 'hibrido', 'kanban']);
    const procesos = (await e.anonimo.get('/api/catalogo/procesos')).datos;
    assert.equal(procesos.length, 40);
    assert.equal(procesos[0].codigo, '2.1.1');
    assert.equal((await e.anonimo.get('/api/catalogo/bandas')).datos.length, 5);
    const arts = (await e.anonimo.get('/api/catalogo/artefactos')).datos;
    assert.equal(arts.length, 42);
    const acta = (await e.anonimo.get('/api/catalogo/artefactos/art-acta-proyecto')).datos;
    assert.equal(acta.plantilla[4].t, 'tabla');
    assert.equal((await e.anonimo.get('/api/catalogo/artefactos/nada')).estado, 404);
  });

  it('CA-06 los intentos de inyección SQL se tratan como datos', async () => {
    const d = await e.crearUsuario('director');
    const raro = "x' OR '1'='1";
    assert.equal((await d.get('/api/proyectos/' + encodeURIComponent(raro))).estado, 404);
    assert.equal((await e.anonimo.post('/api/auth/entrar', { correo: "admin@pmbok.local' --", clave: 'x' })).estado, 401);
    const p = (await d.post('/api/proyectos', { nombre: "Robert'); DROP TABLE proyectos;--" })).datos;
    const r = (await d.post('/api/proyectos/' + p.id + '/riesgos', { titulo: "'; DELETE FROM riesgos; --" })).datos;
    assert.equal(r.titulo, "'; DELETE FROM riesgos; --");
    assert.equal((await d.get('/api/proyectos/' + p.id)).datos.nombre, "Robert'); DROP TABLE proyectos;--");
    assert.equal((await d.get('/api/rocas?trimestre=' + encodeURIComponent("Q1' OR 1=1 --"))).datos.length, 0);
    const n = await e.db.uno('SELECT count(*) AS n FROM proyectos');
    assert.equal(n.n, 1);
  });

  it('CA-07 un cuerpo demasiado grande se rechaza con 413', async () => {
    const enorme = JSON.stringify({ nombre: 'x', descripcion: 'a'.repeat(6 * 1024 * 1024) });
    const r = await e.admin.post('/api/proyectos', enorme);
    assert.equal(r.estado, 413);
  });

  it('CA-08 los textos largos por encima del límite del campo se rechazan', async () => {
    const r = await e.admin.post('/api/proyectos', { nombre: 'n'.repeat(201) });
    assert.equal(r.estado, 400);
    assert.equal(r.datos.detalles[0].campo, 'nombre');
  });
});
