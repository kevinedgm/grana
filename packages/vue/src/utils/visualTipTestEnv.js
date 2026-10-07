// Entorno de pruebas del modo visual del motor del tooltip (tooltip.md §«Modo visual», #433). Solo para *.test.js de
// GTabs, GRadioGroup y GSidebar: jsdom no tiene popover (se simula con un atributo propio) y el estado del motor se
// reinicia entre pruebas. No se exporta desde el paquete.
import { _state } from './tooltip.js'

const ATTR = 'data-vt-open'

export function stubPopover() {
  HTMLElement.prototype.showPopover = function () { this.setAttribute(ATTR, '') }
  HTMLElement.prototype.hidePopover = function () { this.removeAttribute(ATTR) }
}
export function resetEngine() {
  _state.lastHide = -Infinity
  _state.navAt = -Infinity
  _state.navKey = ''
  _state.blockClick = null
}
export const isOpen = (node) => Boolean(node && node.hasAttribute(ATTR))
export const openNodes = (doc = document) => [...doc.querySelectorAll('.g-tooltip')].filter(isOpen)

/** Evento de puntero sintético (jsdom no tiene PointerEvent): MouseEvent con pointerType */
export function pev(type, init = {}) {
  const e = new MouseEvent(type, { bubbles: !/enter|leave/.test(type), cancelable: true, clientX: 0, clientY: 0, button: 0, ...init })
  Object.defineProperty(e, 'pointerType', { value: init.pointerType || 'mouse' })
  return e
}
/** Tecla en el documento (el motor escucha keydown en captura para la navegación y Esc) */
export function press(k, target = document.activeElement || document.body) {
  const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })
  target.dispatchEvent(e)
  return e
}
/** Atributos de accesibilidad del control (para comparar con y sin pista) */
export const ariaOf = (el) => Object.fromEntries([...el.attributes].filter((a) => a.name.startsWith('aria-') || a.name === 'role' || a.name === 'title').map((a) => [a.name, a.value]))
