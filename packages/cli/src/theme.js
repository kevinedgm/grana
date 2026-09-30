// Generación del tema: entradas → tokens (color en OKLCH, escalas), con los valores por defecto para lo demás.
import { deriveColor, deriveDarkColor } from './derive.js'
import { DEFAULTS, DARK } from './defaults.js'
import { isColorGroup, splitColorGroup } from './scheme.js'
import { fontStack, radii, spacing, typography } from './scales.js'

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
const generateDark = (config, generated) => {
  const opt = config.dark === undefined ? true : config.dark
  if (opt === false) return { enabled: false, generated: {}, tokens: null }
  const cfg = typeof opt === 'object' ? opt : {}
  const overrides = cfg.overrides ?? {}
  const surface = overrides['--g-color-surface'] ?? DARK['--g-color-surface']
  const out = {}
  const brand = cfg.brand ?? config.brand
  if (brand) Object.assign(out, darkColorTokens('brand', brand, surface))
  const accent = cfg.accent ?? config.accent ?? (brand ? out['--g-color-brand-text'] : undefined)
  if (accent) Object.assign(out, darkColorTokens('accent', accent, surface))
  for (const k of Object.keys(generated)) {
    if (isColorGroup(k) && !(k in out) && k in DARK) out[k] = DARK[k]
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
  return { generated, tokens: { ...DEFAULTS, ...generated }, dark: generateDark(config, generated) }
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
