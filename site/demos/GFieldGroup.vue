<script setup>
import { reactive, computed, ref } from 'vue'

const m = reactive({ nombre: '', parentesco: '', telefono: '', dia: '', mes: '', anio: '' })

function fechaValida(d, mes, a) {
  const f = new Date(Number(a), Number(mes) - 1, Number(d))
  return /^\d{4}$/.test(a) && f.getFullYear() === Number(a) && f.getMonth() === Number(mes) - 1 && f.getDate() === Number(d) && f < new Date()
}
const errores = computed(() => ({
  'emer-nombre': m.nombre.trim() ? '' : 'Escribe el nombre del contacto de emergencia',
  'emer-telefono': /^\d{10}$/.test(m.telefono) ? '' : 'Escribe el teléfono del contacto a 10 dígitos',
  // Un error de la pregunta entera: un solo mensaje bajo sus partes
  nacimiento: fechaValida(m.dia, m.mes, m.anio) ? '' : 'Escribe una fecha válida, por ejemplo 27 3 1990'
}))
const textos = { optional: '(opcional)', error: 'Error: ', warning: 'Advertencia: ', valid: 'Correcto: ' }
const estado = ref('')
</script>

<template>
  <g-form aria-label="Datos personales" :errors="errores" :labels="textos" @submit="estado = 'Datos guardados.'" @invalid="estado = ''">
    <g-form-layout>
      <g-field-group label="Fecha de nacimiento" name="nacimiento" keep required hint="Por ejemplo, 27 3 1990">
        <g-input v-model="m.dia" class="g-form-w-xs" label="Día" name="nac-dia" inputmode="numeric" autocomplete="bday-day" required />
        <g-input v-model="m.mes" class="g-form-w-xs" label="Mes" name="nac-mes" inputmode="numeric" autocomplete="bday-month" required />
        <g-input v-model="m.anio" class="g-form-w-sm" label="Año" name="nac-anio" inputmode="numeric" autocomplete="bday-year" required />
      </g-field-group>
      <g-field-group label="Contacto de emergencia" name="emergencia" required hint="A quién llamamos si no podemos localizarte.">
        <g-input v-model="m.nombre" label="Nombre" name="emer-nombre" autocomplete="section-emer name" required />
        <g-input v-model="m.parentesco" class="g-form-w-sm" label="Parentesco" name="emer-parentesco" />
        <g-input v-model="m.telefono" label="Teléfono" name="emer-telefono" type="tel" inputmode="numeric" autocomplete="section-emer tel-national" required />
      </g-field-group>
    </g-form-layout>
    <g-form-actions :status="estado">
      <g-btn type="submit">Guardar</g-btn>
    </g-form-actions>
  </g-form>
</template>
