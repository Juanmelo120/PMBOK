/* ═══════════════════════════════════════════════════════════
   config.js — Configuración leída del entorno y de backend/.env
   Las variables ya presentes en el entorno tienen prioridad sobre
   el archivo .env (así las pruebas apuntan a su propia base).
   ═══════════════════════════════════════════════════════════ */

'use strict';

const path = require('path');
const crypto = require('crypto');

const RAIZ = path.resolve(__dirname, '..');
require('dotenv').config({ path: path.join(RAIZ, '.env'), quiet: true });

function entero(valor, porDefecto) {
  const n = parseInt(valor, 10);
  return Number.isFinite(n) ? n : porDefecto;
}

function lista(valor, porDefecto) {
  if (!valor) return porDefecto;
  return String(valor).split(',').map((x) => x.trim()).filter(Boolean);
}

let secreto = process.env.JWT_SECRETO;
if ((!secreto || secreto.length < 32) && process.env.NODE_ENV === 'production') {
  /* En línea, un secreto aleatorio cerraría todas las sesiones en cada reinicio */
  throw new Error('JWT_SECRETO es obligatorio en producción (al menos 32 caracteres fijos en backend/.env).');
}
if (!secreto || secreto.length < 32) {
  secreto = crypto.randomBytes(48).toString('hex');
  if (process.env.NODE_ENV !== 'test') {
    console.warn('[config] JWT_SECRETO ausente o corto: se usa uno aleatorio y las sesiones caducan al reiniciar.');
  }
}

/* Los servicios gestionados (Railway, Render, Neon…) entregan una sola URL
   de conexión en vez de las variables PG* sueltas. */
