# 006 — Entradas de GStepper: lista desplegada del compacto, contenido del paso (vertical) y check

- **Status**: TODO
- **Dueño**: coco (`GStepper.css`). Sin tokens nuevos.
- **Commit**: 49ad85b
- **Severity**: MEDIUM
- **Category**: Missed opportunities
- **Estimated scope**: 1 archivo, ~35 líneas
- **Depende de**: 005 (bruno añade `is-ready` a la raíz dos cuadros después de montar). Sin `is-ready`, estas reglas animarían todo en la primera pintura: **no ejecutes este plan sin el 005 hecho**. Ejecútalo después de 003 y 004.

## Problem

Tres cosas aparecen de golpe:

1. **«Ver todos los pasos» (compacto).** La lista se monta con `v-if` (`GStepper.vue:247`, `open.value ? renderList(...) : null`). Medido en el stepper estrecho del playground: la raíz pasa de 64 px a 332 px de alto en un cuadro y la lista no tiene ninguna animación (`getAnimations()` vacío, `opacity: 1` desde el primer cuadro). Es el único despliegue de Grana que no explica de dónde sale el contenido (`GTabs` ya funde sus paneles: `GTabs.css:522-534`).
2. **Contenido del paso en vertical.** El slot `content` solo se pinta en el paso actual (`GStepper.vue:221-223`); al avanzar, el bloque viejo desaparece y el nuevo aparece 52 px más abajo en el mismo cuadro.
3. **Número → check.** Al completarse un paso, el número se sustituye por el icono `check` (`GStepper.vue:183`) sin transición: el texto «2» desaparece y el check está entero en el siguiente cuadro.

No hay CSS de entrada para ninguno:

```css
/* packages/vue/src/components/GStepper/GStepper.css:404-407 — current */
.g-stepper__content {
  margin-inline-start: calc(var(--_ind) + var(--_gap));
  padding-block: 0 calc(var(--g-space-4) * var(--_density));
}
```
```css
/* GStepper.css:470 — current */
.g-stepper__compact .g-stepper__list { margin-block-start: var(--_gap); }
```
```css
/* GStepper.css:158-161 — current */
.g-stepper__indicator .g-icon {
  inline-size: calc(var(--_ind) * 0.6);
  block-size: calc(var(--_ind) * 0.6);
}
```

## Target

Entradas con **`@starting-style`** (los tres elementos son nodos nuevos al aparecer), solo con la raíz en `is-ready`, y **solo `opacity` y `translate`/`scale`** (sin layout; la altura cambia de golpe como hasta ahora: animar `block-size` recalcularía el layout en cada cuadro).

| Elemento | Desde | Duración y curva |
| --- | --- | --- |
| Lista desplegada del compacto | `opacity: 0; translate: 0 calc(var(--g-space-1) * -1)` (baja desde el botón) | `--g-duration-press` (160 ms), `--g-ease-out` (`cubic-bezier(0.23, 1, 0.32, 1)`) |
| Contenido del paso (vertical) | `opacity: 0; translate: 0 var(--g-space-1)` (igual que los paneles de `GTabs`) | 160 ms, `--g-ease-out` |
| Icono dentro del indicador (check, alerta, candado) | `opacity: 0; scale: 0.9` (nunca `scale(0)`) | 160 ms, `--g-ease-out` |

- Con `prefers-reduced-motion: reduce`: solo el fundido, `opacity` en `--g-duration-fast` (120 ms) `linear` (como `GMenu.css:217-221`), sin `translate` ni `scale`.
- La salida no se anima (la lista se cierra y el contenido viejo se va en el acto): la respuesta del sistema al cerrar es inmediata.
- Soporte: `@starting-style` en Chromium 117+, Firefox 129+, Safari 17.5+ (comprobado en los tres motores de Playwright). Sin soporte: aparece sin animación, como hoy.
- El eje del `translate` es de bloque (vertical): no cambia con RTL.

## Repo conventions to follow

- Exemplar a imitar (entrada de paneles): `packages/vue/src/components/GTabs/GTabs.css:522-534`:
  ```css
  @media (prefers-reduced-motion: no-preference) {
    .g-tabs__panel {
      transition:
        opacity var(--g-duration-press) var(--g-ease-out),
        translate var(--g-duration-press) var(--g-ease-out);
    }
    @starting-style {
      .g-tabs__panel:not([hidden]) {
        opacity: 0;
        translate: 0 var(--g-space-1);
      }
    }
  ```
- Clase de listo: `GTabs` usa `.g-tabs.is-ready` (`GTabs.css:388`); aquí `.g-stepper.is-ready` (la pone bruno, plan 005).
- Usa las propiedades individuales `translate` y `scale`, no `transform`: el indicador ya usa `transform` para la pulsación y el icono no debe heredar conflictos.

## Steps

