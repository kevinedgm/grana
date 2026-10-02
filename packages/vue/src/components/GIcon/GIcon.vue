<script>
// GIcon · icono de Lucide en línea, PÚBLICO (dueño: bruno). Estilo: GIcon.css (coco).
// Contrato: docs/contract/icons.md v0.2 §2 y §5 · DECISIONS.md #197 a #201.
// Resolución (nombres de la aplicación, §5.4): registro más cercano (inject(iconsKey), createIcons) → lista de la
// librería → nada y aviso. Los iconos propios de los componentes NO pasan por aquí (GLibIcon: solo la librería).
// Decorativo por defecto (aria-hidden); con `label`, role="img" + aria-label. Nunca enfocable.
import { defineComponent, inject, onMounted, ref } from 'vue'
import { iconsKey, lookupLibrary, lookupRegistry } from './registry.js'
import { isDev, renderSvg, warnOnce } from './render.js'

// Atributos que fija GIcon (§2.3): si llegan desde fuera se ignoran
const FIXED = new Set(['xmlns', 'viewBox', 'viewbox', 'fill', 'stroke', 'stroke-width', 'strokeWidth', 'stroke-linecap', 'strokeLinecap', 'stroke-linejoin', 'strokeLinejoin', 'focusable', 'innerHTML'])
// Los de accesibilidad (role, aria-*, tabindex) además avisan: el nombre va en `label`, el foco en el control
const isA11yAttr = (k) => k === 'role' || /^aria[-A-Z]/.test(k) || k.toLowerCase() === 'tabindex'

export default defineComponent({
  name: 'GIcon',
  inheritAttrs: false,
  props: {
    name: { type: String, required: true },
    label: { type: String, default: undefined },
    filled: Boolean,
    flipRtl: Boolean
  },
  setup(props, { attrs }) {
    const registry = inject(iconsKey, null)
    const el = ref(null)

    onMounted(() => {
      // §2.4: un label dentro de un hueco aria-hidden se pierde (solo en el cliente, al montar)
      if (!isDev() || !props.label || !el.value) return
      const hidden = el.value.parentElement && el.value.parentElement.closest('[aria-hidden="true"]')
      if (hidden) warnOnce(`label-hidden:${props.name}`, `<GIcon name="${props.name}" label="${props.label}"> está dentro de un elemento aria-hidden (el hueco de un componente es decorativo): el nombre se pierde. Pon el nombre en el control (aria-label) o saca el icono del hueco.`)
    })

    return () => {
      const paths = lookupRegistry(registry, props.name) ?? lookupLibrary(props.name)
      if (!paths) {
        warnOnce(`name:${props.name}`, `no conoce el icono «${props.name}»: no está en la lista de la librería ni en el registro de la aplicación. Regístralo importando su cadena de lucide-static: app.use(createIcons([…])).`)
        return null
      }
      const own = {}
      for (const [k, v] of Object.entries(attrs)) {
        if (isA11yAttr(k)) {
          warnOnce(`attr:${k}:${props.name}`, `<GIcon name="${props.name}"> ignora el atributo «${k}»: para un nombre usa la prop label; si hay que pulsarlo, el nombre y el foco van en el control.`)
          continue
        }
        if (FIXED.has(k)) continue
        own[k] = v
      }
      return renderSvg(paths, { filled: props.filled, flipRtl: props.flipRtl, label: props.label, attrs: own, ref: el })
    }
  }
})
</script>
