<script setup>
// GbMenu01 · Carta (dueño: bruno). Contrato: design/contracts/blocks/menu.md · Común: _comun.md §15 · Sin CSS (#763).
// Todos los tiempos en la página, uno debajo de otro: GSection (título, descripción) › GPriceScope (la moneda se dice
// una vez) › GStack gap="lg" › GSection anidada por tiempo (`id` = ancla, `title` = name, `description`) › horario en
// GText + el dl de platos (GText size="body", #863). Ignora `media`.
import { GSection, GStack, GText } from '@grana/vue'
import GbPriceRegion from '../common/priceRegion.js'
import { useWarn } from '../common/warn.js'
import MenuDishes from './MenuDishes.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useMenu } from './useMenu.js'

defineOptions({ name: 'GbMenu01' })
const props = defineProps(sectionProps)
defineEmits(sectionEmits)
const warn = useWarn('GbMenu01')
const { sections, region, hours } = useMenu(props, warn, '01')
</script>

<template>
  <GSection v-if="sections.length" :title="title" :description="description" data-gb="menu-01">
    <GbPriceRegion :region="region" :labels="labels" :locale="locale">
      <GStack gap="lg">
        <GSection v-for="s in sections" :id="s.id || undefined" :key="s.key" :title="s.section.name" :description="s.section.description">
          <GText v-if="hours(s.section)" size="body-sm" tone="muted">{{ hours(s.section) }}</GText>
          <MenuDishes :row="s" :labels="labels" size="body" :item-slot="$slots.item" />
        </GSection>
      </GStack>
    </GbPriceRegion>
  </GSection>
</template>
