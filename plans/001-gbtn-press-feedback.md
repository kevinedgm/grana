# 001 — Añadir respuesta al pulsar en GBtn

- **Status**: TODO
- **Commit**: 34d80bb
- **Severity**: MEDIUM
- **Category**: Physicality & origin
- **Estimated scope**: 4 archivos, ~15 líneas

## Problem

`GBtn` cambia de color al pulsar pero no se mueve: el botón se siente inerte. Un botón se pulsa cientos de veces al día, así que la respuesta debe ser sutil y rápida.

```css
/* packages/vue/src/components/GBtn/GBtn.css:64 — current */
  transition:
    background-color var(--g-duration-fast) var(--g-ease-standard),
    border-color var(--g-duration-fast) var(--g-ease-standard),
    color var(--g-duration-fast) var(--g-ease-standard);
```

```css
/* packages/vue/src/components/GBtn/GBtn.css:231 — current */
.g-btn:active {
  color: var(--_fg-hover);
  background: var(--_bg-hover);
  border-color: var(--_border-hover);
}
```

## Target

Al pulsar, el botón se encoge a `scale(0.97)`. Entrada de 160 ms con `ease-out`; solo `transform` (barato, sin layout).

```css
/* target — GBtn.css, dentro de .g-btn { ... } (línea 64) */
  transition:
    background-color var(--g-duration-fast) var(--g-ease-standard),
    border-color var(--g-duration-fast) var(--g-ease-standard),
    color var(--g-duration-fast) var(--g-ease-standard),
    transform var(--g-duration-press) var(--g-ease-out);

/* target — GBtn.css, después de .g-btn:active (línea 231) */
.g-btn:active:not(:disabled):not(.is-disabled):not(.is-loading):not(.g-btn--variant-link) {
  transform: scale(var(--g-press-scale));
}
```

Tokens nuevos (valores exactos):

```css
--g-duration-press: 160ms;
--g-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
--g-press-scale: 0.97;
```

## Repo conventions to follow

- Regla de CLAUDE.md: los componentes solo leen `var(--g-*)` y `var(--_*)`. **Prohibidos los literales** (`0.97`, `160ms`) en `GBtn.css`; por eso se crean tokens.
- Un archivo, un dueño (AGENTS.md): los tokens son de lima (`docs/contract/tokens.md`, `design/contracts/btn.md`), el CSS de coco (`GBtn.css`, `defaults.css`), `GBtn.meta.json` de bruno. Si el ejecutor no puede tocar todos, que haga cada parte en su turno y no salte a la siguiente.
- Ejemplo a imitar: `--g-duration-fast` y `--g-ease-standard` en `packages/vue/src/styles/defaults.css:94-96`, documentados en `docs/contract/tokens.md:125-127`.
- Los valores por defecto viven solo en `defaults.css` (capa `grana.defaults`).

## Steps

1. `docs/contract/tokens.md`: en la lista de nombres (línea ~111) cambia `--g-duration-{fast|spin}` por `--g-duration-{fast|press|spin}`, añade `--g-ease-out` y `--g-press-scale`. En la tabla (línea ~125) añade tres filas: `--g-duration-press` = 160ms (respuesta al pulsar), `--g-ease-out` = `cubic-bezier(0.23, 1, 0.32, 1)` (entradas y respuesta), `--g-press-scale` = 0.97 (escala al pulsar; 1 lo desactiva).
2. `design/contracts/btn.md:79`: añade los tres tokens a la lista de "Tokens nuevos".
3. `packages/vue/src/styles/defaults.css`, bloque "Movimiento" (línea ~93): añade `--g-duration-press: 160ms;`, `--g-ease-out: cubic-bezier(0.23, 1, 0.32, 1);` y `--g-press-scale: 0.97;`.
4. `GBtn.css`: añade `transform var(--g-duration-press) var(--g-ease-out)` al final de la lista `transition` (línea 64-67) y la regla `:active` del bloque Target.
5. `GBtn.css`, bloque `@media (prefers-reduced-motion: reduce)` (línea ~270): dentro de `.g-btn`, deja `transition: none;` como está y añade `.g-btn:active { transform: none; }` para quitar el movimiento.
6. `GBtn.meta.json:38`: añade los tres tokens a la lista de tokens usados.

## Boundaries

- No toques la lógica de `GBtn.vue`, ni el marcado, ni las pruebas.
- No animes `width`, `height` ni `padding`.
- No añadas escala al hover (solo al pulsar).
- Si `GBtn.css` ya no coincide con los extractos de arriba (cambios desde el commit 34d80bb), DETENTE e informa.

## Verification

- **Mecánica**: `npm test` (18 pruebas verdes) y `npm run build`; luego las compuertas de CLAUDE.md (`grep -q "g-btn--variant-soft" packages/vue/dist/grana.css`, sin `data:font`, sin `createApp`). `grep -nE "0\.97|160ms" packages/vue/src/components/GBtn/GBtn.css` debe dar 0 resultados.
- **Feel check**: `python3 -m http.server 4173 -d packages/vue`, abrir `/playground/` y comprobar:
  - Mantener pulsado un botón sólido: se encoge de forma perceptible pero sutil, y vuelve al soltar sin salto.
  - Pulsar rápido varias veces: nunca se reinicia desde cero (es transición, no keyframe).
  - Botón deshabilitado, botón en carga y variante `link`: no se encogen.
  - En DevTools > Animations a 10%: la escala llega al 97% y no más.
  - Rendering > `prefers-reduced-motion: reduce`: no hay escala; el color de `:active` sigue cambiando.
  - Botón de icono y de texto se sienten igual.
- **Done when**: las pruebas y compuertas pasan, `GBtn.css` no tiene literales nuevos y los tokens están en contrato, defaults y meta.
