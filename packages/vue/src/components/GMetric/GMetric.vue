<script setup>
// GMetric · valor con etiqueta y tendencia (primitiva de GWidget; dueño: bruno)
// Contrato: design/contracts/widget.md · Estilo: GMetric.css (coco). La tendencia lleva símbolo y texto (nunca solo color).
import { computed } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import GIcon from '../GIcon/GLibIcon.js'

defineOptions({ name: 'GMetric', inheritAttrs: false })

const props = defineProps({
  label: { type: String, default: undefined },
  value: { type: [String, Number], default: undefined },
  unit: { type: String, default: undefined },
  trend: { type: String, default: undefined },
  direction: { type: String, default: 'flat', validator: oneOf(['up', 'down', 'flat']) },
  trendColor: { type: String, default: 'neutral', validator: oneOf(['brand', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']) },
  context: { type: String, default: undefined },
  size: { type: String, default: 'md', validator: oneOf(['sm', 'md', 'lg']) }
})

const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
if (isDev && !props.label) console.warn('[Grana] <GMetric> necesita label (nombre accesible del valor).')

const classes = computed(() => ['g-metric', `g-metric--size-${props.size}`, props.trend && `g-metric--trend-${props.trendColor}`])
const trendIcon = computed(() => ({ up: 'arrow-up', down: 'arrow-down' })[props.direction] ?? 'minus')
</script>

<template>
  <div :class="classes">
    <span v-if="label" class="g-metric__label">{{ label }}</span>
    <span class="g-metric__value">{{ value }}<span v-if="unit" class="g-metric__unit">{{ unit }}</span></span>
    <span v-if="trend" class="g-metric__trend" :data-direction="direction"><GIcon class="g-metric__trend-icon" :name="trendIcon" />{{ trend }}<small v-if="context"> {{ context }}</small></span>
    <small v-else-if="context" class="g-metric__context">{{ context }}</small>
  </div>
</template>
