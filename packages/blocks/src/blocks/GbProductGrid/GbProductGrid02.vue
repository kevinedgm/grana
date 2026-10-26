<script setup>
// GbProductGrid02 · Con filtros al lado (dueño: bruno). Contrato: design/contracts/blocks/product-grid.md · Común: _comun.md
// §27 · Sin CSS (#763). GSection › GAdaptiveLayout gap="lg" › [div g-adapt-short role="group" (labels.facets) › GAccordion
// (varios abiertos, nivel de dentro): un GAccordionItem por faceta (title = la faceta, meta = cuántos elegidos, peek = lo
// elegido en palabras) con su GTagGroup de alternar dentro; «Quitar filtros» con algún filtro] + [div g-adapt-wide › la
// cabecera + los resultados con la tarjeta E1 03 (compacta, con acción rápida) + GPagination]. Las facetas van primero en
// el DOM (se leen y se usan antes, 1.3.2) y plegadas: en el teléfono la rejilla queda a uno o dos pantallazos.
import { computed } from 'vue'
import { GAccordion, GAccordionItem, GAdaptiveLayout, GBtn, GSection, GStack, useSectionLevel } from '@grana/vue'
import { GTagGroup } from '@grana/vue/tag'
import { countText } from '../common/ecommerce.js'
import { useWarn } from '../common/warn.js'
import { GridHeader, GridResults } from './GridParts.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useProductGrid } from './useProductGrid.js'

defineOptions({ name: 'GbProductGrid02' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbProductGrid02')
const { level } = useSectionLevel()
const inner = computed(() => Math.min(Math.min(level.value, 4) + 1, 6))
const g = useProductGrid(props, emit, warn)
const { L, facets, anyFilter, tagItems, onToggle, clear, chosenIn, listText, locale } = g
const meta = (f) => { const n = chosenIn(f).length; return n ? countText(n, locale.value) : undefined }
</script>

<template>
  <GSection :title="title" :description="description" data-gb="product-grid-02">
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <GAdaptiveLayout gap="lg">
      <div v-if="facets.length" class="g-adapt-short" role="group" :aria-label="L.facets || undefined">
        <GStack gap="sm">
          <GAccordion :heading-level="inner">
            <GAccordionItem v-for="f in facets" :key="f.key" :value="f.key" :title="f.label" :meta="meta(f)" :peek="listText(chosenIn(f)) || undefined">
              <GTagGroup :items="tagItems(f.key)" :label="f.label" :labels="L.tags" @toggle="onToggle" />
            </GAccordionItem>
          </GAccordion>
          <div v-if="anyFilter && L.clear"><GBtn variant="link" @click="clear">{{ L.clear }}</GBtn></div>
        </GStack>
      </div>
      <div class="g-adapt-wide">
        <GStack gap="md">
          <GridHeader :g="g" />
          <GridResults :g="g" form="compact" :title="title" :loading="loading" :error="error" :total="total" :page-size="pageSize" :heading-level="inner" :product-slot="$slots.product" :empty-slot="$slots.empty" :warn="warn" @navigate="emit('navigate', $event)" @open="emit('open', $event)" @add="emit('add', $event)" />
        </GStack>
      </div>
    </GAdaptiveLayout>
  </GSection>
</template>
