# 012 — No animar al montar: GSidebar, GTabs y GCheckbox

- **Status**: DONE
- **Dueños**: bruno (pasos 1–4: `GSidebar.vue`, `GSidebar.test.js`, `GCheckbox.vue`, `GCheckbox.test.js`), coco (pasos 5–7: `GSidebar.css`, `GTabs.css`, `design/lab/sidebar/estilo.md`, `design/lab/tabs/estilo.md`). Sin tokens nuevos.
- **Commit**: c9ecab2
- **Severity**: MEDIUM (GSidebar: es la carcasa de la aplicación y se ve en cada carga) · LOW (GTabs, GCheckbox)
- **Category**: Purpose & frequency (animación al montar)
- **Estimated scope**: 6 archivos; ~25 líneas de JS, ~15 de CSS, 3 pruebas
- **Depende de**: nada. Orden interno: bruno (clases) → coco (selectores). Si coco va primero, la etiqueta del sidebar deja de animarse también al expandir hasta que llegue la clase `is-expanding`.

## Problem

Grabando `document.getAnimations()` en cada cuadro durante los primeros 4 s de carga del playground (script de inicio con `addInitScript`), en **Chromium y Firefox** corren al montar, sin interacción:

| Componente | Qué se anima al cargar | Por qué |
| --- | --- | --- |
| `GSidebar` (modo expandido) | `g-sidebar-label-in` en todas las etiquetas, títulos de grupo y la pista ⌘K (160 ms, 45 ms de retardo): el texto entra deslizándose | La animación está en las etiquetas de `.g-sidebar--mode-expanded`, que existe desde el primer render |
| `GSidebar` | `scale` + `opacity` de las insignias (`.g-sidebar__badge`, también el punto) | `@starting-style` sin condición: vale también en la primera pintura |
| `GTabs` | `opacity` + `translate` del panel visible | `@starting-style` del panel sin `is-ready`, aunque la marca sí lo respeta |
| `GCheckbox` (mixta) | fondo, borde y el trazo del `−` de la casilla mixta | `indeterminate` es una propiedad del DOM que bruno pone en `onMounted`, después de la primera pintura |

(En WebKit headless solo se registra la del sidebar porque su reloj no avanza solo; el CSS es el mismo.)

En una aplicación de varias páginas (o en cada recarga), la barra lateral «se escribe» cada vez que se navega. AUDIT §1: lo que se ve en cada carga no se anima; la entrada de las etiquetas tiene sentido al **expandir** el riel, que es para lo que se escribió.

```css
/* packages/vue/src/components/GSidebar/GSidebar.css:78-95 — current */
/* Expandir y contraer: el ancho se mueve con una curva suave y las etiquetas entran un instante después,
   cuando la barra ya se abre (no antes de que haya sitio) */
@media (prefers-reduced-motion: no-preference) {
  .g-sidebar--mode-expanded,
  .g-sidebar--mode-rail {
    transition: inline-size var(--_t-slow) var(--g-ease-standard);
  }
  .g-sidebar--mode-expanded .g-sidebar__nav .g-sidebar__label,
  .g-sidebar--mode-expanded .g-sidebar__nav .g-sidebar__group-title,
  .g-sidebar--mode-expanded .g-sidebar__head .g-sidebar__label,
  .g-sidebar--mode-expanded .g-sidebar__hint {
    animation: g-sidebar-label-in var(--_t) var(--g-ease-out) calc(var(--_stagger) * 1.5) both;
  }
  @keyframes g-sidebar-label-in {
    from { opacity: 0; translate: calc(var(--g-space-1) * -2) 0; }
  }
}
```
```css
/* GSidebar.css:380-385 — current */
@starting-style {
  .g-sidebar__badge {
    scale: 0.6;
    opacity: 0;
  }
}
```
```css
/* GTabs.css:520-533 — current */
/* Entrada del contenido: fundido corto con un desplazamiento de un paso de espacio (sin movimiento reducido) */
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
}
```
```js
// packages/vue/src/components/GCheckbox/GCheckbox.vue:66-74 — current
const input = ref(null)
// El <input> nativo puede divergir de las props tras un clic; se vuelve a alinear con lo que digan.
function sync() {
  if (!input.value) return
  input.value.checked = checked.value
  input.value.indeterminate = props.indeterminate
}
onMounted(sync)
watch([checked, () => props.indeterminate], sync, { flush: 'post' })
```
`checked` sí llega antes de la inserción porque va en los atributos del `<input>` (`controlled`, `GCheckbox.vue:103-105`); `indeterminate` no.

Lo que **no** cambia: la entrada del navbar (`is-entering`, `GSidebar.vue:369-376`), los grupos del drawer al abrirlo y la marca de `GTabs` (ya con `is-ready`) están bien.

## Target

