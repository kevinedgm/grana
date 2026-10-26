// El pedido de GbCheckout (dueño: bruno; checkout.md «El pedido»): la pieza de Order summary 02 (common/order.js, la misma
// del recibo) con `order` y los labels comunes, dentro de la GPriceScope del bloque; o el slot `order` de la aplicación.
//   01, 02: plegado en una línea encima del formulario: GAccordion › GAccordionItem (title = labels.order, slot meta = el
//     total con GPrice, peek = totals.total.label: la cuenta de piezas, sin sumar) › el pedido.
//   03: abierto al lado: GSection (title = labels.order) › GStack gap="lg" › el pedido.
// Interno de la sección; sin CSS.
import { defineComponent, h } from 'vue'
import { GAccordion, GAccordionItem, GSection, GStack } from '@grana/vue'
import { GPrice } from '@grana/vue/price'
import GbOrderBody from '../common/order.js'
import { has } from '../common/text.js'
import { totalOf } from '../common/totals.js'

export default /* @__PURE__ */ defineComponent({
  name: 'GbCheckoutOrder',
  props: {
    order: { type: Object, required: true },
    labels: { type: Object, default: () => ({}) },
    open: { type: Boolean, default: false },
    headingLevel: { type: Number, required: true },
    locale: { type: String, default: undefined },
    priceLocale: { type: String, default: undefined },
    orderSlot: { type: Function, default: undefined },
    warn: { type: Function, required: true }
  },
  emits: ['navigate'],
  setup(props, { emit }) {
    return () => {
      const L = props.labels || {}
      const body = () => h(GStack, { gap: 'lg' }, () => (props.orderSlot ? props.orderSlot({ order: props.order }) : h(GbOrderBody, { order: props.order, form: 'receipt', labels: L, locale: props.locale, priceLocale: props.priceLocale, warn: props.warn, onNavigate: (e) => emit('navigate', e) })))
      if (props.open) return h(GSection, { title: L.order }, body)
      const total = totalOf(props.order.totals)
      return h(GAccordion, { headingLevel: props.headingLevel }, () => h(GAccordionItem, { value: 'order', title: L.order, peek: total && has(total.label) ? total.label : undefined }, {
        meta: total ? () => h(GPrice, { value: total.value, size: 'sm', locale: props.priceLocale }) : undefined,
        default: body
      }))
    }
  }
})
