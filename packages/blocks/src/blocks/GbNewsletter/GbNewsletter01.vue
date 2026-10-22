<script setup>
// GbNewsletter01 · En línea (dueño: bruno). Contrato: design/contracts/blocks/newsletter.md · Común: _comun.md · Sin CSS.
// GSection (título, descripción) › el formulario (GForm › GInput con el botón acoplado en `action` + p con `legal`).
import { GSection } from '@grana/vue'
import { useWarn } from '../common/warn.js'
import NewsletterForm from './NewsletterForm.vue'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { checkSubmitListener } from './useNewsletter.js'

defineOptions({ name: 'GbNewsletter01' })
defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbNewsletter01')
checkSubmitListener(warn)
</script>

<template>
  <GSection :title="title" :description="description" data-gb="newsletter-01">
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <NewsletterForm
      :field="field" :action="action" :legal="legal" :busy="busy" :error="error" :done="done" :labels="labels" :warn="warn"
      @submit="emit('submit', $event)" @navigate="emit('navigate', $event)"
    >
      <template v-if="$slots.legal" #legal><slot name="legal" /></template>
    </NewsletterForm>
  </GSection>
</template>
