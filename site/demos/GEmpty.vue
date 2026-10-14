<script setup>
import { computed, nextTick, reactive, ref } from 'vue'

const muestras = [
  { id: 'M-101', nombre: 'Hemograma', urgente: true, cerrada: false, mia: true },
  { id: 'M-102', nombre: 'Glucosa', urgente: true, cerrada: false, mia: false },
  { id: 'M-103', nombre: 'Perfil lipídico', urgente: false, cerrada: true, mia: true },
  { id: 'M-104', nombre: 'Urocultivo', urgente: false, cerrada: true, mia: false },
  { id: 'M-105', nombre: 'TSH', urgente: true, cerrada: false, mia: false },
  { id: 'M-106', nombre: 'Ferritina', urgente: false, cerrada: true, mia: true }
]
const FILTROS = {
  urgentes: { label: 'Urgentes', test: (m) => m.urgente },
  cerradas: { label: 'Cerradas', test: (m) => m.cerrada },
  mias: { label: 'Asignadas a mí', test: (m) => m.mia }
}
const activos = reactive({ urgentes: true, cerradas: true, mias: true })
const aplicados = computed(() => Object.keys(FILTROS).filter((k) => activos[k]))
const pasa = (m, claves) => claves.every((k) => FILTROS[k].test(m))
const visibles = computed(() => muestras.filter((m) => pasa(m, aplicados.value)))
const salida = computed(() => aplicados.value.map((key) => ({
  key,
  label: FILTROS[key].label,
  count: muestras.filter((m) => pasa(m, aplicados.value.filter((k) => k !== key))).length
})))
const textos = {
  relax: 'Quitar «{label}»',
  returns: ({ count }) => (count === 1 ? '1 vuelve' : `${count} vuelven`),
  clear: 'Quitar todos',
  before: 'Antes había {total}; con {filters}, ninguna.'
}
const titulo = ref(null)
const enfocar = () => nextTick(() => titulo.value?.focus())
function quitar(key) { activos[key] = false; enfocar() }
function limpiar() { Object.keys(activos).forEach((k) => (activos[k] = false)); enfocar() }
</script>

<template>
  <div class="demo">
    <div class="filtros">
      <g-switch v-for="(f, key) in FILTROS" :key="key" v-model="activos[key]" :label="f.label" size="sm"></g-switch>
    </div>
    <h3 ref="titulo" tabindex="-1" class="titulo">Muestras ({{ visibles.length }})</h3>
    <ul v-if="visibles.length" class="lista">
      <li v-for="m in visibles" :key="m.id"><strong>{{ m.id }}</strong> · {{ m.nombre }}</li>
    </ul>
    <g-empty
      v-else cause="filtered" title="Ninguna muestra con estos filtros" locale="es-MX"
      :filters="salida" :total="muestras.length" :labels="textos"
      @relax="quitar" @clear="limpiar"
    ></g-empty>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-3); }
.filtros { display: flex; flex-wrap: wrap; gap: var(--g-space-2) var(--g-space-4); }
.titulo { margin: 0; }
.lista { margin: 0; padding-inline-start: var(--g-space-5); }
</style>
