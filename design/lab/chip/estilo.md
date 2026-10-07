# Entrega de coco · GTag.css + GTagGroup.css

**Archivos:** `packages/vue/src/components/GTag/GTag.css` y `packages/vue/src/components/GTagGroup/GTagGroup.css`. **`defaults.css` sin cambios:** ningún token nuevo (#471, `tokens.md` §39).
**Contrato:** `design/contracts/tag.md` (DECISIONS.md #460 a #473: A «Huella» #466, B «Racimo» #467, contraste #470, tokens y movimiento #471). **Estructura:** `design/lab/chip/r01/` (kiwi).
**Estado:** listo para bruno (`GTag.vue`, `GTagGroup.vue`, registro) y después para la auditoría (paso 5) sobre el componente real.
**Banco:** `design/lab/chip/estilo-banco.html`. El CSS se carga **dentro de la capa `grana.components`**, como lo registrará `components.css`; `GAvatar`, `GBtn`, `GIcon` y la pista (`.g-tooltip`) son los reales de `dist/grana.css`. El motor del banco pinta el marcado **exacto** del contrato («Semántica por caso», «El grupo», «Clases y datos») y hace solo lo que el estilo necesita: alternar, quitar → huella con `--_ghost-w` medido **antes** del cambio, deshacer y recoger cuando ni el foco ni un puntero con hover están en el grupo. Secciones: casos en `md`/`sm` (y con categoría), matriz de categorías 1 a 12 + neutra (reposo, quitable, alternar, pulsada, pulsada quitable y racimo con elegida, libre y quitable), grupo `flow`, racimos (`facets`, con alternar y en `sm`), herramientas (`limit`, `clearable`, vacío, suelta con pista) y 320px. Parámetros `?theme=<default|lustre|spotify|propio>-cat<8|12>`, `?dark=1`, `?dir=rtl`.
**Temas:** `estilo-temas.mjs` → `estilo-temas/*.css` con `@grana/cli` (`buildTheme`, que valida): el tema por defecto, lustre (brand ámbar claro, `shape: pill`), spotify (brand verde claro) y **propio con `primary` propia** (#107: brand `#1F3A5F`, accent `#B4532A`, **primary `#7B2D6B`**, neutros teñidos, radio 10, **space 5**, **borde 2px**), cada uno con **8 y 12 categorías**, claro y oscuro.
**Verificación:** `GRANA_PW_PORT=4213 node design/lab/chip/estilo-verificar.mjs` (Chromium, Firefox y WebKit) → **14 681/14 681** (Chromium 5247, Firefox 4717, WebKit 4717).

## Personalidad (lo que la hace distinta)

La etiqueta de Grana no es una píldora con una × diminuta. El CSS da forma a A y B con cuatro gestos propios, todos con tokens, sin muelle ni rebote (#471) y quietos con `prefers-reduced-motion: reduce`:

| Pieza | Qué hace el CSS | Por qué es de Grana |
| --- | --- | --- |
| **La tapa se invierte** | «Quitar» es una tapa del alto entero, separada por un filo `border-strong`, con las esquinas finales de la etiqueta. Al apuntarla (o mientras se pulsa en táctil), **la tinta de la etiqueta pasa a ser su fondo y el papel, el icono**; a la vez el texto se tacha (vista previa). El icono se aprieta a `--g-press-scale` al pulsar | La etiqueta «se arma» para irse: se ve **cuál** se va y que la acción es destructiva, sin rojo (una etiqueta no lleva color semántico, #461). El contraste lo garantiza el par del estado (`on-*-soft`/`*-soft`, `on-*`/`*`): ≥ 4,5:1 en cualquier tema, medido 4,51 en el peor |
| **La huella pierde el color** | Contorno **discontinuo** `border-control` del mismo ancho (`--_ghost-w`), texto tachado en `text-muted`, avatar o icono en **gris y a media tinta** (`grayscale(1)` + 0,5); la tapa es «Deshacer» en `text` y se invierte igual | Lo que fue sigue ahí, pero ya no es: se lee como un hueco, no como una etiqueta deshabilitada. Nada se mueve (Δ0 medido en los tres motores) |
| **La recogida es una salida** | `is-settling`: ancho de la huella a 0, opacidad a 0 y el elemento cede la separación que lo seguía, con `--g-duration-fast` + `--g-ease-out`; **todas a la vez** | Las demás se cierran sobre el hueco en un solo gesto corto, solo cuando nadie apunta |
| **La categoría es un trazo** | En el racimo, el color nunca es una mancha: el **lomo** (`space × 0.75`, `cat-k-text`) y la **raya** de la elegida tienen el **mismo trazo**; la elegida es `cat-k-soft` + raya + marca | El color agrupa, el nombre informa (#467); un solo lenguaje gráfico para «esto es de esta faceta» y «esto está elegido» |

Además: el **avatar del hueco es concéntrico** (misma distancia al borde exterior arriba, abajo y al inicio: `(alto − space × 5) / 2`, en `md`, `sm` y con `space` 5) y no cambia el alto de la etiqueta; la **marca del pulsado se abre** de 0 a 1em (`--g-duration-press` + `--g-ease-out`, como el chip de `GCheckbox`). Lo que **no** hace (a propósito, #471): ninguna animación al montar, ni de la huella al aparecer (solo color), ni del tachado, ni keyframes.

## Medidas (de tokens; constantes de diseño, no tokens nuevos)

| Medida | `md` | `sm` | Con `space` 5 (`md` · `sm`) |
| --- | --- | --- | --- |
| Alto de la etiqueta y del racimo (`space × 8` / `× 6`) | 32 | 24 | 40 · 30 |
| Tapa («Quitar»/«Deshacer»), de borde a borde | 32 × 32 | 24 × 24 | 40 × 40 · 30 × 30 |
| Área táctil con `pointer: coarse` (tapa y cuerpo interactivo) | ≥ 44 | ≥ 44 | ≥ 44 |
| Área mínima sin puntero grueso (`::after`) | ≥ 24 | ≥ 24 | ≥ 24 |
| Relleno en línea · separación interior | 12 · 6 | 8 · 4 | 15 · 7,5 · 10 · 5 |
| Separación entre etiquetas (`space × 2`) | 8 | 8 | 10 |
| Tope de recorte (`space × 60`) | 240 | 240 | 300 |
| Lomo y raya (`space × 0.75`) | 3 | 3 | 3,75 (el lomo es un borde: el navegador lo ajusta a 3 px enteros; la raya, no) |
| Valor dentro del racimo (alto − 2 bordes) | 30 | 22 | 36 · 26 (borde 2px) |
| Texto | `body-sm` | `caption` (≥ 12px) | |

- **Valor de un racimo (`is-plain`)**: sin borde propio y del alto interior del racimo, así el racimo mide exactamente lo que una etiqueta suelta; su huella se dibuja con un contorno interior (`outline` discontinuo, `outline-offset` negativo). El último valor lleva las esquinas finales del racimo (`radius-shape − borde`) para que la elegida y la tapa invertida no las rebasen.
- **Etiqueta sin faceta en `layout="facets"`**: conserva su aspecto y lleva un **lomo neutro** (`border-control`, `space × 0.75`): todo trozo de la fila tiene lomo; el gris dice «sin faceta».
- **Recorte**: una línea con `…` solo con un control enfocable (quitable, alternar, enlace, huella) **y habilitada**; la estática **y la deshabilitada** se parten en líneas (`overflow-wrap: anywhere`): sin foco no habría forma de leerlas con teclado.
- **El contorno existe siempre** (transparente en reposo): pulsar, deshabilitar, la huella o `forced-colors` no cambian la caja (medido).

## Contraste (`estilo-verificar.mjs`: 8 temas × claro/oscuro, todas las categorías que declara cada tema + neutra, tres motores)

Mínimo de cada fila de la tabla de `tag.md` §«Contraste», con el tema y la categoría donde se da:

| Fila | Mínimo | Dónde | Exigido |
| --- | --- | --- | --- |
| Reposo (estática y quitable): texto / soft | **4,51** | propio-cat8 oscuro, cat 4 | 4,5 |
| Tapa: icono en reposo | 4,51 | ídem | 3 |
| **Tapa al pasar (invertida)** | **4,51** | ídem | 3 (se cumple 4,5) |
| Tapa al pasar sobre la pulsada | 4,79 | propio-cat12 oscuro, cat 7 | 3 |
| Alternar sin pulsar: contorno `border-control` / surface | **3,43** | spotify claro | 3 |
| Pulsada: texto / relleno · marca / relleno | 4,79 · 4,79 | propio-cat12 oscuro, cat 7 | 4,5 · 3 |
| **Pulsada: contorno `-text` / surface (§7.1)** | **4,51** | default-cat8 oscuro, cat 5 | 3 |
| Pulsada al pasar: texto / `-strong` · contorno / surface (#438) | 6,06 · 4,51 | | 4,5 · 3 |
| Racimo, elegida: texto / soft | 4,51 | propio-cat8 oscuro, cat 4 | 4,5 |
| Racimo, elegida: **raya / soft** · raya / surface | **4,04** · 4,51 | spotify-cat8 oscuro, cat 1 | 3 |
| **Lomo** / surface y / fondo de página (neutro `border-control`) | **3,43** | spotify claro, neutro | 3 (con categoría ≥ 4,51) |
| Marco del racimo `border-control` / surface | 3,43 | spotify claro | 3 |
| Nombre de faceta `text-muted` / surface | 7,38 | spotify claro | 4,5 |
| Racimo, libre: texto / surface · al pasar / `surface-sunken` | 15,22 · 16,10 | | 4,5 |
| Huella: «Deshacer» · contorno discontinuo · texto tachado | 15,22 · **3,43** · 7,38 | | 4,5 · 3 · 4,5 |
| Anillo de foco / surface | 4,57 | propio-cat8 oscuro | 3 |

Nada baja de lo exigido. Lo más justo es lo que el motor garantiza en el límite (pares soft en 4,51, `border-control` en 3,43); el CSS no añade nada que dependa de una combinación no garantizada: la tapa invertida reutiliza el par del estado. Una categoría que el tema no declara (cat 9 a 12 con `categories: 8`) queda **sin relleno** (comprobado; límite del contrato).

## Decisiones de CSS

- **Alias propios** `--_tag-*` (GTag) y `--_tgg-*` (GTagGroup), declarados en su raíz: la etiqueta vive en celdas, tarjetas y grupos y no hereda alias ajenos. `data-cat` **solo reapunta familias** (`--_tag-soft`, `-on-soft`, `-fill`, `-fill-strong`, `-on-fill`, `-line`, `-pick`, `-on-pick`); los estados reasignan `--_tag-bg/-fg/-edge/-cap-ink/-paper`. Orden de las reglas de estado: alternar → racimo → deshabilitada → huella; las pulsadas excluyen deshabilitada y huella con `:not(.is-disabled, .is-ghost)`, así una pulsada quitable que se quita es huella aunque conserve `is-toggle is-pressed` (comprobado).
- **Tapa de borde a borde**: margen negativo del borde real en bloque y al final, `inline-size` = `min-block-size` = alto: mide exactamente alto × alto con cualquier `--g-border-width` (medido con 1 y 2px). Las esquinas finales se heredan de la raíz.
- **Hueco con avatar**: `margin-block` = `(línea − space × 5) / 2` (negativo si el avatar es más alto que la línea): ocupa una línea en bloque, el alto de la etiqueta no depende del avatar (con `sm` y con `space` 5 el avatar es más alto que la línea).
- **Orden visual** con `order`: marca (−2), hueco (−1), texto: no depende del orden del DOM (los dos son decorativos).
- **El área de 24px** la da el `::after` (no un `min-block-size` del cuerpo, que en `sm` empujaría la caja a 26px por los bordes); 44px con `pointer: coarse`. Centrado con `left: 50%` + `translate` (simétrico en RTL, lección de `GBtn`).
- **Foco**: anillo `--g-focus-width` / `--g-color-focus` / `--g-focus-offset` en cuerpo, tapa y «Deshacer»; **hacia dentro en el racimo** (`outline-offset: −focus-width`); el contenedor enfocado por programa (`tabindex="-1"`) lleva anillo y, vacío (0 × 0), lo lleva el grupo con el texto de vacío (`:has(> __list:empty:focus-visible)`).
- **Lista vacía**: sigue en el DOM (puede recibir el foco) y cancela su separación con `margin-inline-end` negativo.
- **`[hidden]`** gana a `display: flex` en `__item`/`__value` (las ocultas por «Ver N más»).
- **«Ver N más» y «Quitar todas»** son `GBtn` `link` sin tocar su CSS: `__tools` mide el alto de las etiquetas y los centra (medido Δ ≤ 1px).
- **#383/#394**: ningún selector toma hijos por estructura sin una clase propia; el único estructural es `:nth-last-child(1 of .g-tag-group__value)`. Con y sin el nodo `.g-tooltip` en la raíz del grupo y de una etiqueta suelta, las cajas miden igual (comprobado).
- **`forced-colors`**: contorno `CanvasText` en cada etiqueta (el borde ya existía: sin cambio de caja, medido), huella discontinua en `GrayText`, deshabilitada `GrayText`; pulsada con `Highlight`/`HighlightText` y **`forced-color-adjust: none`** (sin él el fondo vuelve a `Canvas`), la marca sigue diciendo el estado; el filo de la tapa en `CanvasText` (es un fondo de `::before`: sin `forced-color-adjust: none` se perdería); tapa al pasar y pulsar en `Highlight`; anillo `Highlight`. Racimo: marco y lomo `CanvasText`, filos `GrayText`. La raya (un `box-shadow`, que `forced-colors` anula) se sustituye por el relleno `Highlight`.
- **Movimiento reducido** (§29.3): la marca aparece sin abrirse (solo opacidad), el icono de la tapa no escala, el hueco con avatar no se desliza y **la recogida es instantánea** (sin transición de ancho, opacidad ni margen). Colores con `--g-duration-fast` en los dos modos. `:hover` solo dentro de `@media (hover: hover)`.

## Para bruno

1. **`levels.test.js` falla hasta que añadas las dos lectoras** a `CAT_FAMILY_READERS` (§«Color» del contrato): `'GTag/GTag.css'` (seis familias) y `'GTagGroup/GTagGroup.css'` (solo `cat-k-text`). Es lo esperado: lo hice correr y las dos pruebas de la familia fallan solo por eso. (La prueba de `icons.test.js` «la lista de la librería es la de icons.md §4» también falla hoy en el árbol, sin relación con estas hojas.)
2. **Registro** en `components.css`: `GTag.css` antes que `GTagGroup.css` (el grupo lee clases de la etiqueta) y **después de `GAvatar.css`, `GBtn.css` y `GIcon.css`**.
3. **Huella**: medir el `border-box` (`getBoundingClientRect().width`) **antes** de cambiar nada y escribirlo como `--_ghost-w` en px en la raíz de la `GTag`; el cuerpo de la huella es un `<span aria-hidden="true">` con el mismo hueco y texto (la marca, si la había, puede seguir: va atenuada); «Deshacer» lleva `undo-2` con `g-icon--flip-rtl`. Puedes conservar `is-removable`, `is-toggle` o `is-pressed` en la huella: el CSS hace ganar a `is-ghost`.
4. **Recogida**: poner `is-settling` en el `__item`/`__value` y sacar el elemento del DOM en el `transitionend` de **`inline-size`** sobre la `.g-tag` (filtrar `e.target === tag` y `propertyName`), con un temporizador de respaldo. **Con `prefers-reduced-motion: reduce` no hay transición de ancho**: sácalo del DOM en el acto (no esperes el respaldo; el banco lo hace con temporizador y se ve 2px residuales de borde mientras tanto).
5. **Vista previa al enfocar**: el tachado usa `:focus-visible` de la tapa; si mueves el foco por programa a «Quitar» tras deshacer, el navegador decide si es visible (con teclado sí).
6. **Hueco**: el avatar en `g-tag__lead` como hijo directo (`.g-tag__lead > .g-avatar`, `size="xs"`); el icono, un `svg` hijo directo (1em). La marca `g-tag__check` con su `svg` hijo directo, siempre en el DOM de una etiqueta de alternar.
7. **Racimo**: `data-cat` en `__facet` (lomo) **y** en cada `GTag` del racimo (la elegida usa la familia de su propia etiqueta; con la clave por faceta coinciden). La suelta en `facets` va en `__item` sin `is-plain`.
8. **CLI (hallazgo, tuyo):** `@grana/cli` genera temas que **no pasan su propia validación** con 12 categorías: `{ brand: '#2F4B3A', categories: 12, dark: true }` (y con `#0F4C5C`) da `--g-color-cat-2-text` (o `cat-10-text`) **4,49:1** sobre `surface` en oscuro; con 8 categorías, bien. Por eso el tema propio de este banco usa `#1F3A5F`. La derivación de categorías en oscuro debería garantizar ≥ 4,5:1 (o separar más el tono) antes de emitir.

## Para lima

1. **«Lomo neutro» de las sueltas en `facets`** (§«Personalidad B»): lo leí como «la etiqueta conserva su aspecto y gana un lomo `border-control`» (no la convierto en un racimo sin nombre). Si se quería otra cosa, es una regla de `GTagGroup.css`.
2. **Deshabilitada no se recorta** (se parte como la estática): sin foco no hay pista. El contrato solo nombraba la estática; conviene decirlo en §«Recorte».
3. **Lomo en `space` fraccionario**: es un borde y el navegador lo ajusta a píxeles enteros (3,75 → 3); la raya (sombra interior) no. Diferencia ≤ 1px; anotarlo como límite o aceptar `round()` cuando se haga para todo.
4. **Hover de la tapa**: el prototipo de kiwi la llenaba con `border-strong`; aquí se **invierte** sobre el par del estado (`soft`/`on-soft`, `fill`/`on-fill`, `pick`/`on-pick`), que el motor garantiza ≥ 4,5:1 (medido ≥ 4,51). Es una decisión de estilo dentro de §«Contraste» («el icono ≥ 3:1 contra su fondo de hover»); si lima quiere fijarla, una línea en esa tabla.

## Lo que NO se verificó

- El **componente real** (`GTag.vue`/`GTagGroup.vue` aún no existen): lo hará la auditoría (paso 5) en `design/lab/chip/auditoria.md` con `auditoria-verificar.mjs`, con la huella y la recogida de verdad, la pista visual (`useVisualTips` con nodo `span`) y la forma con un tema `square`.
- `forced-colors` en Firefox y WebKit, puntero grueso en Firefox (Playwright no los emula); Windows con contraste alto real, Safari y táctil reales; zoom 200/400 %.
- Lectores de pantalla (no es del estilo).
- Cientos de etiquetas (rendimiento de la recogida con muchas huellas).
