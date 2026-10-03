// Captura de voz · Fase 2 · textos de GTranscript (interno; dueño: bruno). Contrato: design/contracts/speech.md §9 y §27.
// Sin valores por defecto: los pone la aplicación. Las `labels` de la vista se fusionan POR CLAVE sobre las del gestor
// (una clave de la vista gana; lo que no trae, sale del gestor); suelta, son las únicas. Las claves plural admiten String
// con {count} o Function (count) => String cuyo resultado pasa por `fill` con el resto de marcadores (#237).
// Falta una clave → aviso la primera vez que se necesita y el texto queda vacío.
import { fill } from '../../utils/template.js'

export function createLabeler(sources, warn) {
  function raw(path) {
    for (const src of sources()) {
      let v = src
      for (const p of path.split('.')) {
        if (v === null || v === undefined || typeof v !== 'object') { v = undefined; break }
        v = v[p]
      }
      if (v !== undefined && v !== null) return v
    }
    return undefined
  }
  function t(path, vars, { optional = false } = {}) {
    const v = raw(path)
    if (typeof v === 'function') {
      try { return fill(String(v(vars && vars.count) ?? ''), vars) } catch { return '' }
    }
    if (typeof v === 'string') return fill(v, vars)
    if (!optional) warn(`falta labels.${path}: el texto queda vacío.`)
    return ''
  }
  return { raw, t }
}

// Una plantilla con {text} se parte en prefijo y sufijo (envoltura oculta de <del>/<ins>, §22.9)
export function wrapParts(template) {
  const s = typeof template === 'string' ? template : ''
  const i = s.indexOf('{text}')
  return i < 0 ? [s, ''] : [s.slice(0, i), s.slice(i + 6)]
}

// Un prefijo («Original del motor:») va seguido de un espacio
export const withSpace = (text) => (!text ? '' : /\s$/.test(text) ? text : `${text} `)
// Un sufijo oculto se separa con coma del texto visible salvo que ya traiga puntuación
export const asSuffix = (text) => (!text ? '' : /^[\s,.;:·–—-]/.test(text) ? text : `, ${text}`)
