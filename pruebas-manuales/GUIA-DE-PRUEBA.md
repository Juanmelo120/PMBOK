# Guía de prueba manual — Gestor PMBOK® 8

Con esta guía recorres la aplicación con datos de ejemplo ya cargados y compruebas, paso a paso,
que cada pantalla muestra lo que debe. Al lado de cada paso marca ✅ si se cumple o ❌ si no, y
anota qué viste.

**Datos de ejemplo:** [`datos-demo.json`](datos-demo.json). Se generaron con la API real y ya se
comprobaron en Edge: se importan sin errores y ninguna pantalla muestra fallos en la consola.

| Qué trae | Detalle |
|---|---|
| 3 proyectos | **Portal de autoservicio** (ágil) · **Adecuación del piso 4 de la sede Bogotá** (predictivo) · **Mesa de ayuda interna** (kanban) |
| 2 portafolios y 1 programa | Transformación digital (con el programa Canales digitales) · Infraestructura y sedes |
| 5 cuentas | Una por rol, para probar los permisos |
| EOS | 3 rocas en Q3-2026, 5 métricas con 13 semanas, organigrama de 4 asientos y VTO completo |

### Cuentas

| Correo | Contraseña | Rol | Qué debería ver |
|---|---|---|---|
| `admin@pmbok.local` | `admin123` | Administrador | Todo |
| `laura@demo.local` | `cambiar123` | Directora | Los 3 proyectos (dirige el Portal y la Mesa de ayuda) |
| `carlos@demo.local` | `cambiar123` | Miembro | Portal (edita) y Sede (**solo lectura**) |
| `ana@demo.local` | `cambiar123` | Ejecutora | Portal y Sede |
| `pedro@demo.local` | `cambiar123` | Miembro | **Ningún proyecto** |

> Las cifras esperadas de esta guía valen **justo después de importar**. Si cambias algo antes de
> llegar a un paso, la cifra cambiará con razón. Para volver al punto de partida, importa otra vez
> el archivo.

---

## 0. Preparación (modo local, sin servidor)

1. Abre la carpeta del proyecto y haz **doble clic en `index.html`** (Edge o Chrome).
   - Arriba debe verse la marca **«Modo local»**.
2. Pulsa el botón de **entrar directamente** (cuenta `admin@pmbok.local`).
   - Debe abrirse el **Panel**, no una portada.
3. Ve a **Administración** → **Importar datos** y elige `pruebas-manuales/datos-demo.json`.
   - Aparece el aviso **«Datos importados»**.

> Si ya tenías datos tuyos en este navegador, **antes** pulsa **Exportar datos** en Administración
> para guardarlos: la importación **reemplaza** todo lo guardado en el navegador.

---

## 1. Panel

Ve a **Panel**. Espera un par de segundos a que terminen de contar los números animados.

| # | Comprueba | Esperado |
|---|---|---|
| 1.1 | Proyectos activos | **3** |
| 1.2 | Procesos completados | **32** |
| 1.3 | Documentos generados | **6** |
| 1.4 | Portafolios | **2** |
| 1.5 | Tarjeta del Portal | **26 %**, «10/39 procesos», siguiente paso **2.2.4 Desarrollar la Estructura del Alcance**, etiqueta «Bajo vigilancia» |
| 1.6 | Tarjeta de la Sede | **53 %**, «21/40 procesos», siguiente paso **2.1.4 Dirigir la Ejecución del Proyecto**, etiqueta «Requiere acción» |
| 1.7 | Tarjeta de la Mesa de ayuda | **3 %**, «1/40 procesos», siguiente **2.5.1 Identificar a los Interesados** |

El Portal cuenta **39** procesos y no 40 porque uno (2.1.3) está **omitido por adaptación**.

---

## 2. Navegación y búsqueda

