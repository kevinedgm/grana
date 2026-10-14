<script setup>
import { onBeforeUnmount } from 'vue'
import { createToaster } from '@grana/vue'

// Un gestor propio de este ejemplo; su región se pinta con <g-toaster :toaster>
const toaster = createToaster({
  labels: {
    region: 'Notificaciones ({hotkey})',
    close: 'Cerrar notificación',
    types: { info: 'Información', success: 'Correcto', warning: 'Advertencia', error: 'Error', loading: 'En curso' },
    repeated: '{count} veces',
    queued: '{count} más en espera',
    actionHint: 'Pulsa {hotkey} para {action}.'
  }
})

let subidas = 0
const temporizadores = new Set()
function esperar(ms, falla) {
  return new Promise((ok, mal) => {
    const t = setTimeout(() => { temporizadores.delete(t); falla ? mal(new Error('El archivo supera los 10 MB.')) : ok({ nombre: 'informe-octubre.pdf' }) }, ms)
    temporizadores.add(t)
  })
}

const guardar = () => toaster.success('Cambios guardados')
const archivar = () => toaster.show({
  title: 'Expediente archivado',
  description: 'Lucía Fernández · 2026-0412',
  action: { label: 'Deshacer', onClick: () => toaster.info('Expediente restaurado') }
})
// Una de cada dos subidas falla: el aviso pasa en su sitio de «Subiendo…» al desenlace
const subir = () => toaster.promise(esperar(1500, ++subidas % 2 === 0), {
  loading: 'Subiendo informe…',
  success: (r) => ({ title: 'Informe subido', description: r.nombre }),
  error: (e) => ({ title: 'No se pudo subir el informe', description: e.message })
}).catch(() => {})

onBeforeUnmount(() => {
  temporizadores.forEach(clearTimeout)
  toaster.clear()
})
</script>

<template>
  <div class="acciones">
    <g-btn variant="outline" @click="guardar">Guardar cambios</g-btn>
    <g-btn variant="outline" @click="archivar">Archivar expediente</g-btn>
    <g-btn variant="outline" @click="subir">Subir informe</g-btn>
  </div>
  <g-toaster :toaster="toaster" />
</template>

<style scoped>
.acciones {
  display: flex;
  flex-wrap: wrap;
  gap: var(--g-space-2);
}
</style>
