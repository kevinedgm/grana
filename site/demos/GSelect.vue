<script setup>
import { ref } from 'vue'

const area = ref('cardio')
const sede = ref(null)
const areas = ref([
  { value: 'cardio', label: 'Cardiología', icon: 'activity' },
  { value: 'pedia', label: 'Pediatría', icon: 'stethoscope' },
  { value: 'farma', label: 'Farmacia', icon: 'pill' },
  { value: 'urgencias', label: 'Urgencias', icon: 'hospital', disabled: true }
])
const sedes = ref([
  { label: 'Centro', options: [{ value: 'ro', label: 'Roma Norte' }, { value: 'co', label: 'Coyoacán' }] },
  { label: 'Norte', options: [{ value: 'po', label: 'Polanco' }, { value: 'sa', label: 'Satélite' }] }
])
let n = 0
function agregarSede() {
  n++
  const value = `nueva-${n}`
  sedes.value.push({ value, label: `Sede nueva ${n}` })
  sede.value = value
}
</script>

<template>
  <div class="demo">
    <g-select v-model="area" :options="areas" label="Área" placeholder="Elige un área" hint="Escribe para saltar a una opción.">
      <template #icon="{ option }"><g-icon :name="option.icon" /></template>
    </g-select>
    <g-select v-model="sede" :options="sedes" label="Sede" placeholder="Elige una sede" clearable clear-label="Quitar sede"
              empty-text="Sin sedes" create-label="Agregar nueva sede…" @create="agregarSede" />
    <p>Área: <strong>{{ area ?? '—' }}</strong> · Sede: <strong>{{ sede ?? '—' }}</strong></p>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-4); justify-items: start; }
</style>
