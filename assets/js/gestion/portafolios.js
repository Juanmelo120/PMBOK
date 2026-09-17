/* ═══════════════════════════════════════════════════════════
   gestion/portafolios.js — Portafolios y programas
   ───────────────────────────────────────────────────────────
   La cartera de la organización: qué proyectos cuelgan de cada
   portafolio y de cada programa.
   ═══════════════════════════════════════════════════════════ */

window.GestionPortafolios = (function () {
  'use strict';

  var R = window.Render;

  /* ══════════════ PORTAFOLIOS ══════════════ */

  function portafolios() {
    var lista = Gestor.lista('portafolios');
    var proyectos = Gestor.proyectosVisibles();
    var sinPortafolio = proyectos.filter(function (p) { return !p.portafolioId; });
    var gestiona = Gestor.puedeGestionar();

    function grupo(nombre, icono, id, proys, descripcion) {
      var programas = id ? Gestor.lista('programas', { portafolioId: id }) : [];
      return '<div class="g-portafolio">' +
        '<div class="g-portafolio-cab">' +
          '<h3>' + (Iconos.resolver(icono) || icono) + ' ' + R.escapar(nombre) + '</h3>' +
          '<span class="g-portafolio-conteo">' + proys.length + ' proyecto' + (proys.length === 1 ? '' : 's') + '</span>' +
          (id && gestiona ? '<button class="g-mini-x" data-g="borrar-portafolio" data-id="' + id + '" title="Eliminar portafolio">×</button>' : '') +
        '</div>' +
        (descripcion ? '<p class="g-portafolio-desc">' + R.escapar(descripcion) + '</p>' : '') +
        (programas.length
          ? '<div class="g-programas">' + programas.map(function (pg) {
              var suyos = proys.filter(function (x) { return x.programaId === pg.id; });
              return '<div class="g-programa"><b>▸ ' + R.escapar(pg.nombre) + '</b> ' +
                '<span>' + suyos.length + ' proyecto' + (suyos.length === 1 ? '' : 's') + '</span></div>';
            }).join('') + '</div>'
          : '') +
        (proys.length
          ? '<div class="g-portafolio-proyectos">' + proys.map(function (p) {
              var met = Gestor.metodologia(p.metodologia);
              var pr = Gestor.progreso(p.id);
              return '<div class="g-fila-proyecto">' +
                '<a href="#/proyectos/' + p.id + '">' + (Iconos.resolver(met.icono) || Iconos.resolver(met.id)) + ' ' + R.escapar(p.nombre) + '</a>' +
                '<span class="g-fila-progreso">' + UI.barra(pr.porcentaje) + '</span>' +
                '<span class="g-fila-pct">' + pr.porcentaje + ' %</span>' +
                selectorDestino(p) +
                '</div>';
            }).join('') + '</div>'
          : '<p class="g-portafolio-vacio">Sin proyectos asignados.</p>') +
        (id && gestiona ? '<div class="tarjeta-pie"><button class="btn" data-g="nuevo-programa" data-id="' + id + '">+ Programa</button></div>' : '') +
        '</div>';
    }

    /* Mover de portafolio es configuración del proyecto: la decide quien lo dirige */
    function selectorDestino(p) {
      if (!Gestor.puede(p.id, 'dirigir')) return '';
      var opciones = [{ id: '', nombre: 'Sin portafolio' }].concat(
        lista.map(function (x) { return { id: x.id, nombre: x.nombre }; }));
      return '<select class="g-mover" data-mover="' + p.id + '">' + opciones.map(function (o) {
        return '<option value="' + o.id + '"' + ((p.portafolioId || '') === o.id ? ' selected' : '') + '>' +
          R.escapar(o.nombre) + '</option>';
      }).join('') + '</select>';
    }

    return '<div class="hoja-ancha prosa">' +
      '<div class="eyebrow">Organización</div>' +
      '<div class="g-cabecera">' +
        '<h1 class="titulo-pagina" style="margin:0">Portafolios y programas</h1>' +
        (gestiona ? '<button class="btn primario" data-g="abrir-nuevo-portafolio">' + Iconos.svg('mas') + ' Nuevo portafolio</button>' : '') +
      '</div>' +
      '<p class="bajada">Un portafolio agrupa programas y proyectos que compiten por los mismos recursos. ' +
      'Cambia el portafolio de un proyecto desde el selector de su fila.</p>' +

      '<div id="g-nuevo-portafolio" hidden>' +
        '<div class="pa-panel">' +
          UI.texto('npf-nombre', 'Nombre del portafolio', '', { placeholder: 'Ej.: Transformación digital 2026' }) +
          UI.area('npf-descripcion', 'Descripción', '', { filas: 2 }) +
          '<div class="tarjeta-pie"><button class="btn primario" data-g="crear-portafolio">Crear</button>' +
          '<button class="btn" data-g="cerrar-nuevo-portafolio">Cancelar</button></div>' +
        '</div>' +
      '</div>' +

      '<div class="g-portafolios">' +
        lista.map(function (pf) {
          return grupo(pf.nombre, '🗂️', pf.id,
            proyectos.filter(function (p) { return p.portafolioId === pf.id; }), pf.descripcion);
        }).join('') +
        grupo('Sin portafolio', '📁', null, sinPortafolio,
          'Proyectos que todavía no se han asignado a una cartera.') +
      '</div>' +
      '</div>';
  }

  return { portafolios: portafolios };
})();