| # | Haz | Esperado |
|---|---|---|
| 2.1 | Pulsa `Ctrl` + `K` y escribe «riesgos» | Aparecen procesos y artefactos de riesgos |
| 2.2 | En esa paleta escribe «portal» y pulsa Enter | Se abre el proyecto Portal |
| 2.3 | Escribe «tema» en la paleta y elige *Cambiar tema* | La app pasa a oscuro/claro y todo se sigue leyendo bien |
| 2.4 | Escribe «facturación» en el filtro del menú lateral | El menú se filtra |
| 2.5 | Reduce la ventana al ancho de un móvil | Aparece el botón de menú; no hay desplazamiento horizontal |
| 2.6 | Recorre la pantalla solo con `Tab` | El foco se ve siempre |

---

## 3. Proyecto ágil: *Portal de autoservicio para clientes*

Abre el proyecto desde el Panel.

### 3.1 Cabecera
- Metodología **Ágil (Scrum)**, estado **activo**, directora **Laura Gómez**, **BAC 180.000.000 COP**.
- Anillo con **26 %** y «10 de 39 procesos completados».
- Banda «En curso» **2.2.4** con botón **Continuar**.

### 3.2 Flujo de procesos
| # | Comprueba | Esperado |
|---|---|---|
| a | Las cinco bandas | Inicio 2 · Planificación 19 · Ejecución 8 · Monitoreo y Control 10 · Cierre 1 |
| b | 2.1.1 y 2.5.1 | Completados |
| c | 2.2.4, 2.7.3 y 2.1.4 | En curso |
| d | 2.1.3 | Omitido por adaptación |
| e | **Arrastra** una tarjeta a otra banda | Se mueve y se mantiene al recargar (`F5`) |

### 3.3 Ficha de un proceso
Abre **2.1.1 Iniciar el Proyecto o Fase**.
- Muestra objetivo, **entradas** (con su disponibilidad), **herramientas**, **salidas**, consejo, ejemplo y errores frecuentes.
- La salida **Acta de Constitución** ya existe; *Registro de supuestos* también.
- Escribe una nota del equipo, recarga la página y comprueba que sigue ahí.

### 3.4 Documentos
| # | Comprueba | Esperado |
|---|---|---|
| a | Lista | 3 documentos: Acta (**aprobado**), Registro de supuestos (borrador), Product backlog (**revisión**) |
| b | Abre el **Acta** | Propósito, objetivos, tabla de 3 hitos, presupuesto «180.000.000 COP», patrocinadora María Pérez |
| c | Edita un campo | Se guarda solo; recarga y sigue |
| d | Añade una fila a una tabla | Aparece y se guarda |
| e | **Descargar en Markdown** | Baja un `.md` con el contenido |

### 3.5 Archivos
- Arrastra cualquier PDF o imagen a la zona de subida → aparece en la lista.
- Ábrelo y descárgalo → es el mismo archivo.
- Bórralo → desaparece.

### 3.6 Calendario
- Deben verse los hitos (**10 jul**, **4 sept**, **30 oct**, **11 dic**), los sprints y los límites de tareas del **16, 17 y 18 de septiembre**.

### 3.7 Trabajo (Scrum)
| # | Comprueba | Esperado |
|---|---|---|
| a | Sprint activo | **Sprint 3 — Certificados**, comprometido **15 pts**, entregado **2 pts** |
| b | Roles Scrum | Product Owner: Administrador · Equipo: 4 personas |
| c | Definition of Done | 4 criterios |
| d | Tablero | Una tarjeta en cada columna: Por hacer · En curso · En revisión · Hecho |
| e | Product backlog | **4** elementos (Abrir solicitudes 8 pts, Encuesta 3, Descarga masiva 5, Recuperar contraseña 5) |
| f | **Arrastra** «Firma digital del PDF» a *Hecho* | «Entregado» sube a **7 pts** |
| g | Métricas → **Burndown** | Línea real bajando de 15 frente a la ideal |
| h | Métricas → **Velocidad** | Sprint 0 = 3 · Sprint 1 = 8 · Sprint 2 = 16 · media **9** |
| i | Añade una historia al backlog y pásala al sprint con «→ sprint» | Aparece en *Por hacer* |
| j | Borra una tarea con × | Sale el aviso con **Deshacer**; pulsa y vuelve |

