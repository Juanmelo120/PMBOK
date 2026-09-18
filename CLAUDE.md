# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es

Gestor PMBOK® 8: aplicación web para dirigir proyectos con la Guía del PMBOK, 8.ª edición (40 procesos, documentos, portafolios, valor ganado, trabajo ágil, capa EOS y verificación de la calidad del plan). Todo está **en español**: identificadores, comentarios, textos de la interfaz, mensajes de commit y nombres de las pruebas. Sigue escribiendo en español al editar código o documentación.

La misma interfaz funciona de dos maneras y detecta sola cuál usar al arrancar:
- **Local**: `index.html` abierto desde el disco (`file://`). Los datos van a `localStorage` (`pmbok8.bd`) y el contenido de los archivos a IndexedDB. Sin compilación y sin servidor.
- **Servidor**: servida por `backend/` en `http://localhost:3000`, con los datos en PostgreSQL 17.

Las dos tienen que seguir funcionando. `backend/tests/e2e/03-local.spec.js` comprueba que el modo local no hace ninguna llamada a la API.

## Comandos

No hay compilación, empaquetador ni linter: la interfaz es JS plano del navegador. Todos los comandos se ejecutan desde `backend/` (Windows):

```bat
iniciar.cmd                 :: arranca PostgreSQL, instala dependencias si faltan y levanta la API (vale con doble clic)
npm run bd:iniciar          :: solo PostgreSQL (bd:detener, bd:estado) — scripts\postgres.cmd; PGROOT por defecto %USERPROFILE%\pgsql
npm start                   :: API + interfaz en :3000 (al arrancar migra y siembra el catálogo y el administrador)
npm run dev                 :: igual, con node --watch
npm test                    :: pruebas de aceptación de la API (node:test), base pmbok8_test, en serie
npm run test:e2e            :: Playwright con el Edge instalado (channel msedge), API propia en :3100, base pmbok8_e2e
npm run humo -- <URL>        :: prueba de humo contra un servidor en marcha (registro, equipo, datos guardados); --limpiar al final
npm run estres:servidor      :: servidor de carga aparte: base pmbok8_estres en :3200
npm run estres               :: prueba de carga (50 usuarios); --usuarios= --iteraciones= --equipos= o una URL
npm run db:migrar           :: aplica las migraciones pendientes
npm run db:reiniciar        :: BORRA pmbok8 y la crea de cero
```

Una sola prueba:
```bat
node --test --test-reporter=spec tests/aceptacion/03-proyectos.test.js
node --test --test-name-pattern="texto del criterio" tests/aceptacion/03-proyectos.test.js
npx playwright test tests/e2e/01-servidor.spec.js
npx playwright test -g "texto de la prueba"
```

PostgreSQL tiene que estar en marcha para las dos baterías. Las pruebas nunca tocan la base de trabajo `pmbok8`: `tests/ayuda.js` recrea `pmbok8_test` en cada archivo y levanta la aplicación real en un puerto libre. La configuración está en `backend/.env` (ver `.env.example`). Con `PGADMIN_*` se crea la base y el rol y se aplican las migraciones; la API trabaja con el rol de permisos mínimos `pmbok8_app`, así que las pruebas también comprueban que sus permisos bastan.

## Arquitectura

### Interfaz (`index.html` + `assets/js/`)
- Sin módulos. Cada archivo es una IIFE que cuelga un global de `window` (`PMBOK`, `Api`, `Remoto`, `Gestor`, `Archivos`, `Calidad`, `Vistas`, `VistasGestor`, `VistasObra`…). **El orden de carga de `index.html` importa**: primero los datos, luego las utilidades, después `api.js` → `remoto.js` → `gestor.js`, luego las vistas y al final `app.js`. Un archivo nuevo necesita su `<script>` en el sitio correcto.
- Nada de módulos ES ni empaquetador: el modo local abre `index.html` con `file://`, donde los módulos ES fallan por CORS. Por eso el patrón es IIFE + global.
- Las pantallas grandes se reparten en subcarpetas, y el archivo que conserva el nombre del global compone las piezas y ofrece el contrato que usa `app.js`:
  - `obra/` → las pestañas de un proyecto (`ObraFlujo`, `ObraDocumentos`, `ObraTrabajo`, `ObraDominios`, `ObraControl`, `ObraEquipo`); las reúne `vistas-obra.js`.
  - `gestion/` → las pantallas de gestión (`GestionAcceso`, `GestionPanel`, `GestionPortafolios`, `GestionAgenda`, `GestionEos`, `GestionAdmin`, `GestionAprender`); las reúne `vistas-gestor.js`, que además conecta los botones `data-g`.
  - `calidad/` → la calidad del plan (`CalidadPiezas`, `CalidadPanel`, `CalidadSeccion`, `CalidadInforme`); las reúne `vistas-proyecto.js`, que conecta los botones `data-pa`.
  Cada subcarpeta se carga **antes** del archivo que la compone.
