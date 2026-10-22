<script setup>
// GbCta03 · Línea sobria (dueño: bruno). Contrato: design/contracts/blocks/cta.md · Común: _comun.md · Sin CSS (#763).
// GStack gap="md" (raíz) › GDivider decorative + GSection (título, descripción; acciones solid + link en su slot
// `actions`, nombrado con labels.actions —si falta, avisa GSection—) + p con `assurance` en el cuerpo, ligada a la
// principal. `media` se ignora.
import { GDivider, GSection, GStack } from '@grana/vue'
import GbActions from '../common/GbActions.js'
import { useWarn } from '../common/warn.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useCta } from './useCta.js'

defineOptions({ name: 'GbCta03' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbCta03')
const { actions, assuranceId } = useCta(props, warn)
</script>

<template>
  <GStack gap="md" data-gb="cta-03">
    <GDivider decorative />
    <GSection :title="title" :description="description" :labels="{ actions: labels.actions }">
      <template v-if="$slots.description" #description><slot name="description" /></template>
      <template v-if="actions.length || $slots.actions" #actions>
        <slot name="actions" :describedby="assuranceId">
          <GbActions :actions="actions" :variants="['solid', 'link']" :external="labels.external" :describedby="assuranceId" :warn="warn" @navigate="emit('navigate', $event)" @activate="emit('activate', $event)" />
        </slot>
      </template>
      <p v-if="assuranceId" :id="assuranceId">{{ assurance }}</p>
    </GSection>
  </GStack>
</template>
