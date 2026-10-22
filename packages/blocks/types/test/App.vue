<script setup lang="ts">
// Plantillas con las variantes (src/types.test.js, vue-tsc). Cada `@vue-expect-error` es un uso erróneo que DEBE fallar.
import { GbFeatures01, GbFeatures02, GbFeatures03, GbHero01, GbStats01, GbStats02 } from '@grana/blocks/marketing'
import type { BlockNavigate, Feature } from '@grana/blocks/marketing'

const items: Feature[] = [{ title: 'Patio' }, { title: 'Terraza', action: { label: 'Fotos', href: '#fotos' } }]
const media = { src: 'patio.jpg', width: 1600, height: 900, alt: 'Patio' }
const onNavigate = (p: BlockNavigate<Feature>) => p.item.title
</script>

<template>
  <GbHero01 title="Casa Alcalá" :media="media" :actions="[{ label: 'Reservar', href: '#reservar' }]" />
  <GbFeatures01 title="Por qué" :items="items" @navigate="onNavigate" />
  <GbFeatures02 title="Por qué" :items="items" @navigate="onNavigate" />
  <GbFeatures03 title="Por qué" :items="items" @navigate="onNavigate">
    <template #item="{ item, index }">{{ item.title }} {{ index + 1 }}</template>
  </GbFeatures03>
  <GbStats02 title="Cifras" :items="[{ value: 12, label: 'Habitaciones', source: 'Casa' }, { value: '4,8', label: 'Google', source: 'Google' }]" />
  <!-- @vue-expect-error: un campo de Feature mal escrito -->
  <GbFeatures01 title="Por qué" :items="[{ titel: 'Patio' }]" />
  <!-- @vue-expect-error: Stat.value no admite Boolean -->
  <GbStats01 title="Cifras" :items="[{ label: 'a', value: true }]" />
  <!-- @vue-expect-error: Media sin height -->
  <GbHero01 title="Casa" :media="{ src: 'a.jpg', width: 1 }" />
</template>
