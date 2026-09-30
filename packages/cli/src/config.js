// Lectura y validación de la configuración (docs/contract/tokens.md §1): 9 claves opcionales + `overrides`.
import { parseHex } from './color.js'

export const KEYS = ['brand', 'accent', 'radius', 'shape', 'space', 'font', 'fontDisplay', 'fontSize', 'typeScale', 'overrides']

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
  color('brand')
  color('accent')
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
  if (raw.overrides !== undefined) {
    if (raw.overrides === null || typeof raw.overrides !== 'object' || Array.isArray(raw.overrides)) err('bad-overrides', '«overrides» debe ser un objeto { "--g-token": "valor" }.')
    else {
      const o = {}
      for (const [k, v] of Object.entries(raw.overrides)) {
        if (!/^--g-[a-z0-9-]+$/.test(k)) err('bad-override', `«overrides» solo admite tokens «--g-*»; «${k}» no lo es.`)
        else if (typeof v !== 'string' || !v.trim()) err('bad-override', `El valor de «${k}» en «overrides» debe ser un texto no vacío.`)
        else o[k] = v.trim()
      }
      config.overrides = o
    }
  }
  return { config, errors }
}
