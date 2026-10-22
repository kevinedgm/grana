// GbFeatures · la `Props` de la sección (dueño: bruno; design/contracts/blocks/features.md, _comun.md §1 regla 3, #815).
// Un solo objeto, importado por las tres variantes.
export const props = {
  title: { type: String, required: true },
  description: { type: String, default: undefined },
  items: { type: Array, required: true },
  labels: { type: Object, default: () => ({}) }
}

export const emits = ['navigate', 'activate']

/** Tope recomendado (C7). */
export const MAX_ITEMS = 12
