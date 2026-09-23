/* ═══════════════════════════════════════════════════════════
   app.js — Enrutador, navegación lateral e identidad
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var contenido = document.getElementById('contenido');
  var arbol = document.getElementById('arbol');
  var lateral = document.getElementById('lateral');
  var velo = document.getElementById('velo');

  /* ══════════════ Rutas ══════════════ */

  /* Cada ruta pinta su vista y, si hace falta, conecta su interacción.
     `p` son los segmentos tras el nombre de la ruta. */
  var RUTAS = {
    entrar:       { vista: function () { return VistasGestor.entrar(); }, publica: true },
    registro:     { vista: function () { return VistasGestor.registro(); }, publica: true },
    clave:        { vista: function () { return VistasGestor.cambiarClave(); }, publica: true },
    panel:      { vista: function (p) { return VistasGestor.panel(p[0] === 'nuevo'); } },
    portafolios:  { vista: function () { return VistasGestor.portafolios(); } },
    agenda:       { vista: function (p) { return VistasGestor.agenda(p[0]); } },
    eos:          { vista: function (p) { return VistasGestor.eos(p[0]); } },
    admin:        { vista: function (p) { return VistasGestor.admin(p[0], p[1]); } },
    aprender:     { vista: function () { return VistasGestor.aprender(); } },
    herramientas: { vista: function () { return VistasGestor.herramientas(); } },
    artefactos:   { vista: function () { return VistasGestor.artefactos(); } },
    proyectos:    { vista: function (p) { return VistasObra.vista(p[0], p[1], p.slice(2).join('/')); } },
    procesos:     { vista: function () { return Vistas.catalogoProcesos(); } },
    proceso:      { vista: function (p) { return Vistas.proceso(p[0]); } },
    dominio:      { vista: function (p) { return Vistas.dominio(p[0]); } },
    principio:    { vista: function (p) { return Vistas.principio(p[0]); } }
  };

  var DE_GESTOR = ['entrar', 'registro', 'clave', 'panel', 'portafolios', 'agenda', 'eos', 'admin',
                   'aprender', 'herramientas', 'artefactos'];

  function leerRuta() {
    var partes = (location.hash || '').replace(/^#\/?/, '').split('/').filter(Boolean);
    return { nombre: partes[0] || '', resto: partes.slice(1) };
  }

  function resolver() {
    var ruta = leerRuta();
    var sesion = Gestor.haySesion();

    /* Una contraseña que otra persona conoce se cambia antes de nada.
       Sin sesión solo existen el acceso y el registro; con sesión, no. */
    if (Gestor.clavePendiente()) {
      if (ruta.nombre !== 'clave') { location.replace('#/clave'); return; }
    } else {
      if (!sesion && ruta.nombre !== 'entrar' && ruta.nombre !== 'registro') { location.replace('#/entrar'); return; }
      if (sesion && (ruta.nombre === 'entrar' || ruta.nombre === 'registro' || ruta.nombre === 'clave' || !ruta.nombre)) {
        location.replace('#/panel'); return;
      }
    }

    document.documentElement.setAttribute('data-sesion', sesion ? 'si' : 'no');

    var def = RUTAS[ruta.nombre];
    var html;
    try {
      html = def ? def.vista(ruta.resto) : Vistas.noEncontrado();
    } catch (err) {
      html = pantallaError(err);
      if (window.console) console.error(err);
    }

    /* Una ruta nueva entra con movimiento y sube al principio; un
       re-pintado tras una acción conserva la posición y no se anima. */
    var nueva = location.hash !== rutaPrevia;
    rutaPrevia = location.hash;

    contenido.innerHTML = html;
    entrar(nueva);
    if (nueva) window.scrollTo(0, 0);
    document.title = titulo(ruta);

    construirArbol();
    pintarUsuario();
    marcarActivo();
    conectar(ruta);
    cerrarLateral();
    if (window.Efectos) Efectos.trasPintar(contenido, nueva);
  }

  var rutaPrevia = null;

  /* Al cambiar de ruta, el contenido entra en cascada breve. Tras una
     acción basta un fundido corto desde casi opaco que evita el parpadeo. */
  function entrar(nueva) {
    contenido.classList.remove('vista-lista', 'vista-nueva');
    void contenido.offsetWidth;
    contenido.classList.add(nueva ? 'vista-nueva' : 'vista-lista');
  }

  function conectar(ruta) {
    var n = ruta.nombre;
    var arg = ruta.resto.join('/');

    if (n === 'procesos') conectarFiltroProcesos();

    if (DE_GESTOR.indexOf(n) !== -1) {
      VistasGestor.conectar(n, arg, resolver);
      if (n === 'admin') VistasGestor.conectarImportacion(resolver);
    }

    if (n === 'proyectos') {
      var p = ruta.resto;
      ObraAcciones.conectar(p[0], p[1], p.slice(2).join('/'), resolver);
      if (p[1] === 'calidad') VistasProyecto.conectar(p[2] || '', p[3] || '', resolver);
    }
  }

  function pantallaError(err) {
    return '<div class="hoja">' + UI.vacio('!', 'No se pudo mostrar esta pantalla',
      'Algo falló al preparar la vista. Tus datos siguen guardados. ' +
      '<a class="ref" href="#/panel">Vuelve al panel</a> e inténtalo de nuevo.' +
      '<br><code style="font-size:11px;color:var(--tinta-3)">' +
      Render.escapar(err && err.message ? err.message : String(err)) + '</code>') + '</div>';
  }

  function titulo(ruta) {
    var base = 'Gestor PMBOK® 8';
    var nombres = {
      entrar: 'Acceso', registro: 'Crear cuenta', clave: 'Cambiar contraseña', panel: 'Panel', portafolios: 'Portafolios', agenda: 'Agenda',
      eos: 'EOS Gerencia', admin: 'Administración', aprender: 'Aprender',
      herramientas: 'Herramientas', artefactos: 'Artefactos', procesos: 'Los 40 procesos'
    };
    if (ruta.nombre === 'admin' && ruta.resto[0] === 'notas') {
      return 'Notas de los proyectos — ' + base;
    }
    if (ruta.nombre === 'admin' && ruta.resto[0] === 'rocas') {
      var roca = ruta.resto[1] ? Gestor.uno('rocas', ruta.resto[1]) : null;
      return (roca ? roca.titulo : 'Supervisión de rocas') + ' — ' + base;
    }
    if (ruta.nombre === 'proyectos') {
      var pr = Gestor.proyecto(ruta.resto[0]);
      if (pr) return pr.nombre + ' — ' + base;
    }
    if (ruta.nombre === 'proceso' || ruta.nombre === 'dominio' || ruta.nombre === 'principio') {
      var nodo = Indice.nodo(ruta.resto[0]);
      if (nodo) return nodo.titulo + ' — ' + base;
    }
    return (nombres[ruta.nombre] ? nombres[ruta.nombre] + ' — ' : '') + base;
  }

  /* ══════════════ Navegación lateral ══════════════ */

  function construirArbol() {
    if (!Gestor.haySesion()) { arbol.innerHTML = ''; return; }

    var html = grupoGestion() + grupoProyecto();

    var ICONOS_APRENDER = { '#/aprender': 'aprender', '#/procesos': 'procesos',
                            '#/herramientas': 'herramientas', '#/artefactos': 'artefactos' };

    PMBOK.navegacion.forEach(function (grupo) {
      html += '<div class="arbol-grupo"><div class="arbol-titulo">' + grupo.titulo + '</div>';
      if (grupo.items) {
        grupo.items.forEach(function (i) { html += enlace(i.ruta, '', i.etiqueta, ICONOS_APRENDER[i.ruta]); });
      } else if (grupo.tipo === 'dominios') {
        PMBOK.dominios.forEach(function (d) {
          var meta = Indice.dominioMeta(d.clave);
          html += enlace('#/dominio/' + d.id, d.n, meta.nombre, null, meta.clase);
        });
      } else if (grupo.tipo === 'principios') {
        PMBOK.principios.forEach(function (p) {
          html += enlace('#/principio/' + p.id, p.n, p.titulo);
        });
      }
      html += '</div>';
    });

    arbol.innerHTML = html;
    aplicarFiltroArbol();
  }

  function grupoGestion() {
    var items = [
      ['#/panel', 'Panel', 'panel'],
      ['#/portafolios', 'Portafolios', 'portafolios'],
      ['#/agenda', 'Agenda', 'agenda'],
      ['#/eos', 'EOS Gerencia', 'eos']
    ];
    if (Gestor.esAdmin()) {
      items.push(['#/admin', 'Administración', 'admin']);
      items.push(['#/admin/rocas', 'Supervisión de rocas', 'rocas']);
      items.push(['#/admin/notas', 'Notas de los proyectos', 'indicador']);
    }
    return '<div class="arbol-grupo"><div class="arbol-titulo">Gestión</div>' +
      items.map(function (i) { return enlace(i[0], '', i[1], i[2]); }).join('') + '</div>';
  }

  /* El proyecto abierto, con su avance, justo debajo de la gestión */
  function grupoProyecto() {
    var ruta = leerRuta();
    if (ruta.nombre !== 'proyectos') return '';
    var pr = Gestor.proyecto(ruta.resto[0]);
    if (!pr) return '';
    var prog = Gestor.progreso(pr.id);

    /* El avance del flujo no es un veredicto de salud: se pinta con el acento */
    return '<div class="arbol-grupo arbol-proyecto">' +
      '<div class="arbol-titulo" title="' + Render.escapar(pr.nombre) + '">' + Render.escapar(pr.nombre) + '</div>' +
      '<div class="arbol-avance">' + UI.barra(prog.porcentaje) +
        '<span>' + prog.completados + '/' + prog.aplicables + '</span></div>' +
      VistasObra.pestanas.map(function (t) {
        return enlace('#/proyectos/' + pr.id + '/' + t.id, '', t.nombre, t.id);
      }).join('') + '</div>';
  }

  function enlace(ruta, numero, etiqueta, icono, clase) {
    return '<a class="arbol-enlace' + (clase ? ' ' + clase : '') + '" href="' + ruta + '" data-ruta="' + ruta + '" ' +
      'data-busca="' + Render.escapar(Indice.normalizar(numero + ' ' + etiqueta)) + '">' +
      (icono && window.Iconos ? Iconos.svg(icono) : '') +
      (numero ? '<span class="num">' + numero + '</span>' : '') +
      '<span>' + Render.escapar(etiqueta) + '</span></a>';
  }

  /* Activo: la coincidencia exacta o, si no la hay, el prefijo más largo.
     Así «Flujo de procesos» sigue marcado dentro de la ficha de un proceso. */
  function marcarActivo() {
    var actual = location.hash || '#/panel';
    var enlaces = arbol.querySelectorAll('.arbol-enlace');
    var mejor = null, largo = -1;

    for (var i = 0; i < enlaces.length; i++) {
      enlaces[i].classList.remove('activo');
      enlaces[i].removeAttribute('aria-current');
      var r = enlaces[i].getAttribute('data-ruta');
      var coincide = actual === r || actual.indexOf(r + '/') === 0;
      if (coincide && r.length > largo) { mejor = enlaces[i]; largo = r.length; }
    }

    /* Rutas de un proyecto que no son una pestaña: la raíz y la ficha de un
       proceso pertenecen al flujo; la ficha de un documento, a Documentos. */
    var m = actual.match(/^#\/proyectos\/([^\/]+)(?:\/(proceso|documento)\/.*)?$/);
    if (m) {
      var pestana = m[2] === 'documento' ? 'documentos' : 'flujo';
      var destino = arbol.querySelector('[data-ruta="#/proyectos/' + m[1] + '/' + pestana + '"]');
      if (destino) mejor = destino;
    }

    if (!mejor) return;
    mejor.classList.add('activo');
    mejor.setAttribute('aria-current', 'page');

    var rect = mejor.getBoundingClientRect();
    var caja = arbol.getBoundingClientRect();
    if (rect.top < caja.top || rect.bottom > caja.bottom) {
      /* Solo se desplaza el índice: scrollIntoView arrastraría la ventana */
      arbol.scrollTop += (rect.top - caja.top) - (caja.height / 2) + (rect.height / 2);
    }
  }

  function aplicarFiltroArbol() {
    var campo = document.getElementById('filtro-arbol');
    if (!campo || !campo.value) return;
    filtrarArbol(campo.value);
  }

  function filtrarArbol(texto) {
    var q = Indice.normalizar(texto);
    var enlaces = arbol.querySelectorAll('.arbol-enlace');
    for (var i = 0; i < enlaces.length; i++) {
      enlaces[i].hidden = q && enlaces[i].getAttribute('data-busca').indexOf(q) === -1;
    }
    var grupos = arbol.querySelectorAll('.arbol-grupo');
    for (var j = 0; j < grupos.length; j++) {
      grupos[j].hidden = grupos[j].querySelectorAll('.arbol-enlace:not([hidden])').length === 0;
    }
  }

  /* ══════════════ Filtro del catálogo de procesos ══════════════ */

  function conectarFiltroProcesos() {
    var texto = document.getElementById('filtro-procesos');
    var dom = document.getElementById('filtro-dominio');
    var area = document.getElementById('filtro-area');
    var conteo = document.getElementById('conteo-procesos');
    var vacio = document.getElementById('sin-procesos');
    if (!texto) return;

    function aplicar() {
      var q = Indice.normalizar(texto.value);
      var d = dom.value, a = area.value, visibles = 0;
      var items = document.querySelectorAll('.item-proceso');
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        var ok = (!d || it.getAttribute('data-dominio') === d) &&
                 (!a || it.getAttribute('data-area') === a) &&
                 (!q || it.getAttribute('data-texto').indexOf(q) !== -1);
        it.hidden = !ok;
        if (ok) visibles++;
      }
      conteo.textContent = visibles + (visibles === 1 ? ' proceso' : ' procesos');
      vacio.hidden = visibles > 0;
    }

    texto.addEventListener('input', aplicar);
    dom.addEventListener('change', aplicar);
    area.addEventListener('change', aplicar);
  }

  /* ══════════════ Identidad en la cabecera ══════════════ */

  function pintarUsuario() {
    var caja = document.getElementById('usuario-cabecera');
    if (!caja) return;
    var u = Gestor.usuarioActual();
    if (!u) { caja.innerHTML = ''; caja.hidden = true; return; }

    var rol = Gestor.roles.filter(function (r) { return r.id === u.rol; })[0];
    var servidor = Gestor.enServidor();
    caja.hidden = false;
    caja.innerHTML =
      (servidor ? '<span class="g-sincro" id="estado-sincro" role="status" aria-live="polite"></span>' : '') +
      '<span class="g-avatar" aria-hidden="true">' + Render.escapar(UI.iniciales(u.nombre)) + '</span>' +
      '<span class="g-usuario-datos"><b>' + Render.escapar(u.nombre) + '</b>' +
      '<em>' + Render.escapar(rol ? rol.nombre : u.rol) + '</em></span>' +
      '<button class="btn-icono" id="btn-salir" title="Cerrar sesión" aria-label="Cerrar sesión">' +
      Iconos.svg('salir') + '</button>';
    if (window.Remoto && Remoto.pendientes()) pintarSincro(Remoto.pendientes());

    document.getElementById('btn-salir').addEventListener('click', function () {
      Dialogo.confirmar({
        titulo: 'Cerrar sesión',
        texto: servidor
          ? 'Tu trabajo está guardado en el servidor. Podrás volver a entrar con tu correo desde cualquier navegador de este equipo.'
          : 'Tu trabajo ya está guardado en este navegador. Podrás volver a entrar con tu correo.',
        confirmar: 'Cerrar sesión'
      }, function () {
        var hecho = function () { location.hash = '#/entrar'; resolver(); };
        if (window.Remoto && servidor) Remoto.esperar().then(Gestor.salir).then(hecho, hecho);
        else { Gestor.salir(); hecho(); }
      });
    });
  }

  /* «Guardando…» mientras quedan cambios camino del servidor */
  var temporizadorSincro = null;
  function pintarSincro(pendientes) {
    var el = document.getElementById('estado-sincro');
    if (!el) return;
    clearTimeout(temporizadorSincro);
    if (pendientes > 0) {
      el.textContent = 'Guardando…';
      el.className = 'g-sincro activo';
    } else {
      el.textContent = 'Guardado';
      el.className = 'g-sincro hecho';
      temporizadorSincro = setTimeout(function () { el.className = 'g-sincro'; el.textContent = ''; }, 1600);
    }
  }

  /* ══════════════ Lateral en móvil ══════════════ */

  function abrirLateral() {
    lateral.classList.add('abierto');
    velo.hidden = false;
    document.getElementById('btn-menu').setAttribute('aria-expanded', 'true');
  }

  function cerrarLateral() {
    lateral.classList.remove('abierto');
    velo.hidden = true;
    var b = document.getElementById('btn-menu');
    if (b) b.setAttribute('aria-expanded', 'false');
  }

  /* ══════════════ Arranque ══════════════ */

  function iniciar() {
    Buscador.iniciar();

    document.getElementById('btn-tema').addEventListener('click', function () {
      if (window.Efectos) Efectos.alternarTema(Almacen.alternarTema);
      else Almacen.alternarTema();
    });

    document.getElementById('btn-menu').addEventListener('click', function () {
      lateral.classList.contains('abierto') ? cerrarLateral() : abrirLateral();
    });
    velo.addEventListener('click', cerrarLateral);

    document.getElementById('filtro-arbol').addEventListener('input', function () {
      filtrarArbol(this.value);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lateral.classList.contains('abierto')) cerrarLateral();
    });

    /* Con backend, primero se detecta el servidor y se carga lo visible */
    contenido.innerHTML = '<div class="hoja"><p class="g-cargando">Cargando…</p></div>';
    Gestor.alCambiar(resolver);
    if (window.Remoto) Remoto.alCambiarEstado(pintarSincro);
    Gestor.iniciar().then(function (modo) {
      document.documentElement.setAttribute('data-modo', modo);
      window.addEventListener('hashchange', resolver);
      resolver();
    }, function (err) {
      if (window.console) console.error(err);
      window.addEventListener('hashchange', resolver);
      resolver();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
