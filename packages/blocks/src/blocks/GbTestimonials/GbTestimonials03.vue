<script setup>
// GbTestimonials03 · Avance (dueño: bruno). Contrato: design/contracts/blocks/testimonials.md · Común: _comun.md · Sin
// CSS (#763). GSection › GAccordion (headingLevel un nivel por debajo, useSectionLevel) › GAccordionItem por opinión:
// title = author.name, meta = source.label, peek = primer párrafo de `quote` (en su idioma); el panel lleva la `figure`
// completa. El corte del avance a una línea es de GAccordion (#483): la cita no se recorta.
import { computed } from 'vue'
import { GAccordion, GAccordionItem, GSection, useSectionLevel } from '@grana/vue'
import { useWarn } from '../common/warn.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import TestimonialFigure from './TestimonialFigure.js'
import { useTestimonials } from './useTestimonials.js'

defineOptions({ name: 'GbTestimonials03' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbTestimonials03')
const { level } = useSectionLevel()
const inner = computed(() => Math.min(Math.min(level.value, 4) + 1, 6))
const rows = useTestimonials(props, warn)
</script>

<template>
  <GSection v-if="rows.length" :title="title" :description="description" data-gb="testimonials-03">
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <GAccordion :heading-level="inner">
      <GAccordionItem v-for="r in rows" :key="r.key" :value="r.key" :title="r.item.author.name" :meta="r.source ? r.source.label : undefined">
        <template #peek><span :lang="r.lang">{{ r.first }}</span></template>
        <TestimonialFigure :row="r" :labels="labels" :quote="$slots.quote" :warn="warn" @navigate="emit('navigate', $event)" />
      </GAccordionItem>
    </GAccordion>
  </GSection>
</template>
