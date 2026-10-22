<script setup>
// GbNewsletter03 · Banda de marca (dueño: bruno). Contrato: design/contracts/blocks/newsletter.md · Común: _comun.md · Sin
// CSS. GSurface zone="brand" padding="lg" (raíz) › el contenido de 01 (GSection › formulario). A sangre, la aplicación
// pone `class="g-bleed"` en la raíz dentro de un GContainer (llega por $attrs).
import { GSection, GSurface } from '@grana/vue'
import { useWarn } from '../common/warn.js'
import NewsletterForm from './NewsletterForm.vue'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { checkSubmitListener } from './useNewsletter.js'

defineOptions({ name: 'GbNewsletter03' })
defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbNewsletter03')
checkSubmitListener(warn)
</script>

<template>
  <GSurface zone="brand" level="flat" padding="lg" data-gb="newsletter-03">
    <GSection :title="title" :description="description">
      <template v-if="$slots.description" #description><slot name="description" /></template>
      <NewsletterForm
        :field="field" :action="action" :legal="legal" :busy="busy" :error="error" :done="done" :labels="labels" :warn="warn"
        @submit="emit('submit', $event)" @navigate="emit('navigate', $event)"
      >
        <template v-if="$slots.legal" #legal><slot name="legal" /></template>
      </NewsletterForm>
    </GSection>
  </GSurface>
</template>
