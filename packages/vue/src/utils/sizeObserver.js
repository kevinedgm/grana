// Observador de tamaño compartido (interno; dueño: bruno). UN ResizeObserver para todos los que lo usan (bloques de
// GFormReveal observando a su padre, secciones de GFormSection observando su raíz y sus acciones; #173, #278, #289).
// Las devoluciones van fuera de la del observador, en el cuadro siguiente (requestAnimationFrame): quien escribe lo hace
// ahí y solo si cambia, así ninguna devolución del observador cambia el DOM de forma síncrona (lección de #169 / #173).
import { nextFrame } from '../components/GForm/formContext.js'

const targets = new Map() // elemento → Set de devoluciones
let observer = null
let pending = new Set()
let scheduled = false

function flush() {
  scheduled = false
  const list = [...pending]
  pending = new Set()
  for (const el of list) for (const fn of [...(targets.get(el) || [])]) fn()
}

/**
 * Llama a `fn` (en el cuadro siguiente) cada vez que `el` cambia de tamaño. Devuelve la función que deja de observar.
 * Sin ResizeObserver (SSR, entornos antiguos) no hace nada.
 */
export function observeSize(el, fn) {
  if (!el || typeof ResizeObserver === 'undefined') return () => {}
  if (!observer) {
    observer = new ResizeObserver((entries) => {
      for (const e of entries) if (targets.has(e.target)) pending.add(e.target)
      if (pending.size && !scheduled) {
        scheduled = true
        nextFrame(flush)
      }
    })
  }
  const own = observer
  let set = targets.get(el)
  if (!set) {
    set = new Set()
    targets.set(el, set)
    own.observe(el)
  }
  set.add(fn)
  return () => {
    const s = targets.get(el)
    if (!s) return
    s.delete(fn)
    if (s.size) return
    targets.delete(el)
    pending.delete(el)
    if (typeof own.unobserve === 'function') own.unobserve(el)
    if (!targets.size && observer === own) {
      own.disconnect()
      observer = null
    }
  }
}
