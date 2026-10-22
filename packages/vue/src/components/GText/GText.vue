<script>
// GText · texto suelto con la tipografía del tema y una pausa por tamaño (dueño: bruno)
// Contrato: design/contracts/text.md (DECISIONS.md #851 a #856) · Estilo: GText.css (coco)
// Puro (#444): sin estado, medidas ni eventos. Sin contenido no se pinta (regla 2). lang/dir/id/aria-* llegan a la raíz por $attrs.
import { defineComponent, h, onBeforeUpdate, Comment, Text, Fragment } from 'vue'

const AS = ['p', 'div', 'span', 'small', 'blockquote', 'figure', 'figcaption', 'address']
const SIZES = ['body', 'body-sm', 'caption']
const TONES = ['default', 'muted']

// Vacío: solo comentarios (v-if falso), texto en blanco o fragmentos vacíos
const empty = (nodes) => !nodes || nodes.every((n) => (typeof n === 'string' ? !n.trim() : n.type === Comment || (n.type === Text ? !String(n.children).trim() : n.type === Fragment && empty(n.children))))

export default defineComponent({
  name: 'GText',
  inheritAttrs: false,
  props: {
    as: { type: String, default: 'p' },
    size: { type: String, default: 'body' },
    tone: { type: String, default: 'default' }
  },
  setup(props, { slots, attrs }) {
    const warned = new Set()
    const check = () => {
      try {
        if (process.env.NODE_ENV !== 'production') {
          for (const [name, list] of [['as', AS], ['size', SIZES], ['tone', TONES]]) {
            const key = `${name}:${props[name]}`
            if (!list.includes(props[name]) && !warned.has(key)) {
              warned.add(key)
              console.warn(`[Grana GText] ${name}="${props[name]}" no es válido (${list.join(', ')}); se usa el default.`)
            }
          }
        }
      } catch {}
    }
    check()
    onBeforeUpdate(check)
    return () => {
      const kids = slots.default && slots.default()
      if (empty(kids)) return null
      const pick = (v, list, d) => (list.includes(v) ? v : d)
      return h(pick(props.as, AS, 'p'), { ...attrs, class: ['g-text', `g-text--size-${pick(props.size, SIZES, 'body')}`, `g-text--tone-${pick(props.tone, TONES, 'default')}`, attrs.class] }, kids)
    }
  }
})
</script>
