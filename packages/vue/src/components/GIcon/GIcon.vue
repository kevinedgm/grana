<script>
// GIcon · icono de Lucide en línea (dueño: bruno). INTERNO: no se registra como componente público.
// Contrato: docs/contract/icons.md. Los trazos vienen de src/icons/lucide.js (generado por scripts/build-icons.mjs).
// Siempre decorativo (aria-hidden): el significado lo lleva el texto o el nombre accesible del control.
import { defineComponent, h } from 'vue'
import { ICONS } from '../../icons/lucide.js'

const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const warned = new Set()

export default defineComponent({
  name: 'GIcon',
  props: {
    name: { type: String, required: true },
    filled: Boolean
  },
  setup(props) {
    return () => {
      const paths = ICONS[props.name]
      if (!paths) {
        if (isDev && !warned.has(props.name)) {
          warned.add(props.name)
          console.warn(`[Grana] <GIcon> no conoce el icono «${props.name}»: añádelo a docs/contract/icons.md y a scripts/icons.json.`)
        }
        return null
      }
      return h('svg', {
        class: ['g-icon', { 'g-icon--filled': props.filled }],
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: '0 0 24 24',
        fill: props.filled ? 'currentColor' : 'none',
        stroke: 'currentColor',
        'stroke-width': 2,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'aria-hidden': 'true',
        focusable: 'false',
        innerHTML: paths
      })
    }
  }
})
</script>
