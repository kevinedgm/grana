# Entrega de coco · GBreadcrumbs.css

**Archivo:** `packages/vue/src/components/GBreadcrumbs/GBreadcrumbs.css`. **`defaults.css` sin cambios:** ningún token nuevo (#501).
**Contrato:** `design/contracts/breadcrumbs.md` (decisiones #490 a #503 en `DECISIONS.md`, `tokens.md` §41; A «Ruta líquida» + la cara de B como última etapa + las puertas de C con `children`, #491). **Estructura:** `design/lab/breadcrumbs/r01/` (kiwi).
**Estado:** listo para bruno (el `.vue`) y para la auditoría (paso 5) sobre el componente real.
**Banco:** `design/lab/breadcrumbs/estilo-banco.html` + `estilo-banco.js`. El CSS se carga **dentro de la capa `grana.components`** sobre `dist/grana.css` y **con la fuente servida** (`dist/fonts.css`). El motor del banco emite el marcado **exacto** del contrato y hace solo lo que el estilo necesita (etapas por lotes con lista de medida, `data-clipped`, `is-ready`, cara de B, paneles `popover="manual"` con `--_x`/`--_y`/`--_max` y `data-side`, foco por nivel, subir y bajar con copia saliente). **No emula la pista visual** (su CSS es el de `GTooltip`). Secciones: etapas por ancho sin y con puertas, la puerta en reposo, pastillas frente a `GBadge` real, cara de B y escalera, RTL (bloque `dir="rtl"` en página LTR), bajar y subir, cabecera con `overflow: hidden`, uno y dos niveles, nombres largos, sobre el fondo de la página y etapas forzadas. Parámetros `?dark=1`, `?theme=propio|<nombre>`, `?slow=1`.
**Tema propio de esta entrega:** `estilo-tema.json` → `estilo-tema.css` (`node packages/cli/bin/grana.mjs theme design/lab/breadcrumbs/estilo-tema.json --out design/lab/breadcrumbs/estilo-tema.css`: brand `#5B2A86` ciruela, accent `#0F7C6E` verde azulado, neutros teñidos, radius 4, **space 5**, **borde 2px**; claro y oscuro).
**Verificación:** `GRANA_PW_PORT=4215 node design/lab/breadcrumbs/estilo-verificar.mjs` (Chromium, Firefox y WebKit) → **10453/10453**.

## Personalidad (qué lo hace distinto)

| Pieza | Qué hace el CSS | Por qué es de Grana |
| --- | --- | --- |
| **La pastilla es la señal** | Un nombre entero es **texto suelto** en `text-muted`; solo cuando esconde letras (`data-clipped`) toma fondo `neutral-soft`. A 1100px la ruta es una frase limpia; al estrechar, aparecen pastillas justo donde falta texto | En otros frameworks la pastilla es decoración fija; aquí **dice «aquí hay más nombre»** y desaparece cuando ya no hace falta (transición de fondo `fast`) |
| **«Estás aquí» es un solo objeto** | El actual es la única pastilla de color (`accent-soft` / `on-accent-soft` + peso de acción). En la cara de B, la divulgación con el nombre de la página es **la misma pastilla**; al bajar o subir, el acento pasa de un nivel al otro con un fundido de color | La ruta cambia de forma (fila → «Subir · página») y el marcador de lugar no: se reconoce en cualquier etapa |
| **La ruta crece desde dentro** | Al bajar, el nivel nuevo va **debajo** del anterior (`z-index`, `isolation` en la lista) y sale de detrás de él: `translate` desde `space × 3` hacia el inicio con **`--g-ease-spring`** (quinto uso, #500) y opacidad `press` + `ease-out`. Al subir, la copia se recoge hacia el anterior por debajo y desaparece (`press`) | Se ve **de dónde sale** el lugar nuevo, en vez de una fila sustituida de golpe |
| **La puerta entornada** (#498) | El separador de un nivel con `children` es el **mismo chevron** dentro de un **hueco redondo** `neutral-soft`, un tono más fuerte (`text-muted` frente al `text-subtle` del separador). Al pasar aparece el **marco** (`inset` `border-control`); abierta, el chevron **gira 90° hacia su panel** (−90° sobre el espejo en RTL) y la puerta toma el acento | El separador hace trabajo sin ocupar una pieza nueva: en reposo se lee como «este chevron se abre», no como uno más |
| **La escalera** | Cada nivel `space × 4` más adentro, una **guía en L** de borde desde el anterior y el actual con barra `accent-text`; los escalones bajan uno a uno (retardo `fast × min(i, 4) / 4`) | La ruta tiene forma de profundidad, no de lista plana |
| **El foco abre la pastilla** | La miga con `:focus-visible` pierde el tope y casi no cede (peso 1), **sin transición de tamaño**; el anillo queda encima de las vecinas (`z-index: 2`) | Quien tabula lee cada nombre entero en su sitio |

Lo que **no** hace (a propósito): nada se anima al montar (todo bajo `is-ready`), ni el cambio de etapa, ni el despliegue por foco; ni `--g-ease-bounce`; el muelle solo en el `translate` del nivel que llega (dentro de `@supports (transition-timing-function: linear(0, 1))`); ningún efecto de puntero fuera de `@media (hover: hover)`.

## La puerta en reposo: decisión y medida (#498)

**Decisión:** la puerta **se distingue** del separador en reposo, por **forma** (un hueco redondo `neutral-soft` de `max(24px, space × 6)`) y por **tono** (`text-muted` frente a `text-subtle`). No por color de acento: el acento queda para lo abierto y para «estás aquí».

| Condición | Cómo se cumple | Medida |
| --- | --- | --- |
| 1. Teclado | `button` en el Tab con `:focus-visible` (`--g-color-focus`, `--g-focus-width`, offset `--g-focus-offset`); la pista visual la nombra (bruno: `disabled()` siempre falso en la puerta) | Anillo ≥ 4,52:1 contra el fondo en 26 temas |
| 2. Puntero | `cursor: pointer` (el separador, no); al pasar, marco interior `border-control` y chevron `text` | Marco ≥ **3,43:1** contra la superficie (26 temas); chevron al pasar ≥ 13,85:1 sobre el hueco |
| 3. 3:1 como control | El **chevron** es lo que identifica el control: `text-muted` | Chevron/hueco ≥ **6,49:1**; chevron/superficie ≥ **7,38:1** (26 temas). El hueco contra la superficie es ≈ 1,1:1 y **no es la señal exigida** (es una pista de forma adicional) |
| 4. Si se viera igual que el separador | **No se ve igual**: no hace falta justificarlo; la auditoría lo vuelve a medir | Hueco `neutral-soft` frente a fondo transparente; color distinto; cursor distinto (medido en los tres motores) |

Abierta: `accent-soft` / `on-accent-soft` (chevron ≥ 4,51:1) + giro de 90°. El estado abierto no depende del color: también cambia la **forma** (el chevron apunta al panel) y `aria-expanded`. Por eso no lleva el contorno `{familia}-text` de §7.1 (exento: «un estado que ya se distingue por una señal que no es el relleno»).

## Medidas (constantes de diseño desde tokens; ninguna es token)

| Medida | Valor | Por defecto (`space` 4) | Propio (`space` 5) |
| --- | --- | --- | --- |
| Alto de la fila **y** de la cara de B (Δ0) | `max(24px, space × 7, body-sm-line)`; `max(44px, space × 7, body-sm-line)` con `pointer: coarse` (la línea, desde la auditoría, hallazgo 1) | 28 (44) | 35 (44) |
| Relleno en línea de una pastilla | `space × 2` | 8 | 10 |
| Icono–nombre | `space × 1` | 4 | 5 |
| Separador | chevron `1em` + `space × 0.5` a cada lado | 14 + 4 | 14 + 5 |
| Puerta | `max(24px, space × 6, 1em + space × 2)` redonda + `space × 0.5` a cada lado; `max(44px, 1em + space × 2)` con `pointer: coarse` (el `1em`, desde la auditoría, hallazgo 1) | 24 | 30 |
| Mínimo de una pastilla (en medio, padre) | lo de delante + `max(objetivo, relleno × 2 + icono + 3ch)` | ≈ 62 (medido) | ≈ 62 (calculado: el separador y el relleno crecen, 3ch no) |
| Suelo del actual en `shrink` | lo de delante + `max(objetivo, relleno × 2 + icono + 8ch)` | — | — |
| Tope de nombre (salvo el actual) | `20ch` (también el nombre de «Subir») | — | — |
| Pesos de `flex-shrink` | en medio `100000`, padre `30`, actual `0` (`1` en `shrink` y con un solo nivel), raíz `flex: none`, desplegado por foco `1` | — | — |
| Raíz en solo icono | círculo de `--_bc-h` | 28 | 35 |
| Panel de una puerta | ancho `space × 48` a `min(space × 80, 100vw − space × 4)`; relleno `space × 1`; radio `md` | 192–320 | 240–400 |
| Escalera | ancho `space × 56` a `min(space × 90, 100vw − space × 4)`; relleno `space × 2`; sangría `space × 4` por nivel | 224–360 | 280–450 |
| Enlace de un panel | alto `max(24px, space × 8)` (44 con puntero grueso); relleno `space × 1` / `space × 2`; radio `sm` | 32 | 40 |
| Guía en L | vertical a `space × (4·d − 2)` del inicio, brazo `space × 1.5`, del borde del escalón a su mitad; `border-width` `border-strong`, codo `radius-xs` | — | — |
| Barra del escalón actual | `border-width × 2` en `accent-text` (inicio lógico) | 2 | 4 |
| Entrada de un panel | `space × 1` hacia el disparador (como `GHelper`) | 4 | 5 |

**Etapas medidas** (por defecto, fuente servida, los tres motores): 1100, 720, 560 y 480px `liquid` con seis de seis niveles; 400px `root-icon`/`shrink` con seis de seis en la fila y 5 enlaces en el Tab; 320, 260 y 240px `step` con dos paradas. Con `space` 5 la fila cede antes (480px ya en `root-icon`). Ninguna pieza fuera del `nav` en ningún ancho, LTR ni RTL; la raíz nunca a medias; **alto Δ0** entre etapas (28px fino, 44px grueso; también en las cuatro etapas forzadas). Despliegue por foco a 560px: «Laboratorio central» 119 de 122px a la vista (ver «Para lima», 1).

## Contraste (`estilo-verificar.mjs`, 26 temas: por defecto, propio y los once generados, claro y oscuro; tres motores)

| Pieza | Por defecto claro | Por defecto oscuro | Propio claro | Propio oscuro | **Mínimo en los 26** | Exigido |
| --- | --- | --- | --- | --- | --- | --- |
| Nivel (`text-muted`) | 7,46 | 8,59 | 7,44 | 8,56 | **7,38** | 4,5 |
| Nivel sin página | 7,46 | 8,59 | 7,44 | 8,56 | **7,38** | 4,5 |
| Pastilla recortada (`on-neutral-soft` / `neutral-soft`) | 6,54 | 4,56 | 5,11 | 5,23 | **4,56** | 4,5 |
| Actual (`on-accent-soft` / `accent-soft`) | 5,00 | 4,52 | 4,52 | 4,53 | **4,51** | 4,5 |
| Nivel al pasar (`text`) | 17,40 | 15,22 | 17,44 | 15,23 | **15,20** | 4,5 |
| Separador (`text-subtle`, decorativo) | 5,10 | 6,21 | 5,14 | 6,18 | **5,05** | — (≥ 3 medido) |
| Puerta en reposo: chevron / hueco | 6,54 | 7,83 | 6,50 | 7,81 | **6,49** | 3 |
| Puerta en reposo: chevron / superficie | 7,46 | 8,59 | 7,44 | 8,56 | **7,38** | 3 |
| Puerta al pasar: marco / superficie | 3,45 | 4,32 | 3,48 | 4,29 | **3,43** | 3 |
| Puerta abierta: chevron / `accent-soft` | 5,00 | 4,52 | 4,52 | 4,53 | **4,51** | 3 |
| «Subir» (`on-neutral-soft` / `neutral-soft`) | 6,54 | 4,56 | 4,70 | 4,55 | **4,53** | 4,5 |
| «Subir» al pasar (`on-neutral` / `neutral-strong`) | 7,46 | 6,21 | 7,55 | 6,19 | **6,17** | 4,5 |
| Divulgación (`on-accent-soft` / `accent-soft`) | 5,00 | 4,52 | 4,52 | 4,53 | **4,51** | 4,5 |
| Divulgación al pasar: marco | 5,00 | 4,52 | 4,52 | 4,53 | **4,51** | 3 |
| Escalera y panel: enlaces (`text`) | 17,40 | 15,22 | 17,44 | 15,23 | **15,20** | 4,5 |
| Escalera y panel: sin página (`text-muted`) | 7,46 | 8,59 | 7,44 | 8,56 | **7,38** | 4,5 |
| Panel al pasar (`text` / `neutral-soft`) | 15,27 | 13,87 | 15,25 | 13,91 | **13,85** | 4,5 |
| `check` del hijo de la ruta (`accent-text`) | 5,69 | 4,58 | 5,09 | 4,65 | **4,52** | 3 |
| Barra del escalón actual (`accent-text`) | 5,69 | 4,58 | 5,09 | 4,65 | **4,52** | 3 |
| Anillo de foco (fila y paneles) | 5,69 | 4,58 | 5,09 | 4,65 | **4,52** | 3 |
| Guía en L (`border-strong`, estructura) | 1,45 | 1,90 | 1,39 | 1,83 | **1,39** | — |

- La **guía** no transmite estado (la sangría dice la profundidad y la barra, el peso y `aria-current` dicen el actual): 1.4.11 no la exige. La **barra** repite `aria-current` y el peso (no es la única señal) y aun así llega a 4,52.
- El **actual** se distingue sin color: peso de acción (500 frente a 400) y, en `forced-colors`, subrayado.
- Los pares `on-*-soft` / `*-soft` los garantiza el motor ≥ 4,5:1; en spotify/amazon oscuros quedan en el límite (4,51 a 4,56).

## Decisiones de CSS

- **El ancho lo da el contenedor:** la raíz es `inline-size: 100%` + `contain: inline-size` (como `GSummary`). Si el ancho dependiera del contenido, la cara de B (más estrecha) encogería el `nav` en una fila flexible y la etapa no volvería nunca a la fila al ensanchar.
- **Pesos y mínimos por variables** (`--_bc-k`, `--_bc-min`, `--_bc-chip`): el mínimo de una pastilla cuenta **lo de delante** (separador o puerta, `--_bc-lead`, que cambia con `:has(> .g-breadcrumbs__door)`) y el icono (`--_bc-icn` 0/1 con `:has(> .g-breadcrumbs__link > .g-breadcrumbs__icon)`). El enlace llena su nivel y centra el nombre si el mínimo supera un nombre muy corto (≤ 2 letras).
- **Suelo de 8ch «o su ancho natural si es menor»:** CSS no puede escribir `min(8ch, max-content)`. No hace falta: con un actual más corto que 8ch, `shrink` nunca cabe si no cupo la etapa anterior (el actual no tiene nada que ceder), así que el suelo no llega a pintarse; se pasa a `step` igual que con el mínimo ideal.
- **Raíz `flex: none` + `min-inline-size: 0`** (manda sobre `is-parent` con dos niveles); un solo nivel (`.is-current:first-child`) cede sin suelo hasta el objetivo táctil.
- **Las reglas de la fila seleccionan con `>`** (`.g-breadcrumbs__item > .g-breadcrumbs__link …`): el panel de una puerta vive **dentro** del `li` del nivel siguiente (a veces el actual), y sus etiquetas no deben heredar el tope, el subrayado de `forced-colors` ni el despliegue. El panel restablece peso, color y `white-space`.
- **Paneles:** `position: fixed` con `left`/`top` físicos (`--_x`, `--_y`, como `GMenu` y `GHelper`), `max-block-size: var(--_max)` con desplazamiento propio, `display` **solo** bajo `:popover-open` (cerrados, el del agente de usuario). Entrada `press` + `ease-out` desde `space × 1` hacia el disparador según `data-side`; salida `fast` con `overlay`/`display` discretos (Chromium; Firefox y WebKit cierran en el acto, #394). El foco dentro de un panel va por dentro (`outline-offset` negativo): el panel se desplaza y recortaría el anillo.
- **Copia saliente:** `flex: 0 0 0`, `max-inline-size: 0` (no ocupa sitio en la fila; su contenido asoma detrás del nuevo actual), `pointer-events: none`, `z-index: 0`; mientras está, la lista recorta en línea (`:has(> .is-leaving)`), así nunca asoma fuera del `nav`.
- **Primer pintado:** sin `is-ready`, la lista recorta en línea (`overflow-x: clip`) y ninguna transición existe.
- **Lista de medida con `overflow: clip`** (auditoría, hallazgo 2): sus niveles en sus mínimos desbordan cuando la etapa probada no cabe, y ese desbordamiento invisible ensanchaba la página (scroll horizontal a 320px). El recorte no cambia los anchos que mide bruno.
- **`forced-colors`:** actual subrayado (fila, divulgación y escalera); puerta, «Subir» y divulgación con borde `ButtonText`; puerta abierta `Highlight`/`HighlightText` con `forced-color-adjust: none`; paneles con borde `CanvasText`; barra del escalón actual `CanvasText` sobre las demás `Canvas`; guías `GrayText`.
- **#383:** ningún selector toma hijos por estructura; los `:has(> …)` y `>` nombran siempre clases propias. `:first-child` solo entre los `li` de la lista (las pistas van fuera del `ol`).

## Lo que el CSS espera del `.vue` (para bruno)

Además de «Clases y datos» del contrato:

1. **Chevrons espejados:** el separador y la puerta llevan la clase **`g-icon--flip-rtl`** en el `svg` (el `GIcon` interno no tiene `flipRtl`: pásala por `class`). El separador: `class="g-breadcrumbs__sep g-icon--flip-rtl"`. La puerta abierta gira el mismo `svg` (`.g-breadcrumbs__door .g-icon`).
2. **El enlace es hijo directo del `li`** (`li > .g-breadcrumbs__link`), también con el slot `link` (el elemento del slot recibe la clase por `attrs`); el nombre va en `span.g-breadcrumbs__label` dentro del enlace; el icono en `span.g-breadcrumbs__icon` hijo directo del enlace.
3. **Lista de medida:** `ol.g-breadcrumbs__measure` con **`data-stage` = la etapa que se prueba** (las reglas de `shrink` leen el `data-stage` de la raíz para la fila real y el de la propia lista para la medida). `is-icon` en la raíz con icono en `root-icon` **y en `shrink`**. Una etapa cabe si la suma de `getBoundingClientRect().width` de sus `li` ≤ ancho de la lista + 0,5.
4. **`data-clipped`:** en el `li` cuyo `.g-breadcrumbs__label` (el del enlace del nivel) cumple `scrollWidth > clientWidth + 1`; nunca con `is-icon`. Medir tras cada cambio de etapa, de ancho y de foco dentro de la fila (el despliegue cambia las vecinas). Solo cambia el fondo.
5. **`is-ready`** en la raíz **un cuadro después** de la primera etapa aplicada (antes no hay transiciones: la primera etapa no debe fundir pastillas).
6. **`is-entering`:** se retira cuando terminan **todas** sus animaciones (`Promise.all(li.getAnimations().map((a) => a.finished))`): sin movimiento reducido son dos (`g-breadcrumbs-enter`, 240ms, y `g-breadcrumbs-enter-fade`, 160ms); con movimiento reducido, solo `g-breadcrumbs-enter-fade` (120ms). Filtrar `animationend` por el prefijo `g-breadcrumbs-enter` si se usa el evento, esperando a la última.
7. **Copia saliente (`li.is-leaving`):** al final de la lista, con las clases de papel que tenía (si era el actual, conserva `is-current` y la pastilla de acento hasta irse), sin `data-clipped`, sin ids, sin `aria-controls` ni paneles, `aria-hidden`, `inert`; se quita con `animationend` de `g-breadcrumbs-leave` (160ms) y respaldo de tiempo. Con movimiento reducido no se crea (y si se creara, el CSS no la pinta).
8. **Paneles:** `--_x`, `--_y` y `--_max` en px (coordenadas físicas del visor) y `data-side` `top`/`bottom` **antes** de `showPopover()` o en el mismo cuadro (la entrada parte de `data-side`). La escalera: `--_depth` = índice entero en cada `li.g-breadcrumbs__stair`.
9. **Pista visual:** el CSS no toca `.g-tooltip`; los nodos al final del `nav` no alteran ninguna regla.

## Para lima

1. **Peso del desplegado por foco (#496):** con peso `1` frente al `30` del padre, Flexbox reparte el déficit **en proporción a peso × base**, así que el padre no llega a su mínimo antes de que la miga desplegada ceda algo: a 560px «Laboratorio central» enseña 119 de 122px (≈ 97 %) y la pista lo completa («si ni desplegado cabe»). Un peso `0` lo dejaría entero pero haría desbordar la fila cuando de verdad no cabe. **Propuesta:** dejar `1` y precisar en `breadcrumbs.md` §«El foco despliega» «se ve entero **o casi** (la pista completa el resto)». No es defecto.
2. **Registrar la puerta en reposo** (decisión de coco, #498) en `DECISIONS.md` / `breadcrumbs.md` §«Puertas»: «la puerta entornada: el mismo chevron en un hueco redondo `neutral-soft` de `max(24px, space × 6)`, `text-muted`; al pasar, marco interior `border-control`; distinta del separador por forma, tono y cursor».
3. **La divulgación de la cara de B es la pastilla de acento** (`accent-soft` / `on-accent-soft` + peso de acción, como el actual de la fila), no un botón transparente; al pasar, marco interior `on-accent-soft`. El contrato no fijaba sus colores; ningún token nuevo. Añadir a `tokens.md` §41 («B» del párrafo de §41).
4. **Constantes de diseño para `tokens.md` §41** (amplían «Constantes de diseño» de #501): alto de fila y cara `max(24px, space × 7)`; puerta `max(24px, space × 6)`; márgenes del separador y la puerta `space × 0.5`; relleno de pastilla `space × 2`; anchos de los paneles (`space × 48`–`80` y `space × 56`–`90`, acotados a `100vw − space × 4`); enlace de panel `max(24px, space × 8)`; guía en L `space × (4·d − 2)` y brazo `space × 1.5`; entrada de un panel `space × 1` (la de `GHelper`). Todas en la tabla «Medidas».
5. **Curva de los fundidos de color:** el contrato da la duración (`fast`) sin curva; uso `--g-ease-out` (de la lista de #501) en vez de `--g-ease-standard`.
6. **Idea de personalidad no aplicada** (necesitaría una constante de coreografía nueva, #187): al pasar por una puerta, el chevron se **asoma** (gira un tercio hacia abajo) anunciando que abre un panel y no navega. La dejo como propuesta para una segunda tanda de personalidad (`PENDIENTES.md`), no la escribo sin decisión.

## Verificación (`estilo-verificar.mjs`, Playwright, Chromium, Firefox y WebKit: 10453/10453)

**Estático:** solo `var(--g-*)`, alias `--_bc-*` y los datos del `.vue` (`--_depth`, `--_x`, `--_y`, `--_max`); sin respaldos, sin `@layer`, `@property` ni `!important`; sin colores ni mezclas literales; medidas literales solo `24px`, `44px` y el `1px` del texto oculto; `ch` solo `20ch`, `3ch`, `8ch`; giros solo `90deg` y `180deg`; pesos solo `100000 · 30 · 1 · 0`; múltiplos de `--g-space-1` solo los de «Medidas»; keyframes `g-breadcrumbs-enter`, `-enter-fade`, `-leave`, `-stair`; toda animación bajo `prefers-reduced-motion`; `:hover` solo bajo `(hover: hover)`; `--g-ease-spring` una sola vez, en el nivel que llega, dentro de `@supports`; sin `--g-ease-bounce` ni curvas propias; sin `> *` (#383); `display` de los paneles solo bajo `:popover-open`; despliegue por `:has(> .g-breadcrumbs__link:focus-visible)`; recorte hasta `is-ready`.
**Contraste:** tabla de arriba, 26 temas × 3 motores.
**Geometría** (por defecto claro, oscuro y propio): etapas por ancho (arriba); 22 marcos sin piezas fuera del `nav` (LTR y RTL, con y sin puertas, uno y dos niveles, nombres largos, 120px); objetivos ≥ 24; alto Δ0 en todas las etapas y en las cuatro forzadas; pastilla mínima con ≥ 3ch a la vista; fondo solo con `data-clipped` y acento solo en el actual; a 1100px ningún nombre entero con fondo; la puerta frente al separador (fondo, color, cursor, 24 × 24 redonda); RTL con chevrons `scale: -1 1` y la raíz a la derecha.
**Puerta y paneles:** al pasar, marco `border-control` interior; abierta, `accent-soft` y giro 90° (−90° en RTL), vuelve al cerrar; panel debajo, en la **capa superior** también dentro de la cabecera con `overflow: hidden` (`elementFromPoint`), sobre `surface`, ≥ `space × 48`, enlaces ≥ 24px.
**Escalera:** sangría exacta de `space × 4` por nivel (LTR hacia la derecha, RTL hacia la izquierda), barra `accent-text` y peso en el actual, guías en L, chevron a 180°, nombres que se parten, retardos `0 · 30 · 60 · 90 · 120 · 120` ms.
**Despliegue por teclado:** con `:focus-visible` el nombre se ve entero (o ≥ 90 % con las vecinas en su mínimo), **ninguna animación de tamaño**, anillo sólido de 2px, `z-index: 2`, la fila sin recorte y nada fuera del `nav`.
**Movimiento:** nada al montar; bajar: `g-breadcrumbs-enter` (240ms, `linear(…)` = `--g-ease-spring`) + `g-breadcrumbs-enter-fade` (160ms), parte de `−space × 3` con posición intermedia, va detrás (`z-index: 0`) y termina en su sitio; subir: copia de ancho 0, inerte, sin ids, sin puntero, `g-breadcrumbs-leave` 160ms, la fila recorta mientras está y la copia se retira; el cambio de etapa (720 → 300 → 720px) sin animaciones; sin `is-ready`, la fila recorta y no hay transiciones. **Reducido:** solo `g-breadcrumbs-enter-fade` en `fast`, sin copia, escalera sin animar, chevrons sin transición de giro, panel sin desplazamiento.
**Táctil** (`pointer: coarse` emulado en los tres motores, 390px): todo destino (fila, cara y paneles) ≥ 44 × 44, alto 44 en todas las etapas (Δ0), nada fuera del `nav`, la página sin desborde. **Zoom 200 % y 400 %** (visor de 640 y 320px CSS): nada fuera, sin desborde de página; a 320px la ruta de 1100 pasa a `step`. **`forced-colors`** (Chromium): actual subrayado en la fila, la divulgación y la escalera; bordes en puerta, «Subir», divulgación y panel; puerta abierta distinguible. **Consola** limpia.

## Lo que NO se verificó

- El **componente real**: hecho en la auditoría (paso 5), `design/lab/breadcrumbs/auditoria.md`, con la medida por lotes de bruno, la pista visual del motor real y el slot `link`.
- La **pista visual** (modo visual de `GTooltip`) sobre lo recortado, la raíz en solo icono, «Subir», la divulgación y la puerta: no se emula en el banco.
- `forced-colors` en Firefox y WebKit (Playwright no los emula); Windows con contraste alto real; Safari e iOS/Android reales (toque, pulsación larga); lector de pantalla; nombres CJK e IME; texto agrandado por el usuario (no zoom) con `space` en px.
