<script setup>
// GbLocation03 · Puntos de encuentro (dueño: bruno). Contrato: design/contracts/blocks/location.md · Común: _comun.md §15 ·
// Sin CSS (#763). GSection › [la dirección principal + «Cómo llegar» outline, si hay] + GSection anidada (labels.points) ›
// GStack as="ul" gap="md" › GCard as="li" level="outlined" orientation="auto" mediaPosition="start" por punto (title =
// name, eyebrow = <time> de la hora en la zona del lugar, description, media, la dirección del punto en GText as="address",
// actions: su `directions` outline). Ignora `map` (cada punto lleva su foto).
import { computed } from 'vue'
import { GCard, GSection, GStack, GText, useSectionLevel } from '@grana/vue'
import GbActions from '../common/GbActions.js'
import { imgAttrs } from '../common/media.js'
import { useWarn } from '../common/warn.js'
import LocationAddress from './LocationAddress.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useLocation } from './useLocation.js'

defineOptions({ name: 'GbLocation03' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbLocation03')
const { level } = useSectionLevel()
const { address, hours, channels, directions, points, pointsTitle } = useLocation(props, warn, '03')
const cardLevel = computed(() => Math.min(Math.min(level.value, 4) + (pointsTitle.value ? 2 : 1), 6))
const main = computed(() => Boolean(props.name || address.value.length || hours.value.list.length || channels.value.list.length || directions.value.length))
</script>

<template>
  <GSection :title="title" :description="description" data-gb="location-03">
    <GStack v-if="main" gap="md">
      <LocationAddress :name="name" :lines="address" :hours="hours" :channels="channels" :external="labels.external" :address-slot="$slots.address" :warn="warn" @navigate="emit('navigate', $event)" />
      <GStack v-if="directions.length" orientation="horizontal" gap="sm">
        <GbActions :actions="directions" :variants="['outline']" :external="labels.external" :warn="warn" @navigate="emit('navigate', $event)" @activate="emit('activate', $event)" />
      </GStack>
    </GStack>
    <component :is="pointsTitle ? GSection : 'div'" v-if="points.length" v-bind="pointsTitle ? { title: pointsTitle } : {}">
      <GStack as="ul" gap="md">
        <GCard v-for="p in points" :key="p.key" as="li" level="outlined" orientation="auto" media-position="start" :title="p.item.name" :description="p.item.description || undefined" :heading-level="cardLevel">
          <template v-if="p.time" #eyebrow><time v-if="p.time.datetime" :datetime="p.time.datetime">{{ p.time.text }}</time><template v-else>{{ p.time.text }}</template></template>
          <template v-if="p.media" #media><img v-bind="imgAttrs(p.media)"></template>
          <GText v-if="p.address.length" as="address" size="body-sm"><template v-for="(l, i) in p.address" :key="i"><br v-if="i">{{ l }}</template></GText>
          <template v-if="p.directions.length" #actions>
            <GbActions :actions="p.directions" :variants="['outline']" :external="labels.external" :warn="warn" @navigate="emit('navigate', { ...$event, item: p.item })" @activate="emit('activate', { ...$event, item: p.item })" />
          </template>
        </GCard>
      </GStack>
    </component>
  </GSection>
</template>