- La interacción se declara en tablas: `var ACCIONES = { 'crear-riesgo': crearRiesgo, … }` asocia el atributo `data-o` / `data-g` / `data-pa` de cada botón con una función con nombre. Para añadir un botón: su entrada en la tabla y su función, nada de alargar un `switch`.
- `app.js` es el enrutador por hash (`#/panel`, `#/proyectos/<id>/<pestaña>`, `#/proceso/<id>`…). Asocia cada ruta a una función de vista que devuelve HTML y después conecta la interacción. Aquí se resuelven las redirecciones de sesión y del cambio obligatorio de contraseña.
- `gestor.js` es la única capa de datos, con una **interfaz síncrona para las vistas en los dos modos**. No se divide en archivos: sus secciones comparten el estado en memoria y las primitivas privadas de sincronización (`crearLocal`, `actualizarLocal`, `adoptar`, `errorRemoto`), que separarlas obligaría a hacer públicas. En modo servidor carga `GET /api/estado` en memoria (con la misma forma que la base local), aplica cada cambio al instante sobre esa copia y pasa la petición a `remoto.js`. Ese módulo envía las peticiones una tras otra y en orden, agrupa las ediciones seguidas de una misma clave y, si algo falla, avisa y recarga el estado real. Toda operación nueva de `Gestor` necesita su rama local y su `Remoto.enviar` correspondiente.
- Los identificadores los genera el navegador (para pintar sin esperar y poder «Deshacer»). La API los acepta (`[A-Za-z0-9_.:-]`, hasta 100 caracteres) y responde 409 si ya existen.
- Nunca `alert`/`confirm`/`prompt`: se usa `dialogos.js` (diálogos propios, avisos y deshacer). Los gráficos son SVG hechos a mano en `graficos.js`, sin bibliotecas. Los iconos van incrustados en `iconos.js` para funcionar sin conexión.
- `respaldo-interfaz-anterior/` es una copia de la interfaz anterior. No la carga nada: no se edita.

### Contenido (`assets/js/datos/`): única fuente de verdad
Todo el contenido de la guía (procesos con su ITTO, bandas del flujo, plantillas de artefactos, herramientas, dominios, principios, EOS y las 10 secciones de calidad con sus reglas) vive en archivos de datos que rellenan `window.PMBOK`. El backend, en `src/catalogo.js`, ejecuta esos mismos archivos en un contexto `vm` al arrancar y sincroniza `catalogo_procesos` / `catalogo_artefactos`, que sirven de claves foráneas. Cambiar el contenido no requiere tocar la lógica, y el backend lo recoge al reiniciarse. Tipos de bloque de plantilla: `texto`, `campo`, `lista`, `tabla`. Los tipos de regla de calidad y las verificaciones de coherencia entre secciones están implementados en `calidad.js` y se referencian por nombre desde `secciones-proyecto.js`.

