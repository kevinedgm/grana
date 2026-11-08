// Ficha interactiva de GCheckbox. Los controles salen de GCheckbox.meta.json.
import { h } from 'vue'
import { GIcon } from '@grana/vue'

const E = (es, en) => ({ es, en })

export default {
  // value solo sirve con un modelo arreglo; field se explica en GCheckboxGroup.
  exclude: ['id', 'value', 'field', 'warning', 'valid'],
  model: { value: false, var: 'acepto' },
  text: ['label', 'hint', 'error'],
  base: {
    label: E('Acepto el aviso de privacidad', 'I accept the privacy notice'),
    hint: E('Puedes retirar tu consentimiento cuando quieras.', 'You can withdraw your consent at any time.')
  },
  slots: [
    { name: 'icon', optional: true, on: false, code: '<g-icon name="truck" />', render: () => h(GIcon, { name: 'truck' }) },
    { name: 'meta', optional: true, on: false, code: '$99', text: '$99' }
  ],
  cases: [
    {
      title: E('Consentimiento obligatorio', 'Mandatory consent'),
      why: E('required y un error que dice qué falta; úsalo cuando el envío depende de la casilla, no para preferencias opcionales.', 'required and an error saying what is missing; use it when submitting depends on the box, not for optional preferences.'),
      props: { required: true, hint: '', error: E('Debes aceptar el aviso de privacidad.', 'You must accept the privacy notice.') }
    },
    {
      title: E('Opción con precio y descripción', 'Option with price and description'),
      why: E('layout card con icono y meta convierte una casilla en una tarjeta elegible; si no hay nada que añadir, la disposición normal basta.', 'layout card with icon and meta turns a checkbox into a selectable card; if there is nothing to add, the default layout is enough.'),
      props: { layout: 'card', label: E('Envío a domicilio', 'Home delivery'), hint: E('Llega en 24 horas.', 'Arrives within 24 hours.') }, slots: { icon: true, meta: true }
    },
    {
      title: E('Filtro en forma de chip', 'Filter as a chip'),
      why: E('layout chip para filtros que se activan y desactivan en una fila; para varias opciones relacionadas usa GCheckboxGroup.', 'layout chip for filters that toggle on and off in a row; for several related options use GCheckboxGroup.'),
      props: { layout: 'chip', label: E('Prioridad', 'Priority'), hint: '' }
    },
    {
      title: E('Selección parcial', 'Partial selection'),
      why: E('indeterminate representa «algunas» en una casilla que gobierna a otras; en cuanto el usuario la pulsa deja de serlo.', 'indeterminate stands for “some” in a box that governs others; it stops being so once the user clicks it.'),
      props: { indeterminate: true, label: E('Todas las opciones', 'All options'), hint: '' }
    }
  ]
}
