# 007 — Movimiento reducido en todo Grana: conservar los fundidos de color y quitar las escalas que saltan

- **Status**: TODO
- **Dueño**: coco (los `G*.css` listados y las filas de `design/lab/<nombre>/estilo.md`). Sin `.vue`, sin pruebas, sin tokens nuevos.
- **Commit**: c9ecab2
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Estimated scope**: 14 archivos CSS (~5–15 líneas cada uno) + 8 filas de `estilo.md`
- **Depende de**: nada. Ejecútalo **antes** de 008, 009 y 011 (editan bloques vecinos de `GCard.css`, `GDialog.css`, `GSelect.css` y `GDatePicker.css`).

## Problem

Con `prefers-reduced-motion: reduce`, casi todos los componentes ponen `transition: none` en reglas cuya lista de transiciones es **solo de color** (fondo, borde, texto, contorno de foco). Resultado medido con Playwright (Chromium, `reducedMotion: 'reduce'`): al marcar un checkbox, un switch, seleccionar una tarjeta, pulsar un botón, enfocar un select o elegir un día, `getAnimations()` devuelve **0**: todo cambia de color en un cuadro. Con `no-preference` esas mismas acciones tienen 5–20 transiciones de 120 ms.

Reducir movimiento es quitar desplazamientos, escalas y giros, **no** la respuesta de color (AUDIT §6: «Reduced motion means fewer and gentler animations, not zero»). Grana ya lo hace bien en tres sitios, que son el patrón a seguir:

- `GMenu.css:217-221` (la lista pierde la escala y conserva el fundido),
- `GToast.css:297-302` (solo `opacity`),
- `GSidebar.css:881-925` (comentario: «Movimiento reducido = menos y más suave, no cero»), y el plan 004 (hecho) para `GStepper`.

Además hay un defecto peor que el exceso: en tres sitios la **escala de pulsación sigue aplicándose con movimiento reducido, pero sin transición**, así que el control salta a 0.97 en un cuadro. Medido en `GSwitch` (Chromium, `reduce`, ratón pulsado sobre el riel: `scale` = `0.97` en el primer cuadro, `getAnimations().length` = 0). Por lectura del CSS, igual en el botón de cierre de `GDialog` (`GDialog.css:128`), en los botones de `GWidgetGallery` (`GWidgetGallery.css:248`) y de `GWidgetConfig` (`GWidgetConfig.css:175`): su `:active { scale: var(--g-press-scale) }` no está condicionado y el bloque `reduce` solo quita la transición.

Y uno en `GSidebar`: con `reduce`, el submenú en línea al **cerrarse** pasa a `visibility: hidden` en el primer cuadro (medido: `vis=hidden op=1`), así que el fundido de opacidad que el propio bloque conserva no se ve.

Por archivo (código actual, verbatim):

```css
/* packages/vue/src/components/GBtn/GBtn.css:271-281 — current */
@media (prefers-reduced-motion: reduce) {
  .g-btn {
    transition: none;
  }
  .g-btn:active:not(:disabled):not(.is-disabled):not(.is-loading):not(.g-btn--variant-link) {
    transform: none;
  }
  .g-btn__loader {
    animation-duration: calc(var(--g-duration-spin) * 2.5);
  }
}
```
(base `GBtn.css:64-68`: `background-color`, `border-color`, `color` 120 ms + `transform` 160 ms.) Los planes 001/002 de GBtn no tocaron esto: 002 solo ralentizó el giro del cargador.

```css
/* GInput.css:409-416 — current */
@media (prefers-reduced-motion: reduce) {
  .g-input__control {
    transition: none;
  }
  .g-input__loader {
    animation-duration: calc(var(--g-duration-spin) * 2.5);
  }
}
```
(base `GInput.css:94-96`: solo `background-color` y `border-color`.)

```css
/* GTextarea.css:294-301 — current */
@media (prefers-reduced-motion: reduce) {
  .g-textarea__control {
    transition: none;
  }
  .g-textarea__loader {
    animation-duration: calc(var(--g-duration-spin) * 2.5);
  }
}
```
(base `GTextarea.css:69-71` y `:80-83`: colores y `outline-color`.)

