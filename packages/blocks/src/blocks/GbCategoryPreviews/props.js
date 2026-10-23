// GbCategoryPreviews · la `Props` de la sección (dueño: bruno; design/contracts/blocks/category-previews.md, _comun.md §1
// regla 3, §27, #909, #917). Un solo objeto, importado por las tres variantes.
export const props = {
  title: { type: String, required: true },
  description: { type: String, default: undefined },
  categories: { type: Array, required: true },
  action: { type: Object, default: undefined },
  locale: { type: String, default: undefined },
  labels: { type: Object, default: () => ({}) }
}

export const emits = ['navigate', 'activate']

/** Tope recomendado de categorías (C7). */
export const MAX_CATEGORIES = 12
