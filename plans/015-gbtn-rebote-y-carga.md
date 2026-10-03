# 015 — GBtn: rebote al soltar (B1) y la etiqueta cede el sitio (B2)

- **Status**: TODO
- **Dueños**: coco (pasos 1–4: `styles/defaults.css`, `GBtn.css`, `design/lab/btn/estilo.md`, spec de Playwright), bruno (paso 5: `packages/cli/src/defaults.js` con el script, `GBtn.meta.json`). lima ya entregó el contrato.
- **Contrato**: `design/contracts/btn.md` «Personalidad»; DECISIONS.md #299 (lenguaje de movimiento) y #300; `docs/contract/tokens.md` §6 y §29.
- **Category**: Personalidad (ronda transversal `design/lab/personalidad/r01/`, kiwi §3)
- **Estimated scope**: 2 tokens en `defaults.css`; ~25 líneas de CSS; 1 spec nuevo
- **Modelo**: Sonnet (`GBtn` no es complejo según CLAUDE.md)
- **Depende de**: nada. **Es el primero**: introduce `--g-ease-spring` y `--g-ease-bounce` en `defaults.css`, que el 016 necesita.

## Problem

`GBtn` aprieta y suelta con la misma curva (`--g-ease-out`, 160ms): correcto pero sin identidad. Al entrar en `loading`, la etiqueta desaparece en un cuadro (`opacity: 0` sin transición tras `597ab17`) y el indicador aparece de golpe.

Lugares actuales: `packages/vue/src/components/GBtn/GBtn.css:68` (lista `transition` base), `:251-256` (`:active`), `:291-301` (`is-loading` de etiqueta, huecos e indicador), `:305-315` (`prefers-reduced-motion: reduce`). Si las líneas no coinciden, localiza las reglas por selector; si la regla de `is-loading` ya no usa `opacity: 0` en `g-btn__label`, DETENTE e informa (el nombre accesible depende de ello).

## Target (resumen del contrato; la regla exacta está en `btn.md`)

- **Tokens** (`defaults.css`, bloque «Movimiento», junto a `--g-ease-out`): `--g-ease-spring` y `--g-ease-bounce` con los valores `linear(…)` de `tokens.md` §6 (copiados tal cual).
- **B1**: apretar a `--g-press-scale` en `--g-duration-fast` + `--g-ease-out`; soltar a 1 en `--g-duration-slow` + `--g-ease-bounce`. Dos listas **completas**; la de soltar con la curva nueva dentro de `@supports (transition-timing-function: linear(0, 1))`.
- **B2**: etiqueta y huecos a `opacity: 0` con fundido `fast` y subida `--g-space-1 × 1` (`press`, `ease-out`); indicador desde `× 1` abajo con `@starting-style`. Nunca `visibility: hidden` en la etiqueta.
- **Reduce**: sin escala; B2 solo fundido.
- Referencia de comportamiento (no de implementación): capa `@layer grana.personalidad` de `design/lab/personalidad/r01/index.html`, bloques «GBtn · B1» y «GBtn · B2» (líneas ~41–79).

## Steps

1. **coco** · `defaults.css`: añade los dos tokens.
2. **coco** · `GBtn.css`: B1 y B2 según `btn.md` «Personalidad»; ajusta el bloque `reduce`.
3. **coco** · `design/lab/btn/estilo.md`: fila de movimiento (rebote al soltar; la etiqueta cede el sitio).
4. **coco** · `design/lab/theme-playground/tests/personalidad-btn.spec.mjs` con la medida de kiwi (ver «Verificación»), montando el `GBtn` real del UMD como `btn-loading-name.spec.mjs`.
5. **bruno** · `node packages/cli/scripts/sync-defaults.mjs` (regenera `packages/cli/src/defaults.js`; su prueba de desfase debe pasar) y añade `--g-duration-slow` y `--g-ease-bounce` a los tokens de `GBtn.meta.json`.

## Boundaries

- No toques `GBtn.vue` ni sus pruebas (no hace falta).
- Ningún literal nuevo en `GBtn.css` (`grep -nE "linear\(|0\.97|1\.006|240ms" GBtn.css` → 0).
- No uses `--g-ease-bounce` en nada que no sea la vuelta de la escala (#299).

## Verificación (por niveles, CLAUDE.md)

- **Durante** (Chromium): `cd design/lab/theme-playground && GRANA_PW_PORT=4209 npx playwright test tests/personalidad-btn.spec.mjs tests/btn-loading-name.spec.mjs --project=chromium` (puerto propio de coco). Confirmar que el spec nuevo **falla antes** del CSS y pasa después.
- **Al cerrar el plan** (una vez, sobre el estado final): `npx vitest run`, `npm run build`, `node packages/vue/scripts/check-icons.mjs`, las compuertas de CLAUDE.md, y los dos specs en Chromium, Firefox y WebKit.
- **Criterio de hecho (medida de kiwi):** pulsado 0,970; tras soltar, pico ≈ 1,006 (0,0005 de tolerancia) y asentado en 1 antes de 240ms; con `reduce`, escala 1 siempre; B2 con cuadros intermedios en etiqueta e indicador, ancho Δ 0px, etiqueta a −`space × 1`, nombre accesible = la etiqueta (Chromium). Tres motores.

## Después

Auditoría de coco (paso 5 del flujo) anotada en `design/lab/btn/auditoria.md`; mora-docs actualiza `GBtn/README.md` (movimiento y carga) solo con lo verificado.
