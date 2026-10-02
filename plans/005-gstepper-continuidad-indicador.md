# 005 — Continuidad del indicador de GStepper cuando el paso cambia de botón a texto (y clase `is-ready`)

- **Status**: DONE
- **Dueño**: bruno (`GStepper.vue`, `GStepper.test.js`). Sin CSS, sin tokens nuevos.
- **Commit**: 49ad85b
- **Severity**: HIGH
- **Category**: Interruptibility
- **Estimated scope**: 2 archivos, ~45 líneas de código + 3 pruebas
- **Depende de**: nada para funcionar; el plan 006 (coco) depende de la clase `is-ready` que añade este.

## Problem

Con `navigation="back"` o `"free"` (el primer stepper del playground), cada paso navegable es un `<button>` y el resto un `<span>`:

```js
// packages/vue/src/components/GStepper/GStepper.vue:208-218 — current
      const hitProps = { class: 'g-stepper__hit' }
      if (state === 'current') hitProps['aria-current'] = 'step'
      if (navigable) {
        hitProps.type = 'button'
        hitProps.onClick = () => activate(step, i)
      }
      const kids = [
        h(navigable ? 'button' : 'span', hitProps, [
          h('span', { class: 'g-stepper__indicator', 'aria-hidden': 'true' }, indicatorContent(step, i, state, plainNumber)),
          h('span', { class: 'g-stepper__text' }, text)
        ]),
```

Cuando un paso deja de ser el actual (`span` → `button`) o pasa a serlo (`button` → `span`), Vue cambia de etiqueta y **reemplaza todo el subárbol**: el indicador es un elemento nuevo que nace ya con su estilo final, así que **ninguna transición de CSS corre**. Medido en Chromium:

- «Siguiente» con `navigation="back"`: 2 de 15 nodos (botón e indicador del paso que pasa a hecho) son nuevos; ese indicador salta de blanco con anillo a relleno con check en un cuadro, mientras el de los steppers sin navegación sí se funde.
- Clic en un paso anterior: 4 de 10 nodos nuevos (el pulsado y el que era actual).
- Pulsación: con el ratón pulsado el indicador está en `matrix(0.97, …)`; al soltar, el clic lo convierte en actual y el nodo viejo se desconecta (`isConnected: false`): el nuevo aparece a escala 1 de golpe.

