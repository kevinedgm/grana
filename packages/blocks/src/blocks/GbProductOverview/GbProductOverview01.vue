<script setup>
// GbProductOverview01 · Galería + panel (dueño: bruno). Contrato: design/contracts/blocks/product-overview.md · Común:
// _comun.md §27 · Sin CSS (#763). GSection (title = name, description = summary) › GStack gap="lg" › GAdaptiveLayout
// gap="lg" › [div g-adapt-wide › GGallery (cuadrícula; v-model:index sigue a la elección)] + [div › el panel de
// common/ProductPanel.js, sin pista] + GAccordion (descripción, ficha y un elemento por apartado, id = section.id). Fotos →
// panel → texto en el DOM (1.3.2). Límite (PO-L1, para lima): con varios controles el panel es un bloque completo de
// GAdaptiveLayout y queda debajo de las fotos también en ancho. Ignora `labels.tabs`.
import { computed, useSlots } from 'vue'
import { GAccordion, GAccordionItem, GAdaptiveLayout, GSection, GStack, useSectionLevel } from '@grana/vue'
import { GGallery } from '@grana/vue/gallery'
import ProductPanel, { useProductPanel } from '../common/ProductPanel.js'
import { useWarn } from '../common/warn.js'
import OverviewPart from './OverviewPart.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useOverviewText } from './useOverviewText.js'

defineOptions({ name: 'GbProductOverview01' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbProductOverview01')
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
  <GSection :title="p.name" :description="p.summary || undefined" :lang="p.lang || undefined" data-gb="product-overview-01">
    <GStack gap="lg">
      <GAdaptiveLayout gap="lg">
        <div v-if="photos.length" class="g-adapt-wide">
          <GGallery v-model:index="index" :photos="photos" :groups="groups.length ? groups : undefined" :title="photosTitle || undefined" :heading-level="galleryLevel" :labels="L.gallery" :locale="locale" />
        </div>
        <!-- El panel lleva varios controles: GAdaptiveLayout lo trata como bloque completo (línea propia) y una pista en su
             envoltorio no tiene efecto (avisa), así que va sin pista y queda DEBAJO de la galería también en ancho. Como grupo
             anidado compartiría línea, pero sin mínimo (perfil agregado) se estrecha hasta desbordar a 390 px. Hallazgo PO-L1
             para lima: el «panel al lado» de 01 no se puede pedir con la API pública de GAdaptiveLayout -->
        <div>
          <ProductPanel :d="d" :busy="busy" :panel-slot="$slots.panel" :warn="warn" @navigate="emit('navigate', $event)" />
        </div>
      </GAdaptiveLayout>
      <GAccordion v-if="parts.length" :heading-level="inner">
        <GAccordionItem v-for="part in parts" :id="part.id" :key="part.key" :value="part.key" :title="part.title">
          <OverviewPart :part="part" :t="t" :slots="$slots" />
        </GAccordionItem>
      </GAccordion>
    </GStack>
  </GSection>
</template>
