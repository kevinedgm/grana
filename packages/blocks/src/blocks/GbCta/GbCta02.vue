<script setup>
// GbCta02 · Tarjeta con imagen (dueño: bruno). Contrato: design/contracts/blocks/cta.md · Común: _comun.md · Sin CSS.
// GCard as="section" orientation="auto" mediaPosition="start" (raíz): la foto en `media`, `title` al nivel de sección
// (useSectionLevel, _comun.md §1 regla 6), `description`, acciones (solid + outline) en `actions` y `assurance` en
// `footer`, ligada a la principal. Sin `media`, tarjeta sin foto.
import { computed } from 'vue'
import { GCard, useSectionLevel } from '@grana/vue'
import GbActions from '../common/GbActions.js'
import { checkMedia, imgAttrs } from '../common/media.js'
import { has } from '../common/text.js'
import { useWarn } from '../common/warn.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useCta } from './useCta.js'

defineOptions({ name: 'GbCta02' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbCta02')
const { level } = useSectionLevel()
const heading = computed(() => Math.min(level.value, 6))
const { actions, assuranceId } = useCta(props, warn)
const media = computed(() => {
  const m = props.media && typeof props.media === 'object' && has(props.media.src) ? props.media : null
  if (m) checkMedia(m, 'media', warn)
  return m
})
</script>

<template>
  <GCard as="section" orientation="auto" media-position="start" :title="title" :description="description" :heading-level="heading" data-gb="cta-02">
    <template v-if="media" #media><img v-bind="imgAttrs(media)" :role="media.decorative ? undefined : 'img'"></template>
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <template v-if="actions.length || $slots.actions" #actions>
      <slot name="actions">
        <GbActions :actions="actions" :variants="['solid', 'outline']" :external="labels.external" :describedby="assuranceId" :warn="warn" @navigate="emit('navigate', $event)" @activate="emit('activate', $event)" />
      </slot>
    </template>
    <template v-if="assuranceId" #footer><p :id="assuranceId">{{ assurance }}</p></template>
  </GCard>
</template>
