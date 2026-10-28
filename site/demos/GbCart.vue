<script setup>
// El carrito es de vista: quien quita la línea, la devuelve y recalcula los totales es tu aplicación. Aquí las tres
// variantes comparten un solo estado (el del banco: `app()` cambia la cantidad, quita y devuelve la línea y vuelve a
// pedir los totales a `cartTotals`), y el cajón (03) se abre desde su botón; el foco vuelve a él al cerrar (`from`).
import { reactive, ref } from 'vue'
import * as Blocks from '@grana/blocks/ecommerce'
import * as bank from '../../packages/blocks/src/blocks/GbCart/cart.bank.js'
import meta from '../../packages/blocks/src/blocks/GbCart/GbCart.meta.json'

const { onRemove, onRestore, ...shared } = bank.props
const view = reactive({ ...shared })
const events = []
const handlers = bank.app(view, events, 0)
const last = ref('')
const note = (name) => (p) => { last.value = `${name} · ${p.line?.product?.name ?? ''}` }
const open = ref(false)
const buttonId = 'cart-demo-open'
const navigate = (e) => e.event?.preventDefault?.()
</script>

<template>
  <div class="grana-cart-demo">
    <section v-for="v in meta.variants.filter((x) => x.name !== 'GbCart03')" :key="v.name" style="margin-block-end: var(--g-space-8)">
      <p style="margin: 0 0 var(--g-space-3)">{{ v.name }} · {{ v.concept }}</p>
      <component
        :is="Blocks[v.name]" v-bind="view" :id="`demo-${v.name}`"
        @change="(p) => { handlers.onChange(p); note('change')(p) }"
        @remove="(p) => { handlers.onRemove(p); note('remove')(p) }"
        @restore="(p) => { handlers.onRestore(p); note('restore')(p) }"
        @navigate="navigate"
      />
    </section>
    <p style="margin: 0 0 var(--g-space-3)">GbCart03 · Cajón</p>
    <g-btn :id="buttonId" variant="outline" @click="open = true">Abrir el carrito</g-btn>
    <Blocks.GbCart03
      v-bind="view" id="demo-GbCart03" :from="buttonId" :open="open"
      @update:open="open = $event"
      @change="(p) => { handlers.onChange(p); note('change')(p) }"
      @remove="(p) => { handlers.onRemove(p); note('remove')(p) }"
      @restore="(p) => { handlers.onRestore(p); note('restore')(p) }"
      @navigate="navigate"
    />
    <p aria-live="polite" style="min-block-size: 1lh; margin: var(--g-space-3) 0 0; color: var(--g-color-text-muted)"><span v-if="last">{{ last }}</span></p>
  </div>
</template>
