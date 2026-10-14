// Zona de marca · r02 · derivación propuesta (kiwi). Simula lo que el CLI derivaría y lo que GSurface.css
// redeclararía en la zona. Reutiliza las funciones reales de color del CLI (OKLCH, gama, contraste WCAG).
// No es código de la librería: es el banco de la ronda.
import { contrast, parseHex, toHex, toOklch, fromOklch } from '../../../../packages/cli/src/color.js'
import { deriveColor, deriveDarkColor, pickOn } from '../../../../packages/cli/src/derive.js'

const rgb = (hex) => parseHex(hex)
const hex = (v) => toHex(v.map(Math.round))
export const ratio = (a, b) => contrast(rgb(a), rgb(b))

// Mezcla en OKLab (t = parte de b)
const lab = (h) => { const k = toOklch(rgb(h)); const r = (k.h * Math.PI) / 180; return [k.l, k.c * Math.cos(r), k.c * Math.sin(r)] }
const fromLab = ([l, a, b]) => hex(fromOklch({ l, c: Math.hypot(a, b), h: (Math.atan2(b, a) * 180) / Math.PI }))
export const mix = (a, b, t) => { const x = lab(a), y = lab(b); return fromLab(x.map((v, i) => v + (y[i] - v) * t)) }

// Mueve L de `h` alejándose de `against` (conserva H; reduce C si sale de gama) hasta `min`. Devuelve null si no llega.
const away = (h, against, min) => {
  const k = toOklch(rgb(h)), up = toOklch(rgb(against)).l < 0.6
  let cur = h
  for (let l = k.l; ratio(cur, against) < min; l += up ? 0.01 : -0.01) {
    if (l < 0 || l > 1) return null
    cur = hex(fromOklch({ l, c: k.c, h: k.h }))
  }
  return cur
}
// El peor contraste de `h` contra varias superficies
const worst = (h, list) => Math.min(...list.map((s) => ratio(h, s)))
const awayAll = (h, list, min) => {
  let cur = h
  for (let i = 0; i < 100 && worst(cur, list) < min; i++) {
    const k = toOklch(rgb(cur)), up = toOklch(rgb(list[0])).l < 0.6
    const l = k.l + (up ? 0.01 : -0.01)
    if (l < 0 || l > 1) return null
    cur = hex(fromOklch({ l, c: k.c, h: k.h }))
  }
  return worst(cur, list) >= min ? cur : null
}
const shiftL = (h, dl) => { const k = toOklch(rgb(h)); return hex(fromOklch({ l: Math.min(1, Math.max(0, k.l + dl)), c: k.c, h: k.h })) }
const alpha = (h, a) => { const [r, g, b] = rgb(h); return `rgb(${r} ${g} ${b} / ${a})` }

/**
 * Juego de tinta de la zona (común a A, B y C). `p` = valores resueltos de la página (hex).
 * Reglas propuestas para el CLI (hallazgos 7 y 15):
 *  - on-brand-muted: mezcla OKLab de on-brand hacia brand al 18 %; si baja de 4.5:1 frente a TODAS las
 *    superficies de la zona, la parte de brand baja en pasos de 0.01.
 *  - on-brand-accent: el acento tal cual si da ≥ 4.5:1 frente a todas; si no, se mueve su L alejándose de la
 *    marca (mismo tono) hasta 4.5:1; si no hay L que llegue, on-brand (estado «fallback», diagnóstico).
 *  - {sem}-text en la zona: el semántico movido en L hasta 4.5:1 (mismo mecanismo que on-brand-accent).
 */
export const ink = (p, surfaces) => {
  const Z = p.brand, I = p.onBrand
  let t = 0.18, muted = mix(I, Z, t)
  while (worst(muted, surfaces) < 4.5 && t > 0) { t = Math.max(0, t - 0.01); muted = mix(I, Z, t) }
  let accentState = 'kept', A = p.accent
  if (worst(A, surfaces) < 4.5) {
    const moved = awayAll(p.accent, surfaces, 4.5)
    if (moved) { A = moved; accentState = 'adjusted' } else { A = I; accentState = 'fallback' }
  }
  const sem = {}
  for (const s of ['success', 'warning', 'danger', 'info']) sem[s] = awayAll(p[s], surfaces, 4.5) || I
  return { Z, I, muted, mutedShare: t, A, accentState, sem }
}

// Polaridad: la zona es «oscura» si su tinta es más clara que ella
export const isDarkZone = (p) => toOklch(rgb(p.onBrand)).l > toOklch(rgb(p.brand)).l

/**
 * Mapa de tokens que la zona redeclara para sus descendientes, por concepto.
 *  A · Esquema de marca: la zona es un esquema completo; las superficies propias son pasos de tono de la marca.
 *  B · Islas: tinta en la zona; las superficies propias vuelven al esquema de la página (ver islandRestore).
 *  C · Plano de tinta: tinta en la zona; las superficies propias se funden con la marca y solo conservan su línea.
 */
