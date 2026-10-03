// Motor compartido de medida del segmentado de GRadioGroup (dueño: bruno)
// Contrato: design/contracts/radio-group.md «Segmentado: medida y apilado» (DECISIONS.md #271): UN ResizeObserver para
// todas las cajas (__options); la decisión de apilar va FUERA de su devolución (en el cuadro siguiente) y solo escribe si
// cambia (lección de #169: WebKit avisa «ResizeObserver loop»). Sin ResizeObserver (SSR, entornos antiguos) no hace nada:
// el segmentado se queda en una línea, como se pidió.
import { nextFrame } from '../GForm/formContext.js'

const boxes = new Map() // elemento __options → función de ajuste
let observer = null
let pending = new Set()
let scheduled = false

function flush() {
  scheduled = false
  const list = [...pending]
  pending = new Set()
  for (const el of list) {
    const run = boxes.get(el)
    if (run) run()
  }
}

/** Observa el ancho de una caja; `run()` se llama en el cuadro siguiente a cada cambio. Devuelve la función que deja de observar. */
export function observeOptions(el, run) {
  if (typeof ResizeObserver === 'undefined' || !el) return () => {}
  if (!observer) {
    observer = new ResizeObserver((entries) => {
      for (const e of entries) if (boxes.has(e.target)) pending.add(e.target)
      if (pending.size && !scheduled) {
        scheduled = true
        nextFrame(flush)
      }
    })
  }
  const own = observer
  boxes.set(el, run)
  own.observe(el)
  return () => {
    boxes.delete(el)
    pending.delete(el)
    if (typeof own.unobserve === 'function') own.unobserve(el)
    if (!boxes.size && observer === own) {
      own.disconnect()
      observer = null
    }
  }
}
