<script setup>
// GbOfferDetail03 · Lectura larga (dueño: bruno). Contrato: design/contracts/blocks/offer-detail.md · Común: _comun.md §15 ·
// Sin CSS (#763). GSection › GContainer width="reading" horizontal="start" (#845) › GStack gap="lg" › la descripción +
// GAccordion (un GAccordionItem por apartado, id, peek = primer párrafo) + GGallery (cuadrícula; A si hay grupos) + la
// ficha. El texto primero: la promesa es la lectura (1.3.2).
import { computed, useSlots } from 'vue'
import { GAccordion, GAccordionItem, GContainer, GSection, GStack, GText, useSectionLevel } from '@grana/vue'
import { GGallery } from '@grana/vue/gallery'
import { useWarn } from '../common/warn.js'
import OfferFicha from './OfferFicha.js'
import OfferText from './OfferText.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useOfferDetail } from './useOfferDetail.js'

defineOptions({ name: 'GbOfferDetail03' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbOfferDetail03')
const slots = useSlots()
const { level } = useSectionLevel()
const inner = computed(() => Math.min(Math.min(level.value, 4) + 1, 6))
const galleryLevel = computed(() => Math.max(2, Math.min(inner.value, 4)))
const d = useOfferDetail(props, emit, warn, { slots })
const { o, L, photos, photosTitle, groups, description, sections, locale } = d
</script>

<template>
  <GSection :title="o.name" :description="o.summary || undefined" :lang="o.lang || undefined" data-gb="offer-detail-03">
    <GContainer width="reading" horizontal="start">
      <GStack gap="lg">
        <GText v-if="description.length" as="div"><p v-for="(p, i) in description" :key="i">{{ p }}</p></GText>
        <GAccordion v-if="sections.length" :heading-level="inner">
          <GAccordionItem v-for="s in sections" :id="s.id" :key="s.key" :value="s.key" :title="s.section.title" :peek="s.paras[0] || undefined">
            <OfferText :s="s" :slots="$slots" />
          </GAccordionItem>
        </GAccordion>
        <GGallery v-if="photos.length" :photos="photos" :groups="groups.length ? groups : undefined" :title="photosTitle || undefined" :heading-level="galleryLevel" :labels="L.gallery" :locale="locale" />
        <OfferFicha :d="d" :heading-level="inner" show="anchor" :consult-slot="$slots.consult" :facts-slot="$slots.facts" />
      </GStack>
    </GContainer>
  </GSection>
</template>
