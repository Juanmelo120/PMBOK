# Gestor PMBOK® 8

Aplicación web local para **dirigir proyectos aplicando la Guía del PMBOK 8.ª edición**
mientras se aprende: los 40 procesos guiados uno a uno, los documentos que cada uno produce,
portafolios, equipos, valor ganado y verificación de la calidad del plan.

Funciona de dos maneras, con la misma interfaz:

| Modo | Cómo se abre | Dónde se guarda |
|---|---|---|
| **Servidor** | `backend\iniciar.cmd` y después `http://localhost:3000` | PostgreSQL, con cuentas seguras y varios usuarios |
| **Local** | Doble clic sobre `index.html` | En el navegador; sin instalación y sin conexión |

La aplicación detecta sola en qué modo está: si la sirve el backend, trabaja contra su API;
abierta desde el disco, se comporta como siempre. El backend está en [`backend/`](backend/README.md).

> ### Aviso importante
> Este software es una **herramienta educativa independiente**.
> La **estructura** (6 principios, 7 dominios de desempeño, 5 áreas de enfoque, 40 procesos,
> 155 herramientas y 42 artefactos) reproduce el índice público de la 8.ª edición, publicada por
> el PMI el 14 de noviembre de 2025.
> Los **textos explicativos, plantillas, ejemplos y consejos son elaboración propia**:
> no son texto del PMI y no sustituyen a la guía oficial.
> PMBOK y PMI son marcas registradas del Project Management Institute, Inc.

---

## Cómo se usa

**Con servidor (recomendado):** doble clic en `backend\iniciar.cmd` (arranca PostgreSQL y la API)
y abre `http://localhost:3000`. **Sin servidor:** abre `index.html` en cualquier navegador moderno.
La cuenta inicial es:

```
admin@pmbok.local · admin123
```

La pantalla de acceso la muestra y trae un botón para entrar directamente. En modo servidor, la
primera vez obliga a elegir una contraseña propia, igual que a cualquier cuenta creada por un
administrador.

### En un aula: cada alumno con su cuenta

1. Cada alumno pulsa **Crear cuenta** en la pantalla de acceso y entra directo al Panel.
2. Quien lidera el grupo pulsa **Nuevo proyecto** (las cuentas registradas nacen como *director*).
3. En **Equipo**, el líder escribe el correo de cada compañero en **Añadir compañero por correo**, o
   genera un **código** (por ejemplo `KZL2-9FAD`) que ellos escriben en **Panel → Unirme con un código**.
4. Cada compañero entra con su correo y contraseña y ya ve el proyecto.

Todos ven los mismos datos del proyecto. Según su rol en el equipo, el **líder** dirige (configuración,
metodología, equipo, roles, códigos, borrar), el **observador** solo ve y el resto edita el trabajo.
En `backend/.env`: `REGISTRO_ABIERTO=false` cierra el registro y `REGISTRO_ROL=miembro` hace que solo
cree proyectos quien reciba el rol director de un administrador. Para publicarlo en internet, ver
[`backend/DESPLIEGUE.md`](backend/DESPLIEGUE.md).

Si prefieres servirlo en red local:

```bash
python -m http.server 8000
# después: http://localhost:8000
```

Servirlo por HTTP habilita además el repositorio de archivos con IndexedDB, que algunos
navegadores restringen cuando la página se abre desde el disco.

Ese servidor de Python no incluye la API, así que la aplicación sigue en modo local.
Detalles del backend, su API y sus pruebas en [`backend/README.md`](backend/README.md).

---

## Las dos capas

| Capa | Qué hace | Dónde |
|---|---|---|
| **Gestión** | Dirigir proyectos reales con la metodología | Panel, Portafolios, Agenda, EOS, Administración |
| **Aprender** | Consultar la guía que la gestión aplica | Procesos, dominios, principios, herramientas y artefactos |

La gestión es lo principal: al entrar se abre el **Panel**, no una portada. Aprender queda como
material de consulta y cada ficha de estudio enlaza al mismo proceso dentro de tus proyectos.

## Moverse por la aplicación

- **`Ctrl` + `K` busca y actúa**: proyectos, los 40 procesos del proyecto abierto con su estado,
  procesos, dominios, principios, herramientas y artefactos de la guía, y acciones como
  *Nuevo proyecto* o *Cambiar tema*.
- **Menú lateral filtrable**. Dentro de un proyecto muestra su nombre, su avance y sus pestañas.
- **Siguiente paso**. El panel y la cabecera de cada proyecto indican el próximo proceso
  pendiente, qué documento produce y un botón para abrirlo. Nadie tiene que adivinar por dónde seguir.
