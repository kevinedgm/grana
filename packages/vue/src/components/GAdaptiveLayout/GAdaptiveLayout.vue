<script setup>
// Bruno · opt-in layout; pure planner, DOM profiles and lifecycle are separate. Contrato adaptive-layout.md (#339 a #348,
// #359 a #364). Las pistas por hijo van en el propio hijo (clases g-adapt-*, --g-adapt-chars, --g-adapt-weight; #364).
import { computed, inject, provide, ref, unref } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import { formKey, layoutKey } from '../GForm/formContext.js'
import { useAdaptiveLayout } from './useAdaptiveLayout.js'
defineOptions({ name: 'GAdaptiveLayout' })
const props = defineProps({
  // Lógico (#359): en RTL, start es la derecha
  horizontal: { type: String, default: 'start', validator: oneOf(['start', 'center', 'end']) },
  vertical: { type: String, default: 'top', validator: oneOf(['top', 'center', 'bottom']) },
  // Factor 0 · 0,5 · 1 · 2 sobre las separaciones de formulario (#360)
  gap: { type: String, default: 'md', validator: oneOf(['none', 'sm', 'md', 'lg']) },
  density: { type: String, default: undefined, validator: oneOf(['default', 'comfortable', 'compact']) }
})
const root = ref(null)
const form = inject(formKey, null), parent = inject(layoutKey, null)
const density = computed(() => props.density ?? unref(parent?.density) ?? unref(form?.density) ?? 'default')
const context = { density, stack: parent?.stack, parentSchedule: parent?.adaptiveSchedule }
const { refresh, schedule, setIntrinsicMin } = useAdaptiveLayout(root, props, context)
provide(layoutKey, { block: true, density, stack: parent?.stack, readonly: parent?.readonly, disabled: parent?.disabled, setIntrinsicMin, adaptiveSchedule: schedule })
defineExpose({ refresh })
const classes = computed(() => ['g-adaptive-layout', `g-adaptive-layout--horizontal-${props.horizontal}`, `g-adaptive-layout--vertical-${props.vertical}`, `g-adaptive-layout--gap-${props.gap}`, `g-adaptive-layout--density-${density.value}`])
</script>
<template>
  <div ref="root" :class="classes"><slot /></div>
</template>
