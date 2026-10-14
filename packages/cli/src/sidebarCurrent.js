// Ranuras del item actual de GSidebar (tokens.md §43; DECISIONS.md #613 y #614). Dueño: bruno.
// Diagnóstico INFORMATIVO de los pares P1 a P3 en claro y oscuro (no rechaza, como #228) y derivación del oscuro cuando
// las ranuras se heredan del claro y un par falla en el oscuro. Solo actúa si el tema declara alguna ranura.
import { contrast, parseHex } from './color.js'
import { DEFAULTS } from './defaults.js'

export const SIDEBAR_CURRENT = '--g-sidebar-current'
export const SIDEBAR_ON_CURRENT = '--g-sidebar-on-current'
export const SIDEBAR_CURRENT_EDGE = '--g-sidebar-current-edge'
export const SIDEBAR_SLOTS = [SIDEBAR_CURRENT, SIDEBAR_ON_CURRENT, SIDEBAR_CURRENT_EDGE]

// P1 la píldora lleva texto; P2 y P3 el filo es la única señal de la rama hueca, la ruta, la píldora y el nodo
export const SIDEBAR_PAIRS = [
  { id: 'P1', fg: SIDEBAR_ON_CURRENT, bg: SIDEBAR_CURRENT, min: 4.5 },
  { id: 'P2', fg: SIDEBAR_CURRENT_EDGE, bg: '--g-surface-shell', min: 3 },
  { id: 'P3', fg: SIDEBAR_CURRENT_EDGE, bg: '--g-color-surface', min: 3 }
]

const FAMILY = /^var\(--g-color-((?:brand|accent|primary|neutral|success|warning|danger|info|cat-\d+))(?:-(?:strong|text))?\)$/

const resolveVar = (tokens, value, depth = 0) => {
  const m = /^var\((--[a-z0-9-]+)\)$/.exec(String(value ?? '').trim())
  return m && depth < 8 ? resolveVar(tokens, tokens[m[1]] ?? '', depth + 1) : String(value ?? '').trim()
}
// [r,g,b] de un token (hex o rgb()/rgba() compuesto sobre `bg`); null si no se sabe leer (p. ej. color-mix())
const colorOf = (tokens, name, bg = [255, 255, 255]) => {
  const v = resolveVar(tokens, tokens[name])
  const hex = parseHex(v)
  if (hex) return hex
  const m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*(?:[/,]\s*([\d.]+%?)\s*)?\)$/.exec(v)
  if (!m) return null
  const a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4])
  return [+m[1], +m[2], +m[3]].map((c, i) => c * a + bg[i] * (1 - a))
}
const round2 = (n) => Math.round(n * 100) / 100

/** Mide P1 a P3 con los tokens dados: [{ id, fg, bg, min, ratio|null, ok|null }] (null = no medido). */
export const measureSidebarPairs = (tokens) => SIDEBAR_PAIRS.map((p) => {
  const surface = colorOf(tokens, '--g-color-surface') ?? [255, 255, 255]
  const bg = colorOf(tokens, p.bg, surface)
  const fg = bg && colorOf(tokens, p.fg, bg)
  if (!bg || !fg) return { ...p, ratio: null, ok: null }
  const ratio = round2(contrast(fg, bg))
  return { ...p, ratio, ok: contrast(fg, bg) + 1e-9 >= p.min }
})
const failing = (pairs) => pairs.some((p) => p.ok === false)
const familyOf = (value) => FAMILY.exec(String(value ?? '').trim())?.[1] ?? null

const declared = (config) => {
  const light = config.overrides ?? {}
  const dark = typeof config.dark === 'object' && config.dark ? (config.dark.overrides ?? {}) : {}
  return {
    light: SIDEBAR_SLOTS.filter((k) => k in light),
    dark: SIDEBAR_SLOTS.filter((k) => k in dark),
    lightValues: light,
    darkValues: dark
  }
}

/**
 * Valores oscuros de las ranuras (tokens.md §43, puntos 4 y 5). `darkTokens` es el tema oscuro completo antes de las
 * ranuras (defaults oscuros + lo generado + `dark.overrides`).
 * @returns {{ values: Record<string,string>, derived: object|null, active: boolean }}
 *   values: lo que va a los bloques oscuros para las ranuras no declaradas en `dark.overrides` (heredadas del claro o derivadas)
 */
