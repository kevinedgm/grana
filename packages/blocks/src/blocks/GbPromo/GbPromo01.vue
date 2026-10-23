<script setup>
// GbPromo01 · Banda (dueño: bruno). Contrato: design/contracts/blocks/promo.md · Común: _comun.md §27 · Sin CSS (#763).
// Una banda de marca a todo lo ancho entre dos secciones: GSurface zone="brand" level="flat" padding="lg" (raíz, #830) ›
// GContainer › GSection (título, descripción) › GStack gap="md" › la fecha + el código + las condiciones + las acciones
// (solid + outline, con las de la zona; la principal descrita por las condiciones). A sangre, la aplicación pone
// `class="g-bleed"` en la raíz (llega por $attrs). `media` se ignora.
import { GContainer, GSection, GStack, GSurface, GText } from '@grana/vue'
import GbActions from '../common/GbActions.js'
import { useWarn } from '../common/warn.js'
import { PromoCode, PromoDate } from './PromoPieces.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { usePromo } from './usePromo.js'

defineOptions({ name: 'GbPromo01' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbPromo01')
const { date, code, termsId, actions } = usePromo(props, warn)
</script>

<template>
  <GSurface zone="brand" level="flat" padding="lg" data-gb="promo-01">
    <GContainer>
      <GSection :title="title" :description="description">
        <template v-if="$slots.description" #description><slot name="description" /></template>
        <GStack gap="md">
          <PromoDate v-if="date" :date="date" />
          <PromoCode v-if="code" :code="code" @activate="emit('activate', $event)" />
          <GText v-if="termsId" :id="termsId" size="caption" tone="muted">{{ terms }}</GText>
          <GStack orientation="horizontal" gap="sm">
            <slot name="actions" :describedby="termsId">
              <GbActions :actions="actions" :variants="['solid', 'outline']" :external="labels.external" :describedby="termsId" :warn="warn" @navigate="emit('navigate', $event)" @activate="emit('activate', $event)" />
            </slot>
          </GStack>
        </GStack>
      </GSection>
    </GContainer>
  </GSurface>
</template>
