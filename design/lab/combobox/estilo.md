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

---

# Fase 2 · `multiple` (coco)

> Contrato: `design/contracts/combobox.md` «Fase 2 · Selección múltiple» (lima, #417 a #428; `tokens.md` §29.1, §29.6, §32; `input.md` N5). Estructura: `r03/` (kiwi; el usuario eligió A por defecto, B como `selection="list"`, C = `palette` + `multiple`). CSS: sección «FASE 2 · VARIAS» de `GCombobox.css` (sin tocar `GInput.css`, `GSummary.css` ni nada de la Fase 1). Banco: `estilo-multiple-banco.html` (componentes reales de `dist/` + marcado del contrato a mano; la receta entra al final de `g-input__support` con `<Teleport defer>`, donde la pondrá N5). Verificación: `GRANA_PW_PORT=4209 node design/lab/combobox/estilo-multiple-verificar.mjs` (con `GRANA_DIST=<copia de dist>` si bruno está compilando).

## Qué le da personalidad (y lo que el CSS protege)

1. **A · la frase.** Lo elegido se *escribe* en la línea del campo («Penicilina, Látex y 3 más»), con el ritmo de `Intl.ListFormat`: sin fichas, sin ×, sin insignia. Una sola línea con el alto de la del campo (**Δ0 medido de 0 a 8 y 40**, en la fila y lo de debajo). Cede **por texto**: «y N más» lleva peso de acción, y su cifra **rueda** desde abajo cuando cambia por un gesto (recortada a su propio hueco: `translate` y `clip-path` con la misma curva, nunca se pinta fuera). Con el foco la frase **se aparta** para el texto que se escribe (≤ 55 % de la celda) y se apaga a `text-muted`: lo elegido sigue ahí, pero el protagonista es la búsqueda.
2. **La casilla salta.** Cada opción lleva una casilla con forma de control (la señal no cromática de «aquí se eligen varias»). Al marcar por un gesto, la marca entra **desde 0,4 con `--g-ease-bounce`** (segundo uso aprobado, §29.1; rebase medido 1,12 en los tres motores); al desmarcar, solo se funde. Es lo único que rebota: un control pequeño que responde con un golpe seco.
3. **Quitar deja huella.** Retroceso marca antes de quitar con **tachado + selección** (en la frase, en «Elegidas» y en el renglón): se ve qué se va a ir y no depende del color. En B y C quitar no cierra el hueco: el renglón se convierte en un **rastro del mismo alto** (Δ0 medido) con el nombre tachado y **«Deshacer» como píldora de acento**, lo único con color del rastro, para que se encuentre sin buscarlo.
4. **B · la receta registra la pasada.** Lo nuevo dice «Nueva» (etiqueta `accent-soft`) y lleva una **barra de acento al inicio** (lógica: a la derecha en RTL); el renglón nuevo **crece desde la línea anterior** (0fr → 1fr, sin medir alturas en JS) y lo de debajo baja con él, sin salto; en la pasada siguiente los rastros **se pliegan** igual, al revés.
5. **C · lo marcado viaja a la cesta.** El renglón llega desde la fila marcada con el muelle de la ficha de la Fase 1 (el mismo uso de #336, vector acotado igual). La cesta es una columna de tarjetas sobre `surface-sunken` en el sitio de la vista previa (6 : 5); el rastro de la cesta es **el hueco de la tarjeta que se fue** (borde discontinuo).

Todo el movimiento ocurre solo tras un gesto (bruno pone y retira las clases) y desaparece con `prefers-reduced-motion: reduce` (medido: ninguna animación `g-combobox-*` y ninguna clase pendiente; se quedan los fundidos de color y opacidad, como la marca de la casilla y la entrada del rastro).

## Decisiones de estilo y desvíos del contrato (para lima)

| Contrato | Ahora | Por qué (medido) |
| --- | --- | --- |
| Estado del tope `warning-soft` / **`warning-text`** | `warning-soft` / **`on-warning-soft`** | `warning-text` solo está garantizado sobre la superficie: sobre el tinte, **4,15:1 en el tema por defecto oscuro**. El par garantizado del tinte llega a 4,66 mínimo en 26 configuraciones |
| Barra de «Nueva» en **`accent`** | **`accent-text`** | Regla transversal de #228: `accent` no es un trazo. Medido: spotify 1,29, amazon 2,14, stripe 2,64. Con `accent-text`: 4,52 mínimo |
| «Deshacer» en **`accent-text`** | **Píldora `accent-soft` / `on-accent-soft`** (al pasar: `accent` / `on-accent`) | El rastro va sobre `surface-sunken`, donde `accent-text` no está garantizado: 4,19 a 4,32 en siete temas generados claros. El par del tinte: 4,51 mínimo, también en la cesta |
| Casilla marcada `primary` / `on-primary` (#430; antes `brand` / `on-brand`) | Relleno `primary`, marca `on-primary`, **contorno `text`** (en la activa invertida de la paleta, contorno `surface`) | `primary` está garantizado como relleno con su par, no como forma ≥ 3:1 sobre la superficie: lustre 1,77 y spotify 1,92 (claro). Con el contorno de tinta, 15,18 mínimo; en el tema por defecto `text` y `primary` son casi el mismo tono (no cambia el aspecto). Cifras tras #430 en el apartado siguiente |
| «Ver los N» (sin color fijado) | `text` con peso de acción | Como «Mostrar más» de la Fase 1; sobre `surface-sunken` (la cesta) `accent-text` tampoco estaría garantizado |

Ninguno añade tokens; los cuatro usan pares que el motor ya garantiza.

### Casilla marcada tras #430 (`primary` / `on-primary`), Chromium, `estilo-multiple-verificar.mjs`

971/971 comprobaciones, 28 configuraciones (por defecto, auditoría del CLI con `brand` sola, auditoría del CLI con `primary` propia —`auditoria-tema-primary.json`, `brand` #0F5C5C y `primary` #7D1230—, y los once temas generados, claro y oscuro). Contorno `text` contra `surface` (casilla elegida) · contorno `surface` contra el fondo `text` de la activa invertida · marca `on-primary` contra relleno `primary` (todo ≥ 3:1):

| Tema | Contorno `text` / `surface` | Contorno `surface` / activa invertida | Marca `on-primary` / `primary` |
| --- | --- | --- | --- |
| Por defecto claro / oscuro | 17,40 / 15,22 | 17,40 / 15,22 | 16,48 / 16,19 |
| `lustre` claro / oscuro | 17,38 / 15,23 | 17,38 / 15,23 | 10,27 / 10,27 |
| `spotify` claro / oscuro | 17,41 / 15,31 | 17,41 / 15,31 | 9,45 / 9,45 |
| `primary` propia (CLI) claro / oscuro | 17,37 / 15,18 | 17,37 / 15,18 | 10,49 / 4,90 |

Mínimos de las 28 configuraciones: contorno 15,18, activa invertida 15,18, marca **4,70** (`linear` y `stripe` claros; antes de #430, con `on-brand` sobre `brand`, el par era el mismo salvo en temas con `primary` propia). Casilla sin marcar (contorno `border-control` contra la fila): 3,43 a 4,35. Con `primary` propia la casilla ya sigue a la acción principal y no a la marca. Pruebas: `npx vitest run src/tokens/roles.test.js` pasa (2/2).

## Constantes y alias (no son tokens)

- **Proporción frase/texto con el foco: 55 %** de la celda como máximo para la frase (la de kiwi en r03); el `<input>` toma el resto (base 0: no compite por su ancho intrínseco). Medido: con tres elegidas en 240px, la frase cede a «Penicilina y 2 más» y ocupa el 41 %.
- **Casilla:** `space × 5` (× 4 con el campo `xs`/`sm`, cuando la ficha es `sm`), el tamaño de `GCheckbox md`/`sm`; marca al **0,72** de la casilla (la proporción de `GCheckbox`); centrada en la línea del título (`body-line`; `body-sm-line` con la ficha `sm`): Δ ≤ 1px medido. Alias `--_cb-box`, `--_cb-line`.
- **Renglón (B y C):** alto mínimo `--_cb-rowh` = `body-line + body-sm-line + space × 2` (la `GSummary row` de dos líneas `md` + `space-1` arriba y abajo): **52px** en el tema por defecto (50px en el de auditoría). El rastro toma el mismo mínimo, por eso mide igual. Columnas fijas (número · ficha · «Nueva» · botón): una pieza ausente deja su pista en 0. Número en `space × 5` de ancho, cifras tabulares.
- **Barra de «Nueva»:** `--g-focus-width` de ancho (la de la activa del prototipo).
- **Cesta:** 6 : 5 frente a los resultados (la proporción de la vista previa que sustituye); medido 1,200.
- **Cifras:** el hueco de la cifra (100 %) es la geometría del giro; escala 0,4 de la casilla (§29.6); cota del viaje `space × 2 / 0.038` (la de la Fase 1, alias `--_cb-tx/ty`).
- Keyframes nuevos: `g-combobox-roll`, `g-combobox-tick`, `g-combobox-row-in`, `g-combobox-row-out` (el viaje reutiliza `g-combobox-arrive`). Ninguno empieza por `g-reject`.

## Lo que el CSS espera del `.vue` (para bruno)

- Raíz: `g-combobox--multiple`, `g-combobox--selection-{inline|list}`, `has-chosen`, `is-full` (además de las de la Fase 1; el tamaño por `g-input--size-*`).
- **Frase:** `span.g-combobox__sentence` **hijo directo de `.g-combobox__value` y antes del `<input>`**; dentro, solo `__sentence-item` / `__sentence-sep` / `__sentence-rest` como hijos directos, en el orden de `formatToParts`. El icono del texto libre, un `GIcon` con clase `g-combobox__sentence-icon` dentro del elemento. **Medida:** el primero solo se recorta cuando va solo (o solo con «y N más»); mientras haya varios, ninguno encoge y **la frase desborda** (`scrollWidth > clientWidth`): esa es la lectura para ceder uno más. Observar con `ResizeObserver` **la propia frase** (su máximo cambia del 100 % al 55 % con el foco y al abrir), no solo la celda. La marcada por Retroceso se saca a la vista ocupando el último sitio visible. Con elegidos en `inline`, el placeholder se oculta por CSS (no hace falta quitarlo).
- **Cifra:** `span.g-combobox__num` (es `inline-block`); `is-rolling` en ella; la animación corre **en la propia cifra**.
- **Casilla:** `span.g-combobox__box` **hijo directo de la opción** y primero; la marca, un `GIcon` (`svg.g-icon`) **hijo directo** de la casilla. `is-ticking` en la casilla; la animación corre **en el icono** (su `animationend` sube a la casilla). Para saber si hay animación calculada, filtrar `getAnimations()` por `animationName` con el prefijo: el icono tiene además una **transición** de opacidad, que no cuenta.
- **«Elegidas»:** `ul.g-combobox__group.is-chosen > li.g-combobox__group-label` con `span.g-combobox__group-tally` (la cifra dentro, en `__num`); la fila «Ver las N» es hija directa del grupo.
- **Renglón:** `li.g-combobox__row` con hijos directos `__row-number`, la `GSummary` (o el contenido del slot `chosen`, sin envoltura o con una; va a la pista flexible), `__row-fresh`, `__remove`; rastro: `__trace` + `__undo`. **`--_travel-x/y` e `is-arriving` en el `li`** (la animación corre en él). `is-entering`/`is-leaving` también en el `li`; retirar por `animationend` de `g-combobox-row-in`/`-row-out`/`g-combobox-arrive`, o en el acto si no hay animación calculada con ese prefijo (con `reduce` no la hay). Un `li` con las dos clases (`is-entering` + `is-arriving`) anima las dos.
- **Receta:** `div.g-combobox__chosen` como contenido del slot interno `below` (último hijo de `g-input__support`) con `ul.g-combobox__rows` y `button.g-combobox__rows-all` (el chevron, un `GIcon` dentro; gira con `aria-expanded="true"`).
- **Cesta:** `section.g-combobox__basket` **hermana de `.g-combobox__panel` dentro de `.g-combobox__surface-body.has-basket`** (segunda columna), con `h3.g-combobox__basket-title` (y `__basket-tally` dentro), `__basket-empty` o `ul.g-combobox__rows`, y `__rows-all`.
- **Pie:** `div.g-combobox__foot` como **último hijo del cuerpo del diálogo** (`.g-dialog__body`, columna flex sin relleno en la superficie), no en el `footer` de `GDialog` (pondría su propio relleno); `__foot-tally` y el `GBtn` con clase `g-combobox__done`.
- Estado del tope: `p.g-combobox__status.g-combobox__status--max` en el panel, fuera del `listbox`, con el `GIcon` `triangle-alert`.
- Con `multiple`, no pintar `__check` (no hay regla que lo oculte).

## Medidas (banco, tres motores: 1389/1389 comprobaciones)

| Medida | Resultado |
| --- | --- |
| A · Δ0 en una `GFormRow` de 0, 1, 2, 3, 5, 8 y 40 elegidas | caja, raíz, vecina y lo de debajo: **0,00px** en los tres motores; también 0 / 8 / 40 en los 26 temas medidos |
| A · la frase | una línea (alto = el de la línea del campo), todos los trozos a la misma altura, dentro de la celda, sin desbordar tras ceder, «y N más» desde 5 |
| A · con el foco | frase ≤ 55 % (41 % con tres en 240px), `text-muted`, el `<input>` ≥ 45 % |
| A · cesión | 40 elegidas: «Penicilina, Látex y 38 más»; estrecho (200px) con el primero largo: solo el primero, con elipsis, + «y 2 más» |
| A · tamaños | alto de la caja = `GInput` en `xs`…`xl` |
| Casilla | `space × 5`, centrada en la línea del título (Δ ≤ 1px), marca 0,72 visible solo en la elegida; rebote: escala desde 0,4 hasta un pico de 1,12 en Chromium, Firefox y WebKit |
| «Elegidas» | primer grupo, rótulo en `text`; 12 filas + «Ver las 13» dentro del grupo |
| Tope | estado con icono fuera del `listbox`, `is-full`, casillas de las no elegibles con `border` |
| B · receta | último hijo de `g-input__support`; en su columna sin pisar a la vecina; renglón 52px; agregar: caja, etiqueta y vecina Δ0, lo de debajo baja **52px** (= un renglón), con alturas intermedias; rastro **Δ 0,00px** de alto y de posición; pasada: el rastro se pliega con alturas intermedias y «Nueva» se retira; tope 6 y «Ver los 8» con el chevron girado |
| B · áreas | «Quitar» 24 × 24, «Deshacer» y «Ver los N» ≥ 24 de alto; con puntero grueso (Chromium táctil) los tres ≥ 44 × 44 |
| C · cesta | 6 : 5 (1,200), sin solapes ni desborde horizontal, pie dentro y bajo el cuerpo, «Listo» `GBtn`; homónimos marcados en la cesta; viaje con `g-combobox-arrive` y `--g-ease-spring` (posiciones intermedias), clases retiradas |
| Hoja 375 y 320 | hoja común con «Elegidas», sin cesta, opciones ≥ 44px, sin desbordamiento, «Listo» a la vista |
| RTL | la frase empieza en el borde de inicio (Δ < 0,6px); barra de «Nueva» a la derecha; número, casilla y cesta en espejo |
| Movimiento reducido | ninguna animación `g-combobox-*` (casilla, cifras, renglón, pliegue, viaje), ninguna clase pendiente; el fundido de la marca se queda |
| `forced-colors` (emulado en los tres motores, L42) | casilla `CanvasText`, marcada `Highlight` con la marca `HighlightText` (en la activa, invertida); Retroceso: `Highlight`/`HighlightText` + tachado (frase y renglón); «Nueva» por su texto con borde `CanvasText`; barra `CanvasText`; rastro `CanvasText` tachado |
| Fase 1 intacta | estilos calculados de todos los elementos del combobox del playground real (reposo, `field` abierto, paleta abierta; 2083 elementos) con y sin la sección de la Fase 2: **0 diferencias** en los tres motores |

**Contraste** (mínimo de 34 configuraciones: por defecto y tema del CLI de `auditoria-tema.json`, claro y oscuro, en los tres motores; los once temas generados claro y oscuro en Chromium): frase 15,18 · con el foco 7,94 · «y N más» 15,18 · marcada por Retroceso 13,65 · lápiz 7,38 · «Elegidas» 15,18 · recuento 7,38 · **casilla: borde 3,43, contorno marcada 15,18, marca 4,70, en la activa invertida 15,18** · tope 4,66 · número 7,38 · «Nueva» 4,51 · barra 4,52 · rastro 6,87 · «Deshacer» 4,51 (también en la cesta) · renglón marcado 13,65 · «Quitar» 7,38 · «Ver los N» 15,18 · cesta: título 16,06, recuento 6,87, vacía 6,87 · pie 7,38.

## Pendientes

- **lima:** registrar los cuatro desvíos de la tabla de arriba en `combobox.md` §«Tokens (Fase 2)» y `tokens.md` §32 (siguen sin tokens nuevos). **Hueco:** el rastro mide lo mismo que el renglón porque los dos toman el alto de la `GSummary` de dos líneas; un slot `chosen` más alto que dos líneas haría el rastro más bajo (Δ ≠ 0). Si se quiere garantizar con cualquier slot, el `.vue` tendría que escribir el alto medido del renglón en línea al convertirlo (p. ej. `--_row-h`, §29.5); hoy el contrato dice «sin interactivos» pero no limita el alto.
- **bruno:** lo de «Lo que el CSS espera del `.vue`». Auditoría del componente real (paso 5): `design/lab/combobox/auditoria-multiple.md`.

## No verificado

`forced-colors` real (solo emulado), lector de pantalla, táctil real y teclado virtual sobre la hoja, Safari real, zoom 200/400 %. El banco no es el componente: la cesión, la pasada y el viaje los hace aquí un modelo mínimo; la medida por lotes real y la compuerta de rendimiento son de bruno.