### 3.8 Dominios
| # | Comprueba | Esperado |
|---|---|---|
| a | Riesgos | 4 (uno es una oportunidad) |
| b | Matriz P × I | «La API de facturación…» en la celda **4 × 4** |
| c | **Arrastra** un riesgo a otra celda | Cambian P e I |
| d | Interesados | 3; María Pérez arriba a la derecha (poder 5, influencia 5) |
| e | Cambios | 1 **pendiente**: «Añadir descarga masiva de facturas» |
| f | Lecciones | 1 |

### 3.9 Control (EVM)
- Una medición del **31 ago 2026**: PV 60 M, EV 55 M, AC 58 M.
- Registra otra con fecha de hoy y comprueba que la gráfica añade el punto.

### 3.10 Equipo
- 4 miembros: Laura (líder), Administrador (PO), Carlos (equipo), Ana (ejecutora).
- Cambia la metodología a **Kanban** y vuelve a **Ágil** → las fases se rehacen y el flujo vuelve a su orden original.

---

## 4. Proyecto predictivo: *Adecuación del piso 4 de la sede Bogotá*

### 4.1 Control (EVM): el punto más importante

| Ficha | Esperado | Estado |
|---|---|---|
| **CPI** | **0.87** | Actuar |
| **SPI** | **0.86** | Actuar |
| **EAC** | **480.558.140 COP** (frente a 420.000.000) | Actuar |
| **TCPI** | **1.18** | Actuar |

- La gráfica muestra PV, EV y AC del **31 may** al **31 ago**, con EV por debajo.
- Historial con 4 cortes; CV y SV en **rojo**.
- El **Informe de rendimiento** dice: «ha completado el **86 %** del trabajo…».

### 4.2 Resto de pestañas
| # | Pestaña | Esperado |
|---|---|---|
| a | Cabecera | Predictivo (Cascada), **53 %**, 21 de 40, BAC 420.000.000 COP |
| b | Flujo | Inicio y Planificación completos; 2.1.6 aparece **movido a Cierre** |
| c | Documentos | Acta (aprobado), Declaración del alcance (aprobado), Lista de hitos (revisión) |
| d | Trabajo | Tablero de flujo: «Tender cableado» y «Climatización» en curso, «Pintura y acabados» en revisión, «Demolición» hecha |
| e | Dominios | 3 riesgos (uno **cerrado**); 2 interesados; cambios: 1 **aprobado** y 1 **rechazado**; 1 lección |
| f | Calendario | Hitos 5 jun, 28 ago, 30 sept, 20 nov |

---

## 5. Proyecto Kanban: *Mesa de ayuda interna*

- Trabajo: la columna *En curso* muestra **2 / 2** (2 tareas con límite WIP de 2).
- Arrastra «Licencias de ofimática vencidas» a *En curso* → la columna pasa a **3 / 2** y se marca **en rojo**. La app avisa pero no bloquea: es lo esperado.
- Devuélvela a *Por hacer* → deja de estar en rojo.

---

## 6. Calidad del plan (en el Portal)

1. Pestaña **Calidad del plan** → 10 secciones.
2. En *Encuadre y acta*, escribe en un objetivo «Mejorar la atención lo antes posible».
   - Debe marcar **lenguaje vago** («mejorar», «lo antes posible») y que el objetivo **no es SMART**.
3. Reescríbelo: «Reducir las llamadas por facturas un 40 % antes del 31/12/2026» → la observación desaparece.
4. En *Riesgos*, registra un riesgo con P × I ≥ 12 **sin respuesta ni dueño** → la verificación entre secciones lo señala.
5. **Subir documento**: carga un `.docx` o `.txt` tuyo → propone fragmentos literales para cada campo.
6. **Ver informe de calidad** → puntaje por sección, 15 verificaciones, observaciones; imprímelo en PDF con `Ctrl` + `P`.

---

## 7. Portafolios, Agenda y EOS

