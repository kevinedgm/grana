<script setup>
import { ref } from 'vue'

const nombre = ref('Ana María López')
const forma = ref('circle')
</script>

<template>
  <div class="demo">
    <g-input v-model="nombre" label="Nombre" hint="Las iniciales salen de la primera y la última palabra."></g-input>
    <div class="fila">
      <g-avatar :name="nombre" size="xs"></g-avatar>
      <g-avatar :name="nombre" size="sm"></g-avatar>
      <g-avatar :name="nombre"></g-avatar>
      <g-avatar :name="nombre" size="lg"></g-avatar>
      <g-avatar :name="nombre" size="xl" :label="nombre || 'Sin nombre'"></g-avatar>
    </div>

    <div class="fila">
      <!-- Persona o entidad: cambiar shape anima el radio -->
      <g-avatar :shape="forma" icon="building-complex" size="xl" label="Clínica Reforma"></g-avatar>
      <g-btn variant="outline" size="sm" @click="forma = forma === 'circle' ? 'square' : 'circle'">
        Mostrar como {{ forma === 'circle' ? 'entidad' : 'persona' }}
      </g-btn>
    </div>

    <ul class="personas">
      <li>
        <g-badge shape="circle" color="success" label="En línea" placement="bottom-end">
          <template #anchor><g-avatar name="Luis Torres" size="lg"></g-avatar></template>
        </g-badge>
        Luis Torres
      </li>
      <li>
        <g-badge shape="diamond" color="warning" label="Ausente" placement="bottom-end">
          <template #anchor><g-avatar initials="ab" size="lg"></g-avatar></template>
        </g-badge>
        ab (iniciales explícitas)
      </li>
      <li><g-avatar size="lg"></g-avatar> Sin datos: icono de respaldo</li>
    </ul>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-5); }
.fila { display: flex; flex-wrap: wrap; align-items: center; gap: var(--g-space-4); }
.personas { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--g-space-3); }
.personas li { display: flex; align-items: center; gap: var(--g-space-3); }
</style>
