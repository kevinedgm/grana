// Ficha interactiva de GFilterBar. Controles desde GFilterBar.meta.json (solo fields, filters y count).
// El anfitrión hace lo que la aplicación haría: aplica el modelo `filters` a sus datos y pasa el recuento.
import { computed, defineComponent, h } from 'vue'
import { GFilterBar } from '@grana/vue'

const en = () => typeof document !== 'undefined' && document.documentElement.lang.startsWith('en')

const DATA = {
  es: [
    { cliente: 'Ana Torres', correo: 'ana@clinica.mx', estado: 'pagado', total: 1850, alta: '2026-10-02' },
    { cliente: 'Bruno Díaz', correo: 'bruno@correo.mx', estado: 'pendiente', total: 4200, alta: '2026-10-21' },
    { cliente: 'Carla Ruiz', correo: 'carla@lab.mx', estado: 'enviado', total: 760, alta: '2026-09-14' },
    { cliente: 'Diego Mora', correo: 'diego@correo.mx', estado: 'pagado', total: 5300, alta: '2026-10-28' },
    { cliente: 'Elena Vega', correo: 'elena@clinica.mx', estado: 'cancelado', total: 2100, alta: '2026-08-30' },
    { cliente: 'Fabián Soto', correo: 'fabian@lab.mx', estado: 'pendiente', total: 3150, alta: '2026-10-25' }
  ],
  en: [
    { cliente: 'Ana Torres', correo: 'ana@clinic.com', estado: 'paid', total: 1850, alta: '2026-10-02' },
    { cliente: 'Bruno Díaz', correo: 'bruno@mail.com', estado: 'pending', total: 4200, alta: '2026-10-21' },
    { cliente: 'Carla Ruiz', correo: 'carla@lab.com', estado: 'shipped', total: 760, alta: '2026-09-14' },
    { cliente: 'Diego Mora', correo: 'diego@mail.com', estado: 'paid', total: 5300, alta: '2026-10-28' },
    { cliente: 'Elena Vega', correo: 'elena@clinic.com', estado: 'cancelled', total: 2100, alta: '2026-08-30' },
    { cliente: 'Fabián Soto', correo: 'fabian@lab.com', estado: 'pending', total: 3150, alta: '2026-10-25' }
  ]
}

function fieldsOf(es) {
  const estado = es
    ? { key: 'estado', label: 'Estado', filter: { type: 'enum', options: ['pendiente', 'pagado', 'enviado', 'cancelado'], suggest: true } }
    : { key: 'estado', label: 'Status', filter: { type: 'enum', options: ['pending', 'paid', 'shipped', 'cancelled'], suggest: true } }
  const total = { key: 'total', label: 'Total', filter: { type: 'number', unit: '$', suggest: true } }
  const alta = { key: 'alta', label: es ? 'Alta' : 'Created', filter: { type: 'date' } }
  const cliente = { key: 'cliente', label: es ? 'Cliente' : 'Customer', filter: { type: 'text' } }
  const buscar = { key: 'cliente', label: es ? 'Cliente' : 'Customer', filter: { type: 'text', fields: ['cliente', 'correo'] } }
  return { basic: [estado, total, cliente], dates: [estado, total, alta], search: [estado, buscar] }
}
const FIELDS = { es: fieldsOf(true), en: fieldsOf(false) }
const fieldsCase = (kind) => ({ es: FIELDS.es[kind], en: FIELDS.en[kind] })

// Motor mínimo de la aplicación: Grana solo produce el modelo.
const DAY = 86400000
function cumple(row, f, fields) {
  const v = row[f.key]
  const keys = fields.find((x) => x.key === f.key)?.filter?.fields || [f.key]
  if (f.op === 'in') return f.value.includes(v)
  if (f.op === 'gt') return v > f.value
  if (f.op === 'lt') return v < f.value
  if (f.op === 'eq') return v === f.value
  if (f.op === 'between') return v >= f.value[0] && v <= f.value[1]
  if (f.op === 'after') return v > f.value
  if (f.op === 'before') return v < f.value
  if (f.op === 'last') return Date.now() - new Date(v).getTime() <= f.value * DAY
  const q = String(f.value).toLowerCase()
  return keys.some((k) => {
    const t = String(row[k]).toLowerCase()
    return f.op === 'is' ? t === q : f.op === 'starts' ? t.startsWith(q) : t.includes(q)
  })
}

