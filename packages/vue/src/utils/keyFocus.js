// Entrada de navegación por teclado y atributo `data-g-key-focus` (dueño: bruno). Interno, no público.
// Una sola escucha de documento (keydown y pointerdown en captura, con recuento) con DOS señales distintas (#450):
// - NAVEGACIÓN (`nav.at`, `nav.key`; #384, #396): la última entrada fue una tecla que navega (flechas, Inicio, Fin, Re Pág,
//   Av Pág, Tab, F6) sin un `pointerdown` ni otra tecla después. La usa SOLO el motor del tooltip (utils/tooltip.js:
//   «¿la persona navegó hasta aquí?» abre una pista; Tab + Intro que abre un diálogo no la abre).
// - MODALIDAD (`modality.keyboard`, #450, api.md §«Foco visible en controles que WebKit no marca»): la última entrada fue
//   de teclado, cualquier tecla que no es modificador (también Intro, Espacio o una letra), sin un `pointerdown` después.
//   Es la heurística del propio :focus-visible. La siguen TODOS los usuarios de `data-g-key-focus` (anillo de foco): los
//   radios de #441 (GRadioGroup, GCard radio, GWidgetGallery) y las asas de GSlider.
// Regla del atributo: se pone en el `focus` si la modalidad es de teclado; se quita en el `blur` y con cualquier
// `pointerdown`. GSlider además lo pone en el `keydown` de su asa con cualquier tecla que no es modificador (markKey: tras
// un clic, la primera flecha pinta el anillo). El CSS de coco dibuja el anillo con :is(:focus-visible,
// :where([data-g-key-focus]):focus) (radios) o solo con la marca (GSlider, #450).
// Sin lecturas de document o window fuera de acquire() (SSR).
import { onBeforeUnmount, onMounted, watch } from 'vue'

export const ATTR = 'data-g-key-focus'
export const NAV_KEYS = new Set(['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown', 'F6'])
const MODIFIERS = new Set(['Shift', 'Alt', 'Control', 'Meta', 'AltGraph', 'CapsLock', 'Fn'])

/** at: momento de la última tecla de navegación (-Infinity si después hubo puntero u otra tecla); key: cuál fue */
export const nav = { at: -Infinity, key: '' }
/** Modalidad de la última entrada (#450): true tras una tecla que no es modificador; false tras un pointerdown */
export const modality = { keyboard: false }
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
      if (!MODIFIERS.has(e.key)) modality.keyboard = true
    }, o)
    document.addEventListener('pointerdown', () => {
      nav.at = -Infinity
      modality.keyboard = false
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
    modality.keyboard = false
    unmark()
  }
}

/** ¿La última entrada fue una tecla de navegación sin puntero después? (señal del tooltip, #396) */
export const fromNavKey = () => nav.at !== -Infinity
/** ¿La última entrada fue de teclado (cualquier tecla que no es modificador) sin puntero después? (#450) */
export const fromKeyboard = () => modality.keyboard

function mark(el) {
  if (track.marked && track.marked !== el) unmark()
  el.setAttribute(ATTR, '')
  track.marked = el
}

/** focus de un control: marca si la última entrada fue de teclado (regla de modalidad, #450) */
export function onKeyFocus(e) {
  const el = e.currentTarget || e.target
  if (!el || el.nodeType !== 1) return
  if (track.marked && track.marked !== el) unmark()
  if (!track.count || !fromKeyboard()) return
  mark(el)
}
/** keydown en el control enfocado (GSlider, #450): cualquier tecla que no es modificador lo marca */
export function markKey(e) {
  const el = e.currentTarget || e.target
  if (!el || el.nodeType !== 1 || !track.count || MODIFIERS.has(e.key)) return
  mark(el)
}
/** blur: quita la marca */
export function onKeyBlur(e) {
  const el = e.currentTarget || e.target
  if (!el || el.nodeType !== 1) return
  el.removeAttribute(ATTR)
  if (track.marked === el) track.marked = null
}

/**
 * Composable para un componente con radios o asas: instala la escucha al montar (solo mientras `active()` sea verdadero, si se
 * da) y la libera al desmontar. Devuelve los manejadores `onFocus`, `onBlur` y `onKeydown` (este último solo lo usa GSlider) para el control.
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
  return { onFocus: onKeyFocus, onBlur: onKeyBlur, onKeydown: markKey }
}
