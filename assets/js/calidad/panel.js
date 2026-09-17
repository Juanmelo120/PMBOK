/* ═══════════════════════════════════════════════════════════
   calidad/panel.js — La portada de la calidad del plan
   ───────────────────────────────────────────────────────────
   Carga del documento, tablero de puntajes, lista de las diez secciones
   y las observaciones encontradas.
   ═══════════════════════════════════════════════════════════ */

window.CalidadPanel = (function () {
  'use strict';

  var R = window.Render;

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
        CalidadPiezas.dial(g.puntaje, g.nivel, 'grande') +
        '<div class="pa-nivel" style="color:' + CalidadPiezas.colorNivel(g.nivel) + '">' + g.nivel.etiqueta + '</div>' +
      '</div>' +
      '<div class="pa-tablero-cuerpo">' +
        '<p class="pa-veredicto">' + g.veredicto + '</p>' +
        '<div class="pa-kpis">' +
          CalidadPiezas.kpi('Calidad del contenido', g.contenido + ' / 100', g.contenido) +
          CalidadPiezas.kpi('Coherencia entre secciones', g.coherencia + ' / 100', g.coherencia) +
          CalidadPiezas.kpi('Completitud del plan', g.completitud + ' %', g.completitud) +
          CalidadPiezas.kpi('Procesos aplicados', g.procesosMarcados + ' / ' + g.procesosTotal, g.cobertura) +
        '</div>' +
        '<div class="tarjeta-pie">' +
          '<a class="btn primario" href="' + CalidadPiezas.ruta() + '/informe">Ver informe de calidad</a>' +
          '<button class="btn" data-pa="exportar-md">Descargar plan e informe (.md)</button>' +
        '</div>' +
      '</div>' +
      '</div>';
  }

  function listaSecciones(ev) {
    var filas = (PMBOK.seccionesProyecto || []).map(function (sec) {
      var e = ev.secciones.filter(function (s) { return s.id === sec.id; })[0];
      var dm = sec.dominio ? Indice.dominioMeta(sec.dominio) : null;
      var color = e.puntaje >= 75 ? 'var(--ok)' : e.puntaje >= 45 ? 'var(--ambar)' : 'var(--rojo)';
      return '<a class="pa-sec" href="' + CalidadPiezas.ruta() + '/seccion/' + sec.id + '">' +
        '<div class="pa-sec-n">' + sec.n + '</div>' +
        '<div class="pa-sec-cuerpo">' +
          '<div class="pa-sec-tit">' + sec.nombre +
            (dm ? ' <span class="pastilla-dominio ' + dm.clase + '">' + dm.nombre + '</span>' : '') + '</div>' +
          '<div class="pa-sec-lema">' + sec.lema + '</div>' +
          CalidadPiezas.barra(e.completitud, color) +
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
      '<p style="margin-top:12px"><a class="ref" href="' + CalidadPiezas.ruta() + '/informe">' +
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
      (h.ruta ? '<div class="tarjeta-pie"><a class="ref" href="' + CalidadPiezas.ruta() + '/seccion/' + h.ruta +
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

  /* El informe pinta los mismos hallazgos, agrupados por severidad */
  return { panel: panel, bloqueCarga: bloqueCarga, hallazgoHTML: hallazgoHTML };
})();
