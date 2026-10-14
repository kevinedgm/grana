<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

const base = [
  { id: 'M-0412', nombre: 'Sangre · Lucía Herrera', meta: 'Recibida el 12 oct · Lote 2210-0412' },
  { id: 'M-0411', nombre: 'Orina · Tomás Rivera', meta: 'Recibida el 12 oct · Lote 2210-0411' },
  { id: 'M-0410', nombre: 'Exudado · Marta Gil', meta: 'Recibida el 11 oct · Lote 2210-0410' }
]
const nuevas = [
  { id: 'M-0413', nombre: 'Sangre · Andrés Soto', meta: 'Recibida el 13 oct · Lote 2210-0413' },
  { id: 'M-0414', nombre: 'Saliva · Elena Cruz', meta: 'Recibida el 13 oct · Lote 2210-0414' }
]
// La muestra del molde: los mismos campos, textos de largo típico y sin datos de personas
const muestra = Array.from({ length: 3 }, (_, i) => ({ id: 's' + i, nombre: 'Tipo · Nombre Apellido', meta: 'Recibida el 0 oct · Lote 0000-0000' }))
const textos = {
  loading: 'Cargando muestras.',
  slow: 'Sigue cargando muestras…',
  loaded: ({ count, fresh }) => `${count} muestras${fresh ? `, ${fresh} ${fresh === 1 ? 'nueva' : 'nuevas'}` : ''}.`,
  refreshing: 'Actualizando',
  failed: 'No se pudo actualizar. Lo que ves es lo último que llegó.',
  retry: 'Reintentar'
}

const cargando = ref(false)
const muestras = ref(null)
const error = ref(false)
const fallar = ref(false)
let llegadas = 0
let timer = null

function cargar() {
  clearTimeout(timer)
  cargando.value = true
  error.value = false
  timer = setTimeout(() => {
    if (fallar.value && muestras.value) error.value = true
    else {
      const extra = muestras.value ? nuevas.slice(0, Math.min(++llegadas, nuevas.length)).reverse() : []
      muestras.value = [...extra, ...base]
    }
    cargando.value = false
  }, 1200)
}
onMounted(cargar)
onUnmounted(() => clearTimeout(timer))
</script>

<template>
  <div class="demo">
    <div class="barra">
      <h3 id="demo-h-muestras" class="titulo">Muestras</h3>
      <g-switch v-model="fallar" size="sm" label="Simular fallo"></g-switch>
      <g-btn size="sm" variant="outline" :disabled="cargando" @click="cargar">Recargar</g-btn>
    </div>
    <g-load-region
      :loading="cargando" :items="muestras" :sample="muestra" :error="error"
      labelledby="demo-h-muestras" :labels="textos" @retry="cargar"
    >
      <template #default="{ items, mold, fresh, itemAttrs }">
        <ul v-if="items && items.length" class="lista">
          <li v-for="m in items" :key="m.id" v-bind="itemAttrs(m)">
            <strong>{{ m.nombre }}</strong>
            <g-badge v-if="fresh(m)" size="sm" variant="soft" color="accent">Nueva</g-badge>
            <span class="meta">{{ m.meta }}</span>
          </li>
        </ul>
        <g-empty v-else-if="items && !mold" cause="none" title="Aún no hay muestras"></g-empty>
      </template>
    </g-load-region>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-3); }
.barra { display: flex; flex-wrap: wrap; align-items: center; gap: var(--g-space-3); }
.titulo { margin: 0; margin-inline-end: auto; }
.lista { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--g-space-3); }
.lista li { display: flex; flex-wrap: wrap; align-items: center; gap: var(--g-space-1) var(--g-space-2); }
.meta { flex-basis: 100%; }
</style>
