# 004 — Indicador de GStepper: anillo, pulsación reversible, variante línea y movimiento reducido

- **Status**: TODO
- **Dueño**: coco (`GStepper.css` y `design/lab/stepper/estilo.md`). Sin tokens nuevos.
- **Commit**: 49ad85b
- **Severity**: MEDIUM
- **Category**: Interruptibility + Accessibility
- **Estimated scope**: 2 archivos, ~30 líneas
- **Depende de**: 003 (comparte el bloque de movimiento y la regla de transición del segmento). Ejecútalo después.

## Problem

Cuatro defectos pequeños que, juntos, hacen que el cambio de paso se sienta a golpes:

1. **El anillo del paso actual aparece de golpe.** El indicador solo transiciona `background-color`, `border-color` y `color`; el anillo es un `box-shadow` (`GStepper.css:178` y, en puntos, `:272-274`). Medido: en el primer cuadro tras «Siguiente» el nuevo actual ya tiene `0 0 0 3px` mientras su borde aún se está fundiendo.
   ```css
   /* GStepper.css:153-156 — current */
     transition:
       background-color var(--g-duration-fast) var(--g-ease-standard),
       border-color var(--g-duration-fast) var(--g-ease-standard),
       color var(--g-duration-fast) var(--g-ease-standard);
   ```
2. **La pulsación vuelve de golpe y apaga los colores mientras se pulsa.** La regla de `:active` declara su propia `transition`, que **sustituye** la lista entera: durante la pulsación el indicador no transiciona colores, y al soltar (la regla deja de aplicar) no hay transición de `transform` y vuelve a `scale(1)` en un cuadro. Medido: con el ratón pulsado, `transition` = `transform 0.16s …` (sin colores).
   ```css
   /* GStepper.css:513-516 — current */
     .g-stepper__step button.g-stepper__hit:active .g-stepper__indicator {
       transform: scale(var(--g-press-scale));
       transition: transform var(--g-duration-press) var(--g-ease-out);
     }
   ```
3. **Variante `line`: el subrayado cambia de color sin transición.** `.g-stepper__hit` no tiene `transition` (computado: `all 0s`), y en esa variante el estado es el color de `border-block-end` (`GStepper.css:304-309`). La etiqueta (`.g-stepper__label`, `color` de `text-muted` a `text`) tampoco transiciona en ninguna variante.
4. **Movimiento reducido apaga también los fundidos de color.** Con `reduce`, el indicador queda en `transition: none` y los conectores sin transición: todo salta. Reducir movimiento es quitar desplazamientos y escalas, no la respuesta de color (AUDIT §6; así lo hacen ya `GMenu.css:217-221` y `GToast.css:297-300`, que conservan el fundido).
   ```css
   /* GStepper.css:522-524 — current */
   @media (prefers-reduced-motion: reduce) {
     .g-stepper__indicator { transition: none; }
   }
   ```
   Esto contradice lo que coco anotó en `design/lab/stepper/estilo.md:31` («Transiciones solo con `no-preference`; con `reduce`, sin transición»). Motivo nuevo para reabrirlo: la regla de movimiento reducido de AUDIT §6 y los precedentes de `GMenu`/`GToast`. Es decisión de coco, que es quien ejecuta este plan.

## Target

- Colores, borde y anillo: **120 ms** `var(--g-duration-fast)` con `var(--g-ease-standard)`, **siempre** (también con `reduce`): son cambios de color, no de movimiento. El anillo crece desde 0 de grosor (interpolación de `box-shadow`, sin layout).
- Pulsación: `transform` **160 ms** `var(--g-duration-press)` con `var(--g-ease-out)` (`cubic-bezier(0.23, 1, 0.32, 1)`), declarado en la regla base del indicador para que la vuelta también se anime; la regla `:active` solo pone `transform`. Solo con `no-preference`.
- Etiqueta: `color` 120 ms `--g-ease-standard`. El cambio de `font-weight` (400 ↔ 600) **no** se anima: interpolar el peso recalcularía el layout en cada cuadro.
- Variante `line`: `border-color` 120 ms `--g-ease-standard` en `.g-stepper__hit`. El grosor (`border-block-end-width`) no se anima (layout).

## Repo conventions to follow

- Tokens vigentes (`packages/vue/src/styles/defaults.css:151-156`): `--g-duration-fast: 120ms`, `--g-duration-press: 160ms`, `--g-ease-standard: cubic-bezier(0.2, 0, 0, 1)`, `--g-ease-out: cubic-bezier(0.23, 1, 0.32, 1)`, `--g-press-scale: 0.97`.
- Ejemplo de la pulsación con la transición en la regla base: plan `plans/001-gbtn-press-feedback.md` (hecho) y `packages/vue/src/components/GBtn/GBtn.css`, regla `.g-btn` (busca `transform var(--g-duration-press) var(--g-ease-out)`).
- Ejemplo de movimiento reducido que conserva el fundido: `packages/vue/src/components/GMenu/GMenu.css:217-221`.

## Steps

