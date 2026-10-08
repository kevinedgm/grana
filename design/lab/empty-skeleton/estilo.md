# Entrega de coco · GEmpty.css, GLoadRegion.css, carga de GTable y `--g-color-mold`

**Archivos:** `packages/vue/src/components/GEmpty/GEmpty.css`, `packages/vue/src/components/GLoadRegion/GLoadRegion.css`, `packages/vue/src/components/GTable/GTable.css` (estados de carga) y `packages/vue/src/styles/defaults.css` (token nuevo `--g-color-mold`).
**Contratos:** `design/contracts/empty.md`, `design/contracts/load-region.md`, `design/contracts/table.md` §«Carga, vacío y error con el motor común» (DECISIONS.md #529 a #543; `tokens.md` §42). **Estructura:** `design/lab/empty-skeleton/r01/` (kiwi). Decisión del usuario: **A «Molde» + B «Lo último conocido»**; C reservada.
**Estado:** listo para bruno (`.vue`, motor y registro) y para la auditoría (paso 5) sobre el componente real.
**Banco:** `estilo-banco.html` + `estilo-banco.js`. Carga los estilos **fuente** de Grana (`src/styles/grana.css`: el `defaults.css` con `--g-color-mold` y el `GTable.css` nuevos, sin build) y `GEmpty.css` y `GLoadRegion.css` **dentro de la capa `grana.components`**, con la fuente servida. Las plantillas de «la aplicación» (lista, teselas, ficha) llevan su CSS **sin capa**, como en cualquier proyecto, para comprobar que el molde gana. El motor del banco solo pone las clases de fase (sin tiempos, anuncios ni foco). Parámetros `?dark=1`, `?theme=propio|<nombre>`.
**Tema propio:** `estilo-tema.json` → `estilo-tema.css` (`node packages/cli/bin/grana.mjs theme design/lab/empty-skeleton/estilo-tema.json --out design/lab/empty-skeleton/estilo-tema.css`: brand `#3B3F8F` añil, accent `#B4461E` teja, neutros teñidos, radius 10, **space 5**, **borde 2px**; claro y oscuro).
**Verificación:** `GRANA_PW_PORT=4216 node design/lab/empty-skeleton/estilo-verificar.mjs` (Chromium, Firefox y WebKit) → **4809/4809**.

## `--g-color-mold` (tokens.md §42, #538)

`color-mix(in srgb, var(--g-color-text) 18%, var(--g-color-surface))`, el valor de kiwi, **declarado en los tres bloques** del grupo de color (claro, consulta oscura y `[data-theme="dark"]`). Un `var()` se resuelve donde se declara: sin redeclararlo, un `[data-theme="dark"]` anidado en una página clara heredaría el tono claro ya calculado. Como se deriva de `text` y `surface`, **un tema propio no tiene que declararlo** (los once generados y el propio no lo traen y cumplen).

| Medida (26 temas: por defecto, propio y los once de `generated/`, claro y oscuro; tres motores) | Mínimo | Máximo | Regla |
| --- | --- | --- | --- |
| `mold` frente a `surface` | **1,46** (todo claro) | **1,71** (todo oscuro) | ≥ 1,3 y < 3 |
| Opacidad | 1 | 1 | opaco |
| `mold` frente a `bg` (informativo) | 1,46 | 1,85 | — |
| `mold` frente a `surface-sunken` (informativo) | **1,34** | 1,91 | — (sigue ≥ 1,3 sobre la superficie hundida) |

Por defecto: 1,46 claro y 1,71 oscuro (lo medido por kiwi). En `forced-colors`, `GrayText` (alias `--_mold` de la región; `GTable` y su casilla esqueleto, directo).

## Personalidad (qué lo hace distinto)

| Pieza | Qué hace el CSS | Por qué es de Grana |
| --- | --- | --- |
| **El molde es la plantilla** (A) | Bajo `is-mold`, toda la tinta de la plantilla de la aplicación se vuelve transparente; **cada hoja de texto** es una barra `line-through` de `0.72em` en `--g-color-mold`, del largo de su texto real; las cajas con borde quedan en contorno del tono (el avatar es un círculo, la insignia una píldora, la tesela su marco sin sombra); imágenes, `svg`, vídeo ocultos con su caja; lo que lleva `data-g-known` conserva su tinta en `text-muted` (con su icono) | No hay un segundo dibujo: la espera **es** la pantalla sin tinta. Medido: Δ 0 en lista, teselas y ficha en texto libre, y 0 piezas que se mueven entre contenido y molde |
| **La tinta llega a su sitio** (A) | `is-mold + is-revealing`: la regla «sin tinta» se retira y el color, los fondos y los bordes vuelven por **transición** (`--g-duration-slow` + `--g-ease-out`), mientras cada barra pasa del tono a transparente: **las barras se funden en el texto** | Ningún keyframe, nada se desplaza ni escala (medido: intermedio a 60 ms, 0 piezas movidas, termina en tinta plena y sin transiciones) |
| **Nada se borra** (B) | Lo de antes sigue tal cual, inerte, con cursor `progress`; un **filo** de `border-width × 2` en `accent-text` corona la región y la **píldora** «Actualizando» (`accent-soft`, `refresh-cw`) cabalga sobre él al final lógico, sin tapar contenido; lo nuevo lleva una **marca** de `border-width × 3` al inicio lógico (no cambia su caja) | El estado se dice en el borde, no encima de los datos |
| **El primer hueco** (vacío) | Caja discontinua `border-strong` con el **alto de un elemento** (`--_load-slot`), un **círculo discontinuo** de `space × 10` donde irá el avatar (vacío en `none`; en `error`, círculo e icono en `danger-text`), texto en medio y acciones al final que bajan solas sin consultas | Ocupa el sitio del primero que llegará, no un póster centrado |
| **La salida con cuentas** (vacío por filtro) | Con `is-exit`, las salidas van **debajo del texto y alineadas con él**; cada «Quitar «…»» lleva su cuenta como una **ficha** de cifras tabulares (`neutral-soft` / `on-neutral-soft`, `caption`) | La cuenta se lee de un vistazo y no salta al cambiar de cifra |

Lo que **no** hace (a propósito): ningún pulso ni barrido (#539), nada se mueve en B, ni en la barra de fallo, ni en el vacío; ninguna animación en curso al terminar (medido, tres motores; los giros de `GBtn` en reposo están pausados y no cuentan como carga).

**Cambio sobre el contrato (ver «Para lima», 1): sin desaturar lo de antes.** `filter: saturate(0)` bajaba pares en el límite por debajo de 4,5:1 (medido por píxeles en Chromium: `accent-text`/`surface` 4,58 → **3,97** y `on-accent-soft`/`accent-soft` 4,52 → 4,08 en el oscuro por defecto; 3,81 en el propio oscuro). El contrato pide «sin saturación (el texto conserva su contraste)»: las dos cosas no se cumplen a la vez, y manda el contraste. B se dice con el filo, la píldora y el cursor; el verificador comprueba que el contraste de lo de antes no cambia (Δ 0 en los 26 temas).

## Medidas (constantes de diseño desde tokens; ninguna es token)

| Medida | Valor | Por defecto (`space` 4) | Propio (`space` 5) |
| --- | --- | --- | --- |
| Hueco del icono de `GEmpty` | `space × 10` (el avatar de una fila) | 40 | 50 |
| Icono dentro del hueco | `space × 5` | 20 | 25 |
| Relleno de `GEmpty` | `space × 3` / `space × 4` (el de una fila) | 12 / 16 | 15 / 20 |
| Base del texto de `GEmpty` | `space × 36` (las acciones bajan cuando no caben junto a ella) | 144 | 180 |
| Sangría de la salida (`is-exit`) | hueco + `space × 3` | 52 | 65 |
| Separación de acciones con puntero grueso | fila `space × 4` (las áreas de 44 de un `GBtn` sm no se solapan) | 16 | 20 |
| Grosor de la barra del molde | `0.72em` (constante de la técnica, #535) | — | — |
| Filo de B | `border-width × 2` | 2 | 4 |
| Marca de lo nuevo | `border-width × 3`, `space × 2` desde arriba y abajo | 3 | 6 |
| Píldora | `space × 4` desde el final lógico, centrada sobre el filo | 16 | 20 |
| Base del texto de la barra de fallo | `space × 48` | 192 | 240 |
| Barra del esqueleto de `GTable` | `1lh − space × 2` en la caja de línea (receta de `GSummary`) | 12 | 10 |
| Largos del esqueleto de `GTable` | 60 % (80 % la principal); filas 3n+2 40 % (65 %), 3n 70 % | — | — |
| Casilla esqueleto de `GTable` | contorno `space × 4.5` (24px con puntero grueso), la medida de la casilla real | 18 | 22,5 |

## Contraste (`estilo-verificar.mjs`, 26 temas × 3 motores; mínimo)

| Pieza | Por defecto claro | Por defecto oscuro | **Mínimo en los 26** | Exigido |
| --- | --- | --- | --- | --- |
| Título del vacío (`text`) | 17,40 | 15,22 | **15,20** | 4,5 |
| Descripción y traza (`text-muted`) | 7,46 | 8,59 | **7,38** | 4,5 |
| Cuenta (`on-neutral-soft` / `neutral-soft`) | 6,54 | 4,56 | **4,53** | 4,5 |
| Botones de la salida (`GBtn` outline, ghost; solid en `actions`) | 16,48 | 15,22 | **4,53** | 4,5 |
| Icono de error (`danger-text`, decorativo) | 5,49 | 4,52 | **4,51** | — (≥ 3 medido) |
| Contorno discontinuo (`border-strong`, decorativo) | 1,45 | 1,90 | 1,39 | — |
| Lo conocido en el molde (`text-muted`) | 7,46 | 8,59 | **7,38** | 4,5 |
| Espera larga (región y tabla, `text-muted` / `surface`) | 7,46 | 8,59 | **7,38** | 4,5 |
| Píldora (`on-accent-soft` / `accent-soft`) | 5,00 | 4,52 | **4,51** | 4,5 |
| Filo de B (`accent-text` / `surface`) | 5,69 | 4,58 | **4,52** | 3 |
| Marca de lo nuevo (`accent-text` / fondo de la fila) | 5,69 | 4,58 | **4,52** | 3 |
| Barra de fallo: texto (`text` / `danger-soft`) | 15,20 | 14,14 | **14,08** | 4,5 |
| Barra de fallo: icono (`on-danger-soft`) | 4,80 | 4,53 | **4,53** | 3 |
| Barra de fallo: «Reintentar» (`GBtn` soft neutral) | 6,54 | 4,56 | **4,53** | 4,5 |
| Esqueleto de `GTable` (`mold` / `surface`) | 1,46 | 1,71 | **1,46** | ≥ 1,3 y < 3 |
| B: contraste de lo de antes al refrescar (píxeles) | Δ 0 | Δ 0 | **Δ 0** en los seis pares | sin cambio |

## Decisiones de CSS

- **`!important` solo en el molde (#535)**: toda declaración importante de `GLoadRegion.css` está en una regla cuyos selectores llevan `.is-mold` (comprobado por el verificador). Fases: `is-mold` (sin tinta) → `is-mold + is-revealing` (la tinta llega) → ninguna. **El revelado forma parte del molde**: con la transición y la barra transparente bajo `!important`, una plantilla que declare su propio `text-decoration` (los enlaces casi siempre llevan `text-decoration: none`) o su propia `transition` ya no corta el fundido; con reglas sin `!important` el título enlazado de la fila pasaba a tinta de golpe (medido).
- **Barra solo en las hojas** (`:where(:not(:has(*)))`) y `text-decoration-line: none` en los contenedores (`:where(:has(*))`): conjuntos disjuntos, sin pelea de especificidad.
- **Retraso invisible**: `visibility: hidden !important` al cuerpo **y** a cada descendiente (una plantilla que declare `visibility: visible` se vería). Va después de la regla que devuelve la visibilidad al icono de `data-g-known`, que además excluye `is-pending`.
- **Pseudoelementos de la plantilla** (`::before`/`::after`) también pierden tinta y fondo en el molde (los puntos de una insignia, las marcas de la aplicación).
- **#383**: todo selector que toca la plantilla excluye `.g-tooltip` y lo que hay dentro (`:not(:where(.g-tooltip, .g-tooltip *))`).
- **La marca de lo nuevo** es un `::before` absoluto en el elemento con `data-g-fresh`, que recibe `position: relative` desde la capa (si la plantilla ya lo posiciona, sigue sirviendo). Alternativas descartadas: sombra interior o degradado (la plantilla las pisa sin capa con `box-shadow` o `background`).
- **`GEmpty`**: fila con `flex-wrap` (sin `@media` ni `@container`); `min-block-size: var(--_load-slot)` sin respaldo (fuera de una región vuelve a `auto`, medido); `box-sizing: border-box` para que el alto con borde sea el del elemento medido (Δ ≤ 0,5px en los tres motores).
- **`GTable`**: el esqueleto pierde el pulso (`g-table-pulse` fuera) y `surface-sunken`; barras de puntas rectas (`radius-xs`, como la barra del molde) en la caja de línea; la columna final lleva su barra al final; la fila esqueleto **dibuja la casilla en contorno** con la medida de la real, porque la casilla alarga la fila (medido: con el tema propio, 52 frente a 54,7px sin ella; con ella, Δ 0); sin fondo al pasar por una fila esqueleto; el `<table>` recibe el foco por programa con el anillo **por dentro** (el área desplazable lo recortaría); la espera larga es el último hijo de `__scroll`, `sticky` al pie con un margen negativo igual a su alto (una línea con elipsis: no mueve nada, medido); la barra de fallo en flujo antes de `__scroll`; con `GEmpty` en `td.g-table__empty`, relleno `space × 2` sin relleno lateral y alineado al inicio.

## Para bruno (lo que el CSS espera del `.vue`)

Además de «Clases y datos» de los contratos:

1. **Revelado**: un cuadro con `is-mold` y los datos reales (cuerpo aún `aria-hidden` + `inert`); en el cuadro siguiente, **`is-mold` + `is-revealing` juntos** (el cuerpo ya sin `aria-hidden` ni `inert`: son los datos); al terminar, se quitan los dos. Fin: `transitionend` de `color` en el cuerpo o tiempo de respaldo `--g-duration-slow` (240ms; con movimiento reducido `--g-duration-fast`, 120ms) + margen. Si `is-revealing` llega sin `is-mold`, no hay fundido.
2. **Barra de fallo**: el `span[aria-hidden]` del icono lleva la clase **`g-load-region__failed-icon`** (no está en el contrato; ver «Para lima», 3). «Reintentar»: **`GBtn size="sm" variant="soft" color="neutral"`** (medido ≥ 4,53:1 en 26 temas; con `outline` neutral bajaba a 4,29 sobre `danger-soft` en el oscuro).
3. **Píldora**: `span.g-load-region__pill > GLibIcon refresh-cw + texto`; el CSS la oculta fuera de `is-stale` aunque se monte.
4. **Espera larga**: `p.g-load-region__slow` hijo directo de la raíz (después del cuerpo); oculto fuera de `is-slow`.
5. **`--_load-slot`** en línea en la raíz, en px, alto de la caja de borde (`getBoundingClientRect().height`) del primer `[data-g-key]`.
6. **`GEmpty`**: botones de la salida `GBtn size="sm"` (`outline`; «Quitar todos» `ghost` si hay sueltos y `outline` si va solo, como el contrato) con la clase `g-empty__relax` en los sueltos; dentro de la etiqueta, el texto, `span.g-empty__count[aria-hidden]` y `span.g-empty__sr` (con un espacio delante, para que el nombre accesible no pegue la cifra visible a la frase oculta).
7. **`GTable`**: `is-pending` en la raíz dentro del retraso; las celdas esqueleto de una columna `align: 'end'` llevan **`g-table__cell--end`** (hoy solo llevan `--primary`); `p.g-table__slow` como **último hijo de `.g-table__scroll`** (después del `<table>`); `div.g-table__failed` antes de `.g-table__scroll` con **`span.g-table__failed-icon[aria-hidden]`**, **`p.g-table__failed-text`** y `GBtn` sm soft neutral; `tabindex="-1"` en el `<table>`; `GEmpty` como hijo directo de `td.g-table__empty`.
8. **Registro**: `GEmpty.css` en `components.css` (principal) y `GLoadRegion.css` también en `grana.css` (#530: el CSS de la entrada sigue en `grana.css`), los dos **después** de `GBtn.css` y `GIcon.css`; `GEmpty.css` antes de `GTable.css` no es necesario (no se pisan). Compuertas: `g-empty__relax`, `g-load-region__pill`.
9. **CLI**: `--g-color-mold` no lo emite aún `@grana/cli` (pendiente no bloqueante de §42); el valor de `defaults.css` sigue cualquier tema porque se calcula con su `text` y su `surface` (medido en los 26).

## Para lima

1. **Sin desaturación en B** (`load-region.md` §B, §«Clases»; #536): el contrato pide «lo viejo sin saturación (el texto conserva su contraste)», y lo medido dice que `saturate(0)` no conserva el contraste (Chromium filtra en sRGB: `accent-text`/`surface` 4,58 → 3,97, `on-accent-soft`/`accent-soft` 4,52 → 4,08 en el oscuro por defecto). Propuesta: retirar «sin saturación» de §B, #536 y la verificación de Playwright («filo, píldora, sin saturación, inerte» → «filo, píldora, inerte, contraste sin cambio»). B se dice con el filo, la píldora, `aria-busy` y el anuncio.
2. **El revelado es parte del molde** (precisa #535 y §«A · Molde»): las clases son `is-mold` → `is-mold + is-revealing` → ninguna (no `is-mold` → `is-revealing`), y el `!important` cubre también la transición y la barra transparente del revelado (todo bajo `.is-mold`). Motivo medido en «Decisiones de CSS». La transición incluye además `outline-color` y `box-shadow` (color, no movimiento; las teselas con sombra ya no aparecen de golpe).
3. **Clases nuevas** en «Clases y datos»: `g-load-region__failed-icon` (el `span` del icono de la barra); en `table.md`, `g-table__failed-icon` y `g-table__failed-text`, y `g-table__cell--end` también en las celdas esqueleto.
4. **Tokens añadidos a la lista de `GEmpty`** (§42): `--g-color-neutral-soft`, `--g-color-on-neutral-soft` (la ficha de la cuenta), `--g-text-caption-*`, `--g-radius-pill`, `--g-font-ui`. De `GLoadRegion`: `--g-font-ui` y `--g-radius-pill` (ya listado). Ningún token nuevo más.
5. **«Reintentar» de la barra de fallo**: el contrato dice `GBtn`; propongo fijar `variant="soft" color="neutral"` en `load-region.md` y `table.md` (medida en «Para bruno», 2).
6. **Idea de personalidad no aplicada** (necesitaría una constante de coreografía, #187): que el revelado avance **de elemento en elemento** (retardo `fast × min(i, 4) / 4` por `[data-g-key]`, como la escalera de `GBreadcrumbs`), para que la tinta «llegue» en el orden de lectura. Para una segunda tanda de personalidad (`PENDIENTES.md`); no la escribo sin decisión.

## Verificación (`estilo-verificar.mjs`, Playwright, Chromium, Firefox y WebKit: 4809/4809)

**Estático:** solo `var(--g-*)` y alias `--_*`; sin respaldos, `@layer`, `@property`, keyframes ni `animation` en los tres CSS (`g-table-pulse` fuera); sin colores ni mezclas literales; tokens existentes en `defaults.css`; `--g-color-mold` en los tres bloques con la mezcla de §42 y en bloques que declaran `text` y `surface`; `!important` solo en `GLoadRegion` y solo en reglas con `.is-mold`; `0.72em` como única medida en em de la región; sin px en la región y solo el texto oculto en `GEmpty`; transiciones solo de color; reducido en `--g-duration-fast`; #383; `forced-colors` en los tres.
**Contraste:** tablas de arriba, 26 temas × 3 motores; B por píxeles (seis pares, Δ 0).
**Geometría** (por defecto claro, oscuro y propio): molde de lo último conocido con Δ 0 de alto, Δ 0 de lo de debajo y 0 piezas movidas (lista, teselas, ficha); primera carga con muestra Δ 0 (las muestras del banco tienen el tamaño de la respuesta); retraso invisible (0 piezas visibles) con el sitio reservado; espera larga al pie sin cambiar el alto; hoja con barra de 0,72em en el tono, sin tinta pese al color de la plantilla, contenedores sin barra, cajas sin relleno con borde en el tono, tesela sin sombra, imagen oculta, `data-g-known` en `text-muted` sin barra con su icono; cuerpo `aria-hidden` + `inert`; revelado intermedio a 60 ms (tinta y barra), solo transiciones de color de `--g-duration-slow`, 0 piezas movidas, final en tinta plena sin transiciones; filo de `border-width × 2` arriba; píldora sobre el filo a `space × 4` del final (RTL: del inicio físico izquierdo); B sin filtro, inerte y con cursor `progress`; píldora oculta fuera de `is-stale`; marca de lo nuevo de `border-width × 3` al inicio lógico sin cambiar la caja (LTR y RTL); barra de fallo en flujo antes del cuerpo, lo conocido usable; primer hueco con `min-block-size` = un elemento y alto = un elemento (o su contenido si es mayor); `GEmpty` suelto sin mínimo; fila ancha en una línea y estrecha con acciones debajo; hueco `space × 10` discontinuo y redondo; `none` sin icono; salida debajo del texto y alineada, orden de más a menos («Hoy» 12, «Cerradas» 2, «Quitar todos»), cuenta tabular, `__sr` oculto; RTL (hueco a la derecha, salida alineada, molde con barra).
**GTable:** fila esqueleto = fila real con casilla (Δ ≤ 0,5); barra = `1lh − space × 2`; tono `mold`; 0 animaciones; con las filas que había, Δ 0 en el área y lo de debajo; barra de la columna final al final; espera larga al pie sin mover nada; retraso de la primera carga invisible y filas del refresco visibles; barra de fallo antes del área; `GEmpty` en la celda al inicio.
**Movimiento:** ninguna animación en curso ni infinita en regiones, tablas y vacíos al final de cada fase; los giros de `GBtn` en reposo, pausados. **Reducido:** revelado en `--g-duration-fast`.
**Táctil** (`pointer: coarse` emulado en los tres motores, 390px): todos los `GBtn` de vacíos y barras con área ≥ 44 × 44 y **ninguna área solapada**; la página sin desborde. **`forced-colors`** (Chromium): la muestra del molde sin tinta, barra, bordes del molde y esqueleto en `GrayText`, `data-g-known` en `CanvasText`, filo en `Highlight`, contorno del vacío en `CanvasText`. **Consola** limpia.

## Lo que NO se verificó

- El **componente real**: fases con los tiempos del motor (200/400/5000 ms), el cuadro en molde antes del revelado, `--_load-slot` medido por bruno, `is-pending` de `GTable` y el registro del `GEmpty` en la región. Queda para la auditoría (paso 5), con un tema distinto al por defecto.
- Plantillas reales de aplicaciones distintas de las del banco (componentes de Grana dentro del molde: `GBadge`, `GAvatar`, `GSummary`, `GTag`; tablas compuestas con avatar, cuyo esqueleto de una línea es más bajo que la fila: límite de #543).
- `forced-colors` en Firefox y WebKit y en Windows real; lector de pantalla; Safari e iOS/Android reales; zoom 200/400 % y texto agrandado; CJK; rendimiento del molde con 50 a 200 elementos.
- La segunda entrega (`GCard`, `GWidget`, `GCalendar`, `GDialog`, `GSummary`): sin tocar.
