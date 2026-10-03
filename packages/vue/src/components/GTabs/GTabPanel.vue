<script>
// GTabPanel · panel suelto de GTabs en modo `detached` (dueño: bruno)
// Contrato: design/contracts/tabs.md («Paneles separados») · Estilo: GTabs.css (mismas clases g-tabs__panel)
// Cabecera y panel viven en ramas distintas del árbol: se enlazan por `id` (sin provide/inject), con el estado explícito.
import { defineComponent, h, nextTick, onMounted, onUpdated, provide, ref, watch } from 'vue'
import { TABS_NEST, hasFocusable, panelDomId, tabDomId } from '../../utils/tabs.js'

const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'

export default defineComponent({
  name: 'GTabPanel',
  inheritAttrs: false,
  props: {
    tabs: { type: [String], required: true },
    value: { type: [String, Number], required: true },
    active: Boolean,
    lazy: Boolean,
    busy: Boolean
  },
  setup(props, { slots, attrs }) {
    // Un GTabs dentro de un panel es un anidamiento (aviso de GTabs)
    provide(TABS_NEST, true)

    const warned = new Set()
    const warnOnce = (key, msg) => {
      if (!isDev || warned.has(key)) return
      warned.add(key)
      console.warn(`[Grana] <GTabPanel> ${msg}`)
    }
    if (isDev) {
      if (!props.tabs) warnOnce('tabs', 'necesita `tabs`: el `id` del GTabs al que pertenece.')
      if (props.value === undefined || props.value === null || props.value === '') warnOnce('value', 'necesita `value`: el `id` de la pestaña que lo gobierna.')
    }

    const el = ref(null)
    const mounted = ref(props.active) // `lazy`: se monta al primer activarse y luego se conserva
    watch(() => props.active, (on) => { if (on) mounted.value = true })

    // tabindex="0" solo si el panel no contiene nada enfocable (lo decide al activarse)
    const focusable = ref(false)
    const evaluate = () => { focusable.value = props.active && hasFocusable(el.value) }
    onMounted(() => {
      evaluate()
      if (isDev && props.tabs && typeof document !== 'undefined' && !document.getElementById(props.tabs)) {
        warnOnce('missing', `no encuentra un GTabs con id «${props.tabs}» al montar.`)
      }
    })
    onUpdated(evaluate)
    watch(() => props.active, () => nextTick(evaluate))

    // Dirección del cambio (tabs.md «Personalidad», #302): al pasar `active` de false a true copia el
    // `data-direction` de la raíz de su GTabs (`#{tabs}`); sin él, el panel solo se funde.
    // Se lee antes del render (`pre`: el panel pierde `hidden` ya con su dirección cuando el GTabs va antes en el
    // árbol, como en el slot `tabs` de GDialog) y se confirma después (`post`: si el GTabs va después, en el mismo ciclo).
    const direction = ref(undefined)
    const readDirection = () => {
      if (typeof document === 'undefined' || !props.tabs) return
      const host = document.getElementById(props.tabs)
      const d = host?.getAttribute('data-direction') || undefined
      if (d !== direction.value) direction.value = d
    }
    const onActivate = (on, was) => { if (on && !was) readDirection() }
    watch(() => props.active, onActivate)
    watch(() => props.active, onActivate, { flush: 'post' })

    return () => {
      const body = !props.lazy || mounted.value ? slots.default?.({ active: props.active }) : null
      return h('div', {
        ...attrs,
        ref: el,
        class: ['g-tabs__panel', attrs.class],
        role: 'tabpanel',
        id: panelDomId(props.tabs, props.value),
        'aria-labelledby': tabDomId(props.tabs, props.value),
        tabindex: props.active && !focusable.value ? 0 : undefined,
        hidden: props.active ? undefined : true,
        'aria-busy': props.active && props.busy ? 'true' : undefined,
        'data-direction': direction.value
      }, body)
    }
  }
})
</script>
