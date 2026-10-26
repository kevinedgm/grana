// Una opinión (dueño: bruno; reviews.md «Anatomía de una opinión»): la `figure` de common/quote.js (la de Testimonials) con
// la puntuación en palabras antes de la cita (lo primero que se busca y se oye), la cita entera en su idioma, y en el pie el
// autor (con su lugar), la fecha en `<time datetime>`, la compra verificada, lo que compró y la fuente si viene de otro sitio
// (GbLink: externa con su marca y nombre, `navigate` si es interna). La respuesta de la tienda va DESPUÉS de la figura, fuera
// de ella (no es parte de la cita), con su autor y su fecha. Sin estrellas ni icono (§27 regla 5).
import { defineComponent, h } from 'vue'
import { GText } from '@grana/vue'
import GbLink from '../common/link.js'
import { quoteFigure } from '../common/quote.js'
import { has } from '../common/text.js'

const time = (d) => (d ? h('time', { datetime: d.datetime }, d.text) : null)

export default /* @__PURE__ */ defineComponent({
  name: 'GbReviewItem',
  props: {
    row: { type: Object, required: true },
    card: { type: Boolean, default: false },
    nameId: { type: String, default: undefined },
    labels: { type: Object, default: () => ({}) },
    quote: { type: Function, default: undefined },
    warn: { type: Function, required: true }
  },
  emits: ['navigate'],
  setup(props, { emit }) {
    return () => {
      const r = props.row
      const item = r.item
      const author = item.author
      const before = r.score || has(item.title)
        ? h(GText, { size: 'body-sm' }, () => [r.score || null, r.score && has(item.title) ? ' · ' : null, has(item.title) ? h('strong', { lang: r.lang }, item.title) : null])
        : null
      const body = props.quote ? props.quote({ item }) : r.paras.map((p, i) => h('p', { key: i }, p))
      const caption = [
        h('span', { id: props.nameId }, author.name),
        has(author.place) ? ` · ${author.place}` : null,
        r.date ? ' · ' : null,
        time(r.date),
        r.verified ? ` · ${r.verified}` : null,
        r.bought ? ` · ${r.bought.label} ${r.bought.value}` : null
      ]
      if (r.source) {
        caption.push(' — ', h('cite', null, has(r.source.href)
          ? h(GbLink, { link: { label: r.source.label, href: r.source.href, external: Boolean(r.source.external) }, item, size: 'sm', external: props.labels && props.labels.external, what: 'source', warn: props.warn, onNavigate: (x) => emit('navigate', x) })
          : r.source.label))
      }
      const out = [quoteFigure({ card: props.card, lang: r.lang, cite: r.cite, before, body, caption })]
      if (r.reply) {
        out.push(h(GText, { as: 'div', size: 'body-sm' }, () => [
          h('p', null, [h('strong', null, r.reply.label), r.reply.date ? ' · ' : null, time(r.reply.date)]),
          ...r.reply.paras.map((p, i) => h('p', { key: i }, p))
        ]))
      }
      return out
    }
  }
})
