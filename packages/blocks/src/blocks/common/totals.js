// El desglose y el total de un carrito o un pedido (dueño: bruno; cart.md «El resumen», order-summary.md «El desglose y
// el total», _comun.md §27 regla 4, §29). Interno del paquete: lo comparten Cart, Order summary y Checkout (que pinta el
// pedido con la pieza de Order summary) para que el total se lea igual en las tres. **No suma nada**: pinta los `Totals`
// que recibe, vengan de `cartTotals` o del servidor de la aplicación.
//   GText as="div" size="body-sm" › dl
//   ├─ por línea de `totals.lines` que no está incluida: div › dt label · dd GPrice sm (amount; null → labels.pending) · dd note
//   │    (form "total": solo las de amount null, que se dicen: «Envío · Se calcula en el siguiente paso»)
//   ├─ el total, ÚLTIMO par de lo que se suma: div › dt labels.total · dd GPrice (totals.total.value) · dd totals.total.label
//   ├─ las incluidas (`included`, el IVA de los precios de México): div › dt label · dd GPrice sm, después del total
//   └─ `pairs`: pares de texto de la aplicación ({ label, value }: el pago de Order summary 02)
// Sin la forma «`total` sola» de GPrice (#883): el total se nombra por su término.
import { defineComponent, h } from 'vue'
import { GText } from '@grana/vue'
import { GPrice } from '@grana/vue/price'
import { has } from './text.js'

/** Las líneas de `Totals` válidas (con `label`), separadas en las que se suman y las incluidas. */
export function totalsParts(totals) {
  const lines = totals && Array.isArray(totals.lines) ? totals.lines.filter((l) => l && has(l.label)) : []
  return { added: lines.filter((l) => !l.included), included: lines.filter((l) => l.included), pending: lines.some((l) => !l.included && l.amount === null) }
}

/** `totals.total` válido (con `value`), o null. */
export const totalOf = (totals) => (totals && totals.total && typeof totals.total === 'object' && 'value' in totals.total ? totals.total : null)

export default /* @__PURE__ */ defineComponent({
  name: 'GbTotals',
  props: {
    totals: { type: Object, default: null },
    // labels.total (término del total) y labels.pending (línea de amount null)
    labels: { type: Object, default: () => ({}) },
    // 'full': el desglose entero; 'total': solo el total y lo que falta por calcular (Cart 03, Order summary 01)
    form: { type: String, default: 'full' },
    totalSize: { type: String, default: 'lg' },
    pairs: { type: Array, default: () => [] },
    // Sin región de precios: el idioma de cada GPrice (con región lo hereda de GPriceScope)
    locale: { type: String, default: undefined },
    warn: { type: Function, required: true }
  },
  setup(props) {
    return () => {
      const L = props.labels || {}
      const total = totalOf(props.totals)
      const parts = totalsParts(props.totals)
      const added = props.form === 'full' ? parts.added : parts.added.filter((l) => l.amount === null)
      const price = (value, size) => h(GPrice, { value, size, locale: props.locale })
      const amount = (l) => {
        if (l.amount !== null) return price(l.amount, 'sm')
        if (has(L.pending)) return L.pending
        try { if (process.env.NODE_ENV !== 'production') props.warn('C5:pending', 'una línea de totales con amount null y falta labels.pending («Se calcula en el siguiente paso»): se pinta sin ese texto (C5).') } catch {}
        return null
      }
      const pair = (key, dt, dds) => h('div', { key }, [h('dt', null, dt), ...dds.filter((d) => d !== null && d !== undefined && d !== '').map((d) => h('dd', null, d))])
      const rows = added.map((l, i) => pair(`a${i}`, l.label, [amount(l), has(l.note) ? l.note : null]))
      if (total) {
        try { if (process.env.NODE_ENV !== 'production' && !has(L.total)) props.warn('C5:total', 'hay total y falta labels.total («Total»): el par del total va sin término (C5).') } catch {}
        rows.push(pair('total', has(L.total) ? L.total : '', [price(total.value, props.totalSize), has(total.label) ? total.label : null]))
      }
      if (props.form === 'full') parts.included.forEach((l, i) => rows.push(pair(`i${i}`, l.label, [l.amount === null ? amount(l) : price(l.amount, 'sm'), has(l.note) ? l.note : null])))
      for (const [i, p] of (Array.isArray(props.pairs) ? props.pairs : []).entries()) if (p && has(p.label) && has(p.value)) rows.push(pair(`p${i}`, p.label, [p.value]))
      return rows.length ? h(GText, { as: 'div', size: 'body-sm' }, () => h('dl', null, rows)) : null
    }
  }
})
