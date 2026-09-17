/* ═══════════════════════════════════════════════════════════
   obra/dominios.js — Riesgos, interesados, cambios y lecciones
   ───────────────────────────────────────────────────────────
   Los cuatro registros de los dominios de desempeño, con la matriz
   de probabilidad × impacto y la de poder × influencia.
   ═══════════════════════════════════════════════════════════ */

window.ObraDominios = (function () {
  'use strict';

  var R = window.Render;

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
            UI.texto('nr2-p', 'Probabilidad (1-5)', '3', { tipo: 'number', min: 1, max: 5, paso: 1 }),
            UI.texto('nr2-i', 'Impacto (1-5)', '3', { tipo: 'number', min: 1, max: 5, paso: 1 }),
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
            UI.texto('ni-poder', 'Poder (1-5)', '3', { tipo: 'number', min: 1, max: 5, paso: 1 }),
            UI.texto('ni-influencia', 'Influencia (1-5)', '3', { tipo: 'number', min: 1, max: 5, paso: 1 }),
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

  return { tab: tabDominios };
})();
