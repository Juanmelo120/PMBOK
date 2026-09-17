/* ═══════════════════════════════════════════════════════════
   calidad/piezas.js — Piezas compartidas de la calidad del plan
   ───────────────────────────────────────────────────────────
   El dial de puntaje, las barras, las pastillas de estado y la ruta
   bajo la que se muestran estas pantallas, que cambia según se abran
   dentro de un proyecto del gestor o por su cuenta.
   ═══════════════════════════════════════════════════════════ */

window.CalidadPiezas = (function () {
  'use strict';

  var R = window.Render;

  /* Las pantallas de calidad viven dentro de un proyecto del gestor.
     La base dice bajo qué ruta se están mostrando. */
  var base = '#/proyecto';
  function fijarBase(b) { base = b || '#/proyecto'; }

  /* ══════════════ Piezas reutilizables ══════════════ */

  function colorNivel(nivel) {
    return nivel.color === 'ok' ? 'var(--ok)'
         : nivel.color === 'aviso' ? 'var(--ambar)' : 'var(--rojo)';
  }

  function dial(puntaje, nivel, tamano) {
    return UI.anillo(puntaje, colorNivel(nivel), tamano, '/ 100');
  }

  function barra(pct, color) {
    var f = Math.max(0, Math.min(100, Number(pct) || 0)) / 100;
    return '<div class="pa-barra" role="presentation"><i style="transform:scaleX(' + f.toFixed(3) + ');background:' + (color || 'var(--grad-avance)') + '"></i></div>';
  }

  function pastillaEstado(estado) {
    var m = {
      ok: ['Correcto', 'ok'], parcial: ['Parcial', 'aviso'], falta: ['Falta', 'falla'],
      aviso: ['Revisar', 'aviso'], falla: ['Falla', 'falla'], pendiente: ['Pendiente', 'neutro']
    }[estado] || ['—', 'neutro'];
    return '<span class="pa-pastilla ' + m[1] + '">' + m[0] + '</span>';
  }

  function iconoEstado(estado) {
    if (estado === 'ok') return '✓';
    if (estado === 'parcial' || estado === 'aviso') return '!';
    if (estado === 'pendiente') return '·';
    return '×';
  }

  function kpi(etiqueta, valor, pct) {
    var color = pct >= 75 ? 'var(--ok)' : pct >= 45 ? 'var(--ambar)' : 'var(--rojo)';
    return '<div class="pa-kpi"><div class="pa-kpi-et">' + etiqueta + '</div>' +
      '<div class="pa-kpi-val">' + valor + '</div>' + barra(pct, color) + '</div>';
  }

  return {
    ruta: function () { return base; }, fijarBase: fijarBase,
    colorNivel: colorNivel, dial: dial, barra: barra,
    pastillaEstado: pastillaEstado, iconoEstado: iconoEstado, kpi: kpi
  };
})();
