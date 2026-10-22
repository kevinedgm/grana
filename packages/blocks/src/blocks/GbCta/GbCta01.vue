<script setup>
// GbCta01 · Banda de marca (dueño: bruno). Contrato: design/contracts/blocks/cta.md · Común: _comun.md · Sin CSS (#763).
// GSurface zone="brand" padding="lg" (raíz) › GSection (título, descripción) › GStack horizontal gap="sm" (acciones:
// solid + outline) + p con `assurance`, que describe la acción principal (aria-describedby). A sangre, la aplicación
// pone `class="g-bleed"` en la raíz (llega por $attrs). `media` se ignora.
import { GSection, GStack, GSurface } from '@grana/vue'
import GbActions from '../common/GbActions.js'
import { useWarn } from '../common/warn.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useCta } from './useCta.js'

defineOptions({ name: 'GbCta01' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbCta01')
const { actions, assuranceId } = useCta(props, warn)
</script>

<template>
  <GSurface zone="brand" level="flat" padding="lg" data-gb="cta-01">
    <GSection :title="title" :description="description">
      <template v-if="$slots.description" #description><slot name="description" /></template>
      <GStack orientation="horizontal" gap="sm">
        <slot name="actions" :describedby="assuranceId">
          <GbActions :actions="actions" :variants="['solid', 'outline']" :external="labels.external" :describedby="assuranceId" :warn="warn" @navigate="emit('navigate', $event)" @activate="emit('activate', $event)" />
        </slot>
      </GStack>
      <p v-if="assuranceId" :id="assuranceId">{{ assurance }}</p>
    </GSection>
  </GSurface>
</template>
