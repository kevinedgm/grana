<script setup>
// GbFeatures03 · Lectura (dueño: bruno). Contrato: design/contracts/blocks/features.md · Común: _comun.md · Sin CSS (#763).
// GSection › GContainer width="reading" › GStack as="ul" divided › li › GSection anidada (título = ventaja, que pone su
// nivel sola). Icono decorativo en el slot `title`, antes del texto; `action` como GBtn variant="link" en el cuerpo, con el
// texto de la acción (dice adónde va, #819); `navigate`/`activate` llevan la ventaja (Feature) como `item`, igual que 01 y 02. Ignora `media`.
import { GContainer, GIcon, GSection, GStack } from '@grana/vue'
import GbActions from '../common/GbActions.js'
import { useItems } from '../common/list.js'
import { has } from '../common/text.js'
import { useWarn } from '../common/warn.js'
import { MAX_ITEMS, emits as sectionEmits, props as sectionProps } from './props.js'

defineOptions({ name: 'GbFeatures03' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbFeatures03')

const list = useItems(() => props.items, { required: ['title'], range: [1, MAX_ITEMS], warn })
const one = (action) => (action && typeof action === 'object' ? [action] : [])
</script>

<template>
  <GSection v-if="list.length" :title="title" :description="description" data-gb="features-03">
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <GContainer width="reading">
      <GStack as="ul" divided>
        <li v-for="e in list" :key="e.key">
          <GSection :title="e.item.title" :description="e.item.description">
            <template v-if="has(e.item.icon)" #title><GIcon :name="e.item.icon" /> {{ e.item.title }}</template>
            <slot name="item" :item="e.item" :index="e.index" />
            <GbActions v-if="e.item.action" :actions="one(e.item.action)" :variants="['link']" :external="labels.external" :warn="warn" @navigate="emit('navigate', { ...$event, item: e.item })" @activate="emit('activate', { ...$event, item: e.item })" />
          </GSection>
        </li>
      </GStack>
    </GContainer>
  </GSection>
</template>
