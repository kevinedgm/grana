<script setup>
// GbFooter01 · Columnas (dueño: bruno). Contrato: design/contracts/blocks/footer.md · Común: _comun.md · Sin CSS (#763).
// GStack :as (footer suelto; div dentro del slot footer de GAppShell) gap="lg" › marca y contacto PRIMERO, columnas de
// enlaces en un solo nav, GDivider y la fila final (nota, legales, redes).
import { GStack } from '@grana/vue'
import { useWarn } from '../common/warn.js'
import FooterMain from './FooterMain.vue'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useFooter } from './useFooter.js'

defineOptions({ name: 'GbFooter01' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbFooter01')
const f = useFooter(props, warn, { groups: true, address: true })
</script>

<template>
  <GStack :as="as" gap="lg" data-gb="footer-01">
    <FooterMain :f="f" :note="note" :warn="warn" @navigate="emit('navigate', $event)">
      <template v-if="$slots.brand" #brand><slot name="brand" /></template>
      <template v-if="$slots.note" #note><slot name="note" /></template>
    </FooterMain>
  </GStack>
</template>
