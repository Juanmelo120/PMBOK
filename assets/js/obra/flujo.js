/* ═══════════════════════════════════════════════════════════
   obra/flujo.js — El flujo de los 40 procesos y la ficha de cada uno
   ───────────────────────────────────────────────────────────
   Las cinco bandas con sus tarjetas arrastrables, y la ficha de un
   proceso con sus entradas, herramientas y salidas.
   ═══════════════════════════════════════════════════════════ */

window.ObraFlujo = (function () {
  'use strict';

  var R = window.Render;

  /* ══════════════ 1 · FLUJO DE PROCESOS ══════════════ */

  function tabFlujo(p) {
    var bandas = PMBOK.bandas.map(function (b) {
      var procesos = Gestor.procesosDeBanda(p.id, b.id);
      var completados = procesos.filter(function (f) {
        return Gestor.estadoProceso(p.id, f.id).estado === 'completado';
      }).length;

      var pct = procesos.length ? Math.round(completados / procesos.length * 100) : 0;
      var completa = procesos.length && completados === procesos.length;

      return '<div class="g-banda' + (completa ? ' completa' : '') + '" data-banda="' + b.id + '">' +
        '<div class="g-banda-cab">' +
          '<div><h4>' + b.nombre + '</h4>' +
          '<span>' + procesos.length + ' proceso' + (procesos.length === 1 ? '' : 's') + ' · ' +
          completados + ' completado' + (completados === 1 ? '' : 's') + '</span></div>' +
          '<span class="g-banda-n">' + (completa ? '✓' : b.n) + '</span>' +
          '<div class="g-banda-avance">' + UI.barra(pct) + '<em>' + pct + ' %</em></div>' +
        '</div>' +
        '<div class="g-banda-tarjetas">' + procesos.map(function (f) {
          return tarjetaProceso(p, f);
        }).join('') + '</div>' +
        '<div class="g-banda-pie">Arrastra tarjetas entre bandas para adaptar la secuencia</div>' +
        '</div>';
    }).join('');

    return '<div class="g-flujo">' + bandas + '</div>';
  }

  function tarjetaProceso(p, f) {
    var proc = PMBOK.procesos.filter(function (x) { return x.id === f.id; })[0];
    if (!proc) return '';
    var est = Gestor.estadoProceso(p.id, f.id);
    var dm = Indice.dominioMeta(proc.dominio);
    var iter = Gestor.esIterativo(p.id, f.id);

    return '<a class="g-tarjeta-proceso ' + est.estado + ' ' + (dm ? dm.clase : '') + '" ' +
      'href="#/proyectos/' + p.id + '/proceso/' + f.id + '" draggable="true" data-proceso="' + f.id + '">' +
      '<div class="g-tp-cab"><span class="g-tp-cod">' + proc.cod + '</span>' +
        (est.estado === 'completado' ? '<span class="g-tp-marca">✓</span>' :
         est.estado === 'iniciado' ? '<span class="g-tp-marca curso">▸</span>' :
         est.estado === 'omitido' ? '<span class="g-tp-marca omitido">—</span>' : '') +
      '</div>' +
      '<div class="g-tp-nombre">' + R.escapar(proc.nombre) + '</div>' +
      '<div class="g-tp-pie">' +
        (dm ? '<span class="pastilla-dominio ' + dm.clase + '">' + dm.nombre + '</span>' : '') +
        (iter ? '<span class="g-tp-iter">iterativo</span>' : '') +
      '</div></a>';
  }

  /* ══════════════ 2 · FICHA DE PROCESO ══════════════ */

  function fichaProceso(p, procesoId) {
    var proc = PMBOK.procesos.filter(function (x) { return x.id === procesoId; })[0];
    var f = PMBOK.flujoPorId[procesoId];
    if (!proc || !f) return Vistas.noEncontrado();

    var est = Gestor.estadoProceso(p.id, procesoId);
    var dm = Indice.dominioMeta(proc.dominio);
    var area = Indice.areaMeta(Gestor.bandaDe(p.id, procesoId));
    var iter = Gestor.esIterativo(p.id, procesoId);
    var puede = Gestor.puede(p.id, 'editar');

    var entradas = Gestor.disponibilidadEntradas(p.id, procesoId).map(function (e) {
      return '<div class="g-io' + (e.disponible ? ' ok' : '') + '">' +
        '<div class="g-io-nombre">' + R.escapar(e.nombre) + '</div>' +
        (e.disponible
          ? '<a class="pa-mini" href="#/proyectos/' + p.id + '/documento/' + e.documento.id + '">' + Iconos.svg('check') + ' Disponible, ver documento</a>'
          : (puede
              ? '<button class="pa-mini" data-o="generar-entrada" data-art="' + e.artefactoId + '">+ generar desde plantilla</button>'
              : '<span class="pa-contador">pendiente</span>')) +
        '</div>';
    }).join('');

    var salidas = Gestor.salidasDe(p.id, procesoId).map(function (s) {
      var art = Gestor.artefacto(s.artefactoId);
      return '<div class="g-io' + (s.generado ? ' ok' : '') + '">' +
        '<div class="g-io-nombre">' + R.escapar(s.nombre) + '</div>' +
        '<div class="g-io-sub">Plantilla: ' + R.escapar((art && art.categoria) || '') +
          ' · ' + (art ? art.plantilla.length : 0) + ' bloques</div>' +
        (s.generado
          ? '<a class="pa-mini" href="#/proyectos/' + p.id + '/documento/' + s.documento.id + '">' +
            'abrir · ' + Gestor.completitudDocumento(s.documento) + ' % completo</a>'
          : (puede
              ? '<button class="btn" data-o="generar-salida" data-art="' + s.artefactoId + '">+ Generar</button>'
              : '<span class="pa-contador">sin generar</span>')) +
        '</div>';
    }).join('');

    var herramientas = herramientasDe(proc);

    return '<div class="hoja-ancha prosa">' +
      R.migas([{ texto: 'Panel', ruta: '#/panel' },
               { texto: p.nombre, ruta: '#/proyectos/' + p.id },
               { texto: proc.cod }]) +

      '<div class="g-proceso-cab">' +
        '<div class="g-proceso-etiquetas">' +
          '<span class="g-tp-cod grande">' + proc.cod + '</span>' +
          (dm ? '<span class="pastilla-dominio ' + dm.clase + '">' + dm.nombre + '</span>' : '') +
          (area ? UI.pastilla(area.nombre) : '') +
          (iter ? '<span class="g-tp-iter">iterativo en ' + Gestor.metodologia(p.metodologia).nombre + '</span>' : '') +
        '</div>' +
        '<h1 class="titulo-pagina">' + R.escapar(proc.nombre) + '</h1>' +
      '</div>' +

      '<div class="nota"><div class="nota-titulo">Objetivo del proceso</div>' + proc.proposito + '</div>' +

      '<div class="g-acciones-proceso">' +
        (puede
          ? '<button class="btn' + (est.estado === 'iniciado' ? ' activo' : '') + '" data-o="estado-proceso" data-valor="iniciado">Iniciar</button>' +
            '<button class="btn' + (est.estado === 'completado' ? ' activo' : '') + '" data-o="estado-proceso" data-valor="completado">Marcar completado</button>' +
            '<button class="btn' + (est.estado === 'omitido' ? ' activo' : '') + '" data-o="estado-proceso" data-valor="omitido">Omitir (adaptación)</button>' +
            '<button class="btn" data-o="estado-proceso" data-valor="pendiente">Reabrir</button>'
          : '') +
        '<span class="pa-contador">Estado: <b>' + etiquetaEstado(est.estado) + '</b>' +
        (est.fecha ? ' · ' + UI.fecha(est.fecha, true) : '') + '</span>' +
      '</div>' +

      '<h2>Entradas <span class="pa-conteo">' + (f.entradas || []).length + '</span></h2>' +
      '<p style="color:var(--tinta-2);font-size:13.4px;margin-bottom:12px">' +
      'Verifica tenerlas antes de ejecutar. Lo que falte se puede generar aquí mismo desde su plantilla.</p>' +
      '<div class="g-ios">' + entradas + '</div>' +

      '<h2>Herramientas y técnicas</h2>' +
      '<p style="color:var(--tinta-2);font-size:13.4px;margin-bottom:12px">' +
      'Las que la 8.ª edición asocia a este proceso, agrupadas por familia.</p>' +
      herramientas +

      '<h2>Salidas <span class="pa-conteo">' + (f.salidas || []).length + '</span></h2>' +
      '<p style="color:var(--tinta-2);font-size:13.4px;margin-bottom:12px">' +
      'Aquí se generan los documentos del proyecto. Cada uno abre con su plantilla lista para rellenar.</p>' +
      '<div class="g-ios">' + salidas + '</div>' +

      '<div class="g-consejo"><div class="g-consejo-et">Consejo del mentor</div>' + f.consejo + '</div>' +

      (proc.ejemplo
        ? '<div class="g-consejo ejemplo"><div class="g-consejo-et">Ejemplo práctico</div>' +
          '<b>' + R.escapar(proc.ejemplo.titulo) + '</b><br>' + proc.ejemplo.aplicacion + '</div>'
        : '') +

      (proc.errores && proc.errores.length
        ? '<h2>Errores frecuentes</h2><ul>' + proc.errores.map(function (e) {
            return '<li>' + R.enLinea(e) + '</li>'; }).join('') + '</ul>'
        : '') +

      '<h2>Notas del equipo</h2>' +
      '<textarea class="pa-entrada" id="g-notas-proceso" rows="4" ' +
      'placeholder="Decisiones, acuerdos y pendientes de este proceso en tu proyecto…"' +
      (puede ? '' : ' disabled') + '>' + R.escapar(est.notas || '') + '</textarea>' +
      (puede ? '<div class="tarjeta-pie"><button class="btn primario" data-o="guardar-notas">Guardar notas</button>' +
        '<span class="nota-guardada" id="g-aviso-notas"></span></div>' : '') +

      '<h2>Referencia completa del proceso</h2>' +
      '<p style="color:var(--tinta-2);font-size:13.4px">La ficha de estudio con su descripción, su ITTO detallado y ' +
      'sus preguntas frecuentes está en <a class="ref" href="#/proceso/' + proc.id + '">el modo Aprender</a>.</p>' +

      navegacionProcesos(p, procesoId) +
      '</div>';
  }

  function etiquetaEstado(e) {
    return { pendiente: 'Pendiente', iniciado: 'En curso', completado: 'Completado', omitido: 'Omitido' }[e] || e;
  }

  /* Asocia las herramientas del catálogo con las que el proceso declara.
     El ITTO las escribe en prosa —«Recopilación de datos (tormenta de ideas,
     entrevistas)»—, así que se compara por palabras significativas presentes,
     no por la frase literal. */
  function herramientasDe(proc) {
    var norm = Indice.normalizar((proc.herramientas || []).join(' ; '));
    var encontradas = PMBOK.herramientas.filter(function (h) {
      var nombre = Indice.normalizar(String(h.nombre).replace(/\([^)]*\)/g, ''));
      if (!nombre) return false;
      if (norm.indexOf(nombre) !== -1) return true;
      // Sin cita literal, exige que coincidan al menos dos palabras largas
      var palabras = nombre.split(' ').filter(function (w) { return w.length > 4; });
      return palabras.length >= 2 && palabras.every(function (w) { return norm.indexOf(w) !== -1; });
    });

    if (!encontradas.length) {
      return '<ul>' + (proc.herramientas || []).map(function (h) {
        return '<li>' + R.enLinea(h) + '</li>'; }).join('') + '</ul>';
    }

    var porGrupo = {};
    encontradas.forEach(function (h) {
      if (!porGrupo[h.grupo]) porGrupo[h.grupo] = [];
      porGrupo[h.grupo].push(h);
    });

    return '<div class="g-herramientas">' + Object.keys(porGrupo).map(function (g) {
      var meta = PMBOK.gruposHerramienta.filter(function (x) { return x.id === g; })[0];
      return '<details class="g-grupo-herramienta"><summary>' +
        (meta ? meta.nombre : g) + ' <span>' + porGrupo[g].length + ' técnicas</span></summary>' +
        porGrupo[g].map(function (h) {
          return '<div class="g-herramienta"><b>' + R.escapar(h.nombre) + '</b>' +
            '<span>' + R.escapar(h.descripcion) + '</span></div>';
        }).join('') + '</details>';
    }).join('') + '</div>';
  }

  function navegacionProcesos(p, procesoId) {
    var todos = PMBOK.flujo.slice().sort(function (a, b) { return a.orden - b.orden; });
    var i = todos.map(function (f) { return f.id; }).indexOf(procesoId);
    var ant = i > 0 ? todos[i - 1] : null;
    var sig = i < todos.length - 1 ? todos[i + 1] : null;

    function nombre(f) {
      var pr = PMBOK.procesos.filter(function (x) { return x.id === f.id; })[0];
      return pr ? pr.cod + ' ' + pr.nombre : '';
    }

    var html = '<nav class="nav-secuencia">';
    html += ant
      ? '<a href="#/proyectos/' + p.id + '/proceso/' + ant.id + '"><div class="dir">← Proceso anterior</div>' +
        '<div class="tit">' + R.escapar(nombre(ant)) + '</div></a>'
      : '<a href="#/proyectos/' + p.id + '"><div class="dir">← Volver</div><div class="tit">Flujo de procesos</div></a>';
    html += sig
      ? '<a class="sig" href="#/proyectos/' + p.id + '/proceso/' + sig.id + '"><div class="dir">Proceso siguiente →</div>' +
        '<div class="tit">' + R.escapar(nombre(sig)) + '</div></a>'
      : '<a class="sig" href="#/proyectos/' + p.id + '/documentos"><div class="dir">Siguiente →</div>' +
        '<div class="tit">Documentos del proyecto</div></a>';
    return html + '</nav>';
  }

  return { tab: tabFlujo, ficha: fichaProceso };
})();
