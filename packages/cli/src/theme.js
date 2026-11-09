// Generación del tema: entradas → tokens (color en OKLCH, escalas), con los valores por defecto para lo demás.
import { deriveColor, deriveDarkColor, ensureText, worstAgainst } from './derive.js'
import { parseHex, toHex, toOklch } from './color.js'
import { DEFAULTS, DARK } from './defaults.js'
import { isColorGroup, splitColorGroup } from './scheme.js'
import { fontStack, radii, spacing, typography, heroTitleMax } from './scales.js'
import { categoryBases, semanticAdjustments, separateDark, distance, SEMANTIC, MIN_DISTANCE, tintedNeutralBase, tintedNeutrals } from './palette.js'
import { applyZone } from './zone.js'
import { sidebarCurrentDark } from './sidebarCurrent.js'

// Superficie de la regla anterior a #1074 (solo contra `surface`): con ella se calcula el acento que se deriva de la marca,
// para que la base del acento no cambie (§2: la garantía ampliada solo mueve `-text`)
const surfaceOf = (overrides = {}) => overrides['--g-color-surface'] ?? DEFAULTS['--g-color-surface']

// Fondos contra los que se garantiza todo `{familia}-text` (tokens.md §2 «Garantía de `{familia}-text`», #1074): los resueltos
// del esquema (overrides → teñidos de §16.2 → por defecto). Un valor que no es hex no se puede medir y cae al del esquema.
const BG_KEYS = { surface: '--g-color-surface', surfaceSunken: '--g-color-surface-sunken', bg: '--g-color-bg' }
const resolveBackgrounds = (overrides, tinted, base) => Object.fromEntries(Object.entries(BG_KEYS).map(([k, key]) => {
  const v = [overrides[key], tinted?.[key]].find((x) => x !== undefined && parseHex(x))
  return [k, v ?? base[key]]
}))
const bgList = (bgs) => Object.entries(BG_KEYS).map(([k, key]) => ({ name: key.slice('--g-color-'.length), rgb: parseHex(bgs[k]) }))

