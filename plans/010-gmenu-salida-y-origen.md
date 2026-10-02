# 010 — GMenu: que la salida ya escrita llegue a correr, y que la lista crezca desde el disparador

- **Status**: DONE
- **Dueños**: bruno (pasos 1–4: `GMenu.vue`, `GMenu.test.js`, `src/utils/motion.js`), coco (pasos 5–6: `GMenu.css`, `design/lab/menu/estilo.md`). Sin tokens nuevos.
- **Commit**: c9ecab2
- **Severity**: MEDIUM
- **Category**: Interruptibility (salida) + Physicality & origin
- **Estimated scope**: 4 archivos; ~30 líneas de JS, ~8 de CSS, 2 pruebas nuevas
- **Depende de**: nada. Comparte `src/utils/motion.js` con el plan 009: el primero que se ejecute lo crea. Orden interno: bruno → coco.

## Problem

`GMenu` es el menú de acciones de toda la librería (lo usan `GWidget`, «Agregar filtro» de `GFilterBar` y las acciones de `GCard`/`GTable`): se abre decenas de veces al día.

1. **La salida que coco escribió nunca corre.** El CSS prepara una salida con `overlay` y `display` discretos:
   ```css
   /* packages/vue/src/components/GMenu/GMenu.css:205-221 — current */
   @media (prefers-reduced-motion: no-preference) {
     .g-menu__list {
       transition:
         opacity var(--g-duration-fast) var(--g-ease-out),
         scale var(--g-duration-fast) var(--g-ease-out),
         overlay var(--g-duration-fast) allow-discrete,
         display var(--g-duration-fast) allow-discrete;
     }
     .g-menu__item {
       transition: background-color var(--g-duration-fast) var(--g-ease-standard);
     }
   }
   @media (prefers-reduced-motion: reduce) {
     .g-menu__list {
       scale: none;
       transition: opacity var(--g-duration-fast) linear;
     }
   }
   ```
   pero `GMenu.vue` solo renderiza la lista mientras está abierta, así que al cerrar Vue la **quita del DOM** y no hay nada que animar:
   ```js
   // GMenu.vue:340-354 — current
       if (isOpen) {
         out.push(h('ul', {
           ...attrs,
           ref: listRef,
           id: listId,
           class: cls('g-menu__list', `g-menu__list--density-${props.density}`, attrs.class),
           role: 'menu',
           popover: 'manual',
           'aria-label': props.label || undefined,
           'aria-labelledby': props.label ? undefined : triggerId,
           onKeydown
         }, tree.map((n) => renderNode(n, listId))))
       }
   ```
   Medido (Chromium, Firefox, WebKit; menú de `#sec-menu`, del widget y de «Agregar filtro»): al pulsar Esc, el `ul.g-menu__list` se elimina en el mismo ciclo y `getAnimations()` queda vacío. Entra con fundido y escala en 120 ms y desaparece en un cuadro.

2. **Crece desde la esquina equivocada.** El origen es fijo arriba-inicio:
   ```css
   /* GMenu.css:40-44 — current */
     transform-origin: 0 0;
     opacity: 0;
     scale: 0.96;
   }
   .g-menu__list:dir(rtl) { transform-origin: 100% 0; }
   ```
   pero `placeBlock` (`src/utils/anchor.js:15-24`) alinea la lista al **final** del disparador con `align="end"` y la pone **encima** si abajo no cabe. Medido en el menú del widget (`#sec-widget .g-widget__menu`, `align="end"`, abre hacia arriba): lista en `[592, 27] – [788, 457]`, disparador en `[760, 472] – [792, 504]`, `transform-origin: 0px 0px`: la lista escala desde su esquina superior izquierda, la más lejana del botón (AUDIT §3: los popovers crecen desde su disparador).

## Target

- **Salida**: al cerrar, la lista se oculta (`hidePopover()`), queda montada e `inert` mientras dura su transición calculada (120 ms `var(--g-duration-fast)`, `var(--g-ease-out)`: opacidad a 0 y escala a 0.96 que ya define el CSS; con `reduce`, solo opacidad 120 ms `linear`) y después se desmonta. Si la duración calculada es 0 (jsdom, navegador sin transiciones), se desmonta en el mismo ciclo: las pruebas actuales no cambian. Reabrir durante la salida cancela el desmontaje y la lista vuelve desde donde está.
- Los **submenús** siguen desmontándose al instante (se abren y cierran al pasar el puntero: animar su salida añadiría ruido a un gesto frecuente).
- `closed` se sigue emitiendo como hoy (al empezar a cerrar: «la lista ya se ocultó» del contrato `design/contracts/menu.md:89`, no se toca).
- **Origen**: la esquina de la lista más cercana al disparador. bruno escribe en cada lista (raíz y submenús) `data-side` (`bottom` si la lista queda debajo del ancla, `top` si encima) y `data-align` (`left` si su borde izquierdo físico está alineado con el del ancla o la lista se abre hacia la derecha, `right` en el caso contrario); coco traduce a `transform-origin`: `bottom`+`left` → `0 0`; `bottom`+`right` → `100% 0`; `top`+`left` → `0 100%`; `top`+`right` → `100% 100%`. Son coordenadas físicas, así que valen en RTL sin `:dir()`.

