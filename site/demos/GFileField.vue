<script setup>
import { ref, computed } from 'vue'
import { GFileField, formatFileSize } from '@grana/vue/file-field'
import { createSimulatedUploader } from '@grana/vue/testing'

// Sin red: el adaptador simulado sube por pasos. En tu app, aquí va tu cliente HTTP.
const uploader = createSimulatedUploader({ interval: 140, steps: 12 })

const estudios = ref([
  { key: 'doc-118', name: 'Receta médica.pdf', size: 220000, type: 'application/pdf', value: 'doc-118' }
])
const hint = `PDF o imagen · hasta ${formatFileSize(5_000_000, 'es-MX')} · máximo 4`
const plural = (n, uno, varios) => (n === 1 ? uno : varios.replace('{n}', n))

// Todo lo que el campo dice sale de aquí: Grana no trae textos.
const labels = {
  add: 'Adjuntar archivo', addMany: 'Adjuntar archivos', addMore: 'Añadir más', change: 'Cambiar archivo',
  full: (count, max) => `${count} de ${max}`, readonly: 'Solo lectura', none: 'Sin archivos',
  status: ({ count, max, active, failed }) => [
    max && max > 1 ? `${count} de ${max}` : plural(count, '1 archivo', '{n} archivos'),
    active ? `${active} subiendo` : '', failed ? plural(failed, '1 con error', '{n} con error') : ''
  ].filter(Boolean).join(' · '),
  list: 'Archivos de {label}', drop: 'Soltar aquí · {hint}', dropInto: 'Soltar en {label}',
  dropRejected: '{label} no admite estos archivos', dropFull: '{label} está lleno',
  remove: 'Quitar {name}', cancel: 'Cancelar subida de {name}', retry: 'Reintentar {name}',
  queued: 'En cola', done: 'Subido', error: 'Error:', progress: 'Subida de {name}', progressText: '{percent} %, {loaded} de {total}',
  uploadFailed: 'No se pudo subir', notAdded: 'Archivos no añadidos', dismiss: 'Descartar',
  reasons: { type: 'no es un tipo admitido', empty: 'está vacío', duplicate: 'ya está en la lista', size: 'pesa {size}, el máximo es {limit}', count: 'ya hay {limit}, el máximo' },
  added: 'Añadido {name}.', addedMany: (n) => `Añadidos ${n} archivos.`, replaced: '{old} reemplazado por {name}.',
  rejected: 'No se añadió {name}: {reason}.', rejectedMany: 'No se añadieron {count} archivos: {list}.',
  uploading: (n) => (n === 1 ? 'Subiendo.' : `Subiendo ${n}.`), uploaded: '{name} subido.', uploadedMany: (n) => `${n} archivos subidos.`,
  uploadError: 'No se pudo subir {name}: {message}.', retrying: 'Reintentando {name}.',
  removed: (n, name) => `Quitado ${name}. ` + (n ? plural(n, 'Queda 1 archivo.', 'Quedan {n} archivos.') : 'Sin archivos.'),
  canceled: (n, name) => `Subida de ${name} cancelada. ` + (n ? plural(n, 'Queda 1 archivo.', 'Quedan {n} archivos.') : 'Sin archivos.'),
  pending: (n, name) => (n === 1 ? `Espera a que termine de subir ${name}.` : `Esperan ${n} archivos por subir.`),
  failed: (n, name) => (n === 1 ? `No se pudo subir ${name}: reinténtalo o quítalo.` : `${n} archivos no se subieron: reinténtalos o quítalos.`)
}
const estados = { ready: 'listo', queued: 'en cola', uploading: 'subiendo', done: 'subido', error: 'con error' }
const resumen = computed(() => estudios.value.map((e) => `${e.name} (${estados[e.state ?? 'done']})`).join(', ') || '—')
</script>

<template>
  <div class="demo">
    <GFileField v-model="estudios" name="estudios" label="Estudios del expediente" locale="es-MX" multiple :max="4"
                accept=".pdf,image/*" :max-size="5000000" :hint="hint" :uploader="uploader" :labels="labels" />
    <p>Adjuntos: <strong>{{ resumen }}</strong></p>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-4); }
</style>
