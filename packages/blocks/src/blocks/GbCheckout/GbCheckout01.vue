<script setup>
// GbCheckout01 · Por pasos (dueño: bruno). Contrato: design/contracts/blocks/checkout.md · Común: _comun.md §27 · Sin CSS
// (#763). Un paso a la vista con GStepper arriba y el pedido plegado en una línea encima: GSection › UNA GPriceScope › GStack gap="lg" › el pedido (GAccordion: «Tu pedido», el total y las piezas) + GStepper (navigation="back", v-model = el paso) + el formulario con solo el paso actual a la vista (los demás hidden y montados: sus datos van en el envío) y «Atrás».
// Volver no borra (§27 regla 3); el pago es el slot step-{id} de la aplicación (EC6).
import { computed, useSlots } from 'vue'
import { GSection, GStack, GStepper, useSectionLevel } from '@grana/vue'
import GbPriceRegion from '../common/priceRegion.js'
import { useWarn } from '../common/warn.js'
import CheckoutForm from './CheckoutForm.js'
import CheckoutOrder from './CheckoutOrder.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useCheckout } from './useCheckout.js'

defineOptions({ name: 'GbCheckout01' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbCheckout01')
const { level } = useSectionLevel()
const inner = computed(() => Math.min(Math.min(level.value, 4) + 1, 6))
const k = useCheckout(props, emit, warn, '01', useSlots())
const priceLocale = computed(() => (k.region.value ? undefined : k.locale.value))
const stepperSteps = computed(() => k.steps.value.map((s) => ({ id: s.id, label: s.step.title, description: s.step.description })))
const onStep = (id) => k.change(k.steps.value.findIndex((s) => s.id === id))
</script>

<template>
  <GSection :title="title" data-gb="checkout-01">
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <GbPriceRegion :region="k.region.value" :labels="labels" :locale="k.locale.value">
      <GStack gap="lg">
        <CheckoutOrder :order="order" :labels="labels" :heading-level="inner" :locale="k.locale.value" :price-locale="priceLocale" :order-slot="$slots.order" :warn="warn" @navigate="emit('navigate', $event)" />
        <GStepper v-if="k.steps.value.length > 1" :steps="stepperSteps" :model-value="k.current.value" navigation="back" :labels="labels.stepper" :aria-label="title" @update:model-value="onStep" />
        <CheckoutForm :k="k" :p="props" variant="01" :heading-level="inner" :price-locale="priceLocale" :slots="$slots" :warn="warn" @navigate="emit('navigate', $event)" />
      </GStack>
    </GbPriceRegion>
  </GSection>
</template>
