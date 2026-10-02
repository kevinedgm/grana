# Entrega de coco · GDialog.css

**Archivos:** `packages/vue/src/components/GDialog/GDialog.css` y los valores de `--g-surface-*` en `packages/vue/src/styles/defaults.css`.
**Contrato:** `design/contracts/dialog.md` (DECISIONS.md #42 a #46).
**Estado:** listo para bruno (registro pendiente en `components.css`, que es de bruno; el `.vue` aún no existe).
**Banco de pruebas:** `design/lab/dialog/estilo-banco.html`: marcado exacto del contrato con el CSS real y el tema por defecto (desde la raíz del repo: `/design/lab/dialog/estilo-banco.html`). Trae un botón "Tema de prueba".

## Carácter propio (con tokens, sin literales de tema)

| Detalle | Cómo |
| --- | --- |
| **Dos superficies, una pieza** | Carcasa `--g-surface-shell` (gris muy claro) y, a `--g-surface-gap` (6px), la inset `--g-surface-inset` (blanco). Bordes finos, sombra `--g-shadow-3` en la carcasa y `--g-shadow-1` en la inset: la profundidad sale de la diferencia mínima de fondo, no de contraste |
| **Radio concéntrico** | El radio de la inset descuenta separación y borde (`radius − gap − borde`): con el tema por defecto 12 → 5px; con el de prueba 28 → 18,5px, y sigue el cambio de `--g-space-1` y `--g-border-width` |
| **Pie que se funde** | Mientras queda contenido por desplazar (`is-scrolled`), el pie pasa del fondo de la inset al de la carcasa; al llegar al final, vuelve |
| **Secciones sin cajas** | `g-dialog__section` se separa con una línea; `g-dialog__well` es la única superficie secundaria (un nivel, radio concéntrico con la inset) |
| **Cierre dibujado con bordes** | El botón va vacío; la cruz son dos barras de `border`, que **sobreviven a `forced-colors`** (un fondo no) |
| **Entrada y salida** (#152) | Entra desde `@starting-style` con `opacity`, un desplazamiento de `--g-space-2` y `--g-press-scale` (hoja lateral: desde su borde; hoja móvil: `--g-space-6` desde abajo), en `--g-duration-press` con `--g-ease-out`; **sale** en `--g-duration-fast` hacia `--g-press-scale` y opacidad 0 (la hoja, hacia su borde); el fondo se funde en ambos sentidos. Con movimiento reducido, solo fundido de 120 ms. Sin `overlay` (Firefox, Safari) cierra al instante |
| **Cargando** | Barra fina de `--g-color-accent` (un borde, no un fondo) sobre la inset, que pulsa; `cursor: progress` |
| **Móvil** | Hoja: pegada abajo, esquinas superiores redondeadas, la inset llega al borde inferior y el pie suma `env(safe-area-inset-bottom)`; ancho completo con margen; pantalla completa exacta |

## Valores por defecto agregados (`defaults.css`, capa `grana.defaults`)

`--g-surface-shell` = `--g-color-surface-sunken` · `--g-surface-inset` = `--g-color-surface` · `--g-surface-gap` = `space × 1.5` · `--g-surface-radius` = `--g-radius-xl` · `--g-surface-radius-inset` = `max(0px, radius − gap)` · `--g-surface-backdrop` = `rgb(0 0 0 / 0.32)`. Coinciden con lo que fijó lima en `tokens.md` §11.

## Verificación en Chromium (banco de pruebas)

| Prueba | Resultado |
| --- | --- |
| Literales | Sin colores; medidas solo `24px`, `44px`, `0px` en `max()` y los umbrales `900px` y `520px` de `@media` (excepción #42); ningún `var()` con respaldo, sin `@layer` ni `<style>` |
| Ancho por tamaño | `md` 560px con `space` 4 (×140). Con el tema de prueba (`space` 5, 700px pedidos) la carcasa midió 648px porque el visor del panel era menor: se limita al visor menos 8 unidades, como pide el contrato |
| Contraste (tema por defecto) | Título 16.1 · cuerpo 17.4 · descripción 6.9 · cruz de cierre 6.9 · borde del icono de alerta 3.19 (mínimo 3:1) |
| Contraste (tema de prueba) | Todo texto de las 10 composiciones ≥ 4.5:1 |
| Cambio de tema (marca vino, acento verde azulado, superficies ámbar, texto marrón, radio xl 28, radios de campo 0, borde 2px, foco 3px, espacio base 5, Georgia, fondo propio) | Las **156** propiedades medidas (color, fondo, borde, radio, fuente, contorno, sombra) cambian; ninguna conserva el valor por defecto |
| Foco con teclado (real) | Anillo de `--g-focus-width` en cierre y acciones; el cuerpo desplazable lo lleva hacia dentro (`outline-offset` negativo) para que la carcasa no lo recorte |
| Confirmación | Sin botón de cierre; foco inicial en "Cancelar"; inset con solo pie (el cuerpo vacío no ocupa espacio) |
| Móvil 375px | Hoja de 375px de ancho pegada abajo (812px), pantalla completa exacta, ancho completo con margen, sin desborde horizontal |
| Táctil (`pointer: coarse`, bloque aplicado sin condición) | Cierre de 44×44px |
| Movimiento reducido (bloque aplicado sin condición) | El botón de cierre conserva el fundido de color y no escala al pulsar; diálogo y fondo se funden (120 ms) al entrar y al salir, sin desplazamiento ni escala |
| Colores forzados (bloque aplicado sin condición) | Carcasa, inset, pie, secciones y cierre en `CanvasText`/`ButtonText`; la cruz (borde de 2px) se mantiene |
| Consola | Sin errores |

## Notas para bruno

- El botón `g-dialog__close` va **vacío** (sin texto ni SVG): la cruz la dibuja el CSS.
- `is-scrollable` e `is-scrolled` las pone bruno; `is-scrolled` va en `g-dialog__inset` (o en la raíz, sin inset). Con `inset={false}`, el pie no lleva línea ni fondo.
- El bloqueo del scroll de la página lo hace el CSS (`html:has(.g-dialog[open])`); bruno no toca `document.body`.
- `::backdrop` hereda `--g-surface-backdrop` de la raíz `<dialog>` (navegadores de 2024 en adelante). En uno anterior, el fondo quedaría transparente: se documenta como límite.

## Sin verificar (lo audita el paso 5 o queda pendiente)

Lector de pantalla real; teclado virtual en móvil; preferencias reales de `prefers-reduced-motion` y `forced-colors`; Firefox y Safari (`::backdrop` con variables, `:has()`); tema oscuro (no existe); un diálogo más alto que el visor con `dvh` en Safari móvil.
