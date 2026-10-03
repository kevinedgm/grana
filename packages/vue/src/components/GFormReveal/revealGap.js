// Separación del contenedor de GFormReveal (dueño: bruno)
// Contrato: design/contracts/form.md §14 «Transición» (#278): --_reveal-gap = row-gap calculado del elemento padre (0 si
// no es un número). UN ResizeObserver compartido por todos los bloques, observando a cada padre; las lecturas van fuera
// de su devolución (en requestAnimationFrame) y quien escribe solo lo hace si cambia (lección de #169 / #173).
import { nextFrame } from '../GForm/formContext.js'

/** row-gap calculado de un elemento en px; 0 si no es un número (`normal`, sin estilo, SSR). */
export function rowGapOf(el) {
  if (!el || typeof getComputedStyle !== 'function') return 0
  const raw = getComputedStyle(el).rowGap
  if (!raw || !/^-?[\d.]+(e-?\d+)?px$/i.test(String(raw).trim())) return 0
  const n = parseFloat(raw)
  return Number.isFinite(n) ? n : 0
}

const parents = new Map() // padre → Set de devoluciones
let observer = null
let pending = new Set()
let scheduled = false

function flush() {
  scheduled = false
  const list = [...pending]
  pending = new Set()
  for (const p of list) for (const fn of parents.get(p) || []) fn()
}

/**
 * Llama a `fn` (en el cuadro siguiente) cada vez que `parent` cambia de tamaño. Devuelve la función que deja de observar.
 * Sin ResizeObserver (SSR, entornos antiguos) no hace nada.
 */
export function observeParent(parent, fn) {
  if (!parent || typeof ResizeObserver === 'undefined') return () => {}
  if (!observer) {
    observer = new ResizeObserver((entries) => {
      for (const e of entries) if (parents.has(e.target)) pending.add(e.target)
      if (pending.size && !scheduled) {
        scheduled = true
        nextFrame(flush)
      }
    })
  }
  const own = observer
  let set = parents.get(parent)
  if (!set) {
    set = new Set()
    parents.set(parent, set)
    own.observe(parent)
  }
  set.add(fn)
  return () => {
    const s = parents.get(parent)
    if (!s) return
    s.delete(fn)
    if (s.size) return
    parents.delete(parent)
    pending.delete(parent)
    if (typeof own.unobserve === 'function') own.unobserve(parent)
    if (!parents.size && observer === own) {
      own.disconnect()
      observer = null
    }
  }
}
