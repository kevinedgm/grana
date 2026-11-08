// Ficha interactiva de GCheckboxGroup. Los controles salen de GCheckboxGroup.meta.json.
import { h } from 'vue'
import { GCheckbox } from '@grana/vue'

const E = (es, en) => ({ es, en })
const items = [
  ['laboratorio', E('Análisis de laboratorio', 'Lab tests')],
  ['rayos', E('Rayos X', 'X-ray')],
  ['vacunas', E('Vacunas', 'Vaccines')],
  ['farmacia', E('Entrega en farmacia', 'Pharmacy delivery')]
]

export default {
  // name y id los gestiona el formulario; countText es una función de la aplicación (se enseña en el código).
  exclude: ['id', 'name', 'warning', 'valid', 'countText'],
  model: { value: ['laboratorio'], var: 'servicios' },
  text: ['label', 'hint', 'error'],
  base: {
    label: E('Servicios de la visita', 'Services for the visit'),
    hint: E('Marca los que necesitas.', 'Check the ones you need.'),
    selectAllLabel: E('Seleccionar todos', 'Select all'),
    countText: (n, total) => `${n} / ${total}`
  },
  code: { countText: ':count-text="contar"' },
  script: 'const contar = (n, total) => `${n} / ${total}`',
  slots: [
    {
      name: 'default',
      code: items.map(([v, l]) => `<g-checkbox value="${v}" label="${l.es}" />`).join('\n'),
      render: () => items.map(([v, l]) => h(GCheckbox, { key: v, value: v, label: typeof document !== 'undefined' && document.documentElement.lang?.startsWith('en') ? l.en : l.es }))
    }
  ],
  cases: [
    {
      title: E('Servicios con «seleccionar todos»', 'Services with «select all»'),
      why: E('select-all da la casilla maestra y el recuento cuando la lista es larga; con tres opciones o menos sobra.', 'select-all gives the master box and the count when the list is long; with three options or fewer it is overkill.'),
      props: { selectAll: true }
    },
    {
      title: E('Filtros como chips', 'Filters as chips'),
      why: E('layout chip para filtrar en una fila compacta; el color accent los distingue de las acciones de marca.', 'layout chip to filter in a compact row; the accent color tells them apart from brand actions.'),
      props: { layout: 'chip', color: 'accent', label: E('Filtrar sedes por servicio', 'Filter sites by service'), hint: '' }
    },
    {
      title: E('Grupo obligatorio con error', 'Required group with an error'),
      why: E('required y error se anuncian para todo el grupo, no para cada casilla; úsalo cuando haya que elegir al menos una.', 'required and error are announced for the whole group, not each box; use it when at least one must be chosen.'),
      props: { required: true, error: E('Elige al menos un servicio.', 'Choose at least one service.') }
    },
    {
      title: E('Opciones como tarjetas', 'Options as cards'),
      why: E('layout card cuando cada opción lleva su propia explicación; para etiquetas cortas basta la disposición normal.', 'layout card when each option carries its own explanation; for short labels the default layout is enough.'),
      props: { layout: 'card' }
    }
  ]
}
