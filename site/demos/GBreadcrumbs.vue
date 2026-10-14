<script setup>
import { ref } from 'vue'

const lotes = ['0411', '0412', '0413'].map((n) => ({ label: 'Lote 2026-' + n, href: '#lote-' + n }))
const ruta = ref([
  { label: 'Inicio', href: '#inicio', icon: 'house' },
  { label: 'Laboratorio central', href: '#laboratorio' },
  { label: 'Muestras', href: '#muestras' },
  { label: '2026', children: lotes },            // sin página: texto; sus hijos encienden una puerta
  { label: 'Lote 2026-0412', href: '#lote-0412' },
  { label: 'Muestra M-0007' }
])
const textos = { nav: 'Ruta de navegación', up: 'Subir a {label}', path: 'Ruta hasta {label}', children: 'Otras páginas en {label}' }
const anchos = [{ id: 'ancho', label: 'Ancho' }, { id: 'medio', label: 'Medio' }, { id: 'estrecho', label: 'Estrecho' }]
const ancho = ref('ancho')

// La documentación no navega: cancelamos el href y cambiamos la ruta como lo haría un router.
function navegar({ item, index, event, from }) {
  event.preventDefault()
  ruta.value = from === 'door'
    ? [...ruta.value.slice(0, index), { label: item.label, href: item.href }]
    : ruta.value.slice(0, index + 1)
}
const ultimo = () => ruta.value[ruta.value.length - 1].label
const bajar = () => { ruta.value = [...ruta.value, { label: 'Muestra M-' + String(ruta.value.length * 7).padStart(4, '0') }] }
</script>

<template>
  <div class="demo">
    <div class="botones" role="group" aria-label="Ancho del contenedor">
      <g-btn v-for="a in anchos" :key="a.id" size="sm" :variant="ancho === a.id ? 'solid' : 'outline'"
             :aria-pressed="ancho === a.id" @click="ancho = a.id">{{ a.label }}</g-btn>
    </div>
    <div class="caja" :data-ancho="ancho">
      <g-breadcrumbs :items="ruta" :labels="textos" @navigate="navegar"></g-breadcrumbs>
    </div>
    <p>Página actual: <strong>{{ ultimo() }}</strong></p>
    <g-btn size="sm" variant="outline" :disabled="ruta.length > 7" @click="bajar">Abrir una muestra dentro</g-btn>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-3); justify-items: start; }
.demo p { margin: 0; }
.botones { display: flex; flex-wrap: wrap; gap: var(--g-space-2); }
.caja { inline-size: 100%; max-inline-size: 100%; }
.caja[data-ancho='medio'] { inline-size: calc(var(--g-space-1) * 100); }
.caja[data-ancho='estrecho'] { inline-size: calc(var(--g-space-1) * 62); }
</style>
