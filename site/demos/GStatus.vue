<script setup>
import { onUnmounted, provide, ref } from 'vue'
import { createStatus, statusKey, GStatusIsland, GStatusMark, GStatus } from '@grana/vue/status'

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

const soloLectura = ref(false)
const falloCarga = ref(false)
let timer = null
// Reintentar: la «carga» tarda 1 s y sale bien; al apagar el v-if, <GStatus> retira su condición
const recargar = () => new Promise((resolve) => {
  timer = setTimeout(() => { falloCarga.value = false; resolve() }, 1000)
})
onUnmounted(() => { clearTimeout(timer); status.clear() })
</script>

<template>
  <div class="demo">
    <g-switch v-model="soloLectura" label="Otra persona edita el expediente"></g-switch>
    <g-switch v-model="falloCarga" label="Falla la carga de las facturas"></g-switch>

    <GStatus
      v-if="soloLectura" id="readonly" type="warning" title="Modo de solo lectura"
      description="Otra persona está editando este expediente." dismissible @remove="soloLectura = false"
    />
    <GStatus
      v-if="falloCarga" id="invoices" type="error" title="No se pudieron cargar las facturas"
      description="El servidor tardó demasiado en responder." details="GET /api/facturas · 504 Gateway Timeout"
      :action="{ label: 'Reintentar', busyLabel: 'Cargando…', onClick: recargar }"
      :origin="{ label: 'Ir a Facturas', target: 'demo-facturas' }" @remove="falloCarga = false"
    />

    <section id="demo-facturas" class="facturas" aria-label="Facturas">
      <strong>Facturas</strong>
      <GStatusMark for="invoices">No se pudieron cargar</GStatusMark>
      <span v-if="!falloCarga">F-0041 · F-0042 · F-0043</span>
    </section>
    <GStatusIsland />
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-3); }
.facturas { display: flex; flex-wrap: wrap; align-items: center; gap: var(--g-space-3); }
</style>
