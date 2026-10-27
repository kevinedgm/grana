<script setup>
// La vista rápida es un diálogo: aquí cada variante se abre desde su propio botón, con el banco de la sección (el mismo de
// sus pruebas y de su playground, sin su `open: true`). Al cerrar, el foco vuelve al botón (`from`). La elección queda
// en el estado de la página (`v-model:selection`), como la guardaría tu aplicación.
import { reactive } from 'vue'
import * as Blocks from '@grana/blocks/ecommerce'
import * as bank from '../../packages/blocks/src/blocks/GbQuickView/quick-view.bank.js'
import meta from '../../packages/blocks/src/blocks/GbQuickView/GbQuickView.meta.json'

const state = reactive(Object.fromEntries(meta.variants.map((v) => [v.name, { open: false, selection: {}, quantity: 1 }])))
const buttonId = (name) => `qv-demo-${name}`
</script>

<template>
  <div class="grana-quick-view-demo">
    <p>Abre cada variante desde su botón; el foco vuelve a él al cerrar.</p>
    <div style="display: flex; flex-wrap: wrap; gap: var(--g-space-3)">
      <template v-for="v in meta.variants" :key="v.name">
        <g-btn :id="buttonId(v.name)" variant="outline" @click="state[v.name].open = true">{{ v.name }} · {{ v.concept }}</g-btn>
        <component
          :is="Blocks[v.name]"
          v-bind="{ ...bank.props, open: false }"
          :id="`demo-${v.name}`"
          :from="buttonId(v.name)"
          :open="state[v.name].open"
          :selection="state[v.name].selection"
          :quantity="state[v.name].quantity"
          @update:open="state[v.name].open = $event"
          @update:selection="state[v.name].selection = $event"
          @update:quantity="state[v.name].quantity = $event"
          @navigate="$event.event?.preventDefault?.()"
        />
      </template>
    </div>
  </div>
</template>
