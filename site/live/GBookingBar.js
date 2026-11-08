// Ficha interactiva de GBookingBar. Controles desde GBookingBar.meta.json. Entrada propia: @grana/vue/booking.
const T = (en) => (a, b) => (en ? b : a)
const construir = (en) => {
  const t = T(en)
  const plural = (n, a1, a2, b1, b2) => `${n} ${n === 1 ? t(a1, b1) : t(a2, b2)}`
  const filas = [
    { key: 'adults', label: t('Adultos', 'Adults'), min: 1, default: 2, unit: (n) => plural(n, 'adulto', 'adultos', 'adult', 'adults'), decrementLabel: t('Quitar un adulto', 'Remove an adult'), incrementLabel: t('Añadir un adulto', 'Add an adult') },
    { key: 'rooms', label: t('Habitaciones', 'Rooms'), min: 1, default: 1, unit: (n) => plural(n, 'habitación', 'habitaciones', 'room', 'rooms'), decrementLabel: t('Quitar una habitación', 'Remove a room'), incrementLabel: t('Añadir una habitación', 'Add a room') }
  ]
  const comunes = {
    fields: { from: t('Llegada', 'Check-in'), to: t('Salida', 'Check-out'), nights: t('Noches', 'Nights'), party: t('Huéspedes', 'Guests'), date: t('Fecha', 'Date'), time: t('Turno', 'Time slot'), tour: t('Recorrido', 'Tour') },
    nights: (n) => plural(n, 'noche', 'noches', 'night', 'nights'),
    checkout: t('Salida el {date}', 'Check-out on {date}'),
    noDates: t('Sin fechas', 'No dates'), noDate: t('Sin fecha', 'No date'), noTime: t('Sin turno', 'No time slot'), noTour: t('Sin recorrido', 'No tour'), separator: ' · ',
    summaryTitle: t('Tu consulta', 'Your search'), change: t('Cambiar', 'Change'),
    submit: t('Ver disponibilidad', 'Check availability'), pending: t('Consultando…', 'Checking…'), done: t('Listo', 'Done'), close: t('Cerrar', 'Close'),
    otherDay: t('Otro día', 'Another day'), full: t('lleno', 'full'),
    decrement: t('Quitar una noche', 'Remove a night'), increment: t('Añadir una noche', 'Add a night'),
    missing: t('Falta {list}.', 'Missing {list}.'),
    datePicker: { prev: t('Mes anterior', 'Previous month'), next: t('Mes siguiente', 'Next month'), dialog: t('Elige un día', 'Pick a day'), close: t('Cerrar', 'Close'), checkoutOnly: t(', solo salida', ', check-out only'), chooseMonth: t('Elegir mes', 'Choose month'), chooseYear: t('Elegir año', 'Choose year'), prevYear: t('Año anterior', 'Previous year'), nextYear: t('Año siguiente', 'Next year'), prevYears: t('Años anteriores', 'Earlier years'), nextYears: t('Años siguientes', 'Later years') }
  }
  return {
    filas,
    labels: {
      ...comunes,
      phrase: t('Llego el {from}, me quedo {nights} y somos {party}.', 'I arrive on {from}, stay {nights} and we are {party}.'),
      empty: { from: t('¿qué día?', 'which day?'), nights: t('¿cuántas noches?', 'how many nights?') },
      errors: { dates: t('Elige las fechas.', 'Pick the dates.'), night: t('No quedan habitaciones la noche del {date}.', 'No rooms left the night of {date}.'), nights: t('Elige un número de noches válido.', 'Pick a valid number of nights.') }
    },
    labelsMesa: {
      ...comunes,
      submit: t('Reservar mesa', 'Book a table'),
      phrase: t('Mesa para {party} el {date} a las {time}.', 'Table for {party} on {date} at {time}.'),
      empty: { date: t('¿qué día?', 'which day?'), time: t('¿a qué hora?', 'what time?') },
      errors: { date: t('Elige el día.', 'Pick the day.'), time: t('Elige un turno.', 'Pick a time slot.') }
    },
    labelsRecorrido: {
      ...comunes,
      submit: t('Ver salidas', 'See departures'),
      phrase: t('Quiero hacer {tour} el {date}, para {party}.', 'I want to take {tour} on {date}, for {party}.'),
      empty: { tour: t('¿qué recorrido?', 'which tour?'), date: t('¿qué día?', 'which day?') },
      errors: { tour: t('Elige un recorrido.', 'Pick a tour.'), date: t('Elige el día.', 'Pick the day.') }
    },
    filasMesa: [{ key: 'people', label: t('Personas', 'People'), min: 1, default: 2, unit: (n) => plural(n, 'persona', 'personas', 'person', 'people'), decrementLabel: t('Quitar una persona', 'Remove a person'), incrementLabel: t('Añadir una persona', 'Add a person') }],
    recorridos: [
      { value: 'centro', label: t('Centro histórico', 'Historic center'), description: t('2 horas a pie', '2 hours on foot') },
      { value: 'cerro', label: t('Subida al cerro', 'Hill climb'), description: t('Medio día', 'Half a day') }
    ]
  }
}
const ES = construir(false)
const EN = construir(true)
const pair = (k) => ({ es: ES[k], en: EN[k] })
const filas = pair('filas')
const labels = pair('labels')
const labelsMesa = pair('labelsMesa')
const labelsRecorrido = pair('labelsRecorrido')
const filasMesa = pair('filasMesa')
const recorridos = pair('recorridos')
const turnos = [
  { value: '19:30', label: '19:30' },
  { value: '20:30', label: '20:30', disabled: true },
  { value: '21:30', label: '21:30' }
]

