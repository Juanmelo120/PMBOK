/* HU-12 · Como alumno quiero crear mi propia cuenta y entrar al proyecto
   de mi grupo con el código que me da el líder, de modo que todos veamos
   los mismos datos y solo el líder haga lo que es del líder. */

'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciar } = require('../ayuda');
const config = require('../../src/config');
const db = require('../../src/db');

describe('HU-12 Registro propio e invitaciones al equipo', () => {
  let e;
  before(async () => { e = await iniciar(); });
  after(async () => { await e.cerrar(); });

  let n = 0;
  async function registrar(nombre) {
    n++;
    const correo = 'alumno' + n + '@aula.local';
    const r = await e.anonimo.post('/api/auth/registrar', { nombre: nombre || 'Alumno ' + n, correo, clave: 'clave-segura-' + n });
    assert.equal(r.estado, 201, JSON.stringify(r.datos));
    const c = e.anonimo.con(r.datos.token);
    c.usuario = r.datos.usuario;
    c.clave = 'clave-segura-' + n;
    return c;
  }

  /* Un director (líder) con su proyecto y un código de invitación */
  async function grupo(rol) {
    const lider = await e.crearUsuario('director', 'Líder');
    const p = (await lider.post('/api/proyectos', { nombre: 'Proyecto del grupo', metodologia: 'agil' })).datos;
    const inv = await lider.post('/api/proyectos/' + p.id + '/invitaciones', rol ? { rol } : {});
    assert.equal(inv.estado, 201, JSON.stringify(inv.datos));
    return { lider, p, inv: inv.datos };
  }

  it('CA-01 cualquiera crea su cuenta: entra al instante como «director» y aún no ve ningún proyecto', async () => {
    const salud = await e.anonimo.get('/api/salud');
    assert.equal(salud.datos.registroAbierto, true);
    assert.equal(salud.datos.registroRol, 'director');

    const r = await e.anonimo.post('/api/auth/registrar', {
      nombre: '  Laura Díaz ', correo: ' LAURA@Aula.local ', clave: 'mi-clave-8', rol: 'admin'
    });
    assert.equal(r.estado, 201);
    assert.ok(r.datos.token);
    const u = r.datos.usuario;
    assert.equal(u.nombre, 'Laura Díaz');
    assert.equal(u.correo, 'laura@aula.local');
    assert.equal(u.rol, 'director', 'el rol enviado se ignora: manda REGISTRO_ROL');
    assert.equal(u.origen, 'registro');
    assert.equal(u.debeCambiarClave, false, 'la contraseña la eligió su dueña');
    assert.equal(u.clave, undefined);
    assert.equal(u.claveHash, undefined);

    const alumna = e.anonimo.con(r.datos.token);
    assert.deepEqual((await alumna.get('/api/proyectos')).datos, []);
    assert.equal((await alumna.get('/api/estado')).datos.proyectos.length, 0);
    assert.equal((await e.entrar('laura@aula.local', 'mi-clave-8')).usuario.rol, 'director', 'vuelve a entrar con su clave');
  });

  it('CA-02 se validan correo y contraseña igual que en Administración, y el nombre es opcional', async () => {
    const casos = [
      [{ nombre: 'Ana', correo: 'no-es-correo', clave: 'clave-larga' }, /correo/i],
      [{ nombre: 'Ana', correo: 'x2@aula.local', clave: 'corta' }, /6 caracteres/],
      [{ nombre: 'Ana', correo: 'x3@aula.local' }, /clave/i]
    ];
    for (const [cuerpo, mensaje] of casos) {
      const r = await e.anonimo.post('/api/auth/registrar', cuerpo);
      assert.equal(r.estado, 400, JSON.stringify(cuerpo));
      assert.match(JSON.stringify(r.datos), mensaje);
    }
    const repetido = await e.anonimo.post('/api/auth/registrar', { nombre: 'Otra', correo: 'admin@pmbok.local', clave: 'clave-larga' });
    assert.equal(repetido.estado, 409);
    assert.match(repetido.datos.error, /Ya existe una cuenta/);

    const sinNombre = await e.anonimo.post('/api/auth/registrar', { correo: 'pepa.ruiz@aula.local', clave: 'seis66' });
    assert.equal(sinNombre.estado, 201, 'seis caracteres bastan');
    assert.equal(sinNombre.datos.usuario.nombre, 'pepa.ruiz', 'sin nombre, se usa el del correo');
  });

  it('CA-03 con el registro cerrado la API lo rechaza y la salud lo anuncia', async () => {
    config.registro.abierto = false;
    try {
      assert.equal((await e.anonimo.get('/api/salud')).datos.registroAbierto, false);
      const r = await e.anonimo.post('/api/auth/registrar', { nombre: 'Tarde', correo: 'tarde@aula.local', clave: 'clave-larga' });
      assert.equal(r.estado, 403);
      assert.equal(r.datos.codigo, 'REGISTRO_CERRADO');
    } finally {
      config.registro.abierto = true;
    }
  });

  it('CA-04 solo quien dirige el proyecto crea, ve y retira códigos', async () => {
    const { lider, p, inv } = await grupo();
    assert.match(inv.codigo, /^[A-HJ-NP-Z2-9]{8}$/);
    assert.equal(inv.rol, 'equipo');
    assert.equal(inv.usos, 0);
    assert.equal(inv.expira, null);

    const companero = await registrar();
    await companero.post('/api/invitaciones/unirse', { codigo: inv.codigo });
    const ruta = '/api/proyectos/' + p.id + '/invitaciones';
    assert.equal((await companero.get(ruta)).estado, 403, 'un miembro que edita no ve los códigos');
    assert.equal((await companero.post(ruta, {})).estado, 403);
    assert.equal((await companero.del('/api/invitaciones/' + inv.id)).estado, 403);
    assert.equal((await companero.get('/api/estado')).datos.invitaciones.length, 0, 'ni le llegan en el estado');

    const ajeno = await registrar();
    assert.equal((await ajeno.get(ruta)).estado, 404, 'quien no es del proyecto no sabe que existe');

    const lista = await lider.get(ruta);
    assert.equal(lista.estado, 200);
    assert.equal(lista.datos.length, 1);
    assert.equal(lista.datos[0].usos, 1);
    assert.equal((await lider.get('/api/estado')).datos.invitaciones.length, 1);

    assert.equal((await lider.del('/api/invitaciones/' + inv.id)).estado, 204);
    const tarde = await registrar();
    const r = await tarde.post('/api/invitaciones/unirse', { codigo: inv.codigo });
    assert.equal(r.estado, 404, 'un código retirado ya no sirve');
  });

  it('CA-05 un código nunca da el rol de líder y valida rol y días', async () => {
    const { lider, p } = await grupo();
    const ruta = '/api/proyectos/' + p.id + '/invitaciones';
    assert.equal((await lider.post(ruta, { rol: 'lider' })).estado, 400);
    assert.equal((await lider.post(ruta, { rol: 'jefe' })).estado, 400);
    assert.equal((await lider.post(ruta, { dias: 0 })).estado, 400);
    assert.equal((await lider.post(ruta, { dias: 400 })).estado, 400);
    const conDias = await lider.post(ruta, { rol: 'observador', dias: 7 });
    assert.equal(conDias.estado, 201);
    const dias = (conDias.datos.expira - Date.now()) / 86400000;
    assert.ok(dias > 6.9 && dias <= 7, 'caduca en 7 días');
    const propuesto = await lider.post(ruta, { codigo: 'abcd-2345' });
    assert.equal(propuesto.estado, 201);
    assert.equal(propuesto.datos.codigo, 'ABCD2345', 'se normaliza el código propuesto');
    assert.equal((await lider.post(ruta, { codigo: 'ABCD2345' })).estado, 409);
    assert.equal((await lider.post(ruta, { codigo: 'OOOO1111' })).estado, 400, 'sin O ni 1');
  });

  it('CA-06 con el código, el compañero entra al equipo y ve los mismos datos que el líder', async () => {
    const { lider, p, inv } = await grupo();
    await lider.post('/api/proyectos/' + p.id + '/riesgos', { titulo: 'Riesgo del grupo' });

    const alumno = await registrar('Carlos');
    const r = await alumno.post('/api/invitaciones/unirse', { codigo: inv.codigo.slice(0, 4).toLowerCase() + '-' + inv.codigo.slice(4) });
    assert.equal(r.estado, 201, JSON.stringify(r.datos));
    assert.deepEqual(r.datos, { proyecto: { id: p.id, nombre: 'Proyecto del grupo' }, rol: 'equipo', nivel: 2, yaEraMiembro: false });

    const suyo = (await alumno.get('/api/estado')).datos;
    const delLider = (await lider.get('/api/estado')).datos;
    assert.deepEqual(suyo.proyectos.map((x) => x.id), [p.id]);
    assert.deepEqual(suyo.riesgos.map((x) => x.titulo), delLider.riesgos.map((x) => x.titulo));
    assert.equal(suyo.proyectos[0].nivel, 2);

    /* Edita el trabajo del proyecto… */
    assert.equal((await alumno.post('/api/proyectos/' + p.id + '/riesgos', { titulo: 'Lo añade Carlos' })).estado, 201);
    assert.equal((await alumno.post('/api/proyectos/' + p.id + '/tareas', { titulo: 'Historia' })).estado, 201);
    /* …pero lo que es del líder, no */
    assert.equal((await alumno.patch('/api/proyectos/' + p.id, { nombre: 'Cambiado' })).estado, 403);
    assert.equal((await alumno.patch('/api/proyectos/' + p.id, { metodologia: 'kanban' })).estado, 403);
    assert.equal((await alumno.post('/api/proyectos/' + p.id + '/miembros', { usuarioId: 'u-admin' })).estado, 403);
    assert.equal((await alumno.del('/api/proyectos/' + p.id)).estado, 403);

    const otra = await alumno.post('/api/invitaciones/unirse', { codigo: inv.codigo });
    assert.equal(otra.estado, 200);
    assert.equal(otra.datos.yaEraMiembro, true);
    const usos = (await lider.get('/api/proyectos/' + p.id + '/invitaciones')).datos[0].usos;
    assert.equal(usos, 1, 'repetir el código no suma usos ni duplica al miembro');
  });

  it('CA-07 el rol del código fija el nivel: observador solo ve', async () => {
    const { lider, p, inv } = await grupo('observador');
    const obs = await registrar();
    const r = await obs.post('/api/invitaciones/unirse', { codigo: inv.codigo });
    assert.equal(r.datos.rol, 'observador');
    assert.equal(r.datos.nivel, 1);
    assert.equal((await obs.get('/api/proyectos/' + p.id + '/riesgos')).estado, 200);
    const intento = await obs.post('/api/proyectos/' + p.id + '/riesgos', { titulo: 'No debería' });
    assert.equal(intento.estado, 403);

    /* El líder cambia su rol y el nivel cambia con él */
    const m = (await lider.get('/api/proyectos/' + p.id + '/miembros')).datos.find((x) => x.usuarioId === obs.usuario.id);
    assert.equal((await lider.patch('/api/miembros/' + m.id, { rol: 'equipo' })).estado, 200);
    assert.equal((await obs.post('/api/proyectos/' + p.id + '/riesgos', { titulo: 'Ahora sí' })).estado, 201);

    /* Y si lo nombra líder, pasa a dirigir */
    assert.equal((await lider.patch('/api/miembros/' + m.id, { rol: 'lider' })).estado, 200);
    assert.equal((await obs.get('/api/proyectos/' + p.id + '/invitaciones')).estado, 200);
  });

  it('CA-08 un código caducado o inventado no deja entrar, y probar muchos se bloquea', async () => {
    const { p, inv } = await grupo();
    await db.consulta("UPDATE invitaciones SET expira = now() - interval '1 minute' WHERE id = $1", [inv.id]);
    const alumno = await registrar();
    const caducado = await alumno.post('/api/invitaciones/unirse', { codigo: inv.codigo });
    assert.equal(caducado.estado, 410);
    assert.equal(caducado.datos.codigo, 'CODIGO_CADUCADO');
    assert.equal((await alumno.get('/api/proyectos/' + p.id)).estado, 404);

    assert.equal((await alumno.post('/api/invitaciones/unirse', { codigo: 'mal' })).estado, 400);
    let ultimo;
    for (let i = 0; i < config.invitaciones.intentosMaximos + 1; i++) {
      ultimo = await alumno.post('/api/invitaciones/unirse', { codigo: 'ZZZZ' + String(2345 + i).replace(/[01]/g, '9') });
    }
    assert.equal(ultimo.estado, 429);
    assert.equal(ultimo.datos.codigo, 'DEMASIADOS_INTENTOS');
  });

  it('CA-09 REGISTRO_ROL decide el rol; nunca «admin», y el administrador lo cambia y desactiva cuentas', async () => {
    const previo = config.registro.rol;
    config.registro.rol = 'miembro';
    let alumno;
    try {
      alumno = await registrar('Sin proyecto propio');
      assert.equal(alumno.usuario.rol, 'miembro');
      assert.equal((await e.anonimo.get('/api/salud')).datos.registroRol, 'miembro');
    } finally {
      config.registro.rol = previo;
    }
    const lista = (await e.admin.get('/api/usuarios')).datos;
    assert.equal(lista.find((u) => u.id === alumno.usuario.id).origen, 'registro');
    assert.equal(lista.find((u) => u.id === 'u-admin').origen, 'admin');

    assert.equal((await alumno.post('/api/proyectos', { nombre: 'Aún no' })).estado, 403, 'un miembro no crea proyectos');
    assert.equal((await e.admin.patch('/api/usuarios/' + alumno.usuario.id, { rol: 'director' })).estado, 200);
    assert.equal((await alumno.post('/api/proyectos', { nombre: 'Ya puedo' })).estado, 201, 'con rol de director, sí');

    assert.equal((await e.admin.patch('/api/usuarios/' + alumno.usuario.id, { activo: false })).estado, 200);
    assert.equal((await alumno.get('/api/proyectos')).estado, 401, 'desactivada, su sesión deja de valer');

    /* Un REGISTRO_ROL inválido o «admin» en el entorno vuelve a director */
    for (const valor of ['admin', 'superusuario', '']) {
      const hijo = require('child_process').spawnSync(process.execPath, ['-e',
        'process.stdout.write(require("./src/config").registro.rol)'],
      { cwd: require('path').resolve(__dirname, '..', '..'), env: { ...process.env, REGISTRO_ROL: valor }, encoding: 'utf8' });
      assert.equal(hijo.stdout, 'director', 'REGISTRO_ROL=' + valor);
    }
  });

  it('CA-11 cadena completa: registrarse, crear el proyecto, añadir a dos compañeros y trabajar sobre los mismos datos guardados', async () => {
    const lider = await registrar('Líder registrado');
    const p = await lider.post('/api/proyectos', { nombre: 'Proyecto en equipo', metodologia: 'agil' });
    assert.equal(p.estado, 201, 'un registrado crea su proyecto sin pasar por un administrador');
    assert.equal(p.datos.directorId, lider.usuario.id);
    const equipo = (await lider.get('/api/proyectos/' + p.datos.id + '/miembros')).datos;
    assert.deepEqual(equipo.map((m) => [m.usuarioId, m.rol]), [[lider.usuario.id, 'lider']]);

    const ana = await registrar('Ana');
    const beto = await registrar('Beto');
    /* El líder los encuentra por correo entre las cuentas y los añade */
    const cuentas = (await lider.get('/api/usuarios')).datos;
    for (const c of [ana, beto]) {
      const u = cuentas.find((x) => x.correo === c.usuario.correo);
      assert.ok(u, 'el líder encuentra ' + c.usuario.correo);
      assert.equal((await lider.post('/api/proyectos/' + p.datos.id + '/miembros', { usuarioId: u.id, rol: 'equipo' })).estado, 201);
    }

    const doc = await ana.post('/api/proyectos/' + p.datos.id + '/documentos', { artefactoId: 'art-acta-proyecto', procesoId: 'p-gob-01' });
    assert.equal(doc.estado, 201);
    const docId = doc.datos.documento.id;
    assert.equal((await ana.put('/api/documentos/' + docId + '/bloques/0', { valor: 'Propósito que escribe Ana' })).estado, 200);
    assert.equal((await beto.put('/api/proyectos/' + p.datos.id + '/procesos/p-gob-01', { estado: 'completado' })).estado, 200);

    /* Lo que escribe uno lo lee el otro y el líder, y está en la base */
    assert.equal((await beto.get('/api/documentos/' + docId)).datos.contenido['0'], 'Propósito que escribe Ana');
    assert.equal((await lider.get('/api/proyectos/' + p.datos.id)).datos.progreso.completados, 1);
    const enBd = await db.uno(
      `SELECT d.contenido->>'0' AS proposito, pp.estado FROM documentos d
       JOIN proyecto_procesos pp ON pp.proyecto_id = d.proyecto_id AND pp.proceso_id = 'p-gob-01'
       WHERE d.id = $1`, [docId]);
    assert.deepEqual(enBd, { proposito: 'Propósito que escribe Ana', estado: 'completado' });

    /* Lo del líder sigue siendo del líder */
    assert.equal((await ana.patch('/api/proyectos/' + p.datos.id, { nombre: 'No' })).estado, 403);
    assert.equal((await beto.post('/api/proyectos/' + p.datos.id + '/miembros', { usuarioId: 'u-admin' })).estado, 403);
    /* Y un compañero director no ve proyectos de otros grupos */
    assert.equal((await ana.get('/api/proyectos')).datos.length, 1);
  });

  it('CA-10 borrar el proyecto borra sus códigos, y exportar/importar no los arrastra', async () => {
    const { lider, p, inv } = await grupo();
    const exp = (await e.admin.get('/api/datos/exportar')).datos;
    assert.equal(exp.invitaciones, undefined, 'los códigos no viajan en la exportación');
    assert.equal((await lider.del('/api/proyectos/' + p.id)).estado, 204);
    const quedan = await db.uno('SELECT count(*)::int AS n FROM invitaciones WHERE id = $1', [inv.id]);
    assert.equal(quedan.n, 0);
  });
});
