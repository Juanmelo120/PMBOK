/* ═══════════════════════════════════════════════════════════
   api.js — Cliente HTTP del backend (backend/, PostgreSQL)
   ───────────────────────────────────────────────────────────
   Si la página se sirve desde el backend (http://localhost:3000)
   y /api/salud responde, la aplicación trabaja en modo servidor.
   Abierta con doble clic (file://) o servida sin API, sigue en
   modo local y nada de esto se usa.
   ═══════════════════════════════════════════════════════════ */

window.Api = (function () {
  'use strict';

  var CLAVE_TOKEN = 'pmbok8.token';
  var disponible = false;
  var salud = null;
  var alCaducar = null;

  function token() {
    try { return localStorage.getItem(CLAVE_TOKEN); } catch (e) { return null; }
  }

  function fijarToken(t) {
    try {
      if (t) localStorage.setItem(CLAVE_TOKEN, t);
      else localStorage.removeItem(CLAVE_TOKEN);
    } catch (e) { /* sin almacenamiento: la sesión dura lo que la pestaña */ }
  }

  /* Resuelve true si hay backend con base de datos conectada */
  function detectar() {
    if (!/^https?:$/.test(location.protocol) || typeof fetch !== 'function') {
      return Promise.resolve(false);
    }
    var control = typeof AbortController === 'function' ? new AbortController() : null;
    var plazo = control ? setTimeout(function () { control.abort(); }, 4000) : null;
    return fetch('api/salud', { cache: 'no-store', signal: control ? control.signal : undefined })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        salud = d;
        disponible = !!(d && d.ok && d.bd === 'conectada');
        return disponible;
      })
      .catch(function () { disponible = false; return false; })
      .then(function (v) { if (plazo) clearTimeout(plazo); return v; });
  }

  function errorDe(estado, datos) {
    var err = new Error((datos && datos.error) || ('El servidor respondió con el estado ' + estado + '.'));
    err.estado = estado;
    err.codigo = datos && datos.codigo;
    err.detalles = datos && datos.detalles;
    return err;
  }

  /* ruta empieza por «/»: pedir('GET', '/proyectos') → api/proyectos.
     Resuelve con el JSON (o un Blob si la respuesta no es JSON).
     opciones.silencioso: quien llama gestiona él mismo una sesión caducada. */
  function pedir(metodo, ruta, cuerpo, opciones) {
    var silencioso = !!(opciones && opciones.silencioso);
    var peticion = { method: metodo, headers: {}, cache: 'no-store' };
    var t = token();
    if (t) peticion.headers.Authorization = 'Bearer ' + t;
    if (typeof FormData !== 'undefined' && cuerpo instanceof FormData) {
      peticion.body = cuerpo;
    } else if (cuerpo !== undefined) {
      peticion.headers['Content-Type'] = 'application/json';
      peticion.body = JSON.stringify(cuerpo);
    }

    return fetch('api' + ruta, peticion).then(function (r) {
      if (r.status === 204) return null;
      var tipo = r.headers.get('content-type') || '';
      var lectura = tipo.indexOf('application/json') !== -1 ? r.json() : r.blob();
      return lectura.then(function (datos) {
        if (r.ok) return datos;
        var err = errorDe(r.status, datos);
        if ((r.status === 401 || err.codigo === 'CLAVE_PENDIENTE') && t && alCaducar && !silencioso) alCaducar(err);
        throw err;
      });
    }, function () {
      var err = new Error('No hay conexión con el servidor. Comprueba que esté en marcha (backend\\iniciar.cmd).');
      err.estado = 0;
      err.codigo = 'SIN_CONEXION';
      throw err;
    });
  }

  function codificar(texto) {
    return encodeURIComponent(String(texto));
  }

  return {
    detectar: detectar,
    disponible: function () { return disponible; },
    salud: function () { return salud; },
    pedir: pedir,
    token: token,
    fijarToken: fijarToken,
    alCaducar: function (fn) { alCaducar = fn; },
    c: codificar
  };
})();
