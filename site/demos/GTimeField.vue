<script setup>
import { ref } from 'vue'
import { GTimeField } from '@grana/vue/time-field'

const toma = ref('21:30')
const llegada = ref(null)
const labels = { invalid: 'Escribe una hora, por ejemplo 9:30' }
</script>

<template>
  <div class="demo">
    <GTimeField v-model="toma" label="Hora de la toma" locale="es-MX" block :step="15" :labels="labels"
                hint="Escribe como lo dirías: 930, 9h30, 9 noche o mediodía." />
    <GTimeField v-model="llegada" label="Llegada del turno de noche" locale="es" block min="22:00" max="06:00" :step="30"
                :labels="labels" hint="Con ↑ recorre de 22:00 a 06:00 pasando por la medianoche." />
    <p>Toma: <strong>{{ toma ?? '—' }}</strong> · Llegada: <strong>{{ llegada ?? '—' }}</strong></p>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-4); justify-items: start; }
</style>
