# GSplit · estilo (coco)

**Contrato:** `design/contracts/split.md` (#946 a #951) · **CSS:** `packages/vue/src/components/GSplit/GSplit.css` · **Regla de partida:** `design/lab/split/r01/sp.css` (kiwi, 1272/1272) · **Banco:** `design/lab/split/estilo-banco.html`.

## Qué es el CSS

Una fila flexible que se parte. `GSplit` no pinta nada (ni fondo, borde, foco ni texto): solo reparte. Por eso no hay movimiento, `forced-colors` no tiene nada que perder y el contraste, el foco y el tamaño táctil son los del contenido.

- `.g-split`: `display: flex; flex-wrap: wrap; gap`; alias `--_gf` (factor de separación 0 · 0,5 · 1 · 2), `--_df` (densidad 1 · 0,875 · 0,75), `--_k` (64 · 80 · 96), `--_narrow = max(space × k, cuerpo × k / 4)`, `--_a`/`--_b` (la proporción) y `--_unit = narrow / min(a, b)`.
- `.g-split__region--start` / `--end`: `flex: a|b 1 calc(unit × a|b)`. Bases proporcionales: el sobrante conserva la proporción exacta; si las dos bases más la separación no caben, `flex-wrap` las apila.
- `min-inline-size: 0` (sin suelo de contenido, regla 6), `box-sizing: border-box`, `overflow-wrap: break-word`. `:only-child` ocupa todo el ancho.
- No existen en el CSS `align="center"` ni `sticky` (reservados, #951). Sin `@container`, `@media`, contención, `cqi` ni `!important`.
- Primera línea: las cuatro capas. Todo en `grana.components`.

## Qué le da personalidad

El umbral lo dice el lado estrecho en palabras del diseño (`collapse`) y crece con el texto (`cuerpo × k / 4`), no con el visor; decide por su caja y es determinista (sin histéresis). La personalidad es de comportamiento, no de aspecto: no se añade decoración ni movimiento.

## Verificación (2026-10-28, coco; puerto 4219)

| Qué | Cómo | Resultado |
| --- | --- | --- |
| Prototipo de kiwi con el CSS real | `GRANA_PW_PORT=4219 node design/lab/split/estilo-verificar.mjs` (regenera `_estilo/` desde `r01/` con los nombres del contrato y carga `GSplit.css` en lugar de `sp.css`; casos K1 a K11 y los cuatro bloques reales a 1440 · 1024 · 768 · 390 · 320, texto al 100 % y al 200 %, secuencia de cambios de tamaño) | **1269/1272** en Chromium, Firefox y WebKit (423/424 por motor). Los 3 fallos son `K8 align center` (reservado, no existe en el CSS) |
| Notas del mismo recorrido | — | K9 contenido rígido sobresale 207 px (límite aceptado, regla 6); K11 sticky es experimento y se omite; Firefox: Checkout 390 y 320 al 200 % sobresale 1 px también antes (contenido) |
| Otro tema (`space` 5, cuerpo 17 px) | `node design/lab/split/estilo-tema.mjs`: 5 proporciones × 3 `collapse` × `gap` md/lg, umbral exacto (apila a umbral − 1, al lado en el umbral) | **95/95** en los tres motores (incluye 5 comprobaciones de la hoja: sin colores, sin respaldos, sin consultas/`!important`, sin medidas literales, capas) |
| `GContainer prose` | región con `<p>` de 200 palabras en una región de 500 px | el párrafo se mide a `66ch` (528 px) y nunca más ancho que su región; una tarjeta de Grana al lado sigue fuera de la medida (3 motores) |
| S-L11(a) calendario de Availability | ver abajo | corregido: 15 px → 0 |

**No verificado:** lector de pantalla real (no hay nada que anunciar), zoom de página real del navegador (se midió el texto al 200 % y los anchos), `forced-colors` real (no pinta nada), Safari/táctil reales, SSR real. El banco `estilo-banco.html` no se ha abierto a mano (los números salen de los scripts).

## S-L11(a) · calendario de Availability a 320 con texto al 200 %

Era CSS mío (`GDatePicker.css`). Causa: `.g-datepicker__month { min-inline-size: calc(var(--_cell) * 7) }` = 280 px, más ancho que el interior de la superficie a 320 px (288 − relleno = 238); el mes se salía de la fila centrada por los dos lados y el precio del último día (con el texto al 200 % mide 58 px en un botón de 38) acababa 15 px fuera de la caja (319 vs 304). Corrección: `min-inline-size: min(calc(var(--_cell) * 7), 100%)`: el mes puede encoger hasta la fila (celdas de ≈ 34 px, ≥ 24 px de 2.5.8), y con la fila ancha no cambia nada.

- **Antes / después** (Availability 03, 320 px, `zoom=2`, Chromium): sobresale 15 px → 0 px. A 100 % de texto y en anchos mayores el mes sigue a 280 (la fila lo permite).
- Con `dist/` reconstruido: `booking.spec.mjs`, `blocks-booking.spec.mjs`, `panel-estable.spec.mjs` y `form-distribution.spec.mjs` en Chromium, 273/273; `price.spec.mjs` y el filtro de calendario/fecha de `library.spec.mjs`, 37/37. (No hay spec propio de `GDatePicker`/`GCalendar` con ese nombre; `GCalendar` no se tocó.)
- Límite: a 320 px las celdas del selector bajan de 40 a ≈ 34 px (≥ 24; por debajo de los 44 px táctiles que solo se piden al puntero grueso en los botones sueltos). Antes el mes se salía de la superficie para conservar los 40.

## Tokens consumidos (para lima, `tokens.md` §57)

Exactamente dos, ningún token nuevo:

| Token | Uso |
| --- | --- |
| `--g-space-1` | Separación (`× 6 × factor × densidad`) y mínimo del lado estrecho (`× 64 · 80 · 96`) |
| `--g-text-body-size` | Mínimo del lado estrecho que sigue al texto (`× 16 · 20 · 24`, es decir `× k / 4`) |

Constantes de relación, no tema (#717, #948): `6`, `0,5 · 2`, `0,875 · 0,75`, `64 · 80 · 96` y `/ 4`. Alias locales: `--_gf`, `--_df`, `--_k`, `--_narrow`, `--_a`, `--_b`, `--_unit`, `--_gap`. Sin literales de unidad.

## Para otros roles

- **bruno:** clases del contrato (`g-split--ratio-1-1|3-2|2-1|2-3|1-2`, `--collapse-sm|md|lg`, `--gap-none|sm|md|lg`, `--density-default|comfortable|compact`, `--align-start|stretch`; `--density-default` y `--align-start` no tienen regla, es el valor base). Registrar `GSplit.css` en `components.css`. La regla 10 (un `GSplit` hijo directo de `GAdaptiveLayout` es bloque completo) es JS, no CSS: la lista `FULL_BLOCK` de `GAdaptiveLayout/adaptiveProfiles.js` (añadir `.g-split`); no la he tocado.
- **lima:** la tabla de arriba es la lista de tokens. Nota: `grana.css` ya incluye el cambio de `GDatePicker` y de `GContainer` (prose).
- **Pruebas de navegador del componente real** (`tests/split.spec.mjs`, bruno): las comprobaciones de este recorrido se pueden reutilizar; `estilo-verificar.mjs` ejecuta las de kiwi con los nombres reales.
