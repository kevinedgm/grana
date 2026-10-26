<script setup>
// GbOrderSummary03 · Línea (dueño: bruno). Contrato: design/contracts/blocks/order-summary.md · Común: _comun.md §27 ·
// Sin CSS (#763). Una línea compacta en lo alto de un paso o de una lista, como Booking summary 03 (#894, #897, #906):
// GText as="div" size="body" (raíz: role="group" con aria-label = title) › GAdaptiveLayout gap="md" vertical="center" ›
// GSummary layout="inline" (hijo directo, #897: title = el código, el dato = las piezas con labels.quantity) + GPrice sm del
// total en su GPriceScope + la primera acción (outline). Se parte en líneas solo cuando el ancho no alcanza (#908).
// Ignora lo comprado línea a línea, el desglose, el envío, el pago, la nota, la fecha y la segunda acción.
import { computed } from 'vue'
import { GAdaptiveLayout, GSummary, GText } from '@grana/vue'
import { GPrice } from '@grana/vue/price'
import GbActions from '../common/GbActions.js'
import { labelOf } from '../common/order.js'
import GbPriceRegion from '../common/priceRegion.js'
import { has } from '../common/text.js'
import { totalOf } from '../common/totals.js'
import { useWarn } from '../common/warn.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useOrderSummary } from './useOrderSummary.js'

defineOptions({ name: 'GbOrderSummary03' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbOrderSummary03')
const { locale, order, region, priceLocale } = useOrderSummary(props, warn, '03')
const total = computed(() => (order.value ? totalOf(order.value.totals) : null))
// La cuenta de piezas (de vista: las cantidades de las líneas; no es un precio, §27 regla 4)
const facts = computed(() => {
  const o = order.value
  if (!o) return []
  const n = (Array.isArray(o.lines) ? o.lines : []).reduce((s, l) => s + (l && Number.isFinite(l.quantity) ? l.quantity : 0), 0)
  const t = n ? labelOf(props.labels.quantity, 'count', n) : ''
  try { if (process.env.NODE_ENV !== 'production' && n && !t) warn('C5:quantity', 'falta labels.quantity («{count} piezas»): la línea va sin la cuenta (C5).') } catch {}
  return t && has(props.labels.lines) ? [{ label: props.labels.lines, value: t, bare: true }] : []
})
const code = computed(() => (order.value && order.value.reference && has(order.value.reference.code) ? order.value.reference.code : props.title))
const first = computed(() => (Array.isArray(props.actions) ? props.actions.slice(0, 1) : []))
</script>

<template>
  <GText v-if="order" as="div" size="body" role="group" :aria-label="title" data-gb="order-summary-03">
    <GAdaptiveLayout gap="md" vertical="center">
      <GSummary layout="inline" :title="code" :facts="facts" />
      <GbPriceRegion v-if="total" :region="region" :labels="labels" :locale="locale">
        <GPrice :value="total.value" size="sm" :locale="priceLocale" />
      </GbPriceRegion>
      <slot name="actions">
        <GbActions v-if="first.length" :actions="first" :variants="['outline']" size="sm" :external="labels.external" :warn="warn" @navigate="emit('navigate', $event)" @activate="emit('activate', $event)" />
      </slot>
    </GAdaptiveLayout>
  </GText>
</template>
