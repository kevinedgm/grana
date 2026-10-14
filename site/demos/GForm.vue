<script setup>
import { reactive, computed, ref } from 'vue'

const vacio = { nombre: '', apellido: '', correo: '', motivo: null, notas: '' }
const m = reactive({ ...vacio })
// Las reglas son de la aplicación: GForm solo decide cuándo enseñar los mensajes
const errores = computed(() => ({
  nombre: m.nombre.trim() ? '' : 'Escribe tu nombre',
  apellido: m.apellido.trim() ? '' : 'Escribe tu apellido',
  correo: /.+@.+\..+/.test(m.correo) ? '' : 'Escribe el correo con el formato nombre@dominio.com',
  motivo: m.motivo ? '' : 'Elige el motivo de la cita'
}))
const textos = { optional: '(opcional)', error: 'Error: ', warning: 'Advertencia: ', valid: 'Correcto: ' }
const resumen = { title: (n) => (n === 1 ? 'Hay 1 problema con la solicitud' : `Hay ${n} problemas con la solicitud`) }
const motivos = [
  { value: 'primera', label: 'Primera consulta' },
  { value: 'seguimiento', label: 'Seguimiento' },
  { value: 'resultados', label: 'Revisión de resultados' }
]
const estado = ref('')

function enviar({ data }) {
  estado.value = `Solicitud enviada a nombre de ${data.get('nombre')} ${data.get('apellido')}.`
}
function restablecer() {
  Object.assign(m, vacio)
  estado.value = ''
}
</script>

<template>
  <g-form aria-label="Solicitar cita" :errors="errores" :labels="textos" @submit="enviar" @invalid="estado = ''" @reset="restablecer">
    <g-error-summary :labels="resumen" />
    <g-form-layout>
      <g-form-row>
        <g-input v-model="m.nombre" label="Nombre" name="nombre" required autocomplete="given-name" />
        <g-input v-model="m.apellido" label="Apellido" name="apellido" required autocomplete="family-name" />
      </g-form-row>
      <g-form-row>
        <g-input v-model="m.correo" label="Correo" name="correo" type="email" required autocomplete="email" />
        <g-select v-model="m.motivo" label="Motivo" name="motivo" :options="motivos" placeholder="Elige uno" required />
      </g-form-row>
      <g-textarea v-model="m.notas" label="Notas para la clínica" name="notas" hint="Alergias, horarios que te convienen…" />
    </g-form-layout>
    <g-form-actions :status="estado">
      <g-btn type="reset" variant="ghost">Restablecer</g-btn>
      <g-btn type="submit">Solicitar cita</g-btn>
    </g-form-actions>
  </g-form>
</template>
