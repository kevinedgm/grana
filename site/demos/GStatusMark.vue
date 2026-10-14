<script setup>
import { onUnmounted, provide, ref } from 'vue'
import { createStatus, statusKey, GStatusIsland, GStatusMark } from '@grana/vue/status'

const status = createStatus({
  offset: { top: 'var(--vp-nav-height)' },
  labels: {
    region: 'Estado de la aplicación ({hotkey})',
    summary: (n) => (n === 1 ? 'Estado: 1 aviso.' : `Estado: ${n} avisos.`),
    more: 'y {count} más',
    types: { info: 'Información', success: 'Correcto', warning: 'Advertencia', error: 'Error' },
    acknowledge: 'Entendido', dismiss: 'Descartar: {title}',
    details: 'Detalle técnico', copy: 'Copiar', copied: 'Detalle copiado',
    remaining: 'Quedan {time}', sheetTitle: 'Estado de la aplicación', close: 'Cerrar'
  }
})
provide(statusKey, status)

const nombre = ref('Lucía Herrera')
const tarjetaAlDia = ref(false)
const fallar = ref(true)
let timer = null
const servidor = () => new Promise((resolve, reject) => {
  timer = setTimeout(() => (fallar.value ? reject(new Error('500')) : resolve()), 800)
})
const guardado = { type: 'success', title: 'Perfil guardado', description: '', action: undefined, origin: undefined, persistent: false }

function guardar() {
  servidor()
    .then(() => status.set('save', guardado))
    .catch(() => status.error('save', 'No se pudo guardar el perfil', {
      description: 'El servidor no respondió; tus datos siguen en el formulario.',
      action: { label: 'Reintentar', busyLabel: 'Reintentando…', onClick: () => servidor().then(() => guardado) },
      origin: { label: 'Ir al formulario', target: 'demo-perfil' }
    }))
}
onUnmounted(() => { clearTimeout(timer); status.clear() })
</script>

<template>
  <div id="demo-perfil" class="demo">
    <GStatusMark v-if="!tarjetaAlDia" type="warning">
      Tu tarjeta caduca este mes.
      <template #action><g-btn size="sm" variant="outline" color="neutral" @click="tarjetaAlDia = true">Actualizar</g-btn></template>
    </GStatusMark>
    <GStatusMark v-else type="success">Tarjeta actualizada hasta 2029.</GStatusMark>
    <g-input v-model="nombre" label="Nombre" name="nombre"></g-input>
    <g-switch v-model="fallar" label="Simular fallo del servidor"></g-switch>
    <g-form-actions>
      <GStatusMark for="save" v-slot="{ type, busy }">{{ type === 'success' ? 'Guardado' : busy ? 'Reintentando…' : 'No se guardó' }}</GStatusMark>
      <g-btn @click="guardar">Guardar</g-btn>
    </g-form-actions>
    <GStatusIsland />
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-4); }
</style>
