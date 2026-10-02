# 008 — GCard: que la selección se funda entera (tinte, anillo interior y check) y chevrón coherente

- **Status**: TODO
- **Dueño**: coco (`GCard.css` y `design/lab/card/estilo.md`). Sin `.vue`, sin tokens nuevos.
- **Commit**: c9ecab2
- **Severity**: MEDIUM
- **Category**: Estado que salta (Interruptibility / Missed opportunity) + Cohesion
- **Estimated scope**: 1 archivo CSS (~20 líneas) + 1 línea de `estilo.md`
- **Depende de**: 007 (que deja el bloque `reduce` de `GCard.css` solo con los iconos). Si 007 no está aplicado, ejecútalo antes o detente.

## Problem

Al seleccionar una tarjeta, solo una parte del cambio se anima. Medido en `#sec-card` (segunda tarjeta con `input.g-card__select`), cuadro a cuadro tras el clic, en Chromium, Firefox y WebKit:

| Cuadro | Tinte (`background-image`) | Anillo interior (`::after` `border-top-color`) | Borde exterior (`border-top-color`) | ✓ (`opacity`) |
| --- | --- | --- | --- | --- |
| 1 | `rgba(0,0,0,0.043)` (final) | `rgb(11,99,206)` (final) | `rgba(0,0,0,0.16)` (inicial) | 1 (final) |
| 2 | final | final | `rgba(10,91,190,0.71)` | 1 |
| … | | | se funde en 120 ms | |

Es decir: el doble borde de selección y el tinte **aparecen en un cuadro** mientras el borde exterior y el fondo del indicador se funden 120 ms: durante esos cuadros se ven un anillo interior azul pleno junto a un borde exterior aún gris, y el ✓ ya dibujado sobre una casilla que todavía no se ha rellenado. Mismo defecto que el conector de `GStepper` (plan 003): un gradiente no se interpola con `transition`.

```css
/* packages/vue/src/components/GCard/GCard.css:629-639 — current */
.g-card.g-surface.is-selected {
  --_border: var(--_mark);
  background-image: linear-gradient(var(--g-card-selected), var(--g-card-selected));
}
.g-card.is-selected::after { border-color: var(--_mark); }
/* Actual (lista maestro-detalle): borde, fondo y marca de chevron; sin el anillo doble ni el indicador de selección */
.g-card.g-surface.is-current {
  --_border: var(--_mark);
  background-image: linear-gradient(var(--g-card-selected), var(--g-card-selected));
}
```
```css
/* GCard.css:81-89 — current (el ::after no tiene transición) */
.g-card::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 2;
  border: var(--g-border-width) solid transparent;
  border-radius: var(--_radius-in);
  pointer-events: none;
}
```
```css
/* GCard.css:356 — current (el ✓ no tiene transición) */
.g-card__tick > .g-icon { inline-size: calc(var(--_box) * 0.7); block-size: calc(var(--_box) * 0.7); opacity: 0; }
```
```css
/* GCard.css:58-60 — current */
  transition:
    border-color var(--g-duration-fast) var(--g-ease-standard),
    box-shadow var(--g-duration-fast) var(--g-ease-standard);
```

Coherencia (menor): el chevrón de «Mostrar más» gira con `120 ms` y `--g-ease-standard` (`GCard.css:209`), mientras que el mismo gesto en `GSelect` (`GSelect.css:160`) y `GSidebar` (`GSidebar.css:353`) es `160 ms` (`--g-duration-press`) con `--g-ease-out`.

```css
/* GCard.css:209 — current */
  transition: rotate var(--g-duration-fast) var(--g-ease-standard);
```

## Target

- El tinte de seleccionada/actual se pinta con una **propiedad registrada** `--_card-selected` (`<color>`, `inherits: false`, `initial-value: transparent`) que transiciona 120 ms `var(--g-duration-fast)` con `var(--g-ease-standard)`; el `background-image` es siempre el mismo gradiente de esa variable (transparente sin selección), así que lo que se interpola es el color, no el gradiente.
- El anillo interior (`::after`) funde `border-color` en 120 ms con `--g-ease-standard`.
- El ✓ del indicador funde `opacity` en 120 ms con `--g-ease-standard` (a la vez que el relleno del indicador).
- Todo lo anterior es color: se conserva con movimiento reducido (no va dentro de ningún `@media (prefers-reduced-motion)`).
- Chevrón: `rotate` 160 ms `var(--g-duration-press)` con `var(--g-ease-out)` (`cubic-bezier(0.23, 1, 0.32, 1)`), como `GSelect` y `GSidebar`. Con `reduce` sigue sin transición (bloque del plan 007).

## Repo conventions to follow

- Exemplar de `@property` privada con el nombre del componente (es global): `packages/vue/src/components/GStepper/GStepper.css:10-17`:
  ```css
  /* Avance pintado del conector, del segmento y de la barra. Registrada para que el llenado se interpole
     (un gradiente no se anima con transition). Privada: el nombre lleva el componente porque @property es global */
  @property --_stepper-fill {
    syntax: '<length-percentage>';
    inherits: false;
    initial-value: 0%;
  }
  ```
