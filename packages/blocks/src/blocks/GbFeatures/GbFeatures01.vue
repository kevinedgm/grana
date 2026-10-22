<script setup>
// GbFeatures01 · Rejilla (dueño: bruno). Contrato: design/contracts/blocks/features.md · Común: _comun.md · Sin CSS (#763).
// GSection › GAdaptiveLayout role="list" › div role="listitem" g-adapt-standard › GCard. Icono en `lead`; con `action`, la
// tarjeta entera es la puerta (#819). Ignora `media`.
import { computed } from 'vue'
import { GAdaptiveLayout, GCard, GIcon, GSection, useSectionLevel } from '@grana/vue'
import { cardAction } from '../common/card.js'
import { useItems } from '../common/list.js'
import { has } from '../common/text.js'
import { useWarn } from '../common/warn.js'
import { MAX_ITEMS, emits as sectionEmits, props as sectionProps } from './props.js'

defineOptions({ name: 'GbFeatures01' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbFeatures01')
// Títulos de dentro, un nivel por debajo de la sección (regla 6, #817)
const { level } = useSectionLevel()
const inner = computed(() => Math.min(Math.min(level.value, 4) + 1, 6))

const list = useItems(() => props.items, { required: ['title'], range: [1, MAX_ITEMS], warn })
const rows = computed(() => list.value.map((e) => ({ ...e, act: cardAction(e.item.action, props.labels, `items[${e.index}]`, warn) })))
</script>

<template>
  <GSection v-if="rows.length" :title="title" :description="description" data-gb="features-01">
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <GAdaptiveLayout role="list">
      <div v-for="r in rows" :key="r.key" role="listitem" class="g-adapt-standard">
        <GCard
          :title="r.item.title"
          :description="r.item.description"
          :heading-level="inner"
          v-bind="r.act.card"
          @navigate="emit('navigate', { ...$event, item: r.item })"
          @activate="emit('activate', { ...$event, item: r.item })"
        >
          <template v-if="has(r.item.icon)" #lead><GIcon :name="r.item.icon" /></template>
          <template v-if="r.act.external" #title>{{ r.item.title }} <GIcon name="external-link" :label="r.act.externalLabel" /></template>
          <template v-if="$slots.item" #default><slot name="item" :item="r.item" :index="r.index" /></template>
        </GCard>
      </div>
    </GAdaptiveLayout>
  </GSection>
</template>
