<script setup>
// GbHero01 · La ventana (dueño: bruno). Contrato: design/contracts/blocks/hero.md · Común: _comun.md · Sin CSS (#763).
// GHero appearance="window": foto por el vano junto al texto, con la ventana de detalle. Ignora `views` y el slot `consult`.
import { computed } from 'vue'
import { GHero } from '@grana/vue/hero'
import GbActions from '../common/GbActions.js'
import { checkMedia } from '../common/media.js'
import { useWarn } from '../common/warn.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'

defineOptions({ name: 'GbHero01' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbHero01')

// Solo lo que la forma usa (regla 3): `views` no llega a GHero
const hero = computed(() => {
  const p = { appearance: 'window', title: props.title, eyebrow: props.eyebrow, lead: props.lead, aside: props.aside, media: props.media, labels: { pause: props.labels.pause } }
  if (props.detail) p.detail = props.detail
  return p
})
checkMedia(props.detail, 'detail', warn)
</script>

<template>
  <GHero v-bind="hero" data-gb="hero-01">
    <template v-if="$slots.media" #media><slot name="media" /></template>
    <template v-if="$slots.actions || actions.length" #actions>
      <slot name="actions">
        <GbActions :actions="actions" :variants="['solid', 'link']" size="lg" :external="labels.external" :warn="warn" @navigate="emit('navigate', $event)" @activate="emit('activate', $event)" />
      </slot>
    </template>
  </GHero>
</template>
