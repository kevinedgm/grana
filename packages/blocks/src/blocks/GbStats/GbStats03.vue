<script setup>
// GbStats03 · Junto a un párrafo (dueño: bruno). Contrato: design/contracts/blocks/stats.md · Común: _comun.md · Sin CSS.
// GSection (sin descripción) › GAdaptiveLayout › [div g-adapt-wide › GContainer width="reading" › GText as="div" › párrafos de
// `description`] + [GAdaptiveLayout role="list" con las cifras de 01]. Sin `description` ni slot, se pinta como 01.
import { computed, useSlots } from 'vue'
import { GAdaptiveLayout, GContainer, GMetric, GSection, GText } from '@grana/vue'
import { paragraphs } from '../common/text.js'
import { useWarn } from '../common/warn.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useStats } from './useStats.js'

defineOptions({ name: 'GbStats03' })
const props = defineProps(sectionProps)
defineEmits(sectionEmits)
const slots = useSlots()
const rows = useStats(props, useWarn('GbStats03'))
const paras = computed(() => paragraphs(props.description))
const beside = computed(() => Boolean(slots.description) || paras.value.length > 0)
</script>

<template>
  <GSection v-if="rows.length" :title="title" data-gb="stats-03">
    <GAdaptiveLayout v-if="beside">
      <div class="g-adapt-wide">
        <GContainer width="reading">
          <GText as="div"><slot name="description"><p v-for="(p, i) in paras" :key="i">{{ p }}</p></slot></GText>
        </GContainer>
      </div>
      <GAdaptiveLayout role="list">
        <div v-for="r in rows" :key="r.key" role="listitem" class="g-adapt-short">
          <GMetric size="lg" :label="r.item.label" :value="r.value" :unit="r.item.unit" :context="r.context" />
        </div>
      </GAdaptiveLayout>
    </GAdaptiveLayout>
    <GAdaptiveLayout v-else role="list">
      <div v-for="r in rows" :key="r.key" role="listitem" class="g-adapt-short">
        <GMetric size="lg" :label="r.item.label" :value="r.value" :unit="r.item.unit" :context="r.context" />
      </div>
    </GAdaptiveLayout>
  </GSection>
</template>
