// Ficha interactiva de GFormFold (entrada propia @grana/vue/form-fold).
import { h } from 'vue'
import { GFormLayout, GInput, GBtn } from '@grana/vue'

const en = () => typeof document !== 'undefined' && document.documentElement.lang.startsWith('en')

export default {
  exclude: ['headingLevel', 'for', 'from', 'errors', 'warnings', 'labels'],
  block: true,
  imports: ["import { GFormFold } from '@grana/vue/form-fold'"],
  model: { prop: 'open', value: false, var: 'abierto' },
  trigger: { label: { es: 'Crear categoría', en: 'Create category' }, value: true },
  text: ['title', 'description'],
  base: {
    title: { es: 'Categoría nueva', en: 'New category' },
    description: { es: 'Se elegirá en el campo Categoría.', en: 'It will be chosen in the Category field.' },
    labels: { pending: { es: 'Termina o cancela «{title}» antes de enviar.', en: 'Finish or cancel “{title}” before submitting.' } },
    errors: {}
  },
  slots: [
    {
      name: 'default',
      code: '<g-form-layout>\n  <g-input label="Nombre" name="nueva" required />\n</g-form-layout>',
      render: () => h(GFormLayout, null, () => h(GInput, { label: en() ? 'Name' : 'Nombre', name: 'nueva', required: true }))
    },
    {
      name: 'actions',
      scope: '{ confirm, cancel }',
      code: '<g-btn variant="outline" type="button" @click="cancel()">Cancelar</g-btn>\n<g-btn type="button" @click="confirm()">Crear</g-btn>',
      render: ({ confirm, cancel }) => [
        h(GBtn, { variant: 'outline', type: 'button', onClick: () => cancel() }, () => (en() ? 'Cancel' : 'Cancelar')),
        h(GBtn, { type: 'button', onClick: () => confirm() }, () => (en() ? 'Create' : 'Crear'))
      ]
    }
  ],
  cases: [
    {
      title: { es: 'Crear lo que falta sin salir del formulario', en: 'Create what is missing without leaving the form' },
      why: { es: 'Cuando la opción puede no existir en el catálogo: el pliegue se abre bajo el campo, con su propio confirmar y sus campos fuera del envío. Si crear exige otra pantalla, no es un pliegue.', en: 'When the option may be missing from the catalog: the fold opens under the field with its own confirm and its fields out of the submission. If creating needs another screen, it is not a fold.' }
    }
  ]
}
