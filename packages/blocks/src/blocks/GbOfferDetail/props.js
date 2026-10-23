// GbOfferDetail · la `Props` de la sección (dueño: bruno; design/contracts/blocks/offer-detail.md, _comun.md §1 regla 3,
// §15, #860, #869). Un solo objeto, importado por las tres variantes.
export const props = {
  offer: { type: Object, required: true },
  query: { type: Object, default: undefined },
  partyRows: { type: Array, default: undefined },
  context: { type: Object, default: undefined },
  prices: { type: Object, default: undefined },
  locale: { type: String, default: undefined },
  labels: { type: Object, required: true }
}

// `book` de «Reservar» (sin slot `consult`, oferta disponible). Sin `navigate`: la ficha no tiene enlaces de navegación
// propios (los enlaces a un espacio son anclas de la propia página)
export const emits = ['book']

/** Datos de la ficha recomendados (C7 por encima). */
export const MAX_FACTS = 6
