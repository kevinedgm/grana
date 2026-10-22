// GbTestimonials · la `Props` de la sección (dueño: bruno; design/contracts/blocks/testimonials.md, _comun.md §1 regla 3,
// #815, #821). Un solo objeto, importado por las tres variantes. `rating` queda reservado (M-L2).
export const props = {
  title: { type: String, required: true },
  description: { type: String, default: undefined },
  items: { type: Array, required: true },
  labels: { type: Object, default: () => ({}) }
}

// `navigate` solo con un `source.href` interno (las fuentes externas no navegan, #574). Sin `activate`: una fuente
// siempre es un enlace.
export const emits = ['navigate']

/** Rango recomendado (C7). */
export const RANGE = [1, 12]

/** Una cita más larga avisa T2 (se pinta entera). */
export const LONG_QUOTE = 600
