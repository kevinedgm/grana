<script setup>
import { computed, ref } from 'vue'

const email = ref('')
const password = ref('')
const emailError = ref('')
const passwordError = ref('')
const isSubmitting = ref(false)
const message = ref('')
const theme = ref('system')

const canSubmit = computed(() => email.value && password.value)

function validate() {
  emailError.value = email.value.includes('@') ? '' : 'Escribe un correo válido.'
  passwordError.value = password.value.length >= 8 ? '' : 'La contraseña debe tener al menos 8 caracteres.'
  return !emailError.value && !passwordError.value
}

function setTheme(value) {
  theme.value = value
  if (value === 'system') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', value)
  }
}

async function submit() {
  message.value = ''
  if (!validate()) return

  isSubmitting.value = true
  await new Promise((resolve) => setTimeout(resolve, 900))
  isSubmitting.value = false
  message.value = 'Sesión iniciada. El flujo completo ya funciona con los componentes y tokens de Grana.'
}
</script>

<template>
  <main class="starter">
    <header class="starter__header">
      <div>
        <p class="starter__eyebrow">Grana Starter</p>
        <h1>Una integración pequeña, pero real.</h1>
        <p class="starter__intro">
          Login, validación, carga, feedback y tema claro u oscuro usando los mismos tokens.
        </p>
      </div>

      <label class="starter__theme">
        Tema
        <select :value="theme" @change="setTheme($event.target.value)">
          <option value="system">Sistema</option>
          <option value="light">Claro</option>
          <option value="dark">Oscuro</option>
        </select>
      </label>
    </header>

    <section class="starter__card" aria-labelledby="login-title">
      <p class="starter__eyebrow">Bienvenido</p>
      <h2 id="login-title">Inicia sesión</h2>
      <p class="starter__copy">Usa cualquier correo válido y una contraseña de ocho caracteres.</p>

      <form class="starter__form" @submit.prevent="submit">
        <g-input
          v-model="email"
          label="Correo"
          type="email"
          autocomplete="email"
          required
          :error="emailError"
          hint="Te enviaremos un comprobante si el acceso se completa."
          @blur="validate"
        />

        <g-input
          v-model="password"
          label="Contraseña"
          type="password"
          autocomplete="current-password"
          required
          :error="passwordError"
          show-password-label="Mostrar contraseña"
          hide-password-label="Ocultar contraseña"
          @blur="validate"
        />

        <g-btn
          type="submit"
          block
          :disabled="!canSubmit"
          :loading="isSubmitting"
          loading-text="Iniciando sesión"
        >
          Iniciar sesión
        </g-btn>

        <p v-if="message" class="starter__message" role="status">{{ message }}</p>
      </form>
    </section>
  </main>
</template>
