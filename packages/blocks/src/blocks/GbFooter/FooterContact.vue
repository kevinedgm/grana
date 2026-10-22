<script setup>
// El contacto del pie, en un `address` real (dueño: bruno; footer.md «Anatomía común», #826). Interno: no se exporta. Sin
// CSS. Líneas de la dirección, los canales como enlaces que el teléfono abre (tel:, mailto:, https://wa.me/…; sin navigate)
// y el horario. `inline`: los canales en una fila (02).
import { GStack, GText } from '@grana/vue'
import GbLink from '../common/link.js'

defineOptions({ name: 'GbFooterContact' })
defineProps({
  data: { type: Object, required: true },
  external: { type: String, default: undefined },
  inline: { type: Boolean, default: false },
  warn: { type: Function, required: true }
})
const emit = defineEmits(['navigate'])
</script>

<template>
  <GText v-if="data.any" as="address" size="body-sm">
    <p v-if="data.lines.length"><template v-for="(line, i) in data.lines" :key="i"><br v-if="i">{{ line }}</template></p>
    <GStack v-if="data.channels.length" as="ul" :orientation="inline ? 'horizontal' : 'vertical'" gap="sm">
      <li v-for="c in data.channels" :key="c.key">
        <GbLink :link="c.item" :external="external" :what="`contact.channels[${c.index}]`" :warn="warn" @navigate="emit('navigate', $event)" />
      </li>
    </GStack>
    <p v-if="data.hours">{{ data.hours }}</p>
  </GText>
</template>
