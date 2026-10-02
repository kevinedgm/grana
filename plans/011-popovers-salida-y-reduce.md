# 011 — Popovers de GSelect, GDatePicker, GHelper y GFilterBar: salida corta y fundido con movimiento reducido

- **Status**: DONE
- **Dueño**: coco (`GSelect.css`, `GDatePicker.css`, `GHelper.css`, `GFilterBar.css` y sus `estilo.md`). Sin `.vue`, sin tokens nuevos.
- **Commit**: c9ecab2
- **Severity**: LOW
- **Category**: Cohesion + Accessibility
- **Estimated scope**: 4 archivos CSS (~10–25 líneas cada uno) + 3 filas de `estilo.md`
- **Depende de**: 007 (toca el bloque `reduce` de `GSelect.css` y borra el de `GDatePicker.css`). Ejecútalo después.

## Problem

Los popovers de Grana no se comportan igual. `GMenu` (con el plan 010) y el panel flotante, la pista y el drawer de `GSidebar` entran **y salen** con un fundido corto y, con movimiento reducido, conservan el fundido. Los otros cuatro no:

| Popover | Entrada | Salida (medido) | Con `reduce` (medido) |
| --- | --- | --- | --- |
| Lista de `GSelect` | `@keyframes` `opacity` + `translate` 160 ms | `display: none` en el primer cuadro | sin nada: aparece y desaparece de golpe |
| Popover de `GDatePicker` | `@keyframes` `opacity` + `translate` 160 ms | `display: none` en el primer cuadro | sin nada |
| Contenido de `GHelper` | transición desde `@starting-style` 160 ms | `display: none` y contenido desmontado en el mismo ciclo | sin nada (`helper/estilo.md:30`: «Sin transición») |
| Editor de `GFilterBar` | transición de `opacity` 160 ms | contenido desmontado en el mismo ciclo | sin nada, aunque solo anima `opacity` |

Medido en Chromium, Firefox y WebKit en el playground (`#sec-select`, `#sec-datepicker`, `#sec-helper`, chip «Estado» de `#sec-table`). La lista de `GSelect` y el popover de `GDatePicker` **siguen en el DOM** al cerrarse (0 nodos eliminados), así que su salida se arregla solo con CSS. `GHelper` y el editor de `GFilterBar` desmontan su contenido al cerrar (lo decide bruno en el render): una salida con CSS mostraría una caja vacía, así que este plan **no** les da salida (se anota como pendiente) y solo les añade el fundido con `reduce`.

```css
/* packages/vue/src/components/GSelect/GSelect.css:320-333 — current */
@media (prefers-reduced-motion: no-preference) {
  .g-select__list:popover-open {
    animation: g-select-in var(--g-duration-press) var(--g-ease-out);
  }
  @keyframes g-select-in {
    from { opacity: 0; translate: 0 calc(var(--g-space-1) * -1); }
  }
  .g-select__list.is-up:popover-open {
    animation-name: g-select-in-up;
  }
  @keyframes g-select-in-up {
    from { opacity: 0; translate: 0 var(--g-space-1); }
  }
}
```
```css
/* GDatePicker.css:655-668 — current */
@media (prefers-reduced-motion: no-preference) {
  .g-datepicker__pop:popover-open {
    animation: g-datepicker-in var(--g-duration-press) var(--g-ease-out);
  }
  @keyframes g-datepicker-in {
    from { opacity: 0; translate: 0 calc(var(--g-space-1) * -1); }
  }
  .g-datepicker__pop.is-up:popover-open {
    animation-name: g-datepicker-in-up;
  }
  @keyframes g-datepicker-in-up {
    from { opacity: 0; translate: 0 var(--g-space-1); }
  }
}
```
```css
/* GHelper.css:159-170 — current */
/* Entrada breve desde el lado del disparador; sin movimiento con reduced-motion */
@media (prefers-reduced-motion: no-preference) {
  .g-helper__content:popover-open {
    transition:
      opacity var(--g-duration-press) var(--g-ease-out),
      translate var(--g-duration-press) var(--g-ease-out);
  }
  @starting-style {
    .g-helper__content:popover-open { opacity: 0; }
    .g-helper__content[data-side="bottom"]:popover-open { translate: 0 calc(var(--g-space-1) * -1); }
    .g-helper__content[data-side="top"]:popover-open { translate: 0 var(--g-space-1); }
    .g-helper__content[data-side="left"]:popover-open { translate: var(--g-space-1) 0; }
    .g-helper__content[data-side="right"]:popover-open { translate: calc(var(--g-space-1) * -1) 0; }
  }
}
```
```css
/* GFilterBar.css:194-197 — current */
@media (prefers-reduced-motion: no-preference) {
  .g-filter-bar__editor:popover-open { transition: opacity var(--g-duration-press) var(--g-ease-out); }
  @starting-style { .g-filter-bar__editor:popover-open { opacity: 0; } }
}
```

