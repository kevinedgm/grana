# Una sola luz · estilo (coco)

Contrato: `docs/contract/api.md` «Una sola luz», `design/contracts/sidebar.md` y `design/contracts/table.md` §«Una sola luz» (DECISIONS #957 a #963). Ronda: `r01/` (kiwi). CSS: `packages/vue/src/components/GSidebar/GSidebar.css` y `packages/vue/src/components/GTable/GTable.css`. Sin tokens nuevos; `defaults.css` no cambia.

## Qué le da personalidad

- **Una luz, no una estela.** Cada lista tiene una sola superficie que viaja al destino bajo el puntero (posición y tamaño con `--g-duration-press` + `--g-ease-out`, aparición con `--g-duration-fast`), como M1 de `GMenu`. Barrer la navegación o una tabla con el ratón se lee como un solo gesto continuo en vez de un parpadeo fila a fila. Sin muelle (#299): la luz no se pasa de la fila, porque eso diría que el destino es otro.
- **Dice la verdad.** Cubre exactamente lo que abre un clic: el enlace en el sidebar (hijo sangrado incluido), la fila en la tabla llana y en B, solo la celda de la puerta en A. La casilla no se ilumina.
- **«Dónde estás» y «adónde irías» conviven.** La luz pasa por detrás del asiento del actual sin apagarlo ni moverlo; la selección de la tabla (`primary-soft`) se pinta encima.
- **Aparece donde aterriza.** La primera colocación y las recolocaciones sin gesto (scroll, submenú, expandir, desplegar la ficha) no viajan, solo se funden (`is-highlight-instant`).

## Decisiones de estilo

| Pieza | Decisión | Por qué |
| --- | --- | --- |
| Junta `--_seam` (sidebar) | El hueco de medio paso entre items (`space × 0,5`) pasa a cada enlace (`min-block-size` + junta, un cuarto de paso por lado); la luz se recorta lo mismo por dentro (`block-size: h − junta`, `translate y + junta/2`) | Filas que se tocan (#958) sin que cambie el paso: los centros de fila quedan **idénticos** a los de antes (medido) y la luz mide lo que medía el hover (40 px en `default`) |
| Riel | La celda crece la junta en bloque (44 × 46); la luz recortada queda cuadrada (44 × 44) | Mismo paso que antes, sin hueco entre celdas |
| Submenú abierto | Sin `margin-block` entre el padre y su primer hijo (ni al cerrar); el aire es la propia junta: medio paso entre la luz del padre y la del hijo, como entre dos items | Un margen sería un hueco que apaga la luz al bajar a los hijos. Rellenar la primera y la última fila del submenú haría su luz más alta que la de sus hermanas, y la capa no puede recortar por fila. La sangría y la línea de conexión dicen la jerarquía. El submenú abierto mide 8 px menos que antes |
| Panel flotante (`g-sidebar__fly-list`) | La misma junta, `gap` 0 y `position: relative` en su `ul` | Misma regla; luz `border` sobre `surface`, como el hover de antes |
| Radio | Sidebar: el del enlace (`--_radius`); tabla: 0 | El mismo dibujo que el hover de antes |
| Navbar, `surface`, `cards` (#961) | Sin capa. El hover de siempre entra con fundido `--g-duration-fast` y **sale al instante**: la transición va solo en `:hover`, nunca en la regla de reposo. En `cards` el fondo va en la tarjeta (antes se teñían los `td` con huecos entre ellos); en A, solo la celda principal | Nunca dos fondos a la vez. El fundido de entrada se queda con movimiento reducido (es un fundido, no un viaje) |
| Tabla | `g-table__scroll` y `<table>` con `position: relative` sin `z-index`; sin transición de `background-color` en los `td` | La luz va antes en el árbol y queda debajo; el `th` pegado (`z-index: 1`) la tapa sin crear contexto de apilamiento en la tabla |
| Capas | Primera línea de cada hoja: `@layer grana.defaults, grana.components, grana.blocks, grana.utilities;` (#806), como `GSplit.css` | Dentro de la capa del registro solo declara subcapas vacías: no cambia la cascada |

No hay selectores sobre hijos de la aplicación (la luz es una pieza propia), así que no aplica `:not(:where(.g-tooltip))` (#383).

## Medidas (2026-10-29, Chromium; banco `estilo-banco.html`, `node design/lab/hover-glide/estilo-verificar.mjs chromium`, 258/258)

Medido con el **motor real** de bruno (`utils/glide.js` en `dist/`, `window.hgEngine = 'real'`) y el CSS fuente de `src/styles/`.

- **Caja:** en los 12 enlaces visibles del sidebar `default` con un submenú abierto, la luz = caja del enlace con la junta recortada (±1 px); en la tabla llana y en B, la luz = fila; en A, la luz = celda principal y ninguna luz en otra celda; la casilla de A sin fondo. RTL: sidebar y tabla en su sitio con el anclaje físico.
- **Barrido vertical a 1 px** del sidebar: como mucho 1 luz visible y 0 enlaces con fondo propio; filas que se tocan en todas las listas (hueco < 0,6 px).
- **Paso:** centros de fila del segundo grupo iguales que en `3109911` (CSS servido por `page.route`) en `default`, `compact` y riel. Alto del enlace: 40 → 42 (default), 30 → 32 (compact, ≥ 24 px), 44 → 46 (riel); la luz se ve de 40, 30 y 44.
- **Token:** sidebar `--g-color-border` (`rgba(0,0,0,.08)` en claro), tabla `--g-color-surface-sunken`. Radio de la luz = radio del enlace.
- **Movimiento:** `translate, inline-size, block-size` 160 ms (`press`) + `opacity` 120 ms (`fast`), sin `--g-ease-spring`; `is-highlight-instant` solo `opacity`; `reduce` solo `opacity`; `forced-colors` (emulado) capa `display: none`. Navbar, `surface` y `cards`: el hover entra con transición de `background-color` y en ningún momento hay dos celdas o filas con fondo; sin capa.
- **Asiento del actual** lleno con la luz encima de su enlace; seleccionada con `primary-soft` encima de la luz (`elementFromPoint` no llega a la capa).
- **Contraste del texto sobre la luz** (mínimo de claro, oscuro y los temas de `tema-oscuro/dark-color-presence/generated/` en claro y oscuro; luz compuesta sobre su superficie real):

| Dónde | Texto | Mínimo (tema) | Claro | Oscuro |
| --- | --- | --- | --- | --- |
| Sidebar | etiqueta `text` | 13,17 (oscuro) | 13,43 | 13,17 |
| Sidebar | icono `text-muted` (peor caso: el hover lo pasa a `text`) | 5,75 (claro) | 5,75 | 7,43 |
| Sidebar · zona de marca | etiqueta | 8,59 | 8,59 | 8,59 |
| Sidebar · zona de marca | icono | 5,68 | 5,68 | 5,68 |
| Tabla | `text` | 16,08 (linear) | 16,10 | 17,00 |
| Tabla | `text-muted` (subtítulo) | 6,87 (spotify) | 6,90 | 9,59 |
| Tabla · zona de marca | `text` / `text-muted` | 14,35 / 9,49 | | |

Todo ≥ 4,5:1. La luz frente a su superficie (1,08 a 1,67) es la misma diferencia que el hover de antes: no informa de ningún estado (1.4.1), así que no se le exige 3:1. `text-subtle` sobre la luz del sidebar (3,94 en claro) no se da: lo llevan el deshabilitado y el título de grupo, que apagan la luz.

## Rúbrica de movimiento (lo medido aquí; la cierra la auditoría posterior)

| Dimensión | Estado | Evidencia |
| --- | --- | --- |
| A · Propósito | Cumple | ≤ 1 luz y 0 fondos propios en el barrido |
| B · Comodidad | Cumple | Superficie plana, mismo token y contraste que el hover de antes |
| C · Estabilidad | Cumple | Paso de filas idéntico; la capa es absoluta y no refluye |
| D · Transiciones | Cumple | Transiciones CSS (interrumpibles); instantánea solo opacidad |
| E · Control | Cumple (CSS) | Solo presentación; quién la enciende es del motor de bruno |
| F · Accesibilidad | Cumple (CSS) | `reduce` solo fundido; `forced-colors` oculta; foco y anillo sin cambio |
| G · Rendimiento | No verificable aquí | Compuerta `tests/glide-perf.spec.mjs` de bruno (#963) |
| H · Inmersión | N/A | |

## No verificado

- **Firefox y WebKit:** los navegadores de Playwright no están instalados en este entorno y la descarga falla; solo Chromium.
- `forced-colors` real, lector de pantalla real, dispositivo modesto.
- El panel flotante del riel y el drawer con la luz: el CSS es el mismo, pero el banco no los abre.
- Peso de `grana.css` (#963, ≤ +512 B gzip): lo mide bruno con su copia aislada.
