<script setup>
import { reactive } from 'vue'

const m = reactive({ rfc: '', uso: null })
const usos = [
  { value: 'D01', label: 'D01 · Honorarios médicos' },
  { value: 'G03', label: 'G03 · Gastos en general' }
]
</script>

<template>
  <!-- El ámbito fija la referencia del disparador flotante: aquí, el borde de esta región -->
  <g-helper-scope as="section" aria-label="Datos de facturación" class="ambito">
    <g-surface level="outlined" padding="lg">
      <div class="campos">
        <g-input v-model="m.rfc" label="RFC" name="rfc" autocomplete="off" />
        <g-select v-model="m.uso" label="Uso del CFDI" name="uso" :options="usos" placeholder="Elige uno" />
      </div>
    </g-surface>
    <g-helper
      mode="float"
      placement="top-end"
      attach="edge"
      content-placement="bottom-end"
      aria-label="Ayuda con la facturación"
      content-label="Ayuda con la facturación"
      close-label="Cerrar"
    >
      <template #content="{ close }">
        <p>Usa el RFC con homoclave tal como aparece en tu constancia de situación fiscal. Para consultas médicas, el uso habitual es D01.</p>
        <g-btn variant="ghost" size="sm" @click="close">Entendido</g-btn>
      </template>
    </g-helper>
  </g-helper-scope>
</template>

<style scoped>
.ambito {
  display: block;
  margin-block: var(--g-space-6) var(--g-space-2);
}
.campos {
  display: grid;
  gap: var(--g-space-4);
}
</style>