- **GSidebar, etiquetas**: la animación `g-sidebar-label-in` solo con una clase transitoria **`is-expanding`** que bruno pone en la raíz lateral al pasar de `rail` a `expanded` **después del montaje** y quita a los 600 ms (mismo mecanismo y tiempo que `is-entering`). Al montar en expandido y al abrir el drawer, las etiquetas aparecen quietas (en el drawer ya entran los grupos con `g-sidebar-group-in`).
- **GSidebar, insignias**: `@starting-style` solo dentro de `.g-sidebar.is-ready`, clase que bruno pone en la raíz (lateral, drawer y navbar) dos cuadros después de montar (patrón de `GTabs`/`GStepper`). Una insignia que aparece después (un contador que pasa de 0 a 3) sigue entrando con escala 0.6 → 1 y fundido en 160 ms.
- **GTabs, panel**: `@starting-style` solo con `.g-tabs.is-ready` (la clase ya existe).
- **GCheckbox**: `indeterminate` se pasa en los atributos del `<input>` para que Vue lo asigne antes de insertarlo; `sync()` se queda para las divergencias tras un clic.

## Repo conventions to follow

- Exemplar de `is-ready` a dos cuadros: `packages/vue/src/components/GTabs/GTabs.vue:94`, `:229-235` y `:649`:
  ```js
      let readyScheduled = false
      function scheduleReady() {
        if (ready.value || readyScheduled) return
        readyScheduled = true
        const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (f) => setTimeout(f, 16)
        raf(() => raf(() => { readyScheduled = false; if (!unmounted) ready.value = true }))
      }
  ```
- Exemplar de clase transitoria: `GSidebar.vue:369-376` (`entering`, `enterT`, 600 ms) y `:617`.
- DECISIONS.md #71: el sidebar **no se reconstruye** al cambiar de formato; añadir clases sobre el mismo nodo lo respeta.

## Steps

### bruno

1. `GSidebar.vue`, tras el `watch(format, …)` de `:371-377`, añade:
   ```js
       // is-ready: dos cuadros después de montar; las entradas de coco (insignias) solo existen con él
       const ready = ref(false)
       // is-expanding: al pasar de riel a expandida ya montada; las etiquetas entran solo entonces (no al cargar)
       const expanding = ref(false)
       let expandT = null
       watch(format, (f, old) => {
         if (ready.value && f === 'expanded' && old === 'rail') {
           expanding.value = true
           clearTimeout(expandT)
           expandT = setTimeout(() => { expanding.value = false }, 600)
         }
       })
   ```
2. `GSidebar.vue`:
   - En `onMounted` (`:387-391`) añade al final:
     ```js
         const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (f) => setTimeout(f, 16)
         raf(() => raf(() => { if (!unmountedFlag) ready.value = true }))
     ```
     y declara `let unmountedFlag = false` junto a `ready`; en `onBeforeUnmount` (`:392-398`) añade `unmountedFlag = true` y `clearTimeout(expandT)`.
   - En `renderSide` (`:569`) cambia la clase a `cls(...modeClasses(mode), ready.value && 'is-ready', kind === 'side' && expanding.value && 'is-expanding', kind === 'side' ? attrs.class : null)`.
   - En `renderNavbar` (`:617`) añade `ready.value && 'is-ready'` a la lista de `cls(...)`.
3. `GCheckbox.vue:103-105`: en `controlled` añade, tras `checked: checked.value,`, la línea `indeterminate: props.indeterminate,`. No toques `sync()`.
4. Pruebas:
   - `GSidebar.test.js`: «la raíz recibe is-ready tras dos cuadros» (con `requestAnimationFrame` simulado por `setTimeout` y `vi.useFakeTimers()`, o esperando dos `requestAnimationFrame` reales si el entorno los tiene: sigue cómo lo hace `GTabs.test.js` para `is-ready`, búscalo con `grep -n "is-ready" packages/vue/src/components/GTabs/GTabs.test.js`); «al pasar de rail a expanded tras montar, la raíz tiene is-expanding y la pierde a los 600 ms»; «montada en expanded, no tiene is-expanding».
   - `GCheckbox.test.js`: «con indeterminate, el input ya es mixto al insertarse» (monta con `indeterminate: true` y `attachTo: document.body`; dentro de un `MutationObserver` sobre `document.body` creado antes del montaje, al ver el `<input>` insertado, `input.indeterminate` ya es `true`). Si jsdom no permite comprobarlo así, basta con `expect(wrapper.find('input').element.indeterminate).toBe(true)` antes de cualquier `nextTick` y anótalo.

### coco

5. `GSidebar.css:85-88`: cambia los cuatro selectores para que exijan la clase:
   ```css
     .g-sidebar--mode-expanded.is-expanding .g-sidebar__nav .g-sidebar__label,
     .g-sidebar--mode-expanded.is-expanding .g-sidebar__nav .g-sidebar__group-title,
     .g-sidebar--mode-expanded.is-expanding .g-sidebar__head .g-sidebar__label,
     .g-sidebar--mode-expanded.is-expanding .g-sidebar__hint {
   ```
   y el comentario de `:78-79` a `/* Expandir y contraer: el ancho se mueve con una curva suave y, al expandir (is-expanding, bruno), las etiquetas entran un instante después; al cargar no se anima nada */`.
