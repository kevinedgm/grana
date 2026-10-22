<script setup>
// GbStats01 · Fila (dueño: bruno). Contrato: design/contracts/blocks/stats.md · Común: _comun.md · Sin CSS (#763).
// GSection › GAdaptiveLayout role="list" › div role="listitem" g-adapt-short › GMetric size="lg"; `source` como contexto.
import { GAdaptiveLayout, GMetric, GSection } from '@grana/vue'
import { useWarn } from '../common/warn.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useStats } from './useStats.js'

defineOptions({ name: 'GbStats01' })
const props = defineProps(sectionProps)
defineEmits(sectionEmits)
const rows = useStats(props, useWarn('GbStats01'))
</script>

<template>
  <GSection v-if="rows.length" :title="title" :description="description" data-gb="stats-01">
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <GAdaptiveLayout role="list">
      <div v-for="r in rows" :key="r.key" role="listitem" class="g-adapt-short">
        <GMetric size="lg" :label="r.item.label" :value="r.value" :unit="r.item.unit" :context="r.context" />
      </div>
    </GAdaptiveLayout>
  </GSection>
</template>