```css
/* GSelect.css:499-507 — current */
@media (prefers-reduced-motion: reduce) {
  .g-select__control,
  .g-select__arrow {
    transition: none;
  }
  .g-select__loader {
    animation-duration: calc(var(--g-duration-spin) * 2.5);
  }
}
```
(`.g-select__control`: colores y `outline-color`, `:76-78`, `:87-90`. `.g-select__arrow`: `rotate`, `:160` — esa sí es movimiento.)

```css
/* GCheckbox.css:448-462 — current */
@media (prefers-reduced-motion: reduce) {
  .g-checkbox__input,
  .g-checkbox__row,
  .g-checkbox__icon,
  .g-checkbox--layout-card .g-checkbox__row,
  .g-checkbox--layout-chip .g-checkbox__row,
  .g-checkbox--layout-chip .g-checkbox__chip-mark,
  .g-checkbox__box,
  .g-checkbox__mark {
    transition: none;
  }
  .g-checkbox:not(.is-disabled):not(.is-readonly) .g-checkbox__row:active .g-checkbox__box {
    scale: 1;
  }
}
```
(`__input` `:232-237`: colores, `scale`, `outline-color`, `outline-offset` (el anillo «se abre»: movimiento). `__box` `:62`: `scale`. `__mark` `:100`: `clip-path` (trazo del ✓). `__chip-mark` `:397-400`: `inline-size`, `margin-inline-end` (layout) y `opacity`. `__icon` `:167-169`, tarjeta `:288-291`, chip `:357-360`: solo colores y `box-shadow`.)

```css
/* GSwitch.css:370-377 — current */
@media (prefers-reduced-motion: reduce) {
  .g-switch__input,
  .g-switch__input::before,
  .g-switch__mark,
  .g-switch__icon {
    transition: none;
  }
}
```
(`__input` `:284-289`: colores, `scale`, `outline-color`, `outline-offset`. `::before` (pulgar) `:120-122`: `translate` + `background-color`. `__mark` `:145-148`: `translate`, `opacity`, `color`. `__icon` `:180`: `translate`. Y la pulsación `:276-278` **sin** reinicio con `reduce`.)

```css
/* GCard.css:766-773 — current */
@media (prefers-reduced-motion: reduce) {
  .g-card,
  .g-card::before,
  .g-card__tick,
  .g-card__menu,
  .g-card__expand > .g-icon,
  .g-card__more-toggle > .g-icon { transition: none; }
}
```
(`.g-card` `:58-60`, `::before` `:78`, `__tick` `:354`, `__menu` `:279`: solo colores y `box-shadow`. Los iconos `:209`: `rotate`.)

```css
/* GDialog.css:345-350 — current */
@media (prefers-reduced-motion: reduce) {
  .g-dialog__close,
  .g-dialog__footer {
    transition: none;
  }
}
```
(`__close` `:111-115`: colores + `scale`; `:128` `.g-dialog__close:active { scale: var(--g-press-scale); }` sin condición. `__footer` `:195`: `background-color`.)

```css
/* GDatePicker.css:756-762 — current */
@media (prefers-reduced-motion: reduce) {
  .g-datepicker__field,
  .g-datepicker__day,
  .g-datepicker__chip {
    transition: none;
  }
}
```
(todas de color: `:116-118`, `:131-134`, `:422`, `:503`.)

```css
/* GCalendar.css:975-985 — current */
@media (prefers-reduced-motion: reduce) {
  .g-calendar__toolbar button,
  .g-calendar__retry,
  .g-calendar__sheet-close,
  .g-calendar__event {
    transition: none;
  }
  .g-calendar__skeleton > * {
    animation: none;
  }
}
```
(botones `:76-95` y eventos `:378-380`: colores y `box-shadow`.)

```css
/* GWidgetGallery.css:258-261 — current */
@media (prefers-reduced-motion: reduce) {
  .g-widget-gallery__cat > span,
  .g-widget-gallery__btn { transition: none; }
}
/* GWidgetConfig.css:205-208 — current */
@media (prefers-reduced-motion: reduce) {
  .g-widget-config__tabs [role="tab"],
  .g-widget-config__btn { transition: none; }
}
```
(`cat > span` `:101-103` y `tabs [role=tab]` `:106-108`: colores. `__btn` (ambos): `background-color` + `scale`; `:active { scale }` sin condición en `GWidgetGallery.css:248` y `GWidgetConfig.css:175`.)

