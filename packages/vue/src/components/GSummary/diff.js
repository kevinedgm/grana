// summaryDiff · contraste entre homónimos (dueño: bruno). Contrato: design/contracts/summary.md «Contraste entre
// homónimos» (DECISIONS.md #354). Función pura, sin estado ni DOM: quien compara es el anfitrión de la lista (que ve a
// todas las fichas); GSummary solo pinta lo que recibe en `diff`.
import { fold } from '../../utils/match.js'

const titleKey = (t) => fold(t).trim().replace(/\s+/g, ' ')
const valueOf = (f) => (f && f.label != null && f.value != null ? String(f.value).trim() : '')

/**
 * Recibe un arreglo de objetos con `title` y `facts` y devuelve un arreglo paralelo con el `diff` de cada uno
 * (`{ [label]: 'same' | 'diff' }`), o `null` si no tiene homónimos (mismo título sin acentos ni mayúsculas, recortado y
 * con los espacios colapsados). Un valor es `diff` si ninguna otra ficha del grupo lo tiene en un dato con el mismo
 * `label`; `same` si lo comparte con alguna. Los datos sin valor no entran.
 */
export function summaryDiff(list) {
  const items = Array.isArray(list) ? list : []
  const groups = new Map() // título plegado → { n, seen: Map(label + valor → fichas que lo tienen) }
  const keys = items.map((it) => {
    const k = it && it.title != null ? titleKey(it.title) : ''
    if (!k) return ''
    let g = groups.get(k)
    if (!g) groups.set(k, (g = { n: 0, seen: new Map() }))
    g.n++
    const own = new Set() // una ficha cuenta una vez por par, aunque repita el rótulo
    for (const f of Array.isArray(it.facts) ? it.facts : []) {
      const v = valueOf(f)
      if (v) own.add(`${f.label}\u0000${v}`)
    }
    for (const p of own) g.seen.set(p, (g.seen.get(p) || 0) + 1)
    return k
  })
  return items.map((it, i) => {
    const g = keys[i] ? groups.get(keys[i]) : null
    if (!g || g.n < 2) return null
    const out = {}
    for (const f of Array.isArray(it.facts) ? it.facts : []) {
      const v = valueOf(f)
      if (v) out[f.label] = g.seen.get(`${f.label}\u0000${v}`) > 1 ? 'same' : 'diff'
    }
    return out
  })
}
