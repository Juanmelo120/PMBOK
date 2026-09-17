/* ═══════════════════════════════════════════════════════════
   graficos.js — Gráficos de líneas y barras en SVG
   ───────────────────────────────────────────────────────────
   Pensados para leerse, no para decorar:
   · un solo eje Y; nunca dos escalas en el mismo gráfico
   · líneas de 2 px, marcadores de 8 px con anillo de superficie
   · barras ancladas a la base con el extremo de dato redondeado
   · la cruceta busca la fecha y el aviso lista todas las series
   · leyenda con clave de línea y etiqueta directa al final
   · teclado: flechas para recorrer, igual que con el puntero
   · cada gráfico lleva su tabla de datos: nada depende del hover
   · se dibuja al ancho real del contenedor, así el texto mide
     siempre lo mismo en escritorio y en móvil
   Colores validados para daltonismo en claro y oscuro (estilos.css).
   ═══════════════════════════════════════════════════════════ */

window.Graficos = (function () {
  'use strict';

  var registro = {};
  var contador = 0;
  var ALTO = 240;
  var ANCHO_INICIAL = 640;

  /* ══════════════ Utilidades ══════════════ */

  /* Paso «redondo» para las marcas del eje: 1, 2, 2.5 o 5 por potencia de 10 */
  function pasoRedondo(bruto) {
    if (bruto <= 0) return 1;
    var exp = Math.pow(10, Math.floor(Math.log(bruto) / Math.LN10));
    var f = bruto / exp;
    var nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
    return nice * exp;
  }

  /* Puntos, dinero y conteos son enteros: un paso menor que 1 repetiría
     marcas al redondear («1, 1, 1, 0, 0»). opc.decimales lo permite. */
  function escalaY(maximo, decimales) {
    var paso = pasoRedondo((maximo || 1) / 4);
    if (!decimales && paso < 1) paso = 1;
    var tope = Math.max(paso, Math.ceil((maximo || 1) / paso) * paso);
    var marcas = [];
    for (var v = 0; v <= tope + paso / 2; v += paso) marcas.push(v);
    return { tope: tope, marcas: marcas };
  }

  function tiempo(x) {
    var d = new Date(String(x).length === 10 ? x + 'T12:00:00' : x);
    return isNaN(d.getTime()) ? null : d.getTime();
  }

  function etiquetaFecha(x) {
    var t = tiempo(x);
    if (t === null) return String(x);
    return new Date(t).toLocaleDateString('es', { day: 'numeric', month: 'short' });
  }

  function esc(s) { return window.Render ? Render.escapar(s) : String(s); }
  function n1(v) { return Math.round(v * 10) / 10; }
  function vacioValor(v) { return v === null || v === undefined; }

  /* ══════════════ Líneas ══════════════ */
  /* opc: { titulo, descripcion, puntos: [x…], series: [{ nombre, clase, valores: […], discontinua }],
           formato: fn(v), formatoEje: fn(v), vacio: 'mensaje' } */

  function lineas(opc) {
    if (!(opc.puntos || []).length) return vacio(opc);
    var id = 'gf-' + (++contador);
    var def = registro[id] = { id: id, tipo: 'lineas', opc: opc };
    return figura(id, opc,
      leyenda(opc.series) +
      '<div class="gf-lienzo">' + dibujarLineas(def, ANCHO_INICIAL) + '<div class="gf-aviso" hidden></div></div>' +
      tablaDatos(opc));
  }

  function dibujarLineas(def, ancho) {
    var opc = def.opc;
    var n = opc.puntos.length;
    var estrecho = ancho < 520;
    var m = { arriba: 12, derecha: estrecho ? 12 : 116, abajo: 28, izquierda: estrecho ? 46 : 56 };
    var anchoUtil = ancho - m.izquierda - m.derecha;
    var alto = ALTO - m.arriba - m.abajo;

    var tiempos = opc.puntos.map(tiempo);
    var usaTiempo = n > 1 && tiempos.every(function (t) { return t !== null; });
    var tMin = usaTiempo ? Math.min.apply(null, tiempos) : 0;
    var tMax = usaTiempo ? Math.max.apply(null, tiempos) : 0;

    function px(i) {
      if (n === 1) return m.izquierda + anchoUtil / 2;
      if (usaTiempo && tMax > tMin) return m.izquierda + ((tiempos[i] - tMin) / (tMax - tMin)) * anchoUtil;
      return m.izquierda + (i / (n - 1)) * anchoUtil;
    }

    var maximo = 0;
    opc.series.forEach(function (s) {
      s.valores.forEach(function (v) { if (!vacioValor(v) && v > maximo) maximo = v; });
    });
    var ey = escalaY(maximo, opc.decimales);
    function py(v) { return m.arriba + alto - (v / ey.tope) * alto; }

    var fmt = opc.formato || function (v) { return String(Math.round(v)); };
    var fmtEje = opc.formatoEje || fmt;

    /* Rejilla y eje Y: tinta muy tenue, solo para orientar */
    var rejilla = ey.marcas.map(function (v) {
      var y = n1(py(v));
      return '<line class="gf-rejilla" x1="' + m.izquierda + '" x2="' + (m.izquierda + anchoUtil) +
        '" y1="' + y + '" y2="' + y + '"/>' +
        '<text class="gf-eje" x="' + (m.izquierda - 8) + '" y="' + (y + 4) + '" text-anchor="end">' + esc(fmtEje(v)) + '</text>';
    }).join('');

    /* Eje X: las etiquetas nunca se pisan; en estrecho, solo extremos y centro */
    var maxEtiquetas = estrecho ? 3 : 6;
    var cada = Math.max(1, Math.ceil(n / maxEtiquetas));
    var ejeX = opc.puntos.map(function (x, i) {
      if (i % cada !== 0 && i !== n - 1) return '';
      if (i !== n - 1 && (n - 1 - i) < cada / 2) return '';
      var ancla = i === 0 && n > 1 ? 'start' : i === n - 1 && n > 1 ? 'end' : 'middle';
      return '<text class="gf-eje" x="' + n1(px(i)) + '" y="' + (ALTO - 8) + '" text-anchor="' + ancla + '">' +
        esc(etiquetaFecha(x)) + '</text>';
    }).join('');

    var trazos = opc.series.map(function (s) {
      var d = '', abierto = false;
      s.valores.forEach(function (v, i) {
        if (vacioValor(v)) { abierto = false; return; }
        d += (abierto ? 'L' : 'M') + n1(px(i)) + ' ' + n1(py(v));
        abierto = true;
      });
      var marcas = n <= 24 ? s.valores.map(function (v, i) {
        return vacioValor(v) ? '' : '<circle class="gf-punto" cx="' + n1(px(i)) + '" cy="' + n1(py(v)) + '" r="4"/>';
      }).join('') : '';
      return '<g class="gf-serie ' + s.clase + (s.discontinua ? ' discontinua' : '') + '">' +
        '<path class="gf-linea" d="' + d + '"/>' + marcas + '</g>';
    }).join('');

    /* Etiqueta directa al final de cada serie, separadas para no chocar.
       Solo si la serie llega al último punto: una etiqueta lejos de su
       línea confunde más que ayuda, y la leyenda ya la nombra. */
    var directas = '';
    if (!estrecho && opc.series.length <= 4) {
      var finales = opc.series.map(function (s) {
        var v = s.valores[n - 1];
        return vacioValor(v) ? null : { s: s, y: py(v) };
      }).filter(Boolean).sort(function (a, b) { return a.y - b.y; });
      for (var k = 1; k < finales.length; k++) {
        if (finales[k].y - finales[k - 1].y < 14) finales[k].y = finales[k - 1].y + 14;
      }
      directas = finales.map(function (f) {
        return '<text class="gf-directa" x="' + (m.izquierda + anchoUtil + 10) + '" y="' + n1(f.y + 4) + '">' +
          esc(f.s.nombre) + '</text>';
      }).join('');
    }

    def.n = n; def.px = px; def.py = py; def.fmt = fmt; def.ancho = ancho;
    def.margen = m; def.altoUtil = alto; def.anchoUtil = anchoUtil;

    return '<svg class="gf-svg" width="' + ancho + '" height="' + ALTO + '" viewBox="0 0 ' + ancho + ' ' + ALTO + '" ' +
      'role="img" aria-label="' + esc(resumen(opc)) + '">' +
      rejilla + ejeX + trazos + directas +
      '<line class="gf-cruceta" x1="0" x2="0" y1="' + m.arriba + '" y2="' + (m.arriba + alto) + '" visibility="hidden"/>' +
      '<g class="gf-foco"></g>' +
      '<rect class="gf-zona" x="' + m.izquierda + '" y="' + m.arriba + '" width="' + anchoUtil + '" height="' + alto + '"/>' +
      '</svg>';
  }

  /* ══════════════ Barras ══════════════ */
  /* opc: { titulo, descripcion, categorias: […], valores: […], clase, formato, nombreSerie,
           referencia: { valor, etiqueta } } */

  function barras(opc) {
    if (!(opc.categorias || []).length) return vacio(opc);
    var id = 'gf-' + (++contador);
    var def = registro[id] = { id: id, tipo: 'barras', opc: opc };
    return figura(id, opc,
      '<div class="gf-lienzo">' + dibujarBarras(def, ANCHO_INICIAL) + '<div class="gf-aviso" hidden></div></div>' +
      tablaDatos({
        puntos: opc.categorias,
        series: [{ nombre: opc.nombreSerie || 'Valor', valores: opc.valores }],
        formato: opc.formato, sinFecha: true
      }));
  }

  function dibujarBarras(def, ancho) {
    var opc = def.opc;
    var n = opc.categorias.length;
    var m = { arriba: 22, derecha: 12, abajo: 28, izquierda: 44 };
    var anchoUtil = ancho - m.izquierda - m.derecha;
    var alto = ALTO - m.arriba - m.abajo;

    var maximo = Math.max.apply(null, opc.valores.concat([opc.referencia ? opc.referencia.valor : 0, 1]));
    var ey = escalaY(maximo, opc.decimales);
    function py(v) { return m.arriba + alto - (v / ey.tope) * alto; }

    var banda = anchoUtil / n;
    var grosor = Math.min(56, banda * 0.62);
    var fmt = opc.formato || function (v) { return String(Math.round(v)); };

    var rejilla = ey.marcas.map(function (v) {
      var y = n1(py(v));
      return '<line class="gf-rejilla" x1="' + m.izquierda + '" x2="' + (m.izquierda + anchoUtil) +
        '" y1="' + y + '" y2="' + y + '"/>' +
        '<text class="gf-eje" x="' + (m.izquierda - 8) + '" y="' + (y + 4) + '" text-anchor="end">' + esc(fmt(v)) + '</text>';
    }).join('');

    var base = py(0);
    var cuerpos = opc.valores.map(function (v, i) {
      var x = m.izquierda + banda * i + (banda - grosor) / 2;
      var y = py(v);
      var h = Math.max(0, base - y);
      var r = Math.min(4, h / 2, grosor / 2);
      /* Solo el extremo de dato va redondeado; la base queda recta sobre el eje */
      var d = h <= 0 ? '' :
        'M' + n1(x) + ' ' + n1(base) + 'V' + n1(y + r) +
        'Q' + n1(x) + ' ' + n1(y) + ' ' + n1(x + r) + ' ' + n1(y) +
        'H' + n1(x + grosor - r) +
        'Q' + n1(x + grosor) + ' ' + n1(y) + ' ' + n1(x + grosor) + ' ' + n1(y + r) +
        'V' + n1(base) + 'Z';
      return '<g class="gf-barra ' + (opc.clase || 'serie-1') + '" data-i="' + i + '" tabindex="0" ' +
        'role="img" aria-label="' + esc(opc.categorias[i] + ': ' + fmt(v)) + '">' +
        '<rect class="gf-impacto" x="' + n1(m.izquierda + banda * i) + '" y="' + m.arriba +
          '" width="' + n1(banda) + '" height="' + alto + '"/>' +
        (d ? '<path class="gf-cuerpo" d="' + d + '"/>' : '') +
        '<text class="gf-valor" x="' + n1(x + grosor / 2) + '" y="' + n1(y - 6) + '" text-anchor="middle">' + esc(fmt(v)) + '</text>' +
        '<text class="gf-eje" x="' + n1(x + grosor / 2) + '" y="' + (ALTO - 8) + '" text-anchor="middle">' +
          esc(String(opc.categorias[i]).slice(0, 14)) + '</text>' +
        '</g>';
    }).join('');

    var referencia = '';
    if (opc.referencia && opc.referencia.valor) {
      var yr = n1(py(opc.referencia.valor));
      referencia = '<line class="gf-referencia" x1="' + m.izquierda + '" x2="' + (m.izquierda + anchoUtil) +
        '" y1="' + yr + '" y2="' + yr + '"/>' +
        '<text class="gf-directa" x="' + (m.izquierda + anchoUtil) + '" y="' + (yr - 6) + '" text-anchor="end">' +
        esc(opc.referencia.etiqueta + ' ' + fmt(opc.referencia.valor)) + '</text>';
    }

    def.fmt = fmt; def.ancho = ancho;

    return '<svg class="gf-svg" width="' + ancho + '" height="' + ALTO + '" viewBox="0 0 ' + ancho + ' ' + ALTO + '" ' +
      'role="group" aria-label="' + esc(opc.titulo) + '">' + rejilla + cuerpos + referencia + '</svg>';
  }

  /* ══════════════ Piezas comunes ══════════════ */

  function figura(id, opc, cuerpo) {
    return '<figure class="gf" data-gf="' + id + '">' +
      '<figcaption class="gf-cab">' +
        '<span class="gf-titulo">' + esc(opc.titulo) + '</span>' +
        (opc.descripcion ? '<span class="gf-desc">' + esc(opc.descripcion) + '</span>' : '') +
      '</figcaption>' + cuerpo + '</figure>';
  }

  function leyenda(series) {
    if (series.length < 2) return '';
    return '<div class="gf-leyenda">' + series.map(function (s) {
      return '<span class="gf-clave ' + s.clase + (s.discontinua ? ' discontinua' : '') + '">' +
        '<i class="linea"></i>' + esc(s.nombre) + '</span>';
    }).join('') + '</div>';
  }

  function tablaDatos(opc) {
    var fmt = opc.formato || String;
    var filas = opc.puntos.map(function (x, i) {
      return '<tr><th scope="row">' + esc(opc.sinFecha ? x : etiquetaFecha(x)) + '</th>' +
        opc.series.map(function (s) {
          var v = s.valores[i];
          return '<td>' + (vacioValor(v) ? '—' : esc(fmt(v))) + '</td>';
        }).join('') + '</tr>';
    }).join('');
    return '<details class="gf-tabla"><summary>Ver los datos en tabla</summary>' +
      '<div class="envoltura-tabla"><table class="pa-tabla"><thead><tr><th scope="col"></th>' +
      opc.series.map(function (s) { return '<th scope="col">' + esc(s.nombre) + '</th>'; }).join('') +
      '</tr></thead><tbody>' + filas + '</tbody></table></div></details>';
  }

  function vacio(opc) {
    return '<figure class="gf gf-vacio"><figcaption class="gf-cab"><span class="gf-titulo">' + esc(opc.titulo) +
      '</span></figcaption><p>' + esc(opc.vacio || 'Aún no hay datos para dibujar.') + '</p></figure>';
  }

  function resumen(opc) {
    var ultimo = opc.puntos.length - 1;
    var fmt = opc.formato || String;
    return opc.titulo + '. ' + opc.series.map(function (s) {
      var v = s.valores[ultimo];
      return s.nombre + ' ' + (vacioValor(v) ? 'sin dato' : fmt(v));
    }).join(', ') + ' en el último punto.';
  }

  /* ══════════════ Interacción ══════════════ */
  /* Los eventos se delegan en el lienzo, que no cambia: así el SVG se
     puede volver a dibujar al ancho real sin perder la interacción. */

  function conectar(raiz) {
    var figuras = (raiz || document).querySelectorAll('.gf[data-gf]');
    for (var i = 0; i < figuras.length; i++) {
      var fig = figuras[i];
      var def = registro[fig.getAttribute('data-gf')];
      if (!def || fig.getAttribute('data-conectado')) continue;
      fig.setAttribute('data-conectado', '1');
      ajustarAncho(fig, def);
      if (def.tipo === 'lineas') conectarLineas(fig, def);
      else conectarBarras(fig, def);
    }
  }

  function ajustarAncho(fig, def) {
    var lienzo = fig.querySelector('.gf-lienzo');
    var ancho = Math.max(300, Math.floor(lienzo.clientWidth));
    if (!ancho || Math.abs(ancho - def.ancho) < 4) return;
    var svg = lienzo.querySelector('svg');
    var nuevo = def.tipo === 'lineas' ? dibujarLineas(def, ancho) : dibujarBarras(def, ancho);
    var tmp = document.createElement('div');
    tmp.innerHTML = nuevo;
    lienzo.replaceChild(tmp.firstChild, svg);
  }

  function conectarLineas(fig, def) {
    var lienzo = fig.querySelector('.gf-lienzo');
    var aviso = fig.querySelector('.gf-aviso');
    var actual = -1;

    lienzo.setAttribute('tabindex', '0');
    lienzo.setAttribute('aria-label', def.opc.titulo + '. Usa las flechas izquierda y derecha para recorrer los puntos.');

    function mostrar(i) {
      if (i < 0 || i >= def.n) return;
      actual = i;
      var svg = lienzo.querySelector('svg');
      var cruceta = svg.querySelector('.gf-cruceta');
      var foco = svg.querySelector('.gf-foco');
      var x = def.px(i);

      cruceta.setAttribute('x1', x);
      cruceta.setAttribute('x2', x);
      cruceta.setAttribute('visibility', 'visible');

      foco.innerHTML = def.opc.series.map(function (s) {
        var v = s.valores[i];
        if (vacioValor(v) || s.discontinua) return '';
        return '<g class="' + s.clase + '"><circle class="gf-punto activo" cx="' + n1(x) + '" cy="' + n1(def.py(v)) + '" r="5"/></g>';
      }).join('');

      /* El aviso se construye con nodos de texto: los nombres son datos */
      while (aviso.firstChild) aviso.removeChild(aviso.firstChild);
      var cab = document.createElement('div');
      cab.className = 'gf-aviso-cab';
      cab.textContent = etiquetaFecha(def.opc.puntos[i]);
      aviso.appendChild(cab);

      def.opc.series.forEach(function (s) {
        var v = s.valores[i];
        var fila = document.createElement('div');
        fila.className = 'gf-aviso-fila ' + s.clase;
        var clave = document.createElement('i');
        clave.className = 'gf-aviso-clave' + (s.discontinua ? ' discontinua' : '');
        var valor = document.createElement('b');
        valor.textContent = vacioValor(v) ? '—' : def.fmt(v);
        var nombre = document.createElement('span');
        nombre.textContent = s.nombre;
        fila.appendChild(clave);
        fila.appendChild(valor);
        fila.appendChild(nombre);
        aviso.appendChild(fila);
      });

      aviso.hidden = false;
      var anchoAviso = aviso.offsetWidth || 170;
      var izquierda = x + 14;
      if (izquierda + anchoAviso > def.ancho) izquierda = x - anchoAviso - 14;
      aviso.style.transform = 'translate(' + Math.max(0, Math.round(izquierda)) + 'px, ' + def.margen.arriba + 'px)';
    }

    function ocultar() {
      var svg = lienzo.querySelector('svg');
      if (!svg) return;
      svg.querySelector('.gf-cruceta').setAttribute('visibility', 'hidden');
      svg.querySelector('.gf-foco').innerHTML = '';
      aviso.hidden = true;
    }

    lienzo.addEventListener('pointermove', function (e) {
      if (!e.target.closest || !e.target.closest('.gf-zona')) { ocultar(); return; }
      var caja = lienzo.querySelector('svg').getBoundingClientRect();
      var x = e.clientX - caja.left;
      var mejor = 0, dist = Infinity;
      for (var i = 0; i < def.n; i++) {
        var d = Math.abs(def.px(i) - x);
        if (d < dist) { dist = d; mejor = i; }
      }
      mostrar(mejor);
    });
    lienzo.addEventListener('pointerleave', ocultar);

    lienzo.addEventListener('focus', function () { mostrar(actual < 0 ? def.n - 1 : actual); });
    lienzo.addEventListener('blur', ocultar);
    lienzo.addEventListener('keydown', function (e) {
      var teclas = { ArrowLeft: Math.max(0, actual - 1), ArrowRight: Math.min(def.n - 1, actual + 1), Home: 0, End: def.n - 1 };
      if (e.key in teclas) { e.preventDefault(); mostrar(teclas[e.key]); }
      if (e.key === 'Escape') ocultar();
    });
  }

  function conectarBarras(fig, def) {
    var lienzo = fig.querySelector('.gf-lienzo');
    var aviso = fig.querySelector('.gf-aviso');

    function mostrar(g) {
      var i = parseInt(g.getAttribute('data-i'), 10);
      var grupos = lienzo.querySelectorAll('.gf-barra');
      for (var k = 0; k < grupos.length; k++) grupos[k].classList.toggle('activa', grupos[k] === g);

      while (aviso.firstChild) aviso.removeChild(aviso.firstChild);
      var cab = document.createElement('div');
      cab.className = 'gf-aviso-cab';
      cab.textContent = def.opc.categorias[i];
      var fila = document.createElement('div');
      fila.className = 'gf-aviso-fila';
      var valor = document.createElement('b');
      valor.textContent = def.fmt(def.opc.valores[i]);
      var nombre = document.createElement('span');
      nombre.textContent = def.opc.nombreSerie || '';
      fila.appendChild(valor);
      fila.appendChild(nombre);
      aviso.appendChild(cab);
      aviso.appendChild(fila);
      aviso.hidden = false;

      var impacto = g.querySelector('.gf-impacto');
      var centro = parseFloat(impacto.getAttribute('x')) + parseFloat(impacto.getAttribute('width')) / 2;
      var anchoAviso = aviso.offsetWidth || 120;
      var izquierda = Math.max(0, Math.min(centro - anchoAviso / 2, def.ancho - anchoAviso));
      aviso.style.transform = 'translate(' + Math.round(izquierda) + 'px, 0)';
    }

    function ocultar() {
      aviso.hidden = true;
      var grupos = lienzo.querySelectorAll('.gf-barra');
      for (var k = 0; k < grupos.length; k++) grupos[k].classList.remove('activa');
    }

    lienzo.addEventListener('pointerover', function (e) {
      var g = e.target.closest ? e.target.closest('.gf-barra') : null;
      if (g) mostrar(g);
    });
    lienzo.addEventListener('pointerleave', ocultar);
    lienzo.addEventListener('focusin', function (e) {
      var g = e.target.closest ? e.target.closest('.gf-barra') : null;
      if (g) mostrar(g);
    });
    lienzo.addEventListener('focusout', ocultar);
  }

  /* Al cambiar el ancho de la ventana se redibujan al nuevo tamaño */
  var temporizador = null;
  window.addEventListener('resize', function () {
    if (temporizador) clearTimeout(temporizador);
    temporizador = setTimeout(function () {
      var figuras = document.querySelectorAll('.gf[data-conectado]');
      for (var i = 0; i < figuras.length; i++) {
        var def = registro[figuras[i].getAttribute('data-gf')];
        if (def) ajustarAncho(figuras[i], def);
      }
    }, 150);
  });

  return { lineas: lineas, barras: barras, conectar: conectar };
})();
