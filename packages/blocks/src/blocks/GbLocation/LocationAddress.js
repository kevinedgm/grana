// La dirección del lugar, igual en las tres variantes (dueño: bruno; location.md «La dirección»). Interno de la sección.
// Texto real que se lee, se selecciona y se copia (1.1.1, 1.4.5), nunca solo imagen:
//   GText as="address" size="body-sm"
//   ├─ <p> name + líneas de `address` con <br>
//   ├─ GStack as="ul" gap="sm" [aria-label = labels.channels] › li › GbLink variant="link" (tel:, https://wa.me/…; los del
//   │  sistema y los externos no emiten `navigate`) + GText caption muted con el hint
//   └─ <p> labels.hours + líneas de `hours`
// El slot `address` sustituye todo lo de dentro (escape). Sin nada que decir, no pinta.
import { defineComponent, h } from 'vue'
import { GStack, GText } from '@grana/vue'
import GbLink from '../common/link.js'
import { has } from '../common/text.js'

const withBreaks = (list) => list.flatMap((l, i) => (i ? [h('br'), l] : [l]))

export default /* @__PURE__ */ defineComponent({
  name: 'GbLocationAddress',
  props: {
    name: { type: String, default: undefined },
    lines: { type: Array, default: () => [] },
    hours: { type: Object, default: () => ({ list: [], label: '' }) },
    channels: { type: Object, default: () => ({ list: [], label: '' }) },
    external: { type: String, default: undefined },
    addressSlot: { type: Function, default: undefined },
    warn: { type: Function, required: true }
  },
  emits: ['navigate'],
  setup(props, { emit }) {
    return () => {
      const head = [has(props.name) ? props.name : null, ...props.lines].filter(Boolean)
      const ch = props.channels.list
      const hrs = props.hours.list
      if (!props.addressSlot && !head.length && !ch.length && !hrs.length) return null
      return h(GText, { as: 'address', size: 'body-sm' }, () => (props.addressSlot ? props.addressSlot() : [
        head.length ? h('p', null, withBreaks(head)) : null,
        ch.length ? h(GStack, { as: 'ul', gap: 'sm', 'aria-label': props.channels.label || undefined }, () => ch.map(({ item, key }) => h('li', { key }, [
          h(GbLink, { link: item, icon: item.icon, variant: 'link', external: props.external, what: 'channels', warn: props.warn, onNavigate: (p) => emit('navigate', p) }),
          has(item.hint) ? h(GText, { size: 'caption', tone: 'muted' }, () => item.hint) : null
        ]))) : null,
        hrs.length ? h('p', null, withBreaks([...(props.hours.label ? [h('strong', null, props.hours.label)] : []), ...hrs])) : null
      ]))
    }
  }
})
