/* ═══════════════════════════════════════════════════════════
   obra/trabajo.js — El trabajo del equipo: sprints o tablero
   ───────────────────────────────────────────────────────────
   Sprint activo, backlog, ceremonias y métricas ágiles cuando el
   proyecto es iterativo; tablero con límite de WIP cuando es continuo.
   ═══════════════════════════════════════════════════════════ */

window.ObraTrabajo = (function () {
  'use strict';

  var R = window.Render;

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
      '<div><b>Product Owner:</b> ' + R.escapar(quienTieneElRol(p, 'po') || '—') + ' — prioriza el backlog</div>' +
      '<div><b>Scrum Master:</b> ' + R.escapar(quienTieneElRol(p, 'sm') || '—') + ' — remueve impedimentos</div>' +
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

    var pestanas = [['backlog', 'trabajo', 'Sprint backlog'], ['ceremonias', 'agil', 'Ceremonias'], ['metricas', 'tendencia', 'Métricas']]
      .map(function (x) {
        return '<a class="g-pestana-mini' + (x[0] === sub ? ' activa' : '') + '" ' +
          'href="#/proyectos/' + p.id + '/trabajo/' + x[0] + '">' + Iconos.svg(x[1]) + x[2] + '</a>';
      }).join('');

    var cuerpo =
      sub === 'ceremonias' ? ceremonias(p, sprint) :
      sub === 'metricas' ? metricasAgiles(p, sprint, delSprint) :
      tableroTareas(p, delSprint, backlog, sprint);

    return '<div class="g-trabajo-cab">' + cabezaSprint + roles + dod + '</div>' +
      '<div class="g-pestanas-mini">' + pestanas + '</div>' + cuerpo;
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
        UI.cifra(comprometido, 'Puntos comprometidos', null, 'objetivo') +
        UI.cifra(hechos, 'Puntos entregados', null, 'check-circulo') +
        UI.cifra(restante, 'Puntos restantes', null, 'reloj') +
        UI.cifra(media === null ? '—' : media, 'Velocidad media', null, 'indicador') +
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

  /* Quién ocupa un rol del equipo (Product Owner, Scrum Master…) */
  function quienTieneElRol(p, rol) {
    var m = Gestor.lista('miembros', { proyectoId: p.id }).filter(function (x) { return x.rol === rol; })[0];
    if (!m) return null;
    var u = Gestor.uno('usuarios', m.usuarioId);
    return u ? u.nombre : null;
  }

  return { tab: tabTrabajo };
})();
