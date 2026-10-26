<script setup>
// GbProductGrid03 · Renglones (dueño: bruno). Contrato: design/contracts/blocks/product-grid.md · Común: _comun.md §27 · Sin
// CSS (#763). Un producto por renglón con la foto al lado y todo su detalle: GSection › GStack gap="md" › la cabecera +
// GTagGroup layout="facets" (como 01) + los resultados: GPriceScope › GLoadRegion › GStack as="ul" gap="md" › li › tarjeta
// E1 02 (horizontal) + GPagination.
import { computed } from 'vue'
import { GBtn, GSection, GStack, useSectionLevel } from '@grana/vue'
import { GTagGroup } from '@grana/vue/tag'
import { useWarn } from '../common/warn.js'
import { GridHeader, GridResults } from './GridParts.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useProductGrid } from './useProductGrid.js'

defineOptions({ name: 'GbProductGrid03' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbProductGrid03')
const { level } = useSectionLevel()
const inner = computed(() => Math.min(Math.min(level.value, 4) + 1, 6))
const g = useProductGrid(props, emit, warn)
const { L, facets, anyFilter, tagItems, onToggle, clear } = g
</script>

<template>
  <GSection :title="title" :description="description" data-gb="product-grid-03">
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <GStack gap="md">
      <GridHeader :g="g" />
      <GTagGroup v-if="facets.length" layout="facets" :items="tagItems()" :label="L.facets || undefined" :labels="L.tags" @toggle="onToggle" />
      <div v-if="anyFilter && L.clear"><GBtn variant="link" @click="clear">{{ L.clear }}</GBtn></div>
      <GridResults :g="g" form="horizontal" :title="title" :loading="loading" :error="error" :total="total" :page-size="pageSize" :heading-level="inner" :product-slot="$slots.product" :empty-slot="$slots.empty" :warn="warn" @navigate="emit('navigate', $event)" @open="emit('open', $event)" @add="emit('add', $event)" />
    </GStack>
  </GSection>
</template>
