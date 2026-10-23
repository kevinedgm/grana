<script setup>
// GbLocation01 · Tarjeta con mapa (dueño: bruno). Contrato: design/contracts/blocks/location.md · Común: _comun.md §15 · Sin
// CSS (#763). GCard as="section" (raíz; título al nivel de useSectionLevel(), description; media = <img> del mapa arriba o
// el slot `map`) › la dirección (LocationAddress) › actions: «Cómo llegar» solid (la primera acción del bloque, §3).
// Ignora `points` (L3).
import { computed } from 'vue'
import { GCard, useSectionLevel } from '@grana/vue'
import GbActions from '../common/GbActions.js'
import { imgAttrs } from '../common/media.js'
import { useWarn } from '../common/warn.js'
import LocationAddress from './LocationAddress.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useLocation } from './useLocation.js'

defineOptions({ name: 'GbLocation01' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbLocation01')
const { level } = useSectionLevel()
const heading = computed(() => Math.min(level.value, 6))
const { address, hours, channels, map, directions } = useLocation(props, warn, '01')
</script>

<template>
  <GCard as="section" :title="title" :description="description" :heading-level="heading" media-position="top" data-gb="location-01">
    <template v-if="map || $slots.map" #media><slot name="map"><img v-bind="imgAttrs(map.media)"></slot></template>
    <LocationAddress :name="name" :lines="address" :hours="hours" :channels="channels" :external="labels.external" :address-slot="$slots.address" :warn="warn" @navigate="emit('navigate', $event)" />
    <template v-if="directions.length" #actions>
      <GbActions :actions="directions" :variants="['solid']" :external="labels.external" :warn="warn" @navigate="emit('navigate', $event)" @activate="emit('activate', $event)" />
    </template>
  </GCard>
</template>
