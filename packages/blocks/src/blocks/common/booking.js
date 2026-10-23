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
import { computed } from 'vue'
import { describeQuery } from '@grana/vue/booking'
import { has } from './text.js'
import { fill } from './locale.js'

// Lo que comparte con Ecommerce vive en locale.js y price.js (sin describeQuery); se reexporta con los mismos nombres
export { dateTime, fill, useLocale } from './locale.js'
export { availability, checkRegion, priceSpec, regionAttrs } from './price.js'

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
