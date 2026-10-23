<script setup>
// GbConfirmation02 · Lo que sigue (dueño: bruno). Contrato: design/contracts/blocks/confirmation.md · Común: _comun.md §15 ·
// Sin CSS (#763). GSection (título; el estado en GText body-sm como primer hijo del cuerpo: GSection no tiene insignia) ›
// GStack gap="lg" › [lo confirmado sin la foto + acciones] + GSection anidada (labels.next) › GStepper vertical informativo
// (navigation="none", sin v-model: el actual es el primer paso de `next`; las fechas en <time> de la descripción, en la
// zona del lugar). Es un proceso que la persona va a completar (llegar, registrarse, pagar el resto), #874.
import { computed } from 'vue'
import { GSection, GStack, GStepper, GText } from '@grana/vue'
import GbActions from '../common/GbActions.js'
import { has } from '../common/text.js'
import { useWarn } from '../common/warn.js'
import ConfirmationBody from './ConfirmationBody.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useConfirmation } from './useConfirmation.js'

defineOptions({ name: 'GbConfirmation02' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbConfirmation02')
const c = useConfirmation(props, warn, '02')
const { stateText, next, actions } = c
const steps = computed(() => next.value.map(({ item, key }) => ({ id: key, label: item.title, description: item.description })))
const nextTitle = computed(() => {
  const t = props.labels && props.labels.next
  try { if (process.env.NODE_ENV !== 'production' && next.value.length && !has(t)) warn('C5:next', 'hay next y falta labels.next (título de «lo que sigue»): la lista se pinta sin título (C5).') } catch {}
  return has(t) ? t : ''
})
</script>

<template>
  <GSection :title="title" data-gb="confirmation-02">
    <GStack gap="lg">
      <GText v-if="stateText" size="body-sm">{{ stateText }}</GText>
      <ConfirmationBody :c="c" :query="query" :labels="labels" :summary-slot="$slots.summary" :warn="warn" @navigate="emit('navigate', $event)" />
      <GStack v-if="actions.length || $slots.actions" orientation="horizontal" gap="sm">
        <slot name="actions">
          <GbActions :actions="actions" :variants="['solid', 'outline']" :external="labels.external" :warn="warn" @navigate="emit('navigate', $event)" @activate="emit('activate', $event)" />
        </slot>
      </GStack>
      <GSection v-if="steps.length && nextTitle" :title="nextTitle">
        <GStepper :steps="steps" :model-value="steps[0].id" orientation="vertical" navigation="none" :labels="labels.stepper" :aria-label="nextTitle">
          <template #description="{ index }">
            <template v-if="next[index].item.description">{{ next[index].item.description }}</template><template v-if="next[index].item.description && next[index].time">{{ ' · ' }}</template><time v-if="next[index].time" :datetime="next[index].time.datetime">{{ next[index].time.text }}</time>
          </template>
        </GStepper>
      </GSection>
    </GStack>
  </GSection>
</template>
