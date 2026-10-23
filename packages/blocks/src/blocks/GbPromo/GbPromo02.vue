<script setup>
// GbPromo02 · Tarjeta con imagen (dueño: bruno). Contrato: design/contracts/blocks/promo.md · Común: _comun.md §27 · Sin CSS.
// La oferta sobre la foto de lo que se vende: GCard as="section" mediaPosition="background" (raíz; el título de la oferta
// es el de la tarjeta, al nivel de sección min(level, 6), como CTA 02) con la fecha, el código y las condiciones en el
// cuerpo y las acciones (solid + outline) en `actions`, la principal descrita por las condiciones. Sin `media`, la tarjeta
// sin foto.
import { computed } from 'vue'
import { GCard, GText, useSectionLevel } from '@grana/vue'
import GbActions from '../common/GbActions.js'
import { checkMedia, imgAttrs } from '../common/media.js'
import { has } from '../common/text.js'
import { useWarn } from '../common/warn.js'
import { PromoCode, PromoDate } from './PromoPieces.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { usePromo } from './usePromo.js'

defineOptions({ name: 'GbPromo02' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbPromo02')
const { level } = useSectionLevel()
const heading = computed(() => Math.min(level.value, 6))
const { date, code, termsId, actions } = usePromo(props, warn)
const media = computed(() => {
  const m = props.media && typeof props.media === 'object' && has(props.media.src) ? props.media : null
  if (m) checkMedia(m, 'media', warn)
  return m
})
</script>

<template>
  <GCard as="section" media-position="background" :title="title" :description="description" :heading-level="heading" data-gb="promo-02">
    <template v-if="media" #media><img v-bind="imgAttrs(media)"></template>
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <template v-if="date || code || termsId" #default>
      <PromoDate v-if="date" :date="date" size="body-sm" />
      <PromoCode v-if="code" :code="code" size="body-sm" @activate="emit('activate', $event)" />
      <GText v-if="termsId" :id="termsId" size="caption" tone="muted">{{ terms }}</GText>
    </template>
    <template v-if="actions.length || $slots.actions" #actions>
      <slot name="actions" :describedby="termsId">
        <GbActions :actions="actions" :variants="['solid', 'outline']" :external="labels.external" :describedby="termsId" :warn="warn" @navigate="emit('navigate', $event)" @activate="emit('activate', $event)" />
      </slot>
    </template>
  </GCard>
</template>
