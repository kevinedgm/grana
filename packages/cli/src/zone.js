// Zona de marca (docs/contract/tokens.md §44; DECISIONS.md #620 a #625): derivación de las fuentes, validación,
// documentación y diagnósticos. El bloque `[data-g-zone="brand"]` con la lista de §44.5 es de coco (defaults.css);
// aquí solo se derivan las fuentes que ese bloque lee, se validan y se emite lo que depende del tema (§44.6).
import { contrast, fromOklch, parseHex, toHex, toOklch } from './color.js'
import { DEFAULTS, DARK } from './defaults.js'

export const MIN = 4.5
export const SUNKEN_MAX = 0.08 // H, el hundido máximo: Z con un 8 % de I (§44.2)
export const MUTED_SHARE = 18 // on-brand-muted: I con un 18 % de Z, bajando en pasos de 1 (§44.2)
export const VEIL_MAX = 20 // regla «soft»: del 20 al 0 % (§44.4)
export const VEIL_FLAT = 8 // por debajo, el velo casi no se ve (zone-veil-flat)
export const LOST_DL = 0.35 // |ΔL| a partir del cual el color ya no se reconoce (§44.3)
export const LOST_C = 0.04 // croma por debajo del cual el color ya no se reconoce (§44.3)
export const ZONE_SEMANTIC = ['success', 'warning', 'danger', 'info']
// Entradas de la regla de guarda: el acento y los cuatro semánticos (bases del claro)
export const GUARDED = ['accent', ...ZONE_SEMANTIC]

const v = (n) => `--g-color-${n}`
// Las diez fuentes que deriva el CLI (todas salvo `zone-edge`, que escribe coco en defaults.css)
export const ZONE_NAMES = ['brand-zone', 'on-brand-zone', 'on-brand-muted', ...GUARDED.map((n) => `on-brand-${n}`), 'on-brand-veil', 'on-brand-accent-veil']
export const ZONE_SOURCES = ZONE_NAMES.map(v)
export const ZONE_EDGE = v('zone-edge')
export const isZoneToken = (name) => ZONE_SOURCES.includes(name) || name === ZONE_EDGE

const rgb = (hex) => parseHex(hex)
const hexOf = (c) => toHex(c.map(Math.round))
const L = (hex) => toOklch(rgb(hex)).l
export const ratio = (a, b) => contrast(rgb(a), rgb(b))
const meets = (r) => r + 1e-9 >= MIN

// Mezcla OKLab (`t` = parte de `b`, 0 a 1); en los extremos devuelve el color tal cual (sin ida y vuelta por OKLab)
const lab = (hex) => { const k = toOklch(rgb(hex)); const r = (k.h * Math.PI) / 180; return [k.l, k.c * Math.cos(r), k.c * Math.sin(r)] }
export const mix = (a, b, t) => {
  if (t <= 0) return toHex(rgb(a))
  if (t >= 1) return toHex(rgb(b))
  const x = lab(a), y = lab(b)
  const [l, A, B] = x.map((n, i) => n + (y[i] - n) * t)
  return hexOf(fromOklch({ l, c: Math.hypot(A, B), h: (Math.atan2(B, A) * 180) / Math.PI }))
}

/**
 * El hundido máximo de la zona (§44.2): Z con un 8 % de I. Si la tinta no llega a 4,5:1 sobre esa mezcla (marcas de
 * tono medio, en las que `on-brand` apenas supera 4,5:1 frente a la marca), la parte de I baja en pasos de 1 hasta que
 * llegue (en 0 es la marca): `share` < 8 se informa con `zone-sunken-limited`. Hueco del contrato, pendiente de lima.
 */
export const sunkenOf = (Z, I) => {
  for (let s = Math.round(SUNKEN_MAX * 100); s > 0; s--) {
    const value = mix(Z, I, s / 100)
    if (meets(ratio(I, value))) return { value, share: s }
  }
  return { value: toHex(rgb(Z)), share: 0 }
}
export const sunkenMax = (Z, I) => sunkenOf(Z, I).value
/** La zona es oscura si su tinta es más clara que ella (§44.2) */
export const isDarkZone = (Z, I) => L(I) > L(Z)
const inkSide = (hex, Z, I) => (isDarkZone(Z, I) ? L(hex) > L(Z) : L(hex) < L(Z))
const worst = (hex, list) => Math.min(...list.map((s) => ratio(hex, s)))

/**
 * Regla de guarda (§44.3) de un color X sobre la zona Z (tinta I, hundido H).
 * @returns {{ state: 'kept'|'adjusted'|'fallback'|'lost', value: string, input: string, moved?: string }}
 */
