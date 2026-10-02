<script setup>
// GFormGrid · rejilla de formulario que mide su propio ancho (12 / 6 / 1) (dueño: bruno)
// Contrato: design/contracts/form.md §4 (#159) · Estilo: GFormGrid.css (coco; clases g-form-w-*, g-form-break, g-form-row)
// Tramos: wide ≥ space × 176, medium ≥ space × 104, narrow debajo (constantes de diseño, #130). Antes de medir: narrow.
import { computed, inject, onBeforeUnmount, onMounted, provide, ref, unref } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import { formKey, isDev, layoutKey, nextFrame, spaceUnit } from '../GForm/formContext.js'

defineOptions({ name: 'GFormGrid' })

const WIDE = 176
const MEDIUM = 104

const props = defineProps({
  stack: Boolean,
  density: { type: String, default: undefined, validator: oneOf(['default', 'comfortable', 'compact']) }
})

const form = inject(formKey, null)
const parent = inject(layoutKey, null)
const density = computed(() => props.density ?? unref(parent?.density) ?? unref(form?.density) ?? 'default')

// Sub‑contexto: los campos de la rejilla (y sus partes) llenan su celda (block), salvo prop explícita
provide(layoutKey, { block: true, density, readonly: parent?.readonly, disabled: parent?.disabled })

const root = ref(null)
const width = ref(0)
const unit = ref(4)
const tier = computed(() => {
  if (props.stack) return 'narrow'
  const w = width.value
  if (!w) return 'narrow'
  return w >= unit.value * WIDE ? 'wide' : w >= unit.value * MEDIUM ? 'medium' : 'narrow'
})

let observer = null
let pending = null
onMounted(() => {
  const el = root.value
  if (!el) return
  unit.value = spaceUnit(el)
  width.value = el.clientWidth || 0
  if (typeof ResizeObserver !== 'undefined') {
    // Las escrituras van al cuadro siguiente: dentro de la devolución, WebKit avisa «ResizeObserver loop completed»
    observer = new ResizeObserver((entries) => {
      const e = entries[entries.length - 1]
      const box = e && e.contentBoxSize && (e.contentBoxSize[0] || e.contentBoxSize)
      pending = box && box.inlineSize !== undefined ? box.inlineSize : e?.contentRect?.width ?? 0
      nextFrame(() => {
        if (pending === null) return
        const w = pending
        pending = null
        unit.value = spaceUnit(root.value)
        if (w !== width.value) width.value = w
      })
    })
    observer.observe(el)
  }
  if (isDev) checkOrder(el)
})
onBeforeUnmount(() => observer?.disconnect())

// Avisos de desarrollo (una vez, al montar): orden del DOM = lectura = Tab = visual
function checkOrder(el) {
  const warn = (m) => console.warn(`[Grana GFormGrid] ${m}`)
  const cs = typeof getComputedStyle === 'function' ? getComputedStyle : null
  if (cs && /dense/.test(cs(el).gridAutoFlow || '')) warn('la rejilla usa grid-auto-flow: dense; rompería el orden del DOM = orden de lectura.')
  for (const child of el.children) {
    const order = cs ? cs(child).order : ''
    if (order && order !== '0') warn('un hijo tiene `order` distinto de 0; rompería el orden del DOM = orden de lectura.')
    const widths = [...child.classList].filter((c) => /^g-form-w-/.test(c))
    if (widths.length > 1) warn(`un hijo tiene dos clases de ancho (${widths.join(', ')}).`)
  }
  for (const row of el.querySelectorAll('.g-form-row')) {
    if (row.children.length > 3) warn('un g-form-row tiene más de 3 hijos; usa como máximo 3 (2 en móvil).')
  }
}

const classes = computed(() => [
  'g-form-grid',
  `g-form-grid--${tier.value}`,
  `g-form-grid--density-${density.value}`,
  { 'g-form-grid--stack': props.stack }
])
</script>

<template>
  <div ref="root" :class="classes" :data-tier="tier"><slot /></div>
</template>
