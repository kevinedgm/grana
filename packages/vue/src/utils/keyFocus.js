// Entrada de navegación por teclado y atributo `data-g-key-focus` (dueño: bruno). Interno, no público.
// Una sola escucha de documento (keydown y pointerdown en captura, con recuento) que comparten el motor del tooltip
// (utils/tooltip.js: `nav.at` y `nav.key`, #384) y los radios que necesitan el anillo de foco en WebKit (auditoría de la
// pista, design/lab/tooltip/auditoria-pista.md, hallazgo 1; WCAG 2.4.7): WebKit no marca :focus-visible en el radio al
// que llevan las flechas. El CSS de coco dibuja el anillo con `:is(:focus-visible, :where([data-g-key-focus]):focus)`.
// Regla: el atributo se pone en el `focus` cuando la última entrada fue una tecla de navegación (flechas, Inicio, Fin,
// Re Pág, Av Pág, Tab, Mayús+Tab) sin un `pointerdown` después; se quita en el `blur` y con cualquier `pointerdown`.
// Sin lecturas de document o window fuera de acquire() (SSR).
import { onBeforeUnmount, onMounted, watch } from 'vue'

export const ATTR = 'data-g-key-focus'
export const NAV_KEYS = new Set(['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown', 'F6'])
const MODIFIERS = new Set(['Shift', 'Alt', 'Control', 'Meta', 'AltGraph', 'CapsLock', 'Fn'])

/** at: momento de la última tecla de navegación (-Infinity si después hubo puntero u otra tecla); key: cuál fue */
export const nav = { at: -Infinity, key: '' }
const track = { count: 0, ac: null, marked: null }
export const _track = track

const unmark = () => {
  if (track.marked) track.marked.removeAttribute(ATTR)
  track.marked = null
}

/** Instala la escucha de documento (con recuento). Devuelve la función que la libera. */
export function acquire() {
  if (!track.count++) {
    track.ac = new AbortController()
    const o = { capture: true, signal: track.ac.signal }
    document.addEventListener('keydown', (e) => {
      // Una tecla que no navega (Intro, Espacio, letras) anula la navegación: el foco que pone la interfaz después no es
      // de la persona. Los modificadores no cuentan (Mayús+Tab, Opción+Tab en WebKit)
      if (NAV_KEYS.has(e.key)) { nav.at = Date.now(); nav.key = e.key }
      else if (!MODIFIERS.has(e.key)) nav.at = -Infinity
    }, o)
    document.addEventListener('pointerdown', () => {
      nav.at = -Infinity
      unmark()
    }, o)
  }
  let done = false
  return () => {
    if (done) return
    done = true
    if (--track.count) return
    track.ac.abort()
    track.ac = null
    unmark()
  }
}

/** ¿La última entrada fue una tecla de navegación sin puntero después? */
export const fromNavKey = () => nav.at !== -Infinity

/** focus de un radio: marca si viene de una tecla de navegación */
export function onKeyFocus(e) {
  const el = e.currentTarget || e.target
  if (!el || el.nodeType !== 1) return
  if (track.marked && track.marked !== el) unmark()
  if (!track.count || !fromNavKey()) return
  el.setAttribute(ATTR, '')
  track.marked = el
}
/** blur: quita la marca */
export function onKeyBlur(e) {
  const el = e.currentTarget || e.target
  if (!el || el.nodeType !== 1) return
  el.removeAttribute(ATTR)
  if (track.marked === el) track.marked = null
}

/**
 * Composable para un componente con radios: instala la escucha al montar (solo mientras `active()` sea verdadero, si se
 * da) y la libera al desmontar. Devuelve los manejadores `onFocus` y `onBlur` para el <input type="radio">.
 */
export function useKeyFocus(active) {
  let release = null
  let mounted = false
  const set = (on) => {
    if (on && !release) release = acquire()
    else if (!on && release) { release(); release = null }
  }
  if (active) watch(() => Boolean(active()), (on) => { if (mounted) set(on) })
  onMounted(() => { mounted = true; set(active ? Boolean(active()) : true) })
  onBeforeUnmount(() => { mounted = false; set(false) })
  return { onFocus: onKeyFocus, onBlur: onKeyBlur }
}
