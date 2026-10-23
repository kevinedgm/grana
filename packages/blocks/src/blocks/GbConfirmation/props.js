// GbConfirmation · la `Props` de la sección (dueño: bruno; design/contracts/blocks/confirmation.md, _comun.md §1 regla 3,
// §15, #860, #873). Un solo objeto, importado por las tres variantes.
export const props = {
  title: { type: String, required: true },
  state: { type: String, required: true },
  reference: { type: Object, required: true },
  query: { type: Object, required: true },
  partyRows: { type: Array, required: true },
  context: { type: Object, default: undefined },
  offer: { type: Object, default: undefined },
  totals: { type: Object, default: undefined },
  prices: { type: Object, default: undefined },
  next: { type: Array, default: undefined },
  channels: { type: Array, default: undefined },
  actions: { type: Array, default: undefined },
  timeZone: { type: String, default: undefined },
  locale: { type: String, default: undefined },
  labels: { type: Object, required: true }
}

export const emits = ['navigate', 'activate']

/** Estados (F1: fuera de lista se pinta `requested`; nunca se afirma una confirmación por defecto). */
export const STATES = ['confirmed', 'requested']
/** Tope recomendado de `next` (C7). */
export const MAX_NEXT = 6
