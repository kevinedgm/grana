<script setup>
// GbGuestForm03 · Con lo pedido a la vista (dueño: bruno). Contrato: design/contracts/blocks/guest-form.md · Común:
// _comun.md §15 · Sin CSS (#763). GSection › GStack gap="lg" › [GCard level="flat" con lo que se va a reservar: GSummary
// (oferta), la consulta con describeQuery y GPrice del offer.price en una GPriceScope] + el formulario de 01 con el pie de
// envío pegado (GFormActions sticky, que cuida 2.4.11 dentro de GForm). Ignora `step` y labels.next/back/stepper.
import { computed } from 'vue'
import { GCard, GSection, GStack, GSummary, GText, useSectionLevel } from '@grana/vue'
import { GPrice } from '@grana/vue/price'
import { checkRegion, priceSpec } from '../common/booking.js'
import GbPriceRegion from '../common/priceRegion.js'
import { has } from '../common/text.js'
import { useWarn } from '../common/warn.js'
import GuestForm from './GuestForm.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useGuestForm } from './useGuestForm.js'

defineOptions({ name: 'GbGuestForm03' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbGuestForm03')
const { level } = useSectionLevel()
const inner = computed(() => Math.min(Math.min(level.value, 4) + 1, 6))
const g = useGuestForm(props, emit, warn, '03')
const offer = computed(() => (props.offer && typeof props.offer === 'object' && has(props.offer.name) ? props.offer : null))
const price = computed(() => (offer.value ? priceSpec(offer.value.price, 'offer.price', warn) : null))
const region = computed(() => checkRegion(props.prices, Boolean(price.value), warn))
const sep = computed(() => (props.labels && props.labels.query && typeof props.labels.query.separator === 'string' ? props.labels.query.separator : ' '))
const line = computed(() => (g.queryLine.value ? [g.queryLine.value.line, g.queryLine.value.checkout].filter(Boolean).join(sep.value) : ''))
</script>

<template>
  <GSection v-if="g.fields.value.length" :title="title" :description="description" data-gb="guest-form-03">
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <GStack gap="lg">
      <GCard v-if="offer || line" as="div" level="flat" role="group" :aria-label="offer ? offer.name : line">
        <GStack gap="sm">
          <GSummary v-if="offer" layout="stack" :title="offer.name" :subtitle="offer.kind || undefined" />
          <GText v-if="line" size="body-sm">{{ line }}</GText>
          <GbPriceRegion v-if="price" :region="region" :labels="labels" :locale="g.locale.value">
            <GPrice v-bind="price" size="md" />
          </GbPriceRegion>
        </GStack>
      </GCard>
      <GuestForm :g="g" :p="props" :heading-level="inner" variant="03" :slots="$slots" :warn="warn" @navigate="emit('navigate', $event)" />
    </GStack>
  </GSection>
</template>
