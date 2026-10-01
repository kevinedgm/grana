# Entrega de coco · GTabs.css, tokens `--g-tabs-*` y `.g-dialog__tabs`

**Archivos:** `packages/vue/src/components/GTabs/GTabs.css` (incluye el panel suelto `GTabPanel`: usa las mismas clases `g-tabs__panel`), valores de `--g-tabs-*` en `packages/vue/src/styles/defaults.css`, `.g-dialog__tabs` en `GDialog/GDialog.css`.
**Contratos:** `design/contracts/tabs.md`, slot `tabs` de `dialog.md`, `tokens.md` §18 (DECISIONS.md #112 a #121).
**Estado:** listo para bruno (los `.vue` y el registro en `components.css` aún no existen).
**Banco de pruebas:** `design/lab/tabs/estilo-banco.html` (desde la raíz del repo, `python3 -m http.server`): marcado exacto del contrato, y el script hace lo que hará bruno (marca con `--_mark-*`, `is-ready`, indicios de desplazamiento, activación y flechas). Botones «Tema de prueba», «Oscuro» y «RTL». Nueve secciones: apariencias, color, densidades, alineaciones, overflow a 320px, `labelMode`, contextos (plano, card, inset, carcasa, `GDialog` real con y sin inset), vertical y riel, RTL.

## Carácter propio

| Detalle | Cómo |
| --- | --- |
| **Silencio** | Sin bordes por pestaña, sin sombras (solo la mínima del segmento), una sola marca que se desliza. Las inactivas son `text-muted` sin fondo; el hover es el velo `--g-color-border` (el mismo de `GSidebar`) y solo con puntero real |
| **Activa** | Marca **y** peso (`--g-text-title-weight`, 600) **y** color de texto (`text`). El ancho de la negrita se reserva con `::after { content: attr(data-text) }` para que la activa no desplace a las demás |
| **underline** | Línea base fina (`--g-color-border`, un `::after` de la cabecera con borde, que sobrevive a `forced-colors`) y la marca encima: barra de `--g-tabs-mark-*` con las dos esquinas de arriba redondeadas. Vertical: la misma línea y la barra al borde de inicio |
| **pill** | Superficie `primary-soft` (familia por `color`), radio `pill` (en vertical, `md`), texto `on-primary-soft`, contorno de `border-control` para llegar a 3:1 (#89) |
| **segmented** | Pista = `--g-tabs-track` con el radio de forma y relleno `max(space × 1, focus-width)`; segmento = `--g-tabs-thumb`, radio concéntrico, contorno `border-control` (3:1 contra la pista) y `shadow-1`. Se ajusta a su contenido; con `fill`/`distribute` ocupa el ancho |
| **contained** | Banda `--g-tabs-band` a sangre con aire arriba; la activa se **funde** con el panel (`--g-tabs-panel`) y lleva una línea de color arriba del grosor de la marca (la marca de 3:1) y filetes laterales tenues. No dibuja borde propio |
| **Secundario** | Estado y contador: más pequeños y pálidos que la etiqueta (`text-subtle`, `GBadge sm soft neutral`); `attention` en `warning-text`, `loading` neutro y girando. Sobre la píldora activa la insignia sube a `surface` para no fundirse con ella |
| **Overflow** | Degradado en el borde por `is-scrollable-*` (máscara, también vertical); `arrows` atenúa el botón del extremo sin lista y conserva su hueco (sin saltos); `more` es una pestaña más en la cabecera, fuera del `tablist` |
| **Movimiento** | La marca anima solo `translate`, ancho y alto con `--g-duration-press` y `--g-ease-standard`, y **solo con `is-ready`**; el panel entra con fundido y `translate` de `space × 1` (`@starting-style`, `--g-ease-out`); el icono de carga gira (`@keyframes` solo del giro, como `GBtn`) |

## Valores del tema (defaults.css)

| Token | Claro | Oscuro | Por qué |
| --- | --- | --- | --- |
| `--g-tabs-track` | `rgb(0 0 0 / 0.05)` | `rgb(255 255 255 / 0.08)` | **Velo sobre la anfitriona**, no un color: un paso más oscuro sobre una superficie clara y más claro sobre una oscura, en cualquier anfitriona (plano, card, inset, carcasa) |
| `--g-tabs-thumb` | `var(--g-color-surface)` | `rgb(255 255 255 / 0.12)` | Claro: la superficie sobre la pista; oscuro: un paso más claro que la pista (una superficie oscura iría *por debajo* de ella) |
| `--g-tabs-band` | `rgb(0 0 0 / 0.04)` | `rgb(255 255 255 / 0.05)` | Más tenue que la pista: es una banda, no un control |
| `--g-tabs-panel` | `var(--g-color-surface)` | `var(--g-color-surface)` | Debe coincidir con la anfitriona; sobre una carcasa hundida la aplicación lo redefine |
| `--g-tabs-mark-default` | `calc(var(--g-border-width) * 3)` | (igual) | 3px con borde de 1px; sigue al grosor de borde del tema |
| `--g-tabs-mark-comfortable` / `--g-tabs-mark-compact` | `calc(var(--g-border-width) * 2)` | (igual) | 2px: con 1px la marca no llegaría a verse; con menos de 2px pierde el 3:1 percibido |
| `--g-tabs-inset` | `0px` (en `GTabs.css`, en `:root`) | | Ver «Decisiones y desviaciones» |

Medidas derivadas (alias locales, sin tokens): altura `space × 10 × densidad` con piso de 24px (44px con `pointer: coarse`), relleno inline `space × 3 × densidad`, separación `space × 1 × densidad`, degradado `space × 6`. En `segmented` la altura de cada segmento es la de la fila menos el relleno de la pista (piso 24px, 44px en táctil).

## Decisiones y desviaciones

1. **`--g-tabs-inset` vive en `GTabs.css` (`:root { --g-tabs-inset: 0px }`), no en `defaults.css`.** `levels.test.js` prohíbe que un componente redeclare un token del tema, y la anfitriona (`.g-dialog__tabs`) **debe** declararlo; si estuviera en `defaults.css`, `GDialog.css` rompería la prueba. Declarado en `:root` por el componente, el valor cero se hereda y cualquier anfitriona lo sobreescribe más cerca.
2. **La marca lee el rol `-text` de la familia** (`primary-text`, `accent-text`, `neutral-text`), no `primary`: es el que el tema garantiza ≥ 4.5:1 sobre la superficie, y la marca exige 3:1. Con `brand` por defecto es el mismo `#1F1F1F`; con una marca pálida (p. ej. Spotify, `#1ED760`) `primary` no habría llegado a 3:1. El contrato dice «`brand` lee `--g-color-primary*`»: es dentro de ese conjunto.
3. **Contorno de `border-control` en la píldora y en el segmento** (precedente #89, «bordes fuertes»). Sin él, la superficie suave sola da 1.07 a 1.23:1; con él, el contorno da 3.4 a 4.6:1 contra la anfitriona. El peso 600 y el color del texto siguen siendo las señales primarias; el contorno es solo para quien mide el elemento gráfico. Si el usuario lo siente pesado, se puede quitar de la píldora sin tocar nada más (una línea).
4. **Anillo de foco interior** (`outline-offset` negativo) porque el `scroller` recorta lo que sale de su caja. **Excepción en `segmented`:** el anillo cae fuera de la pestaña, en el relleno de la pista, porque dentro daba 2.3:1 sobre el segmento claro del tema oscuro (contra la pista: ≥ 3.6:1).
5. **Antes de `is-ready` la marca no se ve y la pestaña activa dibuja la suya** (`::before` con la misma forma), para que SSR o un fallo de medición no dejen la activa sin marca. Con `is-ready` el `::before` desaparece. En `forced-colors` la marca es `Highlight` (y el texto de la activa en pill, segmented y contained, `HighlightText`), con especificidad alta a propósito.
6. **`aria-selected="true"` y `is-active` se tratan igual** en todas las reglas: el CSS no depende de que bruno ponga la clase.
7. **Vertical:** la columna de pestañas mide de `space × 40` a `space × 64` y **nunca más de la mitad del contenedor** (a 320px el panel quedaba de 32px y el texto se salía).

## Estados cubiertos

| Estado | Cómo |
| --- | --- |
| hover | Solo `@media (hover: hover)`; velo + `text`; no se aplica a la activa ni a las deshabilitadas |
| `:focus-visible` | Anillo `--g-focus-width` / `--g-color-focus`, interior (excepción de `segmented`); en la pestaña enfocada, **no** en la activa |
| active | Marca + peso 600 + texto `text` (`on-primary-soft` en pill) |
| disabled | Opacidad 0.5 y `not-allowed`; en `forced-colors`, `GrayText` |
| loading / attention | Icono con texto oculto; `loading` gira solo sin movimiento reducido |
| `prefers-reduced-motion` | Marca sin transición (salta), sin giro, sin entrada del panel (verificado: transiciones `0s`, animación `none`) |
| `forced-colors` | Línea base `GrayText`, marca `Highlight`, texto de la activa `HighlightText` en las apariencias con superficie, foco `CanvasText` (verificado con emulación) |
| `prefers-contrast: more` | Línea base y texto inactivo con `border-control` y `text`; contorno doble en píldora y segmento; pista del segmento contorneada |
| `pointer: coarse` | `--_tap` 44px: pestañas, botones de borde, segmentos |
| RTL | Propiedades lógicas, `--_dir` por `:dir(rtl)` (marca y máscara), chevrones de los botones de borde espejados |

## Verificación en Chromium (banco, Playwright)

Contraste **medido** (compuesto real de capas con `elementsFromPoint`, no estimado), tema por defecto claro / oscuro / «Tema de prueba» (serif, borde de 2px, `space` 5px) y los 10 temas generados de `design/lab/tema-oscuro/dark-color-presence/generated/` en claro y oscuro (20 temas × 2 esquemas; el «Tema de prueba» en oscuro no cuenta: mezcla sus colores claros con la capa oscura).

| Medida | Defecto claro | Defecto oscuro | Tema de prueba | Mínimo en todos los temas |
| --- | --- | --- | --- | --- |
| Texto activo (underline) | 17.4 | 15.22 | 15.73 | 15.2 |
| Texto inactivo (underline / pill / segmented / contained) | 7.46 / 7.46 / 6.67 / 6.83 | 8.59 / 8.59 / 6.83 / 7.5 | 6.99 / 6.99 / 6.26 / 6.41 | 6.26 |
| Texto activo en píldora (`on-primary-soft`) | 14.46 | 12.82 | 10.73 | 4.58 |
| Marca underline y línea de contained | 16.48 | 15.22 | 9.74 | **4.52** (Apple claro) |
| Línea de contained / banda | 16.48 / 15.09 | 15.22 / 13.28 | 9.74 / 8.92 | 3.96 |
| Contorno píldora / host | 3.45 | 4.32 | 4.62 | 3.43 |
| Contorno del segmento / pista | 3.09 | 3.43 | 4.14 | 3.08 |
| Contorno del segmento / segmento (lado interior) | 3.45 | 2.34 | 4.62 | 2.18 |
| Foco / pestaña inactiva, píldora, contained | 5.69 | 4.58 | 5.77 | 3.86 |
| Foco / pista (segmented) | 5.09 | 3.64 | 5.16 | 3.63 |
| Icono `attention` | 5.73 | 4.54 | 4.48 | 3.75 |
| Texto del contador y de la insignia | 6.54 | 4.56 | 6.54 | 4.53 |

- **Superficie de la píldora sola** (informativo, no es la señal primaria): 1.07 a 1.23:1 contra la anfitriona.
- **Contorno del segmento, lado interior** en oscuro: 2.18 a 2.34:1. Es el lado del propio segmento; el límite contra lo que lo rodea (la pista) llega a 3.4:1. Un contorno a la vez ≥ 3:1 contra la pista y contra un segmento más claro no es posible con un segmento distinguible; se documenta como excepción aceptada.
- **Tamaños** (altura mínima de pestaña): ratón 40 / 35 / 30px (default / comfortable / compact), segmento 32px (24px en compact: el piso); táctil 44px en **todas** las densidades, el botón de borde 44×44, solo icono 44×44, segmentos compactos 44px.
- **320px:** sin desborde de página (320/320) y sin desborde en ninguna raíz ni diálogo; `scroll`, `arrows`, `more`, `segmented` degradada y vertical.
- **Marca:** el primer posicionamiento no se anima; al cambiar de pestaña se desliza (posición intermedia a 60ms, final a 400ms, igual a la pestaña).
- **Consola:** sin errores ni avisos. **Literales:** solo `24px`, `44px`, `0px` (sangrado cero y piso de `max()`), el patrón de texto oculto; sin colores ni `var()` con respaldo; sin `@layer`.
- `npm test` (914 pruebas, incluidas `levels.test.js` y `roles.test.js`), `npm run build` y las tres compuertas, en verde.

## Hallazgos para bruno

1. **Marca:** `--_mark-x`, `--_mark-y`, `--_mark-w`, `--_mark-h` **con unidad `px`**, en la raíz o en la marca, medidos contra la caja de relleno del `g-tabs__scroller` e incluyendo el desplazamiento: `x` = distancia al borde de **inicio** (en RTL, desde el borde derecho, restando el `scrollLeft` negativo), `y` desde el borde superior más `scrollTop`. El banco trae la medición probada en LTR y RTL. Sin pestaña activa válida: `--_mark-w: 0px` y `--_mark-h: 0px` (la marca no dibuja nada con tamaño cero).
2. **`data-text="{label}"` en `g-tabs__label`** (reserva el ancho de la negrita). Sin él, la activa desplaza a las demás. Con el slot `label` rico, el atributo lleva el texto plano de `item.label`.
3. **`is-ready`** en la raíz tras posicionar la marca por primera vez (el CSS ya no anima antes).
4. **Rueda del ratón:** en `scroll` no hay botones y un ratón sin desplazamiento horizontal no alcanza las pestañas fuera de vista; convendría convertir `deltaY` en desplazamiento horizontal sobre el `scroller` cuando haya lista fuera de vista (sin `preventDefault` si no la hay).
5. **`GMenu` del «Más»:** el disparador es `g-tabs__more` (con `chevron-down` y, si procede, un `g-tabs__status` dentro). Su icono de carga no gira (el giro es solo de `g-tabs__tab.is-loading`); si se quiere, se añade una clase al botón y coco la cubre.
6. **Íconos:** `.g-tabs__icon > svg`, `.g-tabs__status > svg` y `.g-tabs__edge > svg` se dimensionan por selector de hijo directo; el `GIcon` debe ser el hijo directo del contenedor.
7. **`GDialog.vue`:** el slot `tabs` va en `div.g-dialog__tabs` **entre el encabezado y la superficie inset (o el cuerpo)**, hermano de ellos, con `GTabs detached` dentro; el CSS ya está (`--g-tabs-inset: var(--_pad)`, sangre completa, sin línea base duplicada con `--inset`, aire bajo la línea en el modo sin inset).
8. **`GTabPanel`:** usa `g-tabs__panel` sin ancestro `g-tabs`; en `contained` el relleno del panel solo se aplica al panel integrado (dentro de la raíz).
9. **Registro:** `GTabs.css` en `components.css` y la compuerta `grep -q "g-tabs--appearance-pill" dist/grana.css`.

## Hallazgos para lima

1. **`--g-tabs-inset`** se declara en `GTabs.css` (`:root`) y no en `defaults.css` por `levels.test.js` (decisión 1 arriba). `tokens.md` §18 dice «los valores los fija coco en defaults.css»: conviene anotar la excepción de este token, o permitir en la prueba que un token de componente registrado lo declare la anfitriona.
2. **Contrato de clases:** añadir `data-text` en `g-tabs__label` y la convención de unidades y origen de `--_mark-*` (hallazgos 1 y 2 de bruno) a «Estructura accesible» y a «Clases».
3. **Contorno de `border-control` en la píldora y el segmento** (decisión 3): es una aplicación de #89; si la quiere el usuario más silenciosa, se decide aquí.
4. **El `:root { --g-tabs-inset }`** significa que un panel anfitrión lo sobreescribe con un selector más cercano (`.mi-panel { --g-tabs-inset: … }`); el contrato podría decirlo.
5. **Tooltip y `closable`** siguen fuera de v0.1; el CSS no deja hueco para el botón de cerrar (hermano del `tab`): se estiliza cuando entre.
6. **El CLI no emite `--g-tabs-*`:** los temas generados dependen de los valores de `defaults.css` (translúcidos sobre la anfitriona, así que siguen cualquier superficie); solo `--g-tabs-panel` se resuelve contra `--g-color-surface`.

## No ejecutado

Firefox y Safari (`@starting-style`, `mask-image`, `:dir()`, `:popover-open` del «Más»), `forced-colors` real de Windows (emulado: la paleta de Playwright no es la de Windows), lector de pantalla (el CSS no cambia el árbol), zoom al 200%, táctil con dedo y `snap`, el menú «Más» abierto (lo pinta `GMenu`), `prefers-contrast` con un tema de alto contraste real.
