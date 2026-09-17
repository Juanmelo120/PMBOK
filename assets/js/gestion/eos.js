/* ═══════════════════════════════════════════════════════════
   gestion/eos.js — La capa de gerencia EOS
   ───────────────────────────────────────────────────────────
   Rocas del trimestre, scorecard semanal, visión y organigrama de
   responsabilidades.
   ═══════════════════════════════════════════════════════════ */

window.GestionEos = (function () {
  'use strict';

  var R = window.Render;

  /* ══════════════ EOS ══════════════ */

  function eos(seccion) {
    seccion = seccion || 'rocas';
    var pestanas = PMBOK.eos.secciones.map(function (s) {
      return '<a class="g-pestana' + (s.id === seccion ? ' activa' : '') + '" href="#/eos/' + s.id + '">' +
        '<span class="g-pestana-icono">' + (Iconos.resolver(s.id) || s.icono) + '</span>' +
        '<span><b>' + R.escapar(s.nombre) + '</b><em>' + R.escapar(s.lema) + '</em></span></a>';
    }).join('');

    var gestiona = Gestor.puedeGestionar();
    var cuerpo =
      seccion === 'scorecard' ? eosScorecard(gestiona) :
      seccion === 'vto' ? eosVto(gestiona) :
      seccion === 'organigrama' ? eosOrganigrama(gestiona) : eosRocas(gestiona);

    return '<div class="hoja-ancha prosa' + (gestiona ? '' : ' g-solo-lectura') + '">' +
      '<div class="eyebrow">Sistema operativo empresarial</div>' +
      '<h1 class="titulo-pagina">Gerencia general (EOS)</h1>' +
      '<p class="bajada">' + PMBOK.eos.intro + '</p>' +
      (gestiona ? '' : '<div class="nota"><div class="nota-titulo">Solo lectura</div>' +
        'La gerencia la editan directores y administradores.</div>') +
      '<div class="g-pestanas-eos">' + pestanas + '</div>' +
      cuerpo +
      '</div>';
  }

  function trimestreActual() {
    var d = new Date();
    return 'Q' + (Math.floor(d.getMonth() / 3) + 1) + '-' + d.getFullYear();
  }

  function eosRocas(gestiona) {
    var trimestre = VistasGestor.trimestreElegido || trimestreActual();
    var rocas = Gestor.rocasDe(trimestre);

    var selector = '<div class="g-trimestres">' + PMBOK.trimestres.map(function (t) {
      return '<button class="g-trimestre' + (t === trimestre ? ' activo' : '') + '" data-g="trimestre" data-valor="' + t + '">' +
        t + '</button>';
    }).join('') + (gestiona ? '<button class="btn primario" data-g="abrir-nueva-roca" style="margin-left:auto">' + Iconos.svg('mas') + ' Nueva roca</button>' : '') + '</div>';

    var formulario = '<div id="g-nueva-roca" hidden><div class="pa-panel">' +
      UI.texto('nr-titulo', 'Título de la roca', '', { placeholder: 'Ej.: Reducir el costo administrativo por empleado un 25 %' }) +
      UI.area('nr-descripcion', 'Por qué importa', '', { filas: 2 }) +
      UI.fila([
        UI.selector('nr-responsable', 'Responsable', Gestor.lista('usuarios').map(function (u) {
          return { id: u.id, nombre: u.nombre }; }), (Gestor.usuarioActual() || {}).id),
        UI.selector('nr-estado', 'Estado', PMBOK.eos.estadosRoca, 'encamino')
      ]) +
      UI.area('nr-metas', 'Metas medibles', '', { filas: 3, ayuda: 'Una por línea. De una a tres.' }) +
      '<div class="tarjeta-pie"><button class="btn primario" data-g="crear-roca">Crear roca</button>' +
      '<button class="btn" data-g="cerrar-nueva-roca">Cancelar</button></div></div></div>';

    var cuerpo = rocas.length
      ? '<div class="g-rocas">' + rocas.map(function (r) {
          var resp = r.responsableId ? Gestor.uno('usuarios', r.responsableId) : null;
          var est = PMBOK.eos.estadosRoca.filter(function (e) { return e.id === r.estado; })[0] || PMBOK.eos.estadosRoca[0];
          var metas = (r.metas || []);
          var hechas = metas.filter(function (m) { return m.hecho; }).length;
          var vinculados = Gestor.lista('proyectos').filter(function (p) { return p.rocaId === r.id; });
          return '<div class="g-roca">' +
            '<div class="g-roca-cab">' +
              '<h3>' + R.escapar(r.titulo) + '</h3>' +
              UI.pastilla(est.nombre, est.color) +
              (gestiona ? '<button class="g-mini-x" data-g="borrar-roca" data-id="' + r.id + '" title="Eliminar">×</button>' : '') +
            '</div>' +
            (r.descripcion ? '<p>' + R.escapar(r.descripcion) + '</p>' : '') +
            (metas.length
              ? '<ul class="g-metas">' + metas.map(function (m, i) {
                  return '<li><button class="pa-check' + (m.hecho ? ' activo' : '') + '" data-g="meta-roca" ' +
                    'data-id="' + r.id + '" data-i="' + i + '"' + (gestiona ? '' : ' disabled') + '>✓</button>' + R.escapar(m.texto) + '</li>';
                }).join('') + '</ul>'
              : '') +
            '<div class="g-roca-pie">' +
              '<span>' + UI.avatar(resp ? resp.nombre : '?') + R.escapar(resp ? resp.nombre : 'sin responsable') + '</span>' +
              '<span>' + hechas + '/' + metas.length + ' metas</span>' +
              '<span>' + vinculados.length + ' proyecto' + (vinculados.length === 1 ? '' : 's') + ' vinculado' +
                (vinculados.length === 1 ? '' : 's') + '</span>' +
              '<select class="g-mover" data-estado-roca="' + r.id + '"' + (gestiona ? '' : ' disabled') + '>' +
                PMBOK.eos.estadosRoca.map(function (e) {
                  return '<option value="' + e.id + '"' + (e.id === r.estado ? ' selected' : '') + '>' + e.nombre + '</option>';
                }).join('') + '</select>' +
            '</div></div>';
        }).join('') + '</div>'
      : UI.vacio('🪨', 'Sin rocas para ' + trimestre,
          'Define el objetivo trimestral más importante. De él se desprenden los portafolios y proyectos.');

    return selector + (gestiona ? formulario : '') +
      '<div class="nota"><div class="nota-titulo">Cómo se usa</div>' + PMBOK.eos.ayudaRocas + '</div>' + cuerpo;
  }

  function eosScorecard(gestiona) {
    var metricas = Gestor.lista('metricas');
    var semanas = ultimasSemanas(13);

    var formulario = '<div id="g-nueva-metrica" hidden><div class="pa-panel">' +
      UI.fila([
        UI.texto('nm-nombre', 'Métrica', '', { placeholder: 'Ej.: Quejas de clientes' }),
        UI.texto('nm-meta', 'Meta', '', { placeholder: 'Ej.: ≤ 3' }),
        UI.selector('nm-responsable', 'Responsable', Gestor.lista('usuarios').map(function (u) {
          return { id: u.id, nombre: u.nombre }; }), (Gestor.usuarioActual() || {}).id)
      ]) +
      UI.selector('nm-direccion', 'Dirección deseada',
        [{ id: 'menor', nombre: 'Cuanto menor, mejor' }, { id: 'mayor', nombre: 'Cuanto mayor, mejor' }], 'mayor') +
      '<div class="tarjeta-pie"><button class="btn primario" data-g="crear-metrica">Añadir métrica</button>' +
      '<button class="btn" data-g="cerrar-nueva-metrica">Cancelar</button></div></div></div>';

    var tabla = metricas.length
      ? '<div class="envoltura-tabla"><table class="pa-tabla g-scorecard"><thead><tr>' +
        '<th>Métrica</th><th>Meta</th><th>Responsable</th>' +
        semanas.map(function (s) { return '<th title="' + s.iso + '">' + s.etiqueta + '</th>'; }).join('') +
        '<th></th></tr></thead><tbody>' +
        metricas.map(function (m) {
          var resp = m.responsableId ? Gestor.uno('usuarios', m.responsableId) : null;
          return '<tr>' +
            '<td><b>' + R.escapar(m.nombre) + '</b></td>' +
            '<td>' + R.escapar(m.meta || '—') + '</td>' +
            '<td>' + R.escapar(resp ? resp.nombre.split(' ')[0] : '—') + '</td>' +
            semanas.map(function (s) {
              var v = (m.valores || {})[s.iso];
              var clase = estadoMetrica(m, v);
              return '<td class="g-celda-metrica ' + clase + '">' +
                '<input class="g-num" data-metrica="' + m.id + '" data-semana="' + s.iso + '" ' +
                'value="' + R.escapar(v == null ? '' : v) + '" inputmode="decimal"' + (gestiona ? '' : ' readonly') + '></td>';
            }).join('') +
            '<td>' + (gestiona ? '<button class="g-mini-x" data-g="borrar-metrica" data-id="' + m.id + '">×</button>' : '') + '</td>' +
            '</tr>';
        }).join('') + '</tbody></table></div>'
      : UI.vacio('📊', 'Sin métricas definidas',
          'Añade entre 5 y 15 números de la operación que se midan cada semana.');

    return (gestiona ? '<div class="g-trimestres"><button class="btn primario" data-g="abrir-nueva-metrica">' + Iconos.svg('mas') + ' Nueva métrica</button></div>' +
      formulario : '') +
      '<div class="nota"><div class="nota-titulo">Cómo se usa</div>' + PMBOK.eos.ayudaScorecard + '</div>' +
      tabla;
  }

  function estadoMetrica(m, valor) {
    if (valor === undefined || valor === null || valor === '') return '';
    var meta = parseFloat(String(m.meta || '').replace(/[^\d.,-]/g, '').replace(',', '.'));
    var v = parseFloat(String(valor).replace(',', '.'));
    if (isNaN(meta) || isNaN(v)) return '';
    var bien = m.direccion === 'menor' ? v <= meta : v >= meta;
    return bien ? 'verde' : 'rojo';
  }

  function ultimasSemanas(n) {
    var salida = [];
    var d = new Date();
    d.setDate(d.getDate() - (d.getDay() + 6) % 7);   // lunes de esta semana
    for (var i = n - 1; i >= 0; i--) {
      var x = new Date(d.getTime() - i * 7 * 86400000);
      var iso = x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
      salida.push({ iso: iso, etiqueta: String(x.getDate()) + '/' + (x.getMonth() + 1) });
    }
    return salida;
  }

  function eosVto(gestiona) {
    function bloque(b) {
      var valor = Gestor.vto(b.id);
      return '<div class="g-vto-bloque' + (valor ? ' lleno' : '') + '">' +
        '<div class="g-vto-cab"><b>' + R.escapar(b.nombre) + '</b>' +
          UI.pastilla(valor ? 'Definido' : 'Sin llenar', valor ? 'ok' : '') + '</div>' +
        '<p class="g-vto-ayuda">' + R.escapar(b.ayuda) + '</p>' +
        '<textarea class="g-vto-texto" data-vto="' + b.id + '" rows="3" ' + (gestiona ? '' : 'readonly ') +
        'placeholder="' + (gestiona ? 'Escribe aquí…' : 'Sin llenar') + '">' + R.escapar(valor) + '</textarea>' +
        '</div>';
    }
    var vision = PMBOK.eos.vto.filter(function (b) { return b.lado === 'vision'; });
    var traccion = PMBOK.eos.vto.filter(function (b) { return b.lado === 'traccion'; });

    return '<div class="nota"><div class="nota-titulo">Cómo se usa</div>' + PMBOK.eos.ayudaVto + '</div>' +
      '<h2>Visión</h2><div class="g-vto">' + vision.map(bloque).join('') + '</div>' +
      '<h2>Tracción</h2><div class="g-vto">' + traccion.map(bloque).join('') + '</div>';
  }

  function eosOrganigrama(gestiona) {
    function rama(padreId, nivel) {
      var hijos = Gestor.asientosHijos(padreId);
      if (!hijos.length) return '';
      return '<ul class="g-organigrama' + (nivel ? ' hijo' : '') + '">' + hijos.map(function (a) {
        var persona = a.personaId ? Gestor.uno('usuarios', a.personaId) : null;
        return '<li>' +
          '<div class="g-asiento">' +
            '<div class="g-asiento-cab"><b>' + R.escapar(a.nombre) + '</b>' +
              (gestiona ? '<button class="g-mini-x" data-g="borrar-asiento" data-id="' + a.id + '">×</button>' : '') + '</div>' +
            (a.gwt ? '<div class="g-asiento-gwt">' + R.escapar(a.gwt) + '</div>' : '') +
            '<div class="g-asiento-persona">' + UI.avatar(persona ? persona.nombre : '—') +
              R.escapar(persona ? persona.nombre : 'asiento vacante') + '</div>' +
            (gestiona ? '<button class="pa-mini" data-g="abrir-asiento" data-padre="' + a.id + '">+ asiento debajo</button>' : '') +
          '</div>' + rama(a.id, nivel + 1) + '</li>';
      }).join('') + '</ul>';
    }

    var raiz = Gestor.asientosHijos(null);
    return '<div class="nota"><div class="nota-titulo">Cómo se usa</div>' + PMBOK.eos.ayudaOrganigrama + '</div>' +
      (gestiona ? '<div class="g-trimestres"><button class="btn primario" data-g="abrir-asiento" data-padre="">' + Iconos.svg('mas') + ' Nuevo asiento raíz</button></div>' : '') +
      '<div id="g-nuevo-asiento" hidden><div class="pa-panel">' +
        UI.texto('na-nombre', 'Nombre del asiento', '', { placeholder: 'Ej.: Integrador / Director de operaciones' }) +
        UI.area('na-gwt', 'Qué hace (5-10 palabras)', '', { filas: 2, ayuda: 'Get it, Want it, Capacity to do it.' }) +
        UI.selector('na-persona', 'Persona', [{ id: '', nombre: '— Vacante —' }].concat(
          Gestor.lista('usuarios').map(function (u) { return { id: u.id, nombre: u.nombre }; })), '') +
        '<input type="hidden" id="na-padre" value="">' +
        '<div class="tarjeta-pie"><button class="btn primario" data-g="crear-asiento">Crear asiento</button>' +
        '<button class="btn" data-g="cerrar-asiento">Cancelar</button></div></div></div>' +
      (raiz.length ? rama(null, 0) : UI.vacio('🗂️', 'Organigrama vacío',
        'Empieza por el asiento de dirección y desciende. Primero la estructura, después las personas.'));
  }

  return { eos: eos, trimestreActual: trimestreActual };
})();
