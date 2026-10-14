<script setup>
import { ref, computed } from 'vue'

const acepto = ref(false)
const intento = ref(false)
const errorTerminos = computed(() => (intento.value && !acepto.value ? 'Debes aceptar el aviso de privacidad.' : ''))

const extras = ref(['recordatorio'])
const opciones = ['recordatorio', 'receta', 'factura']
const adicionales = ref(['prioridad'])
const todas = computed({
  get: () => opciones.every((o) => extras.value.includes(o)),
  set: (v) => { extras.value = v ? [...opciones] : [] }
})
const algunas = computed(() => !todas.value && opciones.some((o) => extras.value.includes(o)))
</script>

<template>
  <div class="demo">
    <g-checkbox v-model="acepto" label="Acepto el aviso de privacidad" required :error="errorTerminos" />
    <g-btn size="sm" variant="soft" @click="intento = true">Confirmar cita</g-btn>

    <div class="demo__grupo">
      <g-checkbox v-model="todas" :indeterminate="algunas" label="Todas las opciones" />
      <g-checkbox v-model="extras" value="recordatorio" label="Recordatorio por mensaje" />
      <g-checkbox v-model="extras" value="receta" label="Receta digital" />
      <g-checkbox v-model="extras" value="factura" label="Factura automática" />
    </div>

    <g-checkbox v-model="adicionales" value="envio" layout="card" label="Envío a domicilio" hint="Llega en 24 horas.">
      <template #icon><g-icon name="truck" /></template>
      <template #meta>$99</template>
    </g-checkbox>
    <g-checkbox v-model="adicionales" value="prioridad" layout="chip" label="Prioridad" />

    <p>Aceptado: <strong>{{ acepto ? 'sí' : 'no' }}</strong> · Elegidas: <strong>{{ [...extras, ...adicionales].join(', ') || '—' }}</strong></p>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-4); justify-items: start; }
.demo__grupo { display: grid; gap: var(--g-space-2); }
</style>
