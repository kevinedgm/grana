<script setup>
import { ref } from 'vue'

const level = ref('raised')
const tone = ref('surface')
const levels = [
  { value: 'flat', label: 'flat' },
  { value: 'outlined', label: 'outlined' },
  { value: 'raised', label: 'raised' },
  { value: 'floating', label: 'floating' }
]
const tones = [
  { value: 'surface', label: 'Claro' },
  { value: 'sunken', label: 'Hundido' }
]
</script>

<template>
  <div class="demo">
    <g-radio-group v-model="level" name="surface-level" appearance="segmented" label="Nivel" :options="levels"></g-radio-group>
    <g-radio-group v-model="tone" name="surface-tone" appearance="inline" label="Tono" :options="tones"></g-radio-group>

    <g-surface :level="level" :tone="tone" padding="lg" as="article" aria-label="Plan Pro">
      <h3 class="title">Plan Pro</h3>
      <p>Facturación mensual con soporte prioritario y copias diarias.</p>
      <g-surface level="inset" padding="sm">3 asientos · $36 al mes</g-surface>
    </g-surface>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-4); }
.title { margin: 0 0 var(--g-space-2); }
p { margin: 0 0 var(--g-space-3); }
</style>
