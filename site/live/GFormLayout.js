// Ficha interactiva de GFormLayout.
import { h } from 'vue'
import { GFormRow, GInput, GSelect, GCheckbox, GTextarea } from '@grana/vue'

const en = () => typeof document !== 'undefined' && document.documentElement.lang.startsWith('en')
const entregas = () => [
  { value: 'domicilio', label: en() ? 'Home delivery' : 'A domicilio' },
  { value: 'sucursal', label: en() ? 'Pick up in store' : 'Recoger en sucursal' }
]

export default {
  block: true,
  slots: [
    {
      name: 'default',
      code: '<g-form-row>\n  <g-input label="Nombre" name="nombre" required />\n  <g-input label="Apellido" name="apellido" required />\n</g-form-row>\n<g-form-row>\n  <g-input class="g-form-w-lg" label="Calle" name="calle" required />\n  <g-input class="g-form-w-xs" label="Número" name="numero" required />\n</g-form-row>\n<g-select label="Entrega" name="entrega" :options="entregas" />\n<g-checkbox label="Dejar con un vecino" name="vecino" />\n<g-textarea label="Indicaciones" name="indicaciones" />',
      render: () => [
        h(GFormRow, null, () => [
          h(GInput, { label: en() ? 'First name' : 'Nombre', name: 'nombre', required: true }),
          h(GInput, { label: en() ? 'Last name' : 'Apellido', name: 'apellido', required: true })
        ]),
        h(GFormRow, null, () => [
          h(GInput, { class: 'g-form-w-lg', label: en() ? 'Street' : 'Calle', name: 'calle', required: true }),
          h(GInput, { class: 'g-form-w-xs', label: en() ? 'Number' : 'Número', name: 'numero', required: true })
        ]),
        h(GSelect, { label: en() ? 'Delivery' : 'Entrega', name: 'entrega', options: entregas() }),
        h(GCheckbox, { label: en() ? 'Leave with a neighbor if nobody is home' : 'Dejar con un vecino si no hay nadie', name: 'vecino' }),
        h(GTextarea, { label: en() ? 'Notes for the courier' : 'Indicaciones para el repartidor', name: 'indicaciones' })
      ]
    }
  ],
  cases: [
    {
      title: { es: 'Panel lateral: un campo por línea', en: 'Side panel: one field per line' },
      why: { es: 'stack fuerza una columna aunque haya espacio; sirve en paneles estrechos y hojas. Si el contenedor ya es estrecho, las filas se parten solas.', en: 'stack forces one column even with room; use it in narrow panels and sheets. In a narrow container rows already wrap on their own.' },
      props: { stack: true }
    },
    {
      title: { es: 'Formulario de captura rápida', en: 'Quick-entry form' },
      why: { es: 'density="compact" para captura repetitiva en tablas de trabajo; en formularios largos de una sola vez, deja default.', en: 'density="compact" for repetitive entry in work screens; for long one-off forms keep default.' },
      props: { density: 'compact' }
    }
  ]
}
