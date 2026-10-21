<script setup>
import { ref } from 'vue'

const consulta = ref(null)
const enviada = ref('ninguna')
const filas = [
  { key: 'adults', label: 'Adultos', min: 1, default: 2, unit: (n) => `${n} ${n === 1 ? 'adulto' : 'adultos'}`, decrementLabel: 'Quitar un adulto', incrementLabel: 'Añadir un adulto' },
  { key: 'rooms', label: 'Habitaciones', min: 1, default: 1, unit: (n) => `${n} ${n === 1 ? 'habitación' : 'habitaciones'}`, decrementLabel: 'Quitar una habitación', incrementLabel: 'Añadir una habitación' }
]
const labels = {
  phrase: 'Llego el {from}, me quedo {nights} y somos {party}.',
  fields: { from: 'Llegada', to: 'Salida', nights: 'Noches', party: 'Huéspedes' },
  empty: { from: '¿qué día?', nights: '¿cuántas noches?' },
  nights: (n) => `${n} ${n === 1 ? 'noche' : 'noches'}`,
  checkout: 'Salida el {date}',
  noDates: 'Sin fechas', separator: ' · ',
  submit: 'Ver disponibilidad', pending: 'Consultando…', done: 'Listo',
  decrement: 'Quitar una noche', increment: 'Añadir una noche',
  errors: { dates: 'Elige las fechas.', night: 'No quedan habitaciones la noche del {date}.', nights: 'Elige un número de noches válido.' },
  missing: 'Falta {list}.',
  datePicker: { prev: 'Mes anterior', next: 'Mes siguiente', dialog: 'Elige un día', close: 'Cerrar', checkoutOnly: ', solo salida' }
}
function alEnviar(q) {
  enviada.value = JSON.stringify(q)
}
</script>

<template>
  <div class="demo">
    <g-booking-bar
      kind="stay" title="Consulta disponibilidad" v-model="consulta"
      :party-rows="filas" :min-nights="1"
      :names="{ from: 'checkin', to: 'checkout', party: 'guests' }"
      :labels="labels" @submit="alEnviar"
    />
    <p>Intención recibida: <code>{{ enviada }}</code></p>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-3); }
</style>
