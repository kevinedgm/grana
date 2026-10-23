// Banco único de GbOfferList (dueño: bruno; offer-list.md «Banco», _comun.md §7 y §20): el mismo juego de datos pasa igual
// por las tres variantes en Vitest, en el playground y en el spec. Sin errores a propósito: con él, ninguna variante
// avisa. La consulta, las filas y los textos de la consulta son los comunes de bank/booking.js. Cubre: una oferta con nueve
// fotos agrupadas y la cuenta para la consulta, una con href, una no disponible con su motivo, un precio null («a
// consultar»), un precio en dos monedas con approximate, un texto en inglés con lang (en `perks` no hay idioma: va en el
// nombre de la Terraza, que la aplicación da en español) y una mínima (id, name y una foto).
import { LONG_WORD } from '../bank/fotos.js'
import { GALLERY_LABELS, PARTY_ROWS, PRICES, PRICE_LABELS, QUERY_LABELS, photos, query } from '../bank/booking.js'

const mxn = (amount) => ({ amount, currency: 'MXN' })

export const props = {
  title: 'Habitaciones',
  description: 'Cinco habitaciones alrededor de un patio de cantera, a dos calles de Santo Domingo.',
  query: query(),
  partyRows: PARTY_ROWS,
  prices: PRICES,
  locale: 'es',
  offers: [
    {
      id: 'suite-jardin',
      name: 'Suite Jardín',
      kind: 'Suite',
      summary: 'La más amplia, con jardín privado y tina.',
      photos: photos(9),
      badge: 'La más pedida',
      facts: [{ label: 'Personas', value: 'Hasta 3' }, { label: 'Tamaño', value: '42 m²' }, { label: 'Cama', value: 'King' }],
      perks: ['Desayuno incluido', 'Cancelación gratis hasta 48 h antes'],
      price: { value: mxn(1850), lead: 'desde', unit: '/ noche', unitLabel: 'por noche', total: { value: mxn(4100), label: 'por 2 noches' } }
    },
    {
      id: 'doble-patio',
      name: 'Doble Patio',
      kind: 'Habitación doble',
      summary: 'Ventana al patio de los arcos; tranquila de noche.',
      photos: photos(3),
      href: '/habitaciones/doble-patio',
      facts: [{ label: 'Personas', value: 'Hasta 2' }, { label: 'Tamaño', value: '24 m²' }],
      perks: ['Desayuno incluido'],
      price: { value: [mxn(1450), { amount: 82, currency: 'USD', approximate: true }], lead: 'desde', unit: '/ noche', unitLabel: 'por noche', total: { value: mxn(3100), label: 'por 2 noches' } }
    },
    {
      id: 'sencilla-cantera',
      name: 'Sencilla Cantera',
      kind: 'Habitación sencilla',
      summary: `Para quien viaja solo; ${LONG_WORD}.`,
      photos: photos(2),
      facts: [{ label: 'Personas', value: '1' }],
      available: 'No quedan para el 14 de noviembre',
      price: { value: mxn(980), unit: '/ noche', unitLabel: 'por noche' }
    },
    {
      id: 'terraza',
      name: 'Terraza',
      kind: 'Suite en la azotea',
      summary: 'Con vista a la cúpula de Santo Domingo; se reserva por mensaje.',
      photos: photos(1),
      price: { value: null }
    },
    // En inglés (§20, #885): el nombre de la casa no se traduce
    { id: 'minima', name: 'The Mezcal Room', lang: 'en', photos: photos(1) }
  ],
  labels: {
    select: 'Elegir',
    photos: (n) => `Ver ${n} fotos`,
    unavailable: 'No disponible en tus fechas',
    forQuery: 'Para {query}',
    query: QUERY_LABELS,
    price: PRICE_LABELS,
    gallery: GALLERY_LABELS,
    external: 'se abre en otra pestaña'
  }
}

export const slots = {}
