// Un pedido leído como su recibo (dueño: bruno; order-summary.md «Piezas», checkout.md «El pedido»). Interno del paquete:
// lo usan GbOrderSummary (01 Tarjeta, 02 El recibo) y GbCheckout (el pedido de 01 a 03 es la pieza de 02), para que el
// pedido diga lo mismo en el pago y en la confirmación. No calcula nada (§27 regla 4). Devuelve los hermanos, sin
// envoltorio (los coloca la primitiva de quien la usa):
//   GMetric (el código, PRIMERO: lo que pide el servicio al cliente, #873) · [02] GText body-sm › time (placedAt, en la
//   zona de la tienda) · GStack as="ul" gap="sm" (aria-label = labels.lines) › li › GText as="div" body-sm › [02: GAvatar
//   square decorativo con la miniatura] + p nombre (GBtn link con href → navigate, lang) + p «Color Grana, 2 piezas» y GPrice
//   sm del total de la línea + slot `line` · el desglose (common/totals.js: full en 02, solo el total en 01) con el pago
//   como par · [02] GText as="address" body-sm (label, líneas, método, entrega en time, nota) · [02] GText body-sm con note.
// `optionsText`: la elección en palabras con Intl.ListFormat («Talla M, Color Blanco»): sin separadores escritos en el bloque.
import { defineComponent, h } from 'vue'
import { GAvatar, GMetric, GStack, GText } from '@grana/vue'
import { GPrice } from '@grana/vue/price'
import GbLink from './link.js'
import { entries } from './list.js'
import { dateTime, fill } from './locale.js'
import GbTotals from './totals.js'
import { has } from './text.js'

const lists = new Map()
/** Una lista de textos unida como dice el idioma («Color Grana, 2 piezas»); sin idioma resuelto, con coma. */
export function listText(parts, locale) {
  const xs = parts.filter(has)
  if (!xs.length) return ''
  const k = locale || ''
  if (!lists.has(k)) { let f = null; try { f = locale ? new Intl.ListFormat(locale, { style: 'narrow', type: 'unit' }) : null } catch {} lists.set(k, f) }
  const f = lists.get(k)
  return f ? f.format(xs) : xs.join(', ')
}

/** La elección que viaja (§27 regla 3), dicha: «Color Grana» por cada ChosenOption, tal como llegó. */
export const chosenWords = (options) => (Array.isArray(options) ? options.filter((o) => o && has(o.label) && has(o.value)).map((o) => `${o.label} ${o.value}`) : [])

/** Un texto de `labels` que es plantilla con `{name}` o función; '' si falta. */
export const labelOf = (t, key, value) => (typeof t === 'function' ? String(t(value)) : has(t) ? fill(t, { [key]: value }) : '')

