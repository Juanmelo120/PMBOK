/* ═══════════════════════════════════════════════════════════
   dialogos.js — Confirmaciones, peticiones y avisos
   ───────────────────────────────────────────────────────────
   Sustituye a alert, confirm y prompt del navegador: mismo
   lenguaje visual que el resto, foco gestionado, Escape cierra
   y las acciones destructivas se nombran por lo que borran.
   ═══════════════════════════════════════════════════════════ */

window.Dialogo = (function () {
  'use strict';

  var R = window.Render;
  var capa = null;
  var focoPrevio = null;
  var pilaAvisos = null;

  /* ══════════════ Modal ══════════════ */

  function cerrar() {
    if (!capa) return;
    var c = capa;
    capa = null;
    c.classList.remove('abierto');
    /* Se retira cuando termina la transición de salida */
    setTimeout(function () {
      if (c.parentNode) c.parentNode.removeChild(c);
    }, 160);
    if (focoPrevio && focoPrevio.focus) {
      try { focoPrevio.focus(); } catch (e) {}
    }
    focoPrevio = null;
  }

  function abrir(html, alMontar) {
    if (capa) cerrar();
    focoPrevio = document.activeElement;

    capa = document.createElement('div');
    capa.className = 'd-capa';
    capa.innerHTML = '<div class="d-panel" role="dialog" aria-modal="true">' + html + '</div>';
    document.body.appendChild(capa);

    /* Un fotograma antes de animar, para que la transición arranque */
    requestAnimationFrame(function () {
      if (capa) capa.classList.add('abierto');
    });

    capa.addEventListener('mousedown', function (e) {
      if (e.target === capa) cerrar();
    });

    document.addEventListener('keydown', teclado);
    if (alMontar) alMontar(capa);
    return capa;
  }

  function teclado(e) {
    if (!capa) { document.removeEventListener('keydown', teclado); return; }
    if (e.key === 'Escape') { e.preventDefault(); cerrar(); }
    if (e.key === 'Tab') atraparFoco(e);
  }

  /* El foco no se escapa del diálogo mientras está abierto */
  function atraparFoco(e) {
    var enfocables = capa.querySelectorAll('button, input, select, textarea, a[href]');
    if (!enfocables.length) return;
    var primero = enfocables[0];
    var ultimo = enfocables[enfocables.length - 1];
    if (e.shiftKey && document.activeElement === primero) {
      e.preventDefault(); ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault(); primero.focus();
    }
  }

  function cabecera(opc) {
    return '<div class="d-cab">' +
      (opc.eyebrow ? '<div class="eyebrow">' + R.escapar(opc.eyebrow) + '</div>' : '') +
      '<h2>' + R.escapar(opc.titulo) + '</h2>' +
      (opc.texto ? '<p>' + opc.texto + '</p>' : '') +
      '</div>';
  }

  /* ── Confirmar una acción ─────────────────────────────── */
  /* opc: { titulo, texto, confirmar, cancelar, peligro } */
  function confirmar(opc, alAceptar) {
    var html = cabecera(opc) +
      '<div class="d-pie">' +
        '<button class="btn" data-d="cancelar">' + R.escapar(opc.cancelar || 'Cancelar') + '</button>' +
        '<button class="btn ' + (opc.peligro ? 'peligro' : 'primario') + '" data-d="aceptar">' +
        R.escapar(opc.confirmar || 'Continuar') + '</button>' +
      '</div>';

    abrir(html, function (c) {
      c.querySelector('[data-d="cancelar"]').addEventListener('click', cerrar);
      var aceptar = c.querySelector('[data-d="aceptar"]');
      aceptar.addEventListener('click', function () {
        cerrar();
        if (alAceptar) alAceptar();
      });
      aceptar.focus();
    });
  }

  /* ── Pedir uno o varios valores ───────────────────────── */
  /* opc: { titulo, texto, campos: [{id, etiqueta, valor, tipo, filas, ayuda}], confirmar } */
  function pedir(opc, alAceptar) {
    var campos = (opc.campos || []).map(function (c) {
      if (c.tipo === 'area') {
        return UI.area('d-' + c.id, c.etiqueta, c.valor || '', { filas: c.filas || 3, ayuda: c.ayuda });
      }
      return UI.texto('d-' + c.id, c.etiqueta, c.valor || '',
        { tipo: c.tipo || 'text', ayuda: c.ayuda, placeholder: c.placeholder });
    }).join('');

    var html = cabecera(opc) + '<div class="d-cuerpo">' + campos + '</div>' +
      '<div class="d-pie">' +
        '<button class="btn" data-d="cancelar">Cancelar</button>' +
        '<button class="btn primario" data-d="aceptar">' + R.escapar(opc.confirmar || 'Guardar') + '</button>' +
      '</div>';

    abrir(html, function (c) {
      function aceptar() {
        var salida = {};
        (opc.campos || []).forEach(function (campo) {
          var e = document.getElementById('d-' + campo.id);
          salida[campo.id] = e ? e.value : '';
        });
        cerrar();
        if (alAceptar) alAceptar(salida);
      }
      c.querySelector('[data-d="cancelar"]').addEventListener('click', cerrar);
      c.querySelector('[data-d="aceptar"]').addEventListener('click', aceptar);
      c.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); aceptar(); }
      });
      var primero = c.querySelector('input, textarea');
      if (primero) { primero.focus(); primero.select && primero.select(); }
    });
  }

  /* ── Mostrar información ──────────────────────────────── */
  function informar(opc) {
    var html = cabecera(opc) +
      '<div class="d-pie"><button class="btn primario" data-d="aceptar">Entendido</button></div>';
    abrir(html, function (c) {
      var b = c.querySelector('[data-d="aceptar"]');
      b.addEventListener('click', cerrar);
      b.focus();
    });
  }

  /* ══════════════ Avisos efímeros ══════════════ */

  function pila() {
    if (!pilaAvisos || !pilaAvisos.parentNode) {
      pilaAvisos = document.createElement('div');
      pilaAvisos.className = 'd-avisos';
      pilaAvisos.setAttribute('role', 'status');
      pilaAvisos.setAttribute('aria-live', 'polite');
      document.body.appendChild(pilaAvisos);
    }
    return pilaAvisos;
  }

  /* tipo: ok | aviso | error */
  function avisar(texto, tipo, accion) {
    var caja = document.createElement('div');
    caja.className = 'd-aviso ' + (tipo || 'ok');
    caja.innerHTML = '<span class="d-aviso-marca">' +
      (tipo === 'error' ? '×' : tipo === 'aviso' ? '!' : '✓') + '</span>' +
      '<span class="d-aviso-texto">' + R.escapar(texto) + '</span>' +
      (accion ? '<button class="d-aviso-accion">' + R.escapar(accion.etiqueta) + '</button>' : '');

    pila().appendChild(caja);
    requestAnimationFrame(function () { caja.classList.add('visible'); });

    var temporizador = setTimeout(quitar, tipo === 'error' ? 6000 : 3600);

    function quitar() {
      clearTimeout(temporizador);
      caja.classList.remove('visible');
      setTimeout(function () { if (caja.parentNode) caja.parentNode.removeChild(caja); }, 220);
    }

    caja.addEventListener('click', quitar);
    if (accion) {
      caja.querySelector('.d-aviso-accion').addEventListener('click', function (e) {
        e.stopPropagation();
        quitar();
        accion.hacer();
      });
    }
    return quitar;
  }

  return {
    confirmar: confirmar,
    pedir: pedir,
    informar: informar,
    avisar: avisar,
    cerrar: cerrar
  };
})();
