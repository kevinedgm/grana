// Lectura y validación de la configuración (docs/contract/tokens.md §1): 9 claves opcionales + `overrides` + `dark`.
import { parseHex } from './color.js'

export const KEYS = ['name', 'brand', 'accent', 'primary', 'neutrals', 'neutralsHue', 'semanticCollision', 'categories', 'radius', 'shape', 'space', 'font', 'fontDisplay', 'fontSize', 'typeScale', 'overrides', 'dark']

/** Devuelve { config, errors }. Rechaza claves desconocidas y tipos incorrectos, con el motivo. */
export const readConfig = (raw) => {
  const errors = []
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { config: {}, errors: [{ id: 'config', message: 'La configuración debe ser un objeto JSON.' }] }
  }
  const config = {}
  const err = (id, message) => errors.push({ id, message })
  for (const key of Object.keys(raw)) {
    if (!KEYS.includes(key)) err('unknown-key', `Clave desconocida «${key}». Claves válidas: ${KEYS.join(', ')}.`)
  }
  const color = (key) => {
    if (raw[key] === undefined) return
    if (typeof raw[key] !== 'string' || !parseHex(raw[key])) err('bad-color', `«${key}» debe ser un color hex (#RGB o #RRGGBB); se recibió ${JSON.stringify(raw[key])}.`)
    else config[key] = raw[key].startsWith('#') ? raw[key].toUpperCase() : `#${raw[key].toUpperCase()}`
  }
  const num = (key, { min, max, int = false }) => {
    if (raw[key] === undefined) return
    const v = raw[key]
    if (typeof v !== 'number' || !Number.isFinite(v)) err('bad-number', `«${key}» debe ser un número; se recibió ${JSON.stringify(v)}.`)
    else if (v < min || v > max) err('out-of-range', `«${key}» debe estar entre ${min} y ${max}; se recibió ${v}.`)
    else if (int && !Number.isInteger(v)) err('bad-number', `«${key}» debe ser un entero; se recibió ${v}.`)
    else config[key] = v
  }
  const str = (key) => {
    if (raw[key] === undefined) return
    if (typeof raw[key] !== 'string' || !raw[key].trim()) err('bad-string', `«${key}» debe ser un texto no vacío.`)
    else config[key] = raw[key].trim()
  }
  str('name')
  if (raw.neutrals !== undefined) {
    if (raw.neutrals !== 'tinted' && raw.neutrals !== 'pure') err('bad-neutrals', `«neutrals» debe ser "tinted" o "pure"; se recibió ${JSON.stringify(raw.neutrals)}.`)
    else config.neutrals = raw.neutrals
  }
  if (raw.neutralsHue !== undefined) {
    if (raw.neutralsHue !== 'brand' && raw.neutralsHue !== 'accent') err('bad-neutrals-hue', `«neutralsHue» debe ser "brand" o "accent"; se recibió ${JSON.stringify(raw.neutralsHue)}.`)
    else config.neutralsHue = raw.neutralsHue
  }
  if (raw.semanticCollision !== undefined) {
    if (raw.semanticCollision !== 'warn' && raw.semanticCollision !== 'adjust') err('bad-collision', `«semanticCollision» debe ser "warn" o "adjust"; se recibió ${JSON.stringify(raw.semanticCollision)}.`)
    else config.semanticCollision = raw.semanticCollision
  }
  num('categories', { min: 0, max: 12, int: true })
  color('brand')
  color('accent')
  color('primary')
  num('radius', { min: 0, max: 64 })
  num('space', { min: 1, max: 16 })
  num('fontSize', { min: 8, max: 32 })
  num('typeScale', { min: 1, max: 2 })
  str('font')
  str('fontDisplay')
  if (raw.shape !== undefined) {
    if (raw.shape !== 'rounded' && raw.shape !== 'pill') err('bad-shape', `«shape» debe ser "rounded" o "pill"; se recibió ${JSON.stringify(raw.shape)}.`)
    else config.shape = raw.shape
  }
  // { "--g-token": "valor" } de tokens «--g-*»
  const readOverrides = (value, label) => {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) { err('bad-overrides', `«${label}» debe ser un objeto { "--g-token": "valor" }.`); return undefined }
    const o = {}
    for (const [k, v] of Object.entries(value)) {
      if (!/^--g-[a-z0-9-]+$/.test(k)) err('bad-override', `«${label}» solo admite tokens «--g-*»; «${k}» no lo es.`)
      else if (typeof v !== 'string' || !v.trim()) err('bad-override', `El valor de «${k}» en «${label}» debe ser un texto no vacío.`)
      else o[k] = v.trim()
    }
    return o
  }
  if (raw.overrides !== undefined) {
    const o = readOverrides(raw.overrides, 'overrides')
    if (o) config.overrides = o
  }
  // dark: true (por defecto) | false | { brand?, accent?, overrides? } (docs/contract/tokens.md §15)
  if (raw.dark !== undefined) {
    const d = raw.dark
    if (typeof d === 'boolean') config.dark = d
    else if (d !== null && typeof d === 'object' && !Array.isArray(d)) {
      const o = {}
      for (const key of Object.keys(d)) {
        if (!['brand', 'accent', 'primary', 'overrides'].includes(key)) err('unknown-key', `Clave desconocida «dark.${key}». Claves válidas: brand, accent, primary, overrides.`)
      }
      for (const key of ['brand', 'accent', 'primary']) {
        if (d[key] === undefined) continue
        if (typeof d[key] !== 'string' || !parseHex(d[key])) err('bad-color', `«dark.${key}» debe ser un color hex (#RGB o #RRGGBB); se recibió ${JSON.stringify(d[key])}.`)
        else o[key] = d[key].startsWith('#') ? d[key].toUpperCase() : `#${d[key].toUpperCase()}`
      }
      if (d.overrides !== undefined) {
        const ov = readOverrides(d.overrides, 'dark.overrides')
        if (ov) o.overrides = ov
      }
      config.dark = o
    } else err('bad-dark', '«dark» debe ser true, false o un objeto { brand, accent, primary, overrides }.')
  }
  return { config, errors }
}
