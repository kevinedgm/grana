<script setup>
import { ref } from 'vue'
import { GCombobox } from '@grana/vue/combobox'

const dx = ref(null)
const alergias = ref(['penicilina', 'latex'])
const libres = ref([])

// Los textos son tuyos: Grana no trae ninguno.
const labels = {
  clear: 'Quitar', close: 'Cerrar', noResults: 'Sin resultados para «{text}»',
  results: (n) => (n === 1 ? '1 resultado' : `${n} resultados`),
  more: 'Mostrar más ({shown} de {total})',
  useCustom: 'Usar «{text}» como texto libre', custom: 'Texto libre',
  selected: (n) => (n === 1 ? '1 seleccionada' : `${n} seleccionadas`),
  about: (n, list) => `${n === 1 ? '1 seleccionada' : `${n} seleccionadas`}: ${list}`,
  customItem: '{text} (texto libre)',
  added: (label, n) => `Se agregó ${label}. ${n} seleccionadas.`,
  removed: (label, n) => `Se quitó ${label}. ${n} seleccionadas.`,
  restored: (label, n) => `Se restauró ${label}. ${n} seleccionadas.`,
  clearedAll: 'Se quitaron todas', restoredAll: (n) => `Se restauraron ${n}`,
  armed: 'Pulsa Retroceso otra vez para quitar {label}', already: '{label} ya está elegida',
  max: 'Máximo {max}: quita una para elegir otra', ofMax: '{count} de {max}',
  chosen: 'Elegidas', rest: '{count} más', showAll: 'Ver las {count}', showLess: 'Ver menos',
  done: 'Listo', remove: 'Quitar {label}', undo: 'Deshacer', trace: '{label} quitada'
}
const diagnosticos = [
  { value: 'E11.9', code: 'E11.9', label: 'Diabetes mellitus tipo 2, sin complicación', description: 'Endocrinas y metabólicas' },
  { value: 'I10', code: 'I10', label: 'Hipertensión esencial (primaria)', description: 'Sistema circulatorio' },
  { value: 'J45.9', code: 'J45.9', label: 'Asma, no especificada', description: 'Sistema respiratorio' },
  { value: 'K29.7', code: 'K29.7', label: 'Gastritis, no especificada', description: 'Sistema digestivo' }
]
const catalogoAlergias = [
  { value: 'penicilina', label: 'Penicilina' },
  { value: 'latex', label: 'Látex' },
  { value: 'polen', label: 'Polen' },
  { value: 'mariscos', label: 'Mariscos' },
  { value: 'ibuprofeno', label: 'Ibuprofeno' }
]
</script>

<template>
  <div class="demo" lang="es-MX">
    <GCombobox v-model="dx" label="Diagnóstico principal" placeholder="Código o descripción" clearable
               hint="Prueba «diab» o «I10»." :labels="labels" :options="diagnosticos" />
    <GCombobox v-model="alergias" v-model:custom="libres" multiple label="Alergias" placeholder="Buscar alergia"
               clearable allow-custom hint="Si no está en la lista, escríbela." :labels="labels" :options="catalogoAlergias" />
    <p>Diagnóstico: <strong>{{ dx ?? '—' }}</strong> · Alergias: <strong>{{ [...alergias, ...libres].join(', ') || '—' }}</strong></p>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-4); }
</style>
