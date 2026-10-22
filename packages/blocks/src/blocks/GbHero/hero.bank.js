// Banco único de GbHero (dueño: bruno; hero.md «Banco», _comun.md §7): el mismo juego de datos pasa igual por las tres
// variantes en Vitest, en el playground y en el spec. Sin errores a propósito: con él, ninguna variante avisa.
import { h } from 'vue'
import { GBookingBar } from '@grana/vue/booking'
import { LONG_WORD, media } from '../bank/fotos.js'

export const bookingLabels = {
  phrase: 'Llego el {from}, me quedo {nights} y somos {party}.',
  fields: { from: 'Llegada', to: 'Salida', nights: 'Noches', date: 'Día', time: 'Hora', tour: 'Recorrido', party: 'Huéspedes' },
  empty: { from: '¿qué día?', nights: '¿cuántas noches?', date: '¿qué día?', time: '¿a qué hora?', tour: '¿cuál?' },
  nights: (n) => `${n} ${n === 1 ? 'noche' : 'noches'}`, checkout: 'Salida el {date}', noDates: 'Sin fechas', noDate: 'Sin fecha', noTime: 'Sin hora', noTour: 'Sin recorrido',
  separator: ' · ', summaryTitle: 'Tu consulta', change: 'Cambiar', submit: 'Ver disponibilidad', pending: 'Consultando…', close: 'Cerrar', done: 'Listo', otherDay: 'Otro día', full: 'lleno',
  decrement: 'Una noche menos', increment: 'Una noche más',
  errors: { dates: 'Elige la llegada y las noches.', night: 'No quedan habitaciones la noche del {date}.', nights: 'Elige entre 1 y 14 noches.', date: 'Elige el día.', time: 'Elige la hora.', tour: 'Elige el recorrido.' },
  missing: (n, v) => (n === 1 ? `Falta un dato: ${v.list}` : `Faltan ${v.count} datos: ${v.list}`),
  datePicker: { prev: 'Mes anterior', next: 'Mes siguiente', dialog: 'Elegir fecha', close: 'Cerrar', today: 'hoy', selected: 'elegida', unavailable: 'sin disponibilidad', checkoutOnly: 'solo salida', rangeStart: 'llegada', rangeEnd: 'salida', rangeSingle: 'llegada y salida', inRange: 'en tu estancia', done: 'Listo', announceStart: 'Llegada {date}. Elige la salida.', announceEnd: 'Del {start} al {end}.', announceDate: '{date}.' }
}

const partyRows = [
  { key: 'adults', label: 'Adultos', min: 1, default: 2, unit: (n) => `${n} ${n === 1 ? 'adulto' : 'adultos'}`, decrementLabel: 'Quitar adulto', incrementLabel: 'Añadir adulto' },
  { key: 'rooms', label: 'Habitaciones', min: 1, max: (v) => v.adults, unit: (n) => `${n} ${n === 1 ? 'habitación' : 'habitaciones'}`, decrementLabel: 'Quitar habitación', incrementLabel: 'Añadir habitación' }
]

export const props = {
  title: 'Casa Alcalá',
  eyebrow: 'Hotel boutique · Centro histórico de Oaxaca',
  lead: `Doce habitaciones alrededor de un patio de cantera verde, a dos calles de Santo Domingo. ${LONG_WORD}.`,
  aside: 'Desayuno incluido · Llegada desde las 15:00',
  media: media('patio', 1600, 2000),
  detail: media('mezcal', 600, 600),
  views: [
    { value: 'patio', label: 'Patio', media: media('patio', 1600, 900) },
    { value: 'terraza', label: 'Terraza', media: media('terraza', 1600, 900) },
    { value: 'cantera', label: 'Habitación Cantera', media: media('habitacion', 1600, 900) }
  ],
  actions: [
    { id: 'reservar', label: 'Reservar', href: '#reservar' },
    { id: 'habitaciones', label: 'Ver habitaciones', href: '#habitaciones' }
  ],
  labels: { views: 'Vistas', pause: 'Pausar el movimiento', external: 'se abre en otra pestaña' }
}

/** Slots del banco: la consulta (solo la usa 03; 01 y 02 la ignoran). */
export const slots = {
  consult: () => h(GBookingBar, { kind: 'stay', title: 'Consulta disponibilidad', partyRows, labels: bookingLabels })
}
