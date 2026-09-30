<script>
// GSurface · superficie visual genérica (dueño: bruno)
// Contrato: design/contracts/surface.md · Estilo: GSurface.css (coco) · Estructura: design/lab/surface/r01/.
// Un solo elemento sin rol ni estructura; la profundidad (inset relativa al padre, radio concéntrico) la resuelve el CSS.
import { defineComponent, h } from 'vue'
import { oneOf } from '../../utils/oneOf.js'

const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const INTERACTIVE = ['a', 'button', 'input', 'select', 'textarea', 'summary', 'label']

export default defineComponent({
  name: 'GSurface',
  props: {
    level: { type: String, default: 'outlined', validator: oneOf(['flat', 'outlined', 'raised', 'floating', 'inset']) },
    tone: { type: String, default: 'surface', validator: oneOf(['surface', 'sunken']) },
    padding: { type: String, default: 'md', validator: oneOf(['none', 'xs', 'sm', 'md', 'lg']) },
    rounded: { type: String, default: undefined, validator: oneOf(['none', 'xs', 'sm', 'md', 'lg', 'xl', 'pill']) },
    density: { type: String, default: 'default', validator: oneOf(['default', 'comfortable', 'compact']) },
    as: { type: String, default: 'div' }
  },
  setup(props, { slots }) {
    if (isDev && INTERACTIVE.includes(String(props.as).toLowerCase())) {
      console.warn(`[Grana] <GSurface> no es interactiva: as="${props.as}" no está previsto. Usa un control dentro de la superficie.`)
    }
    return () => {
      const classes = [
        'g-surface',
        `g-surface--level-${props.level}`,
        `g-surface--tone-${props.tone}`,
        `g-surface--padding-${props.padding}`,
        `g-surface--density-${props.density}`
      ]
      if (props.rounded) classes.push(`g-surface--rounded-${props.rounded}`)
      return h(props.as, { class: classes }, slots.default ? slots.default() : undefined)
    }
  }
})
</script>
