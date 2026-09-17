/* ═══════════════════════════════════════════════════════════
   gestion/agenda.js — Agenda y calendario mensual
   ───────────────────────────────────────────────────────────
   Las fechas de todos los proyectos visibles en una sola rejilla:
   inicios y fines, límites de tareas, sprints, hitos y cortes de valor
   ganado. El calendario lo reutiliza la pestaña del proyecto.
   ═══════════════════════════════════════════════════════════ */

window.GestionAgenda = (function () {
  'use strict';

  var R = window.Render;

  /* ══════════════ AGENDA (calendario global) ══════════════ */

  function agenda(arg) {
    var hoy = new Date();
    var partes = String(arg || '').split('-');
    var anio = parseInt(partes[0], 10) || hoy.getFullYear();
    var mes = (parseInt(partes[1], 10) || (hoy.getMonth() + 1)) - 1;

    var eventos = Gestor.eventosDe(null);
    return '<div class="hoja-ancha prosa">' +
      '<div class="eyebrow">Agenda</div>' +
      '<h1 class="titulo-pagina">Calendario global</h1>' +
      '<p class="bajada">Fechas de todos los proyectos visibles: inicios y fines, límites de tareas, ' +
      'sprints, hitos y cortes de valor ganado.</p>' +
      calendario(anio, mes, eventos, '#/agenda/') +
      listaEventos(eventos, anio, mes) +
      '</div>';
  }

  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
               'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  function calendario(anio, mes, eventos, rutaBase) {
    var primero = new Date(anio, mes, 1);
    var diaSemana = (primero.getDay() + 6) % 7;   // lunes = 0
    var dias = new Date(anio, mes + 1, 0).getDate();
    var hoyISO = UI.hoyISO();

    var porDia = {};
    eventos.forEach(function (e) {
      if (!porDia[e.fecha]) porDia[e.fecha] = [];
      porDia[e.fecha].push(e);
    });

    var celdas = '';
    for (var i = 0; i < diaSemana; i++) celdas += '<div class="g-dia vacio"></div>';
    for (var d = 1; d <= dias; d++) {
      var iso = anio + '-' + String(mes + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      var evs = porDia[iso] || [];
      celdas += '<div class="g-dia' + (iso === hoyISO ? ' hoy' : '') + (evs.length ? ' con-eventos' : '') + '">' +
        '<div class="g-dia-num">' + d + '</div>' +
        evs.slice(0, 3).map(function (e) {
          return '<a class="g-evento ' + e.tipo + (e.extra === 'critico' ? ' critico' : '') + '" ' +
            'href="#/proyectos/' + e.ref + '" title="' + R.escapar(e.titulo) + '">' +
            R.escapar(e.titulo.slice(0, 28)) + '</a>';
        }).join('') +
        (evs.length > 3 ? '<div class="g-mas">+' + (evs.length - 3) + '</div>' : '') +
        '</div>';
    }
    /* La última semana se completa para que la rejilla no quede abierta */
    var sobrantes = (7 - (diaSemana + dias) % 7) % 7;
    for (var k = 0; k < sobrantes; k++) celdas += '<div class="g-dia vacio"></div>';

    var prevMes = mes === 0 ? 11 : mes - 1, prevAnio = mes === 0 ? anio - 1 : anio;
    var sigMes = mes === 11 ? 0 : mes + 1, sigAnio = mes === 11 ? anio + 1 : anio;

    return '<div class="g-calendario">' +
      '<div class="g-cal-cab">' +
        '<a class="btn" href="' + rutaBase + prevAnio + '-' + (prevMes + 1) + '">←</a>' +
        '<h3>' + MESES[mes].charAt(0).toUpperCase() + MESES[mes].slice(1) + ' ' + anio + '</h3>' +
        '<a class="btn" href="' + rutaBase + sigAnio + '-' + (sigMes + 1) + '">→</a>' +
        '<a class="btn" href="' + rutaBase + '">Hoy</a>' +
      '</div>' +
      '<div class="g-cal-dias">' + ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(function (x) {
        return '<div>' + x + '</div>'; }).join('') + '</div>' +
      '<div class="g-cal-rejilla">' + celdas + '</div>' +
      '<div class="g-leyenda">' +
        '<span class="g-evento proyecto">Proyecto</span>' +
        '<span class="g-evento hito">Hito</span>' +
        '<span class="g-evento tarea">Tarea</span>' +
        '<span class="g-evento sprint">Sprint</span>' +
        '<span class="g-evento evm">Corte EVM</span>' +
      '</div></div>';
  }

  function listaEventos(eventos, anio, mes) {
    var pref = anio + '-' + String(mes + 1).padStart(2, '0');
    var delMes = eventos.filter(function (e) { return e.fecha.indexOf(pref) === 0; });
    if (!delMes.length) return '<p style="color:var(--tinta-3);font-size:13.4px">Sin eventos este mes.</p>';
    return '<h2>Eventos del mes</h2>' + R.tabla(['Fecha', 'Tipo', 'Evento', 'Proyecto'],
      delMes.map(function (e) {
        var p = Gestor.uno('proyectos', e.ref);
        return [UI.fecha(e.fecha), e.tipo, e.titulo, p ? p.nombre : '—'];
      }));
  }

  return { agenda: agenda, calendario: calendario };
})();