- Tokens (`defaults.css:151-156`): `--g-duration-fast: 120ms`, `--g-duration-press: 160ms`, `--g-ease-standard: cubic-bezier(0.2, 0, 0, 1)`, `--g-ease-out: cubic-bezier(0.23, 1, 0.32, 1)`.
- `--g-card-selected` es token existente (no cambia).

## Steps

1. Al principio de `GCard.css`, tras el comentario de cabecera, añade:
   ```css
   /* Tinte de seleccionada/actual. Registrada para que el cambio de selección se funda
      (un gradiente no se anima con transition). Privada: el nombre lleva el componente porque @property es global */
   @property --_card-selected {
     syntax: '<color>';
     inherits: false;
     initial-value: transparent;
   }
   ```
2. En la regla `.g-card` cuya transición está en `:58-60`, añade la propiedad al final de la lista y el gradiente fijo:
   ```css
     transition:
       border-color var(--g-duration-fast) var(--g-ease-standard),
       box-shadow var(--g-duration-fast) var(--g-ease-standard),
       --_card-selected var(--g-duration-fast) var(--g-ease-standard);
   ```
   y, en esa misma regla, la declaración
   ```css
     background-image: linear-gradient(var(--_card-selected), var(--_card-selected));
   ```
   **Comprueba antes** que ninguna otra regla de `.g-card` sin selección asigna `background-image` (hoy solo `:632` y `:638`; `.g-card__scrim` es otro elemento). Si la hay, detente e informa.
3. En `:629-639`, sustituye las dos líneas `background-image: linear-gradient(var(--g-card-selected), var(--g-card-selected));` por
   ```css
     --_card-selected: var(--g-card-selected);
   ```
4. En `.g-card::after` (`:81-89`) añade al final:
   ```css
     transition: border-color var(--g-duration-fast) var(--g-ease-standard);
   ```
   (El foco cambia `outline` y `box-shadow` del `::after`: no se animan, el anillo de foco debe aparecer al instante.)
5. En `:356` añade a la regla del icono `transition: opacity var(--g-duration-fast) var(--g-ease-standard);`.
6. En `:209` cambia la transición del chevrón a
   ```css
     transition: rotate var(--g-duration-press) var(--g-ease-out);
   ```
7. `design/lab/card/estilo.md`: en la sección del estado seleccionado (busca «Seleccionad»), añade la frase: `La selección (tinte por \`--_card-selected\` registrada, anillo interior, borde e indicador con su ✓) se funde en \`--g-duration-fast\`, también con movimiento reducido (es color).` Si no hay una fila o párrafo de selección, añádela al final de la tabla de decisiones de estilo como fila nueva `| Selección | … |`.

## Boundaries

- Solo `GCard.css` y `design/lab/card/estilo.md`. No toques `GCard.vue`, `GSurface.css` ni tokens.
- No animes el anillo de foco (`outline` del `::after`), ni el subrayado del título en hover.
- No cambies los valores de `--g-card-selected` ni el orden de capas (`::before` velo, `::after` anillos).
- En `@media (forced-colors: active)` no hace falta nada: el gradiente transparente no se pinta y el sistema sustituye colores; compruébalo en la verificación.

## Verification

- **Mecánica**: `npm test`, `npm run build`, compuertas de CLAUDE.md. `grep -c "@property --_card-selected" packages/vue/dist/grana.css` → 1.
- **Medición (Playwright; Chromium, Firefox y WebKit; en WebKit adelanta `currentTime` de cada animación a 60 ms)**: clic en `#sec-card input.g-card__select` (segunda, `{ force: true }`); en el primer cuadro y a 60 ms lee `getComputedStyle(card).backgroundImage`, `getComputedStyle(card, '::after').borderTopColor`, `getComputedStyle(card).borderTopColor` y la `opacity` de `.g-card__tick > .g-icon`. Esperado: a 60 ms **los cuatro** están a medio camino (el alfa del tinte entre 0 y 0.043, el anillo interior y el exterior con el mismo grado de mezcla, el ✓ entre 0 y 1). `card.getAnimations()` incluye una transición de `--_card-selected` de 120 ms.
  - Desmarcar: el tinte vuelve a transparente en 120 ms (sin cuadro vacío ni salto).
  - Con `reducedMotion: 'reduce'`: lo mismo (las cuatro transiciones existen).
  - «Mostrar más» (`#sec-card .g-card__expand`): transición de `rotate` de 160 ms.
- **Feel check**: DevTools > Animations al 10 %: al seleccionar, el anillo interior, el borde y el tinte se oscurecen juntos y el ✓ aparece mientras la casilla se rellena; nada «llega antes». Selecciona y deselecciona rápido varias veces: se revierte desde donde está (transición, no keyframes). Forced-colors (Rendering > emulate `forced-colors: active`): la seleccionada sigue mostrando el borde de `Highlight` y no hay fondo extraño.
- **Done when**: tinte, anillo interior, borde y ✓ se funden juntos en 120 ms en los tres navegadores, también con `reduce`; el chevrón gira en 160 ms con `--g-ease-out`.
