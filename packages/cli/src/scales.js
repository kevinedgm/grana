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

export const typography = (fontSize, typeScale) => {
  const out = {}
  for (const role of ROLES) {
    let size
    if (role.name === 'caption') size = Math.max(12, fontSize * 0.75)
    else if (role.name === 'body-sm') size = fontSize * 0.875
    else size = fontSize * typeScale ** role.exp
    const line = Math.max(4, Math.round((size * role.ratio) / 4) * 4)
    out[`--g-text-${role.name}-size`] = `${r4(size / 16)}rem`
    out[`--g-text-${role.name}-line`] = `${r4(line / 16)}rem`
    out[`--g-text-${role.name}-tracking`] = role.tracking === 0 ? '0' : `${role.tracking}em`
    out[`--g-text-${role.name}-weight`] = String(role.weight)
  }
  return out
}

export const fontStack = (value) => {
  const v = String(value).trim()
  if (v.includes(',')) return v
  const name = /^["'].*["']$/.test(v) ? v : `"${v}"`
  return `${name}, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`
}
