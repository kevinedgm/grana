// GbAvailability · lo que comparten las tres variantes (dueño: bruno; availability.md «Del dato al calendario», avisos C3,
// C5, C7, K1 a K3 y V1 a V4). Del dato de la aplicación a GDatePicker sin calcular disponibilidad ni precios (§15 regla 9):
//   - `disabledDates`: `closed` siempre y `full` fuera de `stay`; `disabledNights` (solo `stay`): `full` es la noche
//     agotada, que se puede usar como salida (#739).
//   - `dayDescription(iso)`: lo que se oye en el nombre del día tras sus sufijos de estado (#778): el estado en palabras,
//     el precio (`formatPrice(…).spoken`) y la nota, unidos por «, ». Se calcula una vez por cambio de datos (un Map), no
//     por celda; sin guardas de aviso en el recorrido de días (#653).
//   - La elección es estado de vista (`v-model:value`); `select` lleva el día entero y la consulta con las fechas puestas.
import { computed, onMounted, ref, watch } from 'vue'
import { formatPrice } from '@grana/vue/price'
import { checkQuery, checkRegion, dateTime, priceSpec, useLocale } from '../common/booking.js'
import { has } from '../common/text.js'
import { FIVE_DIGITS, MAX_DAYS, STATUSES, UPCOMING, UPCOMING_RANGE } from './props.js'

const ISO = /^\d{4}-\d{2}-\d{2}$/
const moneys = (v) => (Array.isArray(v) ? v : v && typeof v === 'object' ? [v] : [])
const pad = (n) => String(n).padStart(2, '0')

