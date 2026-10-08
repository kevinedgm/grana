// Motor de carga (interno; dueño: bruno). design/contracts/load-region.md «Motor compartido», DECISIONS.md #531 a #534.
// Lo usan GLoadRegion (entrada @grana/vue/load-region, por __shared) y los anfitriones que ya cargan (#540: GTable en la
// primera entrega). No es API pública: la firma la decide bruno.
//
// Fases (#532): reposo → pendiente (de `loading: true` a DELAY: nada visible) → a la vista (desde DELAY) → espera larga
// (desde SLOW, contado desde el inicio) → llegada (`loading: false` y, si se vio, MINIMUM a la vista). Una carga que acaba
// antes de DELAY no se ve. Una carga que empieza mientras otra espera su mínimo hereda la fase visible (sin volver a
// esconder ni a esperar el retraso; el mínimo sigue contando desde que se vio).
//
//   const phase = createLoadPhase({ onShow, onSlow, onArrive })
//   phase.start({ arm: false })  // en setup, si se monta cargando: estado sin temporizadores (nada en el servidor)
//   phase.arm()                  // en onMounted
//   watch(() => props.loading, (on) => (on ? phase.start() : phase.stop()))
//   phase.state                  // reactivo: { busy, pending, shown, slow }
//   onArrive({ seen })           // la llegada; `seen`: el estado de carga llegó a verse (para el revelado)
//   phase.dispose()              // al desmontar
//
// Sin efectos al importar (#444) y sin tocar document ni window salvo en las utilidades de foco (solo en el cliente).
import { reactive } from 'vue'

/** Constantes de diseño (#532): no son tokens ni props en v1 (reservadas, #543). */
export const DELAY = 200
export const MINIMUM = 400
export const SLOW = 5000

/** Clave de inyección de la región que carga: la comparten GLoadRegion (entrada) y GEmpty (principal) por __shared. */
export const loadRegionKey = Symbol('g-load-region')

export function createLoadPhase({ onShow, onSlow, onArrive } = {}) {
  const state = reactive({ busy: false, pending: false, shown: false, slow: false })
  let tDelay = 0
  let tSlow = 0
  let tArrive = 0
  let shownAt = 0
  let stopped = false // `loading` ya volvió a false: se espera el mínimo

  function show() {
    tDelay = 0
    if (!state.busy || stopped) return
    state.pending = false
    state.shown = true
    shownAt = Date.now()
    if (onShow) onShow()
  }
  function slowNow() {
    tSlow = 0
    if (!state.busy || stopped) return
    state.slow = true
    if (onSlow) onSlow()
  }
  function arrive() {
    tArrive = 0
    const seen = state.shown
    stopped = false
    state.busy = false
    state.pending = false
    state.shown = false
    state.slow = false
    if (onArrive) onArrive({ seen })
  }
  /** Programa los temporizadores que falten (en el cliente). */
  function arm() {
    if (!state.busy || stopped) return
    if (!state.shown && !tDelay) tDelay = setTimeout(show, DELAY)
    if (!state.slow && !tSlow) tSlow = setTimeout(slowNow, SLOW)
  }
  /** Empieza una carga. Devuelve 'new' (empieza de cero) o 'continue' (hereda la fase de la que esperaba su mínimo). */
  function start({ arm: doArm = true } = {}) {
    let kind = 'new'
    if (state.busy) {
      kind = 'continue'
      if (tArrive) { clearTimeout(tArrive); tArrive = 0 }
      stopped = false
    } else {
      state.busy = true
      state.pending = true
      state.shown = false
      state.slow = false
      stopped = false
    }
    if (doArm) arm()
    return kind
  }
  /** Termina la carga: llegada en el acto o al cumplirse el mínimo si se vio. */
  function stop() {
    if (!state.busy || stopped) return
    stopped = true
    clearTimeout(tDelay)
    clearTimeout(tSlow)
    tDelay = 0
    tSlow = 0
    if (state.shown) {
      const wait = MINIMUM - (Date.now() - shownAt)
      if (wait > 0) { tArrive = setTimeout(arrive, wait); return }
    }
    arrive()
  }
  function dispose() {
    clearTimeout(tDelay)
    clearTimeout(tSlow)
    clearTimeout(tArrive)
    tDelay = tSlow = tArrive = 0
  }
  return {
    state,
    start,
    stop,
    arm,
    dispose,
    /** `loading` ya es false y se espera el mínimo (la copia aún no cambia). */
    get waiting() { return stopped }
  }
}

// ---------- Foco (#534) ----------
const FOCUSABLE = 'a[href], area[href], button, input:not([type="hidden"]), select, textarea, iframe, summary, [contenteditable]:not([contenteditable="false"]), [tabindex]'

/** Enfocables de un elemento (él incluido), en orden de documento, sin los deshabilitados. */
export function focusables(el) {
  if (!el || typeof el.querySelectorAll !== 'function') return []
  const list = el.matches && el.matches(FOCUSABLE) ? [el] : []
  for (const n of el.querySelectorAll(FOCUSABLE)) list.push(n)
  return list.filter((n) => !n.disabled && !n.closest('[inert]'))
}

/** Recuerda dónde estaba el foco: la clave del elemento que lo contiene y el índice del enfocado entre los suyos. */
export function rememberFocus(itemEl, key, active) {
  if (!itemEl) return { key: null, index: 0 }
  return { key, index: Math.max(0, focusables(itemEl).indexOf(active)) }
}

/**
 * Devuelve el foco tras una llegada o un cambio de la plantilla (#534): solo si sigue en la raíz o cayó en <body> (si la
 * persona lo movió a otro sitio, no se toca). Va al enfocable del mismo índice del elemento con la misma clave, o a su
 * primero; si la clave ya no existe, a la raíz. Nunca a <body>. `find(key)` da el elemento de esa clave o null.
 */
export function restoreFocus(root, memory, find) {
  if (!root || typeof document === 'undefined') return false
  const a = document.activeElement
  if (a && a !== document.body && a !== root && a !== document.documentElement) return false
  const item = memory && memory.key != null && find ? find(memory.key) : null
  if (item) {
    const list = focusables(item)
    const t = list[memory.index] || list[0]
    if (t) {
      t.focus({ preventScroll: true })
      if (document.activeElement === t) return true
    }
  }
  if (document.activeElement !== root) root.focus({ preventScroll: true })
  return true
}
