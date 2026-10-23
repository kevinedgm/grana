// Los platos de un tiempo como lista de definiciones (dueño: bruno; menu.md «Un plato», #863). Interno de la sección.
//   GText as="div" (size) › dl › div por plato
//   ├─ dt [lang] · name                         (peso de término, #863)
//   ├─ dd · GPrice size="sm"                    (PriceSpec tal cual)
//   ├─ dd · description
//   ├─ dd · GStack as="ul" horizontal gap="sm" [aria-label=labels.tags] › li › GTag size="sm" (estáticas y neutras)
//   └─ dd · lo agotado con su motivo
// Orden: nombre → precio → descripción → avisos (BK-L3: el precio va debajo del nombre, no al final del renglón). El
// slot `item` sustituye a los dd de un plato.
import { defineComponent, h } from 'vue'
import { GStack, GText } from '@grana/vue'
import { GPrice } from '@grana/vue/price'
import { GTag } from '@grana/vue/tag'
import { has } from '../common/text.js'

/** Lo de un plato después del nombre: precio, descripción, avisos, agotado. */
function dishParts(d, labels) {
  const it = d.item
  return {
    price: d.price ? h(GPrice, { ...d.price, size: 'sm' }) : null,
    description: has(it.description) ? it.description : null,
    tags: d.tags.length ? h(GStack, { as: 'ul', orientation: 'horizontal', gap: 'sm', 'aria-label': has(labels.tags) ? labels.tags : undefined }, () => d.tags.map((t, i) => h('li', { key: i }, h(GTag, { label: t, size: 'sm' })))) : null,
    unavailable: !d.available.ok && d.available.reason ? d.available.reason : null
  }
}

export default /* @__PURE__ */ defineComponent({
  name: 'GbMenuDishes',
  props: {
    row: { type: Object, required: true },
    labels: { type: Object, default: () => ({}) },
    size: { type: String, default: 'body' },
    itemSlot: { type: Function, default: undefined }
  },
  setup(props) {
    return () => h(GText, { as: 'div', size: props.size }, () => h('dl', null, props.row.items.map((d) => {
      const name = h('dt', { lang: d.lang }, d.item.name)
      if (props.itemSlot) return h('div', { key: d.key }, [name, h('dd', null, props.itemSlot({ item: d.item, section: props.row.section }))])
      const p = dishParts(d, props.labels)
      return h('div', { key: d.key }, [
        name,
        p.price ? h('dd', null, p.price) : null,
        p.description ? h('dd', null, p.description) : null,
        p.tags ? h('dd', null, p.tags) : null,
        p.unavailable ? h('dd', null, p.unavailable) : null
      ])
    })))
  }
})
