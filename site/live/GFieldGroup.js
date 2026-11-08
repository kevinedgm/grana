// Ficha interactiva de GFieldGroup.
import { h } from 'vue'
import { GInput } from '@grana/vue'

const en = () => typeof document !== 'undefined' && document.documentElement.lang.startsWith('en')

export default {
  exclude: ['id', 'valid', 'warning', 'name'],
  block: true,
  text: ['label', 'hint', 'error'],
  base: {
    label: { es: 'Fecha de nacimiento', en: 'Date of birth' },
    hint: { es: 'Por ejemplo, 27 3 1990', en: 'For example, 27 3 1990' },
    name: 'nacimiento'
  },
  slots: [
    {
      name: 'default',
      code: '<g-input class="g-form-w-xs" label="Día" name="dia" inputmode="numeric" />\n<g-input class="g-form-w-xs" label="Mes" name="mes" inputmode="numeric" />\n<g-input class="g-form-w-sm" label="Año" name="anio" inputmode="numeric" />',
      render: () => [
        h(GInput, { class: 'g-form-w-xs', label: en() ? 'Day' : 'Día', name: 'dia', inputmode: 'numeric' }),
        h(GInput, { class: 'g-form-w-xs', label: en() ? 'Month' : 'Mes', name: 'mes', inputmode: 'numeric' }),
        h(GInput, { class: 'g-form-w-sm', label: en() ? 'Year' : 'Año', name: 'anio', inputmode: 'numeric' })
      ]
    }
  ],
  cases: [
    {
      title: { es: 'Una pregunta con varias partes', en: 'One question with several parts' },
      why: { es: 'La fecha por partes es una sola pregunta: el grupo pone la etiqueta y la ayuda una vez, y un solo error bajo las partes. Si cada campo se responde por separado, usa campos sueltos.', en: 'A split date is one question: the group sets the label and hint once and one error under the parts. If each field is answered on its own, use plain fields.' },
      props: { required: true, keep: true }
    },
    {
      title: { es: 'Error de la pregunta entera', en: 'Error for the whole question' },
      why: { es: 'error describe el grupo, no una parte; se enlaza al grupo con aria-describedby.', en: 'error describes the group, not a part; it links to the group with aria-describedby.' },
      props: { required: true, keep: true, error: { es: 'Escribe una fecha válida, por ejemplo 27 3 1990.', en: 'Enter a valid date, for example 27 3 1990.' } }
    }
  ]
}
