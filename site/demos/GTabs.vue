<script setup>
import { ref } from 'vue'

const activa = ref('general')
const pestanas = [
  { id: 'general', label: 'General', icon: 'house' },
  { id: 'mensajes', label: 'Mensajes', icon: 'mail', count: 8, countLabel: '8 sin leer' },
  { id: 'facturas', label: 'Facturas', icon: 'file-text', badge: 'Nuevo' },
  { id: 'seguridad', label: 'Seguridad', icon: 'lock', status: 'attention', statusLabel: 'requiere atención' },
  { id: 'integraciones', label: 'Integraciones', icon: 'zap', disabled: true }
]
const contenido = {
  general: 'Nombre de la cuenta, zona horaria e idioma.',
  mensajes: 'Tienes 8 mensajes sin leer del equipo de soporte.',
  facturas: 'Ya puedes descargar las facturas de octubre en PDF.',
  seguridad: 'Activa la verificación en dos pasos para proteger tu cuenta.'
}
const textos = { more: 'Más pestañas', menu: 'Todas las pestañas', loading: '{label}: cargando', loaded: '{label}: listo' }

const periodo = ref('semana')
const periodos = [{ id: 'dia', label: 'Día' }, { id: 'semana', label: 'Semana' }, { id: 'mes', label: 'Mes' }]
</script>

<template>
  <div class="demo">
    <g-tabs v-model="activa" :items="pestanas" :labels="textos" label="Ajustes de la cuenta">
      <template #panel="{ item }">
        <p class="panel">{{ contenido[item.id] }}</p>
      </template>
    </g-tabs>

    <g-tabs v-model="periodo" :items="periodos" :labels="textos" label="Periodo del informe" appearance="segmented"></g-tabs>
    <p>Informe por {{ periodos.find((p) => p.id === periodo).label.toLowerCase() }}.</p>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-5); }
.demo p { margin: 0; }
.panel { padding-block: var(--g-space-4); }
</style>
