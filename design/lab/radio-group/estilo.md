# Entrega de coco · GRadioGroup.css

**Archivo:** `packages/vue/src/components/GRadioGroup/GRadioGroup.css`. **`defaults.css` sin cambios:** no hace falta ningún token nuevo (#273, `tokens.md` §25); todo sale de los tokens de campo, de la casilla y de la tarjeta de `GCheckbox`.
**Contratos:** `design/contracts/radio-group.md` (DECISIONS.md #267 a #273), `docs/contract/tokens.md` §23.2 y §25. **Estructura:** `design/lab/radio-group/r01/` (kiwi).
**Estado:** listo para bruno (`GRadioGroup.vue`, pruebas, `meta.json`, registro en `components.css`, fila en `tests/form-distribution.spec.mjs`).
**Banco:** `design/lab/radio-group/estilo-banco.html` (desde la raíz, `python3 -m http.server 4190`). La fábrica `rg()` emite el marcado **exacto** del contrato (raíz `div`/`fieldset` por apariencia, clases, atributos y partes); las filas usan el reparto real de `GFormRow` (`formRowPlan.js`) con el mínimo intrínseco del segmentado, y el segmentado se mide y se apila como dice #271 (con `g-radio-group--measure`). Nueve secciones: las cinco apariencias, tamaños junto a `GInput`, `GFormRow` (con y sin mensajes, etiqueta de dos líneas), estados por apariencia, los siete colores, iconos y solo icono, estrecho (apilado), densidad compacta, RTL local. Controles: tema (por defecto, «Tema de prueba» y los once generados), oscuro, RTL, ancho. Parámetros `?dark=1`, `?rtl=1`, `?theme=<nombre>`, `?test=1`.
**Verificación:** `node design/lab/radio-group/estilo-verificar.mjs --engines=chromium,firefox,webkit` → **61357/61357**.

## Carácter

Una respuesta de formulario, no una navegación ni una tarjeta de contenido. Lo elegido se pinta **en su sitio** y en el acto, siempre con una señal de forma además del color.

| Apariencia | Cómo |
| --- | --- |
| **Círculo** (`list`, `inline`, `card`) | El propio `<input>` con `appearance: none`: borde `--g-border-width` en `border-control` (≥ 3:1), fondo `surface`. **Elegido:** relleno `{color}`, **punto `on-{color}`** en el centro y borde `{color}-text` (el indicador de `GCard selectType="radio"`, #124). Se pinta con dos sombras interiores sobre el fondo (que es el punto): sin elegir, la sombra del «pozo» cubre todo el interior; al elegir se encoge a un anillo de `--_ring` = 30 % del interior y **el punto crece desde el centro** (`--g-duration-press`, `--g-ease-out`). Sin pseudoelementos (Firefox no los pinta en un `<input>`). Pulsar lo hunde (`--g-press-scale`), como la casilla |
| **`list`** | Columna; fila de la opción = la de `GCheckbox` (`--_row`, ≥ 44px táctil), círculo e icono centrados en la primera línea, descripción `caption` `muted` debajo |
| **`inline`** | Fila que envuelve dentro de una caja del **alto de un campo** (`--_field`, sin marco) con las opciones centradas: «Sí · No» queda a la altura del texto de las cajas vecinas. Separación `space × 5` |
| **`card`** | La tarjeta de `GCheckbox` (y de `GCard` seleccionable): `border-strong`, `--g-radius-lg`, relleno `space × 3`, icono en una tesela `surface-sunken`. **Elegida:** borde de doble grosor `{color}-text` sin mover el contenido, fondo `{color}-soft`, texto `on-{color}-soft`, tesela rellena `{color}`/`on-{color}`. Sin sombras de elevación ni `--g-card-*`. Rejilla `auto-fill` con mínimo `space × 60` (una columna en estrecho) |
| **`chip`** | Píldora `--g-radius-pill` con contorno `border-control` (≥ 3:1, es lo que la identifica), alto `--_row`. **Elegida:** relleno `{color}`, texto `on-{color}` y contorno `{color}-text` (≥ 3:1 aunque la marca sea pálida). El `<input>` cubre la píldora con `opacity: 0` |
| **`segmented`** | **Caja de campo**: fondo `surface`, marco `border-control` hacia dentro, `--g-radius-sm`, alto de `GInput` del mismo `size`. Opciones **iguales** (`grid-auto-columns: minmax(0, 1fr)`), separadores decorativos `--g-color-border`. **Elegida:** relleno `{color}` / `on-{color}` en su sitio (`--g-duration-press`) más un trazo interior `{color}-text` (con una marca oscura coincide con el relleno y no se ve; con una pálida da el 3:1). **Sin pista tonal, sin segmento elevado ni marca que se desliza y sin `--g-tabs-*`** (#273): se lee como un campo, no como `GTabs` |
| **Etiquetas** | Grupo: `body-sm` 14/20, 500, `text` (§23.2). Opciones: tamaño del control (`--_fs`/`--_lh`), 400 en `list`/`inline` y **500 en `card`/`chip`/`segmented`** (la propuesta de §23.2; el peso **no cambia** al elegir, así nada salta de ancho). Ayuda y descripción `caption` `muted`; mensaje como `GCheckboxGroup` (error y aviso 500) |

### El marco del segmentado: `outline` en una capa `::after`

El contrato pide el marco «hacia dentro» y con `outline` (sobrevive en `forced-colors`; `box-shadow` no). En la propia caja, el `outline` lo **tapaban los fondos de las opciones** (que van posicionadas para que el `<input>` las cubra): medido, el marco desaparecía arriba y abajo de una opción deshabilitada y de la elegida. Va en `.g-radio-group__options::after` (`position: absolute; inset: 0; z-index: 2; pointer-events: none; border-radius: inherit`), con el mismo `outline` y `outline-offset` negativo. Error, advertencia, válido, solo lectura y deshabilitado cambian el `outline` de esa capa. No ocupa sitio: la caja mide exactamente `--_field`.

### Foco por opción

| Apariencia | Anillo (`--g-focus-width`, `--g-color-focus`) |
| --- | --- |
| `list`, `inline` | En el círculo, a `--g-focus-offset`; se abre desde el borde (transición de `outline-offset`, como `GCheckbox`) |
| `chip`, `card` | Alrededor de la opción (`:has(> .g-radio-group__input:focus-visible)`) |
| `segmented` | **Dentro** del segmento, separado del marco por `border-width + focus-offset`, con un halo `surface` a los dos lados (`box-shadow` interior): se ve igual sobre la elegida rellena, no lo tapa el vecino (`z-index: 1`) y no lo recorta la caja. Mientras tiene el foco, el segmento redondea sus esquinas (`--g-radius-sm − border-width`) para que el anillo no se corte en las esquinas de la caja con radios grandes (spotify: 14px) |

### Estados (señal de forma además del color)

| Estado | Círculo | Chip / tarjeta | Segmentado |
| --- | --- | --- | --- |
| **Error** (`is-invalid`) | Sin elegir: borde `danger-text` de doble grosor (segundo trazo interior) | Sin elegir: contorno `danger-text` doble | Marco `danger-text` de doble grosor |
| **Advertencia** (`is-warning`) | Sin elegir: borde `warning-text` **discontinuo** | Contorno `warning-text` discontinuo | Marco `warning-text` discontinuo, doble |
| **Válido** (`is-valid`) | Sin elegir: borde `success-text` sencillo | Contorno `success-text` | Marco `success-text` |
| **Solo lectura** (`is-readonly`, #165, #186, #266) | Relleno `neutral-soft`, borde **discontinuo** `border-control`; elegido: punto `text` sobre `neutral-soft` (sin `{color}`) | Fondo `neutral-soft`, contorno discontinuo; elegida: fondo `surface` con **doble trazo `text` continuo** | Caja `neutral-soft`, marco discontinuo; elegida: `surface` con doble trazo `text` |
| **Deshabilitado** (grupo o `__option.is-disabled`) | `surface-sunken`, borde `border-strong`; elegido en `text-subtle` | `surface-sunken`, `border-strong`; elegida: relleno `text-subtle` (la tarjeta conserva su doble trazo en `text-subtle`) | Caja `surface-sunken`, marco `border-strong`; elegida `text-subtle` |

Solo lectura: texto pleno (`text`, nunca atenuado), cursor normal; se distingue de deshabilitado por la forma del borde (discontinuo frente a continuo) y el contraste, no por el color. Hover solo dentro de `@media (hover: hover)` y nunca en solo lectura, deshabilitado ni opción deshabilitada: borde `text-muted` (círculo, chip, tarjeta), fondo `surface-sunken` (segmento), `{color}-strong` en lo elegido.

### Medidas por `size` (constantes de diseño derivadas de `space`, no tokens)

| `size` | Caja de `inline`/`segmented` (= `GInput`) | Círculo | Fila de opción | Relleno del segmento | Texto |
| --- | --- | --- | --- | --- | --- |
| `xs` | 6 × space (24) | 4 × space | 6 × space | `space-2` | `caption` |
| `sm` | 7 × space (28) | 4 × space | 6 × space | `space-2` | `body-sm` |
| `md` | 9 × space (36) | 5 × space | 7 × space | `space-3` | `body-sm` |
| `lg` | 11 × space (44) | 6 × space | 8 × space | `space-4` | `body` |
| `xl` | 13 × space (52) | 7 × space | 9 × space | `space-5` | `body` |

× `density` (1 · 0,875 · 0,75), con piso de 24px; con `pointer: coarse`, caja y fila ≥ 44px y **toda opción ≥ 44 × 44** (también el ancho de «Sí»).

### En una `GFormRow` (#268)

`inline` y `segmented` toman las tres pistas por `subgrid`, como `GInput` (C12): etiqueta en la 1 (apoyada abajo, se parte), `__options` en la 2, `__support` en la 3. `list`, `chip` y `card` no se colocan (van en su propia fila, aviso 3 de `GFormRow`).

### Movimiento

Corto y en su sitio: el punto crece (`box-shadow`, `--g-duration-press`), el relleno del segmento y del chip se funde (`background-color`/`color`), el anillo de foco se abre. **Movimiento reducido** (planes 007 y 012): sin crecer el punto, sin hundirse al pulsar y sin abrir el anillo; los **fundidos de color se conservan**. Nada se anima al montar (todo son transiciones, ninguna animación).

### `forced-colors`

Círculo con `forced-color-adjust: none`: `ButtonText`/`Canvas`, elegido con `SelectedItem` y el punto en `SelectedItemText`. Chip y segmento elegidos con `SelectedItem`/`SelectedItemText`. Tarjeta elegida con borde triple (el doble trazo de `box-shadow` desaparece). Marco del segmentado `ButtonText` (el `outline` de la capa sobrevive). Solo lectura elegida con un `outline` `CanvasText` doble. Error con borde doble. Deshabilitado en `GrayText`. Foco en `Highlight`.

## Para bruno (lo que el CSS espera del marcado)

- **Marcado exacto del contrato** («Estructura accesible»); la referencia ejecutable es `rg()` en `estilo-banco.html`. El `<input>` es **hijo directo** de la `<label class="g-radio-group__option">` (el CSS usa `:has(> .g-radio-group__input:checked)`). `__segment` solo en `segmented` y envuelve icono + `__text`.
- Clases: `g-radio-group--appearance-*` **siempre** (también `list`), `--size-*`, `--density-*`, `--color-*` siempre; `is-*` del grupo en la raíz; `is-disabled`/`is-icon-only` en la `<label>` de la opción. El CSS no usa `g-radio-group--icon-only` de la raíz (lo decide `is-icon-only` por opción, así una opción sin icono conserva su etiqueta).
- **Ancho natural** del segmentado (#271), con `g-radio-group--measure` puesta (sin transiciones, siempre en una línea aunque haya `is-stacked`): `n × max(ancho de __segment + padding-inline-start + padding-inline-end + border-inline-start-width, min-inline-size)` de las opciones, redondeado hacia arriba. El marco no suma (es una capa). Todas las opciones llevan el separador (la primera, transparente), así que el ancho de cada una es el mismo.
- **La caja ocupa el ancho de su sitio** (`display: grid`, bloque): el ancho de `__options` **no depende de `is-stacked`**, así el `ResizeObserver` sobre `__options` compara siempre lo mismo y no hay histéresis. No dar a la raíz un ancho `fit-content`.
- `is-stacked` y `--measure` las pone bruno; el CSS solo las pinta.
- Registro en `components.css` y una compuerta en el `dist/grana.css` (sugerencia: `grep -q "g-radio-group__segment"`).

## Verificación (`estilo-verificar.mjs`, Playwright, Chromium, Firefox y WebKit: 61357/61357)

**Contraste medido en la página** (colores calculados compuestos sobre el fondo real) en 25 configuraciones por motor: tema por defecto claro y oscuro, «Tema de prueba» (Georgia, borde 2px, `space` 5) y los once generados de `design/lab/tema-oscuro/dark-color-presence/generated/` en claro y oscuro, con las cinco apariencias, los siete colores y todos los estados:

| Medida (mínimo) | Defecto claro | Defecto oscuro | spotify (acento pálido) claro / oscuro | Mínimo en los 25 |
| --- | --- | --- | --- | --- |
| Texto (etiquetas, opciones, descripción, ayuda, mensajes; también `on-{color}` sobre lo elegido) | 4.76 | 4.51 | 4.62 / 4.51 | **4.51** (≥ 4.5) |
| Borde del círculo | 3.03 | 3.93 | 3.02 / 3.95 | **3.02** (≥ 3; el peor, `border-control` sobre la tarjeta de solo lectura `neutral-soft`) |
| Punto `on-{color}` sobre el relleno `{color}` | 5.33 | 4.81 | 5.28 / 4.81 | **4.51** |
| Contorno del chip / marco del segmentado | 3.45 | 4.32 | 3.43 / 4.35 | **3.43** |
| Trazo de lo elegido (segmento `{color}-text`, tarjeta, solo lectura `text`) | 5.33 | 4.52 | 4.53 / 4.52 | **4.51** |
| Anillo de foco contra lo adyacente (`list`, `inline`, `segmented`, `chip`, `card`, solo icono, solo lectura, `accent`, `warning`) | ≥ 3 en defecto claro/oscuro, spotify y caracol púrpura oscuro | | | **≥ 3** |

**Geometría** (tema por defecto, oscuro, RTL de página y Tema de prueba): caja de `segmented` e `inline` = caja de `GInput` por `size` (xs a xl y `md` compacto, ±0,5px) y cada segmento ocupa el alto entero; en `GFormRow`, cajas de una línea con el mismo `top` (±1px) a 1280, 960, 720, 480, 360 y 320, con etiqueta de dos líneas, ayuda y mensajes; fila compacta con alturas iguales; opciones ≥ 24 × 24; ningún texto recortado; segmentos iguales en una línea; el segmentado se apila **solo** si su natural no cabe y entonces es una columna en orden; la fila se parte antes de apilarlo (a 320 se apila solo cuando ya está solo en su línea); RTL local y de página (la primera opción a la derecha); sin desborde. `--measure`: una línea y transiciones 0 aunque esté apilado.
**Táctil** (Chromium, `hasTouch` + `isMobile`, `pointer: coarse`): todas las opciones ≥ 44 × 44; cajas de `GInput`, `inline` y segmento iguales y ≥ 44; filas alineadas.
**`forced-colors`** (Chromium, claro y oscuro): segmento y chip elegidos distintos y legibles, marco visible, círculo elegido distinto, tarjeta elegida con borde más grueso, solo lectura elegida marcada, foco visible.
**Movimiento reducido:** sin `box-shadow`, `scale` ni `outline-offset` en la transición del círculo y sin hundirse al pulsar (Chromium, ratón); fundidos de color conservados; sin preferencia, el punto crece y el círculo se hunde. **Escalas** 1,25/1,5/2: marco y borde del círculo ≥ 1 píxel de dispositivo.
**Estático:** sin colores literales, sin `var()` con respaldo, sin `@layer`, sin `@property`, sin `--g-tabs-*`, solo `--g-*`/`--_*` que existen en `defaults.css` (y `levels.test.js` en verde), medidas literales solo `24px`, `44px`, `0px` y el `1px` del texto oculto, `:hover` solo dentro de `@media (hover: hover)`. **Consola limpia** en los tres motores.

## Qué NO verifiqué

- El componente real (aún no hay `.vue`): todo es sobre el banco con el marcado del contrato. La auditoría (paso 5) lo repite sobre `GRadioGroup.vue` con otro tema y compara visualmente con `GTabs segmented`.
- `forced-colors` y táctil en Firefox y WebKit (Playwright no los emula); Safari, Windows con contraste alto y móvil reales; zoom 200/400 %.
- El hover no entra en la medida de contraste (sube el borde a `text-muted`, más contraste que el reposo).
- Lector de pantalla (no es estética; abierto en el contrato).

## Notas para otros dueños (no bloquean)

- **lima:** la tabla de tokens del contrato no nombra el **trazo interior `{color}-text` del segmento elegido** (sí el del chip y la tarjeta); es el mismo token ya listado. §23.2: el peso 500 de las opciones de `card`/`chip`/`segmented` queda confirmado tal como se propuso.
- **coco (pendiente propio, fuera de este encargo):** el solo lectura de `GCheckbox` sigue con `surface-sunken`; `GInput` (r02 L8) y `GRadioGroup` usan `neutral-soft` (#186). Unificar `GCheckbox`/`GCheckboxGroup` en una ronda propia con su verificación.
