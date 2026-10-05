# GCombobox · estilo (coco)

> Paso 3 del flujo. Contrato: `design/contracts/combobox.md` (lima, #329 a #338). Estructura: `r01/` (base) y `r02/` (kiwi; el usuario eligió mirando `r02/index.html?c=AC` y `?c=B`). CSS: `packages/vue/src/components/GCombobox/GCombobox.css`. Banco: `estilo-banco.html` (componentes reales de `dist/` + marcado del contrato a mano). Verificación: `GRANA_PW_PORT=4209 node design/lab/combobox/estilo-verificar.mjs` (requiere `npm run build`).

## Personalidad: qué conservo de los prototipos elegidos y qué afiné

**Lo que da carácter al componente** (y lo que el CSS protege):

1. **Una sola forma (A).** Abierto, el campo no tiene un menú debajo: el campo *crece*. El popover empieza en el borde superior de la caja (o termina en el inferior, `is-up`), mide lo que ella y su zona alta es transparente y no captura el puntero. Contorno, anillo de foco y sombra (`--g-shadow-3`) son del popover; la caja los pierde mientras está abierta. Entre campo y lista, una línea fina (`--g-color-border`) que cae **exactamente** sobre la línea inferior de la caja (padding del popover = alto de la caja − 2 × borde). Con `rounded="pill"` el radio de la forma es medio alto de la caja, no 999px.
2. **El campo se completa (A).** El resto de la primera coincidencia se escribe en el propio campo sobre `--g-color-selection` (primer consumidor del rol), en `text-muted`: se lee como «texto propuesto, aceptable de un toque». Entra con un fundido corto (`@starting-style`, `--g-duration-fast`).
3. **El valor es un objeto (C).** En reposo, la ficha (`GSummary inline xs`, #356: avatar `xs`, código, título y la corriente de datos con «+N») ocupa la celda sin cambiar la caja. Con el foco se pinta **seleccionada entera** (`--g-color-selection`) como una **banda que cubre la celda**: lo siguiente que se escribe la reemplaza. El texto libre lleva lápiz, cursiva en peso de texto y una **marca «Texto libre»** con borde (`border-strong`, `caption`): una etiqueta, no un adorno; no se recorta (cede el título).
4. **Las filas son fichas (C).** Una `GSummary row lines 2` por opción: título + una corriente de datos con rótulo, filete y «+N»; con homónimas, lo único pesa y lo compartido se apaga (#354). La activa **se levanta** en A (borde `--g-color-text` + `--g-shadow-1`, la del prototipo `?c=AC`) y **se invierte** en la superficie (par texto/superficie, #325, la del prototipo `?c=B`). La vista previa de la paleta es la misma ficha en `stack lg` y **entra desde la lista** (ver «Fichas con `GSummary`»).
5. **La ficha llega.** Al elegir en la lista de A, la ficha sale de su fila y aterriza en el campo con `--g-ease-spring` (cuarto uso aprobado, #336). Opaca durante todo el viaje: es un objeto que llega, no un fundido.
6. **La paleta (B)** pone el campo de búsqueda como protagonista: `title-sm`, de borde a borde, con el foco como línea de `--g-focus-width` al pie; el título del diálogo baja a rótulo (`body-sm`, `action`, `text-muted`). Lista y ficha de la activa en proporción **6 : 5**, cuerpo de alto fijo (`space × 96`): la superficie no salta al cambiar los resultados.
7. **La hoja móvil va arriba** (no abajo como la de `GDialog`): el teclado virtual no tapa la lista. Entra desde arriba (`−space × 6`), espejo de la hoja de `GDialog`.

**Afinado respecto del prototipo:**

| Prototipo | Ahora | Por qué |
| --- | --- | --- |
| Despliegue de A con `--g-ease-spring` | `--g-ease-out` | #336: es una entrada |
| Llegada con opacidad 0,5 → 1 | Opaca | 0,5 sería una constante de coreografía nueva (#187); y un objeto que llega se lee mejor sólido |
| Llegada desde la fila exacta | Vector acotado a `space × 2 / 0.038` por eje | Rebase del muelle (3,8 %) ≤ `space × 2` también desde la fila más lejana (combobox.md «Movimiento») |
| Fantasma y ficha medidos por JS (`--_il`, `--_iw`) | Capas con `inset: 0` sobre la celda | La celda empieza donde el texto del `<input>`: nada que medir |
| Datos de la fila en varias líneas | **Dos líneas** con `GSummary row lines 2` (#356) | Reporte del usuario («amontonado, se desborda»): primero la regla provisional, ahora la ficha adaptable |
| Transición de color por fila | La activa cambia en el acto | Reporte del usuario («tintinea»): dos fichas fundiéndose a la vez parecen dos marcos |
| Coincidencia en peso 700 | `--g-text-action-weight` + subrayado de `--g-focus-width` | Solo tokens; el subrayado lleva la señal (WCAG 1.4.1) |
| Ficha seleccionada solo en el nombre | La ficha entera, como banda de la celda | combobox.md «Teclado»: «la pinta seleccionada entera»; desde #356 la ficha toma el ancho del contenedor |

## Fichas con `GSummary` (#356; remate de coco tras la adopción de bruno, 1e57a05)

La regla provisional de dos líneas y las reglas de `__description`, `__facts`, `__fact`, `__fact-label`, `__token-label`, `__token-meta`, `__preview-head`, `__preview-title`, `__preview-facts` y, en las opciones, `__lead`, `__code`, `__main`, `__label` y `__mark` **se retiran**: lo pinta `GSummary.css`. Las filas de acción conservan `__lead`, `__main` y `__label`. `GCombobox.css` solo da sitio y reapunta tonos por estado sobre las partes públicas `g-summary__*` (summary.md, «Clases y datos»).

- **Sitio a la ficha del valor.** `__token` tenía `block-size: fit-content` y ningún ancho; la ficha (`inline-size: 100%` + `contain: inline-size`) medía **0px** (título 0px). Ahora `__token` va con `inset-inline: −space-1` (ancho definido = celda + `space-1` a cada lado, el mismo relleno) y la ficha con `flex: 1 1 0`. Medido (1280, tres motores): celda 234,7px → `__token` 242,7px → ficha 234,7px (tema de auditoría, `space 3`: 245,3 → 251,3 → 245,3). A 240/320/480px de campo, ficha 150/230/390px y título 64/69/125px (Chromium, por defecto).
- **Cómo se ciñe el fondo de «seleccionada».** La ficha toma su ancho del contenedor, nunca del contenido (summary.md: sin eso, la medida de cesión no es estable), así que la caja ya no se encoge a lo que se lee. Decisión: la banda de `--g-color-selection` **cubre la celda entera** (radio `xs`, `space-1` de aire a cada lado). Se lee como lo que es: el valor entero está seleccionado y escribir lo reemplaza. La alternativa (pintar cada parte por separado) deja huecos entre título y datos y la recortan los `overflow` de la ficha; ceñirla de verdad pediría medir en JS o romper la contención de `GSummary`.
- **Contraste sobre la selección** (selectores propios, con el foco): rótulo y valor compartido (`is-same`) de `text-subtle` a `text-muted`. Antes → después, tres motores iguales: por defecto claro **4,48 → 6,56**, oscuro 5,67 → 7,84; tema de auditoría claro 4,51 → 6,60, oscuro 5,60 → 7,75; `spotify` 4,49 → 6,56 / 5,62 → 7,78; `grana` 4,46 → 6,54 / 5,75 → 7,99. La ficha del valor no recibe `diff` (en el campo no hay homónimas): `is-same` se mide marcando un dato a mano; el reapunte cubre una `GSummary` con `diff` en el slot `value`. «+N» (píldora `accent-soft`) desaparecía sobre la banda (la selección del tema por defecto es `accent-soft`): con el foco se perfila con `on-accent-soft`.
- **Texto libre.** La cursiva cuelga ahora de `.is-custom .g-summary__title` (peso de texto, no de título: lo tecleado no es del catálogo); la marca es la línea secundaria de la ficha con borde y `flex: none` (no cede: cede el título con su elipsis). La cursiva volaba sobre el final de su caja y el `overflow: hidden` del título mordía la última letra («miel»): relleno final de `space-1` y margen negativo igual (el hueco no cambia).
- **Opción.** La ficha toma el ancho que deja la marca de elegida (`flex: 1 1 0; min-inline-size: 0`); `__check` se alinea con la línea del título (`body-line`; `body-sm-line` con el campo en `xs`/`sm`, cuando la ficha es `sm`). La **columna de códigos** se conserva sobre `g-summary__code` (`min-inline-size: space × 14`): los títulos CIE-10 empiezan a la misma altura; es un mínimo, un código largo empuja su título. Medido: alto de la ficha 44px (= `body-line + body-sm-line`) a 240, 320 y 480px de campo; datos visibles 1 / 2 / 2 de 4 (por defecto) y 1 / 2 / 3 (auditoría); identificador entero; nada fuera de la fila (contando solo lo que se pinta: un dato que saltó a la línea oculta puede ser más ancho que la corriente).
- **Elegida.** Sin peso extra en el título (la ficha ya lo lleva en todas): la señal no cromática es `check` (combobox.md).
- **Estados.** Activa de A sobre `surface`: tonos de la ficha intactos (rótulo 5,05:1 mínimo). Activa invertida de la paleta: código, línea secundaria, rótulos, valores (también el compartido) y `check` a `inherit`, filetes a `currentColor`; el hueco de icono, el avatar y «+N» llevan su propio fondo y no se tocan (rótulo y dato 15,18:1). Deshabilitada: título, código, línea secundaria y hueco a `text-subtle`. `forced-colors`: los tonos de la ficha con más especificidad que `*` (`is-same`, 0,4,0) pasaban a `CanvasText` sobre `Highlight` en la activa; ahora `HighlightText` (y `GrayText` en la deshabilitada).
- **La vista previa entra desde la lista** (personalidad): con ↑ ↓ la ficha `stack` se vuelve a crear (`key` por opción) y entra con un fundido de `--g-duration-fast` y un desplazamiento de `space × 2` desde el lado de la lista (inicio; en RTL, el otro, `:dir(rtl)`), como si la fila activa se proyectara en el panel. `@starting-style`; con movimiento reducido, solo el fundido.
- **Verificación** (componente real, `auditoria-verificar.mjs` con los selectores de la ficha actualizados): **2415/2415** en Chromium, Firefox y WebKit. Mínimos de contraste en 28 configuraciones (Chromium; 8 en Firefox y WebKit): opción rótulo 5,05, «+N» 4,51, activa rótulo 5,05, ficha del valor rótulo 5,05, ficha seleccionada rótulo / compartido / código / capítulo 6,49, paleta activa 15,18, vista previa rótulo 4,70. Specs `combobox`, `combobox-forma`, `personalidad-combobox` y `summary`: 129/129 (43 por motor), incluidos los tres casos que bruno dejó en rojo.
- **Pendiente para lima (no bloquea):** en la ficha del valor, `GSummary inline` cede el título hasta 4ch antes que el identificador («Daniela C… Exp. 001399 +3» en un campo de 290px). Es el orden del contrato de `GSummary` (el identificador es lo último), pero en el campo la regla anterior era la contraria (el nombre conserva su sitio). Si se quiere el nombre primero en el valor, es una prop o un orden de cesión por anfitrión: decisión de contrato, no de estilo.

## Medidas (banco, tres motores: 1370/1370 comprobaciones)

> **Desde #356**, las filas «C · recorte» y «Fichas de opción» de esta tabla (y el marcado a mano de `estilo-banco.html` y `estilo-verificar.mjs`) son de antes de `GSummary`: mandan las cifras de «Fichas con `GSummary`» y las del componente real en `auditoria-verificar.mjs`. El banco queda como registro del paso 3; no se ha migrado.

| Medida | Resultado |
| --- | --- |
| A · Δ caja–forma (izquierda, arriba, ancho), también hacia arriba | < 1px (0 en los tres motores) |
| A · costura | 0,00px (la línea cae sobre el borde inferior de la caja), por defecto, oscuro y Tema de prueba (borde 2px, space 5) |
| A · anillo | `outline` de la forma = `--g-focus-width` del color de foco; columna izquierda en píxeles sin cortes del campo a la lista; la caja sin anillo ni borde abierta |
| A · punto central del campo | el `<input>` (la zona alta del popover no captura el puntero) |
| A · abrir | Δ0 del campo y del alto del documento |
| A · cambio de lado al desplazar la página | 0 cuadros con la forma rota de 71, con 1 cambio de lado, en los tres motores |
| Fantasma | tinta de lo tecleado en el fantasma frente a la del `<input>`: Δ 0/0/0/0px (DPR 2, LTR y RTL); la prueba detecta 0,5px |
| C · Δ0 de alto con ficha | 0,00px en xs…xl frente a `GInput`, también con el Tema de prueba |
| C · ficha | centrada (±0,5px), su texto empieza donde el del `<input>` (±0,5px) |
| C · recorte | el secundario se recorta desde 350px de campo; la etiqueta, desde 215px (nunca antes que el secundario) |
| Fichas de opción a 240 / 320 / 480px de campo | bloque nombre + datos 44px (≤ 44,5 = `body-line + body-sm-line`), nada desborda, identificador visible; 1 / 2 / 3 de 4 datos (con «Médico» largo); en el playground real (420px), filas de 62px, 2 de 4 datos, 0 desbordes |
| Puntero sobre cinco opciones (ida y vuelta) | como máximo **1** superficie resaltada por cuadro |
| Llegada | ≥ 2 posiciones intermedias, termina en 0, se retira `is-arriving`; desde la cuarta fila (Δy 255–395px) parte acotada a 210,5px y rebasa 8,00px = `space × 2`; con un vector de 600px, igual |
| Despliegue | ≥ 2 alturas intermedias al abrir; cambiar los resultados no anima |
| Paleta 1280 | modal, dentro del visor, cuerpo 384px (`space × 96`), lista/vista 1,20, panel con desplazamiento, cuerpo del diálogo sin desplazamiento, foco en la búsqueda |
| Hoja 375 y 320 (`field` y `palette`) | arriba (top 0) a ancho completo, sin vista previa, filas ≥ 44px (62px), sin desborde, cuerpo sin desplazamiento |
| Fila de tres en `GFormRow` | `--g-form-min: 60`; 1100: en línea (342px); 720 y 320: se parte, el campo nunca < 239px; A funciona a esos anchos; el consumidor lo sobrescribe |
| `forced-colors` (Chromium, Firefox, WebKit emulados) | con `is-token` la ficha se retira y el `<input>` pinta `FieldText`; forma `CanvasText`; anillo `Highlight`; activa `Highlight`/`HighlightText` (también sus datos); fantasma `GrayText`; la coincidencia conserva peso y subrayado |
| Movimiento reducido | sin despliegue, sin giro de la flecha, la ficha no viaja (clase retirada en el acto); fundidos sí |

**Contraste** (mínimo de los 25 temas en Chromium: por defecto claro y oscuro, Tema de prueba, once generados claro y oscuro; en Firefox y WebKit, por defecto y spotify oscuro): todo ≥ 4.5:1 en texto y ≥ 3:1 en el borde de la activa. Mínimos en Chromium: etiqueta 15.2, coincidencia 15.2, rótulo de dato 6.99, fantasma 5.94, código 15.2, grupo 6.99, error de carga 4.51, ficha 15.2, secundario 6.99, marca «Texto libre» 6.99, ficha seleccionada 13.36 / 5.94, activa invertida 15.2, vista previa 13.36 / dt 5.94 (cifras completas en la salida del script).

## Constantes y alias (no son tokens)

- `space × 9` (alto mínimo de fila, el de la caja `md`), `space × 8` / `space × 6` (hueco inicial de las filas de acción = el de la ficha `md` / `sm`), `space × 14` (columna de códigos, sobre `g-summary__code`), `space × 2` (entrada de la vista previa desde la lista), `space × 96` (alto máximo de la lista de A y del cuerpo de la superficie), **6 : 5** (lista : vista previa), `space × 12` (campo de búsqueda, piso 44px). Medidas de diseño derivadas de `space` (tokens.md §32).
- `space × 2 / 0.038`: cota del vector de llegada (rebase máximo `space × 2` con el 3,8 % de `--g-ease-spring`). Alias local `--_cb-tx/ty` (§29.7).
- `/ 2`: geometría (radio de píldora = medio alto; costura centrada). `0.5turn`: media vuelta de la flecha. `2.5`: giro lento con movimiento reducido (el de `GInput`).
- Alias propios `--_cb-row`, `--_cb-r`, `--_cb-tx`, `--_cb-ty`. Lee de `GInput` `--_focus`, `--_radius`, `--_fs`, `--_lh`, `--_gap`, `--_density` y de `GDialog` `--_gap`, `--_inset-radius`.

## Marcado que espera el CSS (para bruno)

- Popup, región viva y superficie **descendientes de la raíz** `.g-combobox` (heredan `--_focus`, `--_radius`…). Variables en línea en `.g-combobox__popup`: `--_x`, `--_top`/`--_bottom` (el otro `auto`), `--_w`, **`--_field-h` = alto de borde a borde de `.g-input__control`**, `--_max` = sitio para la **lista** (sin la caja). `is-up` y las variables, en el mismo cuadro.
- `is-empty` en el popup lo oculta con `display: none` (así la llegada del panel cuenta como abrir y se despliega).
- Llegada: `--_travel-x/y` en `.g-combobox__token` (px, de la caja final de la ficha a su fila); retirar `is-arriving` en `animationend`/`animationcancel` de `g-combobox-arrive`.
- Opción: la `GSummary` es hija directa de `.g-combobox__option` (junto a `__check`); ficha del valor: hija directa de `__token`; vista previa: hija directa de `.g-combobox__preview`, con `key` por opción (entra desde la lista).
- `GCombobox.css` va en `components.css` después de `GInput.css`, `GAvatar.css` y `GDialog.css` (sobrescribe la hoja de `GDialog` con especificidad 0,3,0).

## Para lima (ideas, no bloquean)

- **Resaltado único que viaja** entre opciones (como `GMenu`, #305): coherente con la personalidad de Grana y con las fichas altas. Requiere que bruno entregue `--_active-y/h` del panel; hoy la activa cambia en el acto (una superficie por cuadro, medido).
- La opacidad 0,5 → 1 del prototipo en la llegada, si se quiere recuperar, es una constante de coreografía nueva (§29.6).

## No verificado

`forced-colors` real (solo emulado); lector de pantalla; teclado virtual real sobre la hoja; IME con el fantasma; Safari real; zoom 200/400 % real. La auditoría del componente real (paso 5) con tema distinto y oscuro está en `auditoria.md`.
