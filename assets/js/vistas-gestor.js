/* ═══════════════════════════════════════════════════════════
   vistas-gestor.js — La capa de gestión: qué hace cada clic
   ───────────────────────────────────────────────────────────
   Conecta los botones «data-g» de la gestión con su acción y
   reúne bajo un solo nombre las pantallas, que viven en
   gestion/: GestionAcceso, GestionPanel, GestionPortafolios,
   GestionAgenda, GestionEos, GestionAdmin, GestionSupervision,
   GestionNotas y GestionAprender.
   ═══════════════════════════════════════════════════════════ */

window.VistasGestor = (function () {
  'use strict';

  var R = window.Render;
  var recargar = function () {};

  /* ══════════════ Interacción ══════════════ */

  function conectar(vista, arg, recargarVista) {
    recargar = recargarVista || function () {};

    var botones = document.querySelectorAll('[data-g]');
    for (var i = 0; i < botones.length; i++) botones[i].addEventListener('click', manejar);

    if (vista === 'entrar') {
      var clave = document.getElementById('acc-clave');
      if (clave) clave.addEventListener('keydown', function (e) { if (e.key === 'Enter') accionEntrar(); });
      var correo = document.getElementById('acc-correo');
      if (correo) correo.focus();
    }
    if (vista === 'registro') {
      var repetirReg = document.getElementById('rg-repetir');
      if (repetirReg) repetirReg.addEventListener('keydown', function (e) { if (e.key === 'Enter') accionRegistrarse(); });
      var nombreReg = document.getElementById('rg-nombre');
      if (nombreReg) nombreReg.focus();
    }
    if (vista === 'clave') {
      var repetir = document.getElementById('cc-repetir');
      if (repetir) repetir.addEventListener('keydown', function (e) { if (e.key === 'Enter') accionCambiarClave(); });
      var actual = document.getElementById('cc-actual');
      if (actual) actual.focus();
    }

    conectarSelectores();
    conectarFiltros();
    conectarVto();
    conectarScorecard();
  }

  /* Un «change» puede llegar disparado por el propio blur que provoca el
     repintado. Volver a pintar dentro de ese evento rompe el innerHTML en
     curso, así que se aplaza un tick. */
  function recargarDiferido() { setTimeout(function () { recargar(); }, 0); }

  function conectarSelectores() {
    var mover = document.querySelectorAll('[data-mover]');
    for (var i = 0; i < mover.length; i++) {
      mover[i].addEventListener('change', function () {
        Gestor.actualizar('proyectos', this.getAttribute('data-mover'), { portafolioId: this.value || null });
        recargarDiferido();
      });
    }
    var estados = document.querySelectorAll('[data-estado-roca]');
    for (var j = 0; j < estados.length; j++) {
      estados[j].addEventListener('change', function () {
        Gestor.actualizar('rocas', this.getAttribute('data-estado-roca'), { estado: this.value });
        recargarDiferido();
      });
    }
    var opciones = document.querySelectorAll('[data-opcion]');
    for (var k = 0; k < opciones.length; k++) {
      opciones[k].addEventListener('click', function () {
        var grupo = this.getAttribute('data-opcion');
        var caja = document.querySelector('[data-opciones="' + grupo + '"]');
        var todos = caja.querySelectorAll('.g-opcion');
        for (var n = 0; n < todos.length; n++) todos[n].classList.remove('activa');
        this.classList.add('activa');
        document.getElementById('val-' + grupo).value = this.getAttribute('data-valor');
      });
    }
  }

  function conectarFiltros() {
    [['filtro-herramientas', '.item-herramienta', 'conteo-herramientas'],
     ['filtro-artefactos', '.item-artefacto', null]].forEach(function (par) {
      var campo = document.getElementById(par[0]);
      if (!campo) return;
      campo.addEventListener('input', function () {
        var q = Indice.normalizar(campo.value);
        var items = document.querySelectorAll(par[1]);
        var visibles = 0;
        for (var i = 0; i < items.length; i++) {
          var ok = !q || items[i].getAttribute('data-texto').indexOf(q) !== -1;
          items[i].hidden = !ok;
          if (ok) visibles++;
        }
        if (par[2]) {
          var c = document.getElementById(par[2]);
          if (c) c.textContent = visibles + ' de ' + items.length;
        }
        var titulos = document.querySelectorAll('.prosa h2');
        for (var j = 0; j < titulos.length; j++) {
          var sig = titulos[j].nextElementSibling;
          if (sig && sig.classList.contains('g-catalogo')) {
            var quedan = sig.querySelectorAll('.g-ficha:not([hidden])').length;
            titulos[j].hidden = quedan === 0;
            sig.hidden = quedan === 0;
          }
        }
      });
    });
  }

  function conectarVto() {
    var areas = document.querySelectorAll('[data-vto]');
    for (var i = 0; i < areas.length; i++) {
      areas[i].addEventListener('blur', function () {
        Gestor.fijarVto(this.getAttribute('data-vto'), this.value);
        this.parentNode.classList.toggle('lleno', !!this.value.trim());
      });
    }
  }

  function conectarScorecard() {
    var celdas = document.querySelectorAll('[data-metrica]');
    for (var i = 0; i < celdas.length; i++) {
      celdas[i].addEventListener('change', function () {
        var m = Gestor.uno('metricas', this.getAttribute('data-metrica'));
        if (!m) return;
        if (!m.valores) m.valores = {};
        var s = this.getAttribute('data-semana');
        if (String(this.value).trim()) m.valores[s] = this.value.trim();
        else delete m.valores[s];
        Gestor.actualizar('metricas', m.id, { valores: m.valores });
        recargarDiferido();
      });
    }
  }

  function error(id, mensaje) {
    var caja = document.getElementById(id);
    if (caja) caja.innerHTML = '<div class="nota alerta"><div class="nota-titulo">No se pudo continuar</div>' +
      R.escapar(mensaje) + '</div>';
  }

  /* Deshabilita el botón mientras una acción espera al servidor */
  function ocupado(selector, si) {
    var b = document.querySelector(selector);
    if (b) { b.disabled = si; b.setAttribute('aria-busy', si ? 'true' : 'false'); }
  }

  function accionEntrar() {
    ocupado('[data-g="entrar"]', true);
    /* En modo local el resultado llega al instante; en modo servidor, en una promesa */
    Promise.resolve(Gestor.entrar(UI.valorDe('acc-correo'), UI.valorDe('acc-clave'))).then(function (r) {
      ocupado('[data-g="entrar"]', false);
      if (r.error) { error('g-error-acceso', r.error); return; }
      location.hash = r.clavePendiente ? '#/clave' : '#/panel';
      recargar();
    });
  }

  function accionRegistrarse() {
    var clave = UI.valorDe('rg-clave');
    if (clave !== UI.valorDe('rg-repetir')) { error('g-error-registro', 'Las dos contraseñas no coinciden.'); return; }
    ocupado('[data-g="registrarse"]', true);
    Promise.resolve(Gestor.registrar({
      nombre: UI.valorDe('rg-nombre'), correo: UI.valorDe('rg-correo'), clave: clave
    })).then(function (r) {
      ocupado('[data-g="registrarse"]', false);
      if (r.error) { error('g-error-registro', r.error); return; }
      location.hash = '#/panel';
      recargar();
      Dialogo.avisar('Cuenta creada. Te damos la bienvenida, ' + String(r.usuario.nombre || '').split(' ')[0]);
    });
  }

  /* Entrar al equipo de un proyecto con el código que da su líder */
  function accionUnirse() {
    Dialogo.pedir({
      titulo: 'Unirme a un proyecto',
      texto: 'Escribe el código de invitación que te dio el líder de tu grupo.',
      campos: [{ id: 'codigo', etiqueta: 'Código de invitación', placeholder: 'ABCD-2345' }],
      confirmar: 'Unirme'
    }, function (v) {
      if (!String(v.codigo || '').trim()) return;
      Promise.resolve(Gestor.unirseConCodigo(v.codigo)).then(function (r) {
        if (r.error) { Dialogo.avisar(r.error, 'error'); return; }
        var rol = Gestor.rolesProyecto.filter(function (x) { return x.id === r.rol; })[0];
        Dialogo.avisar(r.yaEraMiembro
          ? 'Ya formabas parte de «' + r.proyecto.nombre + '»'
          : 'Te uniste a «' + r.proyecto.nombre + '» como ' + (rol ? rol.nombre : r.rol));
        location.hash = '#/proyectos/' + r.proyecto.id;
        recargar();
      });
    });
  }

  function accionCambiarClave() {
    var actual = UI.valorDe('cc-actual');
    var nueva = UI.valorDe('cc-nueva');
    if (nueva !== UI.valorDe('cc-repetir')) { error('g-error-clave', 'Las dos contraseñas nuevas no coinciden.'); return; }
    ocupado('[data-g="cambiar-clave"]', true);
    Gestor.cambiarPropiaClave(actual, nueva).then(function (r) {
      ocupado('[data-g="cambiar-clave"]', false);
      if (r.error) { error('g-error-clave', r.error); return; }
      location.hash = '#/panel';
      recargar();
      Dialogo.avisar('Contraseña actualizada');
    });
  }

  function accionLlevarAlServidor() {
    var d = Gestor.datosDelNavegador();
    if (!d) return;
    Dialogo.confirmar({
      titulo: 'Llevar los datos del navegador al servidor',
      texto: 'Se <b>reemplazan todos los datos del servidor</b> por los ' + d.proyectos + ' proyecto(s) de este navegador, ' +
        'y se suben sus ' + d.archivos + ' archivo(s). Si alguien más usa el servidor, exporta antes una copia.',
      confirmar: 'Reemplazar y llevar', peligro: true
    }, function () {
      var caja = document.getElementById('g-migracion-estado');
      ocupado('[data-g="llevar-al-servidor"]', true);
      Gestor.llevarNavegadorAlServidor(function (texto) {
        if (caja) caja.innerHTML = '<p class="g-cargando">' + R.escapar(texto) + '</p>';
      }).then(function (r) {
        if (r.error) {
          ocupado('[data-g="llevar-al-servidor"]', false);
          if (caja) caja.innerHTML = '';
          Dialogo.avisar('No se pudo llevar al servidor: ' + r.error, 'error');
          return;
        }
        var importados = Object.keys(r.importados || {}).reduce(function (n, k) { return n + r.importados[k]; }, 0);
        var lineas = ['<b>' + importados + '</b> registros importados y <b>' + r.archivosSubidos + '</b> archivo(s) subidos.']
          .concat(r.avisos || [])
          .concat((r.archivosFallidos || []).map(function (f) { return 'No se subió ' + f; }));
        Dialogo.informar({
          titulo: 'Datos llevados al servidor',
          texto: lineas.map(function (l, i) { return i ? R.escapar(l) : l; }).join('<br>')
        });
        recargar();
      });
    });
  }

  function alternar(id, mostrar) {
    var e = document.getElementById(id);
    if (e) e.hidden = mostrar === undefined ? !e.hidden : !mostrar;
    return e;
  }

  /* Cada botón «data-g» nombra aquí su acción. Cada una recibe el propio
     botón y sus atributos «data-id» y «data-valor». */
  var ACCIONES = {
    /* Sesión */
    'entrar': accionEntrar,
    'registrarse': accionRegistrarse,
    'unirse-proyecto': accionUnirse,
    'cambiar-clave': accionCambiarClave,
    'llevar-al-servidor': accionLlevarAlServidor,
    'acceso-demo': accesoDemo,
    'salir': salir,

    /* Proyectos */
    'abrir-nuevo-proyecto': abrirNuevoProyecto,
    'cerrar-nuevo-proyecto': function () { alternar('g-nuevo-proyecto', false); },
    'crear-proyecto': crearProyecto,

    /* Portafolios y programas */
    'abrir-nuevo-portafolio': function () { alternar('g-nuevo-portafolio', true); },
    'cerrar-nuevo-portafolio': function () { alternar('g-nuevo-portafolio', false); },
    'crear-portafolio': crearPortafolio,
    'borrar-portafolio': borrarPortafolio,
    'borrar-proyecto': borrarProyecto,
    'nuevo-programa': nuevoPrograma,

    /* EOS · rocas */
    'trimestre': elegirTrimestre,
    'abrir-nueva-roca': function () { alternar('g-nueva-roca', true); },
    'cerrar-nueva-roca': function () { alternar('g-nueva-roca', false); },
    'crear-roca': crearRoca,
    'borrar-roca': borrarRoca,
    'meta-roca': alternarMetaRoca,

    /* EOS · scorecard */
    'abrir-nueva-metrica': function () { alternar('g-nueva-metrica', true); },
    'cerrar-nueva-metrica': function () { alternar('g-nueva-metrica', false); },
    'crear-metrica': crearMetrica,
    'borrar-metrica': borrarMetrica,

    /* EOS · organigrama */
    'abrir-asiento': abrirAsiento,
    'cerrar-asiento': function () { alternar('g-nuevo-asiento', false); },
    'crear-asiento': crearAsiento,
    'borrar-asiento': borrarAsiento,

    /* Administración · cuentas */
    'abrir-nuevo-usuario': function () { alternar('g-nuevo-usuario', true); },
    'cerrar-nuevo-usuario': function () { alternar('g-nuevo-usuario', false); },
    'crear-usuario': crearUsuario,
    'alternar-usuario': alternarUsuario,
    'clave': cambiarClaveDeCuenta,

    /* Administración · permisos */
    'permisos': abrirPermisos,
    'cerrar-permisos': function () { document.getElementById('g-panel-permisos').innerHTML = ''; },
    'conceder': conceder,
    'revocar': revocar,

    /* Administración · datos */
    'exportar-bd': exportarCopia,
    'reiniciar-bd': borrarTodosLosDatos
  };

  function manejar(e) {
    e.preventDefault();
    var el = e.currentTarget;
    var accion = ACCIONES[el.getAttribute('data-g')];
    if (accion) accion(el, el.getAttribute('data-id'), el.getAttribute('data-valor'));
  }

  /* ── Sesión ── */

  function accesoDemo() {
    document.getElementById('acc-correo').value = 'admin@pmbok.local';
    document.getElementById('acc-clave').value = 'admin123';
    accionEntrar();
  }

  function salir() {
    Promise.resolve(Gestor.salir()).then(function () {
      location.hash = '#/entrar';
      recargar();
    });
  }

  /* ── Proyectos ── */

  function abrirNuevoProyecto() {
    var form = alternar('g-nuevo-proyecto', true);
    var nombre = document.getElementById('np-nombre');
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (nombre) setTimeout(function () { nombre.focus(); }, 60);
  }

  function crearProyecto() {
    ocupado('[data-g="crear-proyecto"]', true);
    var pendiente = Gestor.crearProyecto({
      nombre: UI.valorDe('np-nombre'),
      descripcion: UI.valorDe('np-descripcion'),
      metodologia: UI.valorDe('val-metodologia'),
      portafolioId: UI.valorDe('np-portafolio') || null,
      rocaId: UI.valorDe('np-roca') || null,
      inicio: UI.valorDe('np-inicio'),
      fin: UI.valorDe('np-fin'),
      presupuesto: UI.numeroDe('np-presupuesto', null)
    });
    Promise.resolve(pendiente).then(function (r) {
      ocupado('[data-g="crear-proyecto"]', false);
      if (r.error) { error('g-error-proyecto', r.error); return; }
      location.hash = '#/proyectos/' + r.proyecto.id;
      Dialogo.avisar('Proyecto creado. Empieza por 2.1.1 Iniciar el Proyecto o Fase', 'ok', {
        etiqueta: 'Abrir 2.1.1',
        hacer: function () { location.hash = '#/proyectos/' + r.proyecto.id + '/proceso/p-gob-01'; }
      });
    });
  }

  /* ── Portafolios y programas ── */

  function crearPortafolio() {
    var nombre = UI.valorDe('npf-nombre');
    if (!nombre.trim()) return;
    Gestor.crear('portafolios', { nombre: nombre.trim(), descripcion: UI.valorDe('npf-descripcion') });
    recargar();
  }

  function borrarPortafolio(el, id) {
    var pf = Gestor.uno('portafolios', id);
    var afectados = Gestor.lista('proyectos', { portafolioId: id }).length;
    Dialogo.confirmar({
      titulo: 'Eliminar «' + (pf ? pf.nombre : 'portafolio') + '»',
      texto: afectados
        ? 'Sus ' + afectados + ' proyecto' + (afectados === 1 ? '' : 's') + ' no se borran: quedan sin portafolio.'
        : 'El portafolio está vacío.',
      confirmar: 'Eliminar portafolio', peligro: true
    }, function () {
      Gestor.borrarPortafolio(id);
      Dialogo.avisar('Portafolio eliminado');
      recargar();
    });
  }

  /* Borrar arrastra documentos, archivos, riesgos, tareas y mediciones: se
     exige escribir ELIMINAR, igual que desde la pestaña Equipo del proyecto. */
  function borrarProyecto(el, id) {
    var pr = Gestor.proyecto(id);
    if (!pr) return;
    Dialogo.pedir({
      titulo: 'Eliminar «' + pr.nombre + '»',
      texto: 'Se eliminan sus documentos, archivos, riesgos, tareas y mediciones. No se puede deshacer. ' +
        'Escribe <b>ELIMINAR</b> para confirmar.',
      campos: [{ id: 'confirma', etiqueta: 'Confirmación', placeholder: 'ELIMINAR' }],
      confirmar: 'Eliminar proyecto'
    }, function (v) {
      if (String(v.confirma).trim().toUpperCase() !== 'ELIMINAR') {
        Dialogo.avisar('No se eliminó: la confirmación no coincide', 'aviso');
        return;
      }
      Gestor.borrarProyecto(id);
      Dialogo.avisar('Proyecto eliminado');
      recargar();
    });
  }

  function nuevoPrograma(el, id) {
    Dialogo.pedir({
      titulo: 'Nuevo programa',
      texto: 'Un programa agrupa proyectos relacionados cuyos beneficios se gestionan juntos.',
      campos: [{ id: 'nombre', etiqueta: 'Nombre del programa', placeholder: 'Ej.: Modernización de nómina' }],
      confirmar: 'Crear programa'
    }, function (v) {
      if (!v.nombre.trim()) return;
      Gestor.crear('programas', { portafolioId: id, nombre: v.nombre.trim() });
      Dialogo.avisar('Programa creado');
      recargar();
    });
  }

  /* ── EOS · rocas ── */

  function elegirTrimestre(el, id, val) {
    VistasGestor.trimestreElegido = val;
    recargar();
  }

  function crearRoca() {
    var titulo = UI.valorDe('nr-titulo');
    if (!titulo.trim()) return;
    Gestor.crear('rocas', {
      trimestre: VistasGestor.trimestreElegido || GestionEos.trimestreActual(),
      titulo: titulo.trim(),
      descripcion: UI.valorDe('nr-descripcion'),
      responsableId: UI.valorDe('nr-responsable'),
      estado: UI.valorDe('nr-estado'),
      metas: UI.valorDe('nr-metas').split('\n').filter(function (x) { return x.trim(); })
        .map(function (x) { return { texto: x.trim(), hecho: false }; })
    });
    recargar();
  }

  function borrarRoca(el, id) {
    Dialogo.confirmar({
      titulo: 'Eliminar esta roca',
      texto: 'Los proyectos vinculados no se borran, solo pierden el vínculo con ella.',
      confirmar: 'Eliminar roca', peligro: true
    }, function () { Gestor.borrar('rocas', id); Dialogo.avisar('Roca eliminada'); recargar(); });
  }

  function alternarMetaRoca(el, id) {
    var roca = Gestor.uno('rocas', id);
    var i = parseInt(el.getAttribute('data-i'), 10);
    if (roca && roca.metas && roca.metas[i]) {
      roca.metas[i].hecho = !roca.metas[i].hecho;
      Gestor.actualizar('rocas', id, { metas: roca.metas });
      recargar();
    }
  }

  /* ── EOS · scorecard ── */

  function crearMetrica() {
    var nombre = UI.valorDe('nm-nombre');
    if (!nombre.trim()) return;
    Gestor.crear('metricas', {
      nombre: nombre.trim(), meta: UI.valorDe('nm-meta'),
      responsableId: UI.valorDe('nm-responsable'),
      direccion: UI.valorDe('nm-direccion'), valores: {}
    });
    recargar();
  }

  function borrarMetrica(el, id) {
    Dialogo.confirmar({
      titulo: 'Eliminar la métrica',
      texto: 'Se pierden también sus 13 semanas de historial.',
      confirmar: 'Eliminar métrica', peligro: true
    }, function () { Gestor.borrar('metricas', id); Dialogo.avisar('Métrica eliminada'); recargar(); });
  }

  /* ── EOS · organigrama ── */

  function abrirAsiento(el) {
    alternar('g-nuevo-asiento', true);
    document.getElementById('na-padre').value = el.getAttribute('data-padre') || '';
  }

  function crearAsiento() {
    var nombre = UI.valorDe('na-nombre');
    if (!nombre.trim()) return;
    Gestor.crear('asientos', {
      nombre: nombre.trim(), gwt: UI.valorDe('na-gwt'),
      personaId: UI.valorDe('na-persona') || null,
      padreId: UI.valorDe('na-padre') || null
    });
    recargar();
  }

  function borrarAsiento(el, id) {
    Dialogo.confirmar({
      titulo: 'Eliminar el asiento',
      texto: 'También se eliminan los asientos que dependen de él.',
      confirmar: 'Eliminar asiento', peligro: true
    }, function () {
      (function borrarRama(padre) {
        Gestor.asientosHijos(padre).forEach(function (a) { borrarRama(a.id); Gestor.borrar('asientos', a.id); });
      })(id);
      Gestor.borrar('asientos', id);
      Dialogo.avisar('Asiento eliminado');
      recargar();
    });
  }

  /* ── Administración · cuentas ── */

  function crearUsuario() {
    var r = Gestor.crearUsuario({
      nombre: UI.valorDe('nu-nombre'), correo: UI.valorDe('nu-correo'),
      clave: UI.valorDe('nu-clave'), rol: UI.valorDe('nu-rol')
    });
    if (r.error) { error('g-error-usuario', r.error); return; }
    recargar();
  }

  function alternarUsuario(el, id) {
    var u = Gestor.uno('usuarios', id);
    if (u) { Gestor.actualizar('usuarios', id, { activo: !u.activo }); recargar(); }
  }

  function cambiarClaveDeCuenta(el, id) {
    var cuenta = Gestor.uno('usuarios', id);
    Dialogo.pedir({
      titulo: 'Cambiar contraseña',
      texto: cuenta ? 'Cuenta de ' + Render.escapar(cuenta.nombre) + '.' : '',
      campos: [{ id: 'clave', etiqueta: 'Nueva contraseña', tipo: 'password', ayuda: 'Mínimo 6 caracteres' }],
      confirmar: 'Cambiar contraseña'
    }, function (v) {
      var r = Gestor.cambiarClave(id, v.clave);
      Dialogo.avisar(r.error || 'Contraseña actualizada', r.error ? 'error' : 'ok');
    });
  }

  /* ── Administración · permisos ── */

  function abrirPermisos(el, id) {
    document.getElementById('g-panel-permisos').innerHTML = GestionAdmin.panelPermisos(id);
    conectar('admin', '', recargar);
    document.getElementById('g-permisos-abierto').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function conceder() {
    var partes = UI.valorDe('perm-ambito').split(':');
    Gestor.conceder(UI.valorDe('perm-usuario'), partes[0], partes[1], UI.valorDe('perm-nivel'));
    var abierto = UI.valorDe('perm-usuario');
    recargar();
    setTimeout(function () {
      var caja = document.getElementById('g-panel-permisos');
      if (caja) { caja.innerHTML = GestionAdmin.panelPermisos(abierto); conectar('admin', '', recargar); }
    }, 30);
  }

  function revocar(el, id) {
    Gestor.revocar(id);
    recargar();
  }

  /* ── Administración · datos ── */

  function exportarCopia() {
    Promise.resolve(Gestor.exportarTodo()).then(function (datos) {
      descargar('pmbok8-gestor.json', JSON.stringify(datos, null, 2));
    }, function (err) { Dialogo.avisar('No se pudo exportar: ' + err.message, 'error'); });
  }

  function borrarTodosLosDatos() {
    Dialogo.confirmar({
      titulo: 'Borrar todos los datos',
      texto: 'Se eliminan <b>todos</b> los proyectos, documentos, usuarios y datos de gerencia ' +
        (Gestor.enServidor() ? 'del servidor' : 'de este navegador') + '. ' +
        'No se puede deshacer: exporta antes si quieres conservarlos.',
      confirmar: 'Borrar todo', peligro: true
    }, function () {
      Promise.resolve(Gestor.reiniciarTodo()).then(function (r) {
        if (r && r.error) { Dialogo.avisar(r.error, 'error'); return; }
        location.hash = '#/entrar';
        recargar();
      });
    });
  }

  function descargar(nombre, contenido) {
    try {
      var blob = new Blob([contenido], { type: 'application/json;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = nombre;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    } catch (err) { Dialogo.avisar('No se pudo descargar el archivo', 'error'); }
  }

  /* Importación desde el input de administración */
  function conectarImportacion(recargarVista) {
    var imp = document.getElementById('g-importar');
    if (!imp) return;
    imp.addEventListener('change', function () {
      var f = imp.files && imp.files[0];
      if (!f) return;
      var fr = new FileReader();
      fr.onload = function () {
        var datos;
        try { datos = JSON.parse(String(fr.result)); }
        catch (e) { Dialogo.avisar('El archivo no es un JSON válido', 'error'); return; }
        Promise.resolve(Gestor.importarTodo(datos)).then(function (r) {
          Dialogo.avisar(r.error || 'Datos importados', r.error ? 'error' : 'ok');
          if (r.avisos && r.avisos.length) {
            Dialogo.informar({ titulo: 'Importación terminada', texto: r.avisos.map(R.escapar).join('<br>') });
          }
          if (!r.error) recargarVista();
        });
        imp.value = '';
      };
      fr.readAsText(f, 'utf-8');
    });
  }

  /* La administración tiene dos pantallas bajo la misma ruta y el mismo
     candado: las cuentas y la supervisión de rocas. */
  function admin(seccion, id) {
    if (seccion === 'rocas') return GestionSupervision.supervision(id);
    if (seccion === 'notas') return GestionNotas.notas();
    return GestionAdmin.admin();
  }

  /* El enrutador pide las pantallas por aquí; cada una la pinta su módulo */
  return {
    entrar: GestionAcceso.entrar,
    registro: GestionAcceso.registro,
    cambiarClave: GestionAcceso.cambiarClave,
    panel: GestionPanel.panel,
    portafolios: GestionPortafolios.portafolios,
    agenda: GestionAgenda.agenda,
    eos: GestionEos.eos,
    admin: admin,
    aprender: GestionAprender.aprender,
    herramientas: GestionAprender.herramientas,
    artefactos: GestionAprender.artefactos,
    conectar: conectar,
    conectarImportacion: conectarImportacion,
    trimestreElegido: null
  };
})();
