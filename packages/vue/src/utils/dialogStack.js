// Pila de los GDialog abiertos (interno; dueño: bruno). L3 y L4 de design/lab/dialog/r02/declaracion.md: un GDialog que se
// abre con otro modal de Grana debajo lleva `is-stacked` (un solo fondo, lo pinta coco) y su fondo no cierra (solo el nivel 1
// cierra con el clic en el fondo, si `closeOnBackdrop` lo permite). No es API pública.
//
//   const entry = { el, set(stacked) {…} }
//   pushDialog(entry)    // al abrir: entra arriba y se decide su estado (antes de showModal(), para el primer estilo)
//   removeDialog(entry)  // al cerrar (cierre nativo) o desmontar: los de encima se recalculan; el que sale conserva el suyo
//                        // durante la transición de salida (su fondo no reaparece a mitad de la salida)
//
// Orden = orden de apertura (el del top layer). «Otro modal de Grana» = otro GDialog de la pila u otro <dialog> modal
// abierto de la librería (clase `g-*`, p. ej. la hoja de GSpeechHost), mirado al abrir.
import { isModal } from './topModal.js'

const open = []

// L2: `cancel` no trae `repeat`. Mientras haya algún GDialog abierto, una escucha de `keydown` en captura sobre el documento
// marca la Esc repetida hasta la tarea siguiente: el `cancel` nativo que provoque (síncrono, dentro de la misma pulsación)
// se ignora aunque no haya pasado por el `keydown` del diálogo (foco en body).
let repeating = false
let listening = false
function onDocKeydown(event) {
  if (event.key !== 'Escape' || !event.repeat) return
  repeating = true
  setTimeout(() => { repeating = false }, 0)
}
function listen(on) {
  if (on === listening || typeof document === 'undefined') return
  listening = on
  document[on ? 'addEventListener' : 'removeEventListener']('keydown', onDocKeydown, true)
}
/** ¿La pulsación de Esc en curso es una repetición de la tecla mantenida? */
export const escRepeating = () => repeating

function libraryModalBelow(self) {
  if (typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') return false
  for (const d of document.querySelectorAll('dialog[open]')) {
    if (d === self || open.some((e) => e.el === d)) continue
    if (/(^|\s)g-/.test(d.className || '') && isModal(d)) return true
  }
  return false
}

function refresh() {
  open.forEach((e, i) => e.set(i > 0 || e.foreign))
}

export function pushDialog(entry) {
  const i = open.indexOf(entry)
  if (i >= 0) open.splice(i, 1)
  entry.foreign = libraryModalBelow(entry.el)
  open.push(entry)
  listen(true)
  refresh()
}

export function removeDialog(entry) {
  const i = open.indexOf(entry)
  if (i < 0) return
  open.splice(i, 1)
  if (!open.length) listen(false)
  refresh()
}

/** Solo para pruebas: vacía la pila. */
export function resetDialogStack() {
  open.length = 0
  listen(false)
  repeating = false
}
