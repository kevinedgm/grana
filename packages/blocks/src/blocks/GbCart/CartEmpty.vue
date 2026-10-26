<script setup>
// El carrito vacío de GbCart (dueño: bruno; cart.md «El resumen»: «Vacío»): GEmpty cause="none" (labels.empty) con la
// SEGUNDA acción («Seguir comprando») en su slot actions; sin resumen ni acción principal. En plantilla: GEmpty lee su
// slot al montar. Interno de la sección; sin CSS.
import { computed } from 'vue'
import { GEmpty } from '@grana/vue'
import GbActions from '../common/GbActions.js'

defineOptions({ name: 'GbCartEmpty' })
const props = defineProps({
  c: { type: Object, required: true },
  headingLevel: { type: Number, required: true },
  warn: { type: Function, required: true }
})
const emit = defineEmits(['navigate', 'activate'])
const second = computed(() => props.c.actions.value.slice(1, 2))
const E = computed(() => props.c.L.value.empty || {})
</script>

<template>
  <GEmpty cause="none" :title="E.title" :description="E.description" :heading-level="headingLevel">
    <template v-if="second.length" #actions>
      <GbActions :actions="second" :variants="['outline']" :external="c.L.value.external" :warn="warn" @navigate="emit('navigate', $event)" @activate="emit('activate', $event)" />
    </template>
  </GEmpty>
</template>
