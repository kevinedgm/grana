# Contraste de lo marcado · estilo y medida (coco)

Aplicación de `tokens.md` §7.1 (DECISIONS.md #431 y #432; encargo único en `design/contracts/checkbox.md` §«Contraste de lo marcado»). Un control marcado, elegido, pulsado o seleccionado con relleno `--g-color-{familia}` conserva relleno, marca `on-{familia}` y hover `{familia}-strong`; su **contorno** pasa a `--g-color-{familia}-text`.

- Banco: `banco.html` (componentes reales: `dist/grana.css` y `grana.umd.js`; escenas `controls`, `menu`, `calendar`, `week`, `strip` a 390 px, `gallery`, `combobox`, `filter`, `navbar` a 390 px).
- Verificación: `GRANA_PW_PORT=4209 node design/lab/contraste-marcado/verificar.mjs` (apartados `static`, `contrast`, `delta`; `GRANA_DIST_ANTES=<copia de dist anterior>` para el Δ0 píxel a píxel). Resultado del cierre: **3660/3660** en Chromium, Firefox y WebKit.

## Qué cambió (solo el color del contorno o un trazo interior; nada de geometría)

| Componente | Selector | Antes | Ahora |
| --- | --- | --- | --- |
| `GCheckbox` | cuadro `:checked` e `:indeterminate`; chip marcado; ambos también en hover | borde `--_c` (hover `--_c-strong`) | borde `--_text` (hover: relleno `--_c-strong`, borde `--_text`) |
| `GSwitch` | `.g-switch__input:checked` y su hover | borde `--_c` / `--_c-strong` | borde `--_text`; **`--_text` nuevo** en el bloque base y en las siete `--color-*` |
| `GMenu` | `[aria-checked="true"] > .g-menu__mark` | `primary` | `primary-text` |
| `GTable` | casilla nativa (fila y «todo»); tarjeta `is-selected` | `accent-color: primary`; borde `primary` | `accent-color: primary-text`; borde `primary-text` |
| `GFilterBar` | casilla nativa del editor | `accent-color: primary` | `accent-color: primary-text` |
| `GCalendar` | vista pulsada (barra); día pulsado (tira); hoy en la cabecera y en Mes | borde `primary`; sin contorno | borde `primary-text`; trazo interior `inset 0 0 0 var(--g-border-width) primary-text` |
| `GDatePicker` | `.g-datepicker__day.is-selected` | sin contorno | trazo interior `--_text`; **`--_text` nuevo** en el bloque base y en las siete `--color-*` |
| `GStepper` | indicador `is-complete` e `is-current` (también en `dot`) | borde `--_base` | borde `--_text` |
| `GWidgetGallery` | `.g-widget-gallery__cat > input:checked + span` | borde `primary` | borde `primary-text` |
| `GCombobox` | `[aria-selected="true"] > .g-combobox__box` | borde `text` (#429) | borde `primary-text` (#432); `surface` en la activa invertida de la paleta, sin cambio |
| `GRadioGroup` | (ya cumplía) | — | sin cambio; medido |

**Decisión de coco, dentro de la regla:** el día **elegido y hoy** de `GDatePicker` conserva su aro `on-{color}` de 2 trazos en el borde (no se le añade el filo `-text`): el aro es la señal de hoy y la forma ya se distingue por construcción (con `on` claro el relleno contrasta con la superficie; con `on` oscuro, el aro). Medido: ≥ 4,53:1 (peor, `primary` oscuro con `warning`). Aro y punto de hoy **sin elegir** se pintan con `text-muted`/`currentColor`, no con `--_color`: no cambian (aro ≥ 6,87:1).

## Qué le da personalidad (y por qué no se nota en el tema por defecto)

El contorno no es un trazo ajeno: es **el filo de la misma marca**, un tono más hondo del relleno. Con una marca pálida (lustre, el amarillo de `warning`) el control marcado gana un canto dorado o tinta que lo recorta contra la página, como una pieza esmaltada con su borde; con una marca oscura (el tema por defecto) el filo coincide con el relleno y desaparece. No hay anillo exterior (ese lugar es del foco) ni movimiento nuevo: el cambio es de material, no de gesto. `prefers-reduced-motion`, `forced-colors` (colores del sistema; los trazos `box-shadow` desaparecen como antes) y las transiciones existentes no cambian.

## Medida · contorno ≥ 3:1 (mínimo contra `surface`, `bg`, `surface-sunken`, el fondo real y `{familia}-soft` donde ocurre)

Temas: por defecto, lustre, spotify y `primary` propia (`design/lab/combobox/auditoria-tema-primary.css`, #107), claro y oscuro; tres motores (las cifras coinciden entre motores). `GCheckbox`, `GSwitch`, `GRadioGroup`, `GStepper` y `GDatePicker` con `brand`, `accent` y `warning`; el resto lee `primary` sin prop `color`.

| Componente · estado | Mínimo | Peor caso | Por tema (peor familia) |
| --- | --- | --- | --- |
| `GCheckbox` cuadro marcado, indeterminado, chip y tarjeta | **4,21** | spotify claro, `brand` | defecto 5,27 · defecto oscuro 4,54 · lustre 4,36 · lustre oscuro 4,54 · spotify 4,21 · spotify oscuro 4,54 · primary 5,30 · primary oscuro 4,53 |
| `GSwitch` riel encendido | **4,21** | spotify claro, `brand` | igual que `GCheckbox` |
| `GRadioGroup` círculo, chip, segmento y tarjeta (ya cumplía) | **4,21** | spotify claro, `brand` | igual que `GCheckbox` |
| `GStepper` completado y actual (`number` y `dot`) | **4,21** | spotify claro, `brand` | igual que `GCheckbox` |
| `GDatePicker` día elegido (sobre la franja `-soft`) | **4,07** | spotify claro, `brand` contra `primary-soft` | defecto 5,00 · defecto oscuro 4,15 · lustre 4,13 · lustre oscuro 4,15 · spotify 4,07 · spotify oscuro 4,15 · primary 5,01 · primary oscuro 4,15 |
| `GDatePicker` elegido y hoy (aro `on` o relleno) | **4,53** | primary oscuro, `warning` | — |
| `GTable` casilla nativa (también sobre la fila `primary-soft`) | **4,07** | spotify claro | defecto 14,46 · lustre 4,13 · spotify 4,07 · primary 9,11 · oscuros 12,82 / 8,82 / 7,92 / 4,28 |
| `GTable` tarjeta seleccionada | **4,21** | spotify claro | defecto 15,25 · lustre 4,36 · primary 9,71 · primary oscuro 4,60 |
| `GMenu` marca de casilla y de opción | **4,21** | spotify claro | lustre 4,36 · lustre oscuro 9,64 · primary oscuro 4,60 |
| `GCalendar` vista pulsada, día de la tira, hoy (cabecera y Mes) | **4,21** | spotify claro | lustre 4,36 · primary oscuro 4,60 |
| `GWidgetGallery` categoría elegida | **4,21** | spotify claro | lustre 4,36 · primary oscuro 4,60 |
| `GCombobox` casilla marcada (campo A y paleta) | **4,21** | spotify claro | lustre 4,36 · primary oscuro 4,60 |
| `GCombobox` casilla en la activa invertida (`surface` contra la fila `text`) | **15,18** | primary oscuro | — |
| `GFilterBar` casilla nativa | **4,21** | spotify claro | lustre 4,36 · primary oscuro 4,60 |

Antes del cambio, el mismo estado medido como forma (relleno `{familia}` contra la superficie) daba **1,64:1** con `brand` en lustre claro (contra `surface-sunken`; 1,77 contra `surface`) y **1,20:1** con `accent` en spotify claro. Ahora ningún estado de la regla baja de 4,07:1.

El script comprueba además que cada contorno pinta exactamente el token esperado (`{familia}-text`, o `surface` en la activa invertida) y que todo lo de la lista se midió.

## Δ0 en el tema por defecto (claro y oscuro)

`primary-text` = `primary`, `accent-text` = `accent` y, en `defaults.css`, también `warning-text` = `warning`: el color del contorno en reposo no cambia en ningún estado. Captura píxel a píxel de cada escena con el CSS anterior (copia de `dist` previa) y el actual, tres motores:

- `menu`, `strip`, `gallery`, `combobox`, `filter`, `navbar`: **0 píxeles distintos**.
- `controls`, `calendar`, `week`: entre 66 y 834 píxeles distintos (de 1,1 a 6 millones), **todos dentro de la caja de las formas redondas que ganan el trazo interior** (día elegido de `GDatePicker`, hoy de `GCalendar`), máx. 64/255: el trazo del mismo color que el relleno solo cambia el **antialiasing del filo** del círculo; ni color ni geometría. Cualquier píxel distinto fuera de esas cajas falla la verificación.

**Hover (informativo, a lima):** por §7.1 el contorno se queda en `-text` también con el relleno `-strong`, así que en el tema por defecto, al pasar el puntero por una casilla, chip o interruptor marcado, el borde ya no es `-strong` sino la base: `brand` claro #1F1F1F sobre #333333 (1,30:1), `accent` claro #0B63CE sobre #024DA7 (1,41:1), `brand` oscuro #F2F2F2 sobre #FFFFFF (1,12:1), `accent` oscuro #3383F0 sobre #4D96FF (1,26:1). Es un filo de 1 px apenas perceptible y solo mientras dura el hover; se aplica tal cual dice el contrato. Si lima prefiere Δ0 estricto también en hover, la alternativa sería mantener `-strong` como borde en hover solo cuando `-strong` llegue a 3:1, lo que no se puede expresar sin un token.

## Repaso con `grep` (lo que la lista no recogía)

Rellenos de familia en `background`/`border-color`/`accent-color`/`box-shadow` en todos los `G*.css`:

- **Exentos por §7.1:** `GBtn`, `GBadge`, `GCard`, `GAvatarMotion`; botones `--primary` de `GWidgetGallery`, `GWidgetConfig` y `GDatePicker` (`__action--primary`); contadores de `GSidebar` (`__badge`); «Deshacer» de `GCombobox` en hover (botón con texto); icono relleno de la tarjeta de `GCheckbox` y `GRadioGroup` (la tarjeta ya lleva el contorno).
- **No son estado de un control:** `GStatusIsland` y `GStatusMark` (`--_fill` de estado, con su aro y estilo de línea por tipo); `GSpeechPill`; destino de arrastre `is-over` de `GFileField` (`accent` con texto `on-accent`, transitorio); barra superior `accent` de `GDialog` (decorativa). `GTabs` ya usaba `{familia}-text` (`--_base`) para su marca.
- **`GSidebar` navbar (exención confirmada):** la píldora del item actual (`--_color`) da 1,64:1 (lustre claro) y 1,78:1 (spotify claro) contra la barra, pero el actual **muestra su etiqueta** (las demás, solo icono) y **crece ×3,2** de ancho en los tres motores y en todos los temas: el estado se distingue sin el relleno. No se toca.
- **`GStepper`, variantes fuera de la lista (a lima):** en `dot`, el **anillo exterior** del actual (`box-shadow` en `--_base`); en `line`, la **raya** inferior del completado y del actual (`border-block-end-color: --_base`); en `segment`, el **tramo** completado (degradado `--_base` contra `border-control`). Son la señal del estado del paso pero se dibujan con `--_base` como forma: con `brand` en lustre claro 1,64:1, con `accent` en spotify claro 1,20:1; el tramo de `segment` contra su pista baja a 1,04:1. No los cambio sin decisión: ¿entran en §7.1 (pasar a `--_text`, Δ0 en el tema por defecto) o son objetos gráficos como el conector?

## Fuera de la regla · medidos sin cambiar (a lima)

| Objeto | Mínimo | Peor caso | Nota |
| --- | --- | --- | --- |
| Franja de rango de `GDatePicker` (relleno `{color}-soft`) | 1,04:1 | spotify claro (`brand`) | El relleno suave no es la forma: la franja lleva **filos `border-control`** arriba y abajo (#89), que dan **≥ 3,19:1** (lustre claro, contra `surface-sunken`; 3,43 contra `surface`). Cumple por el filo |
| Avance de `GProgress` contra su pista | (cerrado en #439, ver abajo) | — | Ahora en `{familia}-text`: ≥ 4,21:1 |

## Otras notas

- **Para bruno:** ninguna instantánea de vitest fija colores (las de `GCheckbox` y `GInput` son de HTML en jsdom); vitest de los diez componentes tocados: 642/642. En Chromium, `tests/radio-group.spec.mjs:93` («semántica…») falla por una violación de modo estricto: `getByRole('radio', { name: 'Gráfica' })` encuentra tres radios porque el playground ya tiene los grupos nuevos `rg-icon-stack` y `rg-icon-dis` de su encargo en curso (#435); no es del CSS.
- **Preexistente, sin tocar:** `GMenu.css` y `GCalendar.css` leen alias dinámicos del `.vue` con valor de respaldo (`var(--_x, 0px)`, `var(--_lanes, 1)`, `var(--_hc, var(--g-color-text-muted))`…). No son tokens del tema; el script solo prohíbe respaldo en `--g-*`.
- **Para mora-docs:** una línea en «Accesibilidad» de los README de `GCheckbox`, `GSwitch`, `GMenu`, `GTable`, `GFilterBar`, `GCalendar`, `GDatePicker`, `GStepper`, `GWidgetGallery` y `GCombobox`: el estado marcado lleva contorno `{color}-text`, ≥ 4,07:1 contra la superficie en los cuatro temas medidos (ver tabla).

## Formas de familia sin par (#439 y #440; `widget.md` §«Contraste del avance», `stepper.md` §«Formas de familia del paso»)

Lo que se dibuja como **forma** sin nada `on-{familia}` encima pasa de `{familia}` a `{familia}-text`: el relleno de `GProgress` (`g-progress__fill`; `--_text` nuevo en el bloque base y en las siete `--color-*`; `--_color` desaparece) y ocho declaraciones de `GStepper` (conector hecho, punto completado y actual de `dot`, su anillo exterior, raya completada y actual de `line`, tramo de `segment`, barra del compacto). El relleno del indicador completado de `number`/`icon` **no cambia** (lleva el icono `on-{familia}`; es la única `var(--_base)` que queda en `GStepper.css`). La ficha de `GFileField` no cambia: su `.g-file-field__progress .g-progress__fill` (accent-soft con frente `on-accent-soft`) es más específico y sigue ganando (medido: pinta `accent-soft` y `on-accent-soft`).

- Escena `steps` del banco (horizontal ×5 variantes, vertical, compacto, `GProgress` al 40 % / 2 % / sin valor, la ficha de `GFileField`); medida con `GRANA_PW_PORT=4209 GRANA_DIST_ANTES=<dist anterior> node design/lab/contraste-marcado/verificar.mjs`. Cierre: **5451/5451** en Chromium, Firefox y WebKit.
- **Avance de `GProgress` contra su pista y la superficie (compuerta, ≥ 3:1): mínimo 4,21:1** (spotify claro, `brand`; 4,29 `accent`; 4,53 `warning` en primary oscuro). Por tema, peor familia: defecto 4,54 (oscuro `accent`/`warning`) · lustre 4,36 · spotify 4,21 · primary 4,53. Antes: 1,20:1 (`accent`, spotify claro) y 1,64:1 (`brand`, lustre claro). Vale igual con 2 % de avance y sin valor.
- **Partes del paso contra `surface`, `bg` y `surface-sunken` (informativo): mínimo 4,21:1** (el mismo peor caso; cada parte pinta exactamente `{familia}-text`, comprobado). Por tema, `brand`: defecto 15,22 · lustre 4,36 · spotify 4,21 · primary 4,60.
- **Δ0 en el tema por defecto, claro y oscuro, tres motores: 0 píxeles distintos** en `steps` (horizontal, vertical y compacto, `brand`, `accent`, `warning`) y en las otras nueve escenas; incluida la ficha de `GFileField`. Nota de método: el icono de comprobación del indicador completado da a veces 37–38 píxeles (≤ 37/255) de ruido de rasterizado también entre dos cargas del **mismo** CSS (probado con la misma copia de `dist` en los dos lados); el script repite la captura hasta tres veces y espera a que dos seguidas coincidan, y solo falla un Δ que persiste.
- **Conector en el tema por defecto oscuro, cifra corregida:** el 1,12:1 de la tabla anterior era un error de medida: `border-strong` es translúcido (`rgb(255 255 255 / 0,20)`) y el script lo tomaba por blanco opaco (#F2F2F2 contra #FFFFFF = 1,12). Compuesto sobre el fondo, el conector hecho (`brand` #F2F2F2) contra la pista pendiente da **8,84:1**. Con `accent` y `warning` en el defecto oscuro: 2,66 y 2,64. Hecho contra pendiente del conector, peor familia por tema: defecto 2,64 · lustre 2,74 · spotify 2,74 · primary 2,74 (`brand` 8,84 / 3,38 / 3,25 / 2,78). Contra la superficie el conector hecho pasa a ≥ 4,21:1.
- **Tramo de `segment`, hecho contra pendiente (`border-control`, límite conocido de `stepper.md`; compuesto):** `brand` defecto 3,53 · lustre 1,37 · spotify 1,32 · primary 1,07; mínimos globales: 1,04 (`warning`, spotify oscuro), 1,06 (`accent`, defecto oscuro). Sin cambio de valor: ya se leía por la etiqueta del actual y el orden.

## Qué le da personalidad (formas de familia)

Igual que el contorno de lo marcado, el avance y el trazo del paso son **el tono más hondo de la misma marca**: con una marca pálida (lustre, spotify) la barra y el camino de pasos dejan de diluirse en la página y ganan cuerpo; con la marca oscura del tema por defecto no cambia ni un píxel. Sin movimiento nuevo; `prefers-reduced-motion`, `forced-colors` (colores del sistema) y las transiciones existentes no cambian.
