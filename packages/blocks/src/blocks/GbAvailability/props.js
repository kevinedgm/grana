// GbAvailability · la `Props` de la sección (dueño: bruno; design/contracts/blocks/availability.md, _comun.md §1 regla 3,
// §15, #860, #870). Un solo objeto, importado por las tres variantes.
export const props = {
  title: { type: String, required: true },
  description: { type: String, default: undefined },
  kind: { type: String, required: true },
  days: { type: Array, required: true },
  value: { type: [String, Object], default: undefined },
  min: { type: String, default: undefined },
  max: { type: String, default: undefined },
  minNights: { type: Number, default: undefined },
  maxNights: { type: Number, default: undefined },
  upcoming: { type: Number, default: undefined },
  total: { type: Object, default: undefined },
  query: { type: Object, default: null },
  partyRows: { type: Array, default: undefined },
  context: { type: Object, default: undefined },
  prices: { type: Object, default: undefined },
  locale: { type: String, default: undefined },
  labels: { type: Object, required: true }
}

export const emits = ['update:value', 'select']

/** Estados de un día (V1: fuera de lista cuenta como sin dato). */
export const STATUSES = ['open', 'few', 'full', 'closed']
/** Tope recomendado de días (C7). */
export const MAX_DAYS = 120
/** 02: cuántas fechas abiertas por defecto y su rango. */
export const UPCOMING = 8
export const UPCOMING_RANGE = [1, 30]
/** V3 (#801): desde cinco cifras un precio no cabe en la celda a 320 px. */
export const FIVE_DIGITS = 10000
