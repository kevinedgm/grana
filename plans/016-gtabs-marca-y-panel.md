# 016 — GTabs: la marca se estira (T1) y el contenido llega de su lado (T2)

- **Status**: TODO
- **Dueños**: bruno (pasos 1–3: `GTabs.vue`, `GTabPanel.vue`, pruebas, `GTabs.meta.json`), coco (pasos 4–6: `GTabs.css`, `design/lab/tabs/estilo.md`, spec de Playwright).
- **Contrato**: `design/contracts/tabs.md` «Personalidad»; DECISIONS.md #299 y #302; `tokens.md` §29.
- **Category**: Personalidad (kiwi r01 §5)
- **Estimated scope**: ~15 líneas de JS, ~40 de CSS, 4–6 pruebas, 1 spec
- **Modelo**: Opus para los dos (teclado compuesto propio: «componente complejo», CLAUDE.md)
- **Depende de**: 015 paso 1 (`--g-ease-spring` en `defaults.css`). Orden interno: bruno → coco (sin `data-direction` el CSS no tiene dirección).

## Problem

La marca se desliza con una sola curva y el panel nuevo siempre sube `space × 1`, sea cual sea la dirección del cambio: la fila de pestañas y su contenido no comparten eje. Lugares: `GTabs.css:256-268` (marca), `:390-391` (transición con `is-ready`), `:515-521` (paneles); `GTabs.vue:654` (`is-ready`).

## Target (resumen; la regla exacta está en `tabs.md`)

- **bruno**: `data-direction` (`forward`/`back`, orden lógico de `items`) en la raíz, en el **mismo render** que cambia la activa y por cualquier vía; ausente sin activa anterior. `GTabPanel` lo copia de `#{tabs}` al activarse.
- **coco**: T1 con dos bordes en propiedades registradas privadas (`@property`, nombre con el componente): el que avanza en `press` + `ease-out`, el de atrás en `slow` + `--g-ease-spring` (dentro de `@supports`). T2: panel desde `±space × 4` según `data-direction` y `--_dir`; `__panels` recorta sin cortar el anillo. Reduce: la marca salta, panel solo fundido.
- Referencia: capa de `design/lab/personalidad/r01/index.html`, bloque «GTabs · T1 y T2» (líneas ~114–170; allí la dirección se llama `data-p-dir` y los bordes `--p-l`/`--p-r`).

## Steps

1. **bruno** · `GTabs.vue`: calcula la dirección en el cambio de activa (clic, teclado, «Más», `watch` de `modelValue`) y la escribe en la raíz antes de quitar `hidden` al panel.
2. **bruno** · `GTabPanel.vue`: al pasar `active` a `true`, copia `data-direction` de `document.getElementById(tabs)` (solo en cliente).
3. **bruno** · `GTabs.test.js`: `forward`/`back` por clic, flechas, «Más» y `modelValue`; RTL lógico; ausente al montar; `GTabPanel` la copia; `--_mark-*` sin cambios. `GTabs.meta.json`: `--g-ease-spring`, `--g-duration-slow`.
4. **coco** · `GTabs.css`: T1 y T2 en las cuatro apariencias y en vertical (medir cada una; una que no funcione conserva el deslizamiento de hoy y se documenta en `estilo.md`).
5. **coco** · `design/lab/tabs/estilo.md`: filas «Movimiento» (marca que se estira, panel lateral) y «`prefers-reduced-motion`» (panel solo fundido). Es la nota de estilo que cambia (#302); #127 y #152 no se tocan.
6. **coco** · `design/lab/theme-playground/tests/personalidad-tabs.spec.mjs` con la medida de kiwi.

## Boundaries

- No cambies la convención de `--_mark-*` ni el primer posicionamiento sin animar.
- No añadas swipe entre paneles (#117).
- `--g-ease-spring` solo en el borde de atrás de la marca (#299).

## Verificación (por niveles)

- **Durante** (Chromium): pruebas de vitest de `GTabs` (bruno); `GRANA_PW_PORT=4209 npx playwright test tests/personalidad-tabs.spec.mjs --project=chromium` (coco), viendo que falla antes y pasa después.
- **Al cerrar el plan**: `npx vitest run`, `npm run build`, iconos, compuertas, y el spec en los tres motores.
- **Criterio de hecho (medida de kiwi):** en el trayecto la marca es más ancha que las dos pestañas (kiwi, `underline`: +95px adelante, +95,6px atrás); el borde que avanza llega antes que el de atrás; termina exacto (±0,5px); panel en `+space × 4` adelante, `−space × 4` atrás y `−space × 4` en RTL adelante; 375px sin desborde horizontal; `detached` (slot `tabs` de `GDialog`) con la misma dirección; con `reduce`, la marca salta y el panel solo se funde.

## Después

Auditoría de coco en `design/lab/tabs/` (apariencias, vertical, RTL, `forced-colors`); mora-docs actualiza `GTabs/README.md`.
