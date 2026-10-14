<script setup>
import { ref, computed } from 'vue'

const correo = ref('')
const tocado = ref(false)
const clave = ref('')
const busqueda = ref('')
const enviado = ref('')

const errorCorreo = computed(() =>
  tocado.value && !/^\S+@\S+\.\S+$/.test(correo.value) ? 'Escribe un correo válido, por ejemplo ana@clinica.mx.' : ''
)
function suscribir() {
  tocado.value = true
  if (!errorCorreo.value) enviado.value = `Suscrito: ${correo.value}`
}
</script>

<template>
  <div class="demo">
    <form class="demo" @submit.prevent="suscribir">
      <g-input v-model="correo" label="Correo" type="email" required block autocomplete="email"
               hint="Te enviaremos el comprobante de tu cita." :error="errorCorreo" @blur="tocado = true">
        <template #action="{ size, density, disabled }">
          <g-btn type="submit" :size="size" :density="density" :disabled="disabled">Suscribirse</g-btn>
        </template>
      </g-input>
    </form>
    <g-input v-model="clave" label="Contraseña" type="password" block
             show-password-label="Mostrar contraseña" hide-password-label="Ocultar contraseña" />
    <g-input v-model="busqueda" label="Buscar paciente" type="search" variant="soft" block>
      <template #prepend><g-icon name="search"></g-icon></template>
    </g-input>
    <p>Correo: <strong>{{ correo || '—' }}</strong> · Búsqueda: <strong>{{ busqueda || '—' }}</strong></p>
    <p v-if="enviado">{{ enviado }}</p>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-4); max-width: 100%; }
</style>
