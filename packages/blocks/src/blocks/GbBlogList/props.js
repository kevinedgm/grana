// GbBlogList · la `Props` de la sección (dueño: bruno; design/contracts/blocks/blog-list.md, _comun.md §1 regla 3, #815,
// #825). Un solo objeto, importado por las tres variantes.
export const props = {
  title: { type: String, required: true },
  description: { type: String, default: undefined },
  posts: { type: Array, required: true },
  locale: { type: String, default: undefined },
  labels: { type: Object, default: () => ({}) }
}

export const emits = ['navigate']

/** Tope recomendado (C7). */
export const MAX_POSTS = 24
