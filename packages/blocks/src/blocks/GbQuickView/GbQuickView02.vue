<script setup>
// GbQuickView02 · Hoja lateral (dueño: bruno). Contrato: design/contracts/blocks/quick-view.md · Común: _comun.md §27 · Sin
// CSS (#763). GDialog placement="end" size="md" mobile="fullscreen" (al borde final, deja ver la lista detrás; pantalla
// completa en el teléfono) › GStack gap="md" › GGallery (cuadrícula, h3) + el panel de E4 (common/ProductPanel.js) + la
// ficha completa.
import { GDialog, GStack } from '@grana/vue'
import { GGallery } from '@grana/vue/gallery'
import ProductPanel from '../common/ProductPanel.js'
import { useWarn } from '../common/warn.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useQuickView } from './useQuickView.js'

defineOptions({ name: 'GbQuickView02' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbQuickView02')
const { d, dialogId, isOpen, setOpen, close, photos, full } = useQuickView(props, emit, warn)
const { p, L, index, locale } = d
</script>

<template>
  <GDialog :id="dialogId" :model-value="isOpen" :title="p.name" :close-label="close || undefined" :from="from || undefined" :labels="L.dialog" placement="end" size="md" mobile="fullscreen" data-gb="quick-view-02" @update:model-value="setOpen">
    <GStack gap="md">
      <GGallery v-if="photos.length" v-model:index="index" :photos="photos" :groups="Array.isArray(p.groups) && p.groups.length ? p.groups : undefined" :title="d.need('photos', 'título de la galería') || undefined" :heading-level="3" :labels="L.gallery" :locale="locale" />
      <ProductPanel :d="d" :busy="busy" :panel-slot="$slots.panel" :after="full" :warn="warn" @navigate="emit('navigate', $event)" />
    </GStack>
  </GDialog>
</template>
