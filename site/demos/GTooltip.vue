<script setup>
import { ref } from 'vue'

const ultima = ref('ninguna')
</script>

<template>
  <div class="demo">
    <!-- Controles que comparten contenedor: la etiqueta viaja de uno a otro -->
    <div class="barra" role="group" aria-label="Acciones del expediente">
      <g-btn icon variant="ghost" tooltip="Duplicar" @click="ultima = 'Duplicar'"><g-icon name="copy" /></g-btn>
      <g-btn icon variant="ghost" tooltip="Compartir" @click="ultima = 'Compartir'"><g-icon name="share-2" /></g-btn>
      <g-btn icon variant="ghost" tooltip="Imprimir" @click="ultima = 'Imprimir'"><g-icon name="printer" /></g-btn>
      <!-- Dos tiempos: primero el nombre; si el puntero se queda, crece con la descripción -->
      <g-tooltip text="Marcar para revisión" detail="Avisa al responsable del expediente">
        <g-btn icon variant="ghost" @click="ultima = 'Marcar para revisión'"><g-icon name="flag" /></g-btn>
      </g-tooltip>
      <g-btn icon variant="ghost" tooltip="Archivar" @click="ultima = 'Archivar'"><g-icon name="archive" /></g-btn>
    </div>
    <div class="fila">
      <!-- Un control que ya tiene nombre: el texto pasa a describirlo -->
      <g-tooltip text="Visible para todo el equipo de la clínica">
        <g-btn @click="ultima = 'Publicar'">Publicar</g-btn>
      </g-tooltip>
    </div>
    <p class="nota">Última acción: {{ ultima }}.</p>
  </div>
</template>

<style scoped>
.demo {
  display: grid;
  gap: var(--g-space-4);
  justify-items: start;
  padding-block-end: var(--g-space-12);
}
.barra,
.fila {
  display: flex;
  flex-wrap: wrap;
  gap: var(--g-space-1);
}
.nota {
  margin: 0;
}
</style>
