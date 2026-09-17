/* ═══════════════════════════════════════════════════════════
   gestion/aprender.js — Aprender la guía y sus catálogos
   ───────────────────────────────────────────────────────────
   El recorrido por los principios y dominios, y los catálogos de
   herramientas y de artefactos.
   ═══════════════════════════════════════════════════════════ */

window.GestionAprender = (function () {
  'use strict';

  var R = window.Render;

  /* ══════════════ APRENDER ══════════════ */

  function aprender() {
    var accesos = [
      { r: '#/procesos', i: 'procesos', e: '40', t: 'Los procesos', d: 'Propósito, entradas, herramientas, salidas y errores frecuentes de cada uno.' },
      { r: '#/herramientas', i: 'herramientas', e: '155', t: 'Herramientas y técnicas', d: 'Catálogo filtrable por familia y por texto.' },
      { r: '#/artefactos', i: 'artefactos', e: '42', t: 'Artefactos', d: 'Los documentos que produce un proyecto, con la plantilla que se rellena.' },
      { r: '#/eos', i: 'eos', e: '4', t: 'EOS', d: 'Rocas, scorecard, VTO y organigrama: la capa directiva sobre los proyectos.' }
    ].map(function (a) {
      return '<a class="tarjeta tarjeta-acceso" href="' + a.r + '">' +
        '<span class="tarjeta-icono">' + Iconos.svg(a.i) + '</span>' +
        '<span class="tarjeta-cifra">' + a.e + '</span>' +
        '<div class="tarjeta-titulo">' + a.t + '</div>' +
        '<div class="tarjeta-texto">' + a.d + '</div></a>';
    }).join('');

    var bandas = PMBOK.bandas.map(function (b, i) {
      var n = PMBOK.flujo.filter(function (f) { return f.banda === b.id; }).length;
      return '<div class="g-banda-mini"><i>' + b.n + '</i><div><b>' + b.nombre + '</b><span>' + n + ' procesos</span></div></div>' +
        (i < PMBOK.bandas.length - 1 ? '<span class="g-flecha" aria-hidden="true"></span>' : '');
    }).join('');

    var dominios = PMBOK.dominiosMeta.map(function (d) {
      var dom = PMBOK.dominios.filter(function (x) { return x.clave === d.id; })[0];
      return '<a class="tarjeta tarjeta-dominio ' + d.clase + '" href="#/dominio/' + (dom ? dom.id : '') + '">' +
        '<span class="tarjeta-inicial" aria-hidden="true">' + d.nombre.charAt(0) + '</span>' +
        '<div class="tarjeta-eyebrow">' + d.procesos + ' procesos</div>' +
        '<div class="tarjeta-titulo">' + d.nombre + '</div>' +
        '<div class="tarjeta-texto">' + d.lema + '</div></a>';
    }).join('');

    return '<div class="hoja-ancha prosa">' +
      '<div class="eyebrow">Modo aprender</div>' +
      '<h1 class="titulo-pagina">Guía didáctica PMBOK® 8.ª edición</h1>' +
      '<p class="bajada">Los 7 dominios de desempeño, los 40 procesos, 155 herramientas y 42 artefactos. ' +
      'Todo lo que el gestor aplica a tus proyectos, explicado.</p>' +
      R.bandaSimulacion() +

      '<h2>El ciclo de vida en cinco bandas</h2>' +
      '<div class="g-bandas-mini">' + bandas + '</div>' +

      '<h2>Por dónde empezar</h2>' +
      '<div class="rejilla rejilla-2">' + accesos + '</div>' +

      '<h2>Los siete dominios de desempeño</h2>' +
      '<div class="rejilla rejilla-3">' + dominios + '</div>' +

      '<h2>Los seis principios</h2>' +
      '<p style="color:var(--tinta-2);font-size:13.6px;margin-bottom:14px">' +
      'Criterios de juicio, no procedimientos. La verificación de calidad de cada proyecto pide evidencia de los seis.</p>' +
      '<div class="rejilla rejilla-3 rejilla-seis">' + PMBOK.principios.map(function (pr) {
        return '<a class="tarjeta" href="#/principio/' + pr.id + '">' +
          '<div class="tarjeta-eyebrow">Principio ' + pr.n + '</div>' +
          '<div class="tarjeta-titulo">' + pr.titulo + '</div>' +
          '<div class="tarjeta-texto">' + pr.lema + '</div></a>';
      }).join('') + '</div>' +
      '</div>';
  }

  /* ══════════════ CATÁLOGOS ══════════════ */

  function herramientas() {
    var grupos = PMBOK.gruposHerramienta.map(function (g) {
      var suyas = PMBOK.herramientas.filter(function (h) { return h.grupo === g.id; });
      if (!suyas.length) return '';
      return '<h2 id="g-' + g.id + '">' + g.nombre + ' <span class="pa-conteo">' + suyas.length + '</span></h2>' +
        '<div class="g-catalogo">' + suyas.map(function (h) {
          return '<div class="g-ficha item-herramienta" data-texto="' +
            R.escapar(Indice.normalizar(h.nombre + ' ' + h.descripcion)) + '">' +
            '<div class="g-ficha-nombre">' + R.escapar(h.nombre) + '</div>' +
            '<div class="g-ficha-desc">' + R.escapar(h.descripcion) + '</div></div>';
        }).join('') + '</div>';
    }).join('');

    return '<div class="hoja-ancha prosa">' +
      R.migas([{ texto: 'Aprender', ruta: '#/aprender' }, { texto: 'Herramientas' }]) +
      '<h1 class="titulo-pagina">Herramientas y técnicas</h1>' +
      '<p class="bajada">Las ' + PMBOK.herramientas.length + ' herramientas de la 8.ª edición, agrupadas por familia. ' +
      'Cada proceso indica cuáles le corresponden.</p>' +
      '<div class="barra-filtros"><input type="search" id="filtro-herramientas" placeholder="Filtrar herramientas…" ' +
      'aria-label="Filtrar herramientas"><span id="conteo-herramientas" class="pa-contador"></span></div>' +
      grupos +
      '</div>';
  }

  function artefactos() {
    var filas = PMBOK.categoriasArtefacto.map(function (c) {
      var suyos = PMBOK.artefactos.filter(function (a) { return a.categoria === c.id; });
      if (!suyos.length) return '';
      return '<h2>' + c.nombre + ' <span class="pa-conteo">' + suyos.length + '</span></h2>' +
        '<div class="g-catalogo">' + suyos.map(function (a) {
          var produce = PMBOK.flujo.filter(function (f) { return (f.salidas || []).indexOf(a.id) !== -1; });
          return '<div class="g-ficha item-artefacto" data-texto="' +
            R.escapar(Indice.normalizar(a.nombre + ' ' + a.descripcion)) + '">' +
            '<div class="g-ficha-nombre">' + R.escapar(a.nombre) + '</div>' +
            '<div class="g-ficha-desc">' + R.escapar(a.descripcion) + '</div>' +
            '<div class="g-ficha-pie">' + a.plantilla.length + ' bloques · lo produce ' +
              produce.slice(0, 2).map(function (f) {
                var p = PMBOK.procesos.filter(function (x) { return x.id === f.id; })[0];
                return p ? '<a href="#/proceso/' + p.id + '">' + p.cod + '</a>' : '';
              }).filter(Boolean).join(', ') +
            '</div></div>';
        }).join('') + '</div>';
    }).join('');

    return '<div class="hoja-ancha prosa">' +
      R.migas([{ texto: 'Aprender', ruta: '#/aprender' }, { texto: 'Artefactos' }]) +
      '<h1 class="titulo-pagina">Artefactos</h1>' +
      '<p class="bajada">Los ' + PMBOK.artefactos.length + ' documentos que produce un proyecto. ' +
      'Cada uno trae la plantilla que se rellena al generarlo desde su proceso.</p>' +
      '<div class="barra-filtros"><input type="search" id="filtro-artefactos" placeholder="Filtrar artefactos…" ' +
      'aria-label="Filtrar artefactos"></div>' +
      filas +
      '</div>';
  }

  return { aprender: aprender, herramientas: herramientas, artefactos: artefactos };
})();
