<script setup>
// GbOrderHistory01 · Tabla (dueño: bruno). Contrato: design/contracts/blocks/order-history.md · Común: _comun.md §27 · Sin
// CSS (#763). La cuenta en escritorio: GSection › [GPriceScope] › GTable (caption = title; columnas: el pedido como
// columna compuesta —el código y sus piezas—, la fecha en <time>, el estado en GBadge con su texto y la nota, el total con
// GPrice al final; `loading`, `error` con «Reintentar» y la paginación del servidor son de GTable). Sin lo comprado en los
// datos, cada fila se abre por su puerta (`rowHref` → navigate; sin href, `activatable` → open). Con lo comprado, la
// puerta despliega la ficha (slot `detail`, #599) con lo comprado, «Ver el pedido {reference}» (enlace o botón → open), el
// transportista y el slot `order`: GTable ignora `activatable` con `detail`, así que abrir va dentro de la ficha. Un
// cancelado o devuelto lleva `rowStatus` (warning) en la celda del estado. En estrecho, las tarjetas de GTable. Ignora
// `labels.progress` y `labels.region`.
import { computed } from 'vue'
import { GEmpty, GSection, GTable, useSectionLevel } from '@grana/vue'
import { GPrice } from '@grana/vue/price'
import GbPriceRegion from '../common/priceRegion.js'
import { has } from '../common/text.js'
import { useWarn } from '../common/warn.js'
import { OrderDetail, OrderStatus } from './OrderPieces.js'
import { STOPPED, emits as sectionEmits, props as sectionProps } from './props.js'
import { useOrderHistory } from './useOrderHistory.js'

defineOptions({ name: 'GbOrderHistory01' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbOrderHistory01')
const { level } = useSectionLevel()
const inner = computed(() => Math.min(Math.min(level.value, 4) + 1, 6))
const { locale, L, orders, region } = useOrderHistory(props, warn, '01')
const priceLocale = computed(() => (region.value ? undefined : locale.value))
const rows = computed(() => orders.value.map((r) => ({ id: r.key, code: r.code, count: r.count, date: r.date ? r.date.text : '', status: r.order.status, _r: r })))
const withDetail = computed(() => orders.value.some((r) => r.lines))
try { if (process.env.NODE_ENV !== 'production' && withDetail.value && !has(L.value.detail)) warn('C5:detail', 'hay pedidos con lines y falta labels.detail («Pedido {title}»): la ficha desplegada va sin nombre (C5).') } catch {}
const columns = computed(() => [
  { key: 'order', label: L.value.reference || '', title: 'code', subtitle: 'count', primary: true },
  { key: 'date', label: L.value.date || '' },
  { key: 'status', label: L.value.status || '' },
  { key: 'total', label: L.value.total || '', align: 'end' }
])
const rowHref = (row) => row._r.href || undefined
const activatable = computed(() => !withDetail.value && orders.value.some((r) => !r.href))
const rowStatus = (row) => (STOPPED.includes(row._r.order.status) ? { status: 'warning', text: row._r.order.statusText, key: 'status' } : null)
const tableLabels = computed(() => ({ ...(L.value.table || {}), pagination: L.value.pagination, detail: L.value.detail, ...(typeof props.error === 'string' && has(props.error) ? { failed: props.error } : {}) }))
const onNavigate = ({ row, href, event }) => emit('navigate', { event, href, item: row._r.order })
const onActivate = ({ row, event }) => emit('open', { event, order: row._r.order })
</script>

<template>
  <GSection :title="title" data-gb="order-history-01">
    <GbPriceRegion :region="region" :labels="labels" :locale="locale">
      <GTable :columns="columns" :rows="rows" row-key="id" :caption="title" :row-href="rowHref" :activatable="activatable" :row-status="rowStatus" :loading="loading" :error="Boolean(error)" :page="page" :page-size="pageSize" :total="total" :labels="tableLabels" @update:page="emit('update:page', $event)" @retry="emit('retry', { event: null })" @navigate="onNavigate" @activate="onActivate">
        <template #cell-date="{ row }"><time v-if="row._r.date" :datetime="row._r.date.datetime">{{ row._r.date.text }}</time></template>
        <template #cell-status="{ row }"><OrderStatus :r="row._r" /></template>
        <template #cell-total="{ row }"><GPrice :value="row._r.order.total" size="sm" :locale="priceLocale" /></template>
        <template v-if="withDetail" #detail="{ row }"><OrderDetail :r="row._r" :labels="labels" :locale="locale" :price-locale="priceLocale" :order-slot="$slots.order" :warn="warn" @open="emit('open', $event)" @navigate="emit('navigate', $event)" /></template>
        <template #empty><slot name="empty"><GEmpty cause="none" :title="labels.empty && labels.empty.title" :description="labels.empty && labels.empty.description" :heading-level="inner" /></slot></template>
      </GTable>
    </GbPriceRegion>
  </GSection>
</template>
