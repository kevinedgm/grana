<script setup>
// GbItinerary01 · Lista con hora (dueño: bruno). Contrato: design/contracts/blocks/itinerary.md · Común: _comun.md §15 ·
// Sin CSS (#763). GSection › con varios días, una GSection anidada por día (title = label, descripción = la fecha en
// palabras en <time> y el resumen); con uno, la fecha en GText y la lista directa › las paradas (StopList: GStack as="ol" ›
// GCard as="li" con la hora delante). «Ahora» y «siguiente» por la hora del lugar (useItinerary). Nunca GStepper.
import { computed } from 'vue'
import { GSection, GText, useSectionLevel } from '@grana/vue'
import { has } from '../common/text.js'
import { useWarn } from '../common/warn.js'
import StopList from './StopList.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useItinerary } from './useItinerary.js'

defineOptions({ name: 'GbItinerary01' })
const props = defineProps(sectionProps)
defineEmits(sectionEmits)
const warn = useWarn('GbItinerary01')
const { level } = useSectionLevel()
const { days, markOf, badge } = useItinerary(props, warn, '01')
const several = computed(() => days.value.length > 1)
// Título de la sección › (día) › parada: un nivel más por cada GSection
const cardLevel = computed(() => Math.min(Math.min(level.value, 4) + (several.value ? 2 : 1), 6))
</script>

<template>
  <GSection v-if="days.length" :title="title" :description="description" data-gb="itinerary-01">
    <template v-if="several">
      <GSection v-for="d in days" :id="has(d.day.id) && typeof d.day.id === 'string' ? d.day.id : undefined" :key="d.key" :title="d.day.label">
        <template v-if="d.date || has(d.day.summary)" #description><time v-if="d.date" :datetime="d.date.datetime">{{ d.date.text }}</time><template v-if="d.date && has(d.day.summary)">{{ ' · ' }}</template><template v-if="has(d.day.summary)">{{ d.day.summary }}</template></template>
        <StopList :day="d" :heading-level="cardLevel" :mark-of="markOf" :badge="badge" :stop-slot="$slots.stop" />
      </GSection>
    </template>
    <template v-else>
      <GText v-if="days[0].date || has(days[0].day.summary)" size="body-sm" tone="muted"><time v-if="days[0].date" :datetime="days[0].date.datetime">{{ days[0].date.text }}</time><template v-if="days[0].date && has(days[0].day.summary)">{{ ' · ' }}</template><template v-if="has(days[0].day.summary)">{{ days[0].day.summary }}</template></GText>
      <StopList :day="days[0]" :heading-level="cardLevel" :mark-of="markOf" :badge="badge" :stop-slot="$slots.stop" />
    </template>
  </GSection>
</template>
