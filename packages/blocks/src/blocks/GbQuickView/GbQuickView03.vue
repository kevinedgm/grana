<script setup>
// GbQuickView03 · Elegir y añadir (dueño: bruno). Contrato: design/contracts/blocks/quick-view.md · Común: _comun.md §27 ·
// Sin CSS (#763). El destino de «Elegir opciones» de la tarjeta compacta: solo lo que hace falta para añadir. GDialog
// size="sm" mobile="sheet" › GStack gap="md" › GCard level="flat" (as div, nombrada por el título del diálogo) con la portada
// pequeña decorativa (la foto de lo elegido: sigue a la elección), `maker` y el precio + el panel de E4 sin maker ni precio
// + la ficha completa. Sin galería: ignora `labels.photos`, `labels.gallery` y las fotos más allá de la portada.
import { computed } from 'vue'
import { GCard, GDialog, GStack, GText } from '@grana/vue'
import { GPrice, GPriceScope } from '@grana/vue/price'
import ProductPanel from '../common/ProductPanel.js'
import { imgAttrs } from '../common/media.js'
import { has } from '../common/text.js'
import { useWarn } from '../common/warn.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useQuickView } from './useQuickView.js'

defineOptions({ name: 'GbQuickView03' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbQuickView03')
const { d, dialogId, isOpen, setOpen, close, photos, full } = useQuickView(props, emit, warn)
const { p, L, index, locale, price, region } = d
// La portada sigue a la elección (la foto del color elegido), decorativa: el nombre ya lo dice el título
const cover = computed(() => {
  const ph = photos.value[index.value] || photos.value[0]
  return ph ? { ...imgAttrs(ph), alt: '' } : null
})
</script>

<template>
  <GDialog :id="dialogId" :model-value="isOpen" :title="p.name" :close-label="close || undefined" :from="from || undefined" :labels="L.dialog" size="sm" mobile="sheet" data-gb="quick-view-03" @update:model-value="setOpen">
    <GStack gap="md">
      <GCard as="div" level="flat" orientation="horizontal" media-position="start" :aria-labelledby="`${dialogId}-title`">
        <template v-if="cover" #media><img v-bind="cover"></template>
        <GText v-if="has(p.maker)" size="body-sm" tone="muted">{{ p.maker }}</GText>
        <GPriceScope v-if="price && region" v-bind="region" as="div"><GPrice v-bind="price" size="lg" :locale="locale" /></GPriceScope>
        <GPrice v-else-if="price" v-bind="price" size="lg" :locale="locale" />
      </GCard>
      <ProductPanel :d="d" :busy="busy" bare :panel-slot="$slots.panel" :after="full" :warn="warn" @navigate="emit('navigate', $event)" />
    </GStack>
  </GDialog>
</template>
