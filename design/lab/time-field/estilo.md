# Entrega de coco · GTimeField.css

**Archivo:** `packages/vue/src/components/GTimeField/GTimeField.css`. **`defaults.css` sin cambios:** ningún token nuevo (#412, `tokens.md` §37). **`GInput.css` sin cambios** (#400: lo propio va aquí).
**Contratos:** `design/contracts/time-field.md` (DECISIONS.md #400 a #414; concepto A «La hora dicha», #407), `design/contracts/input.md`, `design/contracts/form.md` §2, §4 y §8, `docs/contract/tokens.md` §7, §29 y §37. **Estructura:** `design/lab/time-field/r01/` y `r02/?c=A` (kiwi).
**Estado:** listo para bruno (el `.vue` se escribe a la vez) y para la auditoría (paso 5) sobre el componente real.
**Banco:** `design/lab/time-field/estilo-banco.html`. El CSS se carga **dentro de la capa `grana.components`, después de `GInput`**, como lo registrará `components.css`. La caja es el **`GInput` real de `dist/`** con sus slots internos `field` y `end` (los mismos que usa `GNumberField`); los vecinos (`GForm`, `GFormLayout`, `GFormRow`, `GDatePicker`, `GSelect`) son los reales. `XTimeField` emite el marcado **exacto** del contrato («Estructura accesible», «Clases y datos») y hace solo lo que el estilo necesita, con el motor de referencia de kiwi (`engine.js`, `Intl` + franjas de CLDR). Secciones: tamaños junto a `GInput`, estados, las dos lecturas (ancho, estrecho, `xs`), fila real a 1100/720/320, RTL `ar-EG` y 320, mínimo de referencia. Controles: tema (por defecto, **propio** generado con `@grana/cli` y los once de `dark-color-presence/generated/`), oscuro, lento ×5, rechazo (I2). Parámetros `?dark=1`, `?theme=propio|<nombre>`, `?slow=1`.
**Tema propio de esta entrega:** `estilo-tema.json` → `estilo-tema.css` (`node packages/cli/bin/grana.mjs theme design/lab/time-field/estilo-tema.json --out design/lab/time-field/estilo-tema.css`: brand `#2F4B3A`, accent `#B4532A` terracota, neutros teñidos, radius 10, **space 5**, fontSize 16, **borde 2px**; claro y oscuro).
**Verificación:** `GRANA_PW_PORT=4209 node design/lab/time-field/estilo-verificar.mjs` (Chromium, Firefox y WebKit; `GRANA_DIST=<copia de dist/>` para no depender de un build en curso) → **13160/13160**.

## Personalidad (lo que lo hace distinto)

Los campos de hora tratan a. m./p. m. como un interruptor que hay que acordarse de tocar. `GTimeField` **devuelve la hora dicha**: el CSS pone la franja del día en palabras **pegada al número**, como se escribe en una nota («9:30 · de la noche»), y la hace **entrar** cuando cambia. Sin tokens nuevos, con `--g-duration-press` + `--g-ease-out`, **quieto con `prefers-reduced-motion: reduce`**:

| Pieza | Qué hace el CSS | Por qué es de Grana |
| --- | --- | --- |
| **La hora mide su texto** | La celda `__value` es una rejilla de una celda: espejo invisible (misma tipografía, `tabular-nums`, `1px` de cursor) y `<input>` superpuestos; el `<input>` no aporta ancho. La lectura, el sufijo y el `output` quedan **al `gap` de la caja** detrás de la hora; el hueco libre queda al final, antes de a. m./p. m. | «21:30 de la noche CDMX» se lee de un tirón aunque la fila haga la caja ancha; en un campo genérico la zona se iría al otro extremo |
| **La franja en palabras, sin quitar sitio** | `__reading` parte de **0** y crece hasta su ancho natural (`flex: 1 1 0` + `max-inline-size: max-content`); su separación va **dentro** (`::before`) y cancela el `gap` de la caja con margen negativo (el patrón de `.g-input__output:empty`). Resultado: la lectura se recorta con elipsis y, sin sitio, **desaparece entera**, separación incluida, antes de que la hora ceda un solo píxel. **Todo o nada** (auditoría, hallazgo 1): la lectura es una línea que envuelve (`flex-wrap`) con el alto del texto y recorte; la hora entendida entra entera o baja a una segunda línea invisible, y la palabra se recorta con elipsis solo hasta su mínimo legible (`--_fs × 2`, una sílaba y la elipsis) y por debajo también baja: nunca asoma medio glifo ni una hora a medias («9:3») | Lo redundante (la franja ya está en `aria-valuetext`) cede siempre; lo escrito nunca. Y el mínimo publicado (#410) no tiene que contarla |
| **La hora entendida mientras se escribe** | `__reading-time` («930» → «9:30») antes de la palabra, separada por `--g-space-1` (el ancho de un espacio; sin puntuación de adorno), cifras tabulares, en `text-muted` | Se ve qué entendió el campo antes de salir |
| **La palabra entra** | `is-entering` (el nodo se crea de nuevo cuando la franja cambia con el foco): sube `--g-space-1 × 1` desde abajo y aparece (`g-time-reading-rise`, `backwards`) | El cambio de «de la mañana» a «del mediodía» al cruzar las 12:00 con ↑ se **nota** justo donde se mira |
| **Las dos lecturas aparecen** | El par (`__choices`) aparece con fundido (`g-time-reading-fade`) y su **texto** sube con `g-time-reading-rise`. Se separan a propósito: los botones van de borde a borde y su fondo no puede salir de la caja al trasladarse | Misma voz que la palabra; ningún fondo asoma fuera de la caja |
| **a. m./p. m. y las lecturas son parte de la caja** | Del alto de la caja, de borde a borde (margen negativo del borde real), separados por líneas `border-control`; su trazo de bloque y final es transparente y cae sobre la línea de la caja (también el doble del error y el discontinuo de la advertencia). Un **solo pulsado** para los dos pares: `accent-soft` / `on-accent-soft` **y** `--g-text-action-weight` | La mitad del día se lee como una sílaba más de la hora, no como un interruptor aparte |

Lo que **no** hace (a propósito): ni `--g-ease-spring` ni `--g-ease-bounce` (§29.1: es una entrada), ninguna animación al montar, al escribir cifras que no cambian la franja ni al cambiar el valor desde la aplicación sin foco; ninguna regla para `is-rejected` (la sacudida I2 es la de `GInput` y ya mueve `g-input__row` con los botones dentro); ningún estilo de `:invalid`/`:user-invalid` (#409).

## Medidas (de tokens; constantes de diseño, no tokens nuevos)

| Medida | xs | sm | md | lg | xl | md compact | xs compact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Alto de a. m./p. m. y de las lecturas (= `--_h` de `GInput`, piso 24px) | 24 | 28 | 36 | 44 | 52 | 27 | 24 |
| Ancho de «p.m.» (`es-MX`; piso `max(24px, --_h)`, relleno = `gap` de la caja) | 35,6 | 39,2 | 47,2 | 50,8 | 58,8 | 43,2 | 33,6 |
| Con `pointer: coarse` (alto × ancho mínimo) | 44 | 44 | 44 | 44 | 52 | 44 | 44 |
| Lectura–hora (= `calc(--_gap × --_density)`; la tinta, + 1px del cursor) | 4 | 4 | **8** | 8 | 12 | 6 | 3 |

Con el tema propio (`space` 5): alto 30 · 35 · 45 · 55 · 65; lectura–hora 5 · 5 · **10** · 10 · 15.

- **Lectura:** tamaño y línea del texto escrito del tamaño (`--_fs`, `--_lh`), en la **misma línea base** que la hora (Δ ≤ 0,5px medido), `text-muted`; `text-subtle` con el campo deshabilitado; cursor de escribir (pulsarla enfoca el campo), `not-allowed` deshabilitado.
- **Botones:** relleno en línea = `gap` de la caja; texto `text-muted` en reposo, `text` sobre `neutral-soft` al pasar y pulsar (`:active`), pulsado `on-accent-soft` sobre `accent-soft` + peso; transición de color y fondo `--g-duration-fast` + `--g-ease-standard`; deshabilitado `text-subtle` (pulsado: sobre `neutral-soft`, conserva el peso) y separador `border-strong`; anillo de seguridad **por dentro** con `--g-focus-width` y el color de foco del campo.
- **Entrada:** `--g-space-1 × 1` (4px; 5px con `space` 5), `--g-duration-press` (160ms) + `--g-ease-out`: medido 10 cuadros con 4 posiciones intermedias en los tres motores, termina en su sitio con opacidad 1.

## Mínimo de referencia (#410), `md`, `space` 4

> **Auditoría (paso 5):** estas cifras se midieron sin `dist/fonts.css` (el banco de estilo no carga la fuente servida). Con Instrument Sans servida, el componente real publica **180px** en 12 h y **65px** en 24 h (`md`, `space` 4), comprobados al píxel en una `GFormRow` real; ver `auditoria.md`.

| Campo | Mínimo | Texto de referencia | a. m./p. m. (copias) |
| --- | --- | --- | --- |
| 12 h `es-MX` | **186px** | «12:59 p.m.» 71,77px (+ 1px del cursor) | 92,78px (con el peso de pulsado y el borde final) |
| 12 h `es-MX`, **solo lectura** | **186px** (igual: desbloquear no reparte la fila) | ídem | no se pintan pero cuentan |
| 24 h `es` | **66px** (por debajo de cualquier clase de tamaño: no cambia nada) | «10:59» 39,69px | — |
| Tema propio (`space` 5, borde 2px): 12 h · 24 h | 203px · 74px | | 103,78px |

**Por posiciones**, como pide #410: lo de antes de la celda (borde + relleno + prefijo) + el texto de referencia más ancho con el hueco del cursor + lo de después **sin la lectura y sin el hueco libre** (sufijo, `output` y sus separaciones; con a. m./p. m., el `gap` que los separa) + las copias de a. m./p. m. de `__measure`. Comprobado al píxel: con ese ancho la hora más ancha cabe entera y la lectura mide 0; con 1px menos (descontando el peso de pulsado que las copias cuentan en las dos mitades, < 1px), ya no. kiwi estimó ≈ 224px para su prototipo de C con `--g-form-min: 56`; el intrínseco real es 186px y el efectivo lo sube la clase o `--g-form-min`.

## Contraste (`estilo-verificar.mjs`, 26 temas: por defecto, propio y once generados, claro y oscuro)

| Tema | Palabra | Hora entendida | Botón en reposo | Pulsado | Al pasar | Separador |
| --- | --- | --- | --- | --- | --- | --- |
| Por defecto claro | 6,54 | 6,54 | 6,90 | 5,00 | 15,27 | 3,03 |
| Por defecto oscuro | 7,83 | 7,83 | 8,59 | 4,52 | 13,87 | 3,93 |
| Propio claro | 6,51 | 6,51 | 6,87 | **4,51** | 15,20 | **3,00** |
| Propio oscuro | 7,85 | 7,85 | 8,57 | 4,57 | 13,90 | 3,94 |
| **Mínimo en los 26** | **6,49** | **6,49** | **6,87** | **4,51** | **13,85** | **3,00** |

Palabra, hora entendida y botones ≥ 4,5:1 (texto); separador ≥ 3:1 (delimita un control) sobre la superficie, `neutral-soft` y `accent-soft`. El pulsado vive del par del tema (`on-accent-soft` / `accent-soft`), que el CLI garantiza ≥ 4,5:1: en el tema propio queda en el límite (4,51). **El pulsado no depende del color:** lleva el peso de acción (500 frente a 400, medido).

## Decisiones de CSS

- **Alias propios `--_tf-border` y `--_tf-stroke`** (prefijo `--_tf-`): el borde real que los botones tapan con margen negativo (`bw`, ×2 en advertencia y en el error con colores forzados) y el trazo visible (×2 en error por el `box-shadow` interior de `GInput`, ×2 en advertencia). Lee de `GInput` solo `--_h`, `--_fs`, `--_lh`, `--_radius`, `--_focus`, `--_gap` y `--_density`.
- **La hora escrita no cede su sitio a las dos lecturas sin compactar:** con `has-choices` y sin `data-compact`, la celda no encoge (`:has()`); si el par no cabe, desborda y el `.vue` lo detecta y pone `data-compact`. Compactado, la celda vuelve a poder encoger (el par ya es lo más corto: «9:00» · «21:00»). Medido: en 180px y en `xs`, el par compacto cabe, ≥ 24px, y la hora escrita sigue entera.
- **`__measure` anclado al final de la caja** (la caja lleva `position: relative`): si alguna vez es más ancho que ella, lo que sobra cae hacia el inicio, que nunca genera desplazamiento de página. Lleva `display: flex` (texto + copias en fila), el mismo `1px` de cursor que el espejo y **las copias de a. m./p. m. con el peso de pulsado** (el mínimo cuenta la mitad más ancha).
- **Sin `text-align: match-parent`:** a diferencia de `GNumberField` (`dir="ltr"` siempre), aquí el `<input>`, el espejo y la lectura llevan el `dir` del idioma (#403) y la celda mide el texto, así que la alineación de inicio coincide en los tres motores (RTL `ar-EG` medido: a. m./p. m. al final lógico, la lectura a la izquierda de la hora a 8px, sin desplazamiento con el cursor al final).
- **`forced-colors`:** botones `ButtonText` con separador visible; pulsado `Highlight` / `HighlightText` **con `forced-color-adjust: none`** y el separador en `ButtonText` explícito (sin él, Chromium pinta la placa de `Canvas` detrás del texto y `HighlightText` queda invisible: medido y corregido); deshabilitado `GrayText` sobre `Canvas` (el pulsado conserva el peso); al pasar, el texto en `Highlight`; lectura `CanvasText`; anillo `ButtonText` (`HighlightText` sobre el pulsado).
- **Lectura todo o nada (auditoría, hallazgo 1):** `__reading` lleva `flex-wrap: wrap`, `block-size` y `row-gap` iguales a `--_lh` y `clip-path: inset(calc(var(--g-space-1) * -1) 0)` en vez de `overflow-x: clip`: lo que no cabe entero baja a una segunda línea que queda fuera del recorte; el recorte en bloque se abre `--g-space-1` por fuera para que la entrada (que sube desde `--g-space-1`) no se corte. `::before` ya no encoge (`flex: none`) y `__reading-word` lleva `flex: 1 1 calc(var(--_fs) * 2)` + `max-inline-size: max-content`. Coste aceptado: en la franja de anchos en que la palabra no llega a su mínimo, el hueco que ocupaba queda en blanco (como mucho `gap + 2 × --_fs`, 36px en `md`) y el sufijo o el `output` siguen detrás de él.
- **#383/#394:** ningún selector toma hijos por estructura; solo clases propias (`:last-child` solo entre los botones propios de `__halves`, `__choices` y `__measure`, donde no entra contenido de la aplicación).
- **Selector de relleno final:** `.g-input.g-time-field--h12:not(.is-readonly)` y `.g-input.g-time-field.has-choices` sobre `> .g-input__row > .g-input__control` (especificidad mayor que el relleno de `is-warning` de `GInput`).

## Lo que el CSS espera del `.vue` (bruno)

Además de «Clases y datos» del contrato:

1. **`__reading` como hermano de `__value`** en el slot `field`, detrás de ella y antes del oculto; dentro, `__reading-time` (si toca) y `__reading-word` **sin texto entre ellos** (la separación la pone el CSS).
2. **`is-entering` solo al crear el nodo por un cambio de franja con foco:** recordar la **última franja vista** durante el foco aunque el texto pase por un estado sin hora («12:3» mientras se corrige «12:30» → «12:35»), si no la palabra se va y vuelve a entrar; y un nodo que se crea por otra razón (vuelve a haber valor sin foco) nace **sin** la clase. Si se retira `is-entering` con `animationend`, filtrar por el prefijo `g-time-reading`.
3. **`data-compact`:** los botones tapan el borde final de la caja (margen negativo), así que **ese borde ya cuenta como desborde**: comparar `scrollWidth > clientWidth + borde final + 0,5` del control (con `scrollWidth > clientWidth` a secas, con borde ≥ 1px el par se compactaría siempre). Medir con el atributo quitado.
4. **`__measure`**: el texto de referencia como **primer** hijo (líneas separadas por `\n`), y en 12 h las dos copias `span.g-time-field__half` (con `__half-text` si se quiere) **detrás**, también en `readonly`. Su ancho total = texto + copias + 1px de cursor. En `readonly` de 12 h, el mínimo se calcula como si los botones estuvieran (el relleno final y el borde de la caja se cambian por el `gap` y las copias, que llevan el borde final): así el de solo lectura es igual al editable (medido, 186 = 186).
5. **El mínimo por posiciones, sin la lectura:** la lectura colapsa a 0 con su separación incluida, así que «lo de después» empieza en el sufijo/`output` o en el `gap` antes de a. m./p. m.; no restar la lectura «medida» con su `gap` (ya está cancelado).
6. Pulsar el área vacía o la lectura enfoca el campo: el CSS solo da el cursor (`text`; `not-allowed` deshabilitado); la escucha en `g-input__control` es del `.vue` y excluye `__halves`/`__choices`.

## Huecos de contrato (para lima)

1. **Dos keyframes en vez de «mismas keyframes»:** el contrato pide que las dos lecturas aparezcan «igual» que la palabra. Con `translate` sobre `__choices`, el fondo pulsado y los separadores (de borde a borde) se salen de la caja 4px durante la entrada. Se separa en `g-time-reading-rise` (el **texto** de las lecturas y la palabra) y `g-time-reading-fade` (el **par**, solo opacidad); mismos tokens y misma duración. Anotar en `time-field.md` «Movimiento» y `tokens.md` §37 (prefijo `g-time-reading…` intacto).
2. **Hueco del cursor de 1px en WebKit:** con el cursor al final, WebKit desplaza 1px la hora en algunos anchos (medido aparte en «21:30» `md`, `lg` y `xl` y «9:30 p.m.» `xl`; el verificador lo comprueba en `t24-xl` y lo anota), el mismo **hallazgo 1 abierto de `GNumberField`** (`PENDIENTES.md`; arreglo medido allí: 2px). La constante es de #313/§7: no la cambio sin enmienda; si lima la sube a 2px, son dos líneas aquí (`__mirror` y `__measure`) y el mínimo sube 1px.
3. **`data-compact` y el borde final** (punto 3 de arriba): la regla «`scrollWidth > clientWidth` del control» del contrato (§A3) es falsa en positivo con cualquier borde; precisar «menos el borde final que tapan los botones».
4. **Copias de a. m./p. m. con peso de pulsado** en `__measure` (decisión de coco): el mínimo sobrecuenta < 1px frente al estado real para no quedarse corto nunca. Anotar en #410 si se quiere fijar.

## Verificación (`estilo-verificar.mjs`, Playwright, Chromium, Firefox y WebKit: 13160/13160)

**Estático:** solo `var(--g-*)` y `--_*` (los de `GInput` y `--_tf-*`), sin respaldos, sin `@layer`, `@property` ni `!important`, sin colores literales, sin `:invalid`/`:user-invalid`, medidas literales solo `24px`, `44px` y `1px` (texto oculto y cursor), factores `−1`, `1` y `2`; keyframes `g-time-reading-*` (nunca `g-reject…`), toda `animation` dentro de `prefers-reduced-motion: no-preference`, `:hover` dentro de `(hover: hover)`, sin muelle ni rebote, sin selectores de hijos por estructura (#383).
**Contraste:** tabla de arriba, con las dos lecturas a la vista (se escribe «9»), en 26 temas y tres motores.
**Geometría** (defecto, oscuro y propio): a. m./p. m. del alto de la caja en los siete tamaños y de borde a borde (también con error, advertencia, soft, pill, válido, deshabilitado), la última esquina = la de la caja, relleno final 0; la caja igual a `GInput`; lectura–hora = `gap` por tamaño y en la línea base; sufijo y `output` al `gap` detrás de la lectura; solo lectura sin botones y con lectura; vacío sin pulsado y p.m. pendiente pulsada; el pulsado pesa más; cursores; `tabular-nums` en campo, espejo y medidor; medidor fuera de flujo, invisible, con la tipografía del campo y las copias con peso.
**Filas reales** con `GDatePicker`, `GInput` y `GSelect` (y 12 h con ayuda junto a un `GInput` con error): **Δ `top` ≤ 1px y misma altura** a 1100/720 y a ventanas de 1280/720/480/360/320; sin desborde de página; 12 h con segundos (`en-US`, «12:30:00 AM») dentro de la caja a 320.
**Las dos lecturas:** aparecen con «9» (24 h), la tomada pulsada, `has-choices`, sin lectura, de borde a borde, la hora escrita entera; estrechas → `data-compact` con la hora visible, ≥ 24px, sin desbordar; un toque en «de la noche» deja «21:00», el foco en el campo y el par se va.
**Pasar y pulsar:** `neutral-soft` + `text` al pasar; el pulsado `accent-soft`; pulsar no mueve el foco (`pointerdown` + `preventDefault`); anillo interior si una tecnología de apoyo enfoca el botón; pulsar la lectura enfoca con el cursor al final.
**Movimiento:** nada al montar; la palabra entra al cruzar las 12:00 con ↑ (10 cuadros, 4 posiciones intermedias, de 4px a 0, en los tres motores); nada al escribir cifras sin cambiar la franja ni desde la aplicación sin foco; las lecturas aparecen (fundido del par y subida del texto); **con `reduce`, 0 animaciones** (palabra, lecturas e I2). **I2:** una sola animación (`g-reject-shake` en `g-input__row`) y a. m./p. m. van con la fila.
**Foco + cursor al final:** sin desplazamiento en Chromium y Firefox (RTL incluido); WebKit 1px en `t24-xl` (hueco 2 de lima, anotado, no cuenta como fallo).
**`forced-colors`** (Chromium, claro y oscuro): botones y separador visibles, pulsado `Highlight` con `forced-color-adjust: none` y peso, deshabilitado `GrayText`, lectura `CanvasText`, error con los botones sobre el borde real. **Táctil** (Chromium y WebKit, `pointer: coarse`): a. m./p. m. y lecturas ≥ 44×44 (52 en `xl`), cajas ≥ 44 e iguales a `GInput`. **Escalas** 1,25/1,5/2: separador ≥ 1 píxel de dispositivo. **Consola** limpia.

## Lo que NO se verificó

- El **componente real** (`GTimeField.vue` de bruno aún no existe al entregar): lo hará la auditoría (paso 5) en `design/lab/time-field/auditoria.md`, con un tema distinto, el mínimo **publicado** de verdad en una `GFormRow` y la receta «Fecha y hora».
- `forced-colors` en Firefox y WebKit, puntero grueso en Firefox (Playwright no los emula); Windows con contraste alto real, Safari, iOS/Android reales (teclado numérico, toque en a. m./p. m. sin abrir el teclado); zoom 200/400 %; franjas de CLDR de Safari real; idiomas cuya franja ya está en el texto («晚上9:30», sin lectura: lo decide el `.vue`).
