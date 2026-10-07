# Entrega de coco · GAccordion.css

**Archivo:** `packages/vue/src/components/GAccordion/GAccordion.css`, **uno solo para `GAccordion` y `GAccordionItem`** (como `GTabs.css` con `GTabPanel`: el elemento suelto usa las mismas clases y el grupo es poco más que su contenedor). **`defaults.css` sin cambios:** ningún token nuevo (#485). La propiedad pública de entrada `--g-accordion-sticky-top` se **registra en este archivo** con `@property` (`<length>`, hereda, `0px`; #484) y no va en `defaults.css`.
**Contratos:** `design/contracts/accordion.md` (#475 a #488, redactadas en `accordion.pendientes.md`), `docs/contract/tokens.md` §6 y §29, `docs/contract/api.md` («Nodos hermanos de `GTooltip`», #383/#394). **Estructura:** `design/lab/accordion/r01/` (kiwi; concepto **A «Avance»** + `sticky`, decisión del usuario del 2026-10-07).
**Estado:** listo para bruno (el `.vue` y el motor compartido) y para la auditoría (paso 5) sobre el componente real.
**Banco:** `design/lab/accordion/estilo-banco.html`. El CSS se carga **dentro de la capa `grana.components`**, como lo registrará `components.css`. `XAccordion`/`XAccordionItem` emiten el marcado **exacto** de «Estructura accesible» y «Clases y datos», con el motor de plegado tal como lo describe el contrato (sin mirar `prefers-reduced-motion`, como `GFormSection`), el Δ0, `beforematch`, `#id`, el clic en el avance, `--_head-size` con `ResizeObserver` y lo que pide este estilo al `.vue` («Para bruno»). Anfitrionas y contenido reales de `dist/`: `GCard`, `GSurface` (sunken, inset, flat), `GDialog` (normal e inset), `GSwitch`, `GBtn`, `GInput`; el panel de `GTabs contained` con sus clases. Secciones: preguntas frecuentes (avance, meta, deshabilitado, título largo), ajustes (avance que sigue al estado, acciones), `exclusive` sin avance, suelto, `sticky` bajo una cabecera fija de 48px, anfitrionas, RTL `ar` y 320px, anidado. Parámetros `?dark=1`, `?theme=propio|<nombre>`, `?slow=1`.
**Tema propio de esta entrega:** `estilo-tema.json` → `estilo-tema.css` (`node packages/cli/bin/grana.mjs theme design/lab/accordion/estilo-tema.json --out design/lab/accordion/estilo-tema.css`: brand `#5B2A86` ciruela, accent `#0F766E` verde azulado, neutros teñidos, radius 4, **space 3** (comprueba el piso de 44px), fontSize 15, **borde 2px**, **foco 3px**; claro y oscuro).
**Verificación:** `GRANA_PW_PORT=4214 node design/lab/accordion/estilo-verificar.mjs` (Chromium, Firefox y WebKit; `GRANA_DIST=<copia de dist/>` para no depender de un build en curso) → **1336/1336** (2026-10-07; 445 por motor: 26 temas × contraste y fondo pegado, geometría en dos temas, 320px, RTL, movimiento, reducido, búsqueda, impresión, `sticky`, `forced-colors` en Chromium, consola).

## Personalidad (lo que lo hace distinto)

Un acordeón genérico es una caja gris con un chevron que gira y un panel que se descuelga. El de Grana **no tiene cajas** y trata el encabezado como el principio de la lectura, no como un interruptor:

| Pieza | Qué hace el CSS | Por qué es de Grana |
| --- | --- | --- |
| **La línea que no se mueve (A2)** | El avance (`__peek`) y el panel comparten **la misma celda** de la rejilla del elemento, con la misma letra (`body`), la misma sangría y el primer hijo del contenido sin margen. Al abrir, la primera línea del contenido nace **exactamente** sobre el avance (Δ 0,00px medido en los tres motores, cuadro a cuadro), el avance se funde por debajo cuando esa línea ya está entera y solo se van los puntos suspensivos | Se empieza a leer la respuesta cerrada y se sigue leyendo en el mismo sitio al abrir: el ojo no tiene que volver a buscar |
| **La respuesta se enciende** | Con avance, el contenido plegado tiene el color del avance (`text-muted`); al abrir pasa a `text` en `slow` lineal mientras se desenrolla. Al plegar, a la inversa | El paso de «vista previa» a «lectura» se ve en el color, no solo en la altura |
| **El avance vuelve sin parpadeo** | Al plegar, el avance reaparece **en el acto**, debajo de la primera línea del contenido (el panel se pinta encima): con el mismo texto no se ve volver, y asoma a medida que el panel recorta esa línea. Medido: con un fundido de `fast`, la línea de una respuesta corta se quedaba al **35 %** a mitad del plegado; así, **≥ 92 %** en los tres motores | La línea que se lee es la misma abierta, cerrada y mientras cambia |
| **El chevron se asoma hacia donde irá** | Al pasar por el botón **o por el avance** de un cerrado, el chevron pasa a `text` y baja media unidad (`--g-space-1 × 0.5`, `fast` + `ease-out`); en un abierto, sube media unidad (anticipa el pliegue). La línea de la fila cerrada se marca (`border` → `border-strong`). Solo con `(hover: hover)`; la inclinación, solo sin movimiento reducido | Anticipa la dirección del cambio sin pintar una caja de «hover»; el avance responde igual que el botón porque abre igual (Fitts, #483) |
| **El encabezado que acompaña se despega** | Con `sticky`, encabezado y acciones de un abierto se pegan con el fondo opaco de **su anfitriona**; **solo mientras están pegados de verdad** dejan una línea fina y la sombra mínima (`--g-shadow-1`) debajo, de borde a borde, con un fundido (consultas `scroll-state`, mejora progresiva) | Se distingue «estoy leyendo bajo este título» de «el título está en su sitio», sin una sombra permanente que ensucie la lista |
| **Sin cajas** | Una línea de 1 grosor de borde debajo de cada elemento del grupo; el suelto, sin línea; un grupo anidado que cierra un contenido no repite la última línea | La lista se lee como un texto con capítulos, no como un formulario de tarjetas |

Lo que **no** hace (a propósito): ni muelle ni rebote (#299, #483: es un panel); ninguna animación al montar (`is-ready`); nada con `is-instant` (búsqueda, `#id`, `OPEN_REQUEST`, cerrar desde el pegado); ningún fondo de hover (la sangría existe por el anillo, no por una caja); ninguna `@keyframes`.

## Medidas (de tokens; constantes de diseño, no tokens nuevos)

| Medida | Valor (tema por defecto) | De dónde |
| --- | --- | --- |
| Alto mínimo del botón | **44px** en todos los punteros; real: 60 sin avance, 48 con avance; **44** con `space` 3 (tema propio) | `min-block-size: 44px` + `space-4` arriba, `space-4`/`space-1` abajo, línea de `title-sm` |
| Sangría de lectura (título, avance, acciones, contenido) | **4px** = `--g-focus-width` + `--g-focus-offset` | El anillo va **hacia dentro** (`outline-offset: −focus-width`) y nunca pisa la letra; la línea separadora llega de borde a borde |
| Título · meta · avance · contenido | `title-sm` (`--g-font-title`) · `body-sm` `text-muted` · `body` `text-muted` · `body` | Contrato «Geometría» |
| Chevron | `chevron-right` de 1em del cuerpo (16px) en una caja del interlineado del título; **centrado en la primera línea** (Δ 0,00px, también con un título de 2 líneas) | Como `GFormSection`, al final (A) |
| Meta | Centrado en la primera línea del título (Δ 0,00px); su mínimo es su palabra más larga: cede el título antes que partir «Disponible» | `margin-block-start: (línea title-sm − línea body-sm) / 2` |
| Acciones | Centradas en la línea del título (Δ 0,00px); columna `fit-content(34%)`: nunca más de un tercio salvo su botón más ancho, los botones se apilan dentro | A 320px con dos botones, «Notificaciones» queda entera |
| Aire después del avance o del contenido | `space-4` hasta la línea | |
| Separador | `--g-border-width` `--g-color-border`; al pasar, `--g-color-border-strong` | Solo elementos del grupo (por clase, no por `>`: un envoltorio de la aplicación no lo pierde) |
| Encabezado pegado | `inset-block-start: --g-accordion-sticky-top − --_scroll-pad`; fondo `--_sticky-bg`; `z-index: 1` | #484 |

## Contraste (`estilo-verificar.mjs`, 26 temas: por defecto, propio y once generados, claro y oscuro)

| Tema | Título | Meta | Avance | Chevron | Deshabilitado | Contenido | Foco | Título en anfitrionas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Por defecto claro | 17,40 | 7,46 | 7,46 | 7,46 | 5,10 | 17,40 | 5,69 | 16,10 |
| Por defecto oscuro | 16,46 | 9,29 | 9,29 | 9,29 | 6,71 | 16,46 | 4,95 | 15,22 |
| Propio claro | 17,44 | 7,44 | 7,44 | 7,44 | 5,14 | 17,44 | 5,47 | 16,11 |
| Propio oscuro | 16,46 | 9,24 | 9,24 | 9,24 | 6,68 | 16,46 | 4,89 | 15,23 |
| **Mínimo en los 26** (iguales en los tres motores) | **16,43** | **7,38** | **7,38** | **7,38** | **5,05** | **16,43** | **4,52** | **15,20** |

Otras cifras medidas en los tres motores: botón mínimo 48px (por defecto) y 44px (`space` 3); chevron, meta y acciones Δ 0,00px de la primera línea del título; A2 Δ 0,00px al abrir y al plegar, presencia mínima de la línea 0,92 (Chromium) / 0,97 (Firefox y WebKit); Δ0 en `exclusive` 0,39 / 0,48 / 0,77px.

Título y contenido ≥ 4,5:1 sobre la página y sobre las anfitrionas (`GCard`, `GSurface` sunken, inset y flat, panel de `GTabs`); meta, avance y título deshabilitado (`text-subtle`) ≥ 4,5:1; chevron ≥ 3:1 (gráfico); anillo de foco (`--g-color-focus`) ≥ 3:1. El separador es decorativo (la estructura la dan los encabezados y el botón; 1.4.11 no lo pide).

## Movimiento

| Qué | Sin preferencia | Con `prefers-reduced-motion: reduce` |
| --- | --- | --- |
| Altura (rejilla `0fr → 1fr` del panel) | `slow` + `ease-out` | Sin movimiento: abrir pone el alto final en el primer cuadro; plegar **conserva el alto** mientras `is-animating` y luego desaparece de una vez |
| Contenido | — | Fundido del **panel** en `fast` lineal (abrir y plegar). Va en el panel para que el respaldo del motor (`transitionMs(panel) + 50`) espere a que acabe |
| Color del contenido con avance | `text-muted → text` en `slow` lineal | Igual, en `fast` |
| Avance al abrir | Opacidad en `fast` lineal con retraso `fast / 3` (la primera línea ya está entera: medido antes de la mitad del fundido); `visibility` a `slow` | Fundido en `fast` |
| Avance al plegar | En el acto, debajo de la primera línea (ver «Personalidad») | Fundido en `fast`, debajo del panel que se funde (fundido cruzado) |
| Chevron | Giro en `fast` + `ease-out` | Sin transición |
| Chevron al pasar | Color en `fast` + `ease-standard`; inclinación `±space-1 × 0.5` en `fast` + `ease-out` | Solo el color |
| Línea de la fila al pasar | `fast` + `ease-standard` | Igual (es color) |
| Línea que se despega | Opacidad en `fast` + `ease-standard` | Igual (es opacidad) |

Nada supera 240ms (#71). Sin `is-ready` (primer pintado, SSR) y con `is-instant`, nada se anima. La transición de altura es la única que da `transitionend` de `grid-template-rows` (el motor asienta con ella).

## Decisiones de CSS

- **Un archivo** (`GAccordion.css`) con el grupo y el elemento. Si bruno prefiere dos, se parte por el comentario «Elemento» sin cambiar nada; el registro necesita uno solo.
- **Sin `visibility: hidden` en el panel ni en el contenido** (#480). El único `visibility: hidden` es el del **avance** abierto, que no es antepasado del contenido (la búsqueda de la página no se entera). Comprobado: `#:~:text=` abre lo plegado en los tres motores con este CSS.
- **Alias propios:** `--_inset`, `--_pad-start`, `--_pad-end`, `--_after`, `--_t`, `--_t-fade`, `--_chev`, `--_sticky-bg`, `--_head-size`, `--_scroll-pad` y `--_accordion-on` (este último, en las anfitrionas). No lee alias de otros componentes.
- **Mapa de anfitrionas por herencia** (`--_sticky-bg`, #484): cada anfitriona de Grana publica su tono en `--_accordion-on` sobre sí misma (`GSurface` según nivel y tono, como su propio `--_tone`; `GDialog` `surface-shell`; `GDialog` inset `surface-inset`; panel de `GTabs contained` `--g-tabs-panel`) y el grupo lo toma si tiene alguna anfitriona por encima; si no, `--g-color-bg`. Así gana **la más cercana** sin depender del orden de las reglas (una `GSurface` dentro de un `GDialog`, o un `GDialog` escrito dentro de una `GCard`). Una `flat` no publica: hereda la de fuera. Medido: el fondo pegado = el fondo efectivo de la anfitriona en las seis del banco y en los 26 temas, y en los dos `GDialog`.
- **`--g-accordion-sticky-top` vale 0 dentro del cuerpo de un `GDialog`** (`calc(var(--g-space-1) * 0)`): su cuerpo es el contenedor de desplazamiento y la cabecera fija de la aplicación no lo tapa. La aplicación puede volver a ponerla en el diálogo («Para lima», 1).
- **`--_scroll-pad`** (dato del `.vue`, «Para bruno», 3): `position: sticky` se pega al borde del **relleno** del contenedor de desplazamiento; en el cuerpo de un `GDialog` (20px de relleno) el texto pasaba por encima del encabezado pegado en esa franja. Restándolo, el encabezado se pega al borde (medido: 0px en `GDialog` y en `GDialog` inset).
- **Estimación de `--_head-size` en CSS** (una línea de título: relleno + línea de `title-sm`): el `scroll-margin` del contenido es correcto antes de que el `.vue` mida; la medida real en línea gana.
- **`scroll-margin` del contenido en todos los elementos del grupo `sticky`**, no solo en el abierto: un `#id` de dentro llega antes de que el `.vue` lo abra (`beforematch`).
- **`sticky` y el color tenue del contenido plegado van bajo `@media screen`**: en impresión no se pega nada y todo es contenido; así la regla de impresión no necesita `!important` (la de la rejilla usa la clase doble, como `GAdaptiveLayout`).
- **La línea que se despega** usa `::after` de encabezado y acciones, cada uno consultando su propia pieza (`container: g-accordion-sticky / scroll-state`); recortada hacia arriba y a los lados (`clip-path`) para que no haya costura entre las dos sombras. En Firefox y WebKit de Playwright no hay `scroll-state`: queda el fondo opaco (sin línea), que es suficiente.
- **Título y meta con `overflow-wrap: break-word`** (no `anywhere`: rebajaría su mínimo intrínseco y el meta se partía en «Disponi-ble» a 320px). El contenido también lleva `break-word` (una palabra o un enlace largos no desbordan la página, como `GDialog`).
- **#383/#394:** los selectores por estructura sobre hijos de la aplicación (`__body > :nth-child(1 of :not(:where(.g-tooltip)))`, `:nth-last-child(…)` y el grupo anidado último) ignoran `.g-tooltip`; el `scroll-margin` del contenido también.
- **`forced-colors`:** el chevron toma `ButtonText` (el gris del tema se descarta), el deshabilitado `GrayText`; separadores, fondo pegado y anillo los fuerza el sistema (medido en Chromium: separador y fondo opacos).
- **Impresión:** rejilla a `1fr` y opacidad 1, `[hidden]` con `display: block` + `content-visibility: visible` (Chromium y WebKit no imprimen un `until-found`), sin chevron, avance, acciones ni línea que se despega, encabezado `break-after: avoid`. Medido: 0 contenidos de alto 0, todo en `text`.

## Para bruno (lo que el CSS espera del `.vue`)

Además de «Clases y datos» del contrato:

1. **`--_scroll-pad`** (px, **dato nuevo**): en un grupo `sticky`, el `padding-block-start` calculado del contenedor de desplazamiento (el mismo antepasado que usa `keepInPlace`; `0` o sin escribir si es `document.scrollingElement`), escrito en línea en la **raíz del grupo** al montar y al abrir un elemento (escritura en rAF y solo si cambia, #173). Sin él, dentro de un `GDialog` el texto pasa por encima del encabezado pegado en una franja del alto del relleno. El banco lo hace en `measurePad`.
2. **Foco tapado en WebKit (2.4.11):** con el foco por teclado, WebKit **no** desplaza un control que ya asoma por debajo del encabezado pegado (Chromium y Firefox sí, con el `scroll-margin` del CSS): medido, el control quedaba a 20,9px, tapado. Receta medida en los tres motores: en un grupo `sticky`, `focusin` en el contenido de un abierto de **este** grupo → si `target.top < encabezado.bottom`, `target.scrollIntoView({ block: 'nearest' })` (WebKit sí respeta `scroll-margin` ahí: queda a 96px, justo bajo el pegado). El banco lo hace en `onFocusin`.
3. **`--_head-size`** solo en el elemento abierto de un grupo `sticky` (como dice el contrato); el CSS ya pone una estimación en todos los del grupo, así que quitarlo al cerrar no deja un hueco.
4. **El motor no debe mirar `prefers-reduced-motion`** (como `GFormSection` hoy): el CSS de movimiento reducido cuenta con `is-animating` durante el fundido de plegar (conserva el alto) y con el respaldo `transitionMs(panel) + 50` (el fundido va en el panel). Medido en el banco con ese motor: abrir pone el alto final en el primer cuadro y plegar conserva el alto ≥ 2 cuadros y asienta `until-found`.
5. **El avance no lleva `pointer-events: none`** (el prototipo de kiwi sí): cerrado recibe el clic que abre; abierto, el CSS se lo quita.
6. **El chevron** es el `GLibIcon` dentro de `span.g-accordion-item__chevron` (`> .g-icon` debe ser hijo directo: el giro y el espejo van en el icono, la inclinación en la caja).
7. **Prueba de impresión:** al emular `print` en caliente, las transiciones de color corren 240ms; esperar antes de medir colores.

## Para lima

1. **`--g-accordion-sticky-top` vale 0 dentro de `.g-dialog__body`** (lo pone `GAccordion.css`). El contrato dice que la aplicación la pone en `:root`, un contenedor o el grupo; falta decir que dentro de un `GDialog` el componente la pone a 0 (otro contenedor de desplazamiento) y que la aplicación la vuelve a poner en el diálogo si tiene una cabecera propia dentro. Propuesta para `accordion.md` «`sticky`» y `tokens.md` §38.
2. **Dato nuevo `--_scroll-pad`** (px, en la raíz del grupo `sticky`; «Para bruno», 1) para «Clases y datos» y `tokens.md` §29.5.
3. **Coreografía del avance al plegar:** el contrato dice «el avance vuelve cuando el panel casi se fue» con un fundido; medido, eso deja la línea al 35 % (respuesta de una línea) a mitad del plegado. El CSS lo devuelve **en el acto** por debajo del contenido (presencia ≥ 92 %). El criterio de A2 (Δ ≤ 1px; primera línea entera antes de la mitad del fundido de abrir) no cambia; conviene añadir «la línea no desaparece al plegar».
4. **Constante de coreografía** `--g-space-1 × 0.5` (inclinación del chevron al pasar) para `tokens.md` §29.6 (ya existe para el tope de `GNumberField`, #313; uso nuevo, no valor nuevo).
5. **Foco en WebKit** («Para bruno», 2): el criterio de 2.4.11 del contrato («con Mayús+Tab… entero a la vista») no se cumple solo con CSS en WebKit; con la receta de `focusin`, sí. Si se acepta, va a «Foco» de `accordion.md`.
6. **`sticky` anidado** (un grupo `sticky` dentro del contenido de otro `sticky`): los dos se pegan a la misma altura y el de dentro tapa al de fuera. No está en el contrato; propuesta: límite del README (o, si se pide, el de dentro suma el `--_head-size` del de fuera en una ronda futura).
7. **Acciones en su línea a anchos estrechos** (el L9 de `GFormSection`): sin JS no se puede saber si caben; con la columna a un tercio, a 320px dos acciones y un título de palabras normales caben sin partir palabras. Si una aplicación lo necesita, sería una clase `is-actions-below` del `.vue`, como `GFormSection` (#289): ronda futura.

## Límites conocidos (para mora-docs)

- **Ajustes con avance distinto del contenido** (estado frente a interruptores): al abrir, el avance y el primer renglón del contenido coinciden en el sitio durante el fundido (≤ 160ms), y al plegar el avance asoma por debajo del contenido que se va. Es el comportamiento de A que vio el usuario; con el mismo texto (preguntas frecuentes, receta del README) no se nota.
- La línea que se despega solo existe donde hay consultas `scroll-state` (Chromium); en los demás, el encabezado pegado es opaco y sin línea.
- Encabezado pegado dentro de un contenedor de la aplicación con fondo propio: la aplicación pone el `background` de `.g-accordion-item__heading` **y** de `.g-accordion-item__actions` (receta).

## No verificado

Lector de pantalla y `forced-colors` reales (solo Chromium emula `forced-colors`); impresión en papel (se midió con `emulateMedia('print')`); táctil real (`sticky` con la barra del navegador móvil); texto al 200 %; Safari real; Ctrl+F real (se midió con `#:~:text=`).
