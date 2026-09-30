// Generación del tema: entradas → tokens (color en OKLCH, escalas), con los valores por defecto para lo demás.
import { deriveColor } from './derive.js'
import { DEFAULTS } from './defaults.js'
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

/**
 * @param {object} config configuración ya validada (readConfig)
 * @returns {{ generated: Record<string,string>, tokens: Record<string,string> }}
 *   generated: solo lo que las entradas cambian (lo que va a tokens.css); tokens: tema completo (defaults + generated)
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
  return { generated, tokens: { ...DEFAULTS, ...generated } }
}

/** tokens.css: bloque sin capa (el tema del usuario gana siempre, contrato §8) */
export const toCss = (generated, { source = 'grana.config.json' } = {}) => {
  const lines = Object.entries(generated).map(([k, v]) => `  ${k}: ${v};`)
  return [
    `/* Generado por @grana/cli a partir de ${source}. No editar a mano: vuelve a ejecutar «grana theme». */`,
    '/* Sin @layer: el tema del usuario gana siempre sobre grana.defaults (DECISIONS.md #4). */',
    ':root {',
    ...lines,
    '}',
    ''
  ].join('\n')
}
