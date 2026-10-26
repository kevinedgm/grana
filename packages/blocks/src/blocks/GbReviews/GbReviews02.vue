<script setup>
// GbReviews02 · Resumen y distribución (dueño: bruno). Contrato: design/contracts/blocks/reviews.md · Común: _comun.md §27 ·
// Sin CSS (#763). GSection › GAdaptiveLayout gap="lg" › [div g-adapt-short › el resumen (GMetric) + la distribución (lista
// con nombre: el texto de cada fila y su barra GProgress decorativa en un div aria-hidden) + la acción] + [div g-adapt-wide ›
// GStack as="ul" divided › li › la opinión + GPagination]. Sin opiniones: GEmpty con la acción en su slot.
import { useId } from 'vue'
import { GAdaptiveLayout, GEmpty, GPagination, GSection, GStack } from '@grana/vue'
import GbActions from '../common/GbActions.js'
import { useWarn } from '../common/warn.js'
import ReviewItem from './ReviewItem.js'
import ReviewsSummary from './ReviewsSummary.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useReviews } from './useReviews.js'

defineOptions({ name: 'GbReviews02' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbReviews02')
const uid = useId()
const rv = useReviews(props, emit, warn)
const { L, list, showEmpty, emptyTitle, page, paged, setPage, actions, metric } = rv
</script>

<template>
  <GSection :title="title" :description="description" data-gb="reviews-02">
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <GAdaptiveLayout gap="lg">
      <div v-if="metric || (!showEmpty && actions.length)" class="g-adapt-short">
        <GStack gap="md">
          <ReviewsSummary :rv="rv" distribution />
          <div v-if="!showEmpty && actions.length"><GbActions :actions="actions" :variants="['outline']" :external="L.external" :warn="warn" @navigate="emit('navigate', $event)" @activate="emit('activate', $event)" /></div>
        </GStack>
      </div>
      <div class="g-adapt-wide">
        <GEmpty v-if="showEmpty" cause="none" :title="emptyTitle">
          <template v-if="actions.length" #actions><GbActions :actions="actions" :variants="['outline']" :external="L.external" :warn="warn" @navigate="emit('navigate', $event)" @activate="emit('activate', $event)" /></template>
        </GEmpty>
        <GStack v-else gap="lg">
          <GStack v-if="list.length" as="ul" divided>
            <li v-for="r in list" :key="r.key"><ReviewItem :row="r" :name-id="`${uid}-${r.index}-author`" :labels="L" :quote="$slots.quote" :warn="warn" @navigate="emit('navigate', $event)" /></li>
          </GStack>
          <GPagination v-if="paged" :page="page" :total="total" :page-size="pageSize" :labels="L.pagination" @update:page="setPage" />
        </GStack>
      </div>
    </GAdaptiveLayout>
  </GSection>
</template>
