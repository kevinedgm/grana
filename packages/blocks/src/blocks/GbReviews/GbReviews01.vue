<script setup>
// GbReviews01 · Lista con resumen (dueño: bruno). Contrato: design/contracts/blocks/reviews.md · Común: _comun.md §27 · Sin
// CSS (#763). GSection › GStack gap="lg" › el resumen (GMetric) + la acción (secundaria, outline) + GStack as="ul" divided ›
// li › la opinión (la figure de Testimonials con la puntuación, el pie y la respuesta de la tienda después) + GPagination.
// Sin opiniones: GEmpty cause="none" con labels.noReviews y la acción en su slot. Ignora `distribution`.
import { useId } from 'vue'
import { GEmpty, GPagination, GSection, GStack } from '@grana/vue'
import GbActions from '../common/GbActions.js'
import { useWarn } from '../common/warn.js'
import ReviewItem from './ReviewItem.js'
import ReviewsSummary from './ReviewsSummary.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useReviews } from './useReviews.js'

defineOptions({ name: 'GbReviews01' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbReviews01')
const uid = useId()
const rv = useReviews(props, emit, warn)
const { L, list, showEmpty, emptyTitle, page, paged, setPage, actions } = rv
</script>

<template>
  <GSection :title="title" :description="description" data-gb="reviews-01">
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <GStack gap="lg">
      <ReviewsSummary :rv="rv" />
      <GEmpty v-if="showEmpty" cause="none" :title="emptyTitle">
        <template v-if="actions.length" #actions><GbActions :actions="actions" :variants="['outline']" :external="L.external" :warn="warn" @navigate="emit('navigate', $event)" @activate="emit('activate', $event)" /></template>
      </GEmpty>
      <template v-else>
        <div v-if="actions.length"><GbActions :actions="actions" :variants="['outline']" :external="L.external" :warn="warn" @navigate="emit('navigate', $event)" @activate="emit('activate', $event)" /></div>
        <GStack v-if="list.length" as="ul" divided>
          <li v-for="r in list" :key="r.key"><ReviewItem :row="r" :name-id="`${uid}-${r.index}-author`" :labels="L" :quote="$slots.quote" :warn="warn" @navigate="emit('navigate', $event)" /></li>
        </GStack>
        <GPagination v-if="paged" :page="page" :total="total" :page-size="pageSize" :labels="L.pagination" @update:page="setPage" />
      </template>
    </GStack>
  </GSection>
</template>
