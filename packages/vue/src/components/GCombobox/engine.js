// Motor de texto de GCombobox (dueño: bruno). Funciones puras, sin estado ni DOM: filtro por palabras, texto fantasma y
// línea secundaria de una opción. La comparación sin acentos (fold), las palabras buscadas (tokens) y los trozos con la
// coincidencia marcada (parts) viven en utils/match.js (compartidos con GSummary y summaryDiff, summary.md
// «Coincidencia», #356) y llegan a la entrada `@grana/vue/combobox` por `__shared`, sin copia.
// Contrato: design/contracts/combobox.md («Reglas de props» · filter, «El panel» · Coincidencia, «Opciones»).
import { fold } from '../../utils/match.js'

// Texto presente: ni null/undefined ni booleano ni vacío tras recortar (un número cuenta, con String()); la misma
// regla que `present` de GSummary, para que lo que se busca y se anuncia sea exactamente lo que la ficha pinta
const shown = (v) => v != null && typeof v !== 'boolean' && String(v).trim() !== ''
/**
 * Dato visible de `facts` (combobox.md «Dato visible», precisión de #356): `label` y `value` presentes. Solo los
 * visibles se pintan, entran en la búsqueda (`haystack`) y en `secondary()` (ID-about, aria-describedby). GCombobox.vue
 * usa esta misma función para decidir si la ficha lleva `facts` y para avisar del dato sin `label`.
 */
export const visibleFact = (f) => Boolean(f) && typeof f === 'object' && shown(f.label) && shown(f.value)

const haystacks = new WeakMap()
/** Dónde se busca: label, code, description y los valores de los facts VISIBLES (los rótulos no se buscan) */
function haystack(o) {
  let h = haystacks.get(o)
  if (h === undefined) {
    const facts = Array.isArray(o.facts) ? o.facts.filter(visibleFact).map((f) => f.value).join(' ') : ''
    h = fold(`${o.label} ${o.code ?? ''} ${o.description ?? ''} ${facts}`)
    haystacks.set(o, h)
  }
  return h
}
/** Regla por defecto: todas las palabras aparecen en la opción */
export const matches = (o, toks) => {
  const h = haystack(o)
  return toks.every((t) => h.includes(t))
}

/** ¿La etiqueta empieza por el texto (sin acentos ni mayúsculas) y es más larga? Devuelve el resto, o null. */
export function completion(label, typed) {
  label = String(label ?? '')
  const fl = fold(label)
  const ft = fold(typed)
  if (!ft || fl.length !== label.length || ft.length !== typed.length) return null
  if (!fl.startsWith(ft) || label.length <= typed.length) return null
  return label.slice(typed.length)
}

/** Línea secundaria: description; sin ella, los facts VISIBLES como «rótulo valor · rótulo valor»; sin ninguno, '' */
export function secondary(o) {
  if (!o) return ''
  if (typeof o.description === 'string' && o.description) return o.description
  if (Array.isArray(o.facts)) {
    return o.facts
      .filter(visibleFact)
      .map((f) => `${String(f.label).trim()} ${String(f.value).trim()}`)
      .join(' · ')
  }
  return ''
}

export const validOption = (o) =>
  Boolean(o) && typeof o === 'object' && (typeof o.value === 'string' || typeof o.value === 'number') && typeof o.label === 'string' && o.label !== ''
