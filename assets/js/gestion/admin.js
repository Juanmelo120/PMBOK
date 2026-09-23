/* ═══════════════════════════════════════════════════════════
   gestion/admin.js — Administración de cuentas, permisos y datos
   ───────────────────────────────────────────────────────────
   Solo para quien administra: las cuentas, sus permisos por
   proyecto, la copia de seguridad y el traslado de los datos del
   navegador al servidor.
   ═══════════════════════════════════════════════════════════ */

window.GestionAdmin = (function () {
  'use strict';

  var R = window.Render;

  /* ══════════════ ADMINISTRACIÓN ══════════════ */

  function admin() {
    if (!Gestor.esAdmin()) {
      return '<div class="hoja">' + UI.vacio('🔒', 'Solo para administradores',
        'Tu cuenta no tiene permisos de administración.') + '</div>';
    }

    var usuarios = Gestor.lista('usuarios');
    var filas = usuarios.map(function (u) {
      var permisos = Gestor.permisosDe(u.id);
      var proyectos = Gestor.lista('proyectos').filter(function (p) { return p.directorId === u.id; }).length;
      var rol = Gestor.roles.filter(function (r) { return r.id === u.rol; })[0] || { nombre: u.rol };
      return '<tr>' +
        '<td><div class="g-usuario">' + UI.avatar(u.nombre) +
          '<div><b>' + R.escapar(u.nombre) + '</b><span>' + R.escapar(u.correo) +
          (u.origen === 'registro' ? ' · se registró solo' : '') + '</span></div></div></td>' +
        '<td>' + R.escapar(rol.nombre) + '</td>' +
        '<td>' + permisos.length + ' permiso' + (permisos.length === 1 ? '' : 's') + ' · ' + proyectos + ' dirigido' + (proyectos === 1 ? '' : 's') + '</td>' +
        '<td>' + UI.pastilla(u.activo ? 'activo' : 'inactivo', u.activo ? 'ok' : 'falla') + '</td>' +
        '<td class="g-acciones">' +
          '<button class="pa-mini" data-g="permisos" data-id="' + u.id + '">Permisos</button>' +
          '<button class="pa-mini" data-g="clave" data-id="' + u.id + '">Contraseña</button>' +
          (u.id !== 'u-admin'
            ? '<button class="pa-mini" data-g="alternar-usuario" data-id="' + u.id + '">' +
              (u.activo ? 'Desactivar' : 'Activar') + '</button>'
            : '') +
        '</td></tr>';
    }).join('');

    return '<div class="hoja-ancha prosa">' +
      '<div class="eyebrow">Solo administradores</div>' +
      '<div class="g-cabecera">' +
        '<h1 class="titulo-pagina" style="margin:0">Administración</h1>' +
        '<button class="btn primario" data-g="abrir-nuevo-usuario">' + Iconos.svg('mas') + ' Nuevo usuario</button>' +
      '</div>' +
      '<p class="bajada">Crea cuentas y concede permisos por portafolio, programa o proyecto. ' +
      'Los permisos se suman: siempre gana el nivel más alto.</p>' +
      GestionSupervision.pestanas('cuentas') +

      '<div id="g-nuevo-usuario" hidden><div class="pa-panel">' +
        '<div id="g-error-usuario"></div>' +
        UI.fila([
          UI.texto('nu-nombre', 'Nombre', '', { placeholder: 'Nombre y apellido' }),
          UI.texto('nu-correo', 'Correo', '', { tipo: 'email', placeholder: 'persona@organizacion.com' })
        ]) +
        UI.fila([
          UI.texto('nu-clave', 'Contraseña inicial', '', { tipo: 'text', placeholder: 'mínimo 6 caracteres' }),
          UI.selector('nu-rol', 'Rol', Gestor.roles, 'miembro')
        ]) +
        '<div class="tarjeta-pie"><button class="btn primario" data-g="crear-usuario">Crear usuario</button>' +
        '<button class="btn" data-g="cerrar-nuevo-usuario">Cancelar</button></div>' +
      '</div></div>' +

      '<div class="envoltura-tabla"><table class="pa-tabla">' +
      '<thead><tr><th>Usuario</th><th>Rol</th><th>Accesos</th><th>Estado</th><th></th></tr></thead>' +
      '<tbody>' + filas + '</tbody></table></div>' +

      '<div id="g-panel-permisos"></div>' +

      '<h2>Qué puede hacer cada rol</h2>' +
      R.tabla(['Rol', 'Alcance'], Gestor.roles.map(function (r) { return [r.nombre, r.descripcion]; })) +

      '<h2>Datos</h2>' +
      (Gestor.enServidor()
        ? '<p>La información del gestor vive en el servidor (PostgreSQL). Expórtala para conservar una copia o ' +
          'llevarla a otro equipo. Las contraseñas no se incluyen en la exportación; al importar, las cuentas ' +
          'nuevas reciben la contraseña provisional <code>cambiar123</code> y deben cambiarla al entrar.</p>'
        : '<p>Toda la información del gestor vive en este navegador. Expórtala para conservarla o llevarla a otro equipo. ' +
          'Las contraseñas no se incluyen en la exportación.</p>') +
      '<div class="tarjeta-pie">' +
        '<button class="btn" data-g="exportar-bd">Exportar datos (.json)</button>' +
        '<label class="btn" for="g-importar">Importar datos</label>' +
        '<input type="file" id="g-importar" accept=".json" hidden>' +
        '<button class="btn" data-g="reiniciar-bd">Borrar todo</button>' +
      '</div>' +
      panelMigracion() +
      '</div>';
  }

  /* Lo que quedó guardado en este navegador antes de usar el servidor */
  function panelMigracion() {
    if (!Gestor.enServidor()) return '';
    var d = Gestor.datosDelNavegador();
    if (!d) return '';
    function n(v, uno, varios) { return v + ' ' + (v === 1 ? uno : varios); }
    return '<div class="pa-panel g-migracion" id="g-migracion">' +
      '<div class="pa-panel-cab"><h2 style="margin:0">Datos guardados en este navegador</h2></div>' +
      '<p>Este navegador conserva trabajo del modo local: ' +
        [n(d.proyectos, 'proyecto', 'proyectos'), n(d.documentos, 'documento', 'documentos'),
         n(d.archivos, 'archivo', 'archivos'), n(d.usuarios, 'cuenta', 'cuentas')].join(' · ') + '.</p>' +
      '<p>Puedes llevarlo al servidor. <b>Reemplaza todos los datos que haya ahora en el servidor</b>; ' +
        'los archivos se suben uno a uno y lo del navegador no se borra.</p>' +
      '<div id="g-migracion-estado"></div>' +
      '<div class="tarjeta-pie"><button class="btn primario" data-g="llevar-al-servidor">Llevar al servidor</button></div>' +
      '</div>';
  }

  function panelPermisos(usuarioId) {
    var u = Gestor.uno('usuarios', usuarioId);
    if (!u) return '';
    var permisos = Gestor.permisosDe(usuarioId);
    var portafolios = Gestor.lista('portafolios');
    var proyectos = Gestor.lista('proyectos');

    var ambitos = [];
    portafolios.forEach(function (p) { ambitos.push({ id: 'portafolio:' + p.id, nombre: 'Portafolio: ' + p.nombre }); });
    Gestor.lista('programas').forEach(function (p) { ambitos.push({ id: 'programa:' + p.id, nombre: 'Programa: ' + p.nombre }); });
    proyectos.forEach(function (p) { ambitos.push({ id: 'proyecto:' + p.id, nombre: 'Proyecto: ' + p.nombre }); });

    return '<div class="pa-panel" id="g-permisos-abierto">' +
      '<div class="pa-panel-cab"><h2 style="margin:0">Permisos de ' + R.escapar(u.nombre) + '</h2>' +
      '<button class="btn" data-g="cerrar-permisos">Cerrar</button></div>' +
      (permisos.length
        ? '<div class="envoltura-tabla"><table class="pa-tabla"><thead><tr><th>Ámbito</th><th>Nivel</th><th></th></tr></thead><tbody>' +
          permisos.map(function (p) {
            var ref = Gestor.uno(p.ambito === 'portafolio' ? 'portafolios' : p.ambito === 'programa' ? 'programas' : 'proyectos', p.refId);
            return '<tr><td>' + p.ambito + ' · ' + R.escapar(ref ? ref.nombre : '(eliminado)') + '</td>' +
              '<td>' + p.nivel + '</td>' +
              '<td><button class="g-mini-x" data-g="revocar" data-id="' + p.id + '">×</button></td></tr>';
          }).join('') + '</tbody></table></div>'
        : '<p style="color:var(--tinta-3);font-size:13.2px">Sin permisos específicos. Solo ve lo que dirige o donde es miembro.</p>') +
      (ambitos.length
        ? UI.fila([
            UI.selector('perm-ambito', 'Conceder acceso a', ambitos, ambitos[0].id),
            UI.selector('perm-nivel', 'Nivel', [
              { id: 'ver', nombre: 'Ver' }, { id: 'editar', nombre: 'Editar' }, { id: 'dirigir', nombre: 'Dirigir' }
            ], 'ver')
          ]) +
          '<input type="hidden" id="perm-usuario" value="' + usuarioId + '">' +
          '<div class="tarjeta-pie"><button class="btn primario" data-g="conceder">Conceder</button></div>'
        : '<p style="color:var(--tinta-3);font-size:13.2px">Crea antes un portafolio o un proyecto.</p>') +
      '</div>';
  }

  return { admin: admin, panelPermisos: panelPermisos };
})();
