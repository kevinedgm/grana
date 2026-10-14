<script setup>
import { ref, computed } from 'vue'
import { summaryDiff } from '@grana/vue'

// Ancho del contenedor en unidades de space: la ficha decide qué cabe, sin umbrales.
const anchos = [{ id: 60, label: 'Estrecho' }, { id: 90, label: 'Medio' }, { id: 140, label: 'Ancho' }]
const ancho = ref(90)

const pacientes = [
  { id: 'p1', title: 'María García López', status: { label: 'Activo', color: 'success' }, facts: [
    { label: 'Expediente', short: 'Exp.', value: '001000', priority: 1 },
    { label: 'Edad', value: '22 años', bare: true },
    { label: 'Última visita', value: '03/02/2026' },
    { label: 'Médico', value: 'Dra. Ruiz', bare: true }
  ] },
  { id: 'p2', title: 'María García López', status: { label: 'Alta', color: 'neutral' }, facts: [
    { label: 'Expediente', short: 'Exp.', value: '004517', priority: 1 },
    { label: 'Edad', value: '58 años', bare: true },
    { label: 'Última visita', value: '03/02/2026' },
    { label: 'Médico', value: 'Dra. Ruiz', bare: true }
  ] }
]
// Homónimos: lo que distingue pesa y lo que comparten se apaga.
const diffs = computed(() => summaryDiff(pacientes))
</script>

<template>
  <div class="demo">
    <div class="botones" role="group" aria-label="Ancho del contenedor">
      <g-btn v-for="a in anchos" :key="a.id" size="sm" :variant="ancho === a.id ? 'solid' : 'outline'"
             :aria-pressed="ancho === a.id" @click="ancho = a.id">{{ a.label }}</g-btn>
    </div>
    <ul class="lista" :style="{ inlineSize: `calc(var(--g-space-1) * ${ancho})` }">
      <li v-for="(p, i) in pacientes" :key="p.id">
        <g-summary :title="p.title" avatar :status="p.status" :facts="p.facts" :diff="diffs[i]"></g-summary>
      </li>
    </ul>
    <g-summary layout="stack" group title="Diabetes mellitus tipo 2" code="E11.9" subtitle="Sin complicaciones" icon="file-text"
               :facts="[{ label: 'Desde', value: 'marzo 2021' }, { label: 'Control', value: 'Trimestral' }, { label: 'HbA1c', value: '6.8 %' }]">
      <template #action><g-btn size="sm" variant="outline">Abrir diagnóstico</g-btn></template>
    </g-summary>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-4); }
.botones { display: flex; flex-wrap: wrap; gap: var(--g-space-2); }
.lista { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--g-space-3); max-inline-size: 100%; transition: inline-size var(--g-duration-slow) var(--g-ease-out); }
</style>
