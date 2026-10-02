// Motor compartido de GFormRow (dueño: bruno)
// Contrato: design/contracts/form.md §4, punto 5: UN ResizeObserver para todas las filas; las escrituras van fuera de su
// devolución (en requestAnimationFrame) y solo si cambian (lección de #169: WebKit avisa «ResizeObserver loop»).
import { nextFrame } from '../GForm/formContext.js'

/** Raíces montadas por GFormRow: distinguen una fila real de un `div.g-form-row` heredado de la Fase 1 (aviso de GFormLayout). */
export const rowRoots = new WeakSet()

const rows = new Map() // elemento → { width, run }
let observer = null
let pending = new Set()
let scheduled = false

function flush() {
  scheduled = false
  const list = [...pending]
  pending = new Set()
  for (const el of list) {
    const r = rows.get(el)
    if (r) r.run(r.width)
  }
}

/** Programa el cálculo de una fila en el cuadro siguiente (agrupa todas las filas en un solo cuadro). */
export function scheduleRow(el) {
  if (!rows.has(el)) return
  pending.add(el)
  if (!scheduled) {
    scheduled = true
    nextFrame(flush)
  }
}

function widthOf(entry) {
  const box = entry.contentBoxSize && (entry.contentBoxSize[0] || entry.contentBoxSize)
  if (box && box.inlineSize !== undefined) return box.inlineSize
  return entry.contentRect ? entry.contentRect.width : 0
}

/**
 * Observa el ancho de contenido de una fila. `run(width)` se llama en el cuadro siguiente a cada cambio
 * (y a cada `scheduleRow`). Devuelve la función que deja de observar. Sin ResizeObserver (SSR, entornos antiguos)
 * no hace nada: la fila se queda con un hijo por línea (form.md §4, punto 4).
 */
export function observeRow(el, run) {
  if (typeof ResizeObserver === 'undefined') return () => {}
  if (!observer) {
    observer = new ResizeObserver((entries) => {
      for (const e of entries) {
        const r = rows.get(e.target)
        if (!r) continue
        r.width = +widthOf(e).toFixed(2)
        scheduleRow(e.target)
      }
    })
  }
  const own = observer
  rows.set(el, { width: 0, run })
  own.observe(el)
  return () => {
    rows.delete(el)
    pending.delete(el)
    if (typeof own.unobserve === 'function') own.unobserve(el)
    if (!rows.size && observer === own) {
      own.disconnect()
      observer = null
    }
  }
}

/** Ancho conocido de una fila (el último medido), o 0 si aún no se midió. */
export function knownWidth(el) {
  return rows.get(el)?.width || 0
}
