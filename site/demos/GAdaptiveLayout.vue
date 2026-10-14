<script setup>
import { ref } from 'vue'

const ancho = ref('100')
const anchos = [
  { value: '100', label: 'Completo' },
  { value: '75', label: '75 %' },
  { value: '55', label: '55 %' }
]
const calle = ref('Av. de los Insurgentes Sur')
const exterior = ref(1602)
const interior = ref(null)
const cp = ref('03940')
const colonia = ref('Crédito Constructor')
const referencias = ref('')
</script>

<template>
  <div class="demo">
    <g-radio-group v-model="ancho" name="adapt-ancho" appearance="segmented" label="Ancho del contenedor" :options="anchos"></g-radio-group>

    <div class="marco" :style="{ inlineSize: ancho + '%' }">
      <g-adaptive-layout>
        <g-input v-model="calle" name="calle" label="Calle"></g-input>
        <g-number-field v-model="exterior" name="exterior" label="Exterior" :min="0" :max="99999" :precision="0" :grouping="false"></g-number-field>
        <g-number-field v-model="interior" name="interior" label="Interior" steppers decrement-label="Restar" increment-label="Sumar" :min="0" :max="9" :precision="0"></g-number-field>
        <g-input v-model="cp" class="g-adapt-short" style="--g-adapt-chars: 5" name="cp" label="Código postal" inputmode="numeric"></g-input>
        <g-input v-model="colonia" name="colonia" label="Colonia" style="--g-adapt-weight: 2"></g-input>
        <g-textarea v-model="referencias" class="g-adapt-full" name="referencias" label="Referencias"></g-textarea>
      </g-adaptive-layout>
    </div>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-4); }
.marco { max-inline-size: 100%; }
</style>
