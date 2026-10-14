<script setup>
import { ref } from 'vue'

const modalidad = ref('presencial')
const primera = ref(true)
const frecuencia = ref('semanal')

const modalidades = [
  { value: 'presencial', label: 'Presencial', description: 'En el consultorio de Reforma 120.', icon: 'map-pin' },
  { value: 'linea', label: 'En línea', description: 'Videollamada; el enlace llega por correo.', icon: 'globe' },
  { value: 'tel', label: 'Por teléfono', description: 'No disponible este mes.', icon: 'phone', disabled: true }
]
const sino = [{ value: true, label: 'Sí' }, { value: false, label: 'No' }]
const frecuencias = [
  { value: 'diaria', label: 'Diaria' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'mensual', label: 'Mensual' },
  { value: 'nunca', label: 'Nunca' }
]
</script>

<template>
  <div class="demo">
    <g-radio-group v-model="modalidad" name="modalidad" label="Modalidad de consulta"
                   hint="Puedes cambiarla hasta un día antes." :options="modalidades" />
    <g-radio-group v-model="primera" name="primera" appearance="segmented" label="¿Primera consulta?" :options="sino" />
    <g-radio-group v-model="frecuencia" name="frecuencia" appearance="chip" color="accent"
                   label="Frecuencia de recordatorios" :options="frecuencias" />
    <p>Modalidad: <strong>{{ modalidad }}</strong> · Primera: <strong>{{ primera ? 'sí' : 'no' }}</strong> · Recordatorios: <strong>{{ frecuencia }}</strong></p>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-4); }
</style>