## Repo conventions to follow

- Exemplar de retirada por tiempo calculado (DECISIONS.md #149): `packages/vue/src/components/GToast/GToaster.vue:164-173` (`transitionMs`) y `:186-197`.
- `GMenu` ya escribe variables de posición en `place()` (`GMenu.vue:94-108`, `menu.style.setProperty('--_x', …)`): los `data-*` van ahí mismo.
- Pruebas: `GMenu.test.js` simula `showPopover`/`hidePopover` (`:7-8`); 32 pruebas que esperan que la lista desaparezca al cerrar (p. ej. `:59`, `:91`, `:230`) siguen valiendo porque en jsdom la duración es 0.
- Tokens (`defaults.css:151-156`): `--g-duration-fast: 120ms`, `--g-ease-out: cubic-bezier(0.23, 1, 0.32, 1)`.

## Steps

### bruno

1. Si no existe, crea `packages/vue/src/utils/motion.js` con `transitionMs(el)` exactamente como en el plan 009, paso 3 (copia de `GToaster.vue:164-173` con la guarda `if (!el || typeof getComputedStyle !== 'function') return 0`).
2. `GMenu.vue`:
   - Importa `import { transitionMs } from '../../utils/motion.js'`.
   - Tras `const listId = \`${rootId}-list\`` añade:
     ```js
         // Salida: la lista oculta sigue montada (e inerte) lo que dura su transición calculada; 0 → se desmonta ya
         const leaving = ref(false)
         let leaveTimer = null
         watch(() => props.modelValue, (isOpen) => {
           clearTimeout(leaveTimer)
           leaveTimer = null
           if (isOpen) { leaving.value = false; return }
           const el = listRef.value
           if (!el) return
           if (typeof el.hidePopover === 'function' && el.matches?.(':popover-open')) el.hidePopover()
           const ms = transitionMs(el)
           if (ms <= 0) { leaving.value = false; return }
           leaving.value = true
           leaveTimer = setTimeout(() => { leaveTimer = null; leaving.value = false }, ms)
         }, { flush: 'pre' })
     ```
     (`flush: 'pre'`: corre antes del render, mientras la lista abierta aún está en el DOM.)
   - En `onBeforeUnmount` (`:186`) añade `clearTimeout(leaveTimer)`.
   - En el render (`:340-354`): cambia `if (isOpen) {` por `if (isOpen || leaving.value) {` y añade a las props del `ul` raíz `inert: isOpen ? undefined : true`.
   - En `place()` (`:94-108`), tras calcular `{ x, y, room }` y antes de escribir `--_x`, añade:
     ```js
           const side = sub ? 'bottom' : (y >= a.bottom ? 'bottom' : 'top')
           const align = sub
             ? (x >= a.left ? 'left' : 'right')
             : (Math.abs(x - a.left) <= Math.abs(x + opts.width - a.right) ? 'left' : 'right')
           menu.dataset.side = side
           menu.dataset.align = align
     ```
3. Comprueba que la reapertura durante la salida funciona sin cambios en el `watch` de `:162-182`: con `isOpen` true, `placeAll()` llama a `showPopover()` porque la lista no está `:popover-open`, y la transición se revierte desde el valor actual. Si no, detente e informa.
4. `GMenu.test.js`: añade
   - «con transición de salida, la lista sigue montada e inerte hasta que termina»: `vi.useFakeTimers()`; espía `window.getComputedStyle` para devolver `transitionDuration: '0.12s'`, `transitionDelay: '0s'` en elementos `UL` (resto, el real); abre, cierra (`setProps({ modelValue: false })`), espera `nextTick`: la lista existe y tiene el atributo `inert`; `vi.advanceTimersByTime(120)` + `nextTick`: no existe. Restaura temporizadores.
   - «escribe data-side y data-align»: abre con `align: 'end'`; tras `nextTick`, la lista tiene `data-side` (`bottom` o `top`) y `data-align` (`left` o `right`); con el `getBoundingClientRect` del disparador simulado (`{ left: 300, right: 340, top: 500, bottom: 530 }`), `innerHeight` 600 y `offsetWidth`/`scrollHeight` de la lista simulados a 200/300, espera `data-side="top"` y `data-align="right"`. Si simular medidas en jsdom resulta frágil, deja solo la primera aserción (atributos presentes) y dilo en la nota de ejecución.

### coco

5. `GMenu.css:40-44`: sustituye `.g-menu__list:dir(rtl) { transform-origin: 100% 0; }` por
   ```css
   /* Origen: la esquina más cercana al disparador (bruno escribe data-side y data-align en coordenadas físicas) */
   .g-menu__list[data-align="right"] { transform-origin: 100% 0; }
   .g-menu__list[data-side="top"] { transform-origin: 0 100%; }
   .g-menu__list[data-side="top"][data-align="right"] { transform-origin: 100% 100%; }
   /* Sin posición escrita todavía (SSR o antes de medir): inicio de línea */
   .g-menu__list:dir(rtl):not([data-align]) { transform-origin: 100% 0; }
   ```
   (La base `transform-origin: 0 0` de `:40` se queda.)
6. `design/lab/menu/estilo.md:12`: en la frase «entra con un fundido y una escala de 0.96 desde su esquina de inicio (espejada en RTL)», cambia «desde su esquina de inicio (espejada en RTL)» por «desde la esquina más cercana al disparador (`data-side`/`data-align`, físicas) y sale igual en 120 ms, montada e inerte hasta terminar».

## Boundaries

- Solo `GMenu.vue`, `GMenu.test.js`, `src/utils/motion.js`, `GMenu.css` y `design/lab/menu/estilo.md`. No toques `anchor.js` (sus funciones son puras y ya devuelven lo necesario), ni `GWidget`/`GFilterBar`/`GCard`, que usan `GMenu` tal cual.
- No cambies duraciones, curvas ni la escala 0.96: ya son las correctas para un menú (120 ms, `--g-ease-out`).
- No animes la salida de submenús.
- Si alguna de las 32 pruebas existentes falla, detente e informa.

## Verification

- **Mecánica**: `npm test` (pruebas nuevas en verde, las 32 existentes intactas), `npm run build`, compuertas de CLAUDE.md.
- **Medición (Playwright)**:
  - Chromium, `#sec-menu` («Acciones»): tras abrir y pulsar Esc, en el primer cuadro el `ul.g-menu__list` sigue en el DOM con `inert`, `getAnimations()` incluye `opacity` y `scale` de 120 ms; a los 200 ms ya no existe. Con `reducedMotion: 'reduce'`: solo `opacity` 120 ms.
  - Menú del widget (`#sec-widget .g-widget__menu`, abre arriba y al final): `getComputedStyle(lista).transformOrigin` = `<ancho>px <alto>px` (esquina inferior derecha); menú de `#sec-menu` (abre abajo, al inicio): `0px 0px`. Con `document.dir = 'rtl'` y `align="start"`, la lista se alinea a la derecha del disparador y el origen es la esquina superior derecha.
  - Reabrir durante la salida (Esc y clic en el disparador a los 50 ms): la lista no salta a opacidad 0; `getAnimations()` muestra transiciones que parten del valor actual.
  - Firefox y WebKit (sin `overlay`; en WebKit, `currentTime` manual): al cerrar, la lista desaparece al instante como hoy, sin verse fuera de sitio, y se desmonta a los ~120 ms. El origen es el mismo que en Chromium.
- **Feel check**: DevTools > Animations al 10 %: el menú del widget nace del botón «⋯» (abajo a la derecha) y vuelve hacia él al cerrarse; abrir y cerrar rápido no parpadea. Con teclado (Enter, Esc, Enter) se siente inmediato: la salida dura 120 ms y no bloquea el foco, que vuelve al disparador al momento.
- **Done when**: la salida de 120 ms corre en Chromium en los tres menús del playground, la lista crece y se recoge desde la esquina del disparador en todas las posiciones y en RTL, y no cambia nada en Firefox/WebKit salvo el origen.

## Nota de ejecución

- El bloque `reduce` de `GMenu.css` no tenía `overlay`/`display` discretos, así que con movimiento reducido la lista se ocultaba en el primer cuadro y la salida solo de opacidad (Target) no corría; se añadieron las dos transiciones discretas a ese bloque (mínimo cambio, mismo patrón que el bloque `no-preference`).
- Pruebas: 2 nuevas en `GMenu.test.js` (`data-side`/`data-align` solo comprueba presencia y valores válidos; la simulación de medidas en jsdom se dejó fuera). `getComputedStyle` se simula con un `Proxy` sobre el real.
- Verificado con Playwright: Chromium con `no-preference` (salida 120 ms con `opacity`/`scale`, `inert`, desmontada a 250 ms; reabrir no rompe), Firefox y WebKit (desmonta, origen correcto). Origen del menú del widget: `200px 369.75px` (esquina inferior derecha).
