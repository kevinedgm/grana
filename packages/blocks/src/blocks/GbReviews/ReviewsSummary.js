// El resumen de las opiniones (dueño: bruno; reviews.md «El resumen» y «La distribución»): GMetric («Calificación media,
// 4,6 de 5, 128 opiniones») o, sin opiniones, `labels.noReviews` en texto; con `distribution` (02), una lista con nombre
// (GStack as="ul" gap="sm", aria-label = labels.distribution) de max a 1 con todas las filas: el texto de la fila y, en un
// div aria-hidden, un GProgress decorativo (una distribución no es un progreso: role="progressbar" mentiría, EC-L2).
import { defineComponent, h } from 'vue'
import { GMetric, GProgress, GStack, GText } from '@grana/vue'

export default /* @__PURE__ */ defineComponent({
  name: 'GbReviewsSummary',
  props: {
    rv: { type: Object, required: true },
    distribution: { type: Boolean, default: false }
  },
  setup(props) {
    return () => {
      const m = props.rv.metric.value
      const out = []
      if (m && m.empty !== undefined) { if (m.empty) out.push(h(GText, { size: 'body-sm', tone: 'muted' }, () => m.empty)) }
      else if (m) out.push(h(GMetric, { label: m.label, value: m.value, unit: m.unit || undefined, context: m.context || undefined }))
      const d = props.distribution ? props.rv.distribution.value : null
      if (d) {
        out.push(h(GStack, { as: 'ul', gap: 'sm', 'aria-label': d.name || undefined }, () => d.rows.map((row) => h('li', { key: row.value }, [
          h(GText, { size: 'body-sm' }, () => row.text),
          h('div', { 'aria-hidden': 'true' }, [h(GProgress, { value: row.count, max: d.total, label: row.text, showLabel: false, showValue: false, size: 'sm', color: 'neutral' })])
        ]))))
      }
      return out
    }
  }
})
