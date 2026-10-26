<script setup>
// GbProductOverview03 · Tira + pestañas (dueño: bruno). Contrato: design/contracts/blocks/product-overview.md · Común:
// _comun.md §27 · Sin CSS (#763). GSection › GStack gap="lg" › GGallery appearance="strip" (la foto grande ya en la
// página; v-model:index sigue a la elección) + el panel de common/ProductPanel.js + GTabs (label = labels.tabs; la
// descripción, la ficha y una pestaña por apartado, con su contenido en el slot panel-{id} de GTabs, #889).
import { computed, ref, useSlots } from 'vue'
import { GSection, GStack, GTabs, useSectionLevel } from '@grana/vue'
import { GGallery } from '@grana/vue/gallery'
import ProductPanel, { useProductPanel } from '../common/ProductPanel.js'
import { useWarn } from '../common/warn.js'
import OverviewPart from './OverviewPart.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useOverviewText } from './useOverviewText.js'

defineOptions({ name: 'GbProductOverview03' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbProductOverview03')
const slots = useSlots()
const { level } = useSectionLevel()
const inner = computed(() => Math.min(Math.min(level.value, 4) + 1, 6))
const galleryLevel = computed(() => Math.max(2, Math.min(inner.value, 4)))
const d = useProductPanel(props, emit, warn)
const t = useOverviewText(d, slots, warn)
const { p, L, index, locale } = d
const { photos, photosTitle, groups, parts } = t
// Pestañas: un apartado por pestaña (id = section.id o la clave); el nombre del grupo es labels.tabs (C5 en 03)
const tabs = computed(() => {
  const list = parts.value.map((part) => ({ id: part.id || part.key, label: part.title, part }))
  if (list.length) d.need('tabs', 'nombre del grupo de pestañas')
  return list
})
// La pestaña activa es estado de vista del bloque (§15 regla 9)
const active = ref(undefined)
const current = computed(() => (tabs.value.some((x) => x.id === active.value) ? active.value : undefined))
</script>

<template>
  <GSection :title="p.name" :description="p.summary || undefined" :lang="p.lang || undefined" data-gb="product-overview-03">
    <GStack gap="lg">
      <GGallery v-if="photos.length" v-model:index="index" appearance="strip" :photos="photos" :groups="groups.length ? groups : undefined" :title="photosTitle || undefined" :heading-level="galleryLevel" :labels="L.gallery" :locale="locale" />
      <ProductPanel :d="d" :busy="busy" :panel-slot="$slots.panel" :warn="warn" @navigate="emit('navigate', $event)" />
      <GTabs v-if="tabs.length" :model-value="current" :items="tabs" :label="L.tabs || undefined" @update:model-value="active = $event">
        <template v-for="x in tabs" :key="x.id" #[`panel-${x.id}`]>
          <OverviewPart :part="x.part" :t="t" :slots="$slots" />
        </template>
      </GTabs>
    </GStack>
  </GSection>
</template>
