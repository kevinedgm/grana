<script setup>
import { ref } from 'vue'

const nombres = ['Ana Torres', 'Bruno Díaz', 'Carla Ruiz', 'Diego Mora', 'Elena Vega', 'Fabián Soto', 'Gina Paz', 'Hugo León']
const clientes = nombres.map((n, i) => ({
  id: 'c' + i,
  nombre: n,
  correo: n.split(' ')[0].toLowerCase() + '@correo.mx',
  iniciales: n.split(' ').map((p) => p[0]).join(''),
  plan: ['Básico', 'Pro', 'Equipo'][i % 3],
  estado: ['activo', 'pausado', 'vencido'][i % 3],
  total: 1200 + ((i * 731) % 5000)
}))
const columnas = [
  { key: 'cliente', label: 'Cliente', leading: 'iniciales', title: 'nombre', subtitle: 'correo', sortable: true, filter: { type: 'text' } },
  { key: 'plan', label: 'Plan', sortable: true, filter: { type: 'enum', options: ['Básico', 'Pro', 'Equipo'] } },
  { key: 'estado', label: 'Estado', filter: { type: 'enum', options: ['activo', 'pausado', 'vencido'], suggest: true } },
  { key: 'total', label: 'Total', align: 'end', sortable: true, format: (v) => '$' + v.toLocaleString('es-MX'), filter: { type: 'number', unit: '$', suggest: true } }
]
const colores = { activo: 'success', pausado: 'warning', vencido: 'danger' }
const acciones = [{ id: 'ver', label: 'Ver ficha' }, { id: 'cobrar', label: 'Enviar cobro' }]
const orden = ref(null)
const elegidos = ref([])
const filtros = ref([])
const pagina = ref(1)
const ultima = ref('ninguna')

const textos = {
  selectAll: 'Seleccionar todo', selectRow: 'Seleccionar {title}', rowActions: 'Acciones de {title}', actionsHeader: 'Acciones',
  selectedCount: '{count} seleccionados', sortBy: 'Ordenar por', ascending: 'ascendente', descending: 'descendente',
  sorted: 'Ordenado por {label}, {direction}', loading: 'Cargando clientes…', empty: 'Sin clientes todavía.',
  emptyFiltered: 'Ningún cliente cumple estos filtros.', clearFilters: 'Limpiar filtros', results: '{count} resultados',
  failed: 'No se pudieron cargar los clientes.', retry: 'Reintentar',
  filters: {
    group: 'Filtros de clientes', add: 'Agregar filtro', clear: 'Limpiar filtros', filterBy: 'Filtrar por {label}',
    edit: 'Editar filtro: {summary}', remove: 'Quitar filtro: {summary}', apply: 'Aplicar', cancel: 'Cancelar',
    required: 'Indica un valor para aplicar el filtro.', range: '«Desde» debe ser menor o igual que «hasta».',
    rule: 'Regla', value: 'Valor', from: 'Desde', to: 'Hasta', and: 'y', days: '{n} días', results: '{count} resultados',
    ops: { contains: 'contiene', is: 'es', starts: 'empieza por', gt: 'mayor que', lt: 'menor que', eq: 'igual a', between: 'entre', after: 'después de', before: 'antes de', last: 'últimos', in: 'es cualquiera de' }
  },
  pagination: { nav: 'Paginación de clientes', previous: 'Página anterior', next: 'Página siguiente', page: 'Página {page}', range: '{from}–{to} de {total}', compact: 'Página {page} de {pages}' }
}
</script>

<template>
  <g-table :columns="columnas" :rows="clientes" caption="Clientes" selectable :page-size="5" :labels="textos"
           v-model:sort="orden" v-model:selected="elegidos" v-model:filters="filtros" v-model:page="pagina">
    <template #cell-estado="{ value }"><g-badge variant="soft" :color="colores[value]" size="sm">{{ value }}</g-badge></template>
    <template #row-actions="{ row }">
      <g-menu :items="acciones" @select="(e) => (ultima = e.item.label + ' · ' + row.nombre)">
        <template #trigger="{ attrs }">
          <g-btn v-bind="attrs" variant="ghost" size="sm" icon :aria-label="'Acciones de ' + row.nombre"><g-icon name="ellipsis-vertical"></g-icon></g-btn>
        </template>
      </g-menu>
    </template>
  </g-table>
  <p>Seleccionados: {{ elegidos.length }} · Última acción: {{ ultima }}</p>
</template>
