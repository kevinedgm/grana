<script setup>
import { ref } from 'vue'

const comentario = ref('')
const nota = ref('Paciente sin alergias conocidas.')
const aviso = (nivel, max) =>
  nivel === 'limit' ? `Límite alcanzado: ${max} caracteres` : `Cerca del límite: máximo ${max} caracteres`
</script>

<template>
  <div class="demo">
    <g-textarea v-model="comentario" label="Comentario sobre la visita" counter maxlength="120" block
                hint="Cuéntanos cómo fue la atención." placeholder="Escribe aquí…" :rows="3"
                :counter-text="aviso" />
    <g-textarea v-model="nota" label="Nota clínica" autosize :rows="2" :max-rows="6" block
                variant="soft" hint="Crece con el texto hasta 6 líneas y luego se desplaza." />
    <p>{{ comentario.length }} caracteres en el comentario · {{ nota.split('\n').length }} línea(s) en la nota</p>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-4); max-width: 100%; }
</style>
