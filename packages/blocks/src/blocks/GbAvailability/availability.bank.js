// Banco único de GbAvailability (dueño: bruno; availability.md «Banco», _comun.md §7 y §20): el mismo juego de datos
// pasa igual por las tres variantes en Vitest, en el playground y en el spec. Sin errores a propósito: con él, ninguna
// variante avisa. Casa Alcalá, noviembre de 2026: 30 días con precios de cuatro cifras (viernes y sábado más caros), tres
// con pocas habitaciones, el viernes 20 lleno (noche agotada: sirve de salida), dos cerrados y uno sin dato (el 25); la
// estancia de la consulta común (13 a 15) como valor y su total, de la aplicación.
import { BAR_LABELS, PARTY_ROWS, PRICES, PRICE_LABELS, QUERY_LABELS, query } from '../bank/booking.js'

const mxn = (amount) => ({ amount, currency: 'MXN' })
const iso = (d) => `2026-11-${String(d).padStart(2, '0')}`
// 1 de noviembre de 2026 es domingo: viernes = 6, 13, 20, 27; sábado = 7, 14, 21, 28
const weekend = (d) => [5, 6].includes((d + 6) % 7)
const SPECIAL = {
  12: { status: 'few', note: 'Quedan 2' },
  14: { status: 'few', note: 'Queda 1' },
  20: { status: 'full' },
  22: { status: 'few' },
  2: { status: 'closed' },
  3: { status: 'closed' }
}

export const DAYS = Array.from({ length: 30 }, (_, i) => i + 1)
  .filter((d) => d !== 25)
  .map((d) => {
    const s = SPECIAL[d] || { status: 'open' }
    const day = { date: iso(d), status: s.status }
    if (s.status === 'open' || s.status === 'few') day.price = { value: mxn(weekend(d) ? 2100 : 1850) }
    if (s.note) day.note = s.note
    return day
  })

export const props = {
  title: 'Disponibilidad',
  description: 'Precio por noche de la Suite Jardín, con impuestos incluidos.',
  kind: 'stay',
  days: DAYS,
  value: { start: '2026-11-13', end: '2026-11-15' },
  min: '2026-11-01',
  max: '2026-11-30',
  minNights: 1,
  upcoming: 6,
  total: { value: mxn(4290), label: 'por 2 noches' },
  query: query(),
  partyRows: PARTY_ROWS,
  prices: PRICES,
  locale: 'es',
  labels: {
    status: { few: 'quedan pocas', full: 'lleno', closed: 'cerrado' },
    select: 'Elegir estas fechas',
    upcoming: 'Próximas fechas',
    query: QUERY_LABELS,
    datePicker: { ...BAR_LABELS.datePicker, checkoutOnly: 'solo salida' },
    price: PRICE_LABELS
  }
}

export const slots = {}

/** Estados de prueba: una mesa (un día, sin noches). */
export const states = {
  mesa: { kind: 'table', value: '2026-11-13', minNights: undefined, query: { kind: 'table', date: '2026-11-13', time: '20:00', party: { adults: 2, children: 1, rooms: 1 } } }
}
