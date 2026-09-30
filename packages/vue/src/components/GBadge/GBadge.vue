<script>
// GBadge · insignia no interactiva (dueño: bruno)
// Contrato: design/contracts/badge.md · Estructura: design/lab/badge/r01/ · Estilo: GBadge.css (coco)
// Función de render: el contenido (texto, icono, ancla) se lee de los slots dentro del render, como pide Vue.
import { Comment, Fragment, Text, defineComponent, h } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import GIcon from '../GIcon/GIcon.vue'

// Un slot cuenta como contenido solo si devuelve algo (no comentarios ni texto vacío)
const isEmptyNode = (v) => v.type === Comment || (v.type === Text && !String(v.children ?? '').trim()) || (v.type === Fragment && (!Array.isArray(v.children) || v.children.every(isEmptyNode)))
const nodes = (slot) => (slot ? slot().filter((v) => !isEmptyNode(v)) : [])

// Avisos solo en desarrollo. `process` puede no existir (UMD en navegador): se comprueba antes de leerlo.
const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'

export default defineComponent({
  name: 'GBadge',
  inheritAttrs: false,
  props: {
    variant: { type: String, default: 'soft', validator: oneOf(['solid', 'soft', 'outline', 'glass']) },
    color: { type: String, default: 'neutral', validator: oneOf(['brand', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']) },
    size: { type: String, default: 'md', validator: oneOf(['sm', 'md', 'lg']) },
    count: { type: Number, default: undefined },
    max: { type: Number, default: 99 },
    showZero: Boolean,
    shape: { type: String, default: undefined, validator: oneOf(['circle', 'square', 'diamond', 'triangle']) },
    label: { type: String, default: undefined },
    placement: { type: String, default: 'top-end', validator: oneOf(['top-end', 'top-start', 'bottom-end', 'bottom-start']) }
  },
  setup(props, { slots, attrs }) {
    const warned = new Set()
    const warn = (msg) => {
      if (isDev && !warned.has(msg)) {
        warned.add(msg)
        console.warn(msg)
      }
    }

    return () => {
      const text = nodes(slots.default)
      const icon = nodes(slots.icon)
      const anchor = slots.anchor ? slots.anchor() : null
      const hasCount = props.count !== undefined && props.count !== null

      // Modo: se deduce del contenido. Precedencia: count > texto > figura > icono.
      let kind = null
      if (hasCount) kind = 'count'
      else if (text.length) kind = 'text'
      else if (props.shape) kind = 'figure'
      else if (icon.length) kind = 'icon'

      if (isDev) {
        if (kind === null) warn('[Grana] <GBadge> no tiene contenido: da texto (slot), `count`, `shape` o un slot `icon`.')
        else if (kind !== 'text' && !props.label) warn(`[Grana] <GBadge> sin texto visible (${kind}) necesita \`label\` como nombre accesible.`)
        if (hasCount && text.length) warn('[Grana] <GBadge> con `count` ignora el slot por defecto.')
        if (hasCount && !(Number.isInteger(props.count) && props.count >= 0)) warn('[Grana] <GBadge count> debe ser un entero mayor o igual que 0.')
        if (!(Number.isInteger(props.max) && props.max >= 1)) warn('[Grana] <GBadge max> debe ser un entero mayor o igual que 1.')
        if (props.placement !== 'top-end' && !anchor) warn('[Grana] <GBadge placement> solo actúa con el slot `anchor`.')
      }

      // Con 0 y sin showZero no se renderiza la insignia (anclada: solo el destino)
      const visible = kind !== null && !(kind === 'count' && props.count === 0 && !props.showZero)

      let badge = null
      if (visible) {
        const body = []
        if (props.shape && (kind === 'text' || kind === 'figure')) {
          body.push(h(GIcon, { class: ['g-badge__shape', `g-badge__shape--${props.shape}`], name: props.shape, filled: true }))
        }
        if (icon.length && (kind === 'text' || kind === 'icon')) {
          body.push(h('span', { class: 'g-badge__icon', 'aria-hidden': 'true' }, icon))
        }
        // Con `label`, el nombre lo da el texto oculto: el texto visible no se duplica
        if (kind === 'text') body.push(h('span', { class: 'g-badge__text', 'aria-hidden': props.label ? 'true' : undefined }, text))
        else if (kind === 'count') body.push(h('span', { class: 'g-badge__text', 'aria-hidden': props.label ? 'true' : undefined }, props.count > props.max ? `${props.max}+` : String(props.count)))
        if (props.label) body.push(h('span', { class: 'g-badge__sr' }, props.label))

        const classes = ['g-badge', `g-badge--variant-${props.variant}`, `g-badge--color-${props.color}`, `g-badge--size-${props.size}`, `g-badge--kind-${kind}`]
        badge = h('span', anchor ? { class: classes } : { ...attrs, class: [classes, attrs.class] }, body)
      }

      // Anclada: el envoltorio recibe los atributos; el destino va antes que la insignia en el orden del documento
      if (anchor) {
        return h('span', { ...attrs, class: ['g-badge-anchor', `g-badge-anchor--${props.placement}`, attrs.class] }, [anchor, badge])
      }
      return badge
    }
  }
})
</script>
