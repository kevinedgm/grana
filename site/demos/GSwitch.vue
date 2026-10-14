<script setup>
import { ref } from 'vue'

const auto = ref(true)
const guardando = ref(false)
const avisos = ref(false)
const bloqueo = ref(false)

// Simula un guardado asíncrono: el interruptor no se bloquea, tú decides si revertir.
function guardar() {
  guardando.value = true
  setTimeout(() => { guardando.value = false }, 900)
}
</script>

<template>
  <div class="demo">
    <g-switch v-model="auto" :loading="guardando" label="Guardado automático"
              hint="El cambio se aplica al instante." @change="guardar" />
    <g-switch v-model="avisos" label="Avisos por correo" label-position="start" color="success" />
    <g-switch v-model="bloqueo" label="Bloquear expediente" size="lg" color="danger">
      <template #icon-on><g-icon name="lock" /></template>
      <template #icon-off><g-icon name="lock-open" /></template>
    </g-switch>
    <p>Guardado: <strong>{{ auto ? 'sí' : 'no' }}</strong> · Avisos: <strong>{{ avisos ? 'sí' : 'no' }}</strong> · Bloqueado: <strong>{{ bloqueo ? 'sí' : 'no' }}</strong></p>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-4); justify-items: start; }
</style>
