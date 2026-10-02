// Qué tokens cambian con el esquema de color (docs/contract/tokens.md §15: el «grupo de color»).
const SURFACES = ['--g-surface-shell', '--g-surface-inset', '--g-surface-backdrop']
// Velos de componente que cambian con el esquema (tokens.md §18 y §19): pista, fondo y banda de GTabs; estados y velo de GCard
const COMPONENT_VEILS = /^--g-(tabs-(track|thumb|band|panel)|card-(hover|pressed|selected|scrim|on-scrim))$/
export const isColorGroup = (name) => /^--g-(color-|calendar-|glass-|shadow-)/.test(name) || SURFACES.includes(name) || COMPONENT_VEILS.test(name)
export const splitColorGroup = (tokens) => {
  const color = {}, other = {}
  for (const [k, v] of Object.entries(tokens)) (isColorGroup(k) ? color : other)[k] = v
  return { color, other }
}
