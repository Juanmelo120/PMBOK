/* ═══════════════════════════════════════════════════════════
   obra/documentos.js — Documentos del proyecto y su editor
   ───────────────────────────────────────────────────────────
   La lista filtrable por categoría y el editor que rellena la
   plantilla del artefacto bloque a bloque.
   ═══════════════════════════════════════════════════════════ */

window.ObraDocumentos = (function () {
  'use strict';

  var R = window.Render;

  /* ══════════════ 3 · DOCUMENTOS ══════════════ */

  function tabDocumentos(p) {
    var docs = Gestor.documentosDe(p.id);
    var puede = Gestor.puede(p.id, 'editar');

    var filtros = '<div class="barra-filtros">' +
      '<button class="btn activo" data-o="filtrar-doc" data-valor="">Todas las categorías</button>' +
      PMBOK.categoriasArtefacto.map(function (c) {
        return '<button class="btn" data-o="filtrar-doc" data-valor="' + c.id + '">' + c.nombre + '</button>';
      }).join('') +
      (puede ? '<button class="btn primario" data-o="abrir-nuevo-doc" style="margin-left:auto">' + Iconos.svg('mas') + ' Nuevo desde plantilla</button>' : '') +
      '</div>';

    var pendientes = PMBOK.artefactos.filter(function (a) {
      return !Gestor.documentoDe(p.id, a.id);
    });

    var formulario = '<div id="g-nuevo-doc" hidden><div class="pa-panel">' +
      UI.selector('nd-artefacto', 'Artefacto', pendientes.map(function (a) {
        return { id: a.id, nombre: a.nombre + '  ·  ' + a.categoria };
      }), pendientes.length ? pendientes[0].id : '') +
      '<div class="tarjeta-pie"><button class="btn primario" data-o="crear-doc">Generar documento</button>' +
      '<button class="btn" data-o="cerrar-nuevo-doc">Cancelar</button></div></div></div>';

    var lista = docs.length
      ? '<div class="g-documentos">' + docs.map(function (d) {
          var comp = Gestor.completitudDocumento(d);
          var proc = d.procesoId ? PMBOK.procesos.filter(function (x) { return x.id === d.procesoId; })[0] : null;
          return '<a class="g-documento item-doc" data-categoria="' + d.categoria + '" ' +
            'href="#/proyectos/' + p.id + '/documento/' + d.id + '">' +
            '<div class="g-doc-estado ' + d.estado + '">' + etiquetaDoc(d.estado) + '</div>' +
            '<div class="g-doc-cuerpo">' +
              '<div class="g-doc-nombre">' + R.escapar(d.nombre) + '</div>' +
              '<div class="g-doc-meta">' + R.escapar(d.categoria) + ' · v' + (d.version || 1) +
              (proc ? ' · generado por el proceso ' + proc.cod : '') +
              ' · actualizado ' + UI.fecha(d.actualizado || d.creado) + '</div>' +
              UI.barra(comp, UI.colorPorcentaje(comp)) +
            '</div>' +
            '<div class="g-doc-pct">' + comp + ' %</div>' +
            '</a>';
        }).join('') + '</div>'
      : UI.vacio('📄', 'Sin documentos todavía',
          'Los documentos se generan desde las salidas de cada proceso. Empieza por ' +
          '<a class="ref" href="#/proyectos/' + p.id + '/proceso/p-gob-01">Iniciar el proyecto o fase</a>.');

    return filtros + formulario + lista;
  }

  function etiquetaDoc(e) {
    return { borrador: 'Borrador', revision: 'En revisión', aprobado: 'Aprobado' }[e] || e;
  }

  /* ══════════════ 4 · EDITOR DE DOCUMENTO ══════════════ */

  function editorDocumento(p, docId) {
    var d = Gestor.uno('documentos', docId);
    if (!d || d.proyectoId !== p.id) return Vistas.noEncontrado();
    var art = Gestor.artefacto(d.artefactoId);
    if (!art) return Vistas.noEncontrado();

    var puede = Gestor.puede(p.id, 'editar');
    var proc = d.procesoId ? PMBOK.procesos.filter(function (x) { return x.id === d.procesoId; })[0] : null;
    var comp = Gestor.completitudDocumento(d);

    var bloques = art.plantilla.map(function (b, i) {
      var valor = (d.contenido || {})[i];
      var idc = 'doc-' + i;
      var cuerpo;

      if (b.t === 'tabla') {
        cuerpo = UI.tablaEditable(idc, b.col, valor || [], { pie: 'Se guarda al salir de la celda.' });
      } else if (b.t === 'lista') {
        cuerpo = '<textarea class="pa-entrada g-bloque" id="' + idc + '" data-bloque="' + i + '" rows="5" ' +
          'placeholder="Un elemento por línea…"' + (puede ? '' : ' disabled') + '>' +
          R.escapar(valor || '') + '</textarea>';
      } else if (b.t === 'texto') {
        cuerpo = '<input class="pa-entrada g-bloque" id="' + idc + '" data-bloque="' + i + '" ' +
          'value="' + R.escapar(valor || '') + '"' + (puede ? '' : ' disabled') + '>';
      } else {
        cuerpo = '<textarea class="pa-entrada g-bloque" id="' + idc + '" data-bloque="' + i + '" rows="4"' +
          (puede ? '' : ' disabled') + '>' + R.escapar(valor || '') + '</textarea>';
      }

      return '<div class="pa-campo">' +
        '<div class="pa-campo-cab"><h3>' + R.escapar(b.et) + '</h3>' +
        '<span class="pa-peso">' + b.t + '</span></div>' +
        (b.ay ? '<p class="pa-campo-ayuda">' + R.escapar(b.ay) + '</p>' : '') +
        cuerpo + '</div>';
    }).join('');

    return '<div class="hoja-ancha prosa">' +
      R.migas([{ texto: 'Panel', ruta: '#/panel' },
               { texto: p.nombre, ruta: '#/proyectos/' + p.id },
               { texto: 'Documentos', ruta: '#/proyectos/' + p.id + '/documentos' },
               { texto: d.nombre }]) +

      '<div class="g-doc-cab-editor">' +
        '<div>' +
          '<div class="eyebrow">' + R.escapar(art.categoria) + ' · v' + (d.version || 1) + '</div>' +
          '<h1 class="titulo-pagina">' + R.escapar(d.nombre) + '</h1>' +
          '<p class="bajada">' + R.escapar(art.descripcion) + '</p>' +
        '</div>' +
        '<div class="g-doc-estado-grande ' + d.estado + '">' + etiquetaDoc(d.estado) + '</div>' +
      '</div>' +

      (proc
        ? '<div class="nota"><div class="nota-titulo">Origen</div>Este documento es salida del proceso ' +
          '<a class="ref" href="#/proyectos/' + p.id + '/proceso/' + proc.id + '">' + proc.cod + ' ' + proc.nombre + '</a>.</div>'
        : '') +

      '<div class="g-doc-barra">' +
        UI.barra(comp, UI.colorPorcentaje(comp)) +
        '<span class="pa-contador" id="g-doc-completitud">' + comp + ' % completo</span>' +
        (puede
          ? (d.estado === 'borrador'
              ? '<button class="btn" data-o="doc-estado" data-valor="revision">Enviar a revisión</button>'
              : d.estado === 'revision'
                ? '<button class="btn primario" data-o="doc-estado" data-valor="aprobado">Aprobar</button>' +
                  '<button class="btn" data-o="doc-estado" data-valor="borrador">Devolver a borrador</button>'
                : '<button class="btn" data-o="doc-nueva-version">Nueva versión</button>')
          : '') +
        '<button class="btn" data-o="doc-exportar">Descargar (.md)</button>' +
        (puede ? '<button class="btn" data-o="doc-borrar">Eliminar</button>' : '') +
      '</div>' +

      '<input type="hidden" id="g-doc-id" value="' + d.id + '">' +
      '<div class="pa-campos">' + bloques + '</div>' +

      '<nav class="nav-secuencia">' +
        '<a href="#/proyectos/' + p.id + '/documentos"><div class="dir">← Volver</div>' +
        '<div class="tit">Documentos del proyecto</div></a>' +
        (proc ? '<a class="sig" href="#/proyectos/' + p.id + '/proceso/' + proc.id + '">' +
          '<div class="dir">Proceso de origen →</div><div class="tit">' + proc.cod + ' ' + R.escapar(proc.nombre) + '</div></a>' : '') +
      '</nav>' +
      '</div>';
  }

  return { tab: tabDocumentos, editor: editorDocumento };
})();
