// Motor numérico (interno; dueño: bruno). Contrato: design/contracts/number-field.md (L2), DECISIONS.md #309.
// Sin estado ni DOM: idioma (separadores, cifras, sin marcas bidi), texto tecleado a ASCII, validez del texto parcial,
// número parcial, pegado, formato de salida y crudo, redondeo a `precision`, paso en la rejilla de `step` contada desde
// `min` con límites y punto de partida, y valor canónico. Lo usa GNumberField y lo reutilizará GInputGroupNumber (#314).
// No se exporta desde src/index.js.

// Marcas de dirección que Intl antepone (U+200E, U+200F, U+061C) y las de incrustación/aislamiento: sobran con dir="ltr"
const BIDI = /[‎‏؜‪-‮⁦-⁩]/g
// Signos menos tipográficos (U+2212 de Intl en algunos idiomas, guiones, menos de ancho completo) → «-»
const MINUS = /[−‒–﹣－]/g
// Separadores que se aceptan al teclear como decimal (el teclado del móvil sigue la región del sistema, no la página)
const TYPED_SEPARATORS = /[.,٫]/g
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const cache = new Map()

/**
 * Datos del idioma: separador decimal y de miles, cifras del sistema del idioma (0–9) y su mapa a ASCII.
 * Lanza RangeError si Intl rechaza la etiqueta (quien llama decide el respaldo).
 */
export function localeInfo(locale) {
  const key = locale || ''
  if (cache.has(key)) return cache.get(key)
  const nf = new Intl.NumberFormat(locale || undefined)
  const resolved = nf.resolvedOptions().locale
  const parts = nf.formatToParts(-12345.6)
  const decimal = (parts.find((p) => p.type === 'decimal')?.value || '.').replace(BIDI, '')
  const group = (parts.find((p) => p.type === 'group')?.value || '').replace(BIDI, '')
  const plain = new Intl.NumberFormat(locale || undefined, { useGrouping: false })
  const digits = []
  const dmap = new Map()
  for (let i = 0; i < 10; i++) {
    const d = plain.format(i).replace(BIDI, '')
    digits.push(d)
    dmap.set(d, String(i))
  }
  const info = { locale: resolved, decimal, group, digits, dmap }
  cache.set(key, info)
  return info
}

/** ¿Acepta Intl esta etiqueta? (sin lanzar) */
export function isValidLocale(locale) {
  try {
    localeInfo(locale)
    return true
  } catch {
    return false
  }
}

/** Cifras del idioma y latinas → ASCII; signos menos → «-»; sin marcas bidi. */
export function toAscii(text, info) {
  let out = ''
  for (const ch of String(text ?? '').replace(BIDI, '').replace(MINUS, '-')) out += info?.dmap.get(ch) ?? ch
  return out
}

/** Texto tecleado a ASCII con un único separador decimal «.» (acepta «,», «.», «٫» y el del idioma). */
export function typedAscii(text, info) {
  const a = toAscii(text, info)
  const dec = info?.decimal
  const re = dec && !/^[.,٫]$/.test(dec) ? new RegExp(`[.,\\u066b${escapeRe(dec)}]`, 'g') : TYPED_SEPARATORS
  return a.replace(re, '.')
}

const PARTIAL = /^-?\d*(\.\d*)?$/

/** ¿Es un texto parcial válido mientras se escribe? (`decimals`: admite separador; `negative`: admite «-» al principio) */
export function isPartialValid(ascii, { decimals = true, negative = true } = {}) {
  if (!PARTIAL.test(ascii)) return false
  if (!decimals && ascii.includes('.')) return false
  if (!negative && ascii.includes('-')) return false
  return true
}

/** Número de un texto parcial ASCII: «», «-», «.», «-.» → null; «1.» → 1. */
export function partialNumber(ascii) {
  if (ascii === '' || ascii === '-' || ascii === '.' || ascii === '-.') return null
  const n = Number(ascii)
  return Number.isFinite(n) ? n : null
}

/**
 * Filtro de escritura (en `input`, fuera de la composición): devuelve `{ ok: false }` si el texto no entra, o
 * `{ ok: true, text, value }` con el separador convertido al del idioma y el número parcial (sin redondear).
 */
export function filterTyped(text, info, opts = {}) {
  const ascii = typedAscii(text, info)
  if (!isPartialValid(ascii, opts)) return { ok: false }
  let out = String(text)
  if (opts.decimals !== false && info?.decimal) out = out.replace(BIDI, '').replace(new RegExp(`[.,\\u066b${escapeRe(info.decimal)}]`, 'g'), info.decimal)
  return { ok: true, text: out, value: partialNumber(ascii) }
}

/**
 * Pegado: dos tipos de separador → el último es el decimal («1,234.5» → 1234.5); uno repetido → miles; uno solo seguido
 * de exactamente tres cifras y que es el de miles del idioma → miles («12.345» en es → 12345); si no, decimal.
 * Devuelve el número o null si no es un número.
 */
