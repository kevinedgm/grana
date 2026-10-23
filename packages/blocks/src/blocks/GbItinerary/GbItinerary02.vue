<script setup>
// GbItinerary02 · Por días (dueño: bruno). Contrato: design/contracts/blocks/itinerary.md · Común: _comun.md §15 · Sin CSS
// (#763). GSection › GAccordion (headingLevel un nivel por debajo; arrows) › GAccordionItem por día (id = day.id, title =
// label, meta = la fecha en palabras en <time> y, el día con «ahora», labels.now en texto; peek = summary o «{hora} ·
// {primera parada}») › las paradas de 01. El día de hoy NO se abre solo: la persona decide (itinerary.md regla 4).
import { computed } from 'vue'
import { GAccordion, GAccordionItem, GSection, useSectionLevel } from '@grana/vue'
import { has } from '../common/text.js'
import { useWarn } from '../common/warn.js'
import StopList from './StopList.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useItinerary } from './useItinerary.js'

defineOptions({ name: 'GbItinerary02' })
const props = defineProps(sectionProps)
defineEmits(sectionEmits)
const warn = useWarn('GbItinerary02')
const { level } = useSectionLevel()
const inner = computed(() => Math.min(Math.min(level.value, 4) + 1, 6))
const cardLevel = computed(() => Math.min(inner.value + 1, 6))
const { days, mark, markOf, badge } = useItinerary(props, warn, '02')
const anchor = (id) => (typeof id === 'string' && /^[^\s#]+$/.test(id) ? id : undefined)
const peek = (d) => {
  if (has(d.day.summary)) return d.day.summary
  const first = d.stops[0]
  if (!first) return undefined
  return first.time ? `${first.time.text} · ${first.stop.title}` : first.stop.title
}
// El día con «ahora» lo dice en su meta (texto): se encuentra al recorrer los encabezados
const today = (d) => mark.value.day === d.key && mark.value.now !== null ? badge('now') : ''
</script>

<template>
  <GSection v-if="days.length" :title="title" :description="description" data-gb="itinerary-02">
    <GAccordion :heading-level="inner" arrows>
      <GAccordionItem v-for="d in days" :id="anchor(d.day.id)" :key="d.key" :value="d.key" :title="d.day.label" :peek="peek(d)">
        <template v-if="d.date || today(d)" #meta><time v-if="d.date" :datetime="d.date.datetime">{{ d.date.text }}</time><template v-if="d.date && today(d)">{{ ' · ' }}</template><template v-if="today(d)">{{ today(d) }}</template></template>
        <StopList :day="d" :heading-level="cardLevel" :mark-of="markOf" :badge="badge" :stop-slot="$slots.stop" />
      </GAccordionItem>
    </GAccordion>
  </GSection>
</template>
