<script setup>
// GbAvailability02 · Próximas fechas (dueño: bruno). Contrato: design/contracts/blocks/availability.md · Común: _comun.md
// §15 · Sin CSS (#763). Las próximas fechas abiertas en una lista que se lee de un vistazo en el teléfono: GSection ›
// GPriceScope › GStack as="ul" gap="sm" [aria-label=labels.upcoming] › GCard as="li" level="flat"
// orientation="horizontal" interaction="button" por cada uno de los `upcoming` primeros días open/few desde hoy (al
// montar) o `min` (título = <time> con el día en palabras; insignia = labels.status.few; cuerpo: GPrice sm y la nota);
// activar → `select` (en stay elige la llegada: { start, end: null }). Sin fechas abiertas, la lista no se pinta y va el
// slot `empty` (V4). Ignora `total`, `minNights`/`maxNights`.
import { computed, useSlots } from 'vue'
import { GCard, GSection, GStack, useSectionLevel } from '@grana/vue'
import { GPrice } from '@grana/vue/price'
import GbPriceRegion from '../common/priceRegion.js'
import { has } from '../common/text.js'
import { useWarn } from '../common/warn.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useAvailability } from './useAvailability.js'

defineOptions({ name: 'GbAvailability02' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbAvailability02')
const slots = useSlots()
const { level } = useSectionLevel()
const inner = computed(() => Math.min(Math.min(level.value, 4) + 1, 6))
const a = useAvailability(props, emit, warn, '02', () => Boolean(slots.empty))
const { upcomingList, region, locale } = a
const listLabel = computed(() => {
  const t = props.labels && props.labels.upcoming
  try { if (process.env.NODE_ENV !== 'production' && upcomingList.value.length && !has(t)) warn('C5:upcoming', 'falta labels.upcoming («Próximas fechas»): la lista va sin nombre (C5).') } catch {}
  return has(t) ? t : undefined
})
const pick = (event, r) => a.select(event, a.stay.value ? { start: r.iso, end: null } : r.iso)
</script>

<template>
  <GSection :title="title" :description="description" data-gb="availability-02">
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <GbPriceRegion v-if="upcomingList.length" :region="region" :labels="labels" :locale="locale">
      <GStack as="ul" gap="sm" :aria-label="listLabel">
        <GCard v-for="r in upcomingList" :key="r.key" as="li" level="flat" orientation="horizontal" interaction="button" :title="r.time.text" :badge="r.few || undefined" :description="r.day.note || undefined" :heading-level="inner" @activate="pick($event.event, r)">
          <template #title><time :datetime="r.time.datetime">{{ r.time.text }}</time></template>
          <GPrice v-if="r.price" v-bind="r.price" size="sm" />
        </GCard>
      </GStack>
    </GbPriceRegion>
    <slot v-else name="empty" />
  </GSection>
</template>
