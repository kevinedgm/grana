<script setup>
import { ref } from 'vue'

const cita = ref('2026-10-20')
const estancia = ref({ start: '2026-10-26', end: '2026-10-29' })

// Todo texto que no es una fecha lo pones tú: Grana no trae textos en ningún idioma.
const labels = {
  prev: 'Mes anterior', next: 'Mes siguiente', dialog: 'Elegir fechas', close: 'Cerrar',
  today: 'hoy', selected: 'seleccionada', rangeStart: 'inicio del rango', rangeEnd: 'fin del rango',
  rangeSingle: 'inicio y fin del rango', inRange: 'dentro del rango', unavailable: 'no disponible',
  clear: 'Limpiar', done: 'Listo', proximityGroup: 'Ampliar el rango'
}
const proximidad = [
  { days: 1, label: '± 1 día', ariaLabel: 'Ampliar el rango 1 día por cada lado, ± 1 día' },
  { days: 3, label: '± 3 días', ariaLabel: 'Ampliar el rango 3 días por cada lado, ± 3 días' }
]
// Los domingos la clínica no atiende.
const sinDomingo = (iso) => new Date(`${iso}T12:00:00`).getDay() === 0
</script>

<template>
  <div class="demo">
    <g-date-picker v-model="cita" locale="es-MX" label="Fecha de la cita" placeholder="Elige un día" min="2026-10-01" max="2026-12-31"
                   :disabled-dates="sinDomingo" :labels="labels" hint="Los domingos no hay consulta." />
    <g-date-picker v-model="estancia" locale="es-MX" mode="range" split label-start="Ingreso" label-end="Alta"
                   placeholder-start="Desde" placeholder-end="Hasta" :labels="labels" :proximity="proximidad" />
    <p>Cita: <strong>{{ cita ?? '—' }}</strong> · Estancia: <strong>{{ estancia ? `${estancia.start} a ${estancia.end}` : '—' }}</strong></p>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-4); justify-items: start; }
</style>
