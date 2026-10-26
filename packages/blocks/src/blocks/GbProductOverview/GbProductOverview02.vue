<script setup>
// GbProductOverview02 · Galería arriba (dueño: bruno). Contrato: design/contracts/blocks/product-overview.md · Común:
// _comun.md §27 · Sin CSS (#763). Una columna, el teléfono primero: GSection › GStack gap="lg" › GGallery (cuadrícula;
// v-model:index sigue a la elección) + el panel de common/ProductPanel.js + GAccordion como 01. Ignora `labels.tabs`.
import { computed, useSlots } from 'vue'
import { GAccordion, GAccordionItem, GSection, GStack, useSectionLevel } from '@grana/vue'
import { GGallery } from '@grana/vue/gallery'
import ProductPanel, { useProductPanel } from '../common/ProductPanel.js'
import { useWarn } from '../common/warn.js'
import OverviewPart from './OverviewPart.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useOverviewText } from './useOverviewText.js'

defineOptions({ name: 'GbProductOverview02' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbProductOverview02')
const slots = useSlots()
const { level } = useSectionLevel()
const inner = computed(() => Math.min(Math.min(level.value, 4) + 1, 6))
const galleryLevel = computed(() => Math.max(2, Math.min(inner.value, 4)))
const d = useProductPanel(props, emit, warn)
const t = useOverviewText(d, slots, warn)
const { p, L, index, locale } = d
const { photos, photosTitle, groups, parts } = t
</script>

<template>
  <GSection :title="p.name" :description="p.summary || undefined" :lang="p.lang || undefined" data-gb="product-overview-02">
    <GStack gap="lg">
      <GGallery v-if="photos.length" v-model:index="index" :photos="photos" :groups="groups.length ? groups : undefined" :title="photosTitle || undefined" :heading-level="galleryLevel" :labels="L.gallery" :locale="locale" />
      <ProductPanel :d="d" :busy="busy" :panel-slot="$slots.panel" :warn="warn" @navigate="emit('navigate', $event)" />
      <GAccordion v-if="parts.length" :heading-level="inner">
        <GAccordionItem v-for="part in parts" :id="part.id" :key="part.key" :value="part.key" :title="part.title">
          <OverviewPart :part="part" :t="t" :slots="$slots" />
        </GAccordionItem>
      </GAccordion>
    </GStack>
  </GSection>
</template>
