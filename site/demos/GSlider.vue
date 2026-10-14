<script setup>
import { ref } from 'vue'
import { GSlider } from '@grana/vue/slider'

const dolor = ref(null)
const precio = ref([800, 2400])
const minutos = ref(45)
</script>

<template>
  <div class="demo">
    <GSlider v-model="dolor" label="Intensidad del dolor" locale="es-MX" :max="10"
             :marks="[{ value: 0, label: 'Sin dolor' }, { value: 5, label: 'Moderado' }, { value: 10, label: 'El peor' }]"
             :labels="{ empty: 'Sin elegir' }" hint="Haz clic en el riel o usa las flechas." />
    <GSlider v-model="precio" range label="Precio de la consulta" locale="es-MX" :max="5000" :step="50" :min-gap="100"
             :format="{ style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }"
             :labels="{ start: 'mínimo', end: 'máximo' }" hint="Arrastra el tramo para moverlo entero." />
    <GSlider v-model="minutos" label="Duración de la sesión" locale="es-MX" :min="15" :max="480" :step="5" color="accent"
             :value-text="(m) => `${Math.floor(m / 60)} h ${m % 60} min`" />
    <p>Dolor: <strong>{{ dolor ?? '—' }}</strong> · Precio: <strong>{{ precio[0] }} a {{ precio[1] }}</strong> · Sesión: <strong>{{ minutos }} min</strong></p>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-6); }
</style>
