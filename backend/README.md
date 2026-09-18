# Backend del Gestor PMBOK® 8

API REST en **Node.js + Express 5** con base de datos **PostgreSQL 17**. Guarda en el servidor
todo lo que hoy la interfaz guarda en `localStorage`: usuarios, permisos, portafolios, proyectos
con sus 40 procesos, documentos, archivos, riesgos, trabajo ágil, valor ganado y la capa EOS.

> **Estado:** API, base de datos e interfaz conectadas y probadas: 108 pruebas de aceptación de la
> API y 12 pruebas en navegador (Edge). Servida desde `http://localhost:3000`, la interfaz trabaja
> contra esta API; abierta con doble clic sobre `index.html`, sigue en modo local como siempre.

---

## Puesta en marcha

### Lo que ya está instalado en este equipo

| Pieza | Dónde | Detalle |
|---|---|---|
| PostgreSQL 17.6 | `C:\Users\lucio\pgsql` | Binarios oficiales (sin instalador: no hacían falta permisos de administrador) |
| Datos del clúster | `C:\Users\lucio\pgsql\data` | Fuera de OneDrive a propósito: la sincronización corrompe una base viva |
| Superusuario | `postgres` / `Lucio 12345` | Solo lo usa el migrador (`PGADMIN_*`). Solo escucha en `localhost:5432` |
| Cuenta de la API | `pmbok8_app` | Sin privilegios de administración: solo lee y escribe datos. Su contraseña aleatoria está en `.env` |
| Arranque automático | `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\PostgreSQL-PMBOK8.vbs` | Inicia PostgreSQL al iniciar sesión. Borra el archivo para desactivarlo |
| Bases | `pmbok8` (trabajo) y `pmbok8_test` (pruebas) | UTF-8, ordenación ICU `es-CO`, zona `America/Bogota` |

### Arrancar

Doble clic en **`backend\iniciar.cmd`**: arranca PostgreSQL si hace falta, instala dependencias
la primera vez y levanta la API. Después abre **http://localhost:3000** y entra con
`admin@pmbok.local` · `admin123`; la primera vez se pide elegir una contraseña propia.

