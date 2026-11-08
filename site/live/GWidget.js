// Ficha interactiva de GWidget. Controles desde GWidget.meta.json.
import { defineComponent, h } from 'vue'
import { GDataList, GIcon, GMetric, GProgress, GWidget } from '@grana/vue'

// El widget mide su propio tamaño y rellena la caja que le des: la ficha le da una caja con alto, como en un panel.
const EnCaja = defineComponent({
  name: 'GranaLiveWidgetBox',
  inheritAttrs: false,
  setup: (_, { attrs, slots }) => () => h('div', { style: 'block-size:calc(var(--g-space-1) * 80);max-inline-size:100%' }, [
    h(GWidget, { ...attrs, style: 'block-size:100%' }, slots)
  ])
})

const metrica = (grande) => h(GMetric, { label: 'Ingresos', value: grande ? '$48.2k' : '$48k', trend: '+12%', direction: 'up', trendColor: 'success', context: grande ? 'vs. mes anterior' : undefined, size: grande ? 'lg' : undefined })
const cuerpo = () => [metrica(true), h(GProgress, { value: 72, label: 'Meta mensual', valueText: '72 %' })]

export default {
  host: EnCaja,
  exclude: ['id', 'href', 'headingLevel'],
  controls: ['state', 'level', 'badgeColor', 'density', 'headless'],
  text: ['title', 'eyebrow', 'description', 'badge', 'updatedText', 'drilldownLabel'],
  block: true,
  ignore: ['action'],
  base: {
    title: { es: 'Ingresos', en: 'Revenue' },
    eyebrow: { es: 'Finanzas', en: 'Finance' },
    description: { es: 'Últimos 30 días', en: 'Last 30 days' },
    updatedText: { es: 'Actualizado hace 5 min', en: 'Updated 5 min ago' },
    drilldownLabel: { es: 'Ver detalle', en: 'View details' },
    actions: [{ id: 'refresh', label: 'Actualizar' }, { id: 'export', label: 'Exportar' }],
    labels: { actions: 'Acciones de', loading: 'Cargando ingresos', empty: 'Sin datos en este periodo', error: 'No se pudo cargar', retry: 'Reintentar', stale: 'Desactualizado', staleText: 'Datos de hace 2 h', disabled: 'Deshabilitado' }
  },
  code: { actions: ':actions="acciones"', labels: ':labels="textos"' },
  script: "const acciones = [{ id: 'refresh', label: 'Actualizar' }, { id: 'export', label: 'Exportar' }]\n// textos: tus labels ({ actions, loading, empty, error, retry, stale, staleText, disabled })",
  slots: [
    { name: 'icon', optional: true, on: true, code: '<g-icon name="chart-column" />', render: () => h(GIcon, { name: 'chart-column' }) },
    {
      name: 'compact',
      code: '<g-metric label="Ingresos" value="$48k" trend="+12%" direction="up" trend-color="success" />',
      render: () => metrica(false)
    },
    {
      name: 'default',
      code: `<g-metric label="Ingresos" value="$48.2k" trend="+12%" direction="up"
          trend-color="success" context="vs. mes anterior" size="lg" />
<g-progress :value="72" label="Meta mensual" value-text="72 %" />`,
      render: cuerpo
    }
  ],
  cases: [
    {
      title: { es: 'Indicador con datos', en: 'Indicator with data' },
      why: { es: 'La carcasa no conoce su contenido: tú pones la métrica en el slot y el widget elige el nivel de detalle según el espacio que tiene.', en: 'The shell does not know its content: you put the metric in the slot and the widget picks the detail level from the space it has.' },
      props: { state: 'populated' }
    },
    {
      title: { es: 'Cargando sin cambiar de tamaño', en: 'Loading without changing size' },
      why: { es: 'loading dibuja un esqueleto con la estructura del nivel y anuncia labels.loading; el panel no salta al llegar los datos.', en: 'loading draws a skeleton with the structure of the level and announces labels.loading; the panel does not jump when data arrives.' },
      props: { state: 'loading' }
    },
    {
      title: { es: 'Sin datos en el periodo', en: 'No data in the period' },
      why: { es: 'empty dice por qué no hay nada (labels.empty); no lo uses para un fallo, que tiene su propio estado.', en: 'empty says why there is nothing (labels.empty); do not use it for a failure, which has its own state.' },
      props: { state: 'empty' }
    },
    {
      title: { es: 'Fallo con reintento', en: 'Failure with retry' },
      why: { es: 'error anuncia el mensaje (role alert) y ofrece «Reintentar»: tu evento retry vuelve a pedir los datos.', en: 'error announces the message (role alert) and offers “Retry”: your retry event asks for the data again.' },
      props: { state: 'error' }
    },
    {
      title: { es: 'Datos que ya no son frescos', en: 'Data that is no longer fresh' },
      why: { es: 'stale conserva los datos y lo dice con texto (badge y pie), no solo con color; úsalo si mostrar lo último conocido es mejor que nada.', en: 'stale keeps the data and says so with text (badge and footer), not only color; use it when showing the last known data beats nothing.' },
      props: { state: 'stale' }
    },
    {
      title: { es: 'Celda pequeña de una rejilla', en: 'Small grid cell' },
      why: { es: 'level s deja icono y título y usa el slot compact; con el nivel automático el widget lo elige solo según su tamaño.', en: 'level s keeps icon and title and uses the compact slot; with the automatic level the widget picks it by itself from its size.' },
      props: { level: 's' }
    }
  ]
}
