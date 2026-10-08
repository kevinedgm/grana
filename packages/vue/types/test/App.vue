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
</template>
