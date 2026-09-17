/* ═══════════════════════════════════════════════════════════
   indice.js — Índice unificado de lo consultable
   ───────────────────────────────────────────────────────────
   Normaliza dominios, procesos, principios, herramientas y
   artefactos en nodos buscables. Es lo que alimenta la paleta
   de búsqueda global.
   ═══════════════════════════════════════════════════════════ */

window.Indice = (function () {
  'use strict';

  var nodos = [];
  var porId = {};

  /* ── Utilidades de texto ──────────────────────────────── */
  function sinEtiquetas(s) {
    return String(s || '').replace(/<[^>]*>/g, ' ');
  }

  var RE_DIACRITICOS = new RegExp('[\\u0300-\\u036f]', 'g');

  function normalizar(s) {
    var t = sinEtiquetas(s).toLowerCase();
    if (t.normalize) { t = t.normalize('NFD').replace(RE_DIACRITICOS, ''); }
    return t.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function textoDeEjemplo(e) {
    if (!e) return '';
    return [e.titulo, e.contexto, e.aplicacion, e.resultado].join(' ');
  }

  /* ── Construcción ─────────────────────────────────────── */
  function registrar(nodo) {
    nodo.busqueda = normalizar(nodo.titulo + ' ' + (nodo.subtitulo || '') + ' ' + (nodo.cuerpo || ''));
    nodos.push(nodo);
    porId[nodo.id] = nodo;
    return nodo;
  }

  function construir() {
    (PMBOK.principios || []).forEach(function (p) {
      registrar({
        id: p.id, tipo: 'principio', grupo: 'Principios',
        ruta: '#/principio/' + p.id, numero: p.n,
        titulo: p.titulo, subtitulo: p.lema,
        cuerpo: [p.enunciado, p.resumen, (p.impacto || []).join(' '), (p.enAccion || []).join(' ')].join(' '),
        datos: p
      });
    });

    (PMBOK.dominios || []).forEach(function (d) {
      registrar({
        id: d.id, tipo: 'dominio', grupo: 'Dominios de desempeño',
        ruta: '#/dominio/' + d.id, numero: d.n,
        titulo: d.titulo, subtitulo: d.lema,
        cuerpo: [d.resumen,
          (d.conceptosClave || []).map(function (c) { return c.t + ' ' + c.d; }).join(' '),
          (d.adaptacion || []).join(' '),
          (d.verificar || []).map(function (v) { return v.ind + ' ' + v.ok; }).join(' ')].join(' '),
        datos: d
      });
    });

    (PMBOK.procesos || []).forEach(function (pr) {
      var dm = dominioMeta(pr.dominio);
      var ae = areaMeta(pr.area);
      registrar({
        id: pr.id, tipo: 'proceso',
        grupo: 'Procesos · ' + (dm ? dm.nombre : ''),
        ruta: '#/proceso/' + pr.id, numero: pr.cod,
        titulo: pr.nombre,
        subtitulo: (dm ? dm.nombre : '') + ' · ' + (ae ? ae.nombre : ''),
        cuerpo: [pr.proposito, (pr.descripcion || []).join(' '),
          (pr.entradas || []).join(' '), (pr.herramientas || []).join(' '), (pr.salidas || []).join(' '),
          (pr.errores || []).join(' '), textoDeEjemplo(pr.ejemplo)].join(' '),
        datos: pr
      });
    });

    (PMBOK.herramientas || []).forEach(function (h) {
      registrar({
        id: h.id, tipo: 'herramienta', grupo: 'Herramientas y técnicas',
        ruta: '#/herramientas', numero: '',
        titulo: h.nombre, subtitulo: h.descripcion, cuerpo: '', datos: h
      });
    });

    (PMBOK.artefactos || []).forEach(function (a) {
      registrar({
        id: a.id, tipo: 'artefacto', grupo: 'Artefactos',
        ruta: '#/artefactos', numero: '',
        titulo: a.nombre, subtitulo: a.descripcion,
        cuerpo: (a.plantilla || []).map(function (b) { return b.et; }).join(' '),
        datos: a
      });
    });
  }

  /* ── Consultas auxiliares ─────────────────────────────── */
  function dominioMeta(clave) {
    return (PMBOK.dominiosMeta || []).filter(function (d) { return d.id === clave; })[0];
  }
  function areaMeta(clave) {
    return (PMBOK.areasEnfoque || []).filter(function (a) { return a.id === clave; })[0];
  }
  function dominioPorId(id) {
    return (PMBOK.dominios || []).filter(function (d) { return d.id === id || d.clave === id; })[0];
  }
  function procesosDe(claveDominio) {
    return (PMBOK.procesos || []).filter(function (p) { return p.dominio === claveDominio; });
  }
  function procesosEnCelda(claveDominio, claveArea) {
    return (PMBOK.procesos || []).filter(function (p) {
      return p.dominio === claveDominio && p.area === claveArea;
    });
  }
  function procesosDeArea(claveArea) {
    return (PMBOK.procesos || []).filter(function (p) { return p.area === claveArea; });
  }
  function proceso(id) {
    return (PMBOK.procesos || []).filter(function (p) { return p.id === id; })[0] || null;
  }
  function nodo(id) { return porId[id]; }
  function nodoPorRuta(ruta) {
    for (var i = 0; i < nodos.length; i++) { if (nodos[i].ruta === ruta) return nodos[i]; }
    return null;
  }

  construir();

  return {
    nodos: nodos,
    normalizar: normalizar,
    sinEtiquetas: sinEtiquetas,
    nodo: nodo,
    nodoPorRuta: nodoPorRuta,
    dominioMeta: dominioMeta,
    areaMeta: areaMeta,
    dominioPorId: dominioPorId,
    proceso: proceso,
    procesosDe: procesosDe,
    procesosEnCelda: procesosEnCelda,
    procesosDeArea: procesosDeArea
  };
})();
