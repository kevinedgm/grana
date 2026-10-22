<script setup>
// GbBlogList02 · Lista con fecha (dueño: bruno). Contrato: design/contracts/blocks/blog-list.md · Común: _comun.md · Sin
// CSS. GSection › GStack as="ul" gap="sm" › GCard as="li" level="flat" interaction="link": fecha en `eyebrow`, título y
// `excerpt` (2 líneas). Ignora `media` y `tags`.
import { computed } from 'vue'
import { GCard, GIcon, GSection, GStack, useSectionLevel } from '@grana/vue'
import { useWarn } from '../common/warn.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { usePosts } from './usePosts.js'

defineOptions({ name: 'GbBlogList02' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbBlogList02')
const { level } = useSectionLevel()
const inner = computed(() => Math.min(Math.min(level.value, 4) + 1, 6))
const rows = usePosts(props, warn)
</script>

<template>
  <GSection v-if="rows.length" :title="title" :description="description" data-gb="blog-list-02">
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <GStack as="ul" gap="sm">
      <GCard
        v-for="r in rows"
        :key="r.key"
        as="li"
        level="flat"
        :title="r.item.title"
        :description="r.item.excerpt"
        :description-lines="2"
        :heading-level="inner"
        v-bind="r.card"
        @navigate="emit('navigate', { ...$event, item: r.item })"
      >
        <template #eyebrow><time :datetime="r.time.datetime">{{ r.time.text }}</time></template>
        <template v-if="r.external" #title>{{ r.item.title }} <GIcon name="external-link" :label="r.externalLabel" /></template>
        <template v-if="$slots.post" #default><slot name="post" :item="r.item" :index="r.index" /></template>
      </GCard>
    </GStack>
  </GSection>
</template>
