// GbCta · la `Props` de la sección (dueño: bruno; design/contracts/blocks/cta.md, _comun.md §1 regla 3, #815, #822).
// Un solo objeto, importado por las tres variantes. `media` solo la usa 02; las demás la ignoran en silencio.
export const props = {
  title: { type: String, required: true },
  description: { type: String, default: undefined },
  actions: { type: Array, required: true },
  assurance: { type: String, default: undefined },
  media: { type: Object, default: undefined },
  labels: { type: Object, default: () => ({}) }
}

export const emits = ['navigate', 'activate']
