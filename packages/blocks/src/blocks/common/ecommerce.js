// Lo común de las secciones de Ecommerce (dueño: bruno; design/contracts/blocks/_comun.md §27 a §31, #909 a #914). Interno
// del paquete: no se exporta. Sin @grana/vue/booking (Ecommerce no carga Booking, §34). Lo usan las doce secciones
// (partes A, B y C):
//   - `productKey` (EC5): la clave de un producto, una línea, un pedido o un paso con `id` obligatorio, o el índice.
//   - `ratingText` (EC2, regla 5 de §27): la calificación en palabras con su cuenta («4,8 de 5 · 312 opiniones»).
//   - `countText`: una cuenta con la agrupación del idioma.
//   - `requiredOptions`, `missingOption`, `chosenOptions` (la elección que viaja, regla 3 de §27) y `resolveVariant` (EC4).
//   - `isCardField` (EC6: ningún dato de tarjeta en un campo del bloque) y `shopRegion` (EC1: región obligatoria en listas).
// Avisos con la guarda de #653 en el sitio de cada texto.
import { checkRegion } from './price.js'
import { fill } from './locale.js'
import { has } from './text.js'

/** EC5: la clave de un elemento con `id` obligatorio (`Product`, `CartLine`, `Order`): `id:<id>` o, sin él, `i:<índice>`. */
export function productKey(item, index, what, warn) {
  if (item && item.id !== undefined && item.id !== null && item.id !== '') return `id:${String(item.id)}`
  try { if (process.env.NODE_ENV !== 'production') warn(`EC5:${what}`, `${what} sin id (obligatorio): se usa el índice (EC5).`) } catch {}
  return `i:${index}`
}

const nfCache = new Map()
const nf = (locale, o) => {
  const k = `${locale}|${JSON.stringify(o)}`
  if (!nfCache.has(k)) { let f = null; try { f = new Intl.NumberFormat(locale, o) } catch {} nfCache.set(k, f) }
  return nfCache.get(k)
}
/** Una cuenta con la agrupación del idioma («1,312»); sin idioma resuelto (SSR), tal cual. */
export const countText = (n, locale) => { const f = has(locale) && nf(locale, {}); return f ? f.format(n) : String(n) }

/**
 * EC2 y regla 5 de §27: la calificación en palabras o '' (sin pintar). `labels.rating` es plantilla con `{average}`, `{max}`
 * y `{count}` (ya con agrupación) o función de `{ average, max, count, countText }`; `count: 0` dice `labels.noReviews`
 * (nunca «0 de 5»). Sin idioma resuelto (SSR), un decimal con punto (se reformatea al montar). Sin estrellas ni icono.
 */
