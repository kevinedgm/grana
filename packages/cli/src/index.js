// API programática de @grana/cli (para el plugin de Vite y para pruebas).
import { readConfig } from './config.js'
import { generateTheme, toCss } from './theme.js'
import { validateTheme } from './validate.js'

export { readConfig, KEYS } from './config.js'
export { generateTheme, toCss } from './theme.js'
export { validateTheme, COLOR_NAMES } from './validate.js'
export { deriveColor, deriveDarkColor } from './derive.js'
export { contrast, parseHex, toHex, toOklch, fromOklch } from './color.js'
export { DEFAULTS, DARK } from './defaults.js'
export { isColorGroup, splitColorGroup } from './scheme.js'

/**
 * Lee, genera y valida en un paso.
 * @returns {{ ok: boolean, css: string|null, generated, tokens, issues: Array }} `ok` es falso si hay errores
 */
export const buildTheme = (raw, { source } = {}) => {
  const { config, errors } = readConfig(raw)
  if (errors.length) {
    return { ok: false, css: null, generated: {}, tokens: {}, issues: errors.map((e) => ({ severity: 'error', kind: 'config', why: 'La configuración no es válida: corrígela y vuelve a ejecutar.', ...e })) }
  }
  const { generated, tokens, dark } = generateTheme(config)
  const issues = validateTheme(tokens, { generated: config.overrides ?? {} })
  // Los dos esquemas cumplen los mismos mínimos (tokens.md §15)
  if (dark.enabled) {
    const darkOverrides = typeof config.dark === 'object' ? (config.dark.overrides ?? {}) : {}
    issues.push(...validateTheme(dark.tokens, { generated: darkOverrides, scheme: 'dark' }))
  } else if (Object.keys(generated).some((k) => k.startsWith('--g-color-'))) {
    issues.push({ id: 'dark-disabled', severity: 'warning', message: '`dark: false`: el oscuro queda desactivado (también con el sistema oscuro).', why: 'Con `data-theme="dark"` forzado se aplicaría el oscuro de los defaults mezclado con los colores de tu tema claro, sin garantía de contraste. No uses `data-theme="dark"` o activa `dark`.' })
  }
  const ok = !issues.some((i) => i.severity === 'error')
  return { ok, css: ok ? toCss(generated, { source, dark }) : null, generated, tokens, dark, issues }
}
