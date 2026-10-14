<script setup>
import { ref } from 'vue'

const estado = ref('idle')
const ultimo = ref('—')
const estados = [
  { id: 'idle', label: 'Reposo' },
  { id: 'thinking', label: 'Pensando' },
  { id: 'success', label: 'Éxito' },
  { id: 'error', label: 'Error' }
]
</script>

<template>
  <div class="demo">
    <g-avatar-motion v-model:state="estado" size="xl" label="Asistente de citas" @done="(s) => (ultimo = s)"></g-avatar-motion>
    <div class="botones" role="group" aria-label="Estado del asistente">
      <g-btn v-for="e in estados" :key="e.id" size="sm" :variant="estado === e.id ? 'solid' : 'outline'"
             :aria-pressed="estado === e.id" @click="estado = e.id">{{ e.label }}</g-btn>
    </div>
    <p>Estado: <code>{{ estado }}</code> · Última animación terminada: {{ ultimo }}</p>
    <div class="fila">
      <g-avatar-motion size="lg" color="accent"></g-avatar-motion>
      <g-avatar-motion size="md" color="success"></g-avatar-motion>
      <g-avatar-motion size="sm" color="info"></g-avatar-motion>
    </div>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-4); justify-items: start; }
.botones, .fila { display: flex; flex-wrap: wrap; align-items: center; gap: var(--g-space-2); }
.demo p { margin: 0; }
</style>
