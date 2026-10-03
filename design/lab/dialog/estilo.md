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

## Personalidad (plan 019; DECISIONS.md #281, #299 y #301; `dialog.md` «Personalidad»)

Qué le da carácter propio al diálogo, sin cambiar dónde aparece (sigue centrado):

| Detalle | Cómo |
| --- | --- |
| **D1 · Viene de donde lo llamaste** | Con `has-origin`, el diálogo centrado entra desde **un cuarto** del vector centro del visor → centro del disparador (`--_origin-x/y`, que escribe el `.vue` antes de `showModal()`), con **tope `--g-space-1 × 8`** por eje (`clamp`), junto al fundido y la escala de #152, en `--g-duration-press` con `--g-ease-out`. Al cerrar sale **hacia el elemento al que vuelve el foco** (vector remedido desde el centro real del diálogo), en `--g-duration-fast`. Se insinúa el origen, no se recorre: en una tabla con «Editar» por fila se ve qué fila lo abrió y el movimiento anticipa adónde vuelve el foco. Sin muelle (`--g-ease-spring`/`--g-ease-bounce` nunca en diálogos, #299). Sin `has-origin` (apertura sin disparador enfocado): la entrada de siempre, `--g-space-2` desde abajo |
| **D2 · Crece hacia abajo** | Con `is-pinned`, el borde superior queda en `--_pin-top` (el que tuvo centrado, medido por el `.vue` tras el foco de #292) y el alto máximo llega hasta `--g-space-4` del borde inferior del visor (el mismo margen que deja el centrado). Un `GFormReveal` que se abre, un error o un `GTextarea autosize` empujan hacia abajo y **nunca mueven lo que el usuario está mirando**; si ya no cabe, desplaza el cuerpo. La regla no exige `[open]`: durante la salida sigue fijo y no salta al centro mientras se funde. No es movimiento: rige también con `reduce` |
| **Alcance** | Solo `placement="center"` sin `fullscreen` y con el visor por encima de 520px (`@media (min-width: 521px)`: el `.vue` no conoce el umbral). Hoja lateral, hoja móvil, ancho completo móvil y pantalla completa conservan su entrada y su crecimiento |
| **Movimiento reducido** | D1 no existe: solo el fundido de `--g-duration-fast` de #152, sin `translate` ni `scale`. D2 sí rige |
| **Duraciones** | Sin cambios: la entrada sigue en `press` y la salida en `fast`, así `transitionMs(dialog)` (y con él `finishLeave`) lee lo mismo que antes |

### Verificación (`design/lab/theme-playground/tests/personalidad-dialog.spec.mjs`)

Sobre el `GDialog` real del UMD en una página ligera (el listado de `packages/vue/dist/` con `grana.css` y el UMD inyectados): en el playground completo, con la máquina cargada, el primer cuadro tras cerrar llegó a tardar más de 1s y la salida de 120ms no dejaba cuadros. Visor de 1280×900. El primer cuadro y la mitad de la entrada y de la salida se leen pausando la transición CSS real (Web Animations); los cuadros intermedios se cuentan en tiempo real.

| Medida | Chromium | Firefox | WebKit |
| --- | --- | --- | --- |
| D1 lejos (disparador en 100,100): primer cuadro | −32 / −32px (tope) | −32 / −32px | −32 / −32px |
| D1 cerca (vector 60, 40): primer cuadro = un cuarto | 15 / 10px | 15 / 10px | 15 / 10px |
| D1 a mitad de la entrada (ease-out) | −1,09 / −1,09px, mismo lado | igual | igual |
| D1 termina centrado | ≤ 1px del centro | igual | igual |
| D1 cuadros intermedios en tiempo real, sin sobrepaso | sí (exigido) | anotado | anotado |
| D1 salida hacia el disparador (vector remedido 540 / −330,5px) | 120ms; a la mitad 30,9 / −30,9px; final 32 / −32px | cierra sin cuadros (#152) | cierra sin cuadros (#152) |
| Foco de vuelta al disparador (abrir con teclado) | sí | sí | sí |
| Sin disparador: sin `has-origin`, entra desde 0 / 8px | sí | sí | sí |
| `reduce`: sin transición de `translate` ni `scale` | sí | sí | sí |
| D2: bloque de 240px con el diálogo abierto, Δ borde superior | 0,000px | 0,000px | 0,000px |
| D2: el botón del pie baja (no sube) | +240px | +240px | +240px |
| D2: al no caber, dentro del visor y el cuerpo desplaza; crecer más, Δ botón | 0px | 0px | 0px |
| D2 con `reduce` | Δ 0px | Δ 0px | Δ 0px |
| ≤ 520px (500px ancho completo; 375px hoja): sin D1 ni D2 | entra como antes; el centrado sube > 100px al crecer; la hoja sigue pegada abajo | igual | igual |

Con las reglas de D1 y D2 quitadas del CSSOM, las 8 pruebas de comportamiento fallan en Chromium (las de guarda —sin disparador, `reduce`, ≤ 520px, foco— pasan igual, como deben). Además en Chromium: `dialog-focus.spec.mjs` (4), `form-reveal.spec.mjs` (6) y los dos casos de diálogo de `library.spec.mjs`; `npx vitest run src/components/GDialog` 64/64.

### Nota para lima (hallazgo de bruno)

`--_pin-top` sale de `offsetTop`, que es **entero**: según la medida de bruno (`f86be45`), cuando el borde centrado cae en una fracción de píxel, al fijarse el diálogo se mueve **≤ 0,5px** en Firefox y WebKit. En las medidas de este spec el salto fue 0px en los tres motores (no se reprodujo un caso fraccionario). Si se quiere 0 exacto siempre, el `.vue` tendría que medir con `getBoundingClientRect().top` descontando el `translate`/`scale` en curso; es decisión del contrato (`dialog.md` D2.2 dice `offsetTop`), no se cambia aquí.
