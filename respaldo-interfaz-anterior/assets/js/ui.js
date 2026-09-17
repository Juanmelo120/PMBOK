/* ═══════════════════════════════════════════════════════════
   ui.js — Piezas de interfaz compartidas por el gestor
   Formularios, tablas editables, medidores y diálogos, en el
   mismo lenguaje visual que el resto de la aplicación.
   ═══════════════════════════════════════════════════════════ */

window.UI = (function () {
  'use strict';

  var R = window.Render;

  /* ══════════════ Formularios ══════════════ */

  function etiqueta(para, texto, ayuda) {
    return '<label class="g-etiqueta" for="' + para + '">' + R.escapar(texto) +
      (ayuda ? '<span>' + R.escapar(ayuda) + '</span>' : '') + '</label>';
  }

  function texto(id, et, valor, opc) {
    opc = opc || {};
    return '<div class="g-campo">' + etiqueta(id, et, opc.ayuda) +
      '<input type="' + (opc.tipo || 'text') + '" id="' + id + '" value="' + R.escapar(valor == null ? '' : valor) + '"' +
      (opc.placeholder ? ' placeholder="' + R.escapar(opc.placeholder) + '"' : '') +
      (opc.min !== undefined ? ' min="' + opc.min + '"' : '') +
      (opc.max !== undefined ? ' max="' + opc.max + '"' : '') +
      (opc.paso ? ' step="' + opc.paso + '"' : '') +
      (opc.requerido ? ' required' : '') + '></div>';
  }

  function area(id, et, valor, opc) {
    opc = opc || {};
    return '<div class="g-campo">' + etiqueta(id, et, opc.ayuda) +
      '<textarea id="' + id + '" rows="' + (opc.filas || 3) + '"' +
      (opc.placeholder ? ' placeholder="' + R.escapar(opc.placeholder) + '"' : '') + '>' +
      R.escapar(valor == null ? '' : valor) + '</textarea></div>';
  }

  function selector(id, et, opciones, valor, opc) {
    opc = opc || {};
    var html = opciones.map(function (o) {
      var v = o.id === undefined ? o.valor : o.id;
      return '<option value="' + R.escapar(v) + '"' + (String(v) === String(valor) ? ' selected' : '') + '>' +
        R.escapar(o.nombre || o.etiqueta || v) + '</option>';
    }).join('');
    return '<div class="g-campo">' + etiqueta(id, et, opc.ayuda) +
      '<select id="' + id + '">' + html + '</select></div>';
  }

  function fila(campos) {
    return '<div class="g-fila">' + campos.join('') + '</div>';
  }

  /* ══════════════ Tarjetas de opción (radio visual) ══════════════ */

  function opciones(nombre, lista, valor) {
    return '<div class="g-opciones" data-opciones="' + nombre + '">' + lista.map(function (o) {
      return '<button type="button" class="g-opcion' + (o.id === valor ? ' activa' : '') + '" ' +
        'data-opcion="' + nombre + '" data-valor="' + R.escapar(o.id) + '">' +
        (o.icono ? '<span class="g-opcion-icono">' + o.icono + '</span>' : '') +
        '<span class="g-opcion-nombre">' + R.escapar(o.nombre) + '</span>' +
        (o.lema ? '<span class="g-opcion-lema">' + R.escapar(o.lema) + '</span>' : '') +
        '</button>';
    }).join('') + '<input type="hidden" id="val-' + nombre + '" value="' + R.escapar(valor || '') + '"></div>';
  }

  /* ══════════════ Medidores ══════════════ */

  function anillo(pct, color, tamano) {
    var c = color || 'var(--acento)';
    return '<div class="pa-dial ' + (tamano || '') + '" style="--v:' + Math.round(pct) + ';--c:' + c + '">' +
      '<div class="pa-dial-centro"><b>' + Math.round(pct) + '</b><span>%</span></div></div>';
  }

  function barra(pct, color) {
    var f = Math.max(0, Math.min(100, Number(pct) || 0)) / 100;
    return '<div class="pa-barra" role="presentation"><i style="transform:scaleX(' + f.toFixed(3) + ');background:' +
      (color || 'var(--acento)') + '"></i></div>';
  }

  function colorPorcentaje(p) {
    return p >= 75 ? 'var(--acento)' : p >= 40 ? 'var(--ambar)' : 'var(--rojo)';
  }

  function cifra(valor, etiquetaTexto, color) {
    return '<div class="cifra"><b' + (color ? ' style="color:' + color + '"' : '') + '>' + valor + '</b>' +
      '<span>' + R.escapar(etiquetaTexto) + '</span></div>';
  }

  /* ══════════════ Tabla editable ══════════════ */

  /* filas: array de arrays. Se edita en el sitio y se emite
     el evento de guardado con data-tabla. */
  function tablaEditable(id, columnas, filas, opc) {
    opc = opc || {};
    var cuerpo = (filas && filas.length ? filas : [columnas.map(function () { return ''; })])
      .map(function (f, i) {
        return '<tr data-fila="' + i + '">' + columnas.map(function (c, j) {
          return '<td><div class="g-celda" contenteditable="true" data-f="' + i + '" data-c="' + j + '">' +
            R.escapar(f[j] == null ? '' : f[j]) + '</div></td>';
        }).join('') +
        '<td class="g-quitar"><button type="button" class="g-mini-x" data-quitar-fila="' + i + '" ' +
        'aria-label="Quitar fila">×</button></td></tr>';
      }).join('');

    return '<div class="g-tabla-editable" data-tabla="' + id + '">' +
      '<div class="envoltura-tabla"><table class="pa-tabla">' +
      '<thead><tr>' + columnas.map(function (c) { return '<th>' + R.escapar(c) + '</th>'; }).join('') +
      '<th></th></tr></thead><tbody>' + cuerpo + '</tbody></table></div>' +
      '<div class="tarjeta-pie"><button type="button" class="btn" data-agregar-fila="' + id + '">+ Agregar fila</button>' +
      (opc.pie ? '<span class="pa-aviso-inline">' + opc.pie + '</span>' : '') + '</div></div>';
  }

  /* Lee una tabla editable del DOM */
  function leerTabla(id) {
    var caja = document.querySelector('[data-tabla="' + id + '"]');
    if (!caja) return [];
    var filas = [];
    var trs = caja.querySelectorAll('tbody tr');
    for (var i = 0; i < trs.length; i++) {
      var celdas = trs[i].querySelectorAll('.g-celda');
      var f = [];
      for (var j = 0; j < celdas.length; j++) f.push(celdas[j].textContent.trim());
      if (f.some(function (c) { return c; })) filas.push(f);
    }
    return filas;
  }

  /* ══════════════ Otros ══════════════ */

  function vacio(glifo, titulo, texto, accion) {
    return '<div class="vacio"><div class="glifo">' + glifo + '</div>' +
      '<h3 style="margin:0 0 6px;font-family:var(--serif);font-size:19px">' + R.escapar(titulo) + '</h3>' +
      '<p>' + texto + '</p>' + (accion || '') + '</div>';
  }

  function pastilla(texto, clase) {
    return '<span class="pa-pastilla ' + (clase || '') + '">' + R.escapar(texto) + '</span>';
  }

  function fecha(valor, conHora) {
    if (!valor) return '—';
    var d = typeof valor === 'number' ? new Date(valor) : new Date(String(valor) + (String(valor).length === 10 ? 'T12:00:00' : ''));
    if (isNaN(d.getTime())) return String(valor);
    var f = d.toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric' });
    return conHora ? f + ' · ' + d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : f;
  }

  function hoyISO() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function dinero(n, moneda) {
    if (n === null || n === undefined || n === '') return '—';
    var v = Number(n);
    if (isNaN(v)) return String(n);
    /* es-CO agrupa también los miles de cuatro cifras (9.000), así una columna se lee alineada */
    return v.toLocaleString('es-CO', { maximumFractionDigits: 0 }) + ' ' + (moneda || 'USD');
  }

  function iniciales(nombre) {
    return String(nombre || '?').trim().split(/\s+/).slice(0, 2)
      .map(function (p) { return p.charAt(0).toUpperCase(); }).join('');
  }

  function avatar(nombre, clase) {
    return '<span class="g-avatar ' + (clase || '') + '">' + R.escapar(iniciales(nombre)) + '</span>';
  }

  function valorDe(id) {
    var e = document.getElementById(id);
    return e ? e.value : '';
  }

  return {
    etiqueta: etiqueta, texto: texto, area: area, selector: selector, fila: fila,
    opciones: opciones, anillo: anillo, barra: barra, colorPorcentaje: colorPorcentaje,
    cifra: cifra, tablaEditable: tablaEditable, leerTabla: leerTabla,
    vacio: vacio, pastilla: pastilla, fecha: fecha, hoyISO: hoyISO, dinero: dinero,
    iniciales: iniciales, avatar: avatar, valorDe: valorDe
  };
})();
