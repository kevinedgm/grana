# Declaración de cumplimiento · GTable y GPagination · r01

**Estado:** aprobada. La estructura se deriva de estándares (WCAG 2.2 AA; tabla de datos de HTML y patrones *sortable table* y *checkbox* de WAI-ARIA APG) y de las decisiones del usuario: columnas compuestas, personalidad (celdas ricas, filas como superficie, densidad), tarjetas en móvil, y en r01 orden, selección, paginación y acciones por fila.
**Ruta:** R1 · **Fidelidad:** F2 · **Material:** kit neutral; iconos de Lucide (`arrow-up`, `arrow-down`, `chevrons-up-down`, `ellipsis-vertical`, `chevron-left`, `chevron-right`).
**Siguiente dueño:** lima → `design/contracts/table.md` y `design/contracts/pagination.md`.

## Composiciones verificadas

Tabla con líneas y con filas tipo superficie; tres densidades; cabecera pegajosa con altura limitada; orden por columna simple y por columna compuesta; selección por fila y de la página (con estado mixto); menú de acciones por fila; paginación completa y compacta; tarjetas a 360px; cargando; vacío.

## El modelo: campos ≠ columnas

```js
columns: [
  { key: 'cliente', label: 'Cliente', leading: 'iniciales', title: 'nombre', subtitle: 'correo', sortable: true, sortBy: 'nombre' },
  { key: 'plan',    label: 'Plan',    sortable: true },
  { key: 'estado',  label: 'Estado',  sortable: true },           // celda rica: insignia (slot)
  { key: 'uso',     label: 'Uso',     sortable: true },           // celda rica: barra (slot)
  { key: 'total',   label: 'Total',   align: 'end', sortable: true }
]
```

Una **columna compuesta** reúne varios campos en una sola celda (inicio + título + subtítulo) bajo **un solo encabezado**: el lector de pantalla oye «Cliente, Ana Torres, ana@correo.com».

## Decisiones de estructura

