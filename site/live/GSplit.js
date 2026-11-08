// Ficha interactiva de GSplit. Controles desde GSplit.meta.json.
import { h } from 'vue'
import { GSurface } from '@grana/vue'

const panel = (t) => h(GSurface, { level: 'outlined', padding: 'sm' }, () => t)

export default {
  exclude: ['as'],
  block: true,
  slots: [
    { name: 'start', code: '<g-surface level="outlined" padding="sm">Contenido principal</g-surface>', render: () => panel('Contenido principal') },
    { name: 'end', code: '<g-surface level="outlined" padding="sm">Resumen</g-surface>', render: () => panel('Resumen') }
  ],
  cases: [
    {
      title: { es: 'Contenido con panel de resumen', en: 'Content with a summary panel' },
      why: { es: '2:1 da el doble al contenido principal; en pantalla estrecha pasa a una columna (collapse md).', en: '2:1 gives the main content double; on a narrow screen it becomes one column (collapse md).' },
      props: { ratio: '2:1', collapse: 'md' }
    },
    {
      title: { es: 'Dos paneles iguales', en: 'Two equal panels' },
      why: { es: '1:1 para comparar dos cosas del mismo peso; si una manda, usa otra proporción.', en: '1:1 to compare two things of the same weight; if one leads, use another ratio.' },
      props: { ratio: '1:1', align: 'stretch' }
    },
    {
      title: { es: 'Formulario con ayuda al lado', en: 'Form with help beside it' },
      why: { es: '2:3 con align start: la ayuda lateral no se estira a la altura del formulario.', en: '2:3 with align start: the side help does not stretch to the height of the form.' },
      props: { ratio: '2:3', align: 'start', gap: 'lg' }
    }
  ]
}
