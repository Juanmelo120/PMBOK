# Caso práctico: crea tú mismo un proyecto desde cero

**Proyecto:** Sistema de reservas de la biblioteca municipal
**Tiempo:** 45–60 minutos · **Modo:** local (doble clic en `index.html`, sin servidor)

La municipalidad quiere una web donde los vecinos reserven libros y salas de estudio sin ir en
persona. Tú eres el administrador y vas a montar el proyecto completo: equipo, procesos, documentos,
riesgos, sprints y valor ganado.

Cada paso dice **qué escribir** y **qué debes ver**. Marca ✅ o ❌ al lado de cada «Debes ver».
Hice este mismo recorrido en Edge antes de escribir la guía: las cifras que aparecen son las que
da la aplicación.

---

## Paso 0 · Empezar limpio

1. Abre **Edge** en una **ventana InPrivate** (`Ctrl` + `Mayús` + `N`).
   Así no tocas los datos que tengas guardados; al cerrar la ventana, todo se borra.
2. Arrastra `index.html` a esa ventana.
3. Pulsa el botón para **entrar directamente** (`admin@pmbok.local` · `admin123`).

**Debes ver:** el **Panel** con **0** proyectos, **0** procesos y **0** documentos, y la marca «Modo local».

---

## Paso 1 · Crear el portafolio

**Portafolios → Nuevo portafolio**

| Campo | Escribe |
|---|---|
| Nombre del portafolio | `Servicios ciudadanos` |
| Descripción | `Trámites y servicios digitales para vecinos.` |

Pulsa **Crear**.

**Debes ver:** el portafolio en la lista, con 0 proyectos.

---

## Paso 2 · Crear las cuentas del equipo

**Administración → Nuevo usuario**. Repite cuatro veces, con contraseña inicial **`prueba123`**:

| Nombre | Correo | Rol |
|---|---|---|
| Sofía Martínez | `sofia@prueba.local` | Director de proyecto |
| Martín López | `martin@prueba.local` | Miembro de equipo |
| Julia Ramos | `julia@prueba.local` | Ejecutor |
| Tomás Vega | `tomas@prueba.local` | Miembro de equipo |

**Debes ver:** 5 cuentas en la tabla, todas **activas**. Solo el Administrador **no** tiene el botón *Desactivar*.

🔎 **Prueba extra:** crea otra cuenta con `sofia@prueba.local` → debe decir **«Ya existe una cuenta con ese correo»**.
Crea otra con la contraseña `123` → debe pedir **al menos 6 caracteres**.

---

## Paso 3 · Crear el proyecto

**Panel → Nuevo proyecto**

| Campo | Escribe / elige |
|---|---|
| Nombre del proyecto | `Sistema de reservas de la biblioteca municipal` |
| Descripción | `Web para reservar libros y salas de estudio sin ir en persona.` |
| Metodología | **Ágil (Scrum)** |
| Portafolio | Servicios ciudadanos |
| Fecha de inicio | `21/09/2026` |
| Fin previsto | `18/12/2026` |
| Presupuesto (BAC) | `50000000` |

Pulsa **Crear proyecto**.

**Debes ver:**
- Se abre el proyecto: **Ágil (Scrum)**, **activo**, **Inicio 21 sept 2026**.
- Anillo en **0 %**, «0 de 40 procesos completados».
- **Siguiente paso: 2.1.1 Iniciar el Proyecto o Fase**.
- ⚠️ El BAC aparece como **50.000.000 USD**: el formulario no pide la moneda. Lo corriges en el paso 4.

---

## Paso 4 · Equipo y moneda

Pestaña **Equipo**. En **Añadir persona** y **Rol en el proyecto**, pulsa **Agregar miembro** para cada una:

| Persona | Rol en el proyecto |
|---|---|
| Martín López | Equipo de desarrollo |
| Julia Ramos | Ejecutor |
| Sofía Martínez | Product Owner |

Después, en la configuración del proyecto, cambia **Moneda** a `COP` y pulsa **Guardar cambios**.

**Debes ver:**
- **4 miembros**: Administrador (tú, líder), Martín, Julia y Sofía.
- En *Añadir persona* ya solo queda **Tomás Vega**.
- En la cabecera: **BAC 50.000.000 COP**.

