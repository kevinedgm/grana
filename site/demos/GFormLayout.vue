<script setup>
import { reactive, ref } from 'vue'

// Fuera del <form>: controla cómo se ve, no es un dato del envío
const estrecho = ref(false)
const m = reactive({ nombre: '', apellido: '', calle: '', numero: '', entrega: 'domicilio', vecino: false, indicaciones: '' })
const textos = { optional: '(opcional)', error: 'Error: ', warning: 'Advertencia: ', valid: 'Correcto: ' }
const entregas = [
  { value: 'domicilio', label: 'A domicilio' },
  { value: 'sucursal', label: 'Recoger en sucursal' }
]
</script>

<template>
  <div class="demo">
    <g-switch v-model="estrecho" label="Columna estrecha (stack)" hint="Como en un panel lateral: un campo por línea." />
    <g-form aria-label="Datos de envío" :labels="textos">
      <g-form-layout :stack="estrecho">
        <g-form-row>
          <g-input v-model="m.nombre" label="Nombre" name="nombre" required autocomplete="given-name" />
          <g-input v-model="m.apellido" label="Apellido" name="apellido" required autocomplete="family-name" />
        </g-form-row>
        <g-form-row>
          <g-input v-model="m.calle" class="g-form-w-lg" label="Calle" name="calle" required autocomplete="address-line1" />
          <g-input v-model="m.numero" class="g-form-w-xs" label="Número" name="numero" required />
        </g-form-row>
        <g-select v-model="m.entrega" label="Entrega" name="entrega" :options="entregas" required />
        <g-checkbox v-model="m.vecino" label="Dejar con un vecino si no hay nadie" name="vecino" />
        <g-textarea v-model="m.indicaciones" label="Indicaciones para el repartidor" name="indicaciones" />
      </g-form-layout>
    </g-form>
  </div>
</template>

<style scoped>
.demo {
  display: grid;
  gap: var(--g-space-6);
}
</style>
