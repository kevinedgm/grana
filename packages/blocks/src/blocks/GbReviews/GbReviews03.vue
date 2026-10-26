<script setup>
// GbReviews03 · Tarjetas (dueño: bruno). Contrato: design/contracts/blocks/reviews.md · Común: _comun.md §27 · Sin CSS
// (#763). GSection › GStack gap="lg" › el resumen (GMetric) + la acción + GAdaptiveLayout role="list" › div role="listitem"
// g-adapt-wide › GCard as="div" role="group" (nombrada por el autor, #837; GAvatar decorativo en `lead`) con la opinión en el
// cuerpo + GPagination. Sin opiniones: GEmpty con la acción en su slot. Ignora `distribution`.
import { useId } from 'vue'
import { GAdaptiveLayout, GAvatar, GCard, GEmpty, GPagination, GSection, GStack } from '@grana/vue'
import GbActions from '../common/GbActions.js'
import { useWarn } from '../common/warn.js'
import ReviewItem from './ReviewItem.js'
import ReviewsSummary from './ReviewsSummary.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useReviews } from './useReviews.js'

defineOptions({ name: 'GbReviews03' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbReviews03')
const uid = useId()
const rv = useReviews(props, emit, warn)
const { L, list, showEmpty, emptyTitle, page, paged, setPage, actions } = rv
</script>

<template>
  <GSection :title="title" :description="description" data-gb="reviews-03">
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <GStack gap="lg">
      <ReviewsSummary :rv="rv" />
      <GEmpty v-if="showEmpty" cause="none" :title="emptyTitle">
        <template v-if="actions.length" #actions><GbActions :actions="actions" :variants="['outline']" :external="L.external" :warn="warn" @navigate="emit('navigate', $event)" @activate="emit('activate', $event)" /></template>
      </GEmpty>
      <template v-else>
        <div v-if="actions.length"><GbActions :actions="actions" :variants="['outline']" :external="L.external" :warn="warn" @navigate="emit('navigate', $event)" @activate="emit('activate', $event)" /></div>
        <GAdaptiveLayout v-if="list.length" role="list">
          <div v-for="r in list" :key="r.key" role="listitem" class="g-adapt-wide">
            <GCard as="div" role="group" :aria-labelledby="`${uid}-${r.index}-author`">
              <template #lead><GAvatar size="lg" :name="r.item.author.name" :src="r.item.author.avatar" /></template>
              <ReviewItem :row="r" card :name-id="`${uid}-${r.index}-author`" :labels="L" :quote="$slots.quote" :warn="warn" @navigate="emit('navigate', $event)" />
            </GCard>
          </div>
        </GAdaptiveLayout>
        <GPagination v-if="paged" :page="page" :total="total" :page-size="pageSize" :labels="L.pagination" @update:page="setPage" />
      </template>
    </GStack>
  </GSection>
</template>
