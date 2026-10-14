# Declaración · GTable r03 · activación de fila, estado de fila y `summary` del servidor

**Estado:** propuesta; **pendiente de elección del usuario** (concepto A, B o C). La base funcional se deriva de estándares y de contratos vigentes y se aprueba sola; la forma es decisión de identidad.
**Ruta:** R1 · **Fidelidad:** F2 con los tokens reales del tema por defecto (`packages/vue/dist/grana.css`), el DOM y las clases reales de `GTable`, `GBadge` y `GBtn`; iconos solo Lucide (`arrow-right`, `chevron-right`, `chevron-left`, `ellipsis-vertical`, `circle-alert`, `triangle-alert`, `info`).
**Origen:** hallazgo 14 (P2) de la integración real NisaNabani (inventario de lotes, paginación del servidor).
**Siguiente dueño:** usuario (elección) → lima (`table.md`, `DECISIONS.md`).

## Lo que pide el hallazgo y lo que responde la ronda

| Pide | Responde |
| --- | --- |
| Activación de fila accesible en lugar del doble clic | Una **puerta** real por fila (`<a href>` o `<button>`) en el título de la columna principal. Intro, clic central y «abrir en pestaña» son nativos. **El doble clic no hace nada propio**: el primer clic ya activa y el segundo se ignora |
| `rowClass(row)` para marcar estados | **No a la clase libre.** Se propone `rowStatus(row)` → `{ status, text, key? }`: tono del tema, **texto obligatorio** y **forma por valor**. La clase libre no lleva texto (incumple 1.4.1 por diseño) y su color lo pone la aplicación fuera del tema |
| Documentar el `summary` en modo servidor | Es una **receta**, no una prop de `GTable`: las métricas sobre toda la búsqueda las pinta la aplicación (cifras o filtros rápidos con `v-model:filters`). Ver «Receta del `summary`» |

## Base funcional (todas las variantes)

