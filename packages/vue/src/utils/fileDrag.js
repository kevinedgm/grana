// Arrastre de archivos sobre la página (interno; dueño: bruno). Contrato: design/contracts/file-field.md «Arrastre de página y
// destino» (DECISIONS.md #373; L11, L19). Vive en la entrada `@grana/vue/file-field`: solo lo usan los campos de archivos.
//
// UN juego de escuchas en `document` (dragenter, dragleave, dragover, drop, dragend), en fase de burbuja, que se instala con
// el PRIMER campo montado y se retira con el ÚLTIMO (cuenta de referencias). Estado reactivo de solo lectura:
//   { dragging, types, count }  solo arrastres con 'Files' en dataTransfer.types; types = MIME de los items de tipo archivo
//   modal                        el <dialog> modal superior (utils/topModal.js) o null: un campo fuera de él no despierta y
//                                traslada sus anuncios a una región dentro de él
// Protección siempre activa mientras haya un campo montado: un dragover con archivos que nadie atendió (!defaultPrevented)
// recibe preventDefault() y dropEffect 'none', y un drop con archivos que nadie atendió recibe preventDefault(): el navegador
// no navega al archivo y la página no pierde lo escrito (r01, 13). Un destino propio de la aplicación que llama a
// preventDefault() en su elemento sigue funcionando.
//
// Importar el módulo no toca document (SSR): todo ocurre en acquire().
import { markRaw, shallowReactive, shallowReadonly } from 'vue'
import { createTopModal } from './topModal.js'

const state = shallowReactive({ dragging: false, types: [], count: 0, modal: null })
/** Estado de solo lectura del arrastre de página. */
export const fileDrag = shallowReadonly(state)

/** ¿El evento arrastra archivos? */
export const hasFiles = (e) => {
  const types = e && e.dataTransfer ? e.dataTransfer.types : null
  if (!types) return false
  return typeof types.includes === 'function' ? types.includes('Files') : Array.prototype.indexOf.call(types, 'Files') >= 0
}

let refs = 0
let depth = 0
let tm = null

function reset() {
  depth = 0
  if (state.dragging) state.dragging = false
  if (state.count) state.count = 0
  if (state.types.length) state.types = []
}
function onEnter(e) {
  if (!hasFiles(e)) return
  depth++
  const items = e.dataTransfer && e.dataTransfer.items ? Array.from(e.dataTransfer.items).filter((i) => i.kind === 'file') : []
  if (!state.dragging) {
    state.types = items.map((i) => i.type || '')
    state.count = items.length
    state.dragging = true
  }
}
function onLeave(e) {
  if (!hasFiles(e) || !state.dragging) return
  depth = Math.max(0, depth - 1)
  if (!depth) reset() // salió de la ventana
}
function onOver(e) {
  if (!hasFiles(e)) return
  if (!state.dragging) onEnter(e) // un arrastre que entró antes de montar el primer campo
  if (!e.defaultPrevented) {
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'none'
  }
}
function onDrop(e) {
  if (hasFiles(e) && !e.defaultPrevented) e.preventDefault()
  reset()
}
function onEnd() {
  reset()
}

function install() {
  document.addEventListener('dragenter', onEnter)
  document.addEventListener('dragleave', onLeave)
  document.addEventListener('dragover', onOver)
  document.addEventListener('drop', onDrop)
  document.addEventListener('dragend', onEnd)
  tm = createTopModal({ onChange: (top) => { state.modal = top ? markRaw(top) : null } })
  tm.scan()
  tm.observe()
  tm.sync()
}
function uninstall() {
  document.removeEventListener('dragenter', onEnter)
  document.removeEventListener('dragleave', onLeave)
  document.removeEventListener('dragover', onOver)
  document.removeEventListener('drop', onDrop)
  document.removeEventListener('dragend', onEnd)
  if (tm) tm.disconnect()
  tm = null
  state.modal = null
  reset()
}

/** Instala las escuchas con el primer campo; devuelve la función que las suelta (la última las retira). Solo en el cliente. */
export function acquireFileDrag() {
  if (typeof document === 'undefined') return () => {}
  if (refs++ === 0) install()
  let done = false
  return () => {
    if (done) return
    done = true
    if (--refs === 0) uninstall()
  }
}

/** Para pruebas: cuántos campos tienen las escuchas instaladas. */
export const fileDragRefs = () => refs
