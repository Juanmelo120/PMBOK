/* ═══════════════════════════════════════════════════════════
   vistas-proyecto.js — Pantallas del módulo «Mi proyecto»
   Panel de aplicación, secciones guiadas e informe de calidad.
   ═══════════════════════════════════════════════════════════ */

window.VistasProyecto = (function () {
  'use strict';

  var R = window.Render;
  var recargarVista = function () {};

  /* Las pantallas de calidad viven dentro de un proyecto del gestor.
     La base dice bajo qué ruta se están mostrando. */
  var base = '#/proyecto';
  function fijarBase(b) { base = b || '#/proyecto'; }

  /* ══════════════ Piezas reutilizables ══════════════ */

  function colorNivel(nivel) {
    return nivel.color === 'ok' ? 'var(--acento)'
         : nivel.color === 'aviso' ? 'var(--ambar)' : 'var(--rojo)';
  }

  function dial(puntaje, nivel, tamano) {
    return '<div class="pa-dial ' + (tamano || '') + '" style="--v:' + puntaje + ';--c:' + colorNivel(nivel) + '">' +
      '<div class="pa-dial-centro"><b>' + puntaje + '</b><span>/ 100</span></div></div>';
  }

  function barra(pct, color) {
    var f = Math.max(0, Math.min(100, Number(pct) || 0)) / 100;
    return '<div class="pa-barra" role="presentation"><i style="transform:scaleX(' + f.toFixed(3) + ');background:' + (color || 'var(--acento)') + '"></i></div>';
  }

  function pastillaEstado(estado) {
    var m = {
      ok: ['Correcto', 'ok'], parcial: ['Parcial', 'aviso'], falta: ['Falta', 'falla'],
      aviso: ['Revisar', 'aviso'], falla: ['Falla', 'falla'], pendiente: ['Pendiente', 'neutro']
    }[estado] || ['—', 'neutro'];
    return '<span class="pa-pastilla ' + m[1] + '">' + m[0] + '</span>';
  }

  function iconoEstado(estado) {
    if (estado === 'ok') return '✓';
    if (estado === 'parcial' || estado === 'aviso') return '!';
    if (estado === 'pendiente') return '·';
    return '×';
  }

  /* ══════════════ PANEL ══════════════ */

  function panel() {
    var p = Proyecto.cargar();
    var ev = Calidad.evaluarProyecto(p);
    var hayProyecto = Proyecto.existe();

    return '<div class="hoja-ancha prosa">' +
      R.migas([{ texto: 'Panel', ruta: '#/panel' }, { texto: 'Calidad del plan' }]) +
      '<div class="eyebrow">Aplicación guiada</div>' +
      '<h1 class="titulo-pagina">Mi proyecto</h1>' +
      '<p class="bajada">Sube el documento de tu proyecto y recórrelo por las diez secciones en que se aplica la ' +
      '8.ª edición. Cada sección te dice qué debe contener, verifica lo que escribes contra criterios explícitos ' +
      'y señala qué corregir.</p>' +

      bloqueCarga() +
      (hayProyecto ? tablero(ev) : '') +
      listaSecciones(ev) +
      (hayProyecto ? bloqueHallazgos(ev) : '') +
      bloqueDatos() +
      '</div>';
  }

  function bloqueCarga() {
    var p = Proyecto.cargar();
    var doc = p.documento;

    if (doc) {
      var res = Proyecto.resumenDocumento(doc.texto);
      var n = Proyecto.contarSugerencias();
      return '<div class="pa-panel">' +
        '<div class="pa-panel-cab"><h2 style="margin:0">Documento cargado</h2>' +
          '<button class="btn" data-pa="quitar-doc">Quitar</button></div>' +
        '<div class="pa-doc">' +
          '<div class="pa-doc-icono">' + (doc.tipo === 'docx' ? 'DOCX' : doc.tipo.toUpperCase()) + '</div>' +
          '<div>' +
            '<div class="pa-doc-nombre">' + R.escapar(doc.nombre) + '</div>' +
            '<div class="pa-doc-meta">' + res.palabras.toLocaleString('es') + ' palabras · ' +
              res.parrafos + ' párrafos · ' + res.titulos + ' títulos detectados · cargado el ' +
              new Date(doc.fecha).toLocaleDateString('es') +
              (doc.recortado ? ' · <b>recortado a ' + (300000).toLocaleString('es') + ' caracteres</b>' : '') +
            '</div>' +
          '</div>' +
        '</div>' +
        (n
          ? '<div class="nota"><div class="nota-titulo">Contenido reconocido</div>' +
            'Se han localizado fragmentos que encajan con <b>' + n + '</b> campos del plan. ' +
            'Puedes volcarlos en los campos que aún estén vacíos y editarlos después: son propuestas extraídas ' +
            'literalmente de tu documento, no contenido generado.' +
            '<div class="tarjeta-pie"><button class="btn primario" data-pa="aplicar-sugerencias">' +
            'Prerellenar ' + n + ' campos vacíos</button></div></div>'
          : '<div class="nota aviso"><div class="nota-titulo">Sin coincidencias claras</div>' +
            'El documento no usa encabezados reconocibles (objetivos, alcance, interesados, riesgos…). ' +
            'Puedes redactar las secciones a mano: cada campo trae guía y ejemplo.</div>') +
        '</div>';
    }

    return '<div class="pa-panel">' +
      '<h2 style="margin:0 0 4px">Sube tu proyecto</h2>' +
      '<p style="color:var(--tinta-2);font-size:13.5px;margin:0 0 14px">' +
        'Admite <b>.docx</b>, <b>.txt</b>, <b>.md</b> y <b>.csv</b>. También puedes pegar el texto. ' +
        'Todo se procesa en tu navegador: el archivo no sale de tu equipo.</p>' +

      '<div class="pa-soltar" id="pa-soltar">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0L7 9m5-5l5 5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>' +
        '<div><b>Arrastra el archivo aquí</b> o <label class="pa-enlace-archivo" for="pa-archivo">selecciónalo</label></div>' +
        '<input type="file" id="pa-archivo" accept=".docx,.txt,.md,.csv,.json,.text" hidden>' +
        '<div class="pa-soltar-nota">Los .pdf y .doc no son legibles sin conexión: pega su texto.</div>' +
      '</div>' +
      '<div id="pa-aviso-carga"></div>' +

      '<details class="pa-pegar"><summary>O pega el texto del proyecto</summary>' +
        '<textarea id="pa-texto-pegado" placeholder="Pega aquí el enunciado, la propuesta o el documento de tu proyecto…" rows="7"></textarea>' +
        '<div class="tarjeta-pie"><button class="btn primario" data-pa="guardar-pegado">Analizar este texto</button></div>' +
      '</details>' +
      '</div>';
  }

  function tablero(ev) {
    var g = ev.global;
    return '<div class="pa-tablero">' +
      '<div class="pa-tablero-dial">' +
        dial(g.puntaje, g.nivel, 'grande') +
        '<div class="pa-nivel" style="color:' + colorNivel(g.nivel) + '">' + g.nivel.etiqueta + '</div>' +
      '</div>' +
      '<div class="pa-tablero-cuerpo">' +
        '<p class="pa-veredicto">' + g.veredicto + '</p>' +
        '<div class="pa-kpis">' +
          kpi('Calidad del contenido', g.contenido + ' / 100', g.contenido) +
          kpi('Coherencia entre secciones', g.coherencia + ' / 100', g.coherencia) +
          kpi('Completitud del plan', g.completitud + ' %', g.completitud) +
          kpi('Procesos aplicados', g.procesosMarcados + ' / ' + g.procesosTotal, g.cobertura) +
        '</div>' +
        '<div class="tarjeta-pie">' +
          '<a class="btn primario" href="' + base + '/informe">Ver informe de calidad</a>' +
          '<button class="btn" data-pa="exportar-md">Descargar plan e informe (.md)</button>' +
        '</div>' +
      '</div>' +
      '</div>';
  }

  function kpi(etiqueta, valor, pct) {
    var color = pct >= 75 ? 'var(--acento)' : pct >= 45 ? 'var(--ambar)' : 'var(--rojo)';
    return '<div class="pa-kpi"><div class="pa-kpi-et">' + etiqueta + '</div>' +
      '<div class="pa-kpi-val">' + valor + '</div>' + barra(pct, color) + '</div>';
  }

  function listaSecciones(ev) {
    var filas = (PMBOK.seccionesProyecto || []).map(function (sec) {
      var e = ev.secciones.filter(function (s) { return s.id === sec.id; })[0];
      var dm = sec.dominio ? Indice.dominioMeta(sec.dominio) : null;
      var color = e.puntaje >= 75 ? 'var(--acento)' : e.puntaje >= 45 ? 'var(--ambar)' : 'var(--rojo)';
      return '<a class="pa-sec" href="' + base + '/seccion/' + sec.id + '">' +
        '<div class="pa-sec-n">' + sec.n + '</div>' +
        '<div class="pa-sec-cuerpo">' +
          '<div class="pa-sec-tit">' + sec.nombre +
            (dm ? ' <span class="pastilla-dominio ' + dm.clase + '">' + dm.nombre + '</span>' : '') + '</div>' +
          '<div class="pa-sec-lema">' + sec.lema + '</div>' +
          barra(e.completitud, color) +
        '</div>' +
        '<div class="pa-sec-cifras">' +
          '<div class="pa-sec-puntaje" style="color:' + color + '">' + (e.camposLlenos ? e.puntaje : '—') + '</div>' +
          '<div class="pa-sec-campos">' + e.camposLlenos + '/' + e.camposTotal + ' campos</div>' +
        '</div>' +
        '</a>';
    }).join('');

    return '<h2>Las diez secciones</h2>' +
      '<p style="color:var(--tinta-2);font-size:13.6px;margin-bottom:14px">' +
      'Siguen el orden natural de aplicación: encuadre, gobernanza, los cinco dominios de planificación, ' +
      'la verificación de principios y el cierre. Puedes trabajarlas en cualquier orden.</p>' +
      '<div class="pa-secciones">' + filas + '</div>';
  }

  function bloqueHallazgos(ev) {
    if (!ev.hallazgos.length) {
      return '<h2>Hallazgos</h2><div class="nota"><div class="nota-titulo">Sin observaciones</div>' +
        'No hay hallazgos pendientes: el plan supera todos los criterios verificables.</div>';
    }

    // «Campo sin redactar» repetido veinte veces tapa lo que hay que leer:
    // se resume en una línea y se muestran las observaciones de fondo.
    var vacios = ev.hallazgos.filter(function (h) { return h.tipo === 'vacio'; });
    var observados = ev.hallazgos.filter(function (h) { return h.tipo !== 'vacio'; });
    var altos = observados.filter(function (h) { return h.severidad === 'alta'; });
    var lista = (altos.length ? altos : observados).slice(0, 6);

    return '<h2>Qué corregir primero</h2>' +
      '<p style="color:var(--tinta-2);font-size:13.6px;margin-bottom:14px">' +
      ev.hallazgos.length + ' observaciones en total' +
      (vacios.length ? ', de las cuales <b>' + vacios.length + '</b> son campos todavía sin redactar' : '') +
      '. ' + (observados.length
        ? 'Estas son las de fondo, ordenadas por impacto sobre la calidad del plan.'
        : 'No hay problemas de calidad en lo ya escrito: lo que falta es completar.') + '</p>' +
      (lista.length ? '<div class="pa-hallazgos">' + lista.map(hallazgoHTML).join('') + '</div>' : '') +
      '<p style="margin-top:12px"><a class="ref" href="' + base + '/informe">' +
      'Ver las ' + ev.hallazgos.length + ' observaciones en el informe →</a></p>';
  }

  function hallazgoHTML(h) {
    return '<div class="pa-hallazgo ' + h.severidad + '">' +
      '<div class="pa-hallazgo-cab">' +
        '<span class="pa-sev ' + h.severidad + '">' + h.severidad + '</span>' +
        '<b>' + R.escapar(h.titulo) + '</b>' +
      '</div>' +
      (h.detalle ? '<div class="pa-hallazgo-det">' + R.escapar(h.detalle) + '</div>' : '') +
      (h.como ? '<div class="pa-hallazgo-como"><b>Cómo corregirlo:</b> ' + R.escapar(h.como) + '</div>' : '') +
      (h.evidencia && h.evidencia.length
        ? '<ul class="pa-evidencia">' + h.evidencia.map(function (e) {
            return '<li>' + R.escapar(e) + '</li>';
          }).join('') + '</ul>'
        : '') +
      (h.ruta ? '<div class="tarjeta-pie"><a class="ref" href="' + base + '/seccion/' + h.ruta +
        '">Ir a la sección →</a></div>' : '') +
      '</div>';
  }

  function bloqueDatos() {
    return '<h2>Datos del proyecto</h2>' +
      '<p>El proyecto se guarda solo en este navegador. Expórtalo para conservarlo o llevarlo a otro equipo.</p>' +
      '<div class="tarjeta-pie">' +
        '<button class="btn" data-pa="exportar-json">Exportar proyecto (.json)</button>' +
        '<button class="btn" data-pa="exportar-md">Exportar plan e informe (.md)</button>' +
        '<label class="btn" for="pa-importar">Importar proyecto (.json)</label>' +
        '<input type="file" id="pa-importar" accept=".json" hidden>' +
        '<button class="btn" data-pa="reiniciar">Empezar de cero</button>' +
      '</div>';
  }

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
      R.migas([{ texto: 'Panel', ruta: '#/panel' }, { texto: 'Calidad del plan', ruta: base },
               { texto: 'Sección ' + sec.n }]) +
      '<div class="eyebrow">Sección ' + sec.n + ' de 10' + (dm ? ' · Dominio de ' + dm.nombre : '') + '</div>' +
      '<h1 class="titulo-pagina">' + sec.nombre + '</h1>' +
      '<p class="bajada">' + sec.lema + '</p>' +

      '<div class="pa-cabecera-seccion">' +
        '<div id="pa-dial-seccion">' + dial(e.puntaje, e.nivel) + '</div>' +
        '<div>' +
          '<div class="pa-nivel" id="pa-nivel-seccion" style="color:' + colorNivel(e.nivel) + '">' + e.nivel.etiqueta + '</div>' +
          '<div class="pa-sec-campos" id="pa-completitud-seccion">' + e.camposLlenos + ' de ' + e.camposTotal + ' campos redactados</div>' +
        '</div>' +
        '<div class="pa-cabecera-acciones">' +
          '<button class="btn" data-pa="verificar">Verificar sección</button>' +
          '<a class="btn" href="' + base + '">Volver al panel</a>' +
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
    var color = ev.puntaje >= 75 ? 'var(--acento)' : ev.puntaje >= 45 ? 'var(--ambar)' : 'var(--rojo)';
    return '<div class="pa-criterios-cab">' +
        '<span>Verificación de calidad</span>' +
        '<b style="color:' + color + '">' + (ev.vacio ? '—' : ev.puntaje + ' / 100') + '</b>' +
      '</div>' +
      ev.criterios.map(function (c) {
        return '<div class="pa-criterio ' + c.estado + '">' +
          '<span class="pa-marca">' + iconoEstado(c.estado) + '</span>' +
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
      html += '<a href="' + base + '/seccion/' + anterior.id + '"><div class="dir">← Sección anterior</div>' +
        '<div class="tit">' + anterior.n + '. ' + anterior.nombre + '</div></a>';
    } else {
      html += '<a href="' + base + '"><div class="dir">← Volver</div><div class="tit">Panel del proyecto</div></a>';
    }
    if (siguiente) {
      html += '<a class="sig" href="' + base + '/seccion/' + siguiente.id + '"><div class="dir">Sección siguiente →</div>' +
        '<div class="tit">' + siguiente.n + '. ' + siguiente.nombre + '</div></a>';
    } else {
      html += '<a class="sig" href="' + base + '/informe"><div class="dir">Siguiente →</div>' +
        '<div class="tit">Informe de calidad</div></a>';
    }
    return html + '</nav>';
  }

  /* ══════════════ INFORME ══════════════ */

  function informe() {
    var p = Proyecto.cargar();
    var ev = Calidad.evaluarProyecto(p);
    Proyecto.registrarPuntaje(ev);
    var g = ev.global;
    var nombre = Proyecto.valor('enc', 'nombre');

    var filas = ev.secciones.map(function (s) {
      var color = s.puntaje >= 75 ? 'var(--acento)' : s.puntaje >= 45 ? 'var(--ambar)' : 'var(--rojo)';
      return '<tr>' +
        '<td><a href="' + base + '/seccion/' + s.id + '">' + s.n + '. ' + s.nombre + '</a></td>' +
        '<td style="width:120px">' + barra(s.puntaje, color) + '</td>' +
        '<td style="text-align:right;font-weight:600;color:' + color + '">' + s.puntaje + '</td>' +
        '<td style="text-align:right">' + s.completitud + ' %</td>' +
        '<td style="text-align:right">' + s.camposLlenos + '/' + s.camposTotal + '</td>' +
        '<td style="text-align:right">' + (s.procesosTotal ? s.procesosMarcados + '/' + s.procesosTotal : '—') + '</td>' +
        '</tr>';
    }).join('');

    var cruzadas = ev.cruzadas.map(function (c) {
      return '<div class="pa-cruzada ' + c.estado + '">' +
        '<div class="pa-cruzada-cab">' +
          '<span class="pa-marca">' + iconoEstado(c.estado) + '</span>' +
          '<b>' + c.titulo + '</b>' + pastillaEstado(c.estado) +
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
        '<div class="pa-hallazgos">' + porSeveridad[sev].slice(0, 40).map(hallazgoHTML).join('') + '</div>';
    }).join('');

    var evolucion = historialHTML(p.historial);

    return '<div class="hoja-ancha prosa">' +
      R.migas([{ texto: 'Panel', ruta: '#/panel' }, { texto: 'Calidad del plan', ruta: base }, { texto: 'Informe' }]) +
      '<div class="eyebrow">Verificación de calidad</div>' +
      '<h1 class="titulo-pagina">' + (nombre ? R.escapar(nombre) : 'Informe del proyecto') + '</h1>' +
      '<p class="bajada">Evaluación del plan contra la estructura de la 8.ª edición: calidad de cada campo, ' +
      'coherencia entre secciones y cobertura de procesos. Generado el ' +
      new Date().toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' }) + '.</p>' +

      '<div class="pa-tablero">' +
        '<div class="pa-tablero-dial">' + dial(g.puntaje, g.nivel, 'grande') +
          '<div class="pa-nivel" style="color:' + colorNivel(g.nivel) + '">' + g.nivel.etiqueta + '</div></div>' +
        '<div class="pa-tablero-cuerpo">' +
          '<p class="pa-veredicto">' + g.veredicto + '</p>' +
          '<div class="pa-kpis">' +
            kpi('Calidad del contenido', g.contenido + ' / 100', g.contenido) +
            kpi('Coherencia entre secciones', g.coherencia + ' / 100', g.coherencia) +
            kpi('Completitud', g.completitud + ' %', g.completitud) +
            kpi('Procesos aplicados', g.procesosMarcados + ' / ' + g.procesosTotal, g.cobertura) +
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
        '<a href="' + base + '/seccion/' + id + '">' + g.seccion.n + '. ' + g.seccion.nombre + '</a>' +
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

  /* ══════════════ Interacción ══════════════ */

  function conectar(sub, arg, recargar) {
    recargarVista = recargar || function () {};

    conectarCarga();
    conectarAcciones();
    if (sub === 'seccion') conectarEdicion(arg);
  }

  /* — Carga de archivos — */
  function conectarCarga() {
    var input = document.getElementById('pa-archivo');
    if (input) {
      input.addEventListener('change', function () {
        if (input.files && input.files[0]) procesarArchivo(input.files[0]);
      });
    }

    var zona = document.getElementById('pa-soltar');
    if (zona) {
      ['dragenter', 'dragover'].forEach(function (ev) {
        zona.addEventListener(ev, function (e) {
          e.preventDefault(); e.stopPropagation();
          zona.classList.add('activa');
        });
      });
      ['dragleave', 'drop'].forEach(function (ev) {
        zona.addEventListener(ev, function (e) {
          e.preventDefault(); e.stopPropagation();
          zona.classList.remove('activa');
        });
      });
      zona.addEventListener('drop', function (e) {
        var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) procesarArchivo(f);
      });
    }

    var imp = document.getElementById('pa-importar');
    if (imp) {
      imp.addEventListener('change', function () {
        if (imp.files && imp.files[0]) procesarArchivo(imp.files[0]);
      });
    }
  }

  function avisoCarga(texto, clase) {
    var caja = document.getElementById('pa-aviso-carga');
    if (!caja) { if (clase === 'alerta') Dialogo.avisar(texto, 'error'); return; }
    caja.innerHTML = texto
      ? '<div class="nota ' + (clase || '') + '"><div class="nota-titulo">' +
        (clase === 'alerta' ? 'No se pudo cargar' : 'Procesando') + '</div>' + R.escapar(texto) + '</div>'
      : '';
  }

  function procesarArchivo(archivo) {
    avisoCarga('Leyendo ' + archivo.name + '…', '');
    Proyecto.importarArchivo(archivo, function (err) {
      if (err) { avisoCarga(err, 'alerta'); return; }
      recargarVista();
    });
  }

  /* — Botones — */
  function conectarAcciones() {
    var botones = document.querySelectorAll('[data-pa]');
    for (var i = 0; i < botones.length; i++) {
      botones[i].addEventListener('click', manejar);
    }
  }

  function manejar(e) {
    var el = e.currentTarget;
    var accion = el.getAttribute('data-pa');
    var s = el.getAttribute('data-s');
    var c = el.getAttribute('data-c');

    if (accion === 'guardar-pegado') {
      e.preventDefault();
      var area = document.getElementById('pa-texto-pegado');
      if (!area || !area.value.trim()) { avisoCarga('Pega primero el texto del proyecto.', 'alerta'); return; }
      Proyecto.guardarTextoPegado(area.value, 'Texto pegado', function (err) {
        if (err) { avisoCarga(err, 'alerta'); return; }
        recargarVista();
      });

    } else if (accion === 'aplicar-sugerencias') {
      e.preventDefault();
      var n = Proyecto.aplicarSugerencias();
      recargarVista();
      Dialogo.avisar(n
        ? n + ' campos rellenados con extractos de tu documento: revísalos'
        : 'No quedaban campos vacíos que rellenar', n ? 'ok' : 'aviso');

    } else if (accion === 'quitar-doc') {
      e.preventDefault();
      Dialogo.confirmar({
        titulo: 'Quitar el documento cargado',
        texto: 'Lo que ya hayas escrito en las secciones se conserva; solo se pierden las propuestas de extracción.',
        confirmar: 'Quitar documento'
      }, function () {
        Proyecto.borrarDocumento();
        recargarVista();
      });

    } else if (accion === 'usar-sugerencia') {
      e.preventDefault();
      var sug = Proyecto.sugerencia(s, c);
      if (!sug) return;
      var campoEl = document.getElementById('pa-in-' + s + '-' + c);
      if (campoEl) {
        campoEl.value = sug.texto;
        guardarCampo(campoEl);
        campoEl.focus();
      }

    } else if (accion === 'ver-ejemplo') {
      e.preventDefault();
      var caja = document.getElementById('pa-ej-' + s + '-' + c);
      if (caja) {
        caja.hidden = !caja.hidden;
        el.textContent = caja.hidden ? 'Ver ejemplo desarrollado' : 'Ocultar ejemplo';
      }

    } else if (accion === 'copiar-ejemplo') {
      e.preventDefault();
      var campoDef = Proyecto.campo(s, c);
      var destino = document.getElementById('pa-in-' + s + '-' + c);
      if (campoDef && destino) {
        var copiar = function () {
          var anterior = destino.value;
          destino.value = campoDef.ejemplo;
          guardarCampo(destino);
          destino.focus();
          Dialogo.avisar('Ejemplo copiado: sustitúyelo por tus datos', 'ok', anterior ? {
            etiqueta: 'Deshacer',
            hacer: function () { destino.value = anterior; guardarCampo(destino); }
          } : null);
        };
        copiar();
      }

    } else if (accion === 'proceso') {
      e.preventDefault();
      var id = el.getAttribute('data-id');
      var activo = Proyecto.alternarProceso(id);
      el.classList.toggle('activo', activo);
      el.setAttribute('aria-pressed', String(activo));
      el.parentNode.classList.toggle('marcado', activo);

    } else if (accion === 'verificar') {
      e.preventDefault();
      recargarVista();

    } else if (accion === 'exportar-json') {
      e.preventDefault();
      descargar('pmbok8-proyecto.json', JSON.stringify(Proyecto.exportarJSON(), null, 2), 'application/json');

    } else if (accion === 'exportar-md') {
      e.preventDefault();
      var ev = Calidad.evaluarProyecto(Proyecto.cargar());
      descargar(nombreArchivo() + '-pmbok8.md', Proyecto.informeMarkdown(ev), 'text/markdown');

    } else if (accion === 'imprimir') {
      e.preventDefault();
      window.print();

    } else if (accion === 'reiniciar') {
      e.preventDefault();
      Dialogo.confirmar({
        titulo: 'Vaciar el plan de calidad',
        texto: 'Se borran el documento cargado, los campos redactados y el historial de puntajes de este proyecto.',
        confirmar: 'Vaciar plan', peligro: true
      }, function () {
        Proyecto.reiniciar();
        recargarVista();
      });
    }
  }

  /* — Edición con guardado y verificación en vivo — */
  var temporizador = null;

  function conectarEdicion(seccionId) {
    var entradas = document.querySelectorAll('.pa-entrada');
    for (var i = 0; i < entradas.length; i++) {
      entradas[i].addEventListener('input', function () {
        var el = this;
        var cont = document.getElementById('pa-cont-' + el.getAttribute('data-s') + '-' + el.getAttribute('data-c'));
        if (cont) cont.textContent = contadorTexto(el.value);
        if (temporizador) clearTimeout(temporizador);
        temporizador = setTimeout(function () { guardarCampo(el); }, 500);
      });
      entradas[i].addEventListener('blur', function () {
        if (temporizador) { clearTimeout(temporizador); temporizador = null; }
        guardarCampo(this);
      });
    }
    ajustarAlturas();
    if (seccionId) actualizarCabeceraSeccion(seccionId);
  }

  /* Nombre de archivo a partir del nombre del proyecto */
  function nombreArchivo() {
    var base = Calidad.normalizar(Proyecto.valor('enc', 'nombre') || 'proyecto');
    base = base.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
    return base || 'proyecto';
  }

  function ajustarAlturas() {
    var entradas = document.querySelectorAll('.pa-entrada');
    for (var i = 0; i < entradas.length; i++) {
      var el = entradas[i];
      if (el.value && el.scrollHeight > el.clientHeight) {
        el.style.height = Math.min(560, el.scrollHeight + 4) + 'px';
      }
    }
  }

  function guardarCampo(el) {
    var s = el.getAttribute('data-s');
    var c = el.getAttribute('data-c');
    var texto = el.value;
    if (!Proyecto.fijarValor(s, c, texto)) {
      avisoCarga('No se pudo guardar: el almacenamiento del navegador está lleno.', 'alerta');
    }

    /* El repintado se aplaza un tick: si este blur lo disparó el propio
       reemplazo de la vista, tocar el DOM aquí dentro lo rompería. */
    setTimeout(function () {
      var def = Proyecto.campo(s, c);
      if (!def) return;
      var ev = Calidad.evaluarCampo(def, texto);
      var caja = document.getElementById('pa-cr-' + s + '-' + c);
      if (caja) caja.innerHTML = criteriosHTML(ev);

      var cont = document.getElementById('pa-cont-' + s + '-' + c);
      if (cont) cont.textContent = contadorTexto(texto);

      actualizarCabeceraSeccion(s);
    }, 0);
  }

  function actualizarCabeceraSeccion(seccionId) {
    var sec = Proyecto.seccion(seccionId);
    if (!sec) return;
    var p = Proyecto.cargar();
    var e = Calidad.evaluarSeccion(sec, (p.campos || {})[sec.id], p.procesos);

    var cajaDial = document.getElementById('pa-dial-seccion');
    if (cajaDial) cajaDial.innerHTML = dial(e.puntaje, e.nivel);

    var nivel = document.getElementById('pa-nivel-seccion');
    if (nivel) {
      nivel.textContent = e.nivel.etiqueta;
      nivel.style.color = colorNivel(e.nivel);
    }

    var comp = document.getElementById('pa-completitud-seccion');
    if (comp) comp.textContent = e.camposLlenos + ' de ' + e.camposTotal + ' campos redactados';

    var retro = document.getElementById('pa-retro');
    if (retro) retro.innerHTML = retroHTML(Calidad.retroalimentacion(e), e);
  }

  /* — Descarga de archivos — */
  function descargar(nombre, contenido, tipo) {
    try {
      var blob = new Blob([contenido], { type: tipo + ';charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = nombre;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    } catch (e) {
      var w = window.open('', '_blank');
      if (w) w.document.write('<pre>' + R.escapar(contenido) + '</pre>');
    }
  }

  return {
    fijarBase: fijarBase,
    bloqueCarga: bloqueCarga,
    panel: panel,
    seccion: seccion,
    informe: informe,
    conectar: conectar
  };
})();
