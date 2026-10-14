<script setup>
import { ref } from 'vue'

const folio = ref('')
const vista = ref('cerrada')
</script>

<template>
  <div class="demo">
    <div class="encabezado">
      <p class="titulo">Receta electrónica</p>
      <!-- En línea, junto a lo que explica: el contenido se abre en la capa superior -->
      <g-helper
        aria-label="Dónde encontrar el folio"
        content-label="Dónde encontrar el folio"
        close-label="Cerrar"
        @toggle="vista = $event.open ? `abierta como ${$event.presentation === 'sheet' ? 'hoja' : 'popover'}` : 'cerrada'"
      >
        <template #content="{ close }">
          <p>El folio está en la esquina superior derecha de la receta impresa, junto al código QR. Son diez caracteres.</p>
          <g-btn variant="ghost" size="sm" @click="close">Entendido</g-btn>
        </template>
      </g-helper>
    </div>
    <g-input v-model="folio" label="Folio de la receta" name="folio" hint="Diez caracteres, sin guiones." />
    <p class="nota">Ayuda {{ vista }}.</p>
  </div>
</template>

<style scoped>
.demo {
  display: grid;
  gap: var(--g-space-4);
}
.encabezado {
  display: flex;
  align-items: center;
  gap: var(--g-space-2);
}
.titulo,
.nota {
  margin: 0;
}
.titulo {
  font-weight: var(--g-text-title-weight);
}
</style>
