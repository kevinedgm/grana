<script setup>
// GbFooter02 · Una línea (dueño: bruno). Contrato: design/contracts/blocks/footer.md · Común: _comun.md · Sin CSS (#763).
// GStack :as orientation="horizontal" gap="md" (una fila que se parte) › marca, canales (en su `address`: el contacto se
// queda, #826), legales, redes y nota. Ignora `groups`, `contact.address` y `contact.hours`.
import { GStack, GText } from '@grana/vue'
import { useWarn } from '../common/warn.js'
import FooterBrand from './FooterBrand.vue'
import FooterContact from './FooterContact.vue'
import FooterLegal from './FooterLegal.vue'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useFooter } from './useFooter.js'

defineOptions({ name: 'GbFooter02' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbFooter02')
const f = useFooter(props, warn)
const fwd = (e) => emit('navigate', e)
</script>

<template>
  <GStack :as="as" orientation="horizontal" gap="md" data-gb="footer-02">
    <slot name="brand"><FooterBrand :data="f.brand.value" :warn="warn" @navigate="fwd" /></slot>
    <FooterContact :data="f.contact.value" :external="f.external.value" inline :warn="warn" @navigate="fwd" />
    <FooterLegal :f="f" :warn="warn" @navigate="fwd" />
    <GText v-if="$slots.note || note" size="caption" tone="muted"><slot name="note">{{ note }}</slot></GText>
  </GStack>
</template>
