// GbOrderSummary · la `Props` de la sección (dueño: bruno; design/contracts/blocks/order-summary.md, _comun.md §1 regla 3,
// §27, #909, #923). Un solo objeto, importado por las tres variantes.
export const props = {
  title: { type: String, required: true },
  order: { type: Object, required: true },
  prices: { type: Object, required: true },
  actions: { type: Array, default: () => [] },
  timeZone: { type: String, default: undefined },
  locale: { type: String, default: undefined },
  labels: { type: Object, required: true }
}

export const emits = ['navigate', 'activate']

/** Líneas recomendadas como máximo en la tarjeta de 01 (OS2: la tarjeta es para una columna). */
export const MAX_CARD_LINES = 30
