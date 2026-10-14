<script setup>
import { reactive, computed, ref } from 'vue'

const m = reactive({ nombre: '', factura: null, persona: null, curp: '', razon: '', rfc: '' })
// Las reglas se calculan SIN condiciones: un bloque cerrado hace que sus campos no cuenten
const errores = computed(() => ({
  nombre: m.nombre.trim() ? '' : 'Escribe el nombre del paciente',
  factura: m.factura ? '' : 'Elige si requiere factura',
  persona: m.persona ? '' : 'Elige el tipo de persona',
  curp: m.curp.trim().length === 18 ? '' : 'La CURP tiene 18 caracteres',
  razon: m.razon.trim() ? '' : 'Escribe la razón social',
  rfc: m.rfc.trim() ? '' : 'Escribe el RFC'
}))
const textos = { optional: '(opcional)', error: 'Error: ', warning: 'Advertencia: ', valid: 'Correcto: ' }
const sino = [{ value: 'si', label: 'Sí' }, { value: 'no', label: 'No' }]
const personas = [{ value: 'fisica', label: 'Física' }, { value: 'moral', label: 'Moral' }]
const enviados = ref('')

function enviar({ data }) {
  enviados.value = 'Se enviaron: ' + [...new Set(data.keys())].join(', ')
}
</script>

<template>
  <g-form aria-label="Facturación" :errors="errores" :labels="textos" @submit="enviar" @invalid="enviados = ''">
    <g-form-layout>
      <g-input v-model="m.nombre" name="nombre" label="Nombre del paciente" required />

      <!-- La pregunta y, justo después, el bloque que condiciona -->
      <g-radio-group v-model="m.factura" name="factura" appearance="inline" label="¿Requiere factura?" :options="sino" required />
      <g-form-reveal :when="m.factura === 'si'">
        <g-radio-group v-model="m.persona" name="persona" appearance="inline" label="Tipo de persona" :options="personas" required />
        <g-form-reveal :when="m.persona === 'fisica'">
          <g-input v-model="m.curp" name="curp" label="CURP" required />
        </g-form-reveal>
        <g-form-reveal :when="m.persona === 'moral'">
          <g-input v-model="m.razon" name="razon" label="Razón social" required />
        </g-form-reveal>
        <!-- Común a las dos ramas: una sola vez, fuera de ellas -->
        <g-input v-model="m.rfc" name="rfc" label="RFC" required />
      </g-form-reveal>
    </g-form-layout>
    <g-form-actions :status="enviados">
      <g-btn type="submit">Guardar</g-btn>
    </g-form-actions>
  </g-form>
</template>