| # | Decisión | Fundamento |
| --- | --- | --- |
| 1 | La tabla **sigue siendo tabla de datos**: sin `role="grid"`, sin `tabindex` en `<tr>`, sin flechas entre filas. Un `<tr>` enfocable sin rol interactivo es un foco mudo; una rejilla obligaría a una sola parada y a teclado compuesto para celdas que son lectura | r01 #2, APG (*grid* solo para widgets de edición); el precedente contrario es `GTranscript` (#244), que sí edita |
| 2 | **Puerta**: un elemento nativo **dentro del título** de la columna principal (`primary`, la de r01). Con `rowHref(row)` es `<a href>`; sin él, `<button type="button">`. Su nombre accesible es el título («L-2041»); el subtítulo queda fuera del enlace | Mismo modelo que `GCard` `interaction` `link`/`button` (#133). Un nombre corto es útil en la lista de enlaces del lector |
| 3 | La puerta-enlace cumple **`api.md` «Enlaces y `navigate`» (#505)**: emite `navigate` `{ row, key, href, event }` solo con clic primario sin modificadores o Intro; `preventDefault()` permite un router o un detalle propio. Con Ctrl/⌘/Mayús/Alt o botón central no se emite y el navegador abre la pestaña. La puerta-botón emite **`activate` `{ row, key, event }`** (nombre de `GCard`) | WCAG 2.1.1; #505; #133 |
| 4 | **Una sola puerta por fila.** Las demás acciones siguen en `row-actions` (`GMenu`) | Una fila con dos «principales» no tiene principal |
| 5 | La **casilla de selección** y los controles de la fila **nunca activan** la fila; activar **nunca selecciona**. Seleccionar (varias, para acciones en lote), apuntar (`current`, C) y activar son tres cosas distintas, y ninguna usa `aria-selected` | r01 #10; WCAG 3.2.2. Medido: casilla y menú no emiten ni abren nada (cuatro variantes, tres motores) |
| 6 | **Delegación del clic de fila** (base, B y C): un clic primario sin modificadores en cualquier punto de la fila que **no** sea un control se reenvía a la puerta, **salvo**: con texto seleccionado dentro de la fila, si el puntero se movió más de 5 px entre `pointerdown` y `click` (arrastre para copiar), o en el segundo clic de un doble clic (`event.detail > 1`). La delegación **enfoca la puerta antes de activarla**, para que el detalle (diálogo, ficha) sepa a dónde devolver el foco | Medido: arrastrar para seleccionar no activa; doble clic = una sola activación; al cerrar el detalle el foco vuelve a la puerta (tres motores). Sin enfocar antes, un clic sobre una celda deja el foco en `body` y el diálogo lo devuelve allí |
| 7 | La delegación es **solo para el puntero**: el teclado y los lectores usan la puerta, que ya está en el orden de tabulación. Con modificadores, la fila no hace nada (sobre la puerta-enlace, el navegador) | Un clic delegado no puede abrir una pestaña de forma fiable (el bloqueo de ventanas emergentes); el estándar es el enlace real |
| 8 | **`rowStatus(row)`** → `{ status: 'info' \| 'success' \| 'warning' \| 'error', text, key? }` o nada. Valores y nombre del color de `GCard` `status` (`error` lee `danger`). Pinta: **`data-status`** en el `<tr>`, una **etiqueta** (`GBadge` con icono decorativo + `text`) y una **marca de forma distinta por valor** (sólida, discontinua, punteada). El `text` se enlaza a la puerta con `aria-describedby` | WCAG 1.4.1 (texto y forma, no solo tono), 1.3.1. Medido: cada fila con estado tiene su texto dentro de la fila y describe la puerta; sin estado, sin descripción |
| 9 | El estado de fila **no es un mensaje**: sin `role="status"` ni `role="alert"` en filas (una tabla de 40 lotes caducados no debe hablar sola). Un estado que cambia en vivo lo anuncia la aplicación (isla o aviso), no la tabla | WCAG 4.1.3 solo aplica a cambios; `api.md` «Convivencia de servicios» |
| 10 | La marca reserva su ancho en **todas** las filas: las columnas no se mueven | Medido: misma `x` de la segunda columna en las ocho filas |
| 11 | La fila apuntada, la seleccionada y la de estado usan **canales distintos** (estado: lomo o celda; selección: fondo; apuntada: líneas arriba y abajo + `chevron-right`). Por eso **no se tiñe la fila entera** por estado: chocaría con selección, `hover` y la fila apuntada | Medido en las capturas (claro, oscuro, 360) |
| 12 | Tarjetas (`mode="cards"`): la puerta es el título del encabezado de la tarjeta; el lomo pasa al borde de inicio de la tarjeta | r01 #4. Medido: 360 px sin desbordes en las cuatro variantes |
| 13 | Carga (#540, #534): la puerta conserva su sitio por `rowKey`; tras una recarga el foco vuelve a la puerta de la misma fila. Lo desplegado (B) o apuntado (C) se recuerda por `rowKey` y se descarta si la fila ya no está | Medido: cambiar de página deja `expanded` solo con filas visibles |
| 14 | `forced-colors`: la marca de estado es un **borde** (sobrevive como `CanvasText` y conserva su estilo); el sello de B un contorno; la fila apuntada `Highlight` | Diseñado; **no medido** en `forced-colors` real |

## A · La puerta

La fila **no se pulsa: se lee**. La **celda principal entera** es la puerta (el enlace cubre la celda con un pseudo-elemento; la celda es el contenedor posicionado) y el resto de la fila queda libre para leer, seleccionar y copiar códigos, ubicaciones o fechas con un doble clic. Al pasar el puntero por la fila, o al enfocarla, la puerta **se delata**: subrayado y una flecha `arrow-right` que asoma desde dentro (`--g-duration-fast`, `--g-ease-out`; sin movimiento con movimiento reducido). Solo la celda principal reacciona al `hover`: la fila no promete lo que no hace. El anillo de foco rodea **la celda** (el área real de la puerta), no solo el texto. Estado: **lomo** con forma por valor + etiqueta junto al nombre.

### Qué lo hace distinto (A)

- **Cuestiona la premisa de la fila entera pulsable.** En una tabla de inventario la gente copia más que abre (código de lote para un pedido, ubicación para ir a buscarlo); la delegación convierte cada intento de seleccionar una palabra en una navegación. A separa leer de abrir sin enseñar nada nuevo: la puerta es grande (la celda), es un enlace de verdad (clic central, «copiar dirección», arrastrar a otra pestaña funcionan en toda la celda) y el resto de la fila es texto.
- **El rastro:** al volver del detalle, la fila **se ilumina y se asienta** (fondo `accent-soft` que se disuelve en `--g-duration-slow`) y su flecha queda a la vista como «la última que abriste». En una lista de 47 lotes, volver y saber dónde estabas es la mitad del trabajo. Con movimiento reducido, sin disolución.

**Gana:** cero ambigüedad entre leer y abrir; enlace real en un área grande; lo más barato de construir (sin delegación, sin estado nuevo). **Arriesga:** quien espera «pulso en cualquier sitio» tarda una vez en aprender que es la celda principal (la flecha que asoma al pasar lo enseña); el rastro entre rutas necesita que la aplicación diga cuál fue la última (`current`, ver L6).

## B · Despliegue

Activar una fila **no te saca de la lista**: su ficha se **despliega debajo**, en su sitio, sin perder la página del servidor ni el desplazamiento. La puerta es un **botón de divulgación** (`aria-expanded`, `aria-controls`) con `chevron-right` que gira; la ficha es una fila de detalle (`<tr>` con una celda `colspan` y un grupo con encabezado «Lote L-2041»). Intro y Espacio la abren y cierran; **Esc** dentro de la ficha la pliega y devuelve el foco a la puerta; el orden de Tab es puerta → menú de la fila → ficha → fila siguiente. La ficha lleva un **enlace real «Abrir ficha completa»** (clic central y pestaña nueva). El despliegue usa el motor de plegado de `GAccordion` (`utils/collapse.js`, `--g-ease-spring`); con movimiento reducido, sin transición. Estado: **sello en la causa**.

### Qué lo hace distinto (B)

- **El detalle va a la fila, no la fila al detalle.** Con paginación del servidor, ir a una ficha y volver suele perder la página, el orden o el desplazamiento; consultar diez lotes es diez idas y vueltas. B lo resuelve sin una ruta nueva, y varias fichas pueden estar abiertas a la vez para comparar.
- **El estado se sella en la celda que lo causa** (la caducidad para «Caducado», la ubicación para «En cuarentena»), con la etiqueta junto al dato y un filo inferior en el tono del estado. Responde a «¿por qué?» y no solo a «¿qué?», y al alinearse en una columna se escanea mejor que una fila teñida. `rowStatus` gana `key` (la columna de la causa); sin `key`, cae al lomo.
- **Doble clic de costumbre, sin castigo:** el segundo clic se ignora, así que quien migre del doble clic ve la ficha abierta y no un parpadeo.

**Gana:** la consulta más rápida sin perder el sitio; la causa del estado a la vista. **Arriesga:** la fila de detalle es una fila más para el lector (anuncia «fila 2 de 10» con una sola celda; hay que verificarlo en VoiceOver y NVDA); `hidden` en un `<tr>` impide `hidden="until-found"` (Ctrl+F no encuentra lo plegado); una ficha muy alta empuja la lista. API más grande (`v-model:expanded`, slot `detail`).

## C · Lente

Activar una fila la **apunta**: pasa a un **inspector** junto a la tabla (debajo, en contenedores estrechos) y la lista sigue a la vista. La fila apuntada lleva `aria-current="true"` en su puerta, líneas arriba y abajo y `chevron-right`. El inspector es una región con nombre («Lote L-2042») con **«Anterior» y «Siguiente»**, que recorren las filas y **cruzan las páginas del servidor** (emiten `update:page` y apuntan la primera o la última de la nueva página) sin mover el foco del botón. Encima de la tabla, el **recuento de lo que pide atención en esta página** («2 caducados · 2 por caducar · 1 en cuarentena») y un salto «Ir al siguiente con aviso». La puerta sigue siendo un enlace: clic central abre la ficha completa en otra pestaña. Cada cambio se anuncia en la región cortés de la tabla («Lote L-2042 en el inspector»).

### Qué lo hace distinto (C)

- **Revisar es recorrer, no abrir.** El trabajo real de inventario es revisar los caducados de uno en uno; C lo convierte en un paseo con dos botones que no termina en el borde de la página. El inspector es de la aplicación (un `GCard`, un `GSidebar`, una hoja en móvil): `GTable` solo da `v-model:current` y la fila apuntada.
- **La tabla cuenta lo que pide atención** antes de que lo busques, y salta a ello.

**Gana:** el mejor flujo de revisión; la tabla no se mueve. **Arriesga:** necesita espacio (en 360 px el inspector va debajo y se pierde de vista; en móvil pide una hoja); «apuntar» es un tercer estado de fila que hay que explicar; es lo más caro (estado, anuncio, cruce de páginas, coordinación con la carga).

## Estado de fila: por qué no `rowClass`

| Opción | Texto | Forma | Tema | Contrato de tokens |
| --- | --- | --- | --- | --- |
| `rowClass(row)` libre | No (lo añade la aplicación si se acuerda) | No | El color lo pone la aplicación; oscuro y alto contraste no lo conocen | Fuera: el componente pinta una clase cuyo valor no controla |
| **`rowStatus(row)`** | **Obligatorio** (aviso de desarrollo si falta, como `statusText` de `GCard`) | Sí, por valor | Tonos `info`/`success`/`warning`/`danger` del tema, también en oscuro | Dentro |

Para ganchos que no son estado (pruebas, analítica) basta `data-status` en el `<tr>` y, si hiciera falta, un `rowAttrs(row)` limitado a `data-*` (L4). Un estado de producto que no encaja en cuatro tonos («archivado», «borrador») se expresa con `text` y el tono más cercano; un `neutral` es pregunta para lima (L3).

## Receta del `summary` (modo servidor, las tres variantes)

El servidor devuelve, además de la página y `total`, métricas **sobre toda la búsqueda**:

```js
// { rows: [...8 filas], total: 23, summary: { error: 3, warning: 5, info: 2, total: 23 } }
```

- No es API de `GTable`: la tabla no sabe qué significan. La aplicación las pinta **encima** de la tabla: `GMetric` para cifras de solo lectura, o botones con `aria-pressed` que aplican un filtro (`v-model:filters` con `filterMode="external"`; vuelven a la página 1).
- **Cada cuenta se calcula sin su propio filtro** (como las facetas): con «Caducados» aplicado, «Por caducar» sigue diciendo cuántos hay en la búsqueda, no 0.
- El anuncio de la tabla sigue siendo `labels.results` con `total` (#265); el `summary` no se anuncia (no cambió por una acción sobre la tabla, salvo el filtro, que ya anuncia el recuento).
- Si la integración pide que `GFilterBar` muestre esas cuentas en sus opciones (`enum`), es la «salida con cuentas» reservada en #543 (L7).

## Convivencia con el selector de filas por página (ronda paralela `pagination/r02`)

Nada de esta ronda vive en el pie: el prototipo deja el sitio del selector marcado. Cambiar el tamaño de página es una recarga: B descarta lo desplegado que ya no está; C conserva `current` si la fila sigue en la página y, si no, la aplicación decide (el inspector puede seguir enseñándola, sin fila marcada). A no guarda nada.

## Comparativa

| | Base | A · La puerta | B · Despliegue | C · Lente |
| --- | --- | --- | --- | --- |
| Qué se pulsa | Toda la fila (delegada) | Solo la celda principal, entera | Toda la fila (delegada) | Toda la fila (delegada) |
| Qué pasa | Navega o abre | Navega o abre | La ficha se despliega debajo | La fila pasa al inspector |
| Copiar texto de la fila | Arrastrando (un clic activa) | **Libre** fuera de la celda principal | Arrastrando | Arrastrando |
| Clic central | Sobre la puerta | **En toda la celda** | En «Abrir ficha completa» | Sobre la puerta |
| Estado | Lomo + etiqueta | Lomo + etiqueta | **Sello en la causa** | Lomo + etiqueta + **recuento con saltos** |
| Página del servidor | La conserva la aplicación | Ídem + rastro al volver | **Nunca se sale** | **«Siguiente» cruza páginas** |
| Móvil | Tarjeta pulsable | Cabecera de la tarjeta | Ficha dentro de la tarjeta | Inspector debajo u hoja |
| API sobre la base | — | Ninguna | `v-model:expanded`, slot `detail` | `v-model:current` |
| Coste (bruno + coco) | Bajo | **El más bajo** | Medio (reutiliza `collapse.js`) | Alto |
| Riesgo de lector | Bajo | Bajo | Fila de detalle (verificar) | Bajo |

## Recomendación

**A por defecto**, con **B como opción** (`detail` + `v-model:expanded`) para las tablas de consulta, y **C reservado** para una ronda de revisión si la integración lo pide. Motivo: A es la única que no rompe la lectura y la copia, que son lo que más se hace en un inventario; es un enlace real en un área grande y cuesta poco. B añade lo que A no puede (no perder la página del servidor) sin contradecirla: su puerta vive en el mismo sitio. `rowStatus` con lomo es común a A y C; el sello en la causa de B puede adoptarse con `key` en cualquiera.

## Qué lo hace distinto (resumen)

La puerta, no la fila: un enlace real del tamaño de la celda principal que se delata al pasar y deja el resto de la fila para leer y copiar; el rastro que te dice dónde estabas al volver; el estado con forma y texto, sellado donde está la causa (B) o contado y recorrible (C).

## Comprobaciones ejecutadas

`GRANA_PW_PORT=4217 node design/lab/table/r03/verificar.mjs` → **287/287** en Chromium, Firefox y WebKit (base 22, A 25, B 25 —24 en WebKit—, C 24 por motor):
- tabla sin `grid` ni `tabindex` en filas; una puerta por fila, nativa (`<a>` o `<button>` en B), con el código como nombre; `aria-describedby` al texto del estado, dentro de la fila; sin `aria-selected` ni `role` de estado en filas; ids únicos;
- forma del estado (`solid`/`dashed`/`dotted`, o sello con texto en B); columnas sin desplazamiento por el lomo;
- casilla y menú no activan; arrastrar para seleccionar no activa; Ctrl/⌘+clic en la puerta-enlace no emite `navigate`;
- base: clic en la fila abre; `navigate` con `key` y `href`; foco de vuelta a la puerta; Intro abre; doble clic = una activación;
- A: clic fuera de la celda principal no activa; doble clic en otra celda selecciona texto; el borde de la celda es la puerta (prueba de impacto); foco y rastro al volver; anillo en la celda con teclado; flecha visible con foco; sin transición con movimiento reducido;
- B: despliegue con `aria-expanded`/`aria-controls`; foco en la puerta tras el clic de fila; doble clic deja abierta; Esc pliega y devuelve el foco; Intro abre y Espacio cierra; orden de Tab (no en WebKit, ver abajo); enlace real a la ficha; `expanded` depurado al cambiar de página; sin transición con movimiento reducido;
- C: `aria-current` único; inspector como región con nombre; «Siguiente» cruza a la página 2 y apunta su primera fila con el foco en el botón; salto al siguiente con aviso; recuento en texto; anuncio cortés;
- 360 px: tarjetas sin desbordes en las cuatro; consola limpia.

Capturas revisadas: claro y oscuro (A), B con una ficha abierta, C con inspector, las cuatro a 360 px.

## Comprobaciones NO ejecutadas

- Lector de pantalla real: la puerta con `aria-describedby` en modo exploración, la **fila de detalle de B** (cómo se cuenta y se lee) y el anuncio del inspector de C (VoiceOver, NVDA).
- Tab en WebKit: Playwright sin «acceso total por teclado» no da Tab a enlaces ni botones (Safari real, entorno real).
- `forced-colors` real; contraste del lomo medido (se apoya en que `*-text` ≥ 4,5:1 sobre `surface` por contrato, `tokens.md` §7.1); táctil real (un toque en la fila; pulsación larga para seleccionar texto en A).
- `position: relative` en `<td>` con el enlace estirado de A en Safari real con `display: grid` de tarjetas (en WebKit de Playwright pasa).
- Rendimiento con cientos de filas (delegación: un solo manejador en el `<tbody>`, sin coste por fila).

## Hallazgos para lima

| # | Hallazgo | Propuesta |
| --- | --- | --- |
| L1 | Activación de fila | `rowHref` (Function `(row) => string`) → puerta `<a href>` con `navigate` `{ row, key, href, event }` (#505); sin `rowHref`, prop Boolean (nombre de trabajo `activatable`) → puerta `<button>` con `activate` `{ row, key, event }`. La puerta va en la columna `primary`. Aviso de desarrollo si una fila tiene puerta y no hay columna con título |
| L2 | Delegación del clic | Solo en B y C, o como opción de la base (`rowClick` `door`/`none`) si el usuario elige A y quiere la fila entera en otra tabla. Guardas de la base #6, con prueba de bruno por cada una |
| L3 | `rowStatus` | `(row) => { status, text, key? } \| null`; valores de `GCard` (`info` `success` `warning` `error` → `danger`); `text` obligatorio con aviso; `data-status` en el `<tr>`; ¿`neutral` para «archivado»? (no hace falta para NisaNabani) |
| L4 | `rowClass` | No. Si una integración necesita ganchos, `rowAttrs(row)` limitado a `data-*` |
| L5 | B | `v-model:expanded` (claves), slot `detail` `{ row, close }`, Esc pliega con `preventDefault` + `stopPropagation` (como el editor de `GTranscript`); reutiliza `utils/collapse.js`; la fila de detalle no cuenta para «todo», para el recuento ni para `loadingRows` |
| L6 | C (y el rastro de A entre rutas) | `v-model:current` (clave); `aria-current="true"` en la puerta; anuncio en la región de #265 con `labels.current` (`{title}`); el cruce de páginas lo hace la aplicación con lo que emite la tabla |
| L7 | `summary` | Solo receta (README); las cuentas en opciones de `GFilterBar` son la salida con cuentas reservada en #543 |
| L8 | `labels` nuevas | Ninguna en A; `labels.detail` (nombre del grupo de la ficha, `{title}`) en B; `labels.current` en C |
| L9 | Decisión de personalidad | Registrar en `DECISIONS.md` la elegida («la puerta, no la fila»; rastro; sello en la causa o recuento) |

## Hallazgos para coco

- `g-table__title` recorta con `overflow: hidden` (elipsis): un anillo de foco de la puerta **se corta**. En el prototipo, `overflow: clip` + `overflow-clip-margin` del ancho del foco; en A el anillo va en la celda (`td:has(.puerta:focus-visible)`).
- En A, `hover` solo en la celda principal (y la casilla), sin pisar la fila seleccionada.
- El lomo como borde de inicio del primer `<td>` reservado en todas las filas (transparente), en tarjetas en el borde de la tarjeta; en `forced-colors`, `Canvas` en las filas sin estado.

## Pregunta de producto (una)

**¿Qué forma quieres para abrir una fila de `GTable`?**
- **A · La puerta** (recomendada): la celda principal entera es un enlace y el resto de la fila queda para leer y copiar; flecha que asoma y rastro al volver; estado en el lomo con forma + etiqueta.
- **B · Despliegue**: la ficha se abre debajo de la fila sin salir de la página del servidor; estado sellado en la celda que lo causa.
- **C · Lente**: la fila pasa a un inspector con «Anterior/Siguiente» que cruza páginas; recuento de avisos con saltos.
- O una combinación (p. ej. **A por defecto + B como opción**, o el sello en la causa de B dentro de A).
