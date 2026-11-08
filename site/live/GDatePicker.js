// Ficha interactiva de GDatePicker. Los controles salen de GDatePicker.meta.json.
const E = (es, en) => ({ es, en })

// Todo texto que no es una fecha lo pone la aplicación: Grana no trae textos.
const mk = (en) => {
  const t = (a, b) => (en ? b : a)
  return {
    prev: t('Mes anterior', 'Previous month'), next: t('Mes siguiente', 'Next month'), dialog: t('Elegir fecha', 'Choose a date'), close: t('Cerrar', 'Close'),
    today: t('hoy', 'today'), selected: t('seleccionada', 'selected'), rangeStart: t('inicio del rango', 'range start'), rangeEnd: t('fin del rango', 'range end'),
    rangeSingle: t('inicio y fin del rango', 'range start and end'), inRange: t('dentro del rango', 'in range'), unavailable: t('no disponible', 'unavailable'),
    clear: t('Limpiar', 'Clear'), done: t('Listo', 'Done'), proximityGroup: t('Ampliar el rango', 'Widen the range')
  }
}
const lit = (o) => `{\n${Object.entries(o).map(([k, v]) => `  ${k}: '${v.replace(/'/g, "\\'")}'`).join(',\n')}\n}`
const sinDomingo = (iso) => new Date(`${iso}T12:00:00`).getDay() === 0

export default {
  // range y split piden un modelo objeto y la ficha lleva uno solo; open lo gobierna el propio disparador.
  exclude: ['id', 'name', 'inline', 'mode', 'split', 'open', 'anchor', 'warning', 'valid', 'output', 'labelStart', 'labelEnd', 'placeholderStart', 'placeholderEnd', 'proximity', 'disabledDates', 'disabledNights', 'dayDescription', 'minNights', 'maxNights', 'locale', 'labels', 'min', 'max', 'firstDay', 'closeOnSelect'],
  ignore: ['navigate', 'open', 'close', 'update:open', 'start'],
  model: { value: '2026-10-20', var: 'cita' },
  text: ['label', 'hint', 'error', 'placeholder'],
  base: {
    label: E('Fecha de la cita', 'Appointment date'),
    placeholder: E('Elige un día', 'Choose a day'),
    hint: E('Los domingos no hay consulta.', 'There are no visits on Sundays.'),
    locale: E('es-MX', 'en-US'),
    min: '2026-10-01', max: '2026-12-31',
    disabledDates: sinDomingo,
    labels: { es: mk(false), en: mk(true) }
  },
  code: { disabledDates: ':disabled-dates="sinDomingo"', labels: ':labels="labels"' },
  script: {
    es: `// Los domingos la clínica no atiende.\nconst sinDomingo = (iso) => new Date(\`\${iso}T12:00:00\`).getDay() === 0\nconst labels = ${lit(mk(false))}`,
    en: `// The clinic is closed on Sundays.\nconst sinDomingo = (iso) => new Date(\`\${iso}T12:00:00\`).getDay() === 0\nconst labels = ${lit(mk(true))}`
  },
  cases: [
    {
      title: E('Cita con días no disponibles', 'Appointment with unavailable days'),
      why: E('min, max y disabled-dates acotan lo elegible; úsalo cuando el calendario de la aplicación sabe qué días valen, no para validar después.', 'min, max and disabled-dates bound what can be chosen; use them when your app knows which days are valid, rather than validating afterwards.'),
      props: {}
    },
    {
      title: E('Calendario siempre visible', 'Always-visible calendar'),
      why: E('inline pinta el calendario en la página en vez de un panel; úsalo cuando elegir la fecha es la tarea principal de la vista.', 'inline paints the calendar on the page instead of a panel; use it when picking the date is the main task of the view.'),
      props: { inline: true, label: '', placeholder: '', hint: '' }
    },
    {
      title: E('Dos meses a la vista', 'Two months in view'),
      why: E('months 2 enseña el siguiente mes junto al actual; útil al reservar cerca de fin de mes, innecesario para una fecha cercana.', 'months 2 shows the next month beside the current one; useful when booking near month end, unnecessary for a close date.'),
      props: { inline: true, months: 2, label: '', placeholder: '', hint: '' }
    },
    {
      title: E('Estancia con ingreso y alta', 'Stay with check-in and check-out'),
      why: E('mode range con un modelo { start, end }; úsalo para periodos, para un día suelto basta single.', 'mode range with a { start, end } model; use it for periods, a single day only needs single.'),
      props: { mode: 'range', label: E('Estancia', 'Stay'), placeholder: E('Elige las fechas', 'Choose the dates'), hint: '' },
      model: { start: '2026-10-26', end: '2026-10-29' }
    },
    {
      title: E('Fecha obligatoria con error', 'Required date with an error'),
      why: E('required y error al enviar sin fecha; el aviso se enlaza al campo.', 'required and error on submit without a date; the message is linked to the field.'),
      props: { required: true, error: E('Elige la fecha de la cita.', 'Choose the appointment date.') }
    }
  ]
}
