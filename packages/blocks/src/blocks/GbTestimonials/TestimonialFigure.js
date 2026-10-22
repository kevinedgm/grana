// Una opinión como `figure` (dueño: bruno; testimonials.md «Anatomía de una opinión», #821). Interno de la sección: lo
// usan las tres variantes para que la anatomía sea la misma.
//   figure
//   ├─ blockquote [lang] [cite = source.href]   ← párrafos de `quote` (o el slot `quote` de la sección), sin recortar
//   └─ figcaption
//      ├─ span#{nameId} author.name (, author.role)
//      └─ — cite › source.label; con `source.href`, GBtn variant="link" (GbActions: externa con su marca y nombre,
//         javascript: deshabilitado, C6)
import { defineComponent, h } from 'vue'
import GbActions from '../common/GbActions.js'
import { has } from '../common/text.js'

export default /* @__PURE__ */ defineComponent({
  name: 'GbTestimonialFigure',
  props: {
    row: { type: Object, required: true },
    nameId: { type: String, default: undefined },
    labels: { type: Object, default: () => ({}) },
    quote: { type: Function, default: undefined },
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
      return h('figure', null, [
        h('blockquote', { lang, cite }, body),
        h('figcaption', null, [...who, ...from])
      ])
    }
  }
})
