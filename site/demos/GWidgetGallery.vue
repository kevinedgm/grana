<script setup>
import { computed, ref } from 'vue'

const abierta = ref(false)
let siguiente = 1
const layout = ref([{ id: 'w0', w: 2, h: 2, kind: 'revenue' }])
const items = [
  { id: 'revenue', title: 'Ingresos', category: 'Finanzas', description: 'Ingresos del periodo con tendencia y meta.', sizes: ['m', 'l'], unique: true, value: '$48.2k' },
  { id: 'debts', title: 'Cuentas por cobrar', category: 'Finanzas', description: 'Saldo pendiente de pacientes y aseguradoras.', sizes: ['s', 'm'], value: '$9.6k' },
  { id: 'agenda', title: 'Citas de hoy', category: 'Agenda', description: 'Citas confirmadas, pendientes y canceladas.', sizes: ['s', 'm', 'l'], value: '18' },
  { id: 'team', title: 'Tareas del equipo', category: 'Equipo', description: 'Tareas abiertas por persona.', sizes: ['m', 'l'], value: '12' }
]
const byId = Object.fromEntries(items.map((i) => [i.id, i]))
const tarjeta = (id) => byId[layout.value.find((e) => e.id === id).kind]
const sizes = [{ id: 's', label: 'Pequeño (1×1)' }, { id: 'm', label: 'Mediano (2×1)' }, { id: 'l', label: 'Grande (2×2)' }]
const dims = { s: [1, 1], m: [2, 1], l: [2, 2] }
const added = computed(() => layout.value.reduce((o, e) => ({ ...o, [e.kind]: (o[e.kind] || 0) + 1 }), {}))
function añadir({ id, size }) {
  const [w, h] = dims[size]
  layout.value = [...layout.value, { id: `w${siguiente++}`, w, h, kind: id }]
}
const labels = {
  search: 'Buscar widgets', all: 'Todas', categories: 'Categoría', add: 'Añadir', size: 'Tamaño inicial',
  results: 'Resultados: {count}', empty: 'Ningún widget coincide con la búsqueda.', added: 'Ya añadido', addedCount: 'En el panel: {count}',
  addedShort: 'Añadido', addedToPanel: '{title} añadido', alreadyAdded: '{title} ya está en el panel', close: 'Cerrar', list: 'Widgets disponibles'
}
const widgetLabels = { actions: 'Acciones de' }
</script>

<template>
  <div class="demo">
    <div class="barra">
      <span>En el panel: {{ layout.length }}</span>
      <g-btn @click="abierta = true"><template #prepend><g-icon name="plus"></g-icon></template>Añadir widget</g-btn>
    </div>
    <g-widget-grid v-model="layout" label="Panel" :max-rows="2">
      <template #item="{ id }">
        <g-widget :title="tarjeta(id).title" :labels="widgetLabels">
          <g-metric :label="tarjeta(id).category" :value="tarjeta(id).value"></g-metric>
        </g-widget>
      </template>
    </g-widget-grid>

    <g-widget-gallery
      v-model="abierta" title="Añadir widget" description="Elige un widget y su tamaño inicial; se añade al final del panel."
      :items="items" :sizes="sizes" :added="added" :labels="labels" @add="añadir"
    >
      <template #preview="{ item }">
        <g-widget :title="item.title" :eyebrow="item.category" level="m" :labels="widgetLabels">
          <g-metric :label="item.title" :value="item.value" size="lg"></g-metric>
        </g-widget>
      </template>
    </g-widget-gallery>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-3); }
.barra { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--g-space-3); }
</style>
