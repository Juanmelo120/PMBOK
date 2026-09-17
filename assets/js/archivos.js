/* ═══════════════════════════════════════════════════════════
   archivos.js — Repositorio de evidencias del proyecto
   ───────────────────────────────────────────────────────────
   Modo servidor: el archivo se sube a la API y queda en PostgreSQL.
   Modo local: los metadatos viven en la base local del gestor y el
   contenido binario en IndexedDB. Si IndexedDB no está disponible
   —pasa al abrir la página con doble clic en algunos navegadores—
   se cae con elegancia a localStorage, con un límite menor.
   ═══════════════════════════════════════════════════════════ */

window.Archivos = (function () {
  'use strict';

  var BD = 'pmbok8-archivos';
  var ALMACEN = 'blobs';
  var LIMITE = 10 * 1024 * 1024;          // 10 MB por archivo
  var LIMITE_RESPALDO = 600 * 1024;       // 600 KB si toca usar localStorage
  var bd = null;
  var indexedDisponible = null;

  var CATEGORIAS = [
    { id: 'general', nombre: 'General' },
    { id: 'entrada', nombre: 'Entrada de proceso' },
    { id: 'evidencia', nombre: 'Evidencia' },
    { id: 'acta', nombre: 'Acta' },
    { id: 'registro', nombre: 'Registro' },
    { id: 'informe', nombre: 'Informe' },
    { id: 'otro', nombre: 'Otro' }
  ];

  /* ══════════════ IndexedDB ══════════════ */

  function abrirBD(cb) {
    if (bd) return cb(null, bd);
    if (indexedDisponible === false) return cb('sin-indexeddb');
    if (typeof indexedDB === 'undefined') { indexedDisponible = false; return cb('sin-indexeddb'); }

    var sol;
    try { sol = indexedDB.open(BD, 1); }
    catch (e) { indexedDisponible = false; return cb('sin-indexeddb'); }

    sol.onupgradeneeded = function () {
      var d = sol.result;
      if (!d.objectStoreNames.contains(ALMACEN)) d.createObjectStore(ALMACEN, { keyPath: 'id' });
    };
    sol.onsuccess = function () { bd = sol.result; indexedDisponible = true; cb(null, bd); };
    sol.onerror = function () { indexedDisponible = false; cb('sin-indexeddb'); };
    sol.onblocked = function () { indexedDisponible = false; cb('sin-indexeddb'); };
  }

  function escribirBlob(id, blob, cb) {
    abrirBD(function (err, d) {
      if (err) return cb(err);
      try {
        var tx = d.transaction(ALMACEN, 'readwrite');
        tx.objectStore(ALMACEN).put({ id: id, blob: blob });
        tx.oncomplete = function () { cb(null); };
        tx.onerror = function () { cb('No se pudo guardar el archivo.'); };
      } catch (e) { cb('No se pudo guardar el archivo.'); }
    });
  }

  function leerBlob(id, cb) {
    abrirBD(function (err, d) {
      if (err) return cb(err);
      try {
        var tx = d.transaction(ALMACEN, 'readonly');
        var sol = tx.objectStore(ALMACEN).get(id);
        sol.onsuccess = function () { cb(null, sol.result ? sol.result.blob : null); };
        sol.onerror = function () { cb('No se pudo leer el archivo.'); };
      } catch (e) { cb('No se pudo leer el archivo.'); }
    });
  }

  function borrarBlob(id, cb) {
    abrirBD(function (err, d) {
      if (err) return cb && cb(err);
      try {
        var tx = d.transaction(ALMACEN, 'readwrite');
        tx.objectStore(ALMACEN)['delete'](id);
        tx.oncomplete = function () { cb && cb(null); };
      } catch (e) { cb && cb('No se pudo borrar.'); }
    });
  }

  /* ══════════════ Respaldo en localStorage ══════════════ */

  function claveRespaldo(id) { return 'pmbok8.arch.' + id; }

  function escribirRespaldo(id, dataUrl) {
    try { localStorage.setItem(claveRespaldo(id), dataUrl); return true; }
    catch (e) { return false; }
  }

  function leerRespaldo(id) {
    try { return localStorage.getItem(claveRespaldo(id)); } catch (e) { return null; }
  }

  function borrarRespaldo(id) {
    try { localStorage.removeItem(claveRespaldo(id)); } catch (e) {}
  }

  /* Contenido guardado en este navegador, como Blob (para llevarlo al servidor) */
  function leerLocal(meta) {
    return new Promise(function (resolver, rechazar) {
      if (meta.almacen === 'local') {
        var d = leerRespaldo(meta.id);
        if (!d) return rechazar('el contenido no está en este navegador');
        return fetch(d).then(function (r) { return r.blob(); }).then(resolver, rechazar);
      }
      leerBlob(meta.id, function (err, blob) {
        if (err || !blob) return rechazar('el contenido no está en este navegador');
        resolver(blob);
      });
    });
  }

  /* ══════════════ Modo servidor ══════════════ */

  function subirAlServidor(proyectoId, archivo, categoria, cb) {
    var f = new FormData();
    f.append('id', Gestor.nuevoId('arch'));
    f.append('categoria', categoria || 'general');
    f.append('archivo', archivo, archivo.name);
    Remoto.enCola(function () {
      return Api.pedir('POST', '/proyectos/' + Api.c(proyectoId) + '/archivos', f);
    }).then(function (meta) {
      Gestor.anotar('archivos', meta);
      cb(null, meta);
    }, function (err) { cb(err.message); });
  }

  function blobDelServidor(id) {
    return Api.pedir('GET', '/archivos/' + Api.c(id) + '/contenido');
  }

  /* Solo se abren en una pestaña los tipos que no ejecutan código:
     un HTML o un SVG abierto así correría con el origen de la aplicación */
  var SEGUROS = /^(image\/(png|jpe?g|gif|webp)|application\/pdf|text\/plain)(;|$)/i;

  /* ══════════════ API ══════════════ */

  function subir(proyectoId, archivo, categoria, cb) {
    if (archivo.size > LIMITE) {
      return cb('El archivo supera los 10 MB. Sube una versión más ligera o enlázalo desde un documento.');
    }
    if (Gestor.enServidor()) return subirAlServidor(proyectoId, archivo, categoria, cb);

    var id = Gestor.nuevoId('arch');
    var meta = {
      id: id,
      proyectoId: proyectoId,
      nombre: archivo.name,
      tipo: archivo.type || 'application/octet-stream',
      tamano: archivo.size,
      categoria: categoria || 'general',
      autorId: (Gestor.usuarioActual() || {}).id || null
    };

    escribirBlob(id, archivo, function (err) {
      if (!err) {
        meta.almacen = 'idb';
        Gestor.crear('archivos', meta);
        return cb(null, meta);
      }
      // Sin IndexedDB: se guarda en base64 con un límite menor
      if (archivo.size > LIMITE_RESPALDO) {
        return cb('Este navegador no permite guardar archivos grandes al abrir la página desde el disco. ' +
          'Sirve la carpeta por HTTP o sube un archivo de menos de 600 KB.');
      }
      var fr = new FileReader();
      fr.onload = function () {
        if (!escribirRespaldo(id, String(fr.result))) {
          return cb('No queda espacio en el almacenamiento del navegador.');
        }
        meta.almacen = 'local';
        Gestor.crear('archivos', meta);
        cb(null, meta);
      };
      fr.onerror = function () { cb('No se pudo leer el archivo.'); };
      fr.readAsDataURL(archivo);
    });
  }

  function urlDe(id, cb) {
    var meta = Gestor.uno('archivos', id);
    if (!meta) return cb('El archivo ya no existe.');

    if (Gestor.enServidor()) {
      return blobDelServidor(id).then(function (blob) {
        cb(null, URL.createObjectURL(blob), true, blob.type);
      }, function (err) { cb(err.message); });
    }
    if (meta.almacen === 'local') {
      var d = leerRespaldo(id);
      return d ? cb(null, d, false) : cb('El contenido del archivo se perdió.');
    }
    leerBlob(id, function (err, blob) {
      if (err || !blob) return cb('El contenido del archivo no está disponible.');
      cb(null, URL.createObjectURL(blob), true);
    });
  }

  function abrir(id) {
    var meta = Gestor.uno('archivos', id);
    if (meta && !SEGUROS.test(meta.tipo || '')) {
      Dialogo.avisar('Este tipo de archivo se descarga en lugar de abrirse', 'aviso');
      return descargar(id);
    }
    urlDe(id, function (err, url, temporal) {
      if (err) { Dialogo.avisar(err, 'error'); return; }
      var v = window.open(url, '_blank');
      if (!v) {
        var a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      if (temporal) setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    });
  }

  function descargar(id) {
    var meta = Gestor.uno('archivos', id);
    if (!meta) return;
    urlDe(id, function (err, url, temporal) {
      if (err) { Dialogo.avisar(err, 'error'); return; }
      var a = document.createElement('a');
      a.href = url;
      a.download = meta.nombre;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (temporal) setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
    });
  }

  function eliminar(id) {
    var meta = Gestor.uno('archivos', id);
    if (!meta) return;
    if (Gestor.enServidor()) return Gestor.borrar('archivos', id);
    if (meta.almacen === 'local') borrarRespaldo(id);
    else borrarBlob(id);
    Gestor.borrar('archivos', id);
  }

  function de(proyectoId) {
    return Gestor.lista('archivos', { proyectoId: proyectoId }).sort(function (a, b) {
      return (b.creado || 0) - (a.creado || 0);
    });
  }

  function formatoTamano(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function icono(tipo, nombre) {
    var t = (tipo || '') + ' ' + (nombre || '');
    if (/pdf/i.test(t)) return 'PDF';
    if (/image|png|jpe?g|gif|webp|svg/i.test(t)) return 'IMG';
    if (/sheet|excel|xlsx?|csv/i.test(t)) return 'XLS';
    if (/word|docx?/i.test(t)) return 'DOC';
    if (/presentation|pptx?/i.test(t)) return 'PPT';
    if (/zip|rar|7z/i.test(t)) return 'ZIP';
    if (/text|txt|md/i.test(t)) return 'TXT';
    return 'ARCH';
  }

  return {
    subir: subir, abrir: abrir, descargar: descargar, eliminar: eliminar,
    de: de, urlDe: urlDe, leerLocal: leerLocal, categorias: CATEGORIAS,
    formatoTamano: formatoTamano, icono: icono
  };
})();
