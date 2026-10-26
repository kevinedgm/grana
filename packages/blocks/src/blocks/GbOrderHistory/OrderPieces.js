// Las piezas de un pedido del historial (dueño: bruno; order-history.md «Piezas»). Internas de la sección; sin CSS.
//   OrderCard (02, 03): GCard as="li" (interaction link con href → navigate; button sin él → open; title = el código,
//     subtitle = la fecha en <time>, badge = statusText con el color de su estado; nunca solo color) › cuerpo: GText as="div"
//     body-sm › dl (dt labels.total · dd GPrice · dd las piezas) + la nota + [02] el seguimiento (GStepper informativo,
//     navigation="none", indicator="dot", la fecha de cada paso como texto) + slot `order` · actions: el transportista.
//   OrderStatus (01): GBadge soft sm con statusText y su color + la nota.
//   OrderDetail (01, slot `detail` de GTable): lo comprado (ul) + el transportista + slot `order` + al final «Ver el pedido
//     {reference}» (enlace → navigate o botón → open, #939).
import { defineComponent, h } from 'vue'
import { GBadge, GBtn, GCard, GStack, GStepper, GText } from '@grana/vue'
import { GPrice } from '@grana/vue/price'
import GbLink from '../common/link.js'
import { chosenWords, labelOf, listText } from '../common/order.js'
import { emitNavigate } from '../common/navigate.js'
import { has } from '../common/text.js'

const time = (d) => (d ? h('time', { datetime: d.datetime }, d.text) : null)
const tracking = (r, L, warn, emit) => (r.tracking ? h(GbLink, { link: { ...r.tracking, label: has(L.tracking) ? L.tracking : r.tracking.label }, item: r.order, external: L.external, what: 'orders.tracking', warn, onNavigate: (p) => emit('navigate', { ...p, item: r.order }) }) : null)
const totalDl = (r, L, locale) => h(GText, { as: 'div', size: 'body-sm' }, () => h('dl', null, [h('div', null, [
  h('dt', null, L.total || ''),
  h('dd', null, h(GPrice, { value: r.order.total, size: 'sm', locale })),
  r.count ? h('dd', null, r.count) : null
])]))

export const OrderStatus = ({ r }) => [h(GBadge, { variant: 'soft', size: 'sm', color: r.color }, () => r.order.statusText), has(r.order.note) ? h(GText, { size: 'body-sm' }, () => r.order.note) : null]

export const OrderCard = /* @__PURE__ */ defineComponent({
  name: 'GbOrderCard',
  props: {
    r: { type: Object, required: true },
    labels: { type: Object, default: () => ({}) },
    compact: { type: Boolean, default: false },
    headingLevel: { type: Number, required: true },
    priceLocale: { type: String, default: undefined },
    orderSlot: { type: Function, default: undefined },
    warn: { type: Function, required: true }
  },
  emits: ['open', 'navigate'],
  setup(props, { emit, attrs }) {
    return () => {
      const r = props.r
      const L = props.labels || {}
      const o = r.order
      const body = () => [
        totalDl(r, L, props.priceLocale),
        has(o.note) ? h(GText, { size: 'body-sm' }, () => o.note) : null,
        r.progress ? h(GStepper, { steps: r.progress.steps, modelValue: r.progress.current, navigation: 'none', orientation: 'horizontal', responsive: 'auto', indicator: 'dot', labels: L.stepper, 'aria-label': labelOf(L.progress, 'reference', r.code) || undefined }) : null,
        props.orderSlot ? props.orderSlot({ order: o }) : null
      ]
      const slots = { default: body }
      if (r.date) slots.subtitle = () => time(r.date)
      const t = props.compact ? null : tracking(r, L, props.warn, emit)
      if (t) slots.actions = () => t
      return h(GCard, {
        ...attrs,
        as: 'li',
        level: props.compact ? 'flat' : undefined,
        density: props.compact ? 'compact' : undefined,
        interaction: r.href ? 'link' : 'button',
        href: r.href || undefined,
        title: r.code,
        badge: o.statusText,
        badgeColor: r.color,
        headingLevel: props.headingLevel,
        onNavigate: (p) => emit('navigate', { ...p, item: o }),
        onActivate: ({ event }) => emit('open', { event, order: o })
      }, slots)
    }
  }
})

export const OrderDetail = /* @__PURE__ */ defineComponent({
  name: 'GbOrderDetail',
  props: {
    r: { type: Object, required: true },
    labels: { type: Object, default: () => ({}) },
    locale: { type: String, default: undefined },
    priceLocale: { type: String, default: undefined },
    orderSlot: { type: Function, default: undefined },
    warn: { type: Function, required: true }
  },
  emits: ['open', 'navigate'],
  setup(props, { emit }) {
    return () => {
      const r = props.r
      const L = props.labels || {}
      const name = labelOf(L.open, 'reference', r.code) || r.code
      const door = r.href
        ? h(GBtn, { variant: 'link', href: r.href, onClick: (event) => emitNavigate(emit, event, r.href, r.order, false) }, () => name)
        : h(GBtn, { variant: 'link', onClick: (event) => emit('open', { event, order: r.order }) }, () => name)
      return h(GStack, { gap: 'sm' }, () => [
        r.lines ? h(GStack, { as: 'ul', gap: 'sm' }, () => r.lines.filter((l) => l && has(l.name)).map((l, i) => h('li', { key: l.id ?? i }, h(GText, { as: 'div', size: 'body-sm' }, () => {
          const words = listText([...chosenWords(l.options), Number.isFinite(l.quantity) ? labelOf(L.count, 'count', l.quantity) : ''], props.locale)
          return [
            h('p', { lang: has(l.lang) ? l.lang : undefined }, l.name),
            h('p', null, [words, words ? ' ' : null, h(GPrice, { value: l.total, size: 'sm', locale: props.priceLocale })])
          ]
        })))) : null,
        tracking(r, L, props.warn, emit),
        props.orderSlot ? props.orderSlot({ order: r.order }) : null,
        // «Ver el pedido» va al final de la ficha (#939): la puerta de la fila es la de divulgación y se nombra con el código
        door
      ])
    }
  }
})
