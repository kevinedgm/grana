# Brief funcional · GDatePicker · r01

**Agente:** kiwi (ejecutado por el squad siguiendo `.agents/skills/bruno/references/handoffs.md`)
**Ruta:** R1 · prototipo directo **Fidelidad:** F2 · wireframe mid-fi con kit neutral

## Enunciado

Un **desarrollador que usa Grana** necesita que su usuario **elija una fecha o un rango de fechas** (reservas, búsquedas, filtros, dashboards, planificación) de forma **rápida y comprensible**, en escritorio y en móvil, desde un campo, desde una barra de búsqueda, dentro de un Dialog o como superficie en línea, **sin construir componentes distintos por dispositivo** ni resolver por su cuenta el teclado, los lectores de pantalla ni los rangos que cruzan de un mes a otro.

Decisiones del usuario (respuestas de alcance): **un solo componente** `GDatePicker` con **campo(s) + popover + calendario en línea** (`inline` muestra solo la superficie); valor como **cadena ISO `YYYY-MM-DD`** (sin hora ni zona: evita el desfase de un día); en móvil, **hoja inferior con un mes** (botones y deslizamiento horizontal). Es **distinto de `GCalendar`** (planificador de eventos).

Brief de diseño del usuario (resumen): estética ligera y de baja densidad, rango como **superficie continua** (inicio → intermedio → fin), día seleccionado compacto que no afecta la celda, hoy distinto de la selección, fuera de mes atenuado sin confundirse con deshabilitado, **una a dos meses según el ancho** (mejor un mes bien resuelto que dos comprimidos), **proximidad ± N días** opcional bajo el calendario, apertura desde campos (Fecha, Desde/Hasta, Rango), desde barras de búsqueda (Destino / Fecha / Personas / Buscar) y dentro de un Dialog sin abrir otro.

## Pregunta de diseño

¿Qué anatomía, estados y comportamiento necesita `GDatePicker` para que un rango sea **una sola forma continua** que se entienda por **forma y texto**, no solo por color (WCAG 1.4.1), para que **una cuadrícula de fechas sea operable con teclado y anunciada con sentido** (nombre completo de cada día, inicio y fin del rango), y para que **un único sistema adapte** uno o dos meses, popover u hoja, sin comprimir los objetivos táctiles?

## Verbo y resultado

- **Verbo principal:** elegir un momento (una fecha o un intervalo).
- **Resultado verificable:** una fecha o un rango queda seleccionado con ratón, táctil y teclado; el rango cruza semanas y meses como una superficie continua; el lector de pantalla oye la fecha completa y si es inicio, fin o parte del rango; ningún día cambia de tamaño al seleccionarse.

## Anatomía

| Parte | Obligatoria | Nota |
| --- | --- | --- |
| Campo(s) (`g-datepicker__field`) | Salvo `inline` | Botón que muestra el valor formateado y abre la superficie (`aria-haspopup="dialog"`, `aria-expanded`). Rango: un campo, o **Desde / Hasta** compartiendo la misma superficie |
| Popover (`g-datepicker__pop`) | Salvo `inline` | `role="dialog"` no modal en la capa superior, anclado bajo el campo o la barra; **hoja inferior** en móvil |
| Superficie (`g-datepicker`) | Sí | Contiene meses, proximidad, resumen y acciones; también existe sola con `inline` |
| Mes (`g-datepicker__month`) | Sí (1 o 2) | Encabezado (anterior, mes y año, siguiente), fila de días de la semana y cuadrícula de 6 filas (altura estable) |
| Cuadrícula (`role="grid"`) | Sí | Celdas `gridcell` con un botón por día; un solo tabstop (`tabindex` móvil) |
| Día (`g-datepicker__day`) | Sí | Botón circular compacto; el rango es una **franja** detrás, no un botón |
| Proximidad | No | Chips `± 1 día`, `± 3 días`, `± 7 días` (configurables) para ampliar el rango |
| Resumen y acciones | No | «5 may – 12 may 2026 · 8 días», Limpiar y Listo |
| Cabecera de hoja | Solo móvil | Asa, título y cierre |

## Estados de día

Default, Inactive, Today, Hovered, Focused, Selected (fecha única), In Range, Range Start, Range End, Disabled, Outside Month; además **vista previa** del rango (mientras se elige el final) y **inicio/fin el mismo día**.

## Comportamiento

- **Modos:** `single` (una fecha) y `range` (inicio y fin). En rango: primer toque = inicio, con vista previa al mover; segundo toque = fin; un tercer toque empieza un rango nuevo.
- **Meses visibles:** dos si el ancho disponible los deja con objetivos cómodos (≈ 648px con puntero fino, ≈ 704px táctil), si no uno; un solo sistema, sin ramas por dispositivo.
- **Navegación:** botones anterior/siguiente (solo en el borde exterior de cada mes en dos meses), deslizamiento horizontal en móvil, PageUp/PageDown (mes) y Mayús+PageUp/PageDown (año).
- **Teclado (patrón APG *date picker*):** flechas ±1 y ±7 días, Inicio/Fin (semana), Enter/Espacio elige, Esc cierra el popover y devuelve el foco al campo.
- **Proximidad:** amplía el rango elegido `± N` días respetando mínimo y máximo.
- **Campos:** abren el popover; al abrir, el foco va a la fecha elegida (o a hoy); al cerrar, vuelve al campo. Fecha única cierra al elegir; el rango cierra al completarse salvo que haya proximidad (entonces se cierra con Listo).
- **Dentro de un Dialog:** `inline` en una superficie interior hundida; **no abre popover ni otro Dialog**.

## Riesgo por acción

Bajo: elegir fechas es reversible. El riesgo es de **interpretación**: una fecha equivocada (por zona horaria, por orden inicio/fin, por tocar sin querer un día fuera de mes) en una reserva. Por eso el valor es una fecha sin zona, el resumen repite lo elegido con texto («8 días») y el rango siempre se anuncia con inicio y fin.

## Continuidad

- **Zoom 200% y 320px:** un mes sin desborde horizontal.
- **Movimiento:** solo transiciones de color; se respeta `prefers-reduced-motion`.
- **Colores forzados:** el inicio y el fin conservan forma (círculo con borde); la franja tiene borde superior e inferior.
- **RTL:** franja y navegación con propiedades lógicas.

## Alcance

| Must | Should | Could | Won't (v0.1) |
| --- | --- | --- | --- |
| `single` y `range`, uno o dos meses adaptables, 11 estados de día | Proximidad ± N configurable | Deslizamiento horizontal en móvil | **Escribir la fecha a mano** en el campo (análisis de formato por idioma) |
| Campo + popover, hoja en móvil, `inline` | Desde / Hasta con una sola superficie | Atajos de rango («Esta semana», «Próximos 30 días») | Selección de hora |
| Teclado completo y nombres accesibles por día | Resumen y Limpiar | | Años y meses como vistas de rejilla |
| Mínimo, máximo y fechas deshabilitadas | Barra de búsqueda y Dialog como patrones de uso | | Varias fechas sueltas (multi-selección) |
