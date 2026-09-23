/* ═══════════════════════════════════════════════════════════
   gestion/supervision.js — Supervisión de rocas (solo admin)
   ───────────────────────────────────────────────────────────
   La pestaña de Administración que mira las rocas desde arriba:
   cuánto ha avanzado cada una, quién la está empujando y, al
   abrirla, qué hizo cada integrante y cuándo.

   No guarda nada nuevo: todo sale de lo que ya está en memoria
   (rocas, proyectos vinculados y su trabajo), así funciona igual
   en modo local y en modo servidor.
   ═══════════════════════════════════════════════════════════ */

window.GestionSupervision = (function () {
  'use strict';

  var R = window.Render;

  /* Cuánto pesa cada señal en el avance de una roca. Si una no existe
     (una roca sin metas, o sin proyectos vinculados), su peso se
     reparte entre las demás: así el porcentaje siempre se lee sobre
     lo que de verdad hay con qué medirla. */
  var PESOS = [
    { id: 'metas', peso: 50, nombre: 'Metas medibles de la roca' },
    { id: 'proyectos', peso: 30, nombre: 'Avance del flujo de sus proyectos' },
    { id: 'tareas', peso: 20, nombre: 'Tareas terminadas en esos proyectos' }
  ];

  var TOPE_BITACORA = 120;

  /* ══════════════ Cálculo ══════════════ */

  function estadoDe(roca) {
    return PMBOK.eos.estadosRoca.filter(function (e) { return e.id === roca.estado; })[0] ||
      PMBOK.eos.estadosRoca[0];
  }

  function proyectosDe(rocaId) {
    return Gestor.lista('proyectos').filter(function (p) { return p.rocaId === rocaId; });
  }

  function pct(hechas, total) {
    return total ? Math.round((hechas / total) * 100) : 0;
  }

  /* El avance de una roca y el desglose con el que se justifica */
  function avanceDeRoca(roca) {
    var metas = roca.metas || [];
    var proyectos = proyectosDe(roca.id);
    var ids = proyectos.map(function (p) { return p.id; });

    var tareas = Gestor.lista('tareas').filter(function (t) { return ids.indexOf(t.proyectoId) !== -1; });
    var tareasHechas = tareas.filter(function (t) { return t.estado === 'hecho'; });

    var flujo = proyectos.map(function (p) { return Gestor.progreso(p.id); });
    var flujoPct = flujo.length
      ? Math.round(flujo.reduce(function (n, g) { return n + g.porcentaje; }, 0) / flujo.length)
      : 0;

    var partes = {
      metas: metas.length
        ? { hechas: metas.filter(function (m) { return m.hecho; }).length, total: metas.length,
            porcentaje: pct(metas.filter(function (m) { return m.hecho; }).length, metas.length) }
        : null,
      proyectos: proyectos.length
        ? { hechas: flujo.reduce(function (n, g) { return n + g.completados; }, 0),
            total: flujo.reduce(function (n, g) { return n + g.aplicables; }, 0), porcentaje: flujoPct }
        : null,
      tareas: tareas.length
        ? { hechas: tareasHechas.length, total: tareas.length, porcentaje: pct(tareasHechas.length, tareas.length) }
        : null
    };

    var presentes = PESOS.filter(function (c) { return partes[c.id]; });
    var sumaPesos = presentes.reduce(function (n, c) { return n + c.peso; }, 0);
    var porcentaje = sumaPesos
      ? Math.round(presentes.reduce(function (n, c) { return n + partes[c.id].porcentaje * c.peso; }, 0) / sumaPesos)
      : 0;

    /* Una roca declarada lograda vale 100 aunque falte marcar detalle:
       el veredicto de la gerencia manda sobre el conteo. */
    if (roca.estado === 'lograda') porcentaje = 100;

    return {
      porcentaje: porcentaje,
      partes: partes,
      presentes: presentes,
      sumaPesos: sumaPesos,
      proyectos: proyectos,
      tareas: tareas,
      tareasHechas: tareasHechas
    };
  }

  /* Quién empuja la roca: su responsable, los directores y los equipos
     de los proyectos vinculados. Cada persona aparece una sola vez, con
     todos sus papeles y con lo que lleva hecho. */
  function integrantesDe(roca, avance) {
    var mapa = {};

    function anotar(usuarioId, papel) {
      if (!usuarioId) return null;
      if (!mapa[usuarioId]) {
        var u = Gestor.uno('usuarios', usuarioId);
        mapa[usuarioId] = {
          id: usuarioId,
          nombre: u ? u.nombre : 'Cuenta eliminada',
          correo: u ? u.correo : '',
          activo: !u || u.activo !== false,
          papeles: [],
          tareasHechas: 0, tareasCurso: 0, puntos: 0, documentos: 0, aportes: 0
        };
      }
      if (papel && mapa[usuarioId].papeles.indexOf(papel) === -1) mapa[usuarioId].papeles.push(papel);
      return mapa[usuarioId];
    }

    anotar(roca.responsableId, 'Responsable de la roca');

    avance.proyectos.forEach(function (p) {
      anotar(p.directorId, 'Director de «' + p.nombre + '»');
      Gestor.lista('miembros', { proyectoId: p.id }).forEach(function (m) {
        var rol = Gestor.rolesProyecto.filter(function (r) { return r.id === m.rol; })[0];
        anotar(m.usuarioId, (rol ? rol.nombre : m.rol) + ' en «' + p.nombre + '»');
      });
    });

    avance.tareas.forEach(function (t) {
      var per = anotar(t.responsableId, null);
      if (!per) return;
      if (t.estado === 'hecho') { per.tareasHechas++; per.puntos += Number(t.puntos) || 0; }
      else if (t.estado === 'curso' || t.estado === 'revision') per.tareasCurso++;
    });

    var ids = avance.proyectos.map(function (p) { return p.id; });
    Gestor.lista('documentos').forEach(function (d) {
      if (ids.indexOf(d.proyectoId) === -1) return;
      var per = anotar(d.autorId, null);
      if (per) per.documentos++;
    });

    var gente = Object.keys(mapa).map(function (k) { return mapa[k]; });
    gente.forEach(function (g) { g.aportes = g.tareasHechas + g.documentos; });

    /* Primero quien más ha aportado; a igualdad, por nombre */
    return gente.sort(function (a, b) {
      return (b.aportes - a.aportes) || a.nombre.localeCompare(b.nombre);
    });
  }

  /* La bitácora: todo lo que ocurrió dentro de los proyectos de la roca,
     de lo más reciente a lo más antiguo. Es la respuesta a «¿qué hicieron?». */
  function bitacoraDe(avance) {
    var eventos = [];

    function anotar(cuando, quien, icono, verbo, texto, proyecto, extra) {
      eventos.push({
        cuando: cuando || 0, quien: quien || null, icono: icono, verbo: verbo,
        texto: texto || '', proyecto: proyecto, extra: extra || ''
      });
    }

    avance.proyectos.forEach(function (p) {
      var cuando = function (x) { return x.actualizado || x.creado || 0; };

      Gestor.lista('tareas', { proyectoId: p.id }).forEach(function (t) {
        if (t.estado === 'hecho') {
          anotar(cuando(t), t.responsableId, 'check-circulo', 'Terminó la tarea', t.titulo, p,
            t.puntos ? Number(t.puntos) + ' pts' : '');
        } else if (t.estado === 'curso' || t.estado === 'revision') {
          anotar(cuando(t), t.responsableId, 'trabajo',
            t.estado === 'curso' ? 'Está trabajando en' : 'Dejó en revisión', t.titulo, p, '');
        }
      });

      Gestor.lista('documentos', { proyectoId: p.id }).forEach(function (d) {
        anotar(cuando(d), d.autorId, 'documentos',
          d.actualizado && d.actualizado !== d.creado ? 'Actualizó el documento' : 'Generó el documento',
          d.nombre, p, 'v' + (d.version || 1) + ' · ' + (d.estado || 'borrador'));
      });

      Gestor.lista('archivos', { proyectoId: p.id }).forEach(function (a) {
        anotar(cuando(a), a.autorId, 'archivos', 'Subió el archivo', a.nombre, p, '');
      });

      Gestor.lista('sprints', { proyectoId: p.id }).forEach(function (s) {
        if (s.estado === 'cerrado') {
          anotar(s.cierre || cuando(s), null, 'agil', 'Cerró el sprint', s.nombre, p,
            (s.entregado || 0) + ' de ' + (s.comprometido || 0) + ' pts');
        }
      });

      Gestor.lista('procesos', { proyectoId: p.id }).forEach(function (e) {
        if (e.estado !== 'completado') return;
        var proc = Indice.proceso(e.procesoId);
        anotar(cuando(e), null, 'flujo', 'Completó el proceso', proc ? proc.nombre : e.procesoId, p, '');
      });

      Gestor.lista('riesgos', { proyectoId: p.id }).forEach(function (x) {
        anotar(cuando(x), x.responsableId, 'aviso', 'Registró el riesgo', x.titulo, p, x.estrategia || '');
      });

      Gestor.lista('cambios', { proyectoId: p.id }).forEach(function (x) {
        anotar(cuando(x), null, 'dividir', 'Solicitud de cambio', x.titulo, p, x.decision || 'pendiente');
      });

      Gestor.lista('lecciones', { proyectoId: p.id }).forEach(function (x) {
        anotar(cuando(x), null, 'idea', 'Registró la lección', x.situacion, p, '');
      });

      Gestor.lista('comentarios', { proyectoId: p.id }).forEach(function (x) {
        anotar(cuando(x), x.autorId, 'equipo', 'Comentó', x.texto, p, '');
      });
    });

    return eventos.sort(function (a, b) { return b.cuando - a.cuando; });
  }

  /* ══════════════ Pestañas de la administración ══════════════ */

  /* La usan las dos pantallas del apartado, por eso vive aquí */
  function pestanas(activa) {
    var items = [
      { id: 'cuentas', ruta: '#/admin', icono: 'admin', nombre: 'Cuentas y datos',
        lema: 'Usuarios, permisos, copia de seguridad' },
      { id: 'rocas', ruta: '#/admin/rocas', icono: 'rocas', nombre: 'Supervisión de rocas',
        lema: 'Avance, integrantes y qué hizo cada uno' },
      { id: 'notas', ruta: '#/admin/notas', icono: 'indicador', nombre: 'Notas de los proyectos',
        lema: 'Calificación de 1.0 a 5.0 por avance del flujo' }
    ];
    return '<div class="g-pestanas-eos">' + items.map(function (s) {
      return '<a class="g-pestana' + (s.id === activa ? ' activa' : '') + '" href="' + s.ruta + '">' +
        '<span class="g-pestana-icono">' + Iconos.svg(s.icono) + '</span>' +
        '<span><b>' + R.escapar(s.nombre) + '</b><em>' + R.escapar(s.lema) + '</em></span></a>';
    }).join('') + '</div>';
  }

  function cerrado() {
    return '<div class="hoja">' + UI.vacio('candado', 'Apartado de administrador',
      'Esta pantalla solo se abre con una cuenta de administrador. ' +
      'Entra con el perfil de administración y vuelve a intentarlo.' +
      '<br><a class="ref" href="#/entrar">Ir al acceso</a>') + '</div>';
  }

  /* ══════════════ Pantalla: todas las rocas ══════════════ */

  function supervision(rocaId) {
    if (!Gestor.esAdmin()) return cerrado();
    if (rocaId) return detalle(rocaId);

    var rocas = Gestor.lista('rocas');
    var fichas = rocas.map(function (r) {
      var avance = avanceDeRoca(r);
      return { roca: r, avance: avance, integrantes: integrantesDe(r, avance) };
    });

    /* Del trimestre más reciente al más antiguo, y dentro por avance */
    var trimestres = [];
    fichas.forEach(function (f) {
      if (trimestres.indexOf(f.roca.trimestre) === -1) trimestres.push(f.roca.trimestre);
    });
    trimestres.sort(comparaTrimestres).reverse();

    var personas = {};
    fichas.forEach(function (f) { f.integrantes.forEach(function (i) { personas[i.id] = true; }); });
    var medio = fichas.length
      ? Math.round(fichas.reduce(function (n, f) { return n + f.avance.porcentaje; }, 0) / fichas.length)
      : 0;
    var vinculados = fichas.reduce(function (n, f) { return n + f.avance.proyectos.length; }, 0);

    var cuerpo = fichas.length
      ? trimestres.map(function (t) {
          var delTrimestre = fichas.filter(function (f) { return f.roca.trimestre === t; })
            .sort(function (a, b) { return b.avance.porcentaje - a.avance.porcentaje; });
          return '<h2>' + R.escapar(t) + ' <span class="sv-conteo">' + delTrimestre.length +
            ' roca' + (delTrimestre.length === 1 ? '' : 's') + '</span></h2>' +
            '<div class="sv-rocas">' + delTrimestre.map(ficha).join('') + '</div>';
        }).join('')
      : UI.vacio('rocas', 'Todavía no hay rocas creadas',
          'Las rocas se crean en <a class="ref" href="#/eos/rocas">EOS Gerencia</a>. ' +
          'En cuanto exista una, aquí aparecerá su avance y quiénes la empujan.');

    return '<div class="hoja-ancha prosa">' +
      '<div class="eyebrow">Solo administradores</div>' +
      '<h1 class="titulo-pagina">Supervisión de rocas</h1>' +
      '<p class="bajada">El avance real de cada roca del trimestre, quiénes la están empujando y, ' +
      'al abrir cualquiera, todo lo que hicieron y cuándo lo hicieron.</p>' +
      pestanas('rocas') +
      '<div class="cifras" style="margin:0 0 26px">' +
        UI.cifra(fichas.length, 'Rocas en total', null, 'rocas') +
        UI.cifra(medio + '%', 'Avance medio', null, 'tendencia') +
        UI.cifra(Object.keys(personas).length, 'Integrantes', null, 'equipo') +
        UI.cifra(vinculados, 'Proyectos vinculados', null, 'activos') +
      '</div>' +
      cuerpo +
      '</div>';
  }

  /* «Q3-2026» → número comparable */
  function comparaTrimestres(a, b) {
    function clave(t) {
      var m = /^Q(\d)-(\d{4})$/.exec(t || '');
      return m ? Number(m[2]) * 10 + Number(m[1]) : 0;
    }
    return clave(a) - clave(b);
  }

  function ficha(f) {
    var r = f.roca;
    var est = estadoDe(r);
    var p = f.avance.porcentaje;
    var visibles = f.integrantes.slice(0, 7);

    return '<a class="sv-roca" href="#/admin/rocas/' + r.id + '">' +
      '<div class="sv-roca-cab">' +
        '<h3>' + R.escapar(r.titulo) + '</h3>' +
        UI.pastilla(est.nombre, est.color) +
      '</div>' +
      '<div class="sv-avance">' +
        '<b>' + p + '%</b>' +
        UI.barra(p) +
      '</div>' +
      '<div class="sv-desglose">' + desgloseCorto(f.avance) + '</div>' +
      (f.integrantes.length
        ? '<div class="sv-caras">' + visibles.map(function (i) {
            return '<span class="sv-cara" title="' + R.escapar(i.nombre) + '">' + UI.avatar(i.nombre) + '</span>';
          }).join('') +
          (f.integrantes.length > visibles.length
            ? '<span class="sv-mas">+' + (f.integrantes.length - visibles.length) + '</span>' : '') +
          '<span class="sv-caras-texto">' +
            R.escapar(visibles.map(function (i) { return i.nombre.split(' ')[0]; }).join(', ')) +
            (f.integrantes.length > visibles.length ? ' y ' + (f.integrantes.length - visibles.length) + ' más' : '') +
          '</span></div>'
        : '<div class="sv-caras"><span class="sv-caras-texto">Sin integrantes todavía</span></div>') +
      '<div class="sv-roca-pie"><span>Ver lo que hicieron</span>' + Iconos.svg('flecha-der') + '</div>' +
      '</a>';
  }

  function desgloseCorto(avance) {
    var partes = [];
    if (avance.partes.metas) {
      partes.push(avance.partes.metas.hechas + '/' + avance.partes.metas.total + ' metas');
    }
    partes.push(avance.proyectos.length + ' proyecto' + (avance.proyectos.length === 1 ? '' : 's'));
    if (avance.partes.tareas) {
      partes.push(avance.partes.tareas.hechas + '/' + avance.partes.tareas.total + ' tareas');
    }
    return partes.map(function (t) { return '<span>' + R.escapar(t) + '</span>'; }).join('');
  }

  /* ══════════════ Pantalla: una roca por dentro ══════════════ */

  function detalle(rocaId) {
    var r = Gestor.uno('rocas', rocaId);
    if (!r) {
      return '<div class="hoja-ancha prosa">' + pestanas('rocas') +
        UI.vacio('rocas', 'Esa roca ya no existe',
          'Puede que se haya eliminado. <a class="ref" href="#/admin/rocas">Vuelve a la lista</a>.') + '</div>';
    }

    var avance = avanceDeRoca(r);
    var integrantes = integrantesDe(r, avance);
    var eventos = bitacoraDe(avance);
    var est = estadoDe(r);
    var resp = r.responsableId ? Gestor.uno('usuarios', r.responsableId) : null;

    return '<div class="hoja-ancha prosa">' +
      '<a class="ref sv-volver" href="#/admin/rocas">' + Iconos.svg('flecha-izq') + ' Supervisión de rocas</a>' +
      '<div class="eyebrow">' + R.escapar(r.trimestre) + ' · ' + R.escapar(est.nombre) + '</div>' +
      '<h1 class="titulo-pagina">' + R.escapar(r.titulo) + '</h1>' +
      (r.descripcion ? '<p class="bajada">' + R.escapar(r.descripcion) + '</p>' : '') +

      '<div class="sv-cabecera">' +
        '<div class="sv-anillo">' +
          '<b>' + avance.porcentaje + '%</b>' +
          '<span>de avance</span>' +
        '</div>' +
        '<div class="sv-cabecera-datos">' +
          UI.barra(avance.porcentaje) +
          '<div class="sv-cabecera-pie">' +
            '<span>' + UI.avatar(resp ? resp.nombre : '?') +
              R.escapar(resp ? resp.nombre : 'sin responsable') + '</span>' +
            '<span>' + integrantes.length + ' integrante' + (integrantes.length === 1 ? '' : 's') + '</span>' +
            '<span>' + avance.proyectos.length + ' proyecto' + (avance.proyectos.length === 1 ? '' : 's') +
              ' vinculado' + (avance.proyectos.length === 1 ? '' : 's') + '</span>' +
            '<span>' + eventos.length + ' movimiento' + (eventos.length === 1 ? '' : 's') + ' registrado' +
              (eventos.length === 1 ? '' : 's') + '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +

      seccionDesglose(r, avance) +
      seccionMetas(r) +
      seccionProyectos(avance) +
      seccionIntegrantes(integrantes) +
      seccionBitacora(eventos) +
      '</div>';
  }

  function seccionDesglose(roca, avance) {
    var filas = PESOS.map(function (c) {
      var parte = avance.partes[c.id];
      var peso = parte && avance.sumaPesos ? Math.round((c.peso / avance.sumaPesos) * 100) : 0;
      return [
        c.nombre,
        parte ? parte.hechas + ' de ' + parte.total : '—',
        parte ? parte.porcentaje + '%' : 'sin datos',
        parte ? peso + '%' : '—'
      ];
    });

    return '<h2>Cómo sale ese porcentaje</h2>' +
      '<p>Se combina lo que de verdad hay con qué medir la roca. Si a una roca le falta una de las tres ' +
      'señales, su peso se reparte entre las otras.</p>' +
      R.tabla(['Señal', 'Hecho', 'Avance', 'Peso aplicado'], filas) +
      (roca.estado === 'lograda'
        ? '<div class="nota"><div class="nota-titulo">Roca marcada como lograda</div>' +
          'La gerencia la dio por cumplida, así que cuenta como 100 % aunque queden detalles sin marcar.</div>'
        : '');
  }

  function seccionMetas(roca) {
    var metas = roca.metas || [];
    if (!metas.length) return '';
    return '<h2>Metas medibles</h2><ul class="g-metas sv-metas">' + metas.map(function (m) {
      return '<li><span class="pa-check' + (m.hecho ? ' activo' : '') + '" aria-hidden="true">✓</span>' +
        '<span' + (m.hecho ? ' class="sv-hecha"' : '') + '>' + R.escapar(m.texto) + '</span></li>';
    }).join('') + '</ul>';
  }

  function seccionProyectos(avance) {
    if (!avance.proyectos.length) {
      return '<h2>Proyectos vinculados</h2>' +
        UI.vacio('activos', 'Ninguno todavía',
          'Al crear un proyecto se elige la roca de la que se desprende. Sin proyectos vinculados, ' +
          'la roca solo se mide por sus metas.');
    }
    var filas = avance.proyectos.map(function (p) {
      var g = Gestor.progreso(p.id);
      var tareas = Gestor.lista('tareas', { proyectoId: p.id });
      var hechas = tareas.filter(function (t) { return t.estado === 'hecho'; }).length;
      return [
        '<a class="ref" href="#/proyectos/' + p.id + '/flujo">' + R.escapar(p.nombre) + '</a>',
        R.escapar(p.estado || 'activo'),
        g.completados + '/' + g.aplicables + ' procesos (' + g.porcentaje + ' %)',
        hechas + '/' + tareas.length + ' tareas',
        String(Gestor.lista('documentos', { proyectoId: p.id }).length)
      ];
    });
    return '<h2>Proyectos vinculados</h2>' +
      R.tabla(['Proyecto', 'Estado', 'Flujo de procesos', 'Tareas', 'Documentos'], filas);
  }

  function seccionIntegrantes(integrantes) {
    if (!integrantes.length) {
      return '<h2>Integrantes</h2>' +
        UI.vacio('equipo', 'Nadie asignado todavía',
          'Los integrantes salen del responsable de la roca y de los equipos de sus proyectos vinculados.');
    }
    var filas = integrantes.map(function (i) {
      return [
        '<div class="g-usuario">' + UI.avatar(i.nombre) + '<div><b>' + R.escapar(i.nombre) + '</b>' +
          '<span>' + R.escapar(i.correo || '—') + (i.activo ? '' : ' · inactivo') + '</span></div></div>',
        i.papeles.length
          ? i.papeles.map(function (p) { return '<span class="sv-papel">' + R.escapar(p) + '</span>'; }).join(' ')
          : '<span class="sv-papel">Colabora en las tareas</span>',
        String(i.tareasHechas),
        String(i.tareasCurso),
        String(i.puntos),
        String(i.documentos)
      ];
    });
    return '<h2>Integrantes de la roca</h2>' +
      '<p>Quién la empuja, con qué papel y cuánto lleva hecho dentro de sus proyectos.</p>' +
      R.tabla(['Persona', 'Papel', 'Tareas hechas', 'En curso', 'Puntos', 'Documentos'], filas);
  }

  function seccionBitacora(eventos) {
    if (!eventos.length) {
      return '<h2>Lo que hicieron</h2>' +
        UI.vacio('reloj', 'Sin movimientos todavía',
          'Aquí aparecerán las tareas terminadas, los documentos, los sprints cerrados y los procesos ' +
          'completados dentro de los proyectos de esta roca.');
    }

    var mostrados = eventos.slice(0, TOPE_BITACORA);
    return '<h2>Lo que hicieron</h2>' +
      '<p>Todo el movimiento de los proyectos de la roca, de lo más reciente a lo más antiguo' +
      (eventos.length > mostrados.length
        ? '. Se muestran los ' + TOPE_BITACORA + ' últimos de ' + eventos.length + '.' : '.') + '</p>' +
      '<ol class="sv-bitacora">' + mostrados.map(function (e) {
        var quien = e.quien ? Gestor.uno('usuarios', e.quien) : null;
        return '<li class="sv-evento">' +
          '<span class="sv-evento-icono">' + (Iconos.svg(e.icono) || Iconos.svg('check')) + '</span>' +
          '<div class="sv-evento-cuerpo">' +
            '<div class="sv-evento-texto"><b>' + R.escapar(quien ? quien.nombre : 'El equipo') + '</b> · ' +
              R.escapar(e.verbo) + ' <em>' + R.escapar(recortar(e.texto, 160)) + '</em></div>' +
            '<div class="sv-evento-meta">' +
              '<span>' + UI.fecha(e.cuando, true) + '</span>' +
              '<span>' + R.escapar(e.proyecto.nombre) + '</span>' +
              (e.extra ? '<span>' + R.escapar(e.extra) + '</span>' : '') +
            '</div>' +
          '</div></li>';
      }).join('') + '</ol>';
  }

  function recortar(texto, n) {
    var t = String(texto || '').replace(/\s+/g, ' ').trim();
    return t.length > n ? t.slice(0, n - 1) + '…' : t;
  }

  return {
    supervision: supervision,
    pestanas: pestanas,
    avanceDeRoca: avanceDeRoca,
    integrantesDe: integrantesDe,
    bitacoraDe: bitacoraDe
  };
})();
