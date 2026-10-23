// Lo pedido y su total, igual en las tres variantes salvo lo que su forma ignora (dueño: bruno; booking-summary.md
// «Piezas»). Interno de la sección. Devuelve los hermanos (sin envoltorio: los coloca la primitiva de la variante):
//   GSummary (oferta + la consulta con describeQuery) o el slot `summary` · región de precios (UNA GPriceScope) ›
//   [02: GSection anidada `labels.lines` › GText as="div" body-sm › dl › div por línea (dt label · dd GPrice sm · dd nota)]
//   + GPrice (la tarifa con la cuenta = totals.total) · 02: GText body-sm con totals.note · la garantía (GText body-sm
//   muted con id, que describe la acción principal, #838).
import { defineComponent, h } from 'vue'
import { GSection, GSummary, GText } from '@grana/vue'
import { GPrice } from '@grana/vue/price'
import GbPriceRegion from '../common/priceRegion.js'
import { has } from '../common/text.js'

export default /* @__PURE__ */ defineComponent({
  name: 'GbBookingSummaryBody',
  props: {
    s: { type: Object, required: true },
    query: { type: Object, default: undefined },
    labels: { type: Object, default: () => ({}) },
    assurance: { type: String, default: undefined },
    summarySlot: { type: Function, default: undefined },
    // 'stack' (01, 02) o 'inline' (03)
    layout: { type: String, default: 'stack' },
    priceSize: { type: String, default: 'lg' },
    // 03: la garantía va fuera de la fila (debajo), para que la línea sea lo pedido, el total y la acción (#897)
    withAssurance: { type: Boolean, default: true }
  },
  setup(props) {
    return () => {
      const s = props.s
      const L = props.labels || {}
      const loc = s.region.value ? undefined : s.locale.value
      const out = []
      if (props.summarySlot) out.push(props.summarySlot({ query: props.query, offer: s.offer.value || undefined }))
      else if (s.summary.value) {
        const x = s.summary.value
        out.push(h(GSummary, { layout: props.layout, title: x.title, subtitle: x.subtitle, facts: x.facts }))
        if (x.line) out.push(h(GText, { size: 'body-sm' }, () => x.line))
      }
      const t = s.totals.value
      const p = s.price.value
      const lines = t ? t.lines : []
      if (p || lines.length) {
        out.push(h(GbPriceRegion, { region: s.region.value, labels: L, locale: s.locale.value }, () => {
          const kids = []
          if (lines.length) {
            const dl = h(GText, { as: 'div', size: 'body-sm' }, () => h('dl', null, lines.map((l, i) => h('div', { key: i }, [
              h('dt', null, l.label),
              h('dd', null, h(GPrice, { value: l.amount, size: 'sm', locale: loc })),
              has(l.note) ? h('dd', null, l.note) : null
            ]))))
            kids.push(has(L.lines) ? h(GSection, { title: L.lines }, () => dl) : dl)
          }
          if (p) kids.push(h(GPrice, { ...p, size: props.priceSize, locale: loc }))
          return kids
        }))
      }
      if (t && t.note) out.push(h(GText, { size: 'body-sm' }, () => t.note))
      if (props.withAssurance && s.assuranceId.value) out.push(h(GText, { id: s.assuranceId.value, size: 'body-sm', tone: 'muted' }, () => props.assurance))
      return out
    }
  }
})