export const sidebarCurrentDark = (config, darkTokens) => {
  const d = declared(config)
  if (!d.light.length && !d.dark.length) return { values: {}, derived: null, active: false }
  // Heredadas del claro: lo que el usuario escribió en `overrides` (o el valor por defecto), resuelto en el oscuro
  const inherited = {}
  for (const k of SIDEBAR_SLOTS) if (!(k in d.darkValues)) inherited[k] = d.lightValues[k] ?? DEFAULTS[k]
  const before = { ...darkTokens, ...inherited, ...pick(d.darkValues) }
  const pairsBefore = measureSidebarPairs(before)
  const free = SIDEBAR_SLOTS.filter((k) => !(k in d.darkValues))
  // Sin ranuras en el claro no hay nada heredado que emitir (los bloques oscuros de defaults.css ya las llevan)
  if (!d.light.length) return { values: {}, derived: null, active: true }
  if (!free.length || !failing(pairsBefore)) return { values: inherited, derived: null, active: true }

  // Derivación (punto 5): relleno `{f}-soft`; tinta `{g}-text` o el respaldo `on-{f}-soft`; filo el claro, la tinta o `{f}-text`
  const fillSource = d.darkValues[SIDEBAR_CURRENT] ?? inherited[SIDEBAR_CURRENT]
  const f = familyOf(fillSource) ?? 'primary'
  const out = {}
  if (free.includes(SIDEBAR_CURRENT)) out[SIDEBAR_CURRENT] = `var(--g-color-${f}-soft)`
  const fill = out[SIDEBAR_CURRENT] ?? fillSource
  const withSlots = (extra) => ({ ...before, [SIDEBAR_CURRENT]: fill, ...out, ...extra })
  const p1 = (ink) => measureSidebarPairs(withSlots({ [SIDEBAR_ON_CURRENT]: ink }))[0]
  let ink = d.darkValues[SIDEBAR_ON_CURRENT] ?? inherited[SIDEBAR_ON_CURRENT]
  let inkSource = 'declared'
  if (free.includes(SIDEBAR_ON_CURRENT)) {
    const g = familyOf(inherited[SIDEBAR_ON_CURRENT])
    const own = g ? `var(--g-color-${g}-text)` : null
    if (own && p1(own).ok) { ink = own; inkSource = 'family' } else { ink = `var(--g-color-on-${f}-soft)`; inkSource = 'fallback' }
    out[SIDEBAR_ON_CURRENT] = ink
  }
  if (free.includes(SIDEBAR_CURRENT_EDGE)) {
    const edgeOk = (edge) => { const r = measureSidebarPairs(withSlots({ [SIDEBAR_CURRENT_EDGE]: edge })); return r[1].ok && r[2].ok }
    const candidates = [inherited[SIDEBAR_CURRENT_EDGE], ink, `var(--g-color-${f}-text)`]
    out[SIDEBAR_CURRENT_EDGE] = candidates.find(edgeOk) ?? candidates[2]
  }
  const values = { ...inherited, ...out }
  const pairsAfter = measureSidebarPairs({ ...before, ...values })
  const changed = Object.fromEntries(Object.entries(out).filter(([k, v]) => v !== inherited[k]))
  return { values, active: true, derived: { family: f, inkSource, slots: Object.keys(changed), values: changed, before: pairsBefore, after: pairsAfter } }
}
const pick = (o) => Object.fromEntries(SIDEBAR_SLOTS.filter((k) => k in o).map((k) => [k, o[k]]))

const pairText = (p) => (p.ratio === null ? `${p.id} ${p.fg} / ${p.bg}: no medido` : `${p.id} ${p.fg} / ${p.bg}: ${p.ratio}:1 (mínimo ${p.min}:1)`)
const contrastDiagnostic = (scheme, pairs) => {
  const bad = pairs.filter((p) => p.ok !== true)
  if (!bad.length) return null
  const where = scheme === 'dark' ? 'oscuro' : 'claro'
  return {
    code: 'sidebar-current-contrast',
    source: 'overrides',
    scheme,
    status: 'informative',
    tokens: SIDEBAR_SLOTS,
    pairs: pairs.map(({ id, fg, bg, min, ratio, ok }) => ({ id, fg, bg, min, ratio, ok })),
    message: `Item actual de GSidebar (${where}): ${bad.map(pairText).join('; ')}. La píldora del navbar lleva texto sobre el relleno (P1) y el filo es la única señal de la rama y la ruta (P2, P3). No bloquea.`
  }
}

/**
 * Diagnósticos de las ranuras (tokens.md §43): `sidebar-current-contrast` (claro y oscuro) y `sidebar-current-dark`.
 * @param {object} config configuración leída
 * @param {Record<string,string>} light tema claro completo
 * @param {{ enabled: boolean, tokens: Record<string,string>|null, sidebarCurrent?: object }} dark resultado de generateDark
 */
export const sidebarCurrentDiagnostics = (config, light, dark) => {
  const d = declared(config)
  if (!d.light.length && !d.dark.length) return []
  const out = []
  const l = contrastDiagnostic('light', measureSidebarPairs(light))
  if (l) out.push(l)
  if (dark?.enabled && dark.tokens) {
    const der = dark.sidebarCurrent?.derived
    if (der) {
      out.push({
        code: 'sidebar-current-dark',
        source: 'derived',
        scheme: 'dark',
        status: 'derived',
        tokens: der.slots,
        values: der.values,
        before: der.before.map(({ id, ratio, ok }) => ({ id, ratio, ok })),
        after: der.after.map(({ id, ratio, ok }) => ({ id, ratio, ok })),
        message: `Item actual de GSidebar (oscuro): las ranuras heredadas del claro fallan (${der.before.filter((p) => p.ok === false).map(pairText).join('; ')}); derivadas ${der.slots.map((k) => `${k}: ${der.values[k]}`).join(', ')}${der.inkSource === 'fallback' ? ' (tinta: respaldo on-soft)' : ''}. Después: ${der.after.map((p) => (p.ratio === null ? `${p.id} no medido` : `${p.id} ${p.ratio}:1`)).join(', ')}.`
      })
    }
    const k = contrastDiagnostic('dark', measureSidebarPairs(dark.tokens))
    if (k) out.push(k)
  }
  return out
}
