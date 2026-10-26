<script setup>
// GbQuickView01 · Diálogo (dueño: bruno). Contrato: design/contracts/blocks/quick-view.md · Común: _comun.md §27 · Sin CSS
// (#763). GDialog size="lg" mobile="sheet" (centrado en escritorio, hoja inferior en el teléfono; raíz con data-gb) ›
// GStack gap="md" › GGallery appearance="strip" (h3: el diálogo empieza su propio esquema) + el panel de E4
// (common/ProductPanel.js, sin el texto largo) + la ficha completa. Foco, atrapado, Esc y devolución a `from`: GDialog.
import { GDialog, GStack } from '@grana/vue'
import { GGallery } from '@grana/vue/gallery'
import ProductPanel from '../common/ProductPanel.js'
import { useWarn } from '../common/warn.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useQuickView } from './useQuickView.js'

defineOptions({ name: 'GbQuickView01' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbQuickView01')
const { d, dialogId, isOpen, setOpen, close, photos, full } = useQuickView(props, emit, warn)
const { p, L, index, locale } = d
</script>

<template>
  <GDialog :id="dialogId" :model-value="isOpen" :title="p.name" :close-label="close || undefined" :from="from || undefined" :labels="L.dialog" size="lg" mobile="sheet" data-gb="quick-view-01" @update:model-value="setOpen">
    <GStack gap="md">
      <GGallery v-if="photos.length" v-model:index="index" appearance="strip" :photos="photos" :title="d.need('photos', 'título de la galería') || undefined" :heading-level="3" :labels="L.gallery" :locale="locale" />
      <ProductPanel :d="d" :busy="busy" :panel-slot="$slots.panel" :after="full" :warn="warn" @navigate="emit('navigate', $event)" />
    </GStack>
  </GDialog>
</template>
