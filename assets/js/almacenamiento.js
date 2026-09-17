/* ═══════════════════════════════════════════════════════════
   almacenamiento.js — Preferencias del navegador
   ───────────────────────────────────────────────────────────
   Solo lo que no pertenece a ningún proyecto: el tema visual.
   Los datos de trabajo viven en gestor.js.
   ═══════════════════════════════════════════════════════════ */

window.Almacen = (function () {
  'use strict';

  var PREFIJO = 'pmbok8.';

  function leer(clave, porDefecto) {
    try {
      var crudo = localStorage.getItem(PREFIJO + clave);
      return crudo === null ? porDefecto : JSON.parse(crudo);
    } catch (e) {
      return porDefecto;
    }
  }

  function escribir(clave, valor) {
    try {
      localStorage.setItem(PREFIJO + clave, JSON.stringify(valor));
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ── Tema visual ──────────────────────────────────────── */
  function fijarTema(t) {
    escribir('tema', t);
    document.documentElement.setAttribute('data-tema', t);
  }

  function alternarTema() {
    var actual = document.documentElement.getAttribute('data-tema');
    fijarTema(actual === 'oscuro' ? 'claro' : 'oscuro');
  }

  function aplicarTemaInicial() {
    var guardado = leer('tema', null);
    if (guardado) {
      document.documentElement.setAttribute('data-tema', guardado);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-tema', 'oscuro');
    } else {
      document.documentElement.setAttribute('data-tema', 'claro');
    }
  }

  return {
    aplicarTemaInicial: aplicarTemaInicial,
    alternarTema: alternarTema,
    fijarTema: fijarTema
  };
})();

/* Aplicar el tema antes del primer pintado para evitar destello */
window.Almacen.aplicarTemaInicial();
