// El calendario con precio por día, igual en 01 y 03 (dueño: bruno; availability.md «Del dato al calendario»). Interno de
// la sección. GPriceScope (la región; la leyenda dice la moneda y las celdas, solo cifras) › GDatePicker inline (`range`
// en stay, `single` en el resto; months="auto"; reglas, noches, dayDescription; slot `day` con GPrice xs display="none"
// cents="never" del precio del día, o el slot `day` del bloque). La elección es de la variante (`v-model`).
// `select` lleva el gesto que completó la elección: GDatePicker no da el evento con `update:modelValue`, así que el
// calendario guarda el último clic o tecla en fase de captura (antes de que el día lo procese) en un div propio.
import { defineComponent, h } from 'vue'
import { GDatePicker } from '@grana/vue'
import { GPrice } from '@grana/vue/price'
import GbPriceRegion from '../common/priceRegion.js'

export default /* @__PURE__ */ defineComponent({
  name: 'GbAvailabilityCalendar',
  props: {
    a: { type: Object, required: true },
    min: { type: String, default: undefined },
    max: { type: String, default: undefined },
    labels: { type: Object, default: () => ({}) },
    daySlot: { type: Function, default: undefined },
    // false: la región la pone la variante alrededor de más cosas (03: el calendario y el total en una sola GPriceScope)
    scoped: { type: Boolean, default: true }
  },
  emits: ['change'],
  setup(props, { emit }) {
    let last = null
    const remember = (event) => { last = event }
    return () => {
      const a = props.a
      const day = (scope) => {
        if (props.daySlot) return props.daySlot({ ...scope, date: scope.date, day: a.dayOf(scope.date) })
        const value = a.cellPrice(scope.date)
        return value ? h(GPrice, { value, size: 'xs', display: 'none', cents: 'never' }) : null
      }
      const picker = () => h(GDatePicker, {
        inline: true,
        mode: a.stay.value ? 'range' : 'single',
        months: 'auto',
        min: props.min,
        max: props.max,
        locale: a.locale.value,
        disabledDates: a.disabledDates,
        disabledNights: a.stay.value ? a.disabledNights : undefined,
        ...a.nights.value,
        dayDescription: a.dayDescription,
        labels: props.labels.datePicker,
        modelValue: a.current.value,
        'onUpdate:modelValue': (v) => { const ev = last; last = null; emit('change', { event: ev, value: v }) }
      }, { day })
      // El gesto se guarda en un envoltorio propio: en `inline`, GDatePicker no pasa las escuchas de $attrs a su superficie
      const caught = () => h('div', { onClickCapture: remember, onKeydownCapture: remember }, picker())
      return props.scoped ? h(GbPriceRegion, { region: a.region.value, labels: props.labels, locale: a.locale.value }, caught) : caught()
    }
  }
})