La etiqueta distinta es semántica del contrato (un paso no navegable no es botón, `design/contracts/stepper.md`), así que no se cambia la estructura: se **continúa** la apariencia del nodo viejo en el nuevo con la Web Animations API, como ya hace `GWidgetGrid` (DECISIONS.md #91).

Además, las entradas que propone el plan 006 (`@starting-style`) necesitan una clase que no esté al montar (si no, todo se animaría en la primera pintura y al elegir el primer tramo medido). `GTabs` ya lo resuelve con `is-ready` dos cuadros después de montar (DECISIONS.md #121, «sin animar el primer posicionamiento»).

## Target

1. Clase **`is-ready`** en la raíz `<nav>` dos cuadros después de `onMounted` (cuando ya se aplicó el primer tramo medido).
2. Antes de cada actualización (`onBeforeUpdate`), si `is-ready`: guardar, por posición, los indicadores **visibles** y su estilo computado (`backgroundColor`, los cuatro `border*Color`, `color`, `boxShadow`, `transform` y la propiedad registrada `--_stepper-fill` del plan 003).
3. Después (`onUpdated`): para cada posición cuyo indicador sea **un elemento distinto** al de antes, `node.animate([antes, ahora])`:
   - colores, anillo y llenado: duración `--g-duration-fast` (120 ms), curva `--g-ease-standard` (`cubic-bezier(0.2, 0, 0, 1)`), también con movimiento reducido (son colores);
   - si el viejo tenía `transform` ≠ `none` (estaba pulsado): `[{ transform: viejo }, { transform: 'none' }]`, duración `--g-duration-press` (160 ms), curva `--g-ease-out` (`cubic-bezier(0.23, 1, 0.32, 1)`), **solo sin** `prefers-reduced-motion: reduce`.
   - Si el elemento es el mismo, no se hace nada: lo anima la transición de coco.
   - Si cambió el número de indicadores visibles (cambio de tramo, compacto abierto/cerrado, pasos distintos), no se anima nada.
4. Duraciones y curvas se leen de los tokens en el momento (`getComputedStyle(root).getPropertyValue`), nunca literales. Sin API (`Element.prototype.animate`) o sin `matchMedia` (jsdom, SSR): no se hace nada.

Comprobado: `Element.animate` con claves de color, `boxShadow`, `transform` y la clave `'--_stepper-fill'` interpola en Chromium, Firefox y WebKit.

## Repo conventions to follow

- Exemplar de FLIP con WAAPI y lectura de tokens: `packages/vue/src/components/GWidgetGrid/GWidgetGrid.vue:308-336`:
  ```js
      const cs = getComputedStyle(rootEl.value)
      const raw = cs.getPropertyValue('--g-duration-press').trim()
      const ms = raw.endsWith('ms') ? parseFloat(raw) : raw.endsWith('s') ? parseFloat(raw) * 1000 : NaN
      const easing = cs.getPropertyValue('--g-ease-out').trim() || 'ease-out'
  ```
- Exemplar de `is-ready` con dos cuadros: `packages/vue/src/components/GTabs/GTabs.vue:94`, `:229-234` y `:649`.
- `GStepper.vue` ya tiene `nextFrame` (línea 100), que cae en ejecución inmediata sin `requestAnimationFrame`.
- Avisos de desarrollo y guardas: `typeof window !== 'undefined'`, nunca `import.meta.env.DEV` (CLAUDE.md).
- El `.vue` no lleva `<style>` (CLAUDE.md).

## Steps

1. **Import** (línea 6): añade `onBeforeUpdate`:
   ```js
   import { defineComponent, h, ref, computed, watch, nextTick, onMounted, onBeforeUpdate, onUpdated, onBeforeUnmount, useId } from 'vue'
   ```
2. **Estado**: tras `const listId = \`${useId()}-list\`` (línea 40) añade:
   ```js
       // is-ready: dos cuadros después de montar (ya aplicado el primer tramo); las entradas de coco solo existen con él
       const ready = ref(false)
       let unmounted = false
   ```
3. **`onMounted`** (líneas 101-116): como **última** línea dentro del callback añade:
   ```js
         nextFrame(() => nextFrame(() => { if (!unmounted) ready.value = true }))
   ```
4. **`onBeforeUnmount`** (líneas 119-123): como primera línea dentro del callback añade `unmounted = true`.
5. **Continuidad**: justo después de `onUpdated(measureNeeds)` (línea 118) añade:
   ```js
       // ---- Continuidad del indicador (plan 005) ----
       // Un paso que pasa de botón a texto (o al revés) cambia de etiqueta y Vue rehace su indicador: el nuevo nace con su
       // estilo final y la transición de coco no corre. Se continúa desde el aspecto del viejo con la Web Animations API
       // (como GWidgetGrid, #91). Duración y curva de los tokens; con movimiento reducido solo los colores.
       const CONTINUE = ['backgroundColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor', 'color', 'boxShadow', '--_stepper-fill']
       const toMs = (raw) => (raw.endsWith('ms') ? parseFloat(raw) : raw.endsWith('s') ? parseFloat(raw) * 1000 : NaN)
       const readStyle = (cs, p) => (p.startsWith('--') ? cs.getPropertyValue(p).trim() : cs[p])
       const shownIndicators = () => {
         const el = root.value
         if (!el) return []
         // La clase de la raíz (no isCompact) dice qué lista está pintada ahora mismo: antes del parche es la vieja
         const scope = el.classList.contains(TIER_CLASS.compact) ? '.g-stepper__compact > .g-stepper__list' : ':scope > .g-stepper__list'
         return [...el.querySelectorAll(`${scope} > .g-stepper__step > .g-stepper__hit > .g-stepper__indicator`)]
       }
       let lastIndicators = null
       onBeforeUpdate(() => {
         lastIndicators = null
         if (!ready.value || typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') return
         lastIndicators = shownIndicators().map((node) => {
           const cs = window.getComputedStyle(node)
           const frame = {}
           for (const p of CONTINUE) frame[p] = readStyle(cs, p)
           return { node, frame, transform: cs.transform }
         })
       })
       onUpdated(() => {
         const prev = lastIndicators
         lastIndicators = null
         if (!prev || !prev.length || !root.value || typeof window.matchMedia !== 'function') return
         const now = shownIndicators()
         if (now.length !== prev.length) return // otro tramo u otros pasos: nada que continuar
         const cs = window.getComputedStyle(root.value)
         const fast = toMs(cs.getPropertyValue('--g-duration-fast').trim())
         const press = toMs(cs.getPropertyValue('--g-duration-press').trim())
         const standard = cs.getPropertyValue('--g-ease-standard').trim() || 'ease'
         const out = cs.getPropertyValue('--g-ease-out').trim() || 'ease-out'
         const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
         now.forEach((node, i) => {
           const { node: old, frame, transform } = prev[i]
           if (node === old || typeof node.animate !== 'function') return // el mismo elemento: lo anima la transición de coco
           const to = window.getComputedStyle(node)
           const from = {}
           const end = {}
           let changed = false
           for (const p of CONTINUE) {
             const a = frame[p]
             const b = readStyle(to, p)
             if (!a || !b) continue
             from[p] = a
             end[p] = b
             if (a !== b) changed = true
           }
           if (changed && fast > 0) node.animate([from, end], { duration: fast, easing: standard })
           if (!reduce && transform && transform !== 'none' && press > 0) {
             node.animate([{ transform }, { transform: 'none' }], { duration: press, easing: out })
           }
         })
       })
   ```
6. **Clase**: en la función de render (líneas 251-262), tras `if (props.disabled) classes.push('is-disabled')` añade:
   ```js
         if (ready.value) classes.push('is-ready')
   ```
7. **Pruebas** (`GStepper.test.js`): añade un `describe('GStepper · movimiento', …)` antes de `describe('GStepper · validadores'` (línea 432) con:
   ```js
   describe('GStepper · movimiento', () => {
     const TOKENS = { '--g-duration-fast': '120ms', '--g-duration-press': '160ms', '--g-ease-standard': 'cubic-bezier(0.2, 0, 0, 1)', '--g-ease-out': 'cubic-bezier(0.23, 1, 0.32, 1)' }
     // Estilo falso: el color depende del estado del <li> en el momento de la lectura; pressed simula la pulsación
     const fakeStyles = ({ pressed = false } = {}) => {
       vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
         const li = el.closest && el.closest('.g-stepper__step')
         const done = li && li.classList.contains('is-complete')
         const c = done ? 'rgb(31, 31, 31)' : 'rgb(255, 255, 255)'
         return {
           backgroundColor: c, borderTopColor: c, borderRightColor: c, borderBottomColor: c, borderLeftColor: c,
           color: c, boxShadow: 'none', transform: pressed && !done ? 'matrix(0.97, 0, 0, 0.97, 0, 0)' : 'none',
           getPropertyValue: (p) => TOKENS[p] || ''
         }
       })
     }
     const setup = (reduce = false) => {
       vi.stubGlobal('requestAnimationFrame', (fn) => { fn(); return 0 })
       vi.stubGlobal('matchMedia', (q) => ({ matches: reduce && q.includes('reduce') }))
       window.matchMedia = globalThis.matchMedia
       const animate = vi.fn()
       Element.prototype.animate = animate
       return animate
     }
     afterEach(() => { delete Element.prototype.animate })

     it('is-ready llega después de montar (dos cuadros), no en la primera pintura', async () => {
       setup()
       const w = mk()
       await nextTick()
       expect(w.classes()).toContain('is-ready')
       w.unmount()
     })

     it('continúa el indicador que Vue rehace al pasar de texto a botón (navigation="back")', async () => {
       const animate = setup()
       const w = mk({ navigation: 'back', modelValue: 'cuenta' })
       await nextTick()
       fakeStyles()
       await w.setProps({ modelValue: 'pago' })
       // Solo el paso 2 (actual → hecho) cambió de etiqueta: una animación de color, con los tokens
       expect(animate).toHaveBeenCalledTimes(1)
       const [frames, opts] = animate.mock.calls[0]
       expect(frames[0].backgroundColor).toBe('rgb(255, 255, 255)')
       expect(frames[1].backgroundColor).toBe('rgb(31, 31, 31)')
       expect(opts).toEqual({ duration: 120, easing: 'cubic-bezier(0.2, 0, 0, 1)' })
       w.unmount()
     })

     it('la escala de la pulsación vuelve animada; con movimiento reducido solo el color', async () => {
       for (const reduce of [false, true]) {
         const animate = setup(reduce)
         const w = mk({ navigation: 'back', modelValue: 'cuenta' })
         await nextTick()
         fakeStyles({ pressed: true })
         await w.setProps({ modelValue: 'pago' })
         const transforms = animate.mock.calls.filter(([f]) => f[0].transform)
         expect(transforms).toHaveLength(reduce ? 0 : 1)
         if (!reduce) expect(transforms[0][1]).toEqual({ duration: 160, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' })
         w.unmount()
         vi.restoreAllMocks()
       }
     })

     it('sin cambio de etiqueta (navigation="none") no anima desde JS: lo hace el CSS', async () => {
       const animate = setup()
       const w = mk()
       await nextTick()
       fakeStyles()
       await w.setProps({ modelValue: 'pago' })
       expect(animate).not.toHaveBeenCalled()
       w.unmount()
     })
   })
   ```
   Si alguna prueba falla por detalles de jsdom (p. ej. `window.matchMedia` no reasignable), ajusta **solo la preparación** de la prueba, no lo que se comprueba.

## Boundaries

- Solo `GStepper.vue` y `GStepper.test.js`. Sin CSS (`GStepper.css` es de coco), sin tokens, sin cambios de API pública ni de estructura (`button`/`span` siguen como están).
- No animes nada en el montaje ni cuando cambia el tramo.
- No uses literales de duración ni de curva salvo los de reserva `'ease'`/`'ease-out'` cuando el token no se pueda leer (como `GWidgetGrid`).
- Si el código no coincide con lo citado (cambios después de 49ad85b), DETENTE e informa.

## Verification

- **Mecánica**: `npm test` (todas verdes, con las 4 nuevas); `npm run build` y las compuertas de CLAUDE.md:
  ```bash
  grep -q "g-btn--variant-soft" packages/vue/dist/grana.css
  ! grep -q "data:font" packages/vue/dist/grana.css
  ! grep -q "createApp" packages/vue/dist/grana.umd.js
  ```
- **Medición (Playwright, 3 navegadores)**, playground `#sec-stepper`, primer stepper (`navigation="back"`):
  - Al cargar: la raíz no tiene `is-ready` en el primer cuadro y sí tras dos `requestAnimationFrame`.
  - «Siguiente»: el indicador del paso que pasa a hecho es un nodo nuevo y `getAnimations()` devuelve una animación (no `CSSTransition`) de 120 ms; con `pause()` y `currentTime = 60`, `backgroundColor` está entre blanco y el color base. (En WebKit headless el reloj no avanza solo: mide con `currentTime`.)
  - Pulsar un paso anterior con `page.mouse.down()`, esperar 200 ms y `page.mouse.up()` encima: el nuevo indicador actual tiene una animación de `transform` de 160 ms que parte de `matrix(0.97, …)`.
  - Con `reducedMotion: 'reduce'`: solo la de color.
- **Feel check**: DevTools > Animations al 10 %, primer stepper: «Siguiente» y clic hacia atrás se ven igual de suaves que en los steppers sin navegación (puntos, iconos); al soltar un paso pulsado no hay salto de tamaño.
- **Done when**: ningún indicador cambia de aspecto en un solo cuadro con `navigation="back"`/`"free"`; `is-ready` aparece tras montar; las pruebas pasan.

## Nota de ejecución

Ejecutado sin desviaciones (4 pruebas nuevas, 1182 verdes). Verificado en los tres navegadores: el indicador nuevo recibe una Animation de 120 ms de color y, al soltar un paso pulsado, otra de transform de 160 ms desde matrix(0.97, ...); con reduce solo la de color. is-ready aparece tras montar (en Playwright ya estaba presente al detectar el primer .g-stepper; lo cubre la prueba unitaria).
