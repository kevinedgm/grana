<script setup>
// GbGuestForm02 · Por pasos (dueño: bruno). Contrato: design/contracts/blocks/guest-form.md «Pasos (02)» · Común: _comun.md
// §15 · Sin CSS (#763). GSection › GStepper (steps = los grupos; los consentimientos y lo que no tiene grupo van con el
// último; navigation="back", v-model = `step`) + el formulario con solo el grupo actual a la vista (los demás hidden y
// montados: sus datos van en el envío). «Siguiente» comprueba solo el paso; «Atrás» no valida; el último envía. El cambio
// de paso lo anuncia GStepper. Ignora `offer`.
import { computed } from 'vue'
import { GSection, GStack, GStepper, useSectionLevel } from '@grana/vue'
import { useWarn } from '../common/warn.js'
import GuestForm from './GuestForm.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useGuestForm } from './useGuestForm.js'

defineOptions({ name: 'GbGuestForm02' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbGuestForm02')
const { level } = useSectionLevel()
const inner = computed(() => Math.min(Math.min(level.value, 4) + 1, 6))
const g = useGuestForm(props, emit, warn, '02')
const onStep = (id) => g.goTo(g.stepIds.value.indexOf(id))
</script>

<template>
  <GSection v-if="g.fields.value.length" :title="title" :description="description" data-gb="guest-form-02">
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <GStack gap="lg">
      <GStepper v-if="g.steps.value.length > 1" :steps="g.steps.value" :model-value="g.current.value" navigation="back" :labels="labels.stepper" :aria-label="title" @update:model-value="onStep" />
      <GuestForm :g="g" :p="props" :heading-level="inner" variant="02" :slots="$slots" :warn="warn" @navigate="emit('navigate', $event)" />
    </GStack>
  </GSection>
</template>
