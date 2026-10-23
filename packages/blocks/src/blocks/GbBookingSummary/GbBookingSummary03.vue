<script setup>
// GbBookingSummary03 · Línea (dueño: bruno). Contrato: design/contracts/blocks/booking-summary.md · Común: _comun.md §15 ·
// Sin CSS (#763). Una sola línea compacta para lo alto de un paso del flujo (#897, #898): GText as="div" size="body"
// (raíz: role="group" con aria-label = title, #894; la tipografía del cuerpo viene de la raíz y no de la página) ›
// GAdaptiveLayout gap="md" vertical="center" › GSummary layout="inline" (hijo directo: su perfil, #363, le da el sobrante
// de la línea) + GPrice size="sm" en su GPriceScope (solo el total, sin la tarifa) + la primera acción (outline); debajo
// de la fila, la garantía que describe la acción (GText con id, aria-describedby). Se parte en líneas solo cuando el ancho
// no alcanza. Ignora `totals.lines`, `totals.note`,
// `offer.photos` y la segunda acción.
import { GAdaptiveLayout, GText } from '@grana/vue'
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
  <GText as="div" size="body" role="group" :aria-label="title" data-gb="booking-summary-03">
    <GAdaptiveLayout gap="md" vertical="center">
    <SummaryBody :s="s" :query="query" :labels="labels" :assurance="assurance" :summary-slot="$slots.summary" layout="inline" price-size="sm" :with-assurance="false" />
    <slot name="actions" :describedby="assuranceId">
      <GbActions v-if="actions.length" :actions="actions" :variants="['outline']" size="sm" :external="labels.external" :describedby="assuranceId" :warn="warn" @navigate="emit('navigate', $event)" @activate="emit('activate', $event)" />
    </slot>
    </GAdaptiveLayout>
    <GText v-if="assuranceId" :id="assuranceId" size="body-sm" tone="muted">{{ assurance }}</GText>
  </GText>
</template>
