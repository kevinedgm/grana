<script setup>
// GbOrderSummary01 · Tarjeta (dueño: bruno). Contrato: design/contracts/blocks/order-summary.md · Común: _comun.md §27 ·
// Sin CSS (#763). Lo esencial para una columna: GCard as="section" (raíz; título al nivel de useSectionLevel(), #927) ›
// UNA GPriceScope › GStack gap="md" › el código (GMetric), lo comprado y el total (sin desglose: solo lo que falta por
// calcular se dice) + acciones (solid + outline). Ignora `totals.lines` con importe, `placedAt`, `shipping`, `payment`,
// `note`, `timeZone` y las miniaturas.
import { computed } from 'vue'
import { GCard, GStack, useSectionLevel } from '@grana/vue'
import GbActions from '../common/GbActions.js'
import GbOrderBody from '../common/order.js'
import GbPriceRegion from '../common/priceRegion.js'
import { useWarn } from '../common/warn.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useOrderSummary } from './useOrderSummary.js'

defineOptions({ name: 'GbOrderSummary01' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbOrderSummary01')
const { level } = useSectionLevel()
const heading = computed(() => Math.min(level.value, 6))
const { locale, order, region, priceLocale } = useOrderSummary(props, warn, '01')
</script>

<template>
  <GCard v-if="order" as="section" :title="title" :heading-level="heading" data-gb="order-summary-01">
    <GbPriceRegion :region="region" :labels="labels" :locale="locale">
      <GStack gap="md">
        <GbOrderBody :order="order" form="card" :labels="labels" :locale="locale" :price-locale="priceLocale" :line-slot="$slots.line" :warn="warn" @navigate="emit('navigate', $event)" />
      </GStack>
    </GbPriceRegion>
    <template v-if="actions.length || $slots.actions" #actions>
      <slot name="actions">
        <GbActions :actions="actions" :variants="['solid', 'outline']" :external="labels.external" :warn="warn" @navigate="emit('navigate', $event)" @activate="emit('activate', $event)" />
      </slot>
    </template>
  </GCard>
</template>
