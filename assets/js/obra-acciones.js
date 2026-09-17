/* ═══════════════════════════════════════════════════════════
   obra-acciones.js — Interacción del espacio de trabajo
   Botones, formularios, arrastrar y soltar, y guardado en vivo
   de los documentos.
   ═══════════════════════════════════════════════════════════ */

window.ObraAcciones = (function () {
  'use strict';

  var recargar = function () {};
  var proyectoId = null;
  var procesoId = null;
  var temporizador = null;

  function conectar(pid, sub, arg, recargarVista) {
    recargar = recargarVista || function () {};
    proyectoId = pid;
    procesoId = sub === 'proceso' ? arg : null;

    var botones = document.querySelectorAll('[data-o]');
    for (var i = 0; i < botones.length; i++) botones[i].addEventListener('click', manejar);

    conectarSelectores();
    conectarDocumento();
    conectarTablas();
    conectarArchivos();
    conectarArrastre();
    if (window.Graficos) Graficos.conectar(document.getElementById('contenido'));
  }

  /* Borrado de algo pequeño: se hace al instante y se ofrece deshacer.
     Interrumpir con una confirmación cada vez cansa más de lo que protege. */
  function borrarConDeshacer(coleccion, id, etiqueta) {
    var copia = Gestor.uno(coleccion, id);
    if (!copia) return;
    copia = JSON.parse(JSON.stringify(copia));
    Gestor.borrar(coleccion, id);
    recargar();
    Dialogo.avisar(etiqueta + ' eliminado', 'ok', {
      etiqueta: 'Deshacer',
      hacer: function () {
        Gestor.crear(coleccion, copia);
        recargar();
      }
    });
  }

  /* Cada cambio en el trabajo del sprint deja su fotografía del día */
  function fotografiarSprint() {
    var sp = Gestor.sprintActivo(proyectoId);
    if (sp) Gestor.registrarBurndown(sp.id);
  }

  function p() { return Gestor.proyecto(proyectoId); }

  function valor(id) {
    var e = document.getElementById(id);
    return e ? e.value : '';
  }

  function alternar(id, mostrar) {
    var e = document.getElementById(id);
    if (e) e.hidden = mostrar === undefined ? !e.hidden : !mostrar;
  }

  /* ══════════════ Selectores sueltos ══════════════ */

  /* Igual que en el gestor: un «change» llegado desde un blur no debe
     repintar dentro del propio reemplazo del DOM. */
  function recargarDiferido() { setTimeout(function () { recargar(); }, 0); }

  function conectarSelectores() {
    escuchar('[data-decision]', 'change', function () {
      Gestor.actualizar('cambios', this.getAttribute('data-decision'), { decision: this.value });
      recargarDiferido();
    });
    escuchar('[data-rol-miembro]', 'change', function () {
      Gestor.actualizar('miembros', this.getAttribute('data-rol-miembro'), { rol: this.value });
      recargarDiferido();
    });
    escuchar('[data-opcion]', 'click', function () {
      var grupo = this.getAttribute('data-opcion');
      var caja = document.querySelector('[data-opciones="' + grupo + '"]');
      var todos = caja.querySelectorAll('.g-opcion');
      for (var n = 0; n < todos.length; n++) todos[n].classList.remove('activa');
      this.classList.add('activa');
      document.getElementById('val-' + grupo).value = this.getAttribute('data-valor');
    });
  }

  function escuchar(selector, evento, fn) {
    var nodos = document.querySelectorAll(selector);
    for (var i = 0; i < nodos.length; i++) nodos[i].addEventListener(evento, fn);
  }

  /* ══════════════ Documento: guardado en vivo ══════════════ */

  function conectarDocumento() {
    var docId = valor('g-doc-id');
    if (!docId) return;

    escuchar('.g-bloque', 'input', function () {
      var el = this;
      if (temporizador) clearTimeout(temporizador);
      temporizador = setTimeout(function () { guardarBloque(docId, el); }, 500);
    });
    escuchar('.g-bloque', 'blur', function () {
      if (temporizador) { clearTimeout(temporizador); temporizador = null; }
      guardarBloque(docId, this);
    });
  }

  function guardarBloque(docId, el) {
    Gestor.guardarBloque(docId, el.getAttribute('data-bloque'), el.value);
    setTimeout(function () { actualizarCompletitud(docId); }, 0);
  }

  function actualizarCompletitud(docId) {
    var d = Gestor.uno('documentos', docId);
    if (!d) return;
    var c = Gestor.completitudDocumento(d);
    var caja = document.getElementById('g-doc-completitud');
    if (caja) caja.textContent = c + ' % completo';
    var barra = document.querySelector('.g-doc-barra .pa-barra i');
    if (barra) {
      barra.style.transform = 'scaleX(' + (c / 100).toFixed(3) + ')';
      barra.style.background = UI.colorPorcentaje(c);
    }
  }

  /* ══════════════ Tablas editables ══════════════ */

  function conectarTablas() {
    var docId = valor('g-doc-id');

    escuchar('[data-agregar-fila]', 'click', function (e) {
      e.preventDefault();
      var id = this.getAttribute('data-agregar-fila');
      var caja = document.querySelector('[data-tabla="' + id + '"]');
      var cuerpo = caja.querySelector('tbody');
      var cols = caja.querySelectorAll('thead th').length - 1;
      var i = cuerpo.querySelectorAll('tr').length;
      var celdas = '';
      for (var j = 0; j < cols; j++) {
        celdas += '<td><div class="g-celda" contenteditable="true" data-f="' + i + '" data-c="' + j + '"></div></td>';
      }
      var tr = document.createElement('tr');
      tr.setAttribute('data-fila', i);
      tr.innerHTML = celdas + '<td class="g-quitar"><button type="button" class="g-mini-x" data-quitar-fila="' + i + '">×</button></td>';
      cuerpo.appendChild(tr);
      conectarTablas();
      var primera = tr.querySelector('.g-celda');
      if (primera) primera.focus();
    });

    escuchar('[data-quitar-fila]', 'click', function (e) {
      e.preventDefault();
      var tr = this.closest('tr');
      var caja = this.closest('[data-tabla]');
      tr.parentNode.removeChild(tr);
      if (docId && caja) guardarTabla(docId, caja.getAttribute('data-tabla'));
    });

    escuchar('.g-celda', 'blur', function () {
      var caja = this.closest('[data-tabla]');
      if (docId && caja) guardarTabla(docId, caja.getAttribute('data-tabla'));
    });
  }

  function guardarTabla(docId, tablaId) {
    var indice = tablaId.replace('doc-', '');
    Gestor.guardarBloque(docId, indice, UI.leerTabla(tablaId));
    setTimeout(function () { actualizarCompletitud(docId); }, 0);
  }

  /* ══════════════ Archivos ══════════════ */

  function conectarArchivos() {
    var entrada = document.getElementById('g-archivo-input');
    var zona = document.getElementById('g-soltar-archivo');
    if (!entrada && !zona) return;

    if (entrada) {
      entrada.addEventListener('change', function () {
        subirVarios(entrada.files);
      });
    }
    if (zona) {
      ['dragenter', 'dragover'].forEach(function (ev) {
        zona.addEventListener(ev, function (e) {
          e.preventDefault(); e.stopPropagation(); zona.classList.add('activa');
        });
      });
      ['dragleave', 'drop'].forEach(function (ev) {
        zona.addEventListener(ev, function (e) {
          e.preventDefault(); e.stopPropagation(); zona.classList.remove('activa');
        });
      });
      zona.addEventListener('drop', function (e) {
        if (e.dataTransfer && e.dataTransfer.files) subirVarios(e.dataTransfer.files);
      });
    }
  }

  function subirVarios(archivos) {
    if (!archivos || !archivos.length) return;
    var categoria = valor('g-cat-archivo') || 'general';
    var pendientes = archivos.length;
    var errores = [];

    avisoArchivo('Subiendo ' + pendientes + ' archivo' + (pendientes === 1 ? '' : 's') + '…', '');

    for (var i = 0; i < archivos.length; i++) {
      Archivos.subir(proyectoId, archivos[i], categoria, function (err) {
        if (err) errores.push(err);
        pendientes--;
        if (pendientes === 0) {
          if (errores.length) avisoArchivo(errores[0], 'alerta');
          else recargar();
        }
      });
    }
  }

  function avisoArchivo(texto, clase) {
    var caja = document.getElementById('g-aviso-archivo');
    if (!caja) return;
    caja.innerHTML = texto
      ? '<div class="nota ' + (clase || '') + '"><div class="nota-titulo">' +
        (clase === 'alerta' ? 'No se pudo subir' : 'En curso') + '</div>' + Render.escapar(texto) + '</div>'
      : '';
  }

  /* ══════════════ Arrastrar y soltar ══════════════ */

  function conectarArrastre() {
    var arrastrado = null;

    escuchar('[data-proceso]', 'dragstart', function (e) {
      arrastrado = { tipo: 'proceso', id: this.getAttribute('data-proceso') };
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', arrastrado.id); } catch (x) {}
      this.classList.add('arrastrando');
    });
    escuchar('[data-proceso]', 'dragend', function () { this.classList.remove('arrastrando'); });

    escuchar('[data-banda]', 'dragover', function (e) { e.preventDefault(); this.classList.add('sobre'); });
    escuchar('[data-banda]', 'dragleave', function () { this.classList.remove('sobre'); });
    escuchar('[data-banda]', 'drop', function (e) {
      e.preventDefault();
      this.classList.remove('sobre');
      if (!arrastrado || arrastrado.tipo !== 'proceso') return;
      Gestor.moverProceso(proyectoId, arrastrado.id, this.getAttribute('data-banda'));
      arrastrado = null;
      recargar();
    });

    escuchar('[data-riesgo]', 'dragstart', function (e) {
      arrastrado = { tipo: 'riesgo', id: this.getAttribute('data-riesgo') };
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', arrastrado.id); } catch (x) {}
    });
    escuchar('[data-celda]', 'dragover', function (e) { e.preventDefault(); this.classList.add('sobre'); });
    escuchar('[data-celda]', 'dragleave', function () { this.classList.remove('sobre'); });
    escuchar('[data-celda]', 'drop', function (e) {
      e.preventDefault();
      this.classList.remove('sobre');
      if (!arrastrado || arrastrado.tipo !== 'riesgo') return;
      var partes = this.getAttribute('data-celda').split('x');
      Gestor.actualizar('riesgos', arrastrado.id, { p: Number(partes[0]), i: Number(partes[1]) });
      arrastrado = null;
      recargar();
    });

    escuchar('[data-tarea]', 'dragstart', function (e) {
      arrastrado = { tipo: 'tarea', id: this.getAttribute('data-tarea') };
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', arrastrado.id); } catch (x) {}
    });
    escuchar('[data-columna]', 'dragover', function (e) { e.preventDefault(); this.classList.add('sobre'); });
    escuchar('[data-columna]', 'dragleave', function () { this.classList.remove('sobre'); });
    escuchar('[data-columna]', 'drop', function (e) {
      e.preventDefault();
      this.classList.remove('sobre');
      if (!arrastrado || arrastrado.tipo !== 'tarea') return;
      Gestor.actualizar('tareas', arrastrado.id, { estado: this.getAttribute('data-columna') });
      arrastrado = null;
      recargar();
    });
  }

  /* ══════════════ Botones ══════════════ */

  /* Cada botón «data-o» nombra aquí su acción. Cada una recibe el propio
     botón y sus atributos «data-id» y «data-valor». */
  var ACCIONES = {
    /* Proceso */
    'estado-proceso': estadoProceso,
    'guardar-notas': guardarNotas,
    'generar-entrada': generarDocumento,
    'generar-salida': generarDocumento,

    /* Documentos */
    'filtrar-doc': filtrarDocumentos,
    'abrir-nuevo-doc': function () { alternar('g-nuevo-doc', true); },
    'cerrar-nuevo-doc': function () { alternar('g-nuevo-doc', false); },
    'crear-doc': crearDocumento,
    'doc-estado': cambiarEstadoDocumento,
    'doc-nueva-version': nuevaVersionDocumento,
    'doc-borrar': borrarDocumento,
    'doc-exportar': function () { exportarDocumento(valor('g-doc-id')); },

    /* Archivos */
    'cat-archivo': elegirCategoriaArchivo,
    'abrir-archivo': function (el, id) { Archivos.abrir(id); },
    'descargar-archivo': function (el, id) { Archivos.descargar(id); },
    'borrar-archivo': borrarArchivo,

    /* Calendario */
    'crear-hito': crearHito,

    /* Trabajo */
    'nuevo-sprint': nuevoSprint,
    'cerrar-sprint': cerrarSprint,
    'crear-tarea': crearTarea,
    'al-sprint': comprometerTarea,
    'avanzar-tarea': avanzarTarea,
    'borrar-tarea': function (el, id) { borrarConDeshacer('tareas', id, 'Elemento del backlog'); },
    'editar-dod': editarDod,

    /* Dominios */
    'crear-riesgo': crearRiesgo,
    'borrar-riesgo': function (el, id) { borrarConDeshacer('riesgos', id, 'Riesgo'); },
    'crear-interesado': crearInteresado,
    'borrar-interesado': function (el, id) { borrarConDeshacer('interesados', id, 'Interesado'); },
    'crear-cambio': crearCambio,
    'crear-leccion': crearLeccion,
    'borrar-leccion': function (el, id) { borrarConDeshacer('lecciones', id, 'Lección'); },

    /* Control */
    'crear-medicion': crearMedicion,
    'borrar-medicion': function (el, id) { borrarConDeshacer('mediciones', id, 'Medición'); },

    /* Equipo y configuración */
    'agregar-miembro': agregarMiembro,
    'quitar-miembro': quitarMiembro,
    'crear-invitacion': crearInvitacion,
    'copiar-codigo': copiarCodigo,
    'borrar-invitacion': borrarInvitacion,
    'guardar-proyecto': guardarProyecto,
    'borrar-proyecto': borrarProyecto,
    'agregar-fase': agregarFase,
    'borrar-fase': borrarFase
  };

  function manejar(e) {
    e.preventDefault();
    var el = e.currentTarget;
    var accion = ACCIONES[el.getAttribute('data-o')];
    if (accion) accion(el, el.getAttribute('data-id'), el.getAttribute('data-valor'));
  }

  /* ── Proceso ── */

  function estadoProceso(el, id, val) {
    Gestor.fijarEstadoProceso(proyectoId, procesoId, { estado: val, fecha: Date.now() });
    var textos = { iniciado: 'Proceso en curso', completado: 'Proceso completado',
                   omitido: 'Proceso omitido por adaptación', pendiente: 'Proceso reabierto' };
    var sig = val === 'completado' ? Gestor.siguienteProceso(proyectoId) : null;
    var procSig = sig ? Indice.proceso(sig.id) : null;
    recargar();
    Dialogo.avisar(textos[val] || 'Estado actualizado', 'ok', procSig ? {
      etiqueta: 'Siguiente: ' + procSig.cod,
      hacer: function () { location.hash = '#/proyectos/' + proyectoId + '/proceso/' + procSig.id; }
    } : null);
  }

  function guardarNotas() {
    var area = document.getElementById('g-notas-proceso');
    Gestor.fijarEstadoProceso(proyectoId, procesoId, { notas: area ? area.value : '' });
    var aviso = document.getElementById('g-aviso-notas');
    if (aviso) {
      aviso.textContent = 'Guardado';
      setTimeout(function () { aviso.textContent = ''; }, 2200);
    }
  }

  function generarDocumento(el) {
    var r = Gestor.generarDocumento(proyectoId, el.getAttribute('data-art'), procesoId);
    if (r.error) { Dialogo.avisar(r.error, 'error'); return; }
    location.hash = '#/proyectos/' + proyectoId + '/documento/' + r.documento.id;
    recargar();
  }

  /* ── Documentos ── */

  function filtrarDocumentos(el, id, val) {
    var botones = document.querySelectorAll('[data-o="filtrar-doc"]');
    for (var i = 0; i < botones.length; i++) botones[i].classList.remove('activo');
    el.classList.add('activo');
    var items = document.querySelectorAll('.item-doc');
    for (var j = 0; j < items.length; j++) {
      items[j].hidden = val && items[j].getAttribute('data-categoria') !== val;
    }
  }

  function crearDocumento() {
    var art = valor('nd-artefacto');
    if (!art) return;
    var r = Gestor.generarDocumento(proyectoId, art, null);
    if (r.error) { Dialogo.avisar(r.error, 'error'); return; }
    location.hash = '#/proyectos/' + proyectoId + '/documento/' + r.documento.id;
    recargar();
  }

  function cambiarEstadoDocumento(el, id, val) {
    Gestor.cambiarEstadoDocumento(valor('g-doc-id'), val);
    recargar();
    Dialogo.avisar({ revision: 'Enviado a revisión', aprobado: 'Documento aprobado',
                     borrador: 'Devuelto a borrador' }[val] || 'Estado actualizado');
  }

  function nuevaVersionDocumento() {
    var d = Gestor.nuevaVersion(valor('g-doc-id'));
    recargar();
    if (d) Dialogo.avisar('Versión ' + d.version + ' abierta como borrador');
  }

  function borrarDocumento() {
    var doc = Gestor.uno('documentos', valor('g-doc-id'));
    Dialogo.confirmar({
      titulo: 'Eliminar «' + (doc ? doc.nombre : 'documento') + '»',
      texto: 'Se pierde todo su contenido redactado. El proceso que lo generó podrá crearlo de nuevo, vacío.',
      confirmar: 'Eliminar documento', peligro: true
    }, function () {
      Gestor.borrar('documentos', doc.id);
      location.hash = '#/proyectos/' + proyectoId + '/documentos';
      Dialogo.avisar('Documento eliminado');
    });
  }

  /* ── Archivos ── */

  function elegirCategoriaArchivo(el, id, val) {
    var cats = document.querySelectorAll('[data-o="cat-archivo"]');
    for (var k = 0; k < cats.length; k++) cats[k].classList.remove('activo');
    el.classList.add('activo');
    document.getElementById('g-cat-archivo').value = val;
  }

  function borrarArchivo(el, id) {
    var arch = Gestor.uno('archivos', id);
    Dialogo.confirmar({
      titulo: 'Eliminar «' + (arch ? arch.nombre : 'archivo') + '»',
      texto: 'El archivo se borra del repositorio de este navegador.',
      confirmar: 'Eliminar archivo', peligro: true
    }, function () { Archivos.eliminar(id); recargar(); Dialogo.avisar('Archivo eliminado'); });
  }

  /* ── Calendario ── */

  function crearHito() {
    var nombre = valor('nh-nombre');
    if (!nombre.trim()) return;
    var hitos = (p().hitos || []).slice();
    hitos.push({
      id: Gestor.nuevoId('hito'), nombre: nombre.trim(),
      fecha: valor('nh-fecha'), critico: valor('nh-critico') === 'si'
    });
    Gestor.actualizar('proyectos', proyectoId, { hitos: hitos });
    recargar();
  }

  /* ── Trabajo ── */

  function nuevoSprint() {
    /* Tras el «Sprint 0» de preparación viene el 1, no el 2 */
    var previos = Gestor.lista('sprints', { proyectoId: proyectoId });
    var hayCero = previos.some(function (x) { return /^Sprint 0(?:\s|$)/.test(x.nombre); });
    var siguienteN = previos.length + (hayCero ? 0 : 1);
    Dialogo.pedir({
      titulo: 'Nuevo sprint',
      texto: 'El sprint activo, si lo hay, se cierra y lo no terminado vuelve al backlog.',
      campos: [
        { id: 'nombre', etiqueta: 'Nombre', valor: 'Sprint ' + siguienteN },
        { id: 'objetivo', etiqueta: 'Objetivo del sprint', tipo: 'area', filas: 2,
          ayuda: 'Una frase: qué valor entrega este sprint' },
        { id: 'dias', etiqueta: 'Duración en días', tipo: 'number', valor: '14' }
      ],
      confirmar: 'Empezar sprint'
    }, function (v) {
      if (!v.nombre.trim()) return;
      var activo = Gestor.sprintActivo(proyectoId);
      if (activo) Gestor.cerrarSprint(activo.id);
      var nuevo = Gestor.crear('sprints', {
        proyectoId: proyectoId, nombre: v.nombre.trim(), estado: 'activo',
        objetivo: v.objetivo.trim(), dias: Math.max(1, Number(v.dias) || 14),
        comprometido: 0, entregado: 0, inicio: UI.hoyISO()
      });
      Gestor.registrarBurndown(nuevo.id);
      recargar();
      Dialogo.avisar(nuevo.nombre + ' en marcha');
    });
  }

  function cerrarSprint(el, id) {
    var sprint = Gestor.uno('sprints', id);
    Dialogo.confirmar({
      titulo: 'Cerrar «' + (sprint ? sprint.nombre : 'sprint') + '»',
      texto: 'Haz antes la review con los interesados y la retrospectiva con el equipo. ' +
        'Lo que no esté terminado vuelve al backlog.',
      confirmar: 'Cerrar sprint'
    }, function () {
      fotografiarSprint();
      var res = Gestor.cerrarSprint(id);
      recargar();
      if (res) {
        Dialogo.avisar('Sprint cerrado: ' + res.entregado + ' puntos entregados' +
          (res.devueltas ? ', ' + res.devueltas + ' vuelven al backlog' : ''));
      }
    });
  }

  function crearTarea() {
    var titulo = valor('nt-titulo');
    if (!titulo.trim()) return;
    Gestor.crear('tareas', {
      proyectoId: proyectoId, titulo: titulo.trim(),
      puntos: valor('nt-puntos') ? UI.numeroDe('nt-puntos', null) : null,
      fechaLimite: valor('nt-fecha') || null,
      responsableId: valor('nt-responsable') || null,
      criterios: valor('nt-criterios'),
      estado: 'backlog', sprintId: null,
      prioridad: Gestor.lista('tareas', { proyectoId: proyectoId }).length + 1
    });
    recargar();
    Dialogo.avisar('Añadido al backlog');
  }

  function comprometerTarea(el, id) {
    var sp = Gestor.sprintActivo(proyectoId);
    if (!sp) { Dialogo.avisar('Crea primero un sprint para comprometer trabajo', 'aviso'); return; }
    Gestor.actualizar('tareas', id, { sprintId: sp.id, estado: 'pendiente' });
    fotografiarSprint();
    recargar();
  }

  function avanzarTarea(el, id, val) {
    Gestor.actualizar('tareas', id, { estado: val });
    fotografiarSprint();
    recargar();
  }

  function editarDod() {
    var actual = (p().dod || [
      'Cumple los criterios de aceptación', 'Revisada por un par', 'Sin defectos conocidos'
    ]).join('\n');
    Dialogo.pedir({
      titulo: 'Definition of Done',
      texto: 'Las condiciones que todo incremento cumple para darse por terminado.',
      campos: [{ id: 'dod', etiqueta: 'Condiciones', tipo: 'area', filas: 6, valor: actual,
                 ayuda: 'Una por línea' }],
      confirmar: 'Guardar'
    }, function (v) {
      Gestor.actualizar('proyectos', proyectoId, {
        dod: v.dod.split('\n').map(function (x) { return x.trim(); }).filter(Boolean)
      });
      recargar();
      Dialogo.avisar('Definition of Done actualizada');
    });
  }

  /* ── Dominios ── */

  function crearRiesgo() {
    var titulo = valor('nr2-titulo');
    if (!titulo.trim()) return;
    Gestor.crear('riesgos', {
      proyectoId: proyectoId, titulo: titulo.trim(),
      p: UI.numeroDe('nr2-p', 3), i: UI.numeroDe('nr2-i', 3),
      estrategia: valor('nr2-estrategia'), respuesta: valor('nr2-respuesta'),
      responsableId: valor('nr2-responsable') || null, estado: 'activo'
    });
    recargar();
    Dialogo.avisar('Riesgo registrado');
  }

  function crearInteresado() {
    var nombre = valor('ni-nombre');
    if (!nombre.trim()) return;
    Gestor.crear('interesados', {
      proyectoId: proyectoId, nombre: nombre.trim(), rol: valor('ni-rol'),
      poder: UI.numeroDe('ni-poder', 3), influencia: UI.numeroDe('ni-influencia', 3),
      actual: valor('ni-actual'), deseado: valor('ni-deseado'), estrategia: valor('ni-estrategia')
    });
    recargar();
    Dialogo.avisar('Interesado registrado');
  }

  function crearCambio() {
    var titulo = valor('nc-titulo');
    if (!titulo.trim()) return;
    Gestor.crear('cambios', {
      proyectoId: proyectoId, titulo: titulo.trim(), descripcion: valor('nc-descripcion'),
      solicitante: valor('nc-solicitante'), impacto: valor('nc-impacto'), decision: 'pendiente'
    });
    recargar();
    Dialogo.avisar('Solicitud de cambio registrada');
  }

  function crearLeccion() {
    var situacion = valor('nl-situacion');
    if (!situacion.trim()) return;
    Gestor.crear('lecciones', {
      proyectoId: proyectoId, situacion: situacion.trim(), causa: valor('nl-causa'),
      recomendacion: valor('nl-recomendacion'), dominio: valor('nl-dominio')
    });
    recargar();
    Dialogo.avisar('Lección registrada');
  }

  /* ── Control ── */

  function crearMedicion() {
    if (!valor('nm2-pv') && !valor('nm2-ev') && !valor('nm2-ac')) {
      Dialogo.avisar('Introduce al menos uno de los tres valores', 'aviso');
      var primero = document.getElementById('nm2-pv');
      if (primero) primero.focus();
      return;
    }
    Gestor.crear('mediciones', {
      proyectoId: proyectoId, fecha: valor('nm2-fecha'),
      pv: UI.numeroDe('nm2-pv', 0), ev: UI.numeroDe('nm2-ev', 0),
      ac: UI.numeroDe('nm2-ac', 0), nota: valor('nm2-nota')
    });
    recargar();
    Dialogo.avisar('Medición registrada');
  }

  /* ── Equipo y configuración ── */

  function agregarMiembro() {
    var correo = valor('nmb-correo').trim().toLowerCase();
    var caja = document.getElementById('nmb-error');
    var fallo = function (texto) {
      if (caja) caja.innerHTML = '<div class="nota alerta"><div class="nota-titulo">No se pudo añadir</div>' +
        Render.escapar(texto) + '</div>';
    };
    if (!correo) { fallo('Escribe el correo con el que tu compañero creó su cuenta.'); return; }
    var cuenta = Gestor.lista('usuarios').filter(function (u) { return (u.correo || '').toLowerCase() === correo; })[0];
    if (!cuenta) { fallo('No hay ninguna cuenta con «' + correo + '». Pídele que la cree con «Crear cuenta» o compártele un código de invitación.'); return; }
    if (!cuenta.activo) { fallo('La cuenta de ' + cuenta.nombre + ' está desactivada.'); return; }
    if (Gestor.lista('miembros', { proyectoId: proyectoId }).some(function (m) { return m.usuarioId === cuenta.id; })) {
      fallo(cuenta.nombre + ' ya es miembro del proyecto.'); return;
    }
    Gestor.crear('miembros', { proyectoId: proyectoId, usuarioId: cuenta.id, rol: valor('nmb-rol') });
    recargar();
    Dialogo.avisar(cuenta.nombre + ' se unió al equipo');
  }

  function quitarMiembro(el, id) {
    Gestor.borrar('miembros', id);
    recargar();
  }

  function crearInvitacion() {
    var r = Gestor.crearInvitacion(proyectoId, { rol: valor('ninv-rol'), dias: valor('ninv-dias') });
    if (r.error) { Dialogo.avisar(r.error, 'error'); return; }
    recargar();
    Dialogo.avisar('Código ' + Gestor.codigoLegible(r.invitacion.codigo) + ' listo para compartir');
  }

  function copiarCodigo(el, id) {
    var inv = Gestor.uno('invitaciones', id);
    if (!inv) return;
    var texto = Gestor.codigoLegible(inv.codigo);
    var hecho = function () { Dialogo.avisar('Código ' + texto + ' copiado'); };
    var aMano = function () {
      Dialogo.informar({ titulo: 'Código de invitación', texto: 'Cópialo a mano: <b>' + Render.escapar(texto) + '</b>' });
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texto).then(hecho, aMano);
    else aMano();
  }

  function borrarInvitacion(el, id) {
    Gestor.borrarInvitacion(id);
    recargar();
    Dialogo.avisar('Código retirado: ya no sirve para entrar');
  }

  function guardarProyecto() {
    var metNueva = valor('val-met-proyecto');
    var actual = p();
    var cambios = {
      nombre: valor('cp-nombre') || actual.nombre,
      descripcion: valor('cp-descripcion'),
      estado: valor('cp-estado'),
      inicio: valor('cp-inicio') || null,
      fin: valor('cp-fin') || null,
      presupuesto: valor('cp-presupuesto') ? UI.numeroDe('cp-presupuesto', null) : null,
      moneda: valor('cp-moneda') || 'USD',
      portafolioId: valor('cp-portafolio') || null,
      rocaId: valor('cp-roca') || null,
      wip: UI.numeroDe('cp-wip', 3)
    };
    if (metNueva && metNueva !== actual.metodologia) {
      cambios.metodologia = metNueva;
      cambios.fases = Gestor.metodologia(metNueva).fases.map(function (f, n) {
        return { id: Gestor.nuevoId('fase'), nombre: f, orden: n + 1 };
      });
      cambios.orden = {};
    }
    Gestor.actualizar('proyectos', proyectoId, cambios);
    recargar();
  }

  function borrarProyecto() {
    var pr = p();
    Dialogo.pedir({
      titulo: 'Eliminar «' + pr.nombre + '»',
      texto: 'Se eliminan sus documentos, archivos, riesgos, tareas y mediciones. No se puede deshacer. ' +
        'Escribe <b>ELIMINAR</b> para confirmar.',
      campos: [{ id: 'confirma', etiqueta: 'Confirmación', placeholder: 'ELIMINAR' }],
      confirmar: 'Eliminar proyecto'
    }, function (v) {
      if (String(v.confirma).trim().toUpperCase() !== 'ELIMINAR') {
        Dialogo.avisar('No se eliminó: la confirmación no coincide', 'aviso');
        return;
      }
      Gestor.borrarProyecto(proyectoId);
      location.hash = '#/panel';
      Dialogo.avisar('Proyecto eliminado');
    });
  }

  function agregarFase() {
    Dialogo.pedir({
      titulo: 'Nueva fase',
      campos: [{ id: 'nombre', etiqueta: 'Nombre de la fase', placeholder: 'Ej.: Estabilización' }],
      confirmar: 'Añadir fase'
    }, function (v) {
      if (!v.nombre.trim()) return;
      var fases = (p().fases || []).slice();
      fases.push({ id: Gestor.nuevoId('fase'), nombre: v.nombre.trim(), orden: fases.length + 1 });
      Gestor.actualizar('proyectos', proyectoId, { fases: fases });
      recargar();
    });
  }

  function borrarFase(el, id) {
    var restantes = (p().fases || []).filter(function (f) { return f.id !== id; });
    Gestor.actualizar('proyectos', proyectoId, { fases: restantes });
    recargar();
  }

  /* ══════════════ Exportación de un documento ══════════════ */

  function exportarDocumento(docId) {
    var d = Gestor.uno('documentos', docId);
    if (!d) return;
    var art = Gestor.artefacto(d.artefactoId);
    var pr = Gestor.proyecto(d.proyectoId);
    var L = [];

    L.push('# ' + d.nombre);
    L.push('');
    L.push('**Proyecto:** ' + pr.nombre + '  ');
    L.push('**Categoría:** ' + d.categoria + ' · **Versión:** ' + (d.version || 1) + ' · **Estado:** ' + d.estado);
    L.push('');
    L.push('> ' + art.descripcion);
    L.push('');
    L.push('---');
    L.push('');

    art.plantilla.forEach(function (b, i) {
      var v = (d.contenido || {})[i];
      L.push('## ' + b.et);
      L.push('');
      if (b.t === 'tabla') {
        if (v && v.length) {
          L.push('| ' + b.col.join(' | ') + ' |');
          L.push('| ' + b.col.map(function () { return '---'; }).join(' | ') + ' |');
          v.forEach(function (fila) { L.push('| ' + fila.join(' | ') + ' |'); });
        } else {
          L.push('_Sin datos._');
        }
      } else if (b.t === 'lista') {
        if (v && String(v).trim()) {
          String(v).split('\n').filter(function (x) { return x.trim(); })
            .forEach(function (x) { L.push('- ' + x.trim()); });
        } else { L.push('_Sin datos._'); }
      } else {
        L.push(v && String(v).trim() ? String(v) : '_Sin redactar._');
      }
      L.push('');
    });

    L.push('---');
    L.push('');
    L.push('_Generado con el gestor PMBOK® 8. La estructura sigue el índice público de la 8.ª edición. ' +
      'PMBOK y PMI son marcas registradas del Project Management Institute, Inc._');

    var nombre = Calidad.normalizar(d.nombre).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40);
    descargar((nombre || 'documento') + '.md', L.join('\n'));
  }

  function descargar(nombre, contenido) {
    try {
      var blob = new Blob([contenido], { type: 'text/markdown;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = nombre;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    } catch (e) {
      var w = window.open('', '_blank');
      if (w) w.document.write('<pre>' + Render.escapar(contenido) + '</pre>');
    }
  }

  return { conectar: conectar };
})();
