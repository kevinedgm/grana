// API programática de @grana/cli (para el plugin de Vite y para pruebas).
import { readConfig } from './config.js'
import { generateTheme, toCss } from './theme.js'
import { validateTheme } from './validate.js'

export { readConfig, KEYS } from './config.js'
export { generateTheme, toCss } from './theme.js'
export { validateTheme, COLOR_NAMES } from './validate.js'
export { deriveColor } from './derive.js'
export { contrast, parseHex, toHex, toOklch, fromOklch } from './color.js'
export { DEFAULTS } from './defaults.js'

/**
 * Lee, genera y valida en un paso.
 * @returns {{ ok: boolean, css: string|null, generated, tokens, issues: Array }} `ok` es falso si hay errores
 */
export const buildTheme = (raw, { source } = {}) => {
  const { config, errors } = readConfig(raw)
  if (errors.length) {
    return { ok: false, css: null, generated: {}, tokens: {}, issues: errors.map((e) => ({ severity: 'error', kind: 'config', why: 'La configuración no es válida: corrígela y vuelve a ejecutar.', ...e })) }
  }
  const { generated, tokens } = generateTheme(config)
  const issues = validateTheme(tokens, { generated: config.overrides ?? {} })
  const ok = !issues.some((i) => i.severity === 'error')
  return { ok, css: ok ? toCss(generated, { source }) : null, generated, tokens, issues }
}