- **Diálogos propios y deshacer**. Ningún `alert`, `confirm` o `prompt` del navegador. Los
  borrados pequeños (una tarea, un riesgo, un interesado, una lección, una medición) se hacen al instante y ofrecen *Deshacer*
  durante unos segundos. Solo lo irreversible pide confirmación.
- **Accesible**: foco visible con teclado, estados que se nombran con palabra además de color,
  y animaciones cortas que se desactivan con *reducir movimiento* del sistema.

## Capa de gestión

### Panel

Proyectos visibles, proyectos activos, procesos completados, documentos generados y portafolios,
con el siguiente paso de cada proyecto en curso. Desde aquí se crea un proyecto: nombre,
descripción, **metodología**, portafolio, roca de gerencia, fechas y presupuesto (BAC). Al
crearlo, un aviso lleva directamente al primer proceso (2.1.1).

### Metodologías y adaptación

Cuatro enfoques, y cada uno **reordena el flujo y ajusta los procesos**:

| Enfoque | Adaptación |
|---|---|
| 🏔️ **Predictivo (cascada)** | Líneas base congeladas, fases secuenciales, valor ganado y ruta crítica |
| 🏃 **Ágil (Scrum)** | Sprints, backlog como línea base del alcance, 14 procesos marcados como iterativos |
| 🔀 **Híbrido** | Planificación predictiva de lo fijado, iteraciones en lo inestable |
| 🌊 **Kanban** | Flujo continuo, límite de trabajo en curso, lead time en lugar de velocidad |

### El espacio de trabajo de un proyecto

Nueve pestañas:

1. **Flujo de procesos** — los 40 procesos repartidos en las cinco bandas del ciclo de vida
   (Inicio 2 · Planificación 19 · Ejecución 8 · Monitoreo y Control 10 · Cierre 1).
   Cada tarjeta muestra su código, dominio, estado e indicador de iterativo, y **se arrastra
   entre bandas** para adaptar la secuencia al proyecto.
2. **Documentos** — los generados por los procesos, con categoría, versión, estado
   (borrador → revisión → aprobado) y porcentaje de completitud. Editor con la plantilla del
   artefacto: campos, listas y tablas editables, guardado en vivo y descarga en Markdown.
3. **Archivos** — repositorio de evidencias con arrastrar y soltar, categorías, apertura y descarga.
4. **Calendario** — inicios y fines, límites de tareas, sprints, hitos y cortes de valor ganado.
5. **Trabajo** — en ágil: sprint activo, roles Scrum, Definition of Done, tablero, backlog,
   ceremonias y métricas: **burndown diario** (se registra un punto cada día que el equipo mueve
   trabajo, frente a la línea ideal) y **velocidad por sprint** con su media. En predictivo o
   kanban: tablero de flujo con límite de WIP.
6. **Dominios** — riesgos con **matriz probabilidad × impacto arrastrable**, interesados con
   matriz poder·influencia, control de cambios y lecciones aprendidas.
7. **Control (EVM)** — registro de PV, EV y AC por fecha; cálculo de CV, SV, CPI, SPI, EAC, ETC,
   VAC y TCPI. CPI, SPI, EAC y TCPI se muestran como fichas con su estado en palabras
   (*En rango*, *Vigilar*, *Actuar*) y un gráfico de líneas PV · EV · AC a lo largo del tiempo.
8. **Equipo** — miembros y sus roles (líder dirige, observador solo ve, el resto edita), **códigos de
   invitación** para que el grupo entre al proyecto, configuración, cambio de metodología y fases.
9. **Calidad del plan** — la verificación descrita más abajo.

### La ficha de cada proceso

Se abre desde el flujo, desde *Siguiente paso* o desde `Ctrl` + `K`.
Objetivo, estado (pendiente · en curso · completado · omitido por adaptación), **entradas**
con su disponibilidad —y el botón para generarlas si faltan—, **herramientas y técnicas**
agrupadas por familia, **salidas** que generan el documento con su plantilla, consejo del mentor,
ejemplo práctico, errores frecuentes y notas del equipo.

### Portafolios, agenda y administración

- **Portafolios y programas**: cartera jerárquica; un proyecto cambia de portafolio desde su fila.
- **Agenda**: calendario global de todos los proyectos visibles.
- **Administración**: cuentas (las registradas por sus dueños se marcan «se registró solo»), roles (administrador, director, miembro, ejecutor) y **permisos por
  portafolio, programa o proyecto** con tres niveles (ver, editar, dirigir). Los permisos se suman
  y gana el más alto. Exportación e importación de toda la base.
