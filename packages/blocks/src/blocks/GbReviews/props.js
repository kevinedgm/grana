// GbReviews · la `Props` de la sección (dueño: bruno; design/contracts/blocks/reviews.md, _comun.md §1 regla 3, §27,
// #909, #912, #920). Un solo objeto, importado por las tres variantes. La calificación se dice en palabras (sin estrellas,
// M-L2 reservada); la distribución se lee como texto y sus barras son decorativas (EC-L2).
export const props = {
  title: { type: String, required: true },
  description: { type: String, default: undefined },
  summary: { type: Object, default: undefined },
  reviews: { type: Array, required: true },
  total: { type: Number, default: undefined },
  page: { type: Number, default: undefined },
  pageSize: { type: Number, default: undefined },
  action: { type: Object, default: undefined },
  locale: { type: String, default: undefined },
  labels: { type: Object, required: true }
}

// `navigate`: la acción con href y la fuente interna de una opinión (§4); `activate`: la acción sin href
export const emits = ['update:page', 'navigate', 'activate']

/** Opiniones por página recomendadas (C7 por encima). */
export const MAX_REVIEWS = 20
/** Una cita más larga avisa RV3 (se pinta entera). */
export const LONG_QUOTE = 1200
