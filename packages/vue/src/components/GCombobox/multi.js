// Motor de `multiple` de GCombobox (Fase 2; dueño: bruno). Funciones puras, sin estado ni DOM: identidad de un
// elemento, normalización del modelo, comparación de listas, renglones con rastro y resolución del ancho de la frase.
// Contrato: design/contracts/combobox.md «Fase 2 · Selección múltiple» (DECISIONS.md #417 a #428).
import { fold } from '../../utils/match.js'

/** Identidad de un valor: 1 y '1' son distintos (comparación ===) */
export const keyOf = (v) => (typeof v === 'number' ? 'n' : 's') + v
/** Identidad de un texto libre: sin acentos ni mayúsculas (dos iguales así son el mismo) */
export const keyOfText = (t) => 'c' + fold(t)

/**
 * `modelValue` con `multiple` (#420): arreglo de `value`, nunca null. null, undefined o '' cuentan como []; otro no
 * arreglo como [v] (avisa 'array'); un repetido se queda una vez (avisa 'dup').
 */
export function normValues(v, warn) {
  if (v === null || v === undefined || v === '') return []
  if (!Array.isArray(v)) {
    warn('array')
    v = [v]
  }
  const seen = new Set()
  const out = []
  for (const x of v) {
    if (x === null || x === undefined) continue
    const k = keyOf(x)
    if (seen.has(k)) warn('dup')
    else {
      seen.add(k)
      out.push(x)
    }
  }
  return out
}

/** `custom` con `multiple`: textos recortados y no vacíos; dos iguales sin acentos ni mayúsculas son el mismo */
export function normCustom(v, warn) {
  if (v === null || v === undefined || v === '') return []
  if (!Array.isArray(v)) {
    warn('array')
    v = [v]
  }
  const seen = new Set()
  const out = []
  for (const x of v) {
    if (typeof x !== 'string' || !x.trim()) continue
    const t = x.trim()
    const k = keyOfText(t)
    if (seen.has(k)) warn('dup')
    else {
      seen.add(k)
      out.push(t)
    }
  }
  return out
}

export const sameList = (a, b) => a.length === b.length && a.every((x, i) => x === b[i])

/**
 * Renglones de la receta y la cesta: los vivos en el orden de lo elegido (reutilizando su entrada por clave) y los
 * rastros (`trace`) en el sitio que ocupaban. Un rastro cuya clave vuelve a estar elegida deja de serlo.
 */
export function reconcile(prev, chosen, make) {
  const byKey = new Map(prev.map((e) => [e.key, e]))
  const out = chosen.map((it) => {
    const e = byKey.get(it.key)
    if (!e) return make(it)
    e.item = it
    e.trace = null
    e.leave = false
    return e
  })
  const live = new Set(chosen.map((it) => it.key))
  prev.forEach((e, i) => {
    if (e.trace && !live.has(e.key)) out.splice(Math.min(i, out.length), 0, e)
  })
  return out
}

/**
 * Ancho máximo de la frase en px a partir del `max-inline-size` calculado y del ancho de su celda: px, %, calc(% ± px)
 * o none (toda la celda). Lo que no se entiende cuenta como toda la celda.
 */
export function resolveWidth(max, cell) {
  const s = String(max || '').trim()
  let m = /^([\d.]+)px$/.exec(s)
  if (m) return Math.min(cell, +m[1])
  m = /^([\d.]+)%$/.exec(s)
  if (m) return (cell * m[1]) / 100
  m = /^calc\(([\d.]+)%\s*([+-])\s*([\d.]+)px\)$/.exec(s)
  if (m) return (cell * m[1]) / 100 + (m[2] === '-' ? -1 : 1) * m[3]
  return cell
}
