// Motor del grupo de personas (dueño: bruno). Interno de la entrada @grana/vue/booking (booking-bar.md «GPartyField», #738):
// valores por fila, máximos dependientes y el resumen en palabras que usan GPartyField y el resumen de GBookingBar.
import { fill } from '../../utils/template.js'

export const isNum = (v) => typeof v === 'number' && Number.isFinite(v)
/** Filas válidas: objeto con key y label. */
export const validRows = (rows) => (Array.isArray(rows) ? rows.filter((r) => r && typeof r === 'object' && r.key !== undefined && r.key !== null && r.key !== '') : [])
export const minOf = (row) => (isNum(row.min) ? row.min : 0)
/** max de la fila: número o función del valor del grupo (habitaciones ≤ adultos). */
export const maxOf = (row, value) => {
  const m = typeof row.max === 'function' ? row.max(value) : row.max
  return isNum(m) ? m : undefined
}
/** El valor del grupo completo: lo dado por la aplicación y, para lo que falta, default o min de cada fila. */
export function completeParty(rows, value) {
  const out = {}
  const v = value && typeof value === 'object' ? value : {}
  for (const r of validRows(rows)) out[r.key] = isNum(v[r.key]) ? v[r.key] : isNum(r.default) ? r.default : minOf(r)
  return out
}
/** Corrige a la baja lo que excede un max dependiente (no recorta en silencio el min: lo valida la aplicación). */
export function clampParty(rows, value) {
  let next = value
  for (const r of validRows(rows)) {
    const max = maxOf(r, next)
    if (max !== undefined && next[r.key] > max) next = { ...next, [r.key]: max }
  }
  return next
}
/** Resumen: las piezas `unit` de las filas con valor > 0 (y siempre la primera), unidas por `separator`. */
export function partySummary(rows, value, separator, nf) {
  const parts = []
  validRows(rows).forEach((r, i) => {
    const n = value[r.key]
    if (!(i === 0 || n > 0)) return
    const u = r.unit
    const count = nf ? nf.format(n) : String(n)
    parts.push(typeof u === 'function' ? String(u(n)) : typeof u === 'string' ? fill(u, { count }) : `${count} ${r.label}`)
  })
  return parts.join(typeof separator === 'string' ? separator : ' ')
}
