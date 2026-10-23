// Región de precios de un bloque de Booking (dueño: bruno; _comun.md §15 regla 4, #772): UNA GPriceScope alrededor de la
// lista o la tarjeta (la moneda se dice una vez) con `labels.price`; sin región válida (K3, avisado por `checkRegion`), el
// contenido va tal cual y cada GPrice dice su código. Interno del paquete.
import { defineComponent, h } from 'vue'
import { GPriceScope } from '@grana/vue/price'
import { regionAttrs } from './price.js'

export default /* @__PURE__ */ defineComponent({
  name: 'GbPriceRegion',
  props: {
    // La `PriceRegion` ya comprobada (checkRegion) o null
    region: { type: Object, default: null },
    labels: { type: Object, default: undefined },
    locale: { type: String, default: undefined },
    as: { type: String, default: undefined }
  },
  setup(props, { slots }) {
    return () => (props.region
      ? h(GPriceScope, { ...regionAttrs(props.region, props.labels, props.locale), as: props.as }, slots)
      : slots.default && slots.default())
  }
})
