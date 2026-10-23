<script setup>
// GbOfferDetail02 · Tira + pestañas (dueño: bruno). Contrato: design/contracts/blocks/offer-detail.md · Común: _comun.md
// §15 · Sin CSS (#763). GSection › GStack gap="lg" › GGallery appearance="strip" (la foto grande ya en la página;
// v-model:index y v-model:open para que un dato abra el visor en la primera foto de su espacio) + la ficha + GTabs (label
// = labels.tabs; una pestaña labels.details con la descripción y una por apartado, id = section.id) con su panel cada una
// (slots panel-{id} de GTabs).
import { computed, ref, useSlots } from 'vue'
import { GSection, GStack, GTabs, GText, useSectionLevel } from '@grana/vue'
import { GGallery } from '@grana/vue/gallery'
import { useWarn } from '../common/warn.js'
import OfferFicha from './OfferFicha.js'
import OfferText from './OfferText.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useOfferDetail } from './useOfferDetail.js'

defineOptions({ name: 'GbOfferDetail02' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbOfferDetail02')
const slots = useSlots()
const { level } = useSectionLevel()
const inner = computed(() => Math.min(Math.min(level.value, 4) + 1, 6))
const galleryLevel = computed(() => Math.max(2, Math.min(inner.value, 4)))
const d = useOfferDetail(props, emit, warn, { slots })
const { o, L, photos, photosTitle, groups, description, sections, locale, index, open, need } = d
// Pestañas: la descripción y un apartado por pestaña (labels.details y labels.tabs, C5 en 02)
const tabs = computed(() => {
  const list = []
  if (description.value.length) list.push({ id: 'details', label: need('details', 'pestaña de la descripción') })
  for (const s of sections.value) list.push({ id: s.id || s.key, label: s.section.title, s })
  if (list.length) need('tabs', 'nombre del grupo de pestañas')
  return list
})
// La pestaña activa es estado de vista del bloque (§15 regla 9): GTabs no cambia sola (BK-B5)
const active = ref(undefined)
const current = computed(() => (tabs.value.some((t) => t.id === active.value) ? active.value : undefined))
</script>

<template>
  <GSection :title="o.name" :description="o.summary || undefined" :lang="o.lang || undefined" data-gb="offer-detail-02">
    <GStack gap="lg">
      <GGallery v-if="photos.length" v-model:index="index" v-model:open="open" appearance="strip" :photos="photos" :groups="groups.length ? groups : undefined" :title="photosTitle || undefined" :heading-level="galleryLevel" :labels="L.gallery" :locale="locale" />
      <OfferFicha :d="d" :heading-level="inner" show="viewer" :consult-slot="$slots.consult" :facts-slot="$slots.facts" />
      <GTabs v-if="tabs.length" :model-value="current" :items="tabs" :label="L.tabs || undefined" @update:model-value="active = $event">
        <template v-for="t in tabs" :key="t.id" #[`panel-${t.id}`]>
          <GText v-if="t.id === 'details' && !t.s" as="div"><p v-for="(p, i) in description" :key="i">{{ p }}</p></GText>
          <OfferText v-else :s="t.s" :slots="$slots" />
        </template>
      </GTabs>
    </GStack>
  </GSection>
</template>
