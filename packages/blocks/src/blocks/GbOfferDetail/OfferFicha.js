// La ficha de la oferta, igual en las tres variantes (dueño: bruno; offer-detail.md «Piezas»). Interno de la sección.
//   GCard level="outlined" as="section" (title = labels.facts, al nivel de dentro)
//   default: GStack gap="sm" › GText as="div" body-sm (primero el dl de `facts`, #889 —un dato con su espacio lleva al
//            lado un GBtn variant="link" «Ver {group}»: href="#{id}" en 01 y 03; en 02, botón que abre el visor en la
//            primera foto del espacio— o el slot `facts`; luego el ul de perks con aria-label = labels.perks y la línea
//            de la consulta) · región
//            de precios (una GPriceScope) › GPrice size="lg" (PriceSpec tal cual; con consulta, la cuenta) · GText con el
//            motivo si no está disponible
//   actions: el slot `consult` O GBtn solid labels.book → book (disponible); nunca dos acciones principales
import { defineComponent, h } from 'vue'
import { GBtn, GCard, GStack, GText } from '@grana/vue'
import { GPrice } from '@grana/vue/price'
import GbPriceRegion from '../common/priceRegion.js'

export default /* @__PURE__ */ defineComponent({
  name: 'GbOfferFicha',
  props: {
    d: { type: Object, required: true },
    headingLevel: { type: Number, required: true },
    // 'anchor' (01, 03): enlace al ancla del espacio · 'viewer' (02): abre el visor de la tira
    show: { type: String, default: 'anchor' },
    consultSlot: { type: Function, default: undefined },
    factsSlot: { type: Function, default: undefined }
  },
  setup(props) {
    return () => {
      const d = props.d
      const facts = d.facts.value
      const slots = {}
      // Primero los datos (#889): un dl en la misma GText que los apoyos y la consulta, al principio del cuerpo (no en
      // `meta` de GCard, que es solo texto y sale tras el cuerpo, después del precio). O el slot `facts` (escape)
      const text = []
      if (props.factsSlot) text.push(props.factsSlot({ offer: d.o.value }))
      else if (facts.length) {
        text.push(h('dl', { key: 'facts' }, facts.flatMap((f) => [
          h('dt', { key: `t${f.key}` }, f.label),
          h('dd', { key: `d${f.key}` }, f.show
            ? [f.value, ' ', props.show === 'viewer'
                ? h(GBtn, { variant: 'link', size: 'sm', 'aria-haspopup': 'dialog', onClick: () => d.showGroup(f) }, () => f.show.label)
                : h(GBtn, { variant: 'link', size: 'sm', href: f.show.href }, () => f.show.label)]
            : f.value)
        ])))
      }
      const perks = d.perks.value
      const line = d.line.value
      if (perks.list.length) text.push(h('ul', { key: 'perks', 'aria-label': perks.label || undefined }, perks.list.map((p, i) => h('li', { key: i }, p))))
      if (line) text.push(h('p', { key: 'line' }, line))
      const body = []
      if (text.length) body.push(h(GText, { as: 'div', size: 'body-sm' }, () => text))
      const price = d.price.value
      if (price) body.push(h(GbPriceRegion, { region: d.region.value, labels: d.L.value, locale: d.locale.value }, () => h(GPrice, { ...price, size: 'lg', locale: d.region.value ? undefined : d.locale.value })))
      const av = d.available.value
      if (!av.ok && av.reason) body.push(h(GText, { size: 'body-sm' }, () => av.reason))
      if (body.length) slots.default = () => h(GStack, { gap: 'sm' }, () => body)
      if (props.consultSlot) slots.actions = () => props.consultSlot({ offer: d.o.value })
      else if (d.bookLabel.value) slots.actions = () => h(GBtn, { variant: 'solid', onClick: (event) => d.book(event) }, () => d.bookLabel.value)
      return h(GCard, { as: 'section', level: 'outlined', title: d.need('facts', 'título de la ficha') || undefined, headingLevel: props.headingLevel }, slots)
    }
  }
})