- **Notas de los proyectos** (solo administradores): cada proyecto calificado de **1.0 a 5.0** según
  el avance de su flujo —`nota = 1.0 + (avance ÷ 100) × 4.0`, se aprueba desde 3.0—, con el promedio
  del curso y el borrado de los proyectos de prueba (pide escribir `ELIMINAR`). Los procesos omitidos
  no cuentan en contra: salen del denominador.
- **Supervisión de rocas** (solo administradores): el avance de cada roca con el desglose que lo
  justifica, sus integrantes con el papel de cada uno y lo que lleva hecho, y al abrir una roca la
  bitácora completa de sus proyectos —tareas, documentos, archivos, sprints, procesos, riesgos,
  cambios, lecciones y comentarios— de lo más reciente a lo más antiguo.

### EOS — gerencia general

La capa directiva sobre los proyectos, según el sistema de Gino Wickman:

- **Rocas del trimestre** con metas medibles, responsable y estado; los proyectos se vinculan a ellas.
- **Scorecard semanal**: de 5 a 15 métricas de la operación en 13 semanas, en verde o rojo según su meta.
- **VTO**: las ocho preguntas de visión y tracción.
- **Organigrama** por asientos: primero la estructura, después las personas.

---

## Verificación de la calidad del plan

Es lo que ninguna plantilla hace por sí sola. Dentro de cada proyecto, la pestaña **Calidad del plan**
recorre **diez secciones** con **52 campos** guiados y comprueba lo que escribes:

| # | Sección | Dominio |
|---|---|---|
| 1 | Encuadre y acta de constitución | Gobernanza · Inicio |
| 2 | Gobernanza, integración y cambios | Gobernanza |
| 3 | Alcance y requisitos | Alcance |
| 4 | Cronograma | Cronograma |
| 5 | Finanzas y presupuesto | Finanzas |
| 6 | Interesados y comunicaciones | Interesados |
| 7 | Recursos y equipo | Recursos |
| 8 | Riesgos e incertidumbre | Riesgos |
| 9 | Verificación de los seis principios | — |
| 10 | Cierre y realización de beneficios | Gobernanza · Cierre |

**Por campo** se verifica extensión, datos numéricos, fechas, importes con moneda, estructura
tabular, vocabulario esperado (¿se nombra al patrocinador?, ¿aparece la estrategia de respuesta
al riesgo?), formulación SMART de los objetivos y **precisión del lenguaje**: se detectan
«lo antes posible», «adecuado», «mejorar» y cuarenta expresiones más que impiden saber si algo
se cumplió.

**Entre secciones** se comprueban 15 coherencias, que es donde suele fallar un plan: que los
entregables aparezcan en el cronograma y tengan responsable en la RACI, que partidas más reservas
cuadren con el presupuesto, que los riesgos con P×I ≥ 12 tengan respuesta y dueño, que los
interesados registrados reciban alguna comunicación, que los hitos caigan dentro del calendario
y que los beneficios se midan con las métricas prometidas en el caso de negocio.

El puntaje pondera **contenido (78 %)** y **coherencia (22 %)**. Se puede **subir un documento**
—`.docx`, `.txt`, `.md`, `.csv`— y la aplicación propone, para cada campo, el fragmento del
documento que le corresponde: extractos literales, nunca texto generado. El `.docx` se abre sin
bibliotecas externas, descomprimiéndolo con la API `DecompressionStream` del propio navegador;
las tablas de Word se convierten en columnas separadas por `|`.

El informe completo da puntaje por sección, las 15 verificaciones con su evidencia, las
observaciones por severidad, la evolución del puntaje y el plan redactado, descargable en Markdown
e imprimible en PDF.

---

## Gráficos

Los tres gráficos (valor ganado, burndown y velocidad) están hechos a mano en SVG, sin bibliotecas:

- **Un solo eje Y** por gráfico, con marcas redondas y enteras.
- Colores **validados para daltonismo** y contraste, con una variante propia para el tema oscuro.
- Leyenda con la clave de línea (continua o discontinua) y **etiqueta directa** al final de cada serie.
- **Cruceta** que busca la fecha más cercana y lista todas las series en ese punto; con el
  teclado se recorre con las flechas.
- Cada gráfico trae **su tabla de datos**: nada depende de pasar el ratón por encima.
- Se dibujan **al ancho real de la pantalla**, así el texto mide lo mismo en escritorio y en móvil.

