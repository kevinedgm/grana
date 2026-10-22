<script setup>
// GbTestimonials02 · La voz (dueño: bruno). Contrato: design/contracts/blocks/testimonials.md · Común: _comun.md · Sin
// CSS (#763). GSection › GStack gap="lg" › [GCard orientation="auto" mediaPosition="start" con GAvatar size="xl" en
// `media` y la primera `figure`] + [GStack as="ul" divided › li › figure de las demás, más discretas]. Con una sola
// opinión no hay lista (una lista vacía no es lista).
import { computed, useId } from 'vue'
import { GAvatar, GCard, GSection, GStack } from '@grana/vue'
import { useWarn } from '../common/warn.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import TestimonialFigure from './TestimonialFigure.js'
import { useTestimonials } from './useTestimonials.js'

defineOptions({ name: 'GbTestimonials02' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbTestimonials02')
const uid = useId()
const rows = useTestimonials(props, warn)
const lead = computed(() => rows.value[0])
const rest = computed(() => rows.value.slice(1))
</script>

<template>
  <GSection v-if="rows.length" :title="title" :description="description" data-gb="testimonials-02">
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <GStack gap="lg">
      <GCard as="div" role="group" orientation="auto" media-position="start" :aria-labelledby="`${uid}-${lead.index}-author`">
        <template #media><GAvatar size="xl" :name="lead.item.author.name" :src="lead.item.author.avatar" /></template>
        <TestimonialFigure :row="lead" card :name-id="`${uid}-${lead.index}-author`" :labels="labels" :quote="$slots.quote" :warn="warn" @navigate="emit('navigate', $event)" />
      </GCard>
      <GStack v-if="rest.length" as="ul" divided>
        <li v-for="r in rest" :key="r.key">
          <TestimonialFigure :row="r" :labels="labels" :quote="$slots.quote" :warn="warn" @navigate="emit('navigate', $event)" />
        </li>
      </GStack>
    </GStack>
  </GSection>
</template>
