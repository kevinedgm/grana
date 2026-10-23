<script setup>
// GbBookingSummary01 · Tarjeta (dueño: bruno). Contrato: design/contracts/blocks/booking-summary.md · Común: _comun.md §15 ·
// Sin CSS (#763). Lo pedido, el total, la garantía y la acción en una tarjeta para la columna de al lado: GCard
// as="section" (raíz; título al nivel de useSectionLevel(), `media` = offer.photos[0]) › GSummary + GPrice (la tarifa con
// la cuenta) + garantía; acciones (solid + outline) con la garantía en aria-describedby de la principal. Ignora
// `totals.lines` y `totals.note`. Pegarla a la columna es CSS de la aplicación (BK-L1, receta del README).
import { computed } from 'vue'
import { GCard, GStack, useSectionLevel } from '@grana/vue'
import GbActions from '../common/GbActions.js'
import { imgAttrs } from '../common/media.js'
import { useWarn } from '../common/warn.js'
import SummaryBody from './SummaryBody.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useBookingSummary } from './useBookingSummary.js'

defineOptions({ name: 'GbBookingSummary01' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbBookingSummary01')
const { level } = useSectionLevel()
const heading = computed(() => Math.min(level.value, 6))
const s = useBookingSummary(props, warn, '01')
const { photo, actions, assuranceId } = s
</script>

<template>
  <GCard as="section" :title="title" :heading-level="heading" data-gb="booking-summary-01">
    <template v-if="photo" #media><img v-bind="imgAttrs(photo)"></template>
    <GStack gap="md">
      <SummaryBody :s="s" :query="query" :labels="labels" :assurance="assurance" :summary-slot="$slots.summary" />
    </GStack>
    <template v-if="actions.length || $slots.actions" #actions>
      <slot name="actions" :describedby="assuranceId">
        <GbActions :actions="actions" :variants="['solid', 'outline']" :external="labels.external" :describedby="assuranceId" :warn="warn" @navigate="emit('navigate', $event)" @activate="emit('activate', $event)" />
      </slot>
    </template>
  </GCard>
</template>
