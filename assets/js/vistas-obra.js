/* ═══════════════════════════════════════════════════════════
   vistas-obra.js — El espacio de trabajo de un proyecto
   ───────────────────────────────────────────────────────────
   Arma la pantalla de un proyecto: la cabecera con su avance,
   el siguiente paso, las pestañas, y las dos más breves
   (archivos y calendario) junto al resumen de calidad.

   Cada pestaña mayor vive en su propio archivo de obra/:
   ObraFlujo, ObraDocumentos, ObraTrabajo, ObraDominios,
   ObraControl y ObraEquipo.
   ═══════════════════════════════════════════════════════════ */

window.VistasObra = (function () {
  'use strict';

  var R = window.Render;

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

    if (sub === 'proceso') return ObraFlujo.ficha(p, arg);
    if (sub === 'documento') return ObraDocumentos.editor(p, arg);

    var pestana = sub || 'flujo';
    var cuerpo =
      pestana === 'documentos' ? ObraDocumentos.tab(p) :
      pestana === 'archivos' ? tabArchivos(p) :
      pestana === 'calendario' ? tabCalendario(p, arg) :
      pestana === 'trabajo' ? ObraTrabajo.tab(p, arg) :
      pestana === 'dominios' ? ObraDominios.tab(p, arg) :
      pestana === 'control' ? ObraControl.tab(p) :
      pestana === 'equipo' ? ObraEquipo.tab(p) :
      pestana === 'calidad' ? tabCalidad(p, arg) : ObraFlujo.tab(p);

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
        '<a class="pa-mini" href="#/panel">' + Iconos.svg('flecha-izq') + ' Volver al panel</a>' +
        '<h1 class="titulo-pagina">' + R.escapar(p.nombre) + '</h1>' +
        '<div class="g-obra-meta">' +
          '<span class="g-metodo">' + (Iconos.resolver(met.icono) || Iconos.resolver(met.id)) + ' ' + R.escapar(met.nombre) + '</span>' +
          UI.pastilla(p.estado, p.estado === 'activo' ? 'ok' : p.estado === 'cerrado' ? '' : 'aviso') +
          '<span>' + Iconos.svg('equipo') + ' ' + R.escapar(director ? director.nombre : 'Sin director') + '</span>' +
          (p.inicio ? '<span>' + Iconos.svg('calendario') + ' Inicio ' + UI.fecha(p.inicio) + '</span>' : '') +
          (p.presupuesto ? '<span>' + Iconos.svg('control') + ' BAC ' + UI.dinero(p.presupuesto, p.moneda) + '</span>' : '') +
        '</div>' +
      '</div>' +
      /* El avance del flujo no es un veredicto de salud: se pinta con el acento */
      '<div class="g-obra-progreso">' +
        UI.anillo(pr.porcentaje) +
        '<span><b>' + pr.completados + ' de ' + pr.aplicables + '</b>procesos completados</span>' +
      '</div>' +
      '</div>' +
      siguientePaso(p, pestana !== 'flujo') +
      /* La adaptación se lee una vez: abierta en el flujo, plegada en el resto */
      '<details class="g-adaptacion"' + (pestana === 'flujo' ? ' open' : '') + '>' +
        '<summary><span>Adaptación</span> ' + R.escapar(met.nombre) + '</summary>' +
        '<p>' + met.tailoring + '</p>' +
      '</details>' +
      '<nav class="g-pestanas-obra" aria-label="Secciones del proyecto">' + pestanas + '</nav>';
  }

  /* La pregunta más frecuente dentro de un proyecto: ¿qué toca ahora? */
  /* `compacto`: fuera del flujo la acción sigue a mano, pero ocupa una línea */
  function siguientePaso(p, compacto) {
    var sig = Gestor.siguienteProceso(p.id);
    var extra = compacto ? ' compacto' : '';
    if (!sig) {
      return '<div class="g-paso hecho' + extra + '">' +
        '<span class="g-paso-icono">' + Iconos.svg('calidad') + '</span>' +
        '<div class="g-paso-cuerpo">' +
        '<span class="g-paso-et">Flujo completo</span>' +
        '<b>Todos los procesos están completados u omitidos</b></div>' +
        '<a class="btn" href="#/proyectos/' + p.id + '/calidad/informe">Ver informe de calidad ' + Iconos.svg('flecha-der', 'ic-flecha') + '</a></div>';
    }
    var proc = Indice.proceso(sig.id);
    var est = Gestor.estadoProceso(p.id, sig.id).estado;
    var salidas = (sig.salidas || []).map(function (a) { return Gestor.artefacto(a); }).filter(Boolean);
    return '<div class="g-paso' + extra + '">' +
      '<span class="g-paso-icono">' + Iconos.svg(est === 'iniciado' ? 'rayo' : 'flujo') + '</span>' +
      '<div class="g-paso-cuerpo">' +
        '<span class="g-paso-et">' + (est === 'iniciado' ? 'En curso' : 'Siguiente paso') + '</span>' +
        '<b><i>' + proc.cod + '</i>' + R.escapar(proc.nombre) + '</b>' +
        (salidas.length ? '<span class="g-paso-sub">Produce: ' +
          salidas.map(function (a) { return R.escapar(a.nombre); }).join(', ') + '</span>' : '') +
      '</div>' +
      '<a class="btn primario" href="#/proyectos/' + p.id + '/proceso/' + sig.id + '">' +
        (est === 'iniciado' ? 'Continuar' : 'Abrir proceso') + ' ' + Iconos.svg('flecha-der', 'ic-flecha') + '</a>' +
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
      GestionAgenda.calendario(anio, mes, eventos, '#/proyectos/' + p.id + '/calendario/') +
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
          UI.anillo(g.puntaje, g.nivel.color === 'ok' ? 'var(--ok)' :
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

  function kpi(etiqueta, valor, indice) {
    var pct = indice === null || indice === undefined ? 50 : Math.max(0, Math.min(100, indice * 100));
    var color = indice === null || indice === undefined ? 'var(--linea-fuerte)'
      : indice >= 0.95 ? 'var(--ok)' : indice >= 0.9 ? 'var(--ambar)' : 'var(--rojo)';
    return '<div class="pa-kpi"><div class="pa-kpi-et">' + etiqueta + '</div>' +
      '<div class="pa-kpi-val">' + valor + '</div>' + UI.barra(pct, color) + '</div>';
  }

  return {
    vista: vista,
    pestanas: PESTANAS
  };
})();
