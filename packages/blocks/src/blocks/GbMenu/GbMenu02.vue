<script setup>
// GbMenu02 · Por tiempos (dueño: bruno). Contrato: design/contracts/blocks/menu.md · Común: _comun.md §15 · Sin CSS (#763).
// Una pestaña por tiempo («Desayuno · Comida · Cena») y la carta de uno a la vista: GSection › GPriceScope › GTabs
// (`label` = labels.tabs, `items` = tiempos con su `id`; panel integrado por tiempo: descripción, horario y el dl de
// platos). La pestaña activa es estado de vista del bloque (GTabs no cambia sola); al montar, la del `hash` (`#comida`)
// si coincide con el `id` de un tiempo. Ignora `media`.
import { computed, onMounted, ref } from 'vue'
import { GSection, GTabs, GText } from '@grana/vue'
import GbPriceRegion from '../common/priceRegion.js'
import { has } from '../common/text.js'
import { useWarn } from '../common/warn.js'
import MenuDishes from './MenuDishes.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useMenu } from './useMenu.js'

defineOptions({ name: 'GbMenu02' })
const props = defineProps(sectionProps)
defineEmits(sectionEmits)
const warn = useWarn('GbMenu02')
const { sections, region, hours } = useMenu(props, warn, '02')
const items = computed(() => sections.value.map((s) => ({ id: s.tab, label: s.section.name })))
const active = ref(undefined)
const current = computed(() => (items.value.some((i) => i.id === active.value) ? active.value : undefined))
const tabsLabel = computed(() => {
  const t = props.labels && props.labels.tabs
  try { if (process.env.NODE_ENV !== 'production' && sections.value.length && !has(t)) warn('C5:tabs', 'falta labels.tabs (nombre de las pestañas de la carta): el tablist va sin nombre (C5).') } catch {}
  return has(t) ? t : undefined
})
const byTab = computed(() => Object.fromEntries(sections.value.map((s) => [s.tab, s])))
onMounted(() => {
  const hash = typeof location !== 'undefined' && location.hash ? decodeURIComponent(location.hash.slice(1)) : ''
  const hit = hash && sections.value.find((s) => s.id === hash)
  if (hit) active.value = hit.tab
})
</script>

<template>
  <GSection v-if="sections.length" :title="title" :description="description" data-gb="menu-02">
    <GbPriceRegion :region="region" :labels="labels" :locale="locale">
      <GTabs :model-value="current" @update:model-value="active = $event" :items="items" :label="tabsLabel">
        <template #panel="{ item }">
          <GText v-if="byTab[item.id].section.description" size="body">{{ byTab[item.id].section.description }}</GText>
          <GText v-if="hours(byTab[item.id].section)" size="body-sm" tone="muted">{{ hours(byTab[item.id].section) }}</GText>
          <MenuDishes :row="byTab[item.id]" :labels="labels" size="body" :item-slot="$slots.item" />
        </template>
      </GTabs>
    </GbPriceRegion>
  </GSection>
</template>
