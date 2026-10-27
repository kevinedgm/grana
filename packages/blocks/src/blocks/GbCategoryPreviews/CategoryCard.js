// Una categoría como GCard (dueño: bruno; category-previews.md «Anatomía de una categoría»). Interno de la sección.
//   GCard · interaction link (category.href) / none (vacía: count 0, o href javascript:, C6)
//   media: <img> de category.media (01 top; 02 background con el velo de GCard; 03 sin media)
//   title: el nombre (lang si lo trae) · el título lo compone la aplicación (labels.count / labels.empty con {name}, #928), DENTRO del título: GCard nombra su
//          enlace solo con el título, y la cuenta se lee en el enlace («Barro negro · 24 piezas», #917)
//   description: category.description (01, 03) · default: slot `category` · marca externa con su nombre en el título
import { defineComponent, h } from 'vue'
import { GCard, GIcon } from '@grana/vue'
import { imgAttrs } from '../common/media.js'

export default /* @__PURE__ */ defineComponent({
  name: 'GbCategoryCard',
  props: {
    row: { type: Object, required: true },
    card: { type: Object, default: () => ({}) },
    headingLevel: { type: Number, required: true },
    external: { type: String, default: undefined },
    categorySlot: { type: Function, default: undefined }
  },
  emits: ['navigate'],
  setup(props, { emit }) {
    return () => {
      const r = props.row
      const c = r.category
      const slots = {}
      if (r.media) slots.media = () => h('img', imgAttrs(r.media))
      const name = c.lang ? h('span', { lang: c.lang }, c.name) : c.name
      slots.title = () => [
        r.title ? r.title[0] : null,
        name,
        r.title ? r.title[1] : null,
        r.external ? [' ', h(GIcon, { name: 'external-link', label: props.external || undefined })] : null
      ]
      if (r.description) slots.description = () => (c.lang ? h('span', { lang: c.lang }, r.description) : r.description)
      if (props.categorySlot) slots.default = () => props.categorySlot({ category: c })
      return h(GCard, {
        ...props.card,
        ...r.card,
        title: c.name,
        headingLevel: props.headingLevel,
        onNavigate: (p) => emit('navigate', { ...p, item: c })
      }, slots)
    }
  }
})
