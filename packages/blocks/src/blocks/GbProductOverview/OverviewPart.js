// GbProductOverview · el cuerpo de un apartado del texto largo (dueño: bruno; product-overview.md «El texto largo»): la
// descripción en GText as="div" (párrafos o el slot `description`), la ficha en GText as="div" size="body-sm" › dl (#863) y
// un apartado con sus párrafos y su lista (o el slot `section-{id}`).
import { defineComponent, h } from 'vue'
import { GText } from '@grana/vue'

export default /* @__PURE__ */ defineComponent({
  name: 'GbOverviewPart',
  props: {
    part: { type: Object, required: true },
    t: { type: Object, required: true },
    slots: { type: Object, default: () => ({}) }
  },
  setup(props) {
    return () => {
      const { part, t, slots } = props
      if (part.kind === 'details') return h(GText, { as: 'div' }, () => (slots.description ? slots.description() : t.description.value.map((x, i) => h('p', { key: i }, x))))
      if (part.kind === 'facts') return h(GText, { as: 'div', size: 'body-sm' }, () => h('dl', null, t.facts.value.flatMap((f, i) => [h('dt', { key: `t${i}` }, f.label), h('dd', { key: `d${i}` }, f.value)])))
      const s = part.s
      const custom = s.id && slots[`section-${s.id}`]
      return h(GText, { as: 'div' }, () => (custom ? custom({ section: s.section }) : [
        ...s.paras.map((x, i) => h('p', { key: i }, x)),
        s.items.length ? h('ul', { key: 'items' }, s.items.map((x, i) => h('li', { key: i }, x))) : null
      ]))
    }
  }
})
