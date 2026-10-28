<script setup>
// GbCheckout03 · Con el pedido al lado (dueño: bruno). Contrato: design/contracts/blocks/checkout.md · Común: _comun.md §27 · Sin CSS
// (#763). El formulario por pasos y, al lado cuando el pedido cabe en 320 px (debajo si no), el pedido abierto (§40, #950):
// GSection › UNA GPriceScope › GSplit ratio="3:2" gap="lg" › [#start GStack › GStepper + el formulario de 01 con el pie pegado
// (GFormActions sticky, con el total en status)] + [#end el pedido (Order summary 02)]. Ignora el GAccordion del pedido.
// Volver no borra (§27 regla 3); el pago es el slot step-{id} de la aplicación (EC6).
import { computed, useSlots } from 'vue'
import { GSection, GSplit, GStack, GStepper, useSectionLevel } from '@grana/vue'
import GbPriceRegion from '../common/priceRegion.js'
import { useWarn } from '../common/warn.js'
import CheckoutForm from './CheckoutForm.js'
import CheckoutOrder from './CheckoutOrder.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useCheckout } from './useCheckout.js'

defineOptions({ name: 'GbCheckout03' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbCheckout03')
const { level } = useSectionLevel()
const inner = computed(() => Math.min(Math.min(level.value, 4) + 1, 6))
const k = useCheckout(props, emit, warn, '03', useSlots())
const priceLocale = computed(() => (k.region.value ? undefined : k.locale.value))
const stepperSteps = computed(() => k.steps.value.map((s) => ({ id: s.id, label: s.step.title, description: s.step.description })))
const onStep = (id) => k.change(k.steps.value.findIndex((s) => s.id === id))
</script>

<template>
  <GSection :title="title" data-gb="checkout-03">
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <GbPriceRegion :region="k.region.value" :labels="labels" :locale="k.locale.value">
      <GSplit ratio="3:2" gap="lg">
        <template #start>
          <GStack gap="lg">
            <GStepper v-if="k.steps.value.length > 1" :steps="stepperSteps" :model-value="k.current.value" navigation="back" :labels="labels.stepper" :aria-label="title" @update:model-value="onStep" />
            <CheckoutForm :k="k" :p="props" variant="03" :heading-level="inner" :price-locale="priceLocale" :slots="$slots" :warn="warn" @navigate="emit('navigate', $event)" />
          </GStack>
        </template>
        <template #end>
          <CheckoutOrder :order="order" :labels="labels" open :heading-level="inner" :locale="k.locale.value" :price-locale="priceLocale" :order-slot="$slots.order" :warn="warn" @navigate="emit('navigate', $event)" />
        </template>
      </GSplit>
    </GbPriceRegion>
  </GSection>
</template>
