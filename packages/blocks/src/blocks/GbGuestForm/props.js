// GbGuestForm · la `Props` de la sección (dueño: bruno; design/contracts/blocks/guest-form.md, _comun.md §1 regla 3, §15,
// #860, #872). Un solo objeto, importado por las tres variantes.
export const props = {
  title: { type: String, required: true },
  description: { type: String, default: undefined },
  fields: { type: Array, required: true },
  groups: { type: Array, default: undefined },
  values: { type: Object, default: undefined },
  party: { type: Object, default: undefined },
  partyRows: { type: Array, default: undefined },
  query: { type: Object, default: null },
  context: { type: Object, default: undefined },
  consents: { type: Array, default: undefined },
  offer: { type: Object, default: undefined },
  prices: { type: Object, default: undefined },
  action: { type: Object, required: true },
  step: { type: String, default: undefined },
  busy: { type: Boolean, default: false },
  errors: { type: Object, default: undefined },
  error: { type: String, default: undefined },
  locale: { type: String, default: undefined },
  labels: { type: Object, required: true }
}

export const emits = ['submit', 'update:values', 'update:step', 'navigate']

/** Tipos de campo (lista cerrada, G1) y el componente que los pinta. */
export const TYPES = ['text', 'email', 'tel', 'textarea', 'select', 'date']
/** Tope recomendado de campos (C7). */
export const MAX_FIELDS = 12
