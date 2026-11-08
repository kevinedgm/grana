// Ficha interactiva de GRadioGroup. Los controles salen de GRadioGroup.meta.json.
const E = (es, en) => ({ es, en })

export default {
  // name lo comparte el grupo con el formulario; field y id los gestiona el componente.
  exclude: ['id', 'name', 'field', 'warning', 'valid'],
  when: { labelMode: (s) => ['segmented', 'chip'].includes(s.appearance) },
  model: { value: 'presencial', var: 'modalidad' },
  text: ['label', 'hint', 'error'],
  base: {
    label: E('Modalidad de consulta', 'Visit type'),
    hint: E('Puedes cambiarla hasta un día antes.', 'You can change it up to a day before.'),
    options: {
      es: [
        { value: 'presencial', label: 'Presencial', icon: 'map-pin' },
        { value: 'linea', label: 'En línea', icon: 'globe' },
        { value: 'tel', label: 'Por teléfono', icon: 'phone', disabled: true }
      ],
      en: [
        { value: 'presencial', label: 'In person', icon: 'map-pin' },
        { value: 'linea', label: 'Online', icon: 'globe' },
        { value: 'tel', label: 'By phone', icon: 'phone', disabled: true }
      ]
    }
  },
  cases: [
    {
      title: E('Elegir entre pocas opciones con explicación', 'Choosing among few options with an explanation'),
      why: E('card muestra la descripción de cada opción; con etiquetas cortas y sin descripción usa list o inline.', 'card shows each option’s description; with short labels and no description use list or inline.'),
      props: {
        appearance: 'card',
        options: {
          es: [
            { value: 'presencial', label: 'Presencial', description: 'En el consultorio de Reforma 120.', icon: 'map-pin' },
            { value: 'linea', label: 'En línea', description: 'Videollamada; el enlace llega por correo.', icon: 'globe' },
            { value: 'tel', label: 'Por teléfono', description: 'No disponible este mes.', icon: 'phone', disabled: true }
          ],
          en: [
            { value: 'presencial', label: 'In person', description: 'At the Reforma 120 office.', icon: 'map-pin' },
            { value: 'linea', label: 'Online', description: 'Video call; the link arrives by email.', icon: 'globe' },
            { value: 'tel', label: 'By phone', description: 'Not available this month.', icon: 'phone', disabled: true }
          ]
        }
      }
    },
    {
      title: E('Alternar una vista', 'Switching a view'),
      why: E('segmented para dos o tres opciones cortas que cambian lo que se ve; no es para pasos de un flujo.', 'segmented for two or three short options that change what is shown; not for the steps of a flow.'),
      props: {
        appearance: 'segmented', label: E('Ver citas como', 'View appointments as'), hint: '',
        options: { es: [{ value: 'presencial', label: 'Lista' }, { value: 'linea', label: 'Agenda' }], en: [{ value: 'presencial', label: 'List' }, { value: 'linea', label: 'Agenda' }] }
      }
    },
    {
      title: E('Frecuencia como chips', 'Frequency as chips'),
      why: E('chip con color accent para preferencias que se cambian a menudo y caben en una fila.', 'chip with accent color for preferences that change often and fit in one row.'),
      props: {
        appearance: 'chip', color: 'accent', label: E('Recordatorios', 'Reminders'), hint: '',
        options: { es: [{ value: 'presencial', label: 'Diaria' }, { value: 'linea', label: 'Semanal' }, { value: 'nunca', label: 'Nunca' }], en: [{ value: 'presencial', label: 'Daily' }, { value: 'linea', label: 'Weekly' }, { value: 'nunca', label: 'Never' }] }
      }
    },
    {
      title: E('Elección obligatoria con error', 'Required choice with an error'),
      why: E('required y error al enviar sin elegir; el aviso se lee al llegar al grupo.', 'required and error on submit without choosing; the message is read on reaching the group.'),
      props: { required: true, error: E('Elige una modalidad para continuar.', 'Choose a visit type to continue.') }
    }
  ]
}
