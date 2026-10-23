// Las piezas de una oferta (dueño: bruno; promo.md «Piezas»). Interno de la sección.
//   PromoDate: la frase de `labels.until` con la fecha en `<time datetime>`.
//   PromoCode: «Código OAXACA10» (el valor con translate="no", copiable a mano) + GBtn outline «Copiar código», que emite
//   `activate { event, item: code }` en el mismo gesto (la aplicación copia con navigator.clipboard y da su acuse).
import { defineComponent, h } from 'vue'
import { GBtn, GStack, GText } from '@grana/vue'

export const PromoDate = /* @__PURE__ */ defineComponent({
  name: 'GbPromoDate',
  props: { date: { type: Object, required: true }, as: { type: String, default: 'p' }, size: { type: String, default: undefined }, plain: { type: Boolean, default: false } },
  setup(props) {
    return () => {
      const d = props.date
      const content = [d.before, h('time', { datetime: d.datetime }, d.text), d.after]
      return props.plain ? h('span', null, content) : h(GText, { as: props.as, size: props.size }, () => content)
    }
  }
})

export const PromoCode = /* @__PURE__ */ defineComponent({
  name: 'GbPromoCode',
  props: { code: { type: Object, required: true }, size: { type: String, default: undefined }, plain: { type: Boolean, default: false } },
  emits: ['activate'],
  setup(props, { emit }) {
    return () => {
      const { code, copy } = props.code
      const text = [code.label, ' ', h('span', { translate: 'no' }, code.value)]
      const btn = copy ? h(GBtn, { variant: 'outline', size: 'sm', onClick: (event) => emit('activate', { event, item: code }) }, () => copy) : null
      if (props.plain) return h('span', null, [...text, btn ? ' ' : null, btn])
      return h(GStack, { orientation: 'horizontal', gap: 'sm', vertical: 'center' }, () => [h(GText, { as: 'p', size: props.size }, () => text), btn])
    }
  }
})
