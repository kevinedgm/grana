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

/**
 * Variante oscura de un color (docs/contract/tokens.md §15). `surface` es la superficie oscura.
 * Base: se conserva si L ≥ 0.5 y se refleja (1 − L) si es menor; luego sube L hasta 4.5:1 sobre la superficie.
 * strong: sube L 0.06 (se aleja del fondo); si baja de 4.5:1 con `on`, baja L 0.08.
 * soft: L 0.26 y C × 0.35. text: la base, subiendo L hasta 4.5:1 sobre la superficie. on-soft: sube L hasta 4.5:1 sobre soft.
 * @returns {{ base, strong, soft, on, text, onSoft }} en hex mayúsculas
 */
export const deriveDarkColor = (baseHex, { surface = '#1C1C1C' } = {}) => {
  const light = parseHex(baseHex)
  if (!light) throw new Error(`Color inválido: ${baseHex}`)
  const surf = parseHex(surface)
  const k = toOklch(light)
  const raise = (l0, against, min) => {
    let l = l0
    let cur = round(fromOklch({ l, c: k.c, h: k.h }))
    while (contrast(cur, against) < min && l < 0.99) {
      l += 0.01
      cur = round(fromOklch({ l, c: k.c, h: k.h }))
    }
    return { cur, l }
  }
  const start = k.l >= 0.5 ? k.l : 1 - k.l
  const { cur: base, l } = raise(start, surf, 4.5)
  const on = pickOn(base)
  let strong = round(fromOklch({ l: Math.min(l + 0.06, 1), c: k.c, h: k.h }))
  if (contrast(strong, on) < 4.5) strong = round(fromOklch({ l: l - 0.08, c: k.c, h: k.h }))
  const soft = round(fromOklch({ l: 0.26, c: k.c * 0.35, h: k.h }))
  const text = raise(l, surf, 4.5).cur
  const onSoft = raise(l, soft, 4.5).cur
  return { base: toHex(base), strong: toHex(strong), soft: toHex(soft), on: toHex(on), text: toHex(text), onSoft: toHex(onSoft) }
}
