<script setup>
// GbFaq01 · Acordeón (dueño: bruno). Contrato: design/contracts/blocks/faq.md · Común: _comun.md · Sin CSS (#763).
// GSection › GAccordion (headingLevel un nivel por debajo, useSectionLevel) › GAccordionItem (id = faq.id, title =
// question, peek = primer párrafo de answer) › párrafos (o el slot answer). El corte del avance a una línea es de
// GAccordion (#483); plegada, la búsqueda del navegador encuentra el texto (hidden="until-found").
import { computed } from 'vue'
import { GAccordion, GAccordionItem, GSection, useSectionLevel } from '@grana/vue'
import { useWarn } from '../common/warn.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useFaq } from './useFaq.js'

defineOptions({ name: 'GbFaq01' })
const props = defineProps(sectionProps)
defineEmits(sectionEmits)
const warn = useWarn('GbFaq01')
const { level } = useSectionLevel()
const inner = computed(() => Math.min(Math.min(level.value, 4) + 1, 6))
const rows = useFaq(props, warn)
</script>

<template>
  <GSection v-if="rows.length" :title="title" :description="description" data-gb="faq-01">
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <GAccordion :heading-level="inner">
      <GAccordionItem v-for="r in rows" :id="r.anchor" :key="r.key" :value="r.key" :title="r.item.question" :peek="r.peek">
        <slot name="answer" :item="r.item"><p v-for="(p, i) in r.paras" :key="i">{{ p }}</p></slot>
      </GAccordionItem>
    </GAccordion>
  </GSection>
</template>
