<script setup>
import { computed, reactive, ref } from 'vue'

const abierto = ref(false)
const pestaña = ref('data')
const errores = ref([])
const periodos = [
  { value: '7', label: 'Últimos 7 días' },
  { value: '30', label: 'Últimos 30 días' },
  { value: '90', label: 'Últimos 90 días' }
]
const base = reactive({ title: 'Ingresos', period: '30', goal: 50000 })
const borrador = reactive({ ...base })
const modificado = computed(() => JSON.stringify(borrador) !== JSON.stringify(base))
const nombrePeriodo = (v) => periodos.find((p) => p.value === v).label
const errorDe = (field) => errores.value.find((e) => e.field === field)?.message

const tabs = [{ id: 'data', label: 'Datos' }, { id: 'set', label: 'Ajustes' }]
const labels = {
  tabs: 'Secciones de la configuración', apply: 'Aplicar', cancel: 'Cancelar', close: 'Cerrar sin aplicar', reset: 'Restablecer',
  discardTitle: '¿Descartar los cambios?', keepEditing: 'Seguir editando', discard: 'Descartar',
  errorSummary: 'Campos por corregir: {count}', errorCount: 'Errores: {count}'
}
const widgetLabels = { actions: 'Acciones de' }

function configurar(id) {
  if (id !== 'configure') return
  Object.assign(borrador, base)
  errores.value = []
  abierto.value = true
}
function aplicar() {
  const e = []
  if (!(borrador.goal > 0)) e.push({ tab: 'data', field: 'cfg-goal', message: 'La meta debe ser un número mayor que 0.' })
  if (!borrador.title.trim()) e.push({ tab: 'set', field: 'cfg-title', message: 'El título es obligatorio.' })
  errores.value = e
  if (e.length) return
  Object.assign(base, borrador)
  abierto.value = false
}
</script>

<template>
  <div class="demo">
    <p class="nota">Abre el menú del widget y elige «Configurar».</p>
    <g-widget
      :title="base.title" eyebrow="Finanzas" :description="nombrePeriodo(base.period)" level="m" class="caja"
      :actions="[{ id: 'configure', label: 'Configurar' }]" :labels="widgetLabels" @action="configurar($event.id)"
    >
      <g-metric label="Ingresos" value="$48.2k" size="lg"></g-metric>
      <g-progress :value="Math.min(100, Math.round(48200 / (base.goal || 1) * 100))" label="Meta" :value-text="`$${base.goal.toLocaleString('es-MX')}`"></g-progress>
    </g-widget>

    <g-widget-config
      v-model="abierto" v-model:tab="pestaña" :title="`Configurar ${base.title}`" :tabs="tabs"
      :errors="errores" :dirty="modificado" resettable :labels="labels"
      @apply="aplicar" @reset="Object.assign(borrador, base); errores = []" @cancel="errores = []"
    >
      <template #preview>
        <g-widget :title="borrador.title || '—'" eyebrow="Finanzas" :description="nombrePeriodo(borrador.period)" level="m" :labels="widgetLabels">
          <g-metric label="Ingresos" value="$48.2k" size="lg"></g-metric>
        </g-widget>
      </template>
      <template #tab-data>
        <div class="campos">
          <g-select v-model="borrador.period" :options="periodos" label="Periodo" name="cfg-period"></g-select>
          <g-number-field id="cfg-goal" v-model="borrador.goal" label="Meta mensual" prefix="$" :min="0" :precision="0" locale="es-MX" :error="errorDe('cfg-goal')"></g-number-field>
        </div>
      </template>
      <template #tab-set>
        <g-input id="cfg-title" v-model="borrador.title" label="Título" :error="errorDe('cfg-title')"></g-input>
      </template>
    </g-widget-config>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-3); }
.caja { block-size: calc(var(--g-space-1) * 60); }
.campos { display: grid; gap: var(--g-space-4); }
.nota { margin: 0; }
</style>
