<script setup>
// La marca del pie (dueño: bruno; footer.md «Anatomía común»). Interno de la sección: no se exporta. Sin CSS.
// Con `brand.href`, GBtn variant="link" (navigate con item = brand) › el logo (alt = brand.name, sin el nombre repetido al
// lado; hallazgo B-L3) o el nombre. Sin `href`, un p con el logo o el nombre.
import { GText } from '@grana/vue'
import { imgAttrs } from '../common/media.js'
import GbLink from '../common/link.js'

defineOptions({ name: 'GbFooterBrand' })
defineProps({
  data: { type: Object, required: true },
  warn: { type: Function, required: true }
})
const emit = defineEmits(['navigate'])
const logoAttrs = (logo, name) => ({ ...imgAttrs({ ...logo, decorative: false, alt: name }) })
</script>

<template>
  <GbLink v-if="data.link" :link="data.link" :item="data.brand" what="brand" :warn="warn" @navigate="emit('navigate', $event)">
    <img v-if="data.logo" v-bind="logoAttrs(data.logo, data.brand.name)">
    <template v-else>{{ data.brand.name }}</template>
  </GbLink>
  <GText v-else>
    <img v-if="data.logo" v-bind="logoAttrs(data.logo, data.brand.name)">
    <template v-else>{{ data.brand.name }}</template>
  </GText>
</template>
