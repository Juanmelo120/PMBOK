/* ═══════════════════════════════════════════════════════════
   obra/equipo.js — El equipo, las invitaciones y la configuración
   ───────────────────────────────────────────────────────────
   Quién trabaja en el proyecto y con qué rol, los códigos para que
   entren los compañeros y los ajustes que decide quien lo dirige.
   ═══════════════════════════════════════════════════════════ */

window.ObraEquipo = (function () {
  'use strict';

  var R = window.Render;

  /* ══════════════ 10 · EQUIPO ══════════════ */

  function tabEquipo(p) {
    var miembros = Gestor.lista('miembros', { proyectoId: p.id });
    var puede = Gestor.puede(p.id, 'dirigir');
    var met = Gestor.metodologia(p.metodologia);

    var ROLES_PROYECTO = Gestor.rolesProyecto;
    var QUE_PUEDE = { dirigir: 'dirige', editar: 'edita', ver: 'solo ve' };

    var listaMiembros = miembros.map(function (m) {
      var u = Gestor.uno('usuarios', m.usuarioId);
      var esYo = u && Gestor.usuarioActual() && u.id === Gestor.usuarioActual().id;
      return '<div class="g-miembro">' +
        UI.avatar(u ? u.nombre : '?') +
        '<div class="g-miembro-datos">' +
          '<b>' + R.escapar(u ? u.nombre : 'desconocido') + (esYo ? ' (tú)' : '') + '</b>' +
          '<span>' + R.escapar(u ? u.correo : '') + '</span>' +
        '</div>' +
        (puede
          ? '<select class="g-mover" data-rol-miembro="' + m.id + '">' + ROLES_PROYECTO.map(function (r) {
              return '<option value="' + r.id + '"' + (m.rol === r.id ? ' selected' : '') + '>' + r.nombre + '</option>';
            }).join('') + '</select>' +
            (miembros.length > 1 ? '<button class="g-mini-x" data-o="quitar-miembro" data-id="' + m.id + '">×</button>' : '')
          : '<span class="pa-contador">' + (ROLES_PROYECTO.filter(function (r) { return r.id === m.rol; })[0] || {}).nombre + '</span>') +
        '</div>';
    }).join('');

    var candidatos = Gestor.lista('usuarios').filter(function (u) {
      return u.activo && !miembros.some(function (m) { return m.usuarioId === u.id; });
    });

    var fases = (p.fases || []).map(function (f, i) {
      return '<div class="g-fase"><span class="g-fase-n">' + (i + 1) + '</span>' +
        '<b>' + R.escapar(f.nombre) + '</b>' +
        (puede ? '<button class="g-mini-x" data-o="borrar-fase" data-id="' + f.id + '">×</button>' : '') +
        '</div>';
    }).join('');

    return '<h2>Miembros del equipo <span class="pa-conteo">' + miembros.length + '</span></h2>' +
      '<div class="g-miembros">' + listaMiembros + '</div>' +
      '<p class="g-roles-nivel">' + ROLES_PROYECTO.map(function (r) {
        return '<span><b>' + R.escapar(r.nombre) + '</b> ' + QUE_PUEDE[r.nivel] + '</span>';
      }).join('') + '</p>' +
      (puede
        ? '<div class="pa-panel">' +
          UI.fila([
            UI.texto('nmb-correo', 'Añadir compañero por correo', '', {
              tipo: 'email', placeholder: 'compañero@correo.com', lista: 'nmb-sugerencias',
              ayuda: 'Debe haber creado su cuenta. Escribe para ver sugerencias.'
            }),
            UI.selector('nmb-rol', 'Rol en el proyecto', ROLES_PROYECTO, 'equipo')
          ]) +
          '<datalist id="nmb-sugerencias">' + candidatos.map(function (u) {
            return '<option value="' + R.escapar(u.correo) + '">' + R.escapar(u.nombre) + '</option>';
          }).join('') + '</datalist>' +
          '<div id="nmb-error"></div>' +
          '<div class="tarjeta-pie"><button class="btn primario" data-o="agregar-miembro">Agregar miembro</button>' +
          '<span class="pa-aviso-inline">Quien aún no tenga cuenta puede crearla y entrar con un código de invitación.</span></div>' +
          '</div>'
        : '') +
      (puede ? panelInvitaciones(p) : '') +

      '<h2>Configuración del proyecto</h2>' +
      (puede
        ? '<div class="pa-panel">' +
          UI.fila([
            UI.texto('cp-nombre', 'Nombre', p.nombre),
            UI.selector('cp-estado', 'Estado', [
              { id: 'activo', nombre: 'Activo' }, { id: 'pausa', nombre: 'En pausa' },
              { id: 'cerrado', nombre: 'Cerrado' }, { id: 'cancelado', nombre: 'Cancelado' }
            ], p.estado)
          ]) +
          UI.area('cp-descripcion', 'Descripción', p.descripcion, { filas: 2 }) +
          UI.fila([
            UI.texto('cp-inicio', 'Inicio', p.inicio || '', { tipo: 'date' }),
            UI.texto('cp-fin', 'Fin previsto', p.fin || '', { tipo: 'date' }),
            UI.texto('cp-presupuesto', 'Presupuesto (BAC)', p.presupuesto || '', { tipo: 'number', min: 0 }),
            UI.texto('cp-moneda', 'Moneda', p.moneda || 'USD')
          ]) +
          UI.fila([
            UI.selector('cp-portafolio', 'Portafolio',
              [{ id: '', nombre: '— Sin portafolio —' }].concat(Gestor.lista('portafolios').map(function (x) {
                return { id: x.id, nombre: x.nombre }; })), p.portafolioId || ''),
            UI.selector('cp-roca', 'Roca de gerencia',
              [{ id: '', nombre: '— Sin roca —' }].concat(Gestor.lista('rocas').map(function (r) {
                return { id: r.id, nombre: r.trimestre + ' · ' + r.titulo }; })), p.rocaId || ''),
            UI.texto('cp-wip', 'Límite de WIP', p.wip || 3, { tipo: 'number', min: 1, paso: 1 })
          ]) +
          '<div class="g-campo"><label class="g-etiqueta">Metodología (adaptación)' +
          '<span>Cambiarla reordena el flujo y ajusta qué procesos son iterativos</span></label>' +
          UI.opciones('met-proyecto', PMBOK.metodologias.map(function (m) {
            return { id: m.id, nombre: m.nombre, icono: m.icono, lema: m.lema };
          }), p.metodologia) + '</div>' +
          '<div class="tarjeta-pie"><button class="btn primario" data-o="guardar-proyecto">Guardar cambios</button>' +
          '<button class="btn" data-o="borrar-proyecto">Eliminar proyecto</button></div>' +
          '</div>'
        : '<p style="color:var(--tinta-3);font-size:13.2px">Solo el líder del proyecto o un administrador pueden cambiar la configuración.</p>') +

      '<h2>' + (met.id === 'agil' ? 'Sprints' : 'Fases') + '</h2>' +
      '<div class="g-fases">' + (fases || '<p style="color:var(--tinta-3);font-size:13.2px">Sin fases declaradas.</p>') + '</div>' +
      (puede
        ? '<div class="tarjeta-pie"><button class="btn" data-o="agregar-fase">+ Añadir fase</button></div>'
        : '');
  }

  /* Códigos con los que los compañeros entran al equipo. Solo para quien dirige. */
  function panelInvitaciones(p) {
    var roles = Gestor.rolesProyecto.filter(function (r) { return r.id !== 'lider'; });
    var nombreDelRol = function (id) { return (roles.filter(function (r) { return r.id === id; })[0] || { nombre: id }).nombre; };

    var filas = Gestor.invitacionesDe(p.id).map(function (inv) {
      var vigente = Gestor.invitacionVigente(inv);
      return '<div class="g-invitacion' + (vigente ? '' : ' caducada') + '">' +
        '<code class="g-codigo" aria-label="Código ' + R.escapar(inv.codigo.split('').join(' ')) + '">' +
          R.escapar(Gestor.codigoLegible(inv.codigo)) + '</code>' +
        '<div class="g-invitacion-datos">' +
          '<b>' + R.escapar(nombreDelRol(inv.rol)) + '</b>' +
          '<span>' + (inv.expira ? (vigente ? 'Caduca el ' : 'Caducó el ') + UI.fecha(inv.expira) : 'No caduca') +
          ' · ' + (inv.usos || 0) + ' uso' + (inv.usos === 1 ? '' : 's') + '</span>' +
        '</div>' +
        (vigente ? '<button class="pa-mini" data-o="copiar-codigo" data-id="' + inv.id + '">Copiar</button>' : '') +
        '<button class="g-mini-x" data-o="borrar-invitacion" data-id="' + inv.id + '" title="Retirar el código" ' +
          'aria-label="Retirar el código">×</button>' +
        '</div>';
    }).join('');

    return '<h2>Invitar al equipo</h2>' +
      '<div class="pa-panel">' +
        '<p class="g-invitar-ayuda">Genera un código y compártelo con tu grupo. Cada compañero lo escribe en ' +
          '<b>Panel → Unirme con un código</b> y entra con el rol elegido. Nunca da el rol de líder: ese lo asignas tú en la lista de miembros.</p>' +
        (filas ? '<div class="g-invitaciones">' + filas + '</div>' : '') +
        UI.fila([
          UI.selector('ninv-rol', 'Rol que da el código', roles.map(function (r) {
            return { id: r.id, nombre: r.nombre + ' (' + { editar: 'edita', ver: 'solo ve' }[r.nivel] + ')' };
          }), 'equipo'),
          UI.selector('ninv-dias', 'Validez', [
            { id: '7', nombre: '7 días' }, { id: '30', nombre: '30 días' }, { id: '', nombre: 'Sin caducidad' }
          ], '7')
        ]) +
        '<div class="tarjeta-pie"><button class="btn primario" data-o="crear-invitacion">' +
          Iconos.svg('mas') + ' Generar código</button></div>' +
      '</div>';
  }

  return { tab: tabEquipo };
})();
