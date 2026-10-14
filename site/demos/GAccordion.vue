<script setup>
import { computed, ref } from 'vue'

const abiertos = ref([])
const correo = ref(true)
const push = ref(false)
const activas = computed(() => [correo.value, push.value].filter(Boolean).length)
const resumen = computed(() => {
  const canales = [correo.value && 'correo', push.value && 'push'].filter(Boolean)
  return canales.length ? `Recibes avisos por ${canales.join(' y ')}.` : 'No recibes avisos.'
})
function restablecer() {
  correo.value = true
  push.value = false
}
</script>

<template>
  <div class="demo">
    <g-accordion v-model="abiertos">
      <g-accordion-item
        id="demo-faq-pago" value="pago" title="¿Cómo puedo pagar?"
        peek="Aceptamos tarjeta, transferencia y pago en la primera cita."
      >
        <p>Aceptamos tarjeta, transferencia y pago en la primera cita.</p>
        <p>Si prefieres otra forma de pago, escríbenos antes de reservar.</p>
      </g-accordion-item>
      <g-accordion-item
        id="demo-faq-cancelar" value="cancelar" title="¿Puedo cancelar?" meta="Hasta 24 h antes"
        peek="Sí, sin costo hasta 24 horas antes de la cita."
      >
        <p>Sí, sin costo hasta 24 horas antes de la cita.</p>
        <p>Después de ese plazo se cobra el 50 % de la consulta.</p>
      </g-accordion-item>
      <g-accordion-item id="demo-faq-notif" value="notif" title="Notificaciones" :meta="`${activas} activas`" :peek="resumen">
        <template #actions>
          <g-btn size="sm" variant="ghost" color="neutral" @click="restablecer">Restablecer</g-btn>
        </template>
        <div class="switches">
          <g-switch v-model="correo" label="Correo"></g-switch>
          <g-switch v-model="push" label="Notificaciones push"></g-switch>
        </div>
      </g-accordion-item>
    </g-accordion>
    <p class="estado">Abiertos: {{ abiertos.length ? abiertos.join(', ') : 'ninguno' }}</p>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-3); }
.switches { display: grid; gap: var(--g-space-2); }
.estado { margin: 0; }
</style>