export const guard = (X, Z, I, H = sunkenMax(Z, I)) => {
  const input = toHex(rgb(X))
  const ok = (hex) => inkSide(hex, Z, I) && meets(worst(hex, [Z, H]))
  if (ok(input)) return { state: 'kept', value: input, input }
  const k = toOklch(rgb(input))
  const step = isDarkZone(Z, I) ? 0.01 : -0.01
  let moved = null
  for (let n = 1; ; n++) {
    const l = k.l + n * step
    if (l < -1e-9 || l > 1 + 1e-9) break
    const cand = hexOf(fromOklch({ l: Math.min(1, Math.max(0, l)), c: k.c, h: k.h }))
    if (ok(cand)) { moved = cand; break }
  }
  const ink = toHex(rgb(I))
  if (!moved) return { state: 'fallback', value: ink, input }
  const m = toOklch(rgb(moved))
  if (Math.abs(m.l - k.l) > LOST_DL || (m.c < LOST_C && k.c >= LOST_C)) return { state: 'lost', value: ink, input, moved }
  return { state: 'adjusted', value: moved, input }
}

/** Regla «soft» (§44.4): velo = Z con s % de T, del 20 al 0, el primero en que I dé ≥ 4,5:1 */
export const veil = (Z, T, I) => {
  for (let s = VEIL_MAX; s > 0; s--) {
    const value = mix(Z, T, s / 100)
    if (meets(ratio(I, value))) return { value, share: s }
  }
  return { value: toHex(rgb(Z)), share: 0 }
}

/** on-brand-muted (§44.2): I con un 18 % de Z; si no cumple frente a Z y H, la parte de Z baja en pasos de 1 */
export const muted = (Z, I, H = sunkenMax(Z, I)) => {
  for (let t = MUTED_SHARE; t > 0; t--) {
    const value = mix(I, Z, t / 100)
    if (meets(worst(value, [Z, H]))) return { value, share: t }
  }
  return { value: toHex(rgb(I)), share: 0 }
}

/**
 * Deriva las diez fuentes de la zona (§44.2 a §44.4).
 * @param {{ brand: string, onBrand: string, accent: string, success: string, warning: string, danger: string, info: string }} input
 *   colores en hex: Z (`brand`), I (`onBrand`) y las bases del claro de la regla de guarda
 * @returns {{ tokens: Record<string,string>, guarded: Record<string,object>, veils: { veil: number, accentVeil: number }, mutedShare: number, dark: boolean, sunken: string }}
 */
export const deriveZone = ({ brand, onBrand, ...inputs }) => {
  const Z = toHex(rgb(brand)), I = toHex(rgb(onBrand))
  const sunken = sunkenOf(Z, I)
  const H = sunken.value
  const m = muted(Z, I, H)
  const guarded = {}
  for (const n of GUARDED) guarded[n] = guard(inputs[n], Z, I, H)
  const nv = veil(Z, I, I)
  const av = veil(Z, guarded.accent.value, I)
  const tokens = {
    [v('brand-zone')]: Z,
    [v('on-brand-zone')]: I,
    [v('on-brand-muted')]: m.value,
    ...Object.fromEntries(GUARDED.map((n) => [v(`on-brand-${n}`), guarded[n].value])),
    [v('on-brand-veil')]: nv.value,
    [v('on-brand-accent-veil')]: av.value
  }
  return { tokens, guarded, veils: { veil: nv.share, accentVeil: av.share }, mutedShare: m.share, dark: isDarkZone(Z, I), sunken: H, sunkenShare: sunken.share }
}

// Resuelve `var(--x)` y devuelve el hex en mayúsculas, o null si no es un hex
const resolve = (tokens, value, depth = 0) => {
  const m = /^var\((--[a-z0-9-]+)\)$/.exec(String(value ?? '').trim())
  if (m && depth < 8) return resolve(tokens, tokens[m[1]], depth + 1)
  const c = parseHex(String(value ?? '').trim())
  return c ? toHex(c) : null
}

/**
 * Entradas de la zona desde un tema completo (el claro): Z = `brand-zone` fijado o `brand`; I = `on-brand-zone` fijado u
 * `on-brand`; el resto, las bases del claro. Devuelve null si alguna no es un hex legible.
 */
export const zoneInputs = (tokens, overrides = {}) => {
  const pick = (src, fixed) => resolve(tokens, overrides[fixed] ?? tokens[src])
  const input = { brand: pick(v('brand'), v('brand-zone')), onBrand: pick(v('on-brand'), v('on-brand-zone')) }
  for (const n of GUARDED) input[n] = resolve(tokens, tokens[v(n)])
  return Object.values(input).every(Boolean) ? input : null
}

