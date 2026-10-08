// Generación del tema: entradas → tokens (color en OKLCH, escalas), con los valores por defecto para lo demás.
import { deriveColor, deriveDarkColor } from './derive.js'
import { DEFAULTS, DARK } from './defaults.js'
import { isColorGroup, splitColorGroup } from './scheme.js'
import { fontStack, radii, spacing, typography } from './scales.js'
import { categoryBases, semanticAdjustments, tintedNeutralBase, tintedNeutrals } from './palette.js'

// Superficie contra la que se calcula `text` (el tema claro por defecto; con `overrides` de surface se respeta)
const surfaceOf = (overrides = {}) => overrides['--g-color-surface'] ?? DEFAULTS['--g-color-surface']

const colorTokens = (name, base, surface) => {
  const d = deriveColor(base, { surface })
  return {
    [`--g-color-${name}`]: d.base,
    [`--g-color-${name}-strong`]: d.strong,
    [`--g-color-${name}-soft`]: d.soft,
    [`--g-color-${name}-text`]: d.text,
    [`--g-color-on-${name}`]: d.on,
    [`--g-color-on-${name}-soft`]: d.onSoft
  }
}

// Base clara de `neutral` teñida (de ella se deriva también la variante oscura, como con los demás colores)
const lightNeutral = (brand, hueHex) => tintedNeutralBase(brand, { hueHex })

const darkColorTokens = (name, base, surface) => {
  const d = deriveDarkColor(base, { surface })
  return {
    [`--g-color-${name}`]: d.base,
    [`--g-color-${name}-strong`]: d.strong,
    [`--g-color-${name}-soft`]: d.soft,
    [`--g-color-${name}-text`]: d.text,
    [`--g-color-on-${name}`]: d.on,
    [`--g-color-on-${name}-soft`]: d.onSoft
  }
}

// Variante oscura de lo que el usuario cambia (tokens.md §15). Todo token del grupo de color que el usuario
// toca en el claro necesita su valor oscuro: el `tokens.css` no lleva capa y, sin él, ganaría también en el oscuro.
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
  const surface = overrides['--g-color-surface'] ?? (tinted && tinted['--g-color-surface']) ?? DARK['--g-color-surface']
  const out = {}
  const brand = cfg.brand ?? config.brand
  if (brand) Object.assign(out, darkColorTokens('brand', brand, surface))
  const accent = cfg.accent ?? config.accent ?? (brand ? out['--g-color-brand-text'] : undefined)
  if (accent) Object.assign(out, darkColorTokens('accent', accent, surface))
  const primary = cfg.primary ?? config.primary
  if (primary) Object.assign(out, darkColorTokens('primary', primary, surface))
  for (const k of Object.keys(generated)) {
    if (isColorGroup(k) && !(k in out) && k in DARK) out[k] = DARK[k]
  }
  // Derivación de paleta (tokens.md §16): los mismos semánticos ajustados, neutros teñidos y categorías, en su variante oscura
  if (d) {
    for (const [name, r] of Object.entries(d.applied)) Object.assign(out, darkColorTokens(name, r.hex, surface))
    if (d.neutralsBrand) {
      Object.assign(out, tinted)
      const nb = lightNeutral(cfg.brand ?? d.neutralsBrand, d.neutralsHueHex)
      if (nb) Object.assign(out, darkColorTokens('neutral', nb, surface))
    }
    d.categories.forEach((hex, k) => Object.assign(out, darkColorTokens(`cat-${k + 1}`, hex, surface)))
  }
  Object.assign(out, overrides)
  const { other } = splitColorGroup(generated)
  return { enabled: true, generated: out, tokens: { ...DEFAULTS, ...other, ...DARK, ...out } }
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
  if (config.brand) Object.assign(generated, colorTokens('brand', config.brand, surface))
  // accent sin valor: se deriva del `text` de brand (contrato §1)
  const accentBase = config.accent ?? (config.brand ? generated['--g-color-brand-text'] : undefined)
  if (accentBase) Object.assign(generated, colorTokens('accent', accentBase, surface))
  // `primary` propio (tokens.md §17.4): sin él, `primary` es un alias de `brand` (defaults.css); con él, sus seis tokens se derivan del color dado
  if (config.primary) Object.assign(generated, colorTokens('primary', config.primary, surface))
  // Derivación de paleta (tokens.md §16)
  const derived = { primary: config.primary ?? null, semantic: {}, applied: {}, policy: config.semanticCollision ?? 'warn', neutralsBrand: null, categories: [] }
  const anchorBrand = config.brand ?? undefined
  const anchorAccent = accentBase
  if (anchorBrand || anchorAccent || config.primary) {
    const darkCfg = typeof config.dark === 'object' ? config.dark : {}
    derived.semantic = semanticAdjustments({ brand: anchorBrand, accent: anchorAccent, primary: config.primary, darkBrand: darkCfg.brand, darkAccent: darkCfg.accent, darkPrimary: darkCfg.primary })
    // semanticCollision (tokens.md §17.12): con «warn» (por defecto) solo se propone; con «adjust» se aplica
    if (derived.policy === 'adjust') derived.applied = derived.semantic
    for (const [name, r] of Object.entries(derived.applied)) Object.assign(generated, colorTokens(name, r.hex, surface))
  }
  if (config.brand && config.neutrals !== 'pure') {
    derived.neutralsBrand = config.brand
    // neutralsHue (§16.2): solo decide de qué color se toma el tono; el croma y el resto de reglas no cambian
    derived.neutralsHue = config.neutralsHue ?? 'brand'
    derived.neutralsHueHex = derived.neutralsHue === 'accent' ? accentBase : config.brand
    Object.assign(generated, tintedNeutrals(config.brand, { hueHex: derived.neutralsHueHex }))
    const nb = tintedNeutralBase(config.brand, { hueHex: derived.neutralsHueHex })
    if (nb) Object.assign(generated, colorTokens('neutral', nb, surface))
  }
  if (config.categories > 0) {
    derived.categories = categoryBases(config.categories, config.brand)
    derived.categories.forEach((hex, k) => Object.assign(generated, colorTokens(`cat-${k + 1}`, hex, surface)))
  }
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
  }
  Object.assign(generated, overrides)
  return { generated, tokens: { ...DEFAULTS, ...generated }, dark: generateDark(config, generated, derived), derived }
}

/** tokens.css: sin capa (el tema del usuario gana siempre, contrato §8). Con tema oscuro, tres bloques (contrato §15). */
export const toCss = (generated, { source = 'grana.config.json', dark = { enabled: true, generated: {} } } = {}) => {
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
        '  :root:not([data-theme="light"]) {',
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
      '  :root:not([data-theme="dark"]) {',
      '    color-scheme: light;',
      ...decls(light, '    '),
      '  }',
      '}'
    )
  }
  out.push('')
  return out.join('\n')
}
