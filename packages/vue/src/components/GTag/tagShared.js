// Piezas internas compartidas por GTag y GTagGroup (dueño: bruno). INTERNO: no se exporta desde src/index.js.
// Contrato: design/contracts/tag.md (#460 a #473).
import { Comment, Fragment, Text } from 'vue'
import { fill } from '../../utils/template.js'

/** Contenido real en un slot: ni comentarios ni solo espacios */
export const hasContent = (nodes) => (nodes || []).some((n) => {
  if (n == null || typeof n === 'boolean' || n.type === Comment) return false
  if (typeof n === 'string') return n.trim() !== ''
  if (n.type === Text) return String(n.children).trim() !== ''
  if (n.type === Fragment) return hasContent(n.children)
  return true
})

/**
 * Clave interna (#463, «Mecanismo interno»): GTagGroup la provee a cada GTag que pinta (con un proveedor por etiqueta) y
 * solo GTag la inyecta. Su valor es una función que devuelve el contexto actual de la etiqueta:
 *   { ghost, ghostW, plain, removeName, undoName, remove(source, event), undo(event) }
 * Ninguna prop, slot ni evento público.
 */
export const tagItemKey = Symbol('GTagItem')

export const isDev = () => typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'

/** Una cadena vacía o solo con espacios cuenta como ausente; un número se convierte con String() */
export const present = (v) => {
  if (v === undefined || v === null || v === false) return undefined
  const s = String(v).trim()
  return s === '' ? undefined : s
}

/** Texto de `labels[key]` (cadena con marcadores o función con las mismas variables); undefined si falta */
export function say(labels, key, vars = {}) {
  const v = labels ? labels[key] : undefined
  if (typeof v === 'function') {
    const r = v(vars)
    return r === undefined || r === null ? undefined : String(r)
  }
  if (typeof v === 'string') return fill(v, vars)
  return undefined
}

export const SEMANTIC = new Set(['brand', 'primary', 'accent', 'success', 'warning', 'danger', 'info', 'error'])

/** `color` de una etiqueta: { kind: 'none' | 'neutral' | 'cat' | 'invalid', k?, value? } (como GAvatar) */
export function colorInfo(c) {
  if (c === undefined || c === null || c === '') return { kind: 'none' }
  if (c === 'neutral') return { kind: 'neutral' }
  const n = typeof c === 'number' ? c : /^\s*\d+\s*$/.test(c) ? Number(c) : NaN
  if (Number.isInteger(n) && n >= 1 && n <= 12) return { kind: 'cat', k: n }
  return { kind: 'invalid', value: c }
}
export const validCategories = (n) => Number.isInteger(n) && n >= 0 && n <= 12

/** Texto de los avisos 3 / G8 para un `color` inválido */
export const colorWarning = (v) => SEMANTIC.has(String(v))
  ? `color="${v}" se ignora: una etiqueta no lleva color semántico (diría un estado). Para el estado o la cantidad de otra cosa, GBadge; aquí, 'neutral' o una categoría de 1 a 12.`
  : `color="${v}" se ignora: acepta 'neutral' o una categoría de 1 a 12 (número o cadena numérica).`

/** ¿El texto de una etiqueta está recortado? (tag.md §«Pista visual»: scrollWidth > clientWidth + 1) */
export const isCut = (text) => Boolean(text) && text.scrollWidth > text.clientWidth + 1

/**
 * Medida por lotes del recorte (#470): un ResizeObserver sobre los textos de las etiquetas con control; guarda el resultado
 * por elemento. `refresh(root)` vuelve a observar los textos actuales y mide todos de una vez (después de cada parcheo).
 * Sin ResizeObserver (jsdom, SSR) `cut(text)` mide en el momento.
 */
export function createCutWatcher() {
  const seen = new WeakMap()
  let ro = null
  let watched = []
  const measure = (els) => {
    // Primero todas las lecturas (un solo cálculo de estilo), sin escrituras intercaladas
    for (const el of els) seen.set(el, isCut(el))
  }
  return {
    refresh(root) {
      if (!root || typeof root.querySelectorAll !== 'function') return
      const els = [...root.querySelectorAll('.g-tag__text')]
      if (typeof ResizeObserver === 'function') {
        if (!ro) ro = new ResizeObserver((entries) => measure(entries.map((e) => e.target)))
        const keep = new Set(els)
        for (const el of watched) if (!keep.has(el)) ro.unobserve(el)
        const had = new Set(watched)
        for (const el of els) if (!had.has(el)) ro.observe(el)
        watched = els
      }
      measure(els)
    },
    cut(text) {
      if (!text) return false
      return seen.has(text) ? seen.get(text) : isCut(text)
    },
    dispose() {
      if (ro) ro.disconnect()
      ro = null
      watched = []
    }
  }
}

/** Contenido interactivo en un slot de texto (avisos 6): comprobado sobre el DOM ya montado */
export const INTERACTIVE = 'a, button, input, select, textarea, [tabindex]'
