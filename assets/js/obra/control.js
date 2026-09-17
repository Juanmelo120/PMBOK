/* ═══════════════════════════════════════════════════════════
   obra/control.js — Control del proyecto por valor ganado
   ───────────────────────────────────────────────────────────
   CV, SV, CPI, SPI, EAC, ETC, VAC y TCPI, cada indicador con su
   lectura en palabras.
   ═══════════════════════════════════════════════════════════ */

window.ObraControl = (function () {
  'use strict';

  var R = window.Render;

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

  return { tab: tabControl };
})();
