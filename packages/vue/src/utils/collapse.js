// Motor de plegado compartido (interno; dueño: bruno). NO se exporta desde src/index.js ni es API.
// Contrato: design/contracts/accordion.md «Motor de plegado compartido» (#486). Sacado de GFormSection (form.md §3, #284 a
// #291) sin cambiar su comportamiento; lo usan GFormSection (collapsible y addable) y GAccordionItem.
//
// El panel es la rejilla 0fr → 1fr de coco (#278): sin medir alturas, el CSS anima grid-template-rows y este motor solo
// dice cuándo empieza y cuándo termina el movimiento (is-animating), cuándo no se anima (is-instant) y cuándo ya se puede
// animar (is-ready, tras el primer pintado: no se anima lo que ya viene abierto, plan 012).
import { nextTick, onBeforeUnmount, onMounted, ref, unref } from 'vue'
import { nextFrame, OPEN_REQUEST } from '../components/GForm/formContext.js'
import { transitionMs } from './motion.js'

// La petición «abrir antes de enfocar» (#287) sigue definida en formContext.js; aquí se reexporta con el mismo valor
export { OPEN_REQUEST }

/**
 * Estado y pasos del plegado de un panel.
 * - `panel`, `toggle`: refs (o elementos) del panel animado y del botón que lo gobierna.
 * - `onSettle()`: gancho al asentar (fin de la transición o respaldo). GAccordionItem pone hidden="until-found" si quedó
 *   plegado; GFormSection vuelve a montar el cuerpo descartado.
 * - `manualReady`: sin él, `ready` pasa a true tras el primer pintado (dos cuadros); con él, lo pone quien llama con
 *   `markReady()` (GFormSection, tras su primera medida, #289).
 * El motor no mira prefers-reduced-motion: el CSS de movimiento reducido cuenta con is-animating y con el respaldo.
 */
export function useCollapse({ panel, toggle, onSettle, manualReady = false } = {}) {
  const animating = ref(false)
  const ready = ref(false)
  const instant = ref(false)
  let timer = null

  function settle() {
    clearTimeout(timer)
    timer = null
    if (animating.value) animating.value = false
    if (typeof onSettle === 'function') onSettle()
  }
  // Respaldo del transitionend: si la transición de altura sigue en curso (empezó tarde con el hilo ocupado), espera
  function fallback() {
    const p = unref(panel)
    const running = p && typeof p.getAnimations === 'function' && p.getAnimations().some((a) => a.transitionProperty === 'grid-template-rows' && a.playState === 'running')
    if (running) {
      timer = setTimeout(fallback, 50)
      return
    }
    settle()
  }
  /** Al cambiar el estado: is-animating y, con el DOM ya actualizado, el respaldo transitionMs(panel) + 50 ms. */
  function start() {
    animating.value = true
    clearTimeout(timer)
    // Respaldo del transitionend (una transición de 0s no lo emite: movimiento reducido), con el DOM ya actualizado
    nextTick(() => {
      clearTimeout(timer)
      timer = setTimeout(fallback, transitionMs(unref(panel)) + 50)
    })
  }
  function onTransitionend(event) {
    if (event.target === event.currentTarget && event.propertyName === 'grid-template-rows') settle()
  }
  /**
   * Cambio sin animar (búsqueda de la página, #id, OPEN_REQUEST, cierre desde el encabezado pegado): cancela el respaldo y
   * la animación en curso y pone is-instant en el mismo parche que el cambio; se retira tras dos cuadros.
   */
  function openInstant() {
    clearTimeout(timer)
    timer = null
    animating.value = false
    instant.value = true
    nextFrame(() => nextFrame(() => { instant.value = false }))
  }
  /** Plegar con el foco dentro (por programa): al botón ANTES de aplicar inert/hidden, sin desplazar (2.4.3). */
  function focusOut() {
    const p = unref(panel)
    if (!p || typeof document === 'undefined' || !p.contains(document.activeElement)) return
    const t = unref(toggle)
    if (t && typeof t.focus === 'function') t.focus({ preventScroll: true })
  }
  function markReady() {
    ready.value = true
  }
  if (!manualReady) onMounted(() => nextFrame(() => nextFrame(markReady)))
  onBeforeUnmount(() => {
    clearTimeout(timer)
    timer = null
  })
  return { animating, ready, instant, start, settle, onTransitionend, openInstant, focusOut, markReady }
}

