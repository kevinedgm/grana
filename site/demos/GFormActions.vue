<script setup>
import { reactive, computed, ref } from 'vue'

const vacio = { titulo: '', nota: '' }
const m = reactive({ ...vacio })
const sucio = ref(false)
const guardado = ref('')
const errores = computed(() => ({
  titulo: m.titulo.trim() ? '' : 'Escribe un título para la nota',
  nota: m.nota.trim().length >= 20 ? '' : 'La nota necesita al menos 20 caracteres'
}))
const textos = { optional: '(opcional)', error: 'Error: ', warning: 'Advertencia: ', valid: 'Correcto: ' }
const hora = () => new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
const estado = computed(() => (sucio.value ? 'Cambios sin guardar' : guardado.value))

// «Guardar borrador» lleva formnovalidate: llega aquí con novalidate y sin revelar errores
function guardar({ submitter, novalidate }) {
  const borrador = novalidate || submitter?.value === 'draft'
  guardado.value = `${borrador ? 'Borrador guardado' : 'Nota guardada'} a las ${hora()}`
  sucio.value = false
}
function restablecer() {
  Object.assign(m, vacio)
  guardado.value = ''
}
</script>

<template>
  <g-form aria-label="Nota de evolución" :errors="errores" :labels="textos" v-model:dirty="sucio" @submit="guardar" @reset="restablecer">
    <g-form-layout>
      <g-input v-model="m.titulo" label="Título" name="titulo" required />
      <g-textarea v-model="m.nota" label="Nota" name="nota" required autosize hint="Evolución, indicaciones y próximos pasos." />
    </g-form-layout>
    <!-- Secundarias antes; una sola primaria, la última. En estrecho la primaria sube a su propia línea -->
    <g-form-actions :status="estado">
      <g-btn type="reset" variant="ghost">Restablecer</g-btn>
      <g-btn type="submit" variant="outline" formnovalidate name="intent" value="draft">Guardar borrador</g-btn>
      <g-btn type="submit" name="intent" value="save">Guardar nota</g-btn>
    </g-form-actions>
  </g-form>
</template>
