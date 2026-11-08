// Ficha interactiva de GCardGroup. Controles desde GCardGroup.meta.json.
import { h } from 'vue'
import { GCard, GMetric, GSurface } from '@grana/vue'
import { GCardGroup } from '@grana/vue/card-group'

const metricas = [
  { value: 'pendiente', title: { es: 'Pendientes', en: 'Pending' }, n: 8 },
  { value: 'vencida', title: { es: 'Vencidas', en: 'Overdue' }, n: 4 },
  { value: 'pagada', title: { es: 'Pagadas', en: 'Paid' }, n: 10 }
]

export default {
  exclude: ['multiple', 'id', 'controls', 'labelledby', 'modelValue'],
  text: ['label'],
  block: true,
  base: { label: { es: 'Filtrar facturas por estado', en: 'Filter invoices by status' } },
  model: { value: 'pendiente', var: 'estado' },
  imports: ["import { GCardGroup } from '@grana/vue/card-group'"],
  host: GCardGroup,
  slots: [
    {
      name: 'default',
      code: '<g-card value="pendiente" title="Pendientes"><g-metric :value="8" label="facturas" /></g-card>\n<g-card value="vencida" title="Vencidas"><g-metric :value="4" label="facturas" /></g-card>\n<g-card value="pagada" title="Pagadas"><g-metric :value="10" label="facturas" /></g-card>',
      render: () => metricas.map((m) => h(GCard, { key: m.value, value: m.value, title: m.title.es, labels: { loading: 'Cargando', loaded: 'Listo' } }, () => h(GMetric, { value: m.n, label: 'facturas' })))
    }
    ,
    {
      name: 'panel', optional: true, on: false, scope: '{ filtered }',
      code: '<p>La tabla filtrada va aquí.</p>',
      render: () => h(GSurface, { level: 'outlined', padding: 'md' }, () => h('p', { style: 'margin:0' }, 'La tabla filtrada va aquí.'))
    }
  ],
  cases: [
    {
      title: { es: 'Métricas que filtran una tabla', en: 'Metrics that filter a table' },
      why: { es: 'Una sola elegida a la vez: las tarjetas hacen de filtro de la vista de abajo.', en: 'Only one chosen at a time: the cards act as a filter of the view below.' },
      props: {}
    },
    {
      title: { es: 'Con la lengüeta sobre la región filtrada', en: 'With the tab over the filtered region' },
      why: { es: 'El slot panel apoya las tarjetas en el marco de la tabla; solo si la región va justo debajo, sin nada entre medias.', en: 'The panel slot rests the cards on the table frame; only if the region sits right below, with nothing in between.' },
      props: {}, slots: { panel: true }
    }
   ,
    {
      title: { es: 'Varias a la vez', en: 'Several at once' },
      why: { es: 'multiple deja combinar estados (el modelo es un arreglo); si las opciones se excluyen entre sí, déjalo apagado.', en: 'multiple lets you combine statuses (the model is an array); if the options exclude each other, leave it off.' },
      props: { multiple: true }, model: ['pendiente', 'vencida']
    }
  ]
}
