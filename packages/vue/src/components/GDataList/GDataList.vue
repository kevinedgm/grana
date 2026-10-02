<script setup>
// GDataList · lista compacta etiqueta–valor, también leyenda (primitiva de GWidget; dueño: bruno)
// Contrato: design/contracts/widget.md · Estilo: GDataList.css (coco). Las muestras son tono + forma (0 a 3).
import { computed } from 'vue'
import GIcon from '../GIcon/GLibIcon.js'

defineOptions({ name: 'GDataList', inheritAttrs: false })

const props = defineProps({
  rows: { type: Array, default: () => [] },
  label: { type: String, default: undefined },
  swatches: Boolean
})

const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const valid = (r) => r && typeof r === 'object' && r.label !== undefined
const items = computed(() => {
  const out = []
  props.rows.forEach((r, i) => {
    if (!valid(r)) {
      if (isDev) console.warn('[Grana] <GDataList> ignora una fila sin label.')
      return
    }
    const s = Number.isInteger(r.swatch) && r.swatch >= 0 && r.swatch <= 3 ? r.swatch : i % 4
    out.push({ ...r, swatch: s, key: `${i}-${r.label}` })
  })
  return out
})
const SWATCHES = ['circle', 'square', 'diamond', 'triangle']
</script>

<template>
  <ul class="g-data-list" :aria-label="label">
    <li v-for="r in items" :key="r.key">
      <GIcon v-if="swatches" class="g-data-list__swatch" :data-swatch="r.swatch" :name="SWATCHES[r.swatch] ?? SWATCHES[0]" filled />
      <span class="g-data-list__label">{{ r.label }}</span>
      <span v-if="r.value !== undefined" class="g-data-list__value">{{ r.value }}</span>
    </li>
  </ul>
</template>
