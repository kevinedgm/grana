// GbOfferList · la `Props` de la sección (dueño: bruno; design/contracts/blocks/offer-list.md, _comun.md §1 regla 3, §15,
// #860, #868). Un solo objeto, importado por las tres variantes.
export const props = {
  title: { type: String, required: true },
  description: { type: String, default: undefined },
  offers: { type: Array, required: true },
  query: { type: Object, default: null },
  partyRows: { type: Array, default: undefined },
  context: { type: Object, default: undefined },
  prices: { type: Object, default: undefined },
  locale: { type: String, default: undefined },
  labels: { type: Object, default: () => ({}) }
}

export const emits = ['select', 'photos', 'navigate']

/** Tope recomendado de ofertas (C7). */
export const MAX_OFFERS = 24
