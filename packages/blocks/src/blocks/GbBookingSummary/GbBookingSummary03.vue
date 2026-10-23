<script setup>
// GbBookingSummary03 · Línea (dueño: bruno). Contrato: design/contracts/blocks/booking-summary.md · Común: _comun.md §15 ·
// Sin CSS (#763). Una sola línea compacta para lo alto de un paso del flujo: GStack as="section" horizontal gap="md"
// vertical="center" (raíz; se parte en estrecho) › GSummary layout="inline" + GPrice size="sm" (solo el total, sin la
// tarifa) + la primera acción (outline) + la garantía que la describe. Sin encabezado: la línea se nombra con `title`
// (aria-label de la sección). Ignora `totals.lines`, `totals.note`, `offer.photos` y la segunda acción.
import { GStack } from '@grana/vue'
import GbActions from '../common/GbActions.js'
import { useWarn } from '../common/warn.js'
import SummaryBody from './SummaryBody.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useBookingSummary } from './useBookingSummary.js'

defineOptions({ name: 'GbBookingSummary03' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbBookingSummary03')
const s = useBookingSummary(props, warn, '03')
const { actions, assuranceId } = s
</script>

<template>
  <GStack as="section" orientation="horizontal" gap="md" vertical="center" :aria-label="title" data-gb="booking-summary-03">
    <SummaryBody :s="s" :query="query" :labels="labels" :assurance="assurance" :summary-slot="$slots.summary" layout="inline" price-size="sm" />
    <slot name="actions" :describedby="assuranceId">
      <GbActions v-if="actions.length" :actions="actions" :variants="['outline']" size="sm" :external="labels.external" :describedby="assuranceId" :warn="warn" @navigate="emit('navigate', $event)" @activate="emit('activate', $event)" />
    </slot>
  </GStack>
</template>
