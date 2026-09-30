// tokens.json: el tema explicado (valor claro y oscuro, uso y contraste medido por token), en el formato de un sistema de diseño.
import { contrast, parseHex } from './color.js'
import { DEFAULTS } from './defaults.js'
import { usageOf } from './usage.js'

const resolveVar = (tokens, value, depth = 0) => {
  const m = /^var\((--[a-z0-9-]+)\)$/.exec(String(value).trim())
  return m && depth < 8 ? resolveVar(tokens, tokens[m[1]] ?? '', depth + 1) : String(value).trim()
}
const round2 = (n) => Math.round(n * 100) / 100

// Con qué fondo se mide el contraste de cada token (null: no es un color de texto ni de control)
const againstOf = (name) => {
  let m = /^on-(.+)-soft$/.exec(name)
  if (m) return `${m[1]}-soft`
  m = /^on-(.+)$/.exec(name)
  if (m) return m[1]
  if (/^(.+)-text$/.test(name) || ['text', 'text-muted', 'text-subtle', 'border-control', 'focus'].includes(name)) return 'surface'
  return null
}

/**
 * @param {{ name?: string, light: Record<string,string>, dark: Record<string,string>|null, source?: string }} input
 *   light/dark: tema completo (defaults + generado); `dark` es null con `dark: false` (entonces el oscuro repite el claro)
 */
export const buildDoc = ({ name = 'Grana', light, dark, source = 'grana.config.json' }) => {
  const dk = dark ?? light
  const names = [...new Set([...Object.keys(DEFAULTS), ...Object.keys(light)])].filter((k) => k.startsWith('--g-color-')).map((k) => k.slice('--g-color-'.length))
  const color = names.map((n) => {
    const key = `--g-color-${n}`
    const value = { light: resolveVar(light, light[key]), dark: resolveVar(dk, dk[key]) }
    const tok = { name: n, cssVar: key, value, usage: usageOf(n) }
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
    return tok
  })
  const scale = (prefix) => Object.keys(light).filter((k) => k.startsWith(prefix)).map((k) => ({ name: k.slice(2), cssVar: k, value: light[k] }))
  return {
    name,
    version: 1,
    color: { themes: [{ id: 'light', name: 'Claro' }, { id: 'dark', name: 'Oscuro' }], tokens: color },
    radius: { tokens: scale('--g-radius-').filter((t) => /-(xs|sm|md|lg|xl|shape)$/.test(t.cssVar)) },
    spacing: { tokens: scale('--g-space-') },
    meta: { source: '@grana/cli', generatedFrom: source }
  }
}
