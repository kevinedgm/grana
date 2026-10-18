<script setup lang="ts">
// Plantilla sin importar los componentes: se tipan por GlobalComponents tras `app.use` (main.ts importa las entradas).
import { ref } from 'vue'
import type { ComboboxOption, FileEntry } from '@grana/vue/combobox'

const value = ref<string | number | null>(null)
const files = ref<FileEntry[]>([])
const options: ComboboxOption[] = [{ value: 'p1', label: 'María' }]
const onClick = (e: MouseEvent) => e.clientX
</script>

<template>
  <g-btn variant="soft" size="lg" @click="onClick">Guardar</g-btn>
  <GBtn color="danger" :loading="false">Eliminar</GBtn>
  <g-combobox v-model="value" :options="options" label="Paciente">
    <template #option="{ option, active }">{{ option.label.toUpperCase() }} {{ active ? '·' : '' }}</template>
  </g-combobox>
  <g-file-field v-model="files" label="Adjuntos" />
  <g-time-field model-value="09:30" label="Hora" />
  <g-slider :model-value="40" label="Volumen" :marks="true" />
  <g-slider range :model-value="[800, 2400]" label="Precio" :labels="{ start: 'mínimo', end: 'máximo' }" />
  <g-icon name="pencil" />
  <g-datepicker label="Fecha" />
  <g-tabs :items="[{ id: 'a', label: 'A' }]">
    <template #panel-a="{ item }">{{ item.label }}</template>
  </g-tabs>

  <!-- @vue-expect-error variant fuera de la lista -->
  <g-btn variant="nope">No</g-btn>
  <g-combobox :options="options" label="X">
    <template #option="{ option }">
      <!-- @vue-expect-error option.label es texto: no tiene toFixed -->
      {{ option.label.toFixed(2) }}
    </template>
  </g-combobox>
  <!-- @vue-expect-error el modelo de GSlider no es una cadena -->
  <g-slider model-value="40" label="X" />
  <!-- @vue-expect-error el manejador de click recibe un MouseEvent -->
  <g-btn @click="(e: string) => e">X</g-btn>

  <!-- GTag + GTagGroup -->
  <g-tag label="Vue" href="/vue" @navigate="(p) => p.event.preventDefault()" />
  <g-tag-group :items="[{ id: 1, label: 'A', removable: true }]" label="Etiquetas" :labels="{ remove: 'Quitar {label}' }">
    <template #label="{ item, index }">{{ item.label.toUpperCase() }} {{ index + 1 }}</template>
    <template #lead="{ item }">{{ item.id }}</template>
  </g-tag-group>
  <!-- @vue-expect-error layout fuera de la lista -->
  <g-tag-group :items="[]" label="X" layout="grid" />

  <!-- GEmpty + GLoadRegion -->
  <g-load-region :loading="true" :items="null" :sample="[{ id: 1, name: 'Tipo' }]" label="Muestras" :labels="{ loading: 'Cargando' }">
    <template #default="{ items, mold, fresh, itemAttrs }">
      <ul v-if="items"><li v-for="it in items" :key="it.id" v-bind="itemAttrs(it)">{{ it.name }} {{ mold }} {{ fresh(it) }}</li></ul>
      <g-empty v-else cause="none" title="Aún no hay muestras">
        <template #actions="{ cause }">{{ cause }}</template>
      </g-empty>
    </template>
    <template #failed="{ retry, text }"><button @click="retry">{{ text }}</button></template>
  </g-load-region>
  <!-- @vue-expect-error GEmpty: cause fuera de la lista -->
  <g-empty cause="done" title="Al día" />

  <!-- GCardGroup (#610) -->
  <g-card-group model-value="vencida" label="Filtrar por estado">
    <g-card value="vencida" title="Vencidas" />
    <template #panel="{ filtered }">{{ filtered ? 'filtrada' : 'todas' }}</template>
  </g-card-group>
  <!-- @vue-expect-error GCardGroup: multiple es booleano -->
  <g-card-group label="X" multiple="sí" />

  <!-- GPageHeader (#633) -->
  <g-page-header title="Muestra M-0007" :heading-level="2" zone="brand" :labels="{ actions: 'Acciones de la página' }">
    <template #actions="{ narrow, docked }">{{ narrow && !docked ? 'icono' : 'texto' }}</template>
  </g-page-header>
  <!-- @vue-expect-error GPageHeader: headingLevel fuera de 1–3 -->
  <g-page-header title="X" :heading-level="4" />
  <!-- @vue-expect-error GPageHeader: zone fuera de la lista -->
  <g-page-header title="X" zone="inverse" />

  <!-- GFab (#656) -->
  <g-fab label="Crear" :items="[{ id: 'a', label: 'Nueva muestra' }]" position="bottom-center" :labels="{ more: 'Más ({count})' }">
    <template #trigger-icon="{ open }">{{ open ? 'abierto' : 'cerrado' }}</template>
  </g-fab>
  <!-- @vue-expect-error GFab: anchor fuera de la lista -->
  <g-fab label="X" anchor="page" />
</template>
