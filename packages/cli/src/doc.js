// tokens.json: el tema explicado (valor claro y oscuro, uso y contraste medido por token), en el formato de un sistema de diseño.
// Contrato: docs/contract/tokens.md §16 y §17 (nivel, origen y estado de cada token).
import { contrast, parseHex } from './color.js'
import { DEFAULTS } from './defaults.js'
import { SEMANTIC } from './palette.js'
import { usageOf } from './usage.js'

const resolveVar = (tokens, value, depth = 0) => {
  const m = /^var\((--[a-z0-9-]+)\)$/.exec(String(value).trim())
  return m && depth < 8 ? resolveVar(tokens, tokens[m[1]] ?? '', depth + 1) : String(value).trim()
}
const round2 = (n) => Math.round(n * 100) / 100

// Diagnóstico INFORMATIVO (#228, tokens.md §24): `active` es un relleno con su par `on-accent`; como trazo o elemento
// gráfico sobre la superficie no tiene 3:1 garantizado (acentos pálidos). No bloquea: avisa para que los componentes
// usen `accent-text` (sobre la superficie) u `on-accent-soft` (sobre el tinte) en los trazos.
export const ACTIVE_STROKE_MIN = 3
export function activeContrast(light, dark) {
  const measure = (tokens) => {
    if (!tokens) return undefined
    const fg = parseHex(resolveVar(tokens, tokens['--g-color-active'] ?? ''))
    const bg = parseHex(resolveVar(tokens, tokens['--g-color-surface'] ?? ''))
    return fg && bg ? round2(contrast(fg, bg)) : undefined
  }
  const r = { light: measure(light), dark: measure(dark) }
  const low = Object.entries(r).filter(([, v]) => typeof v === 'number' && v < ACTIVE_STROKE_MIN)
  if (!low.length) return null
  const where = low.map(([k, v]) => `${v}:1 en ${k === 'light' ? 'claro' : 'oscuro'}`).join(', ')
  return {
    code: 'active-contrast',
    cssVar: '--g-color-active',
    token: 'active',
    against: '--g-color-surface',
    min: ACTIVE_STROKE_MIN,
    ...Object.fromEntries(Object.entries(r).filter(([, v]) => v !== undefined)),
    status: 'informative',
    message: `«active» queda por debajo de ${ACTIVE_STROKE_MIN}:1 sobre la superficie (${where}). Es válido como relleno con «on-accent» (la lámpara de la captura de voz, el ítem activo); para un trazo o elemento gráfico sobre la superficie usa «accent-text», y sobre «accent-soft», «on-accent-soft». No bloquea.`
  }
}

// Con qué fondo se mide el contraste de cada token (null: no es un color de texto ni de control)
const againstOf = (name) => {
  let m = /^on-(.+)-soft$/.exec(name)
  if (m) return `${m[1]}-soft`
  m = /^on-(.+)$/.exec(name)
  if (m) return m[1]
  if (/^(.+)-text$/.test(name) || ['text', 'text-muted', 'text-subtle', 'border-control', 'focus', 'link'].includes(name)) return 'surface'
  return null
}

// Nivel de la arquitectura (§17): las familias de color y neutros son «reference»; los roles de interfaz y los estados, «semantic»
const family = (name) => name.replace(/^on-/, '').replace(/-(strong|soft|text)$/, '')
const ROLES = ['bg', 'surface', 'surface-sunken', 'text', 'text-muted', 'text-subtle', 'border', 'border-strong', 'border-control', 'focus', 'link', 'selection', 'active']
export const levelOf = (name) => {
  const f = family(name)
  if (ROLES.includes(name) || f === 'primary' || SEMANTIC.includes(f)) return 'semantic'
  return 'reference'
}
// De dónde sale cada token: la entrada de configuración o el token del que es alias
const ALIAS = { link: 'accent-text', selection: 'accent-soft', active: 'accent', focus: 'accent-text' }
const sourceOf = (name, { tinted, hue = 'brand', primaryOwn = false }) => {
  if (ALIAS[name]) return ALIAS[name]
  const f = family(name)
  if (f === 'primary') return primaryOwn ? 'primary' : name.replace('primary', 'brand')
  if (f === 'brand') return 'brand'
  if (f === 'accent') return 'accent'
  if (/^cat-\d+$/.test(f)) return 'brand'
  if (tinted && (f === 'neutral' || ['surface-sunken', 'text', 'text-muted', 'text-subtle', 'border', 'border-strong', 'border-control', 'bg', 'surface'].includes(name))) return hue
  return null
}

