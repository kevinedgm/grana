<script setup>
// GbBlogList01 · Rejilla (dueño: bruno). Contrato: design/contracts/blocks/blog-list.md · Común: _comun.md · Sin CSS.
// GSection › GAdaptiveLayout role="list" › div role="listitem" g-adapt-wide › GCard as="article" interaction="link": foto en
// `media` (arriba), fecha en `eyebrow` (<time datetime>, «Actualizado …» si hay `updated`, #825), título (el enlace),
// `excerpt` en `description` (3 líneas) y las etiquetas estáticas (GTag sin href) en `footer`.
import { computed } from 'vue'
import { GAdaptiveLayout, GCard, GIcon, GSection, GStack, useSectionLevel } from '@grana/vue'
import { GTag } from '@grana/vue/tag'
import { imgAttrs } from '../common/media.js'
import { useWarn } from '../common/warn.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { usePosts } from './usePosts.js'

defineOptions({ name: 'GbBlogList01' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbBlogList01')
const { level } = useSectionLevel()
const inner = computed(() => Math.min(Math.min(level.value, 4) + 1, 6))
const rows = usePosts(props, warn, { media: 'all' })
</script>

<template>
  <GSection v-if="rows.length" :title="title" :description="description" data-gb="blog-list-01">
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <GAdaptiveLayout role="list">
      <div v-for="r in rows" :key="r.key" role="listitem" class="g-adapt-wide">
        <GCard
          as="article"
          :title="r.item.title"
          :description="r.item.excerpt"
          :description-lines="3"
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
      </div>
    </GAdaptiveLayout>
  </GSection>
</template>
