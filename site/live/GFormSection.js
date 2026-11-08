// Ficha interactiva de GFormSection. El cuerpo no distribuye (#283): campos dentro de GFormLayout.
import { h } from 'vue'
import { GFormLayout, GFormRow, GInput, GSelect, GIcon } from '@grana/vue'

const en = () => typeof document !== 'undefined' && document.documentElement.lang.startsWith('en')

export default {
  // mode, open y added solo valen juntos y fijos durante la vida de la sección: los fija cada caso.
  exclude: ['headingLevel', 'labels', 'mode', 'open', 'added'],
  block: true,
  ignore: ['update:open', 'update:added'], // escuchar update:* en un modo que no es suyo dispara el aviso de Grana
  text: ['title', 'description', 'summary'],
  base: {
    title: { es: 'Avisos de citas', en: 'Appointment reminders' },
    description: { es: 'Cómo y dónde avisamos.', en: 'How and where we notify.' },
    labels: {
      sectionOptional: { es: 'Opcional', en: 'Optional' },
      add: { es: 'Agregar datos fiscales', en: 'Add tax data' },
      remove: { es: 'Quitar datos fiscales', en: 'Remove tax data' },
      removeTitle: { es: '¿Quitar los datos fiscales?', en: 'Remove the tax data?' },
      removeBody: { es: 'Se descartará lo que escribiste en esta sección.', en: 'What you typed in this section will be discarded.' },
      removeConfirm: { es: 'Quitar', en: 'Remove' },
      removeCancel: { es: 'Cancelar', en: 'Cancel' }
    }
  },
  slots: [
    { name: 'lead', optional: true, on: false, code: '<g-icon name="bell" />', render: () => h(GIcon, { name: 'bell' }) },
    {
      name: 'default',
      code: '<g-form-layout>\n  <g-form-row>\n    <g-select label="Idioma" name="idioma" :options="idiomas" />\n    <g-input label="Teléfono" name="telefono" type="tel" />\n  </g-form-row>\n</g-form-layout>',
      render: () => h(GFormLayout, null, () => h(GFormRow, null, () => [
        h(GSelect, { label: en() ? 'Language' : 'Idioma', name: 'idioma', options: [{ value: 'es', label: 'Español' }, { value: 'en', label: 'English' }] }),
        h(GInput, { label: en() ? 'Phone' : 'Teléfono', name: 'telefono', type: 'tel', inputmode: 'numeric' })
      ]))
    }
  ],
  cases: [
    {
      title: { es: 'Sección fija con propósito', en: 'Static section with a purpose' },
      why: { es: 'Agrupa campos de un mismo tema con título y descripción; es lo normal. No pliegues lo que el usuario necesita casi siempre.', en: 'Groups fields of one topic with title and description; the normal case. Do not fold what the user needs almost every time.' },
      props: { mode: 'static', title: { es: 'Datos del paciente', en: 'Patient data' }, description: { es: 'Como aparecen en su identificación.', en: 'As shown on their ID.' }, divider: true }
    },
    {
      title: { es: 'Preferencias plegadas con resumen', en: 'Folded preferences with summary' },
      why: { es: 'collapsible + summary: lo opcional o rara vez tocado se pliega y su línea de resumen (la escribe la aplicación) dice cómo está. Si hay error dentro, GForm la abre al enviar.', en: 'collapsible + summary: optional or rarely touched content folds and its summary line (written by the app) says its state. With an error inside, GForm opens it on submit.' },
      props: { mode: 'collapsible', summary: { es: 'Español · sin teléfono', en: 'Spanish · no phone' }, divider: true }, slots: { lead: true }
    },
    {
      title: { es: 'Datos fiscales que se agregan si hacen falta', en: 'Tax data added only when needed' },
      why: { es: 'addable: la sección no existe hasta agregarla; sin agregar no cuenta ni se envía, y quitarla confirma antes de descartar lo escrito.', en: 'addable: the section does not exist until added; unadded it does not count or submit, and removing it confirms before discarding input.' },
      props: { mode: 'addable', title: { es: 'Datos fiscales', en: 'Tax data' }, description: { es: 'Solo si el paciente pide factura.', en: 'Only if the patient asks for an invoice.' }, divider: true }
    }
  ]
}
