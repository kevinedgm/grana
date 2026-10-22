<script setup>
// GbNewsletter02 · Tarjeta (dueño: bruno). Contrato: design/contracts/blocks/newsletter.md · Común: _comun.md · Sin CSS.
// GCard as="section" (raíz; el título de la sección es el de la tarjeta, al nivel de useSectionLevel(), regla 6) › cuerpo:
// el formulario de 01 + `legal`.
import { computed } from 'vue'
import { GCard, useSectionLevel } from '@grana/vue'
import { useWarn } from '../common/warn.js'
import NewsletterForm from './NewsletterForm.vue'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { checkSubmitListener } from './useNewsletter.js'

defineOptions({ name: 'GbNewsletter02' })
defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbNewsletter02')
checkSubmitListener(warn)
const { level } = useSectionLevel()
const heading = computed(() => Math.min(level.value, 6))
</script>

<template>
  <GCard as="section" :title="title" :description="description" :heading-level="heading" data-gb="newsletter-02">
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <NewsletterForm
      :field="field" :action="action" :legal="legal" :busy="busy" :error="error" :done="done" :labels="labels" :warn="warn"
      @submit="emit('submit', $event)" @navigate="emit('navigate', $event)"
    >
      <template v-if="$slots.legal" #legal><slot name="legal" /></template>
    </NewsletterForm>
  </GCard>
</template>