function desdeUrl(url) {
  const u = new URL(url);
  const texto = (x) => (x ? decodeURIComponent(x) : '');
  return {
    host: u.hostname,
    port: entero(u.port, 5432),
    user: texto(u.username),
    password: texto(u.password),
    database: texto(u.pathname.replace(/^\//, ''))
  };
}

const urlBd = process.env.DATABASE_URL || '';
const partes = urlBd ? desdeUrl(urlBd) : {};

const nombreBd = partes.database || process.env.PGDATABASE || 'pmbok8';
if (!/^[a-z_][a-z0-9_-]{0,62}$/i.test(nombreBd)) {
  throw new Error('El nombre de la base solo admite letras, dígitos, guion y guion bajo: ' + nombreBd);
}

/* Fuera de la propia máquina, PostgreSQL gestionado exige TLS. Su certificado
   no lo firma una CA pública, así que se cifra sin verificarlo; el tráfico va
   por la red privada del proveedor. Con PGSSL se fuerza o se desactiva. */
const anfitrion = partes.host || process.env.PGHOST || 'localhost';
const esLocal = /^(localhost|127\.|::1|\[::1\]|0\.0\.0\.0)/.test(anfitrion);
const ssl = (function () {
  const v = String(process.env.PGSSL || '').trim().toLowerCase();
  if (['false', 'off', '0', 'no'].indexOf(v) !== -1) return false;
  if (['true', 'on', '1', 'si', 'sí'].indexOf(v) !== -1) return { rejectUnauthorized: false };
  return esLocal ? false : { rejectUnauthorized: false };
})();

const bd = {
  host: anfitrion,
  port: partes.port || entero(process.env.PGPORT, 5432),
  user: partes.user || process.env.PGUSER || 'postgres',
  password: partes.password || process.env.PGPASSWORD || '',
  database: nombreBd,
  ssl: ssl,
  /* Cuántas consultas se atienden a la vez. Con 50 personas trabajando,
     este número es el que marca el ritmo: por debajo de ~16 las lecturas
     grandes (/api/estado) se pasan la vida haciendo cola. Subirlo sin
     medida tampoco ayuda: PostgreSQL rinde menos con muchas conexiones. */
  max: entero(process.env.PGPOOL_MAX, 16),
  /* Una conexión ociosa se devuelve al sistema en medio minuto */
  idleTimeoutMillis: entero(process.env.PGPOOL_OCIO_MS, 30000),
  /* Si el pozo está lleno y no se libera nada, más vale decirlo que
     dejar la petición colgada para siempre (que es el valor de fábrica) */
  connectionTimeoutMillis: entero(process.env.PGPOOL_ESPERA_MS, 15000),
  /* Ninguna consulta debe retener una conexión indefinidamente */
  statement_timeout: entero(process.env.PG_CONSULTA_MS, 30000),
  application_name: 'pmbok8-backend'
};

/* La API trabaja con una cuenta de permisos mínimos (PGUSER). Crear la
   base, el rol y aplicar migraciones lo hace la cuenta administradora
   (PGADMIN_USER); si no se indica, se usa la misma de la API. */
const bdAdmin = {
  ...bd,
  user: process.env.PGADMIN_USER || bd.user,
  password: process.env.PGADMIN_USER ? (process.env.PGADMIN_PASSWORD || '') : bd.password,
  max: 2,
  /* Una migración puede tardar lo que haga falta: cortarla por la mitad
     dejaría el esquema a medias */
  statement_timeout: undefined,
  application_name: 'pmbok8-migraciones'
};

module.exports = {
  raiz: RAIZ,
  entorno: process.env.NODE_ENV || 'development',
  puerto: entero(process.env.PORT, 3000),

  /* Detrás de Caddy o nginx, la IP real del visitante llega en X-Forwarded-For.
     Sin esto, los límites por IP (acceso y registro) verían a todos como el proxy.
     Valores: número de proxies delante (1), «loopback», o vacío si no hay proxy. */
  confiarProxy: (() => {
    const v = String(process.env.TRUST_PROXY || '').trim();
    if (!v || v === 'false') return false;
    return /^\d+$/.test(v) ? Number(v) : v;
  })(),

  bd,
  bdAdmin,

  jwt: {
    secreto: secreto,
    expiraHoras: entero(process.env.JWT_EXPIRA_HORAS, 12)
  },

  corsOrigenes: lista(process.env.CORS_ORIGENES, [
    'http://localhost:3000', 'http://127.0.0.1:3000',
    'http://localhost:8000', 'http://127.0.0.1:8000', 'null'
  ]),

  /* El backend sirve la interfaz existente desde la carpeta del proyecto */
  frontendDir: path.resolve(RAIZ, process.env.FRONTEND_DIR || '..'),
  catalogoDir: path.resolve(RAIZ, process.env.CATALOGO_DIR || '../assets/js/datos'),

  admin: {
    nombre: process.env.ADMIN_NOMBRE || 'Administrador',
    correo: (process.env.ADMIN_CORREO || 'admin@pmbok.local').toLowerCase(),
    clave: process.env.ADMIN_CLAVE || 'admin123'
  },

  archivos: {
    limiteBytes: entero(process.env.ARCHIVO_LIMITE_MB, 10) * 1024 * 1024
  },

  /* Documentación de la API: /api/docs (Scalar) y /api/openapi.json */
  docs: {
    /* Se publican sin sesion, asi que en produccion nacen apagadas: no hay
       por que regalar el mapa de la API a quien pase por la URL. Fuera de
       produccion estan encendidas, y DOCS_ACTIVAS manda en los dos casos. */
    activas: (function () {
      var pedido = String(process.env.DOCS_ACTIVAS || '').trim().toLowerCase();
      if (pedido === 'true') return true;
      if (pedido === 'false') return false;
      return process.env.NODE_ENV !== 'production';
    })(),
    /* Scalar descarga su interfaz de jsdelivr. Apuntando DOCS_CDN a una
       copia servida por el propio servidor, la página funciona sin internet. */
    cdn: String(process.env.DOCS_CDN || '').trim()
  },

  acceso: {
    intentosMaximos: entero(process.env.LOGIN_INTENTOS, 10),
    ventanaMinutos: entero(process.env.LOGIN_VENTANA_MIN, 15)
  },

  /* Cuentas creadas por cada persona desde la pantalla de acceso */
  registro: {
    abierto: String(process.env.REGISTRO_ABIERTO || 'true').toLowerCase() !== 'false',
    /* Director: quien se registra puede crear su proyecto y formar su equipo.
       Nunca «admin»: un valor no admitido vuelve a director. */
    rol: ['director', 'miembro', 'ejecutor'].includes(String(process.env.REGISTRO_ROL || '').trim())
      ? String(process.env.REGISTRO_ROL).trim() : 'director',
    /* Un aula entera suele salir a internet con una sola IP pública */
    porHora: entero(process.env.REGISTRO_POR_HORA, 200)
  },

  invitaciones: {
    intentosMaximos: entero(process.env.INVITACION_INTENTOS, 10),
    ventanaMinutos: entero(process.env.INVITACION_VENTANA_MIN, 15)
  }
};
