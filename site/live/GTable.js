// Ficha interactiva de GTable. Controles desde GTable.meta.json.
import { h } from 'vue'
import { GBadge, GBtn, GIcon, GMenu } from '@grana/vue'

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

const labels = {
  selectAll: 'Seleccionar todo', selectRow: 'Seleccionar {title}', rowActions: 'Acciones de {title}', actionsHeader: 'Acciones',
  selectedCount: '{count} seleccionados', sortBy: 'Ordenar por', ascending: 'ascendente', descending: 'descendente',
  sorted: 'Ordenado por {label}, {direction}', loading: 'Cargando clientes…', empty: 'Sin clientes todavía.',
  emptyFiltered: 'Ningún cliente cumple estos filtros.', clearFilters: 'Limpiar filtros', results: '{count} resultados',
  slow: 'Sigue cargando clientes…', range: '{from}–{to} de {total}',
  failed: 'No se pudieron cargar los clientes.', retry: 'Reintentar', detail: 'Ficha de {title}',
  filters: {
    group: 'Filtros de clientes', add: 'Agregar filtro', clear: 'Limpiar filtros', filterBy: 'Filtrar por {label}',
    edit: 'Editar filtro: {summary}', remove: 'Quitar filtro: {summary}', apply: 'Aplicar', cancel: 'Cancelar',
    required: 'Indica un valor para aplicar el filtro.', range: '«Desde» debe ser menor o igual que «hasta».',
    rule: 'Regla', value: 'Valor', from: 'Desde', to: 'Hasta', and: 'y', days: '{n} días', results: '{count} resultados',
    ops: { contains: 'contiene', is: 'es', starts: 'empieza por', gt: 'mayor que', lt: 'menor que', eq: 'igual a', between: 'entre', after: 'después de', before: 'antes de', last: 'últimos', in: 'es cualquiera de' }
  },
  pagination: { nav: 'Paginación de clientes', previous: 'Página anterior', next: 'Página siguiente', page: 'Página {page}', range: '{from}–{to} de {total}', compact: 'Página {page} de {pages}', pageSize: 'Filas por página' }
}

export default {
  exclude: ['sortMode', 'filterMode', 'announceError', 'rowKey'],
  controls: ['appearance', 'density', 'responsive', 'selectable', 'loading', 'error', 'activatable'],
  text: ['caption'],
  block: true,
  model: { prop: 'selected', value: [], var: 'elegidos' },
  // Los otros tres v-model de la tabla: orden, filtros y página quedan ligados y se ven al cambiar.
  models: [
    { prop: 'sort', value: null, var: 'orden' },
    { prop: 'filters', value: [], var: 'filtros' },
    { prop: 'page', value: 1, var: 'pagina' }
  ],
  base: {
    caption: { es: 'Clientes', en: 'Customers' },
    columns: columnas,
    rows: clientes,
    pageSize: 5,
    labels
  },
  slots: [
    {
      name: 'cell-estado',
      scope: '{ value }',
      code: '<g-badge variant="soft" :color="colores[value]" size="sm">{{ value }}</g-badge>',
      render: ({ value }) => h(GBadge, { variant: 'soft', color: colores[value], size: 'sm' }, () => value)
    },
    {
      name: 'row-actions',
      scope: '{ row }',
      code: `<g-menu :items="acciones">
  <template #trigger="{ attrs }">
    <g-btn v-bind="attrs" variant="ghost" size="sm" icon :aria-label="'Acciones de ' + row.nombre">
      <g-icon name="ellipsis-vertical" />
    </g-btn>
  </template>
</g-menu>`,
      render: ({ row }) => h(GMenu, { items: acciones }, {
        trigger: ({ attrs }) => h(GBtn, { ...attrs, variant: 'ghost', size: 'sm', icon: true, 'aria-label': 'Acciones de ' + row.nombre }, () => h(GIcon, { name: 'ellipsis-vertical' }))
      })
    }
  ],
  script: "const colores = { activo: 'success', pausado: 'warning', vencido: 'danger' }\nconst acciones = [{ id: 'ver', label: 'Ver ficha' }, { id: 'cobrar', label: 'Enviar cobro' }]",
  code: { columns: ':columns="columnas"', rows: ':rows="clientes"', labels: ':labels="textos"' },
  cases: [
    {
      title: { es: 'Lista de clientes con selección', en: 'Customer list with selection' },
      why: { es: 'selectable para acciones en lote; cada fila lleva el nombre como título, así los lectores de pantalla anuncian «Seleccionar Ana Torres». En estrecho pasa a tarjetas con su casilla.', en: 'selectable for bulk actions; each row uses the name as title, so screen readers announce “Select Ana Torres”. When narrow it turns into cards with their checkbox.' },
      props: { selectable: true }
    },
    {
      title: { es: 'Carga inicial con filas esqueleto', en: 'First load with skeleton rows' },
      why: { es: 'loading muestra filas del tamaño real tras 200 ms; en vez de un spinner, la tabla no salta al llegar los datos.', en: 'loading shows real-size rows after 200 ms; instead of a spinner, the table does not jump when data arrives.' },
      props: { loading: true, rows: [] }
    },
    {
      title: { es: 'Sin filas todavía', en: 'No rows yet' },
      why: { es: 'rows vacío pinta labels.empty; si es la tabla filtrada a cero, el mensaje es otro (emptyFiltered) con «Limpiar filtros».', en: 'Empty rows paints labels.empty; if the table is filtered down to zero, the message differs (emptyFiltered) with “Clear filters”.' },
      props: { rows: [] }
    },
    {
      title: { es: 'Fallo al cargar', en: 'Failed to load' },
      why: { es: 'error con las filas de antes las conserva y muestra la barra con «Reintentar»; con tu evento retry vuelves a pedir los datos.', en: 'error with earlier rows keeps them and shows the bar with “Retry”; your retry event asks for the data again.' },
      props: { error: true }
    },
    {
      title: { es: 'Estado de fila con lomo de color', en: 'Row status with a colored edge' },
      why: { es: 'rowStatus marca la fila con data-status y una etiqueta; úsalo para lo que pide atención (vencido), no para decorar todas.', en: 'rowStatus marks the row with data-status and a badge; use it for what needs attention (overdue), not to decorate every row.' },
      props: { rowStatus: (r) => (r.estado === 'vencido' ? { status: 'error', text: 'Vencido', key: 'estado' } : null) }
    },
    {
      title: { es: 'Tarjetas en contenedores estrechos', en: 'Cards in narrow containers' },
      why: { es: 'responsive «cards» fuerza las tarjetas; con «auto» la tabla ya se convierte sola cuando el contenedor es estrecho.', en: 'responsive “cards” forces cards; with “auto” the table already switches by itself when the container is narrow.' },
      props: { responsive: 'cards', appearance: 'surface' }
    }
  ]
}
