/* HU-13 · Como quien programa contra la API quiero una documentación
   navegable y fiel: saber qué rutas hay, qué cuerpo acepta cada una y
   qué puede responder, y poder probarlas desde el navegador. */

'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciar } = require('../ayuda');
const config = require('../../src/config');
const { crearApp } = require('../../src/app');
const D = require('../../src/definiciones');

/* Valores con los que se rellenan los parámetros del camino al barrer la API.
   No existen: lo que se comprueba es que la ruta esté conectada, no los datos. */
const RELLENO = { indice: '0', semana: 'S01', bloqueId: 'inexistente' };

/* Cerrar la sesión revocaría el token con el que se hace el barrido */
const FUERA_DEL_BARRIDO = ['post /auth/salir'];

function caminoReal(camino) {
  return '/api' + camino.replace(/\{(\w+)\}/g, (_, nombre) => RELLENO[nombre] || 'inexistente');
}

describe('HU-13 Documentación de la API', () => {
  let e;
  let documento;

  before(async () => {
    e = await iniciar();
    documento = (await e.anonimo.get('/api/openapi.json')).datos;
  });
  after(async () => { await e.cerrar(); });

  it('CA-01 el documento se publica sin sesión y describe la API', async () => {
    const r = await e.anonimo.get('/api/openapi.json');
    assert.equal(r.estado, 200);
    assert.equal(r.datos.openapi, '3.1.0');
    assert.match(r.datos.info.title, /PMBOK/);
    assert.deepEqual(r.datos.servers.map((s) => s.url), ['/api']);

    /* La sesión es un JWT en Authorization y se exige por defecto */
    assert.deepEqual(r.datos.components.securitySchemes.sesion.scheme, 'bearer');
    assert.deepEqual(r.datos.security, [{ sesion: [] }]);

    /* Las rutas del catálogo y de acceso se anotan como públicas */
    assert.deepEqual(r.datos.paths['/auth/entrar'].post.security, []);
    assert.deepEqual(r.datos.paths['/catalogo/procesos'].get.security, []);
    assert.equal(r.datos.paths['/estado'].get.security, undefined, '/estado hereda la sesión obligatoria');

    /* Cada operación tiene identificador propio y una etiqueta con descripción */
    const etiquetas = new Set(r.datos.tags.map((t) => t.name));
    r.datos.tags.forEach((t) => assert.ok(t.description, 'la etiqueta ' + t.name + ' se explica'));
    const identificadores = [];
    Object.entries(r.datos.paths).forEach(([camino, operaciones]) => {
      Object.entries(operaciones).forEach(([metodo, op]) => {
        identificadores.push(op.operationId);
        assert.ok(op.summary, metodo + ' ' + camino + ' tiene resumen');
        assert.ok(etiquetas.has(op.tags[0]), metodo + ' ' + camino + ' usa una etiqueta declarada');
      });
    });
    assert.equal(new Set(identificadores).size, identificadores.length, 'ningún operationId repetido');
  });

  it('CA-02 los cuerpos salen de los mismos esquemas que valida la API', () => {
    const esquemas = documento.components.schemas;

    /* Una colección nueva en definiciones.js tiene que llegar a la
       documentación: si falta, este recuento avisa. */
    const colecciones = Object.entries(D).filter(([, def]) => def && def.tabla);
    const salidas = Object.keys(esquemas).filter((n) => !/(Crear|Actualizar)$/.test(n) && n !== 'Id' && n !== 'Error');
    assert.equal(salidas.length, colecciones.length,
      'cada colección de definiciones.js necesita su esquema en openapi.js (COLECCIONES)');
    assert.equal(
      Object.keys(esquemas).filter((n) => /Crear$/.test(n)).length,
      colecciones.filter(([, def]) => def.esquemas && def.esquemas.crear).length);

    /* Los límites y las enumeraciones son los de definiciones.js, no copias */
    assert.equal(esquemas.RiesgoCrear.properties.titulo.maxLength, 1000);
    assert.deepEqual(esquemas.RiesgoCrear.properties.p, { type: 'integer', minimum: 1, maximum: 5 });
    assert.deepEqual(esquemas.TareaCrear.properties.estado.enum, D.E.estadosTarea);
    assert.deepEqual(esquemas.ProyectoCrear.properties.metodologia.enum, D.E.metodologias);
    assert.deepEqual(esquemas.RiesgoCrear.required, ['titulo']);

    /* La salida lleva un campo por columna, más lo que calcula la API */
    assert.ok(esquemas.Riesgo.properties.severidad, 'el riesgo devuelve su severidad');
    assert.ok(esquemas.Proyecto.properties.nivel, 'el proyecto devuelve el nivel de quien pregunta');
    D.riesgos.campos.forEach(([campo]) => assert.ok(esquemas.Riesgo.properties[campo], 'Riesgo.' + campo));

    /* Nunca se documenta la contraseña como algo que devuelva la API */
    assert.equal(esquemas.Usuario.properties.clave, undefined);
    assert.equal(esquemas.Usuario.properties.claveHash, undefined);
  });

  it('CA-03 toda ruta documentada existe y responde algo de lo documentado', async () => {
    const fallos = [];
    for (const [camino, operaciones] of Object.entries(documento.paths)) {
      for (const [metodo, op] of Object.entries(operaciones)) {
        if (FUERA_DEL_BARRIDO.includes(metodo + ' ' + camino)) continue;
        const cliente = op.security && op.security.length === 0 ? e.anonimo : e.admin;
        const r = await cliente[metodo === 'delete' ? 'del' : metodo](caminoReal(camino));
        const donde = metodo.toUpperCase() + ' ' + camino;

        if (r.datos && typeof r.datos.error === 'string' && /^No existe la ruta/.test(r.datos.error)) {
          fallos.push(donde + ' está documentada pero no existe en la API');
        } else if (!op.responses[r.estado]) {
          fallos.push(donde + ' respondió ' + r.estado + ', que no está documentado (' +
            Object.keys(op.responses).join(', ') + ')');
        }
      }
    }
    assert.deepEqual(fallos, []);
  });

  it('CA-04 la página de Scalar se sirve y carga el documento', async () => {
    const r = await e.anonimo.get('/api/docs');
    assert.equal(r.estado, 200);
    assert.match(r.cabeceras.get('content-type'), /text\/html/);
    const html = r.datos.toString('utf8');
    assert.match(html, /<title>API del Gestor PMBOK 8<\/title>/);
    assert.match(html, /\/api\/openapi\.json/);
  });

  it('CA-05 con DOCS_ACTIVAS=false no se publica ni el documento ni la página', async () => {
    config.docs.activas = false;
    const servidor = await new Promise((resolver) => {
      const s = crearApp().listen(0, '127.0.0.1', () => resolver(s));
    });
    try {
      const base = 'http://127.0.0.1:' + servidor.address().port;
      for (const ruta of ['/api/openapi.json', '/api/docs']) {
        const r = await fetch(base + ruta);
        assert.equal(r.status, 401, ruta + ' deja de ser pública');
      }
    } finally {
      config.docs.activas = true;
      servidor.closeAllConnections();
      await new Promise((resolver) => servidor.close(resolver));
    }
  });
});
