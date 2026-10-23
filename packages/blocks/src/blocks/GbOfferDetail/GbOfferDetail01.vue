<script setup>
// GbOfferDetail01 · Espacios + ficha (dueño: bruno). Contrato: design/contracts/blocks/offer-detail.md · Común: _comun.md
// §15 · Sin CSS (#763). GSection (title = offer.name, description = summary) › GStack gap="lg" › GGallery (A · recorrido
// por espacios con `groups`, título = labels.photos un nivel por debajo) + GAdaptiveLayout gap="lg" › [div g-adapt-wide:
// la descripción en GText + una GSection anidada por apartado (id)] + [div g-adapt-standard › la ficha]. Las fotos primero: la
// promesa es «cómo es» (1.3.2, orden del DOM = orden de lectura).
import { computed, useSlots } from 'vue'
import { GAdaptiveLayout, GSection, GStack, GText, useSectionLevel } from '@grana/vue'
import { GGallery } from '@grana/vue/gallery'
import { useWarn } from '../common/warn.js'
import OfferFicha from './OfferFicha.js'
import OfferText from './OfferText.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useOfferDetail } from './useOfferDetail.js'

defineOptions({ name: 'GbOfferDetail01' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbOfferDetail01')
const slots = useSlots()
const { level } = useSectionLevel()
const inner = computed(() => Math.min(Math.min(level.value, 4) + 1, 6))
const galleryLevel = computed(() => Math.max(2, Math.min(inner.value, 4)))
const d = useOfferDetail(props, emit, warn, { slots })
const { o, L, photos, photosTitle, groups, description, sections, locale } = d
</script>

<template>
  <GSection :title="o.name" :description="o.summary || undefined" :lang="o.lang || undefined" data-gb="offer-detail-01">
    <GStack gap="lg">
      <GGallery v-if="photos.length" :photos="photos" :groups="groups.length ? groups : undefined" :title="photosTitle || undefined" :heading-level="galleryLevel" :labels="L.gallery" :locale="locale" />
      <GAdaptiveLayout gap="lg">
        <div v-if="description.length || sections.length" class="g-adapt-wide">
          <GStack gap="lg">
            <GText v-if="description.length" as="div"><p v-for="(p, i) in description" :key="i">{{ p }}</p></GText>
            <GSection v-for="s in sections" :id="s.id" :key="s.key" :title="s.section.title">
              <OfferText :s="s" :slots="$slots" />
            </GSection>
          </GStack>
        </div>
        <!-- La ficha (GCard as="section") va en un div con la pista: GAdaptiveLayout trata una section como bloque de línea
             completa (#361). Con la consulta en el slot (varios controles) el hijo es bloque igual: sin pista, debajo del texto -->
        <div :class="$slots.consult ? undefined : 'g-adapt-standard'">
          <OfferFicha :d="d" :heading-level="inner" show="anchor" :consult-slot="$slots.consult" :facts-slot="$slots.facts" />
        </div>
      </GAdaptiveLayout>
    </GStack>
  </GSection>
</template>
