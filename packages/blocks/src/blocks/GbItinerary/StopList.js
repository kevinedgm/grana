// Las paradas de un día en orden, igual en 01 y en el panel de 02 (dueño: bruno; itinerary.md «Variantes»). Interno de la
// sección.
//   GStack as="ol" gap="sm" › GCard as="li" level="flat" orientation="auto" mediaPosition="start" por parada:
//   eyebrow = <time datetime="HH:mm"> (y –<time> del fin), title, description, media = <img>, badge = labels.now/next,
//   aria-current="time" en la parada en curso; cuerpo: el slot `stop` o GText body-sm muted con `place`.
import { defineComponent, h } from 'vue'
import { GCard, GStack, GText } from '@grana/vue'
import { imgAttrs } from '../common/media.js'
import { has } from '../common/text.js'

/** Una hora de parada: <time datetime> si es HH:mm; si no (I2), el texto tal cual. */
const timeNode = (t) => (t.datetime ? h('time', { datetime: t.datetime }, t.text) : t.text)

export default /* @__PURE__ */ defineComponent({
  name: 'GbItineraryStops',
  props: {
    day: { type: Object, required: true },
    headingLevel: { type: Number, required: true },
    markOf: { type: Function, required: true },
    badge: { type: Function, required: true },
    stopSlot: { type: Function, default: undefined }
  },
  setup(props) {
    return () => h(GStack, { as: 'ol', gap: 'sm' }, () => props.day.stops.map((s) => {
      const m = props.markOf(props.day.key, s.key)
      const slots = {}
      if (s.time) slots.eyebrow = () => (s.until ? [timeNode(s.time), '–', timeNode(s.until)] : [timeNode(s.time)])
      if (s.media) slots.media = () => h('img', imgAttrs(s.media))
      if (props.stopSlot) slots.default = () => props.stopSlot({ stop: s.stop, day: props.day.day, now: m === 'now', next: m === 'next' })
      else if (has(s.stop.place)) slots.default = () => h(GText, { size: 'body-sm', tone: 'muted' }, () => s.stop.place)
      const text = props.badge(m)
      return h(GCard, {
        key: s.key,
        as: 'li',
        level: 'flat',
        orientation: 'auto',
        mediaPosition: 'start',
        title: s.stop.title,
        description: has(s.stop.description) ? s.stop.description : undefined,
        headingLevel: props.headingLevel,
        badge: text || undefined,
        'aria-current': m === 'now' ? 'time' : undefined
      }, slots)
    }))
  }
})
