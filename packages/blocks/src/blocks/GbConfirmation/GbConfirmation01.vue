<script setup>
// GbConfirmation01 · Tarjeta (dueño: bruno). Contrato: design/contracts/blocks/confirmation.md · Común: _comun.md §15 · Sin
// CSS (#763). GCard as="section" (raíz; título al nivel de useSectionLevel(), `badge` = el estado en texto con su color,
// `media` = offer.photos[0]) › lo confirmado (ConfirmationBody) y las acciones (la primera solid, la segunda outline).
import { computed } from 'vue'
import { GCard, GStack, useSectionLevel } from '@grana/vue'
import GbActions from '../common/GbActions.js'
import { imgAttrs } from '../common/media.js'
import { useWarn } from '../common/warn.js'
import ConfirmationBody from './ConfirmationBody.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useConfirmation } from './useConfirmation.js'

defineOptions({ name: 'GbConfirmation01' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbConfirmation01')
const { level } = useSectionLevel()
const heading = computed(() => Math.min(level.value, 6))
const c = useConfirmation(props, warn, '01')
const { photo, stateText, badgeColor, actions } = c
</script>

<template>
  <GCard as="section" :title="title" :heading-level="heading" :badge="stateText || undefined" :badge-color="badgeColor" data-gb="confirmation-01">
    <template v-if="photo" #media><img v-bind="imgAttrs(photo)"></template>
    <GStack gap="md">
      <ConfirmationBody :c="c" :query="query" :labels="labels" :summary-slot="$slots.summary" :warn="warn" @navigate="emit('navigate', $event)" />
    </GStack>
    <template v-if="actions.length || $slots.actions" #actions>
      <slot name="actions">
        <GbActions :actions="actions" :variants="['solid', 'outline']" :external="labels.external" :warn="warn" @navigate="emit('navigate', $event)" @activate="emit('activate', $event)" />
      </slot>
    </template>
  </GCard>
</template>
