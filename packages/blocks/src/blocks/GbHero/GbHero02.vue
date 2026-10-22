<script setup>
// GbHero02 · Vistas (dueño: bruno). Contrato: design/contracts/blocks/hero.md · Común: _comun.md · Sin CSS (#763).
// GHero appearance="views": foto a sangre y placa de marca con dos a cuatro vistas. Ignora `detail` y el slot `consult`.
// Con menos de dos vistas se pinta como 01 sin ventana de detalle (aviso H1). Elegir vista no emite (v-model:view reservado).
import { computed } from 'vue'
import { GHero } from '@grana/vue/hero'
import GbActions from '../common/GbActions.js'
import { checkMedia } from '../common/media.js'
import { useWarn } from '../common/warn.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'

defineOptions({ name: 'GbHero02' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbHero02')

const views = computed(() => (Array.isArray(props.views) ? props.views : []))
const enough = computed(() => views.value.length >= 2)
const hero = computed(() => {
  const p = { title: props.title, eyebrow: props.eyebrow, lead: props.lead, aside: props.aside, media: props.media }
  if (!enough.value) return { ...p, appearance: 'window', labels: { pause: props.labels.pause } }
  return { ...p, appearance: 'views', views: views.value, labels: { views: props.labels.views, pause: props.labels.pause } }
})
try { if (process.env.NODE_ENV !== 'production' && !enough.value) warn('H1', `views con ${views.value.length} entradas: hacen falta dos; se pinta como 01 (H1).`) } catch {}
views.value.forEach((v, i) => checkMedia(v && v.media, `views[${i}].media`, warn))
</script>

<template>
  <GHero v-bind="hero" data-gb="hero-02">
    <template v-if="$slots.media" #media><slot name="media" /></template>
    <template v-if="$slots.actions || actions.length" #actions>
      <slot name="actions">
        <GbActions :actions="actions" :variants="['solid', 'link']" size="lg" :external="labels.external" :warn="warn" @navigate="emit('navigate', $event)" @activate="emit('activate', $event)" />
      </slot>
    </template>
  </GHero>
</template>