| # | Pantalla | Esperado |
|---|---|---|
| 7.1 | Portafolios | *Transformación digital* (programa **Canales digitales** con el Portal, más la Mesa de ayuda) y *Infraestructura y sedes* (la Sede) |
| 7.2 | Mueve la Mesa de ayuda a otro portafolio | Cambia desde su fila |
| 7.3 | Agenda | Hitos, sprints y tareas de los 3 proyectos |
| 7.4 | EOS → Rocas, **Q3-2026** | 3 rocas: *Portal* (En camino, 1/3 metas) · *Sede* (En riesgo, 1/2) · *Contrato mesa de ayuda* (Lograda, 1/1) |
| 7.5 | EOS → Scorecard | 5 métricas × 13 semanas en **verde o rojo** según su meta |
| 7.6 | Cambia un valor del scorecard para que cruce la meta | Cambia de color |
| 7.7 | EOS → VTO | Las 8 respuestas rellenas |
| 7.8 | EOS → Organigrama | Gerencia general → PMO y Operaciones → Coordinación de obra (**sin persona**) |

---

## 8. Permisos por rol

Para cambiar de cuenta, pulsa el botón de **salir** (arriba a la derecha).

| # | Entra como | Comprueba | Esperado |
|---|---|---|---|
| 8.1 | **pedro@** | Panel | **0 proyectos** |
| 8.2 | **carlos@** | Panel | Portal y Sede (no la Mesa de ayuda) |
| 8.3 | carlos@ | Sede → Dominios | **Sin formularios** para registrar: solo lectura |
| 8.4 | carlos@ | Portal → Dominios | **Sí** puede registrar riesgos |
| 8.5 | carlos@ | Portal → Equipo | No puede cambiar configuración ni metodología |
| 8.6 | carlos@ | Abre la dirección `#/proyectos/proy-mesa/flujo` | «**Sin acceso a este proyecto**» |
| 8.7 | carlos@ | Administración | «Solo para administradores» |
| 8.8 | carlos@ | EOS | Aviso «**Solo lectura**»; marcar una meta no la cambia |
| 8.9 | **ana@** | Panel | Portal y Sede |
| 8.10 | **laura@** | Panel | Los 3 proyectos; puede crear un proyecto nuevo |
| 8.11 | **admin@** | Administración | 5 cuentas; concede a Pedro «ver» en el Portal → al entrar como Pedro ya lo ve |

---

## 9. Datos: exportar, reimportar y persistencia

1. Como admin, **Administración → Exportar datos** → descarga `pmbok8-gestor.json`.
2. Haz un cambio visible (por ejemplo, borra un riesgo).
3. **Importar datos** con el archivo recién exportado → el riesgo vuelve.
4. Cierra el navegador, vuelve a abrir `index.html` → todo sigue ahí.
5. **Exportar plan e informe** dentro de un proyecto → descarga el plan.

---

## 10. (Opcional) Modo servidor

Solo si ya tienes `backend/.env` configurado con PostgreSQL (ver `backend/README.md`).

1. `backend\iniciar.cmd` → abre **http://localhost:3000**. Debe verse que está conectado al servidor, no «Modo local».
2. Entra como `admin@pmbok.local` → pide **cambiar la contraseña** la primera vez.
3. **Administración → Importar datos** con `datos-demo.json`.
   - Las cuentas nuevas reciben `cambiar123` y **deben cambiarla al entrar** (en modo local no se pide).
4. Repite las secciones 1, 3.7, 4.1 y 8: las cifras deben ser **las mismas**.
5. Mientras editas, arriba aparece «**Guardando…**»; recarga y los cambios siguen.
6. Abre la app en **dos navegadores** con cuentas distintas: los cambios del otro **no se refrescan solos** (limitación conocida); se ven al recargar.

---

## Qué anotar si algo falla

- El número de paso (por ejemplo, **3.7 f**).
- Qué esperabas y qué viste.
- Una captura de pantalla.
- Errores de la consola: `F12` → pestaña **Consola**.

## Detalles ya vistos en la revisión

No impiden usar la aplicación; compruébalos y decide si merecen arreglo:

- **Eje de la gráfica de valor ganado:** con montos grandes marca «300000 k» en lugar de «300 M».
- **Roles Scrum:** si nadie tiene el rol de Scrum Master se lee «Scrum Master: — —» (guion doble).
- **Números animados:** los contadores del Panel y el anillo de avance tardan un momento en llegar a su valor; en una captura tomada enseguida se ven cifras menores.
