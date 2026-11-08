// Ficha interactiva de GStepper. Controles desde GStepper.meta.json.
import { h } from 'vue'
import { GIcon } from '@grana/vue'

const alta = {
  es: [
    { label: 'Plan', description: 'Elige tu plan', icon: 'package', text: 'Mensual o anual: cambias cuando quieras.' },
    { label: 'Cuenta', description: 'Datos de acceso', icon: 'user', text: 'Correo y contraseña para entrar.' },
    { label: 'Facturación', description: 'RFC y domicilio', icon: 'file-text', optional: true, text: 'Solo si necesitas factura.' },
    { label: 'Pago', description: 'Tarjeta o transferencia', icon: 'credit-card', text: 'Elige cómo pagar.' },
    { label: 'Confirmación', icon: 'check', text: 'Revisa y confirma.' }
  ],
  en: [
    { label: 'Plan', description: 'Choose your plan', icon: 'package', text: 'Monthly or yearly: change whenever you like.' },
    { label: 'Account', description: 'Sign-in details', icon: 'user', text: 'Email and password to sign in.' },
    { label: 'Billing', description: 'Tax ID and address', icon: 'file-text', optional: true, text: 'Only if you need an invoice.' },
    { label: 'Payment', description: 'Card or transfer', icon: 'credit-card', text: 'Choose how to pay.' },
    { label: 'Confirmation', icon: 'check', text: 'Review and confirm.' }
  ]
}

const conError = {
  es: [
    { label: 'Datos', description: 'Paciente y motivo' },
    { label: 'Estudios', description: 'Falta un resultado', status: 'warning' },
    { label: 'Pago', description: 'Tarjeta rechazada', status: 'error' },
    { label: 'Confirmación', disabled: true }
  ],
  en: [
    { label: 'Details', description: 'Patient and reason' },
    { label: 'Tests', description: 'A result is missing', status: 'warning' },
    { label: 'Payment', description: 'Card declined', status: 'error' },
    { label: 'Confirmation', disabled: true }
  ]
}

const subida = {
  es: [{ label: 'Elegir' }, { label: 'Revisar' }, { label: 'Importar' }],
  en: [{ label: 'Choose' }, { label: 'Review' }, { label: 'Import' }]
}

export default {
  exclude: ['labels'],
  model: { prop: 'modelValue', value: 1, var: 'actual' },
  block: true,
  base: {
    steps: alta,
    'aria-label': { es: 'Alta de cuenta', en: 'Account sign-up' },
    labels: {
      es: {
        complete: 'completado', current: 'paso actual', pending: 'pendiente', error: 'con error', warning: 'con advertencia',
        disabled: 'bloqueado', optional: 'opcional', progress: 'Paso {current} de {total}', showAll: 'Ver todos los pasos', hideAll: 'Ocultar pasos'
      },
      en: {
        complete: 'completed', current: 'current step', pending: 'pending', error: 'has an error', warning: 'has a warning',
        disabled: 'locked', optional: 'optional', progress: 'Step {current} of {total}', showAll: 'Show all steps', hideAll: 'Hide steps'
      }
    }
  },
  slots: [
    { name: 'icon', scope: '{ step }', code: '<g-icon :name="step.icon" />', render: ({ step }) => h(GIcon, { name: step.icon }) },
    {
      name: 'content', scope: '{ step }', optional: true, on: true,
      code: '<p>{{ step.text }}</p>',
      render: ({ step }) => h('p', { class: 'g-m-0' }, step.text)
    }
  ],
  cases: [
    {
      title: { es: 'Alta de cuenta con vuelta atrás', en: 'Sign-up with going back' },
      why: {
        es: 'navigation back convierte los pasos ya hechos en botones; los pendientes se alcanzan con «Siguiente» tras validar. Con free el usuario salta: solo si los pasos no dependen entre sí.',
        en: 'navigation back turns completed steps into buttons; pending ones are reached with “Next” after validating. With free people can jump: only if the steps do not depend on each other.'
      },
      props: { navigation: 'back' }
    },
    {
      title: { es: 'Un paso con error y otro con advertencia', en: 'One step with an error, another with a warning' },
      why: {
        es: 'status error o warning suma forma e icono propios (no solo color) y se anuncia; disabled bloquea el paso que aún no se puede abrir.',
        en: 'status error or warning adds its own shape and icon (not just color) and is announced; disabled locks the step that cannot open yet.'
      },
      props: { steps: conError, navigation: 'free', 'aria-label': { es: 'Solicitud de estudios', en: 'Test request' } }
    },
    {
      title: { es: 'Asistente vertical con el contenido en cada paso', en: 'Vertical wizard with content in each step' },
      why: {
        es: 'orientation vertical y el slot content muestran el cuerpo del paso actual (o todos con expandAll). Con pocos pasos y mucho contenido; si no, horizontal.',
        en: 'vertical orientation and the content slot show the current step’s body (or all with expandAll). For few steps with lots of content; otherwise horizontal.'
      },
      props: { orientation: 'vertical', indicator: 'icon' }
    },
    {
      title: { es: 'Importación corta, en segmentos', en: 'Short import, in segments' },
      why: {
        es: 'segment dibuja el avance como una sola barra, ligera para tres pasos sin descripción; los números sobran cuando importa el progreso y no el nombre.',
        en: 'segment draws progress as a single bar, light for three steps without description; numbers are noise when progress matters more than names.'
      },
      props: { steps: subida, indicator: 'segment', size: 'sm', 'aria-label': { es: 'Importar pacientes', en: 'Import patients' } },
      slots: { content: false }
    },
    {
      title: { es: 'Contenedor estrecho', en: 'Narrow container' },
      why: {
        es: 'responsive compact da «Paso 2 de 5» con la lista a demanda cuando sabes que el espacio es poco; con auto ya cambia solo al no caber.',
        en: 'responsive compact gives “Step 2 of 5” with the list on demand when you know space is tight; with auto it already switches when it does not fit.'
      },
      props: { responsive: 'compact' }
    }
  ]
}
