<script setup>
// GbFaq02 · Todo a la vista (dueño: bruno). Contrato: design/contracts/blocks/faq.md · Común: _comun.md · Sin CSS
// (#763). GSection › GContainer width="reading" › GStack as="ul" divided › li › GSection anidada (id = faq.id, title =
// question; nivel automático) › párrafos (o el slot answer). Corrige «dos columnas» del plan (_comun.md §10).
import { GContainer, GSection, GStack } from '@grana/vue'
import { useWarn } from '../common/warn.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useFaq } from './useFaq.js'

defineOptions({ name: 'GbFaq02' })
const props = defineProps(sectionProps)
defineEmits(sectionEmits)
const rows = useFaq(props, useWarn('GbFaq02'))
</script>

<template>
  <GSection v-if="rows.length" :title="title" :description="description" data-gb="faq-02">
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <GContainer width="reading" horizontal="start">
      <GStack as="ul" divided>
        <li v-for="r in rows" :key="r.key">
          <GSection :id="r.anchor" :title="r.item.question">
            <slot name="answer" :item="r.item"><p v-for="(p, i) in r.paras" :key="i">{{ p }}</p></slot>
          </GSection>
        </li>
      </GStack>
    </GContainer>
  </GSection>
</template>
