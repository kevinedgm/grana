<script setup>
// GbTrust01 · Fila (dueño: bruno). Contrato: design/contracts/blocks/trust.md · Común: _comun.md §27 · Sin CSS.
// Tres o cuatro promesas en una fila: GSection › GAdaptiveLayout role="list" › div role="listitem" g-adapt-short › GCard as="div" level="flat" density="compact"
// (lead = GIcon decorativo, title al nivel de dentro, description, actions = la prueba en GBtn variant="link").
import { computed } from 'vue'
import { GAdaptiveLayout, GCard, GIcon, GSection, useSectionLevel } from '@grana/vue'
import { useWarn } from '../common/warn.js'
import TrustProof from './TrustProof.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useTrust } from './useTrust.js'

defineOptions({ name: 'GbTrust01' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbTrust01')
const { level } = useSectionLevel()
const inner = computed(() => Math.min(Math.min(level.value, 4) + 1, 6))
const { rows } = useTrust(props, warn)
</script>

<template>
  <GSection v-if="rows.length" :title="title" :description="description" data-gb="trust-01">
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <GAdaptiveLayout role="list">
      <div v-for="r in rows" :key="r.key" role="listitem" class="g-adapt-short">
        <GCard as="div" level="flat" density="compact" :title="r.item.title" :description="r.item.description" :heading-level="inner">
          <template v-if="r.icon" #lead><GIcon :name="r.icon" /></template>
          <template v-if="$slots.item" #default><slot name="item" :item="r.item" /></template>
          <template v-if="r.proof" #actions><TrustProof :row="r" :external="labels.external" :warn="warn" @navigate="emit('navigate', $event)" @activate="emit('activate', $event)" /></template>
        </GCard>
      </div>
    </GAdaptiveLayout>
  </GSection>
</template>
