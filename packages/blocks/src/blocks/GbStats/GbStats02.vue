<script setup>
// GbStats02 · Banda (dueño: bruno). Contrato: design/contracts/blocks/stats.md · Común: _comun.md · Sin CSS (#763).
// GSurface zone="brand" padding="lg" (raíz) › GSection › la lista de 01. A sangre, la aplicación pone `class="g-bleed"` en
// la raíz dentro de un GContainer (llega por $attrs). Una banda de marca por página además del héroe (aviso S2).
import { GAdaptiveLayout, GMetric, GSection, GSurface } from '@grana/vue'
import { useWarn } from '../common/warn.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useStats } from './useStats.js'

defineOptions({ name: 'GbStats02' })
const props = defineProps(sectionProps)
defineEmits(sectionEmits)
const rows = useStats(props, useWarn('GbStats02'))
</script>

<template>
  <GSurface v-if="rows.length" zone="brand" level="flat" padding="lg" data-gb="stats-02">
    <GSection :title="title" :description="description">
      <template v-if="$slots.description" #description><slot name="description" /></template>
      <GAdaptiveLayout role="list">
        <div v-for="r in rows" :key="r.key" role="listitem" class="g-adapt-short">
          <GMetric size="lg" :label="r.item.label" :value="r.value" :unit="r.item.unit" :context="r.context" />
        </div>
      </GAdaptiveLayout>
    </GSection>
  </GSurface>
</template>
