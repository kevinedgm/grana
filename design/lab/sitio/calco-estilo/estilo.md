# Estilo · marco del sitio calcado (coco)

Lote de #1052 a #1059: el sitio de documentación se ve como el anterior y cada pieza es Grana. Hojas: `GNavBar.css` (nueva), `GPageIndex.css` (`list`, `fold`), `GCombobox.css` (`--command`, `__hints`), `GAppShell.css` (`pinned-wide`, `--g-app-shell-local-bar`, `is-covered`) y `site/.vitepress/theme/grana-site.css` (marca y títulos en serif, búsqueda, idioma, tema, barra local, rejilla, tarjetas, pie, portada «arriba»).

Banco: `index.html` (marco con las clases del sitio, componentes reales de `dist/` y el marcado de contrato de `GNavBar`, `GPageIndex list` y la superficie `command`), `verificar.mjs` (puerto 4240, tres motores) contra `../referencia/medidas.json` con las tolerancias de `sitio-marco.md` §12. Resultados en `paridad.json` y `resultados.json`.

## Qué le da personalidad

En reposo, nada: es el sitio anterior al píxel (decisión del usuario, #1052). La identidad es de **comportamiento** y no se ve hasta que se usa:

- **P1 · Una sola luz en la barra** (#1053): una capa del alto de la fila de texto (32, no los 64 de la banda) con el ancho entero del enlace, en `--g-color-border` como la de `GSidebar`, que se desliza de enlace en enlace con `--g-duration-press` + `--g-ease-out`. Con ella el hover deja de pintar `accent`: el puntero tiene su señal y la actual la suya. Nada cambia de medida (Δ0 medido).
- **El marcador del índice** viaja con `--g-duration-slow` + `--g-ease-out` (PI-H2, abajo) y la columna se sigue sola (PI-P1, de bruno).
- **La búsqueda** usa la luz como tarjeta del resultado (superficie y borde por dentro) sobre el fondo hundido del calco.

## Movimiento (rúbrica)

| Qué | Cómo | Reducido |
| --- | --- | --- |
| Luz de la barra | `translate` e `inline-size` 160 ms `ease-out`; aparición 120 ms | Solo fundido |
| Color de enlaces | 240 ms `ease-out` (el calco: 0,25 s) | Igual |
| Panel «…» | Entrada común de #1002: fundido y `space × 1` desde el botón, 120 ms | Sin transición |
| Marcador | `translate` 240 ms `ease-out` | Solo fundido |
| Chevron del plegado | `rotate` 0,25 turn, 240 ms | Al instante |
| Banda en estrecho, portada «arriba» | Cambio de maqueta, al instante | — |

**PI-H2 (curva del marcador):** el calco usa `cubic-bezier(0,1,.5,1)` 250 ms; `--g-ease-out` 240 ms llega al 90 % del viaje a 87 ms frente a 89 ms y solo difiere en los primeros 50 ms (61 % frente a 40 % a los 25 ms). Basta: sin curva ni duración nuevas.

## Hallazgos para otros roles

- **H1 (bruno, lima · N-H4):** `GSwitch` sin etiqueta visible (solo `aria-label`) pinta `__text` vacío con `flex: 1` y `__message` vacío de 48 px: el interruptor mide 48 en vez de 40 y corre 8 px el bloque de acciones. Receta del sitio (`.site-theme`), pero lo propio sería que `GSwitch` no pintara los dos vacíos.
- **H2 (lima, bruno):** el panel «…» es `popover="auto"` en la capa superior. Con anclaje CSS (`position-area`) se coloca bajo el botón sin JS; sin él cae en `--_more-top` / `--_more-end` (bajo la banda pegada, al final del visor). Propuesta: que bruno escriba los dos al abrir (como `--_screen-top`) para los motores sin anclaje, y que conste en «Clases y datos» de `nav-bar.md`.
- **H3 (lima):** `page-index.md` pide `--g-radius-md` (6) para el panel de `fold`; el calco mide 8 (`referencia/medidas.md` §5, estado `en-esta-pagina-375`). Usé `--g-radius-lg` (8). Enmendar el contrato.
- **H4 (lima):** el idioma actual en «…» y en el panel de idioma del original va en 700; no hay token de 700 (`--g-text-title-sm-weight` es 600). Usé 600. Desviación de tipografía declarada.
- **H5 (lima):** la superficie `command` es hermana del chasis en el sitio y no hereda `--g-app-shell-top` (vale 0 fuera de él). El borde superior es `max(--g-app-shell-top, space × 16)`: calco y = 64 y, dentro de un chasis con banda más alta, bajo ella.
- **H6 (bruno):** contrato de geometría del marcador: `--_marker-y` y `--_marker-h` son el borde superior y el alto **de la fila** del enlace actual, relativos al borde de relleno de `__body`, escritos en la propia capa (#964). El CSS dibuja 2 × 18 centrado.
- **H7 (lima, tema):** el fondo del diálogo es `--g-surface-backdrop` (0,32 en claro; el original 0,6). Es del tema; no se calca con un literal.
- **H8 (bruno):** «Menú» de la barra local: `.site-local__menu` pisa el aspecto de `GBtn` (sin capa) para calcar 12/500 en `text-muted`; si se usa un `<button>` del sitio con esa clase, el resultado es el mismo y sin dependencias.
- **H9 (bruno):** el CSS de `dist/` estaba con una versión anterior de mis hojas; reconstruí con `npm run build` antes de medir. Reconstruir siempre antes de `paridad.mjs`.
- **H10:** con columna izquierda la marca del original vive en la columna (x 32, ancho 208): es el slot `logo` de `GSidebar`, fuera de la compuerta hasta la ronda de kiwi (§4).
- **H11:** la barra local del original empieza en x = 0 con 272 de relleno (el tramo bajo la columna queda tapado); en Grana vive en el marco (x 272). Se comparan `y` y alto (estructura) y la posición de sus piezas.
- **Límite conocido (nav-bar.md «La actual»):** la actual frente al reposo pasa 3:1 en el tema por defecto (3,06 / 3,32) pero no con otros acentos en oscuro (medido en `amazon`, `spotify`, `stripe`): queda en `PENDIENTES.md` §5 (motor de tema).
