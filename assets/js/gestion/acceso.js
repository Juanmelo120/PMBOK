/* ═══════════════════════════════════════════════════════════
   gestion/acceso.js — Entrar, crear cuenta y cambiar la contraseña
   ───────────────────────────────────────────────────────────
   Las tres pantallas que se ven sin sesión, más la que obliga a
   cambiar una contraseña que otra persona conoce.
   ═══════════════════════════════════════════════════════════ */

window.GestionAcceso = (function () {
  'use strict';

  var R = window.Render;

  /* ══════════════ ACCESO ══════════════ */

  function entrar() {
    var servidor = Gestor.enServidor();
    var cuentaInicial = Gestor.mostrarCuentaInicial();

    function rasgo(icono, titulo, texto) {
      return '<li>' + Iconos.svg(icono) + '<span><b>' + titulo + '</b>' + texto + '</span></li>';
    }

    /* Muestra hecha con las mismas piezas del panel, no una captura */
    var muestra =
      '<div class="g-acceso-muestra" aria-hidden="true">' +
        '<div class="g-proyecto">' +
          '<div class="g-proyecto-cab"><div>' +
            '<div class="g-proyecto-nombre">Sistema de nómina para 14 sedes</div>' +
            '<div class="g-proyecto-meta"><span class="g-metodo">' + Iconos.svg('predictivo') + ' Predictivo</span>' +
            '<span>' + Iconos.svg('carpeta') + ' Transformación digital</span></div>' +
          '</div>' + UI.anillo(62) + '</div>' +
          '<div class="g-siguiente"><span>Siguiente</span><b><i>2.3.2</i> Desarrollar el Cronograma</b></div>' +
        '</div>' +
        '<div class="g-proyecto"><div class="g-proyecto-cab"><div>' +
          '<div class="g-proyecto-nombre">App de reservas para clínicas</div>' +
          '<div class="g-proyecto-meta"><span class="g-metodo">' + Iconos.svg('agil') + ' Ágil</span></div>' +
        '</div>' + UI.anillo(28) + '</div></div>' +
      '</div>';

    return '<div class="g-acceso">' +
      '<section class="g-acceso-escena">' +
        '<div class="g-acceso-marca"><span class="marca-glifo" aria-hidden="true">◆</span>' +
          '<span>Gestor PMBOK<sup>®</sup> 8</span></div>' +
        '<h1>Dirige proyectos con el <em>PMBOK 8</em></h1>' +
        '<p class="g-acceso-lema">Los 40 procesos guiados, del acta de constitución al informe final, mientras aprendes la guía.</p>' +
        '<ul class="g-acceso-rasgos">' +
          rasgo('flujo', '40 procesos guiados', 'Entradas, herramientas y salidas en cada paso') +
          rasgo('documentos', '42 documentos', 'Se generan en secuencia, del acta al cierre') +
          rasgo('dividir', 'Cuatro metodologías', 'Cascada, ágil, híbrido o kanban adaptan el flujo') +
          rasgo('equipo', 'Equipos y permisos', 'Por portafolio, programa o proyecto') +
        '</ul>' +
        muestra +
      '</section>' +

      '<section class="g-acceso-formulario">' +
        '<div class="g-acceso-tarjeta">' +
          '<h2>Iniciar sesión</h2>' +
          '<p class="g-acceso-bajada">Entra a tu espacio de gestión de proyectos.</p>' +
          '<div id="g-error-acceso"></div>' +
          UI.texto('acc-correo', 'Correo electrónico', '', { tipo: 'email', placeholder: 'tu@organizacion.com' }) +
          UI.texto('acc-clave', 'Contraseña', '', { tipo: 'password', placeholder: '••••••••' }) +
          '<button class="btn primario g-ancho" data-g="entrar">Entrar ' + Iconos.svg('flecha-der', 'ic-flecha') + '</button>' +
          (Gestor.registroAbierto()
            ? '<p class="g-acceso-alterna">¿Es tu primera vez? <a class="ref" href="#/registro">Crear cuenta</a></p>'
            : '') +
          (cuentaInicial
            ? '<div class="nota"><div class="nota-titulo">Cuenta inicial</div>' +
              '<code>admin@pmbok.local</code> · <code>admin123</code><br>' +
              '<span style="font-size:12.5px;color:var(--tinta-2)">' +
              (servidor
                ? 'Al entrar se te pedirá elegir una contraseña propia.'
                : 'Todo se guarda en este navegador. El control de acceso ' +
                  'separa espacios de trabajo entre compañeros; no protege secretos.') + '</span>' +
              '<div class="tarjeta-pie"><button class="btn" data-g="acceso-demo">' + Iconos.svg('rayo') + ' Rellenar y entrar</button></div></div>'
            : '') +
          '<p class="g-modo-datos">' + (servidor
            ? Iconos.svg('check-circulo') + ' Conectado al servidor: los datos se guardan en PostgreSQL.'
            : 'Modo local: los datos se guardan en este navegador.') + '</p>' +
        '</div>' +
      '</section>' +
      '</div>';
  }

  /* Cuenta propia: cada alumno la crea y después entra al proyecto de su
     grupo con el código que le da el líder */
  function registro() {
    var servidor = Gestor.enServidor();
    var creaProyectos = Gestor.registroRol() === 'director';
    var cuerpo = Gestor.registroAbierto()
      ? '<h2>Crear cuenta</h2>' +
        '<p class="g-acceso-bajada">' + (creaProyectos
          ? 'Al terminar entras al Panel: crea tu proyecto y añade a tus compañeros desde <b>Equipo</b>, ' +
            'o únete al de otro con su <b>código de invitación</b>.'
          : 'Tu cuenta empieza sin proyectos. Pide al líder de tu grupo que te añada o te dé ' +
            'su <b>código de invitación</b>.') + '</p>' +
        '<div id="g-error-registro"></div>' +
        UI.texto('rg-nombre', 'Nombre y apellido', '', { placeholder: 'Ej.: Laura Díaz' }) +
        UI.texto('rg-correo', 'Correo electrónico', '', { tipo: 'email', placeholder: 'tu@correo.com' }) +
        UI.texto('rg-clave', 'Contraseña', '', { tipo: 'password', placeholder: 'mínimo 6 caracteres' }) +
        UI.texto('rg-repetir', 'Repite la contraseña', '', { tipo: 'password', placeholder: '••••••••' }) +
        '<button class="btn primario g-ancho" data-g="registrarse">Crear cuenta ' + Iconos.svg('flecha-der', 'ic-flecha') + '</button>' +
        '<p class="g-acceso-alterna">¿Ya tienes cuenta? <a class="ref" href="#/entrar">Inicia sesión</a></p>' +
        '<p class="g-modo-datos">' + (servidor
          ? Iconos.svg('check-circulo') + ' Tu cuenta se guarda en el servidor.'
          : 'Modo local: la cuenta existe solo en este navegador.') + '</p>'
      : '<h2>Registro cerrado</h2>' +
        '<p class="g-acceso-bajada">En este servidor las cuentas las crea un administrador. Pídele la tuya.</p>' +
        '<a class="btn g-ancho" href="#/entrar">Volver a iniciar sesión</a>';

    return '<div class="g-acceso g-acceso-solo">' +
      '<section class="g-acceso-formulario">' +
        '<div class="g-acceso-tarjeta">' +
          '<div class="g-acceso-marca"><span class="marca-glifo" aria-hidden="true">◆</span>' +
            '<span>Gestor PMBOK<sup>®</sup> 8</span></div>' +
          cuerpo +
        '</div>' +
      '</section>' +
      '</div>';
  }

  /* Contraseña que otra persona conoce (la inicial, la que puso un
     administrador o la provisional de una importación) */
  function cambiarClave() {
    var u = Gestor.usuarioActual() || {};
    return '<div class="g-acceso g-acceso-solo">' +
      '<section class="g-acceso-formulario">' +
        '<div class="g-acceso-tarjeta">' +
          '<div class="g-acceso-marca"><span class="marca-glifo" aria-hidden="true">◆</span>' +
            '<span>Gestor PMBOK<sup>®</sup> 8</span></div>' +
          '<h2>Elige tu contraseña</h2>' +
          '<p class="g-acceso-bajada">Hola, ' + R.escapar(u.nombre || '') + '. La contraseña con la que entraste ' +
            'la conoce otra persona, así que debes cambiarla antes de continuar.</p>' +
          '<div id="g-error-clave"></div>' +
          UI.texto('cc-actual', 'Contraseña actual', '', { tipo: 'password', placeholder: '••••••••' }) +
          UI.texto('cc-nueva', 'Nueva contraseña', '', { tipo: 'password', placeholder: 'mínimo 6 caracteres' }) +
          UI.texto('cc-repetir', 'Repite la nueva contraseña', '', { tipo: 'password', placeholder: '••••••••' }) +
          '<button class="btn primario g-ancho" data-g="cambiar-clave">Guardar y continuar ' +
            Iconos.svg('flecha-der', 'ic-flecha') + '</button>' +
          '<div class="tarjeta-pie"><button class="btn" data-g="salir">Salir</button></div>' +
        '</div>' +
      '</section>' +
      '</div>';
  }

  return { entrar: entrar, registro: registro, cambiarClave: cambiarClave };
})();
