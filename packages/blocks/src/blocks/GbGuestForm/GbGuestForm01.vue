<script setup>
// GbGuestForm01 · Una página (dueño: bruno). Contrato: design/contracts/blocks/guest-form.md · Común: _comun.md §15 · Sin
// CSS (#763). GSection (título, descripción) › el formulario (GuestForm.js): todos los grupos uno debajo de otro y el envío
// al final. Ignora `step`, labels.next/back/stepper y `offer`.
import { computed, useSlots } from 'vue'
import { GSection, useSectionLevel } from '@grana/vue'
import { useWarn } from '../common/warn.js'
import GuestForm from './GuestForm.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useGuestForm } from './useGuestForm.js'

defineOptions({ name: 'GbGuestForm01' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbGuestForm01')
const { level } = useSectionLevel()
const inner = computed(() => Math.min(Math.min(level.value, 4) + 1, 6))
const g = useGuestForm(props, emit, warn, '01', useSlots())
</script>

<template>
  <GSection v-if="g.fields.value.length" :title="title" :description="description" data-gb="guest-form-01">
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <GuestForm :g="g" :p="props" :heading-level="inner" variant="01" :slots="$slots" :warn="warn" @navigate="emit('navigate', $event)" />
  </GSection>
</template>
