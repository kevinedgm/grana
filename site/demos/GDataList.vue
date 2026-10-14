<script setup>
import { ref, computed } from 'vue'

const vista = ref('semana')
const filas = {
  semana: [
    { label: 'Directo', value: '48%' },
    { label: 'Búsqueda', value: '31%' },
    { label: 'Referidos', value: '14%' },
    { label: 'Correo', value: '7%' }
  ],
  mes: [
    { label: 'Directo', value: '41%' },
    { label: 'Búsqueda', value: '36%' },
    { label: 'Referidos', value: '15%' },
    { label: 'Correo', value: '8%' }
  ]
}
const actual = computed(() => filas[vista.value])
</script>

<template>
  <div class="demo">
    <g-btn variant="outline" size="sm" @click="vista = vista === 'semana' ? 'mes' : 'semana'">
      Ver {{ vista === 'semana' ? 'último mes' : 'última semana' }}
    </g-btn>
    <g-data-list swatches :label="'Visitas por canal, ' + (vista === 'semana' ? 'última semana' : 'último mes')" :rows="actual"></g-data-list>
    <g-data-list label="Detalles del pedido" :rows="[
      { label: 'Pedido', value: '#10482' },
      { label: 'Fecha', value: '12 oct 2026' },
      { label: 'Envío', value: 'Paquetería estándar' }
    ]"></g-data-list>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-5); max-inline-size: calc(var(--g-space-1) * 80); justify-items: stretch; }
.demo > :first-child { justify-self: start; }
</style>
