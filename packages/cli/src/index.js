// API programática de @grana/cli (para el plugin de Vite y para pruebas).
import { readConfig } from './config.js'
import { generateTheme, toCss } from './theme.js'
import { validateTheme } from './validate.js'
import { buildDoc } from './doc.js'

export { readConfig, KEYS } from './config.js'
export { generateTheme, toCss } from './theme.js'
export { validateTheme, COLOR_NAMES } from './validate.js'
export { deriveColor, deriveDarkColor } from './derive.js'
export { buildDoc } from './doc.js'
export { usageOf } from './usage.js'
export { semanticAdjustments, tintedNeutrals, categoryBases, separate, distance, MIN_DISTANCE } from './palette.js'
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
    return { ok: false, css: null, generated: {}, tokens: {}, notes: [], issues: errors.map((e) => ({ severity: 'error', kind: 'config', why: 'La configuración no es válida: corrígela y vuelve a ejecutar.', ...e })) }
  }
  const { generated, tokens, dark, derived } = generateTheme(config)
  const issues = validateTheme(tokens, { generated: config.overrides ?? {} })
  // Los dos esquemas cumplen los mismos mínimos (tokens.md §15)
  if (dark.enabled) {
    const darkOverrides = typeof config.dark === 'object' ? (config.dark.overrides ?? {}) : {}
    issues.push(...validateTheme(dark.tokens, { generated: darkOverrides, scheme: 'dark' }))
  } else if (Object.keys(generated).some((k) => k.startsWith('--g-color-'))) {
    issues.push({ id: 'dark-disabled', severity: 'warning', message: '`dark: false`: el oscuro queda desactivado (también con el sistema oscuro).', why: 'Con `data-theme="dark"` forzado se aplicaría el oscuro de los defaults mezclado con los colores de tu tema claro, sin garantía de contraste. No uses `data-theme="dark"` o activa `dark`.' })
  }
  const ok = !issues.some((i) => i.severity === 'error')
  // Lo que la derivación decidió (no son problemas): qué semánticos se separaron de la marca, si se tiñeron los neutros y cuántas categorías
  const notes = []
  for (const [name, r] of Object.entries(derived.semantic)) {
    if (r.changed) notes.push({ id: 'semantic-adjusted', message: `«${name}» se separó de la marca y el acento: ${r.dh ? `tono ${r.dh > 0 ? '+' : ''}${r.dh}°` : ''}${r.dh && r.dl ? ', ' : ''}${r.dl ? `luminosidad ${r.dl > 0 ? '+' : ''}${r.dl}` : ''} → ${r.hex} (distancia ${Math.round(r.distance * 1000) / 1000}; mínimo 0.12).` })
  }
  if (derived.neutralsBrand) notes.push({ id: 'neutrals-tinted', message: 'Neutros (texto, bordes, superficie hundida y «neutral») teñidos con el tono de la marca. Desactívalo con "neutrals": "pure".' })
  if (derived.categories.length) notes.push({ id: 'categories', message: `${derived.categories.length} categorías (--g-color-cat-1 a cat-${derived.categories.length}): mismo L y C, tonos cada ${Math.round(360 / derived.categories.length)}°.` })
  const doc = ok ? buildDoc({ name: config.name, light: tokens, dark: dark.enabled ? dark.tokens : null, source }) : null
  return { ok, css: ok ? toCss(generated, { source, dark }) : null, doc, generated, tokens, dark, derived, notes, issues }
}
