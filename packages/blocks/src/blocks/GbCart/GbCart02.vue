<script setup>
// GbCart02 · Resumen al pie (dueño: bruno). Contrato: design/contracts/blocks/cart.md · Común: _comun.md §27, §29 · Sin CSS
// (#763). Una columna: GSection (título) › UNA GPriceScope › GStack gap="lg" › las líneas (GStack as="ul") con su huella +
// el resumen al final, con el total justo encima de «Pagar» (sin muelle: BK-L2, §36). Vacío: GEmpty con «Seguir
// comprando». Ignora `open`, `from`, `labels.close` y `labels.dialog`.
import { computed } from 'vue'
import { GSection, GStack, useSectionLevel } from '@grana/vue'
import GbPriceRegion from '../common/priceRegion.js'
import { useWarn } from '../common/warn.js'
import CartEmpty from './CartEmpty.vue'
import { CartLines, CartSummary } from './CartPieces.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useCart } from './useCart.js'

defineOptions({ name: 'GbCart02' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbCart02')
const { level } = useSectionLevel()
const inner = computed(() => Math.min(Math.min(level.value, 4) + 1, 6))
const c = useCart(props, emit, warn, '02')
const priceLocale = computed(() => (c.region.value ? undefined : c.locale.value))
</script>

<template>
  <GSection :title="title" data-gb="cart-02">
    <CartEmpty v-if="c.empty.value" :c="c" :heading-level="inner" :warn="warn" @navigate="emit('navigate', $event)" @activate="emit('activate', $event)" />
    <GbPriceRegion v-else :region="c.region.value" :labels="labels" :locale="c.locale.value">
      <GStack gap="lg">
        <CartLines :c="c" :heading-level="inner" :price-locale="priceLocale" :line-slot="$slots.line" :warn="warn" @navigate="emit('navigate', $event)" />
        <CartSummary v-if="c.lines.value.length" :c="c" :assurance="assurance" :heading-level="inner" :price-locale="priceLocale" :summary-slot="$slots.summary" :actions-slot="$slots.actions" :warn="warn" @navigate="emit('navigate', $event)" @activate="emit('activate', $event)" />
      </GStack>
    </GbPriceRegion>
  </GSection>
</template>
