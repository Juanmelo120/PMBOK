/* ═══════════════════════════════════════════════════════════
   vistas-proyecto.js — La calidad del plan: qué hace cada clic
   ───────────────────────────────────────────────────────────
   Carga del documento, edición en vivo de cada campo y botones
   «data-pa». Las tres pantallas viven en calidad/: CalidadPanel,
   CalidadSeccion y CalidadInforme, sobre las piezas comunes de
   CalidadPiezas.
   ═══════════════════════════════════════════════════════════ */

window.VistasProyecto = (function () {
  'use strict';

  var R = window.Render;
  var recargarVista = function () {};

  /* ══════════════ Interacción ══════════════ */

  function conectar(sub, arg, recargar) {
    recargarVista = recargar || function () {};

    conectarCarga();
    conectarAcciones();
    if (sub === 'seccion') conectarEdicion(arg);
  }

  /* — Carga de archivos — */
  function conectarCarga() {
    var input = document.getElementById('pa-archivo');
    if (input) {
      input.addEventListener('change', function () {
        if (input.files && input.files[0]) procesarArchivo(input.files[0]);
      });
    }

    var zona = document.getElementById('pa-soltar');
    if (zona) {
      ['dragenter', 'dragover'].forEach(function (ev) {
        zona.addEventListener(ev, function (e) {
          e.preventDefault(); e.stopPropagation();
          zona.classList.add('activa');
        });
      });
      ['dragleave', 'drop'].forEach(function (ev) {
        zona.addEventListener(ev, function (e) {
          e.preventDefault(); e.stopPropagation();
          zona.classList.remove('activa');
        });
      });
      zona.addEventListener('drop', function (e) {
        var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) procesarArchivo(f);
      });
    }

    var imp = document.getElementById('pa-importar');
    if (imp) {
      imp.addEventListener('change', function () {
        if (imp.files && imp.files[0]) procesarArchivo(imp.files[0]);
      });
    }
  }

  function avisoCarga(texto, clase) {
    var caja = document.getElementById('pa-aviso-carga');
    if (!caja) { if (clase === 'alerta') Dialogo.avisar(texto, 'error'); return; }
    caja.innerHTML = texto
      ? '<div class="nota ' + (clase || '') + '"><div class="nota-titulo">' +
        (clase === 'alerta' ? 'No se pudo cargar' : 'Procesando') + '</div>' + R.escapar(texto) + '</div>'
      : '';
  }

  function procesarArchivo(archivo) {
    avisoCarga('Leyendo ' + archivo.name + '…', '');
    Proyecto.importarArchivo(archivo, function (err) {
      if (err) { avisoCarga(err, 'alerta'); return; }
      recargarVista();
    });
  }

  /* — Botones — */
  function conectarAcciones() {
    var botones = document.querySelectorAll('[data-pa]');
    for (var i = 0; i < botones.length; i++) {
      botones[i].addEventListener('click', manejar);
    }
  }

  /* Cada botón «data-pa» nombra aquí su acción. Cada una recibe el propio
     botón y los atributos «data-s» (sección) y «data-c» (campo). */
  var ACCIONES = {
    'guardar-pegado': guardarPegado,
    'aplicar-sugerencias': aplicarSugerencias,
    'quitar-doc': quitarDocumento,
    'usar-sugerencia': usarSugerencia,
    'ver-ejemplo': verEjemplo,
    'copiar-ejemplo': copiarEjemplo,
    'proceso': alternarProceso,
    'verificar': function () { recargarVista(); },
    'exportar-json': exportarJson,
    'exportar-md': exportarMarkdown,
    'imprimir': function () { window.print(); },
    'reiniciar': reiniciarPlan
  };

  function manejar(e) {
    e.preventDefault();
    var el = e.currentTarget;
    var accion = ACCIONES[el.getAttribute('data-pa')];
    if (accion) accion(el, el.getAttribute('data-s'), el.getAttribute('data-c'));
  }

  function guardarPegado() {
    var area = document.getElementById('pa-texto-pegado');
    if (!area || !area.value.trim()) { avisoCarga('Pega primero el texto del proyecto.', 'alerta'); return; }
    Proyecto.guardarTextoPegado(area.value, 'Texto pegado', function (err) {
      if (err) { avisoCarga(err, 'alerta'); return; }
      recargarVista();
    });
  }

  function aplicarSugerencias() {
    var n = Proyecto.aplicarSugerencias();
    recargarVista();
    Dialogo.avisar(n
      ? n + ' campos rellenados con extractos de tu documento: revísalos'
      : 'No quedaban campos vacíos que rellenar', n ? 'ok' : 'aviso');
  }

  function quitarDocumento() {
    Dialogo.confirmar({
      titulo: 'Quitar el documento cargado',
      texto: 'Lo que ya hayas escrito en las secciones se conserva; solo se pierden las propuestas de extracción.',
      confirmar: 'Quitar documento'
    }, function () {
      Proyecto.borrarDocumento();
      recargarVista();
    });
  }

  function usarSugerencia(el, s, c) {
    var sug = Proyecto.sugerencia(s, c);
    if (!sug) return;
    var campo = document.getElementById('pa-in-' + s + '-' + c);
    if (!campo) return;
    campo.value = sug.texto;
    guardarCampo(campo);
    campo.focus();
  }

  function verEjemplo(el, s, c) {
    var caja = document.getElementById('pa-ej-' + s + '-' + c);
    if (!caja) return;
    caja.hidden = !caja.hidden;
    el.textContent = caja.hidden ? 'Ver ejemplo desarrollado' : 'Ocultar ejemplo';
  }

  function copiarEjemplo(el, s, c) {
    var campoDef = Proyecto.campo(s, c);
    var destino = document.getElementById('pa-in-' + s + '-' + c);
    if (!campoDef || !destino) return;
    var anterior = destino.value;
    destino.value = campoDef.ejemplo;
    guardarCampo(destino);
    destino.focus();
    Dialogo.avisar('Ejemplo copiado: sustitúyelo por tus datos', 'ok', anterior ? {
      etiqueta: 'Deshacer',
      hacer: function () { destino.value = anterior; guardarCampo(destino); }
    } : null);
  }

  function alternarProceso(el) {
    var activo = Proyecto.alternarProceso(el.getAttribute('data-id'));
    el.classList.toggle('activo', activo);
    el.setAttribute('aria-pressed', String(activo));
    el.parentNode.classList.toggle('marcado', activo);
  }

  function exportarJson() {
    descargar('pmbok8-proyecto.json', JSON.stringify(Proyecto.exportarJSON(), null, 2), 'application/json');
  }

  function exportarMarkdown() {
    var ev = Calidad.evaluarProyecto(Proyecto.cargar());
    descargar(nombreArchivo() + '-pmbok8.md', Proyecto.informeMarkdown(ev), 'text/markdown');
  }

  function reiniciarPlan() {
    Dialogo.confirmar({
      titulo: 'Vaciar el plan de calidad',
      texto: 'Se borran el documento cargado, los campos redactados y el historial de puntajes de este proyecto.',
      confirmar: 'Vaciar plan', peligro: true
    }, function () {
      Proyecto.reiniciar();
      recargarVista();
    });
  }

  /* — Edición con guardado y verificación en vivo — */
  var temporizador = null;

  function conectarEdicion(seccionId) {
    var entradas = document.querySelectorAll('.pa-entrada');
    for (var i = 0; i < entradas.length; i++) {
      entradas[i].addEventListener('input', function () {
        var el = this;
        var cont = document.getElementById('pa-cont-' + el.getAttribute('data-s') + '-' + el.getAttribute('data-c'));
        if (cont) cont.textContent = CalidadSeccion.contadorTexto(el.value);
        if (temporizador) clearTimeout(temporizador);
        temporizador = setTimeout(function () { guardarCampo(el); }, 500);
      });
      entradas[i].addEventListener('blur', function () {
        if (temporizador) { clearTimeout(temporizador); temporizador = null; }
        guardarCampo(this);
      });
    }
    ajustarAlturas();
    if (seccionId) actualizarCabeceraSeccion(seccionId);
  }

  /* Nombre de archivo a partir del nombre del proyecto */
  function nombreArchivo() {
    var nombre = Calidad.normalizar(Proyecto.valor('enc', 'nombre') || 'proyecto');
    nombre = nombre.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
    return nombre || 'proyecto';
  }

  function ajustarAlturas() {
    var entradas = document.querySelectorAll('.pa-entrada');
    for (var i = 0; i < entradas.length; i++) {
      var el = entradas[i];
      if (el.value && el.scrollHeight > el.clientHeight) {
        el.style.height = Math.min(560, el.scrollHeight + 4) + 'px';
      }
    }
  }

  function guardarCampo(el) {
    var s = el.getAttribute('data-s');
    var c = el.getAttribute('data-c');
    var texto = el.value;
    if (!Proyecto.fijarValor(s, c, texto)) {
      avisoCarga('No se pudo guardar: el almacenamiento del navegador está lleno.', 'alerta');
    }

    /* El repintado se aplaza un tick: si este blur lo disparó el propio
       reemplazo de la vista, tocar el DOM aquí dentro lo rompería. */
    setTimeout(function () {
      var def = Proyecto.campo(s, c);
      if (!def) return;
      var ev = Calidad.evaluarCampo(def, texto);
      var caja = document.getElementById('pa-cr-' + s + '-' + c);
      if (caja) caja.innerHTML = CalidadSeccion.criteriosHTML(ev);

      var cont = document.getElementById('pa-cont-' + s + '-' + c);
      if (cont) cont.textContent = CalidadSeccion.contadorTexto(texto);

      actualizarCabeceraSeccion(s);
    }, 0);
  }

  function actualizarCabeceraSeccion(seccionId) {
    var sec = Proyecto.seccion(seccionId);
    if (!sec) return;
    var p = Proyecto.cargar();
    var e = Calidad.evaluarSeccion(sec, (p.campos || {})[sec.id], p.procesos);

    var cajaDial = document.getElementById('pa-dial-seccion');
    if (cajaDial) cajaDial.innerHTML = CalidadPiezas.dial(e.puntaje, e.nivel);

    var nivel = document.getElementById('pa-nivel-seccion');
    if (nivel) {
      nivel.textContent = e.nivel.etiqueta;
      nivel.style.color = CalidadPiezas.colorNivel(e.nivel);
    }

    var comp = document.getElementById('pa-completitud-seccion');
    if (comp) comp.textContent = e.camposLlenos + ' de ' + e.camposTotal + ' campos redactados';

    var retro = document.getElementById('pa-retro');
    if (retro) retro.innerHTML = CalidadSeccion.retroHTML(Calidad.retroalimentacion(e), e);
  }

  /* — Descarga de archivos — */
  function descargar(nombre, contenido, tipo) {
    try {
      var blob = new Blob([contenido], { type: tipo + ';charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = nombre;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    } catch (e) {
      var w = window.open('', '_blank');
      if (w) w.document.write('<pre>' + R.escapar(contenido) + '</pre>');
    }
  }

  /* La pestaña del proyecto pide estas pantallas por aquí */
  return {
    fijarBase: CalidadPiezas.fijarBase,
    bloqueCarga: CalidadPanel.bloqueCarga,
    panel: CalidadPanel.panel,
    seccion: CalidadSeccion.seccion,
    informe: CalidadInforme.informe,
    conectar: conectar
  };
})();
