<script setup>
// GbAvailability01 · Calendario con precio (dueño: bruno). Contrato: design/contracts/blocks/availability.md · Común:
// _comun.md §15 · Sin CSS (#763). El mes con el precio en cada día: GSection › GPriceScope › GDatePicker inline (rango en
// stay, un día en el resto; el precio del día pintado bajo el número y oído en su nombre, #778; el día lleno de una
// estancia sigue sirviendo de salida, #739). Cada elección emite `update:value`; al completarla (un día, o el rango
// entero en stay), `select` con el día y la consulta con las fechas puestas. Ignora `upcoming` y `total`.
import { GSection } from '@grana/vue'
import { useWarn } from '../common/warn.js'
import AvailabilityCalendar from './AvailabilityCalendar.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useAvailability } from './useAvailability.js'

defineOptions({ name: 'GbAvailability01' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbAvailability01')
const a = useAvailability(props, emit, warn, '01')
const change = ({ event, value }) => {
  a.choose(value)
  if (a.complete(value)) a.select(event, value)
}
</script>

<template>
  <GSection :title="title" :description="description" data-gb="availability-01">
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <AvailabilityCalendar :a="a" :min="min" :max="max" :labels="labels" :day-slot="$slots.day" @change="change" />
  </GSection>
</template>