1. **Indicador, regla base** (`GStepper.css:153-156`): sustituye la `transition` por
   ```css
     transition:
       background-color var(--g-duration-fast) var(--g-ease-standard),
       border-color var(--g-duration-fast) var(--g-ease-standard),
       color var(--g-duration-fast) var(--g-ease-standard),
       box-shadow var(--g-duration-fast) var(--g-ease-standard);
   ```
2. **Etiqueta**: en `.g-stepper__label` (líneas 101-109) añade al final
   ```css
     transition: color var(--g-duration-fast) var(--g-ease-standard);
   ```
3. **Variante línea**: en la regla de las líneas 296-303 (`.g-stepper--indicator-line:not(.g-stepper--is-compact) .g-stepper__hit`) añade al final
   ```css
     transition: border-color var(--g-duration-fast) var(--g-ease-standard);
   ```
4. **Bloque `no-preference`** (línea 512): deja el bloque así (incluye lo que añadió el plan 003):
   ```css
   @media (prefers-reduced-motion: no-preference) {
     .g-stepper__indicator {
       transition:
         background-color var(--g-duration-fast) var(--g-ease-standard),
         border-color var(--g-duration-fast) var(--g-ease-standard),
         color var(--g-duration-fast) var(--g-ease-standard),
         box-shadow var(--g-duration-fast) var(--g-ease-standard),
         transform var(--g-duration-press) var(--g-ease-out);
     }
     .g-stepper__step button.g-stepper__hit:active .g-stepper__indicator {
       transform: scale(var(--g-press-scale));
     }
     .g-stepper__connector,
     .g-stepper__bar-seg {
       transition: --_stepper-fill var(--_t-slow) var(--g-ease-standard);
     }
     .g-stepper--indicator-segment:not(.g-stepper--is-compact) .g-stepper__indicator {
       transition:
         --_stepper-fill var(--_t-slow) var(--g-ease-standard),
         transform var(--g-duration-press) var(--g-ease-out);
     }
   }
   ```
5. **Bloque `reduce`** (líneas 522-524): sustitúyelo por
   ```css
   /* Movimiento reducido: sin escala ni llenado animado; los fundidos de color se conservan (regla base) */
   @media (prefers-reduced-motion: reduce) {
     .g-stepper__step button.g-stepper__hit:active .g-stepper__indicator { transform: none; }
   }
   ```
6. **`design/lab/stepper/estilo.md:31`**: cambia la fila de `prefers-reduced-motion` por
   `| \`prefers-reduced-motion\` | Con \`reduce\`: sin escala al pulsar ni llenado animado; los fundidos de color (120 ms) se conservan |`
   y la fila de `active` (línea 28) por
   `| active | Escala de \`--g-press-scale\` en el indicador (160 ms, \`--g-ease-out\`, también al soltar), solo sin movimiento reducido |`.

## Boundaries

- Solo `GStepper.css` y `design/lab/stepper/estilo.md`. No toques el `.vue` ni las pruebas.
- No animes `font-weight`, `border-width`, `padding` ni tamaños.
- No toques `@media (forced-colors: active)`.
- Si el plan 003 no está aplicado, ejecútalo primero o detente.

## Verification

- **Mecánica**: `npm test` y `npm run build`, compuertas de CLAUDE.md (las tres de `grana.css`/`grana.umd.js`). `grep -n "transition: none" packages/vue/src/components/GStepper/GStepper.css` → 0 resultados.
- **Medición (Playwright, 3 navegadores; en WebKit, adelantando `currentTime`)**:
  - Tras «Siguiente» en el stepper numérico sin navegación (`indicator="dot"` o `segment` del playground no sirven para el anillo numérico: usa el de iconos, `aria-label="Registro de cuenta (iconos)"`), `indicadorNuevoActual.getAnimations().map(a => a.transitionProperty)` incluye `box-shadow`, `border-*-color` y `color`, todas de 120 ms; con `currentTime = 60` el `box-shadow` tiene un grosor entre 0 y `3px`.
  - Pulsación: `page.mouse.down()` sobre un paso completado del primer stepper (`navigation="back"`), espera 200 ms, mueve el ratón **fuera** del botón y `page.mouse.up()` (así no hay clic). Durante la pulsación `getComputedStyle(ind).transition` incluye los colores **y** `transform`; tras soltar, `ind.getAnimations()` tiene una transición de `transform` de 160 ms (vuelve sin salto).
  - Variante `line`: tras «Siguiente», el `.g-stepper__hit` del nuevo actual tiene una transición de `border-bottom-color` de 120 ms.
  - Con `reducedMotion: 'reduce'`: los indicadores siguen teniendo transiciones de color de 120 ms; ninguna de `transform` ni de `--_stepper-fill`; al pulsar, `transform` = `none`.
- **Feel check**: DevTools > Animations al 10 %: el anillo del nuevo actual crece a la vez que su borde se oscurece (no aparece antes); mantén pulsado un paso completado y suelta fuera: se encoge y vuelve con suavidad. Rendering > `prefers-reduced-motion: reduce`: nada se mueve ni se escala, pero los colores se funden.
- **Done when**: anillo, colores, etiqueta y subrayado de `line` se funden en 120 ms; la pulsación entra y sale en 160 ms; con `reduce` quedan solo los fundidos; `estilo.md` dice lo mismo que el CSS.
