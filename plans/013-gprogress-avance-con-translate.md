# 013 — GProgress: avance con `translate` en lugar de `inline-size`

- **Status**: DONE
- **Dueño**: coco (`GProgress.css`, `design/lab/widget/estilo.md`). Sin `.vue` (la variable `--_value` de bruno no cambia), sin tokens nuevos.
- **Commit**: c9ecab2
- **Severity**: LOW
- **Category**: Performance
- **Estimated scope**: 1 archivo CSS (~10 líneas) + 1 frase de `estilo.md`
- **Depende de**: nada.

## Problem

El relleno de la barra de progreso anima su **ancho**, una propiedad de layout: cada cuadro de los 160 ms recalcula el layout y repinta.

```css
/* packages/vue/src/components/GProgress/GProgress.css:37-47 — current */
.g-progress__fill {
  display: block;
  inline-size: var(--_value);
  block-size: 100%;
  border-radius: var(--g-radius-pill);
  background: var(--_color);
}
@media (prefers-reduced-motion: no-preference) {
  .g-progress__fill {
    transition: inline-size var(--g-duration-press) var(--g-ease-out);
  }
}
```
```html
<!-- GProgress.vue:35 — current (bruno da el avance) -->
<span class="g-progress__fill" :style="{ '--_value': `${pct}%` }" />
```
Medido (Chromium, `#sec-widget`, cambiando `--_value` del primer `.g-progress__fill` a `90%`): `getAnimations()` = una transición de `width` de 160 ms. Es una barra pequeña y el coste es bajo, por eso LOW; pero en un panel con varios widgets que se actualizan a la vez son varios layouts por cuadro, y AUDIT §5 pide animar solo `transform`/`opacity`.

La barra (`.g-progress__bar`, `:26-35`) ya tiene `overflow: hidden` y radio de píldora, así que el relleno puede ocupar el 100% y **desplazarse**: la parte que queda fuera la recorta la barra.

## Target

- `.g-progress__fill`: `inline-size: 100%` y `translate: calc((var(--_value) - 100%) * var(--_dir)) 0`, con `--_dir: 1` (y `-1` en RTL, para que avance desde el inicio de línea). `translate` en porcentaje se mide sobre el propio relleno, que mide lo que la barra.
- Transición: `translate` **160 ms** `var(--g-duration-press)` con `var(--g-ease-out)` (`cubic-bezier(0.23, 1, 0.32, 1)`), solo con `no-preference` (igual que hoy).
- Aspecto: igual en 0 %, 100 % y valores intermedios grandes. Con valores muy pequeños (< ~4 %), el extremo visible es el final redondeado de una píldora larga recortado por el radio de la barra, no una píldora diminuta: compruébalo en el feel check y, si se ve peor, detente e informa.

## Repo conventions to follow

- Exemplar de `--_dir` con `:dir(rtl)`: `packages/vue/src/components/GSwitch/GSwitch.css:79-81` (`.g-switch__control:dir(rtl) { --_dir: -1; }`) y su uso en `translate: calc(var(--_dir) * var(--_x)) 0` (`:119`).
- Tokens (`defaults.css:151-156`): `--g-duration-press: 160ms`, `--g-ease-out: cubic-bezier(0.23, 1, 0.32, 1)`.

## Steps

1. En `.g-progress` (`GProgress.css:5-15`) añade `--_dir: 1;` junto a `--_h`, y después de la regla añade:
   ```css
   .g-progress:dir(rtl) { --_dir: -1; }
   ```
2. Sustituye `.g-progress__fill` y su bloque de movimiento (`:37-47`) por:
   ```css
   /* El relleno mide lo que la barra y se desplaza hasta el avance (la barra recorta lo que sobra): sin layout al animar */
   .g-progress__fill {
     display: block;
     inline-size: 100%;
     block-size: 100%;
     border-radius: var(--g-radius-pill);
     background: var(--_color);
     translate: calc((var(--_value) - 100%) * var(--_dir)) 0;
   }
   @media (prefers-reduced-motion: no-preference) {
     .g-progress__fill {
       transition: translate var(--g-duration-press) var(--g-ease-out);
     }
   }
   ```
3. `design/lab/widget/estilo.md:17`: en la fila **Progreso**, cambia «el avance entra con una transición corta» por «el avance se desplaza con una transición corta de `translate` (el relleno mide lo que la barra, que lo recorta; sin layout)».

## Boundaries

- Solo `GProgress.css` y esa fila de `estilo.md`. No toques `GProgress.vue` ni el nombre `--_value`.
- No cambies `forced-colors` (`:55-64`): el relleno sigue siendo `Highlight`.
- No añadas animación al montar (hoy no hay: una transición no corre en la primera pintura).

## Verification

- **Mecánica**: `npm test`, `npm run build`, compuertas de CLAUDE.md.
- **Medición (Playwright, Chromium, Firefox y WebKit)** en `#sec-widget`: lee `fill.getBoundingClientRect()` y `bar.getBoundingClientRect()`; la parte visible (intersección) mide `valor × ancho de barra` ± 1 px para el valor actual. Cambia `fill.style.setProperty('--_value', '90%')`: `getAnimations()` = una transición de `translate` de 160 ms (ninguna de `width`); al terminar, la intersección mide el 90 % de la barra. Con `document.documentElement.dir = 'rtl'`, el relleno visible empieza en el borde derecho.
  - Con `reducedMotion: 'reduce'`: el cambio es inmediato (sin transiciones).
- **Feel check**: compara capturas antes/después con 0 %, 3 %, 50 % y 100 %: el extremo del avance sigue redondeado y la barra no muestra relleno fuera de su contorno. DevTools > Performance mientras cambias el valor: sin «Layout» en los cuadros de la transición.
- **Done when**: el avance se anima con `translate` en los tres navegadores, se ve igual que antes (salvo, quizá, valores < 4 %) y respeta RTL.

## Nota de ejecución

Verificado con Playwright (3 navegadores): visible 72% = 329.8 px de 458, tras 90% = 412.2 px; una transición de `translate` de 160 ms (ninguna de `width`); con `reduce`, sin transiciones; RTL alinea a la derecha.
