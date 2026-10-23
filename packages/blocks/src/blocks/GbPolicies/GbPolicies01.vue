<script setup>
// GbPolicies01 · Avance (dueño: bruno). Contrato: design/contracts/blocks/policies.md · Común: _comun.md §15 · Sin CSS
// (#763). GSection › GAccordion (headingLevel un nivel por debajo, useSectionLevel) › GAccordionItem (id = ancla, title,
// peek = summary o el primer párrafo) › GText as="div" con los párrafos de body (o el slot body) + el link. Plegada, la
// búsqueda del navegador encuentra el texto (hidden="until-found") y #id la abre (#482): lo hace GAccordion. Ignora `icon`.
import { computed } from 'vue'
import { GAccordion, GAccordionItem, GSection, GText, useSectionLevel } from '@grana/vue'
import GbLink from '../common/link.js'
import { useWarn } from '../common/warn.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { usePolicies } from './usePolicies.js'

defineOptions({ name: 'GbPolicies01' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbPolicies01')
const { level } = useSectionLevel()
const inner = computed(() => Math.min(Math.min(level.value, 4) + 1, 6))
const rows = usePolicies(props, warn)
</script>

<template>
  <GSection v-if="rows.length" :title="title" :description="description" data-gb="policies-01">
    <GAccordion :heading-level="inner">
      <GAccordionItem v-for="r in rows" :id="r.anchor" :key="r.key" :value="r.key" :title="r.item.title" :peek="r.peek || undefined">
        <GText as="div">
          <slot name="body" :item="r.item"><p v-for="(p, i) in r.paras" :key="i">{{ p }}</p></slot>
          <p v-if="r.link"><GbLink :link="r.link" :item="r.item" :external="labels.external" what="items.link" :warn="warn" @navigate="emit('navigate', $event)" /></p>
        </GText>
      </GAccordionItem>
    </GAccordion>
  </GSection>
</template>
