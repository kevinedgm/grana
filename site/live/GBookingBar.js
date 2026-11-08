// Ficha interactiva de GBookingBar. Controles desde GBookingBar.meta.json. Entrada propia: @grana/vue/booking.
const filas = [
  { key: 'adults', label: 'Adultos', min: 1, default: 2, unit: (n) => `${n} ${n === 1 ? 'adulto' : 'adultos'}`, decrementLabel: 'Quitar un adulto', incrementLabel: 'Añadir un adulto' },
  { key: 'rooms', label: 'Habitaciones', min: 1, default: 1, unit: (n) => `${n} ${n === 1 ? 'habitación' : 'habitaciones'}`, decrementLabel: 'Quitar una habitación', incrementLabel: 'Añadir una habitación' }
]
const comunes = {
  fields: { from: 'Llegada', to: 'Salida', nights: 'Noches', party: 'Huéspedes', date: 'Fecha', time: 'Turno', tour: 'Recorrido' },
  nights: (n) => `${n} ${n === 1 ? 'noche' : 'noches'}`,
  checkout: 'Salida el {date}',
  noDates: 'Sin fechas', noDate: 'Sin fecha', noTime: 'Sin turno', noTour: 'Sin recorrido', separator: ' · ',
  summaryTitle: 'Tu consulta', change: 'Cambiar',
  submit: 'Ver disponibilidad', pending: 'Consultando…', done: 'Listo', close: 'Cerrar',
  otherDay: 'Otro día', full: 'lleno',
  decrement: 'Quitar una noche', increment: 'Añadir una noche',
  missing: 'Falta {list}.',
  datePicker: { prev: 'Mes anterior', next: 'Mes siguiente', dialog: 'Elige un día', close: 'Cerrar', checkoutOnly: ', solo salida' }
}
const labels = {
  ...comunes,
  phrase: 'Llego el {from}, me quedo {nights} y somos {party}.',
  empty: { from: '¿qué día?', nights: '¿cuántas noches?' },
  errors: { dates: 'Elige las fechas.', night: 'No quedan habitaciones la noche del {date}.', nights: 'Elige un número de noches válido.' }
}
const labelsMesa = {
  ...comunes,
  submit: 'Reservar mesa',
  phrase: 'Mesa para {party} el {date} a las {time}.',
  empty: { date: '¿qué día?', time: '¿a qué hora?' },
  errors: { date: 'Elige el día.', time: 'Elige un turno.' }
}
const labelsRecorrido = {
  ...comunes,
  submit: 'Ver salidas',
  phrase: 'Quiero hacer {tour} el {date}, para {party}.',
  empty: { tour: '¿qué recorrido?', date: '¿qué día?' },
  errors: { tour: 'Elige un recorrido.', date: 'Elige el día.' }
}
const filasMesa = [{ key: 'people', label: 'Personas', min: 1, default: 2, unit: (n) => `${n} ${n === 1 ? 'persona' : 'personas'}`, decrementLabel: 'Quitar una persona', incrementLabel: 'Añadir una persona' }]
const turnos = [
  { value: '19:30', label: '19:30' },
  { value: '20:30', label: '20:30', disabled: true },
  { value: '21:30', label: '21:30' }
]
const recorridos = [
  { value: 'centro', label: 'Centro histórico', description: '2 horas a pie' },
  { value: 'cerro', label: 'Subida al cerro', description: 'Medio día' }
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
