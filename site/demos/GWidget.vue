<script setup>
import { ref } from 'vue'

const estado = ref('populated')
const estados = [
  { value: 'populated', label: 'Con datos' },
  { value: 'loading', label: 'Cargando' },
  { value: 'empty', label: 'Vacío' },
  { value: 'error', label: 'Error' },
  { value: 'stale', label: 'Desactualizado' },
  { value: 'disabled', label: 'Deshabilitado' }
]
const ancho = ref('100')
const anchos = [
  { value: '100', label: 'Ancho' },
  { value: '60', label: 'Medio' },
  { value: '35', label: 'Estrecho' }
]
const labels = { actions: 'Acciones de', loading: 'Cargando ingresos', empty: 'Sin datos en este periodo', error: 'No se pudo cargar', retry: 'Reintentar', stale: 'Desactualizado', staleText: 'Datos de hace 2 h', disabled: 'Deshabilitado' }
const acciones = [{ id: 'refresh', label: 'Actualizar' }, { id: 'export', label: 'Exportar' }]
const ultima = ref('ninguna')
</script>

<template>
  <div class="demo">
    <div class="controles">
      <g-select v-model="estado" :options="estados" label="Estado" name="widget-estado"></g-select>
      <g-radio-group v-model="ancho" name="widget-ancho" appearance="segmented" label="Ancho del widget" :options="anchos"></g-radio-group>
    </div>
    <div class="caja" :style="{ inlineSize: ancho + '%' }">
      <g-widget
        title="Ingresos" eyebrow="Finanzas" description="Últimos 30 días" :state="estado" :labels="labels"
        :actions="acciones" updated-text="Actualizado hace 5 min" drilldown-label="Ver detalle"
        @action="({ id }) => (ultima = id)" @retry="estado = 'populated'" @drilldown="ultima = 'detalle'"
      >
        <template #icon><g-icon name="chart-column"></g-icon></template>
        <template #compact><g-metric label="Ingresos" value="$48k" trend="+12%" direction="up" trend-color="success"></g-metric></template>
        <template #default>
          <g-metric label="Ingresos" value="$48.2k" trend="+12%" direction="up" trend-color="success" context="vs. mes anterior" size="lg"></g-metric>
          <g-progress :value="72" label="Meta mensual" value-text="72 %"></g-progress>
        </template>
        <template #detail>
          <g-metric label="Ingresos" value="$48.2k" trend="+12%" direction="up" trend-color="success" context="vs. mes anterior" size="lg"></g-metric>
          <g-progress :value="72" label="Meta mensual" value-text="72 %"></g-progress>
          <g-data-list swatches label="Por canal" :rows="[{ label: 'Directo', value: '48%' }, { label: 'Búsqueda', value: '31%' }, { label: 'Referidos', value: '21%' }]"></g-data-list>
        </template>
      </g-widget>
    </div>
    <p class="nota">Última acción: <strong>{{ ultima }}</strong></p>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-4); }
.controles { display: grid; gap: var(--g-space-3); }
.caja { block-size: calc(var(--g-space-1) * 80); max-inline-size: 100%; }
.caja > * { block-size: 100%; }
.nota { margin: 0; }
</style>
