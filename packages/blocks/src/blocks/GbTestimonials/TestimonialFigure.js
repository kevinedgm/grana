// Una opinión como `figure` (dueño: bruno; testimonials.md «Anatomía de una opinión», #821). Interno de la sección: lo
// usan las tres variantes para que la anatomía sea la misma.
//   GText as="figure" (B-L5; size body-sm en tarjeta)
//   ├─ GText as="blockquote" [lang] [cite = source.href]   ← párrafos de `quote` (o el slot `quote` de la sección), sin recortar
//   └─ GText as="figcaption" size="body-sm" tone="muted"
//      ├─ span#{nameId} author.name (, author.role)
//      └─ — cite › source.label; con `source.href`, GBtn variant="link" (GbActions: externa con su marca y nombre,
//         javascript: deshabilitado, C6)
import { defineComponent, h } from 'vue'
import { GText } from '@grana/vue'
import GbActions from '../common/GbActions.js'
import { has } from '../common/text.js'

export default /* @__PURE__ */ defineComponent({
  name: 'GbTestimonialFigure',
  props: {
    row: { type: Object, required: true },
    nameId: { type: String, default: undefined },
    labels: { type: Object, default: () => ({}) },
    quote: { type: Function, default: undefined },
    // En tarjeta (01 y la destacada de 02) el contexto es body-sm (el cuerpo de GCard); en lista y panel, body (B-L5)
    card: { type: Boolean, default: false },
    warn: { type: Function, required: true }
  },
  emits: ['navigate'],
  setup(props, { emit }) {
    return () => {
      const { item, paras, source, sourceAction, cite, lang } = props.row
      const author = item.author
      const body = props.quote ? props.quote({ item }) : paras.map((p, i) => h('p', { key: i }, p))
      const who = [h('span', { id: props.nameId }, author.name), has(author.role) ? `, ${author.role}` : null]
      const from = source
        ? [' — ', h('cite', null, sourceAction
            ? h(GbActions, {
                actions: sourceAction,
                variants: ['link'],
                external: props.labels && props.labels.external,
                warn: props.warn,
                onNavigate: (p) => emit('navigate', { ...p, item })
              })
            : source.label)]
        : []
      const size = props.card ? 'body-sm' : 'body'
      return h(GText, { as: 'figure', size }, () => [
        h(GText, { as: 'blockquote', size, lang, cite }, () => body),
        h(GText, { as: 'figcaption', size: 'body-sm', tone: 'muted' }, () => [...who, ...from])
      ])
    }
  }
})
