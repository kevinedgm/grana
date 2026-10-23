// El cuerpo de un apartado (`OfferSection`): sus párrafos y su lista, o el slot `section-{id}` (dueño: bruno;
// offer-detail.md «Texto largo»). Interno de la sección: GText as="div" › p… + ul de `items`.
import { defineComponent, h } from 'vue'
import { GText } from '@grana/vue'

export default /* @__PURE__ */ defineComponent({
  name: 'GbOfferText',
  props: {
    s: { type: Object, required: true },
    slots: { type: Object, default: () => ({}) }
  },
  setup(props) {
    return () => {
      const s = props.s
      const custom = s.id && props.slots[`section-${s.id}`]
      return h(GText, { as: 'div' }, () => (custom ? custom({ section: s.section }) : [
        ...s.paras.map((p, i) => h('p', { key: i }, p)),
        s.items.length ? h('ul', { key: 'items' }, s.items.map((t, i) => h('li', { key: i }, t))) : null
      ]))
    }
  }
})
