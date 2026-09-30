<script setup>
// GProgress · barra de progreso (primitiva de GWidget; dueño: bruno)
// Contrato: design/contracts/widget.md · Estilo: GProgress.css (coco). Bruno da el avance con --_value (porcentaje).
import { computed } from 'vue'
import { oneOf } from '../../utils/oneOf.js'

defineOptions({ name: 'GProgress', inheritAttrs: false })

const props = defineProps({
  value: { type: Number, default: 0 },
  max: { type: Number, default: 100, validator: (v) => v > 0 },
  label: { type: String, default: undefined },
  valueText: { type: String, default: undefined },
  color: { type: String, default: 'brand', validator: oneOf(['brand', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']) },
  size: { type: String, default: 'md', validator: oneOf(['sm', 'md']) },
  showValue: { type: Boolean, default: true }
})

const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
if (isDev && !props.label) console.warn('[Grana] <GProgress> necesita label (nombre accesible de la barra).')

const clamped = computed(() => Math.min(Math.max(Number(props.value) || 0, 0), props.max))
const pct = computed(() => (clamped.value / props.max) * 100)
const text = computed(() => props.valueText ?? `${Math.round(pct.value)}%`)
const classes = computed(() => ['g-progress', `g-progress--size-${props.size}`, `g-progress--color-${props.color}`])
</script>

<template>
  <div :class="classes">
    <div v-if="label || showValue" class="g-progress__row">
      <span v-if="label">{{ label }}</span>
      <span v-if="showValue">{{ text }}</span>
    </div>
    <div class="g-progress__bar" role="progressbar" :aria-valuenow="clamped" aria-valuemin="0" :aria-valuemax="max" :aria-valuetext="text" :aria-label="label">
      <span class="g-progress__fill" :style="{ '--_value': `${pct}%` }" />
    </div>
  </div>
</template>
