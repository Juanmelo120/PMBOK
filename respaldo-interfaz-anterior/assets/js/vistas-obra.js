/* ═══════════════════════════════════════════════════════════
   vistas-obra.js — El espacio de trabajo de un proyecto
   ───────────────────────────────────────────────────────────
   Flujo de los 40 procesos, ficha de proceso, documentos y su
   editor, repositorio de archivos, calendario, trabajo (sprints
   o tablero), dominios, control por valor ganado y equipo.
   ═══════════════════════════════════════════════════════════ */

window.VistasObra = (function () {
  'use strict';

  var R = window.Render;
  var recargar = function () {};

  var PESTANAS = [
    { id: 'flujo', nombre: 'Flujo de procesos' },
    { id: 'documentos', nombre: 'Documentos' },
    { id: 'archivos', nombre: 'Archivos' },
    { id: 'calendario', nombre: 'Calendario' },
    { id: 'trabajo', nombre: 'Trabajo' },
    { id: 'dominios', nombre: 'Dominios' },
    { id: 'control', nombre: 'Control (EVM)' },
    { id: 'equipo', nombre: 'Equipo' },
    { id: 'calidad', nombre: 'Calidad del plan' }
  ];

  /* ══════════════ Envoltorio ══════════════ */

  function vista(id, sub, arg) {
    var p = Gestor.proyecto(id);
    if (!p) return Vistas.noEncontrado();
    if (!Gestor.puede(p.id, 'ver')) {
      return '<div class="hoja">' + UI.vacio('🔒', 'Sin acceso a este proyecto',
        'Pide al director del proyecto o a un administrador que te conceda permiso.') + '</div>';
    }

    if (sub === 'proceso') return fichaProceso(p, arg);
    if (sub === 'documento') return editorDocumento(p, arg);

    var pestana = sub || 'flujo';
    var cuerpo =
      pestana === 'documentos' ? tabDocumentos(p) :
      pestana === 'archivos' ? tabArchivos(p) :
      pestana === 'calendario' ? tabCalendario(p, arg) :
      pestana === 'trabajo' ? tabTrabajo(p, arg) :
      pestana === 'dominios' ? tabDominios(p, arg) :
      pestana === 'control' ? tabControl(p) :
      pestana === 'equipo' ? tabEquipo(p) :
      pestana === 'calidad' ? tabCalidad(p, arg) : tabFlujo(p);

    return '<div class="hoja-ancha prosa">' + cabecera(p, pestana) + cuerpo + '</div>';
  }

  function cabecera(p, pestana) {
    var met = Gestor.metodologia(p.metodologia);
    var pr = Gestor.progreso(p.id);
    var director = p.directorId ? Gestor.uno('usuarios', p.directorId) : null;

    var pestanas = PESTANAS.map(function (t) {
      return '<a class="g-pestana-obra' + (t.id === pestana ? ' activa' : '') + '" ' +
        'href="#/proyectos/' + p.id + '/' + t.id + '">' + t.nombre + '</a>';
    }).join('');

    return '<div class="g-obra-cab">' +
      '<div class="g-obra-titulo">' +
        '<a class="pa-mini" href="#/panel">← Volver al panel</a>' +
        '<h1 class="titulo-pagina">' + R.escapar(p.nombre) + '</h1>' +
        '<div class="g-obra-meta">' +
          '<span class="g-metodo">' + met.icono + ' ' + R.escapar(met.nombre) + '</span>' +
          UI.pastilla(p.estado, p.estado === 'activo' ? 'ok' : p.estado === 'cerrado' ? '' : 'aviso') +
          '<span>Director: ' + R.escapar(director ? director.nombre : '—') + '</span>' +
          (p.inicio ? '<span>Inicio: ' + UI.fecha(p.inicio) + '</span>' : '') +
          (p.presupuesto ? '<span>BAC: ' + UI.dinero(p.presupuesto, p.moneda) + '</span>' : '') +
        '</div>' +
      '</div>' +
      '<div class="g-obra-progreso">' +
        UI.anillo(pr.porcentaje, UI.colorPorcentaje(pr.porcentaje)) +
        '<span>' + pr.completados + ' de ' + pr.aplicables + ' procesos</span>' +
      '</div>' +
      '</div>' +
      siguientePaso(p) +
      /* La adaptación se lee una vez: abierta en el flujo, plegada en el resto */
      '<details class="g-adaptacion"' + (pestana === 'flujo' ? ' open' : '') + '>' +
        '<summary><span>Adaptación</span> ' + R.escapar(met.nombre) + '</summary>' +
        '<p>' + met.tailoring + '</p>' +
      '</details>' +
      '<nav class="g-pestanas-obra" aria-label="Secciones del proyecto">' + pestanas + '</nav>';
  }

  /* La pregunta más frecuente dentro de un proyecto: ¿qué toca ahora? */
  function siguientePaso(p) {
    var sig = Gestor.siguienteProceso(p.id);
    if (!sig) {
      return '<div class="g-paso hecho"><div class="g-paso-cuerpo">' +
        '<span class="g-paso-et">Flujo completo</span>' +
        '<b>Todos los procesos están completados u omitidos</b></div>' +
        '<a class="btn" href="#/proyectos/' + p.id + '/calidad/informe">Ver informe de calidad</a></div>';
    }
    var proc = Indice.proceso(sig.id);
    var est = Gestor.estadoProceso(p.id, sig.id).estado;
    var salidas = (sig.salidas || []).map(function (a) { return Gestor.artefacto(a); }).filter(Boolean);
    return '<div class="g-paso">' +
      '<div class="g-paso-cuerpo">' +
        '<span class="g-paso-et">' + (est === 'iniciado' ? 'En curso' : 'Siguiente paso') + '</span>' +
        '<b><i>' + proc.cod + '</i> ' + R.escapar(proc.nombre) + '</b>' +
        (salidas.length ? '<span class="g-paso-sub">Produce: ' +
          salidas.map(function (a) { return R.escapar(a.nombre); }).join(' · ') + '</span>' : '') +
      '</div>' +
      '<a class="btn primario" href="#/proyectos/' + p.id + '/proceso/' + sig.id + '">' +
        (est === 'iniciado' ? 'Continuar' : 'Abrir proceso') + '</a>' +
      '</div>';
  }

  /* ══════════════ 1 · FLUJO DE PROCESOS ══════════════ */

  function tabFlujo(p) {
    var bandas = PMBOK.bandas.map(function (b) {
      var procesos = Gestor.procesosDeBanda(p.id, b.id);
      var completados = procesos.filter(function (f) {
        return Gestor.estadoProceso(p.id, f.id).estado === 'completado';
      }).length;

      return '<div class="g-banda" data-banda="' + b.id + '">' +
        '<div class="g-banda-cab">' +
          '<div><h4>' + b.nombre + '</h4>' +
          '<span>' + procesos.length + ' proceso' + (procesos.length === 1 ? '' : 's') + ' · ' +
          completados + ' completado' + (completados === 1 ? '' : 's') + '</span></div>' +
          '<span class="g-banda-n">' + b.n + '</span>' +
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
          ? '<a class="pa-mini" href="#/proyectos/' + p.id + '/documento/' + e.documento.id + '">✓ disponible — ver documento</a>'
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

  /* ══════════════ 3 · DOCUMENTOS ══════════════ */

  function tabDocumentos(p) {
    var docs = Gestor.documentosDe(p.id);
    var puede = Gestor.puede(p.id, 'editar');

    var filtros = '<div class="barra-filtros">' +
      '<button class="btn activo" data-o="filtrar-doc" data-valor="">Todas las categorías</button>' +
      PMBOK.categoriasArtefacto.map(function (c) {
        return '<button class="btn" data-o="filtrar-doc" data-valor="' + c.id + '">' + c.nombre + '</button>';
      }).join('') +
      (puede ? '<button class="btn primario" data-o="abrir-nuevo-doc" style="margin-left:auto">Nuevo desde plantilla</button>' : '') +
      '</div>';

    var pendientes = PMBOK.artefactos.filter(function (a) {
      return !Gestor.documentoDe(p.id, a.id);
    });

    var formulario = '<div id="g-nuevo-doc" hidden><div class="pa-panel">' +
      UI.selector('nd-artefacto', 'Artefacto', pendientes.map(function (a) {
        return { id: a.id, nombre: a.nombre + '  ·  ' + a.categoria };
      }), pendientes.length ? pendientes[0].id : '') +
      '<div class="tarjeta-pie"><button class="btn primario" data-o="crear-doc">Generar documento</button>' +
      '<button class="btn" data-o="cerrar-nuevo-doc">Cancelar</button></div></div></div>';

    var lista = docs.length
      ? '<div class="g-documentos">' + docs.map(function (d) {
          var comp = Gestor.completitudDocumento(d);
          var proc = d.procesoId ? PMBOK.procesos.filter(function (x) { return x.id === d.procesoId; })[0] : null;
          return '<a class="g-documento item-doc" data-categoria="' + d.categoria + '" ' +
            'href="#/proyectos/' + p.id + '/documento/' + d.id + '">' +
            '<div class="g-doc-estado ' + d.estado + '">' + etiquetaDoc(d.estado) + '</div>' +
            '<div class="g-doc-cuerpo">' +
              '<div class="g-doc-nombre">' + R.escapar(d.nombre) + '</div>' +
              '<div class="g-doc-meta">' + R.escapar(d.categoria) + ' · v' + (d.version || 1) +
              (proc ? ' · generado por el proceso ' + proc.cod : '') +
              ' · actualizado ' + UI.fecha(d.actualizado || d.creado) + '</div>' +
              UI.barra(comp, UI.colorPorcentaje(comp)) +
            '</div>' +
            '<div class="g-doc-pct">' + comp + ' %</div>' +
            '</a>';
        }).join('') + '</div>'
      : UI.vacio('📄', 'Sin documentos todavía',
          'Los documentos se generan desde las salidas de cada proceso. Empieza por ' +
          '<a class="ref" href="#/proyectos/' + p.id + '/proceso/p-gob-01">Iniciar el proyecto o fase</a>.');

    return filtros + formulario + lista;
  }

  function etiquetaDoc(e) {
    return { borrador: 'Borrador', revision: 'En revisión', aprobado: 'Aprobado' }[e] || e;
  }

  /* ══════════════ 4 · EDITOR DE DOCUMENTO ══════════════ */

  function editorDocumento(p, docId) {
    var d = Gestor.uno('documentos', docId);
    if (!d || d.proyectoId !== p.id) return Vistas.noEncontrado();
    var art = Gestor.artefacto(d.artefactoId);
    if (!art) return Vistas.noEncontrado();

    var puede = Gestor.puede(p.id, 'editar');
    var proc = d.procesoId ? PMBOK.procesos.filter(function (x) { return x.id === d.procesoId; })[0] : null;
    var comp = Gestor.completitudDocumento(d);

    var bloques = art.plantilla.map(function (b, i) {
      var valor = (d.contenido || {})[i];
      var idc = 'doc-' + i;
      var cuerpo;

      if (b.t === 'tabla') {
        cuerpo = UI.tablaEditable(idc, b.col, valor || [], { pie: 'Se guarda al salir de la celda.' });
      } else if (b.t === 'lista') {
        cuerpo = '<textarea class="pa-entrada g-bloque" id="' + idc + '" data-bloque="' + i + '" rows="5" ' +
          'placeholder="Un elemento por línea…"' + (puede ? '' : ' disabled') + '>' +
          R.escapar(valor || '') + '</textarea>';
      } else if (b.t === 'texto') {
        cuerpo = '<input class="pa-entrada g-bloque" id="' + idc + '" data-bloque="' + i + '" ' +
          'value="' + R.escapar(valor || '') + '"' + (puede ? '' : ' disabled') + '>';
      } else {
        cuerpo = '<textarea class="pa-entrada g-bloque" id="' + idc + '" data-bloque="' + i + '" rows="4"' +
          (puede ? '' : ' disabled') + '>' + R.escapar(valor || '') + '</textarea>';
      }

      return '<div class="pa-campo">' +
        '<div class="pa-campo-cab"><h3>' + R.escapar(b.et) + '</h3>' +
        '<span class="pa-peso">' + b.t + '</span></div>' +
        (b.ay ? '<p class="pa-campo-ayuda">' + R.escapar(b.ay) + '</p>' : '') +
        cuerpo + '</div>';
    }).join('');

    return '<div class="hoja-ancha prosa">' +
      R.migas([{ texto: 'Panel', ruta: '#/panel' },
               { texto: p.nombre, ruta: '#/proyectos/' + p.id },
               { texto: 'Documentos', ruta: '#/proyectos/' + p.id + '/documentos' },
               { texto: d.nombre }]) +

      '<div class="g-doc-cab-editor">' +
        '<div>' +
          '<div class="eyebrow">' + R.escapar(art.categoria) + ' · v' + (d.version || 1) + '</div>' +
          '<h1 class="titulo-pagina">' + R.escapar(d.nombre) + '</h1>' +
          '<p class="bajada">' + R.escapar(art.descripcion) + '</p>' +
        '</div>' +
        '<div class="g-doc-estado-grande ' + d.estado + '">' + etiquetaDoc(d.estado) + '</div>' +
      '</div>' +

      (proc
        ? '<div class="nota"><div class="nota-titulo">Origen</div>Este documento es salida del proceso ' +
          '<a class="ref" href="#/proyectos/' + p.id + '/proceso/' + proc.id + '">' + proc.cod + ' ' + proc.nombre + '</a>.</div>'
        : '') +

      '<div class="g-doc-barra">' +
        UI.barra(comp, UI.colorPorcentaje(comp)) +
        '<span class="pa-contador" id="g-doc-completitud">' + comp + ' % completo</span>' +
        (puede
          ? (d.estado === 'borrador'
              ? '<button class="btn" data-o="doc-estado" data-valor="revision">Enviar a revisión</button>'
              : d.estado === 'revision'
                ? '<button class="btn primario" data-o="doc-estado" data-valor="aprobado">Aprobar</button>' +
                  '<button class="btn" data-o="doc-estado" data-valor="borrador">Devolver a borrador</button>'
                : '<button class="btn" data-o="doc-nueva-version">Nueva versión</button>')
          : '') +
        '<button class="btn" data-o="doc-exportar">Descargar (.md)</button>' +
        (puede ? '<button class="btn" data-o="doc-borrar">Eliminar</button>' : '') +
      '</div>' +

      '<input type="hidden" id="g-doc-id" value="' + d.id + '">' +
      '<div class="pa-campos">' + bloques + '</div>' +

      '<nav class="nav-secuencia">' +
        '<a href="#/proyectos/' + p.id + '/documentos"><div class="dir">← Volver</div>' +
        '<div class="tit">Documentos del proyecto</div></a>' +
        (proc ? '<a class="sig" href="#/proyectos/' + p.id + '/proceso/' + proc.id + '">' +
          '<div class="dir">Proceso de origen →</div><div class="tit">' + proc.cod + ' ' + R.escapar(proc.nombre) + '</div></a>' : '') +
      '</nav>' +
      '</div>';
  }

  /* ══════════════ 5 · ARCHIVOS ══════════════ */

  function tabArchivos(p) {
    var archivos = Archivos.de(p.id);
    var puede = Gestor.puede(p.id, 'editar');

    var lista = archivos.length
      ? '<div class="g-archivos">' + archivos.map(function (a) {
          var autor = a.autorId ? Gestor.uno('usuarios', a.autorId) : null;
          return '<div class="g-archivo item-archivo" data-categoria="' + a.categoria + '">' +
            '<div class="g-archivo-icono">' + Archivos.icono(a.tipo, a.nombre) + '</div>' +
            '<div class="g-archivo-cuerpo">' +
              '<div class="g-archivo-nombre">' + R.escapar(a.nombre) + '</div>' +
              '<div class="g-archivo-meta">' + Archivos.formatoTamano(a.tamano) + ' · ' + a.categoria +
              ' · ' + UI.fecha(a.creado) + (autor ? ' · ' + R.escapar(autor.nombre) : '') + '</div>' +
            '</div>' +
            '<div class="g-archivo-acciones">' +
              '<button class="pa-mini" data-o="abrir-archivo" data-id="' + a.id + '">Abrir</button>' +
              '<button class="pa-mini" data-o="descargar-archivo" data-id="' + a.id + '">Descargar</button>' +
              (puede ? '<button class="g-mini-x" data-o="borrar-archivo" data-id="' + a.id + '">×</button>' : '') +
            '</div></div>';
        }).join('') + '</div>'
      : UI.vacio('📎', 'Sin archivos todavía',
          'Sube cotizaciones, actas firmadas, capturas o cualquier evidencia que respalde un proceso.');

    return '<h2>Repositorio de evidencias <span class="pa-conteo">' + archivos.length + '</span></h2>' +
      (puede
        ? '<div class="pa-soltar" id="g-soltar-archivo">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0L7 9m5-5l5 5"/>' +
          '<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>' +
          '<div><b>Arrastra archivos aquí</b> o <label class="pa-enlace-archivo" for="g-archivo-input">selecciónalos</label></div>' +
          '<input type="file" id="g-archivo-input" hidden multiple>' +
          '<div class="pa-soltar-nota">PDF, imágenes, hojas de cálculo… hasta 10 MB. Se guardan en este navegador.</div>' +
          '</div><div id="g-aviso-archivo"></div>' +
          '<div class="barra-filtros">' +
            '<span class="pa-contador">Categoría al subir:</span>' +
            Archivos.categorias.map(function (c, i) {
              return '<button class="btn' + (i === 0 ? ' activo' : '') + '" data-o="cat-archivo" data-valor="' + c.id + '">' +
                c.nombre + '</button>';
            }).join('') +
            '<input type="hidden" id="g-cat-archivo" value="general">' +
          '</div>'
        : '') +
      lista;
  }

  /* ══════════════ 6 · CALENDARIO ══════════════ */

  function tabCalendario(p, arg) {
    var hoy = new Date();
    var partes = String(arg || '').split('-');
    var anio = parseInt(partes[0], 10) || hoy.getFullYear();
    var mes = (parseInt(partes[1], 10) || (hoy.getMonth() + 1)) - 1;
    var eventos = Gestor.eventosDe(p.id);
    var puede = Gestor.puede(p.id, 'editar');

    var hitos = (p.hitos || []);
    var tablaHitos = hitos.length
      ? R.tabla(['Hito', 'Fecha', 'Ruta crítica'], hitos.map(function (h) {
          return [h.nombre, UI.fecha(h.fecha), h.critico ? 'Sí' : 'No'];
        }))
      : '';

    return '<h2>Calendario del proyecto</h2>' +
      '<p style="color:var(--tinta-2);font-size:13.4px;margin-bottom:14px">' +
      'Límites de tareas, sprints, hitos del cronograma y cortes de valor ganado. ' +
      'Los hitos en ruta crítica se marcan en ámbar.</p>' +
      VistasGestor.calendario(anio, mes, eventos, '#/proyectos/' + p.id + '/calendario/') +
      (puede
        ? '<h2>Añadir hito</h2><div class="pa-panel">' +
          UI.fila([
            UI.texto('nh-nombre', 'Hito', '', { placeholder: 'Ej.: Línea base aprobada' }),
            UI.texto('nh-fecha', 'Fecha', UI.hoyISO(), { tipo: 'date' }),
            UI.selector('nh-critico', 'En ruta crítica',
              [{ id: 'no', nombre: 'No' }, { id: 'si', nombre: 'Sí' }], 'no')
          ]) +
          '<div class="tarjeta-pie"><button class="btn primario" data-o="crear-hito">Añadir hito</button></div></div>'
        : '') +
      (tablaHitos ? '<h2>Hitos declarados</h2>' + tablaHitos : '');
  }

  /* ══════════════ 7 · TRABAJO ══════════════ */

  function tabTrabajo(p, sub) {
    var met = Gestor.metodologia(p.metodologia);
    if (met.id === 'agil' || met.id === 'hibrido') return trabajoAgil(p, sub);
    return trabajoTablero(p, met);
  }

  function trabajoAgil(p, sub) {
    sub = sub || 'backlog';
    var sprint = Gestor.sprintActivo(p.id);
    var miembros = Gestor.lista('miembros', { proyectoId: p.id });
    var backlog = Gestor.tareasDe(p.id, { sprintId: null });
    var delSprint = sprint ? Gestor.tareasDe(p.id, { sprintId: sprint.id }) : [];
    var puede = Gestor.puede(p.id, 'editar');

    var comprometido = delSprint.reduce(function (n, t) { return n + (Number(t.puntos) || 0); }, 0);
    var entregado = delSprint.filter(function (t) { return t.estado === 'hecho'; })
      .reduce(function (n, t) { return n + (Number(t.puntos) || 0); }, 0);

    var cabezaSprint = '<div class="g-sprint">' +
      '<div class="g-sprint-cab"><div class="g-et">Sprint activo</div>' +
        (puede ? '<button class="btn" data-o="nuevo-sprint">Nuevo sprint</button>' : '') + '</div>' +
      (sprint
        ? '<h3>' + R.escapar(sprint.nombre) + '</h3>' +
          '<div class="g-sprint-meta">' +
            '<span>' + R.escapar(sprint.objetivo || 'Sin objetivo declarado') + '</span>' +
            '<span>Comprometido: <b>' + comprometido + '</b> pts</span>' +
            '<span>Entregado: <b>' + entregado + '</b> pts</span>' +
          '</div>' +
          UI.barra(comprometido ? (entregado / comprometido) * 100 : 0) +
          (puede ? '<div class="tarjeta-pie"><button class="btn" data-o="cerrar-sprint" data-id="' + sprint.id + '">' +
            'Cerrar sprint (review y retrospectiva)</button></div>' : '')
        : '<p style="color:var(--tinta-3);font-size:13.4px">No hay sprint activo. Crea uno para empezar a comprometer trabajo.</p>') +
      '</div>';

    var roles = '<div class="g-roles"><div class="g-et">Roles Scrum</div>' +
      '<div><b>Product Owner:</b> ' + R.escapar(nombreRol(p, 'po') || '—') + ' — prioriza el backlog</div>' +
      '<div><b>Scrum Master:</b> ' + R.escapar(nombreRol(p, 'sm') || '—') + ' — remueve impedimentos</div>' +
      '<div><b>Equipo:</b> ' + miembros.length + ' persona' + (miembros.length === 1 ? '' : 's') + '</div>' +
      '<div><b>Artefactos:</b> Product Backlog (' + backlog.length + ') · Sprint Backlog (' + delSprint.length +
      ') · Incremento (' + delSprint.filter(function (t) { return t.estado === 'hecho'; }).length + ' listos)</div>' +
      '</div>';

    var dod = '<div class="g-dod"><div class="g-et">Definition of Done</div>' +
      '<ul>' + ((p.dod && p.dod.length) ? p.dod : [
        'Cumple los criterios de aceptación',
        'Revisada por un par',
        'Sin defectos conocidos'
      ]).map(function (x) { return '<li>' + R.escapar(x) + '</li>'; }).join('') + '</ul>' +
      (puede ? '<button class="pa-mini" data-o="editar-dod">editar DoD</button>' : '') + '</div>';

    var pestanas = [['backlog', '🗂️ Sprint backlog'], ['ceremonias', '🔁 Ceremonias'], ['metricas', '📈 Métricas']]
      .map(function (x) {
        return '<a class="g-pestana-mini' + (x[0] === sub ? ' activa' : '') + '" ' +
          'href="#/proyectos/' + p.id + '/trabajo/' + x[0] + '">' + x[1] + '</a>';
      }).join('');

    var cuerpo =
      sub === 'ceremonias' ? ceremonias(p, sprint) :
      sub === 'metricas' ? metricasAgiles(p, sprint, delSprint) :
      tableroTareas(p, delSprint, backlog, sprint);

    return '<div class="g-trabajo-cab">' + cabezaSprint + roles + dod + '</div>' +
      '<div class="g-pestanas-mini">' + pestanas + '</div>' + cuerpo;
  }

  function nombreRol(p, rol) {
    var m = Gestor.lista('miembros', { proyectoId: p.id }).filter(function (x) { return x.rol === rol; })[0];
    if (!m) return null;
    var u = Gestor.uno('usuarios', m.usuarioId);
    return u ? u.nombre : null;
  }

  function tableroTareas(p, delSprint, backlog, sprint) {
    var puede = Gestor.puede(p.id, 'editar');
    var columnas = Gestor.estadosTarea.filter(function (e) { return e.id !== 'backlog'; });

    var tablero = '<div class="g-tablero">' + columnas.map(function (c) {
      var suyas = delSprint.filter(function (t) { return t.estado === c.id; });
      return '<div class="g-columna" data-columna="' + c.id + '">' +
        '<div class="g-columna-cab">' + c.nombre + ' <span>' + suyas.length + '</span></div>' +
        suyas.map(function (t) { return tarjetaTarea(p, t); }).join('') +
        '</div>';
    }).join('') + '</div>';

    var listaBacklog = backlog.length
      ? '<div class="g-backlog">' + backlog.map(function (t) {
          return '<div class="g-historia">' +
            '<div class="g-historia-cuerpo">' +
              '<b>' + R.escapar(t.titulo) + '</b>' +
              (t.criterios ? '<div class="g-historia-crit">' + R.escapar(t.criterios) + '</div>' : '') +
            '</div>' +
            '<span class="g-puntos">' + (t.puntos || '—') + ' pts</span>' +
            (puede && sprint ? '<button class="pa-mini" data-o="al-sprint" data-id="' + t.id + '">→ sprint</button>' : '') +
            (puede ? '<button class="g-mini-x" data-o="borrar-tarea" data-id="' + t.id + '">×</button>' : '') +
            '</div>';
        }).join('') + '</div>'
      : '<p style="color:var(--tinta-3);font-size:13.4px">El backlog está vacío.</p>';

    return (sprint ? '<h2>Tablero del sprint</h2>' + tablero : '') +
      '<h2>Product backlog <span class="pa-conteo">' + backlog.length + '</span></h2>' +
      (puede ? formularioHistoria(p) : '') +
      listaBacklog;
  }

  function formularioHistoria(p) {
    return '<div class="pa-panel">' +
      UI.texto('nt-titulo', 'Historia o tarea', '', { placeholder: 'Como [rol] quiero [algo] para [beneficio]' }) +
      UI.fila([
        UI.texto('nt-puntos', 'Puntos', '', { tipo: 'number', min: 0, placeholder: '3' }),
        UI.texto('nt-fecha', 'Fecha límite', '', { tipo: 'date' }),
        UI.selector('nt-responsable', 'Responsable',
          [{ id: '', nombre: '— Sin asignar —' }].concat(
            Gestor.lista('miembros', { proyectoId: p.id }).map(function (m) {
              var u = Gestor.uno('usuarios', m.usuarioId);
              return { id: m.usuarioId, nombre: u ? u.nombre : m.usuarioId };
            })), '')
      ]) +
      UI.area('nt-criterios', 'Criterios de aceptación', '', { filas: 2 }) +
      '<div class="tarjeta-pie"><button class="btn primario" data-o="crear-tarea">Añadir al backlog</button></div>' +
      '</div>';
  }

  function tarjetaTarea(p, t) {
    var u = t.responsableId ? Gestor.uno('usuarios', t.responsableId) : null;
    var siguiente = { pendiente: 'curso', curso: 'revision', revision: 'hecho', hecho: 'pendiente' }[t.estado];
    return '<div class="g-tarea" draggable="true" data-tarea="' + t.id + '">' +
      '<div class="g-tarea-titulo">' + R.escapar(t.titulo) + '</div>' +
      '<div class="g-tarea-pie">' +
        '<span class="g-puntos">' + (t.puntos || '—') + '</span>' +
        (u ? UI.avatar(u.nombre) : '') +
        (t.fechaLimite ? '<span class="g-tarea-fecha">' + UI.fecha(t.fechaLimite) + '</span>' : '') +
        '<button class="pa-mini" data-o="avanzar-tarea" data-id="' + t.id + '" data-valor="' + siguiente + '">→</button>' +
      '</div></div>';
  }

  function ceremonias(p, sprint) {
    var lista = [
      { n: 'Sprint planning', d: 'Al inicio del sprint. El equipo elige del backlog lo que se compromete a entregar y define el objetivo del sprint.', dur: '2 h por semana de sprint' },
      { n: 'Daily scrum', d: 'Cada día, 15 minutos: qué hice, qué haré, qué me bloquea. No es un informe de estado al jefe.', dur: '15 min' },
      { n: 'Sprint review', d: 'Al final del sprint. Se demuestra el incremento terminado a los interesados y se recoge retroalimentación.', dur: '1 h por semana de sprint' },
      { n: 'Retrospectiva', d: 'Después de la review. Qué funcionó, qué no y un compromiso concreto de mejora para el próximo sprint.', dur: '45 min' },
      { n: 'Refinamiento del backlog', d: 'Continuo. Se aclaran, estiman y dividen las historias de los próximos sprints.', dur: '10 % del sprint' }
    ];
    return '<h2>Ceremonias</h2>' +
      (sprint ? '<p style="color:var(--tinta-2);font-size:13.4px">Sprint actual: <b>' + R.escapar(sprint.nombre) + '</b>.</p>' : '') +
      '<div class="g-ceremonias">' + lista.map(function (c) {
        return '<div class="g-ceremonia"><b>' + c.n + '</b><span class="g-ceremonia-dur">' + c.dur + '</span>' +
          '<p>' + c.d + '</p></div>';
      }).join('') + '</div>';
  }

  function metricasAgiles(p, sprint, delSprint) {
    if (sprint) Gestor.registrarBurndown(sprint.id);
    var vel = Gestor.velocidad(p.id);
    var comprometido = delSprint.reduce(function (n, t) { return n + (Number(t.puntos) || 0); }, 0);
    var hechos = delSprint.filter(function (t) { return t.estado === 'hecho'; })
      .reduce(function (n, t) { return n + (Number(t.puntos) || 0); }, 0);
    var restante = comprometido - hechos;

    var media = vel.length
      ? Math.round(vel.reduce(function (n, v) { return n + v.entregado; }, 0) / vel.length)
      : null;

    return '<h2>Métricas</h2>' +
      '<div class="cifras" style="margin:0 0 22px">' +
        UI.cifra(comprometido, 'Puntos comprometidos') +
        UI.cifra(hechos, 'Puntos entregados') +
        UI.cifra(restante, 'Puntos restantes') +
        UI.cifra(media === null ? '—' : media, 'Velocidad media') +
      '</div>' +
      burndownSprint(sprint, comprometido) +
      (vel.length
        ? Graficos.barras({
            titulo: 'Velocidad por sprint',
            descripcion: vel.length > 1
              ? 'Puntos entregados en cada sprint cerrado. La línea marca la media: planifica el próximo sprint cerca de ella.'
              : 'Puntos entregados en cada sprint cerrado. Con dos sprints cerrados aparece la media para planificar el siguiente.',
            categorias: vel.map(function (v) { return v.nombre.replace(/\s*—.*$/, ''); }),
            valores: vel.map(function (v) { return v.entregado; }),
            nombreSerie: 'puntos entregados',
            clase: 'serie-1',
            referencia: vel.length > 1 ? { valor: media, etiqueta: 'Media' } : null
          })
        : Graficos.barras({ titulo: 'Velocidad por sprint', categorias: [],
            vacio: 'La velocidad aparece cuando cierres el primer sprint.' }));
  }

  function burndownSprint(sprint, comprometido) {
    if (!sprint || !comprometido) {
      return Graficos.lineas({ titulo: 'Burndown del sprint', puntos: [], series: [],
        vacio: 'Compromete historias al sprint para ver cómo se consumen día a día.' });
    }
    var b = Gestor.burndown(sprint.id);
    var dias = b.real.filter(function (v) { return v !== null; }).length;
    return Graficos.lineas({
      titulo: 'Burndown de ' + sprint.nombre,
      descripcion: 'Puntos pendientes por día frente al ritmo ideal. ' +
        (dias < 2 ? 'Se registra un punto por cada día que el equipo mueve trabajo: la línea real crece con el sprint.'
                  : 'Por encima de la ideal, el sprint va retrasado.'),
      puntos: b.puntos,
      series: [
        { nombre: 'Ideal', clase: 'referencia', discontinua: true, valores: b.ideal },
        { nombre: 'Pendiente real', clase: 'serie-1', valores: b.real }
      ],
      formato: function (v) { return (Math.round(v * 10) / 10) + ' pts'; },
      formatoEje: function (v) { return String(v); }
    });
  }

  function trabajoTablero(p, met) {
    var tareas = Gestor.tareasDe(p.id);
    var puede = Gestor.puede(p.id, 'editar');
    var wip = p.wip || 3;

    var tablero = '<div class="g-tablero">' + Gestor.estadosTarea.map(function (c) {
      var suyas = tareas.filter(function (t) { return t.estado === c.id; });
      var excede = met.id === 'kanban' && c.id === 'curso' && suyas.length > wip;
      return '<div class="g-columna' + (excede ? ' excede' : '') + '" data-columna="' + c.id + '">' +
        '<div class="g-columna-cab">' + c.nombre + ' <span>' + suyas.length +
        (met.id === 'kanban' && c.id === 'curso' ? ' / ' + wip : '') + '</span></div>' +
        suyas.map(function (t) { return tarjetaTarea(p, t); }).join('') +
        '</div>';
    }).join('') + '</div>';

    return '<h2>' + (met.id === 'kanban' ? 'Flujo continuo' : 'Tablero de trabajo') + '</h2>' +
      (met.id === 'kanban'
        ? '<p style="color:var(--tinta-2);font-size:13.4px;margin-bottom:12px">' +
          'Límite de trabajo en curso: <b>' + wip + '</b>. Si una columna lo supera, se marca en rojo: ' +
          'termina antes de empezar algo nuevo.</p>'
        : '') +
      tablero +
      (puede ? '<h2>Nueva tarea</h2>' + formularioHistoria(p) : '');
  }

  /* ══════════════ 8 · DOMINIOS ══════════════ */

  function tabDominios(p, sub) {
    sub = sub || 'riesgos';
    var conteos = {
      riesgos: Gestor.lista('riesgos', { proyectoId: p.id }).length,
      interesados: Gestor.lista('interesados', { proyectoId: p.id }).length,
      cambios: Gestor.lista('cambios', { proyectoId: p.id }).length,
      lecciones: Gestor.lista('lecciones', { proyectoId: p.id }).length
    };

    var pestanas = [['riesgos', 'Riesgos'], ['interesados', 'Interesados'],
                    ['cambios', 'Cambios'], ['lecciones', 'Lecciones']].map(function (x) {
      return '<a class="g-pestana-mini' + (x[0] === sub ? ' activa' : '') + '" ' +
        'href="#/proyectos/' + p.id + '/dominios/' + x[0] + '">' + x[1] +
        ' <span class="pa-conteo">' + conteos[x[0]] + '</span></a>';
    }).join('');

    var cuerpo =
      sub === 'interesados' ? dominioInteresados(p) :
      sub === 'cambios' ? dominioCambios(p) :
      sub === 'lecciones' ? dominioLecciones(p) : dominioRiesgos(p);

    return '<div class="g-pestanas-mini">' + pestanas + '</div>' + cuerpo;
  }

  function dominioRiesgos(p) {
    var riesgos = Gestor.lista('riesgos', { proyectoId: p.id });
    var puede = Gestor.puede(p.id, 'editar');
    var celdas = Gestor.matrizRiesgos(p.id);

    var matriz = '<div class="envoltura-tabla"><table class="g-matriz-riesgo"><thead><tr>' +
      '<th>P \\ I</th>' + [1, 2, 3, 4, 5].map(function (i) { return '<th>' + i + '</th>'; }).join('') +
      '</tr></thead><tbody>' +
      [5, 4, 3, 2, 1].map(function (pr) {
        return '<tr><th>' + pr + '</th>' + [1, 2, 3, 4, 5].map(function (im) {
          var sev = Gestor.severidad(pr, im);
          var lista = celdas[pr + 'x' + im] || [];
          return '<td class="g-celda-riesgo ' + sev.color + '" data-celda="' + pr + 'x' + im + '">' +
            lista.map(function (r) {
              return '<div class="g-chip-riesgo" draggable="true" data-riesgo="' + r.id + '" title="' +
                R.escapar(r.titulo) + '">' + R.escapar(r.titulo.slice(0, 22)) + '</div>';
            }).join('') + '</td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>' +
      '<p class="g-leyenda-riesgo">↑ Probabilidad · Impacto → · ≥15 crítico · 8-14 alto · &lt;8 bajo. ' +
      'Arrastra un riesgo a otra celda para recalificarlo.</p>';

    var tabla = riesgos.length
      ? '<div class="envoltura-tabla"><table class="pa-tabla"><thead><tr>' +
        '<th>Riesgo</th><th>P</th><th>I</th><th>Sev.</th><th>Estrategia</th><th>Responsable</th><th></th>' +
        '</tr></thead><tbody>' + riesgos.map(function (r) {
          var sev = Gestor.severidad(r.p, r.i);
          var u = r.responsableId ? Gestor.uno('usuarios', r.responsableId) : null;
          return '<tr>' +
            '<td><b>' + R.escapar(r.titulo) + '</b>' +
            (r.respuesta ? '<div class="pa-criterio-det">' + R.escapar(r.respuesta) + '</div>' : '') + '</td>' +
            '<td>' + r.p + '</td><td>' + r.i + '</td>' +
            '<td>' + UI.pastilla(sev.etiqueta, sev.color) + '</td>' +
            '<td>' + R.escapar(r.estrategia || '—') + '</td>' +
            '<td>' + R.escapar(u ? u.nombre : (r.responsable || '—')) + '</td>' +
            '<td>' + (puede ? '<button class="g-mini-x" data-o="borrar-riesgo" data-id="' + r.id + '">×</button>' : '') + '</td>' +
            '</tr>';
        }).join('') + '</tbody></table></div>'
      : UI.vacio('⚠', 'Sin riesgos identificados',
        'Identifícalos en el proceso <a class="ref" href="#/proyectos/' + p.id + '/proceso/p-rie-02">2.7.2 Identificar los Riesgos</a>.');

    return '<h2>Matriz de probabilidad e impacto</h2>' + matriz +
      '<h2>Registro de riesgos <span class="pa-conteo">' + riesgos.length + '</span></h2>' +
      (puede
        ? '<div class="pa-panel">' +
          UI.texto('nr2-titulo', 'Riesgo', '', { placeholder: 'Debido a [causa], podría [evento], provocando [efecto]' }) +
          UI.fila([
            UI.texto('nr2-p', 'Probabilidad (1-5)', '3', { tipo: 'number', min: 1, max: 5 }),
            UI.texto('nr2-i', 'Impacto (1-5)', '3', { tipo: 'number', min: 1, max: 5 }),
            UI.selector('nr2-estrategia', 'Estrategia', [
              { id: 'mitigar', nombre: 'Mitigar' }, { id: 'evitar', nombre: 'Evitar' },
              { id: 'transferir', nombre: 'Transferir' }, { id: 'aceptar', nombre: 'Aceptar' },
              { id: 'escalar', nombre: 'Escalar' }, { id: 'explotar', nombre: 'Explotar (oportunidad)' },
              { id: 'mejorar', nombre: 'Mejorar (oportunidad)' }, { id: 'compartir', nombre: 'Compartir (oportunidad)' }
            ], 'mitigar')
          ]) +
          UI.area('nr2-respuesta', 'Respuesta prevista', '', { filas: 2 }) +
          UI.selector('nr2-responsable', 'Responsable',
            [{ id: '', nombre: '— Sin asignar —' }].concat(miembrosComoOpciones(p)), '') +
          '<div class="tarjeta-pie"><button class="btn primario" data-o="crear-riesgo">Registrar riesgo</button></div>' +
          '</div>'
        : '') +
      tabla;
  }

  function miembrosComoOpciones(p) {
    return Gestor.lista('miembros', { proyectoId: p.id }).map(function (m) {
      var u = Gestor.uno('usuarios', m.usuarioId);
      return { id: m.usuarioId, nombre: u ? u.nombre : m.usuarioId };
    });
  }

  function dominioInteresados(p) {
    var lista = Gestor.lista('interesados', { proyectoId: p.id });
    var puede = Gestor.puede(p.id, 'editar');

    var cuadrantes = [
      { id: 'cerca', nombre: 'Gestionar de cerca', d: 'Alto poder, alto interés' },
      { id: 'satisfecho', nombre: 'Mantener satisfecho', d: 'Alto poder, bajo interés' },
      { id: 'informado', nombre: 'Mantener informado', d: 'Bajo poder, alto interés' },
      { id: 'monitorear', nombre: 'Monitorear', d: 'Bajo poder, bajo interés' }
    ];

    function cuadranteDe(i) {
      var altoPoder = Number(i.poder) >= 3;
      var altoInteres = Number(i.influencia) >= 3;
      return altoPoder && altoInteres ? 'cerca' : altoPoder ? 'satisfecho' : altoInteres ? 'informado' : 'monitorear';
    }

    var rejilla = '<div class="g-cuadrantes">' + cuadrantes.map(function (c) {
      var suyos = lista.filter(function (i) { return cuadranteDe(i) === c.id; });
      return '<div class="g-cuadrante"><div class="g-cuadrante-cab"><b>' + c.nombre + '</b><span>' + c.d + '</span></div>' +
        (suyos.length
          ? suyos.map(function (i) {
              return '<div class="g-chip-interesado">' + R.escapar(i.nombre) +
                '<span>' + i.poder + '/' + i.influencia + '</span></div>';
            }).join('')
          : '<p class="g-cuadrante-vacio">—</p>') +
        '</div>';
    }).join('') + '</div>';

    var tabla = lista.length
      ? '<div class="envoltura-tabla"><table class="pa-tabla"><thead><tr>' +
        '<th>Interesado</th><th>Rol</th><th>Poder</th><th>Influencia</th><th>Actual → deseado</th><th>Estrategia</th><th></th>' +
        '</tr></thead><tbody>' + lista.map(function (i) {
          return '<tr><td><b>' + R.escapar(i.nombre) + '</b></td>' +
            '<td>' + R.escapar(i.rol || '—') + '</td>' +
            '<td>' + i.poder + '</td><td>' + i.influencia + '</td>' +
            '<td>' + R.escapar(i.actual || '—') + ' → ' + R.escapar(i.deseado || '—') + '</td>' +
            '<td>' + R.escapar(i.estrategia || '—') + '</td>' +
            '<td>' + (puede ? '<button class="g-mini-x" data-o="borrar-interesado" data-id="' + i.id + '">×</button>' : '') + '</td>' +
            '</tr>';
        }).join('') + '</tbody></table></div>'
      : UI.vacio('👥', 'Sin interesados registrados',
        'Regístralos en el proceso <a class="ref" href="#/proyectos/' + p.id + '/proceso/p-int-01">2.5.1 Identificar a los Interesados</a>.');

    var niveles = [
      { id: 'desconocedor', nombre: 'Desconocedor' }, { id: 'reticente', nombre: 'Reticente' },
      { id: 'neutral', nombre: 'Neutral' }, { id: 'partidario', nombre: 'Partidario' }, { id: 'lider', nombre: 'Líder' }
    ];

    return '<h2>Matriz poder · influencia</h2>' + rejilla +
      '<h2>Registro de interesados <span class="pa-conteo">' + lista.length + '</span></h2>' +
      (puede
        ? '<div class="pa-panel">' +
          UI.fila([
            UI.texto('ni-nombre', 'Interesado', '', { placeholder: 'Nombre o grupo' }),
            UI.texto('ni-rol', 'Rol', '', { placeholder: 'Patrocinador, usuario, regulador…' })
          ]) +
          UI.fila([
            UI.texto('ni-poder', 'Poder (1-5)', '3', { tipo: 'number', min: 1, max: 5 }),
            UI.texto('ni-influencia', 'Influencia (1-5)', '3', { tipo: 'number', min: 1, max: 5 }),
            UI.selector('ni-actual', 'Nivel actual', niveles, 'neutral'),
            UI.selector('ni-deseado', 'Nivel deseado', niveles, 'partidario')
          ]) +
          UI.area('ni-estrategia', 'Estrategia de involucramiento', '', { filas: 2 }) +
          '<div class="tarjeta-pie"><button class="btn primario" data-o="crear-interesado">Registrar interesado</button></div>' +
          '</div>'
        : '') +
      tabla;
  }

  function dominioCambios(p) {
    var lista = Gestor.lista('cambios', { proyectoId: p.id });
    var puede = Gestor.puede(p.id, 'editar');

    var tabla = lista.length
      ? '<div class="envoltura-tabla"><table class="pa-tabla"><thead><tr>' +
        '<th>Solicitud</th><th>Solicitante</th><th>Impacto</th><th>Decisión</th><th>Fecha</th><th></th>' +
        '</tr></thead><tbody>' + lista.map(function (c) {
          var clase = c.decision === 'aprobado' ? 'ok' : c.decision === 'rechazado' ? 'falla' : 'aviso';
          return '<tr><td><b>' + R.escapar(c.titulo) + '</b>' +
            (c.descripcion ? '<div class="pa-criterio-det">' + R.escapar(c.descripcion) + '</div>' : '') + '</td>' +
            '<td>' + R.escapar(c.solicitante || '—') + '</td>' +
            '<td>' + R.escapar(c.impacto || '—') + '</td>' +
            '<td>' + UI.pastilla(c.decision || 'pendiente', clase) + '</td>' +
            '<td>' + UI.fecha(c.creado) + '</td>' +
            '<td>' + (puede
              ? '<select class="g-mover" data-decision="' + c.id + '">' +
                ['pendiente', 'aprobado', 'rechazado', 'diferido'].map(function (d) {
                  return '<option value="' + d + '"' + (c.decision === d ? ' selected' : '') + '>' + d + '</option>';
                }).join('') + '</select>'
              : '') + '</td></tr>';
        }).join('') + '</tbody></table></div>'
      : UI.vacio('↻', 'Sin solicitudes de cambio',
        'Toda modificación de una línea base aprobada entra por aquí.');

    return '<h2>Control integrado de cambios</h2>' +
      '<p style="color:var(--tinta-2);font-size:13.4px;margin-bottom:14px">' +
      'Evalúa cada solicitud sobre alcance, cronograma, costo, riesgo y calidad a la vez. ' +
      'Las líneas base solo cambian por una decisión registrada aquí.</p>' +
      (puede
        ? '<div class="pa-panel">' +
          UI.texto('nc-titulo', 'Solicitud', '', { placeholder: 'Qué se pide cambiar' }) +
          UI.area('nc-descripcion', 'Descripción y justificación', '', { filas: 2 }) +
          UI.fila([
            UI.texto('nc-solicitante', 'Solicitante', ''),
            UI.texto('nc-impacto', 'Impacto estimado', '', { placeholder: '+10 días, +3.000 USD' })
          ]) +
          '<div class="tarjeta-pie"><button class="btn primario" data-o="crear-cambio">Registrar solicitud</button></div>' +
          '</div>'
        : '') +
      tabla;
  }

  function dominioLecciones(p) {
    var lista = Gestor.lista('lecciones', { proyectoId: p.id });
    var puede = Gestor.puede(p.id, 'editar');

    var tarjetas = lista.length
      ? '<div class="g-lecciones">' + lista.map(function (l) {
          var dm = l.dominio ? Indice.dominioMeta(l.dominio) : null;
          return '<div class="g-leccion">' +
            '<div class="g-leccion-cab"><b>' + R.escapar(l.situacion) + '</b>' +
            (dm ? '<span class="pastilla-dominio ' + dm.clase + '">' + dm.nombre + '</span>' : '') +
            (puede ? '<button class="g-mini-x" data-o="borrar-leccion" data-id="' + l.id + '">×</button>' : '') + '</div>' +
            (l.causa ? '<div class="g-leccion-campo"><span>Causa</span>' + R.escapar(l.causa) + '</div>' : '') +
            (l.recomendacion ? '<div class="g-leccion-campo"><span>Recomendación</span>' + R.escapar(l.recomendacion) + '</div>' : '') +
            '<div class="g-leccion-pie">' + UI.fecha(l.creado) + '</div>' +
            '</div>';
        }).join('') + '</div>'
      : UI.vacio('💡', 'Sin lecciones registradas',
        'Captúralas durante el proyecto, no al final: en el cierre nadie recuerda el mes 2.');

    return '<h2>Lecciones aprendidas <span class="pa-conteo">' + lista.length + '</span></h2>' +
      (puede
        ? '<div class="pa-panel">' +
          UI.texto('nl-situacion', 'Situación', '', { placeholder: 'Qué pasó, en una línea' }) +
          UI.fila([
            UI.area('nl-causa', 'Causa', '', { filas: 2 }),
            UI.area('nl-recomendacion', 'Recomendación', '', { filas: 2 })
          ]) +
          UI.selector('nl-dominio', 'Dominio', PMBOK.dominiosMeta.map(function (d) {
            return { id: d.id, nombre: d.nombre }; }), 'gobernanza') +
          '<div class="tarjeta-pie"><button class="btn primario" data-o="crear-leccion">Registrar lección</button></div>' +
          '</div>'
        : '') +
      tarjetas;
  }

  /* ══════════════ 9 · CONTROL (EVM) ══════════════ */

  function tabControl(p) {
    var e = Gestor.evm(p.id);
    var s = Gestor.salud(p.id);
    var puede = Gestor.puede(p.id, 'editar');

    var formulario = puede
      ? '<div class="pa-panel">' +
        '<div class="pa-panel-cab"><h2 style="margin:0">Registrar medición</h2></div>' +
        UI.fila([
          UI.texto('nm2-fecha', 'Fecha de corte', UI.hoyISO(), { tipo: 'date' }),
          UI.texto('nm2-pv', 'PV · valor planificado', '', { tipo: 'number', min: 0 }),
          UI.texto('nm2-ev', 'EV · valor ganado', '', { tipo: 'number', min: 0 }),
          UI.texto('nm2-ac', 'AC · costo real', '', { tipo: 'number', min: 0 })
        ]) +
        UI.texto('nm2-nota', 'Nota', '', { placeholder: 'Qué explica la desviación' }) +
        '<div class="tarjeta-pie"><button class="btn primario" data-o="crear-medicion">Registrar</button></div>' +
        '</div>'
      : '';

    if (!e.mediciones.length) {
      return '<h2>Análisis del valor ganado</h2>' +
        '<p style="color:var(--tinta-2);font-size:13.4px;margin-bottom:14px">' +
        'Registra PV, EV y AC a una fecha para monitorear la salud del proyecto (proceso 2.1.7). ' +
        (p.presupuesto ? 'BAC declarado: <b>' + UI.dinero(p.presupuesto, p.moneda) + '</b>.'
                       : 'Declara el presupuesto en la pestaña Equipo para calcular EAC y TCPI.') + '</p>' +
        formulario +
        UI.vacio('📉', 'Aún no hay mediciones',
          'La primera medición activa los indicadores CPI, SPI, EAC y TCPI.');
    }

    var u = e.ultima;
    var fmt = function (v, dec) { return v === null || v === undefined ? '—' : Number(v).toFixed(dec === undefined ? 2 : dec); };

    var tabla = '<div class="envoltura-tabla"><table class="pa-tabla"><thead><tr>' +
      '<th>Fecha</th><th>PV</th><th>EV</th><th>AC</th><th>CV</th><th>SV</th><th>CPI</th><th>SPI</th><th>EAC</th><th></th>' +
      '</tr></thead><tbody>' + e.mediciones.slice().reverse().map(function (m) {
        return '<tr><td>' + UI.fecha(m.fecha) + '</td>' +
          '<td>' + UI.dinero(m.pv, p.moneda) + '</td>' +
          '<td>' + UI.dinero(m.ev, p.moneda) + '</td>' +
          '<td>' + UI.dinero(m.ac, p.moneda) + '</td>' +
          '<td class="' + (m.cv < 0 ? 'g-rojo' : 'g-verde') + '">' + UI.dinero(m.cv, p.moneda) + '</td>' +
          '<td class="' + (m.sv < 0 ? 'g-rojo' : 'g-verde') + '">' + UI.dinero(m.sv, p.moneda) + '</td>' +
          '<td class="' + (m.cpi !== null && m.cpi < 1 ? 'g-rojo' : 'g-verde') + '">' + fmt(m.cpi) + '</td>' +
          '<td class="' + (m.spi !== null && m.spi < 1 ? 'g-rojo' : 'g-verde') + '">' + fmt(m.spi) + '</td>' +
          '<td>' + (m.eac === null ? '—' : UI.dinero(m.eac, p.moneda)) + '</td>' +
          '<td>' + (puede ? '<button class="g-mini-x" data-o="borrar-medicion" data-id="' + m.id + '">×</button>' : '') + '</td>' +
          '</tr>';
      }).join('') + '</tbody></table></div>';

    var bac = e.bac;
    var estadoIndice = function (v) { return v === null ? null : v >= 0.95 ? 'ok' : v >= 0.9 ? 'aviso' : 'falla'; };
    var estadoTcpi = u.tcpi === null ? null : u.tcpi <= 1.05 ? 'ok' : u.tcpi <= 1.1 ? 'aviso' : 'falla';
    var estadoEac = (u.eac === null || !bac) ? null : u.eac <= bac ? 'ok' : u.eac <= bac * 1.1 ? 'aviso' : 'falla';

    var serie = function (campo) { return e.mediciones.map(function (m) { return m[campo]; }); };
    var grafico = Graficos.lineas({
      titulo: 'Valor planificado, ganado y costo real',
      descripcion: 'Acumulado a cada fecha de corte. Si el costo real va por encima del valor ganado, cada unidad gastada rinde menos de lo previsto.',
      puntos: e.mediciones.map(function (m) { return m.fecha; }),
      series: [
        { nombre: 'PV planificado', clase: 'serie-1', valores: serie('pv') },
        { nombre: 'EV ganado', clase: 'serie-2', valores: serie('ev') },
        { nombre: 'AC real', clase: 'serie-3', valores: serie('ac') }
      ],
      formato: function (v) { return UI.dinero(v, p.moneda); },
      formatoEje: function (v) { return v >= 1000 ? Math.round(v / 1000) + ' k' : String(v); }
    });

    return '<h2>Análisis del valor ganado</h2>' +
      '<p class="pa-veredicto g-veredicto-evm">' + veredictoEvm(u) +
        ' <span class="pa-contador">Corte del ' + UI.fecha(u.fecha) + '</span></p>' +
      '<div class="g-fichas">' +
        ficha('CPI', 'Eficiencia de costo', fmt(u.cpi), estadoIndice(u.cpi)) +
        ficha('SPI', 'Eficiencia de plazo', fmt(u.spi), estadoIndice(u.spi)) +
        ficha('EAC', 'Costo final estimado', u.eac === null ? '—' : UI.dinero(u.eac, p.moneda), estadoEac,
          bac ? 'frente a ' + UI.dinero(bac, p.moneda) : 'declara el presupuesto') +
        ficha('TCPI', 'Eficiencia requerida', fmt(u.tcpi), estadoTcpi) +
      '</div>' +
      grafico +
      formulario +
      '<h2>Historial de mediciones</h2>' + tabla +
      '<h2>Informe de rendimiento</h2>' +
      '<div class="g-consejo"><div class="g-consejo-et">Lectura</div>' + lecturaEvm(u, p) + '</div>';
  }

  /* Ficha de un indicador: el número manda y el estado se dice con
     icono y palabra, nunca solo con color. */
  function ficha(sigla, etiqueta, valor, estado, nota) {
    var textos = { ok: ['✓', 'En rango'], aviso: ['!', 'Vigilar'], falla: ['×', 'Actuar'] };
    var t = estado ? textos[estado] : null;
    return '<div class="g-ficha-dato">' +
      '<div class="g-ficha-et"><b>' + sigla + '</b> ' + etiqueta + '</div>' +
      '<div class="g-ficha-valor">' + valor + '</div>' +
      (t ? '<span class="g-estado ' + estado + '"><i aria-hidden="true">' + t[0] + '</i>' + t[1] + '</span>'
         : '<span class="g-estado neutro">Sin dato</span>') +
      (nota ? '<div class="g-ficha-nota">' + nota + '</div>' : '') +
      '</div>';
  }

  function kpi(etiqueta, valor, indice) {
    var pct = indice === null || indice === undefined ? 50 : Math.max(0, Math.min(100, indice * 100));
    var color = indice === null || indice === undefined ? 'var(--linea-fuerte)'
      : indice >= 0.95 ? 'var(--acento)' : indice >= 0.9 ? 'var(--ambar)' : 'var(--rojo)';
    return '<div class="pa-kpi"><div class="pa-kpi-et">' + etiqueta + '</div>' +
      '<div class="pa-kpi-val">' + valor + '</div>' + UI.barra(pct, color) + '</div>';
  }

  function veredictoEvm(u) {
    if (u.cpi === null || u.spi === null) return 'Faltan datos para interpretar la medición.';
    if (u.cpi >= 1 && u.spi >= 1) return 'El proyecto va por debajo de lo presupuestado y adelantado respecto del plan.';
    if (u.cpi >= 1) return 'El costo está controlado, pero el avance va por detrás del plan: revisa la ruta crítica.';
    if (u.spi >= 1) return 'El avance va según el plan, pero cuesta más de lo previsto: revisa las estimaciones y el alcance real ejecutado.';
    return 'Costo y plazo van por debajo de lo planificado. Presenta opciones cuantificadas antes de que la desviación se consolide.';
  }

  function lecturaEvm(u, p) {
    var L = [];
    if (u.cpi !== null) {
      L.push('Por cada unidad monetaria gastada se ha ganado <b>' + u.cpi.toFixed(2) + '</b> de valor planificado.');
    }
    if (u.spi !== null) {
      L.push('Se ha completado el <b>' + Math.round(u.spi * 100) + ' %</b> del trabajo que debería estar hecho a esta fecha.');
    }
    if (u.eac !== null) {
      L.push('Si el desempeño se mantiene, el proyecto costará <b>' + UI.dinero(u.eac, p.moneda) +
        '</b> frente a un presupuesto de ' + UI.dinero(p.presupuesto, p.moneda) + '.');
    }
    if (u.tcpi !== null) {
      L.push('Para terminar dentro del presupuesto haría falta una eficiencia de <b>' + u.tcpi.toFixed(2) +
        '</b> en el trabajo restante' + (u.tcpi > 1.1 ? ', lo que rara vez se consigue sin cambiar el alcance.' : '.'));
    }
    return L.join(' ');
  }

  /* ══════════════ 10 · EQUIPO ══════════════ */

  function tabEquipo(p) {
    var miembros = Gestor.lista('miembros', { proyectoId: p.id });
    var puede = Gestor.puede(p.id, 'dirigir');
    var met = Gestor.metodologia(p.metodologia);

    var ROLES_PROYECTO = [
      { id: 'lider', nombre: 'Líder de proyecto' },
      { id: 'po', nombre: 'Product Owner' },
      { id: 'sm', nombre: 'Scrum Master' },
      { id: 'equipo', nombre: 'Equipo de desarrollo' },
      { id: 'ejecutor', nombre: 'Ejecutor' },
      { id: 'observador', nombre: 'Observador' }
    ];

    var listaMiembros = miembros.map(function (m) {
      var u = Gestor.uno('usuarios', m.usuarioId);
      var esYo = u && Gestor.usuarioActual() && u.id === Gestor.usuarioActual().id;
      return '<div class="g-miembro">' +
        UI.avatar(u ? u.nombre : '?') +
        '<div class="g-miembro-datos">' +
          '<b>' + R.escapar(u ? u.nombre : 'desconocido') + (esYo ? ' (tú)' : '') + '</b>' +
          '<span>' + R.escapar(u ? u.correo : '') + '</span>' +
        '</div>' +
        (puede
          ? '<select class="g-mover" data-rol-miembro="' + m.id + '">' + ROLES_PROYECTO.map(function (r) {
              return '<option value="' + r.id + '"' + (m.rol === r.id ? ' selected' : '') + '>' + r.nombre + '</option>';
            }).join('') + '</select>' +
            (miembros.length > 1 ? '<button class="g-mini-x" data-o="quitar-miembro" data-id="' + m.id + '">×</button>' : '')
          : '<span class="pa-contador">' + (ROLES_PROYECTO.filter(function (r) { return r.id === m.rol; })[0] || {}).nombre + '</span>') +
        '</div>';
    }).join('');

    var candidatos = Gestor.lista('usuarios').filter(function (u) {
      return u.activo && !miembros.some(function (m) { return m.usuarioId === u.id; });
    });

    var fases = (p.fases || []).map(function (f, i) {
      return '<div class="g-fase"><span class="g-fase-n">' + (i + 1) + '</span>' +
        '<b>' + R.escapar(f.nombre) + '</b>' +
        (puede ? '<button class="g-mini-x" data-o="borrar-fase" data-id="' + f.id + '">×</button>' : '') +
        '</div>';
    }).join('');

    return '<h2>Miembros del equipo <span class="pa-conteo">' + miembros.length + '</span></h2>' +
      '<div class="g-miembros">' + listaMiembros + '</div>' +
      (puede && candidatos.length
        ? '<div class="pa-panel">' +
          UI.fila([
            UI.selector('nmb-usuario', 'Añadir persona', candidatos.map(function (u) {
              return { id: u.id, nombre: u.nombre + ' · ' + u.correo }; }), candidatos[0].id),
            UI.selector('nmb-rol', 'Rol en el proyecto', ROLES_PROYECTO, 'equipo')
          ]) +
          '<div class="tarjeta-pie"><button class="btn primario" data-o="agregar-miembro">Agregar miembro</button>' +
          '<span class="pa-aviso-inline">Los miembros pueden editar el proyecto; el líder además puede dirigirlo.</span></div>' +
          '</div>'
        : (puede ? '<p style="color:var(--tinta-3);font-size:13.2px">Todas las cuentas activas ya son miembros. ' +
            'Crea más desde <a class="ref" href="#/admin">Administración</a>.</p>' : '')) +

      '<h2>Configuración del proyecto</h2>' +
      (puede
        ? '<div class="pa-panel">' +
          UI.fila([
            UI.texto('cp-nombre', 'Nombre', p.nombre),
            UI.selector('cp-estado', 'Estado', [
              { id: 'activo', nombre: 'Activo' }, { id: 'pausa', nombre: 'En pausa' },
              { id: 'cerrado', nombre: 'Cerrado' }, { id: 'cancelado', nombre: 'Cancelado' }
            ], p.estado)
          ]) +
          UI.area('cp-descripcion', 'Descripción', p.descripcion, { filas: 2 }) +
          UI.fila([
            UI.texto('cp-inicio', 'Inicio', p.inicio || '', { tipo: 'date' }),
            UI.texto('cp-fin', 'Fin previsto', p.fin || '', { tipo: 'date' }),
            UI.texto('cp-presupuesto', 'Presupuesto (BAC)', p.presupuesto || '', { tipo: 'number', min: 0 }),
            UI.texto('cp-moneda', 'Moneda', p.moneda || 'USD')
          ]) +
          UI.fila([
            UI.selector('cp-portafolio', 'Portafolio',
              [{ id: '', nombre: '— Sin portafolio —' }].concat(Gestor.lista('portafolios').map(function (x) {
                return { id: x.id, nombre: x.nombre }; })), p.portafolioId || ''),
            UI.selector('cp-roca', 'Roca de gerencia',
              [{ id: '', nombre: '— Sin roca —' }].concat(Gestor.lista('rocas').map(function (r) {
                return { id: r.id, nombre: r.trimestre + ' · ' + r.titulo }; })), p.rocaId || ''),
            UI.texto('cp-wip', 'Límite de WIP', p.wip || 3, { tipo: 'number', min: 1 })
          ]) +
          '<div class="g-campo"><label class="g-etiqueta">Metodología (adaptación)' +
          '<span>Cambiarla reordena el flujo y ajusta qué procesos son iterativos</span></label>' +
          UI.opciones('met-proyecto', PMBOK.metodologias.map(function (m) {
            return { id: m.id, nombre: m.nombre, icono: m.icono, lema: m.lema };
          }), p.metodologia) + '</div>' +
          '<div class="tarjeta-pie"><button class="btn primario" data-o="guardar-proyecto">Guardar cambios</button>' +
          '<button class="btn" data-o="borrar-proyecto">Eliminar proyecto</button></div>' +
          '</div>'
        : '<p style="color:var(--tinta-3);font-size:13.2px">Solo el líder del proyecto o un administrador pueden cambiar la configuración.</p>') +

      '<h2>' + (met.id === 'agil' ? 'Sprints' : 'Fases') + '</h2>' +
      '<div class="g-fases">' + (fases || '<p style="color:var(--tinta-3);font-size:13.2px">Sin fases declaradas.</p>') + '</div>' +
      (puede
        ? '<div class="tarjeta-pie"><button class="btn" data-o="agregar-fase">+ Añadir fase</button></div>'
        : '');
  }

  /* ══════════════ 11 · CALIDAD DEL PLAN ══════════════ */

  function tabCalidad(p, sub) {
    Proyecto.usar(p.id);
    VistasProyecto.fijarBase('#/proyectos/' + p.id + '/calidad');

    var partes = String(sub || '').split('/');
    if (partes[0] === 'informe') return VistasProyecto.informe();
    if (partes[0] === 'seccion' && partes[1]) return VistasProyecto.seccion(partes[1]);

    var ev = Calidad.evaluarProyecto(Proyecto.cargar());
    var g = ev.global;

    return '<h2>Calidad del plan</h2>' +
      '<p style="color:var(--tinta-2);font-size:13.4px;margin-bottom:16px">' +
      'Verificación del plan contra criterios explícitos: precisión de la redacción, datos medibles y ' +
      'coherencia entre secciones. Es la comprobación que ninguna plantilla hace por sí sola.</p>' +

      '<div class="pa-tablero">' +
        '<div class="pa-tablero-dial">' +
          UI.anillo(g.puntaje, g.nivel.color === 'ok' ? 'var(--acento)' :
            g.nivel.color === 'aviso' ? 'var(--ambar)' : 'var(--rojo)', 'grande') +
          '<div class="pa-nivel">' + g.nivel.etiqueta + '</div>' +
        '</div>' +
        '<div class="pa-tablero-cuerpo">' +
          '<p class="pa-veredicto">' + g.veredicto + '</p>' +
          '<div class="pa-kpis">' +
            kpi('Calidad del contenido', g.contenido + ' / 100', g.contenido / 100) +
            kpi('Coherencia entre secciones', g.coherencia + ' / 100', g.coherencia / 100) +
            kpi('Completitud', g.completitud + ' %', g.completitud / 100) +
          '</div>' +
          '<div class="tarjeta-pie">' +
            '<a class="btn primario" href="#/proyectos/' + p.id + '/calidad/informe">Ver informe completo</a>' +
          '</div>' +
        '</div>' +
      '</div>' +

      VistasProyecto.bloqueCarga() +

      '<h2>Las diez secciones del plan</h2>' +
      '<div class="pa-secciones">' + PMBOK.seccionesProyecto.map(function (sec) {
        var e = ev.secciones.filter(function (s) { return s.id === sec.id; })[0];
        var color = UI.colorPorcentaje(e.puntaje);
        return '<a class="pa-sec" href="#/proyectos/' + p.id + '/calidad/seccion/' + sec.id + '">' +
          '<div class="pa-sec-n">' + sec.n + '</div>' +
          '<div class="pa-sec-cuerpo">' +
            '<div class="pa-sec-tit">' + sec.nombre + '</div>' +
            '<div class="pa-sec-lema">' + sec.lema + '</div>' +
            UI.barra(e.completitud, color) +
          '</div>' +
          '<div class="pa-sec-cifras">' +
            '<div class="pa-sec-puntaje" style="color:' + color + '">' + (e.camposLlenos ? e.puntaje : '—') + '</div>' +
            '<div class="pa-sec-campos">' + e.camposLlenos + '/' + e.camposTotal + ' campos</div>' +
          '</div></a>';
      }).join('') + '</div>';
  }

  return {
    vista: vista,
    pestanas: PESTANAS,
    tarjetaProceso: tarjetaProceso
  };
})();