**Por qué la entrada de `GSelect`/`GDatePicker` se queda en `@keyframes`** (y no pasa a `@starting-style` como `GMenu`): su clase `is-up` la decide bruno **después** de `showPopover()` (hay que medir la lista abierta: `GSelect.vue:153-155`, `GDatePicker.vue:486-494`). `@starting-style` se resuelve en el primer cálculo de estilo, antes de `is-up`, así que la lista que abre hacia arriba entraría desde arriba. El cambio de `animation-name` sí reinicia la animación con el sentido correcto. La entrada es de un solo sentido; lo que falta es la salida.

## Target

- **Salida** de la lista de `GSelect` y del popover de `GDatePicker`: solo `opacity` 1 → 0 en **120 ms** `var(--g-duration-fast)` con `var(--g-ease-out)` (`cubic-bezier(0.23, 1, 0.32, 1)`), con `overlay` y `display` en `allow-discrete` para seguir pintados mientras se funden (sin soporte de `overlay`, Firefox y Safari, cierran al instante como hoy). Sin desplazamiento: la salida es más sutil que la entrada. En la hoja móvil (≤ 520px), el `::backdrop` también se funde al entrar (160 ms) y al salir (120 ms).
- **Entrada** sin cambios (`@keyframes` de 160 ms con `--g-ease-out`).
- **Movimiento reducido** en los cuatro: entrada y (donde la hay) salida solo con `opacity`, 120 ms `linear` (patrón de `GMenu.css:217-221` y `GSidebar.css:906-923`).
- `GFilterBar`: su transición ya es solo de `opacity`; deja de estar condicionada (no es movimiento).

## Repo conventions to follow

- Exemplar de salida de un popover con `allow-discrete` y `@starting-style`: `packages/vue/src/components/GSidebar/GSidebar.css:550-574` (panel flotante) y `:620-649` (pista).
- Exemplar de movimiento reducido con fundido: `packages/vue/src/components/GMenu/GMenu.css:217-227`.
- Tokens (`defaults.css:151-156`): `--g-duration-fast: 120ms`, `--g-duration-press: 160ms`, `--g-ease-out: cubic-bezier(0.23, 1, 0.32, 1)`.

## Steps

1. **`GSelect.css`**:
   - Justo antes de `:320` añade:
     ```css
     /* Salida: fundido corto sin desplazamiento (la lista sigue en el DOM; overlay y display discretos la mantienen pintada) */
     .g-select__list { opacity: 0; }
     .g-select__list:popover-open { opacity: 1; }
     @starting-style {
       .g-select__list:popover-open { opacity: 0; }
     }
     ```
   - Dentro del bloque `no-preference` de `:320-333`, al principio, añade:
     ```css
       .g-select__list {
         transition:
           opacity var(--g-duration-fast) var(--g-ease-out),
           overlay var(--g-duration-fast) allow-discrete,
           display var(--g-duration-fast) allow-discrete;
       }
     ```
   - En la hoja móvil (`@media (max-width: 520px)`, la regla `.g-select__list::backdrop` de `:481-483`), añade dentro de esa misma media consulta:
     ```css
       .g-select__list::backdrop { opacity: 0; }
       .g-select__list:popover-open::backdrop { opacity: 1; }
       @starting-style {
         .g-select__list:popover-open::backdrop { opacity: 0; }
       }
     ```
     y en el bloque `@media (max-width: 520px) and (prefers-reduced-motion: no-preference)` de `:488-496` añade
     ```css
       .g-select__list::backdrop {
         transition:
           opacity var(--g-duration-fast) var(--g-ease-out),
           overlay var(--g-duration-fast) allow-discrete,
           display var(--g-duration-fast) allow-discrete;
       }
       .g-select__list:popover-open::backdrop {
         transition:
           opacity var(--g-duration-press) var(--g-ease-out),
           overlay var(--g-duration-press) allow-discrete,
           display var(--g-duration-press) allow-discrete;
       }
     ```
   - En el bloque `reduce` (tras el plan 007 tiene `.g-select__arrow` y `.g-select__loader`) añade:
     ```css
       .g-select__list,
       .g-select__list::backdrop {
         transition:
           opacity var(--g-duration-fast) linear,
           overlay var(--g-duration-fast) allow-discrete,
           display var(--g-duration-fast) allow-discrete;
       }
     ```
2. **`GDatePicker.css`**: lo mismo con `.g-datepicker__pop`:
   - Antes de `:655`: las reglas base de `opacity` 0/1 y el `@starting-style` (como en el paso 1, con `.g-datepicker__pop`).
   - Al principio del bloque `no-preference` de `:655-668`: la `transition` de salida (como en el paso 1).
   - Dentro de `@media (max-width: 520px)` (`:671-753`), junto a `.g-datepicker__pop::backdrop` (`:685-687`): las reglas de `opacity` del `::backdrop` y su `@starting-style`; y dentro del bloque anidado `@media (prefers-reduced-motion: no-preference)` de `:744-752`, las dos `transition` del `::backdrop` (como en el paso 1).
   - El bloque `reduce` de `:756-762` lo borró el plan 007; crea en su lugar:
     ```css
     @media (prefers-reduced-motion: reduce) {
       .g-datepicker__pop,
       .g-datepicker__pop::backdrop {
         transition:
           opacity var(--g-duration-fast) linear,
           overlay var(--g-duration-fast) allow-discrete,
           display var(--g-duration-fast) allow-discrete;
       }
     }
     ```
