<script setup>
// El cuerpo del pie de 01 (y de 03 bajo la suscripción) (dueño: bruno; footer.md «Anatomía común», «Variantes»). Interno:
// no se exporta. Sin CSS. GAdaptiveLayout gap="lg" › [marca y contacto, PRIMERO (g-adapt-wide)] + [un solo nav con nombre ›
// GAdaptiveLayout de grupos (g-adapt-standard) › GSection por grupo (nivel automático) › GStack as="ul" gap="sm" › GBtn
// link] + GDivider decorativo + fila final GStack horizontal gap="md" (nota, legales, redes).
import { GAdaptiveLayout, GDivider, GSection, GStack } from '@grana/vue'
import GbLink from '../common/link.js'
import FooterBrand from './FooterBrand.vue'
import FooterContact from './FooterContact.vue'
import FooterLegal from './FooterLegal.vue'

defineOptions({ name: 'GbFooterMain' })
defineProps({
  f: { type: Object, required: true },
  note: { type: String, default: undefined },
  warn: { type: Function, required: true }
})
const emit = defineEmits(['navigate'])
const fwd = (e) => emit('navigate', e)
</script>

<template>
  <GAdaptiveLayout gap="lg">
    <div class="g-adapt-wide">
      <slot name="brand"><FooterBrand :data="f.brand.value" :warn="warn" @navigate="fwd" /></slot>
      <FooterContact :data="f.contact.value" :external="f.external.value" :warn="warn" @navigate="fwd" />
    </div>
    <nav v-if="f.groups.value.length" :aria-label="f.navLabel.value">
      <GAdaptiveLayout gap="lg">
        <div v-for="g in f.groups.value" :key="g.key" class="g-adapt-standard">
          <GSection :title="g.item.title">
            <GStack as="ul" gap="sm">
              <li v-for="l in g.links" :key="l.key">
                <GbLink :link="l.item" :external="f.external.value" :what="`groups[${g.index}].links[${l.index}]`" :warn="warn" @navigate="fwd" />
              </li>
            </GStack>
          </GSection>
        </div>
      </GAdaptiveLayout>
    </nav>
  </GAdaptiveLayout>
  <GDivider decorative />
  <GStack orientation="horizontal" gap="md">
    <p v-if="$slots.note || note"><slot name="note">{{ note }}</slot></p>
    <FooterLegal :f="f" :warn="warn" @navigate="fwd" />
  </GStack>
</template>