export default {
  exclude: ['kind', 'dock', 'min', 'max', 'locale', 'id', 'headingLevel', 'disabledDates', 'disabledNights', 'minNights', 'maxNights', 'times', 'tours', 'quickDays', 'names'],
  controls: ['appearance', 'pending', 'disabled'],
  text: ['title'],
  block: true,
  model: { value: null, var: 'consulta' },
  imports: ["import { GBookingBar } from '@grana/vue/booking'"],
  script: '// filas y textos son de tu aplicación: ver «Filas» y «Textos (labels)» del README',
  base: {
    kind: 'stay',
    title: { es: 'Consulta disponibilidad', en: 'Check availability' },
    partyRows: filas,
    names: { from: 'checkin', to: 'checkout', party: 'guests' },
    labels
  },
  code: { partyRows: ':party-rows="filas"', labels: ':labels="textos"' },
  cases: [
    {
      title: { es: 'La estancia como una frase', en: 'The stay as a sentence' },
      why: { es: 'La forma por defecto y la que mejor se lee en un hotel: el huésped dice cuántas noches se queda y la salida vuelve en palabras. Si prefieres campos con etiqueta visible, usa la barra.', en: 'The default and the one that reads best for a hotel: the guest says how many nights and the checkout comes back in words. If you prefer fields with a visible label, use the bar.' },
      props: {}
    },
    {
      title: { es: 'Una mesa para esta noche', en: 'A table for tonight' },
      why: { es: 'Con kind table la consulta es fecha, turno y personas; los turnos llenos se deshabilitan con un sufijo de texto («lleno»), no solo con color.', en: 'With kind table the query is date, time slot and people; full slots are disabled with a text suffix (“full”), not only color.' },
      props: { kind: 'table', partyRows: filasMesa, times: turnos, quickDays: 7, labels: labelsMesa, names: { date: 'fecha', time: 'turno', party: 'personas' } }
    },
    {
      title: { es: 'Elegir un recorrido', en: 'Choosing a tour' },
      why: { es: 'Con kind tour la frase empieza por el recorrido; sin tours, Grana avisa (un recorrido escrito a mano no existe).', en: 'With kind tour the sentence starts with the tour; without tours, Grana warns (a hand-written tour does not exist).' },
      props: { kind: 'tour', partyRows: filasMesa, tours: recorridos, labels: labelsRecorrido, names: { tour: 'recorrido', date: 'fecha', party: 'personas' } }
    },
    {
      title: { es: 'La barra, para una cabecera ancha', en: 'The bar, for a wide header' },
      why: { es: 'appearance bar muestra campos con etiqueta en una fila; si no cabe, pasa a un resumen con la acción y los campos se abren en una hoja.', en: 'appearance bar shows labeled fields in a row; if it does not fit, it becomes a summary plus the action and the fields open in a sheet.' },
      props: { appearance: 'bar' }
    },
    {
      title: { es: 'Mientras la aplicación consulta', en: 'While the app is querying' },
      why: { es: 'pending pone la acción en carga con labels.pending y una región viva, sin bloquear la edición: la consulta puede cambiar mientras llega la respuesta.', en: 'pending puts the action in loading with labels.pending and a live region, without blocking editing: the query can change while the answer arrives.' },
      props: { pending: true }
    }
  ]
}
