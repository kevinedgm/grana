# Estilo — `GResourceList` (Grana Blocks), forma C · «La frase»

> coco (Opus), 2026-10-21. Contrato: `design/contracts/resource-list.md` (#709 a #725), `tokens.md` §48 (ningún token nuevo). Estructura: `design/lab/resource-list/r01/` (kiwi). Banco: `estilo-banco.html` + `estilo-banco.js` (marcado de contrato con los componentes reales de `packages/vue/dist`; el `.vue` aún no existe). Verificación: `GRANA_PW_PORT=4209 node design/lab/resource-list/estilo-verificar.mjs` (`--themes=all --shots`). Capturas: `estilo-capturas/`.

## Entregado

| Archivo | Qué |
| --- | --- |
| `packages/blocks/src/blocks/GResourceList/GResourceList.css` | El block: raíz, cuerpo con el inset de contrato, región de consulta, facetas, frase y huecos, búsqueda, total y masivas del `toolbar`, táctil, reducido, forzados, impresión |
| `packages/blocks/src/components.css` | Registro del paquete (su cabecera lo da a coco; el contrato también): `@layer grana.defaults, grana.components, grana.blocks;` primero e `@import … layer(grana.blocks)`. Comprobado en `vite build` del paquete: `blocks.css` empieza por la declaración de capas y el block va dentro de `grana.blocks`. El tema de la aplicación, sin capa, gana a las tres |
| `GPageHeader.css` (#715) | (a) comentario de contrato del inset (`space × 6`; `× 4` con `is-narrow`, umbral `space × 150`); (b) `:not(.has-tabs)`: acciones al principio del zócalo, alineadas con el `hN`, empujadas por el título compacto con `--_p` |
| `GTable.css` (#717) | `.g-table__count.is-empty` con el patrón de texto oculto (sigue en el árbol, nunca `display: none`); `.g-table__bar.is-quiet` sin alto, hueco ni margen |
| `GMenu.css` (#718, #725) | `g-menu__reason` (segunda línea en la columna de la etiqueta, sin tachar, `text-muted`); par `li.is-armed` + `--_armed-w` + `g-menu__confirm` / `-cancel` / `-ok` con la geometría de la fila; `g-menu__find` pegada arriba, de alto constante, con `g-menu__find-query`, `-count` e `is-empty-result`; `hidden` fuera del árbol; forzados |
| `GFab.css` (#725) | Pista de la pila (`.g-fab__list--stack > .g-fab__find`) en la píldora más alejada; «se juntan hacia el FAB» con `is-gathering` / `is-shifted` / `--_shift` (FLIP), quietas con movimiento reducido |
| `design/lab/resource-list/estilo-banco.html`, `estilo-banco.js`, `estilo-verificar.mjs`, `estilo-capturas/` | Banco y verificación |

`defaults.css` no cambia: ningún valor por defecto nuevo. Sin tokens nuevos.

## Auditoría previa (`auditoria-visual.md` §1 y §3 «Antes»), sobre el contrato y el prototipo `?c=C`

| Aspecto | Qué había (r01 C) | Qué decide el contrato | Qué hace el CSS |
| --- | --- | --- | --- |
| Estructura | Facetas en el encabezado; barra de selección propia sobre la tabla | Encabezado → consulta (`search`) → tabla; masivas en el `toolbar` de `GTable` | Columna: `GPageHeader`, cuerpo; dentro, consulta y tabla. Orden del DOM = visual (sin `order` ni áreas) |
| Jerarquía | Facetas con cifra `title` compitiendo con el `h1`; acción a 288 px en el teléfono; acción flotando sin pestañas | Nada del block entre título y acción; cifra en el cuerpo de la etiqueta; frase en `body` | Frase en cuerpo; texto fijo en tinta apagada y palabras cambiables en tinta plena; facetas `GTag` neutras con cifras tabulares |
| Contraste y delimitación | Huecos con subrayado discontinuo `border-strong` (≈ 1,45:1) | Subrayado `border-control` ≥ 3:1 + chevron | Raya `border-control` (≥ 3:1 medido en 24 combinaciones), discontinua sin valor / continua con valor; chevron `text-muted` |
| Espaciado | Inset copiado de un valor privado | Inset de contrato (#715) | `--_inset` = el del encabezado; proximidad: consulta `space-3`, cuerpo `space-5` (`space-4` en estrecho) |
| Controles | Frase `title-sm`; huecos 40 px | Diana ≥ 24 / ≥ 44 | Tecla del hueco `max(24px, línea + space-1)`; `44px` con puntero grueso y el interlineado de la frase a 44 px para que las teclas de dos líneas no se solapen |
| Tablas y listas | — | De `GTable` | El block no toca `.g-table__*`; el total y las masivas van en `body-sm` |
| Formularios | Hoja lateral | `GDialog` | Nada propio en la hoja |
| Estados | Vacíos, error y sin acceso por los componentes | Igual | Nada que repintar; hover y foco del hueco; `aria-expanded` mantiene la tecla iluminada |
| Consistencia | Huecos L5/L7/L9 por el DOM | Enmiendas de la v1 | Enmiendas hechas en el CSS de cada dueño; el block no estiliza piezas internas |

## Decisiones estéticas (qué le da personalidad)

1. **La consulta se lee.** El texto fijo de la plantilla va en `text-muted` y cada palabra cambiable en `text` sobre su raya: el ojo lee la frase entera y encuentra a la primera dónde se cambia. La raya es **discontinua** mientras el hueco está abierto («en cualquier estado») y **continua** cuando ya dice algo; con valor, además, `--g-text-action-weight`. Forma + peso, nunca solo color (1.4.1).
2. **La palabra es una tecla que no mueve la frase.** Relleno en línea `space-1` con margen negativo igual: el texto cae donde caería una palabra normal (Δ0 con el `h1` cuando la frase empieza por un hueco) y el fondo al pasar (`neutral-soft`, `radius-sm`) invade el espacio entre palabras. Con el menú abierto la tecla se queda iluminada.
3. **La palabra nueva entra con un fundido** (`--g-duration-fast` + `--g-ease-out`, una animación `opacity` desde 0) solo cuando nace del gesto en su hueco (`is-entering`). Al montar, al pulsar una faceta, al llegar datos o al cambiar la consulta desde fuera, aparece en su sitio. Se probó primero con `@starting-style` gateado por `:focus`, `:focus-within` y `aria-expanded`: **no sale en ninguno de los tres motores** (el primer estilo de la palabra se resuelve con el menú ya cerrado e inerte y antes de que el foco vuelva al hueco). De ahí la clase (encargo a bruno, anotación a lima).
4. **Facetas en una línea de etiquetas neutras** (`GTag` md; la atención la dice el icono `triangle-alert` y el texto). `font-variant-numeric: tabular-nums` heredado: al cambiar una cuenta la etiqueta no baila.
5. **La búsqueda acompaña a la frase** en la misma línea cuando cabe (alineadas por la línea base) y ocupa su línea entera en estrecho; nunca reordena.
6. **Sin caja alrededor de la consulta:** la delimitan la proximidad y el borde común con la tabla (sin decoración, `auditoria-visual.md` §2).
7. **Barra de la tabla:** total en `text-muted` `body-sm` tabular; masivas `GBtn sm` (28 px dentro de los 36 px de la barra: alto constante en escritorio); el par armado con una junta corta (`space-1`).
8. **Enmiendas:** el motivo de `GMenu` empieza en la columna de la etiqueta y no se tacha; el par reparte el ancho por contenido (con `1 1 0` «Dar de baja» partía la línea en la lista mínima de 200 px y la fila crecía: corregido a `1 1 auto` y relleno `space-2`); la pista de búsqueda de `GMenu` es la cabecera del panel de `GFab` en la letra de la lista; la pista de la pila es una píldora discontinua sin sombra ni semilla (no se pulsa).

## Mediciones (`estilo-verificar.mjs`, 2026-10-21, sobre el estado entregado)

**266/266** (estático 28; Chromium 60 + 52 de temas; Firefox 59 + 4; WebKit 59 + 4), consola limpia en los tres motores. Además, 18 notas del hallazgo H1 (abajo).

| Medida | Resultado |
| --- | --- |
| Un `h1` y la tabla nombrada por él | Cumple (3 motores) |
| Δ0 del `h1` con la acción principal sin pestañas (#715 b), facetas, frase, búsqueda y tabla | Δ ≤ 0,5 px a 1280, 390 y 360 y en RTL (3 motores) |
| Distancia descripción → acción igual que la base (#714) | Δ ≤ 1 px (medido 0) a 1280, 390 y 360 |
| Con pestañas las acciones siguen al final | Cumple (a 24 px del borde = inset) |
| Una sola sólida de marca | Cumple |
| Facetas en una fila en estrecho (plegadas en su hueco) | Cumple a 390 y 360 |
| Huecos ≥ 24 px (escritorio) / ≥ 44 px (puntero grueso) | 28 / 44 |
| Facetas ≥ 24 / ≥ 44 de diana | 32 / 44 (`::after` de `GTag`) |
| Sin desplazamiento horizontal | 1280, 390, 360, RTL, con selección y armada |
| Barra de la tabla de alto constante en escritorio (reposo → seleccionada → armada) y primera fila quieta | Δ 0 |
| Recuento a cero montado, `role="status"`, oculto con el patrón (#717) | Cumple (simulado: la clase la pone el banco, ver «No verificable») |
| Foco del hueco | 2 px sólido, ≥ 3:1 (17,4:1 por defecto) |
| Palabra nueva: fundido tras elegir en el hueco (puntero), nada al montar, nada al pulsar una faceta, nada con movimiento reducido | Cumple (3 motores) |
| Contraste del block (frase, hueco, hueco con valor, hueco al pasar, total ≥ 4,5; raya, chevron, foco ≥ 3) | Cumple en el tema por defecto y los 11 generados, claro y oscuro (Chromium), y por defecto en Firefox y WebKit |
| `GMenu` #718: motivo en la columna de la etiqueta (Δ 0), sin tachar, ≥ 4,5:1 sobre `surface` y `surface-sunken`; fila armada del mismo ancho y alto, en una línea; confirmar ≥ 4,5:1 y contornos ≥ 3:1 | Cumple (3 motores; contraste también en oscuro y en el tema `grana`) |
| `GMenu` #725: fila de búsqueda pegada y del alto de un elemento; pista y lo escrito ≥ 4,5:1; lo que no coincide no se pinta | Cumple |
| `GFab` #725: pista en la píldora más alejada; ≥ 4,5:1 y contorno ≥ 3:1; `is-shifted` parte del sitio de antes sin transición y viaja en fast + ease-out sin escalonado; reducido sin desplazamiento | Cumple (marcado estático) |
| `forced-colors` (Chromium): raya, chevron y foco | Cumple |
| Regresión: `page-header`, `menu-links`, `table-rows`, `table-page-size`, `fab`, `fab-bordes` (Chromium, puerto 4209); `design/lab/page-header/estilo-verificar.mjs` y `design/lab/fab/estilo-verificar.mjs` (Chromium); `vitest` de `@grana/vue` (3725) y `@grana/blocks`; `gates.sh` | 89/89 · 182/182 · 1637/1637 · 3725/3725 · 2/2 · 74/74 |

### Rúbrica de movimiento (`rubrica-movimiento.md`)

| Dimensión | Estado | Evidencia | Riesgo | Recomendación |
| --- | --- | --- | --- | --- |
| A. Propósito | Cumple | Único movimiento propio: la palabra nueva del hueco (dice «esto cambió» donde se miró); nada al montar ni al llegar datos (medido) | Bajo | — |
| B. Profundidad | N/A | Sin profundidad propia | — | — |
| C. Estabilidad | Parcial | Δ0 de la tabla al seleccionar y armar en escritorio; facetas plegadas en una fila; cifras tabulares. **En estrecho la barra crece 20–48 px con selección (H1)**. La frase reflota al cambiar de palabra (efecto del gesto, contratado) | Medio | H1 a lima |
| D. Transiciones | Cumple | El fundido es de 120 ms y se interrumpe (otra palabra = otro nodo desde 0); la pila de `GFab` parte de donde esté | Bajo | — |
| E. Control | N/A en CSS | Cancelar, Esc y foco que sale son del `.vue` | — | bruno |
| F. Accesibilidad | Cumple | Con `reduce`, sin fundido (medido) y sin desplazamiento en la pila | Bajo | — |
| G. Rendimiento | No verificable | Una animación de opacidad; el coste real depende del `.vue` (ResizeObserver, sin `watch` con arreglos nuevos) | Medio con muchas facetas | Medir en la auditoría posterior |
| H. Inmersión | N/A | — | — | — |

No hace falta plan en `plans/`: el movimiento es una sola animación de opacidad y ya está hecho.

## Hallazgos para lima

- **H1 (bloquea el criterio «barra de alto constante» en estrecho).** En tarjetas, la barra de `GTable` ya lleva la casilla «Seleccionar las tinas de esta página» con su texto; con selección se suman el recuento visible y las masivas, y la barra pasa de 36 a 56 px a 390 y 360 **aun con las masivas de solo icono** (y a 84 px a 360 armada, por «Cancelar | Dar de baja 2» con texto). La primera tarjeta baja 20–48 px. Con texto en las masivas, 3 líneas. Desde el block no se arregla (no estiliza `.g-table__*` ni puede reservar líneas sin reordenar). Salidas posibles (decide lima, quizá con kiwi): (a) en tarjetas, la casilla «todo» de `GTable` con su nombre oculto y pista (solo casilla), (b) en estrecho, el recuento de la barra dentro del grupo de masivas en lugar del de `GTable`, (c) aceptar dos líneas fijas en estrecho (el total en reposo en su propia línea). Medido en los tres motores (notas del verificador).
- **H2.** El fundido de la palabra necesita una clase que el contrato no lista: **`is-entering`** en `g-resource-list__blank-text` (la pone el `.vue`; ver encargo a bruno). Registrarla en «Clases y datos». Sin ella, la palabra cambia sin fundido (el contrato lo dejó opcional).
- **H3.** `GMenu` pinta su `<ul>` en su sitio, así que con un menú abierto la frase es `p > ul` (modelo de contenido inválido; un `<p>` no admite listas). Cerrado no hay `ul` y el SSR inicial es válido. Valorar `div.g-resource-list__phrase` (sin `role`, el texto se lee igual) o dejarlo como límite conocido.
- **H4.** Clases nuevas que este CSS propone para la pila de `GFab` (#725 «se juntan»): `is-gathering` (lista, mientras dura) e `is-shifted` + `--_shift` (px, por píldora, el primer cuadro). Registrarlas en `fab.md`.
- **H5.** `GMenu`: el motivo `g-menu__reason` tiene que ser **el último hijo** del elemento (se parte la fila con `flex-wrap`); la fila de búsqueda usa `g-menu__find-query`, `g-menu__find-count` e `is-empty-result` (los nombres de `GFab`). Registrarlo en `menu.md`.
- **H6 (aviso, sin cambio).** Con texto de un idioma LTR en un documento RTL la frase se reordena por bidi (es la plantilla de la aplicación); en RTL real el texto será RTL. El README debe decirlo.

## Encargos para bruno

1. `GResourceList.vue`: el marcado de «Anatomía» tal cual; `is-narrow` estimado antes del primer pintado y luego por `ResizeObserver` de la raíz (sin `container-type` ni `transform` en la raíz ni en el cuerpo).
2. Hueco: `button.g-resource-list__blank[.is-set]` con, en este orden, `span.g-resource-list__blank-field` (oculto, «Estado: »), `span.g-resource-list__blank-text` **con `key` = su texto visible** y `span.g-resource-list__blank-chev` (`aria-hidden`, `GIcon chevron-down`). Ningún envoltorio alrededor del `GMenu` dentro de la frase. `is-set` siempre en un hueco de orden.
3. **`is-entering`** (H2): al `select` del `GMenu` de un hueco, guardar `{ id, text }` de la palabra nueva y pintar la clase mientras ese hueco siga diciendo ese texto (no quitarla en el siguiente tic: corta la animación). Cualquier otra vía (faceta, consulta desde fuera) pinta la palabra sin la clase. El banco lo hace así (`estilo-banco.js`, `pick`).
4. Facetas: `GTag` de alternar tamaño `md`, `label` = `labels.facet(...)`, icono en el slot `lead`.
5. Búsqueda: `GInput type="search"` con `aria-label` = `labels.search` (sin etiqueta visible: la frase la contextualiza y la alineación por línea base con la frase se midió así) y `GIcon search` en `prepend`.
6. `toolbar`: `span.g-resource-list__total` en reposo; con selección `div.g-resource-list__bulk` con `GBtn size="sm"`: «Dar de baja N» `outline danger`, slot `bulk`, «Quitar selección» `ghost neutral`. **En estrecho, los dos de solo icono** (`trash`, `x`) con nombre y `tooltip` desde el principio: a 390 con texto no caben (medido). Armada: `div.g-resource-list__bulk-confirm.is-armed` con «Cancelar» `outline neutral` y «Dar de baja N» `solid danger`. Ver H1: con eso la barra aún crece en estrecho.
7. `GTable` (#717): con 0, texto vacío y `is-empty` en `g-table__count` (mismo nodo); `is-quiet` en la barra sin nada visible.
8. `GMenu` (#718, #725): `g-menu__reason` como último hijo del elemento con su `id` en `aria-describedby`; `li.is-armed` con `--_armed-w` (px, el ancho del `li` al armar; retirarlo al desarmar o confirmar); `div.g-menu__confirm[role=group]` con `.g-menu__confirm-cancel` y `.g-menu__confirm-ok`; `li.g-menu__find` primer `li` de la lista (tras `g-menu__highlight`) con `g-menu__find-query`, `g-menu__find-count` e `is-empty-result`; `hidden` en los `li` que no coinciden (y en grupos y separadores sin visibles).
9. `GFab` (#725): la pista de la pila como `li.g-fab__find` en el extremo más alejado del FAB (primera en el DOM si la pila sube); FLIP al filtrar: `is-gathering` en la lista; en cada píldora visible que cambió de sitio, `is-shifted` y `--_shift` (px, vertical, de su sitio nuevo al de antes) en un cuadro, y en el siguiente quitar `is-shifted`; quitar `is-gathering` al terminar (`--g-duration-fast`). Con movimiento reducido el CSS anula el desplazamiento: no hace falta rama propia.
10. `GPageHeader` (#715 c) es JS tuyo; el CSS de (b) ya está.
11. Reconstruir `dist/` antes de los specs.

## No verificable aquí (queda para la auditoría posterior sobre el componente real)

- Todo lo que depende del `.vue`: el recuento a cero real (el banco solo alterna la clase sobre «0 seleccionadas»), `is-entering` real, el par de `GMenu` armado por teclado y puntero, la búsqueda real de `GMenu`, el FLIP real de la pila, el foco de ida y vuelta, el editor en hoja, los vacíos con `returns`, el error con y sin filas dentro del block, la regla (c) de `GPageHeader`, la estimación de estrecho antes del primer pintado.
- Zoom 200–400 %, teclado completo en Firefox y WebKit, rendimiento con muchas facetas, lector de pantalla real, táctil real, `forced-colors` real (solo emulado en Chromium), RTL con texto RTL real.

## Cumplimientos / Correcciones / Pendientes

- **Cumplimientos:** jerarquía (un `h1`, una sólida, nada entre título y acción, distancia igual que la base), alineación Δ0 en escritorio, teléfono y RTL, contraste en 24 combinaciones de tema, dianas, foco, sin desplazamiento horizontal, movimiento reducido, `forced-colors`, solo tokens existentes, el block no repinta piezas ajenas.
- **Correcciones durante la ronda:** acción principal flotando sin pestañas (#715 b); búsqueda a 320 px en estrecho (pasa a la línea entera); par de `GMenu` partiendo «Dar de baja» en dos líneas (reparto por contenido); fundido de la palabra que no salía con `@starting-style` (pasa a `is-entering`).
- **Pendientes:** H1 (barra en estrecho, lima); H2–H5 (registrar clases, lima); los encargos de bruno; la auditoría posterior de coco sobre el componente real, con la rúbrica completa, zoom y teclado en los tres motores.
