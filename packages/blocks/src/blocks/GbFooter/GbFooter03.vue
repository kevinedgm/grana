<script setup>
// GbFooter03 · Con suscripción (dueño: bruno). Contrato: design/contracts/blocks/footer.md · Común: _comun.md · Sin CSS.
// GStack :as gap="lg" › slot `subscribe` (p. ej. GbNewsletter01) + GDivider + lo de 01. Sin slot `subscribe`, se pinta
// como 01 con el aviso O2.
import { useSlots } from 'vue'
import { GDivider, GStack } from '@grana/vue'
import { useWarn } from '../common/warn.js'
import FooterMain from './FooterMain.vue'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useFooter } from './useFooter.js'

defineOptions({ name: 'GbFooter03' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbFooter03')
const f = useFooter(props, warn, { groups: true, address: true })
const slots = useSlots()
try { if (process.env.NODE_ENV !== 'production' && !slots.subscribe) warn('O2', 'sin slot subscribe: se pinta como GbFooter01 (O2).') } catch {}
</script>

<template>
  <GStack :as="as" gap="lg" data-gb="footer-03">
    <template v-if="$slots.subscribe">
      <slot name="subscribe" />
      <GDivider decorative />
    </template>
    <FooterMain :f="f" :note="note" :warn="warn" @navigate="emit('navigate', $event)">
      <template v-if="$slots.brand" #brand><slot name="brand" /></template>
      <template v-if="$slots.note" #note><slot name="note" /></template>
    </FooterMain>
  </GStack>
</template>
