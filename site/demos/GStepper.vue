<script setup>
import { ref, computed } from 'vue'

const pasos = [
  { id: 'plan', label: 'Plan', description: 'Elige tu plan' },
  { id: 'cuenta', label: 'Cuenta', description: 'Datos de acceso' },
  { id: 'facturacion', label: 'Facturación', description: 'RFC y domicilio', optional: true },
  { id: 'pago', label: 'Pago', description: 'Tarjeta o transferencia' },
  { id: 'fin', label: 'Confirmación' }
]
const textos = {
  complete: 'completado', current: 'paso actual', pending: 'pendiente',
  error: 'con error', warning: 'con advertencia', disabled: 'bloqueado', optional: 'opcional',
  progress: 'Paso {current} de {total}', showAll: 'Ver todos los pasos', hideAll: 'Ocultar pasos'
}
const actual = ref('cuenta')
const indice = computed(() => pasos.findIndex((p) => p.id === actual.value))
const mover = (d) => { actual.value = pasos[indice.value + d].id }
</script>

<template>
  <div class="demo">
    <!-- navigation="back": los pasos ya hechos son botones para volver -->
    <g-stepper v-model="actual" :steps="pasos" :labels="textos" navigation="back" aria-label="Alta de cuenta"></g-stepper>
    <p>Estás en «{{ pasos[indice].label }}».</p>
    <div class="acciones">
      <g-btn variant="outline" :disabled="indice === 0" @click="mover(-1)">Anterior</g-btn>
      <g-btn :disabled="indice === pasos.length - 1" @click="mover(1)">Siguiente</g-btn>
    </div>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-4); }
.demo p { margin: 0; }
.acciones { display: flex; gap: var(--g-space-2); }
</style>
