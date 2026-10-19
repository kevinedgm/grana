// Último destino de un `pointerdown` en el documento, para cuando el clic de ratón no enfoca (WebKit no enfoca botones
// ni enlaces con el ratón: `document.activeElement` queda en <body>). Quien abre algo y debe devolver el foco al cerrar
// (GDialog) pregunta aquí por el control que se pulsó. Sin efectos al importar (#444): la escucha se instala con el
// primer `retainPointer()` y se quita con el último `release`.
import { usable } from './landing.js'

const FOCUSABLE = 'a[href], area[href], button, input:not([type="hidden"]), select, textarea, summary, [contenteditable]:not([contenteditable="false"]), [tabindex]'

let users = 0
let last = null
const onDown = (e) => { const t = e.target; last = t && t.nodeType === 1 ? t : null }
// Una tecla después del clic: la modalidad ya no es el ratón y el destino deja de valer
const onKey = () => { last = null }

export function retainPointer() {
  if (typeof document === 'undefined') return () => {}
  if (users++ === 0) {
    document.addEventListener('pointerdown', onDown, true)
    document.addEventListener('keydown', onKey, true)
  }
  let done = false
  return () => {
    if (done) return
    done = true
    if (--users > 0) return
    document.removeEventListener('pointerdown', onDown, true)
    document.removeEventListener('keydown', onKey, true)
    last = null
  }
}

// ¿Está el foco en ninguna parte? (<body>, <html> o nada)
export const focusNowhere = () => {
  const a = typeof document === 'undefined' ? null : document.activeElement
  return !a || a === document.body || a === document.documentElement
}

// El control enfocable más cercano al último `pointerdown` (él mismo o un ancestro), si sigue conectado y usable.
// `inside` excluye un contenedor (el propio diálogo): lo pulsado dentro de él no es un abridor.
export function pointerOpener(inside) {
  const t = last
  if (!t || !t.isConnected || !t.closest) return null
  const el = t.closest(FOCUSABLE)
  if (!el || (inside && inside.contains(el)) || !usable(el)) return null
  return el
}
