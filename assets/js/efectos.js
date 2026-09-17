/* ═══════════════════════════════════════════════════════════
   efectos.js — Capa de interacción y movimiento
   ───────────────────────────────────────────────────────────
   Detalles que no cambian lo que la aplicación hace, solo cómo
   se siente:
   · luz que sigue al puntero en las superficies interactivas
   · cifras que cuentan hasta su valor al llegar a una vista
   · indicador de pestaña que se desliza desde la anterior
   · leve inclinación de la muestra en la pantalla de acceso
   · cambio de tema con fundido cruzado
   Todo respeta «reducir movimiento» y los dispositivos táctiles.
   ═══════════════════════════════════════════════════════════ */

window.Efectos = (function () {
  'use strict';

  var reducido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  var punteroFino = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)');

  function sinMovimiento() { return !!(reducido && reducido.matches); }

  /* ══════════════ Luz que sigue al puntero ══════════════ */

  var SUPERFICIES = 'a.tarjeta, .g-proyecto, .cifra, .g-tarjeta-proceso, .g-pestana, .g-opcion, ' +
                    '.pa-sec, .g-documento, .g-ficha-dato, .g-acceso-tarjeta';
  var pendiente = null;
  var ultimoEvento = null;

  function alMoverPuntero(e) {
    ultimoEvento = e;
    if (pendiente) return;
    pendiente = requestAnimationFrame(function () {
      pendiente = null;
      var ev = ultimoEvento;
      var el = ev.target && ev.target.closest ? ev.target.closest(SUPERFICIES) : null;
      if (!el) return;
      var r = el.getBoundingClientRect();
      /* Las variables viven en el propio elemento: no recalculan a nadie más */
      el.style.setProperty('--mx', (ev.clientX - r.left).toFixed(0) + 'px');
      el.style.setProperty('--my', (ev.clientY - r.top).toFixed(0) + 'px');
    });
  }

  /* ══════════════ Cifras que cuentan ══════════════ */

  function contar(raiz) {
    if (sinMovimiento()) return;
    var nodos = raiz.querySelectorAll('[data-contar]');
    if (!nodos.length) return;

    var objetivos = [];
    for (var i = 0; i < nodos.length; i++) {
      var fin = parseInt(nodos[i].getAttribute('data-contar'), 10);
      if (isNaN(fin) || fin <= 0) continue;
      var texto = nodos[i].firstChild && nodos[i].firstChild.nodeType === 3 ? nodos[i].firstChild : null;
      if (!texto) continue;
      objetivos.push({ nodo: texto, fin: fin });
      texto.nodeValue = '0';
    }
    if (!objetivos.length) return;

    var duracion = 900, inicio = null;
    function paso(t) {
      if (inicio === null) inicio = t;
      var p = Math.min(1, (t - inicio - 120) / duracion);
      if (p < 0) p = 0;
      /* ease-out quint: arranca rápido y se posa sobre el valor */
      var k = 1 - Math.pow(1 - p, 5);
      for (var j = 0; j < objetivos.length; j++) {
        objetivos[j].nodo.nodeValue = String(Math.round(objetivos[j].fin * k));
      }
      if (p < 1) requestAnimationFrame(paso);
    }
    requestAnimationFrame(paso);
  }

  /* ══════════════ Indicador de pestañas ══════════════ */

  var pestanaPrevia = null;   /* { grupo, izquierda, ancho } */

  function medirActiva(nav) {
    var activa = nav.querySelector('.activa');
    if (!activa) return null;
    return { izquierda: activa.offsetLeft, ancho: activa.offsetWidth, alto: activa.offsetHeight, arriba: activa.offsetTop };
  }

  function colocar(ind, m) {
    ind.style.width = m.ancho + 'px';
    ind.style.height = m.alto + 'px';
    ind.style.top = m.arriba + 'px';
    ind.style.bottom = 'auto';
    ind.style.transform = 'translateX(' + m.izquierda + 'px)';
  }

  function prepararPestanas(raiz) {
    var nav = raiz.querySelector('.g-pestanas-obra');
    if (!nav) { pestanaPrevia = null; return; }
    var grupo = location.hash.split('/').slice(0, 3).join('/');
    var actual = medirActiva(nav);
    if (!actual) return;

    var ind = document.createElement('span');
    ind.className = 'g-pestanas-indicador';
    ind.setAttribute('aria-hidden', 'true');
    nav.insertBefore(ind, nav.firstChild);
    nav.classList.add('con-indicador');

    var activa = nav.querySelector('.activa');
    if (activa && activa.scrollIntoView && nav.scrollWidth > nav.clientWidth) {
      nav.scrollLeft = Math.max(0, activa.offsetLeft - nav.clientWidth / 2 + activa.offsetWidth / 2);
    }

    var previa = pestanaPrevia && pestanaPrevia.grupo === grupo ? pestanaPrevia : null;
    if (previa && !sinMovimiento() && (previa.izquierda !== actual.izquierda)) {
      /* Arranca donde estaba la pestaña anterior y viaja a la nueva */
      ind.style.transition = 'none';
      colocar(ind, { izquierda: previa.izquierda, ancho: previa.ancho, alto: actual.alto, arriba: actual.arriba });
      void ind.offsetWidth;
      ind.style.transition = 'transform 300ms cubic-bezier(0.77, 0, 0.175, 1), width 300ms cubic-bezier(0.77, 0, 0.175, 1)';
    }
    colocar(ind, actual);
    pestanaPrevia = { grupo: grupo, izquierda: actual.izquierda, ancho: actual.ancho };
  }

  function recolocarPestanas() {
    var nav = document.querySelector('.g-pestanas-obra.con-indicador');
    if (!nav) return;
    var ind = nav.querySelector('.g-pestanas-indicador');
    var m = medirActiva(nav);
    if (!ind || !m) return;
    ind.style.transition = 'none';
    colocar(ind, m);
  }

  /* ══════════════ Muestra inclinable del acceso ══════════════ */

  function prepararAcceso(raiz) {
    var escena = raiz.querySelector('.g-acceso-escena');
    var carta = raiz.querySelector('.g-acceso-muestra .g-proyecto');
    if (!escena || !carta || sinMovimiento() || !(punteroFino && punteroFino.matches)) return;

    var base = 'rotateX(8deg) rotateZ(-2deg)';
    escena.addEventListener('pointermove', function (e) {
      var r = escena.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      /* Decorativo: la transición CSS suaviza y persigue al puntero */
      carta.style.transform = 'rotateX(' + (8 - y * 6).toFixed(2) + 'deg) rotateY(' + (x * 8).toFixed(2) + 'deg) rotateZ(-2deg) translateY(' + (y * -6).toFixed(1) + 'px)';
    });
    escena.addEventListener('pointerleave', function () { carta.style.transform = base; });
  }

  /* ══════════════ Rejilla de fondo ══════════════ */

  /* Una sola rejilla para toda la aplicación: vive fuera de #contenido,
     así que navegar o re-pintar no la destruye y sigue animándose sin saltos.
     El puntero se escucha en .disposicion para que las tarjetas encima
     sigan recibiendo los clics. */
  var rejilla = null;

  function coloresRejilla(contenedor) {
    var estilo = getComputedStyle(contenedor);
    return {
      borde: estilo.getPropertyValue('--rejilla-borde').trim() || '#999',
      relleno: estilo.getPropertyValue('--rejilla-relleno').trim() || '#222'
    };
  }

  function montarRejilla() {
    var contenedor = document.querySelector('.fondo-rejilla');
    var lienzo = contenedor && contenedor.querySelector('.shapegrid-canvas');
    if (!lienzo || !window.ShapeGrid || rejilla) return;

    var c = coloresRejilla(contenedor);
    rejilla = ShapeGrid.crear(lienzo, {
      direction: 'diagonal',
      speed: 0.3,
      squareSize: 40,
      shape: 'square',
      hoverTrailAmount: 5,
      borderColor: c.borde,
      hoverFillColor: c.relleno,
      anfitrion: document.querySelector('.disposicion') || document.body
    });
    rejilla.contenedor = contenedor;
  }

  function recolorearRejilla() {
    if (!rejilla) return;
    var c = coloresRejilla(rejilla.contenedor);
    rejilla.colores(c.borde, c.relleno);
  }

  /* ══════════════ Tema con fundido ══════════════ */

  function alternarTema(accion) {
    if (!document.startViewTransition || sinMovimiento()) { accion(); return; }
    document.startViewTransition(accion);
  }

  /* ══════════════ Enganche con el enrutador ══════════════ */

  /* Se llama tras pintar cada vista. `nueva` indica que la ruta cambió */
  function trasPintar(raiz, nueva) {
    prepararPestanas(raiz);
    if (nueva) {
      contar(raiz);
      prepararAcceso(raiz);
    }
  }

  function iniciar() {
    if (punteroFino && punteroFino.matches) {
      document.addEventListener('pointermove', alMoverPuntero, { passive: true });
    }
    var espera = null;
    window.addEventListener('resize', function () {
      clearTimeout(espera);
      espera = setTimeout(recolocarPestanas, 80);
    });
    montarRejilla();
    /* La rejilla toma sus colores del tema: se repinta al alternarlo */
    if (window.MutationObserver) {
      new MutationObserver(recolorearRejilla)
        .observe(document.documentElement, { attributes: true, attributeFilter: ['data-tema'] });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

  return { trasPintar: trasPintar, alternarTema: alternarTema, contar: contar };
})();
