# Auditoría de kiwi · GTable, GFilterBar y GPagination (componentes reales)

**Auditor:** kiwi (estructura). **Fuentes:** `design/lab/table/r01/` y `r02/` (brief + declaración), contratos solo para aclarar.
**Implementación revisada:** `packages/vue/src/components/{GTable,GFilterBar,GPagination}/` y `utils/filters.js`.
**Pruebas:** `npx vitest run` de los tres componentes: 50 de 50 pasan (GTable 22, GFilterBar 16, GPagination 12).
**Navegador (Playwright, Chromium, playground):** orden con foco conservado y `aria-sort`; editor desde chip sugerido con foco al primer control; Esc devuelve el foco al chip; árbol de accesibilidad a 360px en modo tarjetas (tabla, `columnheader` con botones, celdas con nombre, casilla «Seleccionar Ana Torres», columna «Acciones»); la tabla no desborda (296px de 296px); menú «Agregar filtro» por teclado abre el editor dentro del diálogo.
Leyenda: ✅ cumple · ⚠️ parcial · ❌ falta · 🔁 desviación justificada.

## GTable (r01 decisiones 1–15, 17; r02 #6, #7, #9, #10, #13)

| # | Declaración | Estado | Evidencia |
| --- | --- | --- | --- |
| r01-1 | `<table>` real con caption, `th scope="col"` y roles explícitos | ✅ | `GTable.vue:295-299, 184, 196-198`; prueba «tabla con caption, roles explícitos…» |
| r01-2 | Tabla de datos, no `grid`; sin flechas entre celdas; Tab recorre controles | ✅ | Sin handlers de flechas; controles nativos (`GTable.vue:185, 201, 234`) |
| r01-3 | Una definición de columnas, mismo DOM, dos presentaciones por CSS | ✅ | `mode` solo cambia la clase (`GTable.vue:287`); `GTable.css:236-287` |
| r01-4 | Tarjetas: la compuesta es el encabezado, casilla a la izquierda, menú a la derecha; etiqueta visible `aria-hidden`; cabecera real presente pero oculta | ✅ | `GTable.vue:239`; `GTable.css:240-245, 275-279`; árbol de accesibilidad verificado en 360px |
| r01-5 | Modo por ancho del contenedor = suma de `min` × `space` (selección y acciones cuentan) | ✅ | `GTable.vue:140-148` (ResizeObserver; 24/40 por defecto; +10 selección y acciones); prueba «auto mide el contenedor» |
| r01-6 | En tarjetas, «Seleccionar todo» y «Ordenar por» + dirección en la barra superior | ✅ | `GTable.vue:244-278`; prueba «controles de tarjetas» |
| r01-7 | Orden: botón en `th`, `aria-sort`, alterna asc/desc, foco se queda, anuncio cortés | ✅ | `GTable.vue:117-123, 199-204, 305`; pruebas de orden y de foco; verificado en el navegador |
| r01-7b | El anuncio se emite siempre | ⚠️ | Solo si el consumidor pasa `labels.sorted` (`GTable.vue:122`); sin texto no hay anuncio, ni aviso de desarrollo (decisión de lima: sin textos por defecto, pero no avisa) |
| r01-8 | Compuesta ordenable por campo (`sortBy`, por defecto `title`) | ✅ | `GTable.vue:72`; `GTable.test.js` «compuesta ordena por title» |
| r01-9 | Selección con casilla nombrada, «todo» con estado mixto sobre la página visible | ✅ | `GTable.vue:109-114, 184-192, 233-235`; prueba de selección |
| r01-9b | Recuento de seleccionados visible | ⚠️ | `GTable.vue:276` solo si hay `labels.selectedCount`; no se anuncia (no es región viva). La declaración (hallazgo 12) pedía anunciar también la selección masiva |
| r01-10 | Fila seleccionada con clase y fondo, sin `aria-selected` | ✅ | `GTable.vue:232` (`is-selected`); la prueba comprueba la ausencia de `aria-selected` |
| r01-11 | Acciones por fila: botón de menú nombrado, `aria-haspopup`, `aria-expanded`, Esc devuelve el foco | 🔁 | Por decisión de lima el componente solo ofrece el slot `row-actions` (`GTable.vue:240`); el botón con nombre y el menú los pone el consumidor con `GMenu` (playground:456-460). La etiqueta `rowActions` de los textos de la meta no la usa el componente |
| r01-12 | Celdas ricas: inicio decorativo, insignia, barra, números a la derecha | ✅ | Slots `cell-{key}`, `leading-{key}` (`GTable.vue:163-179`); `align: 'end'` |
| r01-13 | Filas `lines` / `surface`, hover, cabecera pegajosa con altura limitada | ✅ | `appearance` y `maxHeight` (`GTable.vue:42, 294`); `GTable.css:84` (sticky) |
| r01-14 | Densidad `default` / `comfortable` / `compact` | ✅ | `GTable.vue:43`; `GTable.css:20-22` |
| r01-15 | Cargando: `aria-busy` + filas esqueleto; vacío: una fila con mensaje a todo el ancho | ✅ | `GTable.vue:212-226, 295`; prueba «loading» |
| r01-15b | Esqueleto en tarjetas | ⚠️ | Las celdas esqueleto no llevan etiqueta de tarjeta (`GTable.vue:215`); solo cosmético, no verificado en navegador |
| r01-17 | Con `pointer: coarse`, controles ≥ 44px | ✅ | `GTable.css:290-295` (revisión visual no repetida) |
| r01-cont | Sin desborde horizontal en tarjetas a 320/360px | ✅ | Navegador: 360px, tabla 296px y `scrollWidth` igual |
| r02-6 | Y entre filtros, O dentro de la lista; filtra local o `external` | ✅ | `GTable.vue:77`; `utils/filters.js:58-62`; pruebas «filtra localmente», «filterMode external» |
| r02-7 | Recuento anunciado; la paginación vuelve a la página 1 | ⚠️ | Vuelve a la 1 (`GTable.vue:129, 134`). Pero el anuncio sale **dos veces**: `GFilterBar` tiene su región viva (`GFilterBar.vue:59-61, 255`) y `GTable` otra (`GTable.vue:130, 305`), ambas con `labels.results` |
| r02-9 | Vacío por filtros distinto del vacío real, con «Limpiar filtros» | ✅ | `GTable.vue:219-226`; prueba «vacío por filtros con Limpiar; vacío real distinto» |
| r02-9b | Foco tras «Limpiar filtros» desde el vacío | ❌ | `clearFilters` (`GTable.vue:132`) no mueve el foco; el botón pulsado desaparece y el foco cae en `body` (WCAG 2.4.3, contradice r02 #8). El «Limpiar» de la barra sí lo mueve (`GFilterBar.vue:159-162`) |
| r02-10 | Columna compuesta filtrable por texto en varios campos | ✅ | `utils/filters.js:16-17, 29-35`; prueba «texto en compuesta busca en título y subtítulo» |
| r02-13 | Tarjetas con filtros: la barra envuelve, sin desborde | ✅ | Verificado a 360px |
| r01-16 / hallazgo 11 | Paginación integrada (`page`, `pageSize`, corte local o `total` externo) | ✅ | `GTable.vue:94-103, 301-304`; prueba «local con pageSize; external con total»; la página efectiva se acota a la última |

## GFilterBar (r02 decisiones 1–5, 8, 11, 12)

| # | Declaración | Estado | Evidencia |
| --- | --- | --- | --- |
| 1 | `role="group"` con nombre; envuelve | ✅ | `GFilterBar.vue:273`; CSS envolvente |
| 2 | Tres clases de elemento (sugerido, aplicado, «Agregar filtro»); un filtro aplicado deja de sugerirse; el menú lista solo los no aplicados | ✅ | `GFilterBar.vue:226-252`; pruebas de barra |
| 3 | Chip aplicado = dos botones con nombre completo («Editar filtro: …», «Quitar filtro: …») | ✅ | `GFilterBar.vue:231-233`; prueba «dos botones con nombre completo». Si faltan `edit` o `remove`, el nombre accesible cae al texto visible o a un icono sin nombre; avisa en desarrollo (`GFilterBar.vue:49-52`) |
| 4 | Editor `role="dialog"` no modal con `aria-labelledby`, regla, valor y Cancelar/Aplicar; foco al primer control; Enter aplica; Esc cancela; el foco vuelve al chip | ✅ | `GFilterBar.vue:259-264, 89-92, 145-148, 67-71`; pruebas y navegador (foco en INPUT; Esc al sugerido) |
| 4b | Enter aplica desde un `select` | ⚠️ | Solo desde `input` no casilla (`GFilterBar.vue:147`); en la regla (`select`) y las casillas no aplica. Aceptable, pero el prototipo hablaba de «Enter aplica» sin distinguir |
| 4c | Cerrar al hacer clic fuera | 🔁 | Añadido por bruno (`GFilterBar.vue:72-76`, popover manual); no estaba declarado, es coherente con diálogo no modal |
| 5 | Validación: sin valor no se aplica; mensaje visible y anunciado; vacío no es 0 | ✅ | `utils/filters.js:69-80`; `GFilterBar.vue:215` (`aria-live="assertive"`, `aria-invalid`, `aria-describedby`); pruebas «Enter aplica; vacío…» |
| 5b | Texto del mensaje de error | ✅ | `labels.required` y `labels.range` |
| 6 | Reglas por tipo (text, number, date, enum) | ✅ | `utils/filters.js:6-11` coincide con la tabla de r02 |
| 8 | Quitar mueve el foco al chip siguiente (o «Agregar filtro»); Limpiar lleva el foco a «Agregar filtro» | ✅ | `GFilterBar.vue:151-162`; prueba «quitar… mueve el foco». Si no queda ningún filtro y no hay campos por agregar, el foco no tiene destino (caso límite: `addBtn` no existe) |
| 11 | «Agregar filtro» con patrón de botón de menú (flechas, Esc) | ✅ | Usa `GMenu` (`GFilterBar.vue:242-251`); verificado: Flecha abajo + Enter abre el editor en el diálogo |
| 12 | Editor como popover anclado con volteo; por debajo de `space × 130`, hoja (`GDialog`) | ✅ | `GFilterBar.vue:17, 103-105, 265-272`; prueba «por debajo de space × 130 se abre como hoja» |
| 7 | Recuento visible | ✅ | `GFilterBar.vue:254` (si `count` definido) |
| r02-i | Editar un chip conserva posición y valor | ✅ | `GFilterBar.vue:100-101, 136-140`; prueba «editar un chip…» |
| r02-ii | Enum: casillas en `fieldset` con leyenda; «entre»: dos campos con etiqueta | ✅ | `GFilterBar.vue:181-203` |
| r02-iii | Hoja en móvil real (no verificada por kiwi) y foco al cerrarla | ⚠️ | Probada solo con `GDialog` simulado en jsdom; el foco vuelve a `addBtn`/chip vía `closeEditor(true)`, pendiente de verificar en navegador móvil |

## GPagination (r01 decisión 16, hallazgo 11)

| # | Declaración | Estado | Evidencia |
| --- | --- | --- | --- |
| 1 | `<nav>` con nombre | ✅ | `GPagination.vue:94`; prueba; avisa sin `labels.nav` (`GPagination.vue:47`) |
| 2 | Anterior/siguiente con nombre; deshabilitados en los extremos | ✅ | `GPagination.vue:87-93`; prueba |
| 3 | Páginas con `aria-current="page"` y nombre «Página N» | ✅ | `GPagination.vue:101-107` |
| 4 | Rango «6–10 de 12» | ✅ | `GPagination.vue:85-86, 95` |
| 5 | Compacta («Página 2 de 3» + flechas) por ancho del contenedor medido; forzable | ✅ | `GPagination.vue:54-58`; `GPagination.css:84-85`; pruebas «compacta por prop» y «compacta medida». Nota: en compacta se ocultan los botones de página con CSS (`display:none`), por lo que dejan de estar en el árbol de accesibilidad: correcto |
| 6 | Foco a la página actual tras cambiar | ✅ | `GPagination.vue:72-81`; prueba. Solo actúa si el control con foco desaparece o queda deshabilitado; si el foco sigue en el mismo botón, se queda (más prudente que la declaración, que pedía llevarlo siempre) |
| 7 | Elipsis no interactiva y oculta a lectores; un hueco = página | ✅ | `GPagination.vue:21-31, 100`; pruebas |
| 8 | Con `pointer: coarse`, ≥ 44px | ✅ | `GPagination.css:86-90` |
| 9 | Lista de páginas semántica (`ol`/`li`) | ✅ | `GPagination.vue:98-99` (mejora sobre el prototipo) |
| 10 | Rango visible con total externo | ✅ | `total` + `page` controlan el rango; en `GTable` con `total` no se corta localmente |
| 11 | Anunciar el cambio de página | ❌ | No hay región viva ni anuncio al paginar; el rango visible cambia sin `aria-live`. No lo declaraba r01 expresamente (solo foco y `aria-current`), pero un lector de pantalla que mantiene el foco en «Siguiente» no oye el rango nuevo. Mejora, no incumplimiento de la declaración |

## Incumplimientos priorizados

1. **❌ Foco perdido al «Limpiar filtros» desde el vacío por filtros (GTable).** `GTable.vue:132, 224`. Contradice r02 #8 y WCAG 2.4.3: el botón pulsado desaparece y el foco cae en `body`. Corrección sugerida (dueño bruno): tras `clearFilters` desde el vacío, llevar el foco al botón «Agregar filtro» o al primer chip sugerido de la barra.
2. **⚠️ Anuncio duplicado del recuento (GTable + GFilterBar).** `GFilterBar.vue:59-61` y `GTable.vue:130`: dos regiones `aria-live` anuncian lo mismo con `labels.results`. Dejar solo una (la de la barra cuando está integrada).
3. **⚠️ Anuncios dependientes de textos opcionales sin aviso.** `labels.sorted` y `labels.selectedCount` ausentes = sin anuncio de orden ni recuento; `GTable` no avisa en desarrollo (solo `GFilterBar` y `GPagination` lo hacen). Añadir aviso a `GTable`.
4. **⚠️ Selección masiva sin anuncio** (hallazgo 12 de r01): «Seleccionar todo» y el recuento no son región viva.
5. **⚠️ Esqueleto en tarjetas sin etiqueta** (cosmético) y la etiqueta `rowActions` de la meta sin uso en el componente (documentarlo para el consumidor).
6. **⚠️ Hoja móvil del editor de filtros** sin verificar en un visor móvil real; lector de pantalla real en tarjetas y chips sigue pendiente (ya constaba como NO ejecutado en las declaraciones).
7. **Mejora (no incumplimiento):** anunciar el rango al paginar en `GPagination`; Enter aplica también desde la regla.

## Desviaciones justificadas (🔁)

- Acciones por fila como slot, sin botón de menú interno (lima, hallazgo 5 de r01: «propuesta: slot, más flexible»).
- Cierre por clic fuera del editor de filtros (coherente con diálogo no modal).

## Veredicto

**Cumple con reservas.** La anatomía, el modelo campo ≠ columna, los roles ARIA, el modo tarjetas por contenedor, el orden, la selección, la paginación, el editor de filtros (reglas por tipo, validación, Y/O, foco al aplicar, cancelar y quitar) y los estados de vacío, cargando y vacío por filtros están implementados y probados (50 pruebas) y los puntos dudosos se confirmaron en Chromium. Quedan una pérdida de foco (hallazgo 1) y varios detalles de anuncios para lectores de pantalla, ninguno bloqueante estructuralmente.

## Seguimiento: correcciones de bruno

Aplicadas tras esta auditoría (913 pruebas pasan; build y compuertas bien):

| Hallazgo | Corrección |
| --- | --- |
| ❌ Foco perdido al «Limpiar filtros» desde el vacío | `GTable` pasa el foco a «Agregar filtro» (o a la tabla) cuando el botón enfocado desaparece; con prueba |
| ❌ `GPagination` no anunciaba el rango | El rango es `role="status"` (región viva) |
| ⚠️ Recuento anunciado dos veces | `GTable` provee `g-table-announces-results`; la `GFilterBar` integrada no lo repite (la suelta sigue anunciando); con prueba |
| ⚠️ Recuento de seleccionados no era región viva | `role="status"`; con prueba |
| ⚠️ Anuncios de orden y selección dependían de textos opcionales sin aviso | Avisos de desarrollo si faltan `labels.sorted` (con columnas ordenables) o `labels.selectedCount` (con selección) |

Después, las dos reservas menores: las filas esqueleto llevan `aria-hidden` (el estado lo da `aria-busy` de la tabla; no se añadió texto para no ampliar el contrato) y «Enter aplica» actúa también desde el `select` de regla y las casillas (914 pruebas).

Siguen abiertos solo los que requieren entorno real: hoja móvil del editor en un visor móvil y lector de pantalla.
