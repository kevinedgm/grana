<script setup lang="ts">
// Plantillas con las variantes (src/types.test.js, vue-tsc). Cada `@vue-expect-error` es un uso erróneo que DEBE fallar.
import { GbFeatures01, GbFeatures02, GbFeatures03, GbHero01, GbStats01, GbStats02 } from '@grana/blocks/marketing'
import type { BlockNavigate, Feature } from '@grana/blocks/marketing'
import { GbCta01, GbFaq01, GbFaq03, GbTestimonials03 } from '@grana/blocks/marketing'
import type { Action, BlockActivate } from '@grana/blocks/marketing'

const items: Feature[] = [{ title: 'Patio' }, { title: 'Terraza', action: { label: 'Fotos', href: '#fotos' } }]
const media = { src: 'patio.jpg', width: 1600, height: 900, alt: 'Patio' }
const onNavigate = (p: BlockNavigate<Feature>) => p.item.title
const onActivate = (p: BlockActivate<Action>) => p.item.label
</script>

<template>
  <GbHero01 title="Casa Alcalá" :media="media" :actions="[{ label: 'Reservar', href: '#reservar' }]" />
  <GbFeatures01 title="Por qué" :items="items" @navigate="onNavigate" />
  <GbFeatures02 title="Por qué" :items="items" @navigate="onNavigate" />
  <GbFeatures03 title="Por qué" :items="items" @navigate="onNavigate">
    <template #item="{ item, index }">{{ item.title }} {{ index + 1 }}</template>
  </GbFeatures03>
  <GbStats02 title="Cifras" :items="[{ value: 12, label: 'Habitaciones', source: 'Casa' }, { value: '4,8', label: 'Google', source: 'Google' }]" />
  <GbTestimonials03 title="Opiniones" :items="[{ quote: 'Volveríamos.', lang: 'es', author: { name: 'Rosa' }, source: { label: 'Libro de visitas' } }]">
    <template #quote="{ item }">{{ item.author.name }}</template>
  </GbTestimonials03>
  <GbCta01 title="Reserva" :actions="[{ label: 'Ver disponibilidad' }]" assurance="Sin pago ahora" @activate="onActivate" />
  <GbFaq03 title="Preguntas" :items="[{ id: 'mascotas', question: '¿Mascotas?', answer: 'Sí.' }]" :labels="{ search: 'Buscar', matches: '{count} de {total}' }">
    <template #answer="{ item }">{{ item.question }}</template>
  </GbFaq03>
  <!-- @vue-expect-error: Faq sin question -->
  <GbFaq01 title="Preguntas" :items="[{ answer: 'Sí.' }]" />
  <!-- @vue-expect-error: un campo de Feature mal escrito -->
  <GbFeatures01 title="Por qué" :items="[{ titel: 'Patio' }]" />
  <!-- @vue-expect-error: Stat.value no admite Boolean -->
  <GbStats01 title="Cifras" :items="[{ label: 'a', value: true }]" />
  <!-- @vue-expect-error: Media sin height -->
  <GbHero01 title="Casa" :media="{ src: 'a.jpg', width: 1 }" />
</template>
