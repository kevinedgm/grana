// GbBookingSummary · la `Props` de la sección (dueño: bruno; design/contracts/blocks/booking-summary.md, _comun.md §1
// regla 3, §15, #860, #871). Un solo objeto, importado por las tres variantes.
export const props = {
  title: { type: String, required: true },
  query: { type: Object, required: true },
  partyRows: { type: Array, required: true },
  context: { type: Object, default: undefined },
  offer: { type: Object, default: undefined },
  totals: { type: Object, default: undefined },
  prices: { type: Object, default: undefined },
  assurance: { type: String, default: undefined },
  actions: { type: Array, default: undefined },
  locale: { type: String, default: undefined },
  labels: { type: Object, required: true }
}

export const emits = ['navigate', 'activate']

/** Tope recomendado de líneas del desglose (R2, el C7 de esta sección). */
export const MAX_LINES = 8
