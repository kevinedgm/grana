<script setup>
// GbPolicies02 · Todo a la vista (dueño: bruno). Contrato: design/contracts/blocks/policies.md · Común: _comun.md §15 · Sin
// CSS (#763). GSection › GContainer width="reading" horizontal="start" (#845) › GStack gap="lg" › GSection anidada por
// política (id = ancla, title, description = summary; nivel automático) › GText as="div" con los párrafos de body (o el
// slot body) + el link. Corrige la «lista dl» del plan (_comun.md §23). Ignora `icon`.
import { GContainer, GSection, GStack, GText } from '@grana/vue'
import GbLink from '../common/link.js'
import { useWarn } from '../common/warn.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { usePolicies } from './usePolicies.js'

defineOptions({ name: 'GbPolicies02' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbPolicies02')
const rows = usePolicies(props, warn)
</script>

<template>
  <GSection v-if="rows.length" :title="title" :description="description" data-gb="policies-02">
    <GContainer width="reading" horizontal="start">
      <GStack gap="lg">
        <GSection v-for="r in rows" :id="r.anchor" :key="r.key" :title="r.item.title" :description="r.summary || undefined">
          <GText as="div">
            <slot name="body" :item="r.item"><p v-for="(p, i) in r.paras" :key="i">{{ p }}</p></slot>
            <p v-if="r.link"><GbLink :link="r.link" :item="r.item" :external="labels.external" what="items.link" :warn="warn" @navigate="emit('navigate', $event)" /></p>
          </GText>
        </GSection>
      </GStack>
    </GContainer>
  </GSection>
</template>
