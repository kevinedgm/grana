# 003 — Llenado continuo del conector, del segmento y de la barra de GStepper

- **Status**: DONE
- **Dueño**: coco (`GStepper.css`). Sin tokens nuevos (lima no interviene) y sin cambios en el `.vue` (bruno no interviene).
- **Commit**: 49ad85b
- **Severity**: HIGH
- **Category**: Missed opportunities (estado que salta) + defecto de transición
- **Estimated scope**: 1 archivo (`packages/vue/src/components/GStepper/GStepper.css`), ~40 líneas cambiadas

## Problem

Al avanzar o retroceder de paso, el conector que sale del paso actual pasa de «tramo hecho» (un gradiente) a «hecho» (un color liso) y el siguiente pasa de «pendiente» (color liso) a «tramo hecho» (gradiente). **Un gradiente no se interpola con `transition`**, así que el llenado salta. Además, la única transición que hay (`background-color`) produce un **parpadeo**: el gradiente tiene `background-color: transparent`, de modo que al pasar a «hecho» el color arranca desde transparente.

Medido en el playground (`http://localhost:4173/playground/#sec-stepper`, stepper de puntos, botón «Siguiente»), muestreando `getComputedStyle` en cada cuadro:

| Cuadro | Conector «tramo hecho → hecho» | Conector «pendiente → tramo hecho» |
| --- | --- | --- |
| 0–2 (Chromium) / 0 (Firefox) | sin imagen y `rgba(0,0,0,0)`: **el conector desaparece entero**, pista y llenado | el gradiente aparece de golpe al 35 % |
| 3–9 | `rgba(31,31,31,0.31)` → `1`: vuelve fundiéndose en 120 ms | el gris de fondo se funde por debajo del gradiente, sin efecto visible |

En el indicador `segment` (paso actual = gradiente al 50 %) y en la barra del compacto (`.g-stepper__bar-seg`) pasa lo mismo: el 50 % salta al 100 % (segmento: tres cuadros a `rgba(0,0,0,0)` antes de fundirse).

Es la queja del usuario («muy bruscas, no son fluidas»): lo que debería *avanzar* desaparece y reaparece.

```css
/* packages/vue/src/components/GStepper/GStepper.css:217-235 — current */
/* ---------- Conector ---------- */
.g-stepper__connector {
  flex: 1 1 auto;
  align-self: flex-start;
  min-inline-size: var(--_conn);
  block-size: var(--_line);
  margin-block-start: calc(var(--_pad) + var(--_off) + (var(--_ind) - var(--_line)) / 2);
  margin-inline: var(--_gap);
  border-radius: var(--g-radius-pill);
  /* La pista pendiente usa border-strong: con border (decorativo) casi no se ve en oscuro y el tramo hecho
     del conector saliente parecía un trazo suelto cuando el conector está en su mínimo */
  background: var(--g-color-border-strong);
}
.g-stepper__connector.is-done { background: var(--_base); }
.g-stepper__connector.is-toward {
  /* Tramo hecho: 35 % del conector, nunca menos de la mitad del mínimo (legible con el conector en su mínimo) */
  --_toward: max(35%, var(--_conn) / 2);
  background: linear-gradient(var(--_angle), var(--_base) var(--_toward), var(--g-color-border-strong) var(--_toward));
}
```

```css
/* GStepper.css:343-351, 361-364 — current (indicador segment) */
.g-stepper--indicator-segment:not(.g-stepper--is-compact) .g-stepper__indicator {
  inline-size: 100%;
  block-size: calc(var(--g-space-1) * 1.5);
  border: 0;
  border-radius: 0;
  background: var(--g-color-border-control);
  box-shadow: none;
  font-size: 0;
}
/* … */
.g-stepper--indicator-segment:not(.g-stepper--is-compact) .g-stepper__step.is-complete .g-stepper__indicator { background: var(--_base); }
.g-stepper--indicator-segment:not(.g-stepper--is-compact) .g-stepper__step.is-current .g-stepper__indicator {
  background: linear-gradient(var(--_angle), var(--_base) 50%, var(--g-color-border-control) 50%);
}
```