/**
 * Las fuentes de la zona de un tema, en los dos esquemas (§44.6: el mismo valor en los tres bloques; `overrides` vale para
 * los dos y `dark.overrides` solo para el oscuro). Si `dark.overrides` fija Z o I, el oscuro se re-deriva desde ellos.
 * @returns {{ light: object, dark: object, derivation: object, darkDerivation: object } | null}
 */
export const zoneOfTheme = (lightTokens, { overrides = {}, darkOverrides = {} } = {}) => {
  const input = zoneInputs(lightTokens, overrides)
  if (!input) return null
  const derivation = deriveZone(input)
  const pickOwn = (o) => Object.fromEntries(Object.entries(o).filter(([k]) => ZONE_SOURCES.includes(k)))
  const light = { ...derivation.tokens, ...pickOwn(overrides) }
  let darkDerivation = derivation
  const z = darkOverrides[v('brand-zone')], i = darkOverrides[v('on-brand-zone')]
  if (z !== undefined || i !== undefined) {
    const brand = resolve(lightTokens, z ?? light[v('brand-zone')]), onBrand = resolve(lightTokens, i ?? light[v('on-brand-zone')])
    if (brand && onBrand) darkDerivation = deriveZone({ ...input, brand, onBrand })
  }
  const dark = { ...darkDerivation.tokens, ...pickOwn(overrides), ...pickOwn(darkOverrides) }
  return { light, dark, derivation, darkDerivation }
}

/**
 * Validación de la zona en un esquema (§44.7). Un par bajo el mínimo es error (también si viene de `overrides`).
 * @param {Record<string,string>} tokens tema completo de ese esquema (con las fuentes)
 */
export const validateZone = (tokens, { scheme = 'light' } = {}) => {
  const issues = []
  const tag = scheme === 'dark' ? '[oscuro] ' : ''
  const read = {}
  for (const name of ZONE_SOURCES) {
    if (tokens[name] === undefined) return issues // tema sin zona (no debería ocurrir con el CLI)
    read[name] = resolve(tokens, tokens[name])
    if (!read[name]) {
      issues.push({ id: 'unverifiable', severity: 'warning', message: `${tag}No se pudo leer el color de ${name} («${tokens[name]}»): no se verificó la zona de marca.`, why: 'Usa hex (#RRGGBB) para que el CLI pueda comprobarlo.', tokens: [name] })
      return scheme === 'dark' ? issues.map((x) => ({ ...x, scheme })) : issues
    }
  }
  const Z = read[v('brand-zone')], I = read[v('on-brand-zone')], H = sunkenMax(Z, I)
  const err = (id, message, why, extra) => issues.push({ id, severity: 'error', message: tag + message, why, ...extra })
  const fmt = (n) => (Math.round(n * 100) / 100).toString()
  const share = sunkenOf(Z, I).share
  const against = [[v('brand-zone'), Z], [`el hundido máximo de la zona (marca con un ${share} % de tinta)`, H]]
  for (const n of ['on-brand-zone', 'on-brand-muted', ...GUARDED.map((g) => `on-brand-${g}`)]) {
    const name = v(n)
    for (const [label, bg] of against) {
      const r = ratio(read[name], bg)
      if (!meets(r)) err('zone-contrast', `${name} sobre ${label}: contraste ${fmt(r)}:1, mínimo ${MIN}:1.`, 'WCAG 1.4.3: dentro de la zona de marca este color se pinta como texto sobre la marca y sobre su superficie hundida (tokens.md §44.7).', { tokens: [name, v('brand-zone')], ratio: +r.toFixed(2), min: MIN })
    }
  }
  for (const n of ['on-brand-veil', 'on-brand-accent-veil']) {
    const r = ratio(I, read[v(n)])
    if (!meets(r)) err('zone-contrast', `--g-color-on-brand-zone sobre ${v(n)}: contraste ${fmt(r)}:1, mínimo ${MIN}:1.`, 'WCAG 1.4.3: la tinta de la zona se pinta encima de sus velos (botones soft, selección; tokens.md §44.4).', { tokens: [v('on-brand-zone'), v(n)], ratio: +r.toFixed(2), min: MIN })
  }
  for (const g of GUARDED) {
    const name = v(`on-brand-${g}`)
    if (read[name] !== I && !inkSide(read[name], Z, I)) err('zone-side', `${name} (${read[name]}) no está del lado de la tinta de la zona (${isDarkZone(Z, I) ? 'más claro' : 'más oscuro'} que ${Z}).`, 'Las mezclas de la zona (acento fuerte, velos) solo cumplen por convexidad si sus dos colores están del mismo lado de la marca (tokens.md §44.3).', { tokens: [name, v('brand-zone')] })
  }
  return issues
}

