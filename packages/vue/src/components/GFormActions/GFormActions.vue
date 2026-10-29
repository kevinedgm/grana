<script setup>
// GFormActions · pie de acciones con jerarquía, estado y, opcionalmente, fijo (dueño: bruno)
// Contrato: design/contracts/form.md §6 (#155, #163) · Estilo: GFormActions.css (coco)
// En el DOM: secundarias antes y la primaria al final. En estrecho (ancho propio < space × 104) se apilan con la
// primaria arriba (data-stacked + g-form-actions--stacked). Con `sticky`, publica su altura en GForm
// (--g-form-actions-size) para que el foco nunca quede debajo (WCAG 2.4.11).
import { Comment, Fragment, computed, inject, onBeforeUnmount, onMounted, ref, useSlots } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import GBtn from '../GBtn/GBtn.vue'
import { formKey, nextFrame, spaceUnit } from '../GForm/formContext.js'

// Atributos a mano para que el data-g-density de la prop gane (#975)
defineOptions({ name: 'GFormActions', inheritAttrs: false })

const NARROW = 104

const props = defineProps({
  sticky: Boolean,
  status: { type: String, default: undefined },
  density: { type: String, default: undefined, validator: oneOf(['default', 'comfortable', 'compact']) }
})

const slots = useSlots()
const form = inject(formKey, null)

const root = ref(null)
const stacked = ref(false)
let observer = null
let offSticky = null
let pending = null

function apply(width, height) {
  const s = width > 0 && width < spaceUnit(root.value) * NARROW
  if (s !== stacked.value) stacked.value = s
  if (props.sticky && form && typeof form.setActionsSize === 'function') form.setActionsSize(height)
}
onMounted(() => {
  const el = root.value
  if (!el) return
  if (props.sticky && form && typeof form.registerActions === 'function') offSticky = form.registerActions(() => root.value)
  apply(el.clientWidth || 0, el.offsetHeight || 0)
  if (typeof ResizeObserver !== 'undefined') {
    // Escrituras fuera de la devolución (cuadro siguiente) y solo si cambian: evita «ResizeObserver loop» en WebKit
    observer = new ResizeObserver((entries) => {
      const e = entries[entries.length - 1]
      const box = e && e.contentBoxSize && (e.contentBoxSize[0] || e.contentBoxSize)
      pending = box && box.inlineSize !== undefined ? box.inlineSize : e?.contentRect?.width ?? 0
      nextFrame(() => {
        if (pending === null || !root.value) return
        const w = pending
        pending = null
        apply(w, root.value.offsetHeight)
      })
    })
    observer.observe(el)
  }
})
onBeforeUnmount(() => {
  observer?.disconnect()
  if (offSticky) offSticky()
})

// Avisos de desarrollo: una primaria (GBtn solid) y al final
function flatten(nodes, out = []) {
  for (const n of nodes || []) {
    if (!n || n.type === Comment) continue
    if (n.type === Fragment && Array.isArray(n.children)) flatten(n.children, out)
    else out.push(n)
  }
  return out
}
const warned = new Set()
function warnOnce(msg) {
  if (warned.has(msg)) return
  warned.add(msg)
  try { if (process.env.NODE_ENV !== 'production') console.warn(msg) } catch {}
}
// Se llama dentro del render (v-if del marcado): los slots solo pueden invocarse ahí
function checkButtons() {
  try {
    if (process.env.NODE_ENV !== 'production') {
      const nodes = flatten(slots.default ? slots.default() : [])
      const btns = nodes.filter((n) => n.type === GBtn || n.type?.name === 'GBtn')
      const solid = btns.filter((n) => (n.props?.variant ?? 'solid') === 'solid')
      if (solid.length > 1) warnOnce('[Grana GFormActions] hay más de una acción primaria (GBtn solid); deja una.')
      if (solid.length === 1 && btns[btns.length - 1] !== solid[0]) warnOnce('[Grana GFormActions] la primaria (GBtn solid) debe ser el último botón.')
    }
  } catch {}
  return false
}

const classes = computed(() => [
  'g-form-actions',
  // La prop es la región del pie (#976); sin prop, la del formulario o la región por CSS
  props.density && `g-form-actions--density-${props.density}`,
  { 'g-form-actions--sticky': props.sticky, 'g-form-actions--stacked': stacked.value }
])
</script>

<template>
  <div ref="root" :class="classes" :data-stacked="stacked ? '' : undefined" v-bind="$attrs" :data-g-density="props.density || $attrs['data-g-density']">
    <div class="g-form-actions__status" role="status"><slot name="status"><template v-if="status">{{ status }}</template></slot></div>
    <div class="g-form-actions__buttons"><slot /></div>
    <template v-if="checkButtons()" />
  </div>
</template>
