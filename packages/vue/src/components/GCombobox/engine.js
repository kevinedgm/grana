// Motor de texto de GCombobox (dueño: bruno). Funciones puras, sin estado ni DOM: comparación sin acentos ni mayúsculas,
// filtro por palabras, trozos con la coincidencia marcada y línea secundaria de una opción.
// Contrato: design/contracts/combobox.md («Reglas de props» · filter, «El panel» · Coincidencia, «Opciones»).

const foldChar = (c) => c.normalize('NFD')[0].toLowerCase()
/** Texto sin acentos ni mayúsculas, carácter a carácter (para poder marcar por posición) */
export const fold = (s) => Array.from(String(s ?? ''), foldChar).join('')
/** Palabras buscadas (plegadas) */
export const tokens = (q) => fold(q).split(/\s+/).filter(Boolean)

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

/**
 * Trozos de `text` con la primera aparición de cada palabra buscada marcada: [{ t, m }].
 * Si la forma plegada no mide lo mismo que el texto (ligaduras, astrales), no se marca nada.
 */
export function parts(text, q) {
  text = String(text ?? '')
  if (!text) return []
  const toks = tokens(q)
  const f = toks.length ? fold(text) : ''
  if (!toks.length || f.length !== text.length) return [{ t: text, m: false }]
  const hit = new Array(text.length).fill(false)
  for (const t of toks) {
    const i = f.indexOf(t)
    if (i !== -1) for (let k = i; k < i + t.length; k++) hit[k] = true
  }
  const out = []
  for (let i = 0; i < text.length; i++) {
    const last = out[out.length - 1]
    if (last && last.m === hit[i]) last.t += text[i]
    else out.push({ t: text[i], m: hit[i] })
  }
  return out
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
