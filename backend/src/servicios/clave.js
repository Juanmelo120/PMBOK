/* ═══════════════════════════════════════════════════════════
   clave.js — Cifrado y comprobación de contraseñas fuera del hilo principal
   ───────────────────────────────────────────────────────────
   bcryptjs es JavaScript puro y su API «asíncrona» no cede el turno:
   cifrar 50 contraseñas seguidas (una clase entera entrando a la vez)
   deja el hilo de Node parado casi tres segundos, y con él toda la API,
   incluso /api/salud. El trabajo se reparte entre unos pocos hilos, que
   producen exactamente el mismo hash —las cuentas ya creadas siguen
   valiendo— y dejan libre el bucle de eventos.

   Si el entorno no admite hilos, se cifra en el propio hilo: la API
   sigue funcionando, solo que más despacio cuando hay muchos accesos.
   ═══════════════════════════════════════════════════════════ */

'use strict';

const os = require('os');
const path = require('path');
const bcrypt = require('bcryptjs');

const COSTE = 10;

const nucleos = typeof os.availableParallelism === 'function'
  ? os.availableParallelism() : (os.cpus().length || 1);
const pedidos = parseInt(process.env.CLAVE_HILOS, 10);
const HILOS = Math.max(1, Math.min(Number.isFinite(pedidos) ? pedidos : 4, Math.max(1, nucleos - 1)));

let Worker = null;
try { ({ Worker } = require('node:worker_threads')); } catch (e) { /* sin hilos */ }

const ARCHIVO = path.join(__dirname, 'clave-hilo.js');

const ociosos = [];      // hilos libres
const cola = [];         // trabajos esperando hilo
let vivos = 0;           // hilos creados y en pie
let sinHilos = !Worker;  // el entorno no los admite o todos fallaron
let siguienteId = 1;

function crearHilo() {
  const h = new Worker(ARCHIVO);
  h.trabajo = null;
  /* Un hilo ocioso no debe impedir que el proceso termine */
  h.unref();
  h.on('message', (m) => {
    const t = h.trabajo;
    h.trabajo = null;
    h.unref();
    liberar(h);
    if (!t) return;
    if (m.error) t.rechazar(new Error(m.error));
    else t.resolver(m.valor);
  });
  h.on('error', (err) => {
    const t = h.trabajo;
    h.trabajo = null;
    retirar(h);
    if (t) t.rechazar(err);
  });
  h.on('exit', () => retirar(h));
  vivos++;
  return h;
}

function retirar(h) {
  const i = ociosos.indexOf(h);
  if (i !== -1) ociosos.splice(i, 1);
  if (!h.retirado) { h.retirado = true; vivos--; }
  /* Quien esperaba a ese hilo no puede quedarse esperando para siempre */
  while (cola.length && vivos < HILOS) {
    try {
      asignar(crearHilo(), cola.shift());
    } catch (err) {
      sinHilos = true;
      cola.splice(0, cola.length).forEach((t) => t.rechazar(err));
      return;
    }
  }
  /* Sin ningún hilo en pie se cifra en el hilo principal antes que fallar */
  if (vivos === 0) sinHilos = true;
}

function liberar(h) {
  const t = cola.shift();
  if (t) asignar(h, t);
  else ociosos.push(h);
}

function asignar(h, t) {
  h.trabajo = t;
  /* Mientras trabaja sí cuenta para mantener vivo el proceso */
  h.ref();
  h.postMessage(t.mensaje);
}

function enHilo(mensaje) {
  return new Promise((resolver, rechazar) => {
    const t = { mensaje: { ...mensaje, id: siguienteId++ }, resolver: resolver, rechazar: rechazar };
    const libre = ociosos.pop();
    if (libre) return asignar(libre, t);
    if (vivos < HILOS) {
      try {
        return asignar(crearHilo(), t);
      } catch (err) {
        sinHilos = true;
        return rechazar(err);
      }
    }
    cola.push(t);
  });
}

async function despachar(mensaje, enElSitio) {
  if (sinHilos) return enElSitio();
  try {
    return await enHilo(mensaje);
  } catch (err) {
    /* Un hilo que se cae no puede dejar a nadie sin poder entrar:
       se rehace el trabajo aquí mismo, con el mismo resultado. */
    return enElSitio();
  }
}

function hashear(texto, coste) {
  const c = coste || COSTE;
  return despachar({ op: 'hash', texto: String(texto), coste: c }, () => bcrypt.hash(String(texto), c));
}

function comparar(texto, hash) {
  return despachar({ op: 'comparar', texto: String(texto), hash: hash },
    () => bcrypt.compare(String(texto), hash));
}

/* Cierra los hilos; solo hace falta en scripts que quieran salir ya */
function cerrar() {
  const todos = ociosos.splice(0, ociosos.length);
  return Promise.all(todos.map((h) => h.terminate()));
}

module.exports = { COSTE, HILOS, hashear, comparar, cerrar };
