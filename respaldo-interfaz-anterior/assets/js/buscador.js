/* ═══════════════════════════════════════════════════════════
   buscador.js — Paleta de búsqueda global (Ctrl/Cmd + K)
   Puntuación por coincidencia de términos en título, subtítulo
   y cuerpo, con extracto resaltado del contexto.
   ═══════════════════════════════════════════════════════════ */

window.Buscador = (function () {
  'use strict';

  var capa, entrada, contenedor, conteo;
  var resultados = [];
  var seleccion = 0;

  var PESO = { titulo: 12, numero: 10, subtitulo: 4, cuerpo: 1 };
  var ORDEN_TIPO = { accion: 0, proyecto: 1, 'proceso-obra': 2, proceso: 3, dominio: 4,
                     principio: 5, artefacto: 6, herramienta: 7 };
  var NOMBRE_TIPO = {
    accion: 'Acciones', proyecto: 'Proyectos', 'proceso-obra': 'En este proyecto',
    proceso: 'Procesos', dominio: 'Dominios', principio: 'Principios',
    artefacto: 'Artefactos', herramienta: 'Herramientas'
  };

  /* ── Puntuación ───────────────────────────────────────── */
  function puntuar(nodo, terminos) {
    var tit = Indice.normalizar(nodo.titulo);
    var sub = Indice.normalizar(nodo.subtitulo || '');
    var num = Indice.normalizar(nodo.numero || '');
    var cue = nodo.busqueda;
    var total = 0, encontrados = 0;

    for (var i = 0; i < terminos.length; i++) {
      var t = terminos[i], p = 0;
      if (tit.indexOf(t) === 0) p += PESO.titulo * 1.6;
      else if (tit.indexOf(t) !== -1) p += PESO.titulo;
      if (num.indexOf(t) !== -1) p += PESO.numero;
      if (sub.indexOf(t) !== -1) p += PESO.subtitulo;
      var pos = cue.indexOf(t);
      if (pos !== -1) {
        p += PESO.cuerpo;
        var extra = cue.split(t).length - 1;
        p += Math.min(extra, 6) * 0.4;
      }
      if (p > 0) { encontrados++; total += p; }
    }
    if (encontrados < terminos.length) return 0;      // exige todos los términos
    return total;
  }

  /* ── Extracto con resaltado ───────────────────────────── */
  function extracto(nodo, terminos) {
    var plano = Indice.sinEtiquetas(nodo.subtitulo || nodo.cuerpo || '').replace(/\s+/g, ' ').trim();
    var norm = Indice.normalizar(plano);
    var pos = -1;
    for (var i = 0; i < terminos.length && pos === -1; i++) { pos = norm.indexOf(terminos[i]); }
    if (pos === -1) pos = 0;

    // Mapea aproximadamente la posición normalizada al texto original
    var inicio = Math.max(0, pos - 60);
    var trozo = plano.substr(inicio, 190);
    if (inicio > 0) trozo = '…' + trozo;
    if (inicio + 190 < plano.length) trozo += '…';

    var salida = Render.escapar(trozo);
    terminos.forEach(function (t) {
      if (t.length < 3) return;
      try {
        var re = new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
        salida = salida.replace(re, '<mark>$1</mark>');
      } catch (e) {}
    });
    return salida;
  }

  /* ── Búsqueda ─────────────────────────────────────────── */
  var RE_CODIGO = /^[0-9xX][0-9a-zA-Z.]*$/;

  /* Lo que cambia con la sesión: proyectos visibles, los procesos del
     proyecto abierto y un puñado de acciones frecuentes. */
  function nodosDinamicos() {
    if (!window.Gestor || !Gestor.haySesion()) return [];
    var salida = [];

    salida.push(nodoAccion('nuevo-proyecto', 'Nuevo proyecto', 'Crear un proyecto y desplegar sus 40 procesos', '#/panel/nuevo'));
    salida.push(nodoAccion('panel', 'Ir al panel', 'Tus proyectos y su progreso', '#/panel'));
    salida.push(nodoAccion('tema', 'Cambiar tema claro u oscuro', 'Alterna la apariencia', '#tema'));

    Gestor.proyectosVisibles().forEach(function (pr) {
      var met = Gestor.metodologia(pr.metodologia);
      var prog = Gestor.progreso(pr.id);
      salida.push(preparar({
        id: 'pry-' + pr.id, tipo: 'proyecto', ruta: '#/proyectos/' + pr.id, numero: '',
        titulo: pr.nombre,
        subtitulo: met.nombre + ' · ' + prog.completados + ' de ' + prog.aplicables + ' procesos',
        cuerpo: pr.descripcion || ''
      }));
    });

    var m = (location.hash || '').match(/^#\/proyectos\/([^\/]+)/);
    var abierto = m ? Gestor.proyecto(m[1]) : null;
    if (abierto) {
      (PMBOK.procesos || []).forEach(function (pc) {
        var est = Gestor.estadoProceso(abierto.id, pc.id).estado;
        salida.push(preparar({
          id: 'obra-' + pc.id, tipo: 'proceso-obra',
          ruta: '#/proyectos/' + abierto.id + '/proceso/' + pc.id, numero: pc.cod,
          titulo: pc.nombre,
          subtitulo: ({ pendiente: 'Pendiente', iniciado: 'En curso', completado: 'Completado', omitido: 'Omitido' }[est] || est) +
            ' · ' + abierto.nombre,
          cuerpo: pc.proposito
        }));
      });
    }
    return salida;
  }

  function nodoAccion(id, titulo, subtitulo, ruta) {
    return preparar({ id: 'acc-' + id, tipo: 'accion', ruta: ruta, numero: '', titulo: titulo, subtitulo: subtitulo, cuerpo: '' });
  }

  function preparar(n) {
    n.busqueda = Indice.normalizar(n.titulo + ' ' + (n.subtitulo || '') + ' ' + (n.cuerpo || ''));
    return n;
  }

  function todos() {
    return nodosDinamicos().concat(Indice.nodos);
  }

  function buscar(consulta) {
    var crudo = String(consulta || '').trim().toLowerCase();
    var terminos = Indice.normalizar(consulta).split(' ').filter(function (t) { return t.length > 1; });

    // Coincidencia por numeración: «2.7.4», «X2», «3.1»…
    var porCodigo = {};
    var universo = todos();
    if (crudo && RE_CODIGO.test(crudo)) {
      universo.forEach(function (n) {
        var num = String(n.numero || '').toLowerCase();
        if (num && num.indexOf(crudo) === 0) {
          porCodigo[n.id] = num === crudo ? 120 : 80;
        }
      });
    }

    var hayCodigo = Object.keys(porCodigo).length > 0;
    if (!terminos.length && !hayCodigo) return [];

    return universo
      .map(function (n) {
        var p = terminos.length ? puntuar(n, terminos) : 0;
        if (porCodigo[n.id]) p += porCodigo[n.id];
        return { nodo: n, puntos: p };
      })
      .filter(function (r) { return r.puntos > 0; })
      .sort(function (a, b) {
        if (b.puntos !== a.puntos) return b.puntos - a.puntos;
        return (ORDEN_TIPO[a.nodo.tipo] || 9) - (ORDEN_TIPO[b.nodo.tipo] || 9);
      })
      .slice(0, 40)
      .map(function (r) {
        r.extracto = extracto(r.nodo, terminos);
        return r;
      });
  }

  /* ── Pintado ──────────────────────────────────────────── */
  function pintar() {
    if (!resultados.length) {
      var v = entrada.value.trim();
      if (v) {
        contenedor.innerHTML = '<div class="res-vacio">Sin resultados para <b>' + Render.escapar(v) +
          '</b>.<br>Prueba con el código del proceso, por ejemplo <kbd>2.7.2</kbd>.</div>';
        conteo.textContent = '';
        return;
      }
      /* Sin texto: acciones y proyectos, que es a lo que se vuelve siempre */
      resultados = nodosDinamicos()
        .filter(function (n) { return n.tipo === 'accion' || n.tipo === 'proyecto'; })
        .slice(0, 9)
        .map(function (n) { return { nodo: n, puntos: 1, extracto: Render.escapar(n.subtitulo || '') }; });
      if (!resultados.length) {
        contenedor.innerHTML = '<div class="res-vacio">Busca procesos, dominios, herramientas o artefactos.</div>';
        conteo.textContent = '';
        return;
      }
    }

    var grupoActual = null, html = '';
    resultados.forEach(function (r, i) {
      var g = NOMBRE_TIPO[r.nodo.tipo] || 'Otros';
      if (g !== grupoActual) { grupoActual = g; html += '<div class="res-grupo">' + g + '</div>'; }
      html += '<a class="res-item' + (i === seleccion ? ' selecto' : '') + '" data-i="' + i + '" href="' + r.nodo.ruta + '">' +
        '<div class="r-tit">' + (r.nodo.numero ? '<span style="opacity:.55;font-family:var(--mono);font-size:11px">' + Render.escapar(r.nodo.numero) + '</span> ' : '') +
        Render.escapar(r.nodo.titulo) + '</div>' +
        '<div class="r-sub">' + r.extracto + '</div></a>';
    });
    contenedor.innerHTML = html;
    conteo.textContent = resultados.length + (resultados.length === 1 ? ' resultado' : ' resultados');
  }

  function mover(delta) {
    if (!resultados.length) return;
    seleccion = (seleccion + delta + resultados.length) % resultados.length;
    pintar();
    var el = contenedor.querySelector('.res-item.selecto');
    if (el) el.scrollIntoView({ block: 'nearest' });
  }

  function abrirSeleccion() {
    if (!resultados.length) return;
    var r = resultados[seleccion];
    cerrar();
    ejecutar(r.nodo);
  }

  function ejecutar(nodo) {
    if (nodo.ruta === '#tema') { Almacen.alternarTema(); return; }
    location.hash = nodo.ruta;
  }

  /* ── Apertura y cierre ────────────────────────────────── */
  function abrir(textoInicial) {
    capa.hidden = false;
    entrada.value = textoInicial || '';
    seleccion = 0;
    resultados = entrada.value ? buscar(entrada.value) : [];
    pintar();
    entrada.focus();
    entrada.select();
  }

  function cerrar() {
    capa.hidden = true;
  }

  function iniciar() {
    capa = document.getElementById('capa-buscador');
    entrada = document.getElementById('entrada-busqueda');
    contenedor = document.getElementById('resultados-busqueda');
    conteo = document.getElementById('conteo-busqueda');

    document.getElementById('abrir-buscador').addEventListener('click', function () { abrir(); });

    entrada.addEventListener('input', function () {
      resultados = buscar(entrada.value);
      seleccion = 0;
      pintar();
    });

    entrada.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); mover(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); mover(-1); }
      else if (e.key === 'Enter') { e.preventDefault(); abrirSeleccion(); }
      else if (e.key === 'Escape') { cerrar(); }
    });

    contenedor.addEventListener('mousemove', function (e) {
      var item = e.target.closest ? e.target.closest('.res-item') : null;
      if (item) {
        var i = parseInt(item.getAttribute('data-i'), 10);
        if (i !== seleccion) { seleccion = i; pintar(); }
      }
    });

    contenedor.addEventListener('click', function (e) {
      var item = e.target.closest ? e.target.closest('.res-item') : null;
      if (!item) return;
      e.preventDefault();
      var r = resultados[parseInt(item.getAttribute('data-i'), 10)];
      cerrar();
      if (r) ejecutar(r.nodo);
    });

    capa.addEventListener('mousedown', function (e) {
      if (e.target === capa) cerrar();
    });

    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        capa.hidden ? abrir() : cerrar();
      } else if (e.key === 'Escape' && !capa.hidden) {
        cerrar();
      } else if (e.key === '/' && capa.hidden &&
                 !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
        e.preventDefault();
        abrir();
      }
    });
  }

  return { iniciar: iniciar, abrir: abrir, cerrar: cerrar, buscar: buscar };
})();
