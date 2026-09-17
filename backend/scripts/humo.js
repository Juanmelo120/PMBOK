/* ═══════════════════════════════════════════════════════════
   humo.js — Prueba de humo contra un servidor en marcha
   ───────────────────────────────────────────────────────────
   Uso:
     node scripts/humo.js [URL] [--limpiar]
     npm run humo -- https://pmbok8.midominio.com --limpiar

   Recorre por HTTP lo que hará la clase:
     1. salud: base conectada y catálogo de 40 procesos y 42 artefactos
     2. registrar a la líder y volver a entrar con correo y contraseña
     3. crear un proyecto, registrar a dos compañeros y añadirlos
     4. un compañero escribe el acta; el otro y la líder la leen
     5. sesiones nuevas vuelven a leerla: está guardada en la base
   Con --limpiar borra el proyecto al final. Las cuentas de prueba
   solo las borra un administrador: define HUMO_ADMIN_CORREO y
   HUMO_ADMIN_CLAVE para que también se eliminen.
   ═══════════════════════════════════════════════════════════ */

'use strict';

const argumentos = process.argv.slice(2);
const BASE = (argumentos.find((a) => !a.startsWith('--')) || 'http://localhost:3000').replace(/\/+$/, '');
const LIMPIAR = argumentos.includes('--limpiar');
const MARCA = Date.now().toString(36);

let pasos = 0;
function ok(texto) { pasos++; console.log('  ✔ ' + texto); }
function fallar(texto, detalle) {
  console.error('  ✖ ' + texto + (detalle ? '\n    ' + JSON.stringify(detalle) : ''));
  process.exit(1);
}

async function pedir(metodo, ruta, cuerpo, token) {
  const headers = {};
  if (cuerpo !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = 'Bearer ' + token;
  let r;
  try {
    r = await fetch(BASE + '/api' + ruta, { method: metodo, headers, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
  } catch (err) {
    fallar('No se pudo conectar con ' + BASE + ': ' + err.message);
  }
  const datos = r.status === 204 ? null : await r.json().catch(() => null);
  return { estado: r.status, datos };
}

async function esperar(estado, promesa, texto) {
  const r = await promesa;
  if (r.estado !== estado) fallar(texto + ' (esperaba ' + estado + ', llegó ' + r.estado + ')', r.datos);
  return r.datos;
}

(async () => {
  console.log('Prueba de humo contra ' + BASE + '\n');

  const salud = await esperar(200, pedir('GET', '/salud'), 'Salud');
  if (salud.bd !== 'conectada') fallar('La base no está conectada', salud);
  if (salud.catalogo.procesos !== 40 || salud.catalogo.artefactos !== 42) fallar('Catálogo incompleto', salud.catalogo);
  ok('Salud: ' + salud.postgres + ', base «' + salud.base + '», 40 procesos y 42 artefactos');
  if (salud.primerUso) console.log('  ! La cuenta inicial conserva admin123: cámbiala antes de compartir la URL');
  if (!salud.registroAbierto) fallar('El registro está cerrado (REGISTRO_ABIERTO=false)');

  const clave = 'humo-' + MARCA;
  const correo = (n) => 'humo.' + n + '.' + MARCA + '@prueba.local';

  const lider = await esperar(201, pedir('POST', '/auth/registrar', { nombre: 'Humo Líder', correo: correo('lider'), clave }), 'Registro de la líder');
  ok('Registro: la líder entra con rol «' + lider.usuario.rol + '»');
  const sesionLider = await esperar(200, pedir('POST', '/auth/entrar', { correo: correo('lider'), clave }), 'Inicio de sesión de la líder');
  const tl = sesionLider.token;
  ok('Inicio de sesión con correo y contraseña');

  const p = await esperar(201, pedir('POST', '/proyectos', { nombre: 'Humo ' + MARCA, metodologia: 'agil' }, tl),
    'Crear proyecto (¿REGISTRO_ROL=director?)');
  ok('Proyecto creado: ' + p.nombre);

  const companeros = [];
  for (const n of ['ana', 'beto']) {
    const c = await esperar(201, pedir('POST', '/auth/registrar', { nombre: 'Humo ' + n, correo: correo(n), clave }), 'Registro de ' + n);
    companeros.push(c);
  }
  const cuentas = await esperar(200, pedir('GET', '/usuarios', undefined, tl), 'Listar cuentas');
  for (const c of companeros) {
    const u = cuentas.find((x) => x.correo === c.usuario.correo);
    if (!u) fallar('La líder no encuentra a ' + c.usuario.correo);
    await esperar(201, pedir('POST', '/proyectos/' + p.id + '/miembros', { usuarioId: u.id, rol: 'equipo' }, tl), 'Añadir a ' + u.nombre);
  }
  ok('Dos compañeros registrados y añadidos al equipo');

  const [ana, beto] = companeros;
  const doc = await esperar(201, pedir('POST', '/proyectos/' + p.id + '/documentos',
    { artefactoId: 'art-acta-proyecto', procesoId: 'p-gob-01' }, ana.token), 'Ana genera el acta');
  const texto = 'Acta escrita en la prueba de humo ' + MARCA;
  await esperar(200, pedir('PUT', '/documentos/' + doc.documento.id + '/bloques/0', { valor: texto }, ana.token), 'Ana guarda el acta');
  ok('Un compañero guarda el acta');

  const leidoBeto = await esperar(200, pedir('GET', '/documentos/' + doc.documento.id, undefined, beto.token), 'Beto lee el acta');
  if (leidoBeto.contenido['0'] !== texto) fallar('Beto no ve lo que escribió Ana', leidoBeto.contenido);
  const nueva = await esperar(200, pedir('POST', '/auth/entrar', { correo: correo('lider'), clave }), 'Nueva sesión de la líder');
  const leidoLider = await esperar(200, pedir('GET', '/documentos/' + doc.documento.id, undefined, nueva.token), 'La líder lee el acta');
  if (leidoLider.contenido['0'] !== texto) fallar('La líder no ve lo guardado', leidoLider.contenido);
  ok('Otra sesión lee lo guardado: persiste en la base de datos');

  const noPuede = await pedir('PATCH', '/proyectos/' + p.id, { nombre: 'No debería' }, ana.token);
  if (noPuede.estado !== 403) fallar('Un miembro pudo cambiar la configuración del líder', noPuede);
  ok('Permisos: un miembro no toca la configuración del líder');

  if (LIMPIAR) {
    await esperar(204, pedir('DELETE', '/proyectos/' + p.id, undefined, tl), 'Borrar el proyecto de prueba');
    const adminCorreo = process.env.HUMO_ADMIN_CORREO;
    if (adminCorreo) {
      const a = await esperar(200, pedir('POST', '/auth/entrar', { correo: adminCorreo, clave: process.env.HUMO_ADMIN_CLAVE }), 'Entrar como administrador');
      const todas = await esperar(200, pedir('GET', '/usuarios', undefined, a.token), 'Listar cuentas');
      for (const u of todas.filter((x) => x.correo.endsWith('.' + MARCA + '@prueba.local'))) {
        await esperar(204, pedir('DELETE', '/usuarios/' + u.id, undefined, a.token), 'Borrar ' + u.correo);
      }
      ok('Limpieza: proyecto y cuentas de prueba eliminados');
    } else {
      ok('Limpieza: proyecto eliminado (las 3 cuentas humo.*.' + MARCA + '@prueba.local siguen; bórralas desde Administración)');
    }
  }

  console.log('\n' + pasos + ' comprobaciones superadas.');
})();
