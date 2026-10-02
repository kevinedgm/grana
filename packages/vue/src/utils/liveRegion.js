// Escritura en un par de canales vivos (interno; dueño: bruno). Extraída de GToaster para compartirla con GSpeechHost
// (speech.md §10: «si el anunciador de GToaster se puede compartir como útil interno, mejor»).
// Patrón (#14, #137, #141): el canal existe y está vacío antes del cambio; para anunciar se vacía y se escribe en el
// siguiente ciclo (`delay`), así un texto idéntico se vuelve a anunciar; pasado `clear` se vacía otra vez.
// Varios anuncios en el mismo ciclo se escriben juntos (con aria-atomic se leen enteros).
//
//   const live = reactive({ polite: '', assertive: '' })
//   const writer = createLiveWriter(live, { delay: 50, clear: 5000 })
//   writer.announce('Texto', 'polite' | 'assertive')
//   writer.dispose()

export function createLiveWriter(live, { delay, clear }) {
  const pending = { polite: [], assertive: [] }
  const writeTimer = { polite: null, assertive: null }
  const clearTimer = { polite: null, assertive: null }
  return {
    announce(text, politeness) {
      const ch = politeness === 'assertive' ? 'assertive' : 'polite'
      clearTimeout(clearTimer[ch])
      live[ch] = ''
      pending[ch].push(text)
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
