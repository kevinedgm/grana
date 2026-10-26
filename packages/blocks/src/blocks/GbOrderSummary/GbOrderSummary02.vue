<script setup>
// GbOrderSummary02 · El recibo (dueño: bruno). Contrato: design/contracts/blocks/order-summary.md · Común: _comun.md §27 ·
// Sin CSS (#763). Todo, en el orden del recibo, para la página de confirmación: GSection (título) › GStack gap="lg" ›
// [UNA GPriceScope › GStack gap="lg" › el código, la fecha del pedido, lo comprado con su miniatura, el desglose con el
// total como último par, lo incluido después y el pago, la dirección y la entrega, la nota] + acciones (solid + outline).
// Es también el pedido de Checkout (la misma pieza, common/order.js).
import { GSection, GStack } from '@grana/vue'
import GbActions from '../common/GbActions.js'
import GbOrderBody from '../common/order.js'
import GbPriceRegion from '../common/priceRegion.js'
import { useWarn } from '../common/warn.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useOrderSummary } from './useOrderSummary.js'

defineOptions({ name: 'GbOrderSummary02' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbOrderSummary02')
const { locale, order, region, priceLocale } = useOrderSummary(props, warn, '02')
</script>

<template>
  <GSection v-if="order" :title="title" data-gb="order-summary-02">
    <GStack gap="lg">
      <GbPriceRegion :region="region" :labels="labels" :locale="locale">
        <GStack gap="lg">
          <GbOrderBody :order="order" form="receipt" :labels="labels" :locale="locale" :time-zone="timeZone" :price-locale="priceLocale" :line-slot="$slots.line" :warn="warn" @navigate="emit('navigate', $event)" />
        </GStack>
      </GbPriceRegion>
      <GStack v-if="actions.length || $slots.actions" orientation="horizontal" gap="sm">
        <slot name="actions">
          <GbActions :actions="actions" :variants="['solid', 'outline']" :external="labels.external" :warn="warn" @navigate="emit('navigate', $event)" @activate="emit('activate', $event)" />
        </slot>
      </GStack>
    </GStack>
  </GSection>
</template>
