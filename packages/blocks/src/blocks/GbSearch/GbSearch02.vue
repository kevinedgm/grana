<script setup>
// GbSearch02 · La barra (dueño: bruno). Contrato: design/contracts/blocks/search.md · Común: _comun.md §15 · Sin CSS (#763).
// Cajas en una fila; si no cabe, resumen + acción con la hoja: GBookingBar appearance="bar" (sin quickDays: solo la frase lo usa).
// GStack gap="sm" [data-gb] (raíz) › GBookingBar + GText body-sm muted con la nota (después del formulario; sin nota, nada).
// Sin GSection: GBookingBar ya es una región con encabezado y nombre (role="search" + aria-labelledby).
import { GStack, GText } from '@grana/vue'
import { GBookingBar } from '@grana/vue/booking'
import { has } from '../common/text.js'
import { useWarn } from '../common/warn.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useSearch } from './useSearch.js'

defineOptions({ name: 'GbSearch02', inheritAttrs: false })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbSearch02')
const { bar, root, onModel, onSubmit } = useSearch(props, emit, warn, { appearance: 'bar', quick: false })
</script>

<template>
  <GStack gap="sm" v-bind="root" data-gb="search-02">
    <GBookingBar v-bind="bar" @update:model-value="onModel" @submit="onSubmit" />
    <GText v-if="$slots.note || has(note)" size="body-sm" tone="muted"><slot name="note">{{ note }}</slot></GText>
  </GStack>
</template>
