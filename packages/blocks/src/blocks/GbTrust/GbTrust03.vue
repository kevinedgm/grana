<script setup>
// GbTrust03 · Lista al pie (dueño: bruno). Contrato: design/contracts/blocks/trust.md · Común: _comun.md §27 · Sin CSS.
// Una lista compacta para el pie del carrito o del pago: GSection › GStack as="ul" gap="sm" › li › GText size="body-sm"
// (el GIcon en línea, 1em, decorativo + el título en `strong` + la descripción) + la prueba en GBtn variant="link". Aquí la
// promesa NO es un encabezado (cuatro h3 en un pie ensucian la navegación por encabezados).
import { GIcon, GSection, GStack, GText } from '@grana/vue'
import { useWarn } from '../common/warn.js'
import TrustProof from './TrustProof.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useTrust } from './useTrust.js'

defineOptions({ name: 'GbTrust03' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbTrust03')
const { rows } = useTrust(props, warn)
</script>

<template>
  <GSection v-if="rows.length" :title="title" :description="description" data-gb="trust-03">
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <GStack as="ul" gap="sm">
      <li v-for="r in rows" :key="r.key">
        <slot name="item" :item="r.item">
          <GText size="body-sm"><GIcon v-if="r.icon" :name="r.icon" />{{ r.icon ? ' ' : '' }}<strong>{{ r.item.title }}</strong>{{ r.item.description ? ` ${r.item.description}` : '' }}</GText>
        </slot>
        <TrustProof :row="r" :external="labels.external" :warn="warn" @navigate="emit('navigate', $event)" @activate="emit('activate', $event)" />
      </li>
    </GStack>
  </GSection>
</template>
