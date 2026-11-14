# Auditoría de coco · GPageIndex `list` y `fold` (paso 5)

**Componente:** `GPageIndex appearance="list"` y su plegada `fold`, el **real**: `dist/page-index.umd.js` + la extensión `dist/page-index-list.umd.js` (`@grana/vue/page-index-list`, `GPageIndexList.js` de bruno) + `dist/grana.css` (`GPageIndex.css` de coco), reconstruidos con `npm run build` el 2026-11-12. Contrato `design/contracts/page-index.md` «Forma `list`» (#1054, #1067); ronda de kiwi `design/lab/page-index/r01/`. `relay` ya se auditó en el lote del sitio (`design/lab/sitio/auditoria.md`) y aquí solo se comprueba que no cambia.
**Banco:** `packages/vue/playground/sitio.html` de bruno (columna derecha desde 80rem, plegada en la barra local pegada por debajo, dos instancias con el mismo `v-model`, PI-L5), con `GAppShell header="pinned-wide"` real.
**Método:** `node design/lab/page-index/auditoria-verificar.mjs` (Playwright de `design/lab/theme-playground/`, Vue desde `node_modules`, puerto 4209): **910/910 en Chromium**. Contraste **medido** sobre el color compuesto real (texto, marcador, anillo y bordes sobre el fondo efectivo, capas translúcidas incluidas). Temas: **por defecto**, **zona de marca** (`data-g-zone="brand"` en la columna y en la barra local) y los **diez generados** de `design/lab/tema-oscuro/dark-color-presence/generated/` (entre ellos Spotify, marca pálida, y Lustre), cada uno en claro y oscuro: **24 configuraciones**. Además: 1280 (columna, cuatro posiciones de lectura), 1024 y 375 (plegada), táctil (`pointer: coarse`), RTL de página con etiquetas latinas y árabes, `forced-colors` emulado, movimiento reducido y sin reducir, sin chasis, estático del CSS y de la extensión, consola.
**Límite del entorno:** solo hay **Chromium** instalado. Firefox y WebKit **no se ejecutaron** (el script acepta `--engines=chromium,firefox,webkit` para quien los tenga).

## Resultado: sin defecto bloqueante tras una corrección de CSS (el marcador del panel)

Antes de la corrección, el script daba **30 fallos, todos del mismo defecto**: en el panel de `fold` la sección actual solo se distinguía por el color (`text` frente a `text-muted`, **2,33:1** en claro y **1,77:1** en oscuro), contra 1.4.1 y contra el propio contrato («Plegada» 6: «el marcador sí se pinta»; «Accesibilidad»: «el color solo no basta, el marcador es obligatorio»). Corregido en `GPageIndex.css` (hallazgo 1). Después: **910/910**.

### Auditoría visual previa y posterior (`docs/documentacion/auditoria-visual.md`)

| Aspecto | Estado | Evidencia |
| --- | --- | --- |
| Estructura y jerarquía | Cumple | Título en `title-sm-weight` y `text` (16,4:1 como mínimo); enlaces en `text-muted`; `h3` sangrados `space × 4`; filas de `space × 8`. La columna no flota: la línea guía la ata al borde inicial |
| Delimitación | Cumple | Columna: línea guía `border` (decorativa, 1,17 a 1,66:1; el estado lo lleva el marcador). Panel: `border-strong` + `shadow-2` + `radius-lg` (filo 1,39 a 2,71:1, como cualquier panel flotante de Grana; no es un control) |
| Estados | Cumple | Reposo, hover (color), actual (color + marcador), foco (anillo), plegada cerrada y abierta (`aria-expanded`, chevron girado), sin actual (sin marcador) |
| Consistencia con tokens | Cumple | Solo `var(--g-*)` y `--_*`, sin respaldos ni colores literales; ningún token nuevo (`tokens.md` §60). Únicas medidas literales: `24px` y `44px` (área táctil), el `0.5px` de paso de `round()` (rejilla de medio píxel, como `GBtn.css`) y `round(1px, 1px)` de la consulta `@supports`, que no son medidas |

### Contraste (mínimo de las 24 configuraciones; detalle con `--verbose`)

| Medida | Por defecto claro / oscuro | Zona de marca | Spotify claro / oscuro | Mínimo en las 24 | Umbral |
| --- | --- | --- | --- | --- | --- |
| Enlace (`text-muted`) | 7,46 / 9,29 | 10,90 | 7,38 / 9,32 | **7,38** | 4,5 |
| Actual (`text`) | 17,40 / 16,46 | 16,48 | 17,41 / 16,54 | **16,43** | 4,5 |
| Título | 17,40 / 16,46 | 16,48 | 17,41 / 16,54 | **16,43** | 4,5 |
| Marcador de la columna (`accent-text`) | 5,69 / 4,95 | 5,59 | 4,61 / 14,24 | **4,52** (Apple claro) | 3 |
| Anillo de foco (`focus`) | 5,69 / 4,95 | 5,59 | 4,61 / 14,24 | **4,52** | 3 |
| Botón de `fold` (`text-muted`) | 15,33 / 14,90 | 15,39 | 15,38 / 14,98 | **14,87** | 4,5 |
| Enlace / actual en el panel | 7,46 · 15,33 / 8,59 · 13,78 | 10,90 · 15,39 | 7,38 · 15,38 / 8,62 · 13,86 | **7,38 · 13,77** | 4,5 |
| «Volver arriba» (`accent-text`) | 5,69 / 4,58 | 5,59 | 4,61 / 13,18 | **4,52** | 4,5 |
| Marcador del panel (nuevo) | 5,69 / 4,58 | 5,59 | 4,61 / 13,18 | **4,52** | 3 |
| Actual frente a enlace (informativo) | 2,33 / 1,77 | 1,51 | 2,36 / 1,78 | 1,51 | — (por eso el marcador) |

El botón de `fold` mide 14,9:1 porque pasa a `text` al abrirse (la medida es con el panel abierto); cerrado es `text-muted` sobre la barra local, el mismo par que los enlaces (≥ 7,38). Margen más estrecho: «Volver arriba» y los marcadores en Apple claro (4,52): el `accent-text` del tema lo deriva el CLI para ≥ 4,5, así que no depende de este componente.

### Pruebas por comportamiento

| Prueba | Resultado |
| --- | --- |
| Columna, cuatro posiciones (`s2`, `s4a`, `s7`, `s10b`) × 24 temas | Una sola `aria-current="location"` y `has-current`; marcador **2 × 18**, centrado en la fila (±1,5 px) y **sobre la línea guía** (±1 px) |
| Tamaños | Filas de 32 (fino) y **44** con `pointer: coarse` (columna y panel); «Volver arriba» 48 / 44; botón de `fold` **24** (fino) y **44** (táctil); texto 14 px, botón 12 px (`caption`) |
| Foco por teclado | Anillo `solid` de 2 px en los enlaces de la columna (por dentro, `offset` −2, no lo recorta el desplazador), en el botón, en «Volver arriba» y en los enlaces del panel; el anillo del enlace queda dentro del panel. Esc cierra y devuelve el foco al botón |
| Plegada a 1024 y 375 | Panel dentro del visor en horizontal (375: 24 a 367); con `align="start"`, alineado al botón. En vertical, ver hallazgo 2 |
| Marcador del panel (tras la corrección) | 2 × 18 en `accent-text`, misma x para `h2` y `h3` (`space × 2` del borde interior del panel: el enlace se alarga hasta `space × 1` y el marcador va a `space × 1` de su inicio): a 6 px del texto en un `h2` y a 22 px en un `h3` (sangrado), **el texto no se mueve** (sigue en el relleno del panel: 16) y sigue en 2 × 18 con filas de 44 |
| RTL | Columna: marcador sobre la línea del borde derecho. Panel con `align="start"` alineado al borde derecho del botón; chevron con `scale: -1 1` (`flip-rtl`) y `rotate: -90deg`: apunta abajo. Con etiquetas árabes (`dir="auto"` las resuelve RTL) el marcador queda a la derecha del texto y el texto no se mueve. Ver hallazgo 4 para las etiquetas latinas |
| `forced-colors` (emulado, claro y oscuro) | Marcador de la columna **y del panel** en `Highlight` (`forced-color-adjust: none`), la actual subrayada, línea guía y borde del panel visibles |
| Sin chasis (`?shell=0`) | `max-block-size` de la columna resuelto (las propiedades de `GAppShell` tienen valor inicial `0px` por `@property`: sin respaldos) |
| Estático | Primera línea con las cuatro capas (#806); extensión sin `<style>` ni colores; su único estilo en línea es `--_marker-y`/`--_marker-h` en la capa del marcador (#964) |
| Consola | Sin errores, avisos de Vue o de Grana ni peticiones fallidas en ninguna configuración |
| Specs de bruno (Chromium, `--workers=1`, puerto 4209) | `page-index-list.spec.mjs` + `page-index.spec.mjs`: **20/20** tras la corrección (`relay` sin cambios). Vitest de `GPageIndex` y `styles`: 46/46. `gates.sh`: **186/186** |

### Movimiento: rúbrica (`docs/documentacion/rubrica-movimiento.md`)

Medido en Chromium: marcador `translate` 240 ms (`--g-duration-slow`) + `--g-ease-out`; chevron `rotate` 240 ms; enlaces solo `color`. Con `reduce`: marcador **solo `opacity` 120 ms**, chevron sin transición, panel sin desplazamiento de entrada. **PI-H2:** `cubic-bezier(0.23, 1, 0.32, 1)` en 240 ms llega al 90 % del viaje a **87 ms**; el calco (`cubic-bezier(0, 1, .5, 1)` en 250 ms), a **88,5 ms**; solo difieren al arrancar (a 25 ms: 41 % frente a 61 %). Basta, sin curva ni duración nuevas.

| Dimensión | Estado | Evidencia | Riesgo | Recomendación |
| --- | --- | --- | --- | --- |
| A · Propósito | Cumple | El marcador dice qué sección se lee y hacia dónde va; PI-P1 lo mantiene a la vista. El del panel no viaja (se abre a petición) | Bajo | — |
| B · Comodidad visual | Cumple | 2 × 18 px sobre una línea plana; sin profundidad ni brillo | Bajo | — |
| C · Estabilidad | Cumple | Marcador en capa absoluta: nada refluye; el marcador del panel no mueve el texto (medido: relleno 16 antes y después). Nada mueve la página | Bajo | — |
| D · Transiciones | Cumple | Transiciones CSS, sin `@keyframes`. Interrumpido a mitad del viaje (s2 → s6 → s3) parte de donde va: 223 → 536 → 564 → 319 px (un cuadro más de inercia hasta el nuevo destino, que se escribe en el siguiente `requestAnimationFrame`), sin volver al origen. `is-instant` al montar | Bajo | — |
| E · Control | Cumple, con reserva | Lo provoca el desplazamiento del usuario; PI-P1 se detiene con el puntero o el foco en la columna | Bajo: PI-P1 sin interruptor propio (`follow` reservado) | Mantener reservado salvo petición |
| F · Accesibilidad | Cumple (emulado) | Rama reducida medida; `forced-colors` emulado; marcadores `aria-hidden` / pseudo-elemento sin texto | Medio: sin lector ni `forced-colors` reales | **No verificable** aquí |
| G · Rendimiento | No verificado en esta auditoría | Lo cubre la compuerta de bruno (200 secciones, tareas < 50 ms, `--workers=1`), que pasó en el lote del sitio; aquí no se repitió aislada | Bajo | Repetir en CI sin vecinos (#965) |
| H · Inmersión | N/A | — | — | — |

## Hallazgos

| # | Severidad | Dueño | Hallazgo y resolución |
| --- | --- | --- | --- |
| 1 | **Defecto (corregido)** | coco | **El marcador no se pintaba en el panel de `fold`.** La anatomía de «Plegada» no tiene nodo de marcador, la extensión no lo pinta y el CSS decía «el marcador no se pinta en el panel»; el contrato (6 y «Accesibilidad») lo exige, y sin él la actual solo se veía por color (2,33:1 claro, 1,77:1 oscuro). **Corrección (solo CSS, sin nodo ni JS ni token):** el marcador del panel es el `::before` del enlace actual, 2 × 18 en `--g-color-accent-text` con `--g-radius-xs`; los enlaces del panel se alargan hacia el relleno inicial con margen negativo igual al relleno (`--_lead`), así el texto no se mueve y la elipsis no lo recorta; misma x para `h2` y `h3`; en `forced-colors`, `Highlight`. Fallaba en 30 comprobaciones (24 temas, 375, táctil, RTL, `forced-colors`) y pasa en todas. Resuelve la nota de `pending` del `meta.json` |
| 2 | Menor (no bloquea) | lima → bruno | **A 375, con la página arriba del todo, el panel de `fold` acaba 23,5 px por debajo del visor** (723,5 frente a 700, claro y oscuro). El alto máximo resta `--g-app-shell-top` y `--g-app-shell-local-bar`, pero con `header="pinned-wide"` bajo 60rem la banda va con la página: `--g-app-shell-top` vale 0 mientras la banda (64 px) aún se ve. En cuanto la banda sale, el panel cabe (medido). Como el panel lleva `overscroll-behavior: contain`, la rueda sobre él no desplaza la página: hay que desplazar fuera. El CSS no conoce la posición del botón sin leer internos de `GAppShell`. **Propuesta:** el patrón de H2 de `GNavBar` (#1066): bruno escribe en `__drop`, al abrir, el borde inferior del botón (`--_drop-top`, px) y coco resta esa cifra en lugar de las dos propiedades del chasis. Lo contrata lima (`page-index.md` «Plegada» 4, «Clases»). El contrato dice «el panel nunca sale del visor», y la spec de bruno solo comprueba el eje horizontal |
| 3 | Informativo | bruno | `GPageIndex.meta.json`: (a) en `pending`, retirar «list y fold: auditoría de coco…» y la nota del marcador (resuelta en el hallazgo 1); (b) `tokens` solo lista los de `relay`: faltan los de `list` y `fold` (`--g-color-accent-text`, `--g-color-border`, `--g-color-surface`, `--g-shadow-2`, `--g-radius-lg`, `--g-radius-xs`, `--g-duration-slow`, `--g-space-4`, `--g-space-8`, `--g-space-12`, `--g-text-body-sm-weight`, `--g-text-caption-size`, `--g-text-title-sm-weight`, y las propiedades `--g-app-shell-top`/`--g-app-shell-local-bar`). No toqué el `meta.json` (es de bruno) |
| 4 | Informativo | lima | **Anatomía de «Plegada»:** anotar que el marcador del panel es el `::before` del enlace con `aria-current` (sin nodo ni clase nueva) y que los enlaces del panel se extienden hacia el relleno inicial (cambia la caja del hover y del anillo, no la posición del texto). Así se cierra la contradicción entre «Plegada» 6 y la anatomía |
| 5 | Informativo | — | **RTL con etiquetas latinas:** los enlaces llevan `dir="auto"` (contrato), así que en una página RTL con etiquetas en español cada enlace es LTR, alinea a la izquierda y el marcador del panel sigue el sentido de su etiqueta (a la izquierda). El de la columna sigue en la línea guía (borde inicial de la página). Es la regla bidi correcta para contenido mixto; con etiquetas árabes todo va a la derecha (medido) |
| 6 | Informativo | — | La paridad con `design/lab/sitio/referencia/` (`sitio-marco.md` §12) no se volvió a medir: la corrección no mueve el texto ni el panel (medido), pero el marcador del panel es una diferencia visible **a propósito** con el original, que no lo tenía. Es una de las desviaciones aceptadas que corrigen un defecto del original (`sitio-marco.md` §0) |

## Cumplimientos / Correcciones / Pendientes

**Cumplimientos.** Texto ≥ 4,5:1 (mínimo 7,38 en enlaces, 4,52 en «Volver arriba»), marcadores y anillo ≥ 3:1 (mínimo 4,52) en 24 configuraciones; área táctil ≥ 24 (fino) y ≥ 44 (táctil) en el botón, las filas y «Volver arriba»; texto ≥ 12 px; foco siempre visible por teclado; RTL; `forced-colors` (emulado); movimiento reducido = solo fundido; transiciones interrumpibles; CSS solo con tokens y alias, sin respaldos ni literales de tema; consola limpia. Con la corrección, la sección actual tiene una señal de forma en las dos formas (1.4.1).

**Correcciones.** `GPageIndex.css`: marcador 2 × 18 del panel de `fold` como `::before` del enlace actual, con su rama de `forced-colors`, y comentario de anatomía al día (hallazgo 1). Comprobado: fallaba en 30 comprobaciones antes y pasa después; `npm run build`, `gates.sh` 186/186, vitest de `GPageIndex` 46/46 y specs de `page-index` y `page-index-list` 20/20 en Chromium.

**Pendientes.**
- lima → bruno: hallazgo 2 (alto del panel con la banda en flujo).
- bruno: hallazgo 3 (`pending` y `tokens` del `meta.json`).
- lima: hallazgo 4 (anatomía de «Plegada»).
- **No verificable aquí:** Firefox y WebKit (no instalados en este entorno); lector de pantalla real (`aria-current="location"` en una lista larga de enlaces y la *disclosure* de `fold`); `forced-colors` real de Windows; táctil real y desplazamiento inercial (PI-P1); rendimiento aislado (G), que se dejó a la compuerta de bruno.
