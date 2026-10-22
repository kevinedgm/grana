<script setup>
// GbBlogList03 · Destacada + lista (dueño: bruno). Contrato: design/contracts/blocks/blog-list.md · Común: _comun.md · Sin CSS.
// GSection › GStack as="ul" gap="md" › la primera nota como 01 pero horizontal (GCard as="li" orientation="auto"
// mediaPosition="start", foto al lado) + las demás como 02 (level="flat", sin foto ni etiquetas), en la MISMA lista.
import { computed } from 'vue'
import { GCard, GIcon, GSection, GStack, useSectionLevel } from '@grana/vue'
import { GTag } from '@grana/vue/tag'
import { imgAttrs } from '../common/media.js'
import { useWarn } from '../common/warn.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { usePosts } from './usePosts.js'

defineOptions({ name: 'GbBlogList03' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbBlogList03')
const { level } = useSectionLevel()
const inner = computed(() => Math.min(Math.min(level.value, 4) + 1, 6))
// Solo la destacada (la primera que se pinta) usa foto y etiquetas
const all = usePosts(props, warn, { media: 'first' })
const rows = computed(() => all.value.map((r, i) => (i === 0 ? { ...r, lead: true } : { ...r, tags: [], lead: false })))
</script>

<template>
  <GSection v-if="rows.length" :title="title" :description="description" data-gb="blog-list-03">
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <GStack as="ul" gap="md">
      <GCard
        v-for="r in rows"
        :key="r.key"
        as="li"
        :level="r.lead ? undefined : 'flat'"
        :orientation="r.lead ? 'auto' : undefined"
        :media-position="r.lead && r.media ? 'start' : undefined"
        :title="r.item.title"
        :description="r.item.excerpt"
        :description-lines="r.lead ? 3 : 2"
        :heading-level="inner"
        v-bind="r.card"
        @navigate="emit('navigate', { ...$event, item: r.item })"
      >
        <template v-if="r.media" #media><img v-bind="imgAttrs(r.media)"></template>
        <template #eyebrow><time :datetime="r.time.datetime">{{ r.time.text }}</time></template>
        <template v-if="r.external" #title>{{ r.item.title }} <GIcon name="external-link" :label="r.externalLabel" /></template>
        <template v-if="$slots.post" #default><slot name="post" :item="r.item" :index="r.index" /></template>
        <template v-if="r.tags.length" #footer>
          <GStack as="ul" orientation="horizontal" gap="sm">
            <li v-for="t in r.tags" :key="t"><GTag :label="t" /></li>
          </GStack>
        </template>
      </GCard>
    </GStack>
  </GSection>
</template>
