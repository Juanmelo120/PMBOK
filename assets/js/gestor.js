/* ═══════════════════════════════════════════════════════════
   gestor.js — Base de datos del gestor de proyectos
   ───────────────────────────────────────────────────────────
   Usuarios y sesión, portafolios y programas, proyectos con sus
   40 procesos, documentos, riesgos, interesados, cambios,
   lecciones, tareas, sprints, mediciones de valor ganado y la
   capa EOS de gerencia.

   Dos modos, con la misma interfaz síncrona para las pantallas:
   · LOCAL (index.html con doble clic o sin backend): todo vive en
     localStorage. El control de acceso es organizativo: separa
     espacios de trabajo entre compañeros, no protege secretos.
   · SERVIDOR (servido por backend/ con PostgreSQL): al entrar se
     carga en memoria lo que el usuario puede ver (GET /api/estado);
     cada cambio se aplica al instante en esa copia y se envía a la
     API en orden (remoto.js). Si la API lo rechaza, se avisa y se
     recarga el estado real. La base del navegador no se toca, para
     poder llevarla al servidor desde Administración.
   ═══════════════════════════════════════════════════════════ */

window.Gestor = (function () {
  'use strict';

  var CLAVE = 'pmbok8.bd';
  var bd = null;
  var modo = 'local';
  var clavePendiente = false;
  var alCambiar = function () {};

  var COLECCIONES = [
    'usuarios', 'permisos', 'portafolios', 'programas', 'proyectos', 'miembros',
    'procesos', 'documentos', 'archivos', 'riesgos', 'interesados', 'cambios',
    'lecciones', 'tareas', 'sprints', 'mediciones', 'comentarios', 'invitaciones',
    'rocas', 'metricas', 'asientos'
  ];

  function enServidor() { return modo === 'servidor'; }

  /* ══════════════ Persistencia ══════════════ */

  function vacia() {
    var b = { version: 1, creada: Date.now(), vto: {}, sesion: null };
    COLECCIONES.forEach(function (c) { b[c] = []; });
    return b;
  }

  function cargar() {
    if (bd) return bd;
    if (enServidor()) { bd = vacia(); return bd; }
    try {
      var crudo = localStorage.getItem(CLAVE);
      bd = crudo ? JSON.parse(crudo) : null;
    } catch (e) { bd = null; }
    if (!bd) { bd = vacia(); sembrar(); }
    COLECCIONES.forEach(function (c) { if (!bd[c]) bd[c] = []; });
    if (!bd.vto) bd.vto = {};
    return bd;
  }

  function guardar() {
    if (enServidor()) return true;
    try {
      localStorage.setItem(CLAVE, JSON.stringify(bd));
      return true;
    } catch (e) {
      return false;
    }
  }

  function reiniciarTodo() {
    if (enServidor()) {
      return Remoto.esperar()
        .then(function () { return Api.pedir('POST', '/datos/reiniciar', { confirmacion: 'ELIMINAR' }); })
        .then(function (r) {
          if (!r.sesionConservada) { olvidarSesion(); return { ok: true }; }
          return hidratarOClavePendiente().then(function () { return { ok: true }; });
        }, function (err) { return { error: err.message }; });
    }
    bd = vacia();
    sembrar();
    guardar();
    return { ok: true };
  }

  /* ══════════════ Utilidades ══════════════ */

  var contador = 0;
  function nuevoId(prefijo) {
    contador++;
    return (prefijo || 'x') + '-' + Date.now().toString(36) + '-' + contador.toString(36) +
      Math.random().toString(36).slice(2, 6);
  }

  /* Huella de la contraseña en modo local. No es criptografía: evita
     guardarla en claro, nada más. En modo servidor se usa bcrypt. */
  function huella(texto) {
    var h = 5381;
    var s = String(texto || '');
    for (var i = 0; i < s.length; i++) {
      h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    }
    return 'h' + h.toString(36);
  }

  function ahora() { return Date.now(); }

  function copia(obj) { return JSON.parse(JSON.stringify(obj)); }

  /* ══════════════ Modo servidor: carga y sincronización ══════════════ */

  /* Rutas REST de las colecciones que se sincronizan con crear/actualizar/borrar */
  var RUTA_PROYECTO = ['miembros', 'riesgos', 'interesados', 'cambios', 'lecciones',
                       'tareas', 'sprints', 'mediciones', 'comentarios'];
  var RUTA_GLOBAL = ['portafolios', 'rocas', 'metricas', 'asientos'];
  var RUTA_ITEM = RUTA_PROYECTO.concat(RUTA_GLOBAL,
    ['programas', 'documentos', 'archivos', 'usuarios', 'permisos', 'proyectos', 'invitaciones']);
  /* Campos calculados que la API añade a sus respuestas y no se guardan */
  var CALCULADOS = ['severidad', 'sprintCerrado', 'progreso', 'siguiente', 'completitud', 'plantilla'];

  function iniciar() {
    if (!window.Api) return Promise.resolve('local');
    return Api.detectar().then(function (hay) {
      if (!hay) { modo = 'local'; return 'local'; }
      modo = 'servidor';
      bd = vacia();
      Remoto.alError(errorRemoto);
      var listo = Api.token()
        ? hidratarOClavePendiente().catch(function () { olvidarSesion(); })
        : Promise.resolve();
      return listo.then(function () {
        Api.alCaducar(sesionInvalida);
        return 'servidor';
      });
    });
  }

  function hidratar() {
    return Api.pedir('GET', '/estado', undefined, { silencioso: true }).then(function (s) {
      var nueva = vacia();
      COLECCIONES.forEach(function (c) { nueva[c] = Array.isArray(s[c]) ? s[c] : []; });
      nueva.vto = s.vto || {};
      nueva.sesion = { usuarioId: s.usuario.id, desde: ahora() };
      bd = nueva;
      clavePendiente = false;
      return s;
    });
  }

  /* Una cuenta con la contraseña pendiente de cambio solo puede ver su
     perfil: se consulta antes y el estado completo se carga solo si no hay
     cambio pendiente (usuarioConocido evita repetir la consulta tras entrar) */
  function hidratarOClavePendiente(usuarioConocido) {
    var perfil = usuarioConocido
      ? Promise.resolve(usuarioConocido)
      : Api.pedir('GET', '/auth/yo', undefined, { silencioso: true }).then(function (r) { return r.usuario; });
    return perfil.then(function (u) {
      if (!u.debeCambiarClave) return hidratar();
      bd = vacia();
      bd.usuarios = [u];
      bd.sesion = { usuarioId: u.id, desde: ahora() };
      clavePendiente = true;
    });
  }

  function olvidarSesion() {
    Api.fijarToken(null);
    bd = vacia();
    clavePendiente = false;
  }

  function sesionInvalida(err) {
    if (err.codigo === 'CLAVE_PENDIENTE') {
      if (!clavePendiente) hidratarOClavePendiente().then(avisarCambio, avisarCambio);
      return;
    }
    if (!haySesion()) return;
    olvidarSesion();
    if (window.Dialogo) Dialogo.avisar('Tu sesión terminó. Vuelve a entrar.', 'aviso');
    location.hash = '#/entrar';
    avisarCambio();
  }

  var rehidratando = null;
  function errorRemoto(err, descripcion) {
    if (err.estado === 401 || err.codigo === 'CLAVE_PENDIENTE') return;
    if (window.Dialogo) {
      Dialogo.avisar('No se guardó' + (descripcion ? ' «' + descripcion + '»' : '') + ': ' + err.message, 'error');
    }
    /* La copia en memoria ya no coincide con el servidor: se recarga */
    if (rehidratando) return;
    rehidratando = Remoto.esperar()
      .then(hidratar)
      .then(avisarCambio, function () {})
      .then(function () { rehidratando = null; });
  }

  function avisarCambio() {
    try { alCambiar(); } catch (e) { if (window.console) console.error(e); }
  }

  function etiqueta(obj) {
    return obj && (obj.nombre || obj.titulo || obj.situacion || obj.texto) || '';
  }

  /* Tras la respuesta, la copia local adopta los valores del servidor */
  function adoptar(coleccion, id) {
    return function (respuesta) {
      if (!respuesta || typeof respuesta !== 'object' || Array.isArray(respuesta)) return;
      var obj = uno(coleccion, id);
      if (!obj) return;
      Object.keys(respuesta).forEach(function (k) {
        if (CALCULADOS.indexOf(k) === -1) obj[k] = respuesta[k];
      });
    };
  }

  function rutaItem(coleccion, id) {
    if (RUTA_ITEM.indexOf(coleccion) === -1) return null;
    return '/' + coleccion + '/' + Api.c(id);
  }

  function remotoCrear(coleccion, obj) {
    var ruta = null;
    if (RUTA_PROYECTO.indexOf(coleccion) !== -1) ruta = '/proyectos/' + Api.c(obj.proyectoId) + '/' + coleccion;
    else if (RUTA_GLOBAL.indexOf(coleccion) !== -1) ruta = '/' + coleccion;
    else if (coleccion === 'programas') ruta = '/portafolios/' + Api.c(obj.portafolioId) + '/programas';
    if (!ruta) {
      if (window.console) console.warn('Gestor: «' + coleccion + '» no se crea con la ruta genérica');
      return;
    }
    Remoto.enviar({
      metodo: 'POST', ruta: ruta, cuerpo: copia(obj),
      descripcion: etiqueta(obj), despues: adoptar(coleccion, obj.id)
    });
  }

  function remotoActualizar(coleccion, id, cambios) {
    var ruta = rutaItem(coleccion, id);
    if (!ruta) {
      if (window.console) console.warn('Gestor: «' + coleccion + '» no se actualiza con la ruta genérica');
      return;
    }
    Remoto.enviar({
      metodo: 'PATCH', ruta: ruta, cuerpo: copia(cambios), clave: 'PATCH ' + ruta, fusion: 'mezclar',
      descripcion: etiqueta(uno(coleccion, id)), despues: adoptar(coleccion, id)
    });
  }

  function remotoBorrar(coleccion, id, descripcion) {
    var ruta = rutaItem(coleccion, id);
    if (!ruta) return;
    Remoto.enviar({ metodo: 'DELETE', ruta: ruta, descripcion: descripcion });
  }

  /* ══════════════ CRUD genérico ══════════════ */

  function lista(coleccion, filtro) {
    var datos = cargar()[coleccion] || [];
    if (!filtro) return datos.slice();
    return datos.filter(function (x) {
      return Object.keys(filtro).every(function (k) { return x[k] === filtro[k]; });
    });
  }

  function uno(coleccion, id) {
    var datos = cargar()[coleccion] || [];
    for (var i = 0; i < datos.length; i++) if (datos[i].id === id) return datos[i];
    return null;
  }

  /* Las versiones «Local» solo tocan la copia en memoria: las usan las
     operaciones compuestas, que hablan con su propia ruta de la API. */
  function crearLocal(coleccion, datos) {
    var b = cargar();
    var obj = datos || {};
    obj.id = obj.id || nuevoId(coleccion.slice(0, 3));
    obj.creado = obj.creado || ahora();
    b[coleccion].push(obj);
    guardar();
    return obj;
  }

  function actualizarLocal(coleccion, id, cambios) {
    var obj = uno(coleccion, id);
    if (!obj) return null;
    Object.keys(cambios || {}).forEach(function (k) { obj[k] = cambios[k]; });
    obj.actualizado = ahora();
    guardar();
    return obj;
  }

  function borrarLocal(coleccion, id) {
    var b = cargar();
    var antes = b[coleccion].length;
    b[coleccion] = b[coleccion].filter(function (x) { return x.id !== id; });
    guardar();
    return b[coleccion].length < antes;
  }

  function crear(coleccion, datos) {
    var obj = crearLocal(coleccion, datos);
    if (enServidor()) remotoCrear(coleccion, obj);
    return obj;
  }

  function actualizar(coleccion, id, cambios) {
    var obj = actualizarLocal(coleccion, id, cambios);
    if (obj && enServidor()) remotoActualizar(coleccion, id, cambios);
    return obj;
  }

  function borrar(coleccion, id) {
    var previo = uno(coleccion, id);
    var hecho = borrarLocal(coleccion, id);
    if (hecho && enServidor()) remotoBorrar(coleccion, id, etiqueta(previo));
    return hecho;
  }

  /* Añade a la copia en memoria algo que ya existe en el servidor */
  function anotar(coleccion, obj) {
    cargar()[coleccion].push(obj);
    return obj;
  }

  /* ══════════════ Semilla inicial ══════════════ */

  function sembrar() {
    bd.usuarios.push({
      id: 'u-admin',
      nombre: 'Administrador',
      correo: 'admin@pmbok.local',
      clave: huella('admin123'),
      rol: 'admin',
      activo: true,
      creado: ahora()
    });
  }

  /* ══════════════ Sesión y usuarios ══════════════ */

  /* En modo servidor devuelve una promesa: { usuario, clavePendiente } o { error } */
  function entrar(correo, clave) {
    if (enServidor()) {
      return Api.pedir('POST', '/auth/entrar', { correo: correo, clave: clave })
        .then(function (r) {
          Api.fijarToken(r.token);
          return hidratarOClavePendiente(r.usuario).then(function () {
            return { usuario: r.usuario, clavePendiente: clavePendiente };
          });
        })
        .catch(function (err) { return { error: err.message }; });
    }
    var b = cargar();
    var u = b.usuarios.filter(function (x) {
      return x.correo.toLowerCase() === String(correo || '').trim().toLowerCase();
    })[0];
    if (!u) return { error: 'No existe ninguna cuenta con ese correo.' };
    if (!u.activo) return { error: 'La cuenta está desactivada. Pide a un administrador que la reactive.' };
    if (u.clave !== huella(clave)) return { error: 'La contraseña no coincide.' };
    b.sesion = { usuarioId: u.id, desde: ahora() };
    guardar();
    return { usuario: u };
  }

  function salir() {
    if (enServidor()) {
      var t = Api.token();
      var cierre = t ? Api.pedir('POST', '/auth/salir').catch(function () {}) : Promise.resolve();
      olvidarSesion();
      return cierre;
    }
    var b = cargar();
    b.sesion = null;
    guardar();
  }

  function usuarioActual() {
    var b = cargar();
    if (!b.sesion) return null;
    return uno('usuarios', b.sesion.usuarioId);
  }

  function haySesion() {
    if (enServidor() && (clavePendiente || !Api.token())) return false;
    return !!usuarioActual();
  }

  function esAdmin() {
    var u = usuarioActual();
    return !!u && u.rol === 'admin';
  }

  /* Crear proyectos y cambiar la estructura (portafolios, programas, EOS) */
  function puedeGestionar() {
    var u = usuarioActual();
    return !!u && (u.rol === 'admin' || u.rol === 'director');
  }

  function crearUsuario(datos) {
    var correo = String(datos.correo || '').trim().toLowerCase();
    if (!correo) return { error: 'Falta el correo.' };
    if (lista('usuarios').some(function (u) { return u.correo.toLowerCase() === correo; })) {
      return { error: 'Ya existe una cuenta con ese correo.' };
    }
    if (!datos.clave || datos.clave.length < 6) {
      return { error: 'La contraseña debe tener al menos 6 caracteres.' };
    }
    if (enServidor()) {
      var u = crearLocal('usuarios', {
        nombre: datos.nombre || correo, correo: correo,
        rol: datos.rol || 'miembro', activo: true, debeCambiarClave: true
      });
      Remoto.enviar({
        metodo: 'POST', ruta: '/usuarios', descripcion: u.nombre,
        cuerpo: { id: u.id, nombre: u.nombre, correo: correo, clave: datos.clave, rol: u.rol },
        despues: adoptar('usuarios', u.id)
      });
      return { usuario: u };
    }
    var nuevo = crear('usuarios', {
      nombre: datos.nombre || correo,
      correo: correo,
      clave: huella(datos.clave),
      rol: datos.rol || 'miembro',
      activo: true
    });
    return { usuario: nuevo };
  }

  /* ── Registro propio ──
     Cada persona crea su cuenta con el rol de registro (director por defecto:
     crea su proyecto y añade a sus compañeros). Nunca administrador. */
  function registroAbierto() {
    if (!enServidor()) return true;
    var s = Api.salud();
    return !s || s.registroAbierto !== false;
  }

  function registroRol() {
    var s = enServidor() ? Api.salud() : null;
    return (s && s.registroRol) || 'director';
  }

  /* datos: { nombre?, correo, clave }. Local: resultado inmediato; servidor: promesa */
  function registrar(datos) {
    var nombre = String(datos.nombre || '').trim();
    var correo = String(datos.correo || '').trim().toLowerCase();
    var clave = String(datos.clave || '');
    if (!/^[^@\s]+@[^@\s]+$/.test(correo)) return resultado({ error: 'Escribe un correo válido.' });
    if (clave.length < 6) return resultado({ error: 'La contraseña debe tener al menos 6 caracteres.' });

    if (enServidor()) {
      return Api.pedir('POST', '/auth/registrar', { nombre: nombre, correo: correo, clave: clave })
        .then(function (r) {
          Api.fijarToken(r.token);
          return hidratarOClavePendiente(r.usuario).then(function () { return { usuario: r.usuario }; });
        })
        .catch(function (err) { return { error: err.message }; });
    }
    if (!registroAbierto()) return { error: 'El registro está cerrado.' };
    if (lista('usuarios').some(function (u) { return u.correo.toLowerCase() === correo; })) {
      return { error: 'Ya existe una cuenta con ese correo. Entra con tu contraseña.' };
    }
    var u = crear('usuarios', {
      nombre: nombre || correo.split('@')[0], correo: correo, clave: huella(clave),
      rol: registroRol(), activo: true, origen: 'registro'
    });
    cargar().sesion = { usuarioId: u.id, desde: ahora() };
    guardar();
    return { usuario: u };
  }

  function cambiarClave(usuarioId, nueva) {
    if (!nueva || nueva.length < 6) return { error: 'La contraseña debe tener al menos 6 caracteres.' };
    if (enServidor()) {
      var propia = (usuarioActual() || {}).id === usuarioId;
      Remoto.enviar({
        metodo: 'PUT', ruta: '/usuarios/' + Api.c(usuarioId) + '/clave', cuerpo: { clave: nueva },
        descripcion: 'contraseña',
        despues: function () { actualizarLocal('usuarios', usuarioId, { debeCambiarClave: !propia }); }
      });
      return { ok: true };
    }
    actualizar('usuarios', usuarioId, { clave: huella(nueva) });
    return { ok: true };
  }

  /* La del propio usuario, conociendo la actual. Devuelve una promesa. */
  function cambiarPropiaClave(actual, nueva) {
    if (!nueva || nueva.length < 6) return Promise.resolve({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    if (actual === nueva) return Promise.resolve({ error: 'La nueva contraseña debe ser distinta de la actual.' });
    if (enServidor()) {
      return Api.pedir('PUT', '/auth/clave', { actual: actual, nueva: nueva })
        .then(function () { return hidratar(); })
        .then(function () { return { ok: true }; }, function (err) { return { error: err.message }; });
    }
    var u = usuarioActual();
    if (!u || u.clave !== huella(actual)) return Promise.resolve({ error: 'La contraseña actual no coincide.' });
    actualizar('usuarios', u.id, { clave: huella(nueva) });
    return Promise.resolve({ ok: true });
  }

  var ROLES = [
    { id: 'admin', nombre: 'Administrador', descripcion: 'Ve y edita todo; gestiona usuarios y permisos.' },
    { id: 'director', nombre: 'Director de proyecto', descripcion: 'Crea y dirige proyectos propios.' },
    { id: 'miembro', nombre: 'Miembro de equipo', descripcion: 'Trabaja en los proyectos donde se le asigna.' },
    { id: 'ejecutor', nombre: 'Ejecutor', descripcion: 'Ve sus tareas y comenta; no edita planes.' }
  ];

  /* ══════════════ Permisos ══════════════ */

  var NIVELES = { ver: 1, editar: 2, dirigir: 3 };

  function permisosDe(usuarioId) {
    return lista('permisos', { usuarioId: usuarioId });
  }

  function conceder(usuarioId, ambito, refId, nivel) {
    var existente = lista('permisos').filter(function (p) {
      return p.usuarioId === usuarioId && p.ambito === ambito && p.refId === refId;
    })[0];
    var perm = existente
      ? actualizarLocal('permisos', existente.id, { nivel: nivel })
      : crearLocal('permisos', { usuarioId: usuarioId, ambito: ambito, refId: refId, nivel: nivel });
    if (enServidor()) {
      Remoto.enviar({
        metodo: 'POST', ruta: '/permisos', descripcion: 'permiso',
        cuerpo: { id: perm.id, usuarioId: usuarioId, ambito: ambito, refId: refId, nivel: nivel },
        despues: adoptar('permisos', perm.id)
      });
    }
    return perm;
  }

  function revocar(permisoId) { return borrar('permisos', permisoId); }

  /* Nivel efectivo del usuario sobre un proyecto */
  function nivelEn(proyectoId, usuarioId) {
    var actual = usuarioActual();
    var u = usuarioId ? uno('usuarios', usuarioId) : actual;
    if (!u) return 0;
    if (u.rol === 'admin') return NIVELES.dirigir;

    var p = uno('proyectos', proyectoId);
    if (!p) return 0;
    /* En modo servidor, el nivel propio lo calcula la base de datos */
    if (enServidor() && actual && u.id === actual.id && typeof p.nivel === 'number') return p.nivel;
    if (p.directorId === u.id) return NIVELES.dirigir;

    var max = 0;
    permisosDe(u.id).forEach(function (perm) {
      var aplica =
        (perm.ambito === 'proyecto' && perm.refId === proyectoId) ||
        (perm.ambito === 'programa' && perm.refId === p.programaId) ||
        (perm.ambito === 'portafolio' && perm.refId === p.portafolioId);
      if (aplica) max = Math.max(max, NIVELES[perm.nivel] || 0);
    });

    var m = lista('miembros', { proyectoId: proyectoId }).filter(function (x) { return x.usuarioId === u.id; })[0];
    if (m) max = Math.max(max, nivelDeRol(m.rol));

    return max;
  }

  function puede(proyectoId, nivel) {
    return nivelEn(proyectoId) >= (NIVELES[nivel] || 1);
  }

  /* Proyectos visibles para el usuario actual */
  function proyectosVisibles() {
    var u = usuarioActual();
    if (!u) return [];
    /* El servidor ya solo envía los visibles */
    if (u.rol === 'admin' || enServidor()) return lista('proyectos');
    return lista('proyectos').filter(function (p) { return nivelEn(p.id) > 0; });
  }

  /* ══════════════ Equipo: roles e invitaciones ══════════════ */

  /* Rol dentro de un proyecto → nivel. Igual que nivel_en() en la base. */
  var ROLES_PROYECTO = [
    { id: 'lider', nombre: 'Líder de proyecto', nivel: 'dirigir' },
    { id: 'po', nombre: 'Product Owner', nivel: 'editar' },
    { id: 'sm', nombre: 'Scrum Master', nivel: 'editar' },
    { id: 'equipo', nombre: 'Equipo de desarrollo', nivel: 'editar' },
    { id: 'ejecutor', nombre: 'Ejecutor', nivel: 'editar' },
    { id: 'observador', nombre: 'Observador', nivel: 'ver' }
  ];

  function nivelDeRol(rol) {
    var r = ROLES_PROYECTO.filter(function (x) { return x.id === rol; })[0];
    return NIVELES[r ? r.nivel : 'editar'];
  }

  /* Sin 0/O ni 1/I, como el servidor */
  var ALFABETO_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  function nuevoCodigo() {
    var bytes = new Uint8Array(8);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(bytes);
    else for (var i = 0; i < 8; i++) bytes[i] = Math.floor(Math.random() * 256);
    var s = '';
    for (var j = 0; j < 8; j++) s += ALFABETO_CODIGO[bytes[j] % ALFABETO_CODIGO.length];
    return s;
  }

  /* «abcd-2345» → «ABCD2345» */
  function normalizarCodigo(texto) {
    return String(texto || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  function codigoLegible(codigo) {
    return codigo ? codigo.slice(0, 4) + '-' + codigo.slice(4) : '';
  }

  function invitacionesDe(proyectoId) {
    return lista('invitaciones', { proyectoId: proyectoId }).sort(function (a, b) { return b.creado - a.creado; });
  }

  function invitacionVigente(inv) {
    return !inv.expira || inv.expira > ahora();
  }

  /* opciones: { rol, dias }. El código se genera aquí para mostrarlo sin esperar. */
  function crearInvitacion(proyectoId, opciones) {
    if (!puede(proyectoId, 'dirigir')) return { error: 'Solo el líder del proyecto puede invitar.' };
    var rol = (opciones && opciones.rol) || 'equipo';
    if (rol === 'lider') return { error: 'Un código no puede dar el rol de líder.' };
    var dias = opciones && opciones.dias ? Number(opciones.dias) : null;
    var inv = crearLocal('invitaciones', {
      proyectoId: proyectoId, codigo: nuevoCodigo(), rol: rol,
      expira: dias ? ahora() + dias * 86400000 : null,
      usos: 0, creadoPor: (usuarioActual() || {}).id || null
    });
    if (enServidor()) {
      Remoto.enviar({
        metodo: 'POST', ruta: '/proyectos/' + Api.c(proyectoId) + '/invitaciones', descripcion: 'código de invitación',
        cuerpo: { id: inv.id, codigo: inv.codigo, rol: rol, dias: dias, creado: inv.creado },
        despues: adoptar('invitaciones', inv.id)
      });
    }
    return { invitacion: inv };
  }

  function borrarInvitacion(id) { return borrar('invitaciones', id); }

  /* Entrar a un equipo con un código. Local: resultado; servidor: promesa.
     { proyecto: { id, nombre }, rol, nivel, yaEraMiembro } o { error } */
  function unirseConCodigo(texto) {
    var codigo = normalizarCodigo(texto);
    if (!/^[A-HJ-NP-Z2-9]{8}$/.test(codigo)) {
      return resultado({ error: 'El código tiene 8 letras y números, por ejemplo ABCD-2345.' });
    }
    var u = usuarioActual();
    if (!u) return resultado({ error: 'No hay sesión iniciada.' });

    if (enServidor()) {
      return Remoto.esperar()
        .then(function () { return Api.pedir('POST', '/invitaciones/unirse', { codigo: codigo }); })
        .then(function (r) { return hidratar().then(function () { return r; }); })
        .catch(function (err) { return { error: err.message }; });
    }

    var inv = lista('invitaciones').filter(function (x) { return x.codigo === codigo; })[0];
    var p = inv && uno('proyectos', inv.proyectoId);
    if (!inv || !p) return { error: 'Ese código no existe. Revísalo con el líder de tu proyecto.' };
    if (!invitacionVigente(inv)) return { error: 'El código caducó. Pide al líder de tu proyecto uno nuevo.' };

    var previo = lista('miembros', { proyectoId: p.id }).filter(function (m) { return m.usuarioId === u.id; })[0];
    if (!previo) {
      crear('miembros', { proyectoId: p.id, usuarioId: u.id, rol: inv.rol });
      actualizarLocal('invitaciones', inv.id, { usos: (inv.usos || 0) + 1 });
    }
    return {
      proyecto: { id: p.id, nombre: p.nombre },
      rol: previo ? previo.rol : inv.rol,
      nivel: nivelEn(p.id),
      yaEraMiembro: !!previo
    };
  }

  /* ══════════════ Proyectos ══════════════ */

  function metodologia(id) {
    return (PMBOK.metodologias || []).filter(function (m) { return m.id === id; })[0] ||
           (PMBOK.metodologias || [])[0];
  }

  /* En modo servidor devuelve una promesa con { proyecto } o { error } */
  function crearProyecto(datos) {
    var u = usuarioActual();
    if (!u) return resultado({ error: 'No hay sesión iniciada.' });
    if (!datos.nombre || !datos.nombre.trim()) return resultado({ error: 'El proyecto necesita un nombre.' });
    if (!puedeGestionar()) return resultado({ error: 'Tu rol no permite crear proyectos. Pídeselo a un director o administrador.' });

    var met = metodologia(datos.metodologia || 'predictivo');

    if (enServidor()) {
      var id = nuevoId('pro');
      var cuerpo = {
        id: id, nombre: datos.nombre.trim(), descripcion: datos.descripcion || '', metodologia: met.id,
        portafolioId: datos.portafolioId || null, rocaId: datos.rocaId || null,
        inicio: datos.inicio || null, fin: datos.fin || null,
        presupuesto: datos.presupuesto === '' || datos.presupuesto == null ? null : datos.presupuesto,
        moneda: datos.moneda || 'USD'
      };
      if (datos.programaId) cuerpo.programaId = datos.programaId;
      return Remoto.enCola(function () { return Api.pedir('POST', '/proyectos', cuerpo); })
        .then(function (p) {
          return Promise.all([
            Api.pedir('GET', '/proyectos/' + Api.c(id) + '/miembros'),
            Api.pedir('GET', '/proyectos/' + Api.c(id) + '/sprints')
          ]).then(function (r) {
            delete p.progreso;
            var b = cargar();
            b.proyectos.push(p);
            r[0].forEach(function (m) { b.miembros.push(m); });
            r[1].forEach(function (s) { b.sprints.push(s); });
            return { proyecto: p };
          });
        })
        .catch(function (err) { return { error: err.message }; });
    }

    var p = crear('proyectos', {
      nombre: datos.nombre.trim(),
      descripcion: datos.descripcion || '',
      metodologia: met.id,
      portafolioId: datos.portafolioId || null,
      programaId: datos.programaId || null,
      rocaId: datos.rocaId || null,
      inicio: datos.inicio || null,
      fin: datos.fin || null,
      presupuesto: datos.presupuesto ? Number(datos.presupuesto) : null,
      moneda: datos.moneda || 'USD',
      estado: 'activo',
      directorId: u.id,
      fases: met.fases.map(function (f, i) { return { id: nuevoId('fase'), nombre: f, orden: i + 1 }; }),
      orden: {}
    });

    crear('miembros', { proyectoId: p.id, usuarioId: u.id, rol: 'lider' });

    if (met.id === 'agil' || met.id === 'hibrido') {
      crear('sprints', {
        proyectoId: p.id, nombre: 'Sprint 0 — Preparación',
        objetivo: 'Preparar el entorno, el backlog inicial y los acuerdos de trabajo.',
        dias: 14, estado: 'activo', comprometido: 0, entregado: 0
      });
    }
    return { proyecto: p };
  }

  /* Las operaciones que en modo servidor esperan a la API devuelven promesa;
     en modo local, el valor directo (como siempre) */
  function resultado(valor) {
    return enServidor() ? Promise.resolve(valor) : valor;
  }

  function proyecto(id) { return uno('proyectos', id); }

  var HIJAS_PROYECTO = ['procesos', 'documentos', 'archivos', 'riesgos', 'interesados', 'cambios', 'lecciones',
    'tareas', 'sprints', 'mediciones', 'comentarios', 'miembros', 'invitaciones'];

  function borrarProyecto(id) {
    var previo = proyecto(id);
    HIJAS_PROYECTO.forEach(function (c) {
      var b = cargar();
      b[c] = b[c].filter(function (x) { return x.proyectoId !== id; });
    });
    borrarLocal('proyectos', id);
    guardar();
    if (enServidor()) remotoBorrar('proyectos', id, etiqueta(previo));
  }

  /* Al borrar un portafolio sus proyectos quedan sin portafolio y sus
     programas desaparecen (el servidor hace lo mismo en cascada) */
  function borrarPortafolio(id) {
    var previo = uno('portafolios', id);
    var programas = lista('programas', { portafolioId: id }).map(function (x) { return x.id; });
    lista('proyectos').forEach(function (p) {
      if (p.portafolioId === id) p.portafolioId = null;
      if (programas.indexOf(p.programaId) !== -1) p.programaId = null;
    });
    programas.forEach(function (pid) { borrarLocal('programas', pid); });
    borrarLocal('portafolios', id);
    if (enServidor()) remotoBorrar('portafolios', id, etiqueta(previo));
  }

  /* ── Estado de los 40 procesos ─────────────────────────── */

  function estadoProceso(proyectoId, procesoId) {
    var e = lista('procesos', { proyectoId: proyectoId }).filter(function (x) {
      return x.procesoId === procesoId;
    })[0];
    return e || { proyectoId: proyectoId, procesoId: procesoId, estado: 'pendiente', notas: '' };
  }

  function fijarEstadoProceso(proyectoId, procesoId, cambios) {
    var e = lista('procesos', { proyectoId: proyectoId }).filter(function (x) {
      return x.procesoId === procesoId;
    })[0];
    var resultadoLocal;
    if (e) {
      resultadoLocal = actualizarLocal('procesos', e.id, cambios);
    } else {
      var base = { proyectoId: proyectoId, procesoId: procesoId, estado: 'pendiente', notas: '' };
      Object.keys(cambios || {}).forEach(function (k) { base[k] = cambios[k]; });
      resultadoLocal = crearLocal('procesos', base);
    }
    if (enServidor()) {
      var cuerpo = {};
      if (cambios.estado !== undefined) cuerpo.estado = cambios.estado;
      if (cambios.notas !== undefined) cuerpo.notas = cambios.notas;
      var ruta = '/proyectos/' + Api.c(proyectoId) + '/procesos/' + Api.c(procesoId);
      Remoto.enviar({
        metodo: 'PUT', ruta: ruta, cuerpo: cuerpo, clave: 'PUT ' + ruta, fusion: 'mezclar',
        descripcion: 'proceso',
        despues: function (r) {
          if (r && r.fecha !== undefined) actualizarLocal('procesos', resultadoLocal.id, { fecha: r.fecha });
        }
      });
    }
    return resultadoLocal;
  }

  /* Banda efectiva: la del flujo, salvo que el proyecto la haya movido */
  function bandaDe(proyectoId, procesoId) {
    var p = proyecto(proyectoId);
    var f = PMBOK.flujoPorId[procesoId];
    if (p && p.orden && p.orden[procesoId]) return p.orden[procesoId];
    return f ? f.banda : 'planificacion';
  }

  function moverProceso(proyectoId, procesoId, banda) {
    var p = proyecto(proyectoId);
    if (!p) return;
    if (!p.orden) p.orden = {};
    p.orden[procesoId] = banda;
    actualizarLocal('proyectos', proyectoId, { orden: p.orden });
    if (enServidor()) {
      Remoto.enviar({
        metodo: 'PUT', ruta: '/proyectos/' + Api.c(proyectoId) + '/procesos/' + Api.c(procesoId) + '/banda',
        cuerpo: { banda: banda }, descripcion: 'orden del flujo'
      });
    }
  }

  function procesosDeBanda(proyectoId, banda) {
    return (PMBOK.flujo || [])
      .filter(function (f) { return bandaDe(proyectoId, f.id) === banda; })
      .sort(function (a, b) { return a.orden - b.orden; });
  }

  function esIterativo(proyectoId, procesoId) {
    var p = proyecto(proyectoId);
    if (!p) return false;
    var met = metodologia(p.metodologia);
    return (met.iterativos || []).indexOf(procesoId) !== -1;
  }

  /* El primer proceso que falta, en el orden del ciclo de vida del proyecto.
     Es la respuesta a «¿y ahora qué hago?», que es lo que más se pregunta. */
  function siguienteProceso(proyectoId) {
    var ordenBanda = { inicio: 1, planificacion: 2, ejecucion: 3, monitoreo: 4, cierre: 5 };
    var pendientes = (PMBOK.flujo || []).filter(function (f) {
      var e = estadoProceso(proyectoId, f.id).estado;
      return e !== 'completado' && e !== 'omitido';
    }).sort(function (a, b) {
      var ba = ordenBanda[bandaDe(proyectoId, a.id)] || 9;
      var bb = ordenBanda[bandaDe(proyectoId, b.id)] || 9;
      /* Lo que ya está en curso va antes que lo que no se ha empezado */
      var ea = estadoProceso(proyectoId, a.id).estado === 'iniciado' ? 0 : 1;
      var eb = estadoProceso(proyectoId, b.id).estado === 'iniciado' ? 0 : 1;
      return (ea - eb) || (ba - bb) || (a.orden - b.orden);
    });
    return pendientes[0] || null;
  }

  function progreso(proyectoId) {
    var estados = lista('procesos', { proyectoId: proyectoId });
    var completados = estados.filter(function (e) { return e.estado === 'completado'; }).length;
    var omitidos = estados.filter(function (e) { return e.estado === 'omitido'; }).length;
    var total = (PMBOK.flujo || []).length;
    var aplicables = total - omitidos;
    return {
      completados: completados,
      omitidos: omitidos,
      total: total,
      aplicables: aplicables,
      porcentaje: aplicables ? Math.round((completados / aplicables) * 100) : 0
    };
  }

  /* ══════════════ Documentos ══════════════ */

  function artefacto(id) {
    return (PMBOK.artefactos || []).filter(function (a) { return a.id === id; })[0] || null;
  }

  function documentosDe(proyectoId) {
    return lista('documentos', { proyectoId: proyectoId }).sort(function (a, b) {
      return (b.actualizado || b.creado) - (a.actualizado || a.creado);
    });
  }

  function documentoDe(proyectoId, artefactoId) {
    return lista('documentos', { proyectoId: proyectoId }).filter(function (d) {
      return d.artefactoId === artefactoId;
    })[0] || null;
  }

  function generarDocumento(proyectoId, artefactoId, procesoId) {
    var art = artefacto(artefactoId);
    if (!art) return { error: 'Ese artefacto no existe.' };
    var existente = documentoDe(proyectoId, artefactoId);
    if (existente) return { documento: existente, yaExistia: true };

    var doc = crearLocal('documentos', {
      proyectoId: proyectoId,
      artefactoId: artefactoId,
      nombre: art.nombre,
      categoria: art.categoria,
      version: 1,
      estado: 'borrador',
      procesoId: procesoId || null,
      contenido: {},
      autorId: (usuarioActual() || {}).id || null
    });
    if (enServidor()) {
      Remoto.enviar({
        metodo: 'POST', ruta: '/proyectos/' + Api.c(proyectoId) + '/documentos', descripcion: art.nombre,
        cuerpo: { id: doc.id, artefactoId: artefactoId, procesoId: procesoId || null },
        despues: function (r) {
          /* Otra persona lo generó a la vez: vale el suyo */
          if (!r || !r.documento) return;
          if (r.documento.id !== doc.id) {
            errorRemoto(new Error('el documento ya existía y se ha recargado'), art.nombre);
            return;
          }
          var recibido = copia(r.documento);
          delete recibido.descripcion;   /* es la del artefacto, no un campo del documento */
          adoptar('documentos', doc.id)(recibido);
        }
      });
    }
    return { documento: doc };
  }

  function guardarBloque(documentoId, indice, valor) {
    var d = uno('documentos', documentoId);
    if (!d) return false;
    if (!d.contenido) d.contenido = {};
    d.contenido[indice] = valor;
    actualizarLocal('documentos', documentoId, { contenido: d.contenido });
    if (enServidor()) {
      var ruta = '/documentos/' + Api.c(documentoId) + '/bloques/' + Api.c(indice);
      Remoto.enviar({
        metodo: 'PUT', ruta: ruta, cuerpo: { valor: valor }, clave: 'PUT ' + ruta,
        descripcion: d.nombre
      });
    }
    return true;
  }

  function cambiarEstadoDocumento(documentoId, estado) {
    var d = uno('documentos', documentoId);
    if (!d) return null;
    var cambios = { estado: estado };
    if (estado === 'aprobado') cambios.aprobado = ahora();
    var r = actualizarLocal('documentos', documentoId, cambios);
    if (enServidor()) {
      Remoto.enviar({
        metodo: 'PATCH', ruta: '/documentos/' + Api.c(documentoId), cuerpo: { estado: estado },
        descripcion: d.nombre, despues: adoptar('documentos', documentoId)
      });
    }
    return r;
  }

  function nuevaVersion(documentoId) {
    var d = uno('documentos', documentoId);
    if (!d) return null;
    var r = actualizarLocal('documentos', documentoId, { version: (d.version || 1) + 1, estado: 'borrador' });
    if (enServidor()) {
      Remoto.enviar({
        metodo: 'POST', ruta: '/documentos/' + Api.c(documentoId) + '/versiones',
        descripcion: d.nombre, despues: adoptar('documentos', documentoId)
      });
    }
    return r;
  }

  /* Cuántos bloques de la plantilla están rellenados */
  function completitudDocumento(doc) {
    var art = artefacto(doc.artefactoId);
    if (!art) return 0;
    var total = art.plantilla.length;
    var llenos = art.plantilla.filter(function (b, i) {
      var v = (doc.contenido || {})[i];
      if (b.t === 'tabla') return v && v.length && v.some(function (fila) {
        return fila.some(function (c) { return String(c || '').trim(); });
      });
      return v && String(v).trim();
    }).length;
    return total ? Math.round((llenos / total) * 100) : 0;
  }

  /* Estado de cada entrada de un proceso: ¿existe ya el documento? */
  function disponibilidadEntradas(proyectoId, procesoId) {
    var f = PMBOK.flujoPorId[procesoId];
    if (!f) return [];
    return (f.entradas || []).map(function (aid) {
      var art = artefacto(aid);
      var doc = documentoDe(proyectoId, aid);
      return {
        artefactoId: aid,
        nombre: art ? art.nombre : aid,
        categoria: art ? art.categoria : '',
        documento: doc,
        disponible: !!doc
      };
    });
  }

  function salidasDe(proyectoId, procesoId) {
    var f = PMBOK.flujoPorId[procesoId];
    if (!f) return [];
    return (f.salidas || []).map(function (aid) {
      var art = artefacto(aid);
      var doc = documentoDe(proyectoId, aid);
      return {
        artefactoId: aid,
        nombre: art ? art.nombre : aid,
        categoria: art ? art.categoria : '',
        documento: doc,
        generado: !!doc
      };
    });
  }

  /* ══════════════ Valor ganado ══════════════ */

  function evm(proyectoId) {
    var ms = lista('mediciones', { proyectoId: proyectoId }).sort(function (a, b) {
      return String(a.fecha).localeCompare(String(b.fecha));
    });
    if (!ms.length) return { mediciones: [], ultima: null };

    var p = proyecto(proyectoId);
    var bac = p && p.presupuesto ? Number(p.presupuesto) : null;

    var calculadas = ms.map(function (m) {
      var pv = Number(m.pv) || 0, ev = Number(m.ev) || 0, ac = Number(m.ac) || 0;
      var cpi = ac ? ev / ac : null;
      var spi = pv ? ev / pv : null;
      return {
        id: m.id, fecha: m.fecha, pv: pv, ev: ev, ac: ac, nota: m.nota || '',
        cv: ev - ac, sv: ev - pv, cpi: cpi, spi: spi,
        eac: (cpi && bac) ? bac / cpi : null,
        etc: (cpi && bac) ? (bac - ev) / cpi : null,
        vac: (cpi && bac) ? bac - (bac / cpi) : null,
        tcpi: (bac && bac - ac) ? (bac - ev) / (bac - ac) : null
      };
    });

    return { mediciones: calculadas, ultima: calculadas[calculadas.length - 1], bac: bac };
  }

  function salud(proyectoId) {
    var e = evm(proyectoId);
    if (!e.ultima) return { estado: 'sin-datos', etiqueta: 'Sin mediciones' };
    var cpi = e.ultima.cpi, spi = e.ultima.spi;
    if (cpi === null || spi === null) return { estado: 'sin-datos', etiqueta: 'Datos incompletos' };
    if (cpi >= 0.95 && spi >= 0.95) return { estado: 'ok', etiqueta: 'Saludable', cpi: cpi, spi: spi };
    if (cpi >= 0.9 && spi >= 0.9) return { estado: 'aviso', etiqueta: 'Bajo vigilancia', cpi: cpi, spi: spi };
    return { estado: 'falla', etiqueta: 'Requiere acción', cpi: cpi, spi: spi };
  }

  /* ══════════════ Trabajo: sprints y tareas ══════════════ */

  function sprintActivo(proyectoId) {
    return lista('sprints', { proyectoId: proyectoId }).filter(function (s) {
      return s.estado === 'activo';
    })[0] || null;
  }

  function tareasDe(proyectoId, filtro) {
    var t = lista('tareas', { proyectoId: proyectoId });
    if (filtro && filtro.sprintId !== undefined) {
      t = t.filter(function (x) { return (x.sprintId || null) === filtro.sprintId; });
    }
    if (filtro && filtro.estado) {
      t = t.filter(function (x) { return x.estado === filtro.estado; });
    }
    return t.sort(function (a, b) { return (a.prioridad || 99) - (b.prioridad || 99); });
  }

  var ESTADOS_TAREA = [
    { id: 'backlog', nombre: 'Backlog' },
    { id: 'pendiente', nombre: 'Por hacer' },
    { id: 'curso', nombre: 'En curso' },
    { id: 'revision', nombre: 'En revisión' },
    { id: 'hecho', nombre: 'Hecho' }
  ];

  function cerrarSprint(sprintId) {
    var s = uno('sprints', sprintId);
    if (!s) return null;
    var tareas = tareasDe(s.proyectoId, { sprintId: sprintId });
    var entregado = tareas.filter(function (t) { return t.estado === 'hecho'; })
      .reduce(function (n, t) { return n + (Number(t.puntos) || 0); }, 0);
    actualizarLocal('sprints', sprintId, { estado: 'cerrado', entregado: entregado, cierre: ahora() });

    // Lo no terminado vuelve al backlog
    var devueltas = tareas.filter(function (t) { return t.estado !== 'hecho'; });
    devueltas.forEach(function (t) { actualizarLocal('tareas', t.id, { sprintId: null, estado: 'backlog' }); });

    if (enServidor()) {
      var pid = s.proyectoId;
      Remoto.enviar({
        metodo: 'POST', ruta: '/sprints/' + Api.c(sprintId) + '/cerrar', descripcion: s.nombre,
        despues: function (r) {
          if (r && r.sprint) adoptar('sprints', sprintId)(r.sprint);
          /* Lo que el servidor devolvió al backlog, tal cual quedó */
          return Api.pedir('GET', '/proyectos/' + Api.c(pid) + '/tareas').then(function (lista2) {
            var b = cargar();
            b.tareas = b.tareas.filter(function (t) { return t.proyectoId !== pid; }).concat(lista2);
          }, function () {});
        }
      });
    }
    return { entregado: entregado, devueltas: devueltas.length };
  }

  /* Fotografía diaria de los puntos pendientes del sprint. Es lo que permite
     dibujar un burndown real en lugar de una línea recta inventada.
     En modo servidor la API la toma sola con cada cambio de tareas;
     aquí solo se refleja en la copia en memoria. */
  function hoyISO() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function registrarBurndown(sprintId) {
    var s = uno('sprints', sprintId);
    if (!s || s.estado !== 'activo') return null;
    var tareas = lista('tareas', { proyectoId: s.proyectoId }).filter(function (t) { return t.sprintId === sprintId; });
    var comprometido = tareas.reduce(function (n, t) { return n + (Number(t.puntos) || 0); }, 0);
    var restante = tareas.filter(function (t) { return t.estado !== 'hecho'; })
      .reduce(function (n, t) { return n + (Number(t.puntos) || 0); }, 0);
    var historial = s.historial || {};
    historial[hoyISO()] = { restante: restante, comprometido: comprometido };
    if (!s.inicio) s.inicio = hoyISO();
    actualizarLocal('sprints', sprintId, { historial: historial, inicio: s.inicio });
    return historial;
  }

  function burndown(sprintId) {
    var s = uno('sprints', sprintId);
    if (!s) return null;
    var dias = Number(s.dias) || 14;
    var inicio = new Date((s.inicio || hoyISO()) + 'T12:00:00');
    var historial = s.historial || {};
    var claves = Object.keys(historial).sort();
    var comprometido = claves.length ? historial[claves[claves.length - 1]].comprometido : 0;

    var puntos = [], ideal = [], real = [];
    for (var i = 0; i <= dias; i++) {
      var d = new Date(inicio.getTime() + i * 86400000);
      var iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      puntos.push(iso);
      ideal.push(Math.round((comprometido * (1 - i / dias)) * 10) / 10);
      real.push(historial[iso] ? historial[iso].restante : null);
    }
    return { puntos: puntos, ideal: ideal, real: real, comprometido: comprometido };
  }

  function velocidad(proyectoId) {
    return lista('sprints', { proyectoId: proyectoId })
      .filter(function (s) { return s.estado === 'cerrado'; })
      .map(function (s) { return { nombre: s.nombre, entregado: Number(s.entregado) || 0 }; });
  }

  /* ══════════════ Dominios: riesgos, interesados, cambios ══════════════ */

  function matrizRiesgos(proyectoId) {
    var celdas = {};
    lista('riesgos', { proyectoId: proyectoId }).forEach(function (r) {
      var p = Number(r.p) || 1, i = Number(r.i) || 1;
      var k = p + 'x' + i;
      if (!celdas[k]) celdas[k] = [];
      celdas[k].push(r);
    });
    return celdas;
  }

  function severidad(p, i) {
    var v = (Number(p) || 0) * (Number(i) || 0);
    if (v >= 15) return { nivel: 'critico', etiqueta: 'Crítico', color: 'falla' };
    if (v >= 8) return { nivel: 'alto', etiqueta: 'Alto', color: 'aviso' };
    return { nivel: 'bajo', etiqueta: 'Bajo', color: 'ok' };
  }

  /* ══════════════ Calendario ══════════════ */

  function eventosDe(proyectoId) {
    var ev = [];
    var p = proyectoId ? proyecto(proyectoId) : null;

    function agrega(fecha, tipo, titulo, ref, extra) {
      if (!fecha) return;
      ev.push({ fecha: String(fecha).slice(0, 10), tipo: tipo, titulo: titulo, ref: ref, extra: extra || '' });
    }

    var proyectos = proyectoId ? [p].filter(Boolean) : proyectosVisibles();
    proyectos.forEach(function (pr) {
      agrega(pr.inicio, 'proyecto', 'Inicio · ' + pr.nombre, pr.id);
      agrega(pr.fin, 'proyecto', 'Fin previsto · ' + pr.nombre, pr.id);

      lista('tareas', { proyectoId: pr.id }).forEach(function (t) {
        if (t.fechaLimite) agrega(t.fechaLimite, 'tarea', t.titulo, pr.id, t.estado);
      });
      lista('sprints', { proyectoId: pr.id }).forEach(function (s) {
        if (s.inicio) agrega(s.inicio, 'sprint', 'Inicio ' + s.nombre, pr.id);
        if (s.fin) agrega(s.fin, 'sprint', 'Fin ' + s.nombre, pr.id);
      });
      lista('mediciones', { proyectoId: pr.id }).forEach(function (m) {
        agrega(m.fecha, 'evm', 'Corte de valor ganado · ' + pr.nombre, pr.id);
      });
      (pr.hitos || []).forEach(function (h) {
        agrega(h.fecha, 'hito', h.nombre, pr.id, h.critico ? 'critico' : '');
      });
    });

    return ev.sort(function (a, b) { return a.fecha.localeCompare(b.fecha); });
  }

  /* ══════════════ EOS ══════════════ */

  function rocasDe(trimestre) {
    return lista('rocas').filter(function (r) { return r.trimestre === trimestre; });
  }

  function vto(bloqueId) {
    return (cargar().vto || {})[bloqueId] || '';
  }

  function fijarVto(bloqueId, texto) {
    var b = cargar();
    if (!b.vto) b.vto = {};
    if ((b.vto[bloqueId] || '') === (texto && texto.trim() ? texto : '')) return true;
    if (texto && texto.trim()) b.vto[bloqueId] = texto;
    else delete b.vto[bloqueId];
    if (enServidor()) {
      var ruta = '/vto/' + Api.c(bloqueId);
      Remoto.enviar({ metodo: 'PUT', ruta: ruta, cuerpo: { texto: texto || '' }, clave: 'PUT ' + ruta, descripcion: 'VTO' });
      return true;
    }
    return guardar();
  }

  function asientosHijos(padreId) {
    return lista('asientos').filter(function (a) { return (a.padreId || null) === (padreId || null); });
  }

  /* ══════════════ Exportar / importar ══════════════ */

  /* En modo servidor, exportar e importar devuelven promesas */
  function exportarTodo() {
    if (enServidor()) {
      return Remoto.esperar().then(function () { return Api.pedir('GET', '/datos/exportar'); });
    }
    return exportarLocal(cargar());
  }

  function exportarLocal(base) {
    var c = copia(base);
    c.sesion = null;
    c.usuarios = (c.usuarios || []).map(function (u) {
      delete u.clave;
      return u;
    });
    c.formato = 'pmbok8-gestor';
    c.exportado = new Date().toISOString();
    return c;
  }

  function importarTodo(datos) {
    if (!datos || datos.formato !== 'pmbok8-gestor') {
      return resultado({ error: 'El archivo no es una exportación del gestor.' });
    }
    if (enServidor()) {
      return Remoto.esperar()
        .then(function () { return Api.pedir('POST', '/datos/importar', datos); })
        .then(function (r) {
          return hidratarOClavePendiente().then(function () { r.ok = true; return r; });
        })
        .catch(function (err) { return { error: err.message }; });
    }
    var actuales = cargar();
    var mapa = {};
    actuales.usuarios.forEach(function (u) { mapa[u.id] = u.clave; });

    COLECCIONES.forEach(function (c) { actuales[c] = datos[c] || []; });
    actuales.vto = datos.vto || {};
    // Las contraseñas no viajan en la exportación: se conservan las locales
    actuales.usuarios.forEach(function (u) {
      if (!u.clave) u.clave = mapa[u.id] || huella('cambiar123');
    });
    if (!actuales.usuarios.length) sembrar();
    guardar();
    return { ok: true };
  }

  /* ══════════════ Del navegador al servidor ══════════════ */

  function baseDelNavegador() {
    try {
      var crudo = localStorage.getItem(CLAVE);
      return crudo ? JSON.parse(crudo) : null;
    } catch (e) { return null; }
  }

  /* Resumen de lo guardado en este navegador, o null si no hay nada que llevar */
  function datosDelNavegador() {
    var b = baseDelNavegador();
    if (!b) return null;
    var cuenta = function (c) { return Array.isArray(b[c]) ? b[c].length : 0; };
    var r = {
      proyectos: cuenta('proyectos'), documentos: cuenta('documentos'), archivos: cuenta('archivos'),
      usuarios: cuenta('usuarios'), portafolios: cuenta('portafolios'), rocas: cuenta('rocas')
    };
    var hayAlgo = r.proyectos || r.documentos || r.portafolios || r.rocas || r.usuarios > 1;
    return hayAlgo ? r : null;
  }

  /* Reemplaza los datos del servidor por los del navegador y sube sus
     archivos. progreso(texto) informa del avance. Devuelve una promesa. */
  function llevarNavegadorAlServidor(progreso) {
    var avisar = progreso || function () {};
    var b = baseDelNavegador();
    if (!enServidor() || !b) return Promise.resolve({ error: 'No hay datos del navegador que llevar.' });
    var exportacion = exportarLocal(b);
    var archivos = (b.archivos || []).slice();

    avisar('Importando los datos…');
    return Remoto.esperar()
      .then(function () { return Api.pedir('POST', '/datos/importar', exportacion); })
      .then(function (r) {
        var subidos = 0, fallidos = [];
        var cadena = Promise.resolve();
        archivos.forEach(function (meta, i) {
          cadena = cadena.then(function () {
            avisar('Subiendo archivo ' + (i + 1) + ' de ' + archivos.length + '…');
            return Archivos.leerLocal(meta).then(function (blob) {
              var f = new FormData();
              f.append('id', meta.id);
              f.append('nombre', meta.nombre);
              f.append('categoria', meta.categoria || 'general');
              f.append('archivo', blob, meta.nombre);
              return Api.pedir('POST', '/proyectos/' + Api.c(meta.proyectoId) + '/archivos', f);
            }).then(function () { subidos++; }, function (err) {
              fallidos.push(meta.nombre + ': ' + (err && err.message ? err.message : err));
            });
          });
        });
        return cadena.then(function () {
          r.archivosSubidos = subidos;
          r.archivosFallidos = fallidos;
          return hidratarOClavePendiente().then(function () { return r; });
        });
      })
      .catch(function (err) { return { error: err.message }; });
  }

  function mostrarCuentaInicial() {
    if (enServidor()) {
      var s = Api.salud();
      return !!(s && s.primerUso);
    }
    return lista('usuarios').length === 1;
  }

  return {
    /* modo */
    iniciar: iniciar, enServidor: enServidor, hidratar: hidratar,
    clavePendiente: function () { return clavePendiente; },
    alCambiar: function (fn) { alCambiar = fn || function () {}; },
    /* persistencia */
    cargar: cargar, guardar: guardar, reiniciarTodo: reiniciarTodo, nuevoId: nuevoId,
    lista: lista, uno: uno, crear: crear, actualizar: actualizar, borrar: borrar, anotar: anotar,
    /* sesión */
    entrar: entrar, salir: salir, usuarioActual: usuarioActual, haySesion: haySesion,
    esAdmin: esAdmin, puedeGestionar: puedeGestionar, crearUsuario: crearUsuario,
    cambiarClave: cambiarClave, cambiarPropiaClave: cambiarPropiaClave, roles: ROLES,
    mostrarCuentaInicial: mostrarCuentaInicial,
    registroAbierto: registroAbierto, registroRol: registroRol, registrar: registrar,
    /* permisos */
    permisosDe: permisosDe, conceder: conceder, revocar: revocar,
    nivelEn: nivelEn, puede: puede, proyectosVisibles: proyectosVisibles,
    /* equipo */
    rolesProyecto: ROLES_PROYECTO, invitacionesDe: invitacionesDe, crearInvitacion: crearInvitacion,
    borrarInvitacion: borrarInvitacion, unirseConCodigo: unirseConCodigo,
    invitacionVigente: invitacionVigente, codigoLegible: codigoLegible,
    /* proyectos */
    crearProyecto: crearProyecto, proyecto: proyecto, borrarProyecto: borrarProyecto,
    borrarPortafolio: borrarPortafolio,
    metodologia: metodologia, progreso: progreso, siguienteProceso: siguienteProceso,
    estadoProceso: estadoProceso, fijarEstadoProceso: fijarEstadoProceso,
    bandaDe: bandaDe, moverProceso: moverProceso, procesosDeBanda: procesosDeBanda,
    esIterativo: esIterativo,
    /* documentos */
    artefacto: artefacto, documentosDe: documentosDe, documentoDe: documentoDe,
    generarDocumento: generarDocumento, guardarBloque: guardarBloque,
    cambiarEstadoDocumento: cambiarEstadoDocumento, nuevaVersion: nuevaVersion,
    completitudDocumento: completitudDocumento,
    disponibilidadEntradas: disponibilidadEntradas, salidasDe: salidasDe,
    /* control */
    evm: evm, salud: salud,
    /* trabajo */
    sprintActivo: sprintActivo, tareasDe: tareasDe, cerrarSprint: cerrarSprint,
    velocidad: velocidad, estadosTarea: ESTADOS_TAREA,
    registrarBurndown: registrarBurndown, burndown: burndown,
    /* dominios */
    matrizRiesgos: matrizRiesgos, severidad: severidad,
    /* calendario */
    eventosDe: eventosDe,
    /* eos */
    rocasDe: rocasDe, vto: vto, fijarVto: fijarVto, asientosHijos: asientosHijos,
    /* datos */
    exportarTodo: exportarTodo, importarTodo: importarTodo,
    datosDelNavegador: datosDelNavegador, llevarNavegadorAlServidor: llevarNavegadorAlServidor
  };
})();
