/* ═══════════════════════════════════════════════════════════
   proyecto.js — Estado del proyecto del usuario
   ───────────────────────────────────────────────────────────
   Carga del documento (.docx, .txt, .md, .csv, .json), lectura
   del texto, propuesta de contenido por campo, persistencia
   local y exportación del informe.
   Sin dependencias externas: el .docx se descomprime con la
   API DecompressionStream del propio navegador.
   ═══════════════════════════════════════════════════════════ */

window.Proyecto = (function () {
  'use strict';

  var LIMITE_TEXTO = 300000;     // caracteres guardados del documento
  var estado = null;             // caché en memoria
  var sugerencias = null;        // caché del análisis del documento
  var activoId = null;           // proyecto del gestor al que pertenece

  /* La verificación de calidad vive en el registro del proyecto del gestor
     que está abierto. Sin proyecto activo se trabaja en memoria: es el caso
     de las pruebas y nunca ocurre desde la interfaz. */
  function usar(id) {
    if (activoId !== id) {
      activoId = id || null;
      estado = null;
      sugerencias = null;
    }
  }

  /* ══════════════ Estado ══════════════ */

  function vacioEstado() {
    return {
      version: 1,
      creado: Date.now(),
      actualizado: Date.now(),
      campos: {},        // { seccionId: { campoId: 'texto' } }
      procesos: {},      // { procesoId: true }
      documento: null,   // { nombre, tipo, texto, fecha, caracteres }
      historial: []      // [{ fecha, puntaje, completitud }]
    };
  }

  function cargar() {
    if (!estado) {
      var reg = (activoId && window.Gestor) ? Gestor.proyecto(activoId) : null;
      estado = (reg && reg.calidad) || vacioEstado();
      if (!estado.campos) estado.campos = {};
      if (!estado.procesos) estado.procesos = {};
      if (!estado.historial) estado.historial = [];
    }
    return estado;
  }

  function guardar() {
    var p = cargar();
    p.actualizado = Date.now();
    if (activoId && window.Gestor) {
      Gestor.actualizar('proyectos', activoId, { calidad: p });
    }
    return true;
  }

  function existe() {
    var p = cargar();
    return !!p.documento || Object.keys(p.campos).some(function (s) {
      return Object.keys(p.campos[s] || {}).some(function (c) {
        return p.campos[s][c] && p.campos[s][c].trim();
      });
    });
  }

  /* ══════════════ Campos ══════════════ */

  function valor(seccionId, campoId) {
    var p = cargar();
    return (p.campos[seccionId] || {})[campoId] || '';
  }

  function fijarValor(seccionId, campoId, texto) {
    var p = cargar();
    if (!p.campos[seccionId]) p.campos[seccionId] = {};
    if (texto && texto.trim()) { p.campos[seccionId][campoId] = texto; }
    else { delete p.campos[seccionId][campoId]; }
    return guardar();
  }

  function seccion(id) {
    return (PMBOK.seccionesProyecto || []).filter(function (s) { return s.id === id; })[0];
  }

  function campo(seccionId, campoId) {
    var s = seccion(seccionId);
    if (!s) return null;
    return s.campos.filter(function (c) { return c.id === campoId; })[0];
  }

  /* ══════════════ Procesos aplicados ══════════════ */

  function procesoMarcado(id) {
    return !!cargar().procesos[id];
  }

  function alternarProceso(id) {
    var p = cargar();
    if (p.procesos[id]) { delete p.procesos[id]; }
    else { p.procesos[id] = Date.now(); }
    guardar();
    return !!p.procesos[id];
  }

  /* ══════════════ Historial de puntajes ══════════════ */

  function registrarPuntaje(ev) {
    var p = cargar();
    var ultimo = p.historial[p.historial.length - 1];
    var hoy = new Date().toDateString();
    var entrada = {
      fecha: Date.now(),
      puntaje: ev.global.puntaje,
      completitud: ev.global.completitud,
      coherencia: ev.global.coherencia
    };
    if (ultimo && new Date(ultimo.fecha).toDateString() === hoy) {
      p.historial[p.historial.length - 1] = entrada;
    } else {
      p.historial.push(entrada);
      if (p.historial.length > 60) p.historial = p.historial.slice(-60);
    }
    guardar();
  }

  /* ══════════════ Lectura de archivos ══════════════ */

  function extension(nombre) {
    var m = String(nombre || '').toLowerCase().match(/\.([a-z0-9]+)$/);
    return m ? m[1] : '';
  }

  function importarArchivo(archivo, cb) {
    var ext = extension(archivo.name);

    if (ext === 'docx') {
      leerBinario(archivo, function (err, buffer) {
        if (err) return cb(err);
        leerDocx(buffer, function (err2, texto) {
          if (err2) return cb(err2);
          registrarDocumento(archivo.name, 'docx', texto, cb);
        });
      });
      return;
    }

    if (ext === 'pdf') {
      return cb('Los PDF no se pueden leer sin conexión ni bibliotecas externas. ' +
        'Ábrelo, copia el texto y pégalo en el cuadro de abajo, o guárdalo como .docx o .txt.');
    }

    if (ext === 'doc') {
      return cb('El formato .doc antiguo no es legible desde el navegador. ' +
        'Guárdalo como .docx desde Word y vuelve a intentarlo.');
    }

    leerTexto(archivo, function (err, texto) {
      if (err) return cb(err);

      if (ext === 'json') {
        try {
          var datos = JSON.parse(texto);
          var res = importarJSON(datos);
          return cb(res.error || null, res.error ? null : { importado: true, resumen: res.resumen });
        } catch (e) {
          return cb('El archivo JSON no se pudo interpretar.');
        }
      }
      registrarDocumento(archivo.name, ext || 'txt', texto, cb);
    });
  }

  function registrarDocumento(nombre, tipo, texto, cb) {
    texto = limpiar(texto);
    if (!texto || texto.replace(/\s/g, '').length < 40) {
      return cb('El archivo no contiene texto legible suficiente para analizarlo.');
    }
    var p = cargar();
    var recortado = texto.length > LIMITE_TEXTO;
    p.documento = {
      nombre: nombre,
      tipo: tipo,
      texto: recortado ? texto.slice(0, LIMITE_TEXTO) : texto,
      caracteres: texto.length,
      recortado: recortado,
      fecha: Date.now()
    };
    sugerencias = null;
    if (!guardar()) {
      return cb('El documento es demasiado grande para el almacenamiento del navegador. ' +
        'Prueba con una versión más corta o pega solo las partes relevantes.');
    }
    cb(null, { documento: p.documento, resumen: resumenDocumento(p.documento.texto) });
  }

  function guardarTextoPegado(texto, nombre, cb) {
    registrarDocumento(nombre || 'Texto pegado', 'texto', texto, cb);
  }

  function leerTexto(archivo, cb) {
    var fr = new FileReader();
    fr.onload = function () { cb(null, String(fr.result || '')); };
    fr.onerror = function () { cb('No se pudo leer el archivo.'); };
    fr.readAsText(archivo, 'utf-8');
  }

  function leerBinario(archivo, cb) {
    var fr = new FileReader();
    fr.onload = function () { cb(null, fr.result); };
    fr.onerror = function () { cb('No se pudo leer el archivo.'); };
    fr.readAsArrayBuffer(archivo);
  }

  /* ── .docx: es un ZIP; extraemos word/document.xml ────── */

  function leerDocx(buffer, cb) {
    var entrada;
    try {
      entrada = buscarEnZip(buffer, 'word/document.xml');
    } catch (e) {
      return cb('El archivo no parece un .docx válido.');
    }
    if (entrada.error) return cb(entrada.error);

    if (entrada.metodo === 0) {
      return cb(null, textoDeDocumentXml(decodificar(entrada.datos)));
    }
    inflar(entrada.datos, function (err, bytes) {
      if (err) return cb(err);
      cb(null, textoDeDocumentXml(decodificar(bytes)));
    });
  }

  function decodificar(bytes) {
    if (typeof TextDecoder !== 'undefined') {
      return new TextDecoder('utf-8').decode(bytes);
    }
    var s = '';
    for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    try { return decodeURIComponent(escape(s)); } catch (e) { return s; }
  }

  function buscarEnZip(buffer, nombreBuscado) {
    var dv = new DataView(buffer);
    var u8 = new Uint8Array(buffer);
    var fin = -1;
    var limite = Math.max(0, buffer.byteLength - 22 - 65535);

    for (var i = buffer.byteLength - 22; i >= limite; i--) {
      if (dv.getUint32(i, true) === 0x06054b50) { fin = i; break; }
    }
    if (fin < 0) return { error: 'El archivo no parece un .docx válido (falta el índice del ZIP).' };

    var total = dv.getUint16(fin + 10, true);
    var p = dv.getUint32(fin + 16, true);

    for (var e = 0; e < total; e++) {
      if (p + 46 > buffer.byteLength || dv.getUint32(p, true) !== 0x02014b50) break;
      var metodo = dv.getUint16(p + 10, true);
      var comprimido = dv.getUint32(p + 20, true);
      var lenNombre = dv.getUint16(p + 28, true);
      var lenExtra = dv.getUint16(p + 30, true);
      var lenComent = dv.getUint16(p + 32, true);
      var offLocal = dv.getUint32(p + 42, true);
      var nombre = decodificar(u8.subarray(p + 46, p + 46 + lenNombre));

      if (nombre === nombreBuscado) {
        if (dv.getUint32(offLocal, true) !== 0x04034b50) {
          return { error: 'El contenido del documento está dañado.' };
        }
        var lnNombre = dv.getUint16(offLocal + 26, true);
        var lnExtra = dv.getUint16(offLocal + 28, true);
        var inicio = offLocal + 30 + lnNombre + lnExtra;
        return { metodo: metodo, datos: u8.subarray(inicio, inicio + comprimido) };
      }
      p += 46 + lenNombre + lenExtra + lenComent;
    }
    return { error: 'No se encontró el texto dentro del .docx. ¿Es realmente un documento de Word?' };
  }

  function inflar(datos, cb) {
    if (typeof DecompressionStream === 'undefined') {
      return cb('Este navegador no puede abrir .docx. Copia el texto del documento y pégalo en el cuadro de abajo.');
    }
    var ds, escritor, lector;
    try {
      ds = new DecompressionStream('deflate-raw');
      escritor = ds.writable.getWriter();
      lector = ds.readable.getReader();
    } catch (e) {
      return cb('Este navegador no puede descomprimir el documento. Pega el texto manualmente.');
    }

    escritor.write(datos);
    escritor.close();

    var partes = [], total = 0, terminado = false;

    function siguiente() {
      lector.read().then(function (r) {
        if (r.done) {
          if (terminado) return;
          terminado = true;
          var salida = new Uint8Array(total), pos = 0;
          partes.forEach(function (parte) { salida.set(parte, pos); pos += parte.length; });
          return cb(null, salida);
        }
        partes.push(r.value);
        total += r.value.length;
        siguiente();
      })['catch'](function () {
        if (!terminado) { terminado = true; cb('No se pudo descomprimir el documento.'); }
      });
    }
    siguiente();
  }

  /* Las celdas de tabla se convierten en columnas separadas por «|»,
     que es justo el formato que esperan los campos tabulares. */
  function textoDeDocumentXml(xml) {
    var t = String(xml || '');
    t = t.replace(/<w:tab[^>]*\/>/g, ' | ')
         .replace(/<w:br[^>]*\/>/g, '\n')
         .replace(/<\/w:tc>/g, ' | ')
         .replace(/<\/w:tr>/g, '\n')
         .replace(/<\/w:p>/g, '\n')
         .replace(/<[^>]+>/g, '');
    t = t.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
         .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
         .replace(/&#(\d+);/g, function (m, n) { return String.fromCharCode(parseInt(n, 10)); })
         .replace(/&amp;/g, '&');
    // Reagrupa las celdas partidas en varias líneas
    t = t.replace(/\n[ \t]*\|/g, ' |');
    t = t.replace(/[ \t]*\|[ \t]*$/gm, '');
    return limpiar(t);
  }

  function limpiar(texto) {
    return String(texto || '')
      .replace(/\r\n?/g, '\n')
      .replace(/[   ]/g, ' ')
      .split('\n').map(function (l) { return l.replace(/[ \t]+/g, ' ').trim(); }).join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /* ══════════════ Análisis del documento ══════════════ */

  function resumenDocumento(texto) {
    var ls = String(texto || '').split('\n').filter(function (l) { return l.trim(); });
    return {
      caracteres: texto.length,
      palabras: (texto.match(/\S+/g) || []).length,
      parrafos: ls.length,
      titulos: bloques(texto).filter(function (b) { return b.titulo; }).length
    };
  }

  function esTitulo(linea) {
    var l = linea.trim();
    if (!l || l.length > 95) return false;
    if (/[.;,]$/.test(l)) return false;
    if (/^\d+(\.\d+)*[.)]?\s+\S/.test(l)) return true;
    if (/:$/.test(l) && l.length < 70) return true;
    var letras = l.replace(/[^A-Za-zÁÉÍÓÚÑÜáéíóúñü]/g, '');
    if (letras.length >= 4) {
      var mayus = l.replace(/[^A-ZÁÉÍÓÚÑÜ]/g, '').length;
      if (mayus / letras.length > 0.7) return true;
    }
    return l.split(' ').length <= 8 && !/[.]$/.test(l) && l.length < 60;
  }

  function bloques(texto) {
    var ls = String(texto || '').split('\n');
    var salida = [], actual = { titulo: '', lineas: [] };

    ls.forEach(function (linea) {
      var l = linea.trim();
      if (!l) {
        if (actual.lineas.length) { salida.push(actual); actual = { titulo: actual.titulo, lineas: [] }; }
        return;
      }
      if (esTitulo(l)) {
        if (actual.lineas.length) salida.push(actual);
        actual = { titulo: l, lineas: [] };
        return;
      }
      actual.lineas.push(l);
    });
    if (actual.lineas.length) salida.push(actual);

    return salida.map(function (b) {
      b.texto = b.lineas.join('\n');
      return b;
    }).filter(function (b) { return b.texto.length > 0; });
  }

  function norm(s) {
    var t = String(s == null ? '' : s).toLowerCase();
    if (t.normalize) { t = t.normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]', 'g'), ''); }
    return t.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function esViñeta(linea) {
    return /^\s*(?:[-•*–—]|\d+[.)]|[a-z][.)]\s)/.test(linea) || linea.indexOf('|') !== -1;
  }

  function analizarDocumento() {
    if (sugerencias) return sugerencias;
    var p = cargar();
    sugerencias = {};
    if (!p.documento || !p.documento.texto) return sugerencias;

    var bs = bloques(p.documento.texto);

    (PMBOK.seccionesProyecto || []).forEach(function (sec) {
      sec.campos.forEach(function (c) {
        if (!c.pistas || !c.pistas.length) return;
        var mejor = null, mejorPuntos = 0;

        bs.forEach(function (b) {
          var tituloN = norm(b.titulo);
          var cuerpoN = norm(b.texto);
          var puntos = 0;
          c.pistas.forEach(function (pista) {
            var pn = norm(pista);
            if (!pn) return;
            if (tituloN.indexOf(pn) !== -1) puntos += 4;
            var ocurrencias = cuerpoN.split(pn).length - 1;
            puntos += Math.min(3, ocurrencias);
          });
          if (puntos > mejorPuntos) { mejorPuntos = puntos; mejor = b; }
        });

        if (!mejor || mejorPuntos < 2) return;

        var lineas = mejor.lineas;
        if ((c.tipo === 'lista' || c.tipo === 'tabla')) {
          var conViñeta = lineas.filter(esViñeta);
          if (conViñeta.length >= 2) lineas = conViñeta;
        }
        var propuesta = lineas.slice(0, 30).join('\n');
        if (propuesta.length > 1800) propuesta = propuesta.slice(0, 1800) + '…';
        if (propuesta.replace(/\s/g, '').length < 15) return;

        sugerencias[sec.id + '.' + c.id] = {
          texto: propuesta,
          origen: mejor.titulo || 'Fragmento del documento',
          confianza: Math.min(1, mejorPuntos / 8)
        };
      });
    });

    return sugerencias;
  }

  function sugerencia(seccionId, campoId) {
    return analizarDocumento()[seccionId + '.' + campoId] || null;
  }

  function contarSugerencias() {
    return Object.keys(analizarDocumento()).length;
  }

  /* Rellena con las propuestas los campos que estén vacíos */
  function aplicarSugerencias() {
    var s = analizarDocumento();
    var n = 0;
    Object.keys(s).forEach(function (clave) {
      var partes = clave.split('.');
      if (valor(partes[0], partes[1])) return;
      fijarValor(partes[0], partes[1], s[clave].texto);
      n++;
    });
    return n;
  }

  function borrarDocumento() {
    var p = cargar();
    p.documento = null;
    sugerencias = null;
    guardar();
  }

  /* ══════════════ Importar / exportar ══════════════ */

  function exportarJSON() {
    var p = cargar();
    return {
      formato: 'pmbok8-proyecto',
      version: 1,
      exportado: new Date().toISOString(),
      campos: p.campos,
      procesos: p.procesos,
      documento: p.documento ? { nombre: p.documento.nombre, tipo: p.documento.tipo, fecha: p.documento.fecha, texto: p.documento.texto } : null,
      historial: p.historial
    };
  }

  function importarJSON(datos) {
    if (!datos || typeof datos !== 'object') return { error: 'El archivo no tiene el formato esperado.' };

    // Admite tanto la exportación del proyecto como la del cuaderno completo
    var fuente = datos.formato === 'pmbok8-proyecto' ? datos : (datos.proyecto || null);
    if (!fuente || !fuente.campos) return { error: 'El archivo no contiene un proyecto exportado desde esta aplicación.' };

    var p = cargar();
    p.campos = fuente.campos || {};
    p.procesos = fuente.procesos || {};
    p.documento = fuente.documento || null;
    p.historial = fuente.historial || [];
    sugerencias = null;
    guardar();

    var nCampos = 0;
    Object.keys(p.campos).forEach(function (s) {
      nCampos += Object.keys(p.campos[s] || {}).length;
    });
    return { resumen: nCampos + ' campos restaurados' };
  }

  function reiniciar() {
    estado = vacioEstado();
    sugerencias = null;
    guardar();
  }

  /* ══════════════ Informe en Markdown ══════════════ */

  function informeMarkdown(ev) {
    var p = cargar();
    var L = [];
    var nombre = valor('enc', 'nombre') || 'Proyecto sin nombre';
    var fecha = new Date().toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' });

    L.push('# ' + nombre);
    L.push('');
    L.push('**Plan de dirección del proyecto — estructura PMBOK® 8.ª edición**');
    L.push('');
    L.push('Informe generado el ' + fecha + ' con el entorno de estudio PMBOK 8.');
    L.push('');
    L.push('---');
    L.push('');
    L.push('## Verificación de calidad');
    L.push('');
    L.push('| Indicador | Valor |');
    L.push('| --- | --- |');
    L.push('| Puntaje global | **' + ev.global.puntaje + ' / 100** — ' + ev.global.nivel.etiqueta + ' |');
    L.push('| Calidad del contenido | ' + ev.global.contenido + ' / 100 |');
    L.push('| Coherencia entre secciones | ' + ev.global.coherencia + ' / 100 |');
    L.push('| Completitud | ' + ev.global.completitud + ' % |');
    L.push('| Procesos PMBOK aplicados | ' + ev.global.procesosMarcados + ' de ' + ev.global.procesosTotal + ' |');
    L.push('');
    L.push('> ' + ev.global.veredicto);
    L.push('');
    L.push('### Puntaje por sección');
    L.push('');
    L.push('| # | Sección | Puntaje | Completitud |');
    L.push('| --- | --- | --- | --- |');
    ev.secciones.forEach(function (s) {
      L.push('| ' + s.n + ' | ' + s.nombre + ' | ' + s.puntaje + ' / 100 | ' + s.completitud + ' % |');
    });
    L.push('');

    var fallos = ev.cruzadas.filter(function (c) { return c.estado !== 'ok'; });
    L.push('### Verificaciones de coherencia');
    L.push('');
    ev.cruzadas.forEach(function (c) {
      var marca = c.estado === 'ok' ? '[OK]' : c.estado === 'aviso' ? '[AVISO]' : c.estado === 'pendiente' ? '[PENDIENTE]' : '[FALLA]';
      L.push('- ' + marca + ' **' + c.titulo + '** — ' + c.detalle);
    });
    L.push('');

    if (ev.hallazgos.length) {
      L.push('### Hallazgos prioritarios');
      L.push('');
      ev.hallazgos.slice(0, 25).forEach(function (h, i) {
        L.push((i + 1) + '. **[' + h.severidad.toUpperCase() + ']** ' + h.titulo);
        if (h.detalle) L.push('   - ' + h.detalle);
        if (h.como) L.push('   - Cómo corregirlo: ' + h.como);
      });
      L.push('');
    }

    L.push('---');
    L.push('');
    L.push('## Plan del proyecto');
    L.push('');

    (PMBOK.seccionesProyecto || []).forEach(function (sec) {
      var evSec = ev.secciones.filter(function (s) { return s.id === sec.id; })[0];
      L.push('## ' + sec.n + '. ' + sec.nombre);
      L.push('');
      L.push('*' + sec.lema + '* — Puntaje ' + (evSec ? evSec.puntaje : 0) + '/100.');
      L.push('');
      sec.campos.forEach(function (c) {
        var v = valor(sec.id, c.id);
        L.push('### ' + c.etiqueta);
        L.push('');
        L.push(v ? v : '_Sin redactar._');
        L.push('');
      });
      if (sec.procesos && sec.procesos.length) {
        L.push('**Procesos PMBOK cubiertos:**');
        L.push('');
        sec.procesos.forEach(function (id) {
          var pr = (PMBOK.procesos || []).filter(function (x) { return x.id === id; })[0];
          if (!pr) return;
          L.push('- [' + (procesoMarcado(id) ? 'x' : ' ') + '] ' + pr.cod + ' ' + pr.nombre);
        });
        L.push('');
      }
    });

    if (p.documento) {
      L.push('---');
      L.push('');
      L.push('_Documento de origen: ' + p.documento.nombre + ', cargado el ' +
        new Date(p.documento.fecha).toLocaleDateString('es') + '._');
    }
    L.push('');
    L.push('_La estructura sigue el índice público de la Guía PMBOK® 8.ª edición. ' +
      'PMBOK y PMI son marcas registradas del Project Management Institute, Inc._');

    return L.join('\n');
  }

  return {
    usar: usar,
    activo: function () { return activoId; },
    cargar: cargar,
    guardar: guardar,
    existe: existe,
    valor: valor,
    fijarValor: fijarValor,
    seccion: seccion,
    campo: campo,
    procesoMarcado: procesoMarcado,
    alternarProceso: alternarProceso,
    registrarPuntaje: registrarPuntaje,
    importarArchivo: importarArchivo,
    guardarTextoPegado: guardarTextoPegado,
    resumenDocumento: resumenDocumento,
    analizarDocumento: analizarDocumento,
    sugerencia: sugerencia,
    contarSugerencias: contarSugerencias,
    aplicarSugerencias: aplicarSugerencias,
    borrarDocumento: borrarDocumento,
    exportarJSON: exportarJSON,
    importarJSON: importarJSON,
    reiniciar: reiniciar,
    informeMarkdown: informeMarkdown
  };
})();
