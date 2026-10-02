// GIcon · dibujo común del <svg> (dueño: bruno). Contrato: docs/contract/icons.md v0.2 §2.3.
// Lo usan GIcon (público) y el icono interno de los componentes (GLibIcon): mismo marcado, distinta resolución.
import { h } from 'vue'

export const isDev = () => typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'

// Avisos de desarrollo: una vez por causa y nombre
const warned = new Set()
export function warnOnce(key, msg) {
  if (!isDev() || warned.has(key)) return
  warned.add(key)
  console.warn(`[Grana GIcon] ${msg}`)
}

/**
 * <svg> de Lucide con los atributos fijos de §2.3. `paths` es una cadena ya validada (lista de la librería
 * generada por build-icons.mjs o entrada aceptada por createIcons): solo elementos de dibujo.
 */
export function renderSvg(paths, { filled = false, flipRtl = false, label = '', attrs = {}, ref } = {}) {
  const named = typeof label === 'string' && label !== ''
  return h('svg', {
    ...attrs,
    ref,
    class: ['g-icon', { 'g-icon--filled': filled, 'g-icon--flip-rtl': flipRtl }, attrs.class],
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 24 24',
    fill: filled ? 'currentColor' : 'none',
    stroke: 'currentColor',
    'stroke-width': 2,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    focusable: 'false',
    'aria-hidden': named ? undefined : 'true',
    role: named ? 'img' : undefined,
    'aria-label': named ? label : undefined,
    innerHTML: paths
  })
}
