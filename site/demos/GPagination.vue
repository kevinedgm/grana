<script setup>
import { ref, computed } from 'vue'

const pagina = ref(3)
const total = 124
const porPagina = 10
const desde = computed(() => (pagina.value - 1) * porPagina + 1)
const textos = {
  nav: 'Paginación de pedidos', previous: 'Página anterior', next: 'Página siguiente',
  page: 'Página {page}', range: '{from}–{to} de {total}', compact: 'Página {page} de {pages}'
}
</script>

<template>
  <div class="demo">
    <p>Mostrando los pedidos {{ desde }} a {{ Math.min(desde + porPagina - 1, total) }}.</p>
    <g-pagination v-model:page="pagina" :total="total" :page-size="porPagina" :labels="textos"></g-pagination>
    <p>Forma compacta (cuando no caben los botones):</p>
    <g-pagination v-model:page="pagina" :total="total" :page-size="porPagina" responsive="compact" :labels="textos"></g-pagination>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-3); }
.demo p { margin: 0; }
</style>