export function useAvailability(props, emit, warn, variant, hasEmpty = () => false) {
  const locale = useLocale(props)
  const L = computed(() => props.labels || {})
  const stay = computed(() => props.kind === 'stay')
  const query = computed(() => checkQuery(props.query, warn))
  // La consulta inválida (K1) se avisa al montar aunque la variante no la diga
  void query.value

  // Los días conocidos por fecha. V1: estado fuera de lista = sin dato; C3: fecha repetida, cuenta la primera.
  const days = computed(() => {
    const m = new Map()
    const arr = Array.isArray(props.days) ? props.days : []
    try { if (process.env.NODE_ENV !== 'production' && arr.length > MAX_DAYS) warn('C7', `days con ${arr.length} días; se recomiendan hasta ${MAX_DAYS}: se pintan todos (C7).`) } catch {}
    arr.forEach((d, i) => {
      if (!d || typeof d !== 'object' || typeof d.date !== 'string' || !ISO.test(d.date)) {
        try { if (process.env.NODE_ENV !== 'production') warn(`C2:days:${i}`, `days[${i}] sin date (AAAA-MM-DD): se omite (C2).`) } catch {}
        return
      }
      if (!STATUSES.includes(d.status)) {
        try { if (process.env.NODE_ENV !== 'production') warn(`V1:${d.date}`, `days[${i}].status «${String(d.status)}» fuera de lista (open, few, full, closed): cuenta como sin dato (V1).`) } catch {}
        return
      }
      if (m.has(d.date)) {
        try { if (process.env.NODE_ENV !== 'production') warn(`C3:${d.date}`, `days: fecha «${d.date}» repetida; cuenta la primera (C3).`) } catch {}
        return
      }
      m.set(d.date, { day: d, price: priceSpec(d.price, `days[${i}].price`, warn) })
    })
    return m
  })
  const anyPrice = computed(() => [...days.value.values()].some((e) => e.price))
  const region = computed(() => checkRegion(props.prices, anyPrice.value, warn))

  // Los textos de estado: C5 la primera vez que un día los necesita (una vez por estado)
  const status = computed(() => {
    const t = L.value.status || {}
    const need = new Set([...days.value.values()].map((e) => e.day.status).filter((s) => s !== 'open'))
    const out = {}
    for (const s of ['few', 'full', 'closed']) {
      if (has(t[s])) out[s] = t[s]
      else if (need.has(s)) {
        try { if (process.env.NODE_ENV !== 'production') warn(`C5:status.${s}`, `hay días «${s}» y falta labels.status.${s}: el día no dice su estado en palabras (C5).`) } catch {}
      }
    }
    return out
  })

  // V3 (#801): un precio de día con cinco cifras o más en el calendario (01, 03)
  if (variant !== '02') {
    watch(days, (m) => {
      const big = [...m.values()].some((e) => e.price && moneys(e.price.value).some((x) => x && Math.abs(Number(x.amount)) >= FIVE_DIGITS))
      try { if (process.env.NODE_ENV !== 'production' && big) warn('V3', 'hay precios de día de cinco cifras o más: no caben en la celda a 320 px (#801); da el precio en 02 o sin precio por día (V3).') } catch {}
    }, { immediate: true })
  }
  // V2: noches mínimas o máximas fuera de una estancia
  const nights = computed(() => {
    if (stay.value) return { minNights: props.minNights, maxNights: props.maxNights }
    try { if (process.env.NODE_ENV !== 'production' && (props.minNights !== undefined || props.maxNights !== undefined)) warn('V2', `minNights/maxNights con kind «${props.kind}»: solo valen en stay; se ignoran (V2).`) } catch {}
    return {}
  })

  /** Las reglas de GDatePicker derivadas del dato (tabla «Del dato al calendario»). */
  const disabledDates = (iso) => {
    const e = days.value.get(iso)
    return Boolean(e) && (e.day.status === 'closed' || (!stay.value && e.day.status === 'full'))
  }
  const disabledNights = (iso) => {
    const e = days.value.get(iso)
    return Boolean(e) && e.day.status === 'full'
  }

  // Lo que se oye de cada día, una vez por cambio de datos
  const spoken = computed(() => {
    const out = new Map()
    const r = region.value
    const pl = L.value.price && typeof L.value.price === 'object' ? L.value.price : undefined
    for (const [iso, e] of days.value) {
      const d = e.day
      const parts = []
      if (d.status === 'full' || d.status === 'closed') parts.push(status.value[d.status])
      else {
        if (d.status === 'few') parts.push(status.value.few)
        if (e.price && e.price.value !== null) {
          const f = formatPrice(e.price.value, { locale: (r && r.locale) || locale.value, cents: 'never', scopeCurrency: r ? r.currency : undefined, view: r ? r.view : undefined, labels: pl })
          if (f.state === 'amount') parts.push(f.spoken)
        }
        parts.push(d.note)
      }
      const text = parts.filter(has).join(', ')
      if (text) out.set(iso, text)
    }
    return out
  })
  const dayDescription = (iso) => spoken.value.get(iso) || ''

  /** Lo que pinta el slot `day` de GDatePicker: el precio del día abierto o con pocas (nada en lleno ni cerrado). */
  const cellPrice = (iso) => {
    const e = days.value.get(iso)
    if (!e || !e.price || e.price.value === null || e.day.status === 'full' || e.day.status === 'closed') return null
    return e.price.value
  }
  const dayOf = (iso) => { const e = typeof iso === 'string' ? days.value.get(iso) : null; return e ? e.day : null }

  // La elección (estado de vista; `v-model:value`)
  const current = ref(props.value === undefined ? null : props.value)
  watch(() => props.value, (v) => { current.value = v === undefined ? null : v })
  const complete = (v) => (stay.value ? Boolean(v && typeof v === 'object' && has(v.start) && has(v.end)) : typeof v === 'string' && ISO.test(v))
  /** La consulta recibida con las fechas elegidas puestas (o null sin consulta). */
  const withDates = (v) => {
    const q = query.value
    if (!q) return null
    if (q.kind === 'stay') {
      const r = v && typeof v === 'object' ? v : { start: typeof v === 'string' ? v : null, end: null }
      return { ...q, from: r.start || null, to: r.end || null, party: { ...q.party } }
    }
    const date = typeof v === 'string' ? v : v && typeof v === 'object' ? v.start || null : null
    return { ...q, date, party: { ...q.party } }
  }
  const payload = (event, value) => ({ event: event || null, kind: props.kind, value, day: dayOf(typeof value === 'string' ? value : value && value.start), query: withDates(value) })
  const choose = (v) => {
    current.value = v
    emit('update:value', v)
  }
  const select = (event, value) => emit('select', payload(event, value))

  // 02: las próximas fechas abiertas desde hoy (al montar: en el servidor no se lee la hora del sistema) o `min`
  const today = ref(null)
  onMounted(() => { const d = new Date(); today.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` })
  const upcomingList = computed(() => {
    if (variant !== '02') return []
    const from = [props.min, today.value].filter((x) => typeof x === 'string' && ISO.test(x)).sort().pop() || ''
    const n = Number.isInteger(props.upcoming) ? Math.min(Math.max(props.upcoming, UPCOMING_RANGE[0]), UPCOMING_RANGE[1]) : UPCOMING
    return [...days.value.entries()]
      .filter(([iso, e]) => (e.day.status === 'open' || e.day.status === 'few') && iso >= from && (!props.max || iso <= props.max))
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .slice(0, n)
      .map(([iso, e]) => ({ key: iso, iso, day: e.day, price: e.price, time: dateTime(iso, { locale: locale.value }), few: e.day.status === 'few' ? status.value.few || '' : '' }))
  })

  const selectLabel = computed(() => {
    const t = L.value.select
    try { if (process.env.NODE_ENV !== 'production' && variant === '03' && !has(t)) warn('C5:select', 'falta labels.select («Elegir estas fechas»): el botón va sin texto y no se pinta (C5).') } catch {}
    return has(t) ? t : ''
  })

  // Los avisos de estado, noches y lista vacía (C5, V2, V4) salen al montar aunque la variante no pinte lo que los pide
  void status.value
  void nights.value
  if (variant === '02') {
    watch(upcomingList, (list) => {
      try { if (process.env.NODE_ENV !== 'production' && !list.length && !hasEmpty()) warn('V4', 'no hay ninguna fecha abierta en days: la lista no se pinta; pon el mensaje en el slot empty (V4).') } catch {}
    }, { immediate: true })
  }

  return { locale, stay, query, days, region, nights, disabledDates, disabledNights, dayDescription, cellPrice, dayOf, current, complete, choose, select, withDates, upcomingList, selectLabel }
}
