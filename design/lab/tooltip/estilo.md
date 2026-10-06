# GTooltip · estilo (coco)

> Paso 3 del flujo. Contrato: `design/contracts/tooltip.md` (lima, #380 a #393; `tokens.md` §29.5 a §29.7 y §36; `api.md` «Paneles anclados» y «Nodos hermanos de `GTooltip`»). Estructura: `r01/` (base) y `r02/?c=A` y `?c=C` (kiwi). CSS: `packages/vue/src/components/GTooltip/GTooltip.css`. Banco: `estilo-banco.html` (marcado exacto del contrato con `XTooltip`, que coloca el nodo como lo hará el motor; `GBtn`, `GIcon` y `GInputGroup` reales de `dist/`, CSS de `src/`). Servidor: `estilo-serve.mjs` (sirve además `/__head/`, el CSS del commit `5dba395`, para medir Δ0). Verificación: `GRANA_PW_PORT=4209 node design/lab/tooltip/estilo-verificar.mjs` (requiere `dist/` por el JS). Tema propio de esta entrega: `estilo-tema.json` → `estilo-tema.css` (`@grana/cli`: brand `#7A1F3D`, accent `#0E7490`, neutros teñidos, radius 2, **space 5**, **fontSize 18**, **borde 2px**).

## Qué le da personalidad

1. **La etiqueta nace del control.** No es un globo con flecha: una pestaña del ancho exacto del control (del alto, en un riel) cuelga de su borde y se abre en la etiqueta con **dos curvas de unión cóncavas** de `--g-radius-sm`, como la pestaña de una carpeta. Se lee como una sola pieza, el nombre que le faltaba al control.
2. **Las esquinas obedecen a la pestaña.** Donde la pestaña llega al borde de la etiqueta (un botón de texto de 120px con un nombre corto, un riel cuya etiqueta mide lo que el botón), esa esquina de la etiqueta se **cuadra** y la pestaña la continúa en línea recta; las otras conservan `--g-radius-md`. El radio de cada esquina es lo que sobra de etiqueta junto a la pestaña, acotado a `--g-radius-md`, y la curva de unión aparece solo cuando sobra más que eso: la forma se recalcula sola en cada control y durante el viaje.
3. **El viaje arrastra la forma entera.** Pestaña, curvas y esquinas salen de `--_tooltip-ax/ay/aw/ah`, registradas con `@property` e interpoladas en el nodo: al pasar de un botón al siguiente la etiqueta se desliza (`translate` + `inline-size`, `--g-duration-press` + `--g-ease-out`, sin muelle) y la pestaña cambia de ancho a la vez, sin salir nunca de la etiqueta (medido cuadro a cuadro). El texto nuevo está desde el primer cuadro y **se descubre** con el ancho (una línea y recorte solo mientras viaja) en vez de repartirse en líneas a cada cuadro.
4. **La segunda etapa crece hacia fuera.** El nombre solo; con reposo, el detalle y el atajo bajan (o suben, con `top`) desde el nombre con `grid-template-rows` y un fundido corto del contenido; el borde junto al control no se mueve (Δ0 medido en los tres motores).
5. **El atajo es una tecla**, con borde del color del texto y empujado al final de la línea (como en `GMenu`): con una etiqueta más ancha que su nombre, nombre a un lado y tecla al otro.

Sobrio a propósito (decisión del usuario): ningún muelle ni rebote, entrada y salida con fundido `--g-duration-fast`, relevo del grupo sin entrada. Con movimiento reducido el viaje salta y la segunda etapa aparece sin crecer; los fundidos se quedan.

## Constantes de diseño (desde `space` y los tokens; no son tokens)

| Constante | Valor | Dónde |
| --- | --- | --- |
| Largo de la pestaña = hueco control–etiqueta | `space × 1,5` (6px; 7,5 con space 5) | El `.vue` pasa este mismo valor como `gap` a `placeAround`. La pestaña mide `largo + --g-border-width`: entra el grosor del borde en la etiqueta para que no quede costura |
| Relleno de la etiqueta | `space × 1` arriba y abajo, `space × 2,5` a los lados | Etiqueta de una línea: 30px con el tema por defecto (texto `body-sm` 20px + 8 + borde 2) |
| Separación nombre–atajo | `space × 2` (en línea) | Y entre detalle y atajo |
| Separación nombre–detalle | `space × 1` | Margen del contenido que crece (un relleno contaría como alto mínimo de la fila `0fr`) |
| Curva de unión | `--g-radius-sm`, solo si sobra más de `--g-radius-md` de etiqueta junto a la pestaña | Cuadrado de `curva + borde` con un círculo centrado en su esquina lejana (degradado radial del color de la etiqueta) |
| Esquinas de la pestaña, lado del control | `--g-radius-sm` | Contrato |
| Ancho máximo | `min(space × 70, visor − space × 4)` | `space × 70` es el del contrato; con `space` 5 (350px) no cabría en 320px con sus márgenes: el visor manda |
| Mínimo de la etiqueta | Arriba y abajo: `min(ancho del control, máximo)`; a los lados: `min(alto del control, visor − space × 4)` | La pestaña nunca sobresale; con un control más ancho que el máximo la pestaña se acota a la etiqueta, centrada sobre el control |

## Lo que el CSS espera del `.vue` (para bruno)

Clases y datos de `tooltip.md` §«Clases y datos», sin cambios: `g-tooltip`, `g-tooltip--detail`, `g-tooltip__tab`, `g-tooltip__body`, `g-tooltip__text`, `g-tooltip__kbd`, `g-tooltip__more`, `g-tooltip__more-in`, `g-tooltip__detail`; `data-side`, `data-instant`, `data-travel`, `data-dwell`, `data-touch` en el nodo; `--_x`, `--_y`, `--_yb`, `--_tooltip-ax/-ay/-aw/-ah` en línea (px); `data-g-tooltip` en el elemento resuelto. Además, del uso medido en el banco:

1. **Orden al colocar:** `data-side` (el pedido) y `--_tooltip-aw`/`-ah` **antes** de medir la etiqueta (la etiqueta mide al menos lo que el control en el eje del lado, y el mínimo depende del lado). Después `placeAround(rect, { width, height, vw, vh, placement, rtl, pad: space × 2, gap: space × 1,5 })`; si el lado resultante es perpendicular al pedido, poner ese `data-side` y medir de nuevo. Escribir `--_x`, `--_y`, `--_yb` (`vh − y − alto`) y `--_tooltip-ax = control.left − x`, `--_tooltip-ay = control.top − y` (físicos, también en RTL). `data-side` es **lógico** (el de `anchor.js`); el CSS lo resuelve con propiedades lógicas y `:dir(rtl)`.
2. **`data-instant` quita la entrada y la salida del nodo** (no el crecimiento de la segunda etapa, y puede quedarse puesto mientras está abierto). El **saliente de un relevo** (con o sin viaje) se oculta así: `data-instant` y luego `hidePopover()`, para que nunca haya dos etiquetas visibles.
3. **Viaje** (receta del banco, `TT.travel`): abrir el entrante con `data-instant`, colocarlo en su sitio con el lado del saliente y leer su geometría final (vars + ancho); escribir la geometría del saliente (vars + `style.inlineSize` = ancho del saliente) y forzar el estilo (`getComputedStyle(n).translate`, `n.offsetWidth`); quitar `data-instant`, poner `data-travel` y escribir la geometría final (con `inlineSize` = ancho final); ocultar el saliente como en 2. **Al terminar** (`transitionend` de `translate` o `--g-duration-press` + margen, que es lo que llega con movimiento reducido), **retirar `data-travel` y `inline-size`**: mientras `data-travel` esté puesto, el texto va en una línea y se recorta (es lo que hace que se descubra con el ancho); dejarlo puesto recortaría un nombre largo. Con `reduce` el CSS no recorta.
4. **Segunda etapa:** quitar `inline-size` si quedara, poner `data-dwell` y recolocar **en el acto** conservando el lado (el ancho final ya está; con `bottom` la y no cambia y con `top` `--_yb` tampoco, porque se calcula con el alto aún plegado). Una segunda comprobación al terminar el crecimiento si hiciera falta voltear.
5. **Táctil:** `data-touch` + `data-dwell` (el CSS lo muestra todo sin crecer).
6. **Hijos medidos por otros componentes:** el nodo cerrado es `display: none` (rectángulo 0). `GFormRow` (`data-lines`) y `GAdaptiveLayout` miden a sus hijos por JS: deben saltarse `.g-tooltip` (su CSS ya lo hace, #383). Igual cualquier recorrido de hijos de `GInputGroup.vue` (consulta `.g-input-group__box`).
7. **Compuerta de `dist/`:** `grep -q "g-tooltip__tab" packages/vue/dist/grana.css` (contrato, encargo 5 de bruno). Ojo: el minificador escribe `:nth-last-child(1 of:not(…))` sin espacio tras `of` (válido en los tres motores, medido); una compuerta con `"1 of "` fallaría.

## #383: nodo hermano y selectores sobre hijos de la aplicación

Regla aplicada: el nodo se excluye con **`:not(:where(.g-tooltip))`**, y en las combinaciones adyacentes con la variante **`A + :where(.g-tooltip) + B`**. `:where()` no suma especificidad, así que cada selector conserva la de antes (Δ0 también frente a reglas vecinas; `:nth-last-child(1 of :not(.g-tooltip))` del contrato subía de (0,1,0) a (0,2,0)). `estilo-verificar.mjs` §0 comprueba que, deshecha la exclusión, cada archivo es idéntico al del commit `5dba395`.

| Archivo | Antes | Ahora | Qué rompía el nodo |
| --- | --- | --- | --- |
| `GDialog.css` | `.g-dialog__body > :last-child` | `> :nth-last-child(1 of :not(:where(.g-tooltip)))` | El último control con tooltip conservaba su margen final |
| `GInputGroup.css` | línea entre partes (`A + B`, también en `forced-colors`) | `+ A + :where(.g-tooltip) + B` | Desaparecía la línea entre dos partes |
| `GInputGroup.css` | `.is-warning … __box > :last-child` | `:nth-last-child(1 of :not(:where(.g-tooltip)))` | El borde doble movía la última parte |
| `GInputGroup.css` | `__part:has(+ --text)`, `--text + __part`, `--text:last-child` (y con `__text-label`) | variantes con el nodo intermedio y `:nth-last-child(1 of …)` | Una parte de control con tooltip seguida de su unidad («120 mmHg») perdía el acercamiento al texto. **No estaba en la tabla del contrato** |
| `GFormRow.css` | `:not([data-lines]) > * + *` (margen) | `> * + :not(:where(.g-tooltip))` | El nodo abierto (fijo) se desplazaba el margen de línea. **No estaba en la tabla** |
| `GAdaptiveLayout.css` | `.g-adaptive-layout.g-adaptive-layout > *` | `> :not(:where(.g-tooltip))` | `inline-size: 100%` ponía la etiqueta del ancho del visor. **No estaba en la tabla** |
| `GCard.css` | `.g-card__meta > *` | `> :not(:where(.g-tooltip))` | `display: flex` dejaba el nodo **visible cerrado**. **No estaba en la tabla** |
| `GInput.css` | `.g-input__action > *` (4 reglas) | `> :not(:where(.g-tooltip))` | Con `<GBtn tooltip>` en `action`: `white-space: nowrap` heredado y 44px de mínimo en táctil. **No estaba en la tabla** |

Repaso con `grep` del resto (`:last-child`, `:only-child`, `:nth-*`, `+`, `~`, `> *`): `GTable`, `GNumberField`, `GCalendar`, `GDatePicker`, `GStepper`, `GTranscript`, `GSidebar`, `GCombobox`, `GCheckbox`, `GSwitch`, `GCard` (tick), `GErrorSummary`, `GFileField`, `GWidget*`, `GToast` y `GStatusIsland` solo seleccionan piezas **internas**; `GFormLayout > *`, `GFormReveal__body > *`, `GCard__content > *` y `GFormRow > *` ponen `margin: 0` / `min-inline-size: 0` (inocuos para un nodo fijo); `:first-child` no se ve afectado (el nodo va detrás); `GFormSection` (`section + section`, `lead + title`) no puede tener el nodo en medio.

**Medido** (§7 del verificador, tres motores): sin tooltip, Δ0 de rectángulos, márgenes, bordes y rellenos de los siete casos frente al CSS de `5dba395`; con el nodo hermano, el mismo aspecto que sin él; con el CSS anterior fallaban `GDialog`, `GInputGroup` (línea) y `GInputGroup` (advertencia), y el nodo heredaba de `GFormRow`, `GAdaptiveLayout` y `GCard` meta. `dist/` reconstruido: `form-distribution`, `dialog-focus`, `personalidad-dialog`, `adaptive-layout`, `personalidad-card` y `personalidad-input` en Chromium, **75/75**; `npm test` 2492/2492.

## Colores forzados

La pestaña es un fondo y desaparecería: pasa a `Canvas` con sus **dos lados largos en `CanvasText`**, sin radios, y tapa el tramo de borde de la etiqueta que la une (queda un cuello abierto hacia la etiqueta y hacia el control). La etiqueta lleva su borde transparente en `CanvasText`; el `<kbd>` y el texto, `CanvasText`. Las curvas de unión (degradados con el color del tema) se retiran. Medido con la emulación en los tres motores.

## Medidas (`estilo-verificar.mjs`, 3627/3627 en Chromium, Firefox y WebKit)

| Medida | Resultado |
| --- | --- |
| Pestaña frente al control (barra, riel, 120px, `block`, cuatro lados, bordes del visor, campo; defecto y tema de la entrega; LTR y RTL; también en segunda etapa) | Ancho/alto Δ ≤ 0,017px; borde Δ ≤ 0,453px (RTL, por el redondeo a centésimas de `px()`); entra `--g-border-width` en la etiqueta; nunca sobresale |
| Etiqueta ≥ pestaña | Botón de 120px con «Listo»: etiqueta de 120px y esquinas del lado de la pestaña rectas (las otras redondas; medido por impacto en Chromium y Firefox; WebKit no recorta por `border-radius` al buscar el elemento bajo un punto) |
| Control `block` de 640px | Etiqueta 280px (350 con space 5), pestaña acotada a ella y centrada sobre el control |
| Hueco control–etiqueta | `space × 1,5` (Δ < 0,5px) y es del tooltip (puente 1.4.13, `elementFromPoint`) |
| Contraste (26 configuraciones en Chromium, 4 en Firefox y WebKit) | Nombre, detalle, atajo y su borde, pestaña/página y etiqueta/página ≥ **15,2:1** (mínimo de todos los temas; 17,4:1 con el de defecto) |
| Texto | Nombre y detalle 14px y atajo 12px (15,75 y 13,5px con el tema de la entrega); sin recorte |
| RTL | Riel y `placement="left"` al lado físico correcto; curvas espejadas |
| 320px (zoom al 400 % de 1280) | La etiqueta cabe con su margen: `block` 271,5px (space 4) y 300px (space 5, por `visor − space × 4`) |
| Viaje (×5 lento) | Una sola etiqueta visible en todo cuadro, sin entrada, 31 cuadros intermedios, monótono, sin rebase, Δ0 al llegar, `data-travel` e `inline-size` retirados |
| Segunda etapa | Borde junto al control Δ < 0,5px mientras crece, hacia abajo (`bottom`) y hacia arriba (`top`); alto continuo y estable después |
| Entrada / salida | Fundido `--g-duration-fast`; `data-instant` sin ninguno. **La salida con fundido solo en Chromium**: Firefox y WebKit de Playwright no transicionan `display` de un popover y cierran en el acto (igual que `GMenu` y `GSelect`) |
| Movimiento reducido | Viaje sin `translate` ni `inline-size` ni pestaña en la transición (salta); segunda etapa sin crecer; fundido conservado |
| Táctil | Control con `data-g-tooltip`: `user-select: none`; el `<input>`: `auto`; `-webkit-touch-callout` no existe en los motores de escritorio (no medido) |
| `forced-colors` (emulado) | Borde de la etiqueta y lados de la pestaña en `CanvasText`, pestaña `Canvas`, sin curvas |

## No verificado

`forced-colors` real (Windows), táctil real (menú contextual de iOS con `-webkit-touch-callout`), Safari real, lector de pantalla (no es de estilo). La forma en el componente real queda para la auditoría (paso 5), sobre el `GTooltip.vue` de bruno.
