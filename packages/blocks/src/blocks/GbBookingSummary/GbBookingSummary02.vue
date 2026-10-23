<script setup>
// GbBookingSummary02 · El recibo (dueño: bruno). Contrato: design/contracts/blocks/booking-summary.md · Común: _comun.md
// §15 · Sin CSS (#763). El desglose completo, línea a línea, para revisar antes de confirmar: GSection (título) › GStack
// gap="md" › GSummary + región de precios › [GSection anidada `labels.lines` › GText as="div" body-sm › dl (#863)] +
// GPrice del total · totals.note · garantía · acciones (solid + outline; la garantía describe la principal). Ignora
// `offer.photos`. El bloque no comprueba que las líneas sumen el total (Grana no suma, #769).
import { GSection, GStack } from '@grana/vue'
import GbActions from '../common/GbActions.js'
import { useWarn } from '../common/warn.js'
import SummaryBody from './SummaryBody.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useBookingSummary } from './useBookingSummary.js'

defineOptions({ name: 'GbBookingSummary02' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbBookingSummary02')
const s = useBookingSummary(props, warn, '02')
const { actions, assuranceId } = s
</script>

<template>
  <GSection :title="title" data-gb="booking-summary-02">
    <GStack gap="md">
      <SummaryBody :s="s" :query="query" :labels="labels" :assurance="assurance" :summary-slot="$slots.summary" />
      <GStack v-if="actions.length || $slots.actions" orientation="horizontal" gap="sm">
        <slot name="actions" :describedby="assuranceId">
          <GbActions :actions="actions" :variants="['solid', 'outline']" :external="labels.external" :describedby="assuranceId" :warn="warn" @navigate="emit('navigate', $event)" @activate="emit('activate', $event)" />
        </slot>
      </GStack>
    </GStack>
  </GSection>
</template>
