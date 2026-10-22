<script setup>
// GbHero03 · El umbral (dueño: bruno). Contrato: design/contracts/blocks/hero.md · Común: _comun.md · Sin CSS (#763).
// GHero appearance="threshold" + slot `consult`: foto a sangre y tarjeta que cruza su borde con la consulta. Con consulta,
// las dos acciones van `outline` (la consulta es la principal, #762, #818); sin ella, como 01. Ignora `detail` y `views`.
import { computed, useSlots } from 'vue'
import { GHero } from '@grana/vue/hero'
import GbActions from '../common/GbActions.js'
import { useWarn } from '../common/warn.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'

defineOptions({ name: 'GbHero03' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const slots = useSlots()
const warn = useWarn('GbHero03')

const hero = computed(() => ({ appearance: 'threshold', title: props.title, eyebrow: props.eyebrow, lead: props.lead, aside: props.aside, media: props.media, labels: { pause: props.labels.pause } }))
const variants = computed(() => (slots.consult ? ['outline', 'outline'] : ['solid', 'link']))
</script>

<template>
  <GHero v-bind="hero" data-gb="hero-03">
    <template v-if="$slots.consult" #consult><slot name="consult" /></template>
    <template v-if="$slots.media" #media><slot name="media" /></template>
    <template v-if="$slots.actions || actions.length" #actions>
      <slot name="actions">
        <GbActions :actions="actions" :variants="variants" size="lg" :external="labels.external" :warn="warn" @navigate="emit('navigate', $event)" @activate="emit('activate', $event)" />
      </slot>
    </template>
  </GHero>
</template>
