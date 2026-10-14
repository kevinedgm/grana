<script setup>
import { ref, computed } from 'vue'

const vendidos = ref(36)
const meta = 50
const color = computed(() => (vendidos.value >= meta ? 'success' : vendidos.value < 15 ? 'warning' : 'brand'))
const sumar = (n) => { vendidos.value = Math.min(meta, Math.max(0, vendidos.value + n)) }
</script>

<template>
  <div class="demo">
    <g-progress :value="vendidos" :max="meta" label="Meta de ventas de octubre"
                :value-text="vendidos + ' de ' + meta + ' pólizas'" :color="color"></g-progress>
    <g-progress :value="82" label="Almacenamiento usado" value-text="8.2 de 10 GB" color="info" size="sm"></g-progress>
    <div class="acciones">
      <g-btn variant="outline" size="sm" :disabled="vendidos === 0" @click="sumar(-5)">Restar 5</g-btn>
      <g-btn size="sm" :disabled="vendidos === meta" @click="sumar(5)">Sumar 5</g-btn>
    </div>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-4); }
.acciones { display: flex; gap: var(--g-space-2); }
</style>
