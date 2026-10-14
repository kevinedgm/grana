<script setup>
import { reactive, computed, ref } from 'vue'

const m = reactive({ titular: '', tarjeta: '', vigencia: '', acepto: false })
const errores = computed(() => ({
  titular: m.titular.trim() ? '' : 'Escribe el nombre del titular como aparece en la credencial',
  tarjeta: /^\d{9}$/.test(m.tarjeta) ? '' : 'El número de afiliación tiene 9 dígitos',
  vigencia: /^(0[1-9]|1[0-2])\/\d{2}$/.test(m.vigencia) ? '' : 'Escribe la vigencia con el formato MM/AA',
  acepto: m.acepto ? '' : 'Acepta el aviso de privacidad para continuar'
}))
const textos = { optional: '(opcional)', error: 'Error: ', warning: 'Advertencia: ', valid: 'Correcto: ' }
// El título se escribe con los plurales del idioma
const resumen = { title: (n) => (n === 1 ? 'Hay 1 problema con el registro' : `Hay ${n} problemas con el registro`) }
const estado = ref('')
</script>

<template>
  <g-form aria-label="Registrar seguro" :errors="errores" :labels="textos" show-errors-on="submit" @submit="estado = 'Seguro registrado.'" @invalid="estado = ''">
    <!-- Al principio del formulario: tras un envío con errores aparece y recibe el foco -->
    <g-error-summary :labels="resumen" />
    <g-form-layout>
      <g-input v-model="m.titular" label="Titular" name="titular" required autocomplete="name" />
      <g-form-row>
        <g-input v-model="m.tarjeta" label="Número de afiliación" name="tarjeta" inputmode="numeric" required />
        <g-input v-model="m.vigencia" class="g-form-w-sm" label="Vigencia" name="vigencia" placeholder="MM/AA" required />
      </g-form-row>
      <g-checkbox v-model="m.acepto" label="Acepto el aviso de privacidad" name="acepto" required />
    </g-form-layout>
    <g-form-actions :status="estado">
      <g-btn type="submit">Registrar seguro</g-btn>
    </g-form-actions>
  </g-form>
</template>
