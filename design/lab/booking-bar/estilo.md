# GBookingBar y GPartyField · estilo (coco)

**Dueño:** coco · **Contrato:** `design/contracts/booking-bar.md` (#736 a #742, #744, #745; `datepicker.md` «Noches y salida», #739; `tokens.md` §29.6, §53; `api.md` «Flotantes persistentes») · **Estructura:** `design/lab/booking-bar/r01/` (kiwi)
**Entrega:** `packages/vue/src/components/GBookingBar/GBookingBar.css`, `GPartyField/GPartyField.css`, en `GDatePicker/GDatePicker.css` `g-datepicker--trigger` (`display: contents` y letra propia del panel) e `is-checkout-only`; banco `estilo-banco.html` y verificación `estilo-verificar.mjs`.

## Qué le da personalidad

- **La tinta se asienta.** Un hueco vacío de la frase lleva un subrayado discontinuo (`border-control`, ×2 del borde) y su valor en voz baja («¿qué día?»). Al llenarse, un **trazo continuo de tinta se dibuja encima desde el inicio de la línea** (`scale` del `::after`, `slow` + `ease-out`; en RTL desde la derecha) y se recoge en `fast` al vaciarse. Con error, el trazo es continuo y `danger-text`. Vacío / lleno / error se distinguen por **forma**, también en `forced-colors`. Con movimiento reducido, el trazo aparece.
- **Se lee como se dice:** la frase va en `title` con un interlineado de `title-line × 1,25` (≥ 44 px con puntero grueso) para que la diana de 44 px de cada hueco nunca pise la línea de al lado; refluye como texto a 320 px y 320×256.
- **La raíz no se pinta:** sin superficie ni sombra, vive dentro de la tarjeta de `GHero` C, de una `GCard` o de la página.
- **El muelle acompaña:** banda de borde a borde con el alto de contrato, el contenido alineado a una columna de `space × 240`; entra desde abajo (`slow` + `ease-out`), sale en `press`, y mientras se ve el documento reserva su alto en `scroll-padding-block-end` (más `--g-sidebar-bar` con un navbar fijo).
- **`GPartyField` es la caja de `GSelect`** (mismas unidades, foco, variantes, estados, `GFormRow` y sacudida al rechazar): comparte fila con ellos sin un píxel de diferencia.
- **El día «solo salida»** se subraya en punteado (no se tacha): «aquí se puede terminar».

## Medidas

| Pieza | Valor |
| --- | --- |
| Frase | `title-size`, interlineado `title-line × 1.25` (coarse: `max(…, 44px)`); hueco con interlineado `title-line`, peso `title-weight` |
| Diana del hueco | `::before` centrado en la caja con su subrayado: `max(alto, 24px)`, 44 px con puntero grueso |
| Paneles del hueco y del grupo | capa superior, `left/top` = `--_x/--_y`, `max-block-size: --_max`, mín. `space × 64` / `× 72`, máx. `min(space × 96 / × 90, 100vw − space × 4)`, letra `body` (no la de la frase), `shadow-2`, entrada `press` desde `space × 1` según `data-side` |
| Barra | fila `nowrap`; mínimos por contenido (`:has()`): rango partido `space × 80`, grupo `× 48`, lista `× 36`, fecha `× 40`; la acción baja la línea de la etiqueta (`body-sm-line + space-1`) |
| Compacto | resumen ≥ `max(44px, space × 12)`, borde `border-control`, título `caption` muted, texto `body-sm` 600, «Cambiar» subrayado |
| Muelle | `max(space × 16, 44px + space × 4)` + área segura si nada hay debajo; `z-index 3`; `border-strong` arriba, `shadow-3` |

## Verificación (`GRANA_PW_PORT=4241 node design/lab/booking-bar/estilo-verificar.mjs`)

Resultado sobre el estado final: ver el informe de entrega. Cubre: estático de los tres archivos; la frase a 1100, 390, 320 y 320×256 en LTR y RTL (sin desplazamiento horizontal; vacío discontinuo, lleno con la tinta continua en `slow`, error continuo en `danger-text`; subrayados ≥ 3:1; frase, valores y mensaje ≥ 4,5:1; raíces de `GDatePicker` y `GPartyField` con `display: contents`); paneles dentro del visor y con letra `body` (noches, grupo y el calendario real abierto desde la frase); reducido; diana de 44 px con puntero grueso (Chromium, WebKit); la barra en fila (acción y cajas alineadas con `GDatePicker` real, resumen visible) y el compacto a 390, 320 y 320×256 en LTR y RTL; el grupo con error, foco y deshabilitado; el muelle con y sin reducido (oculto = `display: none` + inerte, alto de contrato, de borde a borde, `scroll-padding-block-end` = su alto, un control enfocado bajo el borde queda por encima); el día «solo salida»; contraste en el tema por defecto, terracota, añil, pálida, stripe, amazon, linear y notion, claro y oscuro; forced-colors (Chromium); consola limpia.

## Encargos

**bruno (`GBookingBar.vue`, `GPartyField.vue`, enmienda de `GDatePicker.vue`):**
1. Hueco: `button.g-booking-bar__slot` con `is-empty` o `is-filled` siempre (uno de los dos) e `is-invalid` con error; dentro `span.__slot-label` (oculto) y `span.__slot-value`; un chevron opcional como `GLibIcon` hijo directo (el CSS lo pinta a `body-sm`).
2. Resumen compacto: dentro de `button.__summary`, **`span.__summary-title`** («Tu consulta»), **`span.__summary-text`** (el resumen) y **`span.__summary-change`** («Cambiar»).
3. Campos de la barra con **`block`** (`GDatePicker`, `GSelect`, `GPartyField`) dentro de `div.__field`; la acción `GBtn` del mismo `size` que los campos (md por defecto).
4. Muelle: `hidden` + `inert` mientras no se ve y `is-shown` mientras se ve, **en el mismo cuadro** (el CSS anima la salida con `display` discreto); la reserva leída de su borde como **`--_reserve`** (px) en el `div.__dock`.
5. `GPartyField`: el disparador lleva un icono `users` y `GLibIcon.g-party-field__arrow` (`chevron-down`); el pie como `GSelect` (`__hint`, `__message` con `__message-icon` y `__message-type`); los contadores del panel con `block`.
6. `GDatePicker`: `g-datepicker--trigger` en la raíz con el slot `trigger`; `is-checkout-only` en el botón del día.

**lima:**
- **B-C1 · el final de la página bajo el muelle:** la tercera salida de «Flotantes persistentes» no puede desplazar más allá del final del documento: el **último** control de una página sin sitio al final queda bajo el muelle (medido en los tres motores). Opciones: que la capa de Grana añada también `padding-block-end` (el alto) en `<html>` mientras se ve, o una receta del README («deja el alto del muelle al final de la página»). Decisión de lima.
- **B-C2 · §29.5:** añadir `--_reserve` (px, en `div.__dock`) a los datos del `.vue` al CSS.
- **B-C3 · §53 consumidos:** `GPartyField` es un campo como `GSelect` y lee también `--g-color-warning-text`, `--g-color-success-text`, `--g-color-neutral-soft` (solo lectura), `--g-color-surface-sunken` (soft y deshabilitado), `--g-color-text-subtle`; y `GBookingBar` lee `--g-sidebar-bar` (reserva del navbar) y `--g-ease-standard`. Añadirlos a §53.
- **B-C4 · clases nuevas:** `__summary-title`, `__summary-text`, `__summary-change` en la tabla del contrato.

## No verificado

Lector de pantalla con la frase en modo lectura; móvil real (teclado virtual sobre la hoja); zoom real del navegador (se emuló 320×256); otros idiomas en la frase (se probó RTL con la plantilla en español); la histéresis de la forma compacta real (la del banco es simplificada); `forced-colors` en Firefox y WebKit; el estado `is-checkout-only` en el `GDatePicker` real (el banco lo pinta en una muestra estática, el `.vue` aún no lo emite).
