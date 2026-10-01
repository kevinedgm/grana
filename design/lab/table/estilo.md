# Entrega de coco · GTable.css, GPagination.css y GFilterBar.css

**Archivos:** `packages/vue/src/components/GTable/GTable.css`, `GPagination/GPagination.css`, `GFilterBar/GFilterBar.css`. No se tocó `defaults.css`: sin tokens nuevos.
**Contratos:** `design/contracts/table.md`, `pagination.md`, `filter-bar.md` (DECISIONS.md #109 a #111).
**Estado:** listo para bruno (registro pendiente en `components.css`; los `.vue` aún no existen).
**Banco de pruebas:** `design/lab/table/estilo-banco.html` (desde la raíz del repo): tabla con líneas, con superficie y compacta, tarjetas a 360px, paginación compacta y el editor de filtros abierto; con «Tema de prueba» y «Oscuro».

## Carácter propio

| Detalle | Cómo |
| --- | --- |
| **Encabezado discreto** | Texto `caption` en `text-muted` y peso de acción; línea inferior `border-strong`; pegajoso |
| **Filas** | `lines`: separador `border` de un trazo; hover `surface-sunken`; seleccionada `primary-soft`. `surface`: cada fila es una superficie (`surface`, borde tenue, `radius-lg`) con `space × 2` entre filas |
| **Columna compuesta** | Inicio circular de `space × 8` (`surface-sunken`), título en peso de título, subtítulo `caption` en `text-muted`; elipsis en tabla, ajuste de línea en tarjetas |
| **Números** | Alineados al final con cifras tabulares |
| **Orden** | Icono al 60% de opacidad; el encabezado ordenado pasa a `text` y su icono a opacidad plena |
| **Densidad** | Relleno vertical × 1, 0.875 y 0.75 (`api.md`: `comfortable` es más compacta que `default`) |
| **Tarjetas** | Rejilla `casilla · principal · acciones` en la primera línea y «etiqueta: valor» debajo; tarjeta `radius-lg`; seleccionada con borde `primary` y fondo `primary-soft` |
| **Cargando** | Esqueleto `surface-sunken` con pulso suave (`duration-spin × 1.5`), solo sin movimiento reducido |
| **Paginación** | Botones de `space × 8` con `radius-md`; actual con borde `border-strong` y peso de acción; elipsis no interactiva |
| **Filtros** | Chip aplicado: píldora con borde `border-strong` partida en dos botones; sugerido: borde **punteado** `border-control` y texto `text-muted`; «Agregar filtro» en peso de acción; «Limpiar» subrayado; editor con el lenguaje de `GSurface level="floating"` |
| **Casillas** | Nativas con `accent-color: primary`; 18px (24px con `pointer: coarse`) |

## Estados cubiertos

| Estado | Cómo |
| --- | --- |
| hover | Filas, botones de orden, paginación y filtros, dentro de `@media (hover: hover)` |
| `:focus-visible` | Orden, casillas, paginación, chips, editor: `--g-focus-*` |
| seleccionada | `primary-soft` (tabla) y borde `primary` (tarjetas) |
| disabled | Anterior/siguiente en los extremos: opacidad 0.5 |
| loading | Esqueleto con pulso |
| `prefers-reduced-motion` | Sin pulso ni transición de entrada del editor |
| `forced-colors` | Encabezado `CanvasText`, celdas `GrayText`, fila seleccionada con contorno `Highlight`, chips y editor con borde `CanvasText` |
| `pointer: coarse` | Casillas 24px; orden, paginación y chips ≥ 44px |

## Verificación en Chromium (banco de pruebas)

| Prueba | Defecto | Tema de prueba | Oscuro |
| --- | --- | --- | --- |
| Encabezado | 7.46:1 | 6.99:1 | 8.59:1 |
| Título / subtítulo de la compuesta | 15.27 / 6.54:1 | 12.79 / 5.69:1 | 12.82 / 7.24:1 |
| Celda | 17.4:1 | 13.94:1 | 16.46:1 |
| Subtítulo en fila seleccionada | 6.54:1 | 5.69:1 | 7.24:1 |
| Chip sugerido: texto / borde | 7.46 / 3.45:1 | 6.20 / 4.10:1 | 9.29 / 4.66:1 |
| Chip aplicado, recuento, título del editor | ≥ 7.46:1 | ≥ 6.20:1 | ≥ 9.29:1 |
| Error del editor | 5.49:1 | 5.29:1 | 4.52:1 |
| Página actual: texto / borde | 17.4 / 21:1 | 13.94 / 9.91:1 | 16.46 / 18.42:1 |
| Relleno de celda (default / compact) | 12 / 9px | 15 / 11.25px | 12 / 9px |
| Inicio de la compuesta; botón de página | 32px; 32px | 40px; 40px | 32px; 32px |

- **Tarjetas a 360px:** filas en rejilla, `thead` oculto a la vista (1px, presente), etiquetas visibles salvo en la principal, controles de tarjetas visibles, sin desborde (360/360).
- **Paginación compacta:** lista oculta y «Página 1 de 4» visible.
- **Literales:** solo `24px`, `44px` y el patrón de texto oculto; sin colores ni `var()` con respaldo; sin `@layer`.

## Hallazgos corregidos en la entrega

1. **El editor de filtros se veía cerrado:** un `display: flex` propio anulaba el ocultamiento nativo de `[popover]`. Ahora `display: flex` solo con `:popover-open`.
2. **«Seleccionar todo» y «Ordenar por» se veían en modo tabla:** la regla de `label` de la barra ganaba en especificidad a la que los oculta. Ahora se ocultan con `.g-table__bar .g-table__bar-cards`.

## Hallazgos para bruno

1. Los botones Cancelar/Aplicar del editor y las acciones de fila son `GBtn` (`ghost`/`solid`, `size="sm"`) y `GMenu`: el banco usa botones sin estilo.
2. El editor necesita `--_x`, `--_y` y `--_max` como el contenido de `GHelper`; en hoja (`GDialog`) no lleva `g-filter-bar__editor`.
3. `chevrons-up-down` debe pasar a la lista `library` de `scripts/icons.json`.

## No ejecutado

`forced-colors` real (emulado), Firefox y Safari (`:popover-open`, `@starting-style`, `accent-color`), zoom al 200%, lector de pantalla en tarjetas.
