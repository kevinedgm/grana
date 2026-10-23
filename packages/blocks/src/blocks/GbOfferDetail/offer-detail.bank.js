// Banco único de GbOfferDetail (dueño: bruno; offer-detail.md «Banco», _comun.md §7 y §20): el mismo juego de datos pasa
// igual por las tres variantes en Vitest, en el playground y en el spec. Sin errores a propósito: con él, ninguna variante
// avisa. Suite Jardín: nueve fotos en cuatro espacios (Habitación, Baño con id «fotos-bano», Terraza, Jardín), facts
// (capacidad, 38 m², cama king y el baño con su espacio), perks, descripción en dos párrafos (uno con una palabra larga sin
// espacios, §7), tres apartados (Qué incluye con items, La cama, Llegada), el precio con la cuenta para la consulta común,
// la región MXN y la consulta común. Sin slot `consult` (el banco base reserva con «Reservar»); el caso con
// GbSearch01 en el slot va en Vitest y en el playground (?consult=1).
import { LONG_WORD, foto } from '../bank/fotos.js'
import { GALLERY_LABELS, PARTY_ROWS, PRICES, PRICE_LABELS, QUERY_LABELS, query } from '../bank/booking.js'

const mxn = (amount) => ({ amount, currency: 'MXN' })
const PH = [
  ['habitacion', 'habitacion', 'Cama king de lino frente al muro de adobe'],
  ['habitacion', 'habitacion', 'Escritorio de mezquite junto a la ventana'],
  ['traslado', 'bano', 'Regadera de piedra volcánica con luz cenital'],
  ['traslado', 'bano', 'Lavabo de barro negro de San Bartolo Coyotepec'],
  ['terraza', 'terraza', 'Terraza privada con dos sillones de palma'],
  ['terraza', 'terraza', 'La cúpula de Santo Domingo desde la terraza'],
  ['patio', 'jardin', 'Jardín con buganvilia y una fuente de cantera'],
  ['patio', 'jardin', 'Camino de piedra entre los naranjos'],
  ['desayuno', 'jardin', 'Desayuno servido en la mesa del jardín']
]
/** Nueve fotos de GGallery con su espacio (alt obligatorio). */
export const PHOTOS = PH.map(([key, group, alt], i) => ({ id: `s${i + 1}`, src: foto(key, 1600, 1066), thumb: foto(key, 320, 213), width: 1600, height: 1066, alt, group }))

export const props = {
  offer: {
    id: 'suite-jardin',
    name: 'Suite Jardín',
    kind: 'Suite',
    summary: 'La más amplia de la casa, con jardín privado y terraza a la cúpula.',
    photos: PHOTOS,
    groups: [
      { value: 'habitacion', label: 'La habitación', id: 'fotos-habitacion' },
      { value: 'bano', label: 'El baño', id: 'fotos-bano' },
      { value: 'terraza', label: 'La terraza', id: 'fotos-terraza' },
      { value: 'jardin', label: 'El jardín', id: 'fotos-jardin' }
    ],
    facts: [
      { label: 'Personas', value: 'Hasta 3' },
      { label: 'Tamaño', value: '38 m²' },
      { label: 'Cama', value: 'King de lino' },
      { label: 'Baño', value: 'Regadera de piedra', group: 'bano' }
    ],
    perks: ['Desayuno incluido', 'Cancelación gratis hasta 48 h antes'],
    price: { value: mxn(1850), lead: 'desde', unit: '/ noche', unitLabel: 'por noche', total: { value: mxn(4100), label: 'por 2 noches' } },
    description: `La Suite Jardín ocupa la antigua sala de la casa: techos de viga, muros de adobe y una puerta de dos hojas que da al jardín.\n\nDesde la terraza se ve la cúpula de Santo Domingo; ${LONG_WORD}.`,
    sections: [
      { id: 'incluye', title: 'Qué incluye', body: 'Todo lo que necesitas para no salir de la casa.', items: ['Desayuno oaxaqueño en el jardín', 'Agua de garrafón y café de olla', 'Wifi en toda la casa'] },
      { id: 'cama', title: 'La cama', body: 'Colchón firme de 2 × 2 m con sábanas de lino lavado.\n\nPodemos poner una cama extra para un niño de hasta 12 años.' },
      { id: 'llegada-suite', title: 'Llegada', body: 'Te esperamos desde las 15:00; si llegas antes, guardamos tu equipaje.' }
    ]
  },
  query: query(),
  partyRows: PARTY_ROWS,
  prices: PRICES,
  locale: 'es',
  labels: {
    photos: 'Fotos de la suite',
    facts: 'La suite',
    perks: 'Incluye',
    book: 'Reservar esta suite',
    unavailable: 'No disponible en tus fechas',
    showPhotos: (group) => `Ver ${group.charAt(0).toLowerCase()}${group.slice(1)}`,
    details: 'Descripción',
    tabs: 'Sobre la suite',
    forQuery: 'Para {query}',
    query: QUERY_LABELS,
    gallery: GALLERY_LABELS,
    price: PRICE_LABELS
  }
}

export const slots = {}
