// Lo confirmado, igual en las tres variantes (dueño: bruno; confirmation.md «Anatomía de lo confirmado»). Interno de la
// sección. Devuelve los hermanos (sin envoltorio: los coloca la primitiva de la variante):
//   GMetric (el código, primero tras el título) · GSummary layout="stack" (oferta + la consulta con describeQuery) o el
//   slot `summary` · región de precios › GPrice (el total de la aplicación) + GText as="div" › dl de líneas (01, 02) ·
//   GText body-sm con totals.note · canales: GStack as="ul" horizontal gap="sm" [aria-label] › li › GBtn outline (icono,
//   label) + GText caption muted con el hint.
import { defineComponent, h } from 'vue'
import { GMetric, GStack, GSummary, GText } from '@grana/vue'
import { GPrice } from '@grana/vue/price'
import GbLink from '../common/link.js'
import GbPriceRegion from '../common/priceRegion.js'
import { has } from '../common/text.js'

export default /* @__PURE__ */ defineComponent({
  name: 'GbConfirmationBody',
  props: {
    c: { type: Object, required: true },
    query: { type: Object, default: undefined },
    labels: { type: Object, default: () => ({}) },
    summarySlot: { type: Function, default: undefined },
    warn: { type: Function, required: true }
  },
  emits: ['navigate'],
  setup(props, { emit }) {
    return () => {
      const c = props.c
      const L = props.labels || {}
      const out = []
      if (c.code.value) out.push(h(GMetric, { value: c.code.value.code, label: c.code.value.label, size: 'lg' }))
      if (props.summarySlot) out.push(props.summarySlot({ query: props.query, offer: props.c.offer.value }))
      else if (c.summary.value) {
        const s = c.summary.value
        out.push(h(GSummary, { layout: 'stack', title: s.title, subtitle: s.subtitle, facts: s.facts }))
        if (s.line) out.push(h(GText, { size: 'body-sm' }, () => s.line))
      }
      const t = c.totals.value
      if (t) {
        const lead = L.price && has(L.price.total) ? L.price.total : undefined
        out.push(h(GbPriceRegion, { region: c.region.value, labels: L, locale: c.locale.value }, () => h(GStack, { gap: 'sm' }, () => [
          h(GPrice, { value: t.total.value, unit: t.total.label, lead, size: 'lg', locale: c.region.value ? undefined : c.locale.value }),
          t.lines.length ? h(GText, { as: 'div', size: 'body-sm' }, () => h('dl', null, t.lines.flatMap((l, i) => [
            h('dt', { key: `t${i}` }, l.label),
            h('dd', { key: `d${i}` }, [h(GPrice, { value: l.amount, size: 'sm', locale: c.region.value ? undefined : c.locale.value }), has(l.note) ? ` · ${l.note}` : null])
          ]))) : null
        ])))
        if (t.note) out.push(h(GText, { size: 'body-sm' }, () => t.note))
      }
      const ch = c.channels.value
      if (ch.length) {
        out.push(h(GStack, { as: 'ul', orientation: 'horizontal', gap: 'sm', 'aria-label': has(L.channels) ? L.channels : undefined }, () => ch.map(({ item, key }) => h('li', { key }, [
          h(GbLink, { link: item, icon: item.icon, variant: 'outline', external: L.external, what: 'channels', warn: props.warn, onNavigate: (p) => emit('navigate', p) }),
          has(item.hint) ? h(GText, { size: 'caption', tone: 'muted' }, () => item.hint) : null
        ]))))
      }
      return out
    }
  }
})
