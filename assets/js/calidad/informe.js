/* ═══════════════════════════════════════════════════════════
   calidad/informe.js — El informe de calidad del plan
   ───────────────────────────────────────────────────────────
   Puntaje global, pendientes por resolver, historial de evaluaciones y
   el plan completo listo para leer o imprimir.
   ═══════════════════════════════════════════════════════════ */

window.CalidadInforme = (function () {
  'use strict';

  var R = window.Render;

  /* ══════════════ INFORME ══════════════ */

  function informe() {
    var p = Proyecto.cargar();
    var ev = Calidad.evaluarProyecto(p);
    Proyecto.registrarPuntaje(ev);
    var g = ev.global;
    var nombre = Proyecto.valor('enc', 'nombre');

    var filas = ev.secciones.map(function (s) {
      var color = s.puntaje >= 75 ? 'var(--ok)' : s.puntaje >= 45 ? 'var(--ambar)' : 'var(--rojo)';
      return '<tr>' +
        '<td><a href="' + CalidadPiezas.ruta() + '/seccion/' + s.id + '">' + s.n + '. ' + s.nombre + '</a></td>' +
        '<td style="width:120px">' + CalidadPiezas.barra(s.puntaje, color) + '</td>' +
        '<td style="text-align:right;font-weight:600;color:' + color + '">' + s.puntaje + '</td>' +
        '<td style="text-align:right">' + s.completitud + ' %</td>' +
        '<td style="text-align:right">' + s.camposLlenos + '/' + s.camposTotal + '</td>' +
        '<td style="text-align:right">' + (s.procesosTotal ? s.procesosMarcados + '/' + s.procesosTotal : '—') + '</td>' +
        '</tr>';
    }).join('');

    var cruzadas = ev.cruzadas.map(function (c) {
      return '<div class="pa-cruzada ' + c.estado + '">' +
        '<div class="pa-cruzada-cab">' +
          '<span class="pa-marca">' + CalidadPiezas.iconoEstado(c.estado) + '</span>' +
          '<b>' + c.titulo + '</b>' + CalidadPiezas.pastillaEstado(c.estado) +
          '<span class="pa-sev ' + c.severidad + '">' + c.severidad + '</span>' +
        '</div>' +
        '<div class="pa-cruzada-det">' + R.escapar(c.detalle) + '</div>' +
        (c.estado !== 'ok' && c.explicacion ? '<div class="pa-cruzada-exp">' + c.explicacion + '</div>' : '') +
        (c.estado !== 'ok' && c.comoCorregir ? '<div class="pa-hallazgo-como"><b>Cómo corregirlo:</b> ' + c.comoCorregir + '</div>' : '') +
        (c.evidencia && c.evidencia.length
          ? '<ul class="pa-evidencia">' + c.evidencia.map(function (e) { return '<li>' + R.escapar(e) + '</li>'; }).join('') + '</ul>'
          : '') +
        '</div>';
    }).join('');

    // Los campos sin redactar se agrupan: cien tarjetas iguales diciendo
    // «campo vacío» esconden las observaciones que de verdad importan.
    var vacios = ev.hallazgos.filter(function (h) { return h.tipo === 'vacio'; });
    var observados = ev.hallazgos.filter(function (h) { return h.tipo !== 'vacio'; });

    var porSeveridad = { alta: [], media: [], baja: [] };
    observados.forEach(function (h) { porSeveridad[h.severidad].push(h); });

    var hallazgos = pendientesHTML(vacios, ev) + ['alta', 'media', 'baja'].map(function (sev) {
      if (!porSeveridad[sev].length) return '';
      var titulo = { alta: 'Severidad alta', media: 'Severidad media', baja: 'Severidad baja' }[sev];
      return '<h3>' + titulo + ' <span class="pa-conteo">' + porSeveridad[sev].length + '</span></h3>' +
        '<div class="pa-hallazgos">' + porSeveridad[sev].slice(0, 40).map(CalidadPanel.hallazgoHTML).join('') + '</div>';
    }).join('');

    var evolucion = historialHTML(p.historial);

    return '<div class="hoja-ancha prosa">' +
      R.migas([{ texto: 'Panel', ruta: '#/panel' }, { texto: 'Calidad del plan', ruta: CalidadPiezas.ruta() }, { texto: 'Informe' }]) +
      '<div class="eyebrow">Verificación de calidad</div>' +
      '<h1 class="titulo-pagina">' + (nombre ? R.escapar(nombre) : 'Informe del proyecto') + '</h1>' +
      '<p class="bajada">Evaluación del plan contra la estructura de la 8.ª edición: calidad de cada campo, ' +
      'coherencia entre secciones y cobertura de procesos. Generado el ' +
      new Date().toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' }) + '.</p>' +

      '<div class="pa-tablero">' +
        '<div class="pa-tablero-dial">' + CalidadPiezas.dial(g.puntaje, g.nivel, 'grande') +
          '<div class="pa-nivel" style="color:' + CalidadPiezas.colorNivel(g.nivel) + '">' + g.nivel.etiqueta + '</div></div>' +
        '<div class="pa-tablero-cuerpo">' +
          '<p class="pa-veredicto">' + g.veredicto + '</p>' +
          '<div class="pa-kpis">' +
            CalidadPiezas.kpi('Calidad del contenido', g.contenido + ' / 100', g.contenido) +
            CalidadPiezas.kpi('Coherencia entre secciones', g.coherencia + ' / 100', g.coherencia) +
            CalidadPiezas.kpi('Completitud', g.completitud + ' %', g.completitud) +
            CalidadPiezas.kpi('Procesos aplicados', g.procesosMarcados + ' / ' + g.procesosTotal, g.cobertura) +
          '</div>' +
          '<div class="tarjeta-pie">' +
            '<button class="btn primario" data-pa="exportar-md">Descargar plan e informe (.md)</button>' +
            '<button class="btn" data-pa="imprimir">Imprimir o guardar en PDF</button>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="nota"><div class="nota-titulo">Cómo se calcula</div>' +
      'El puntaje global pondera la <b>calidad del contenido</b> (78 %) y la <b>coherencia entre secciones</b> (22 %). ' +
      'La calidad de cada campo sale de criterios verificables —extensión, datos numéricos, fechas, estructura, ' +
      'precisión del lenguaje— ponderados por el peso del campo. La cobertura de procesos se informa aparte porque ' +
      'declarar que un proceso se aplicó no demuestra que se aplicara bien.</div>' +

      '<h2>Puntaje por sección</h2>' +
      '<div class="envoltura-tabla"><table class="pa-tabla">' +
        '<thead><tr><th>Sección</th><th></th><th style="text-align:right">Calidad</th>' +
        '<th style="text-align:right">Completitud</th><th style="text-align:right">Campos</th>' +
        '<th style="text-align:right">Procesos</th></tr></thead>' +
        '<tbody>' + filas + '</tbody></table></div>' +

      evolucion +

      '<h2>Verificaciones de coherencia</h2>' +
      '<p style="color:var(--tinta-2);font-size:13.6px;margin-bottom:14px">' +
      'Comprueban que las secciones no se contradigan: es donde falla la mayoría de los planes, ' +
      'cada parte correcta por su cuenta e incompatible con las demás.</p>' +
      '<div class="pa-cruzadas">' + cruzadas + '</div>' +

      '<h2>Observaciones detalladas <span class="pa-conteo">' + ev.hallazgos.length + '</span></h2>' +
      (ev.hallazgos.length
        ? hallazgos
        : '<div class="nota"><div class="nota-titulo">Sin observaciones</div>No queda nada pendiente de corregir.</div>') +

      '<h2>Plan redactado</h2>' +
      '<p style="color:var(--tinta-2);font-size:13.6px;margin-bottom:14px">' +
      'Todo lo que has escrito, en orden, listo para revisar o imprimir.</p>' +
      planCompleto(ev) +
      '</div>';
  }

  /* Campos pendientes, agrupados por sección */
  function pendientesHTML(vacios, ev) {
    if (!vacios.length) return '';

    var porSeccion = {};
    ev.secciones.forEach(function (s) {
      var pend = s.campos.filter(function (c) { return c.vacio; });
      if (pend.length) porSeccion[s.id] = { seccion: s, campos: pend };
    });

    var filas = Object.keys(porSeccion).map(function (id) {
      var g = porSeccion[id];
      return '<div class="pa-pendiente">' +
        '<a href="' + CalidadPiezas.ruta() + '/seccion/' + id + '">' + g.seccion.n + '. ' + g.seccion.nombre + '</a>' +
        '<div class="pa-pendiente-campos">' + g.campos.map(function (c) {
          return '<span class="pa-pendiente-campo' + (c.peso >= 3 ? ' clave' : '') + '">' +
            R.escapar(c.etiqueta) + '</span>';
        }).join('') + '</div></div>';
    }).join('');

    return '<h3>Campos sin redactar <span class="pa-conteo">' + vacios.length + '</span></h3>' +
      '<p style="color:var(--tinta-2);font-size:13.4px;margin-bottom:12px">' +
      'Resaltados, los de mayor peso: son los que más mueven el puntaje y de los que dependen ' +
      'las verificaciones de coherencia.</p>' +
      '<div class="pa-pendientes">' + filas + '</div>';
  }

  function historialHTML(historial) {
    if (!historial || historial.length < 2) return '';
    var max = 100;
    var puntos = historial.slice(-24);
    var ancho = 100 / Math.max(1, puntos.length - 1);
    var d = puntos.map(function (h, i) {
      return (i === 0 ? 'M' : 'L') + (i * ancho).toFixed(2) + ' ' + (100 - (h.puntaje / max) * 100).toFixed(2);
    }).join(' ');
    var primero = puntos[0], ultimo = puntos[puntos.length - 1];
    var delta = ultimo.puntaje - primero.puntaje;

    return '<h2>Evolución</h2>' +
      '<div class="pa-evolucion">' +
        '<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' +
          '<path d="' + d + '" fill="none" stroke="var(--acento)" stroke-width="1.6" vector-effect="non-scaling-stroke"/>' +
        '</svg>' +
        '<div class="pa-evolucion-meta">' +
          '<div><b>' + ultimo.puntaje + '</b><span>puntaje actual</span></div>' +
          '<div><b>' + (delta >= 0 ? '+' : '') + delta + '</b><span>desde ' + new Date(primero.fecha).toLocaleDateString('es') + '</span></div>' +
          '<div><b>' + puntos.length + '</b><span>revisiones</span></div>' +
        '</div>' +
      '</div>';
  }

  function planCompleto(ev) {
    return (PMBOK.seccionesProyecto || []).map(function (sec) {
      var e = ev.secciones.filter(function (s) { return s.id === sec.id; })[0];
      var campos = sec.campos.map(function (c) {
        var v = Proyecto.valor(sec.id, c.id);
        return '<div class="pa-plan-campo">' +
          '<div class="pa-plan-et">' + c.etiqueta + '</div>' +
          (v ? '<pre>' + R.escapar(v) + '</pre>' : '<div class="pa-plan-vacio">Sin redactar</div>') +
          '</div>';
      }).join('');
      return '<div class="pa-plan-sec">' +
        '<h3>' + sec.n + '. ' + sec.nombre +
          ' <span class="pa-plan-puntaje">' + e.puntaje + '/100</span></h3>' +
        campos + '</div>';
    }).join('');
  }

  return { informe: informe };
})();