---

## Capa de aprender

Material de consulta en `#/aprender`, pensado para resolver dudas mientras se trabaja:

- **Catálogo de los 40 procesos** con su ITTO, ejemplo aplicado, errores frecuentes y el consejo
  del mentor. Cada ficha enlaza a aplicar ese proceso en tus proyectos activos.
- **7 dominios de desempeño** y **6 principios**.
- **155 herramientas y técnicas** y **42 artefactos**, filtrables.

### Qué se quitó y por qué

La aplicación de referencia (pmbok8.bogota.ai) es un gestor de proyectos, no un libro. Para
parecerse a ella y no dispersar la atención se retiraron las piezas de estudio que no ayudaban a
dirigir un proyecto:

| Retirado | Motivo |
|---|---|
| Portada de inicio | Al entrar se va directo al Panel |
| Capítulos de las dos partes y apéndices | Texto de lectura larga, sin acción asociada |
| Glosario | Los términos ya se explican donde se usan |
| Autoevaluación (50 preguntas) | Orientada a examen, no a gestionar |
| Asistente de consultas BM25 | Su función la cubre `Ctrl` + `K` |
| Cuaderno de estudio y progreso de lectura | Las notas viven en cada proceso del proyecto |
| Mapa de la guía y matriz 7 × 5 | Duplicaban el flujo de procesos del proyecto |

---

## Dónde viven los datos

Todo en el navegador:

- `localStorage` para la base del gestor y el tema visual.
- `IndexedDB` para el contenido de los archivos subidos, con respaldo en `localStorage`
  (máximo 600 KB por archivo) cuando IndexedDB no está disponible.

No hay servidor ni telemetría. El control de acceso **separa espacios de trabajo entre compañeros;
no protege secretos**: cualquiera con acceso al equipo puede leer el almacenamiento del navegador.

Para conservar el trabajo o llevarlo a otro equipo: **Exportar datos** en Administración
(la base completa, sin contraseñas) o **Exportar plan e informe** dentro de cada proyecto.

Lo anterior describe el **modo local**.

### En modo servidor

Todo se guarda en **PostgreSQL 17** (base `pmbok8`): 28 tablas con claves foráneas, restricciones y
cascadas, contraseñas con bcrypt, sesiones revocables y los archivos dentro de la base. Al entrar, la
interfaz carga lo que el usuario puede ver; cada cambio se ve al instante y se envía al servidor en
orden (en la cabecera aparece «Guardando…»). Si el servidor rechaza algo, se avisa y la pantalla
vuelve al estado real. La base del navegador no se toca.

Para dar el salto sin perder nada: entra como administrador en `http://localhost:3000`, abre
**Administración** y pulsa **Llevar al servidor**. Se importan los datos del modo local y se suben sus
archivos. Ver [`backend/README.md`](backend/README.md).

---

## Estructura del proyecto

```
index.html                     Estructura de la página y orden de carga
assets/
  css/estilos.css              Hoja de estilos única (tokens, claro/oscuro, responsive, impresión)
  js/
    datos/                     CONTENIDO — es lo único que hay que tocar al llegar el libro
      meta.js                  Taxonomía: áreas de enfoque, dominios, navegación
      principios.js            Los 6 principios
      dominios.js              Los 7 dominios de desempeño
      procesos.js              Los 40 procesos con su ITTO
      artefactos.js            Los 42 documentos con su plantilla de bloques
      herramientas.js          Las 155 herramientas y técnicas, por familia
      flujo.js                 Bandas, orden, entradas/salidas y consejo de cada proceso
      eos.js                   VTO, rocas, scorecard y organigrama
      secciones-proyecto.js    Las 10 secciones de calidad, sus 52 campos y sus reglas
    almacenamiento.js          Preferencia de tema claro u oscuro
    api.js                     Cliente HTTP del backend y detección del modo servidor
    remoto.js                  Cola ordenada de escrituras hacia la API
    gestor.js                  Datos del gestor (local o servidor): usuarios, proyectos, documentos, EVM, burndown…
    archivos.js                Repositorio de evidencias (API o IndexedDB)
    indice.js                  Índice unificado de la guía para búsqueda y navegación
    render.js                  Construcción de HTML reutilizable
    ui.js                      Formularios, medidores y tablas editables
    iconos.js                  Iconos Phosphor (MIT) incrustados para funcionar sin conexión
    shape-grid.js              Rejilla animada de fondo de todas las vistas (ShapeGrid de React Bits, sin React)
    efectos.js                 Interacción: luz bajo el puntero, contadores, pestañas y rejilla
    dialogos.js                Diálogos propios, avisos y «Deshacer»
    buscador.js                Paleta Ctrl + K: buscar y actuar
    calidad.js                 Motor de verificación: reglas y coherencia entre secciones
    proyecto.js                Carga de documentos (.docx/.txt/.md) y extracción
    graficos.js                Gráficos SVG de líneas y barras, accesibles
    vistas-aprender.js         Fichas de consulta: procesos, dominios, principios
    vistas-proyecto.js         Pantallas de calidad del plan
    vistas-gestor.js           Panel, portafolios, agenda, EOS, administración, supervisión de rocas y notas
    vistas-obra.js             Espacio de trabajo del proyecto
    obra-acciones.js           Interacción del espacio de trabajo
    app.js                     Enrutador, navegación e identidad
backend/                       API REST + PostgreSQL (ver backend/README.md)
  iniciar.cmd                  Arranca PostgreSQL y la API con doble clic
  db/migraciones/              Esquema SQL versionado
  src/                         Servidor Express: rutas, servicios, validación y permisos
  tests/aceptacion/            11 historias de usuario, 97 criterios de aceptación (API)
  tests/e2e/                   Pruebas en navegador con Playwright y Edge
```

