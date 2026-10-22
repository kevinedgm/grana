// Datos de una moneda (interno; dueño: bruno). design/contracts/price.md «formatPrice» y «Tabla de símbolos compartidos»
// (#769, #770), number-field.md «Moneda» (#777). Puro: sin DOM, sin estado salvo la caché de Intl.NumberFormat por idioma y
// opciones; nunca lanza. Vive en el paquete principal porque lo usa GNumberField currency; llega a @grana/vue/price por
// __shared (#776). Exporta currencyDigits (público solo desde @grana/vue/price).
import { SHARED_SYMBOLS } from './currencySymbols.js'

// Marcas de dirección que Intl antepone (U+200E, U+200F, U+061C)
export const BIDI = /[‎‏؜]/g

const cache = new Map()
/** Intl.NumberFormat en caché por idioma y opciones; null si Intl lo rechaza. */
export function nf(locale, opts) {
  const key = `${locale || ''}|${JSON.stringify(opts)}`
  let f = cache.get(key)
  if (f === undefined) {
    try { f = new Intl.NumberFormat(locale || undefined, opts) } catch { f = null }
    cache.set(key, f)
  }
  return f
}

/** Código ISO 4217 en mayúsculas si Intl lo acepta; si no, null. */
export function currencyCode(c) {
  if (typeof c !== 'string' || !/^[a-z]{3}$/i.test(c)) return null
  const up = c.toUpperCase()
  return nf('en', { style: 'currency', currency: up }) ? up : null
}

/** Decimales de la moneda (MXN 2, JPY 0, KWD 3): maximumFractionDigits de Intl. Moneda que Intl rechaza: 2. */
export function currencyDigits(currency, locale) {
  const c = currencyCode(currency)
  const f = c && (nf(locale, { style: 'currency', currency: c }) || nf(undefined, { style: 'currency', currency: c }))
  return f ? f.resolvedOptions().maximumFractionDigits : 2
}

/** ¿El símbolo es de varias monedas? (la tabla generada) */
export const isShared = (symbol) => SHARED_SYMBOLS.includes(symbol)

const part = (f, type, n = 1) => (f ? f.formatToParts(n).find((p) => p.type === type)?.value?.replace(BIDI, '') || '' : '')

/** Nombre de la moneda en el idioma, en plural («pesos mexicanos») o en singular («peso mexicano»). */
export function currencyName(currency, locale, plural = true) {
  return part(nf(locale, { style: 'currency', currency, currencyDisplay: 'name' }), 'currency', plural ? 2 : 1) || currency
}

/**
 * Afijo de un campo de moneda (number-field.md «Moneda»): lado del símbolo en el idioma, texto visible (símbolo y, si es
 * ambiguo, el código: «$ MXN») y nombre en plural para la descripción. null si Intl rechaza la moneda.
 */
export function currencyAffix(currency, locale) {
  const f = nf(locale, { style: 'currency', currency })
  if (!f) return null
  const parts = f.formatToParts(1)
  const ci = parts.findIndex((p) => p.type === 'currency')
  const symbol = parts[ci].value.replace(BIDI, '')
  return {
    side: ci < parts.findIndex((p) => p.type === 'integer') ? 'prefix' : 'suffix',
    symbol,
    visible: isShared(symbol) ? `${symbol} ${currency}` : symbol,
    name: currencyName(currency, locale)
  }
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
/**
 * Pegado en un campo de moneda (defecto 2 de P-L7): quita de ESA moneda el símbolo del idioma, el estrecho, el código, el
 * nombre en singular y en plural, los espacios (también U+00A0 y U+202F) y las marcas bidi. Una moneda distinta no se quita.
 */
export function stripCurrency(text, currency, locale) {
  const words = [
    currencyName(currency, locale), currencyName(currency, locale, false), currency,
    part(nf(locale, { style: 'currency', currency }), 'currency'),
    part(nf(locale, { style: 'currency', currency, currencyDisplay: 'narrowSymbol' }), 'currency')
  ].filter(Boolean).sort((a, b) => b.length - a.length)
  let t = String(text ?? '').replace(BIDI, '')
  for (const w of words) t = t.replace(new RegExp(escapeRe(w), 'gi'), '')
  return t.replace(/[\s  ]/g, '')
}
