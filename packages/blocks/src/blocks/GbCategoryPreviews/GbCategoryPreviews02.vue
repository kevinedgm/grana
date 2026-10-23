<script setup>
// GbCategoryPreviews02 · Tira (dueño: bruno). Contrato: design/contracts/blocks/category-previews.md · Común: _comun.md §27 · Sin CSS.
// Tarjetas bajas con el nombre sobre la foto (velo de GCard), muchas en poco alto y sin desplazamiento lateral: GSection › GAdaptiveLayout role="list" › div role="listitem" g-adapt-short › GCard as="div" mediaPosition="background" density="compact". Ignora `description`.
// La acción de la sección (`action`, «Ver toda la tienda») es secundaria (outline) y va al final del cuerpo, después de
// las puertas (la principal es cada tarjeta): el slot `actions` de GSection pide `labels.actions`, que esta Props no tiene.
import { computed } from 'vue'
import { GAdaptiveLayout, GSection, useSectionLevel } from '@grana/vue'
import GbActions from '../common/GbActions.js'
import { useWarn } from '../common/warn.js'
import CategoryCard from './CategoryCard.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useCategoryPreviews } from './useCategoryPreviews.js'

defineOptions({ name: 'GbCategoryPreviews02' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbCategoryPreviews02')
const { level } = useSectionLevel()
const inner = computed(() => Math.min(Math.min(level.value, 4) + 1, 6))
const { rows } = useCategoryPreviews(props, warn, { description: false })
const actions = computed(() => (props.action && typeof props.action === 'object' ? [props.action] : []))
</script>

<template>
  <GSection v-if="rows.length" :title="title" :description="description" data-gb="category-previews-02">
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <GAdaptiveLayout role="list">
      <div v-for="r in rows" :key="r.key" role="listitem" class="g-adapt-short">
        <CategoryCard :row="r" :card="{ as: 'div', mediaPosition: 'background', density: 'compact' }" :heading-level="inner" :external="labels.external" :category-slot="$slots.category" @navigate="emit('navigate', $event)" />
      </div>
    </GAdaptiveLayout>
    <GbActions v-if="actions.length" :actions="actions" :variants="['outline']" :external="labels.external" :warn="warn" @navigate="emit('navigate', $event)" @activate="emit('activate', $event)" />
  </GSection>
</template>