```css
/* GTabs.css:383-388 — current (los colores de la pestaña solo existen sin movimiento reducido) */
@media (prefers-reduced-motion: no-preference) {
  .g-tabs__tab {
    transition:
      background-color var(--g-duration-fast) var(--g-ease-standard),
      color var(--g-duration-fast) var(--g-ease-standard);
  }
```

```css
/* GSidebar.css:899-902 — current (dentro del bloque reduce de :881) */
  .g-sidebar__sub,
  .g-sidebar__sub.is-open {
    transition: opacity var(--g-duration-fast) linear;
  }
```

Reabre decisiones de coco anotadas en `estilo.md` («Transición … a `0s`» en checkbox, switch, calendar, dialog, select, textarea, tabs y sidebar). Motivo nuevo, el mismo con el que el plan 004 reabrió la de `GStepper`: la regla de AUDIT §6 y los precedentes de `GMenu`, `GToast` y `GSidebar` en el propio repositorio. No hay entradas en DECISIONS.md que lo fijen.

## Target

Regla única para todos: con `reduce`,

- **se conservan**: `background-color`, `border-color`, `color`, `outline-color`, `box-shadow` y `opacity`, con su duración y curva actuales (120 ms `var(--g-duration-fast)`, `var(--g-ease-standard)`);
- **se quitan**: `transform`/`scale`/`translate`/`rotate`, `outline-offset` (apertura del anillo), `clip-path` (trazo del ✓) e `inline-size`/`margin` (ancho del chip);
- **ninguna escala de pulsación** se aplica (`scale: none`/`1`, `transform: none`).

Donde la regla base ya solo tiene colores, la solución es **borrar** el selector del bloque `reduce` (la base sigue aplicando). Donde mezcla color y movimiento, el bloque `reduce` declara la lista solo de color.

## Repo conventions to follow

- Tokens (`packages/vue/src/styles/defaults.css:151-156`): `--g-duration-fast: 120ms`, `--g-duration-press: 160ms`, `--g-duration-spin: 800ms`, `--g-ease-standard: cubic-bezier(0.2, 0, 0, 1)`, `--g-ease-out: cubic-bezier(0.23, 1, 0.32, 1)`, `--g-press-scale: 0.97`. No hay que crear ninguno.
- Exemplar: `packages/vue/src/components/GSidebar/GSidebar.css:881-895` (lista de color en `reduce` y `scale: none` en `:active`).
- Especificidad: el bloque `reduce` va **después** de las reglas base en cada archivo y usa el mismo selector, así que gana por orden. `GCheckbox/estilo.md:35` recuerda que la tarjeta y el chip «seguían animando por menor especificidad»: no cambies selectores salvo lo que dice cada paso.

## Steps

1. **`GBtn.css:271-281`**: sustituye la regla `.g-btn { transition: none; }` por
   ```css
     .g-btn {
       transition:
         background-color var(--g-duration-fast) var(--g-ease-standard),
         border-color var(--g-duration-fast) var(--g-ease-standard),
         color var(--g-duration-fast) var(--g-ease-standard);
     }
   ```
   Deja intactas las reglas de `:active` (`transform: none`) y `.g-btn__loader`.
2. **`GInput.css:409-416`**: borra la regla `.g-input__control { transition: none; }`; deja la de `.g-input__loader`.
3. **`GTextarea.css:294-301`**: borra `.g-textarea__control { transition: none; }`; deja `.g-textarea__loader`.
4. **`GSelect.css:499-507`**: cambia el selector `.g-select__control,\n  .g-select__arrow` por solo `.g-select__arrow` (el giro del chevrón sí se quita). Deja `.g-select__loader`.
5. **`GCheckbox.css:448-462`**: sustituye el bloque entero por
   ```css
   /* Movimiento reducido: sin escala, sin trazo del ✓, sin apertura del anillo ni ancho animado del chip; los fundidos de color se conservan */
   @media (prefers-reduced-motion: reduce) {
     .g-checkbox__input {
       transition:
         background-color var(--g-duration-fast) var(--g-ease-standard),
         border-color var(--g-duration-fast) var(--g-ease-standard),
         outline-color var(--g-duration-fast) var(--g-ease-standard);
     }
     .g-checkbox__box,
     .g-checkbox__mark {
       transition: none;
     }
     .g-checkbox--layout-chip .g-checkbox__chip-mark {
       transition: opacity var(--g-duration-fast) var(--g-ease-standard);
     }
     .g-checkbox:not(.is-disabled):not(.is-readonly) .g-checkbox__row:active .g-checkbox__box {
       scale: 1;
     }
   }
   ```