| # | Decisión | Fundamento |
| --- | --- | --- |
| 1 | `<table>` real con `caption` (nombre), `<th scope="col">` y **roles explícitos** (`table`, `rowgroup`, `row`, `columnheader`, `cell`) | WCAG 1.3.1. Los roles explícitos conservan la semántica cuando el CSS cambia el `display` (modo tarjetas). Verificado: 1 tabla, 6 filas, 7 encabezados y 35 celdas en el árbol de accesibilidad **en los dos modos** |
| 2 | Tabla de datos, **no `grid`**: Tab recorre los controles (orden, casillas, menús, paginación); sin flechas entre celdas | APG: `grid` solo cuando la tabla es un widget de edición; aquí las celdas son lectura |
| 3 | **Una sola definición de columnas** produce tabla y tarjetas; **el mismo DOM**, dos presentaciones por CSS | Requisito del usuario; sin duplicar contenido para los lectores |
| 4 | **Tarjetas:** fila = tarjeta; la **columna compuesta es el encabezado** (casilla a su izquierda, menú a su derecha); el resto, líneas «etiqueta: valor». La etiqueta visible es `aria-hidden` (el lector usa el encabezado real, que queda oculto a la vista pero presente) | Decisión del usuario; WCAG 1.3.1 sin anuncios duplicados |
| 5 | **Modo por el ancho del contenedor:** tarjetas si el ancho es menor que la **suma de los mínimos de las columnas** (`min` en unidades de `space`; selección y acciones cuentan). Verificado: umbral 616px; 1074px → tabla, 334px → tarjetas | Como `GStepper` (DECISIONS.md #98): el umbral depende de cuántas columnas hay, no de un punto fijo |
| 6 | En tarjetas, la cabecera no se ve: **«Seleccionar todo» y «Ordenar por» + dirección** pasan a una barra superior | Sin ellos, en móvil se perderían el orden y la selección masiva |
| 7 | **Orden:** botón en el encabezado; `aria-sort` en el `th` del orden activo; un clic alterna ascendente/descendente; el foco se queda en el botón; un anuncio cortés («Ordenado por Total, descendente») | APG *sortable table*; WCAG 4.1.2 y 4.1.3. Verificado |
| 8 | **Columna compuesta ordenable** por un campo concreto (`sortBy`, por defecto `title`) | Verificado: ordena por `nombre` |
| 9 | **Selección:** casilla nativa por fila con nombre («Seleccionar Ana Torres»); «todo» en el encabezado con **estado mixto** (`indeterminate`) que selecciona **la página visible**; recuento visible | APG checkbox (mixto). Verificado: 2 de 5 → mixto; clic → 5 |
| 10 | La fila seleccionada se marca con **clase y fondo**, **no con `aria-selected`** | `aria-selected` no está permitido en filas de una tabla (solo en `grid`/`treegrid`); el estado ya lo expone la casilla. Hallazgo propio corregido en la ronda |
| 11 | **Acciones por fila:** botón de menú con nombre («Acciones de Ana Torres»), `aria-haspopup="menu"`, `aria-expanded`; Esc devuelve el foco (verificado). Será `GMenu` | WCAG 4.1.2, 2.4.3 |
| 12 | **Celdas ricas:** inicio (avatar o iniciales), insignia con forma + texto, barra con su porcentaje en texto, números alineados al final con cifras tabulares | Decisión del usuario; WCAG 1.4.1 (la insignia no depende del color; la barra lleva el número) |
| 13 | **Filas como superficie:** variante `lines` (separadores finos) o `surface` (cada fila es una tarjeta redondeada con separación); hover suave; cabecera pegajosa con altura limitada | Decisión del usuario |
| 14 | **Densidad:** `default`, `comfortable`, `compact` sobre el relleno de celda | Decisión del usuario; `api.md` |
| 15 | **Estados de la colección:** cargando (`aria-busy="true"` y filas esqueleto) y vacío (una fila con mensaje que ocupa todas las columnas) | WCAG 4.1.3 |
| 16 | **`GPagination`** aparte: `<nav>` con nombre, anterior/siguiente con nombre, páginas con `aria-current="page"`, rango («6–10 de 12»); compacta («Página 2 de 3» + flechas) en contenedor estrecho; el foco va a la página actual tras cambiar | APG; WCAG 2.4.3. Verificado |
| 17 | Con `pointer: coarse`: casillas, menús y páginas ≥ 44px | `tokens.md` §7 |

## Criterios revisados

| Criterio | Resultado | Cómo |
| --- | --- | --- |
| WCAG 1.3.1 Información y relaciones | Cumple | Árbol de accesibilidad idéntico en tabla y tarjetas |
| WCAG 1.4.1 Uso del color | Cumple | Insignias con forma y texto; barra con número; fila seleccionada además con casilla |
| WCAG 1.4.10 Reajuste | Cumple | 360px: tarjetas, sin desborde (`scrollWidth` = `clientWidth`) |
| WCAG 2.1.1 Teclado | Cumple | Todo control es nativo (botón, casilla, select) |
| WCAG 2.4.3 Orden del foco | Cumple | El foco permanece en el control tras ordenar, seleccionar o paginar; Esc del menú lo devuelve |
| WCAG 4.1.2 Nombre, función, valor | Cumple | `aria-sort`, casillas con nombre por fila, estado mixto, `aria-current="page"` |
| WCAG 4.1.3 Mensajes de estado | Cumple | Anuncio cortés del orden; `aria-busy` al cargar |

## Comprobaciones NO ejecutadas

- Lector de pantalla real en modo tarjetas (Chromium expone la tabla; VoiceOver y NVDA pueden diferir con `display: grid` en filas, aun con roles explícitos).
- Muchas columnas (10+) y textos muy largos; columnas fijas al desplazar en horizontal (no hay desplazamiento horizontal en r01).
- Selección que abarque todas las páginas («seleccionar los 120»): fuera de r01.
- Rendimiento con cientos de filas (sin virtualización en r01).

## Hallazgos para lima

| # | Hallazgo | Severidad | Propuesta de la ronda |
| --- | --- | --- | --- |
| 1 | Modelo de columnas | Alta | `columns` con `key`, `label`, `align`, `sortable`, `sortBy`, `min` y, para compuestas, `leading`, `title`, `subtitle` (nombres de campo); `rows` y `rowKey` (por defecto `id`) |
| 2 | Celdas ricas | Alta | Slot por columna `cell-{key}` con `{ row, value }` (para `GBadge`, `GProgress`, `GMetric`); slot `leading-{key}` para avatar o icono; sin renderizadores internos de insignia o barra (los pone el consumidor con los componentes de Grana) |
| 3 | Orden | Alta | `v-model:sort` (`{ key, direction }`); **orden local por defecto**; `sortMode="external"` para datos del servidor (solo emite) |
| 4 | Selección | Alta | `selectable` + `v-model:selected` (claves); «todo» = página visible; sin `aria-selected` |
| 5 | Acciones | Alta | Slot `row-actions` con `{ row }` (el consumidor pone `GMenu`) o `rowActions` (lista para un `GMenu` interno); propuesta: slot, más flexible |
| 6 | Columna principal | Alta | La primera compuesta (o `primary: true`) encabeza la tarjeta; sin compuesta, la primera columna |
| 7 | Textos | Alta | Sin valores por defecto: nombre de la tabla, «seleccionar todo», «seleccionar {fila}», «acciones de {fila}», recuento, «ordenar por», dirección, anuncio de orden, vacío, y los de `GPagination`. Funciones o plantillas con `{title}` |
| 8 | Adaptación | Media | `responsive`: `auto` (suma de `min` × `space`) \| `table` \| `cards`. `min` por defecto 24; compuesta 40 |
| 9 | Apariencia | Media | `appearance`: `lines` \| `surface` (nombre a decidir: no `variant`); `density` compartida; `maxHeight` o `height` para la cabecera pegajosa |
| 10 | Estados | Media | `loading` (filas esqueleto, `aria-busy`), slot `empty` |
| 11 | Paginación | Media | `GPagination` independiente: `v-model:page`, `total`, `pageSize`; compacta por ancho del contenedor (medido, como el resto). `GTable` acepta `page`/`pageSize` para cortar localmente, o recibe ya la página |
| 12 | Anuncios | Baja | Región viva cortés propia para el orden (y la selección masiva) |
| 13 | Tokens | Baja | Filas `surface` sobre `GSurface`/`--g-surface-*`; probablemente sin tokens nuevos |
