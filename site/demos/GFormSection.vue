<script setup>
import { reactive, computed, ref, watch } from 'vue'

const m = reactive({ nombre: '', apellidos: '', idioma: 'es', telefono: '', rfc: '', razon: '' })
const abierta = ref(false)
const fiscal = ref(false)
const estado = ref('')

const errores = computed(() => ({
  nombre: m.nombre.trim() ? '' : 'Escribe el nombre del paciente',
  apellidos: m.apellidos.trim() ? '' : 'Escribe los apellidos',
  telefono: /^\d{10}$/.test(m.telefono) ? '' : 'Escribe el teléfono a 10 dígitos',
  rfc: m.rfc.trim() ? '' : 'Escribe el RFC',
  razon: m.razon.trim() ? '' : 'Escribe la razón social'
}))
const textos = {
  optional: '(opcional)', error: 'Error: ', warning: 'Advertencia: ', valid: 'Correcto: ',
  sectionOptional: 'Opcional',
  sectionErrors: (n) => (n === 1 ? '1 error' : `${n} errores`)
}
const textosFiscales = {
  add: 'Agregar datos fiscales',
  remove: 'Quitar datos fiscales',
  removeTitle: '¿Quitar los datos fiscales?',
  removeBody: 'Se descartará lo que escribiste en esta sección.',
  removeConfirm: 'Quitar',
  removeCancel: 'Cancelar'
}
const idiomas = [{ value: 'es', label: 'Español' }, { value: 'en', label: 'English' }]
// Grana no sabe si la sección está completa: la línea de resumen la escribe la aplicación
const resumen = computed(() => `${m.idioma === 'es' ? 'Español' : 'English'}${m.telefono ? ' · ' + m.telefono : ' · sin teléfono'}`)

// update:added(false) es «el usuario quitó la sección»: el modelo es nuestro, lo vaciamos
watch(fiscal, (agregada) => { if (!agregada) Object.assign(m, { rfc: '', razon: '' }) })

function enviar({ data }) {
  estado.value = `Paciente registrado${data.has('rfc') ? ' con datos fiscales' : ''}.`
}
</script>

<template>
  <g-form aria-label="Alta de paciente" :errors="errores" :labels="textos" @submit="enviar" @invalid="estado = ''">
    <g-form-section title="Datos del paciente" description="Como aparecen en su identificación.">
      <g-form-layout>
        <g-form-row>
          <g-input v-model="m.nombre" label="Nombre" name="nombre" required autocomplete="given-name" />
          <g-input v-model="m.apellidos" label="Apellidos" name="apellidos" required autocomplete="family-name" />
        </g-form-row>
      </g-form-layout>
    </g-form-section>

    <g-form-section title="Avisos de citas" description="Cómo y dónde avisamos." mode="collapsible" v-model:open="abierta" :summary="resumen" divider>
      <template #lead><g-icon name="bell" /></template>
      <g-form-layout>
        <g-form-row>
          <g-select v-model="m.idioma" label="Idioma" name="idioma" :options="idiomas" required />
          <g-input v-model="m.telefono" label="Teléfono" name="telefono" type="tel" inputmode="numeric" required autocomplete="tel-national" />
        </g-form-row>
      </g-form-layout>
    </g-form-section>

    <g-form-section title="Datos fiscales" description="Solo si el paciente pide factura." mode="addable" :labels="textosFiscales" v-model:added="fiscal" divider>
      <g-form-layout>
        <g-form-row>
          <g-input v-model="m.rfc" class="g-form-w-sm" label="RFC" name="rfc" required />
          <g-input v-model="m.razon" class="g-form-w-lg" label="Razón social" name="razon" required />
        </g-form-row>
      </g-form-layout>
    </g-form-section>

    <g-form-actions :status="estado">
      <g-btn type="submit">Registrar paciente</g-btn>
    </g-form-actions>
  </g-form>
</template>
