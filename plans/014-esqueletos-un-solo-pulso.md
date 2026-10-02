# 014 — Esqueletos de carga: un solo pulso para toda la librería

- **Status**: DONE
- **Dueño**: coco (`GCard.css`, `GWidget.css`, `GCalendar.css` y sus `estilo.md`). Sin tokens nuevos.
- **Commit**: c9ecab2
- **Severity**: LOW
- **Category**: Cohesion & tokens
- **Estimated scope**: 3 archivos CSS (~4 líneas cada uno)
- **Depende de**: nada (si se ejecuta después de 007, el bloque `reduce` de `GCalendar.css` ya solo tiene la regla del esqueleto; no lo toques).

## Problem

Cuatro componentes pintan un esqueleto de carga que «respira», y cada uno con su receta. En una página con una tabla, tarjetas, widgets y un calendario cargando a la vez, pulsan a ritmos distintos:

```css
/* packages/vue/src/components/GTable/GTable.css:224-229 — current (la receta documentada: design/lab/table/estilo.md:19) */
@media (prefers-reduced-motion: no-preference) {
  .g-table.is-loading .g-table__skeleton {
    animation: g-table-pulse calc(var(--g-duration-spin) * 1.5) var(--g-ease-standard) infinite alternate;
  }
}
@keyframes g-table-pulse { to { opacity: 0.45; } }
```
```css
/* GCard.css:693-700 — current */
@media (prefers-reduced-motion: no-preference) {
  .g-card.is-loading :is(.g-card__lead, .g-card__media),
  .g-card.is-loading .g-card__sk::before {
    animation: g-card-pulse calc(var(--g-duration-spin) * 1.75) ease-in-out infinite;
  }
  @keyframes g-card-pulse {
    50% { opacity: 0.5; }
  }
```
```css
/* GWidget.css:248-256 — current */
@media (prefers-reduced-motion: no-preference) {
  .g-widget__line,
  .g-widget__block {
    animation: g-widget-pulse calc(var(--g-duration-spin) * 1.75) ease-in-out infinite;
  }
  @keyframes g-widget-pulse {
    50% { opacity: 0.5; }
  }
}
```
```css
/* GCalendar.css:943-948 — current */
  animation: g-calendar-pulse calc(var(--g-duration-spin) * 2) ease-in-out infinite alternate;
}
@keyframes g-calendar-pulse {
  from { opacity: 0.55; }
  to { opacity: 1; }
}
```

Ciclos completos: tabla 2.4 s, tarjeta y widget 1.4 s, calendario 3.2 s; mínimos de opacidad 0.45, 0.5 y 0.55. Además, `GCard`, `GWidget` y `GCalendar` usan la palabra clave `ease-in-out`, que no es un token (CLAUDE.md: los componentes solo leen `var(--g-*)`). No hay ninguna decisión en DECISIONS.md sobre estos pulsos; la de la tabla está anotada en su `estilo.md`.

## Target

La receta de `GTable` en los cuatro: `animation: <nombre> calc(var(--g-duration-spin) * 1.5) var(--g-ease-standard) infinite alternate;` con `@keyframes <nombre> { to { opacity: 0.45; } }` (1.2 s por sentido, 2.4 s el ciclo; `--g-duration-spin` = 800ms, `--g-ease-standard` = `cubic-bezier(0.2, 0, 0, 1)`). Solo con `prefers-reduced-motion: no-preference` (como ya hacen tabla, tarjeta y widget; el calendario lo consigue con su bloque `reduce`, que se queda).

## Repo conventions to follow

- Exemplar: `GTable.css:224-229` (arriba).
- Los nombres de `@keyframes` llevan el componente (`g-card-pulse`, `g-widget-pulse`, `g-calendar-pulse`): se conservan.

## Steps

1. `GCard.css:696-699`: la línea de `animation` pasa a `animation: g-card-pulse calc(var(--g-duration-spin) * 1.5) var(--g-ease-standard) infinite alternate;` y el `@keyframes g-card-pulse` a `{ to { opacity: 0.45; } }`.
2. `GWidget.css:251-255`: igual con `g-widget-pulse`.
3. `GCalendar.css:943-948`: `animation: g-calendar-pulse calc(var(--g-duration-spin) * 1.5) var(--g-ease-standard) infinite alternate;` y `@keyframes g-calendar-pulse { to { opacity: 0.45; } }`. El bloque `reduce` que pone `animation: none` no cambia.
4. `estilo.md`: donde `card`, `widget` o `calendar` describan el pulso del esqueleto (búscalo con `grep -n -i "puls" design/lab/{card,widget,calendar}/estilo.md`), cambia la descripción por «pulso compartido con `GTable`: `duration-spin × 1.5`, `--g-ease-standard`, ida y vuelta hasta opacidad 0.45». Si no lo describen, no añadas nada.

## Boundaries

- Solo esas tres reglas de animación y sus `@keyframes`. No toques el pulso de carga de `GDialog` (`g-dialog-pulse`: no es un esqueleto, es el velo del inset ocupado) ni el de `GTable` (es la referencia).
- No cambies tonos (`--_sk-tone`, `surface-sunken`, `border-strong`) ni formas.

## Verification

- **Mecánica**: `npm test`, `npm run build`, compuertas de CLAUDE.md. `grep -n "ease-in-out" packages/vue/src/components/{GCard,GWidget,GCalendar}/*.css` → 0 resultados.
- **Medición (Playwright, Chromium)**: pon una tarjeta, un widget y la tabla en carga (en el playground, `#sec-card` tiene una tarjeta `is-loading`; si no, añade la clase `is-loading` con `evaluate` a una `.g-card`, a `.g-table` y renderiza el esqueleto del widget si el playground lo ofrece) y compara `el.getAnimations()[0].effect.getComputedTiming()`: en todas, `duration` = 1200, `direction` = `alternate`, `easing` = `cubic-bezier(0.2, 0, 0, 1)`.
- **Feel check**: con varios esqueletos visibles a la vez, pulsan al mismo ritmo y con la misma profundidad; el pulso no distrae (más lento que antes en tarjeta y widget).
- **Done when**: los cuatro esqueletos comparten duración, curva, dirección y opacidad mínima, sin palabras clave de curva.

## Nota de ejecución

Verificado en Chromium: `g-card-pulse`, `g-widget-pulse` y `g-calendar-pulse` con duración 1200 ms, `alternate`. `estilo.md`: solo `widget` describía el pulso (1.4s); card y calendar no.
