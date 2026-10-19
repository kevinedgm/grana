<script setup>
import { ref } from 'vue'

const ultima = ref('ninguna')

const espera = (ms, ok, texto) => new Promise((resolver, rechazar) => {
  setTimeout(() => (ok ? resolver(texto) : rechazar({ message: texto })), ms)
})

const items = [
  { id: 'sample', label: 'Nueva muestra',  icon: 'pencil', description: 'Registro con código de barras' },
  { id: 'photo',  label: 'Subir imagen',   icon: 'image' },
  { id: 'note',   label: 'Nueva nota',     icon: 'file-text' },
  { id: 'upload', label: 'Subir archivo',  icon: 'upload', description: 'PDF, imagen o CSV' },
  { id: 'agenda', label: 'Programar toma', icon: 'calendar' },
  { id: 'csv',    label: 'Exportar CSV',   icon: 'download', group: 'Exportar', description: 'Lo filtrado, en UTF-8' },
  { id: 'print',  label: 'Imprimir etiquetas', icon: 'printer', group: 'Exportar' },
  { id: 'purge',  label: 'Vaciar borradores', icon: 'trash', group: 'Mantenimiento', danger: true,
    confirm: '¿Vaciar los 12 borradores?', confirmLabel: 'Vaciar' },
]

function alSeleccionar(evento) {
  ultima.value = evento.id
  if (evento.id === 'csv') evento.waitUntil(espera(1200, true, 'CSV exportado'))
  if (evento.id === 'photo') evento.waitUntil(espera(800, false, 'Sin conexión'))
}
</script>

<template>
  <div class="demo">
    <p>Última acción: <strong>{{ ultima }}</strong></p>
    <div class="marco">
      <GFab
        label="Crear y capturar"
        anchor="container"
        :items="items"
        :labels="{
          more: 'Más acciones ({count})',
          cancel: 'Cancelar',
          busy: 'En curso…',
          done: 'Hecho',
          failed: 'No se pudo',
        }"
        @select="alSeleccionar"
      />
    </div>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-3); }
.marco {
  position: relative;
  block-size: 420px;
  border: var(--g-border-width) solid var(--g-color-border-strong);
  border-radius: var(--g-radius-md);
}
</style>
