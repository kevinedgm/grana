// GbBookingSummary · lo que comparten las tres variantes (dueño: bruno; booking-summary.md «Piezas», avisos C5, C6, C8,
// K1 a K3, R1 y R2). La consulta se dice con describeQuery (#862, el hilo); el total lo da la aplicación y el bloque no
// comprueba que las líneas lo sumen (Grana no suma, #769); la garantía describe la acción principal (#838).
// `variant`: '01' | '02' | '03'. 01 ignora `totals.lines`; 03 ignora las líneas, la nota, la foto y la segunda acción.
import { computed, useId } from 'vue'
import { checkRegion, priceSpec, useLocale, useQueryLine } from '../common/booking.js'
import { checkMedia } from '../common/media.js'
import { has } from '../common/text.js'
import { MAX_LINES } from './props.js'

export function useBookingSummary(props, warn, variant) {
  const uid = useId()
  const locale = useLocale(props)
  const query = useQueryLine(props, warn, { forQuery: false, locale })
  const L = computed(() => props.labels || {})

  const offer = computed(() => (props.offer && typeof props.offer === 'object' && has(props.offer.name) ? props.offer : null))
  const photo = computed(() => {
    if (variant !== '01' || !offer.value || !Array.isArray(offer.value.photos)) return null
    const p = offer.value.photos[0]
    if (!p || !has(p.src)) return null
    checkMedia(p, 'offer.photos[0]', warn)
    return p
  })
  // Lo pedido: con oferta, su nombre y la consulta como dato `labels.when`; sin oferta, la consulta es el título
  const summary = computed(() => {
    const q = query.value
    const when = L.value.when
    if (q && !has(when)) {
      try { if (process.env.NODE_ENV !== 'production') warn('C5:when', 'falta labels.when («Fechas y personas»): la consulta va sin rótulo (C5).') } catch {}
    }
    if (offer.value) {
      return {
        title: offer.value.name,
        subtitle: has(offer.value.kind) ? offer.value.kind : undefined,
        facts: q && has(when) ? [{ label: when, value: q.text, priority: 1 }] : [],
        line: q && !has(when) ? q.text : ''
      }
    }
    return q ? { title: q.text, subtitle: undefined, facts: [], line: '' } : null
  })

  const totals = computed(() => {
    const t = props.totals
    if (!t || typeof t !== 'object' || !t.total || t.total.value === undefined) return null
    try { if (process.env.NODE_ENV !== 'production' && !has(t.total.label)) warn('R1', 'totals.total sin label: la cuenta necesita su unidad («por 2 noches») (R1).') } catch {}
    const all = Array.isArray(t.lines) ? t.lines.filter((l) => l && has(l.label) && l.amount) : []
    // Solo 02 pinta el desglose: las demás lo ignoran en silencio (§1 regla 3; el mismo banco no hace avisar a ninguna)
    const lines = variant === '02' ? all : []
    if (variant === '02') {
      try {
        if (process.env.NODE_ENV !== 'production') {
          if (all.length > MAX_LINES) warn('R2', `totals.lines con ${all.length} líneas; se recomiendan hasta ${MAX_LINES}: se pintan todas (R2).`)
          if (all.length && !has(L.value.lines)) warn('C5:lines', 'hay totals.lines y falta labels.lines («Desglose»): el desglose va sin nombre (C5).')
        }
      } catch {}
    }
    return { total: t.total, lines, note: variant === '02' && has(t.note) ? t.note : '' }
  })

  // El precio: la tarifa de la oferta tal cual (PriceSpec) con la cuenta = totals.total (A · La cuenta); sin totals, la
  // tarifa sola; sin tarifa, el total como importe. 03 pinta solo el total (sin la tarifa).
  const rate = computed(() => (offer.value ? priceSpec(offer.value.price, 'offer.price', warn) : null))
  const price = computed(() => {
    const t = totals.value
    const lead = L.value.price && has(L.value.price.total) ? L.value.price.total : undefined
    const asTotal = t ? { value: t.total.value, unit: has(t.total.label) ? t.total.label : undefined, lead } : null
    if (variant === '03') return asTotal || rate.value
    if (rate.value) {
      const p = { ...rate.value }
      if (t) p.total = t.total
      else delete p.total
      return p
    }
    return asTotal
  })
  const region = computed(() => checkRegion(props.prices, Boolean(price.value) || Boolean(totals.value && totals.value.lines.length), warn))

  const assuranceId = computed(() => (has(props.assurance) ? `${uid}-assurance` : undefined))
  const actions = computed(() => {
    const list = Array.isArray(props.actions) ? props.actions : []
    if (variant !== '03') return list
    try { if (process.env.NODE_ENV !== 'production' && list.length > 2) warn('C8', `${list.length} actions: 03 pinta la primera (C8).`) } catch {}
    return list.slice(0, 1)
  })
  return { locale, query, offer, photo, summary, totals, price, region, assuranceId, actions }
}
