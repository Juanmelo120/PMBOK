/* ═══════════════════════════════════════════════════════════
   render.js — Funciones de construcción de HTML reutilizables
   ═══════════════════════════════════════════════════════════ */

window.Render = (function () {
  'use strict';

  /* ── Formato en línea: **negrita**, *cursiva*, `código` ── */
  function enLinea(txt) {
    return String(txt == null ? '' : txt)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[\s(])\*([^*]+)\*(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>');
  }

  function escapar(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── Bloques de contenido ─────────────────────────────── */
  function bloque(b) {
    if (!b) return '';
    switch (b.t) {
      case 'p':
        return '<p>' + enLinea(b.x) + '</p>';
      case 'h3':
        return '<h3>' + enLinea(b.x) + '</h3>';
      case 'ul':
        return '<ul>' + (b.x || []).map(function (i) { return '<li>' + enLinea(i) + '</li>'; }).join('') + '</ul>';
      case 'ol':
        return '<ol>' + (b.x || []).map(function (i) { return '<li>' + enLinea(i) + '</li>'; }).join('') + '</ol>';
      case 'nota':
        return '<div class="nota ' + (b.clase || '') + '">' +
          (b.tit ? '<div class="nota-titulo">' + b.tit + '</div>' : '') +
          '<div>' + enLinea(b.x) + '</div></div>';
      case 'cita':
        return '<blockquote class="cita">' + enLinea(b.x) +
          (b.fuente ? '<cite>' + b.fuente + '</cite>' : '') + '</blockquote>';
      case 'tabla':
        return tabla(b.head, b.filas);
      default:
        return '<p>' + enLinea(b.x) + '</p>';
    }
  }

  function bloques(lista) {
    return (lista || []).map(bloque).join('');
  }

  function tabla(cabeceras, filas) {
    var h = (cabeceras || []).map(function (c) { return '<th>' + enLinea(c) + '</th>'; }).join('');
    var f = (filas || []).map(function (fila) {
      return '<tr>' + fila.map(function (c) { return '<td>' + enLinea(c) + '</td>'; }).join('') + '</tr>';
    }).join('');
    return '<div class="envoltura-tabla"><table><thead><tr>' + h + '</tr></thead><tbody>' + f + '</tbody></table></div>';
  }

  /* ── Componentes ──────────────────────────────────────── */
  function migas(items) {
    return '<nav class="migas">' + items.map(function (i, n) {
      var sep = n > 0 ? '<span class="sep">/</span>' : '';
      return sep + (i.ruta ? '<a href="' + i.ruta + '">' + escapar(i.texto) + '</a>'
                          : '<span>' + escapar(i.texto) + '</span>');
    }).join('') + '</nav>';
  }

  function bandaSimulacion() {
    return '<div class="banda-simulacion">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.01"/></svg>' +
      '<div>' + PMBOK.meta.aviso + '</div></div>';
  }

  function etiqueta(texto, clase) {
    return '<span class="etiqueta ' + (clase || '') + '">' + escapar(texto) + '</span>';
  }

  function pastillaDominio(claveDominio) {
    var d = Indice.dominioMeta(claveDominio);
    if (!d) return '';
    return '<span class="pastilla-dominio ' + d.clase + '">' + escapar(d.nombre) + '</span>';
  }

  function acordeon(preguntas, abrirPrimera) {
    if (!preguntas || !preguntas.length) return '';
    return '<div class="acordeon">' + preguntas.map(function (p, i) {
      return '<details' + (abrirPrimera && i === 0 ? ' open' : '') + '>' +
        '<summary>' + enLinea(p.q) + '</summary>' +
        '<div class="cuerpo-acordeon">' + enLinea(p.a) + '</div></details>';
    }).join('') + '</div>';
  }

  function ejemplo(e, indice) {
    return '<div class="ejemplo">' +
      '<div class="ejemplo-cab">' +
        '<span class="etiqueta acento">Ejemplo' + (indice ? ' ' + indice : '') + '</span>' +
        '<h4>' + enLinea(e.titulo) + '</h4>' +
      '</div>' +
      '<div class="ejemplo-cuerpo"><dl>' +
        (e.contexto ? '<div class="ejemplo-campo"><dt>Contexto</dt><dd>' + enLinea(e.contexto) + '</dd></div>' : '') +
        (e.aplicacion ? '<div class="ejemplo-campo"><dt>Aplicación</dt><dd>' + enLinea(e.aplicacion) + '</dd></div>' : '') +
        (e.resultado ? '<div class="ejemplo-campo"><dt>Resultado</dt><dd>' + enLinea(e.resultado) + '</dd></div>' : '') +
      '</dl></div></div>';
  }

  function ejemplos(lista) {
    if (!lista || !lista.length) return '';
    return lista.map(function (e, i) { return ejemplo(e, lista.length > 1 ? i + 1 : 0); }).join('');
  }

  function itto(entradas, herramientas, salidas) {
    function col(titulo, items) {
      return '<div class="itto-col"><div class="itto-cab">' + titulo + '</div><ul>' +
        (items || []).map(function (i) { return '<li>' + enLinea(i) + '</li>'; }).join('') +
        '</ul></div>';
    }
    return '<div class="itto">' +
      col('Entradas', entradas) +
      col('Herramientas y técnicas', herramientas) +
      col('Salidas', salidas) +
      '</div>';
  }

  function enEstaPagina(anclas) {
    if (!anclas || anclas.length < 3) return '';
    return '<nav class="en-esta-pagina"><div class="titulo">En esta página</div><ol>' +
      anclas.map(function (a) { return '<li><a href="#' + a.id + '">' + escapar(a.texto) + '</a></li>'; }).join('') +
      '</ol></nav>';
  }

  function vacio(glifo, titulo, texto) {
    return '<div class="vacio"><div class="glifo">' + glifo + '</div>' +
      '<h3 style="margin:0 0 6px;font-family:var(--serif);font-size:19px">' + escapar(titulo) + '</h3>' +
      '<p>' + texto + '</p></div>';
  }

  return {
    enLinea: enLinea,
    escapar: escapar,
    bloque: bloque,
    bloques: bloques,
    tabla: tabla,
    migas: migas,
    bandaSimulacion: bandaSimulacion,
    etiqueta: etiqueta,
    pastillaDominio: pastillaDominio,
    acordeon: acordeon,
    ejemplo: ejemplo,
    ejemplos: ejemplos,
    itto: itto,
    enEstaPagina: enEstaPagina,
    vacio: vacio
  };
})();
