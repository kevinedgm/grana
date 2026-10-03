# 017 — GCard: la selección nace de la casilla (C2) y la luz sigue al puntero (C1)

- **Status**: TODO
- **Dueños**: coco (C2 entera; CSS del halo de C1; `design/lab/card/estilo.md`; spec), bruno (escucha del puntero de C1 en `GCard.vue`, pruebas, `GCard.meta.json`; `--_select-x/y` solo si coco lo pide).
- **Contrato**: `design/contracts/card.md` «Personalidad»; DECISIONS.md #299 y #303 (#127 intacto).
- **Category**: Personalidad (kiwi r01 §6)
- **Estimated scope**: ~20 líneas de JS, ~35 de CSS, 3–4 pruebas, 1 spec
- **Modelo**: Opus para los dos (compone `GSurface`: «componente complejo», CLAUDE.md)
- **Depende de**: nada (no usa las curvas nuevas). Orden interno: **C2 primero** (coco, solo CSS, independiente), luego C1: bruno → coco.

## Problem

Al seleccionar, el tinte de `--g-card-selected` se funde entero (plan 008): correcto, pero no une la causa (la casilla) con el efecto. El hover es un velo uniforme: no distingue al primer vistazo una tarjeta interactiva y no tiene identidad. Lugares: `GCard.css:12-19` (mecanismo y `@property --_card-selected`), `:80` (`::before` del velo), `:622-657` (hover y selección), `:785-800` (reduce).

## Target (resumen; la regla exacta está en `card.md`)

- **C2 (coco)**: el fondo de seleccionada crece en círculo desde el centro del indicador hasta cubrir la tarjeta (radio registrado de un `radial-gradient`, p. ej. `circle farthest-corner`) y se recoge al desmarcar; borde y ✓ siguen fundiéndose. Si el CSS no sabe dónde está el indicador en algún modo, pide a bruno `--_select-x/y` (nombres ya reservados).
- **C1 (bruno)**: `--_pointer-x/y` (px, caja de borde de la raíz) en `pointerenter` y `pointermove` (`mouse`/`pen`), una escritura por cuadro, solo en `is-interactive` sin `is-disabled`/`is-loading`, solo con `(hover: hover) and (prefers-reduced-motion: no-preference)`; escuchas que se ponen y quitan con la consulta.
- **C1 (coco)**: halo del mismo `--g-card-hover` concentrado con `color-mix` (sin token nuevo) sobre el velo uniforme; posición sin transición, color con fundido; texto ≥ 4,5:1 en el punto más intenso, claro y oscuro.
- Referencia: capa de `design/lab/personalidad/r01/index.html`, bloque «GCard · C1» (líneas ~172–184; allí `--p-x/--p-y`). C2 no está prototipada.

## Steps

1. **coco** · C2 en `GCard.css` (todas las `interaction` con indicador, `orientation`, media lateral, `compact`, RTL). Si hace falta el origen desde JS, para y pide el paso 2b.
2. **bruno** · C1 en `GCard.vue` (y 2b, solo si coco lo pide: `--_select-x/y` con el `ResizeObserver` existente). `GCard.test.js`: variables escritas solo en interactivas, no en táctil (`matchMedia` simulado), no con `reduce`, no en `is-disabled`/`is-loading`; escuchas retiradas al cambiar la consulta y al desmontar. `GCard.meta.json` si cambia la lista de tokens.
3. **coco** · halo de C1 en `GCard.css`; medida de contraste en claro y oscuro; `design/lab/card/estilo.md` (selección desde la casilla; halo).
4. **coco** · `design/lab/theme-playground/tests/personalidad-card.spec.mjs` con la medida de kiwi.

## Boundaries

- **Nada de `transform` en la tarjeta** (#127); nada de inclinación ni escala de la media (C4, descartada).
- Sin token nuevo para el halo.
- No escuches el puntero en tarjetas no interactivas ni en táctil.

## Verificación (por niveles)

- **Durante** (Chromium): vitest de `GCard` (bruno); `GRANA_PW_PORT=4209 npx playwright test tests/personalidad-card.spec.mjs --project=chromium` (coco), viendo que falla antes y pasa después.
- **Al cerrar el plan**: `npx vitest run`, `npm run build`, iconos, compuertas (incluida `g-card--media-background`), el spec en los tres motores.
- **Criterio de hecho (medida de kiwi):** C1: centro del halo = puntero ±1px, caja Δ 0px, `transform: none`, velo uniforme conservado, sin halo en táctil (375px, `hover: none`) ni con `reduce`; C2: al menos un cuadro con radio intermedio, origen en el centro del indicador ±2px, se recoge al desmarcar, con `reduce` fundido.

## Después

Auditoría de coco (tema distinto al de defecto, oscuro, `forced-colors`); mora-docs actualiza `GCard/README.md`.
