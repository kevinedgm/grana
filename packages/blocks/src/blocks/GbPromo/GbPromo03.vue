<script setup>
// GbPromo03 · Línea (dueño: bruno). Contrato: design/contracts/blocks/promo.md · Común: _comun.md §27 · Sin CSS (#763).
// Una línea sobria sobre la rejilla: GText as="div" size="body-sm" (raíz: role="group" con aria-label = title, como
// Booking summary 03, #894) › GAdaptiveLayout gap="md" vertical="center" › [strong título] + [la fecha] + [el código] + la
// primera acción (variant="link"); las condiciones debajo de la línea, ligadas a la acción. Sin encabezado. Ignora `media`,
// `description` y la segunda acción.
import { computed } from 'vue'
import { GAdaptiveLayout, GText } from '@grana/vue'
import GbActions from '../common/GbActions.js'
import { useWarn } from '../common/warn.js'
import { PromoCode, PromoDate } from './PromoPieces.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { usePromo } from './usePromo.js'

defineOptions({ name: 'GbPromo03' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbPromo03')
const { date, code, termsId, actions } = usePromo(props, warn)
const first = computed(() => actions.value.slice(0, 1))
</script>

<template>
  <GText as="div" size="body-sm" role="group" :aria-label="title" data-gb="promo-03">
    <GAdaptiveLayout gap="md" vertical="center">
      <strong>{{ title }}</strong>
      <PromoDate v-if="date" :date="date" plain />
      <PromoCode v-if="code" :code="code" plain @activate="emit('activate', $event)" />
      <slot name="actions" :describedby="termsId">
        <GbActions v-if="first.length" :actions="first" :variants="['link']" size="sm" :external="labels.external" :describedby="termsId" :warn="warn" @navigate="emit('navigate', $event)" @activate="emit('activate', $event)" />
      </slot>
    </GAdaptiveLayout>
    <GText v-if="termsId" :id="termsId" size="caption" tone="muted">{{ terms }}</GText>
  </GText>
</template>
