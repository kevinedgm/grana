// GbOrderHistory · lo que comparten las tres variantes (dueño: bruno; order-history.md «Piezas», avisos C2, C3, C5, C6,
// C7, EC1, EC5, OH1, OH2). Cada pedido sale listo para pintar: clave (EC5), estado con su color (OH1), fecha en la zona de
// la tienda, la cuenta de piezas en palabras, la puerta (href → navigate; sin él, open) y el seguimiento (OH2: un
// `progress.current` que no está en sus pasos no se pinta; un cancelado o devuelto, tampoco). La región de precios solo si
// la aplicación la da (EC1 con más de un pedido y sin ella).
import { computed } from 'vue'
import { dateTime, useLocale } from '../common/locale.js'
import { productKey, shopRegion } from '../common/ecommerce.js'
import { labelOf } from '../common/order.js'
import { isUnsafeHref, safeHref } from '../common/navigate.js'
import { has } from '../common/text.js'
import { MAX_ORDERS, STATUS_COLOR, STOPPED } from './props.js'

export function useOrderHistory(props, warn, variant) {
  const locale = useLocale(props)
  const L = computed(() => props.labels || {})
  const orders = computed(() => {
    const list = Array.isArray(props.orders) ? props.orders : []
    try { if (process.env.NODE_ENV !== 'production' && list.length > MAX_ORDERS) warn('C7', `orders con ${list.length} pedidos; se recomiendan hasta ${MAX_ORDERS} por página: se pintan todos (C7).`) } catch {}
    const seen = new Set()
    const out = []
    list.forEach((o, index) => {
      if (!o || typeof o !== 'object' || !o.reference || !has(o.reference.code) || !has(o.statusText)) {
        try { if (process.env.NODE_ENV !== 'production') warn(`C2:orders:${index}`, `orders[${index}] sin reference.code o sin statusText: se omite (C2).`) } catch {}
        return
      }
      let key = productKey(o, index, 'orders', warn)
      if (seen.has(key)) {
        try { if (process.env.NODE_ENV !== 'production') warn(`C3:${key}`, `orders: id «${String(o.id)}» repetido; se usa el índice (C3).`) } catch {}
        key = `i:${index}`
      }
      seen.add(key)
      let color = STATUS_COLOR[o.status]
      if (!color) {
        try { if (process.env.NODE_ENV !== 'production') warn(`OH1:${key}`, `orders «${o.reference.code}» con status «${o.status}» fuera de la lista: se pinta neutral con su statusText (OH1).`) } catch {}
        color = 'neutral'
      }
      const date = dateTime(o.placedAt, { locale: locale.value, timeZone: props.timeZone, weekday: false })
      // La puerta: href → enlace (navigate); sin él → botón (open); javascript: → sin puerta (C6)
      let href = null
      if (has(o.href)) {
        href = safeHref(o.href)
        try { if (process.env.NODE_ENV !== 'production' && !href && isUnsafeHref(o.href)) warn(`C6:${key}`, `orders «${o.reference.code}» con href javascript:; se ignora el enlace (C6).`) } catch {}
      }
      // El seguimiento (02): un proceso que avanza; cancelado o devuelto no lo lleva (OH2 si el actual no está en sus pasos)
      let progress = null
      const p = o.progress
      if (variant === '02' && p && Array.isArray(p.steps) && p.steps.length && !STOPPED.includes(o.status)) {
        const steps = p.steps.filter((s) => s && has(s.id) && has(s.label))
        if (steps.some((s) => s.id === p.current)) {
          progress = { current: p.current, steps: steps.map((s) => { const d = has(s.date) ? dateTime(s.date, { locale: locale.value, timeZone: props.timeZone, weekday: false }) : null; return { id: s.id, label: s.label, description: d ? d.text : undefined } }) }
        } else {
          try { if (process.env.NODE_ENV !== 'production') warn(`OH2:${key}`, `orders «${o.reference.code}»: progress.current «${p.current}» no está en sus steps; sin seguimiento (OH2).`) } catch {}
        }
      }
      out.push({ key, order: o, code: o.reference.code, color, date, href, external: Boolean(o.external), count: Number.isFinite(o.count) ? labelOf(L.value.count, 'count', o.count) : '', progress, tracking: o.tracking && has(o.tracking.href) ? o.tracking : null, lines: Array.isArray(o.lines) && o.lines.length ? o.lines : null })
    })
    return out
  })
  // Textos que el estado necesita (C5)
  try {
    if (process.env.NODE_ENV !== 'production') {
      const l = props.labels || {}
      for (const k of ['reference', 'date', 'status', 'total', 'count', 'open']) if (l[k] === undefined || l[k] === '') warn(`C5:${k}`, `falta labels.${k}: se pinta sin ese texto (C5).`)
      if (!l.empty || !has(l.empty.title)) warn('C5:empty', 'falta labels.empty.title («Todavía no tienes pedidos»): el vacío va sin título (C5).')
    }
  } catch {}
  const tracked = computed(() => orders.value.some((o) => o.tracking))
  try {
    if (process.env.NODE_ENV !== 'production') {
      if (variant !== '03' && tracked.value && !has(L.value.tracking)) warn('C5:tracking', 'hay tracking y falta labels.tracking («Seguir el envío»): el enlace dice el nombre del transportista (C5).')
      if (variant === '02' && orders.value.some((o) => o.progress) && L.value.progress === undefined) warn('C5:progress', 'hay progress y falta labels.progress («Seguimiento del pedido {reference}»): el seguimiento va sin nombre (C5).')
    }
  } catch {}
  // EC1: con más de un pedido, la región; un pedido en otra moneda conserva su código (regla auto de GPrice)
  const region = computed(() => (props.prices ? shopRegion(props.prices, true, warn) : shopRegion(null, orders.value.length > 1, warn)))
  const openName = (code) => labelOf(L.value.open, 'reference', code)
  return { locale, L, orders, region, openName }
}
