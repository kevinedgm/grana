<script setup>
// GbPolicies03 · Tarjetas (dueño: bruno). Contrato: design/contracts/blocks/policies.md · Común: _comun.md §15 · Sin CSS
// (#763). GSection › GAdaptiveLayout role="list" › div role="listitem" g-adapt-wide › GCard as="div" (id = ancla, title,
// description = summary, lead = GIcon decorativo, cuerpo = GText as="div" body-sm con los párrafos de body o el slot body,
// el link en `actions`). Un icono sin registrar lo avisa GIcon (P3: el bloque no lo repite).
import { computed } from 'vue'
import { GAdaptiveLayout, GCard, GIcon, GSection, GText, useSectionLevel } from '@grana/vue'
import GbLink from '../common/link.js'
import { has } from '../common/text.js'
import { useWarn } from '../common/warn.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { usePolicies } from './usePolicies.js'

defineOptions({ name: 'GbPolicies03' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbPolicies03')
const { level } = useSectionLevel()
const inner = computed(() => Math.min(Math.min(level.value, 4) + 1, 6))
const rows = usePolicies(props, warn)
</script>

<template>
  <GSection v-if="rows.length" :title="title" :description="description" data-gb="policies-03">
    <GAdaptiveLayout role="list">
      <div v-for="r in rows" :key="r.key" role="listitem" class="g-adapt-wide">
        <GCard as="div" :id="r.anchor" :title="r.item.title" :description="r.summary || undefined" :heading-level="inner">
          <template v-if="has(r.item.icon)" #lead><GIcon :name="r.item.icon" /></template>
          <GText as="div" size="body-sm">
            <slot name="body" :item="r.item"><p v-for="(p, i) in r.paras" :key="i">{{ p }}</p></slot>
          </GText>
          <template v-if="r.link" #actions>
            <GbLink :link="r.link" :item="r.item" :external="labels.external" what="items.link" :warn="warn" @navigate="emit('navigate', $event)" />
          </template>
        </GCard>
      </div>
    </GAdaptiveLayout>
  </GSection>
</template>
