<script>
// GStack · pila de un eje con la escala de separación de Grana (dueño: bruno)
// Contrato: design/contracts/stack.md (DECISIONS.md #717, #719, #723) · Estilo: GStack.css (coco)
// Puro (#444): sin estado, medidas ni eventos. Las clases son el contrato con el CSS:
//   h-* actúa en los dos ejes, v-* solo en horizontal, divided solo en vertical, sin clase si no hay valor.
import { defineComponent, h, mergeProps, onBeforeUpdate } from 'vue'

const ORIENTATIONS = ['vertical', 'horizontal']
const GAPS = ['none', 'sm', 'md', 'lg']
const DENSITIES = ['default', 'comfortable', 'compact']
const H = ['start', 'center', 'end']
const V = ['top', 'center', 'bottom']
const NOT_STACK = ['a', 'button', 'input', 'select', 'textarea', 'summary', 'label', 'main']

export default defineComponent({
  name: 'GStack',
  inheritAttrs: false,
  // Sin validator: los valores fuera de lista los avisa el componente (aviso 2) y caen al default
  props: {
    as: { type: String, default: 'div' },
    orientation: { type: String, default: 'vertical' },
    gap: { type: String, default: 'md' },
    density: { type: String, default: undefined },
    horizontal: { type: String, default: undefined },
    vertical: { type: String, default: undefined },
    divided: Boolean
  },
  setup(props, { slots, attrs: given }) {
    const warned = new Set()
    const warn = (key, text) => {
      try {
        if (process.env.NODE_ENV !== 'production' && !warned.has(key)) {
          warned.add(key)
          console.warn(`[Grana GStack] ${text}`)
        }
      } catch {}
    }
    const check = () => {
      try {
        if (process.env.NODE_ENV !== 'production') {
          if (NOT_STACK.includes(String(props.as).toLowerCase())) warn(`as:${props.as}`, `as="${props.as}": una pila no es un control ni el punto de referencia de la página.`)
          for (const [name, list] of [['orientation', ORIENTATIONS], ['gap', GAPS], ['density', DENSITIES], ['horizontal', H], ['vertical', V]]) {
            const v = props[name]
            if (v !== undefined && v !== null && !list.includes(v)) warn(`${name}:${v}`, `${name}="${v}" no es válido (${list.join(', ')}); se usa el default.`)
          }
          const row = props.orientation === 'horizontal'
          if (!row && props.vertical !== undefined) warn('vertical', 'vertical solo actúa con orientation="horizontal".')
          if (row && props.divided) warn('divided', 'divided solo actúa con orientation="vertical".')
        }
      } catch {}
    }
    check()
    onBeforeUpdate(check)
    return () => {
      const row = props.orientation === 'horizontal'
      const pick = (v, list, d) => (list.includes(v) ? v : d)
      const cls = ['g-stack', `g-stack--orientation-${row ? 'horizontal' : 'vertical'}`, `g-stack--gap-${pick(props.gap, GAPS, 'md')}`]
      // La prop es la región de la pila (#975): clase y atributo solo con un valor de la lista; sin prop, nada
      const d = DENSITIES.includes(props.density) && props.density
      if (d) cls.push(`g-stack--density-${d}`)
      if (H.includes(props.horizontal)) cls.push(`g-stack--h-${props.horizontal}`)
      if (row && V.includes(props.vertical)) cls.push(`g-stack--v-${props.vertical}`)
      if (!row && props.divided) cls.push('g-stack--divided')
      // ul/ol sin marcas pierden su rol de lista en Safari con VoiceOver (1.3.1, #827); un `role` de la aplicación gana
      const tag = String(props.as).toLowerCase()
      const attrs = { class: cls }
      if (tag === 'ul' || tag === 'ol') attrs.role = 'list'
      return h(props.as, mergeProps(attrs, given, d && { 'data-g-density': d }), slots.default ? slots.default() : undefined)
    }
  }
})
</script>
