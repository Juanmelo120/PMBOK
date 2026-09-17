/* ═══════════════════════════════════════════════════════════
   calidad/seccion.js — Una sección del plan, campo a campo
   ───────────────────────────────────────────────────────────
   Cada campo con su ejemplo desarrollado, sus criterios de calidad y los
   procesos del PMBOK que lo respaldan.
   ═══════════════════════════════════════════════════════════ */

window.CalidadSeccion = (function () {
  'use strict';

  var R = window.Render;

  /* ══════════════ SECCIÓN ══════════════ */

  function seccion(id) {
    var sec = Proyecto.seccion(id);
    if (!sec) return Vistas.noEncontrado();

    var p = Proyecto.cargar();
    var e = Calidad.evaluarSeccion(sec, (p.campos || {})[sec.id], p.procesos);
    var retro = Calidad.retroalimentacion(e);
    var dm = sec.dominio ? Indice.dominioMeta(sec.dominio) : null;
    var indice = (PMBOK.seccionesProyecto || []).map(function (s) { return s.id; }).indexOf(id);
    var anterior = PMBOK.seccionesProyecto[indice - 1];
    var siguiente = PMBOK.seccionesProyecto[indice + 1];

    return '<div class="hoja-ancha prosa" data-seccion="' + sec.id + '">' +
      R.migas([{ texto: 'Panel', ruta: '#/panel' }, { texto: 'Calidad del plan', ruta: CalidadPiezas.ruta() },
               { texto: 'Sección ' + sec.n }]) +
      '<div class="eyebrow">Sección ' + sec.n + ' de 10' + (dm ? ' · Dominio de ' + dm.nombre : '') + '</div>' +
      '<h1 class="titulo-pagina">' + sec.nombre + '</h1>' +
      '<p class="bajada">' + sec.lema + '</p>' +

      '<div class="pa-cabecera-seccion">' +
        '<div id="pa-dial-seccion">' + CalidadPiezas.dial(e.puntaje, e.nivel) + '</div>' +
        '<div>' +
          '<div class="pa-nivel" id="pa-nivel-seccion" style="color:' + CalidadPiezas.colorNivel(e.nivel) + '">' + e.nivel.etiqueta + '</div>' +
          '<div class="pa-sec-campos" id="pa-completitud-seccion">' + e.camposLlenos + ' de ' + e.camposTotal + ' campos redactados</div>' +
        '</div>' +
        '<div class="pa-cabecera-acciones">' +
          '<button class="btn" data-pa="verificar">Verificar sección</button>' +
          '<a class="btn" href="' + CalidadPiezas.ruta() + '">Volver al panel</a>' +
        '</div>' +
      '</div>' +

      '<div class="nota"><div class="nota-titulo">Para qué sirve esta sección</div>' + sec.proposito + '</div>' +

      fundamento(sec) +

      '<h2>Redacción guiada</h2>' +
      '<div class="pa-campos">' + sec.campos.map(function (c) {
        return campoHTML(sec, c, e.campos.filter(function (x) { return x.id === c.id; })[0]);
      }).join('') + '</div>' +

      procesosHTML(sec) +

      '<h2>Retroalimentación</h2>' +
      '<div id="pa-retro">' + retroHTML(retro, e) + '</div>' +

      navegacionSecciones(anterior, siguiente) +
      '</div>';
  }

  function fundamento(sec) {
    var tarjetas = (sec.fundamento || []).map(function (nid) {
      var n = Indice.nodo(nid);
      if (!n) return '';
      return '<a class="tarjeta" href="' + n.ruta + '">' +
        '<div class="tarjeta-eyebrow">' + R.escapar(n.grupo) + '</div>' +
        '<div class="tarjeta-titulo">' + R.escapar(n.titulo) + '</div>' +
        '<div class="tarjeta-texto">' + R.escapar(String(n.subtitulo || '').slice(0, 110)) + '…</div></a>';
    }).filter(Boolean).join('');
    if (!tarjetas) return '';
    return '<h2>Fundamento en la guía</h2>' +
      '<p style="color:var(--tinta-2);font-size:13.6px;margin-bottom:14px">' +
      'Lo que la 8.ª edición dice sobre lo que vas a redactar aquí. Ábrelo en otra pestaña si necesitas consultarlo mientras escribes.</p>' +
      '<div class="rejilla rejilla-3">' + tarjetas + '</div>';
  }

  function campoHTML(sec, campo, ev) {
    var valor = Proyecto.valor(sec.id, campo.id);
    var sug = Proyecto.sugerencia(sec.id, campo.id);
    var filas = campo.tipo === 'corto' ? 2 : campo.tipo === 'texto' ? 6 : 8;

    var guia = (campo.guia || []).length
      ? '<ul class="pa-guia">' + campo.guia.map(function (g) { return '<li>' + R.enLinea(g) + '</li>'; }).join('') + '</ul>'
      : '';

    return '<div class="pa-campo" data-campo="' + campo.id + '" data-seccion="' + sec.id + '">' +
      '<div class="pa-campo-cab">' +
        '<h3>' + campo.etiqueta + '</h3>' +
        '<span class="pa-peso" title="Peso de este campo en el puntaje de la sección">peso ' + (campo.peso || 1) + '</span>' +
      '</div>' +
      '<p class="pa-campo-ayuda">' + R.enLinea(campo.ayuda || '') + '</p>' +
      (campo.formato ? '<div class="pa-formato"><span>Formato</span><code>' + R.escapar(campo.formato) + '</code></div>' : '') +
      guia +

      (sug
        ? '<div class="pa-sugerencia">' +
            '<div class="pa-sugerencia-cab">' +
              '<span class="etiqueta acento">Encontrado en tu documento</span>' +
              '<span class="pa-origen">' + R.escapar(sug.origen) + '</span>' +
            '</div>' +
            '<pre>' + R.escapar(sug.texto.slice(0, 600)) + (sug.texto.length > 600 ? '…' : '') + '</pre>' +
            '<div class="tarjeta-pie">' +
              '<button class="btn" data-pa="usar-sugerencia" data-s="' + sec.id + '" data-c="' + campo.id + '">' +
              (valor ? 'Reemplazar con este texto' : 'Usar este texto') + '</button>' +
            '</div>' +
          '</div>'
        : '') +

      '<textarea class="pa-entrada" id="pa-in-' + sec.id + '-' + campo.id + '" rows="' + filas + '" ' +
        'data-s="' + sec.id + '" data-c="' + campo.id + '" ' +
        'placeholder="' + R.escapar(campo.ayuda ? campo.ayuda.slice(0, 90) : '') + '">' + R.escapar(valor) + '</textarea>' +

      '<div class="pa-campo-pie">' +
        '<span class="pa-contador" id="pa-cont-' + sec.id + '-' + campo.id + '">' + contadorTexto(valor) + '</span>' +
        (campo.ejemplo ? '<button class="pa-mini" data-pa="ver-ejemplo" data-s="' + sec.id + '" data-c="' + campo.id + '">Ver ejemplo desarrollado</button>' : '') +
      '</div>' +

      (campo.ejemplo
        ? '<div class="pa-ejemplo" id="pa-ej-' + sec.id + '-' + campo.id + '" hidden>' +
            '<div class="pa-ejemplo-cab">Ejemplo — proyecto de modernización de nómina</div>' +
            '<pre>' + R.escapar(campo.ejemplo) + '</pre>' +
            '<div class="tarjeta-pie"><button class="btn" data-pa="copiar-ejemplo" data-s="' + sec.id + '" data-c="' + campo.id + '">' +
            'Copiar como punto de partida</button>' +
            '<span class="pa-aviso-inline">Sustitúyelo por los datos de tu proyecto: si lo dejas igual, la verificación lo detectará como contenido ajeno.</span></div>' +
          '</div>'
        : '') +

      '<div class="pa-criterios" id="pa-cr-' + sec.id + '-' + campo.id + '">' + criteriosHTML(ev) + '</div>' +
      '</div>';
  }

  function contadorTexto(valor) {
    var pal = Calidad.palabras(valor);
    var lin = Calidad.lineas(valor).length;
    if (!pal) return 'Sin redactar';
    return pal + ' palabra' + (pal === 1 ? '' : 's') + ' · ' + lin + ' línea' + (lin === 1 ? '' : 's');
  }

  function criteriosHTML(ev) {
    if (!ev || !ev.criterios || !ev.criterios.length) return '';
    var color = ev.puntaje >= 75 ? 'var(--ok)' : ev.puntaje >= 45 ? 'var(--ambar)' : 'var(--rojo)';
    return '<div class="pa-criterios-cab">' +
        '<span>Verificación de calidad</span>' +
        '<b style="color:' + color + '">' + (ev.vacio ? '—' : ev.puntaje + ' / 100') + '</b>' +
      '</div>' +
      ev.criterios.map(function (c) {
        return '<div class="pa-criterio ' + c.estado + '">' +
          '<span class="pa-marca">' + CalidadPiezas.iconoEstado(c.estado) + '</span>' +
          '<div>' +
            '<div class="pa-criterio-tit">' + R.escapar(c.etiqueta) + '</div>' +
            (c.detalle ? '<div class="pa-criterio-det">' + R.escapar(c.detalle) + '</div>' : '') +
            (c.como ? '<div class="pa-criterio-como">' + R.escapar(c.como) + '</div>' : '') +
            (c.evidencia && c.evidencia.length
              ? '<ul class="pa-evidencia">' + c.evidencia.map(function (e) { return '<li>' + R.escapar(e) + '</li>'; }).join('') + '</ul>'
              : '') +
          '</div></div>';
      }).join('');
  }

  function procesosHTML(sec) {
    if (!sec.procesos || !sec.procesos.length) return '';
    var items = sec.procesos.map(function (id) {
      var pr = (PMBOK.procesos || []).filter(function (x) { return x.id === id; })[0];
      if (!pr) return '';
      var marcado = Proyecto.procesoMarcado(id);
      var area = Indice.areaMeta(pr.area);
      return '<div class="pa-proceso' + (marcado ? ' marcado' : '') + '">' +
        '<button class="pa-check' + (marcado ? ' activo' : '') + '" data-pa="proceso" data-id="' + id + '" ' +
          'aria-pressed="' + marcado + '" aria-label="Marcar proceso como aplicado">✓</button>' +
        '<div>' +
          '<div class="pa-proceso-tit"><span class="pa-cod">' + pr.cod + '</span> ' + R.escapar(pr.nombre) + '</div>' +
          '<div class="pa-proceso-sub">' + (area ? area.nombre : '') + ' · ' + R.escapar(pr.proposito.slice(0, 120)) + '…</div>' +
        '</div>' +
        '<a class="pa-mini" href="#/proceso/' + id + '">Ficha →</a>' +
        '</div>';
    }).join('');

    return '<h2>Procesos que cubre esta sección</h2>' +
      '<p style="color:var(--tinta-2);font-size:13.6px;margin-bottom:14px">' +
      'Marca los que hayas aplicado realmente en tu proyecto. La marca no sube el puntaje de calidad: ' +
      'mide la <b>cobertura</b> de los 40 procesos, que se informa aparte.</p>' +
      '<div class="pa-procesos">' + items + '</div>';
  }

  function retroHTML(retro, e) {
    function lista(titulo, items, clase) {
      if (!items.length) return '';
      return '<div class="pa-retro-bloque ' + clase + '">' +
        '<div class="pa-retro-tit">' + titulo + ' <span>' + items.length + '</span></div>' +
        '<ul>' + items.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul></div>';
    }
    return '<div class="pa-retro">' +
      '<p class="pa-retro-resumen">' + retro.resumen + '</p>' +
      lista('Debes corregir', retro.correcciones, 'falla') +
      lista('Puedes mejorar', retro.sugerencias, 'aviso') +
      lista('Bien resuelto', retro.fortalezas, 'ok') +
      '</div>';
  }

  function navegacionSecciones(anterior, siguiente) {
    var html = '<nav class="nav-secuencia">';
    if (anterior) {
      html += '<a href="' + CalidadPiezas.ruta() + '/seccion/' + anterior.id + '"><div class="dir">← Sección anterior</div>' +
        '<div class="tit">' + anterior.n + '. ' + anterior.nombre + '</div></a>';
    } else {
      html += '<a href="' + CalidadPiezas.ruta() + '"><div class="dir">← Volver</div><div class="tit">Panel del proyecto</div></a>';
    }
    if (siguiente) {
      html += '<a class="sig" href="' + CalidadPiezas.ruta() + '/seccion/' + siguiente.id + '"><div class="dir">Sección siguiente →</div>' +
        '<div class="tit">' + siguiente.n + '. ' + siguiente.nombre + '</div></a>';
    } else {
      html += '<a class="sig" href="' + CalidadPiezas.ruta() + '/informe"><div class="dir">Siguiente →</div>' +
        '<div class="tit">Informe de calidad</div></a>';
    }
    return html + '</nav>';
  }

  /* Las tres últimas las repinta la edición en vivo, sin recargar la sección */
  return {
    seccion: seccion,
    criteriosHTML: criteriosHTML,
    contadorTexto: contadorTexto,
    retroHTML: retroHTML
  };
})();
