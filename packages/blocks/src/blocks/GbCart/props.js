// GbCart · la `Props` de la sección (dueño: bruno; design/contracts/blocks/cart.md, _comun.md §1 regla 3, §27, §29, #909,
// #911, #921). Un solo objeto, importado por las tres variantes.
export const props = {
  title: { type: String, required: true },
  lines: { type: Array, required: true },
  totals: { type: Object, required: true },
  prices: { type: Object, required: true },
  actions: { type: Array, required: true },
  assurance: { type: String, default: undefined },
  busy: { type: Array, default: () => [] },
  open: { type: Boolean, default: false },
  from: { type: [String, Object], default: null },
  locale: { type: String, default: undefined },
  labels: { type: Object, required: true }
}

export const emits = ['change', 'remove', 'restore', 'navigate', 'activate', 'update:open']

/** Líneas recomendadas como máximo (C7). */
export const MAX_LINES = 50
