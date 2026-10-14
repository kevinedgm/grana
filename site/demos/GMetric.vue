<script setup>
import { ref, computed } from 'vue'

const periodo = ref('mes')
const datos = {
  mes: { ingresos: '$48.2k', ing: '+12%', dirIng: 'up', costos: '$19.4k', cos: '+8%', dirCos: 'up', clientes: '1,284', cli: '0%', dirCli: 'flat', ctx: 'vs. mes anterior' },
  trimestre: { ingresos: '$131.7k', ing: '−4%', dirIng: 'down', costos: '$55.0k', cos: '−6%', dirCos: 'down', clientes: '1,310', cli: '+3%', dirCli: 'up', ctx: 'vs. trimestre anterior' }
}
const d = computed(() => datos[periodo.value])
const cambiar = () => { periodo.value = periodo.value === 'mes' ? 'trimestre' : 'mes' }
</script>

<template>
  <div class="demo">
    <g-btn variant="outline" size="sm" @click="cambiar">Ver {{ periodo === 'mes' ? 'trimestre' : 'mes' }}</g-btn>
    <div class="fila">
      <g-metric label="Ingresos" :value="d.ingresos" unit="MXN" :trend="d.ing" :direction="d.dirIng"
                :trend-color="d.dirIng === 'up' ? 'success' : 'danger'" :context="d.ctx" size="lg"></g-metric>
      <!-- Una subida de costos es mala noticia: direction dice hacia dónde, trendColor si es bueno o malo -->
      <g-metric label="Costos" :value="d.costos" unit="MXN" :trend="d.cos" :direction="d.dirCos"
                :trend-color="d.dirCos === 'up' ? 'danger' : 'success'" :context="d.ctx"></g-metric>
      <g-metric label="Clientes activos" :value="d.clientes" :trend="d.cli" :direction="d.dirCli" :context="d.ctx"></g-metric>
    </div>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-4); justify-items: start; }
.fila { display: flex; flex-wrap: wrap; gap: var(--g-space-6); }
</style>
