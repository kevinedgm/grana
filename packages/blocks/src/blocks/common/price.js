// Precio y disponibilidad de los bloques (dueño: bruno; _comun.md §15 reglas 4 y 7, §27 regla 1; avisos K3 y K4). Interno
// del paquete: no se exporta. Lo comparten Booking y Ecommerce; common/booking.js lo reexporta con los mismos nombres.
import { has } from './text.js'

/** K4: `{ ok, reason }` de `available` (false → labels.unavailable; String → ese motivo). Otro tipo cuenta como disponible. */
export function availability(item, labels, what, warn) {
  const a = item ? item.available : undefined
  if (a === undefined || a === true) return { ok: true, reason: '' }
  if (a === false) {
    const t = labels && labels.unavailable
    if (!has(t)) {
      try { if (process.env.NODE_ENV !== 'production') warn('C5:unavailable', `${what} no disponible y falta labels.unavailable: se pinta sin el motivo (C5).`) } catch {}
    }
    return { ok: false, reason: has(t) ? t : '' }
  }
  if (typeof a === 'string') return { ok: !has(a) ? true : false, reason: a.trim() }
  try { if (process.env.NODE_ENV !== 'production') warn(`K4:${what}`, `${what}.available no es Boolean ni String: cuenta como disponible (K4).`) } catch {}
  return { ok: true, reason: '' }
}

const PRICE_KEYS = ['value', 'max', 'compareAt', 'compareLabel', 'lead', 'unit', 'unitLabel', 'total']
/** K3: las props de GPrice de un `PriceSpec` tal cual (sin renombrar), o null si no hay precio. */
export function priceSpec(spec, what, warn) {
  if (spec === undefined || spec === null) return null
  if (typeof spec !== 'object' || !('value' in spec)) {
    try { if (process.env.NODE_ENV !== 'production') warn(`K3:${what}`, `${what} sin value (ni null explícito): se pinta sin precio (K3).`) } catch {}
    return null
  }
  const out = {}
  for (const k of PRICE_KEYS) if (spec[k] !== undefined) out[k] = spec[k]
  return out
}

/** K3: una lista con precios y sin `prices` se pinta sin región (GPrice con su código). */
export function checkRegion(prices, anyPrice, warn) {
  const ok = prices && typeof prices === 'object' && has(prices.currency)
  try { if (process.env.NODE_ENV !== 'production' && anyPrice && !ok) warn('K3:prices', 'hay precios y falta prices (la región): se pintan sin región, cada uno con su código (K3).') } catch {}
  return ok ? prices : null
}

/** Las props de GPriceScope de una `PriceRegion` + `labels.price`. */
export const regionAttrs = (prices, labels, locale) => ({
  currency: prices.currency,
  view: prices.view,
  legend: prices.legend,
  taxes: prices.taxes,
  locale: prices.locale || locale || undefined,
  labels: labels && labels.price && typeof labels.price === 'object' ? labels.price : undefined
})
