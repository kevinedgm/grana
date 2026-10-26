<script setup>
// GbCheckout02 · Se pliega lo hecho (dueño: bruno). Contrato: design/contracts/blocks/checkout.md · Común: _comun.md §27 · Sin CSS
// (#763). Todos los pasos en la página: GSection › UNA GPriceScope › GStack gap="lg" › el pedido (GAccordion) + el formulario con una GFormSection collapsible por paso: el hecho se pliega con su resumen y «Cambiar», el actual abierto y los posteriores plegados e inert hasta llegar. Ignora labels.stepper.
// Volver no borra (§27 regla 3); el pago es el slot step-{id} de la aplicación (EC6).
import { computed, useSlots } from 'vue'
import { GSection, GStack, useSectionLevel } from '@grana/vue'
import GbPriceRegion from '../common/priceRegion.js'
import { useWarn } from '../common/warn.js'
import CheckoutForm from './CheckoutForm.js'
import CheckoutOrder from './CheckoutOrder.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useCheckout } from './useCheckout.js'

defineOptions({ name: 'GbCheckout02' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbCheckout02')
const { level } = useSectionLevel()
const inner = computed(() => Math.min(Math.min(level.value, 4) + 1, 6))
const k = useCheckout(props, emit, warn, '02', useSlots())
const priceLocale = computed(() => (k.region.value ? undefined : k.locale.value))
</script>

<template>
  <GSection :title="title" data-gb="checkout-02">
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <GbPriceRegion :region="k.region.value" :labels="labels" :locale="k.locale.value">
      <GStack gap="lg">
        <CheckoutOrder :order="order" :labels="labels" :heading-level="inner" :locale="k.locale.value" :price-locale="priceLocale" :order-slot="$slots.order" :warn="warn" @navigate="emit('navigate', $event)" />
        <CheckoutForm :k="k" :p="props" variant="02" :heading-level="inner" :price-locale="priceLocale" :slots="$slots" :warn="warn" @navigate="emit('navigate', $event)" />
      </GStack>
    </GbPriceRegion>
  </GSection>
</template>