El backend lee el mismo `assets/js/datos/`: al sustituir el contenido por el oficial, la API lo
recoge al reiniciarse sin tocar su código.

## Cómo sustituir el contenido por el oficial

Toda la aplicación lee de `assets/js/datos/`. Para incorporar el libro real **no hay que tocar
ningún archivo de lógica**: basta con editar los objetos de datos manteniendo sus campos.

```js
// Un proceso, en procesos.js
{
  id: 'p-gob-01', cod: '2.1.1', nombre: 'Iniciar el Proyecto o Fase',
  dominio: 'gobernanza', area: 'inicio',
  proposito: '…', descripcion: ['párrafo 1', 'párrafo 2'],
  entradas: [], herramientas: [], salidas: [],
  ejemplo: { titulo, contexto, aplicacion, resultado }, errores: [], preguntas: []
}

// Su lugar en el flujo, en flujo.js
{ id: 'p-gob-01', banda: 'inicio', orden: 1,
  entradas: ['art-caso-negocio'], salidas: ['art-acta-proyecto'], consejo: '…' }

// Un artefacto y su plantilla, en artefactos.js
{ id: 'art-acta-proyecto', nombre: 'Acta de Constitución del Proyecto', categoria: 'gobernanza',
  descripcion: '…',
  plantilla: [ { t: 'campo', et: 'Propósito', ay: '…' },
               { t: 'tabla', et: 'Hitos', col: ['Hito', 'Fecha', 'Criterio'] } ] }
```

Tipos de bloque de plantilla: `texto` (una línea), `campo` (párrafo), `lista` (un elemento por
línea) y `tabla` (filas con columnas fijas).

Añadir un criterio de calidad a un campo es añadir un objeto a su lista `reglas` en
`secciones-proyecto.js`; los tipos disponibles (`minPalabras`, `minLineas`, `cifras`, `fechas`,
`dinero`, `porcentajes`, `incluye`, `evita`, `sinVaguedad`, `lineasCon`, `columnas`, `smart`)
están implementados en `calidad.js`, junto con los verificadores de coherencia (`solapeTexto`,
`sumaPartidas`, `riesgosAltos`, `fechasEnRango`, `conteoMinimo`, `contiene`, `noVacio`,
`ambosNoVacios`, `principiosCompletos`).

Los textos de procesos, dominios y principios aceptan en línea `**negrita**`, `*cursiva*` y
etiquetas HTML simples.

---

## Fuentes consultadas para la estructura

- PMI — *A Guide to the Project Management Body of Knowledge (PMBOK® Guide), Eighth Edition
  and The Standard for Project Management* (ficha del editor, ISBN 9781628258295).
- Índice y análisis públicos de la 8.ª edición: `diptishsahoo.com`, `milestonetask.com`,
  `mypreppilot.com`, `projectmanagement.com.br`, `brainbok.com`, `opmintegral.com`,
  `todopmp.com`, PMI Galicia Spain Chapter.
- Gino Wickman, *Traction*, para la capa EOS de gerencia.

PMBOK y PMI son marcas registradas del Project Management Institute, Inc.
Este proyecto no está afiliado ni respaldado por el PMI.
