<script setup>
import { ref, computed } from 'vue'

const metricas = [
  { value: 'pendiente', title: 'Pendientes', n: 8 },
  { value: 'vencida',   title: 'Vencidas',   n: 4 },
  { value: 'pagada',    title: 'Pagadas',    n: 10 },
  { value: 'en_disputa', title: 'En disputa', n: 2 }
]

const FILAS = [
  { id: 1, cliente: 'Ana Torres',  importe: '$1 200', estado: 'pendiente' },
  { id: 2, cliente: 'Bruno Díaz',  importe: '$850',   estado: 'vencida'   },
  { id: 3, cliente: 'Carla Ruiz',  importe: '$3 400', estado: 'pagada'    },
  { id: 4, cliente: 'Diego Mora',  importe: '$2 100', estado: 'pendiente' },
  { id: 5, cliente: 'Elena Vega',  importe: '$670',   estado: 'en_disputa'},
  { id: 6, cliente: 'Fabián Soto', importe: '$5 000', estado: 'pagada'    },
  { id: 7, cliente: 'Gina Paz',    importe: '$930',   estado: 'vencida'   },
  { id: 8, cliente: 'Hugo León',   importe: '$1 750', estado: 'pendiente' },
]

const columnas = [
  { key: 'cliente', label: 'Cliente' },
  { key: 'importe', label: 'Importe', align: 'end' },
  { key: 'estado',  label: 'Estado'  }
]

const textos = {
  caption: 'Facturas',
  empty: 'Sin facturas',
  emptyFiltered: 'No hay facturas con este estado',
  clearFilters: 'Limpiar filtros',
  results: '{count} resultados',
  loading: 'Cargando facturas…',
  failed: 'No se cargaron.',
  retry: 'Reintentar',
  selectedCount: '{count} seleccionadas',
  selectAll: 'Seleccionar todo',
  selectRow: 'Seleccionar {title}',
  actionsHeader: 'Acciones',
  rowActions: 'Acciones de {title}',
  sortBy: 'Ordenar',
  ascending: 'ascendente',
  descending: 'descendente',
  sorted: 'Ordenado por {label}, {direction}',
  filters: {
    group: 'Filtros', add: 'Agregar', clear: 'Limpiar', filterBy: 'Filtrar por {label}',
    edit: 'Editar {summary}', remove: 'Quitar {summary}', apply: 'Aplicar', cancel: 'Cancelar',
    required: 'Indica un valor.', range: '«Desde» debe ser menor que «hasta».',
    rule: 'Regla', value: 'Valor', from: 'Desde', to: 'Hasta', and: 'y', days: '{n} días', results: '{count} resultados',
    ops: { contains: 'contiene', is: 'es', starts: 'empieza por', gt: 'mayor que', lt: 'menor que', eq: 'igual a', between: 'entre', after: 'después de', before: 'antes de', last: 'últimos', in: 'es cualquiera de' }
  }
}

const filtros = ref([])

const estado = computed({
  get: () => {
    const f = filtros.value.find((x) => x.key === 'estado' && x.op === 'in')
    return f && f.value.length === 1 ? f.value[0] : null
  },
  set: (v) => {
    const rest = filtros.value.filter((x) => x.key !== 'estado')
    filtros.value = v == null ? rest : [...rest, { key: 'estado', op: 'in', value: [v] }]
  }
})

const cardLabels = { loading: 'Cargando', loaded: 'Listo' }
</script>

<template>
  <g-card-group v-model="estado" label="Filtrar facturas por estado">
    <g-card
      v-for="m in metricas"
      :key="m.value"
      :value="m.value"
      :title="m.title"
      :labels="cardLabels"
    >
      <g-metric :value="m.n" label="facturas" />
    </g-card>
    <template #panel="{ filtered }">
      <g-table
        :columns="columnas"
        :rows="FILAS"
        :labels="textos"
        v-model:filters="filtros"
      />
    </template>
  </g-card-group>
</template>
