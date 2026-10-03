# 018 — GInput: el mensaje sale del campo (I1) y un solo aviso al enviar (I2)

- **Status**: TODO
- **Dueños**: bruno (pasos 1–3: `GInput.vue` con `is-ready` e `is-rejected`, `GForm.vue`, `formContext.js`/`useFormField`, pruebas, `meta.json`), coco (pasos 4–6: `GInput.css`, `design/lab/input/estilo.md`, spec).
- **Contrato**: `design/contracts/input.md` «Personalidad»; `design/contracts/form.md` §1 «Envío» (paso 4) y §2 «Rechazo al enviar»; DECISIONS.md #299 y #304.
- **Category**: Personalidad (kiwi r01 §7)
- **Estimated scope**: ~40 líneas de JS en tres archivos, ~25 de CSS, 6–8 pruebas, 1 spec
- **Modelo**: Opus para bruno (cambia `GForm` y `useFormField`, sistema de formularios); Sonnet para coco
- **Depende de**: nada (no usa las curvas nuevas). Orden interno: bruno → coco (sin `is-ready` el mensaje se animaría al montar; sin `is-rejected` no hay sacudida).

## Problem

El mensaje de un campo aparece de golpe bajo la caja. Al enviar con errores, el foco va al resumen o al primer inválido, pero nada señala **cuáles** fallaron fuera del foco. Lugares: `GInput.css:70-79` (`g-input__row`), `:345-366` (`g-input__message`); `GInput.vue` (sin `is-ready`); `GForm.vue` (envío y `showErrors()`).

## Target (resumen; la regla exacta está en los contratos)

- **I1**: con `is-ready`, `g-input__message` que pasa de vacía a con texto entra con fundido y baja `space × 1` (keyframes `g-*`, `press`, `ease-out`); cambiar el texto no la repite.
- **I2**: `GForm` mantiene un conjunto interno de rechazados; en el envío con errores (no `formnovalidate`) y en `showErrors()` lo vacía y lo llena en el cuadro siguiente con los que bloquean; `useFormField` expone `rejected` y `endRejected()` (internos); `GInput` pinta `is-rejected` y llama a `endRejected()` en `animationend`/`animationcancel` con nombre `g-reject…`; `input`/`change` del campo lo retira. Coco: sacudida de `g-input__row`, amplitudes `1 · 0.75 · 0.5 · 0.25 × space-1` en `16 · 36 · 56 · 76 %` de `--g-duration-slow`, keyframes `g-reject`.
- **Reduce**: I1 solo fundido; I2 nada.
- Referencia: capa de `design/lab/personalidad/r01/index.html`, bloques «GInput · I1» e «I2» (líneas ~186–207; allí la clase se llama `p-nudge` y la pone la página).

## Steps

1. **bruno** · `GInput.vue`: `is-ready` en el cuadro siguiente al montaje (no en SSR); `is-rejected` desde `useFormField`; escucha de `animationend`/`animationcancel` filtrada por `g-reject`.
2. **bruno** · `GForm.vue` y `formContext.js` (`useFormField`, `useCompositeField`): conjunto de rechazados, `rejected`, `endRejected()`, salida en `notifyInput`/`notifyChange` y al desregistrar; sin cambios de API pública.
3. **bruno** · pruebas (`GForm.test.js`, `GInput.test.js`): solo los que bloquean (no deshabilitados ni inactivos, #276); `formnovalidate` sin clase; `showErrors()` con clase; retirada por `animationend` con `g-reject` y **no** por otro nombre; retirada al escribir; segundo envío la repone; `is-ready` ausente en `renderToString`. `meta.json` de `GInput` (y `GForm` si lista tokens).
4. **coco** · `GInput.css`: I1 (con `is-ready`) e I2 (con `is-rejected`), bloque `reduce`.
5. **coco** · `design/lab/input/estilo.md`: mensaje que baja y sacudida.
6. **coco** · `design/lab/theme-playground/tests/personalidad-input.spec.mjs` con `GForm` + `GInput` reales.

## Boundaries

- La clase la pone **solo** `GForm`; el campo no decide cuándo sacudirse.
- Nunca al escribir, al salir del campo ni al montar.
- Otros campos (`GTextarea`, `GSelect`, grupos) reciben la clase pero **no** se estilizan en este plan (anotar en `estilo.md` como extensión pendiente de coco).
- No toques la región viva ni el momento de los errores (#157, #164).

## Verificación (por niveles)

- **Durante** (Chromium): vitest de `GForm` y `GInput` (bruno, viendo que fallan antes); `GRANA_PW_PORT=4209 npx playwright test tests/personalidad-input.spec.mjs --project=chromium` (coco). Bruno usa el 4208 si corre Playwright.
- **Al cerrar el plan**: `npx vitest run`, `npm run build`, iconos, compuertas, el spec nuevo **y** `tests/form-distribution.spec.mjs`, `form-reveal.spec.mjs` y `form-section.spec.mjs` en los tres motores (tocan `GForm`).
- **Criterio de hecho (medida de kiwi):** I1 con cuadros intermedios de `−space × 1` a 0 y 0 animaciones con error al montar; I2 con desplazamiento máximo ≤ `space × 1` (kiwi: 3,47px), tres cambios de sentido y vuelta a 0; escribir y salir del campo, 0 animaciones; con `reduce`, sin desplazamiento ni vaivén.

## Después

Auditoría de coco; mora-docs actualiza `GInput/README.md` y `GForm/README.md` (envío con errores).
