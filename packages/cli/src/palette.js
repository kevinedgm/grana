// Derivación de paleta por reglas (docs/contract/tokens.md §16, DECISIONS.md #93): a partir de brand y accent se calcula
// qué color semántico necesita separarse de la marca, los neutros teñidos con su tono y una serie de categorías.
// Todo en OKLCH, determinista y sin dependencias.
import { contrast, fromOklch, parseHex, toHex, toOklch } from './color.js'
import { DARK, DEFAULTS } from './defaults.js'
import { deriveDarkColor } from './derive.js'

/** Distancia mínima (OKLab) entre un color semántico y la marca/acento: por debajo, se confunden a simple vista. */
export const MIN_DISTANCE = 0.12
/** Giro máximo de tono (grados) y de luminosidad que se permite para separar un semántico de la marca. */
export const MAX_HUE_SHIFT = 45
export const MAX_L_SHIFT = 0.15
/** Distancia mínima entre dos semánticos (los del tema por defecto ya cumplen ≈ 0.10): el ajustado no puede parecerse a otro. */
export const MIN_SIBLING_DISTANCE = 0.09

const round = (rgb) => rgb.map((v) => Math.round(v))
const hexOf = (lch) => toHex(round(fromOklch(lch)))
const norm = (h) => ((h % 360) + 360) % 360

/** Distancia euclídea en OKLab entre dos colores en OKLCH (l, c, h en grados). */
export const distance = (a, b) => {
  const ax = a.c * Math.cos((a.h * Math.PI) / 180), ay = a.c * Math.sin((a.h * Math.PI) / 180)
  const bx = b.c * Math.cos((b.h * Math.PI) / 180), by = b.c * Math.sin((b.h * Math.PI) / 180)
  return Math.hypot(a.l - b.l, ax - bx, ay - by)
}
const lchOf = (hex) => toOklch(parseHex(hex))

/** Semánticos que se protegen de la marca, con su color claro por defecto como punto de partida. */
export const SEMANTIC = ['danger', 'warning', 'success', 'info']

/**
 * Separa `nominalHex` de las marcas (`anchors`, claras) y de sus variantes oscuras (`darkAnchors`): la distancia que cuenta es
 * la menor de las dos (un semántico se ve también en el tema oscuro, con su propia derivación).
 * Si ya está a ≥ MIN_DISTANCE de todos (y a ≥ MIN_SIBLING_DISTANCE de los otros semánticos), se devuelve tal cual. Si no, busca el menor giro de tono (±45°, pasos de 5°) y de
 * luminosidad (±0.15, pasos de 0.05) que lo consiga; si ninguno basta, elige el de mayor distancia mínima y `ok` es falso.
 * @returns {{ hex: string, changed: boolean, ok: boolean, distance: number, dh: number, dl: number }}
 */