export function parsePasted(text, info) {
  let a = toAscii(String(text ?? '').trim(), info)
    .replace(/[\s  '’]/g, '')
    .replace(/٬/g, ',')
    .replace(/٫/g, '.')
  const dots = (a.match(/\./g) || []).length
  const commas = (a.match(/,/g) || []).length
  if (dots && commas) {
    const dec = a.lastIndexOf('.') > a.lastIndexOf(',') ? '.' : ','
    a = a.split(dec === '.' ? ',' : '.').join('').replace(dec, '.')
  } else if (dots > 1 || commas > 1) {
    a = a.replace(/[.,]/g, '')
  } else if (dots + commas === 1) {
    const sep = dots ? '.' : ','
    const after = a.split(sep)[1]
    const groupSep = info?.group === '.' || info?.group === ',' ? info.group : null
    a = /^\d{3}$/.test(after) && groupSep === sep ? a.replace(sep, '') : a.replace(sep, '.')
  }
  return /^-?(\d+(\.\d*)?|\.\d+)$/.test(a) ? Number(a) : null
}

/** Número de decimales de un número (también en notación exponencial). */
export function decimalsOf(n) {
  if (n == null || !Number.isFinite(n)) return 0
  const s = String(n)
  const e = s.match(/e([+-]\d+)$/)
  if (e) {
    const [m] = s.split('e')
    const md = m.includes('.') ? m.length - m.indexOf('.') - 1 : 0
    return Math.max(0, md - Number(e[1]))
  }
  const i = s.indexOf('.')
  return i < 0 ? 0 : s.length - i - 1
}

/** Redondeo decimal sin error de coma flotante (null y precision ausente pasan tal cual). */
export function roundTo(value, precision) {
  if (value == null || precision == null || !Number.isFinite(value)) return value
  const r = Number(`${Math.round(Number(`${value}e${precision}`))}e-${precision}`)
  return Object.is(r, -0) ? 0 : r
}

/** Formato de salida: Intl del idioma, con miles (`grouping`) y `precision` decimales; sin marcas bidi. */
export function formatNumber(value, info, { grouping = true, precision } = {}) {
  if (value == null || !Number.isFinite(value)) return ''
  return new Intl.NumberFormat(info?.locale || undefined, {
    useGrouping: grouping ? undefined : false, // undefined = la regla del idioma («1234» y «12.345» en es)
    minimumFractionDigits: precision ?? 0,
    maximumFractionDigits: precision ?? 20
  }).format(value).replace(BIDI, '')
}

/** Texto crudo para editar: sin miles, con el separador y las cifras del idioma. */
export function formatRaw(value, info, { precision } = {}) {
  return formatNumber(value, info, { grouping: false, precision })
}

/** Valor canónico que se envía: «72.5», «12345», «» (punto decimal, sin miles, sin exponente). */
export function canonical(value) {
  if (value == null || !Number.isFinite(value)) return ''
  const s = String(value)
  if (!/e/i.test(s)) return s
  return new Intl.NumberFormat('en-US', { useGrouping: false, maximumFractionDigits: 20 }).format(value)
}

const clamp = (v, min, max) => {
  if (max != null && v > max) v = max
  if (min != null && v < min) v = min
  return v
}

/**
 * Paso: ± `mult` × `step` encajando en la rejilla de `step` contada desde `min` (o 0), con aritmética de enteros
 * escalados (72.5 + 3 × 0.1 = 72.8 exacto), redondeo a `precision` y límites. Vacío: el punto de partida (0, o el
 * límite más cercano si 0 queda fuera). Desde fuera de rango, un paso hacia dentro entra al límite.
 */
export function stepValue(value, { dir = 1, mult = 1, step = 1, min, max, precision } = {}) {
  if (value == null) return clamp(0, min, max)
  const base = min ?? 0
  const st = Number.isFinite(step) && step > 0 ? step : 1
  const sc = 10 ** Math.min(15, Math.max(decimalsOf(st), decimalsOf(base), precision ?? 0, decimalsOf(value)))
  const vi = Math.round(value * sc)
  const bi = Math.round(base * sc)
  const si = Math.round(st * sc)
  const k = (vi - bi) / si
  const n = dir > 0 ? Math.floor(k) + mult : Math.ceil(k) - mult
  let next = (bi + n * si) / sc
  next = roundTo(next, precision ?? null)
  return clamp(next, min, max)
}

/** Texto de un número cuyo texto ya está escrito (para no reescribir «1,» cuando el modelo sigue siendo 1). */
export function textMatches(text, value, info, precision) {
  const n = partialNumber(typedAscii(text, info))
  return roundTo(n, precision ?? null) === value
}