6. **`GSwitch.css:370-377`**: sustituye el bloque por
   ```css
   /* Movimiento reducido: el pulgar salta (sin desplazamiento ni escala); los fundidos de color y de la marca se conservan */
   @media (prefers-reduced-motion: reduce) {
     .g-switch__input {
       transition:
         background-color var(--g-duration-fast) var(--g-ease-standard),
         border-color var(--g-duration-fast) var(--g-ease-standard),
         outline-color var(--g-duration-fast) var(--g-ease-standard);
     }
     .g-switch__input::before {
       transition: background-color var(--g-duration-fast) var(--g-ease-standard);
     }
     .g-switch__mark {
       transition:
         opacity var(--g-duration-fast) var(--g-ease-standard),
         color var(--g-duration-fast) var(--g-ease-standard);
     }
     .g-switch__icon {
       transition: none;
     }
     .g-switch:not(.is-disabled):not(.is-readonly) .g-switch__row:active .g-switch__input {
       scale: 1;
     }
   }
   ```
7. **`GCard.css:766-773`**: deja solo los iconos que giran:
   ```css
   @media (prefers-reduced-motion: reduce) {
     .g-card__expand > .g-icon,
     .g-card__more-toggle > .g-icon { transition: none; }
   }
   ```
8. **`GDialog.css:345-350`**: sustituye el bloque por
   ```css
   @media (prefers-reduced-motion: reduce) {
     .g-dialog__close {
       transition:
         background-color var(--g-duration-fast) var(--g-ease-standard),
         border-color var(--g-duration-fast) var(--g-ease-standard),
         color var(--g-duration-fast) var(--g-ease-standard);
     }
     .g-dialog__close:active { scale: none; }
   }
   ```
   (`.g-dialog__footer` sale del bloque: solo tiene `background-color`.) El plan 009 añadirá reglas a este mismo bloque.
9. **`GDatePicker.css:756-762`**: borra el bloque entero (las tres reglas son de color). El plan 011 añadirá aquí el bloque del popover.
10. **`GCalendar.css:975-985`**: borra la regla de `transition: none` (los cuatro selectores) y deja solo
    ```css
    @media (prefers-reduced-motion: reduce) {
      .g-calendar__skeleton > * {
        animation: none;
      }
    }
    ```
11. **`GWidgetGallery.css:258-261`** y **`GWidgetConfig.css:205-208`**: sustituye cada bloque por (con el prefijo de su archivo)
    ```css
    @media (prefers-reduced-motion: reduce) {
      .g-widget-gallery__btn { transition: background-color var(--g-duration-fast) var(--g-ease-standard); }
      .g-widget-gallery__btn:active { scale: 1; }
    }
    ```
    y
    ```css
    @media (prefers-reduced-motion: reduce) {
      .g-widget-config__btn { transition: background-color var(--g-duration-fast) var(--g-ease-standard); }
      .g-widget-config__btn:active { scale: 1; }
    }
    ```
12. **`GTabs.css:383-388`**: saca la regla `.g-tabs__tab { transition: … }` del bloque `no-preference` y ponla, igual, **justo antes** de la línea `@media (prefers-reduced-motion: no-preference) {` (con el comentario `/* Color de la pestaña: siempre (no es movimiento) */`). La marca, el giro y la entrada del panel siguen dentro.
13. **`GSidebar.css:899-902`**: sustituye esas cuatro líneas por
    ```css
      .g-sidebar__sub {
        transition: opacity var(--g-duration-fast) linear, visibility 0s linear var(--g-duration-fast);
      }
      .g-sidebar__sub.is-open {
        transition: opacity var(--g-duration-fast) linear, visibility 0s;
      }
    ```