export const separate = (nominalHex, anchors, { darkAnchors = [], names = ['brand', 'accent', 'primary'], siblings = [], min = MIN_DISTANCE, minSibling = MIN_SIBLING_DISTANCE } = {}) => {
  const n = lchOf(nominalHex)
  // los nombres siguen a su color aunque falte alguno (marca sin acento, etc.)
  const pair = (list) => list.map((hex, i) => ({ hex, name: names[i] })).filter((p) => p.hex).map((p) => ({ lch: lchOf(p.hex), name: p.name }))
  const light = pair(anchors)
  const dark = pair(darkAnchors)
  const sib = siblings.filter(Boolean).map((h) => ({ l: lchOf(h), d: lchOf(deriveDarkColor(h).base) }))
  // Margen respecto a cada umbral (≥ 1: cumple): la marca pide `min`; otro semántico, `minSibling`
  // anchors = [marca, acento]: el índice dice con cuál de los dos choca (light y darkAnchors conservan ese orden)
  const nearestAnchor = (hex) => {
    const l = lchOf(hex)
    const dl = lchOf(deriveDarkColor(hex).base)
    let best = { d: Infinity, who: null }
    const consider = (list, c) => list.forEach((a) => { const d = distance(c, a.lch); if (d < best.d) best = { d, who: a.name } })
    consider(light, l)
    consider(dark, dl)
    return best
  }
  const minDist = (hex) => {
    const l = lchOf(hex)
    const dl = lchOf(deriveDarkColor(hex).base)
    const anchorsD = nearestAnchor(hex).d
    const sibD = Math.min(...sib.map((x) => Math.min(distance(l, x.l), distance(dl, x.d))), Infinity)
    return Math.min(anchorsD, (sibD / minSibling) * min)
  }
  const nominal = toHex(round(fromOklch(n)))
  const d0 = minDist(nominal)
  const collidedWith = nearestAnchor(nominal).who
  if (d0 >= min) return { hex: nominal, changed: false, ok: true, distance: d0, before: d0, collidedWith, dh: 0, dl: 0 }
  let best = null
  for (let dh = -MAX_HUE_SHIFT; dh <= MAX_HUE_SHIFT; dh += 5) {
    for (const dlum of [0, -0.05, 0.05, -0.1, 0.1, -MAX_L_SHIFT, MAX_L_SHIFT]) {
      const hex = hexOf({ l: n.l + dlum, c: n.c, h: norm(n.h + dh) }) // lo que de verdad se emitirá tras el redondeo y la gama
      const dist = minDist(hex)
      const cost = Math.abs(dh) / MAX_HUE_SHIFT + (Math.abs(dlum) / MAX_L_SHIFT) * 0.6
      const ok = dist >= min
      if (!best || (ok && !best.ok) || (ok === best.ok && (ok ? cost < best.cost : dist > best.distance))) best = { hex, cost, ok, distance: dist, before: d0, collidedWith, dh, dl: dlum }
    }
  }
  return { hex: best.hex, changed: best.dh !== 0 || best.dl !== 0, ok: best.ok, distance: best.distance, before: d0, collidedWith, dh: best.dh, dl: best.dl }
}

/**
 * Los semánticos que chocan con la marca o el acento (en claro o en oscuro). El punto de partida de cada uno es su color
 * claro por defecto. `darkBrand`/`darkAccent` son los colores base del oscuro (por defecto, los derivados de los claros).
 * @returns {Record<string, { hex, ok, distance, dh, dl }>} solo los que cambian, o los que no se pueden separar lo suficiente
 */
export const semanticAdjustments = ({ brand, accent, primary, darkBrand, darkAccent, darkPrimary }) => {
  const out = {}
  const darkOf = (hex, explicit) => (explicit ? deriveDarkColor(explicit).base : hex ? deriveDarkColor(hex).base : undefined)
  const darkAnchors = [darkOf(brand, darkBrand), darkOf(accent, darkAccent), darkOf(primary, darkPrimary)]
  const current = Object.fromEntries(SEMANTIC.map((n) => [n, DEFAULTS[`--g-color-${n}`]]))
  for (const name of SEMANTIC) {
    const siblings = SEMANTIC.filter((n) => n !== name).map((n) => current[n])
    const r = separate(current[name], [brand, accent, primary], { darkAnchors, siblings })
    if (r.changed || !r.ok) { out[name] = r; current[name] = r.hex }
  }
  return out
}

/**
 * Cómo nombrar, en un mensaje, el color con el que choca un semántico. Distingue un acento configurado por el usuario
 * de uno derivado de la marca (contrato §1: sin `accent`, se deriva del `text` de `brand`).
 * @param {'brand'|'accent'} who
 * @param {boolean} accentDerived el usuario no definió `accent`
 * @param {'a'|'de'} [prep] preposición que antecede (con la contracción: «al acento», «del acento»)
 */
export const anchorLabel = (who, accentDerived, prep = 'a') => {
  if (who === 'primary') return prep === 'a' ? 'al color primario' : 'del color primario'
  if (who !== 'accent') return `${prep} la marca`
  return accentDerived ? `${prep} la marca (a través del acento derivado)` : prep === 'a' ? 'al acento' : 'del acento'
}

// ---------- Neutros teñidos ----------

