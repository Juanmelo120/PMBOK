/* ═══════════════════════════════════════════════════════════
   gestion/panel.js — El panel de control y sus tarjetas de proyecto
   ───────────────────────────────────────────────────────────
   La primera pantalla con sesión: cifras, proyectos visibles con su
   avance por bandas y el formulario para crear uno nuevo.
   ═══════════════════════════════════════════════════════════ */

window.GestionPanel = (function () {
  'use strict';

  var R = window.Render;

  /* ══════════════ PANEL ══════════════ */

  function panel(abrirNuevo) {
    var u = Gestor.usuarioActual();
    var proyectos = Gestor.proyectosVisibles();
    var docs = 0, procesosOk = 0;
    proyectos.forEach(function (p) {
      docs += Gestor.documentosDe(p.id).length;
      procesosOk += Gestor.progreso(p.id).completados;
    });
    var activos = proyectos.filter(function (p) { return p.estado === 'activo'; }).length;

    var creaProyectos = Gestor.puedeGestionar();
    var tarjetas = proyectos.length
      ? '<div class="g-proyectos">' + proyectos.map(tarjetaProyecto).join('') + '</div>'
      : '';

    return '<div class="hoja-ancha prosa g-panel">' +
      '<div class="g-cabecera">' +
        '<div><div class="eyebrow">Panel de control</div>' +
        '<h1 class="titulo-pagina" style="margin:0">Hola, ' + R.escapar((u.nombre || '').split(' ')[0]) + '</h1></div>' +
        '<div class="g-cabecera-acciones">' +
          '<button class="btn" data-g="unirse-proyecto">' + Iconos.svg('equipo') + ' Unirme con un código</button>' +
          (creaProyectos
            ? '<button class="btn primario" data-g="abrir-nuevo-proyecto">' + Iconos.svg('mas') + ' Nuevo proyecto</button>'
            : '') +
        '</div>' +
      '</div>' +
      '<p class="bajada">Ruta sugerida: empieza por <b>Iniciar el proyecto o fase</b> y genera el acta de constitución. ' +
      'Desde ahí, cada proceso te dirá qué necesita y qué documento produce.</p>' +

      '<div class="cifras" style="margin:0 0 30px">' +
        UI.cifra(activos, 'Proyectos activos', null, 'activos') +
        UI.cifra(procesosOk, 'Procesos completados', null, 'check-circulo') +
        UI.cifra(docs, 'Documentos generados', null, 'documentos') +
        UI.cifra(Gestor.lista('portafolios').length, 'Portafolios', null, 'portafolios') +
      '</div>' +

      (creaProyectos
        ? '<div id="g-nuevo-proyecto"' + (abrirNuevo || !proyectos.length ? '' : ' hidden') + '>' +
          formularioProyecto() + '</div>'
        : (proyectos.length ? '' : UI.vacio('📁', 'Todavía no participas en ningún proyecto',
            'Pide al líder de tu grupo el <b>código de invitación</b> y pulsa <b>Unirme con un código</b>. ' +
            'Si vas a liderar un proyecto, pide a un administrador el rol de director para poder crearlo.',
            '<button class="btn primario" data-g="unirse-proyecto">' + Iconos.svg('equipo') + ' Unirme con un código</button>'))) +

      (proyectos.length ? '<h2>Tus proyectos <span class="pa-conteo">' + proyectos.length + '</span></h2>' + tarjetas : '') +
      '</div>';
  }

  function tarjetaProyecto(p) {
    var met = Gestor.metodologia(p.metodologia);
    var pr = Gestor.progreso(p.id);
    var s = Gestor.salud(p.id);
    var port = p.portafolioId ? Gestor.uno('portafolios', p.portafolioId) : null;
    var director = p.directorId ? Gestor.uno('usuarios', p.directorId) : null;

    return '<a class="g-proyecto" href="#/proyectos/' + p.id + '">' +
      '<div class="g-proyecto-cab">' +
        '<div>' +
          '<div class="g-proyecto-nombre">' + R.escapar(p.nombre) + '</div>' +
          '<div class="g-proyecto-meta">' +
            '<span class="g-metodo">' + (Iconos.resolver(met.icono) || Iconos.resolver(met.id)) + ' ' + R.escapar(met.nombre) + '</span>' +
            '<span>' + (port ? Iconos.svg('carpeta') + ' ' + R.escapar(port.nombre) : Iconos.svg('carpeta-vacia') + ' Sin portafolio') + '</span>' +
            (p.estado !== 'activo' ? UI.pastilla(p.estado, p.estado === 'cerrado' ? 'ok' : 'aviso') : '') +
          '</div>' +
        '</div>' +
        /* El avance del flujo no es un veredicto de salud: se pinta con el acento */
        UI.anillo(pr.porcentaje) +
      '</div>' +
      (p.descripcion ? '<div class="g-proyecto-desc">' + R.escapar(p.descripcion.slice(0, 130)) + '</div>' : '') +
      siguientePaso(p) +
      bandasProyecto(p) +
      '<div class="g-proyecto-pie">' +
        '<span>' + Iconos.svg('flujo') + pr.completados + '/' + pr.aplicables + ' procesos</span>' +
        '<span>' + Iconos.svg('documento') + Gestor.documentosDe(p.id).length + '</span>' +
        (s.estado !== 'sin-datos' ? UI.pastilla(s.etiqueta, s.estado) : '') +
        '<span class="g-proyecto-director">' + UI.avatar(director ? director.nombre : '?') +
          R.escapar(director ? director.nombre : 'sin director') + '</span>' +
      '</div>' +
      '</a>';
  }

  /* El recorrido del proyecto por las cinco bandas, de un vistazo */
  function bandasProyecto(p) {
    var resumen = [];
    var segmentos = PMBOK.bandas.map(function (b) {
      var procesos = Gestor.procesosDeBanda(p.id, b.id);
      var hechos = procesos.filter(function (f) {
        var e = Gestor.estadoProceso(p.id, f.id).estado;
        return e === 'completado' || e === 'omitido';
      }).length;
      var fr = procesos.length ? hechos / procesos.length : 0;
      resumen.push(b.nombre + ' ' + hechos + ' de ' + procesos.length);
      return '<i style="--p:' + fr.toFixed(3) + '"' + (fr >= 1 ? ' class="llena"' : '') + '></i>';
    }).join('');
    return '<div class="g-proyecto-bandas" role="img" aria-label="' + R.escapar(resumen.join(', ')) + '" ' +
      'title="' + R.escapar(resumen.join(' · ')) + '">' + segmentos + '</div>';
  }

  function siguientePaso(p) {
    var sig = Gestor.siguienteProceso(p.id);
    if (!sig) return '<div class="g-siguiente hecho"><span>Todos los procesos cerrados</span></div>';
    var proc = Indice.proceso(sig.id);
    var enCurso = Gestor.estadoProceso(p.id, sig.id).estado === 'iniciado';
    return '<div class="g-siguiente"><span>' + (enCurso ? 'En curso' : 'Siguiente') + '</span>' +
      '<b><i>' + proc.cod + '</i> ' + R.escapar(proc.nombre) + '</b></div>';
  }

  function formularioProyecto() {
    var portafolios = [{ id: '', nombre: 'Sin portafolio' }].concat(
      Gestor.lista('portafolios').map(function (p) { return { id: p.id, nombre: p.nombre }; }));
    var rocas = [{ id: '', nombre: 'Sin roca asociada' }].concat(
      Gestor.lista('rocas').map(function (r) { return { id: r.id, nombre: r.trimestre + ' · ' + r.titulo }; }));

    return '<div class="pa-panel">' +
      '<div class="pa-panel-cab"><h2 style="margin:0">Nuevo proyecto</h2>' +
        '<button class="btn" data-g="cerrar-nuevo-proyecto">Cancelar</button></div>' +
      '<p style="color:var(--tinta-2);font-size:13.4px;margin:0 0 16px">' +
      'Se desplegará el mapa de los 40 procesos en el orden sugerido para la metodología que elijas.</p>' +
      '<div id="g-error-proyecto"></div>' +
      UI.texto('np-nombre', 'Nombre del proyecto', '', { placeholder: 'Ej.: Sistema de nómina para 14 sedes', requerido: true }) +
      UI.area('np-descripcion', 'Descripción', '', { filas: 2, placeholder: '¿Qué entregará el proyecto?' }) +
      '<div class="g-campo"><label class="g-etiqueta">Metodología<span>Determina el orden del flujo y la adaptación de los procesos</span></label>' +
      UI.opciones('metodologia', PMBOK.metodologias.map(function (m) {
        return { id: m.id, nombre: m.nombre, icono: m.icono, lema: m.lema };
      }), 'predictivo') + '</div>' +
      UI.fila([
        UI.selector('np-portafolio', 'Portafolio', portafolios, ''),
        UI.selector('np-roca', 'Roca de gerencia (EOS)', rocas, '')
      ]) +
      UI.fila([
        UI.texto('np-inicio', 'Fecha de inicio', UI.hoyISO(), { tipo: 'date' }),
        UI.texto('np-fin', 'Fin previsto', '', { tipo: 'date' }),
        UI.texto('np-presupuesto', 'Presupuesto (BAC)', '', { tipo: 'number', placeholder: '45000', min: 0 })
      ]) +
      '<div class="tarjeta-pie"><button class="btn primario" data-g="crear-proyecto">Crear proyecto ' + Iconos.svg('flecha-der', 'ic-flecha') + '</button></div>' +
      '</div>';
  }

  return { panel: panel };
})();
