<script setup>
// GbCategoryPreviews03 · Lista con cuenta (dueño: bruno). Contrato: design/contracts/blocks/category-previews.md · Común: _comun.md §27 · Sin CSS.
// Una lista de nombres con su cuenta, sin foto, para un menú de la tienda: GSection › GStack as="ul" gap="sm" › GCard as="li" level="flat" density="compact". Ignora `media`.
// La acción de la sección (`action`, «Ver toda la tienda») es secundaria (outline) y va al final del cuerpo, después de
// las puertas (la principal es cada tarjeta): el slot `actions` de GSection pide `labels.actions`, que esta Props no tiene.
import { computed } from 'vue'
import { GSection, GStack, useSectionLevel } from '@grana/vue'
import GbActions from '../common/GbActions.js'
import { useWarn } from '../common/warn.js'
import CategoryCard from './CategoryCard.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useCategoryPreviews } from './useCategoryPreviews.js'

defineOptions({ name: 'GbCategoryPreviews03' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbCategoryPreviews03')
const { level } = useSectionLevel()
const inner = computed(() => Math.min(Math.min(level.value, 4) + 1, 6))
const { rows } = useCategoryPreviews(props, warn, { media: false })
const actions = computed(() => (props.action && typeof props.action === 'object' ? [props.action] : []))
</script>

<template>
  <GSection v-if="rows.length" :title="title" :description="description" data-gb="category-previews-03">
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <GStack as="ul" gap="sm">
      <CategoryCard v-for="r in rows" :key="r.key" :row="r" :card="{ as: 'li', level: 'flat', density: 'compact' }" :heading-level="inner" :external="labels.external" :category-slot="$slots.category" @navigate="emit('navigate', $event)" />
    </GStack>
    <GbActions v-if="actions.length" :actions="actions" :variants="['outline']" :external="labels.external" :warn="warn" @navigate="emit('navigate', $event)" @activate="emit('activate', $event)" />
  </GSection>
</template>
