<script setup>
import { ref } from 'vue'

const abierto = ref(false)
const ultima = ref('ninguna')
const items = ref([
  { id: 'editar', label: 'Renombrar', icon: 'pencil', shortcut: 'F2', keyshortcuts: 'F2' },
  { id: 'duplicar', label: 'Duplicar', icon: 'copy' },
  { id: 'mover', label: 'Mover a…', icon: 'folder', disabled: true },
  { label: 'Exportar como', icon: 'download', items: [{ id: 'pdf', label: 'PDF' }, { id: 'csv', label: 'Hoja de cálculo' }] },
  { type: 'separator' },
  { type: 'group', label: 'Mostrar', items: [
    { type: 'checkbox', id: 'notas', label: 'Notas al margen', checked: true },
    { type: 'radio', id: 'nombre', label: 'Ordenar por nombre', checked: true },
    { type: 'radio', id: 'fecha', label: 'Ordenar por fecha' }
  ] },
  { type: 'separator' },
  { id: 'eliminar', label: 'Eliminar', danger: true }
])

// El menú emite intención: el estado de casillas y opciones lo guarda la aplicación.
function elegir(e) {
  if (e.type === 'checkbox') e.item.checked = e.checked
  if (e.type === 'radio') e.group.items.forEach((x) => { if (x.type === 'radio') x.checked = x.id === e.id })
  ultima.value = e.item.label + (e.type === 'checkbox' ? (e.checked ? ' (activada)' : ' (desactivada)') : '')
}
</script>

<template>
  <div class="demo">
    <g-menu v-model="abierto" :items="items" label="Acciones del documento" @select="elegir">
      <template #trigger="{ attrs }">
        <g-btn v-bind="attrs" variant="outline">Acciones <template #append><g-icon name="chevron-down"></g-icon></template></g-btn>
      </template>
    </g-menu>
    <p>Última elección: <strong>{{ ultima }}</strong></p>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-3); justify-items: start; }
.demo p { margin: 0; }
</style>