const r2 = (n) => Math.round(n * 100) / 100
const SOURCE = { 'brand-zone': 'brand', 'on-brand-zone': 'on-brand', 'on-brand-muted': 'on-brand', 'on-brand-veil': 'on-brand', 'on-brand-accent-veil': 'accent', 'zone-edge': 'border-strong' }
const USAGE = {
  'brand-zone': 'Fondo de la zona de marca (data-g-zone="brand"): la marca profunda, la misma en claro y en oscuro. Fuente de la zona: los componentes no la leen.',
  'on-brand-zone': 'Tinta de la zona de marca: texto, acción principal invertida y lo que se pinta sobre sus velos (≥ 4.5:1 sobre la marca y su hundido).',
  'on-brand-muted': 'Tinta secundaria de la zona de marca: texto apagado, contornos de control y neutro (≥ 4.5:1 sobre la marca y su hundido).',
  'on-brand-accent': 'Acento de la zona de marca: foco, enlaces y lo activo (≥ 4.5:1 sobre la marca y su hundido, del lado de la tinta).',
  'on-brand-veil': 'Velo de tinta de la zona de marca: el soft neutro y el de la acción principal, con la tinta plena encima.',
  'on-brand-accent-veil': 'Velo de acento de la zona de marca: accent-soft y la selección, con la tinta plena encima.',
  'zone-edge': 'Filo de la zona de marca frente a la página (border-strong de cada esquema). Decorativo; lo lee GSurface.'
}
const usageOfZone = (n) => USAGE[n] ?? `«${n.replace('on-brand-', '')}» como texto sobre la zona de marca: tendencias, mensajes y contornos (≥ 4.5:1 sobre la marca y su hundido, del lado de la tinta).`

/**
 * Entrada de tokens.json de una fuente de la zona (§44.7), o null si `name` no es de la zona.
 * @param {string} name sin el prefijo `--g-color-`
 */
export const zoneDocToken = (name, { light, dark, status, zone }) => {
  if (!isZoneToken(v(name))) return null
  const key = v(name)
  const value = { light: resolve(light, light[key]) ?? String(light[key] ?? ''), dark: resolve(dark, dark[key]) ?? String(dark[key] ?? '') }
  const tok = { name, cssVar: key, level: 'reference', value, usage: usageOfZone(name) }
  const g = /^on-brand-(.+)$/.exec(name)?.[1]
  tok.source = SOURCE[name] ?? (GUARDED.includes(g) ? g : 'brand')
  tok.status = status
  if (name !== 'zone-edge' && name !== 'brand-zone') {
    const fg = name === 'on-brand-veil' || name === 'on-brand-accent-veil' ? null : key
    const r = {}
    for (const [scheme, t] of [['light', light], ['dark', dark]]) {
      const z = resolve(t, t[v('brand-zone')])
      if (fg) { const c = resolve(t, t[fg]); if (c && z) r[scheme] = r2(ratio(c, z)) }
      else { const i = resolve(t, t[v('on-brand-zone')]), bg = resolve(t, t[key]); if (i && bg) r[scheme] = r2(ratio(i, bg)) }
    }
    if (Object.keys(r).length) tok.contrast = fg ? { against: v('brand-zone'), ...r } : { against: key, foreground: v('on-brand-zone'), ...r }
  }
  if (GUARDED.includes(g) && zone?.guarded?.[g] && status !== 'override') {
    const s = zone.guarded[g]
    tok.zone = s.state
    tok.input = s.input
    if (s.moved) tok.moved = s.moved
  }
  return tok
}

