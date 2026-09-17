/* ═══════════════════════════════════════════════════════════
   vistas-gestor.js — Pantallas de la capa de gestión
   Acceso, panel, portafolios, agenda, EOS y administración.
   ═══════════════════════════════════════════════════════════ */

window.VistasGestor = (function () {
  'use strict';

  var R = window.Render;
  var recargar = function () {};

  /* ══════════════ ACCESO ══════════════ */

  function entrar() {
    var hayCuentas = Gestor.lista('usuarios').length;
    return '<div class="g-acceso">' +
      '<div class="g-acceso-marca">' +
        '<span class="marca-glifo" aria-hidden="true">◆</span>' +
        '<h1>Gestor PMBOK<sup>®</sup> 8</h1>' +
        '<p>Dirige proyectos aplicando los 40 procesos de la 8.ª edición mientras aprendes la guía.</p>' +
      '</div>' +

      '<div class="g-acceso-tarjeta">' +
        '<h2>Iniciar sesión</h2>' +
        '<p class="g-acceso-bajada">Entra a tu espacio de gestión de proyectos.</p>' +
        '<div id="g-error-acceso"></div>' +
        UI.texto('acc-correo', 'Correo electrónico', '', { tipo: 'email', placeholder: 'tu@organizacion.com' }) +
        UI.texto('acc-clave', 'Contraseña', '', { tipo: 'password', placeholder: '••••••••' }) +
        '<button class="btn primario g-ancho" data-g="entrar">Entrar</button>' +
        (hayCuentas === 1
          ? '<div class="nota" style="margin-top:18px"><div class="nota-titulo">Cuenta inicial</div>' +
            '<code>admin@pmbok.local</code> · <code>admin123</code><br>' +
            '<span style="font-size:12px;color:var(--tinta-3)">Todo se guarda en este navegador. El control de acceso ' +
            'separa espacios de trabajo entre compañeros; no protege secretos.</span>' +
            '<div class="tarjeta-pie"><button class="btn" data-g="acceso-demo">Rellenar y entrar</button></div></div>'
          : '') +
      '</div>' +

      '<div class="g-acceso-pie">' +
        '<div><b>40 procesos</b> con entradas, herramientas y salidas guiadas</div>' +
        '<div><b>42 documentos</b> que se generan en secuencia, del acta al informe final</div>' +
        '<div><b>Cascada, ágil, híbrido o kanban</b>: la aplicación adapta el flujo</div>' +
        '<div><b>Equipos y permisos</b> por portafolio, programa o proyecto</div>' +
      '</div>' +
      '</div>';
  }

  /* ══════════════ PANEL ══════════════ */

  function panel(abrirNuevo) {
    var u = Gestor.usuarioActual();
    var proyectos = Gestor.proyectosVisibles();
    var docs = 0, procesosOk = 0;
    proyectos.forEach(function (p) {
      docs += Gestor.documentosDe(p.id).length;
      procesosOk += Gestor.progreso(p.id).completados;
    });
    var activos = proyectos.filter(function (p) { return p.estado === 'activo'; }).length;

    var tarjetas = proyectos.length
      ? '<div class="g-proyectos">' + proyectos.map(tarjetaProyecto).join('') + '</div>'
      : '';

    return '<div class="hoja-ancha prosa">' +
      '<div class="eyebrow">Panel de control</div>' +
      '<div class="g-cabecera">' +
        '<h1 class="titulo-pagina" style="margin:0">Hola, ' + R.escapar((u.nombre || '').split(' ')[0]) + '</h1>' +
        '<button class="btn primario" data-g="abrir-nuevo-proyecto">Nuevo proyecto</button>' +
      '</div>' +
      '<p class="bajada">Ruta sugerida: empieza por <b>Iniciar el proyecto o fase</b> y genera el acta de constitución. ' +
      'Desde ahí, cada proceso te dirá qué necesita y qué documento produce.</p>' +

      '<div class="cifras" style="margin:0 0 28px">' +
        UI.cifra(activos, 'Proyectos activos') +
        UI.cifra(procesosOk, 'Procesos completados') +
        UI.cifra(docs, 'Documentos generados') +
        UI.cifra(Gestor.lista('portafolios').length, 'Portafolios') +
      '</div>' +

      '<div id="g-nuevo-proyecto"' + (abrirNuevo || !proyectos.length ? '' : ' hidden') + '>' +
        formularioProyecto() + '</div>' +

      (proyectos.length ? '<h2>Tus proyectos</h2>' + tarjetas : '') +
      '</div>';
  }

  function tarjetaProyecto(p) {
    var met = Gestor.metodologia(p.metodologia);
    var pr = Gestor.progreso(p.id);
    var s = Gestor.salud(p.id);
    var port = p.portafolioId ? Gestor.uno('portafolios', p.portafolioId) : null;
    var director = p.directorId ? Gestor.uno('usuarios', p.directorId) : null;

    return '<a class="g-proyecto" href="#/proyectos/' + p.id + '">' +
      '<div class="g-proyecto-cab">' +
        '<div>' +
          '<div class="g-proyecto-nombre">' + R.escapar(p.nombre) + '</div>' +
          '<div class="g-proyecto-meta">' +
            '<span class="g-metodo">' + met.icono + ' ' + R.escapar(met.nombre) + '</span>' +
            '<span>' + (port ? '🗂️ ' + R.escapar(port.nombre) : 'Sin portafolio') + '</span>' +
            (p.estado !== 'activo' ? UI.pastilla(p.estado, p.estado === 'cerrado' ? 'ok' : 'aviso') : '') +
          '</div>' +
        '</div>' +
        UI.anillo(pr.porcentaje, UI.colorPorcentaje(pr.porcentaje)) +
      '</div>' +
      (p.descripcion ? '<div class="g-proyecto-desc">' + R.escapar(p.descripcion.slice(0, 130)) + '</div>' : '') +
      siguientePaso(p) +
      '<div class="g-proyecto-pie">' +
        '<span>' + pr.completados + '/' + pr.aplicables + ' procesos</span>' +
        '<span>📄 ' + Gestor.documentosDe(p.id).length + '</span>' +
        (s.estado !== 'sin-datos' ? UI.pastilla(s.etiqueta, s.estado) : '') +
        '<span class="g-proyecto-director">' + UI.avatar(director ? director.nombre : '?') +
          R.escapar(director ? director.nombre : 'sin director') + '</span>' +
      '</div>' +
      '</a>';
  }

  function siguientePaso(p) {
    var sig = Gestor.siguienteProceso(p.id);
    if (!sig) return '<div class="g-siguiente hecho"><span>Todos los procesos cerrados</span></div>';
    var proc = Indice.proceso(sig.id);
    var enCurso = Gestor.estadoProceso(p.id, sig.id).estado === 'iniciado';
    return '<div class="g-siguiente"><span>' + (enCurso ? 'En curso' : 'Siguiente') + '</span>' +
      '<b><i>' + proc.cod + '</i> ' + R.escapar(proc.nombre) + '</b></div>';
  }

  function formularioProyecto() {
    var portafolios = [{ id: '', nombre: '— Sin portafolio —' }].concat(
      Gestor.lista('portafolios').map(function (p) { return { id: p.id, nombre: p.nombre }; }));
    var rocas = [{ id: '', nombre: '— Sin roca asociada —' }].concat(
      Gestor.lista('rocas').map(function (r) { return { id: r.id, nombre: r.trimestre + ' · ' + r.titulo }; }));

    return '<div class="pa-panel">' +
      '<div class="pa-panel-cab"><h2 style="margin:0">Nuevo proyecto</h2>' +
        '<button class="btn" data-g="cerrar-nuevo-proyecto">Cancelar</button></div>' +
      '<p style="color:var(--tinta-2);font-size:13.4px;margin:0 0 16px">' +
      'Se desplegará el mapa de los 40 procesos en el orden sugerido para la metodología que elijas.</p>' +
      '<div id="g-error-proyecto"></div>' +
      UI.texto('np-nombre', 'Nombre del proyecto', '', { placeholder: 'Ej.: Sistema de nómina para 14 sedes', requerido: true }) +
      UI.area('np-descripcion', 'Descripción', '', { filas: 2, placeholder: '¿Qué entregará el proyecto?' }) +
      '<div class="g-campo"><label class="g-etiqueta">Metodología<span>Determina el orden del flujo y la adaptación de los procesos</span></label>' +
      UI.opciones('metodologia', PMBOK.metodologias.map(function (m) {
        return { id: m.id, nombre: m.nombre, icono: m.icono, lema: m.lema };
      }), 'predictivo') + '</div>' +
      UI.fila([
        UI.selector('np-portafolio', 'Portafolio', portafolios, ''),
        UI.selector('np-roca', 'Roca de gerencia (EOS)', rocas, '')
      ]) +
      UI.fila([
        UI.texto('np-inicio', 'Fecha de inicio', UI.hoyISO(), { tipo: 'date' }),
        UI.texto('np-fin', 'Fin previsto', '', { tipo: 'date' }),
        UI.texto('np-presupuesto', 'Presupuesto (BAC)', '', { tipo: 'number', placeholder: '45000', min: 0 })
      ]) +
      '<div class="tarjeta-pie"><button class="btn primario" data-g="crear-proyecto">Crear proyecto</button></div>' +
      '</div>';
  }

  /* ══════════════ PORTAFOLIOS ══════════════ */

  function portafolios() {
    var lista = Gestor.lista('portafolios');
    var proyectos = Gestor.proyectosVisibles();
    var sinPortafolio = proyectos.filter(function (p) { return !p.portafolioId; });

    function grupo(nombre, icono, id, proys, descripcion) {
      var programas = id ? Gestor.lista('programas', { portafolioId: id }) : [];
      return '<div class="g-portafolio">' +
        '<div class="g-portafolio-cab">' +
          '<h3>' + icono + ' ' + R.escapar(nombre) + '</h3>' +
          '<span class="g-portafolio-conteo">' + proys.length + ' proyecto' + (proys.length === 1 ? '' : 's') + '</span>' +
          (id ? '<button class="g-mini-x" data-g="borrar-portafolio" data-id="' + id + '" title="Eliminar portafolio">×</button>' : '') +
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
                '<a href="#/proyectos/' + p.id + '">' + met.icono + ' ' + R.escapar(p.nombre) + '</a>' +
                '<span class="g-fila-progreso">' + UI.barra(pr.porcentaje, UI.colorPorcentaje(pr.porcentaje)) + '</span>' +
                '<span class="g-fila-pct">' + pr.porcentaje + ' %</span>' +
                selectorDestino(p) +
                '</div>';
            }).join('') + '</div>'
          : '<p class="g-portafolio-vacio">Sin proyectos asignados.</p>') +
        (id ? '<div class="tarjeta-pie"><button class="btn" data-g="nuevo-programa" data-id="' + id + '">+ Programa</button></div>' : '') +
        '</div>';
    }

    function selectorDestino(p) {
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
        '<button class="btn primario" data-g="abrir-nuevo-portafolio">Nuevo portafolio</button>' +
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

  /* ══════════════ AGENDA (calendario global) ══════════════ */

  function agenda(arg) {
    var hoy = new Date();
    var partes = String(arg || '').split('-');
    var anio = parseInt(partes[0], 10) || hoy.getFullYear();
    var mes = (parseInt(partes[1], 10) || (hoy.getMonth() + 1)) - 1;

    var eventos = Gestor.eventosDe(null);
    return '<div class="hoja-ancha prosa">' +
      '<div class="eyebrow">Agenda</div>' +
      '<h1 class="titulo-pagina">Calendario global</h1>' +
      '<p class="bajada">Fechas de todos los proyectos visibles: inicios y fines, límites de tareas, ' +
      'sprints, hitos y cortes de valor ganado.</p>' +
      calendario(anio, mes, eventos, '#/agenda/') +
      listaEventos(eventos, anio, mes) +
      '</div>';
  }

  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
               'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  function calendario(anio, mes, eventos, rutaBase) {
    var primero = new Date(anio, mes, 1);
    var diaSemana = (primero.getDay() + 6) % 7;   // lunes = 0
    var dias = new Date(anio, mes + 1, 0).getDate();
    var hoyISO = UI.hoyISO();

    var porDia = {};
    eventos.forEach(function (e) {
      if (!porDia[e.fecha]) porDia[e.fecha] = [];
      porDia[e.fecha].push(e);
    });

    var celdas = '';
    for (var i = 0; i < diaSemana; i++) celdas += '<div class="g-dia vacio"></div>';
    for (var d = 1; d <= dias; d++) {
      var iso = anio + '-' + String(mes + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      var evs = porDia[iso] || [];
      celdas += '<div class="g-dia' + (iso === hoyISO ? ' hoy' : '') + (evs.length ? ' con-eventos' : '') + '">' +
        '<div class="g-dia-num">' + d + '</div>' +
        evs.slice(0, 3).map(function (e) {
          return '<a class="g-evento ' + e.tipo + (e.extra === 'critico' ? ' critico' : '') + '" ' +
            'href="#/proyectos/' + e.ref + '" title="' + R.escapar(e.titulo) + '">' +
            R.escapar(e.titulo.slice(0, 28)) + '</a>';
        }).join('') +
        (evs.length > 3 ? '<div class="g-mas">+' + (evs.length - 3) + '</div>' : '') +
        '</div>';
    }

    var prevMes = mes === 0 ? 11 : mes - 1, prevAnio = mes === 0 ? anio - 1 : anio;
    var sigMes = mes === 11 ? 0 : mes + 1, sigAnio = mes === 11 ? anio + 1 : anio;

    return '<div class="g-calendario">' +
      '<div class="g-cal-cab">' +
        '<a class="btn" href="' + rutaBase + prevAnio + '-' + (prevMes + 1) + '">←</a>' +
        '<h3>' + MESES[mes].charAt(0).toUpperCase() + MESES[mes].slice(1) + ' ' + anio + '</h3>' +
        '<a class="btn" href="' + rutaBase + sigAnio + '-' + (sigMes + 1) + '">→</a>' +
        '<a class="btn" href="' + rutaBase + '">Hoy</a>' +
      '</div>' +
      '<div class="g-cal-dias">' + ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(function (x) {
        return '<div>' + x + '</div>'; }).join('') + '</div>' +
      '<div class="g-cal-rejilla">' + celdas + '</div>' +
      '<div class="g-leyenda">' +
        '<span class="g-evento proyecto">Proyecto</span>' +
        '<span class="g-evento hito">Hito</span>' +
        '<span class="g-evento tarea">Tarea</span>' +
        '<span class="g-evento sprint">Sprint</span>' +
        '<span class="g-evento evm">Corte EVM</span>' +
      '</div></div>';
  }

  function listaEventos(eventos, anio, mes) {
    var pref = anio + '-' + String(mes + 1).padStart(2, '0');
    var delMes = eventos.filter(function (e) { return e.fecha.indexOf(pref) === 0; });
    if (!delMes.length) return '<p style="color:var(--tinta-3);font-size:13.4px">Sin eventos este mes.</p>';
    return '<h2>Eventos del mes</h2>' + R.tabla(['Fecha', 'Tipo', 'Evento', 'Proyecto'],
      delMes.map(function (e) {
        var p = Gestor.uno('proyectos', e.ref);
        return [UI.fecha(e.fecha), e.tipo, e.titulo, p ? p.nombre : '—'];
      }));
  }

  /* ══════════════ EOS ══════════════ */

  function eos(seccion) {
    seccion = seccion || 'rocas';
    var pestanas = PMBOK.eos.secciones.map(function (s) {
      return '<a class="g-pestana' + (s.id === seccion ? ' activa' : '') + '" href="#/eos/' + s.id + '">' +
        '<span class="g-pestana-icono">' + s.icono + '</span>' +
        '<span><b>' + R.escapar(s.nombre) + '</b><em>' + R.escapar(s.lema) + '</em></span></a>';
    }).join('');

    var cuerpo =
      seccion === 'scorecard' ? eosScorecard() :
      seccion === 'vto' ? eosVto() :
      seccion === 'organigrama' ? eosOrganigrama() : eosRocas();

    return '<div class="hoja-ancha prosa">' +
      '<div class="eyebrow">Sistema operativo empresarial</div>' +
      '<h1 class="titulo-pagina">EOS — Gerencia general</h1>' +
      '<p class="bajada">' + PMBOK.eos.intro + '</p>' +
      '<div class="g-pestanas-eos">' + pestanas + '</div>' +
      cuerpo +
      '</div>';
  }

  function trimestreActual() {
    var d = new Date();
    return 'Q' + (Math.floor(d.getMonth() / 3) + 1) + '-' + d.getFullYear();
  }

  function eosRocas() {
    var trimestre = VistasGestor.trimestreElegido || trimestreActual();
    var rocas = Gestor.rocasDe(trimestre);

    var selector = '<div class="g-trimestres">' + PMBOK.trimestres.map(function (t) {
      return '<button class="g-trimestre' + (t === trimestre ? ' activo' : '') + '" data-g="trimestre" data-valor="' + t + '">' +
        t + '</button>';
    }).join('') + '<button class="btn primario" data-g="abrir-nueva-roca">Nueva roca</button></div>';

    var formulario = '<div id="g-nueva-roca" hidden><div class="pa-panel">' +
      UI.texto('nr-titulo', 'Título de la roca', '', { placeholder: 'Ej.: Reducir el costo administrativo por empleado un 25 %' }) +
      UI.area('nr-descripcion', 'Por qué importa', '', { filas: 2 }) +
      UI.fila([
        UI.selector('nr-responsable', 'Responsable', Gestor.lista('usuarios').map(function (u) {
          return { id: u.id, nombre: u.nombre }; }), (Gestor.usuarioActual() || {}).id),
        UI.selector('nr-estado', 'Estado', PMBOK.eos.estadosRoca, 'encamino')
      ]) +
      UI.area('nr-metas', 'Metas medibles', '', { filas: 3, ayuda: 'Una por línea. De una a tres.' }) +
      '<div class="tarjeta-pie"><button class="btn primario" data-g="crear-roca">Crear roca</button>' +
      '<button class="btn" data-g="cerrar-nueva-roca">Cancelar</button></div></div></div>';

    var cuerpo = rocas.length
      ? '<div class="g-rocas">' + rocas.map(function (r) {
          var resp = r.responsableId ? Gestor.uno('usuarios', r.responsableId) : null;
          var est = PMBOK.eos.estadosRoca.filter(function (e) { return e.id === r.estado; })[0] || PMBOK.eos.estadosRoca[0];
          var metas = (r.metas || []);
          var hechas = metas.filter(function (m) { return m.hecho; }).length;
          var vinculados = Gestor.lista('proyectos').filter(function (p) { return p.rocaId === r.id; });
          return '<div class="g-roca">' +
            '<div class="g-roca-cab">' +
              '<h3>🪨 ' + R.escapar(r.titulo) + '</h3>' +
              UI.pastilla(est.nombre, est.color) +
              '<button class="g-mini-x" data-g="borrar-roca" data-id="' + r.id + '" title="Eliminar">×</button>' +
            '</div>' +
            (r.descripcion ? '<p>' + R.escapar(r.descripcion) + '</p>' : '') +
            (metas.length
              ? '<ul class="g-metas">' + metas.map(function (m, i) {
                  return '<li><button class="pa-check' + (m.hecho ? ' activo' : '') + '" data-g="meta-roca" ' +
                    'data-id="' + r.id + '" data-i="' + i + '">✓</button>' + R.escapar(m.texto) + '</li>';
                }).join('') + '</ul>'
              : '') +
            '<div class="g-roca-pie">' +
              '<span>' + UI.avatar(resp ? resp.nombre : '?') + R.escapar(resp ? resp.nombre : 'sin responsable') + '</span>' +
              '<span>' + hechas + '/' + metas.length + ' metas</span>' +
              '<span>' + vinculados.length + ' proyecto' + (vinculados.length === 1 ? '' : 's') + ' vinculado' +
                (vinculados.length === 1 ? '' : 's') + '</span>' +
              '<select class="g-mover" data-estado-roca="' + r.id + '">' +
                PMBOK.eos.estadosRoca.map(function (e) {
                  return '<option value="' + e.id + '"' + (e.id === r.estado ? ' selected' : '') + '>' + e.nombre + '</option>';
                }).join('') + '</select>' +
            '</div></div>';
        }).join('') + '</div>'
      : UI.vacio('🪨', 'Sin rocas para ' + trimestre,
          'Define el objetivo trimestral más importante. De él se desprenden los portafolios y proyectos.');

    return selector + formulario +
      '<div class="nota"><div class="nota-titulo">Cómo se usa</div>' + PMBOK.eos.ayudaRocas + '</div>' + cuerpo;
  }

  function eosScorecard() {
    var metricas = Gestor.lista('metricas');
    var semanas = ultimasSemanas(13);

    var formulario = '<div id="g-nueva-metrica" hidden><div class="pa-panel">' +
      UI.fila([
        UI.texto('nm-nombre', 'Métrica', '', { placeholder: 'Ej.: Quejas de clientes' }),
        UI.texto('nm-meta', 'Meta', '', { placeholder: 'Ej.: ≤ 3' }),
        UI.selector('nm-responsable', 'Responsable', Gestor.lista('usuarios').map(function (u) {
          return { id: u.id, nombre: u.nombre }; }), (Gestor.usuarioActual() || {}).id)
      ]) +
      UI.selector('nm-direccion', 'Dirección deseada',
        [{ id: 'menor', nombre: 'Cuanto menor, mejor' }, { id: 'mayor', nombre: 'Cuanto mayor, mejor' }], 'mayor') +
      '<div class="tarjeta-pie"><button class="btn primario" data-g="crear-metrica">Añadir métrica</button>' +
      '<button class="btn" data-g="cerrar-nueva-metrica">Cancelar</button></div></div></div>';

    var tabla = metricas.length
      ? '<div class="envoltura-tabla"><table class="pa-tabla g-scorecard"><thead><tr>' +
        '<th>Métrica</th><th>Meta</th><th>Responsable</th>' +
        semanas.map(function (s) { return '<th title="' + s.iso + '">' + s.etiqueta + '</th>'; }).join('') +
        '<th></th></tr></thead><tbody>' +
        metricas.map(function (m) {
          var resp = m.responsableId ? Gestor.uno('usuarios', m.responsableId) : null;
          return '<tr>' +
            '<td><b>' + R.escapar(m.nombre) + '</b></td>' +
            '<td>' + R.escapar(m.meta || '—') + '</td>' +
            '<td>' + R.escapar(resp ? resp.nombre.split(' ')[0] : '—') + '</td>' +
            semanas.map(function (s) {
              var v = (m.valores || {})[s.iso];
              var clase = estadoMetrica(m, v);
              return '<td class="g-celda-metrica ' + clase + '">' +
                '<input class="g-num" data-metrica="' + m.id + '" data-semana="' + s.iso + '" ' +
                'value="' + R.escapar(v == null ? '' : v) + '" inputmode="decimal"></td>';
            }).join('') +
            '<td><button class="g-mini-x" data-g="borrar-metrica" data-id="' + m.id + '">×</button></td>' +
            '</tr>';
        }).join('') + '</tbody></table></div>'
      : UI.vacio('📊', 'Sin métricas definidas',
          'Añade entre 5 y 15 números de la operación que se midan cada semana.');

    return '<div class="g-trimestres"><button class="btn primario" data-g="abrir-nueva-metrica">Nueva métrica</button></div>' +
      formulario +
      '<div class="nota"><div class="nota-titulo">Cómo se usa</div>' + PMBOK.eos.ayudaScorecard + '</div>' +
      tabla;
  }

  function estadoMetrica(m, valor) {
    if (valor === undefined || valor === null || valor === '') return '';
    var meta = parseFloat(String(m.meta || '').replace(/[^\d.,-]/g, '').replace(',', '.'));
    var v = parseFloat(String(valor).replace(',', '.'));
    if (isNaN(meta) || isNaN(v)) return '';
    var bien = m.direccion === 'menor' ? v <= meta : v >= meta;
    return bien ? 'verde' : 'rojo';
  }

  function ultimasSemanas(n) {
    var salida = [];
    var d = new Date();
    d.setDate(d.getDate() - (d.getDay() + 6) % 7);   // lunes de esta semana
    for (var i = n - 1; i >= 0; i--) {
      var x = new Date(d.getTime() - i * 7 * 86400000);
      var iso = x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
      salida.push({ iso: iso, etiqueta: String(x.getDate()) + '/' + (x.getMonth() + 1) });
    }
    return salida;
  }

  function eosVto() {
    function bloque(b) {
      var valor = Gestor.vto(b.id);
      return '<div class="g-vto-bloque' + (valor ? ' lleno' : '') + '">' +
        '<div class="g-vto-cab"><b>' + R.escapar(b.nombre) + '</b>' +
          UI.pastilla(valor ? 'Definido' : 'Sin llenar', valor ? 'ok' : '') + '</div>' +
        '<p class="g-vto-ayuda">' + R.escapar(b.ayuda) + '</p>' +
        '<textarea class="g-vto-texto" data-vto="' + b.id + '" rows="3" ' +
        'placeholder="Escribe aquí…">' + R.escapar(valor) + '</textarea>' +
        '</div>';
    }
    var vision = PMBOK.eos.vto.filter(function (b) { return b.lado === 'vision'; });
    var traccion = PMBOK.eos.vto.filter(function (b) { return b.lado === 'traccion'; });

    return '<div class="nota"><div class="nota-titulo">Cómo se usa</div>' + PMBOK.eos.ayudaVto + '</div>' +
      '<h2>Visión</h2><div class="g-vto">' + vision.map(bloque).join('') + '</div>' +
      '<h2>Tracción</h2><div class="g-vto">' + traccion.map(bloque).join('') + '</div>';
  }

  function eosOrganigrama() {
    function rama(padreId, nivel) {
      var hijos = Gestor.asientosHijos(padreId);
      if (!hijos.length) return '';
      return '<ul class="g-organigrama' + (nivel ? ' hijo' : '') + '">' + hijos.map(function (a) {
        var persona = a.personaId ? Gestor.uno('usuarios', a.personaId) : null;
        return '<li>' +
          '<div class="g-asiento">' +
            '<div class="g-asiento-cab"><b>' + R.escapar(a.nombre) + '</b>' +
              '<button class="g-mini-x" data-g="borrar-asiento" data-id="' + a.id + '">×</button></div>' +
            (a.gwt ? '<div class="g-asiento-gwt">' + R.escapar(a.gwt) + '</div>' : '') +
            '<div class="g-asiento-persona">' + UI.avatar(persona ? persona.nombre : '—') +
              R.escapar(persona ? persona.nombre : 'asiento vacante') + '</div>' +
            '<button class="pa-mini" data-g="abrir-asiento" data-padre="' + a.id + '">+ asiento debajo</button>' +
          '</div>' + rama(a.id, nivel + 1) + '</li>';
      }).join('') + '</ul>';
    }

    var raiz = Gestor.asientosHijos(null);
    return '<div class="nota"><div class="nota-titulo">Cómo se usa</div>' + PMBOK.eos.ayudaOrganigrama + '</div>' +
      '<div class="g-trimestres"><button class="btn primario" data-g="abrir-asiento" data-padre="">Nuevo asiento raíz</button></div>' +
      '<div id="g-nuevo-asiento" hidden><div class="pa-panel">' +
        UI.texto('na-nombre', 'Nombre del asiento', '', { placeholder: 'Ej.: Integrador / Director de operaciones' }) +
        UI.area('na-gwt', 'Qué hace (5-10 palabras)', '', { filas: 2, ayuda: 'Get it, Want it, Capacity to do it.' }) +
        UI.selector('na-persona', 'Persona', [{ id: '', nombre: '— Vacante —' }].concat(
          Gestor.lista('usuarios').map(function (u) { return { id: u.id, nombre: u.nombre }; })), '') +
        '<input type="hidden" id="na-padre" value="">' +
        '<div class="tarjeta-pie"><button class="btn primario" data-g="crear-asiento">Crear asiento</button>' +
        '<button class="btn" data-g="cerrar-asiento">Cancelar</button></div></div></div>' +
      (raiz.length ? rama(null, 0) : UI.vacio('🗂️', 'Organigrama vacío',
        'Empieza por el asiento de dirección y desciende. Primero la estructura, después las personas.'));
  }

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
          '<div><b>' + R.escapar(u.nombre) + '</b><span>' + R.escapar(u.correo) + '</span></div></div></td>' +
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
        '<button class="btn primario" data-g="abrir-nuevo-usuario">Nuevo usuario</button>' +
      '</div>' +
      '<p class="bajada">Crea cuentas y concede permisos por portafolio, programa o proyecto. ' +
      'Los permisos se suman: siempre gana el nivel más alto.</p>' +

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
      '<p>Toda la información del gestor vive en este navegador. Expórtala para conservarla o llevarla a otro equipo. ' +
      'Las contraseñas no se incluyen en la exportación.</p>' +
      '<div class="tarjeta-pie">' +
        '<button class="btn" data-g="exportar-bd">Exportar datos (.json)</button>' +
        '<label class="btn" for="g-importar">Importar datos</label>' +
        '<input type="file" id="g-importar" accept=".json" hidden>' +
        '<button class="btn" data-g="reiniciar-bd">Borrar todo</button>' +
      '</div>' +
      '</div>';
  }

  function panelPermisos(usuarioId) {
    var u = Gestor.uno('usuarios', usuarioId);
    if (!u) return '';
    var permisos = Gestor.permisosDe(usuarioId);
    var portafolios = Gestor.lista('portafolios');
    var proyectos = Gestor.lista('proyectos');

    var ambitos = [];
    portafolios.forEach(function (p) { ambitos.push({ id: 'portafolio:' + p.id, nombre: '🗂️ ' + p.nombre }); });
    Gestor.lista('programas').forEach(function (p) { ambitos.push({ id: 'programa:' + p.id, nombre: '▸ ' + p.nombre }); });
    proyectos.forEach(function (p) { ambitos.push({ id: 'proyecto:' + p.id, nombre: '◆ ' + p.nombre }); });

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

  /* ══════════════ APRENDER ══════════════ */

  function aprender() {
    var accesos = [
      { r: '#/procesos', e: '40', t: 'Los procesos', d: 'Propósito, entradas, herramientas, salidas y errores frecuentes de cada uno.' },
      { r: '#/herramientas', e: '155', t: 'Herramientas y técnicas', d: 'Catálogo filtrable por familia y por texto.' },
      { r: '#/artefactos', e: '42', t: 'Artefactos', d: 'Los documentos que produce un proyecto, con la plantilla que se rellena.' },
      { r: '#/eos', e: 'Gerencia', t: 'EOS', d: 'Rocas, scorecard, VTO y organigrama: la capa directiva sobre los proyectos.' }
    ].map(function (a) {
      return '<a class="tarjeta" href="' + a.r + '">' +
        '<div class="tarjeta-eyebrow">' + a.e + '</div>' +
        '<div class="tarjeta-titulo">' + a.t + '</div>' +
        '<div class="tarjeta-texto">' + a.d + '</div></a>';
    }).join('');

    var bandas = PMBOK.bandas.map(function (b, i) {
      var n = PMBOK.flujo.filter(function (f) { return f.banda === b.id; }).length;
      return '<div class="g-banda-mini"><b>' + b.n + '. ' + b.nombre + '</b><span>' + n + ' procesos</span></div>' +
        (i < PMBOK.bandas.length - 1 ? '<span class="g-flecha">→</span>' : '');
    }).join('');

    var dominios = PMBOK.dominiosMeta.map(function (d) {
      var dom = PMBOK.dominios.filter(function (x) { return x.clave === d.id; })[0];
      return '<a class="tarjeta acentuada ' + d.clase + '" href="#/dominio/' + (dom ? dom.id : '') + '">' +
        '<div class="tarjeta-eyebrow">' + d.procesos + ' procesos</div>' +
        '<div class="tarjeta-titulo">' + d.nombre + '</div>' +
        '<div class="tarjeta-texto">' + d.lema + '</div></a>';
    }).join('');

    return '<div class="hoja-ancha prosa">' +
      '<div class="eyebrow">Modo aprender</div>' +
      '<h1 class="titulo-pagina">Guía didáctica PMBOK® 8.ª edición</h1>' +
      '<p class="bajada">Los 7 dominios de desempeño, los 40 procesos, 155 herramientas y 42 artefactos. ' +
      'Todo lo que el gestor aplica a tus proyectos, explicado.</p>' +
      R.bandaSimulacion() +

      '<h2>El ciclo de vida en cinco bandas</h2>' +
      '<div class="g-bandas-mini">' + bandas + '</div>' +

      '<h2>Por dónde empezar</h2>' +
      '<div class="rejilla rejilla-2">' + accesos + '</div>' +

      '<h2>Los siete dominios de desempeño</h2>' +
      '<div class="rejilla rejilla-3">' + dominios + '</div>' +

      '<h2>Los seis principios</h2>' +
      '<p style="color:var(--tinta-2);font-size:13.6px;margin-bottom:14px">' +
      'Criterios de juicio, no procedimientos. La verificación de calidad de cada proyecto pide evidencia de los seis.</p>' +
      '<div class="rejilla rejilla-3">' + PMBOK.principios.map(function (pr) {
        return '<a class="tarjeta" href="#/principio/' + pr.id + '">' +
          '<div class="tarjeta-eyebrow">Principio ' + pr.n + '</div>' +
          '<div class="tarjeta-titulo">' + pr.titulo + '</div>' +
          '<div class="tarjeta-texto">' + pr.lema + '</div></a>';
      }).join('') + '</div>' +
      '</div>';
  }

  /* ══════════════ CATÁLOGOS ══════════════ */

  function herramientas() {
    var grupos = PMBOK.gruposHerramienta.map(function (g) {
      var suyas = PMBOK.herramientas.filter(function (h) { return h.grupo === g.id; });
      if (!suyas.length) return '';
      return '<h2 id="g-' + g.id + '">' + g.nombre + ' <span class="pa-conteo">' + suyas.length + '</span></h2>' +
        '<div class="g-catalogo">' + suyas.map(function (h) {
          return '<div class="g-ficha item-herramienta" data-texto="' +
            R.escapar(Indice.normalizar(h.nombre + ' ' + h.descripcion)) + '">' +
            '<div class="g-ficha-nombre">' + R.escapar(h.nombre) + '</div>' +
            '<div class="g-ficha-desc">' + R.escapar(h.descripcion) + '</div></div>';
        }).join('') + '</div>';
    }).join('');

    return '<div class="hoja-ancha prosa">' +
      R.migas([{ texto: 'Aprender', ruta: '#/aprender' }, { texto: 'Herramientas' }]) +
      '<h1 class="titulo-pagina">Herramientas y técnicas</h1>' +
      '<p class="bajada">Las ' + PMBOK.herramientas.length + ' herramientas de la 8.ª edición, agrupadas por familia. ' +
      'Cada proceso indica cuáles le corresponden.</p>' +
      '<div class="barra-filtros"><input type="search" id="filtro-herramientas" placeholder="Filtrar herramientas…" ' +
      'aria-label="Filtrar herramientas"><span id="conteo-herramientas" class="pa-contador"></span></div>' +
      grupos +
      '</div>';
  }

  function artefactos() {
    var filas = PMBOK.categoriasArtefacto.map(function (c) {
      var suyos = PMBOK.artefactos.filter(function (a) { return a.categoria === c.id; });
      if (!suyos.length) return '';
      return '<h2>' + c.nombre + ' <span class="pa-conteo">' + suyos.length + '</span></h2>' +
        '<div class="g-catalogo">' + suyos.map(function (a) {
          var produce = PMBOK.flujo.filter(function (f) { return (f.salidas || []).indexOf(a.id) !== -1; });
          return '<div class="g-ficha item-artefacto" data-texto="' +
            R.escapar(Indice.normalizar(a.nombre + ' ' + a.descripcion)) + '">' +
            '<div class="g-ficha-nombre">' + R.escapar(a.nombre) + '</div>' +
            '<div class="g-ficha-desc">' + R.escapar(a.descripcion) + '</div>' +
            '<div class="g-ficha-pie">' + a.plantilla.length + ' bloques · lo produce ' +
              produce.slice(0, 2).map(function (f) {
                var p = PMBOK.procesos.filter(function (x) { return x.id === f.id; })[0];
                return p ? '<a href="#/proceso/' + p.id + '">' + p.cod + '</a>' : '';
              }).filter(Boolean).join(', ') +
            '</div></div>';
        }).join('') + '</div>';
    }).join('');

    return '<div class="hoja-ancha prosa">' +
      R.migas([{ texto: 'Aprender', ruta: '#/aprender' }, { texto: 'Artefactos' }]) +
      '<h1 class="titulo-pagina">Artefactos</h1>' +
      '<p class="bajada">Los ' + PMBOK.artefactos.length + ' documentos que produce un proyecto. ' +
      'Cada uno trae la plantilla que se rellena al generarlo desde su proceso.</p>' +
      '<div class="barra-filtros"><input type="search" id="filtro-artefactos" placeholder="Filtrar artefactos…" ' +
      'aria-label="Filtrar artefactos"></div>' +
      filas +
      '</div>';
  }

  /* ══════════════ Interacción ══════════════ */

  function conectar(vista, arg, recargarVista) {
    recargar = recargarVista || function () {};

    var botones = document.querySelectorAll('[data-g]');
    for (var i = 0; i < botones.length; i++) botones[i].addEventListener('click', manejar);

    if (vista === 'entrar') {
      var clave = document.getElementById('acc-clave');
      if (clave) clave.addEventListener('keydown', function (e) { if (e.key === 'Enter') accionEntrar(); });
      var correo = document.getElementById('acc-correo');
      if (correo) correo.focus();
    }

    conectarSelectores();
    conectarFiltros();
    conectarVto();
    conectarScorecard();
  }

  /* Un «change» puede llegar disparado por el propio blur que provoca el
     repintado. Volver a pintar dentro de ese evento rompe el innerHTML en
     curso, así que se aplaza un tick. */
  function recargarDiferido() { setTimeout(function () { recargar(); }, 0); }

  function conectarSelectores() {
    var mover = document.querySelectorAll('[data-mover]');
    for (var i = 0; i < mover.length; i++) {
      mover[i].addEventListener('change', function () {
        Gestor.actualizar('proyectos', this.getAttribute('data-mover'), { portafolioId: this.value || null });
        recargarDiferido();
      });
    }
    var estados = document.querySelectorAll('[data-estado-roca]');
    for (var j = 0; j < estados.length; j++) {
      estados[j].addEventListener('change', function () {
        Gestor.actualizar('rocas', this.getAttribute('data-estado-roca'), { estado: this.value });
        recargarDiferido();
      });
    }
    var opciones = document.querySelectorAll('[data-opcion]');
    for (var k = 0; k < opciones.length; k++) {
      opciones[k].addEventListener('click', function () {
        var grupo = this.getAttribute('data-opcion');
        var caja = document.querySelector('[data-opciones="' + grupo + '"]');
        var todos = caja.querySelectorAll('.g-opcion');
        for (var n = 0; n < todos.length; n++) todos[n].classList.remove('activa');
        this.classList.add('activa');
        document.getElementById('val-' + grupo).value = this.getAttribute('data-valor');
      });
    }
  }

  function conectarFiltros() {
    [['filtro-herramientas', '.item-herramienta', 'conteo-herramientas'],
     ['filtro-artefactos', '.item-artefacto', null]].forEach(function (par) {
      var campo = document.getElementById(par[0]);
      if (!campo) return;
      campo.addEventListener('input', function () {
        var q = Indice.normalizar(campo.value);
        var items = document.querySelectorAll(par[1]);
        var visibles = 0;
        for (var i = 0; i < items.length; i++) {
          var ok = !q || items[i].getAttribute('data-texto').indexOf(q) !== -1;
          items[i].hidden = !ok;
          if (ok) visibles++;
        }
        if (par[2]) {
          var c = document.getElementById(par[2]);
          if (c) c.textContent = visibles + ' de ' + items.length;
        }
        var titulos = document.querySelectorAll('.prosa h2');
        for (var j = 0; j < titulos.length; j++) {
          var sig = titulos[j].nextElementSibling;
          if (sig && sig.classList.contains('g-catalogo')) {
            var quedan = sig.querySelectorAll('.g-ficha:not([hidden])').length;
            titulos[j].hidden = quedan === 0;
            sig.hidden = quedan === 0;
          }
        }
      });
    });
  }

  function conectarVto() {
    var areas = document.querySelectorAll('[data-vto]');
    for (var i = 0; i < areas.length; i++) {
      areas[i].addEventListener('blur', function () {
        Gestor.fijarVto(this.getAttribute('data-vto'), this.value);
        this.parentNode.classList.toggle('lleno', !!this.value.trim());
      });
    }
  }

  function conectarScorecard() {
    var celdas = document.querySelectorAll('[data-metrica]');
    for (var i = 0; i < celdas.length; i++) {
      celdas[i].addEventListener('change', function () {
        var m = Gestor.uno('metricas', this.getAttribute('data-metrica'));
        if (!m) return;
        if (!m.valores) m.valores = {};
        var s = this.getAttribute('data-semana');
        if (String(this.value).trim()) m.valores[s] = this.value.trim();
        else delete m.valores[s];
        Gestor.actualizar('metricas', m.id, { valores: m.valores });
        recargarDiferido();
      });
    }
  }

  function error(id, mensaje) {
    var caja = document.getElementById(id);
    if (caja) caja.innerHTML = '<div class="nota alerta"><div class="nota-titulo">No se pudo continuar</div>' +
      R.escapar(mensaje) + '</div>';
  }

  function accionEntrar() {
    var r = Gestor.entrar(UI.valorDe('acc-correo'), UI.valorDe('acc-clave'));
    if (r.error) { error('g-error-acceso', r.error); return; }
    location.hash = '#/panel';
    recargar();
  }

  function alternar(id, mostrar) {
    var e = document.getElementById(id);
    if (e) e.hidden = mostrar === undefined ? !e.hidden : !mostrar;
    return e;
  }

  function manejar(e) {
    var el = e.currentTarget;
    var accion = el.getAttribute('data-g');
    var id = el.getAttribute('data-id');
    e.preventDefault();

    switch (accion) {
      case 'entrar': accionEntrar(); break;

      case 'acceso-demo':
        document.getElementById('acc-correo').value = 'admin@pmbok.local';
        document.getElementById('acc-clave').value = 'admin123';
        accionEntrar();
        break;

      case 'salir':
        Gestor.salir();
        location.hash = '#/entrar';
        recargar();
        break;

      case 'abrir-nuevo-proyecto': {
        var form = alternar('g-nuevo-proyecto', true);
        var nombre = document.getElementById('np-nombre');
        if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (nombre) setTimeout(function () { nombre.focus(); }, 60);
        break;
      }
      case 'cerrar-nuevo-proyecto': alternar('g-nuevo-proyecto', false); break;

      case 'crear-proyecto': {
        var r = Gestor.crearProyecto({
          nombre: UI.valorDe('np-nombre'),
          descripcion: UI.valorDe('np-descripcion'),
          metodologia: UI.valorDe('val-metodologia'),
          portafolioId: UI.valorDe('np-portafolio') || null,
          rocaId: UI.valorDe('np-roca') || null,
          inicio: UI.valorDe('np-inicio'),
          fin: UI.valorDe('np-fin'),
          presupuesto: UI.valorDe('np-presupuesto')
        });
        if (r.error) { error('g-error-proyecto', r.error); return; }
        location.hash = '#/proyectos/' + r.proyecto.id;
        Dialogo.avisar('Proyecto creado. Empieza por 2.1.1 Iniciar el Proyecto o Fase', 'ok', {
          etiqueta: 'Abrir 2.1.1',
          hacer: function () { location.hash = '#/proyectos/' + r.proyecto.id + '/proceso/p-gob-01'; }
        });
        break;
      }

      case 'abrir-nuevo-portafolio': alternar('g-nuevo-portafolio', true); break;
      case 'cerrar-nuevo-portafolio': alternar('g-nuevo-portafolio', false); break;

      case 'crear-portafolio': {
        var n = UI.valorDe('npf-nombre');
        if (!n.trim()) return;
        Gestor.crear('portafolios', { nombre: n.trim(), descripcion: UI.valorDe('npf-descripcion') });
        recargar();
        break;
      }

      case 'borrar-portafolio': {
        var pf = Gestor.uno('portafolios', id);
        var afectados = Gestor.lista('proyectos', { portafolioId: id }).length;
        Dialogo.confirmar({
          titulo: 'Eliminar «' + (pf ? pf.nombre : 'portafolio') + '»',
          texto: afectados
            ? 'Sus ' + afectados + ' proyecto' + (afectados === 1 ? '' : 's') + ' no se borran: quedan sin portafolio.'
            : 'El portafolio está vacío.',
          confirmar: 'Eliminar portafolio', peligro: true
        }, function () {
          Gestor.lista('proyectos', { portafolioId: id }).forEach(function (p) {
            Gestor.actualizar('proyectos', p.id, { portafolioId: null });
          });
          Gestor.borrar('portafolios', id);
          Dialogo.avisar('Portafolio eliminado');
          recargar();
        });
        break;
      }

      case 'nuevo-programa':
        Dialogo.pedir({
          titulo: 'Nuevo programa',
          texto: 'Un programa agrupa proyectos relacionados cuyos beneficios se gestionan juntos.',
          campos: [{ id: 'nombre', etiqueta: 'Nombre del programa', placeholder: 'Ej.: Modernización de nómina' }],
          confirmar: 'Crear programa'
        }, function (v) {
          if (!v.nombre.trim()) return;
          Gestor.crear('programas', { portafolioId: id, nombre: v.nombre.trim() });
          Dialogo.avisar('Programa creado');
          recargar();
        });
        break;

      case 'trimestre':
        VistasGestor.trimestreElegido = el.getAttribute('data-valor');
        recargar();
        break;

      case 'abrir-nueva-roca': alternar('g-nueva-roca', true); break;
      case 'cerrar-nueva-roca': alternar('g-nueva-roca', false); break;

      case 'crear-roca': {
        var t = UI.valorDe('nr-titulo');
        if (!t.trim()) return;
        Gestor.crear('rocas', {
          trimestre: VistasGestor.trimestreElegido || trimestreActual(),
          titulo: t.trim(),
          descripcion: UI.valorDe('nr-descripcion'),
          responsableId: UI.valorDe('nr-responsable'),
          estado: UI.valorDe('nr-estado'),
          metas: UI.valorDe('nr-metas').split('\n').filter(function (x) { return x.trim(); })
            .map(function (x) { return { texto: x.trim(), hecho: false }; })
        });
        recargar();
        break;
      }

      case 'borrar-roca':
        Dialogo.confirmar({
          titulo: 'Eliminar esta roca',
          texto: 'Los proyectos vinculados no se borran, solo pierden el vínculo con ella.',
          confirmar: 'Eliminar roca', peligro: true
        }, function () { Gestor.borrar('rocas', id); Dialogo.avisar('Roca eliminada'); recargar(); });
        break;

      case 'meta-roca': {
        var roca = Gestor.uno('rocas', id);
        var i = parseInt(el.getAttribute('data-i'), 10);
        if (roca && roca.metas && roca.metas[i]) {
          roca.metas[i].hecho = !roca.metas[i].hecho;
          Gestor.actualizar('rocas', id, { metas: roca.metas });
          recargar();
        }
        break;
      }

      case 'abrir-nueva-metrica': alternar('g-nueva-metrica', true); break;
      case 'cerrar-nueva-metrica': alternar('g-nueva-metrica', false); break;

      case 'crear-metrica': {
        var nm = UI.valorDe('nm-nombre');
        if (!nm.trim()) return;
        Gestor.crear('metricas', {
          nombre: nm.trim(), meta: UI.valorDe('nm-meta'),
          responsableId: UI.valorDe('nm-responsable'),
          direccion: UI.valorDe('nm-direccion'), valores: {}
        });
        recargar();
        break;
      }

      case 'borrar-metrica':
        Dialogo.confirmar({
          titulo: 'Eliminar la métrica',
          texto: 'Se pierden también sus 13 semanas de historial.',
          confirmar: 'Eliminar métrica', peligro: true
        }, function () { Gestor.borrar('metricas', id); Dialogo.avisar('Métrica eliminada'); recargar(); });
        break;

      case 'abrir-asiento':
        alternar('g-nuevo-asiento', true);
        document.getElementById('na-padre').value = el.getAttribute('data-padre') || '';
        break;
      case 'cerrar-asiento': alternar('g-nuevo-asiento', false); break;

      case 'crear-asiento': {
        var na = UI.valorDe('na-nombre');
        if (!na.trim()) return;
        Gestor.crear('asientos', {
          nombre: na.trim(), gwt: UI.valorDe('na-gwt'),
          personaId: UI.valorDe('na-persona') || null,
          padreId: UI.valorDe('na-padre') || null
        });
        recargar();
        break;
      }

      case 'borrar-asiento':
        Dialogo.confirmar({
          titulo: 'Eliminar el asiento',
          texto: 'También se eliminan los asientos que dependen de él.',
          confirmar: 'Eliminar asiento', peligro: true
        }, function () {
          (function borrarRama(padre) {
            Gestor.asientosHijos(padre).forEach(function (a) { borrarRama(a.id); Gestor.borrar('asientos', a.id); });
          })(id);
          Gestor.borrar('asientos', id);
          Dialogo.avisar('Asiento eliminado');
          recargar();
        });
        break;

      case 'abrir-nuevo-usuario': alternar('g-nuevo-usuario', true); break;
      case 'cerrar-nuevo-usuario': alternar('g-nuevo-usuario', false); break;

      case 'crear-usuario': {
        var ru = Gestor.crearUsuario({
          nombre: UI.valorDe('nu-nombre'), correo: UI.valorDe('nu-correo'),
          clave: UI.valorDe('nu-clave'), rol: UI.valorDe('nu-rol')
        });
        if (ru.error) { error('g-error-usuario', ru.error); return; }
        recargar();
        break;
      }

      case 'alternar-usuario': {
        var us = Gestor.uno('usuarios', id);
        if (us) { Gestor.actualizar('usuarios', id, { activo: !us.activo }); recargar(); }
        break;
      }

      case 'clave': {
        var cuenta = Gestor.uno('usuarios', id);
        Dialogo.pedir({
          titulo: 'Cambiar contraseña',
          texto: cuenta ? 'Cuenta de ' + Render.escapar(cuenta.nombre) + '.' : '',
          campos: [{ id: 'clave', etiqueta: 'Nueva contraseña', tipo: 'password', ayuda: 'Mínimo 6 caracteres' }],
          confirmar: 'Cambiar contraseña'
        }, function (v) {
          var rc = Gestor.cambiarClave(id, v.clave);
          Dialogo.avisar(rc.error || 'Contraseña actualizada', rc.error ? 'error' : 'ok');
        });
        break;
      }

      case 'permisos':
        document.getElementById('g-panel-permisos').innerHTML = panelPermisos(id);
        conectar('admin', '', recargar);
        document.getElementById('g-permisos-abierto').scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;

      case 'cerrar-permisos':
        document.getElementById('g-panel-permisos').innerHTML = '';
        break;

      case 'conceder': {
        var partes = UI.valorDe('perm-ambito').split(':');
        Gestor.conceder(UI.valorDe('perm-usuario'), partes[0], partes[1], UI.valorDe('perm-nivel'));
        var abierto = UI.valorDe('perm-usuario');
        recargar();
        setTimeout(function () {
          var caja = document.getElementById('g-panel-permisos');
          if (caja) { caja.innerHTML = panelPermisos(abierto); conectar('admin', '', recargar); }
        }, 30);
        break;
      }

      case 'revocar': {
        Gestor.revocar(id);
        recargar();
        break;
      }

      case 'exportar-bd':
        descargar('pmbok8-gestor.json', JSON.stringify(Gestor.exportarTodo(), null, 2));
        break;

      case 'reiniciar-bd':
        Dialogo.confirmar({
          titulo: 'Borrar todos los datos',
          texto: 'Se eliminan <b>todos</b> los proyectos, documentos, usuarios y datos de gerencia de este navegador. ' +
            'No se puede deshacer: exporta antes si quieres conservarlos.',
          confirmar: 'Borrar todo', peligro: true
        }, function () {
          Gestor.reiniciarTodo();
          location.hash = '#/entrar';
          recargar();
        });
        break;
    }
  }

  function descargar(nombre, contenido) {
    try {
      var blob = new Blob([contenido], { type: 'application/json;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = nombre;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    } catch (err) { Dialogo.avisar('No se pudo descargar el archivo', 'error'); }
  }

  /* Importación desde el input de administración */
  function conectarImportacion(recargarVista) {
    var imp = document.getElementById('g-importar');
    if (!imp) return;
    imp.addEventListener('change', function () {
      var f = imp.files && imp.files[0];
      if (!f) return;
      var fr = new FileReader();
      fr.onload = function () {
        try {
          var r = Gestor.importarTodo(JSON.parse(String(fr.result)));
          Dialogo.avisar(r.error || 'Datos importados', r.error ? 'error' : 'ok');
          if (!r.error) recargarVista();
        } catch (e) { Dialogo.avisar('El archivo no es un JSON válido', 'error'); }
      };
      fr.readAsText(f, 'utf-8');
    });
  }

  return {
    entrar: entrar, panel: panel, portafolios: portafolios, agenda: agenda,
    eos: eos, admin: admin, aprender: aprender,
    herramientas: herramientas, artefactos: artefactos,
    calendario: calendario, tarjetaProyecto: tarjetaProyecto,
    conectar: conectar, conectarImportacion: conectarImportacion,
    trimestreElegido: null
  };
})();