> El equipo va antes que los riesgos porque como **responsable** de un riesgo o de una tarea solo
> se puede elegir a los **miembros del proyecto**.

---

## Paso 5 · Primer proceso: 2.1.1 Iniciar el Proyecto o Fase

Pulsa **Abrir proceso** (o *Continuar*) en la banda del siguiente paso.

1. **Debes ver:** objetivo del proceso, **3 entradas** (Caso de negocio, Acuerdos, Plan de gestión de
   beneficios) con **+ generar desde plantilla**, herramientas agrupadas por familia y **2 salidas**.
2. Pulsa **Iniciar** → el estado pasa a **En curso**.
3. En **Salidas**, pulsa **+ Generar** en *Acta de Constitución del Proyecto*.
   **Debes ver:** se abre el editor del acta.
4. Rellena el acta:

   | Bloque | Escribe |
   |---|---|
   | Propósito y justificación | `La biblioteca atiende 400 reservas al mes por teléfono y en mostrador; el 60 % podría hacerse en línea.` |
   | Objetivos medibles (uno por línea) | `Reducir las reservas presenciales un 50 % antes del 30/06/2027`<br>`Tener 2.000 vecinos registrados antes del 31/03/2027` |
   | Criterios de éxito | `Satisfacción ≥ 4 sobre 5 en la encuesta de marzo` |
   | Hitos principales (tabla) | `Acta firmada` · `25/09/2026` · `Firma del concejal` |
   | Presupuesto preliminar | `50.000.000 COP` |
   | Patrocinador que aprueba | `Elena Castro, Concejala de Cultura` |

5. Recarga la página (`F5`). **Debes ver:** todo lo escrito sigue ahí.
6. Pulsa **Enviar a revisión** y luego **Aprobar**. **Debes ver:** estado **aprobado**.
7. Pulsa **Descargar (.md)**. **Debes ver:** baja un archivo con el acta.
8. Vuelve al proceso 2.1.1 y pulsa **Marcar completado**.

---

## Paso 6 · Adaptar el flujo

1. Abre el proceso **2.1.3 Planificar la Estrategia de Abastecimiento** (búscalo con `Ctrl` + `K`, escribiendo `2.1.3`).
2. Pulsa **Omitir (adaptación)**: no habrá compras externas.
3. Abre **2.5.1 Identificar a los Interesados** y pulsa **Marcar completado**.

**Debes ver en la cabecera:**
- **5 %** y «**2 de 39** procesos completados». Son 39 y no 40 porque omitiste uno.
- **Siguiente paso: 2.1.2 Integrar y Alinear los Planes del Proyecto**.

🔎 En **Flujo de procesos**, **arrastra** cualquier tarjeta a otra banda y recarga: debe quedarse donde la dejaste.

---

## Paso 7 · Riesgos

Pestaña **Dominios → Riesgos**. Registra estos tres con **Registrar riesgo**:

| Riesgo | P | I | Estrategia | Respuesta prevista | Responsable |
|---|---|---|---|---|---|
| `Los bibliotecarios no adoptan el sistema` | 4 | 4 | Mitigar | `Formación de 2 horas y un bibliotecario referente por sede` | Sofía Martínez |
| `El catálogo actual no exporta datos` | 3 | 5 | Mitigar | *(déjalo vacío)* | *— Sin asignar —* |
| `Retraso en la compra del servidor` | 2 | 2 | Aceptar | `Usar la nube municipal mientras llega` | Martín López |

**Debes ver:**

| Riesgo | Severidad | En la matriz |
|---|---|---|
| Bibliotecarios | **Crítico** | fila 4, columna 4 |
| Catálogo | **Crítico** (sin respuesta ni dueño) | fila 3, columna 5 |
| Servidor | **Bajo** | fila 2, columna 2 |

Las escalas son **≥ 15 crítico · 8–14 alto · < 8 bajo**.

🔎 **Arrastra** «Retraso en la compra del servidor» a la celda 4 × 4 → su severidad cambia.
🔎 Borra un riesgo con **×** → aparece **Deshacer**; púlsalo y el riesgo vuelve.

### Interesados, cambios y lecciones

En las subpestañas **Interesados**, **Cambios** y **Lecciones** registra al menos uno de cada:

- **Interesado:** `Elena Castro` · rol `Patrocinadora` · poder 5 · influencia 5 · actual *Neutral* · deseado *Líder*.
  **Debes ver:** aparece arriba a la derecha de la matriz poder · influencia.