1. Al final del bloque `@media (prefers-reduced-motion: no-preference) { … }` (el de la línea 512, tal como lo dejó el plan 004), **dentro** del bloque, añade:
   ```css
     /* Entradas (solo con is-ready: nada se anima al montar ni al elegir el primer tramo) */
     .g-stepper.is-ready .g-stepper__compact > .g-stepper__list,
     .g-stepper.is-ready .g-stepper__content {
       transition:
         opacity var(--g-duration-press) var(--g-ease-out),
         translate var(--g-duration-press) var(--g-ease-out);
     }
     .g-stepper.is-ready .g-stepper__indicator > .g-icon {
       transition:
         opacity var(--g-duration-press) var(--g-ease-out),
         scale var(--g-duration-press) var(--g-ease-out);
     }
     @starting-style {
       .g-stepper.is-ready .g-stepper__compact > .g-stepper__list {
         opacity: 0;
         translate: 0 calc(var(--g-space-1) * -1);
       }
       .g-stepper.is-ready .g-stepper__content {
         opacity: 0;
         translate: 0 var(--g-space-1);
       }
       .g-stepper.is-ready .g-stepper__indicator > .g-icon {
         opacity: 0;
         scale: 0.9;
       }
     }
   ```
   `0.9` es un factor de entrada, no un valor de tema: ya hay precedentes de factores en `@starting-style` (`GMenu.css:226` `scale: 0.96`, `GSidebar.css:382` `scale: 0.6`, `GSidebar.css:568` `scale: 0.96`). No improvises otro valor.
2. Dentro del bloque `@media (prefers-reduced-motion: reduce) { … }` (el que dejó el plan 004), añade:
   ```css
     .g-stepper.is-ready .g-stepper__compact > .g-stepper__list,
     .g-stepper.is-ready .g-stepper__content,
     .g-stepper.is-ready .g-stepper__indicator > .g-icon {
       transition: opacity var(--g-duration-fast) linear;
     }
     @starting-style {
       .g-stepper.is-ready .g-stepper__compact > .g-stepper__list,
       .g-stepper.is-ready .g-stepper__content,
       .g-stepper.is-ready .g-stepper__indicator > .g-icon {
         opacity: 0;
       }
     }
   ```
3. En `design/lab/stepper/estilo.md`, en la tabla «Estados cubiertos», añade una fila tras la de `active`:
   `| entrada | Lista desplegada, contenido del paso e icono del indicador: fundido + desplazamiento de un paso de espacio (o escala 0.9 en el icono), 160 ms \`--g-ease-out\`, solo con \`is-ready\`; con movimiento reducido, solo fundido de 120 ms |`

## Boundaries

- Solo `GStepper.css` y `design/lab/stepper/estilo.md`. No toques el `.vue` (si `is-ready` no existe, DETENTE: falta el plan 005).
- No animes `block-size`, `max-height`, `grid-template-rows` ni `margin`.
- No uses `@keyframes`: deben ser transiciones (se interrumpen sin reiniciar al abrir y cerrar rápido).
- Si el código no coincide con lo citado, DETENTE e informa.

## Verification

- **Mecánica**: `npm test`, `npm run build` y las tres compuertas de CLAUDE.md. `grep -c "@starting-style" packages/vue/src/components/GStepper/GStepper.css` → 2.
- **Medición (Playwright, 3 navegadores; en WebKit, adelantando `currentTime`)**, playground `#sec-stepper`:
  - Recarga y, en el primer cuadro, `document.getAnimations()` no tiene ninguna animación cuyo destino esté dentro de un `.g-stepper` (nada se anima al montar).
  - Stepper estrecho (`aria-label="Registro de cuenta (estrecho)"`): clic en «Ver todos los pasos»; en el mismo turno, la `.g-stepper__compact > .g-stepper__list` tiene transiciones de `opacity` y `translate` de 160 ms; con `currentTime = 0` su `opacity` es `0`. Durante la animación, la altura de la raíz es la final desde el primer cuadro (no hay animación de layout).
  - Stepper vertical: «Siguiente»; el nuevo `.g-stepper__content` tiene `opacity` y `translate` de 160 ms.
  - Stepper de iconos (sin navegación): «Siguiente»; el nuevo `.g-icon` del paso completado tiene `opacity` y `scale` de 160 ms y empieza en `scale: 0.9` (no en 0).
  - Con `reducedMotion: 'reduce'`: las tres solo tienen `opacity`, 120 ms.
- **Feel check**: DevTools > Animations al 10 %: la lista baja un poco desde el botón mientras aparece; el check «se asienta» en el círculo a la vez que este se rellena (plan 004/005), sin rebotar; abrir y cerrar la lista muy rápido no deja la lista a medio fundir.
- **Done when**: las tres entradas existen solo con `is-ready`, duran 160 ms (120 ms y solo fundido con `reduce`) y no hay animación al cargar la página.
