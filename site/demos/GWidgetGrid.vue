<script setup>
import { ref } from 'vue'

const layout = ref([
  { id: 'ingresos', w: 2, h: 2 },
  { id: 'citas', w: 1, h: 2 },
  { id: 'meta', w: 1, h: 2 }
])
const editando = ref(true)
const ultimo = ref('—')
const widgets = {
  ingresos: { title: 'Ingresos', icon: 'wallet', label: 'Ingresos del mes', value: '$48.2k', trend: '+12%', direction: 'up', color: 'success' },
  citas: { title: 'Citas hoy', icon: 'calendar', label: 'Citas', value: 18, trend: '−3', direction: 'down', color: 'warning' },
  meta: { title: 'Pacientes nuevos', icon: 'users', label: 'Esta semana', value: 7, trend: '+2', direction: 'up', color: 'success' }
}
const widgetLabels = { actions: 'Acciones de' }
const labels = {
  grab: 'Mover {title}. Posición {position} de {count}', grabRole: 'elemento reordenable',
  resize: 'Cambiar el tamaño de {title}: {columns} × {rows}',
  grabbed: '{title} recogido. Posición {position} de {count}. Usa las flechas y Espacio para soltar.',
  moved: 'Posición {position} de {count}', dropped: '{title} soltado en la posición {position} de {count}',
  cancelled: 'Movimiento cancelado. {title} vuelve a la posición {position}',
  resized: '{title}: {columns} × {rows}', removed: '{title} quitado',
  moveBefore: 'Mover antes', moveAfter: 'Mover después', size: 'Tamaño', remove: 'Quitar',
  presets: { s: 'Pequeño', m: 'Mediano', l: 'Grande', wide: 'Ancho', tall: 'Alto' },
  empty: 'Sin widgets'
}
const quitar = (id) => { layout.value = layout.value.filter((e) => e.id !== id) }
const restaurar = () => {
  layout.value = [{ id: 'ingresos', w: 2, h: 2 }, { id: 'citas', w: 1, h: 2 }, { id: 'meta', w: 1, h: 2 }]
}
</script>

<template>
  <div class="demo">
    <div class="barra">
      <g-switch v-model="editando" label="Editar el panel"></g-switch>
      <g-btn size="sm" variant="ghost" color="neutral" @click="restaurar">Restaurar</g-btn>
    </div>
    <g-widget-grid
      v-model="layout" label="Panel de la clínica" :editable="editando" :max-rows="3" :labels="labels"
      @change="(e) => (ultimo = `${e.reason} · ${widgets[e.id].title}`)" @remove-request="quitar($event.id)"
    >
      <template #item="{ id }">
        <g-widget :title="widgets[id].title" :labels="widgetLabels" updated-text="Hace 5 min">
          <template #icon><g-icon :name="widgets[id].icon"></g-icon></template>
          <g-metric
            :label="widgets[id].label" :value="widgets[id].value" :trend="widgets[id].trend"
            :direction="widgets[id].direction" :trend-color="widgets[id].color" size="lg"
          ></g-metric>
        </g-widget>
      </template>
    </g-widget-grid>
    <p class="nota">Último cambio: <strong>{{ ultimo }}</strong></p>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-3); }
.barra { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--g-space-3); }
.nota { margin: 0; }
</style>
