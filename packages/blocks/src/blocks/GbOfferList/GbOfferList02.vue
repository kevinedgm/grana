<script setup>
// GbOfferList02 · Renglones (dueño: bruno). Contrato: design/contracts/blocks/offer-list.md · Común: _comun.md §15 · Sin CSS.
// Una oferta por renglón, foto al lado y todo el detalle a la vista: GStack as="ul" gap="md" › GCard as="li" orientation="auto" mediaPosition="start".
// GSection (título, descripción) › [GText body-sm muted con la consulta, una vez por lista] + la región de precios (una
// GPriceScope) › la lista; y UN GGalleryViewer de la sección con las fotos de la oferta que se abrió (el foco vuelve a su
// botón al cerrar).
import { computed } from 'vue'
import { GStack, GSection, GText, useSectionLevel } from '@grana/vue'
import { GGalleryViewer } from '@grana/vue/gallery'
import GbPriceRegion from '../common/priceRegion.js'
import { useWarn } from '../common/warn.js'
import OfferCard from './OfferCard.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useOfferList } from './useOfferList.js'

defineOptions({ name: 'GbOfferList02' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbOfferList02')
const { level } = useSectionLevel()
const inner = computed(() => Math.min(Math.min(level.value, 4) + 1, 6))
const { locale, line, rows, region, viewer, open, openPhotos, select } = useOfferList(props, emit, warn)
</script>

<template>
  <GSection v-if="rows.length" :title="title" :description="description" data-gb="offer-list-02">
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <GText v-if="line" size="body-sm" tone="muted">{{ line }}</GText>
    <GbPriceRegion :region="region" :labels="labels" :locale="locale">
      <GStack as="ul" gap="md">
        <OfferCard v-for="r in rows" :key="r.key" :row="r" :card="{ as: 'li', orientation: 'auto', mediaPosition: 'start' }" :heading-level="inner" :external="labels.external" :locale="locale" :offer-slot="$slots.offer" @select="select($event, r)" @photos="openPhotos($event, r)" @navigate="emit('navigate', $event)" />
      </GStack>
    </GbPriceRegion>
    <GGalleryViewer v-if="viewer" v-model="open" :photos="viewer.photos" :title="viewer.offer.name" :from="viewer.from" :labels="labels.gallery" :locale="locale" />
  </GSection>
</template>