export function ratingText(rating, labels, locale, what, warn) {
  if (rating === undefined || rating === null) return ''
  const r = typeof rating === 'object' ? rating : {}
  const max = r.max === undefined ? 5 : r.max
  const valid = Number.isFinite(r.average) && Number.isFinite(max) && max > 0 && r.average >= 0 && r.average <= max && Number.isInteger(r.count) && r.count >= 0
  if (!valid) {
    try { if (process.env.NODE_ENV !== 'production') warn(`EC2:${what}`, `${what}.rating con average fuera de 0..max o sin count: no se pinta la calificación (EC2).`) } catch {}
    return ''
  }
  const L = labels || {}
  if (r.count === 0) {
    if (has(L.noReviews)) return L.noReviews
    try { if (process.env.NODE_ENV !== 'production') warn('C5:noReviews', 'una calificación sin opiniones (count 0) y falta labels.noReviews («Todavía sin opiniones»): no se pinta (C5).') } catch {}
    return ''
  }
  if (!has(L.rating) && typeof L.rating !== 'function') {
    try { if (process.env.NODE_ENV !== 'production') warn('C5:rating', 'hay calificación y falta labels.rating («{average} de {max} · {count} opiniones»): no se pinta (C5).') } catch {}
    return ''
  }
  const one = has(locale) && nf(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const average = one ? one.format(r.average) : r.average.toFixed(1)
  const vars = { average, max: countText(max, locale), count: r.count, countText: countText(r.count, locale) }
  return typeof L.rating === 'function' ? String(L.rating(vars)) : fill(L.rating, { ...vars, count: vars.countText })
}

/** Las opciones que hay que elegir (`required` por defecto true) de un producto con `options`. */
export const requiredOptions = (product) => (product && Array.isArray(product.options) ? product.options.filter((o) => o && has(o.key) && o.required !== false) : [])

/** La primera opción obligatoria sin valor en `selection` (la pregunta a la que va el foco), o null. */
export const missingOption = (product, selection) => requiredOptions(product).find((o) => !selection || selection[o.key] === undefined || selection[o.key] === null || selection[o.key] === '') || null

/**
 * La elección dicha (§28 `ChosenOption`): en el orden de `product.options`, `{ key, label: opción, value: valor dicho }`,
 * las mismas palabras que se leerán en el carrito, el pedido y el historial.
 */
export function chosenOptions(product, selection) {
  const out = []
  for (const o of product && Array.isArray(product.options) ? product.options : []) {
    if (!o || !has(o.key) || !selection || selection[o.key] === undefined || selection[o.key] === null) continue
    const v = (Array.isArray(o.values) ? o.values : []).find((x) => x && x.value === selection[o.key])
    if (v) out.push({ key: o.key, label: o.label, value: v.label })
  }
  return out
}

/**
 * EC4: las variantes válidas de un producto (cada una con un valor por `ProductOption.key` y sin combinación repetida) y,
 * con `selection`, la que le corresponde o null. Una variante que no cubre todas las claves, o repetida, se ignora.
 */
export function resolveVariant(product, selection, warn) {
  const keys = (product && Array.isArray(product.options) ? product.options : []).filter((o) => o && has(o.key)).map((o) => o.key)
  const seen = new Set()
  const valid = []
  for (const [i, v] of (product && Array.isArray(product.variants) ? product.variants : []).entries()) {
    const opts = v && v.options && typeof v.options === 'object' ? v.options : null
    const combo = opts && keys.every((k) => opts[k] !== undefined && opts[k] !== null) ? keys.map((k) => String(opts[k])).join('\u0000') : null
    if (combo === null || seen.has(combo)) {
      try { if (process.env.NODE_ENV !== 'production') warn(`EC4:${i}`, `variants[${i}] ${combo === null ? 'no cubre todas las opciones' : 'repite una combinación'}: se ignora (EC4).`) } catch {}
      continue
    }
    seen.add(combo)
    valid.push(v)
  }
  if (!selection) return { variants: valid, variant: null }
  const variant = keys.length ? valid.find((v) => keys.every((k) => v.options[k] === selection[k])) || null : null
  return { variants: valid, variant }
}

/** EC6: un campo que pide un dato de tarjeta (`autocomplete` `cc-*` o `name` que empieza por `card`) no se pinta. */
export function isCardField(field, warn) {
  const card = Boolean(field) && ((typeof field.autocomplete === 'string' && /(^|\s)cc-/i.test(field.autocomplete)) || (typeof field.name === 'string' && /^card/i.test(field.name)))
  try { if (process.env.NODE_ENV !== 'production' && card) warn(`EC6:${field.name}`, `el campo «${field.name}» pide un dato de tarjeta: no se pinta, el pago es del slot de la aplicación (EC6).`) } catch {}
  return card
}

/** EC1: una lista con precios y sin `prices` se pinta sin región (cada GPrice con su código, regla `auto`). */
export function shopRegion(prices, anyPrice, warn) {
  const ok = prices && typeof prices === 'object' && has(prices.currency)
  try { if (process.env.NODE_ENV !== 'production' && anyPrice && !ok) warn('EC1', 'una lista con precios y sin prices (la región es obligatoria en Ecommerce): se pinta sin región (EC1).') } catch {}
  return ok ? checkRegion(prices, false, warn) : null
}
