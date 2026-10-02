// Seguimiento del <dialog> modal superior (interno; dueño: bruno). Extraído de GToaster (#141) para compartirlo con
// GSpeechHost (speech.md §6.6, DECISIONS.md #213): un solo MutationObserver por usuario, filtrado al atributo `open`,
// y una pila de los <dialog> que están en `:modal`. No es API pública.
//
//   const tm = createTopModal({ ignore: (d) => root.contains(d), onChange: (top) => { … } })
//   tm.scan()      // pila inicial con los <dialog> modales ya abiertos (al montar)
//   tm.observe()   // empieza a observar (un <dialog> hermano posterior puede abrirse en este mismo ciclo)
//   tm.top()       // el modal superior o null
//   tm.disconnect()
//
// `ignore(dialog)` deja fuera los <dialog> propios del usuario (la hoja móvil de GSpeechHost, que es modal pero es suya).
// Solo en el cliente: importar el módulo no toca document.

/** ¿El <dialog> está en modo modal? (sin soporte de :modal: basta con `open`) */
export function isModal(d) {
  try { return d.matches(':modal') } catch { return d.hasAttribute('open') }
}

export function createTopModal({ ignore = () => false, onChange = () => {} } = {}) {
  const stack = []
  let observer = null
  const skip = (d) => {
    try { return Boolean(ignore(d)) } catch { return false }
  }
  const top = () => stack[stack.length - 1] || null
  // Quita de la pila lo que ya no está abierto, conectado o modal y avisa del modal superior
  function sync() {
    for (let i = stack.length - 1; i >= 0; i--) {
      const d = stack[i]
      if (!d.isConnected || !d.hasAttribute('open') || !isModal(d) || skip(d)) stack.splice(i, 1)
    }
    onChange(top())
  }
  function onMutations(records) {
    for (const m of records) {
      const d = m.target
      if (!d || d.localName !== 'dialog' || skip(d)) continue
      const i = stack.indexOf(d)
      const on = d.isConnected && d.hasAttribute('open') && isModal(d)
      if (on && i < 0) stack.push(d)
      else if (!on && i >= 0) stack.splice(i, 1)
    }
    sync()
  }
  return {
    top,
    sync,
    scan() {
      if (typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') return
      for (const d of document.querySelectorAll('dialog[open]')) if (isModal(d) && !skip(d) && !stack.includes(d)) stack.push(d)
    },
    observe() {
      if (observer || typeof MutationObserver === 'undefined' || typeof document === 'undefined') return
      observer = new MutationObserver(onMutations)
      observer.observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['open'] })
    },
    disconnect() {
      if (observer) observer.disconnect()
      observer = null
      stack.length = 0
    }
  }
}