```css
/* GStepper.css:391-403 — current (conector vertical) */
:is(.g-stepper--vertical, .g-stepper__compact) .g-stepper__connector {
  position: absolute;
  inset-inline-start: calc((var(--_ind) - var(--_line)) / 2);
  inset-block: calc(var(--_pad) + var(--_off) + var(--_ind) + var(--g-space-1)) 0;
  inline-size: var(--_line);
  block-size: auto;
  min-inline-size: 0;
  margin: 0;
  align-self: auto;
}
:is(.g-stepper--vertical, .g-stepper__compact) .g-stepper__connector.is-toward {
  background: linear-gradient(180deg, var(--_base) max(35%, var(--_conn) / 2), var(--g-color-border-strong) max(35%, var(--_conn) / 2));
}
```

```css
/* GStepper.css:439-447 — current (barra del compacto) */
.g-stepper__bar-seg {
  flex: 1 1 0;
  block-size: var(--g-space-1);
  background: var(--g-color-border);
}
/* … */
.g-stepper__bar-seg.is-done { background: var(--_base); }
.g-stepper__bar-seg.is-toward { background: linear-gradient(var(--_angle), var(--_base) 50%, var(--g-color-border) 50%); }
```

```css
/* GStepper.css:512-521 — current (bloque de movimiento) */
@media (prefers-reduced-motion: no-preference) {
  .g-stepper__step button.g-stepper__hit:active .g-stepper__indicator {
    transform: scale(var(--g-press-scale));
    transition: transform var(--g-duration-press) var(--g-ease-out);
  }
  .g-stepper__connector,
  .g-stepper__bar-seg {
    transition: background-color var(--g-duration-fast) var(--g-ease-standard);
  }
}
```

## Target

Los tres elementos (conector, segmento, tramo de la barra) dibujan **siempre el mismo gradiente**; solo cambia la posición de la parada, guardada en una **propiedad registrada** `--_stepper-fill` (`@property`, tipo `<length-percentage>`), que sí se interpola. Pendiente = `0%`, tramo hecho = `max(35%, var(--_conn) / 2)` (conector) o `50%` (segmento y barra), hecho = `100%`.