// Familias con `-text` que el tema puede no emitir (sin configurar o sin teñir): si su valor del esquema no cumple contra los
// fondos resueltos, se emite solo su `-text` ajustado con la misma regla (status «adjusted» en tokens.json)
const TEXT_FAMILIES = ['brand', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']

// Registro de la garantía: cada `-text` que se movió respecto a la regla solo contra `surface` (diagnóstico color-text-shift)
const recordShift = (derived, { family, scheme, from, to, against }) => {
  if (!derived || from === to) return
  const dl = Math.round((toOklch(parseHex(to)).l - toOklch(parseHex(from)).l) * 1000) / 1000
  derived.textShifts.push({ family, scheme, from, to, dl, against })
}

const tokensOf = (name, d) => ({
  [`--g-color-${name}`]: d.base,
  [`--g-color-${name}-strong`]: d.strong,
  [`--g-color-${name}-soft`]: d.soft,
  [`--g-color-${name}-text`]: d.text,
  [`--g-color-on-${name}`]: d.on,
  [`--g-color-on-${name}-soft`]: d.onSoft
})

const colorTokens = (name, base, bgs, derived) => {
  const d = deriveColor(base, bgs)
  if (d.textAgainst) recordShift(derived, { family: name, scheme: 'light', from: d.textSurface, to: d.text, against: d.textAgainst })
  return tokensOf(name, d)
}

// Base clara de `neutral` teñida (de ella se deriva también la variante oscura, como con los demás colores)
const lightNeutral = (brand, hueHex) => tintedNeutralBase(brand, { hueHex })

const darkColorTokens = (name, base, bgs, derived) => {
  const d = deriveDarkColor(base, bgs)
  if (d.textAgainst) recordShift(derived, { family: name, scheme: 'dark', from: d.textSurface, to: d.text, against: d.textAgainst })
  return tokensOf(name, d)
}

// Familias no derivadas (TEXT_FAMILIES sin `-text` propio en `out`): ajusta su `-text` del esquema si no cumple
const ensureUnemitted = (out, base, bgs, overrides, derivedKeys, derived, scheme) => {
  const list = bgList(bgs)
  for (const family of TEXT_FAMILIES) {
    const key = `--g-color-${family}-text`
    if (key in overrides || derivedKeys.has(key)) continue
    const from = parseHex(out[key] ?? base[key])
    if (!from) continue
    const { ratio, name } = worstAgainst(from, list)
    if (ratio + 1e-9 >= 4.5) continue
    const to = toHex(ensureText(from, list, 4.5))
    out[key] = to
    derived?.textAdjusted.add(key)
    recordShift(derived, { family, scheme, from: toHex(from), to, against: name })
  }
}

const textKeysOf = (fams) => new Set([...fams].map((f) => `--g-color-${f}-text`))

// Variante oscura de lo que el usuario cambia (tokens.md §15). Todo token del grupo de color que el usuario
// toca en el claro necesita su valor oscuro: el `tokens.css` no lleva capa y, sin él, ganaría también en el oscuro.
// Con cuál de marca, acento o primario (bases oscuras) choca un color oscuro
const ANCHOR_NAMES = ['brand', 'accent', 'primary']
const nearestDark = (hex, anchors) => {
  const c = toOklch(parseHex(hex))
  let best = { d: Infinity, who: null }
  anchors.forEach((a, i) => { if (!a) return; const d = distance(c, toOklch(parseHex(a))); if (d < best.d) best = { d, who: ANCHOR_NAMES[i] } })
  return best.who
}

const generateDark = (config, generated, derived) => {
  const opt = config.dark === undefined ? true : config.dark
  if (opt === false) return { enabled: false, generated: {}, tokens: null }
  const cfg = typeof opt === 'object' ? opt : {}
  const overrides = cfg.overrides ?? {}
  const d = derived
  // Neutros teñidos (§16.2) antes que los colores: cambian la superficie oscura (p. ej. #1C1C1C → #1A1D1B) y cada `-text`
  // se deriva contra la superficie real; con la de por defecto, un `cat-k-text` quedaba en 4,49:1 y el motor no pasaba su
  // propia validación (12 categorías en oscuro)
  const tinted = d && d.neutralsBrand
    ? tintedNeutrals(cfg.brand ?? d.neutralsBrand, { dark: true, hueHex: d.neutralsHue === 'accent' ? cfg.accent ?? d.neutralsHueHex : cfg.brand ?? d.neutralsBrand })
    : null
  // Los tres fondos oscuros resueltos (#1074): cada `-text` se garantiza contra todos
  const bgs = resolveBackgrounds(overrides, tinted, DARK)
  const fams = new Set()
  const dct = (name, base) => { fams.add(name); return darkColorTokens(name, base, bgs, d) }
  const out = {}
  const brand = cfg.brand ?? config.brand
  if (brand) Object.assign(out, dct('brand', brand))
  const accent = cfg.accent ?? config.accent ?? (brand ? out['--g-color-brand-text'] : undefined)
  if (accent) Object.assign(out, dct('accent', accent))
  const primary = cfg.primary ?? config.primary
  if (primary) Object.assign(out, dct('primary', primary))
  for (const k of Object.keys(generated)) {
    if (isColorGroup(k) && !(k in out) && k in DARK) out[k] = DARK[k]
  }
  // Derivación de paleta (tokens.md §16): los mismos semánticos ajustados, neutros teñidos y categorías, en su variante oscura
  if (d) {
    // Semánticos ajustados con búsqueda propia del oscuro (tokens.md §16.1, #1077): parte del oscuro de §15 (el claro resuelto
    // derivado con los fondos oscuros reales) y se mide contra las bases oscuras emitidas de marca, acento, primario y los demás
    // semánticos. El resultado pasa por `darkColorTokens` (#1074). El claro no cambia; con «warn», `applied` está vacío.
    const darkBase = (seed) => deriveDarkColor(seed, bgs).base
    const seeds = Object.fromEntries(Object.entries(d.applied).map(([n, r]) => [n, r.hex]))
    const anchors = [out['--g-color-brand'], out['--g-color-accent'], out['--g-color-primary']]
    const darkNow = (n) => (seeds[n] ? darkBase(seeds[n]) : DARK[`--g-color-${n}`])
    for (const name of SEMANTIC) {
      if (d.policy !== 'adjust') break
      const siblings = SEMANTIC.filter((n) => n !== name).map(darkNow)
      const r = d.applied[name]
      if (r) {
        const res = separateDark(r.hex, { darkOf: darkBase, darkAnchors: anchors, darkSiblings: siblings })
        if (res.hex !== r.hex) { r.darkHex = res.hex; seeds[name] = res.hex }
        r.darkDistance = res.distance
        r.distance = Math.min(r.lightDistance ?? r.distance, res.distance)
        r.ok = r.distance >= MIN_DISTANCE
        continue
      }
      // Sin ajuste en claro, pero el oscuro del tema por defecto queda cerca de las marcas oscuras reales (p. ej. con la superficie
      // teñida): solo el oscuro hace su búsqueda, desde el claro por defecto del semántico; el claro no se emite
      const nominal = DEFAULTS[`--g-color-${name}`]
      const res = separateDark(nominal, { darkOf: darkBase, start: DARK[`--g-color-${name}`], darkAnchors: anchors, darkSiblings: siblings })
      if (res.hex === nominal && res.ok) continue
      const who = nearestDark(DARK[`--g-color-${name}`], anchors)
      // Si ningún candidato mejora la base de partida, el oscuro por defecto se queda (sin emitir) y el aviso es honesto (ok: false)
      const moved = res.hex !== nominal
      d.semantic[name] = d.applied[name] = { hex: nominal, darkHex: moved ? res.hex : undefined, darkOnly: true, changed: moved, ok: res.ok, distance: res.distance, darkDistance: res.distance, before: res.before, collidedWith: who, dh: 0, dl: 0 }
      if (moved) seeds[name] = res.hex
    }
    for (const [name, r] of Object.entries(d.applied)) if (!r.darkOnly || r.darkHex) Object.assign(out, dct(name, r.darkHex ?? r.hex))
    if (d.neutralsBrand) {
      Object.assign(out, tinted)
      const nb = lightNeutral(cfg.brand ?? d.neutralsBrand, d.neutralsHueHex)
      if (nb) Object.assign(out, dct('neutral', nb))
    }
    d.categories.forEach((hex, k) => Object.assign(out, dct(`cat-${k + 1}`, hex)))
  }
  // Familias no derivadas en oscuro (p. ej. `danger-text` fijo sobre la superficie teñida): solo su `-text`, si no cumple
  ensureUnemitted(out, DARK, bgs, overrides, textKeysOf(fams), d, 'dark')
  const { other } = splitColorGroup(generated)
  // Ranuras del item actual de GSidebar (tokens.md §43, #614): heredadas del claro o, si un par falla, derivadas
  const sidebarCurrent = sidebarCurrentDark(config, { ...DEFAULTS, ...other, ...DARK, ...out, ...overrides })
  Object.assign(out, sidebarCurrent.values)
  Object.assign(out, overrides)
  return { enabled: true, generated: out, tokens: { ...DEFAULTS, ...other, ...DARK, ...out }, sidebarCurrent }
}

/**
 * @param {object} config configuración ya validada (readConfig)
 * @returns {{ generated, tokens, dark: { enabled, generated, tokens } }}
 *   generated: solo lo que las entradas cambian (lo que va a tokens.css); tokens: tema claro completo (defaults + generated);
 *   dark: lo mismo para el tema oscuro (`enabled` es falso con `dark: false`; `tokens` es null entonces)
 */
export const generateTheme = (config = {}) => {
  const overrides = config.overrides ?? {}
  const surface = surfaceOf(overrides)
  const generated = {}
  // Derivación de paleta (tokens.md §16); textShifts/textAdjusted: registro de la garantía de `{familia}-text` (#1074)
  const derived = { primary: config.primary ?? null, semantic: {}, applied: {}, policy: config.semanticCollision ?? 'warn', neutralsBrand: null, categories: [], textShifts: [], textAdjusted: new Set() }
  // Neutros teñidos (§16.2) y `overrides` de los fondos se resuelven ANTES de derivar los `-text` (#1074). Con
  // `neutralsHue: "accent"` y el acento derivado de la marca, el tono se toma del `text` de la marca de la regla solo contra
  // `surface`: la garantía solo mueve L, así que el tono es el mismo y se evita la dependencia circular
  const hueAccent = config.accent ?? (config.brand ? deriveColor(config.brand, { surface }).text : undefined)
  const tinted = config.brand && config.neutrals !== 'pure'
    ? tintedNeutrals(config.brand, { hueHex: (config.neutralsHue ?? 'brand') === 'accent' ? hueAccent : config.brand })
    : null
  const bgs = resolveBackgrounds(overrides, tinted, DEFAULTS)
  const fams = new Set()
  const ct = (name, base) => { fams.add(name); return colorTokens(name, base, bgs, derived) }
  if (config.brand) Object.assign(generated, ct('brand', config.brand))
  // accent sin valor: se deriva del `text` de brand (contrato §1), ya garantizado contra los tres fondos
  const accentBase = config.accent ?? (config.brand ? generated['--g-color-brand-text'] : undefined)
  if (accentBase) Object.assign(generated, ct('accent', accentBase))
  // `primary` propio (tokens.md §17.4): sin él, `primary` es un alias de `brand` (defaults.css); con él, sus seis tokens se derivan del color dado
  if (config.primary) Object.assign(generated, ct('primary', config.primary))
  const anchorBrand = config.brand ?? undefined
  const anchorAccent = accentBase
  if (anchorBrand || anchorAccent || config.primary) {
    const darkCfg = typeof config.dark === 'object' ? config.dark : {}
    derived.semantic = semanticAdjustments({ brand: anchorBrand, accent: anchorAccent, primary: config.primary, darkBrand: darkCfg.brand, darkAccent: darkCfg.accent, darkPrimary: darkCfg.primary })
    // semanticCollision (tokens.md §17.12): con «warn» (por defecto) solo se propone; con «adjust» se aplica
    if (derived.policy === 'adjust') derived.applied = derived.semantic
    for (const [name, r] of Object.entries(derived.applied)) Object.assign(generated, ct(name, r.hex))
  }
  if (tinted) {
    derived.neutralsBrand = config.brand
    // neutralsHue (§16.2): solo decide de qué color se toma el tono; el croma y el resto de reglas no cambian
    derived.neutralsHue = config.neutralsHue ?? 'brand'
    derived.neutralsHueHex = derived.neutralsHue === 'accent' ? hueAccent : config.brand
    Object.assign(generated, tinted)
    const nb = tintedNeutralBase(config.brand, { hueHex: derived.neutralsHueHex })
    if (nb) Object.assign(generated, ct('neutral', nb))
  }
  if (config.categories > 0) {
    derived.categories = categoryBases(config.categories, config.brand)
    derived.categories.forEach((hex, k) => Object.assign(generated, ct(`cat-${k + 1}`, hex)))
  }
  // Familias que el tema no emite: solo su `-text`, y solo si el del tema por defecto no cumple contra los fondos resueltos
  ensureUnemitted(generated, DEFAULTS, bgs, overrides, textKeysOf(fams), derived, 'light')
  if (config.radius !== undefined || config.shape !== undefined) {
    const r = radii(config.radius ?? 6, config.shape)
    if (config.radius !== undefined) Object.assign(generated, r)
    else generated['--g-radius-shape'] = r['--g-radius-shape']
  }
  if (config.space !== undefined) Object.assign(generated, spacing(config.space))
  if (config.font !== undefined) generated['--g-font-ui'] = fontStack(config.font)
  if (config.fontDisplay !== undefined) generated['--g-font-display'] = fontStack(config.fontDisplay)
  if (config.fontSize !== undefined || config.typeScale !== undefined) {
    Object.assign(generated, typography(config.fontSize ?? 16, config.typeScale ?? 1.25))
    // Tope del título de GHero (tokens.md §51, #727): fontSize × typeScale⁶ en rem
    generated['--g-hero-title-max'] = heroTitleMax(config.fontSize ?? 16, config.typeScale ?? 1.25)
  }
  Object.assign(generated, overrides)
  // Zona de marca (tokens.md §44): las fuentes se derivan del claro ya resuelto y valen lo mismo en los dos esquemas
  const dark = generateDark(config, generated, derived)
  // Un `-text` de `overrides` no se toca (#1074): su desplazamiento no se informa
  const darkOverrides = typeof config.dark === 'object' ? (config.dark.overrides ?? {}) : {}
  derived.textShifts = derived.textShifts.filter((t) => !(`--g-color-${t.family}-text` in (t.scheme === 'dark' ? darkOverrides : overrides)))
  return applyZone({ generated, tokens: { ...DEFAULTS, ...generated }, dark, derived }, config)
}

// Especificidad: los dos selectores de la consulta oscura valen (0,1,0), igual que `:root, [data-theme="light"]`, para que
// un segundo tema cargado después (cambio en caliente) gane por orden; con `:not()` pasarían a (0,2,0) y el primero ganaría siempre.
/** tokens.css: sin capa (el tema del usuario gana siempre, contrato §8). Con tema oscuro, tres bloques (contrato §15). */
export const toCss = (generated, { source = 'grana.config.json', dark = { enabled: true, generated: {} }, zone = null } = {}) => {
  const decls = (o, indent = '  ') => Object.entries(o).map(([k, v]) => `${indent}${k}: ${v};`)
  const { color, other } = splitColorGroup(generated)
  const out = [
    `/* Generado por @grana/cli a partir de ${source}. No editar a mano: vuelve a ejecutar «grana theme». */`,
    '/* Sin @layer: el tema del usuario gana siempre sobre grana.defaults (DECISIONS.md #4). */'
  ]
  if (Object.keys(other).length) out.push(':root {', ...decls(other), '}')
  if (Object.keys(color).length) out.push(':root,', '[data-theme="light"] {', ...decls(color), '}')
  if (dark.enabled) {
    if (Object.keys(dark.generated).length) {
      const body = ['color-scheme: dark;', ...decls(dark.generated, '').map((l) => l)]
      out.push(
        '@media (prefers-color-scheme: dark) {',
        '  :root:where(:not([data-theme="light"])) {',
        ...body.map((l) => `    ${l}`),
        '  }',
        '}',
        '[data-theme="dark"] {',
        ...body.map((l) => `  ${l}`),
        '}'
      )
    }
  } else {
    // dark: false: el sistema oscuro no debe activar el oscuro de los defaults; se restablece el grupo de color claro completo
    const light = { ...splitColorGroup(DEFAULTS).color, ...color }
    out.push(
      '/* dark: false · el tema claro completo dentro de la consulta oscura */',
      '@media (prefers-color-scheme: dark) {',
      '  :root:where(:not([data-theme="dark"])) {',
      '    color-scheme: light;',
      ...decls(light, '    '),
      '  }',
      '}'
    )
  }
  // Zona de marca (tokens.md §44.6): solo lo que depende del tema (color-scheme de una zona clara, cat-k-text)
  if (zone && Object.keys(zone).length) out.push('[data-g-zone="brand"] {', ...decls(zone), '}')
  out.push('')
  return out.join('\n')
}
