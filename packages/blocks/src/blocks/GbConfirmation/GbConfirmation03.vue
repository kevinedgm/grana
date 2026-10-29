<script setup>
// GbConfirmation03 · Captura (dueño: bruno). Contrato: design/contracts/blocks/confirmation.md · Común: _comun.md §15 · Sin
// CSS (#763). Todo lo necesario en una sola tarjeta compacta que cabe en una pantalla de teléfono y se comparte por
// WhatsApp: GCard as="section" data-g-density="compact" level="outlined" sin `media` › código, consulta, total y canales; como
// mucho dos acciones (F3). Ignora `next`, `offer.photos` y `totals.lines` (solo el total).
import { computed } from 'vue'
import { GCard, GStack, useSectionLevel } from '@grana/vue'
import GbActions from '../common/GbActions.js'
import { useWarn } from '../common/warn.js'
import ConfirmationBody from './ConfirmationBody.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useConfirmation } from './useConfirmation.js'

defineOptions({ name: 'GbConfirmation03' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbConfirmation03')
const { level } = useSectionLevel()
const heading = computed(() => Math.min(level.value, 6))
const c = useConfirmation(props, warn, '03')
const { stateText, badgeColor, actions } = c
</script>

<template>
  <GCard as="section" data-g-density="compact" level="outlined" :title="title" :heading-level="heading" :badge="stateText || undefined" :badge-color="badgeColor" data-gb="confirmation-03">
    <GStack gap="sm">
      <ConfirmationBody :c="c" :query="query" :labels="labels" :summary-slot="$slots.summary" :warn="warn" @navigate="emit('navigate', $event)" />
    </GStack>
    <template v-if="actions.length || $slots.actions" #actions>
      <slot name="actions">
        <GbActions :actions="actions" :variants="['solid', 'outline']" size="sm" :external="labels.external" :warn="warn" @navigate="emit('navigate', $event)" @activate="emit('activate', $event)" />
      </slot>
    </template>
  </GCard>
</template>
