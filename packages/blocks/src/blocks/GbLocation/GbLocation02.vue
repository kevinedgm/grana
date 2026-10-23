<script setup>
// GbLocation02 · Dos columnas (dueño: bruno). Contrato: design/contracts/blocks/location.md · Común: _comun.md §15 · Sin
// CSS (#763). GSection › GAdaptiveLayout gap="lg" › [GStack g-adapt-wide: la dirección + «Cómo llegar» outline] + [GCard
// as="div" level="flat" mediaPosition="top" g-adapt-standard, title = labels.map, media = el mapa o el slot `map`]. Una
// columna en estrecho (lo decide GAdaptiveLayout). Ignora `points` (L3).
import { computed } from 'vue'
import { GAdaptiveLayout, GCard, GSection, GStack, useSectionLevel } from '@grana/vue'
import GbActions from '../common/GbActions.js'
import { imgAttrs } from '../common/media.js'
import { useWarn } from '../common/warn.js'
import LocationAddress from './LocationAddress.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useLocation } from './useLocation.js'

defineOptions({ name: 'GbLocation02' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbLocation02')
const { level } = useSectionLevel()
const inner = computed(() => Math.min(Math.min(level.value, 4) + 1, 6))
const { address, hours, channels, map, directions } = useLocation(props, warn, '02')
</script>

<template>
  <GSection :title="title" :description="description" data-gb="location-02">
    <GAdaptiveLayout gap="lg">
      <GStack gap="md" class="g-adapt-wide">
        <LocationAddress :name="name" :lines="address" :hours="hours" :channels="channels" :external="labels.external" :address-slot="$slots.address" :warn="warn" @navigate="emit('navigate', $event)" />
        <GStack v-if="directions.length" orientation="horizontal" gap="sm">
          <GbActions :actions="directions" :variants="['outline']" :external="labels.external" :warn="warn" @navigate="emit('navigate', $event)" @activate="emit('activate', $event)" />
        </GStack>
      </GStack>
      <GCard v-if="map || $slots.map" as="div" level="flat" media-position="top" class="g-adapt-standard" :title="map && map.label ? map.label : undefined" :heading-level="inner">
        <template #media><slot name="map"><img v-bind="imgAttrs(map.media)"></slot></template>
      </GCard>
    </GAdaptiveLayout>
  </GSection>
</template>