export const zoneTokens = (p, concept) => {
  const Z = p.brand, dark = isDarkZone(p)
  const surface = concept === 'A' ? shiftL(Z, dark ? 0.045 : 0.035) : Z
  const sunken = concept === 'A' ? shiftL(Z, dark ? -0.035 : -0.04) : mix(Z, p.onBrand, 0.06)
  const surfaces = concept === 'A' ? [Z, surface, sunken] : [Z, sunken]
  const k = ink(p, surfaces)
  const I = k.I, A = k.A
  // Par «soft» garantizado: velo de `tint` sobre la marca, del 20 % al 8 %, con la primera tinta que dé 4.5:1
  const softPair = (tint, inks) => {
    for (let t = 0.2; t >= 0.08 - 1e-9; t -= 0.01) {
      const v = mix(Z, tint, t)
      for (const c of inks) if (ratio(c, v) >= 4.5) return { soft: v, on: c, share: t }
    }
    return { soft: Z, on: inks[0], share: 0 }
  }
  const nSoft = softPair(I, [I])
  const aSoft = softPair(A, [A, I])
  const accentSoft = aSoft.soft
  const onAccentSoft = aSoft.on
  const tok = {
    '--g-color-bg': Z,
    '--g-color-surface': surface,
    '--g-color-surface-sunken': sunken,
    '--g-color-text': I,
    '--g-color-text-muted': k.muted,
    '--g-color-text-subtle': k.muted,
    '--g-color-border': alpha(I, 0.16),
    '--g-color-border-strong': alpha(I, 0.3),
    '--g-color-border-control': k.muted,
    '--g-color-mold': mix(surface, I, 0.18),
    '--g-color-focus': A,
    '--g-color-link': A,
    '--g-color-selection': accentSoft,
    '--g-color-active': A,
    // Acción principal dentro de la zona: tinta invertida (la zona ya es el sólido de marca de la vista, tokens.md §2)
    '--g-color-primary': I,
    '--g-color-primary-strong': mix(I, Z, 0.12),
    '--g-color-primary-soft': nSoft.soft,
    '--g-color-primary-text': I,
    '--g-color-on-primary': Z,
    '--g-color-on-primary-soft': I,
    // brand dentro de la zona = el mismo juego (un GBtn color="brand" no puede ser marca sobre marca)
    '--g-color-brand': I,
    '--g-color-brand-strong': mix(I, Z, 0.12),
    '--g-color-brand-soft': nSoft.soft,
    '--g-color-brand-text': I,
    '--g-color-on-brand': Z,
    '--g-color-on-brand-soft': I,
    // Acento garantizado (hallazgo 15)
    '--g-color-accent': A,
    '--g-color-accent-strong': shiftL(A, dark ? 0.06 : -0.06),
    '--g-color-accent-soft': accentSoft,
    '--g-color-accent-text': A,
    '--g-color-on-accent': toHex(pickOn(rgb(A))),
    '--g-color-on-accent-soft': onAccentSoft,
    // Neutro: velo de tinta, no gris de página (hallazgo 22)
    '--g-color-neutral': k.muted,
    '--g-color-neutral-strong': I,
    '--g-color-neutral-soft': nSoft.soft,
    '--g-color-neutral-text': k.muted,
    '--g-color-on-neutral': Z,
    '--g-color-on-neutral-soft': I,
    '--g-surface-shell': sunken,
    '--g-surface-inset': surface,
    '--g-tabs-thumb': surface,
    '--g-tabs-panel': surface,
    '--g-tabs-track': alpha(I, 0.08),
    '--g-tabs-band': alpha(I, 0.05),
    '--g-card-hover': alpha(I, 0.05),
    '--g-card-pressed': alpha(I, 0.1),
    '--g-card-selected': alpha(I, 0.07),
    '--g-shadow-1': '0 1px 2px rgb(0 0 0 / 0.30)',
    '--g-shadow-2': '0 4px 12px -4px rgb(0 0 0 / 0.50)',
    '--g-shadow-3': '0 16px 40px -12px rgb(0 0 0 / 0.60)',
    '--g-calendar-grid-color': alpha(I, 0.16),
    '--g-calendar-unavailable-color': alpha(I, 0.3),
    'color-scheme': dark ? 'dark' : 'light'
  }
  // Semánticos: en A se re-derivan enteros contra la superficie de la zona (como el oscuro); en B y C sus
  // rellenos (solid, soft) se quedan (llevan su propia tinta) y solo cambia el -text, que se pinta sobre la marca.
  for (const s of ['success', 'warning', 'danger', 'info']) {
    if (concept === 'A') {
      const d = dark ? deriveDarkColor(p[s], { surface }) : deriveColor(p[s], { surface })
      const text = awayAll(d.text, surfaces, 4.5) || I
      Object.assign(tok, {
        [`--g-color-${s}`]: d.base, [`--g-color-${s}-strong`]: d.strong, [`--g-color-${s}-soft`]: d.soft,
        [`--g-color-${s}-text`]: text, [`--g-color-on-${s}`]: d.on, [`--g-color-on-${s}-soft`]: d.onSoft
      })
    } else {
      tok[`--g-color-${s}-text`] = k.sem[s]
    }
  }
  return { tokens: tok, ink: k, dark, surfaces }
}

// Lista de tokens que una isla (concepto B) restablece al valor de la página
export const islandRestore = (page, zone) => {
  const out = {}
  for (const name of Object.keys(zone)) if (name.startsWith('--') && page[name] != null) out[name] = page[name]
  out['color-scheme'] = page['color-scheme']
  return out
}

// El arreglo del proyecto (antes de esta ronda): solo text, text-muted y focus reasignados en la banda
export const projectHack = (p) => ({
  '--g-color-text': p.onBrand,
  '--g-color-text-muted': mix(p.onBrand, p.brand, 0.18),
  '--g-color-focus': p.onBrand
})
