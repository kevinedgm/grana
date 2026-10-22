<script setup>
// Legales y redes del pie (dueño: bruno; footer.md «Anatomía común»). Interno: no se exporta. Sin CSS. Legales en un `nav`
// con nombre (labels.legal) y redes en una lista con nombre (labels.social), con texto: Lucide no dibuja marcas. La nota y
// la fila que los contiene las pone la variante (01 y 03: nota, legales, redes; 02: legales, redes, nota).
import { GStack } from '@grana/vue'
import GbLink from '../common/link.js'

defineOptions({ name: 'GbFooterLegal' })
defineProps({
  f: { type: Object, required: true },
  warn: { type: Function, required: true }
})
const emit = defineEmits(['navigate'])
</script>

<template>
  <nav v-if="f.legal.value.length" :aria-label="f.legalLabel.value">
    <GStack as="ul" orientation="horizontal" gap="sm">
      <li v-for="l in f.legal.value" :key="l.key">
        <GbLink :link="l.item" :external="f.external.value" :what="`legal[${l.index}]`" :warn="warn" @navigate="emit('navigate', $event)" />
      </li>
    </GStack>
  </nav>
  <GStack v-if="f.social.value.length" as="ul" orientation="horizontal" gap="sm" :aria-label="f.socialLabel.value">
    <li v-for="s in f.social.value" :key="s.key">
      <GbLink :link="s.item" :external="f.external.value" :what="`social[${s.index}]`" :warn="warn" @navigate="emit('navigate', $event)" />
    </li>
  </GStack>
</template>
