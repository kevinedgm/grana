// Qué tokens cambian con el esquema de color (docs/contract/tokens.md §15: el «grupo de color»).
const SURFACES = ['--g-surface-shell', '--g-surface-inset', '--g-surface-backdrop']
export const isColorGroup = (name) => /^--g-(color-|calendar-|glass-|shadow-)/.test(name) || SURFACES.includes(name)
export const splitColorGroup = (tokens) => {
  const color = {}, other = {}
  for (const [k, v] of Object.entries(tokens)) (isColorGroup(k) ? color : other)[k] = v
  return { color, other }
}
