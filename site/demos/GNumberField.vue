<script setup>
import { ref, computed } from 'vue'

const peso = ref(72.5)
const edad = ref(34)
const dosis = ref(2)

const errorEdad = computed(() =>
  edad.value != null && (edad.value < 0 || edad.value > 120) ? 'La edad debe estar entre 0 y 120 años.' : undefined
)
</script>

<template>
  <div class="demo">
    <g-number-field v-model="peso" label="Peso" name="peso" locale="es-MX" :min="0" :max="400" :step="0.1" :precision="1"
                    suffix="kg" suffix-label="kilogramos" hint="Con coma o con punto: ambos valen." />
    <g-number-field v-model="edad" label="Edad" name="edad" locale="es-MX" :min="0" :max="120" :precision="0"
                    suffix="años" suffix-label="años" :error="errorEdad" />
    <g-number-field v-model="dosis" label="Dosis diaria" name="dosis" locale="es-MX" :min="0" :max="6" steppers
                    decrement-label="Menos una dosis" increment-label="Más una dosis"
                    suffix="tabletas" suffix-label="tabletas" />
    <p>Peso: <strong>{{ peso }}</strong> · Edad: <strong>{{ edad }}</strong> · Dosis: <strong>{{ dosis }}</strong></p>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-4); justify-items: start; }
</style>