/** Diagnósticos de la zona (§44.7, §17.13). Ninguno bloquea. */
export const zoneDiagnostics = (zone, { overrides = {} } = {}) => {
  if (!zone) return []
  const out = []
  const d = zone.derivation
  const toward = d.dark ? 'aclaró' : 'oscureció'
  for (const g of GUARDED) {
    const key = v(`on-brand-${g}`)
    if (key in overrides) continue
    const s = d.guarded[g]
    const label = g === 'accent' ? 'el acento' : `«${g}»`
    const base = { token: `on-brand-${g}`, cssVar: key, source: g, input: s.input, value: s.value, zone: s.state }
    if (s.state === 'adjusted') out.push({ ...base, code: `zone-${g}-adjusted`, status: 'informative', message: `Sobre la marca (${d.tokens[v('brand-zone')]}), ${label} se ${toward} para leerse: ${s.input} → ${s.value}.` })
    if (s.state === 'fallback') out.push({ ...base, code: `zone-${g}-fallback`, status: 'warning', message: `Sobre la marca (${d.tokens[v('brand-zone')]}) ${label} es la tinta (${s.value}): ningún ajuste de luminosidad de ${s.input} llega a ${MIN}:1.` })
    if (s.state === 'lost') out.push({ ...base, moved: s.moved, code: `zone-${g}-lost`, status: 'warning', message: `Sobre la marca (${d.tokens[v('brand-zone')]}) ${label} es la tinta (${s.value}): el color que cumpliría, ${s.moved}, ya no se reconoce como ${s.input}.` })
  }
  if (d.sunkenShare < Math.round(SUNKEN_MAX * 100)) {
    out.push({ code: 'zone-sunken-limited', token: 'brand-zone', cssVar: v('brand-zone'), value: d.sunken, share: d.sunkenShare, status: 'warning', message: `Sobre esta marca (${d.tokens[v('brand-zone')]}) la tinta solo da ${MIN}:1 con un hundido de hasta un ${d.sunkenShare} % de tinta (el contrato prevé hasta un ${SUNKEN_MAX * 100} %): la zona se validó contra ese hundido, y una superficie hundida o inset dentro de la zona más marcada que eso queda por debajo de ${MIN}:1.` })
  }
  for (const [n, share] of [['on-brand-veil', d.veils.veil], ['on-brand-accent-veil', d.veils.accentVeil]]) {
    const key = v(n)
    if (key in overrides || share >= VEIL_FLAT) continue
    out.push({ code: 'zone-veil-flat', token: n, cssVar: key, value: d.tokens[key], share, status: 'informative', message: `El velo ${n} de la zona lleva solo un ${share} % de color (mínimo visible ${VEIL_FLAT} %)${share === 0 ? ': es la marca y el soft se lee como ghost' : ''}. Sigue siendo legible.` })
  }
  return out
}

/**
 * Bloque `[data-g-zone="brand"]` sin capa (§44.6): `color-scheme` si la zona es clara (el tema por defecto la declara
 * oscura) y `cat-k-text` = la tinta para cada categoría. Devuelve null si no hace falta.
 */
export const zoneBlockOf = (zone, { categories = 0 } = {}) => {
  if (!zone) return null
  const decls = {}
  const Z = resolve({}, zone.light[v('brand-zone')]), I = resolve({}, zone.light[v('on-brand-zone')])
  if (Z && I && !isDarkZone(Z, I)) decls['color-scheme'] = 'light'
  for (let k = 1; k <= categories; k++) decls[v(`cat-${k}-text`)] = `var(${v('on-brand-zone')})`
  return Object.keys(decls).length ? decls : null
}

/**
 * Añade la zona al resultado de `generateTheme` (§44.6): las fuentes van a `generated` y a `dark.generated` cuando difieren
 * de las del tema por defecto (o las fija el usuario), y siempre a `tokens` y `dark.tokens`. Devuelve también `zone`
 * (derivación y valores por esquema) y `zoneBlock` (las declaraciones del bloque `[data-g-zone="brand"]` sin capa, o null).
 */
export const applyZone = (result, config = {}) => {
  const overrides = config.overrides ?? {}
  const darkOverrides = typeof config.dark === 'object' && config.dark ? config.dark.overrides ?? {} : {}
  const zone = zoneOfTheme(result.tokens, { overrides, darkOverrides })
  if (!zone) return { ...result, zone: null, zoneBlock: null }
  const generated = { ...result.generated }
  // Si la zona del tema no es la del tema por defecto, se emiten las diez fuentes (§44.6); si lo es, ninguna
  const touched = Object.entries(zone.light).some(([k, val]) => val !== DEFAULTS[k] || k in overrides)
  if (touched) Object.assign(generated, zone.light)
  const tokens = { ...result.tokens, ...zone.light }
  let dark = result.dark
  if (dark?.enabled) {
    const dg = { ...dark.generated }
    for (const [k, val] of Object.entries(zone.dark)) {
      if (k in generated || k in darkOverrides || val !== (DARK[k] ?? DEFAULTS[k])) dg[k] = val
    }
    dark = { ...dark, generated: dg, tokens: { ...dark.tokens, ...zone.dark } }
  }
  const zoneBlock = zoneBlockOf(zone, { categories: result.derived?.categories?.length ?? 0 })
  return { ...result, generated, tokens, dark, zone, zoneBlock }
}
