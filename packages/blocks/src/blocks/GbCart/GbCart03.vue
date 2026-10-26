<script setup>
// GbCart03 · Cajón (dueño: bruno). Contrato: design/contracts/blocks/cart.md · Común: _comun.md §27, §29 · Sin CSS (#763).
// El carrito que se abre al borde sin salir de la página: GDialog placement="end" size="sm" mobile="fullscreen" (raíz;
// v-model = `open`, title, closeLabel = labels.close, `from` = el disparador, labels.dialog) › UNA GPriceScope › GStack
// gap="md" › las líneas SIN foto con su huella + el resumen con solo el total (y lo que falta por calcular, que se dice).
// El foco vuelve al disparador al cerrar (GDialog). Vacío: GEmpty con «Seguir comprando». Ignora `media` de las líneas y
// las líneas del desglose con importe.
import { GDialog, GStack } from '@grana/vue'
import { computed, useAttrs } from 'vue'
import GbPriceRegion from '../common/priceRegion.js'
import { useWarn } from '../common/warn.js'
import CartEmpty from './CartEmpty.vue'
import { CartLines, CartSummary } from './CartPieces.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useCart } from './useCart.js'

// Los atributos llegan a la raíz (el GDialog) salvo las escuchas de los eventos propios de GDialog: una escucha `open` de
// la aplicación (la de una vista rápida, otro bloque) no es de este bloque y no debe engancharse al diálogo
defineOptions({ name: 'GbCart03', inheritAttrs: false })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbCart03')
// Dentro del diálogo, el título del cajón es el h2 y lo de dentro va un nivel por debajo
const inner = 3
const c = useCart(props, emit, warn, '03')
const priceLocale = computed(() => (c.region.value ? undefined : c.locale.value))
const attrs = useAttrs()
const rootAttrs = computed(() => Object.fromEntries(Object.entries(attrs).filter(([k]) => !/^on(Open|Closed|Dismiss|Step|Update:steps)(Once)?$/.test(k))))
</script>

<template>
  <GDialog v-bind="rootAttrs" :model-value="open" :title="title" placement="end" size="sm" mobile="fullscreen" :close-label="labels.close" :from="from || undefined" :labels="labels.dialog" data-gb="cart-03" @update:model-value="emit('update:open', $event)">
    <CartEmpty v-if="c.empty.value" :c="c" :heading-level="inner" :warn="warn" @navigate="emit('navigate', $event)" @activate="emit('activate', $event)" />
    <GbPriceRegion v-else :region="c.region.value" :labels="labels" :locale="c.locale.value">
      <GStack gap="md">
        <CartLines :c="c" :media="false" :heading-level="inner" :price-locale="priceLocale" :line-slot="$slots.line" :warn="warn" @navigate="emit('navigate', $event)" />
        <CartSummary v-if="c.lines.value.length" :c="c" form="total" :assurance="assurance" :heading-level="inner" :price-locale="priceLocale" :summary-slot="$slots.summary" :actions-slot="$slots.actions" :warn="warn" @navigate="emit('navigate', $event)" @activate="emit('activate', $event)" />
      </GStack>
    </GbPriceRegion>
  </GDialog>
</template>
