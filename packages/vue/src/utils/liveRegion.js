// Escritura en canales vivos (interno; dueño: bruno). Extraída de GToaster para compartirla con GSpeechHost
// (speech.md §10: «si el anunciador de GToaster se puede compartir como útil interno, mejor»).
// Patrón (#14, #137, #141): el canal existe y está vacío antes del cambio; para anunciar se vacía y se escribe en el
// siguiente ciclo (`delay`), así un texto idéntico se vuelve a anunciar; pasado `clear` se vacía otra vez.
// Varios anuncios en el mismo ciclo se escriben juntos (con aria-atomic se leen enteros). Con `unique`, un texto idéntico
// a otro que espera en el mismo ciclo no se repite (canal de página, #533).
//
//   const live = reactive({ polite: '', assertive: '' })
//   const writer = createLiveWriter(live, { delay: 50, clear: 5000 })
//   writer.announce('Texto', 'polite' | 'assertive')
//   writer.dispose()
//
// Canal cortés de PÁGINA (load-region.md «Anuncios», DECISIONS.md #533): un solo `p.g-load-live` (aria-live="polite",
// aria-atomic) por documento, creado por el primer consumidor al montarse y retirado con el último; fuera de toda zona
// aria-busy (al final de <body>) y trasladado al <dialog> modal superior mientras haya uno (utils/topModal.js, como los
// canales de GToaster, #143). Fusión: lo escrito por varias regiones en el mismo ciclo sale en una escritura, unido con un
// espacio; un texto idéntico pendiente no se repite. Nunca assertive. Lo usan GLoadRegion y (segunda entrega) GWidget.
//
//   const release = acquirePageLive()   // al montar (solo en el cliente)
//   announcePage('Cargando muestras.')
//   release()                           // al desmontar
import { createTopModal } from './topModal.js'

export function createLiveWriter(live, { delay, clear, unique = false }) {
  const pending = { polite: [], assertive: [] }
  const writeTimer = { polite: null, assertive: null }
  const clearTimer = { polite: null, assertive: null }
  return {
    announce(text, politeness) {
      const ch = politeness === 'assertive' ? 'assertive' : 'polite'
      clearTimeout(clearTimer[ch])
      live[ch] = ''
      if (!unique || !pending[ch].includes(text)) pending[ch].push(text)
      clearTimeout(writeTimer[ch])
      writeTimer[ch] = setTimeout(() => {
        live[ch] = pending[ch].join(' ')
        pending[ch] = []
        clearTimer[ch] = setTimeout(() => { live[ch] = '' }, clear)
      }, delay)
    },
    dispose() {
      for (const ch of ['polite', 'assertive']) {
        clearTimeout(writeTimer[ch])
        clearTimeout(clearTimer[ch])
        pending[ch] = []
      }
    }
  }
}

// ---------- Canal de página (#533) ----------
export const PAGE_LIVE_DELAY = 50
export const PAGE_LIVE_CLEAR = 5000
// Texto oculto accesible (el patrón permitido): el canal lo crea el script, no una plantilla con clase de coco
const SR_ONLY = 'position:absolute;inline-size:1px;block-size:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap'
let page = null

/** Registra un consumidor del canal de página (lo crea el primero). Devuelve la función que lo retira. Solo en el cliente. */
export function acquirePageLive() {
  if (typeof document === 'undefined' || !document.body) return () => {}
  if (!page) {
    const el = document.createElement('p')
    el.className = 'g-load-live'
    el.setAttribute('aria-live', 'polite')
    el.setAttribute('aria-atomic', 'true')
    el.style.cssText = SR_ONLY
    const live = {
      get polite() { return el.textContent },
      set polite(v) { el.textContent = v },
      assertive: ''
    }
    const host = (top) => {
      const to = top || document.body
      if (el.parentNode !== to) to.appendChild(el)
    }
    const tm = createTopModal({ onChange: host })
    page = { el, count: 0, tm, writer: createLiveWriter(live, { delay: PAGE_LIVE_DELAY, clear: PAGE_LIVE_CLEAR, unique: true }) }
    document.body.appendChild(el)
    tm.scan()
    tm.sync()
    tm.observe()
  }
  page.count++
  let done = false
  return () => {
    if (done || !page) return
    done = true
    if (--page.count > 0) return
    page.writer.dispose()
    page.tm.disconnect()
    page.el.remove()
    page = null
  }
}

/** Escribe en el canal de página (cortés, con fusión). Sin consumidores montados, no hace nada. */
export function announcePage(text) {
  if (!page || text == null || text === '') return
  // El <dialog> que lo alojaba pudo salir del documento sin cerrarse: vuelve al modal superior que quede o a <body>
  if (!page.el.isConnected) page.tm.sync()
  page.writer.announce(String(text), 'polite')
}

/** El nodo del canal (pruebas y verificación); null si no hay consumidores. */
export const pageLiveNode = () => (page ? page.el : null)
