<script>
// GSection · región de página con encabezado, descripción y acciones (dueño: bruno)
// Contrato: design/contracts/section.md (DECISIONS.md #717, #720, #723) · Estilo: GSection.css (coco)
// El nivel del encabezado lo pone el documento (provide/inject con sectionKey: h2 › h3 › h4) y el tamaño la profundidad
// (clase g-section--depth-{1|2|3}); headingLevel fijado cambia la etiqueta y no el tamaño (#196). Puro (#444).
import { Comment, Fragment, Text, computed, defineComponent, h, inject, onMounted, provide, ref, useId } from 'vue'
import { sectionKey } from '../../utils/sectionKey.js'

const empty = (v) => v.type === Comment || (v.type === Text && !String(v.children ?? '').trim()) || (v.type === Fragment && (!Array.isArray(v.children) || v.children.every(empty)))
const nodes = (slot) => (slot ? slot().filter((v) => !empty(v)) : [])

export default defineComponent({
  name: 'GSection',
  props: {
    title: { type: String, default: undefined },
    description: { type: String, default: undefined },
    // Sin validator: un valor fuera de 2 a 4 lo avisa el componente (aviso 3) y se usa el automático
    headingLevel: { type: Number, default: undefined },
    landmark: Boolean,
    labels: { type: Object, default: () => ({}) },
    id: { type: String, default: undefined }
  },
  setup(props, { slots }) {
    const uid = useId()
    const parent = inject(sectionKey, null)
    const level = computed(() => {
      if ([2, 3, 4].includes(props.headingLevel)) return props.headingLevel
      return parent ? parent.value.next : 2
    })
    const depth = computed(() => (parent ? parent.value.depth : 0) + 1)
    provide(sectionKey, computed(() => ({ depth: depth.value, next: Math.min(level.value + 1, 4) })))

    const root = ref(null)
    const warned = new Set()
    const warn = (key, text) => {
      try {
        if (process.env.NODE_ENV !== 'production' && !warned.has(key)) {
          warned.add(key)
          console.warn(`[Grana GSection] ${text}`)
        }
      } catch {}
    }
    const inDialog = () => {
      try {
        if (process.env.NODE_ENV !== 'production' && level.value === 2 && ![2, 3, 4].includes(props.headingLevel) && root.value && root.value.closest('.g-dialog')) {
          warn('dialog', 'dentro de un GDialog pasa headingLevel="3": su título ya es h2.')
        }
      } catch {}
    }
    onMounted(inDialog)

    return () => {
      const titleSlot = nodes(slots.title)
      const descSlot = nodes(slots.description)
      const actions = nodes(slots.actions)
      const base = props.id || uid
      const titleId = `${base}-title`
      try {
        if (process.env.NODE_ENV !== 'production') {
          if (!titleSlot.length && !(typeof props.title === 'string' && props.title.trim())) warn('title', 'falta title o el slot title.')
          if (actions.length && !(props.labels && props.labels.actions)) warn('actions', 'hay slot actions y falta labels.actions.')
          const hl = props.headingLevel
          if (hl !== undefined && hl !== null && ![2, 3, 4].includes(hl)) warn(`level:${hl}`, `headingLevel="${hl}" no es válido (2, 3 o 4); se usa el automático.`)
        }
      } catch {}
      const desc = descSlot.length ? descSlot : (typeof props.description === 'string' && props.description ? props.description : null)
      const head = [h('div', { class: 'g-section__titles' }, [
        h(`h${level.value}`, { class: 'g-section__title', id: titleId, dir: 'auto' }, titleSlot.length ? titleSlot : props.title),
        desc ? h('p', { class: 'g-section__desc' }, desc) : null
      ])]
      if (actions.length) head.push(h('div', { class: 'g-section__actions', role: 'group', 'aria-label': props.labels && props.labels.actions }, actions))
      return h('section', { ref: root, id: props.id, class: ['g-section', `g-section--depth-${Math.min(depth.value, 3)}`], 'aria-labelledby': props.landmark ? titleId : undefined }, [
        h('div', { class: 'g-section__head' }, head),
        h('div', { class: 'g-section__body' }, slots.default ? slots.default() : undefined)
      ])
    }
  }
})
</script>
