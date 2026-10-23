// La prueba de una promesa (dueño: bruno; trust.md «Su prueba»): un GBtn variant="link". Con `action.href` o el ancla de
// `policy`, enlace con `navigate` (GbLink: guarda de #505, sin `navigate` con `external`, C5, C6); sin `href`, botón con
// `activate`. `item` es el `Incentive` (§4, #833). Interno de la sección.
import { defineComponent, h } from 'vue'
import { GBtn, GIcon } from '@grana/vue'
import GbLink from '../common/link.js'
import { has } from '../common/text.js'

export default /* @__PURE__ */ defineComponent({
  name: 'GbTrustProof',
  props: {
    row: { type: Object, required: true },
    external: { type: String, default: undefined },
    warn: { type: Function, required: true }
  },
  emits: ['navigate', 'activate'],
  setup(props, { emit }) {
    return () => {
      const { proof, item } = props.row
      if (!proof) return null
      const a = proof.action
      if (a && !(a.href !== undefined && a.href !== null && a.href !== '')) {
        return h(GBtn, { variant: 'link', size: 'sm', onClick: (event) => emit('activate', { event, item }) }, {
          prepend: has(a.icon) ? () => h(GIcon, { name: a.icon }) : undefined,
          default: () => a.label
        })
      }
      const link = a ? { label: a.label, href: a.href, external: a.external } : proof.link
      return h(GbLink, { link, item, size: 'sm', icon: a && has(a.icon) ? a.icon : undefined, external: props.external, what: 'items.action', warn: props.warn, onNavigate: (p) => emit('navigate', p) })
    }
  }
})
