// Derivación de color (docs/contract/tokens.md §2): strong, soft, on, text, on-soft.
import { contrast, fromOklch, parseHex, toHex, toOklch } from './color.js'

export const INK = '#17151A'
const round = (rgb) => rgb.map((v) => Math.round(v))
const shade = (rgb, dl) => { const k = toOklch(rgb); return round(fromOklch({ l: k.l + dl, c: k.c, h: k.h })) }

// Elige entre casi negro y blanco el de mayor contraste con `rgb`
export const pickOn = (rgb) => {
  const ink = parseHex(INK), white = [255, 255, 255]
  return contrast(rgb, white) >= contrast(rgb, ink) ? white : ink
}

// Mueve L en pasos de 0.01 hasta llegar a `min` contra `against` (conserva H; reduce C si sale de gama).
// Baja L sobre fondos claros y la sube sobre fondos oscuros.
const shiftUntil = (rgb, against, min) => {
  let cur = round(rgb)
  const k = toOklch(cur)
  const step = toOklch(against).l > 0.6 ? -0.01 : 0.01
  for (let l = k.l; contrast(cur, against) < min && l > 0 && l < 1; l += step) cur = round(fromOklch({ l, c: k.c, h: k.h }))
  return cur
}

/**
 * @param {string} baseHex color base
 * @param {{ surface?: string }} [opts]
 * @returns {{ base, strong, soft, on, text, onSoft }} en hex mayúsculas
 */
export const deriveColor = (baseHex, { surface = '#FFFFFF' } = {}) => {
  const base = parseHex(baseHex)
  if (!base) throw new Error(`Color inválido: ${baseHex}`)
  const surf = parseHex(surface)
  const k = toOklch(base)
  const on = pickOn(base)
  // strong: oscurece 0.08; si la base es muy oscura (L < 0.3), aclara; si baja de 4.5:1 con su `on`, la dirección contraria
  const dir = k.l < 0.3 ? 1 : -1
  let strong = shade(base, dir * 0.08)
  if (contrast(strong, pickOn(strong)) < 4.5 || contrast(strong, on) < 4.5) strong = shade(base, -dir * 0.08)
  // soft: L = 0.955, C × 0.3
  const soft = round(fromOklch({ l: 0.955, c: k.c * 0.3, h: k.h }))
  // text: contraste ≥ 4.5 sobre surface; on-soft: ≥ 4.5 sobre soft
  const text = shiftUntil(base, surf, 4.5)
  const onSoft = shiftUntil(base, soft, 4.5)
  return { base: toHex(base), strong: toHex(strong), soft: toHex(soft), on: toHex(on), text: toHex(text), onSoft: toHex(onSoft) }
}
