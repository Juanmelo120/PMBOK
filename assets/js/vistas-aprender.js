/* ═══════════════════════════════════════════════════════════
   vistas-aprender.js — Referencia de la guía
   ───────────────────────────────────────────────────────────
   Lo que el gestor aplica, explicado: los 7 dominios, los 40
   procesos y los 6 principios. Los catálogos de herramientas y
   artefactos viven en vistas-gestor.js.
   ═══════════════════════════════════════════════════════════ */

window.Vistas = (function () {
  'use strict';

  var R = window.Render;

  /* ══════════════ DOMINIO ══════════════ */

  function dominio(id) {
    var d = (PMBOK.dominios || []).filter(function (x) { return x.id === id; })[0];
    if (!d) return noEncontrado();
    var meta = Indice.dominioMeta(d.clave);

    var conceptos = R.tabla(['Concepto', 'Qué significa'],
      d.conceptosClave.map(function (c) { return ['**' + c.t + '**', c.d]; }));

    var procesos = PMBOK.areasEnfoque.map(function (a) {
      var ps = Indice.procesosEnCelda(d.clave, a.id);
      if (!ps.length) return '';
      return '<h3>' + a.nombre + '</h3><div class="rejilla rejilla-2">' + ps.map(function (p) {
        return '<a class="tarjeta acentuada ' + d.clase + '" href="#/proceso/' + p.id + '">' +
          '<div class="tarjeta-eyebrow">' + p.cod + '</div>' +
          '<div class="tarjeta-titulo">' + p.nombre + '</div>' +
          '<div class="tarjeta-texto">' + p.proposito + '</div></a>';
      }).join('') + '</div>';
    }).join('');

    var interacciones = R.tabla(['Dominio', 'Naturaleza de la interacción'],
      d.interacciones.map(function (i) {
        var m = Indice.dominioMeta(i.con);
        return ['**' + (m ? m.nombre : i.con) + '**', i.d];
      }));

    var verificar = R.tabla(['Indicador', 'Señal de que el dominio funciona'],
      d.verificar.map(function (v) { return ['**' + v.ind + '**', v.ok]; }));

    return '<div class="hoja prosa ' + d.clase + '">' +
      R.migas([{ texto: 'Aprender', ruta: '#/aprender' }, { texto: meta.nombre }]) +
      '<div class="eyebrow">Dominio de desempeño ' + d.n + '</div>' +
      '<h1 class="titulo-pagina">' + d.titulo + '</h1>' +
      '<p class="bajada">' + d.resumen + '</p>' +
      '<div class="fila-etiquetas">' +
        '<span class="pastilla-dominio ' + d.clase + '">' + meta.procesos + ' procesos</span>' +
        R.etiqueta(meta.lema) +
      '</div>' +

      R.enEstaPagina([
        { id: 'conceptos', texto: 'Conceptos clave' },
        { id: 'procesos', texto: 'Procesos del dominio' },
        { id: 'adaptacion', texto: 'Consideraciones de adaptación' },
        { id: 'interacciones', texto: 'Interacciones con otros dominios' },
        { id: 'verificar', texto: 'Verificar resultados' }
      ]) +

      '<h2 id="conceptos"><span class="num-sec">1</span>Conceptos clave</h2>' + conceptos +

      '<h2 id="procesos"><span class="num-sec">2</span>Procesos del dominio</h2>' +
      '<p>Los ' + meta.procesos + ' procesos de este dominio, agrupados por su área de enfoque:</p>' + procesos +

      '<h2 id="adaptacion"><span class="num-sec">3</span>Consideraciones de adaptación</h2>' +
      '<p>Qué ajustar en este dominio según el contexto del proyecto:</p>' +
      '<ul>' + d.adaptacion.map(function (a) { return '<li>' + R.enLinea(a) + '</li>'; }).join('') + '</ul>' +

      '<h2 id="interacciones"><span class="num-sec">4</span>Interacciones con otros dominios</h2>' + interacciones +

      '<h2 id="verificar"><span class="num-sec">5</span>Verificar resultados</h2>' +
      '<p>Indicadores observables para saber si el dominio está funcionando:</p>' + verificar +

      seccionEjemplos(d.ejemplos) +
      seccionPreguntas(d.preguntas) +
      navDominios(d) +
      '</div>';
  }

  function navDominios(d) {
    var todos = PMBOK.dominios;
    var i = todos.map(function (x) { return x.id; }).indexOf(d.id);
    var ant = i > 0 ? todos[i - 1] : null;
    var sig = i < todos.length - 1 ? todos[i + 1] : null;
    var html = '<nav class="nav-secuencia">';
    html += ant
      ? '<a href="#/dominio/' + ant.id + '"><div class="dir">← Dominio anterior</div>' +
        '<div class="tit">' + Indice.dominioMeta(ant.clave).nombre + '</div></a>'
      : '<a href="#/aprender"><div class="dir">← Volver</div><div class="tit">Aprender</div></a>';
    html += sig
      ? '<a class="sig" href="#/dominio/' + sig.id + '"><div class="dir">Dominio siguiente →</div>' +
        '<div class="tit">' + Indice.dominioMeta(sig.clave).nombre + '</div></a>'
      : '<a class="sig" href="#/procesos"><div class="dir">Siguiente →</div>' +
        '<div class="tit">Catálogo de los 40 procesos</div></a>';
    return html + '</nav>';
  }

  /* ══════════════ PROCESO ══════════════ */

  function proceso(id) {
    var p = (PMBOK.procesos || []).filter(function (x) { return x.id === id; })[0];
    if (!p) return noEncontrado();

    var dm = Indice.dominioMeta(p.dominio);
    var ae = Indice.areaMeta(p.area);
    var dom = PMBOK.dominios.filter(function (x) { return x.clave === p.dominio; })[0];
    var f = PMBOK.flujoPorId[p.id];

    var hermanos = Indice.procesosDe(p.dominio);
    var pos = hermanos.map(function (x) { return x.id; }).indexOf(p.id);
    var navProceso = '<nav class="nav-secuencia">' +
      (pos > 0
        ? '<a href="#/proceso/' + hermanos[pos - 1].id + '"><div class="dir">← ' + dm.nombre + '</div>' +
          '<div class="tit">' + hermanos[pos - 1].nombre + '</div></a>'
        : '<a href="#/procesos"><div class="dir">← Volver</div><div class="tit">Catálogo de procesos</div></a>') +
      (pos < hermanos.length - 1
        ? '<a class="sig" href="#/proceso/' + hermanos[pos + 1].id + '"><div class="dir">' + dm.nombre + ' →</div>' +
          '<div class="tit">' + hermanos[pos + 1].nombre + '</div></a>'
        : '') +
      '</nav>';

    var errores = (p.errores && p.errores.length)
      ? '<h2>Errores frecuentes</h2><div class="nota alerta"><div class="nota-titulo">Qué evitar</div>' +
        '<ul style="margin:0;padding-left:18px">' +
        p.errores.map(function (e) { return '<li>' + R.enLinea(e) + '</li>'; }).join('') + '</ul></div>'
      : '';

    return '<div class="hoja prosa ' + dm.clase + '">' +
      R.migas([{ texto: 'Aprender', ruta: '#/aprender' },
               { texto: 'Procesos', ruta: '#/procesos' },
               { texto: p.cod }]) +
      '<div class="eyebrow">Proceso ' + p.cod + '</div>' +
      '<h1 class="titulo-pagina">' + p.nombre + '</h1>' +
      '<p class="bajada">' + p.proposito + '</p>' +

      '<div class="flujo">' +
        '<a class="flujo-paso" href="' + (dom ? '#/dominio/' + dom.id : '#/aprender') + '">Dominio: <b>' + dm.nombre + '</b></a>' +
        '<span class="flujo-flecha">·</span>' +
        '<span class="flujo-paso">Área de enfoque: <b>' + ae.nombre + '</b></span>' +
      '</div>' +

      aplicarEnProyecto(p) +

      '<h2>Descripción</h2>' +
      (p.descripcion || []).map(function (t) { return '<p>' + R.enLinea(t) + '</p>'; }).join('') +

      '<h2>Entradas, herramientas y salidas</h2>' +
      R.itto(p.entradas, p.herramientas, p.salidas) +

      (f ? '<div class="g-consejo"><div class="g-consejo-et">Consejo del mentor</div>' + f.consejo + '</div>' : '') +
      (p.ejemplo ? '<h2>Ejemplo aplicado</h2>' + R.ejemplo(p.ejemplo) : '') +
      errores +
      seccionPreguntas(p.preguntas) +
      navProceso +
      '</div>';
  }

  /* Enlace directo al mismo proceso dentro de los proyectos en curso */
  function aplicarEnProyecto(p) {
    if (!window.Gestor || !Gestor.haySesion()) return '';
    var proyectos = Gestor.proyectosVisibles().filter(function (x) { return x.estado === 'activo'; });
    if (!proyectos.length) return '';
    return '<div class="nota"><div class="nota-titulo">Aplicarlo</div>' +
      'Ejecuta este proceso en ' + (proyectos.length === 1 ? 'tu proyecto' : 'uno de tus proyectos') + ': ' +
      proyectos.slice(0, 4).map(function (x) {
        return '<a class="ref" href="#/proyectos/' + x.id + '/proceso/' + p.id + '">' + R.escapar(x.nombre) + '</a>';
      }).join(' · ') + '.</div>';
  }

  /* ══════════════ CATÁLOGO DE PROCESOS ══════════════ */

  function catalogoProcesos() {
    var filtros = '<div class="barra-filtros">' +
      '<input type="search" id="filtro-procesos" placeholder="Filtrar por nombre o propósito…" aria-label="Filtrar procesos">' +
      '<select id="filtro-dominio" class="btn" aria-label="Filtrar por dominio">' +
        '<option value="">Todos los dominios</option>' +
        PMBOK.dominiosMeta.map(function (d) {
          return '<option value="' + d.id + '">' + d.nombre + ' (' + d.procesos + ')</option>';
        }).join('') +
      '</select>' +
      '<select id="filtro-area" class="btn" aria-label="Filtrar por área de enfoque">' +
        '<option value="">Todas las áreas</option>' +
        PMBOK.areasEnfoque.map(function (a) {
          return '<option value="' + a.id + '">' + a.nombre + '</option>';
        }).join('') +
      '</select>' +
      '<span id="conteo-procesos" class="pa-contador">40 procesos</span>' +
      '</div>';

    var tarjetas = PMBOK.procesos.map(function (p) {
      var dm = Indice.dominioMeta(p.dominio);
      var ae = Indice.areaMeta(p.area);
      return '<a class="tarjeta acentuada ' + dm.clase + ' item-proceso" href="#/proceso/' + p.id + '" ' +
        'data-dominio="' + p.dominio + '" data-area="' + p.area + '" ' +
        'data-texto="' + R.escapar(Indice.normalizar(p.nombre + ' ' + p.proposito)) + '">' +
        '<div class="tarjeta-eyebrow">' + p.cod + ' · ' + ae.nombre + '</div>' +
        '<div class="tarjeta-titulo">' + p.nombre + '</div>' +
        '<div class="tarjeta-texto">' + p.proposito + '</div>' +
        '<div class="tarjeta-pie">' + R.pastillaDominio(p.dominio) + '</div></a>';
    }).join('');

    return '<div class="hoja-ancha prosa">' +
      R.migas([{ texto: 'Aprender', ruta: '#/aprender' }, { texto: 'Procesos' }]) +
      '<h1 class="titulo-pagina">Los 40 procesos</h1>' +
      '<p class="bajada">Ficha de referencia de cada proceso: propósito, descripción, entradas, ' +
      'herramientas, salidas y errores frecuentes. Para ejecutarlos, ábrelos dentro de un proyecto.</p>' +
      filtros +
      '<div class="rejilla rejilla-2" id="lista-procesos">' + tarjetas + '</div>' +
      '<div id="sin-procesos" hidden>' +
      R.vacio('◇', 'Sin coincidencias', 'Ningún proceso coincide con los filtros aplicados.') + '</div>' +
      '</div>';
  }

  /* ══════════════ PRINCIPIO ══════════════ */

  function principio(id) {
    var p = (PMBOK.principios || []).filter(function (x) { return x.id === id; })[0];
    if (!p) return noEncontrado();

    var dominios = (p.dominios || []).map(function (clave) {
      var d = Indice.dominioMeta(clave);
      var dom = PMBOK.dominios.filter(function (x) { return x.clave === clave; })[0];
      if (!d) return '';
      return '<a class="tarjeta acentuada ' + d.clase + '" href="#/dominio/' + (dom ? dom.id : '') + '">' +
        '<div class="tarjeta-eyebrow">Dominio conectado</div>' +
        '<div class="tarjeta-titulo">' + d.nombre + '</div>' +
        '<div class="tarjeta-texto">' + d.lema + '</div></a>';
    }).join('');

    var senales = p.senales ? '<h2>Cómo saber si está presente</h2>' + R.tabla(
      ['Señales de que el principio se aplica', 'Señales de que falta'],
      p.senales.presente.map(function (s, i) { return [s, p.senales.ausente[i] || '']; })
    ) : '';

    var todos = PMBOK.principios;
    var i = todos.map(function (x) { return x.id; }).indexOf(p.id);

    return '<div class="hoja prosa">' +
      R.migas([{ texto: 'Aprender', ruta: '#/aprender' }, { texto: 'Principios' }, { texto: p.n }]) +
      '<div class="eyebrow">Principio ' + p.n + '</div>' +
      '<h1 class="titulo-pagina">' + p.titulo + '</h1>' +
      '<p class="bajada">' + p.lema + '</p>' +

      '<blockquote class="cita">' + p.enunciado + '<cite>Enunciado del principio</cite></blockquote>' +
      '<p>' + p.resumen + '</p>' +

      '<h2><span class="num-sec">1</span>Impacto en el proyecto</h2>' +
      '<ul>' + p.impacto.map(function (x) { return '<li>' + R.enLinea(x) + '</li>'; }).join('') + '</ul>' +

      '<h2><span class="num-sec">2</span>El principio en acción</h2>' +
      '<p>Comportamientos observables de quien aplica este principio:</p>' +
      '<ul>' + p.enAccion.map(function (x) { return '<li>' + R.enLinea(x) + '</li>'; }).join('') + '</ul>' +

      senales +

      '<h2><span class="num-sec">3</span>Dominios conectados</h2>' +
      '<div class="rejilla rejilla-2">' + dominios + '</div>' +

      '<nav class="nav-secuencia">' +
        (i > 0
          ? '<a href="#/principio/' + todos[i - 1].id + '"><div class="dir">← Principio anterior</div>' +
            '<div class="tit">' + todos[i - 1].titulo + '</div></a>'
          : '<a href="#/aprender"><div class="dir">← Volver</div><div class="tit">Aprender</div></a>') +
        (i < todos.length - 1
          ? '<a class="sig" href="#/principio/' + todos[i + 1].id + '"><div class="dir">Principio siguiente →</div>' +
            '<div class="tit">' + todos[i + 1].titulo + '</div></a>'
          : '') +
      '</nav>' +
      '</div>';
  }

  /* ══════════════ AUXILIARES ══════════════ */

  function seccionEjemplos(lista) {
    if (!lista || !lista.length) return '';
    return '<h2>Ejemplos aplicados</h2>' +
      '<p style="color:var(--tinta-2);font-size:13.6px;margin-bottom:16px">' +
      'Casos construidos para mostrar el concepto en funcionamiento, con su desenlace.</p>' +
      R.ejemplos(lista);
  }

  function seccionPreguntas(lista) {
    if (!lista || !lista.length) return '';
    return '<h2>Preguntas frecuentes</h2>' + R.acordeon(lista, true);
  }

  function noEncontrado() {
    return '<div class="hoja">' +
      R.vacio('◇', 'No encontrado',
        'La dirección solicitada no corresponde a ninguna pantalla. Vuelve al ' +
        '<a class="ref" href="#/panel">panel</a> o abre la búsqueda con <kbd>Ctrl</kbd><kbd>K</kbd>.') +
      '</div>';
  }

  return {
    dominio: dominio,
    proceso: proceso,
    catalogoProcesos: catalogoProcesos,
    principio: principio,
    noEncontrado: noEncontrado
  };
})();
