# GFormFold · auditoría de coco (paso 5)

**Fecha:** 2026-10-14  
**Auditor:** coco  
**Componente:** `GFormFold` (`@grana/vue/form-fold`, `design/contracts/form.md` §15)  
**Estado antes:** `draft` · **Estado tras la auditoría:** `candidate`

---

## Criterios verificados

| # | Criterio | Resultado | Notas |
|---|----------|-----------|-------|
| 1 | Solo `var(--g-*)` y alias `var(--_*)`, sin valores de respaldo | PASA | Todos los `var()` usan `--g-*` o `--_*`. La línea con `var(--_t-fade)` en la transición de movimiento reducido usa el token como RETRASO (`0s linear var(--_t-fade)`), no como respaldo. |
| 2 | Sin `@layer` en el CSS del componente | PASA | Ausente. El registro lo aplica. |
| 3 | Sin literales de color ni de tema | PASA | Sin `#`, `rgb()`, `hsl()` u `oklch()` en el código de estilo. |
| 4 | Área táctil ≥ 44px en interactivos | PASA | GFormFold no define controles propios. Sus acciones (slot `actions`) provienen de la aplicación (`GBtn`, etc.) que traen sus propias dianas. El `fieldset.g-form-fold__body` es un contenedor, no interactivo. |
| 5 | Contraste texto ≥ 4.5:1 | PASA | Título: `--g-color-text` (#1A1A1A sobre #FFFFFF → 17,4:1). Descripción: `--g-color-text-muted` (#555 sobre #FFFFFF → 7,46:1). Raíl: `--g-color-accent-text` (#0B63CE) forma ≥ 3:1 (§7.1 de tokens.md). |
| 6 | Foco siempre visible | PASA | Los controles del pliegue traen su propio anillo. `fieldset[disabled]` inhabilita el foco; `inert` lo elimina. El motor del pliegue (`.vue`) gestiona el movimiento del foco al abrir/cerrar. |
| 7 | RTL | PASA | Usa `padding-inline-start`, `margin-inline-start`, `border-inline-start`. El raíl aparece al inicio lógico en RTL (derecha). `--_fold-gap` y `--_d` son lógicos. |
| 8 | `forced-colors` | PASA | `@media (forced-colors: active)` con `border-inline-start-color: Highlight` en el panel. El raíl es un borde, sobrevive. |
| 9 | `prefers-reduced-motion` | PASA | `@media (prefers-reduced-motion: no-preference)` con la transición completa (`grid-template-rows`, `margin-block-start`, `opacity`). `@media (prefers-reduced-motion: reduce)` elimina el deslizamiento y deja el fundido. Patrón único según DECISIONS #299. |
| 10 | `@starting-style` | PASA | Presente en ambos bloques de movimiento para que `hidden` → `is-open` en el mismo cuadro arranque desde el estado cerrado. |
| 11 | Sin `--g-ease-spring` ni `--g-ease-bounce` | PASA | Correcto según #299: GFormFold no tiene muelle. |
| 12 | Personalidad documentada | PASA | El raíl de acento nace bajo el campo y se tiende hacia abajo mientras el pliegue se abre; el contenido se funde al final. El hilo de raíles paralelos identifica la profundidad de lo que se está creando. |
| 13 | Tokens en defaults.css | PASA | `--g-color-accent-text`, `--g-form-gap`, `--g-duration-slow`, `--g-duration-fast`, `--g-ease-out`, `--g-ease-standard`, `--g-border-width`, `--g-space-*`, `--g-text-title-sm-*`, `--g-text-body-sm-*`, `--g-font-ui`, `--g-color-text`, `--g-color-text-muted` existen en `defaults.css`. |
| 14 | vitest (jsdom) | PASA | 22 pruebas pasan. Cubre: estructura y estado, foco, confirmar/cerrar, teclado, frente al GForm de fuera, avisos, anidados, SSR. |
| 15 | Playwright (navegador real) | NO VERIFICADO | No hay spec de Playwright para este componente. Ver Pendientes. |

---

## Hallazgos

### H1 · `--g-text-body-sm-tracking` ausente en `.g-form-fold__description` (no bloqueante)

El CSS de la descripción aplica `font-size` y `line-height` de `body-sm` pero omite `letter-spacing: var(--g-text-body-sm-tracking)`. El valor del token en `defaults.css` es `0`, así que no hay diferencia visual con el tema por defecto. No es un defecto bloqueante.

**Pendiente para bruno (si lo considera oportuno):** añadir `letter-spacing: var(--g-text-body-sm-tracking)` al selector `.g-form-fold__description` en `GFormFold.css` para completar la tripleta tipográfica.

---

## Notas para bruno

- El contrato (§15 «Verificación · Playwright») exige pruebas de Playwright en los tres motores: lo de arriba Δ 0px al abrir y cerrar, el diálogo crece hacia abajo con el borde fijo, 375px con tres pliegues sin desborde horizontal, RTL, reducido y el test de distribución de formularios (#184) con el pliegue abierto. Estas pruebas no se han entregado aún.
- En el dist (`packages/vue/dist/grana.css`), 34 ocurrencias de `g-form-fold` confirman que el CSS está registrado correctamente.
- `dist/form-fold.js` existe y cubre la entrada propia.

---

## Pendientes para otros roles

- **bruno:** spec de Playwright (tres motores) según §15 «Verificación · Playwright». El test de distribución (#184) debe incluir un pliegue abierto.
- **mora-docs:** README de `GFormFold` tras confirmar las pruebas de Playwright.

---

## Conclusión

No queda ningún defecto bloqueante de coco. El componente cumple el contrato de tokens, accesibilidad, RTL, `forced-colors` y `prefers-reduced-motion`. La personalidad (raíl + fundido escalonado) está implementada y documentada. Status actualizado a **`candidate`**.