- **Cambio:** `Reservar también equipos de cómputo` · solicitante `Jefe de biblioteca`.
- **Lección:** `Las reuniones con bibliotecarios se cancelaban` · causa `Coincidían con horas de atención`.

Los contadores de las subpestañas deben subir a 1.

---

## Paso 8 · Trabajo ágil: backlog y sprints

Pestaña **Trabajo**.

**Debes ver al entrar:** sprint activo **Sprint 0 — Preparación** (0 pts). Roles: **Product Owner: Sofía Martínez**. Equipo: **4 personas**.

### 8.1 Product backlog
Añade estas historias con **Añadir al backlog**:

| Historia o tarea | Puntos |
|---|---|
| `Buscar libros en el catálogo` | 5 |
| `Reservar un libro` | 3 |
| `Reservar una sala de estudio` | 8 |
| `Aviso por correo cuando el libro llega` | 2 |
| `Panel del bibliotecario` | 3 |

**Debes ver:** Product backlog **5**.

### 8.2 Sprint 1
1. Pulsa **Nuevo sprint** → nombre propuesto **«Sprint 1»** → **Empezar sprint**.
   (El Sprint 0 se cierra solo.)
2. Pulsa **→ sprint** en las **cuatro primeras** historias (todas menos *Panel del bibliotecario*).

**Debes ver:** **Comprometido: 18 pts**, *Por hacer* con 4 tarjetas y el backlog con 1.

3. Lleva **«Buscar libros en el catálogo»** y **«Reservar un libro»** hasta **Hecho**, con la flecha **→**
   (3 clics cada una: En curso → En revisión → Hecho) o **arrastrándolas**.

**Debes ver:** **Entregado: 8 pts** · *Por hacer* 2 · *Hecho* 2 · «Incremento (2 listos)».

4. **Métricas** → Puntos comprometidos **18**, entregados **8**, restantes **10**.

### 8.3 Cerrar el sprint
1. **Trabajo → Nuevo sprint** → **Empezar sprint** («Sprint 2»).

**Debes ver:**
- Sprint 2 activo con **0 pts**.
- Las 2 historias no terminadas **vuelven al backlog**: backlog **3** (Sala de estudio, Aviso por correo, Panel).
- **Métricas → Velocidad por sprint:** Sprint 0 = **0** · Sprint 1 = **8** · media **4**.

---

## Paso 9 · Valor ganado (EVM)

Pestaña **Control (EVM)** → **Registrar medición**.

### Corte 1: el proyecto va mal

| Fecha de corte | PV | EV | AC |
|---|---|---|---|
| `31/10/2026` | `12000000` | `10000000` | `12500000` |

**Debes ver:**

| Ficha | Valor | Estado |
|---|---|---|
| CPI | **0.80** | × Actuar |
| SPI | **0.83** | × Actuar |
| EAC | **62.500.000 COP** (frente a 50.000.000) | × Actuar |
| TCPI | **1.07** | ! Vigilar |

Vuelve al **Panel**: la tarjeta del proyecto dice **«Requiere acción»**.

### Corte 2: se recupera

| Fecha de corte | PV | EV | AC |
|---|---|---|---|
| `30/11/2026` | `25000000` | `24000000` | `25000000` |

**Debes ver:**

| Ficha | Valor | Estado |
|---|---|---|
| CPI | **0.96** | ✓ En rango |
| SPI | **0.96** | ✓ En rango |
| EAC | **52.083.333 COP** | ! Vigilar |
| TCPI | **1.04** | ✓ En rango |

- La gráfica tiene **2 puntos** (31 oct y 30 nov) y el historial 2 filas.
- En el **Panel**, la tarjeta pasa a **«Saludable»**.

🔎 Intenta registrar una medición con PV, EV y AC vacíos → aviso **«Introduce al menos uno de los tres valores»**.

---

## Paso 10 · Calendario

Pestaña **Calendario → Añadir hito**: `Piloto en la sede central` · `15/11/2026` · en ruta crítica **Sí**.

**Debes ver:** el hito en la tabla y en el calendario de noviembre, junto a los sprints.
En **Agenda** (menú lateral) también aparece.

---

## Paso 11 · Calidad del plan

