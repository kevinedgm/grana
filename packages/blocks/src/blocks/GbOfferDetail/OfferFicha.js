// La ficha de la oferta, igual en las tres variantes (dueño: bruno; offer-detail.md «Piezas»). Interno de la sección.
//   GCard level="outlined" as="section" (title = labels.facts, al nivel de dentro)
//   meta (slot): GText as="div" body-sm › dl de `facts`; un dato con su espacio lleva al lado un GBtn variant="link"
//                «Ver {group}» (href="#{id}" en 01 y 03; en 02, botón que abre el visor en la primera foto del espacio).
//                El valor de `meta` de GCard es texto y no admite el enlace: por eso el slot con el dl de GText (#863).
//                O el slot `facts` (escape).
//   default: GStack gap="sm" › GText body-sm (ul de perks con aria-label = labels.perks; la línea de la consulta) · región
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
      if (props.factsSlot) slots.meta = () => props.factsSlot({ offer: d.o.value })
      else if (facts.length) {
        slots.meta = () => h(GText, { as: 'div', size: 'body-sm' }, () => h('dl', null, facts.flatMap((f) => [
          h('dt', { key: `t${f.key}` }, f.label),
          h('dd', { key: `d${f.key}` }, f.show
            ? [f.value, ' ', props.show === 'viewer'
                ? h(GBtn, { variant: 'link', size: 'sm', 'aria-haspopup': 'dialog', onClick: () => d.showGroup(f) }, () => f.show.label)
                : h(GBtn, { variant: 'link', size: 'sm', href: f.show.href }, () => f.show.label)]
            : f.value)
        ])))
      }
      const body = []
      const perks = d.perks.value
      const line = d.line.value
      if (perks.list.length || line) {
        body.push(h(GText, { as: 'div', size: 'body-sm' }, () => [
          perks.list.length ? h('ul', { 'aria-label': perks.label || undefined }, perks.list.map((p, i) => h('li', { key: i }, p))) : null,
          line ? h('p', null, line) : null
        ]))
      }
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