/**
 * @param {{ name?: string, light: Record<string,string>, dark: Record<string,string>|null, source?: string,
 *   generated?: Record<string,string>, overrides?: Record<string,string>, derived?: object, collisions?: Array }} input
 *   light/dark: tema completo (defaults + generado); `dark` es null con `dark: false` (entonces el oscuro repite el claro).
 *   generated: lo que la configuración cambió (estado «derived»); overrides: «override»; derived/collisions: de la derivación de paleta.
 */
export const buildDoc = ({ name = 'Grana', light, dark, source = 'grana.config.json', generated = {}, overrides = {}, derived = null, collisions = [] }) => {
  const dk = dark ?? light
  const adjusted = new Set(Object.keys(derived?.applied ?? {}).flatMap((n) => Object.keys(light).filter((k) => family(k.slice('--g-color-'.length)) === n && k.startsWith('--g-color-'))))
  const tinted = Boolean(derived?.neutralsBrand)
  const names = [...new Set([...Object.keys(DEFAULTS), ...Object.keys(light)])].filter((k) => k.startsWith('--g-color-')).map((k) => k.slice('--g-color-'.length))
  const color = names.map((n) => {
    const key = `--g-color-${n}`
    const value = { light: resolveVar(light, light[key]), dark: resolveVar(dk, dk[key]) }
    const tok = { name: n, cssVar: key, level: levelOf(n), value, usage: usageOf(n) }
    const src = sourceOf(n, { tinted, hue: derived?.neutralsHue ?? 'brand', primaryOwn: Boolean(derived?.primary) })
    if (src) tok.source = src
    tok.status = key in overrides ? 'override' : adjusted.has(key) ? 'adjusted' : key in generated ? 'derived' : 'default'
    const against = againstOf(n)
    if (against) {
      const r = {}
      for (const [scheme, tokens] of [['light', light], ['dark', dk]]) {
        const fg = parseHex(resolveVar(tokens, tokens[key]))
        const bg = parseHex(resolveVar(tokens, tokens[`--g-color-${against}`]))
        if (fg && bg) r[scheme] = round2(contrast(fg, bg))
      }
      if (Object.keys(r).length) tok.contrast = { against: `--g-color-${against}`, ...r }
    }
    const col = collisions.find((c) => c.cssVar === key)
    if (col) { tok.recommended = { value: col.recommended, distance: col.distance, reason: 'semantic-close' }; tok.notes = col.message }
    return tok
  })
  const scale = (prefix) => Object.keys(light).filter((k) => k.startsWith(prefix)).map((k) => ({ name: k.slice(2), cssVar: k, value: light[k] }))
  return {
    name,
    version: 1,
    color: { themes: [{ id: 'light', name: 'Claro' }, { id: 'dark', name: 'Oscuro' }], tokens: color },
    radius: { tokens: scale('--g-radius-').filter((t) => /-(xs|sm|md|lg|xl|shape)$/.test(t.cssVar)) },
    spacing: { tokens: scale('--g-space-') },
    diagnostics: [...collisions.map(({ message, ...d }) => ({ ...d, message })), ...[activeContrast(light, dark)].filter(Boolean)],
    meta: { source: '@grana/cli', generatedFrom: source, categories: 'Los colores cat-* son colores categóricos de interfaz (iconos, etiquetas), no una paleta de visualización de datos.' }
  }
}
