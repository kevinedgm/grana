// GbOrderSummary · lo que comparten las tres variantes (dueño: bruno; order-summary.md «Piezas», avisos C5, C6, C8, K3,
// EC1, OS1, OS2). El pedido lo pinta common/order.js (la misma pieza que el pedido de Checkout); el total lo da la
// aplicación y el bloque no comprueba que las líneas lo sumen (§27 regla 4). Las acciones (0 a 2, §3) las pinta GbActions.
import { computed } from 'vue'
import { useLocale } from '../common/locale.js'
import { shopRegion } from '../common/ecommerce.js'
import { regionAttrs } from '../common/price.js'
import { has } from '../common/text.js'
import { totalOf } from '../common/totals.js'
import { MAX_CARD_LINES } from './props.js'

export function useOrderSummary(props, warn, variant) {
  const locale = useLocale(props)
  const order = computed(() => {
    const o = props.order
    if (!o || typeof o !== 'object' || !totalOf(o.totals)) {
      try { if (process.env.NODE_ENV !== 'production') warn('C2:order', 'order sin totals.total: no se pinta (C2).') } catch {}
      return null
    }
    const total = totalOf(o.totals)
    try {
      if (process.env.NODE_ENV !== 'production') {
        if (!has(total.label)) warn('OS1', 'order.totals.total sin label: el total necesita su unidad («por 4 piezas») (OS1).')
        if (variant === '01' && Array.isArray(o.lines) && o.lines.length > MAX_CARD_LINES) warn('OS2', `order.lines con ${o.lines.length} líneas en la tarjeta; se recomiendan hasta ${MAX_CARD_LINES}: se pintan todas (OS2).`)
      }
    } catch {}
    return o
  })
  // EC1: la región es obligatoria (un pedido tiene más de un precio de la misma moneda)
  const region = computed(() => (order.value ? shopRegion(props.prices, true, warn) : null))
  const scope = computed(() => (region.value ? regionAttrs(region.value, props.labels, locale.value) : null))
  return { locale, order, region, scope, priceLocale: computed(() => (region.value ? undefined : locale.value)) }
}
