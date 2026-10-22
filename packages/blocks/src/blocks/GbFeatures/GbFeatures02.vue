<script setup>
// GbFeatures02 · Alternada (dueño: bruno). Contrato: design/contracts/blocks/features.md · Común: _comun.md · Sin CSS (#763).
// GSection › GStack as="ul" gap="lg" › GCard as="li" orientation="auto", foto a un lado y al otro (`mediaPosition` start en
// los pares —el primero es el 0— y end en los impares); sin `media`, el icono en `lead`. Con `action`, la tarjeta es la
// puerta (#819). Aviso F1 si ningún elemento trae `media`.
import { computed } from 'vue'
import { GCard, GIcon, GSection, GStack, useSectionLevel } from '@grana/vue'
import { cardAction } from '../common/card.js'
import { useItems } from '../common/list.js'
import { checkMedia, imgAttrs } from '../common/media.js'
import { has } from '../common/text.js'
import { useWarn } from '../common/warn.js'
import { MAX_ITEMS, emits as sectionEmits, props as sectionProps } from './props.js'

defineOptions({ name: 'GbFeatures02' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbFeatures02')
const { level } = useSectionLevel()
const inner = computed(() => Math.min(Math.min(level.value, 4) + 1, 6))

const list = useItems(() => props.items, { required: ['title'], range: [1, MAX_ITEMS], warn })
const rows = computed(() => {
  let n = 0
  const out = list.value.map((e) => {
    const m = e.item.media && typeof e.item.media === 'object' && has(e.item.media.src) ? e.item.media : null
    if (m) checkMedia(m, `items[${e.index}].media`, warn)
    const card = { orientation: 'auto' }
    if (m) card.mediaPosition = n++ % 2 === 0 ? 'start' : 'end'
    return { ...e, media: m, card, act: cardAction(e.item.action, props.labels, `items[${e.index}]`, warn) }
  })
  try { if (process.env.NODE_ENV !== 'production' && out.length && !n) warn('F1', 'ningún elemento trae media: se pinta sin la alternancia que da sentido a la forma (F1).') } catch {}
  return out
})
</script>

<template>
  <GSection v-if="rows.length" :title="title" :description="description" data-gb="features-02">
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <GStack as="ul" gap="lg">
      <GCard
        v-for="r in rows"
        :key="r.key"
        as="li"
        :title="r.item.title"
        :description="r.item.description"
        :heading-level="inner"
        v-bind="{ ...r.card, ...r.act.card }"
        @navigate="emit('navigate', { ...$event, item: r.item })"
        @activate="emit('activate', { ...$event, item: r.item })"
      >
        <template v-if="r.media" #media><img v-bind="imgAttrs(r.media)" :role="r.media.decorative ? undefined : 'img'"></template>
        <template v-else-if="has(r.item.icon)" #lead><GIcon :name="r.item.icon" /></template>
        <template v-if="r.act.external" #title>{{ r.item.title }} <GIcon name="external-link" :label="r.act.externalLabel" /></template>
        <template v-if="$slots.item" #default><slot name="item" :item="r.item" :index="r.index" /></template>
      </GCard>
    </GStack>
  </GSection>
</template>
