// Ficha interactiva de GFormReveal: va justo después de la pregunta que lo condiciona (hermano anterior).
import { h } from 'vue'
import { GFormLayout, GCheckbox, GFormReveal, GInput } from '@grana/vue'

const en = () => typeof document !== 'undefined' && document.documentElement.lang.startsWith('en')

export default {
  block: true,
  host: {
    name: 'GranaLiveReveal',
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () => h(GFormLayout, null, () => [
        h(GCheckbox, { label: en() ? 'Requires an invoice' : 'Requiere factura', name: 'factura' }),
        h(GFormReveal, attrs, slots)
      ])
    }
  },
  wrap: '<g-form-layout>\n  <g-checkbox label="Requiere factura" name="factura" />\n  $\n</g-form-layout>',
  slots: [
    {
      name: 'default',
      code: '<g-input label="RFC" name="rfc" required />\n<g-input label="Razón social" name="razon" required />',
      render: () => [
        h(GInput, { label: 'RFC', name: 'rfc', required: true }),
        h(GInput, { label: en() ? 'Legal name' : 'Razón social', name: 'razon', required: true })
      ]
    }
  ],
  cases: [
    {
      title: { es: 'Datos fiscales solo si piden factura', en: 'Tax data only when an invoice is requested' },
      why: { es: 'when abierto muestra los campos; cerrado quedan inert, fuera del envío y sin obligar a llenarlos. Úsalo para ramas de una respuesta anterior, justo después de ella.', en: 'Open when shows the fields; closed they are inert, out of the submission and not required. Use it for branches of a previous answer, right after it.' },
      props: { when: true }
    },
    {
      title: { es: 'Rama cerrada', en: 'Closed branch' },
      why: { es: 'Con when en falso el contenido sigue montado (no se pierde lo escrito) pero no cuenta para validar ni enviar. No lo uses para ocultar campos que sí se envían.', en: 'With when false the content stays mounted (typed text is kept) but does not count for validation or submission. Do not use it to hide fields that do submit.' },
      props: { when: false }
    }
  ]
}
