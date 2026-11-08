// Ficha interactiva de GTimeField. Los controles salen de GTimeField.meta.json.
const E = (es, en) => ({ es, en })

export default {
  exclude: ['id', 'name', 'output', 'warning', 'valid', 'prefix', 'suffix', 'prefixLabel', 'suffixLabel', 'min', 'max', 'step', 'locale', 'labels'],
  model: { value: '21:30', var: 'toma' },
  text: ['label', 'hint', 'error'],
  imports: ["import { GTimeField } from '@grana/vue/time-field'"],
  base: {
    label: E('Hora de la toma', 'Time of the dose'),
    hint: E('Escribe como lo dirías: 930, 9h30, 9 noche o mediodía.', 'Type it the way you would say it: 930, 9:30 pm or noon.'),
    locale: E('es-MX', 'en-US'),
    step: 15,
    labels: { es: { invalid: 'Escribe una hora, por ejemplo 9:30' }, en: { invalid: 'Enter a time, for example 9:30 am' } }
  },
  code: { labels: ':labels="labels"' },
  script: {
    es: "const labels = { invalid: 'Escribe una hora, por ejemplo 9:30' }",
    en: "const labels = { invalid: 'Enter a time, for example 9:30 am' }"
  },
  cases: [
    {
      title: E('Hora de una toma de medicina', 'Time of a medicine dose'),
      why: E('step 15 para que ↑ y ↓ avancen por cuartos de hora; el campo entiende lo que se escribe a mano.', 'step 15 so ↑ and ↓ move by quarters of an hour; the field understands what is typed by hand.'),
      props: {}
    },
    {
      title: E('Turno que cruza la medianoche', 'Shift that crosses midnight'),
      why: E('min mayor que max es un arco que pasa por las 00:00; úsalo para horarios nocturnos, no para un rango cualquiera.', 'min greater than max is an arc through 00:00; use it for night schedules, not for any range.'),
      props: { label: E('Llegada del turno de noche', 'Night shift arrival'), hint: E('Con ↑ recorre de 22:00 a 06:00.', 'With ↑ it runs from 22:00 to 06:00.'), min: '22:00', max: '06:00', step: 30 }
    },
    {
      title: E('Hora con segundos', 'Time with seconds'),
      why: E('seconds solo cuando el segundo importa (registros, tiempos); para citas sobra.', 'seconds only when the second matters (logs, timings); for appointments it is overkill.'),
      props: { seconds: true, step: 1, label: E('Hora del registro', 'Log time'), hint: '' }
    },
    {
      title: E('Hora obligatoria con error', 'Required time with an error'),
      why: E('required y error al enviar sin hora; el aviso se enlaza al campo.', 'required and error on submit without a time; the message is linked to the field.'),
      props: { required: true, error: E('Indica a qué hora se toma.', 'State the time of the dose.') }
    }
  ]
}
