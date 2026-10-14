<script setup>
import { onUnmounted, provide } from 'vue'
import { createStatus, statusKey, GStatusIsland } from '@grana/vue/status'

// Un gestor propio para este ejemplo; en una aplicación se crea una vez en main.js.
// offset.top: la isla cuelga por debajo de la cabecera fija del sitio.
const status = createStatus({
  offset: { top: 'var(--vp-nav-height)' },
  labels: {
    region: 'Estado de la aplicación ({hotkey})',
    summary: (n) => (n === 1 ? 'Estado: 1 aviso.' : `Estado: ${n} avisos.`),
    more: 'y {count} más',
    types: { info: 'Información', success: 'Correcto', warning: 'Advertencia', error: 'Error' },
    acknowledge: 'Entendido',
    dismiss: 'Descartar: {title}',
    details: 'Detalle técnico', copy: 'Copiar', copied: 'Detalle copiado',
    remaining: 'Quedan {time}',
    sheetTitle: 'Estado de la aplicación', close: 'Cerrar'
  }
})
provide(statusKey, status)

let timer = null
const esperar = (ms) => new Promise((resolve) => { timer = setTimeout(resolve, ms) })

function mantenimiento() {
  status.info('maint', 'Mantenimiento programado esta noche', { description: 'De 23:00 a 23:30 no se podrá guardar.', dismissible: true })
}
function sinConexion() {
  if (status.has('offline')) return status.resolve('offline', 'Conexión restablecida')
  status.warning('offline', 'Sin conexión', { description: 'Los cambios se guardarán al volver.' })
}
function falloAlGuardar() {
  status.error('save', 'No se pudo guardar la factura', {
    description: 'El servidor no respondió; tus datos siguen en el formulario.',
    details: 'POST /api/facturas · 500 Internal Server Error · req-2c41d7',
    action: {
      label: 'Reintentar', busyLabel: 'Reintentando…',
      onClick: () => esperar(1200).then(() => ({
        type: 'success', title: 'Factura guardada con el folio F-0043', description: '', details: undefined,
        action: undefined, persistent: false
      }))
    }
  })
}
onUnmounted(() => { clearTimeout(timer); status.clear() })
</script>

<template>
  <div class="demo">
    <p class="nota">La isla aparece arriba, bajo la cabecera, y nunca mueve la página.</p>
    <div class="acciones">
      <g-btn variant="outline" color="neutral" @click="mantenimiento">Mantenimiento</g-btn>
      <g-btn variant="outline" color="neutral" @click="sinConexion">Conexión</g-btn>
      <g-btn variant="outline" color="danger" @click="falloAlGuardar">Fallo al guardar</g-btn>
      <g-btn variant="ghost" color="neutral" @click="status.clear()">Limpiar</g-btn>
    </div>
    <p class="nota">Avisos activos: <strong>{{ status.state.count }}</strong> · forma: <strong>{{ status.state.form }}</strong></p>
    <GStatusIsland />
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-3); }
.acciones { display: flex; flex-wrap: wrap; gap: var(--g-space-2); }
.nota { margin: 0; }
</style>