Pestaña **Calidad del plan**.

**Debes ver al entrar:** «**Sin desarrollar**», calidad del contenido **0 / 100** y **10 secciones**, la primera con «0/7 campos».

1. Abre la sección **1 · Encuadre y acta de constitución**.
2. En **Objetivos del proyecto (SMART)** escribe: `Mejorar la atención lo antes posible`.
   **Debes ver**, debajo del campo, en *Verificación de calidad* (**31 / 100**):
   - ! **Al menos dos objetivos**: «1 elemento de los 2 esperados».
   - × **Objetivos medibles y fechados**: «falta magnitud medible y fecha o plazo límite».
   - × **Precisión del lenguaje**: «Expresiones imprecisas: «lo antes posible», «mejorar»».
3. Borra ese texto y escribe dos objetivos, uno por línea:
   `Reducir las reservas presenciales un 50 % antes del 30/06/2027`
   `Registrar 2.000 vecinos en el sistema antes del 31/03/2027`
   **Debes ver:** el campo sube a **100 / 100**, con «2 de 2 objetivos son verificables» y «Redacción precisa».
4. Pulsa **Ver informe completo** → puntaje por sección, verificaciones y observaciones. Imprímelo con `Ctrl` + `P`.

---

## Paso 12 · Permisos: entra con cada cuenta

Pulsa **salir** (arriba a la derecha) y entra con cada cuenta (contraseña `prueba123`):

| Cuenta | Debes ver |
|---|---|
| **tomas@** | Panel **sin proyectos** (no es miembro ni tiene permisos) |
| **martin@** | El proyecto. En Dominios **puede** registrar riesgos. En Equipo **no** ve *Guardar cambios* ni *Agregar miembro* |
| **julia@** | El proyecto; puede añadir tareas al backlog |
| **sofia@** | El proyecto. En el Panel **sí** tiene *Nuevo proyecto* (es directora) |
| cualquiera menos admin | **Administración** → «Solo para administradores» |

Ahora dale acceso a Tomás:
1. Entra como **admin** → **Administración** → fila de Tomás → **Permisos**.
2. **Conceder acceso a:** el proyecto · **Nivel:** *ver* → **Conceder**.
3. Entra como **tomas@** → **Debes ver:** el proyecto, pero **sin formularios** para registrar nada.

---

## Paso 13 · Guardar y recuperar

1. Como admin: **Administración → Exportar datos (.json)** → se descarga el archivo.
2. Borra un riesgo (y no pulses *Deshacer*).
3. **Importar datos** con el archivo exportado → **Debes ver:** «Datos importados» y el riesgo **ha vuelto**.
4. Cambia a tema **oscuro** (icono de luna) y recorre las pestañas → todo debe leerse bien.
5. Reduce la ventana a ancho de móvil → menú plegable y sin desplazamiento horizontal.

---

## Paso 14 · Cierre (opcional, destructivo)

**Equipo → Eliminar proyecto** → pide confirmación → al aceptar, el Panel vuelve a **0 proyectos**.

---

## Resumen de cifras esperadas

| Momento | Dato | Valor |
|---|---|---|
| Paso 6 | Avance | 5 % · 2 de 39 · siguiente 2.1.2 |
| Paso 7 | Severidades | Crítico · Crítico · Bajo |
| Paso 8.2 | Sprint 1 | Comprometido 18 · Entregado 8 · Restante 10 |
| Paso 8.3 | Velocidad | 0 · 8 · media 4 |
| Paso 9, corte 1 | CPI · SPI · EAC · TCPI | 0.80 · 0.83 · 62.500.000 · 1.07 → «Requiere acción» |
| Paso 9, corte 2 | CPI · SPI · EAC · TCPI | 0.96 · 0.96 · 52.083.333 · 1.04 → «Saludable» |

## Si algo no coincide

Anota el **número de paso**, qué esperabas, qué viste y una captura.
Si hay un error técnico, abre `F12` → **Consola** y copia el mensaje en rojo.

**Comportamientos que ya conozco y no son fallos tuyos:**
- El proyecto nuevo nace en **USD** (paso 4).
- «Scrum Master: — —» con guion doble si nadie tiene ese rol.
- El eje de la gráfica EVM usa «k» («10000 k») en lugar de millones.
- Los números del Panel se animan: espera un segundo antes de leerlos.