6. `GSidebar.css:380-385`: cambia el selector del `@starting-style` a `.g-sidebar.is-ready .g-sidebar__badge`. El bloque `reduce` (`:916-917`, `.g-sidebar__badge { transition: opacity … }`) no cambia.
7. `GTabs.css:527-532`: cambia el selector del `@starting-style` a `.g-tabs.is-ready .g-tabs__panel:not([hidden])` y el comentario de `:520` a `/* Entrada del contenido al cambiar de pestaña (no al montar: solo con is-ready): fundido corto con un desplazamiento de un paso de espacio (sin movimiento reducido) */`.
8. `design/lab/sidebar/estilo.md`: en «Notas para bruno (movimiento)» (`:49-56`) añade `- **is-ready** en la raíz (lateral, drawer y navbar) dos cuadros después de montar, e **is-expanding** al pasar de riel a expandida ya montada (600 ms): las insignias y las etiquetas no se animan al cargar.` `design/lab/tabs/estilo.md:20`: tras «el panel entra con fundido…» añade «(solo con \`is-ready\`: no al montar)».

## Boundaries

- Solo los archivos listados. No toques `GStepper` (ya tiene `is-ready`, plan 005), el navbar (`is-entering`) ni el drawer.
- No cambies duraciones, curvas ni retardos.
- No reconstruyas nodos del sidebar: solo clases sobre la raíz existente (DECISIONS.md #71).
- Si alguna prueba existente falla, detente e informa.

## Verification

- **Mecánica**: `npm test` (pruebas nuevas en verde), `npm run build`, compuertas de CLAUDE.md.
- **Medición (Playwright, Chromium y Firefox; WebKit con `currentTime` manual)**: con `page.addInitScript` registra cada cuadro, durante 4 s desde la carga, `document.getAnimations()` (excluye las de giro `*-spin` y `g-avatar-*`):
  - Ninguna animación de `g-sidebar-label-in`, ni de `scale`/`opacity` en `.g-sidebar__badge`, ni de `opacity`/`translate` en `.g-tabs__panel`, ni transiciones en `.g-checkbox__input`/`.g-checkbox__dash` (hoy aparecen todas).
  - Después: contrae y expande el sidebar (`.g-sidebar__toggle` dos veces): al expandir, la raíz tiene `is-expanding` y las etiquetas tienen `CSSAnimation` `g-sidebar-label-in`; a los 700 ms la clase ya no está.
  - Cambia de pestaña en `#sec-tabs`: el panel nuevo tiene transiciones de `opacity`/`translate` de 160 ms.
  - Insignia nueva del sidebar: el playground no tiene un control para cambiarla; comprueba que la raíz tiene `is-ready` tras cargar y que la regla la exige (`grep -n "is-ready .g-sidebar__badge" packages/vue/dist/grana.css` → 1 resultado). Abre el drawer (selector «modo» → `drawer`, «Abrir drawer»): sus insignias entran con `scale`/`opacity` de 160 ms (el drawer pasa de `display: none` a visible ya con `is-ready`).
- **Feel check**: recarga la página varias veces: la barra lateral, las pestañas y las casillas aparecen quietas, ya en su sitio. Contrae y expande la barra: las etiquetas siguen entrando con su retardo corto. Abre el drawer (modo `drawer`): los grupos entran escalonados como antes.
- **Done when**: al cargar no corre ninguna de esas animaciones en ningún navegador, y las entradas siguen funcionando al expandir el sidebar, al cambiar de pestaña y al aparecer una insignia nueva.

## Nota de ejecución

- `GCheckbox.vue`: además de pasar `indeterminate` en `controlled`, se movió `type="checkbox"` **antes** de `v-bind="fieldBindings"` (el orden de las propiedades importa: con `type` al final el navegador reiniciaba `indeterminate`). Con esto la casilla mixta del playground (`mixed`) ya nace mixta.
- Pendiente fuera del plan: la casilla maestra de `GCheckboxGroup select-all` (`:indeterminate="someChecked"`) calcula su estado cuando los hijos se registran en `onMounted`, así que su primer render es no-mixto y en Chromium/Firefox sigue corriendo una transición de color al cargar (1 casilla). Corregirlo exige registrar los hijos en `setup` (bruno, `GCheckbox`/`GCheckboxGroup`); no se hizo por no ser parte del plan.
- Pruebas nuevas: 3 en `GSidebar.test.js` (is-ready, is-expanding, no en montaje) y 1 en `GCheckbox.test.js` (MutationObserver). Verificado con Playwright: al cargar no corren `g-sidebar-label-in`, ni las insignias ni el panel de `GTabs`; al expandir el sidebar, `is-expanding` + `g-sidebar-label-in` y a los 700 ms desaparece; el panel de `GTabs` entra con `opacity`/`translate` al cambiar de pestaña.
