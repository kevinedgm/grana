<script setup>
// GbTestimonials01 · Tarjetas (dueño: bruno). Contrato: design/contracts/blocks/testimonials.md · Común: _comun.md · Sin
// CSS (#763). GSection › GAdaptiveLayout role="list" › div role="listitem" g-adapt-wide › GCard as="div" sin título, con
// GAvatar size="lg" (decorativo: el nombre está en figcaption) en `lead` y la `figure` en el cuerpo. La tarjeta toma su
// nombre del autor (role="group" + aria-labelledby, hallazgo T-L1: GCard sin título avisa).
import { useId } from 'vue'
import { GAdaptiveLayout, GAvatar, GCard, GSection } from '@grana/vue'
import { useWarn } from '../common/warn.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import TestimonialFigure from './TestimonialFigure.js'
import { useTestimonials } from './useTestimonials.js'

defineOptions({ name: 'GbTestimonials01' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbTestimonials01')
const uid = useId()
const rows = useTestimonials(props, warn)
</script>

<template>
  <GSection v-if="rows.length" :title="title" :description="description" data-gb="testimonials-01">
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <GAdaptiveLayout role="list">
      <div v-for="r in rows" :key="r.key" role="listitem" class="g-adapt-wide">
        <GCard as="div" role="group" :aria-labelledby="`${uid}-${r.index}-author`">
          <template #lead><GAvatar size="lg" :name="r.item.author.name" :src="r.item.author.avatar" /></template>
          <TestimonialFigure :row="r" :name-id="`${uid}-${r.index}-author`" :labels="labels" :quote="$slots.quote" :warn="warn" @navigate="emit('navigate', $event)" />
        </GCard>
      </div>
    </GAdaptiveLayout>
  </GSection>
</template>
