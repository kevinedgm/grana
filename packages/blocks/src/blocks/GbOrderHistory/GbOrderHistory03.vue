<script setup>
// GbOrderHistory03 · Lista (dueño: bruno). Contrato: design/contracts/blocks/order-history.md · Común: _comun.md §27 ·
// Sin CSS (#763). Una lista compacta, una línea por pedido: GSection › GStack gap="lg" › [GPriceScope] › GLoadRegion › GStack as="ul" gap="sm" › GCard as="li" level="flat" density="compact" (el código, la fecha, el estado y el total) + GPagination. Ignora `progress`, `lines`, el transportista y `labels.progress`/`detail`/`table`/`tracking`.
import { computed } from 'vue'
import { GSection, GStack, useSectionLevel } from '@grana/vue'
import GbPriceRegion from '../common/priceRegion.js'
import { useWarn } from '../common/warn.js'
import OrderList from './OrderList.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useOrderHistory } from './useOrderHistory.js'

defineOptions({ name: 'GbOrderHistory03' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbOrderHistory03')
const { level } = useSectionLevel()
const inner = computed(() => Math.min(Math.min(level.value, 4) + 1, 6))
const h = useOrderHistory(props, warn, '03')
const priceLocale = computed(() => (h.region.value ? undefined : h.locale.value))
</script>

<template>
  <GSection :title="title" data-gb="order-history-03">
    <GbPriceRegion :region="h.region.value" :labels="labels" :locale="h.locale.value">
      <GStack gap="lg">
        <OrderList :h="h" :p="props" :compact="true" :heading-level="inner" :price-locale="priceLocale" :slots="$slots" :warn="warn" @open="emit('open', $event)" @navigate="emit('navigate', $event)" @update:page="emit('update:page', $event)" @retry="emit('retry', $event)" />
      </GStack>
    </GbPriceRegion>
  </GSection>
</template>
