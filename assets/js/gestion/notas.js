/* ═══════════════════════════════════════════════════════════
   gestion/notas.js — Notas de los proyectos (solo admin)
   ───────────────────────────────────────────────────────────
   Califica cada proyecto de 1.0 a 5.0 según lo que lleve
   completado del flujo de los 40 procesos, y deja borrar los
   proyectos de prueba que solo ocupan sitio.

   La nota no se guarda: se calcula del avance cada vez que se
   pinta la pantalla, así nunca se queda desfasada.
   ═══════════════════════════════════════════════════════════ */

window.GestionNotas = (function () {
  'use strict';

  var R = window.Render;

  /* La escala va de 1.0 (nada hecho) a 5.0 (los 40 procesos), repartida
     de forma lineal: cada 25 % del avance vale un punto entero. */
  var NOTA_MINIMA = 1.0;
  var NOTA_MAXIMA = 5.0;
  var APROBADO = 3.0;          /* 50 % del flujo */

  function notaDe(porcentaje) {
    var n = NOTA_MINIMA + (Math.max(0, Math.min(100, porcentaje)) / 100) * (NOTA_MAXIMA - NOTA_MINIMA);
    return Math.round(n * 10) / 10;
  }

  function texto(nota) {
    return nota.toFixed(1);
  }

  function colorNota(nota) {
    return nota >= 4.0 ? 'var(--ok)' : nota >= APROBADO ? 'var(--ambar)' : 'var(--rojo)';
  }

  /* ══════════════ Cálculo ══════════════ */

  function calificar() {
    return Gestor.lista('proyectos').map(function (p) {
      var g = Gestor.progreso(p.id);
      var nota = notaDe(g.porcentaje);
      var director = p.directorId ? Gestor.uno('usuarios', p.directorId) : null;
      return {
        proyecto: p,
        progreso: g,
        nota: nota,
        aprobado: nota >= APROBADO,
        director: director ? director.nombre : '—',
        equipo: Gestor.lista('miembros', { proyectoId: p.id }).length,
        documentos: Gestor.lista('documentos', { proyectoId: p.id }).length,
        tareas: Gestor.lista('tareas', { proyectoId: p.id }).length
      };
    }).sort(function (a, b) {
      return (b.nota - a.nota) || a.proyecto.nombre.localeCompare(b.proyecto.nombre);
    });
  }

  /* ══════════════ Pantalla ══════════════ */

  function notas() {
    if (!Gestor.esAdmin()) {
      return '<div class="hoja">' + UI.vacio('candado', 'Apartado de administrador',
        'Las notas de los proyectos solo las ve quien administra. ' +
        'Entra con el perfil de administración y vuelve a intentarlo.' +
        '<br><a class="ref" href="#/entrar">Ir al acceso</a>') + '</div>';
    }

    var filas = calificar();
    var promedio = filas.length
      ? Math.round((filas.reduce(function (n, f) { return n + f.nota; }, 0) / filas.length) * 10) / 10
      : 0;
    var aprobados = filas.filter(function (f) { return f.aprobado; }).length;

    var cuerpo = filas.length
      ? '<div class="envoltura-tabla"><table class="pa-tabla nt-tabla">' +
        '<thead><tr><th>Proyecto</th><th>Director</th><th>Procesos</th>' +
        '<th>Avance</th><th>Nota</th><th>Resultado</th><th></th></tr></thead><tbody>' +
        filas.map(fila).join('') + '</tbody></table></div>'
      : UI.vacio('activos', 'Todavía no hay proyectos',
          'En cuanto exista uno, aquí aparecerá su nota calculada sobre el flujo de los 40 procesos.');

    return '<div class="hoja-ancha prosa">' +
      '<div class="eyebrow">Solo administradores</div>' +
      '<h1 class="titulo-pagina">Notas de los proyectos</h1>' +
      '<p class="bajada">Cada proyecto se califica de 1.0 a 5.0 según lo que lleve completado ' +
      'del flujo de los 40 procesos. La nota se calcula sola: no hay que mantenerla.</p>' +
      GestionSupervision.pestanas('notas') +
      '<div class="cifras" style="margin:0 0 26px">' +
        UI.cifra(filas.length, 'Proyectos calificados', null, 'activos') +
        UI.cifra(texto(promedio), 'Nota promedio', colorNota(promedio), 'tendencia') +
        UI.cifra(aprobados, 'Aprobados (≥ ' + texto(APROBADO) + ')', null, 'check-circulo') +
        UI.cifra(filas.length - aprobados, 'Por debajo de ' + texto(APROBADO), null, 'aviso') +
      '</div>' +
      escala() +
      cuerpo +
      '<div class="nota"><div class="nota-titulo">Sobre el borrado</div>' +
      'Eliminar un proyecto borra también sus documentos, archivos, riesgos, tareas y mediciones. ' +
      'No se puede deshacer, así que pide escribir <b>ELIMINAR</b> para confirmar.</div>' +
      '</div>';
  }

  /* De un vistazo, qué avance corresponde a cada nota */
  function escala() {
    var tramos = [0, 25, 50, 75, 100];
    return '<h2>Cómo se calcula la nota</h2>' +
      '<p>Nota = 1.0 + (avance ÷ 100) × 4.0. Cada 25 % del flujo vale un punto entero, ' +
      'y se aprueba a partir de ' + texto(APROBADO) + ', que es la mitad del flujo.</p>' +
      '<div class="nt-escala">' + tramos.map(function (t) {
        var n = notaDe(t);
        return '<div class="nt-tramo' + (n >= APROBADO ? ' aprueba' : '') + '">' +
          '<b style="color:' + colorNota(n) + '">' + texto(n) + '</b>' +
          '<span>' + t + ' % del flujo</span></div>';
      }).join('') + '</div>';
  }

  function fila(f) {
    var p = f.proyecto;
    var g = f.progreso;
    return '<tr>' +
      '<td><a class="ref" href="#/proyectos/' + p.id + '/flujo">' + R.escapar(p.nombre) + '</a>' +
        '<span class="nt-sub">' + R.escapar(Gestor.metodologia(p.metodologia).nombre) +
        ' · ' + f.equipo + ' en el equipo · ' + f.documentos + ' doc. · ' + f.tareas + ' tareas</span></td>' +
      '<td>' + R.escapar(f.director) + '</td>' +
      '<td>' + g.completados + '/' + g.aplicables +
        (g.omitidos ? ' <span class="nt-sub">(' + g.omitidos + ' omitidos)</span>' : '') + '</td>' +
      '<td class="nt-avance">' + UI.barra(g.porcentaje) + '<span>' + g.porcentaje + ' %</span></td>' +
      '<td><b class="nt-nota" style="color:' + colorNota(f.nota) + '">' + texto(f.nota) + '</b></td>' +
      '<td>' + UI.pastilla(f.aprobado ? 'Aprobado' : 'Reprobado', f.aprobado ? 'ok' : 'falla') + '</td>' +
      '<td><button class="pa-mini nt-borrar" data-g="borrar-proyecto" ' +
        'data-id="' + p.id + '">Eliminar</button></td>' +
      '</tr>';
  }

  return {
    notas: notas,
    notaDe: notaDe,
    calificar: calificar,
    APROBADO: APROBADO
  };
})();
