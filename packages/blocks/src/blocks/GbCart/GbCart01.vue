<script setup>
// GbCart01 · Lista + resumen al lado (dueño: bruno). Contrato: design/contracts/blocks/cart.md · Común: _comun.md §27, §29 ·
// Sin CSS (#763). La página del carrito: GSection (título) › UNA GPriceScope › GAdaptiveLayout gap="lg" › [div › las líneas (GStack as="ul") con su huella] + [div › el resumen]: al lado en ancho,
// debajo en estrecho. Hallazgo CR-L1 (lima): GAdaptiveLayout trata un hijo con varios controles como «bloque completo»
// (fila entera) e ignora su pista, así que hoy las dos columnas van siempre una debajo de otra; sin pista no avisa. Vacío (sin líneas ni huella): GEmpty con «Seguir comprando». Pegar el resumen es CSS de la
// aplicación en su contenedor (BK-L1). Ignora `open`, `from`, `labels.close` y `labels.dialog`.
import { computed } from 'vue'
import { GAdaptiveLayout, GSection, useSectionLevel } from '@grana/vue'
import GbPriceRegion from '../common/priceRegion.js'
import { useWarn } from '../common/warn.js'
import CartEmpty from './CartEmpty.vue'
import { CartLines, CartSummary } from './CartPieces.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useCart } from './useCart.js'

defineOptions({ name: 'GbCart01' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbCart01')
const { level } = useSectionLevel()
const inner = computed(() => Math.min(Math.min(level.value, 4) + 1, 6))
const c = useCart(props, emit, warn, '01')
const priceLocale = computed(() => (c.region.value ? undefined : c.locale.value))
</script>

<template>
  <GSection :title="title" data-gb="cart-01">
    <CartEmpty v-if="c.empty.value" :c="c" :heading-level="inner" :warn="warn" @navigate="emit('navigate', $event)" @activate="emit('activate', $event)" />
    <GbPriceRegion v-else :region="c.region.value" :labels="labels" :locale="c.locale.value">
      <GAdaptiveLayout gap="lg">
        <div>
          <CartLines :c="c" :heading-level="inner" :price-locale="priceLocale" :line-slot="$slots.line" :warn="warn" @navigate="emit('navigate', $event)" />
        </div>
        <div v-if="c.lines.value.length">
          <CartSummary :c="c" :assurance="assurance" :heading-level="inner" :price-locale="priceLocale" :summary-slot="$slots.summary" :actions-slot="$slots.actions" :warn="warn" @navigate="emit('navigate', $event)" @activate="emit('activate', $event)" />
        </div>
      </GAdaptiveLayout>
    </GbPriceRegion>
  </GSection>
</template>
