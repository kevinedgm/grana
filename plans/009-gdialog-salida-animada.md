# 009 — GDialog: salida animada (y entrada por transición), fundido con movimiento reducido

- **Status**: DONE — confirmado por el usuario en el chat; decisión #152
- **Dueños**: lima (pasos 1–2: `design/contracts/dialog.md`, `DECISIONS.md`), bruno (pasos 3–7: `GDialog.vue`, `GDialog.test.js`, `src/utils/motion.js`, `GHelper.vue`, `GFilterBar.vue`), coco (pasos 8–10: `GDialog.css`, `design/lab/dialog/estilo.md`). Sin tokens nuevos.
- **Commit**: c9ecab2
- **Severity**: MEDIUM
- **Category**: Missed opportunity / Cohesion + Accessibility
- **Estimated scope**: 8 archivos; ~40 líneas de JS, ~50 de CSS, 2 pruebas nuevas
- **Depende de**: 007 (deja el bloque `reduce` de `GDialog.css` con las reglas del botón de cierre, que este plan amplía). Orden interno: lima → bruno → coco (el CSS de salida sin el paso de bruno mostraría una carcasa vacía).

## Problem

1. **La salida desaparece en un cuadro.** Medido (Chromium, Firefox, WebKit) en `#sec-dialog` («Simple»): tras Esc, en el primer cuadro el `<dialog>` ya tiene `display: none` y `getAnimations()` está vacío. La entrada sí se anima (keyframes de 160 ms):
   ```css
   /* packages/vue/src/components/GDialog/GDialog.css:316-344 — current */
   @media (prefers-reduced-motion: no-preference) {
     .g-dialog[open] {
       animation: g-dialog-in var(--g-duration-press) var(--g-ease-out);
     }
     .g-dialog[open]::backdrop {
       animation: g-dialog-fade var(--g-duration-press) var(--g-ease-out);
     }
     .g-dialog.is-loading .g-dialog__inset::before,
     .g-dialog:not(.g-dialog--inset).is-loading::after {
       animation: g-dialog-pulse var(--g-duration-spin) var(--g-ease-standard) infinite alternate;
     }
     @keyframes g-dialog-in {
       from { opacity: 0; translate: 0 var(--g-space-2); scale: var(--g-press-scale); }
     }
     @media (min-width: 521px) {
       .g-dialog--placement-end[open]:not(.g-dialog--fullscreen) {
         animation-name: g-dialog-in-end;
       }
     }
     @keyframes g-dialog-in-end {
       from { opacity: 0; translate: calc(var(--_dir) * var(--g-space-8)) 0; }
     }
     @keyframes g-dialog-fade {
       from { opacity: 0; }
     }
     @keyframes g-dialog-pulse {
       from { opacity: 0.35; }
     }
   }
   ```
   La hoja lateral (`placement="end"`, la usan `GWidgetGallery` y `GWidgetConfig`) entra deslizándose desde el borde y al cerrar se esfuma sin más; el drawer de `GSidebar`, que es el mismo gesto, **sí** sale deslizándose (DECISIONS.md #71: «el drawer y el panel se animan al cerrar»; medido en Chromium: transiciones de `translate`, `opacity`, `overlay` y `display` al cerrar).

2. **La salida no se puede animar solo con CSS porque el contenido se desmonta antes de cerrar.** `GDialog.vue:232` monta el contenido con `<template v-if="modelValue">` y el cierre nativo (`el.close()`) ocurre en un `watch` con `flush: 'post'` (`GDialog.vue:53-64`), así que cuando el `<dialog>` empieza a salir ya está vacío (medido: al cerrar se eliminan `g-dialog__header`, `g-dialog__body` y `g-dialog__footer` en el mismo ciclo).
   ```js
   // GDialog.vue:53-71 — current
   function sync() {
     const el = dialog.value
     if (!el) return
     if (props.modelValue && !el.open) {
       el.showModal()
       emit('open')
       nextTick(measure)
     } else if (!props.modelValue && el.open) {
       el.close()
     }
   }
   onMounted(sync)
   watch(() => props.modelValue, sync, { flush: 'post' })

   // Cierre nativo (p. ej. un <form method="dialog"> dentro, o la segunda pulsación de Esc en Chromium):
   // el prop sigue siendo la fuente de verdad, así que se pide el cambio.
   function onNativeClose() {
     emit('closed')
     if (props.modelValue) emit('update:modelValue', false)
   }
   ```
   Dos consumidores internos además condicionan su propio slot al estado abierto, así que también se vaciarían durante la salida: `GHelper.vue:240` (`default: () => (isOpen.value && sheet ? renderContent() : null)`) y `GFilterBar.vue:271-272` (`ed && ed.presentation === 'sheet' ? … : null`).

3. **Con movimiento reducido no hay ni fundido**: la entrada solo existe con `no-preference`, así que con `reduce` el diálogo y el fondo aparecen y desaparecen de golpe (medido: 0 animaciones al abrir). AUDIT §6: conservar la opacidad.

**Decisión que se reabre**: `design/lab/dialog/estilo.md:17` («… Sin salida animada»), de coco, sin entrada en DECISIONS.md. Motivo nuevo: coherencia con la decisión #71 (el drawer de `GSidebar`, mismo `<dialog>`, sale animado), la hoja lateral de los widgets que entra deslizándose pero no sale, y que la técnica (`overlay`/`display` con `allow-discrete`) ya está probada en el repositorio. Pide confirmación al usuario antes de ejecutar.

## Target

- **Entrada** (sin cambios de valores, pero como transición desde `@starting-style` para que una apertura a mitad de una salida se revierta desde donde está): `opacity` 0 → 1, `translate` `0 var(--g-space-2)` → 0 y `scale` `var(--g-press-scale)` → 1, en **160 ms** `var(--g-duration-press)` con `var(--g-ease-out)` (`cubic-bezier(0.23, 1, 0.32, 1)`). Fondo: `opacity` 0 → 1, igual.
  - Hoja lateral (`placement="end"`, ≥ 521px): desde `translate: calc(var(--_dir) * var(--g-space-8)) 0` y `opacity: 0` (como hoy).
  - Hoja inferior móvil (`mobile="sheet"`, ≤ 520px): desde `translate: 0 var(--g-space-6)` y `opacity: 0`, sin escala (igual que las hojas de `GSelect.css:493-495` y `GDatePicker.css:749-751`).
- **Salida**: más corta y sutil que la entrada: **120 ms** `var(--g-duration-fast)` con `var(--g-ease-out)`; el centrado vuelve a `opacity: 0` y `scale: var(--g-press-scale)` (sin desplazamiento); la hoja lateral vuelve a su borde; la hoja inferior baja `var(--g-space-6)`. El fondo se funde en 120 ms. `overlay` y `display` con `allow-discrete` mantienen el diálogo en la capa superior mientras sale. Sin soporte de `overlay` (Firefox y Safari hoy), el diálogo sale de la capa superior al instante: cierra sin animación, como ahora (comprobado con el drawer de `GSidebar`: en Firefox y WebKit queda `display: none` al momento, sin saltos).
- **Movimiento reducido**: solo `opacity` (diálogo y fondo), 120 ms `linear`, al entrar y al salir (patrón de `GSidebar.css:906-923`).
- **Contenido**: se desmonta **al terminar la salida**, no al empezarla; `closed` se emite en ese momento (antes el formulario se vaciaría mientras aún se ve). Si se vuelve a abrir durante la salida, se cancela el desmontaje y el diálogo vuelve desde donde está (no se emite `closed` de esa salida abortada).
- La duración de la salida se lee del estilo calculado del `<dialog>` al cerrar (suma máxima de `transition-duration` + `transition-delay`), nunca un literal. Si es 0 (jsdom, navegador sin transiciones), se desmonta en el mismo ciclo: las pruebas actuales no cambian.

## Repo conventions to follow

- Exemplar de salida de un `<dialog>` con transiciones, `@starting-style` y `allow-discrete`: `packages/vue/src/components/GSidebar/GSidebar.css:799-863` (drawer) y su bloque `reduce` `:906-923`.
- Exemplar de «retirada por tiempo fijo según la transición calculada» (DECISIONS.md #149): `packages/vue/src/components/GToast/GToaster.vue:164-173` (`transitionMs`) y `:186-197` (`leave`).
- Tokens (`defaults.css:151-156`): `--g-duration-fast: 120ms`, `--g-duration-press: 160ms`, `--g-ease-out: cubic-bezier(0.23, 1, 0.32, 1)`, `--g-press-scale: 0.97`.
- Avisos y guardas: `typeof window !== 'undefined'`, nunca `import.meta.env.DEV` (CLAUDE.md). El `.vue` no lleva `<style>`.

## Steps

### lima

1. `design/contracts/dialog.md:81`: cambia la frase por `- El **contenido se monta al abrir y se desmonta al terminar la salida** (un formulario no conserva su estado entre aperturas; durante la salida, unos 120 ms, sigue visible e inerte). La raíz \`<dialog>\` siempre está en el DOM.` Y en la tabla de eventos (`:92`), la fila de `closed`: `| \`closed\` | | El diálogo terminó de cerrarse (salida terminada y contenido desmontado), por el motivo que sea. Si se reabre durante la salida, no se emite |`.
2. `DECISIONS.md`: añade una fila con el siguiente número libre: `| N | **Salida de \`GDialog\`**: transiciones con \`@starting-style\` y \`overlay\`/\`display\` discretos (como el drawer de #71); salida de \`--g-duration-fast\` más sutil que la entrada; el contenido se desmonta y \`closed\` se emite al terminar la salida (duración leída del estilo calculado, como #149); con movimiento reducido, solo fundido | Coherencia con #71 y con la hoja lateral de los widgets; plan 009 | Sin salida animada (estilo de coco); desmontar al empezar |`.

### bruno

3. Crea `packages/vue/src/utils/motion.js` (si ya existe por el plan 010, reutilízalo):
   ```js
   // Movimiento (interno; dueño: bruno). Duración total de las transiciones calculadas de un elemento, en ms:
   // máximo de duración + retardo de su lista. 0 sin transiciones o sin getComputedStyle (jsdom, SSR).
   export function transitionMs(el) {
     if (!el || typeof getComputedStyle !== 'function') return 0
     const cs = getComputedStyle(el)
     const list = (v) => String(v || '').split(',').map((x) => {
       const n = parseFloat(x)
       return Number.isFinite(n) ? (x.trim().endsWith('ms') ? n : n * 1000) : 0
     })
     const d = list(cs.transitionDuration)
     const dl = list(cs.transitionDelay)
     return d.reduce((m, v, i) => Math.max(m, v + (dl[i % dl.length] || 0)), 0)
   }
   ```
   (Copia exacta de `GToaster.vue:164-173` con la guarda añadida; no cambies `GToaster.vue` en este plan.)
4. `GDialog.vue`:
   - Importa `import { transitionMs } from '../../utils/motion.js'`.
   - Tras `const body = ref(null)` añade:
     ```js
     // El contenido sigue montado durante la salida; se desmonta (y se emite closed) al terminar
     const rendered = ref(props.modelValue)
     let leaveTimer = null
     function finishLeave() {
       leaveTimer = null
       rendered.value = false
       emit('closed')
     }
     ```
   - Sustituye `sync` y `onNativeClose` (`:53-71`) por:
     ```js
     function sync() {
       const el = dialog.value
       if (!el) return
       if (props.modelValue) {
         if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null }
         rendered.value = true
         if (!el.open) {
           el.showModal()
           emit('open')
           nextTick(measure)
         }
       } else if (el.open) {
         el.close()
       }
     }
     onMounted(sync)
     watch(() => props.modelValue, sync, { flush: 'post' })

     // Cierre nativo (también el que provoca sync): el prop sigue siendo la fuente de verdad, así que se pide el cambio;
     // el contenido se desmonta cuando termina la transición de salida calculada (0 → en este mismo ciclo).
     function onNativeClose() {
       if (props.modelValue) emit('update:modelValue', false)
       const ms = transitionMs(dialog.value)
       if (ms > 0) leaveTimer = setTimeout(finishLeave, ms)
       else finishLeave()
     }
     ```
   - En `onBeforeUnmount` (`:161-165`) añade `clearTimeout(leaveTimer)` como primera línea.
   - En la plantilla (`:232`) cambia `<template v-if="modelValue">` por `<template v-if="rendered">`.
   - Durante la salida el `<dialog>` ya no es modal ni recibe foco; no hace falta `inert` (sin `open` el navegador no lo expone). Comprueba en la verificación que el foco vuelve al disparador como antes.
5. `GHelper.vue:240`: en el slot `default` del `GDialog` de la hoja, cambia `isOpen.value && sheet ? renderContent() : null` por `sheet ? renderContent() : null` (`presentation` sigue en `'sheet'` hasta la siguiente apertura, y `GDialog` ya no monta el slot cuando está cerrado).
6. `GFilterBar.vue`: que la hoja conserve su contenido durante la salida. `editorBody` (`:166-167`) solo usa `editing.value.key`; los borradores (`draftRaw`, `draftOp`, `draftError`) siguen vivos tras cerrar, y `editorActions` (`:219`) no depende de `editing`.
   - Junto a `const editing = ref(null)` (`:44`) añade
     ```js
         // Clave del último editor presentado como hoja: la hoja la sigue pintando durante su salida (GDialog, plan 009)
         const sheetKey = ref(null)
         watch(editing, (ed) => { if (ed && ed.presentation === 'sheet') sheetKey.value = ed.key })
     ```
     (añade `watch` al import de `vue` si falta).
   - Cambia la firma de `editorBody` (`:166-167`) a `const editorBody = (key = editing.value.key) => {` y su primera línea a `const field = fieldOf(key)`.
   - En los slots del `GDialog` de la hoja (`:271-272`) sustituye la condición `ed && ed.presentation === 'sheet'` por `sheetKey.value !== null` y llama `editorBody(sheetKey.value)`; añade al objeto de props del `GDialog` `onClosed: () => { sheetKey.value = null }`.
   - El popover (`:263-264`) no cambia.
7. `GDialog.test.js`: añade dos pruebas (las existentes no cambian: en jsdom `transitionMs` es 0):
   ```js
   it('con transición de salida, el contenido sigue montado hasta que termina y entonces emite closed', async () => {
     vi.useFakeTimers()
     const real = window.getComputedStyle
     vi.spyOn(window, 'getComputedStyle').mockImplementation((el, p) => {
       const cs = real(el, p)
       return el.tagName === 'DIALOG' ? Object.assign(Object.create(cs), { transitionDuration: '0.12s', transitionDelay: '0s' }) : cs
     })
     const w = mountOpen({ modelValue: true }, { slots: { default: '<p id="c">x</p>' } })
     await w.setProps({ modelValue: false })
     expect(dlg(w).open).toBe(false)
     expect(w.find('#c').exists()).toBe(true)
     expect(w.emitted('closed')).toBeFalsy()
     vi.advanceTimersByTime(120)
     await nextTick()
     expect(w.find('#c').exists()).toBe(false)
     expect(w.emitted('closed')).toBeTruthy()
     vi.useRealTimers()
     w.unmount()
   })
   it('reabrir durante la salida conserva el contenido y no emite closed', async () => {
     /* mismo espía y temporizadores; cerrar, avanzar 60 ms, setProps({ modelValue: true }), avanzar 200 ms:
        dlg(w).open === true, #c existe, emitted('closed') falsy */
   })
   ```
   Escribe la segunda completa siguiendo la primera. Usa los helpers `mountOpen` y `dlg` que ya hay en el archivo.

### coco

8. `GDialog.css:316-344`: sustituye el bloque `no-preference` por:
   ```css
   /* ---------- Movimiento ---------- */
   /* Entrada y salida con transiciones: abrir parte del estado cerrado (@starting-style) y cerrar vuelve a él, así una
      apertura a mitad de la salida se revierte desde donde está. `overlay` y `display` discretos mantienen el diálogo
      en la capa superior mientras sale; sin soporte, cierra al instante. La salida es más corta que la entrada. */
   .g-dialog,
   .g-dialog::backdrop {
     opacity: 0;
   }
   .g-dialog[open],
   .g-dialog[open]::backdrop {
     opacity: 1;
   }
   @media (prefers-reduced-motion: no-preference) {
     .g-dialog {
       scale: var(--g-press-scale);
       transition:
         opacity var(--g-duration-fast) var(--g-ease-out),
         scale var(--g-duration-fast) var(--g-ease-out),
         translate var(--g-duration-fast) var(--g-ease-out),
         overlay var(--g-duration-fast) allow-discrete,
         display var(--g-duration-fast) allow-discrete;
     }
     .g-dialog[open] {
       scale: 1;
       translate: 0 0;
       transition:
         opacity var(--g-duration-press) var(--g-ease-out),
         scale var(--g-duration-press) var(--g-ease-out),
         translate var(--g-duration-press) var(--g-ease-out),
         overlay var(--g-duration-press) allow-discrete,
         display var(--g-duration-press) allow-discrete;
     }
     .g-dialog::backdrop {
       transition:
         opacity var(--g-duration-fast) var(--g-ease-out),
         overlay var(--g-duration-fast) allow-discrete,
         display var(--g-duration-fast) allow-discrete;
     }
     .g-dialog[open]::backdrop {
       transition:
         opacity var(--g-duration-press) var(--g-ease-out),
         overlay var(--g-duration-press) allow-discrete,
         display var(--g-duration-press) allow-discrete;
     }
     @starting-style {
       .g-dialog[open] { opacity: 0; translate: 0 var(--g-space-2); scale: var(--g-press-scale); }
       .g-dialog[open]::backdrop { opacity: 0; }
     }
     @media (min-width: 521px) {
       .g-dialog--placement-end:not(.g-dialog--fullscreen) {
         scale: 1;
         translate: calc(var(--_dir) * var(--g-space-8)) 0;
       }
       .g-dialog--placement-end[open]:not(.g-dialog--fullscreen) {
         translate: 0 0;
       }
       @starting-style {
         .g-dialog--placement-end[open]:not(.g-dialog--fullscreen) {
           opacity: 0;
           scale: 1;
           translate: calc(var(--_dir) * var(--g-space-8)) 0;
         }
       }
     }
     @media (max-width: 520px) {
       .g-dialog--mobile-sheet:not(.g-dialog--fullscreen) {
         scale: 1;
         translate: 0 var(--g-space-6);
       }
       .g-dialog--mobile-sheet[open]:not(.g-dialog--fullscreen) {
         translate: 0 0;
       }
       @starting-style {
         .g-dialog--mobile-sheet[open]:not(.g-dialog--fullscreen) {
           opacity: 0;
           scale: 1;
           translate: 0 var(--g-space-6);
         }
       }
     }
     .g-dialog.is-loading .g-dialog__inset::before,
     .g-dialog:not(.g-dialog--inset).is-loading::after {
       animation: g-dialog-pulse var(--g-duration-spin) var(--g-ease-standard) infinite alternate;
     }
     @keyframes g-dialog-pulse {
       from { opacity: 0.35; }
     }
   }
   ```
   (Los `@keyframes g-dialog-in`, `g-dialog-in-end` y `g-dialog-fade` desaparecen.) Comprueba que `--_dir` sigue definido en `GDialog.css:255-268` (lo usa la hoja lateral).
9. `GDialog.css`, bloque `reduce` (el que dejó el plan 007): añade al final, dentro del bloque:
   ```css
     .g-dialog,
     .g-dialog::backdrop {
       transition:
         opacity var(--g-duration-fast) linear,
         overlay var(--g-duration-fast) allow-discrete,
         display var(--g-duration-fast) allow-discrete;
     }
     @starting-style {
       .g-dialog[open],
       .g-dialog[open]::backdrop { opacity: 0; }
     }
   ```
10. `design/lab/dialog/estilo.md:17`: sustituye la segunda columna por `Entra desde \`@starting-style\` con \`opacity\`, un desplazamiento de \`--g-space-2\` y \`--g-press-scale\` (hoja lateral: desde su borde; hoja móvil: \`--g-space-6\` desde abajo), en \`--g-duration-press\` con \`--g-ease-out\`; **sale** en \`--g-duration-fast\` hacia \`--g-press-scale\` y opacidad 0 (la hoja, hacia su borde); el fondo se funde en ambos sentidos. Con movimiento reducido, solo fundido de 120 ms. Sin \`overlay\` (Firefox, Safari) cierra al instante` y la fila 38 (si el 007 ya la cambió) añádele `; diálogo y fondo se funden (120 ms) al entrar y al salir`.

## Boundaries

- Solo los archivos listados, cada uno por su dueño. No toques `GSidebar`, `GToaster.vue` (salvo leerlo), `GWidgetGallery`/`GWidgetConfig` (heredan el CSS de `GDialog`) ni el pulso de carga.
- No cambies cuándo se emiten `open`, `dismiss` ni `update:modelValue`.
- No uses `transitionend`/`animationend` para desmontar (DECISIONS.md #149: tiempo fijo calculado).
- Si alguna prueba existente de `GDialog`, `GHelper`, `GFilterBar` o `GWidget*` falla, detente e informa: no la reescribas para que pase.

## Verification

- **Mecánica**: `npm test` (las 2 pruebas nuevas en verde; ninguna existente cambia), `npm run build`, compuertas de CLAUDE.md.
- **Medición (Playwright)** en `#sec-dialog` («Simple»), `#sec-widget` («Añadir widget», hoja lateral) y con `viewport: { width: 400, height: 800 }` (hoja inferior):
  - Chromium, `no-preference`: al pulsar Esc, en el primer cuadro el `<dialog>` tiene `open === false`, `display` ≠ `none`, el contenido (`.g-dialog__body`) sigue en el DOM y `getAnimations()` incluye `opacity`, `scale` (o `translate` en las hojas), `overlay` y `display` de 120 ms; a los 200 ms, `display: none`, contenido desmontado y `closed` emitido una vez.
  - Entrada: al abrir, transiciones (no `CSSAnimation`) de `opacity`/`scale`/`translate` de 160 ms; el `::backdrop` con `opacity` 160 ms.
  - Reabrir durante la salida (Esc y, a los 50 ms, clic en «Simple»): no hay salto a opacidad 0; vuelve desde el valor actual.
  - `reducedMotion: 'reduce'`: al abrir y cerrar, solo transiciones de `opacity` (120 ms) en diálogo y fondo; ninguna de `scale`/`translate`.
  - Firefox y WebKit (en WebKit, `currentTime` manual): la entrada se anima; al cerrar, el diálogo queda oculto en el primer cuadro sin aparecer fuera de sitio (sin capa superior no debe verse en el flujo); el contenido se desmonta a los ~120 ms; `closed` llega una vez.
  - `GHelper` adaptable (`#sec-helper`, visor de 400 px) y la hoja de `GFilterBar` (visor de 400 px, chip «Estado»): al cerrar, la hoja baja y se funde **con su contenido** (no se ve vacía).
- **Feel check**: DevTools > Animations al 10 %: el diálogo centrado se encoge un poco y se desvanece; la hoja lateral vuelve hacia su borde; la salida se siente más rápida que la entrada. El foco vuelve al botón que abrió el diálogo. Rendering > `prefers-reduced-motion: reduce`: solo fundidos.
- **Done when**: en Chromium el diálogo, el fondo, la hoja lateral y la hoja móvil salen animados en 120 ms con su contenido; en Firefox y WebKit cierran como hoy sin defectos; con `reduce` se funden; `closed` se emite al terminar la salida; contrato, DECISIONS y `estilo.md` lo dicen.

## Nota de ejecución

- Ejecutado tal cual (commits de lima, bruno y coco). Añadido: en `GFilterBar` el título de la hoja también usa `sheetKey` durante la salida (si no, cambiaba a `labels.group` mientras se desvanecía).
- Medido con Playwright: Chromium, al pulsar Esc el `<dialog>` sigue con `display: flex`, el cuerpo montado y transiciones de `opacity`, `scale`, `translate`, `overlay` y `display` de 120 ms; con `reduce`, solo `opacity`, `overlay` y `display`. A los 300 ms el contenido está desmontado y el foco vuelve a «Simple». Firefox y WebKit cierran al instante (sin `overlay`), sin errores; en WebKit el foco no vuelve al botón porque Safari no lo enfoca al hacer clic (comportamiento previo). 1190 pruebas, build, compuertas y theme-playground (143 / 1 omitida).
