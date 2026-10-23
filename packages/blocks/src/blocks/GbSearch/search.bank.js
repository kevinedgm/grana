// Banco único de GbSearch (dueño: bruno; search.md «Banco», _comun.md §7 y §20): el mismo juego de datos pasa igual por
// las tres variantes en Vitest, en el playground y en el spec. Sin errores a propósito: con él, ninguna variante avisa.
// La consulta, las filas y los textos son los comunes de bank/booking.js (la misma línea en todas las secciones).
import { BAR_LABELS, PARTY_ROWS, query } from '../bank/booking.js'

export const props = {
  kind: 'stay',
  title: 'Consulta disponibilidad',
  query: query(),
  partyRows: PARTY_ROWS,
  // El viernes 20 de noviembre no queda ninguna habitación esa noche
  disabledNights: (iso) => iso === '2026-11-20',
  minNights: 1,
  maxNights: 14,
  note: 'Sin pago ahora · Te respondemos por WhatsApp en menos de 2 h',
  names: { from: 'checkin', to: 'checkout', party: 'guests' },
  locale: 'es',
  labels: { bar: BAR_LABELS }
}

export const slots = {}

/** Juegos de prueba solo para Vitest (search.md «Banco»): mesa con un turno lleno y recorrido. */
export const tests = {
  table: {
    ...props,
    kind: 'table',
    title: 'Reserva una mesa',
    query: { kind: 'table', date: '2026-11-13', time: '20:00', party: { adults: 2, children: 0, rooms: 1 } },
    disabledNights: undefined,
    minNights: undefined,
    maxNights: undefined,
    times: [{ value: '14:00', label: '2:00 p. m.' }, { value: '20:00', label: '8:00 p. m.' }, { value: '21:30', label: '9:30 p. m.', disabled: 'Lleno' }],
    labels: { bar: { ...BAR_LABELS, phrase: 'Mesa para {party} el {date} a las {time}.' } }
  },
  tour: {
    ...props,
    kind: 'tour',
    title: 'Reserva tu recorrido',
    query: { kind: 'tour', tour: 'monte-alban', date: '2026-11-14', party: { adults: 2, children: 1, rooms: 1 } },
    disabledNights: undefined,
    minNights: undefined,
    maxNights: undefined,
    tours: [{ value: 'monte-alban', label: 'Monte Albán', description: 'Medio día, a pie' }, { value: 'hierve', label: 'Hierve el Agua' }],
    labels: { bar: { ...BAR_LABELS, phrase: 'Quiero ir a {tour} el {date} y somos {party}.' } }
  }
}
