<script setup>
import { ref, computed } from 'vue'

const pedidos = [
  { id: 1, cliente: 'Ana Torres', estado: 'pagado', total: 1850 },
  { id: 2, cliente: 'Bruno Díaz', estado: 'pendiente', total: 4200 },
  { id: 3, cliente: 'Carla Ruiz', estado: 'enviado', total: 760 },
  { id: 4, cliente: 'Diego Mora', estado: 'pagado', total: 5300 },
  { id: 5, cliente: 'Elena Vega', estado: 'cancelado', total: 2100 },
  { id: 6, cliente: 'Fabián Soto', estado: 'pendiente', total: 3150 }
]
const campos = [
  { key: 'estado', label: 'Estado', filter: { type: 'enum', options: ['pendiente', 'pagado', 'enviado', 'cancelado'], suggest: true } },
  { key: 'total', label: 'Total', filter: { type: 'number', unit: '$', suggest: true } },
  { key: 'cliente', label: 'Cliente', filter: { type: 'text' } }
]
const filtros = ref([{ key: 'estado', op: 'in', value: ['pendiente', 'pagado'] }])

// La barra solo produce el modelo; aplicarlo es de la aplicación (o de tu servidor).
const cumple = (p, f) => {
  const v = p[f.key]
  if (f.op === 'in') return f.value.includes(v)
  if (f.op === 'gt') return v > f.value
  if (f.op === 'lt') return v < f.value
  if (f.op === 'eq') return v === f.value
  if (f.op === 'between') return v >= f.value[0] && v <= f.value[1]
  const t = String(v).toLowerCase(), q = String(f.value).toLowerCase()
  return f.op === 'is' ? t === q : f.op === 'starts' ? t.startsWith(q) : t.includes(q)
}
const resultado = computed(() => pedidos.filter((p) => filtros.value.every((f) => cumple(p, f))))

const textos = {
  group: 'Filtros de pedidos', add: 'Agregar filtro', clear: 'Limpiar filtros', filterBy: 'Filtrar por {label}',
  edit: 'Editar filtro: {summary}', remove: 'Quitar filtro: {summary}', apply: 'Aplicar', cancel: 'Cancelar',
  required: 'Indica un valor para aplicar el filtro.', range: '«Desde» debe ser menor o igual que «hasta».',
  rule: 'Regla', value: 'Valor', from: 'Desde', to: 'Hasta', and: 'y', days: '{n} días', results: '{count} pedidos',
  ops: { contains: 'contiene', is: 'es', starts: 'empieza por', gt: 'mayor que', lt: 'menor que', eq: 'igual a', between: 'entre', after: 'después de', before: 'antes de', last: 'últimos', in: 'es cualquiera de' }
}
</script>

<template>
  <div class="demo">
    <g-filter-bar :fields="campos" v-model:filters="filtros" :count="resultado.length" :labels="textos"></g-filter-bar>
    <ul class="lista">
      <li v-for="p in resultado" :key="p.id">{{ p.cliente }} · {{ p.estado }} · ${{ p.total.toLocaleString('es-MX') }}</li>
    </ul>
    <p><small>Modelo: <code>{{ JSON.stringify(filtros) }}</code></small></p>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-3); }
.lista { margin: 0; padding-inline-start: var(--g-space-5); }
.demo p { margin: 0; overflow-wrap: anywhere; }
</style>
