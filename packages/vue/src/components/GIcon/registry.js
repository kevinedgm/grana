// GIcon · registro de iconos de la aplicación (dueño: bruno)
// Contrato: docs/contract/icons.md v0.2 §5 · DECISIONS.md #198, #200, #201.
// createIcons([...cadenas de lucide-static]) → plugin de Vue por aplicación (provide/inject, sin global de módulo).
// Validación ESTRICTA por texto (sin DOMParser: funciona en SSR), igual en desarrollo y producción; nunca lanza.
// Importar este módulo o llamar a createIcons no toca document ni window.
import { inject, markRaw } from 'vue'
import { ICONS } from '../../icons/lucide.js'

// Clave de inyección (InjectionKey) para `provide` manual (pruebas, microfrontends, un subárbol con otro registro)
export const iconsKey = Symbol('GIcons')

// Acceso interno al mapa nombre → trazos (no es API: la forma del registro no se documenta)
const MAP = Symbol('GIcons.map')

const isDev = () => typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const PREFIX = '[Grana GIcon]'

// §5.3: elementos de dibujo y atributos geométricos admitidos
const TAGS = new Set(['path', 'circle', 'rect', 'line', 'ellipse', 'polyline', 'polygon'])
const ATTRS = new Set(['d', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'width', 'height', 'points', 'fill'])
const VALUE = /^[-0-9a-zA-Z .,]*$/
const FILL = new Set(['none', 'currentColor'])

// Un único <svg …>…</svg>; el nombre sale de la marca class="lucide lucide-<nombre>" de la etiqueta de apertura
const SVG = /^<svg(\s[^<>]*)?>([\s\S]*)<\/svg>$/
const MARK = /\sclass="lucide lucide-([a-z0-9]+(?:-[a-z0-9]+)*)"/
// Un elemento vacío y autocerrado con atributos entre comillas dobles, precedido solo de espacio en blanco
const ELEMENT = /\s*<([a-z]+)((?:\s+[a-zA-Z0-9:_-]+="[^"<>]*")*)\s*\/>/y
const ATTR = /\s+([a-zA-Z0-9:_-]+)="([^"<>]*)"/g

/**
 * Valida una entrada de createIcons (icons.md §5.3).
 * @returns {{ name: string, paths: string } | { error: string, name?: string }}
 */
export function parseLucide(src) {
  if (typeof src !== 'string') return { error: 'no es una cadena de lucide-static (¿un componente u objeto?)' }
  const text = src.trim()
  const svg = SVG.exec(text)
  if (!svg) return { error: 'no es un único <svg> de lucide-static (el nombre no se escribe: se importa la cadena)' }
  const mark = MARK.exec(svg[1] || '')
  if (!mark) return { error: 'no viene de Lucide (falta class="lucide lucide-<nombre>")' }
  const name = mark[1]
  const inner = svg[2]
  const out = []
  ELEMENT.lastIndex = 0
  let pos = 0
  while (pos < inner.length) {
    if (!/\S/.test(inner.slice(pos))) break // solo queda espacio en blanco
    ELEMENT.lastIndex = pos
    const m = ELEMENT.exec(inner)
    if (!m) return { name, error: 'contenido no admitido (marcado fuera de los elementos de dibujo de Lucide)' }
    const tag = m[1]
    if (!TAGS.has(tag)) return { name, error: `elemento <${tag}> no admitido` }
    let attrs = ''
    for (const a of m[2].matchAll(ATTR)) {
      const [, key, value] = a
      if (!ATTRS.has(key)) return { name, error: `atributo «${key}» no admitido` }
      if (!VALUE.test(value) || (key === 'fill' && !FILL.has(value))) return { name, error: `valor de «${key}» no admitido` }
      attrs += ` ${key}="${value}"`
    }
    out.push(`<${tag}${attrs}/>`)
    pos = ELEMENT.lastIndex
  }
  if (!out.length) return { name, error: 'el <svg> no tiene elementos de dibujo' }
  return { name, paths: out.join('') }
}

/**
 * Crea el registro de iconos de la aplicación (plugin de Vue). `app.use(createIcons([LockOpen, MapPin]))`.
 * @param {string[]} icons cadenas tal como las exporta lucide-static
 */
export function createIcons(icons) {
  const warn = (msg) => { if (isDev()) console.warn(`${PREFIX} ${msg}`) }
  const map = new Map()
  if (!Array.isArray(icons)) {
    warn('createIcons espera un arreglo de cadenas de lucide-static (import { LockOpen } from \'lucide-static\'): el registro queda vacío.')
  } else {
    icons.forEach((entry, i) => {
      const r = parseLucide(entry)
      if (r.error) {
        warn(`createIcons: se ignora la entrada ${i}${r.name ? ` («${r.name}»)` : ''}: ${r.error}. Solo se registran cadenas de lucide-static; lo que no es Lucide va por slot.`)
        return
      }
      const prev = map.get(r.name)
      if (prev === undefined) map.set(r.name, r.paths)
      else if (prev !== r.paths) warn(`createIcons: «${r.name}» está dos veces con dibujos distintos (¿dos versiones de lucide-static?): se queda el primero.`)
    })
  }
  const registry = {
    [MAP]: map,
    install(app) {
      const ctx = app._context
      const prev = typeof app.runWithContext === 'function' ? app.runWithContext(() => inject(iconsKey, null)) : null
      if (prev && prev !== registry) {
        warn('ya había un registro de iconos en esta aplicación: el nuevo lo sustituye (no se mezclan). Pasa todos los iconos en una sola lista a createIcons.')
        if (ctx && ctx.provides) { ctx.provides[iconsKey] = registry; return }
      }
      app.provide(iconsKey, registry)
    }
  }
  return markRaw(registry)
}

/** Trazos de un nombre en un registro (o undefined). Acepta cualquier valor provisto: lo que no es un registro se ignora. */
export function lookupRegistry(registry, name) {
  const map = registry && registry[MAP]
  return map instanceof Map ? map.get(name) : undefined
}

/** Trazos de un nombre en la lista de la librería (icons.md §4) */
export const lookupLibrary = (name) => (Object.prototype.hasOwnProperty.call(ICONS, name) ? ICONS[name] : undefined)