const Host = defineComponent({
  name: 'GranaLiveFilterBar',
  inheritAttrs: false,
  setup(_, { attrs }) {
    const rows = computed(() => DATA[en() ? 'en' : 'es'].filter((r) => (attrs.filters || []).every((f) => cumple(r, f, attrs.fields || []))))
    return () => [
      h(GFilterBar, { ...attrs, count: rows.value.length }),
      h('ul', { class: 'g-m-0 g-mt-3', style: { paddingInlineStart: 'var(--g-space-5)' } },
        rows.value.map((r) => h('li', `${r.cliente} · ${r.estado} · $${r.total.toLocaleString(en() ? 'en-US' : 'es-MX')}`)))
    ]
  }
})

export default {
  host: Host,
  exclude: ['count'],
  model: { prop: 'filters', value: [], var: 'filtros' },
  block: true,
  code: { count: ':count="resultados.length"' },
  script: 'const resultados = [] // los que cumplen tus filtros: los aplicas tú',
  base: {
    fields: fieldsCase('basic'),
    count: 0,
    labels: {
      es: {
        group: 'Filtros de pedidos', add: 'Agregar filtro', clear: 'Limpiar filtros', filterBy: 'Filtrar por {label}',
        edit: 'Editar filtro: {summary}', remove: 'Quitar filtro: {summary}', apply: 'Aplicar', cancel: 'Cancelar',
        required: 'Indica un valor para aplicar el filtro.', range: '«Desde» debe ser menor o igual que «hasta».',
        rule: 'Regla', value: 'Valor', from: 'Desde', to: 'Hasta', and: 'y', days: '{n} días', results: '{count} pedidos',
        ops: { contains: 'contiene', is: 'es', starts: 'empieza por', gt: 'mayor que', lt: 'menor que', eq: 'igual a', between: 'entre', after: 'después de', before: 'antes de', last: 'últimos', in: 'es cualquiera de' }
      },
      en: {
        group: 'Order filters', add: 'Add filter', clear: 'Clear filters', filterBy: 'Filter by {label}',
        edit: 'Edit filter: {summary}', remove: 'Remove filter: {summary}', apply: 'Apply', cancel: 'Cancel',
        required: 'Enter a value to apply the filter.', range: '“From” must be less than or equal to “to”.',
        rule: 'Rule', value: 'Value', from: 'From', to: 'To', and: 'and', days: '{n} days', results: '{count} orders',
        ops: { contains: 'contains', is: 'is', starts: 'starts with', gt: 'greater than', lt: 'less than', eq: 'equal to', between: 'between', after: 'after', before: 'before', last: 'last', in: 'is any of' }
      }
    }
  },
  cases: [
    {
      title: { es: 'Pedidos: estado, total y cliente', en: 'Orders: status, total and customer' },
      why: {
        es: 'Un campo por tipo (lista, número, texto) y chips sugeridos con suggest para los más usados. La barra solo produce el modelo; aplicarlo a tus datos es tuyo.',
        en: 'One field per type (list, number, text) and suggested chips with suggest for the most used. The bar only produces the model; applying it to your data is yours.'
      },
      props: {}
    },
    {
      title: { es: 'Con fechas: «últimos 30 días»', en: 'With dates: “last 30 days”' },
      why: {
        es: 'El tipo date ofrece después de, antes de, entre y últimos N días. Úsalo cuando el tiempo es la forma natural de recortar; sin fechas en tus datos, no lo declares.',
        en: 'The date type offers after, before, between and last N days. Use it when time is the natural way to narrow; without dates in your data, do not declare it.'
      },
      props: { fields: fieldsCase('dates') }
    },
    {
      title: { es: 'Buscar un nombre en varios campos', en: 'Search a name across several fields' },
      why: {
        es: 'Un campo text con fields busca en nombre y correo a la vez. Para una búsqueda libre de toda la tabla, un campo de búsqueda aparte es más directo.',
        en: 'A text field with fields searches name and email at once. For a free search across the whole table, a separate search box is more direct.'
      },
      props: { fields: fieldsCase('search') }
    }
  ]
}
