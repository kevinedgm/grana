// Motor de texto de GCombobox (dueño: bruno). Funciones puras, sin estado ni DOM: filtro por palabras, texto fantasma y
// línea secundaria de una opción. La comparación sin acentos (fold), las palabras buscadas (tokens) y los trozos con la
// coincidencia marcada (parts) viven en utils/match.js (compartidos con GSummary y summaryDiff, summary.md
// «Coincidencia», #356) y llegan a la entrada `@grana/vue/combobox` por `__shared`, sin copia.
// Contrato: design/contracts/combobox.md («Reglas de props» · filter, «El panel» · Coincidencia, «Opciones»).
import { fold } from '../../utils/match.js'

const haystacks = new WeakMap()
/** Dónde se busca: label, code, description y los valores de facts */
function haystack(o) {
  let h = haystacks.get(o)
  if (h === undefined) {
    const facts = Array.isArray(o.facts) ? o.facts.map((f) => (f && f.value != null ? f.value : '')).join(' ') : ''
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

/** Línea secundaria: description; sin ella, los facts como «rótulo valor · rótulo valor»; sin ninguno, '' */
export function secondary(o) {
  if (!o) return ''
  if (typeof o.description === 'string' && o.description) return o.description
  if (Array.isArray(o.facts)) {
    return o.facts
      .filter((f) => f && f.value != null && f.value !== '')
      .map((f) => (f.label ? `${f.label} ${f.value}` : String(f.value)))
      .join(' · ')
  }
  return ''
}

export const validOption = (o) =>
  Boolean(o) && typeof o === 'object' && (typeof o.value === 'string' || typeof o.value === 'number') && typeof o.label === 'string' && o.label !== ''
