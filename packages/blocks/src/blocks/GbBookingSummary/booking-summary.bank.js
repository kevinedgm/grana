// Banco único de GbBookingSummary (dueño: bruno; booking-summary.md «Banco», _comun.md §7 y §20): el mismo juego de datos
// pasa igual por las tres variantes en Vitest, en el playground y en el spec. Sin errores a propósito: con él, ninguna
// variante avisa. La consulta, las filas y los textos de la consulta son los comunes de bank/booking.js. Las líneas del
// desglose NO suman el total a propósito (1,850 + 2,100 + 123 = 4,073 ≠ 4,290): el bloque pinta el total dado y no suma.
import { PARTY_ROWS, PRICES, PRICE_LABELS, QUERY_LABELS, photos, query } from '../bank/booking.js'

const mxn = (amount) => ({ amount, currency: 'MXN' })

export const props = {
  title: 'Tu reserva',
  query: query(),
  partyRows: PARTY_ROWS,
  offer: { id: 'suite-jardin', name: 'Suite Jardín', kind: 'Suite', photos: photos(1), price: { value: mxn(1850), lead: 'desde', unit: '/ noche', unitLabel: 'por noche' } },
  totals: {
    lines: [
      { label: 'Viernes 13 de noviembre', amount: mxn(1850) },
      { label: 'Sábado 14 de noviembre', amount: mxn(2100), note: 'Tarifa de fin de semana' },
      { label: 'Impuesto de hospedaje', amount: mxn(123), note: '3 %' }
    ],
    total: { value: mxn(4290), label: 'por 2 noches' },
    note: 'Pagas al llegar: no te cobramos nada ahora.'
  },
  prices: PRICES,
  assurance: 'Cancelación gratis hasta el 11 de noviembre.',
  actions: [
    { id: 'continuar', label: 'Continuar', href: '/reservar/datos' },
    { id: 'fechas', label: 'Cambiar fechas', href: '/reservar' }
  ],
  locale: 'es',
  labels: {
    when: 'Fechas y personas',
    lines: 'Desglose',
    query: QUERY_LABELS,
    price: PRICE_LABELS,
    external: 'se abre en otra pestaña'
  }
}

export const slots = {}

/** Estados de prueba (no los usa el banco por defecto): el total cambia (las cifras que cambian ruedan, regla de GPrice). */
export const states = {
  tres: { totals: { lines: [{ label: 'Tres noches', amount: mxn(5950) }], total: { value: mxn(5950), label: 'por 3 noches' } } }
}
