// GbNewsletter · la `Props` de la sección (dueño: bruno; design/contracts/blocks/newsletter.md, _comun.md §1 regla 3,
// #815, #824). Un solo objeto, importado por las tres variantes.
export const props = {
  title: { type: String, required: true },
  description: { type: String, default: undefined },
  field: { type: Object, required: true },
  action: { type: Object, required: true },
  legal: { type: Object, default: undefined },
  busy: { type: Boolean, default: false },
  error: { type: String, default: undefined },
  done: { type: String, default: undefined },
  labels: { type: Object, default: () => ({}) }
}

export const emits = ['submit', 'navigate']
