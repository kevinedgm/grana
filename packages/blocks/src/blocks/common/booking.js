// Lo común de las secciones de Booking (dueño: bruno; design/contracts/blocks/_comun.md §15 a §18, #860 a #866). Interno
// del paquete: no se exporta. Lo usan las once secciones (partes A, B y C):
//   - `checkQuery` (K1): la consulta del hilo, válida para su `kind`, o null.
//   - `useQueryLine` (K2): la consulta dicha con `describeQuery` de @grana/vue/booking (#862), las mismas palabras que la
//     barra; con `labels.forQuery` («Para {query}») si la sección lo pide.
//   - `useLocale`: `locale` de la sección › `lang` del ancestro (al montar) › `navigator.language`; en SSR sin `locale`, nada
//     (las fechas salen en ISO y se reformatean al montar, como GPrice, #775).
//   - `dateTime`: una fecha u hora para `<time datetime>` con su texto de Intl (en la zona del lugar si hay `timeZone`).
//   - `availability` (K4), `priceSpec` (K3), `offerKey` (K5).
// Avisos con la guarda de #653 en el sitio de cada texto.
import { computed, getCurrentInstance, onMounted, ref, watch } from 'vue'
import { describeQuery } from '@grana/vue/booking'
import { has } from './text.js'

export const KINDS = ['stay', 'table', 'tour']
const ISO = /^\d{4}-\d{2}-\d{2}$/
const isoOrNull = (v) => v === null || (typeof v === 'string' && ISO.test(v))
const SHAPE = {
  stay: (q) => isoOrNull(q.from) && isoOrNull(q.to),
  table: (q) => isoOrNull(q.date) && (q.time === null || typeof q.time === 'string'),
  tour: (q) => isoOrNull(q.date) && (q.tour === null || typeof q.tour === 'string' || typeof q.tour === 'number')
}

/**
 * K1: la `BookingQuery` (§16) válida, o null (se trata como sin consulta). `kind`: el que exige la sección (Search).
 * Sin consulta (`null`/`undefined`), null sin aviso.
 */
export function checkQuery(query, warn, kind) {
  if (query === null || query === undefined) return null
  const ok = typeof query === 'object' && KINDS.includes(query.kind) && SHAPE[query.kind](query) &&
    query.party !== null && typeof query.party === 'object' && (!kind || query.kind === kind)
  if (!ok) {
    try {
      if (process.env.NODE_ENV !== 'production') {
        const why = !query || typeof query !== 'object' || !KINDS.includes(query.kind) ? 'sin kind válido' : kind && query.kind !== kind ? `con kind «${query.kind}» y la sección es «${kind}»` : `con forma inválida para kind «${query.kind}»`
        warn('K1', `query ${why}: se trata como sin consulta (K1).`)
      }
    } catch {}
    return null
  }
  return query
}

/** Sustituye {nombre} (texto de la aplicación); un marcador sin valor se deja tal cual. */
export const fill = (text, vars) => (typeof text === 'string' ? text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] === undefined || vars[k] === null ? m : String(vars[k]))) : '')

/**
 * `locale` de la sección › `lang` del ancestro › `navigator.language`, leído al montar (SSR: solo la prop). Devuelve un ref.
 */
export function useLocale(props) {
  const loc = ref(has(props.locale) ? props.locale : undefined)
  const inst = getCurrentInstance()
  onMounted(() => {
    if (has(props.locale)) return
    const el = inst && inst.proxy && inst.proxy.$el
    const node = el && el.nodeType === 1 ? el : el && el.parentElement
    const near = node && typeof node.closest === 'function' ? node.closest('[lang]') : null
    loc.value = (near && near.getAttribute('lang')) || (typeof navigator !== 'undefined' && navigator.language) || undefined
  })
  watch(() => props.locale, (v) => { if (has(v)) loc.value = v })
  return loc
}

/**
 * La consulta dicha (§15 regla 3): `{ query, text, checkout, line }` o null sin consulta válida. `line` es `labels.forQuery`
 * con `{query}` (o el texto solo si la sección no lo pide: `forQuery: false`). K2: con consulta y sin `partyRows` o sin
 * `labels.query`, no se dice. `context` = `{ times, tours }` de la sección.
 */
export function useQueryLine(props, warn, { kind, forQuery = true, locale } = {}) {
  return computed(() => {
    const q = checkQuery(props.query, warn, kind)
    if (!q) return null
    const labels = (props.labels && props.labels.query) || null
    const rows = Array.isArray(props.partyRows) && props.partyRows.length ? props.partyRows : null
    if (!rows || !labels) {
      try { if (process.env.NODE_ENV !== 'production') warn('K2', `query sin ${rows ? 'labels.query' : 'partyRows'}: la línea de la consulta no se pinta (K2).`) } catch {}
      return null
    }
    const ctx = props.context && typeof props.context === 'object' ? props.context : {}
    const d = describeQuery(q, { partyRows: rows, times: ctx.times, tours: ctx.tours, locale: locale ? locale.value : props.locale, labels })
    let line = d.text
    if (forQuery) {
      const t = props.labels && props.labels.forQuery
      if (has(t)) line = fill(t, { query: d.text })
      else {
        try { if (process.env.NODE_ENV !== 'production') warn('C5:forQuery', 'hay query y falta labels.forQuery («Para {query}»): se dice la consulta sin rótulo (C5).') } catch {}
      }
    }
    return { query: q, text: d.text, checkout: d.checkout, line }
  })
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/
/**
 * Una fecha (AAAA-MM-DD) o fecha y hora ISO para `<time datetime>`: `{ datetime, text }`. La fecha sola se dice tal como la
 * escribió la aplicación (en UTC, el mismo día en cualquier zona); con hora, en la zona del lugar (`timeZone` IANA). Sin
 * idioma resuelto (SSR sin `locale`), el texto es el ISO (se reformatea al montar). Lo que no se lee: el texto tal cual.
 */
export function dateTime(iso, { locale, timeZone, weekday = true } = {}) {
  if (typeof iso !== 'string' || !iso.trim()) return null
  const s = iso.trim()
  const m = DATE_ONLY.exec(s)
  const d = m ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))) : new Date(Date.parse(s))
  if (Number.isNaN(d.getTime())) return { datetime: undefined, text: s }
  if (!locale) return { datetime: s, text: s }
  const o = { day: 'numeric', month: 'long', ...(weekday ? { weekday: 'long' } : {}) }
  if (m) o.timeZone = 'UTC'
  else {
    o.hour = 'numeric'
    o.minute = '2-digit'
    if (has(timeZone)) o.timeZone = timeZone
  }
  let text
  try { text = new Intl.DateTimeFormat(locale, o).format(d) } catch {
    try { delete o.timeZone; text = new Intl.DateTimeFormat(locale, m ? { ...o, timeZone: 'UTC' } : o).format(d) } catch { text = s }
  }
  return { datetime: s, text }
}

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