/**
 * Contenedor de desplazamiento de `el` en el eje de bloque: el antepasado más cercano con overflow-y auto/scroll (con
 * `overflowing`, solo si de verdad desborda) o, sin él, document.scrollingElement. null en el servidor.
 */
export function scrollParent(el, { overflowing = true } = {}) {
  if (!el || typeof document === 'undefined' || typeof getComputedStyle !== 'function') return null
  const top = document.scrollingElement || document.documentElement
  for (let n = el.parentElement; n && n !== document.body && n !== document.documentElement; n = n.parentElement) {
    const o = getComputedStyle(n).overflowY
    if ((o === 'auto' || o === 'scroll' || o === 'overlay') && (!overflowing || n.scrollHeight > n.clientHeight)) return n
  }
  return top
}

/** Contenedores de desplazamiento de `el` que desbordan, del más cercano al documento (incluido). */
function scrollChain(el) {
  const out = []
  if (!el || typeof document === 'undefined') return out
  const top = document.scrollingElement || document.documentElement
  for (let n = el.parentElement; n && n !== document.body && n !== document.documentElement; n = n.parentElement) {
    const o = getComputedStyle(n).overflowY
    if ((o === 'auto' || o === 'scroll' || o === 'overlay') && n.scrollHeight > n.clientHeight) out.push(n)
  }
  out.push(top)
  return out
}

// Una sola compensación a la vez (la última que el usuario pidió)
let keepStop = null
const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '])
const TEXTY = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])'
// Una tecla desplaza la página si nadie la atendió y no la consume un control (Espacio activa un botón; las flechas mueven
// el cursor de un campo)
const scrolls = (e) => {
  if (e.defaultPrevented || !SCROLL_KEYS.has(e.key)) return false
  const t = e.target && e.target.closest ? e.target : null
  if (!t) return true
  return !t.closest(e.key === ' ' ? `${TEXTY}, button, a[href], summary` : TEXTY)
}

/**
 * Δ0 (accordion.md «Teclado, deshabilitado y Δ0», #481): el elemento `el` (el encabezado tocado) no se mueve mientras dura
 * el movimiento. Mide su borde superior ahora (antes del cambio) y, en cada cuadro hasta `getMs()` + 80 ms (calculado en el
 * primer cuadro, con el cambio ya aplicado), desplaza su contenedor de desplazamiento lo que se haya movido (≥ 0,5 px).
 * Se cancela si el usuario desplaza (rueda, toque, teclas de desplazamiento que nadie atendió). Devuelve la función que la
 * detiene. Sin requestAnimationFrame (servidor, jsdom antiguo) no hace nada.
 */
export function keepInPlace(el, getMs) {
  if (!el || typeof window === 'undefined' || typeof requestAnimationFrame !== 'function') return () => {}
  if (keepStop) keepStop()
  // Del contenedor más cercano hacia fuera: si el más cercano no puede desplazarse más (o un antepasado se movió por su
  // anclaje de desplazamiento al encogerse el de dentro), compensa el siguiente
  const chain = scrollChain(el)
  const y0 = el.getBoundingClientRect().top
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())
  let raf = 0
  let end = 0
  let stopped = false
  const onKey = (e) => {
    if (scrolls(e)) stop()
  }
  const opts = { passive: true, capture: true }
  function stop() {
    if (stopped) return
    stopped = true
    cancelAnimationFrame(raf)
    window.removeEventListener('wheel', stop, opts)
    window.removeEventListener('touchstart', stop, opts)
    window.removeEventListener('keydown', onKey)
    if (keepStop === stop) keepStop = null
  }
  window.addEventListener('wheel', stop, opts)
  window.addEventListener('touchstart', stop, opts)
  window.addEventListener('keydown', onKey)
  const step = () => {
    if (stopped) return
    if (!end) end = now() + (typeof getMs === 'function' ? getMs() : 0) + 80
    let d = el.getBoundingClientRect().top - y0
    for (const sc of chain) {
      if (Math.abs(d) < 0.5) break
      const before = sc.scrollTop
      if (typeof sc.scrollBy === 'function') sc.scrollBy({ top: d, left: 0, behavior: 'instant' })
      else sc.scrollTop += d
      if (sc.scrollTop !== before) d = el.getBoundingClientRect().top - y0
    }
    if (now() < end && el.isConnected) raf = requestAnimationFrame(step)
    else stop()
  }
  raf = requestAnimationFrame(step)
  keepStop = stop
  return stop
}
