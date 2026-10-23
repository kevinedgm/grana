<script setup>
// GbMenu03 · Platos con foto (dueño: bruno). Contrato: design/contracts/blocks/menu.md · Común: _comun.md §15 · Sin CSS
// (#763). Cada plato en una tarjeta con su foto: GSection › GPriceScope › GStack gap="lg" › GSection anidada por tiempo ›
// GAdaptiveLayout role="list" › div role="listitem" g-adapt-standard › GCard as="div" (title = name con su `lang` por el
// slot `title`, description, media = la foto; cuerpo: GPrice + los GTag; lo agotado en texto). Un plato sin `media` se
// pinta sin foto. El título de la tarjeta va un nivel por debajo del de su tiempo.
import { computed } from 'vue'
import { GAdaptiveLayout, GCard, GSection, GStack, GText, useSectionLevel } from '@grana/vue'
import { GPrice } from '@grana/vue/price'
import { GTag } from '@grana/vue/tag'
import GbPriceRegion from '../common/priceRegion.js'
import { imgAttrs } from '../common/media.js'
import { useWarn } from '../common/warn.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useMenu } from './useMenu.js'

defineOptions({ name: 'GbMenu03' })
const props = defineProps(sectionProps)
defineEmits(sectionEmits)
const warn = useWarn('GbMenu03')
const { level } = useSectionLevel()
// La sección del tiempo va un nivel por debajo de la del bloque (GSection llega como mucho a h4) y la tarjeta, uno más
const card = computed(() => Math.min(Math.min(Math.min(level.value, 4) + 1, 4) + 1, 6))
const { sections, region, hours } = useMenu(props, warn, '03')
</script>

<template>
  <GSection v-if="sections.length" :title="title" :description="description" data-gb="menu-03">
    <GbPriceRegion :region="region" :labels="labels" :locale="locale">
      <GStack gap="lg">
        <GSection v-for="s in sections" :id="s.id || undefined" :key="s.key" :title="s.section.name" :description="s.section.description">
          <GText v-if="hours(s.section)" size="body-sm" tone="muted">{{ hours(s.section) }}</GText>
          <GAdaptiveLayout role="list">
            <div v-for="d in s.items" :key="d.key" role="listitem" class="g-adapt-standard">
              <GCard as="div" :title="d.item.name" :description="d.item.description" :heading-level="card">
                <template v-if="d.lang" #title><span :lang="d.lang">{{ d.item.name }}</span></template>
                <template v-if="d.media" #media><img v-bind="imgAttrs(d.media)"></template>
                <slot name="item" :item="d.item" :section="s.section">
                  <GStack gap="sm">
                    <GPrice v-if="d.price" v-bind="d.price" size="sm" />
                    <GStack v-if="d.tags.length" as="ul" orientation="horizontal" gap="sm" :aria-label="labels.tags || undefined">
                      <li v-for="(t, i) in d.tags" :key="i"><GTag :label="t" size="sm" /></li>
                    </GStack>
                    <GText v-if="!d.available.ok && d.available.reason" size="body-sm">{{ d.available.reason }}</GText>
                  </GStack>
                </slot>
              </GCard>
            </div>
          </GAdaptiveLayout>
        </GSection>
      </GStack>
    </GbPriceRegion>
  </GSection>
</template>
