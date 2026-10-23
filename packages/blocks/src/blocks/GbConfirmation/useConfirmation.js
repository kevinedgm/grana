// GbConfirmation · lo que comparten las tres variantes (dueño: bruno; confirmation.md «Anatomía», avisos C3 a C8, K1 a K3,
// F1 a F3). La consulta se dice con describeQuery (#862, el hilo); el total lo da la aplicación (Grana no suma, #769); las
// fechas de `next` en la zona del lugar (`timeZone`, §15 regla 6). `variant`: '01' | '02' | '03' (03 ignora `next`, la foto
// y las líneas del total, y pinta como mucho dos acciones: F3).
import { computed } from 'vue'
import { checkRegion, dateTime, useLocale, useQueryLine } from '../common/booking.js'
import { entries } from '../common/list.js'
import { checkMedia } from '../common/media.js'
import { has } from '../common/text.js'
import { MAX_NEXT, STATES } from './props.js'

export function useConfirmation(props, warn, variant) {
  const locale = useLocale(props)
  const query = useQueryLine(props, warn, { forQuery: false, locale })
  const L = computed(() => props.labels || {})

  const state = computed(() => {
    if (STATES.includes(props.state)) return props.state
    try { if (process.env.NODE_ENV !== 'production') warn('F1', `state «${props.state}» fuera de lista: se pinta «requested»: nunca se afirma una confirmación por defecto (F1).`) } catch {}
    return 'requested'
  })
  const stateText = computed(() => {
    const t = L.value.states && L.value.states[state.value]
    if (has(t)) return t
    try { if (process.env.NODE_ENV !== 'production') warn('C5:states', `falta labels.states.${state.value}: el estado no se dice (C5).`) } catch {}
    return ''
  })
  const code = computed(() => {
    const r = props.reference || {}
    if (has(r.code)) return { code: r.code, label: has(r.label) ? r.label : '' }
    try { if (process.env.NODE_ENV !== 'production') warn('F2', 'reference.code vacío: se pinta sin código (F2).') } catch {}
    return null
  })
  const offer = computed(() => (props.offer && typeof props.offer === 'object' && has(props.offer.name) ? props.offer : null))
  const photo = computed(() => {
    if (variant !== '01' || !offer.value || !Array.isArray(offer.value.photos)) return null
    const p = offer.value.photos[0]
    if (!p || !has(p.src)) return null
    checkMedia(p, 'offer.photos[0]', warn)
    return p
  })
  // La ficha: con oferta, su nombre y la consulta como dato «Cuándo y quiénes»; sin oferta, la consulta es el título
  const summary = computed(() => {
    const q = query.value
    const when = L.value.when
    if (q && offer.value && !has(when)) {
      try { if (process.env.NODE_ENV !== 'production') warn('C5:when', 'falta labels.when («Cuándo y quiénes»): la consulta va sin rótulo (C5).') } catch {}
    }
    if (offer.value) {
      return { title: offer.value.name, subtitle: has(offer.value.kind) ? offer.value.kind : undefined, facts: q && has(when) ? [{ label: when, value: q.text, priority: 1 }] : [], line: q && !has(when) ? q.text : '' }
    }
    return q ? { title: q.text, subtitle: undefined, facts: [], line: '' } : null
  })
  const totals = computed(() => {
    const t = props.totals
    if (!t || typeof t !== 'object' || !t.total || t.total.value === undefined) return null
    const lines = Array.isArray(t.lines) ? t.lines.filter((l) => l && has(l.label) && l.amount) : []
    // 03 pinta solo el total: las líneas se ignoran en silencio (§1 regla 3; el mismo banco no hace avisar a ninguna variante)
    return { total: t.total, lines: variant === '03' ? [] : lines, note: has(t.note) ? t.note : '' }
  })
  const region = computed(() => checkRegion(props.prices, Boolean(totals.value), warn))
  const next = computed(() => {
    if (variant === '03') return []
    const list = Array.isArray(props.next) ? props.next : []
    try { if (process.env.NODE_ENV !== 'production' && list.length > MAX_NEXT) warn('C7', `next con ${list.length} pasos; se recomiendan hasta ${MAX_NEXT}: se pintan todos (C7).`) } catch {}
    return entries(list, ['title'], 'next', warn).map((e) => ({ ...e, time: has(e.item.date) ? dateTime(e.item.date, { locale: locale.value, timeZone: props.timeZone }) : null }))
  })
  const channels = computed(() => {
    const list = entries(props.channels, ['label', 'href'], 'channels', warn)
    try { if (process.env.NODE_ENV !== 'production' && list.length && !has(L.value.channels)) warn('C5:channels', 'hay channels y falta labels.channels («Escríbenos»): la lista de canales va sin nombre (C5).') } catch {}
    return list
  })
  const actions = computed(() => {
    const list = Array.isArray(props.actions) ? props.actions : []
    if (variant === '03' && list.length > 2) {
      try { if (process.env.NODE_ENV !== 'production') warn('F3:actions', `03 pinta como mucho dos acciones; ${list.length} dadas: se ignoran las demás (F3).`) } catch {}
      return list.slice(0, 2)
    }
    return list
  })
  return { locale, query, state, stateText, badgeColor: computed(() => (state.value === 'confirmed' ? 'success' : 'warning')), code, offer, photo, summary, totals, region, next, channels, actions }
}
