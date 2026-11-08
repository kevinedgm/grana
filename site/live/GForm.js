// Ficha interactiva de GForm. Controles desde GForm.meta.json; el contenido va en el slot.
import { h } from 'vue'
import { GFormLayout, GFormRow, GFormActions, GInput, GSelect, GTextarea, GBtn } from '@grana/vue'

const en = () => typeof document !== 'undefined' && document.documentElement.lang.startsWith('en')
const motivos = () => [
  { value: 'primera', label: en() ? 'First visit' : 'Primera consulta' },
  { value: 'seguimiento', label: en() ? 'Follow-up' : 'Seguimiento' }
]

export default {
  exclude: ['errors', 'warnings', 'dirty', 'labels', 'headingLevel'],
  block: true,
  base: {
    'aria-label': { es: 'Solicitar cita', en: 'Book an appointment' },
    labels: {
      optional: { es: '(opcional)', en: '(optional)' },
      error: { es: 'Error: ', en: 'Error: ' },
      warning: { es: 'Advertencia: ', en: 'Warning: ' },
      valid: { es: 'Correcto: ', en: 'Valid: ' },
      requiredHint: { es: '* Obligatorio', en: '* Required' }
    },
    errors: {
      nombre: { es: 'Escribe tu nombre', en: 'Enter your name' },
      correo: { es: 'Escribe el correo con el formato nombre@dominio.com', en: 'Enter the email as name@domain.com' }
    }
  },
  slots: [
    {
      name: 'default',
      code: '<g-form-layout>\n  <g-form-row>\n    <g-input label="Nombre" name="nombre" required />\n    <g-input label="Correo" name="correo" type="email" required />\n  </g-form-row>\n  <g-select label="Motivo" name="motivo" :options="motivos" />\n  <g-textarea label="Notas" name="notas" />\n</g-form-layout>\n<g-form-actions>\n  <g-btn type="submit">Solicitar cita</g-btn>\n</g-form-actions>',
      render: () => [
        h(GFormLayout, null, () => [
          h(GFormRow, null, () => [
            h(GInput, { label: en() ? 'Name' : 'Nombre', name: 'nombre', required: true }),
            h(GInput, { label: en() ? 'Email' : 'Correo', name: 'correo', type: 'email', required: true })
          ]),
          h(GSelect, { label: en() ? 'Reason' : 'Motivo', name: 'motivo', options: motivos(), placeholder: en() ? 'Choose one' : 'Elige uno' }),
          h(GTextarea, { label: en() ? 'Notes' : 'Notas', name: 'notas' })
        ]),
        h(GFormActions, null, () => h(GBtn, { type: 'submit' }, () => (en() ? 'Book' : 'Solicitar cita')))
      ]
    }
  ],
  cases: [
    {
      title: { es: 'Errores al enviar, no al teclear', en: 'Errors on submit, not while typing' },
      why: { es: 'show-errors-on="submit" para formularios cortos donde un error a mitad de escritura molesta; por defecto (blur) el error aparece al salir del campo.', en: 'show-errors-on="submit" for short forms where a mid-typing error is noise; by default (blur) the error shows on leaving the field.' },
      props: { showErrorsOn: 'submit' }
    },
    {
      title: { es: 'Formulario denso en un panel', en: 'Dense form in a panel' },
      why: { es: 'density="compact" compacta el ritmo de todos los campos a la vez; no lo uses con público táctil sin revisar el área de pulsación.', en: 'density="compact" tightens every field at once; do not use it for touch audiences without checking target size.' },
      props: { density: 'compact' }
    },
    {
      title: { es: 'Solo lectura para revisar antes de confirmar', en: 'Read-only to review before confirming' },
      why: { es: 'readonly conserva el valor y el foco (el dato se lee y se copia); disabled lo sacaría del envío.', en: 'readonly keeps value and focus (data can be read and copied); disabled would drop it from the submission.' },
      props: { readonly: true }
    },
    {
      title: { es: 'Campos obligatorios marcados', en: 'Required fields marked' },
      why: { es: 'marks="required" señala los obligatorios en vez de los opcionales: úsalo cuando casi todo es opcional.', en: 'marks="required" flags required fields instead of optional ones: use it when nearly everything is optional.' },
      props: { marks: 'required' }
    }
  ]
}
