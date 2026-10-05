// Coincidencia de texto (interno; dueño: bruno). Funciones puras, sin estado ni DOM: comparación sin acentos ni
// mayúsculas, palabras buscadas y trozos con la coincidencia marcada. Es la regla del combobox (#335), compartida con
// GSummary (design/contracts/summary.md «Coincidencia») y con summaryDiff. Las entradas secundarias la toman de
// `__shared` (src/shared.js), sin copia.

const foldChar = (c) => c.normalize('NFD')[0].toLowerCase()
/** Texto sin acentos ni mayúsculas, carácter a carácter (para poder marcar por posición) */
export const fold = (s) => Array.from(String(s ?? ''), foldChar).join('')
/** Palabras buscadas (plegadas) */
export const tokens = (q) => fold(q).split(/\s+/).filter(Boolean)

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
