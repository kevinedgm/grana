// API programática de @grana/cli (para el plugin de Vite y para pruebas).
import { readConfig } from './config.js'
import { generateTheme, toCss } from './theme.js'
import { validateTheme } from './validate.js'
import { buildDoc, activeContrast } from './doc.js'
import { DEFAULTS } from './defaults.js'
import { MIN_DISTANCE, anchorLabel } from './palette.js'

export { readConfig, KEYS } from './config.js'
export { generateTheme, toCss } from './theme.js'
export { validateTheme, COLOR_NAMES } from './validate.js'
export { deriveColor, deriveDarkColor } from './derive.js'
export { buildDoc, activeContrast } from './doc.js'
export { usageOf } from './usage.js'
export { anchorLabel, semanticAdjustments, tintedNeutrals, categoryBases, separate, distance, MIN_DISTANCE } from './palette.js'
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
    return { ok: false, css: null, generated: {}, tokens: {}, notes: [], diagnostics: [], issues: errors.map((e) => ({ severity: 'error', kind: 'config', why: 'La configuración no es válida: corrígela y vuelve a ejecutar.', ...e })) }
  }
  const { generated, tokens, dark, derived } = generateTheme(config)
  // Sin `accent` del usuario, el acento se deriva de la marca: los avisos lo dicen (tokens.md §17.12)
  const accentDerived = config.accent === undefined && config.brand !== undefined
  const issues = validateTheme(tokens, { generated: config.overrides ?? {}, accentDerived })
  // Los dos esquemas cumplen los mismos mínimos (tokens.md §15)
  if (dark.enabled) {
    const darkOverrides = typeof config.dark === 'object' ? (config.dark.overrides ?? {}) : {}
    issues.push(...validateTheme(dark.tokens, { generated: darkOverrides, scheme: 'dark', accentDerived }))
  } else if (Object.keys(generated).some((k) => k.startsWith('--g-color-'))) {
    issues.push({ id: 'dark-disabled', severity: 'warning', message: '`dark: false`: el oscuro queda desactivado (también con el sistema oscuro).', why: 'Con `data-theme="dark"` forzado se aplicaría el oscuro de los defaults mezclado con los colores de tu tema claro, sin garantía de contraste. No uses `data-theme="dark"` o activa `dark`.' })
  }
  const ok = !issues.some((i) => i.severity === 'error')
  // Transparencia (tokens.md §17.13): toda decisión cromática automática queda registrada, con su origen, entrada, valor y estado
  const r3 = (n) => Math.round(n * 1000) / 1000
  const diagnostics = []
  for (const [name, r] of Object.entries(derived.semantic)) {
    const cssVar = `--g-color-${name}`
    const applied = derived.policy === 'adjust'
    const who = r.collidedWith
    const labelA = anchorLabel(who, accentDerived, 'a')
    const labelDe = anchorLabel(who, accentDerived, 'de')
    const change = [r.dh ? `tono ${r.dh > 0 ? '+' : ''}${r.dh}°` : '', r.dl ? `luminosidad ${r.dl > 0 ? '+' : ''}${r.dl}` : ''].filter(Boolean).join(', ')
    diagnostics.push({
      code: applied ? 'semantic-adjusted' : 'semantic-close', token: name, cssVar, source: 'semantic', input: DEFAULTS[cssVar],
      value: applied ? r.hex : DEFAULTS[cssVar], status: applied ? 'adjusted' : 'default', reason: 'semantic-close',
      distance: r3(r.before), collidedWith: who, accentDerived: who === 'accent' && accentDerived, recommended: r.hex, recommendedDistance: r3(r.distance), ok: r.ok,
      message: applied
        ? `«${name}» se separó ${labelDe} (estaba a ${r3(r.before)}; mínimo ${MIN_DISTANCE}): ${change} → ${r.hex} (distancia ${r3(r.distance)}).`
        : `«${name}» se parece ${labelA} (distancia ${r3(r.before)}; mínimo ${MIN_DISTANCE}). Alternativa calculada: ${r.hex}${r.ok ? '' : ` (distancia ${r3(r.distance)}: no hay separación suficiente dentro de ±45° y ±0.15)`}. Aplícala con "semanticCollision": "adjust" o con overrides.`
    })
  }
  for (const [token, value] of Object.entries(config.overrides ?? {})) diagnostics.push({ code: 'override', token: token.replace('--g-color-', ''), cssVar: token, source: 'overrides', value, status: 'override', message: `${token} fijado por overrides: ${value}.` })
  if (derived.neutralsBrand) diagnostics.push({ code: 'neutrals-tinted', source: derived.neutralsHue ?? 'brand', status: 'derived', message: `Neutros (texto, bordes, superficie hundida y «neutral») teñidos con el tono ${derived.neutralsHue === 'accent' ? 'del acento' : 'de la marca'}. Desactívalo con "neutrals": "pure".` })
  // `active` como trazo sobre la superficie: diagnóstico informativo, no bloquea (#228)
  const act = activeContrast(tokens, dark.enabled ? dark.tokens : null)
  if (act) diagnostics.push(act)
  if (derived.categories.length) diagnostics.push({ code: 'categories', source: 'brand', status: 'derived', message: `${derived.categories.length} categorías (--g-color-cat-1 a cat-${derived.categories.length}): mismo L y C, tonos cada ${Math.round(360 / derived.categories.length)}°. Son colores categóricos de interfaz, no una paleta de gráficas.` })
  // Las colisiones sin aplicar llegan al usuario como aviso (con la alternativa); el resto, como nota
  for (const d of diagnostics) {
    if (d.code !== 'semantic-close') continue
    for (const i of issues) if (i.id === 'semantic-close' && i.tokens?.[0] === d.cssVar) { i.recommended = d.recommended; i.message += ` Alternativa calculada: ${d.recommended}; aplícala con "semanticCollision": "adjust" o con overrides.` }
  }
  const notes = diagnostics.filter((d) => d.code !== 'semantic-close' && d.code !== 'override')
  const collisions = diagnostics.filter((d) => d.code === 'semantic-close').map(({ cssVar, recommended, distance, message }) => ({ code: 'semantic-close', cssVar, token: cssVar.replace('--g-color-', ''), distance, recommended, message }))
  const doc = ok ? buildDoc({ name: config.name, light: tokens, dark: dark.enabled ? dark.tokens : null, source, generated, overrides: config.overrides ?? {}, derived, collisions }) : null
  return { ok, css: ok ? toCss(generated, { source, dark }) : null, doc, generated, tokens, dark, derived, notes, diagnostics, issues }
}
