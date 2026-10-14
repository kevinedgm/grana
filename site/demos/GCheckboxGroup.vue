<script setup>
import { ref } from 'vue'

const servicios = ref(['laboratorio'])
const filtros = ref(['wifi'])
</script>

<template>
  <div class="demo">
    <g-checkbox-group v-model="servicios" label="Servicios de la visita" hint="Marca los que necesitas."
                      select-all select-all-label="Seleccionar todos"
                      :count-text="(n, total) => `${n} de ${total} seleccionados`">
      <g-checkbox value="laboratorio" label="Análisis de laboratorio" />
      <g-checkbox value="rayos" label="Rayos X" />
      <g-checkbox value="vacunas" label="Vacunas" />
      <g-checkbox value="farmacia" label="Entrega en farmacia" />
    </g-checkbox-group>

    <g-checkbox-group v-model="filtros" label="Filtrar sedes por servicio" layout="chip" color="accent">
      <g-checkbox value="wifi" label="Wifi" />
      <g-checkbox value="estacionamiento" label="Estacionamiento" />
      <g-checkbox value="pediatria" label="Pediatría" />
      <g-checkbox value="urgencias" label="Urgencias" />
    </g-checkbox-group>

    <p>Servicios: <strong>{{ servicios.join(', ') || '—' }}</strong> · Filtros: <strong>{{ filtros.join(', ') || '—' }}</strong></p>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-4); }
</style>
