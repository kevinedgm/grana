<script setup>
// GbOrderHistory02 · Tarjetas con seguimiento (dueño: bruno). Contrato: design/contracts/blocks/order-history.md · Común: _comun.md §27 ·
// Sin CSS (#763). Cada pedido en su tarjeta, para el teléfono: GSection › GStack gap="lg" › [GPriceScope] › GLoadRegion › GStack as="ul" gap="md" › GCard as="li" (link o button; el código, la fecha en <time>, el estado como badge con su texto y su color; en el cuerpo el total y las piezas, la nota y el seguimiento con GStepper informativo —un cancelado no lleva pasos—; el transportista en actions) + GPagination. Ignora `labels.detail` y `labels.table`.
import { computed } from 'vue'
import { GSection, GStack, useSectionLevel } from '@grana/vue'
import GbPriceRegion from '../common/priceRegion.js'
import { useWarn } from '../common/warn.js'
import OrderList from './OrderList.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useOrderHistory } from './useOrderHistory.js'

defineOptions({ name: 'GbOrderHistory02' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbOrderHistory02')
const { level } = useSectionLevel()
const inner = computed(() => Math.min(Math.min(level.value, 4) + 1, 6))
const h = useOrderHistory(props, warn, '02')
const priceLocale = computed(() => (h.region.value ? undefined : h.locale.value))
</script>

<template>
  <GSection :title="title" data-gb="order-history-02">
    <GbPriceRegion :region="h.region.value" :labels="labels" :locale="h.locale.value">
      <GStack gap="lg">
        <OrderList :h="h" :p="props" :compact="false" :heading-level="inner" :price-locale="priceLocale" :slots="$slots" :warn="warn" @open="emit('open', $event)" @navigate="emit('navigate', $event)" @update:page="emit('update:page', $event)" @retry="emit('retry', $event)" />
      </GStack>
    </GbPriceRegion>
  </GSection>
</template>