Desde una consola en `backend\`:

```bat
npm run bd:iniciar      :: arranca PostgreSQL        (bd:detener, bd:estado)
npm start               :: levanta la API en el puerto 3000
npm run dev             :: igual, reiniciando al cambiar el código
npm test                :: batería de aceptación de la API (usa pmbok8_test, nunca pmbok8)
npm run test:e2e        :: pruebas en navegador con Edge (API propia en :3100, base pmbok8_e2e)
npm run db:migrar       :: aplica migraciones pendientes
npm run db:reiniciar    :: BORRA pmbok8 y la crea de cero con el administrador
```

Al arrancar, el servidor crea la base si falta, aplica las migraciones pendientes, sincroniza el
catálogo y garantiza que exista un administrador. Solo escucha en el propio equipo
(`127.0.0.1` y `::1`).

### En otro equipo

1. Instala Node.js 20 o superior y PostgreSQL 15 o superior.
2. Copia `.env.example` a `.env` y rellena `PGADMIN_PASSWORD` (el superusuario), una contraseña
   larga para `PGPASSWORD` (la cuenta `pmbok8_app`, que el migrador crea) y `JWT_SECRETO`.
3. `npm install` y `npm start`.

### Configuración (`backend/.env`)

| Variable | Por defecto | Uso |
|---|---|---|
| `PORT` | `3000` | Puerto HTTP |
| `HOST` | `127.0.0.1` y `::1` | Dirección de escucha; ponla solo si necesitas otra |
| `PGHOST` `PGPORT` `PGDATABASE` | `localhost` `5432` `pmbok8` | Servidor y base |
| `PGUSER` `PGPASSWORD` | `pmbok8_app` | Cuenta con la que trabaja la API (permisos mínimos) |
| `PGADMIN_USER` `PGADMIN_PASSWORD` | `postgres` | Cuenta que crea la base y el rol y aplica migraciones. Una contraseña con espacios va entre comillas |
| `JWT_SECRETO` | aleatorio en cada arranque | Firma de los tokens. Sin él, las sesiones caducan al reiniciar |
| `JWT_EXPIRA_HORAS` | `12` | Duración de una sesión |
| `ADMIN_CORREO` `ADMIN_CLAVE` | `admin@pmbok.local` `admin123` | Cuenta inicial, solo si no hay ningún administrador |
| `CORS_ORIGENES` | `localhost:3000`, `localhost:8000`, `null` | Orígenes admitidos (`null` = `index.html` abierto desde el disco) |
| `ARCHIVO_LIMITE_MB` | `10` | Tamaño máximo de un archivo subido |
| `REGISTRO_ABIERTO` | `true` | Cada persona crea su cuenta desde la pantalla de acceso. `false`: solo el administrador crea cuentas |
| `REGISTRO_ROL` | `director` | Rol de las cuentas registradas: `director` (crea su proyecto y forma su equipo), `miembro` o `ejecutor`. Nunca `admin` |
| `REGISTRO_POR_HORA` | `200` | Cuentas nuevas permitidas por IP en una hora (un aula comparte IP pública) |
| `TRUST_PROXY` | vacío | Detrás de Caddy o nginx, `1`: los límites por IP usan la IP real del visitante |
| `NODE_ENV` | — | `production` exige `JWT_SECRETO` fijo; sin él la app no arranca. Ver [DESPLIEGUE.md](DESPLIEGUE.md) |
| `INVITACION_INTENTOS` · `INVITACION_VENTANA_MIN` | `10` · `15` | Códigos incorrectos por usuario antes de bloquear, y durante cuántos minutos |

---

## Estructura

```
backend/
  iniciar.cmd                 Arranque con doble clic
  scripts/postgres.cmd        iniciar | detener | estado de PostgreSQL
  db/
    migraciones/001_esquema.sql   Tablas, restricciones, disparadores, nivel_en() y vista de avance
    migraciones/002_…, 003_…      Cambio obligatorio de clave; registro propio e invitaciones
    migrar.js                 Crea la base y aplica migraciones (tabla schema_migraciones)
    semilla.js                Catálogo + administrador inicial (idempotente)
  src/
    servidor.js               Arranque: migrar, sembrar y escuchar
    app.js                    Express: API en /api, interfaz en / y /assets
    config.js · db.js         Entorno y pool de conexiones
    catalogo.js               Lee assets/js/datos/*.js (una sola fuente de verdad)
    definiciones.js           Tablas, campos y validación (zod) de cada recurso
    repositorio.js            CRUD genérico camelCase ⇄ snake_case
    errores.js · validacion.js
    middleware/auth.js        Sesión, roles y nivel por proyecto
    servicios/                sesiones · estado · proyectos · trabajo · documentos · datos · invitaciones
    rutas/                    auth · usuarios · proyectos · organizacion · recursos
  tests/
    ayuda.js                  Base aislada + servidor real en puerto libre
    aceptacion/*.test.js      12 historias de usuario, 108 criterios (API)
    e2e/*.spec.js             Pruebas en navegador (Playwright + Edge)
  playwright.config.js        Arranca su propia API en :3100 con la base pmbok8_e2e
```

El backend **no duplica el contenido de la guía**: metodologías, flujo de los 40 procesos y
plantillas de los 42 artefactos se leen de `assets/js/datos/` al arrancar y se vuelcan a las
tablas `catalogo_procesos` y `catalogo_artefactos`, que sirven de claves foráneas.

## Modelo de datos

29 tablas y una vista (`v_progreso_proyecto`). Entidades y series temporales van en tablas propias; las listas pequeñas que la
interfaz edita enteras (fases, hitos, DoD, metas de una roca, orden del flujo y estado de la
verificación de calidad) van en `JSONB` con su tipo comprobado.

| Área | Tablas |
|---|---|
| Acceso | `usuarios` (hash bcrypt y `origen`: admin, registro o importación), `sesiones`, `permisos` |
| Cartera | `portafolios`, `programas`, `proyectos`, `miembros`, `invitaciones` (códigos del equipo) |
| Ciclo de vida | `proyecto_procesos`, `documentos`, `archivos`, `archivo_contenidos` (binario aparte) |
| Dominios | `riesgos`, `interesados`, `cambios`, `lecciones`, `comentarios` |
| Trabajo y control | `sprints`, `sprint_burndown` (una fila por día), `tareas`, `mediciones` |
| EOS | `rocas`, `metricas`, `metrica_valores` (una fila por semana), `asientos`, `vto` |
| Catálogo | `catalogo_procesos`, `catalogo_artefactos`, `schema_migraciones` |

Reglas que garantiza la propia base, no solo la API:

- Valores permitidos (`CHECK`) para estados, roles, metodologías, estrategias, escalas 1-5 y fechas coherentes.
- Un solo sprint activo por proyecto (índice único parcial).
- Una tarea solo puede apuntar a un sprint **de su mismo proyecto** (clave foránea compuesta).
- Un documento por artefacto y proyecto; un miembro por usuario y proyecto.
- Borrar un proyecto borra en cascada todo lo suyo; borrar un portafolio deja sus proyectos sin portafolio.
- Los permisos apuntan a un portafolio, programa o proyecto existente, y desaparecen con él (disparadores).
- `nivel_en(proyecto, usuario)` calcula el acceso efectivo en SQL.
- Los identificadores son `TEXT`: se conservan los que genera el navegador al importar.

## Permisos

Nivel efectivo por proyecto: **0** sin acceso · **1** ver · **2** editar · **3** dirigir.
Administrador y director del proyecto dirigen. Dentro del equipo, el nivel sale del rol del
miembro: **líder** dirige, **observador** solo ve y el resto (PO, SM, equipo, ejecutor) edita.
Los permisos por portafolio, programa o proyecto se suman y **gana el más alto**.

| Acción | Quién |
|---|---|
| Ver un proyecto y todo lo suyo | nivel ≥ 1 (si es 0, la API responde **404**, no revela que existe) |
| Comentar | nivel ≥ 1; editar o borrar un comentario: su autor o nivel ≥ 2 |
| Procesos, documentos, archivos, riesgos, tareas, sprints, mediciones, hitos, DoD, calidad, orden del flujo | nivel ≥ 2 |
| Configuración del proyecto, metodología, fases, equipo y roles, códigos de invitación, borrar el proyecto | nivel 3 |
| Crear la propia cuenta (nace con `REGISTRO_ROL`, por defecto `director`, sin proyectos) | cualquiera, si `REGISTRO_ABIERTO` |
| Unirse a un equipo con un código | cualquier sesión; entra con el rol del código (nunca líder) |
| Crear proyectos; crear o cambiar portafolios, programas, rocas, métricas, asientos y VTO | rol `admin` o `director` |
| Leer portafolios, EOS, usuarios y catálogo | cualquier sesión (el catálogo es público) |
| Usuarios, permisos, exportar, importar y reiniciar | rol `admin` |

Las reglas de crear proyectos y de editar la estructura siguen la descripción de los roles de la
aplicación («el director crea y dirige proyectos», «el ejecutor no edita planes»). La interfaz las
aplica también: oculta lo que el rol no puede hacer y muestra la gerencia EOS en solo lectura.

**Contraseñas que otra persona conoce.** La cuenta inicial, las que crea o restablece un
administrador y las importadas con la provisional quedan marcadas (`debeCambiarClave`). Mientras lo
estén, la API responde `403 CLAVE_PENDIENTE` a todo salvo `GET /api/auth/yo`, `PUT /api/auth/clave`
y `POST /api/auth/salir`, y la interfaz pide elegir una contraseña nueva, distinta de la actual.
Una cuenta creada por su dueño en el registro no queda marcada: la contraseña solo la conoce él.

**Uso en un aula.** Cada alumno crea su cuenta en **Crear cuenta** y entra como `director`
(`REGISTRO_ROL`), así que quien lidera su grupo crea el proyecto sin pasar por un administrador.
Añade a sus compañeros en **Equipo → Añadir compañero por correo**, o genera en **Invitar al
equipo** un código (8 caracteres sin 0/O ni 1/I, con rol y caducidad opcional) que ellos escriben en
**Panel → Unirme con un código**. Todos trabajan sobre los mismos datos; configuración, equipo,
roles y códigos quedan solo para el líder. Con `REGISTRO_ROL=miembro`, solo crea proyectos quien
reciba el rol director de un administrador.

---

## API

Todas las rutas empiezan por `/api`, hablan JSON y, salvo las públicas, exigen la cabecera
`Authorization: Bearer <token>`. Las fechas-hora van en **milisegundos** y las fechas en
`AAAA-MM-DD`, igual que en la base local del navegador. Los campos van en camelCase.

**Errores:** `{ "error": "mensaje legible", "codigo": "CLAVE", "detalles": [{ "campo", "mensaje" }] }`
con 400 (datos no válidos), 401 (sin sesión), 403 (sin permiso), 404, 409 (conflicto),
413 (demasiado grande) o 429 (demasiados intentos de acceso).

### Públicas

| Método y ruta | Descripción |
|---|---|
| `GET /api/salud` | Estado de la base y del catálogo; `primerUso` indica que solo existe la cuenta inicial sin estrenar; `registroAbierto` |
| `GET /api/catalogo/metodologias` · `bandas` · `procesos` · `artefactos` · `artefactos/:id` | Contenido de la guía |
| `POST /api/auth/entrar` | `{ correo, clave }` → `{ token, expira, usuario }` |
| `POST /api/auth/registrar` | `{ nombre?, correo, clave }` (clave ≥ 6) → 201 `{ token, expira, usuario }`, ya con sesión. Rol de `REGISTRO_ROL`; el rol enviado se ignora. 403 `REGISTRO_CERRADO`, 409 correo existente, 429 demasiadas altas |

### Sesión y administración

| Método y ruta | Descripción |
|---|---|
| `POST /api/auth/salir` · `GET /api/auth/yo` · `PUT /api/auth/clave` | Cerrar sesión, perfil, cambiar la propia contraseña (`{ actual, nueva }`, nueva distinta) |
| `GET /api/estado` | Todo lo que el usuario puede ver, con la forma de la base del navegador y el `nivel` de cada proyecto. La interfaz lo carga al entrar |
| `GET /api/usuarios` · `GET /api/usuarios/roles` · `GET /api/usuarios/:id` | Listar (sin contraseñas) |
| `POST /api/usuarios` · `PATCH /api/usuarios/:id` · `PUT /api/usuarios/:id/clave` · `DELETE /api/usuarios/:id` | Solo admin. Siempre queda un admin activo. Crear o restablecer marca `debeCambiarClave` |
| `GET /api/permisos?usuarioId=` · `POST /api/permisos` · `DELETE /api/permisos/:id` | Conceder (`{ id?, usuarioId, ambito, refId, nivel }`, cambia el nivel si ya existía) y revocar |
| `GET /api/datos/exportar` · `POST /api/datos/importar` · `POST /api/datos/reiniciar` | Formato `pmbok8-gestor`; reiniciar exige `{ "confirmacion": "ELIMINAR" }` |

### Proyectos

| Método y ruta | Descripción |
|---|---|
| `GET /api/panel` · `GET /api/calendario` | Cifras y siguiente paso; agenda de todos los proyectos visibles |
| `GET /api/proyectos` · `POST /api/proyectos` | Visibles con nivel y avance; crear (con fases, líder y Sprint 0 si es ágil o híbrido). Mover un proyecto a otro portafolio lo saca de un programa ajeno |
| `GET` · `PATCH` · `DELETE /api/proyectos/:id` | Detalle con avance y siguiente paso; editar; borrar en cascada |
| `GET /api/proyectos/:id/progreso` · `siguiente` · `evm` · `salud` · `matriz-riesgos` · `calendario` · `velocidad` · `sprint-activo` | Indicadores calculados |
| `GET /api/proyectos/:id/procesos` · `GET …/procesos/:procesoId` | Los 40 procesos con banda efectiva, estado, notas e iterativo; ficha con entradas y salidas |
| `PUT …/procesos/:procesoId` | `{ estado?, notas? }` |
| `PUT …/procesos/:procesoId/banda` | `{ banda }` — mover en el flujo; volver a la original borra el ajuste |
| `GET …/procesos/:procesoId/entradas` · `salidas` | ¿Existe ya cada documento? |
| `GET` · `POST /api/proyectos/:id/documentos` | Listar con completitud; generar `{ id?, artefactoId, procesoId? }` (idempotente) |
| `GET` · `PATCH` · `DELETE /api/documentos/:id` | Con plantilla; `{ estado?, nombre?, contenido? }` |
| `PUT /api/documentos/:id/bloques/:indice` | `{ valor }` — texto o tabla (`[[...], ...]`); vacío borra el bloque |
| `POST /api/documentos/:id/versiones` | Versión + 1 y vuelta a borrador |
| `GET` · `POST /api/proyectos/:id/archivos` | Listar; subir `multipart/form-data` (`archivo`, `categoria?`, `nombre?`, `id?`) |
| `GET /api/archivos/:id` · `GET /api/archivos/:id/contenido[?enLinea=1]` · `DELETE /api/archivos/:id` | Metadatos, descarga (en línea solo imágenes, PDF y texto), borrar |
| `GET` · `POST /api/proyectos/:id/invitaciones` | Nivel 3. Listar códigos; crear `{ id?, codigo?, rol?, dias? }` (rol por defecto `equipo`, nunca `lider`; `dias` 1-365 o sin caducidad) |
| `DELETE /api/invitaciones/:id` | Nivel 3. Retirar un código |
| `POST /api/invitaciones/unirse` | Cualquier sesión. `{ codigo }` (admite `abcd-2345`) → 201 `{ proyecto, rol, nivel, yaEraMiembro }`; 200 si ya era miembro (conserva su rol); 404 inexistente, 410 `CODIGO_CADUCADO`, 429 tras 10 fallos |

### Registros de un proyecto

Para **`miembros`, `riesgos`, `interesados`, `cambios`, `lecciones`, `tareas`, `sprints`,
`mediciones` y `comentarios`**:

```
GET    /api/proyectos/:id/<recurso>         listar
POST   /api/proyectos/:id/<recurso>         crear (acepta id y creado para «Deshacer»)
GET    /api/<recurso>/:rid                  leer      (también /api/proyectos/:id/<recurso>/:rid)
PATCH  /api/<recurso>/:rid                  editar
DELETE /api/<recurso>/:rid                  borrar
```

Además: `POST /api/sprints/:id/cerrar` (suma lo entregado y devuelve lo pendiente al backlog),
`GET|POST /api/sprints/:id/burndown`. Crear un sprint activo cierra el anterior, y cualquier
cambio en las tareas fotografía el burndown del día automáticamente.

### Organización

| Método y ruta | Descripción |
|---|---|
| `/api/portafolios` · `/api/programas?portafolioId=` · `/api/rocas?trimestre=Q3-2026` · `/api/metricas` · `/api/asientos` | `GET`, `POST`, `GET /:id`, `PATCH /:id`, `DELETE /:id` |
| `GET` · `POST /api/portafolios/:id/programas` | Programas de un portafolio |
| `PUT /api/metricas/:id/valores/:semana` | `{ valor }` — una celda del scorecard; vacío la borra |
| `GET /api/vto` · `PUT /api/vto/:bloqueId` | Las respuestas del VTO; texto vacío borra el bloque |

La interfaz genera los identificadores de lo que crea (proyectos, registros, documentos,
usuarios, permisos y archivos) para poder mostrarlo sin esperar; la API los acepta si son
válidos (`[A-Za-z0-9_.:-]`, hasta 100 caracteres) y responde 409 si ya existen.

Ejemplo:

```bash
curl -s -X POST http://localhost:3000/api/auth/entrar -H "Content-Type: application/json" \
     -d "{\"correo\":\"admin@pmbok.local\",\"clave\":\"<tu contraseña>\"}"
curl -s http://localhost:3000/api/proyectos -H "Authorization: Bearer <token>"
```

---

## Llevar al servidor lo guardado en el navegador

**En el mismo navegador** donde se trabajó en modo local: entra en `http://localhost:3000` como
administrador, abre **Administración** y pulsa **Llevar al servidor**. La aplicación importa la base
del navegador y sube uno a uno sus archivos (conservan su identificador). Lo del navegador no se borra.

**Desde otro equipo:** exporta allí los datos (**Administración → Exportar datos**) e impórtalos en
el servidor con **Importar datos**. Así no viajan los archivos, que viven en el navegador de origen.

La importación **reemplaza** los datos del servidor dentro de una transacción y sanea cada registro:
las referencias rotas se anulan o el registro se omite, y la respuesta dice cuántos se importaron
y cuántos se omitieron. La exportación del navegador no lleva contraseñas: las cuentas que ya
existían conservan la suya y las nuevas reciben **`cambiar123`**, que deben cambiar al entrar.

## Copias de seguridad

```bat
set PGPASSWORD=Lucio 12345
C:\Users\lucio\pgsql\bin\pg_dump.exe -h localhost -U postgres -Fc -f pmbok8.dump pmbok8
C:\Users\lucio\pgsql\bin\pg_restore.exe -h localhost -U postgres -d pmbok8 --clean pmbok8.dump
```

---

## Pruebas de aceptación

`npm test` recrea `pmbok8_test` en cada archivo, levanta la API real en un puerto libre y la usa
por HTTP como lo haría la interfaz. Cada archivo es una historia de usuario y cada prueba un
criterio de aceptación:

| Historia | Criterios | Qué comprueba |
|---|---|---|
| HU-01 Acceso y sesiones | 11 | Entrada, 401 uniformes, token manipulado, salida inmediata, cambio de contraseña, cuenta desactivada, bloqueo tras 10 fallos |
| HU-02 Usuarios y permisos | 8 | Roles, validaciones, último administrador, permisos que se suman, limpieza al borrar |
| HU-03 Proyectos | 10 | Creación por metodología, validaciones, coherencia portafolio-programa, editar frente a dirigir, 404 a ajenos, cascada, panel |
| HU-04 Procesos y documentos | 11 | 40 procesos (2·19·8·10·1), siguiente paso, avance con omitidos, mover bandas, documentos idempotentes, bloques, completitud, aprobación y versiones |
| HU-05 Trabajo ágil | 10 | Backlog, burndown diario real, cierre de sprint, velocidad, un solo sprint activo, sprint de otro proyecto |
| HU-06 Dominios y valor ganado | 12 | Severidad P×I, matriz, «Deshacer», interesados, cambios, lecciones, CV·SV·CPI·SPI·EAC·ETC·VAC·TCPI, calendario, comentarios, equipo |
| HU-07 Archivos | 7 | Subida con tildes, bytes íntegros, HTML nunca en línea, límite de 10 MB, permisos, borrado del contenido |
| HU-08 Cartera y EOS | 7 | Portafolios y programas, rocas y metas, scorecard, organigrama sin ciclos, VTO, responsables eliminados |
| HU-09 Datos | 7 | Exportación sin contraseñas, importación saneada de una exportación del navegador, ida y vuelta idéntica, reinicio |
| HU-10 Interfaz y seguridad | 8 | Sirve la interfaz, no expone `.env` ni el código, cabeceras, CORS, catálogo, inyección SQL, cuerpos enormes |
| HU-11 Estado y seguridad básica | 6 | Cambio obligatorio de contraseña, `/api/estado` filtrado por visibilidad, identificadores del cliente, purga de sesiones, rol sin privilegios |
| HU-12 Registro e invitaciones | 11 | Cuenta propia como director con auto-login, validaciones, registro cerrado, `REGISTRO_ROL` (nunca admin), códigos solo del líder y nunca con rol de líder, mismos datos que el líder sin sus permisos, observador solo ve, caducidad y bloqueo, cascada, y la cadena completa registro → proyecto → dos compañeros → datos guardados en la base |

Última ejecución: **108 de 108 superadas** en unos 37 s, sobre PostgreSQL 18. Las pruebas se ejecutan con la cuenta
`pmbok8_app`, así que también comprueban que sus permisos bastan.

### En el navegador

`npm run test:e2e` usa el **Microsoft Edge instalado** (no descarga navegadores), arranca su
propia API en el puerto 3100 con la base `pmbok8_e2e` y maneja la aplicación como una persona:

| Historia | Qué comprueba |
|---|---|
| E2E-01 Servidor (8 pruebas) | Cambio obligatorio de contraseña; crear proyecto, completar 2.1.1 y redactar el acta, **recargar y encontrarlo todo**; tablero del sprint y burndown; riesgos, interesados y valor ganado; subir y descargar un archivo; un rechazo del servidor se avisa y se revierte; cuenta creada desde Administración que ve solo lo permitido; cerrar sesión |
| E2E-02 Migración | Lo guardado en el navegador (base e IndexedDB) pasa al servidor con **Llevar al servidor**, archivo incluido |
| E2E-03 Modo local | Abierta con doble clic funciona sin ninguna llamada a la API y guarda en `localStorage` |
| E2E-04 Registro y equipo (2 pruebas) | Compañeros y líder crean su cuenta; la líder crea el proyecto y los añade por correo; una compañera vuelve a entrar, guarda el acta y tras recargar la líder la lee; el observador solo ve; un cuarto entra con código. Lo mismo en modo local, sin API |

Última ejecución: **14 de 14 superadas** en algo más de 1 minuto.

---

## Bajo carga

`npm run estres` simula un aula entera trabajando a la vez. Necesita su propio servidor, que se
levanta aparte y usa la base `pmbok8_estres` en el puerto 3200, así que **no toca `pmbok8` ni el
servidor de trabajo**:

```bat
npm run estres:servidor          :: en una consola: recrea pmbok8_estres y escucha en :3200
npm run estres                   :: en otra: 50 usuarios · 20 iteraciones · 5 equipos
npm run estres -- --usuarios=100 --iteraciones=25 --equipos=6
npm run estres -- https://pmbok-production.up.railway.app --usuarios=30
```

El guion recorre cinco fases con las mismas rutas que usa la interfaz: registro simultáneo,
entrada simultánea, montaje de equipos por código de invitación, sesiones de trabajo en paralelo
(dos lecturas por cada escritura) y una **tormenta** en la que todo un equipo crea tareas del
mismo sprint mientras su líder abre otro y fotografía el burndown. Durante las fases críticas una
sonda pide `/api/salud` cada 50 ms: es la consulta más barata que hay, así que lo que tarde de
más mide lo que el servidor tiene atascado.

Al terminar informa de los tiempos por ruta (p50, p95, p99 y máximo), del reparto de códigos de
estado y del cuerpo de cada error. Devuelve código de salida 1 si alguna petición falló.

### Lo que encontró y se corrigió

| Síntoma | Causa | Corrección |
|---|---|---|
| 500 `ERROR_INTERNO` al crear tareas y sprints a la vez, siempre a ~1 s (el `deadlock_timeout` de PostgreSQL) | Interbloqueo: crear una tarea bloqueaba `sprint_burndown` y después `sprints`; cerrar un sprint lo hacía al revés | `registrarBurndown` toma siempre primero la fila de `sprints`, y con `FOR NO KEY UPDATE`, que no choca con el candado que la clave foránea de `tareas` pone sobre el sprint (`servicios/trabajo.js`) |
| `/api/salud` pasaba de 16 ms a **2790 ms** mientras la clase entraba; la API no atendía nada más | `bcryptjs` es JavaScript puro y su API «asíncrona» **no cede el turno**: 50 contraseñas dejan el hilo de Node parado 2,8 s con el resto de núcleos ociosos | Las contraseñas se cifran en unos pocos hilos aparte (`servicios/clave.js`), con el mismo formato de hash: las cuentas ya creadas siguen valiendo |
| `/api/estado` era la lectura más lenta con diferencia | Pedía una conexión distinta al pozo para cada una de sus ~20 consultas, así que con mucha gente dentro hacía cola veinte veces | La fotografía entera se hace con una sola conexión, dentro de `BEGIN READ ONLY` (`servicios/estado.js`) |
| Un servidor de meses acumulaba memoria | Los mapas de intentos de acceso y de altas solo borraban una entrada al volver a verla | Barrido de las caducadas cada diez minutos, con tope de entradas (`servicios/sesiones.js`) |
| Una petición se quedaba colgada para siempre si el pozo se llenaba | El valor de fábrica de `connectionTimeoutMillis` es esperar sin límite | `PGPOOL_MAX` 16, espera máxima de 15 s y `statement_timeout` de 30 s; al agotarse responde 503 `SATURADO` en vez de colgarse (`config.js`, `errores.js`) |

Además, `db.transaccion` repite hasta tres veces la transacción que PostgreSQL deshaga por un
choque con otra (`40P01` interbloqueo, `40001` serialización), con una espera corta y desigual, y
deja constancia en el registro. Es una red de seguridad, no la corrección: el orden de bloqueo
ya evita el choque. Si ni con eso sale, el cliente recibe un 409 `CONCURRENCIA` con un mensaje
legible en vez de un 500.

### Cifras

Medido en este equipo (12 núcleos, PostgreSQL 17.11 en la misma máquina), antes y después:

| | 50 usuarios · antes | 50 usuarios · después | 100 usuarios · después |
|---|---|---|---|
| Peticiones con error | 3 (interbloqueo) | **0** | **0** |
| `/api/salud` durante el acceso | 2790 ms | **11 ms** | **16 ms** |
| `POST /auth/entrar` (p50) | 2835 ms | 458 ms | 816 ms |
| `GET /api/estado` (p50) | 277 ms | 114 ms | 152 ms |
| Rendimiento | 262 pet/s | **526 pet/s** | **576 pet/s** |

El acceso sigue siendo lo más caro de todo, y así debe ser: bcrypt con coste 10 tarda a propósito
unos 60 ms por contraseña. Lo que cambió es que ahora ese tiempo no lo paga el resto de la
aplicación. `CLAVE_HILOS` decide cuántos hilos se reparten ese trabajo.

---

## Pendiente

Lo que quedó fuera de esta fase, por decisión:

- **Copias automáticas** de la base: hoy son manuales (sección anterior).
- **Acceso desde otros equipos:** el servidor solo escucha en este equipo; abrirlo a la red
  requiere `HOST`, una regla de firewall y, en lo posible, HTTPS.
- **PostgreSQL como servicio de Windows:** necesita permisos de administrador; hoy arranca con un
  script al iniciar sesión.
- **Mejoras funcionales:**
  - el rol «ejecutor» ve todo el proyecto, no solo sus tareas;
  - no hay control de ediciones simultáneas: gana la última;
  - los cambios de otros usuarios no se refrescan solos: se ven al recargar;
  - las versiones de un documento no guardan su contenido anterior;
  - no hay recuperación de contraseña propia (la restablece un administrador);
  - la interfaz aún no muestra los comentarios que la API ya admite.
- **Credenciales en OneDrive:** `backend/.env` está dentro de una carpeta sincronizada.