14. **`estilo.md`** (filas de la tabla de verificación; sustituye el texto de la segunda columna):
    - `design/lab/checkbox/estilo.md:35` → `Sin escala, sin trazo del ✓, sin apertura del anillo ni ancho animado del chip; los fundidos de color (120 ms) se conservan; al pulsar, escala 1`
    - `design/lab/switch/estilo.md:34` → `El pulgar y la marca saltan de lado (sin desplazamiento ni escala al pulsar); los fundidos de color del riel, del pulgar y de la marca se conservan`
    - `design/lab/calendar/estilo.md:51` → `Eventos y botones conservan los fundidos de color; el esqueleto deja de pulsar`
    - `design/lab/dialog/estilo.md:38` → `El botón de cierre conserva el fundido de color y no escala al pulsar; la animación de entrada solo existe con \`no-preference\``
    - `design/lab/select/estilo.md:35` → `Sin giro del chevrón; la caja conserva los fundidos de color; el giro del anillo de carga, más lento`
    - `design/lab/textarea/estilo.md:33` → `La caja conserva los fundidos de color; el giro del anillo, más lento`
    - `design/lab/tabs/estilo.md:55` → `Marca sin transición (salta), sin giro, sin entrada del panel; el color de las pestañas se sigue fundiendo (120 ms)`
    - `design/lab/sidebar/estilo.md:79` → `Sin desplazamientos ni escalas; se conservan los fundidos de color y de opacidad (también al cerrar el submenú)`

## Boundaries

- Solo los 14 CSS y las 8 filas de `estilo.md` citados. No toques `.vue`, pruebas, `defaults.css` ni `GStepper`/`GMenu`/`GToast` (ya están bien).
- No cambies las reglas `no-preference` ni las bases, salvo el paso 12 (mover una regla sin cambiarla).
- No añadas transiciones nuevas (p. ej. a la marca de `GTabs` o al pulgar del switch): solo se conserva lo que ya existe.
- Si un bloque no coincide con el citado (deriva desde c9ecab2), detente e informa.

## Verification

- **Mecánica**: `npm test` (sin cambios esperados: no hay pruebas de CSS), `npm run build` y las tres compuertas de CLAUDE.md. `grep -n "transition: none" packages/vue/src/components/{GBtn,GInput,GTextarea,GDatePicker,GCalendar}/*.css` → 0 resultados.
- **Medición (Playwright, `reducedMotion: 'reduce'`, Chromium, Firefox y WebKit; en WebKit headless el reloj no avanza solo: lee `getAnimations()` y avanza `currentTime` a mano)** en `http://localhost:4173/playground/`:
  - Marcar el primer `#sec-checkbox .g-checkbox__input`: `getAnimations()` del input incluye `background-color` y `border-*-color` de 120 ms; el `.g-checkbox__mark` no tiene ninguna.
  - Clic en el primer `#sec-switch .g-switch__input`: hay transición de `background-color` en el input y en `::before` (`getAnimations({ subtree: true })` con `pseudoElement === '::before'`), ninguna de `translate`. Ratón pulsado sobre el riel 50 ms: `getComputedStyle(input).scale` = `1` (hoy `0.97`).
  - Seleccionar la primera tarjeta (`#sec-card input.g-card__select`, `click({ force: true })`): transiciones de `border-*-color` en `.g-card` y de color en `.g-card__tick`.
  - Clic en un botón de paginación (`#sec-table .g-pagination__page`): transiciones de color en el `GBtn`/página.
  - `#sec-tabs [role=tab]` (segunda): transición de `color` en las pestañas; ninguna en `.g-tabs__mark`.
  - Sidebar: abrir y cerrar el primer `.g-sidebar__parent`; en el primer cuadro tras cerrar, `getComputedStyle(sub).visibility` = `visible` y `opacity` < 1; a los 150 ms, `hidden`.
  - Con `no-preference`, todo lo anterior igual que antes (mismas transiciones y duraciones que hoy).
- **Feel check**: DevTools > Rendering > `prefers-reduced-motion: reduce`. Marca checkboxes, switches y chips, selecciona tarjetas, pulsa botones: nada se mueve, encoge ni gira, pero los colores se funden en vez de saltar. Mantén pulsado el switch y el botón de cierre de un diálogo: no encogen.
- **Done when**: con `reduce`, ningún componente de la lista tiene transiciones de `transform`/`scale`/`translate`/`rotate`/`clip-path`/`outline-offset`/`inline-size` ni escala al pulsar, y todos conservan sus fundidos de color de 120 ms; las filas de `estilo.md` dicen lo mismo que el CSS.
