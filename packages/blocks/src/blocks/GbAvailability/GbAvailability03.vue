<script setup>
// GbAvailability03 · Calendario + resumen (dueño: bruno). Contrato: design/contracts/blocks/availability.md · Común:
// _comun.md §15 · Sin CSS (#763). El calendario y, al lado, lo elegido con su total y la acción: GSection › GPriceScope
// (una sola región para el calendario y el total: la moneda se dice una vez) › GAdaptiveLayout gap="lg" › [el
// calendario de 01, sin pista: su rejilla es una <table> y GAdaptiveLayout la trata como bloque completo, que ocupa la
// fila y no admite `g-adapt-wide` (hallazgo AV-L1 para lima: el contrato pide dos columnas a 1440)] + [GCard level="outlined" g-adapt-standard (título = la selección dicha con
// describeQuery, #862: GCard necesita nombre y la frase lo es; sin consulta, el título de la sección) › GPrice con el
// `total` de la aplicación + GBtn solid labels.select → `select` con la elección completa (deshabilitado mientras no lo
// está)]. El slot `summary` añade lo que la aplicación quiera antes del total. Ignora `upcoming`.
import { computed, reactive } from 'vue'
import { GAdaptiveLayout, GBtn, GCard, GSection, GStack, useSectionLevel } from '@grana/vue'
import { GPrice } from '@grana/vue/price'
import { useQueryLine } from '../common/booking.js'
import GbPriceRegion from '../common/priceRegion.js'
import { has } from '../common/text.js'
import { useWarn } from '../common/warn.js'
import AvailabilityCalendar from './AvailabilityCalendar.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useAvailability } from './useAvailability.js'

defineOptions({ name: 'GbAvailability03' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbAvailability03')
const { level } = useSectionLevel()
const inner = computed(() => Math.min(Math.min(level.value, 4) + 1, 6))
const a = useAvailability(props, emit, warn, '03')
const { current, region, locale, selectLabel } = a
// La selección dicha con las mismas palabras que la consulta: la consulta recibida con las fechas elegidas puestas
const chosen = reactive({
  query: computed(() => (props.query ? a.withDates(current.value) : null)),
  partyRows: computed(() => props.partyRows),
  context: computed(() => props.context),
  labels: computed(() => props.labels),
  locale: computed(() => props.locale)
})
const line = useQueryLine(chosen, warn, { forQuery: false, locale })
const total = computed(() => {
  const t = props.total
  if (!t || typeof t !== 'object' || t.value === undefined) return null
  const lead = props.labels && props.labels.price && has(props.labels.price.total) ? props.labels.price.total : undefined
  return { value: t.value, unit: has(t.label) ? t.label : undefined, lead }
})
const ready = computed(() => a.complete(current.value))
const change = ({ value }) => a.choose(value)
const pick = (event) => { if (ready.value) a.select(event, current.value) }
</script>

<template>
  <GSection :title="title" :description="description" data-gb="availability-03">
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <GbPriceRegion :region="region" :labels="labels" :locale="locale">
    <GAdaptiveLayout gap="lg">
      <AvailabilityCalendar :a="a" :min="min" :max="max" :labels="labels" :day-slot="$slots.day" :scoped="false" @change="change" />
      <GCard level="outlined" as="div" class="g-adapt-standard" :title="line ? line.text : title" :heading-level="inner">
        <GStack gap="md">
          <slot name="summary" :value="current" :query="chosen.query" />
          <GPrice v-if="total" v-bind="total" size="lg" :locale="region ? undefined : locale" />
          <GBtn v-if="selectLabel" variant="solid" :disabled="!ready" @click="pick">{{ selectLabel }}</GBtn>
        </GStack>
      </GCard>
    </GAdaptiveLayout>
    </GbPriceRegion>
  </GSection>
</template>