export default /* @__PURE__ */ defineComponent({
  name: 'GbOrderBody',
  props: {
    order: { type: Object, required: true },
    // 'card' (Order summary 01: código, lo comprado y el total) o 'receipt' (02 y Checkout: todo, en el orden del recibo)
    form: { type: String, default: 'receipt' },
    labels: { type: Object, default: () => ({}) },
    locale: { type: String, default: undefined },
    timeZone: { type: String, default: undefined },
    // Sin región de precios: el idioma de cada GPrice
    priceLocale: { type: String, default: undefined },
    lineSlot: { type: Function, default: undefined },
    warn: { type: Function, required: true }
  },
  emits: ['navigate'],
  setup(props, { emit }) {
    return () => {
      const o = props.order
      const L = props.labels || {}
      const warn = props.warn
      const receipt = props.form === 'receipt'
      const out = []
      const ref = o.reference && has(o.reference.code) ? o.reference : null
      if (ref) {
        const label = has(ref.label) ? ref.label : L.reference
        try { if (process.env.NODE_ENV !== 'production' && !has(label)) warn('C5:reference', 'order.reference sin label y falta labels.reference («Número de pedido»): el código va sin rótulo (C5).') } catch {}
        out.push(h(GMetric, { key: 'ref', label: has(label) ? label : undefined, value: ref.code, size: 'lg' }))
      }
      if (receipt && has(o.placedAt)) {
        const d = dateTime(o.placedAt, { locale: props.locale, timeZone: props.timeZone })
        const t = d ? labelOf(L.placedAt, 'date', d.text) : ''
        try { if (process.env.NODE_ENV !== 'production' && d && !t) warn('C5:placedAt', 'hay placedAt y falta labels.placedAt («Pedido el {date}»): se dice solo la fecha (C5).') } catch {}
        if (d) out.push(h(GText, { key: 'placed', size: 'body-sm' }, () => h('time', { datetime: d.datetime }, t || d.text)))
      }
      const lines = entries(o.lines, ['name'], 'order.lines', warn)
      if (lines.length) {
        try { if (process.env.NODE_ENV !== 'production' && !has(L.lines)) warn('C5:lines', 'falta labels.lines («Lo que compraste»): la lista de lo comprado va sin nombre (C5).') } catch {}
        try { if (process.env.NODE_ENV !== 'production' && L.quantity === undefined) warn('C5:quantity', 'falta labels.quantity («{count} piezas»): las líneas van sin su cantidad (C5).') } catch {}
        out.push(h(GStack, { key: 'lines', as: 'ul', gap: 'sm', 'aria-label': has(L.lines) ? L.lines : undefined }, () => lines.map(({ item: l, key }) => {
          const name = has(l.href)
            ? h(GbLink, { link: { label: l.name, href: l.href, lang: l.lang }, item: l, size: 'sm', external: L.external, what: 'order.lines', warn, onNavigate: (p) => emit('navigate', p) })
            : has(l.lang) ? h('span', { lang: l.lang }, l.name) : l.name
          const words = listText([...chosenWords(l.options), Number.isFinite(l.quantity) ? labelOf(L.quantity, 'count', l.quantity) : ''], props.locale)
          const thumb = receipt && l.photo && has(l.photo.src) ? h(GAvatar, { src: l.photo.thumb || l.photo.src, name: l.name, shape: 'square', size: 'lg' }) : null
          return h('li', { key }, h(GText, { as: 'div', size: 'body-sm' }, () => [
            thumb,
            h('p', null, [name]),
            h('p', null, [words, words ? ' ' : null, h(GPrice, { value: l.total, size: 'sm', locale: props.priceLocale })]),
            props.lineSlot ? props.lineSlot({ line: l }) : null
          ]))
        })))
      }
      const pay = receipt && o.payment && has(o.payment.label) && has(o.payment.value) ? [o.payment] : []
      out.push(h(GbTotals, { key: 'totals', totals: o.totals, labels: L, form: receipt ? 'full' : 'total', pairs: pay, locale: props.priceLocale, warn }))
      const s = o.shipping
      if (receipt && s && has(s.label)) {
        const d = has(s.date) ? dateTime(s.date, { locale: props.locale, timeZone: props.timeZone }) : null
        const t = d ? labelOf(L.delivery, 'date', d.text) : ''
        try { if (process.env.NODE_ENV !== 'production' && d && !t) warn('C5:delivery', 'shipping.date sin labels.delivery («Llega el {date}»): se dice solo la fecha (C5).') } catch {}
        const lineList = Array.isArray(s.address) ? s.address.filter(has) : []
        out.push(h(GText, { key: 'ship', as: 'address', size: 'body-sm' }, () => [
          h('p', null, s.label),
          lineList.length ? h('p', null, lineList.flatMap((x, i) => (i ? [h('br'), x] : [x]))) : null,
          has(s.method) ? h('p', null, s.method) : null,
          d ? h('p', null, h('time', { datetime: d.datetime }, t || d.text)) : null,
          has(s.note) ? h('p', null, s.note) : null
        ]))
      }
      if (receipt && has(o.note)) out.push(h(GText, { key: 'note', size: 'body-sm' }, () => o.note))
      return out
    }
  }
})
