<script setup>
import { ref } from 'vue'

const bloqueado = ref(true)
const rtl = ref(false)
</script>

<template>
  <div class="demo">
    <p class="fila">
      <g-icon :name="bloqueado ? 'lock' : 'lock-open'" class="grande"></g-icon>
      <span>{{ bloqueado ? 'Formulario bloqueado' : 'Formulario editable' }}</span>
      <g-btn
        icon variant="outline" color="neutral"
        :aria-label="bloqueado ? 'Desbloquear' : 'Bloquear'"
        :tooltip="bloqueado ? 'Desbloquear' : 'Bloquear'"
        @click="bloqueado = !bloqueado"
      ><g-icon :name="bloqueado ? 'lock-open' : 'lock'"></g-icon></g-btn>
    </p>

    <p class="fila">
      Estado de la cita:
      <g-icon name="calendar" label="Programada" class="grande"></g-icon>
      <g-icon name="bell" label="Con recordatorio" class="grande"></g-icon>
      <g-icon name="map-pin" label="Presencial" class="grande"></g-icon>
    </p>

    <g-switch v-model="rtl" label="Dirección de derecha a izquierda"></g-switch>
    <div :dir="rtl ? 'rtl' : 'ltr'" class="fila">
      <g-btn variant="outline"><template #prepend><g-icon name="arrow-left" flip-rtl></g-icon></template>Anterior</g-btn>
      <g-btn>Continuar<template #append><g-icon name="arrow-right" flip-rtl></g-icon></template></g-btn>
    </div>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-4); }
.fila { display: flex; flex-wrap: wrap; align-items: center; gap: var(--g-space-2); margin: 0; }
.grande { font-size: var(--g-text-title-sm-size); }
</style>