// Tonos de los neutros: croma = 8 % del de la marca, entre 0.006 y 0.02. Con una marca casi gris no se tiñe.
export const tintChroma = (brandHex) => {
  const c = lchOf(brandHex).c
  return c < 0.02 ? 0 : Math.min(0.02, Math.max(0.006, c * 0.08))
}
// En las superficies muy claras o muy oscuras el mismo croma se nota más: se limita (0.008 sobre L > 0.9; 0.01 bajo L < 0.3)
const chromaAt = (l, chroma) => Math.min(chroma, l > 0.9 ? 0.008 : l < 0.3 ? 0.01 : chroma)
const tint = (hex, hue, chroma) => {
  const k = toOklch(parseHex(hex))
  return round(fromOklch({ l: k.l, c: chromaAt(k.l, chroma), h: hue }))
}
// Aleja `rgb` de los fondos, paso a paso en L, hasta `min` contra todos (conserva tono y croma)
const ensure = (rgb, backgrounds, min) => {
  let cur = round(rgb)
  const k = toOklch(cur)
  const avg = backgrounds.reduce((s, b) => s + toOklch(b).l, 0) / backgrounds.length
  const step = avg > 0.6 ? -0.005 : 0.005
  for (let l = k.l; backgrounds.some((b) => contrast(cur, b) < min) && l > 0 && l < 1; l += step) cur = round(fromOklch({ l, c: k.c, h: k.h }))
  return cur
}
const alphaOf = (value) => {
  const m = /\/\s*([\d.]+)\s*\)/.exec(String(value))
  return m ? m[1] : null
}

/**
 * Neutros (texto, bordes, superficies hundidas y `neutral`) con el tono de `hueHex` (por defecto, la marca) a croma muy bajo, en claro o en oscuro.
 * Conservan la luminosidad del tema por defecto y garantizan contraste (texto 4.5:1; borde de control 3:1).
 * @returns {Record<string,string>} tokens `--g-color-*` (vacío si la marca es casi gris)
 */
export const tintedNeutrals = (brandHex, { dark = false, hueHex = brandHex } = {}) => {
  const chroma = tintChroma(brandHex) // el croma siempre sale de la marca; `hueHex` solo decide el tono (neutralsHue)
  if (!chroma) return {}
  const hue = lchOf(hueHex).h
  const base = dark ? DARK : DEFAULTS
  const hexTok = (name) => tint(base[name], hue, chroma)
  const out = {}
  const surface = dark ? hexTok('--g-color-surface') : parseHex(base['--g-color-surface'])
  const sunken = hexTok('--g-color-surface-sunken')
  const bgs = [surface, sunken]
  if (dark) {
    out['--g-color-bg'] = toHex(hexTok('--g-color-bg'))
    out['--g-color-surface'] = toHex(surface)
  }
  out['--g-color-surface-sunken'] = toHex(sunken)
  const text = ensure(hexTok('--g-color-text'), bgs, 7)
  out['--g-color-text'] = toHex(text)
  out['--g-color-text-muted'] = toHex(ensure(hexTok('--g-color-text-muted'), bgs, 4.5))
  out['--g-color-text-subtle'] = toHex(ensure(hexTok('--g-color-text-subtle'), bgs, 4.5))
  out['--g-color-border-control'] = toHex(ensure(hexTok('--g-color-border-control'), bgs, 3))
  // bordes: la tinta del texto con la transparencia del tema por defecto
  const ink = text
  for (const name of ['--g-color-border', '--g-color-border-strong']) {
    out[name] = `rgb(${ink.join(' ')} / ${alphaOf(base[name]) ?? '0.1'})`
  }
  return out
}

/** Base de `neutral` (gris de insignias y estados sin significado) teñida con el tono de la marca; null si no se tiñe. */
export const tintedNeutralBase = (brandHex, { dark = false, hueHex = brandHex } = {}) => {
  const chroma = tintChroma(brandHex)
  if (!chroma) return null
  return toHex(tint((dark ? DARK : DEFAULTS)['--g-color-neutral'], lchOf(hueHex).h, chroma))
}

// ---------- Categorías ----------

export const CATEGORY_LIGHTNESS = 0.52
export const CATEGORY_CHROMA = 0.12
export const MAX_CATEGORIES = 12
/** Por encima de este número, los tonos vecinos (pasos < 45°) se parecen demasiado. */
export const COMFORTABLE_CATEGORIES = 8

/**
 * `n` bases de categoría: mismo L y C, tonos repartidos por igual (360° / n) empezando medio paso después del de la marca.
 * @returns {string[]} hex claros; de cada uno se derivan strong, soft, text, on y on-soft como el resto de colores
 */
export const categoryBases = (n, brandHex) => {
  const h0 = brandHex ? lchOf(brandHex).h : 0
  return Array.from({ length: n }, (_, k) => hexOf({ l: CATEGORY_LIGHTNESS, c: CATEGORY_CHROMA, h: norm(h0 + (360 * (k + 0.5)) / n) }))
}
