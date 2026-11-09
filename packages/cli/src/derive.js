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

// Peor contraste de `rgb` contra los fondos, con el fondo que lo da
export const worstAgainst = (rgb, backgrounds) => backgrounds.reduce((w, b) => {
  const r = contrast(rgb, b.rgb)
  return r < w.ratio ? { ratio: r, name: b.name } : w
}, { ratio: Infinity, name: null })

/**
 * Garantía de `{familia}-text` (tokens.md §2, DECISIONS.md #1074): desde `rgb` (o el punto OKLCH `k`), mueve L en OKLCH en pasos
 * de 0.01 conservando tono y croma, alejándose de los fondos (media de L > 0.6: baja; si no, sube), hasta `min` contra todos.
 * Si no se puede (fondos a los dos lados), devuelve el valor con el mejor peor contraste que encontró.
 * @param {number[]} rgb color de partida
 * @param {Array<{ name: string, rgb: number[] }>} backgrounds fondos resueltos
 * @param {{ l: number, c: number, h: number }} [k] punto de partida en OKLCH (por defecto, el de `rgb`)
 * @returns {number[]}
 */
export const ensureText = (rgb, backgrounds, min = 4.5, k = toOklch(round(rgb))) => {
  const avg = backgrounds.reduce((s, b) => s + toOklch(b.rgb).l, 0) / backgrounds.length
  const step = avg > 0.6 ? -0.01 : 0.01
  let cur = round(rgb)
  let best = { cur, ratio: worstAgainst(cur, backgrounds).ratio }
  for (let l = k.l; best.ratio < min && l > 0 && l < 1; l += step) {
    cur = round(fromOklch({ l, c: k.c, h: k.h }))
    const ratio = worstAgainst(cur, backgrounds).ratio
    if (ratio > best.ratio) best = { cur, ratio }
  }
  return best.cur
}

// Fondos `{ surface, surfaceSunken, bg }` → lista con nombre; solo los que vienen (sin ninguno, `fallback` como superficie)
const BG_NAMES = [['surface', 'surface'], ['surfaceSunken', 'surface-sunken'], ['bg', 'bg']]
const backgroundsOf = (opts, fallback) => {
  const list = BG_NAMES.filter(([k]) => opts[k] !== undefined).map(([k, name]) => {
    const rgb = parseHex(opts[k])
    if (!rgb) throw new Error(`Color inválido: ${opts[k]}`)
    return { name, rgb }
  })
  return list.length ? list : [{ name: 'surface', rgb: parseHex(fallback) }]
}

/**
 * @param {string} baseHex color base
 * @param {{ surface?: string, surfaceSunken?: string, bg?: string }} [opts] fondos resueltos del tema (§2 «Garantía de
 *   `{familia}-text`»); `text` llega a 4.5:1 contra todos los que se pasen (sin ninguno, contra #FFFFFF)
 * @returns {{ base, strong, soft, on, text, onSoft, textSurface, textAgainst }} en hex mayúsculas; `textSurface` es el
 *   `text` de la regla solo contra `surface` y `textAgainst`, el fondo que obligó a moverlo más (null si no se movió)
 */
export const deriveColor = (baseHex, opts = {}) => {
  const base = parseHex(baseHex)
  if (!base) throw new Error(`Color inválido: ${baseHex}`)
  const bgs = backgroundsOf(opts, '#FFFFFF')
  const surf = (bgs.find((b) => b.name === 'surface') ?? bgs[0]).rgb
  const k = toOklch(base)
  const on = pickOn(base)
  // strong: oscurece 0.08; si la base es muy oscura (L < 0.3), aclara; si baja de 4.5:1 con su `on`, la dirección contraria
  const dir = k.l < 0.3 ? 1 : -1
  let strong = shade(base, dir * 0.08)
  if (contrast(strong, pickOn(strong)) < 4.5 || contrast(strong, on) < 4.5) strong = shade(base, -dir * 0.08)
  // soft: L = 0.955, C × 0.3
  const soft = round(fromOklch({ l: 0.955, c: k.c * 0.3, h: k.h }))
  // text: contraste ≥ 4.5 contra los tres fondos (#1074); on-soft: ≥ 4.5 sobre soft
  const textSurface = shiftUntil(base, surf, 4.5)
  const text = ensureText(base, bgs, 4.5)
  const onSoft = shiftUntil(base, soft, 4.5)
  const moved = toHex(text) !== toHex(textSurface)
  return { base: toHex(base), strong: toHex(strong), soft: toHex(soft), on: toHex(on), text: toHex(text), onSoft: toHex(onSoft), textSurface: toHex(textSurface), textAgainst: moved ? worstAgainst(textSurface, bgs).name : null }
}

/**
 * Variante oscura de un color (docs/contract/tokens.md §15). `surface` es la superficie oscura.
 * Base: se conserva si L ≥ 0.5 y se refleja (1 − L) si es menor; luego sube L hasta 4.5:1 sobre la superficie.
 * strong: sube L 0.06 (se aleja del fondo); si baja de 4.5:1 con `on`, baja L 0.08.
 * soft: L 0.26 y C × 0.35. text: la base, alejándose de los fondos hasta 4.5:1 contra los tres (#1074). on-soft: sube L hasta 4.5:1 sobre soft.
 * @param {{ surface?: string, surfaceSunken?: string, bg?: string }} [opts] fondos oscuros resueltos (sin ninguno, #1C1C1C)
 * @returns {{ base, strong, soft, on, text, onSoft, textSurface, textAgainst }} en hex mayúsculas (como `deriveColor`)
 */
export const deriveDarkColor = (baseHex, opts = {}) => {
  const light = parseHex(baseHex)
  if (!light) throw new Error(`Color inválido: ${baseHex}`)
  const bgs = backgroundsOf(opts, '#1C1C1C')
  const surf = (bgs.find((b) => b.name === 'surface') ?? bgs[0]).rgb
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
  const ts = raise(l, surf, 4.5)
  const textSurface = ts.cur
  const text = ensureText(textSurface, bgs, 4.5, { l: ts.l, c: k.c, h: k.h })
  const onSoft = raise(l, soft, 4.5).cur
  const moved = toHex(text) !== toHex(textSurface)
  return { base: toHex(base), strong: toHex(strong), soft: toHex(soft), on: toHex(on), text: toHex(text), onSoft: toHex(onSoft), textSurface: toHex(textSurface), textAgainst: moved ? worstAgainst(textSurface, bgs).name : null }
}