- Duración: **240 ms** = `calc(var(--g-duration-press) * 1.5)`, alias local `--_t-slow` (la misma derivación que `GSidebar.css:19`; DECISIONS.md #71 fija 240 ms como máximo de la interfaz). **No hace falta token nuevo.**
- Curva: `var(--g-ease-standard)` (`cubic-bezier(0.2, 0, 0, 1)`), la de los cambios de tamaño de `GSidebar` (#71: «sin curvas propias»). El llenado es la respuesta del sistema a la acción del usuario: decelera.
- Solo cambia la pintura de un elemento de 2 px de alto: **sin layout ni reflow**.
- RTL: el gradiente ya usa `var(--_angle)` (90deg, o 270deg con `:dir(rtl)`, `GStepper.css:41`), así que el llenado crece desde el borde inicial lógico sin cambios.
- Vertical: el ángulo pasa a ser un alias `--_fill-angle` (180deg en vertical) para no redeclarar `background` (y no pisar las reglas de `forced-colors`).
- Movimiento reducido: el llenado **no se anima** (salta), y ya no parpadea porque la imagen es siempre la misma. Los colores del indicador los trata el plan 004.
- Soporte de `@property` + interpolación de `max()`: comprobado en Chromium, Firefox (≥ 128) y WebKit (Safari ≥ 16.4), también declarado dentro de `@layer` (así lo empaqueta `components.css`). En navegadores sin `@property` el llenado salta sin parpadeo (mejora progresiva).

Nota de contrato: `design/contracts/stepper.md:209` dice «Sin animación de progreso entre pasos más allá del cambio de estado que fije coco». Esto **es** la transición del cambio de estado (una sola, de un estado al siguiente, sin bucle ni progreso continuo), así que entra en lo que decide coco.

## Repo conventions to follow

- Solo `var(--g-*)` y alias locales `var(--_*)` (CLAUDE.md). `--_stepper-fill` es privado (prefijo `--_`) y lleva el nombre del componente porque `@property` registra el nombre **en todo el documento**.
- Duración derivada como en `packages/vue/src/components/GSidebar/GSidebar.css:18-19`:
  ```css
  --_t: var(--g-duration-press);
  --_t-slow: calc(var(--g-duration-press) * 1.5);
  ```
- Transiciones dentro de `@media (prefers-reduced-motion: no-preference)`, como ya hace `GStepper.css:512`.
- Tokens vigentes (`packages/vue/src/styles/defaults.css:151-156`): `--g-duration-fast: 120ms`, `--g-duration-press: 160ms`, `--g-duration-spin: 800ms`, `--g-ease-standard: cubic-bezier(0.2, 0, 0, 1)`, `--g-ease-out: cubic-bezier(0.23, 1, 0.32, 1)`, `--g-press-scale: 0.97`.

## Steps

1. **Registrar la propiedad.** En `GStepper.css`, justo después del comentario de cabecera (línea 9) y antes de `/* ---------- Esqueleto ---------- */`, añade:
   ```css
   /* Avance pintado del conector, del segmento y de la barra. Registrada para que el llenado se interpole
      (un gradiente no se anima con transition). Privada: el nombre lleva el componente porque @property es global */
   @property --_stepper-fill {
     syntax: '<length-percentage>';
     inherits: false;
     initial-value: 0%;
   }
   ```
2. **Alias de duración.** En `.g-stepper { … }` (línea 12), tras `--_angle: 90deg;` (línea 32), añade:
   ```css
     --_t-slow: calc(var(--g-duration-press) * 1.5); /* 240ms con los valores por defecto (como GSidebar) */
   ```
3. **Conector.** Sustituye las líneas 217-235 por:
   ```css
   /* ---------- Conector ---------- */
   .g-stepper__connector {
     --_stepper-fill: 0%;
     --_fill-angle: var(--_angle);
     flex: 1 1 auto;
     align-self: flex-start;
     min-inline-size: var(--_conn);
     block-size: var(--_line);
     margin-block-start: calc(var(--_pad) + var(--_off) + (var(--_ind) - var(--_line)) / 2);
     margin-inline: var(--_gap);
     border-radius: var(--g-radius-pill);
     /* La pista pendiente usa border-strong: con border (decorativo) casi no se ve en oscuro y el tramo hecho
        del conector saliente parecía un trazo suelto cuando el conector está en su mínimo.
        Siempre el mismo gradiente: solo se mueve la parada (--_stepper-fill), que sí se interpola */
     background: linear-gradient(var(--_fill-angle), var(--_base) var(--_stepper-fill), var(--g-color-border-strong) var(--_stepper-fill));
   }
   .g-stepper__connector.is-done { --_stepper-fill: 100%; }
   /* Tramo hecho: 35 % del conector, nunca menos de la mitad del mínimo (legible con el conector en su mínimo) */
   .g-stepper__connector.is-toward { --_stepper-fill: max(35%, var(--_conn) / 2); }
   ```
4. **Segmento.** En la regla de las líneas 343-351, cambia `background: var(--g-color-border-control);` por estas dos líneas:
   ```css
     --_stepper-fill: 0%;
     background: linear-gradient(var(--_angle), var(--_base) var(--_stepper-fill), var(--g-color-border-control) var(--_stepper-fill));
   ```
   y sustituye las líneas 361-364 por:
   ```css
   .g-stepper--indicator-segment:not(.g-stepper--is-compact) .g-stepper__step.is-complete .g-stepper__indicator { --_stepper-fill: 100%; }
   .g-stepper--indicator-segment:not(.g-stepper--is-compact) .g-stepper__step.is-current .g-stepper__indicator { --_stepper-fill: 50%; }
   ```
   No toques las reglas de error y advertencia (366-371): siguen reemplazando el fondo por su trama.
5. **Vertical.** En la regla de las líneas 391-400 añade al final `--_fill-angle: 180deg;` y **borra** las líneas 401-403 (la regla `.is-toward` vertical): el tramo hecho ya lo da el paso 3.
6. **Barra del compacto.** Sustituye en `.g-stepper__bar-seg` (líneas 439-443) `background: var(--g-color-border);` por:
   ```css
     --_stepper-fill: 0%;
     background: linear-gradient(var(--_angle), var(--_base) var(--_stepper-fill), var(--g-color-border) var(--_stepper-fill));
   ```
   y sustituye las líneas 446-447 por:
   ```css
   .g-stepper__bar-seg.is-done { --_stepper-fill: 100%; }
   .g-stepper__bar-seg.is-toward { --_stepper-fill: 50%; }
   ```
7. **Transiciones.** Dentro de `@media (prefers-reduced-motion: no-preference)` (línea 512), sustituye el bloque de las líneas 517-520 por:
   ```css
     .g-stepper__connector,
     .g-stepper__bar-seg,
     .g-stepper--indicator-segment:not(.g-stepper--is-compact) .g-stepper__indicator {
       transition: --_stepper-fill var(--_t-slow) var(--g-ease-standard);
     }
   ```
   (La regla del segmento sustituye la lista de transiciones del indicador solo en esa variante; el plan 004 la completa. Si ejecutas el 004 después, usa la versión de ese plan.)
8. No toques `@media (forced-colors: active)` (líneas 533-563): sus `background:` siguen reemplazando el gradiente.

## Boundaries

- Solo `GStepper.css`. No toques `GStepper.vue`, pruebas, `defaults.css`, `docs/contract/` ni el contrato.
- No animes `inline-size`, `margin` ni ninguna propiedad de layout. No uses `transform: scaleX` en el conector: deformaría los extremos redondeados (`--g-radius-pill`) y no respeta el mínimo `max(35%, var(--_conn) / 2)`.
- Sin literales nuevos de tema: `0%`, `50%`, `100%`, `35%`, `90deg`/`180deg` ya existían como geometría del gradiente.
- Si el código no coincide con lo citado (cambios después de 49ad85b), DETENTE e informa.

## Verification

- **Mecánica**: `npm test` (todas verdes; el CSS no se prueba en jsdom) y `npm run build`; compuertas de CLAUDE.md:
  ```bash
  grep -q "g-btn--variant-soft" packages/vue/dist/grana.css
  ! grep -q "data:font" packages/vue/dist/grana.css
  ! grep -q "createApp" packages/vue/dist/grana.umd.js
  grep -q "@property --_stepper-fill" packages/vue/dist/grana.css   # la regla llegó al empaquetado
  ! grep -n -- "--_toward" packages/vue/src/components/GStepper/GStepper.css   # el alias antiguo desapareció
  ```
- **Medición (Playwright, los 3 navegadores)**: Playwright está en `design/lab/theme-playground/node_modules`. Con el playground servido, en `#sec-stepper`, pulsa «Siguiente» y, **en el mismo turno**, lee las animaciones del conector que sale del paso que deja de ser el actual. En WebKit headless el reloj de animaciones no avanza solo: mide adelantando `currentTime`, que funciona en los tres.
  ```js
  // dentro de page.evaluate, tras next.click() y await Promise.resolve()
  const c = dot.querySelectorAll(':scope > .g-stepper__list > .g-stepper__step > .g-stepper__connector')[1]
  const a = c.getAnimations()
  // esperado: [{ transitionProperty: '--_stepper-fill', duration: 240 }] y nada de background-color
  a[0].pause(); a[0].currentTime = 0;   getComputedStyle(c).getPropertyValue('--_stepper-fill') // ≈ max(35%, 12px)
  a[0].currentTime = 120;                getComputedStyle(c).getPropertyValue('--_stepper-fill') // calc(~88% + …): entre ambos
  getComputedStyle(c).backgroundImage !== 'none'  // true en todos los instantes: nunca desaparece
  ```
  Criterios: una sola animación por conector, `--_stepper-fill`, **240 ms**; `backgroundImage` nunca `none` y `backgroundColor` sin transición; el conector siguiente pasa de `0%` a `max(35%, 12px)` con la misma duración; el segmento (`indicator="segment"`) y `.g-stepper__bar-seg` del stepper estrecho van de `50%` a `100%`.
- **Sin layout**: durante la animación, `getBoundingClientRect()` de cada `.g-stepper__step` es idéntico en cada cuadro (Chromium); en DevTools > Performance, la grabación del clic muestra *Paint* pero ningún *Layout* tras el primero.
- **RTL**: pon `dir="rtl"` en el contenedor del stepper y repite: el tramo base crece desde la derecha (lee `--_angle` = `270deg` y mira una captura).
- **Movimiento reducido** (`reducedMotion: 'reduce'` en el contexto): `c.getAnimations()` vacío; el conector cambia sin un solo cuadro transparente.
- **Feel check**: en DevTools > Animations al 10 %, «Siguiente»: el tramo hecho del conector saliente se alarga hasta el siguiente indicador mientras el siguiente conector arranca su 35 %, sin un cuadro vacío. Pulsa «Siguiente» y «Anterior» muy seguido: el llenado se da la vuelta desde donde está (transición, no keyframes). En pendiente, con zoom al 400 %, no asoma ningún píxel del color base en el extremo inicial.
- **Done when**: los tres tipos de llenado se interpolan en los tres navegadores sin parpadeo, sin layout, con 240 ms y `--g-ease-standard`, y saltan (sin parpadeo) con movimiento reducido.

## Nota de ejecución

Ejecutado sin desviaciones. Verificado en Chromium, Firefox y WebKit: una animación por conector (`--_stepper-fill`, 240 ms), `background-image` nunca `none`, sin animaciones con movimiento reducido. Vitest 1178 verdes, build y compuertas OK.
