<script setup>
import { ref, computed } from 'vue'

const pais = ref('+52')
const numero = ref('')
const sistolica = ref('')
const diastolica = ref('')
const unidad = ref('C')
const temp = ref('')

const paises = [
  { value: '+52', label: 'MX +52' },
  { value: '+1', label: 'US +1' },
  { value: '+34', label: 'ES +34' }
]
const unidades = [{ value: 'C', label: '°C' }, { value: 'F', label: '°F' }]
const errorTel = computed(() => (numero.value && numero.value.replace(/\D/g, '').length < 10 ? 'Escribe los 10 dígitos del número.' : ''))
</script>

<template>
  <div class="demo">
    <g-input-group label="Teléfono" name="telefono" hint="Código de país y número, como un solo dato." :error="errorTel" style="--g-form-min: 50">
      <g-input-group-select v-model="pais" name="tel-pais" part-label="Código de país" :options="paises" autocomplete="tel-country-code" />
      <g-input-group-input v-model="numero" name="tel-numero" principal type="tel" autocomplete="tel-national" placeholder="951 123 4567" />
    </g-input-group>

    <g-input-group label="Presión arterial" name="presion" style="--g-form-min: 38">
      <g-input-group-input v-model="sistolica" name="pa-sistolica" principal part-label="sistólica" inputmode="numeric" placeholder="120" />
      <g-input-group-text text="/" decorative />
      <g-input-group-input v-model="diastolica" name="pa-diastolica" part-label="diastólica" inputmode="numeric" placeholder="80" />
      <g-input-group-text text="mmHg" label="milímetros de mercurio" />
    </g-input-group>

    <g-input-group label="Temperatura" name="temp" style="--g-form-min: 38">
      <g-input-group-input v-model="temp" name="temp" principal inputmode="decimal" placeholder="36.5" />
      <g-input-group-select v-model="unidad" name="temp-unidad" part-label="Unidad" :options="unidades" />
    </g-input-group>

    <p>Teléfono: <strong>{{ pais }} {{ numero || '—' }}</strong> · Presión: <strong>{{ sistolica || '—' }}/{{ diastolica || '—' }}</strong> · Temp.: <strong>{{ temp || '—' }} °{{ unidad }}</strong></p>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-4); max-width: 100%; }
</style>