3. **`GHelper.css:159-170`**: tras el bloque `no-preference` añade
   ```css
   /* Movimiento reducido: sin desplazamiento; el fundido se conserva */
   @media (prefers-reduced-motion: reduce) {
     .g-helper__content:popover-open {
       transition: opacity var(--g-duration-fast) linear;
     }
     @starting-style {
       .g-helper__content:popover-open { opacity: 0; }
     }
   }
   ```
   y cambia el comentario de `:159` a `/* Entrada breve desde el lado del disparador; con reduced-motion, solo fundido */`.
4. **`GFilterBar.css:194-197`**: sustituye el bloque por (sin media consulta)
   ```css
   /* Entrada del editor: solo fundido (no es movimiento: vale también con movimiento reducido) */
   .g-filter-bar__editor:popover-open { transition: opacity var(--g-duration-press) var(--g-ease-out); }
   @starting-style { .g-filter-bar__editor:popover-open { opacity: 0; } }
   ```
5. **`estilo.md`**:
   - `design/lab/select/estilo.md:20` → segunda columna: `Fundido breve con desplazamiento de \`--g-space-1\` (hacia abajo o hacia arriba con \`is-up\`), en \`--g-duration-press\`; sale con un fundido de \`--g-duration-fast\` sin desplazamiento (sin \`overlay\`, al instante). Con movimiento reducido, solo fundidos de 120 ms`
   - `design/lab/helper/estilo.md:30` → `Sin desplazamiento; fundido de entrada de 120 ms (\`linear\`). Sin salida animada: el contenido se desmonta al cerrar`
   - `design/lab/datepicker/estilo.md`: añade una fila a la tabla de decisiones `| **Salida del popover** | Fundido de \`--g-duration-fast\` sin desplazamiento (también el fondo de la hoja móvil); con movimiento reducido, entrada y salida solo con fundido de 120 ms |`.

## Boundaries

- Solo los cuatro CSS y los tres `estilo.md`. No toques `.vue`: la salida de `GHelper` y del editor de `GFilterBar` necesita que bruno mantenga el contenido montado y queda fuera.
- No cambies las entradas (`@keyframes`, duraciones, desplazamientos) ni `is-up`.
- No animes el contenido interior (opciones, días).
- Si `.g-select__list` o `.g-datepicker__pop` ya declaran `opacity` en otra regla, detente e informa.

## Verification

- **Mecánica**: `npm test`, `npm run build`, compuertas de CLAUDE.md.
- **Medición (Playwright)**:
  - Chromium, `no-preference`: abre `#sec-select .g-select__button` (el primero) y pulsa Esc; en el primer cuadro la lista tiene `display` ≠ `none` y `getAnimations()` con `opacity`, `overlay` y `display` de 120 ms; a los 200 ms, `display: none`. Igual con `#sec-datepicker .g-datepicker__field`. La entrada sigue siendo `CSSAnimation` `g-select-in`/`g-select-in-up` de 160 ms.
  - Con `viewport: { width: 400, height: 800 }`: el `::backdrop` de la hoja tiene transición de `opacity` al abrir (160 ms) y al cerrar (120 ms).
  - `reducedMotion: 'reduce'`: los cuatro popovers tienen transición de `opacity` (120 ms) al abrir; `GSelect` y `GDatePicker` también al cerrar; ninguno tiene `translate`.
  - Firefox y WebKit (en WebKit, `currentTime` manual): entradas como hoy; al cerrar, ocultos en el primer cuadro (sin verse fuera de sitio).
- **Feel check**: DevTools > Animations al 10 %: elige una opción del select; la lista se desvanece en su sitio, sin moverse, más rápido de lo que entró. Abre y cierra el select con el teclado varias veces: nada se siente lento. Rendering > `prefers-reduced-motion: reduce`: el select, el calendario, la ayuda y el editor de filtros aparecen con un fundido, sin desplazarse.
- **Done when**: `GSelect` y `GDatePicker` salen con un fundido de 120 ms (Chromium) y los cuatro popovers se funden con `reduce`; los `estilo.md` lo dicen.

## Nota de ejecución

Verificado con Playwright: Chromium sale en 120 ms (opacity/overlay/display) y con `reduce` entra y sale solo con opacidad; Firefox y WebKit cierran al instante. En WebKit headless, Esc no cierra la lista de GSelect con el foco en el botón (igual antes del cambio; no es regresión).
