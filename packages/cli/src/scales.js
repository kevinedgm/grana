// Radios, espaciado y tipografía (docs/contract/tokens.md §3 a §5).

const SPACE_STEPS = [1, 2, 3, 4, 5, 6, 8, 12, 16]
const r4 = (n) => Math.round(n * 10000) / 10000
const px = (n) => `${Math.round(n * 100) / 100}px`

export const radii = (radius, shape = 'rounded') => {
  const r = Number(radius)
  const out = {
    '--g-radius-xs': px(Math.round(r / 1.4 ** 2)),
    '--g-radius-sm': px(Math.round(r / 1.4)),
    '--g-radius-md': px(Math.round(r)),
    '--g-radius-lg': px(Math.round(r * 1.4)),
    '--g-radius-xl': px(Math.round(r * 1.4 ** 2))
  }
  if (shape === 'pill') out['--g-radius-shape'] = 'var(--g-radius-pill)'
  else out['--g-radius-shape'] = 'var(--g-radius-md)'
  return out
}

export const spacing = (space) => Object.fromEntries(SPACE_STEPS.map((n) => [`--g-space-${n}`, px(Number(space) * n)]))

// Razón de interlineado por rol (fija) y tracking, peso: redondeo del interlineado a múltiplos de 4px.
// Sustituye a la regla «interpolada» del contrato, que no reproducía el tema por defecto (DECISIONS.md #61).
const ROLES = [
  { name: 'caption', exp: null, ratio: 1.333, tracking: 0, weight: 500 },
  { name: 'body-sm', exp: null, ratio: 1.43, tracking: 0, weight: 400 },
  { name: 'body', exp: 0, ratio: 1.5, tracking: 0, weight: 400 },
  { name: 'title-sm', exp: 1, ratio: 1.4, tracking: -0.004, weight: 600 },
  { name: 'title', exp: 2, ratio: 1.44, tracking: -0.008, weight: 600 },
  { name: 'title-lg', exp: 3, ratio: 1.28, tracking: -0.014, weight: 600 },
  { name: 'display', exp: 4, ratio: 1.23, tracking: -0.022, weight: 600 }
]

// Interlineado de §5: la razón del rol redondeada a múltiplos de 4px (lo comparten el paso 1 y la escala compacta)
const lineFor = (size, ratio) => Math.max(4, Math.round((size * ratio) / 4) * 4)

export const typography = (fontSize, typeScale) => {
  const out = {}
  for (const role of ROLES) {
    let size
    if (role.name === 'caption') size = Math.max(12, fontSize * 0.75)
    else if (role.name === 'body-sm') size = fontSize * 0.875
    else size = fontSize * typeScale ** role.exp
    const line = lineFor(size, role.ratio)
    out[`--g-text-${role.name}-size`] = `${r4(size / 16)}rem`
    out[`--g-text-${role.name}-line`] = `${r4(line / 16)}rem`
    out[`--g-text-${role.name}-tracking`] = role.tracking === 0 ? '0' : `${role.tracking}em`
    out[`--g-text-${role.name}-weight`] = String(role.weight)
  }
  return out
}

// Pieza 3 · el texto sigue la densidad (tokens.md §5.1, density.md §16, #986 a #995): escala B «hermano menor».
// Rol a rol desde el valor del paso 1 ya resuelto (con overrides), así vale también para un rol sobrescrito:
//   tamaño = min(paso1, max(12, paso1 × 15/16)) · interlineado = min(línea1, max(4, round(tamaño × razón / 4) × 4))
// Tracking y peso no cambian. `comfortable` usa el paso 1 (#988).
export const TEXT_ROLES = ROLES.map((r) => r.name)
export const TEXT_DENSITY_KEYS = TEXT_ROLES.flatMap((n) => [`--g-text-${n}-size`, `--g-text-${n}-line`])
const COMPACT = 15 / 16
const MIN_TEXT = 12

/** Longitud en rem o px → px; otra cosa (clamp(), var(), sin unidad…) → null (no derivable) */
export const lengthPx = (value) => {
  const m = /^\s*(-?\d*\.?\d+)(rem|px)\s*$/.exec(String(value ?? ''))
  if (!m) return null
  return m[2] === 'rem' ? Number(m[1]) * 16 : Number(m[1])
}

/** Tamaño compacto de un rol (px) desde su tamaño del paso 1 (px) */
export const compactSize = (size) => Math.min(size, Math.max(MIN_TEXT, size * COMPACT))

/** Interlineado compacto (px) desde el tamaño compacto y la línea del paso 1 (px) */
export const compactLine = (role, size, line) => Math.min(line, lineFor(size, ROLES.find((r) => r.name === role).ratio))

/**
 * Valores del paso 1 (`D`) y compactos (`C`) de las 14 claves de tamaño e interlineado.
 * @param {Record<string,string>} values valores finales del paso 1 (tema resuelto: DEFAULTS + generado + overrides)
 * @returns {{ D: Record<string,string>, C: Record<string,string>, fixed: string[] }} `fixed`: claves no derivables
 *   (no son una longitud en rem o px): se quedan igual en los tres pasos
 */
export const textDensity = (values) => {
  const D = {}
  const C = {}
  const fixed = []
  for (const name of TEXT_ROLES) {
    const sk = `--g-text-${name}-size`
    const lk = `--g-text-${name}-line`
    D[sk] = values[sk]
    D[lk] = values[lk]
    const s1 = lengthPx(values[sk])
    const l1 = lengthPx(values[lk])
    const s = s1 === null ? null : compactSize(s1)
    if (s1 === null) fixed.push(sk)
    if (l1 === null) fixed.push(lk)
    C[sk] = s === null || s === s1 ? D[sk] : `${r4(s / 16)}rem`
    // Sin tamaño derivable el renglón no tiene de dónde bajar: se queda (el tamaño tampoco cambia)
    const l = l1 === null || s === null ? null : compactLine(name, s, l1)
    C[lk] = l === null || l === l1 ? D[lk] : `${r4(l / 16)}rem`
  }
  return { D, C, fixed }
}

/** --g-hero-title-max: fontSize × typeScale⁶ en rem (tokens.md §51) */
export const heroTitleMax = (fontSize, typeScale) => `${r4((fontSize * typeScale ** 6) / 16)}rem`

export const fontStack = (value) => {
  const v = String(value).trim()
  if (v.includes(',')) return v
  const name = /^["'].*["']$/.test(v) ? v : `"${v}"`
  return `${name}, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`
}
