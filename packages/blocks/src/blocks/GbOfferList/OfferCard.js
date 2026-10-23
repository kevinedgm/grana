// Una oferta como GCard, igual en las tres variantes salvo lo que su forma ignora (dueño: bruno; offer-list.md «Anatomía
// de una oferta»). Interno de la sección.
//   GCard (as según variante) · interaction link (href) / button (elige) / none · media: portada (01, 02) · eyebrow kind ·
//   title name (marca externa con su nombre) · description summary · badge · meta: facts (03: dos)
//   default: GText as="div" body-sm › ul de perks · GPrice (PriceSpec tal cual) · GText body-sm con el motivo si no está
//            disponible · slot `offer`
//   actions: GBtn outline «Elegir» (con href y disponible) · GBtn link «Ver {count} fotos» (dos o más fotos)
import { defineComponent, h } from 'vue'
import { GBtn, GCard, GIcon, GText } from '@grana/vue'
import { GPrice } from '@grana/vue/price'
import { imgAttrs } from '../common/media.js'

export default /* @__PURE__ */ defineComponent({
  name: 'GbOfferCard',
  props: {
    row: { type: Object, required: true },
    card: { type: Object, default: () => ({}) },
    headingLevel: { type: Number, required: true },
    external: { type: String, default: undefined },
    locale: { type: String, default: undefined },
    offerSlot: { type: Function, default: undefined }
  },
  emits: ['select', 'photos', 'navigate'],
  setup(props, { emit }) {
    return () => {
      const r = props.row
      const o = r.offer
      const slots = {}
      if (r.cover) slots.media = () => h('img', imgAttrs(r.cover))
      if (r.external) slots.title = () => [o.name, ' ', h(GIcon, { name: 'external-link', label: props.external || undefined })]
      const body = []
      if (r.perks.length) body.push(h(GText, { as: 'div', size: 'body-sm' }, () => h('ul', null, r.perks.map((p, i) => h('li', { key: i }, p)))))
      if (r.price) body.push(h(GPrice, { ...r.price, size: 'md', locale: props.locale }))
      if (!r.available.ok && r.available.reason) body.push(h(GText, { size: 'body-sm' }, () => r.available.reason))
      if (props.offerSlot) body.push(props.offerSlot({ offer: o }))
      if (body.length) slots.default = () => body
      const actions = []
      if (r.selectLabel) actions.push(h(GBtn, { variant: 'outline', size: 'sm', onClick: (event) => emit('select', event) }, () => r.selectLabel))
      if (r.photosLabel) actions.push(h(GBtn, { variant: 'link', size: 'sm', 'aria-haspopup': 'dialog', onClick: (event) => emit('photos', event) }, () => r.photosLabel))
      if (actions.length) slots.actions = () => actions
      return h(GCard, {
        ...props.card,
        ...r.card,
        eyebrow: o.kind || undefined,
        title: o.name,
        description: o.summary || undefined,
        badge: o.badge || undefined,
        meta: r.meta,
        headingLevel: props.headingLevel,
        // Idioma de la oferta si no es el de la página (3.1.2, #885, #891): a la raíz de la tarjeta que la pinta
        lang: o.lang || undefined,
        onNavigate: (p) => emit('navigate', { ...p, item: o }),
        onActivate: ({ event }) => emit('select', event)
      }, slots)
    }
  }
})
