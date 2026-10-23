// describeQuery · la consulta en palabras (dueño: bruno). Contrato: design/contracts/booking-bar.md «`describeQuery`»
// (DECISIONS.md #862). Interno de la entrada @grana/vue/booking (no entra en el principal): lo usa GBookingBar para su
// resumen, el compacto y el muelle, y lo exporta la entrada para que los bloques de Booking digan la consulta con las mismas
// palabras (blocks/_comun.md §15 regla 3, #864). Pura: sin DOM ni `window`; solo una caché de formateadores de Intl. Nunca
// lanza; sin avisos propios (los da GBookingBar, aviso 7, y los bloques, K2): la pieza sin texto se omite.
import { fill } from './template.js'
import { daysBetween, isISO, parseISO, todayISO } from './dates.js'
import { completeParty, partySummary, validRows } from '../components/GPartyField/party.js'

const KINDS = ['stay', 'table', 'tour']
const cache = new Map()
const make = (C, locale, o) => { try { return new C(locale, o) } catch { return new C(undefined, o) } }

/**
 * Formatos de la consulta para un idioma (caché por idioma): fecha corta y larga, rango, «hoy»/«mañana» de la mesa (como el
 * hueco de fecha de la barra) y números. Los comparte GBookingBar para decir las fechas igual que el resumen.
 */
export function queryFormat(locale) {
  let f = cache.get(locale || '')
  if (!f) {
    const s = make(Intl.DateTimeFormat, locale, { weekday: 'short', day: 'numeric', month: 'short' })
    const l = make(Intl.DateTimeFormat, locale, { weekday: 'long', day: 'numeric', month: 'long' })
    const r = make(Intl.DateTimeFormat, locale, { day: 'numeric', month: 'short' })
    const short = (d) => s.format(parseISO(d))
    f = {
      nf: make(Intl.NumberFormat, locale),
      short,
      long: (d) => l.format(parseISO(d)),
      range: (a, b) => (r.formatRange ? r.formatRange(parseISO(a), parseISO(b)) : `${r.format(parseISO(a))} – ${r.format(parseISO(b))}`),
      day: (d) => {
        const n = daysBetween(todayISO(), d) - 1
        if (n === 0 || n === 1) { try { return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(n, 'day') } catch {} }
        return short(d)
      }
    }
    cache.set(locale || '', f)
  }
  return f
}

/**
 * La consulta en palabras, igual que el resumen de GBookingBar. Una clave de `labels` que falta (o no es texto ni función)
 * deja fuera su pieza.
 * @param {{ kind: 'stay'|'table'|'tour', from?, to?, date?, time?, tour?, party? }} query
 * @param {{ partyRows: object[], times?: object[], tours?: object[], locale?: string, labels: object }} options
 * @returns {{ text: string, checkout: string, nights: number | null, missing: string[] }}
 */
export function describeQuery(query, options) {
  const out = { text: '', checkout: '', nights: null, missing: [] }
  try {
    const q = query || {}
    const o = options || {}
    const L = o.labels || {}
    const t = (k) => { const v = L[k]; return typeof v === 'string' || typeof v === 'function' ? v : '' }
    const kind = KINDS.includes(q.kind) ? q.kind : 'stay'
    const sv = t('separator')
    const sep = typeof sv === 'string' ? sv : ''
    const f = queryFormat(typeof o.locale === 'string' && o.locale ? o.locale : undefined)
    const iso = (v) => (isISO(v) ? v : null)
    const find = (list, v) => (Array.isArray(list) ? list : []).find((x) => x && x.value !== undefined && x.value === v)
    const parts = []
    const lack = (what, key) => { out.missing.push(what); parts.push(t(key)) }
    if (kind === 'stay') {
      const from = iso(q.from)
      const to = iso(q.to)
      if (from && to) {
        const n = (out.nights = daysBetween(from, to) - 1)
        const nights = t('nights')
        parts.push(`${f.range(from, to)}${sep}${typeof nights === 'function' ? String(nights(n, { count: f.nf.format(n) })) : fill(nights, { count: f.nf.format(n) })}`)
        out.checkout = fill(t('checkout'), { date: f.long(to) })
      } else lack('dates', 'noDates')
    }
    if (kind === 'tour') { const x = find(o.tours, q.tour); x ? parts.push(x.label || String(x.value)) : lack('tour', 'noTour') }
    if (kind !== 'stay') { const d = iso(q.date); d ? parts.push(kind === 'table' ? f.day(d) : f.short(d)) : lack('date', 'noDate') }
    if (kind === 'table') { const x = find(o.times, q.time); x ? parts.push(x.label || x.value) : lack('time', 'noTime') }
    const rows = validRows(o.partyRows)
    parts.push(partySummary(rows, completeParty(rows, q.party), sep, f.nf))
    out.text = parts.filter((p) => typeof p === 'string' && p).join(sep)
  } catch {}
  return out
}