### Backend (`backend/`, Node ≥20, Express 5, CommonJS)
- `src/servidor.js` migra, siembra y escucha solo en `127.0.0.1`/`::1`. `src/app.js` monta `/api` y además sirve `index.html` y `/assets` desde la raíz del repositorio.
- `src/definiciones.js` declara cada recurso: tabla, campos (camelCase ⇄ snake_case) y esquemas zod (`crear` / `actualizar`). `src/repositorio.js` es el CRUD genérico. `src/rutas/recursos.js` tiene fábricas (`recursoDeProyecto`, `recursoGlobal`) que generan las rutas estándar de los registros de un proyecto (miembros, riesgos, tareas, sprints…) y de la organización (portafolios, rocas, métricas…). Las operaciones compuestas están en `src/servicios/`.
- Permisos: nivel efectivo por proyecto de 0 a 3 (sin acceso/ver/editar/dirigir), calculado en SQL con `nivel_en()` y exigido en `middleware/auth.js`. Con nivel 0 se responde **404**, no 403. Un usuario con `debeCambiarClave` recibe `403 CLAVE_PENDIENTE` en todo salvo `/auth/yo`, `/auth/clave` y `/auth/salir`. El nivel de un miembro sale de su rol (líder 3, observador 1, resto 2): la regla está duplicada en `nivel_en()` (migración 003) y en `nivelDeRol()` de `gestor.js`, y deben coincidir.
- Registro propio e invitaciones: `POST /api/auth/registrar` crea cuentas con el rol de `REGISTRO_ROL` (por defecto `director`, nunca `admin`) y sin proyectos (`REGISTRO_ABIERTO`). El líder añade compañeros por correo en Equipo. El líder (nivel 3) genera códigos en `invitaciones` (nunca con rol `lider`) y cualquier sesión se une con `POST /api/invitaciones/unirse`. Los códigos solo llegan en `/api/estado` para proyectos con nivel 3 y el servidor no los exporta ni importa (en modo local sí van en la base del navegador).
- `src/servicios/estado.js` construye la fotografía por usuario que carga la interfaz. Su forma tiene que ser idéntica a la base del navegador, porque de ello dependen la exportación e importación (`servicios/datos.js`, formato `pmbok8-gestor`) y «Llevar al servidor».
- Migraciones: `db/migraciones/NNN_nombre.sql`. Cada una se aplica una sola vez, en orden alfabético, dentro de una transacción, y queda anotada en `schema_migraciones`. Muchas reglas las garantiza la propia base (CHECK, un solo sprint activo por proyecto, clave foránea compuesta tarea→sprint del mismo proyecto, cascadas, disparadores que limpian permisos).
- Los errores son JSON `{ error, codigo, detalles }` (`src/errores.js`). Las fechas-hora van en milisegundos y las fechas en `AAAA-MM-DD`.
- **Concurrencia** (medido con `npm run estres`, ver «Bajo carga» en `backend/README.md`): las contraseñas se cifran en hilos aparte (`servicios/clave.js`) porque `bcryptjs` no cede el turno y dejaba la API parada casi tres segundos mientras una clase entera entraba. Todo lo que toque un sprint bloquea **primero** la fila de `sprints` y después la de `sprint_burndown`, y con `FOR NO KEY UPDATE`, que no choca con el candado de la clave foránea de `tareas`: invertir ese orden reproduce un interbloqueo. `db.transaccion` repite hasta tres veces lo que PostgreSQL deshaga por un choque (`40P01`, `40001`) y lo anota en el registro.

Añadir una colección persistente nueva suele tocar: una migración, `definiciones.js`, una ruta (a menudo con una fábrica de `recursos.js`), `servicios/estado.js`, la exportación e importación en `servicios/datos.js`, `COLECCIONES` y las llamadas remotas en `assets/js/gestor.js`, y una prueba de aceptación.

### Pruebas
- `tests/aceptacion/NN-*.test.js`: una historia de usuario por archivo (HU-01…HU-11) y un criterio de aceptación por prueba, por HTTP real.
- `tests/e2e/*.spec.js`: manejan la interfaz en Edge contra `tests/e2e/servidor-e2e.js`. Las ayudas están en `ayuda-e2e.js`.

## Notas
- `.agents/skills/` contiene skills de diseño de interfaz de terceros (registradas en `skills-lock.json`). No son código de la aplicación.
- Los datos de PostgreSQL deben quedar fuera de OneDrive: la sincronización corrompe un clúster vivo.
- Restricción legal: la estructura sigue el índice público del PMBOK 8, pero todos los textos explicativos son propios. No copies texto del PMI en los archivos de datos.
