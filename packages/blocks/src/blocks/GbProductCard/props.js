// GbProductCard · la `Props` de la sección (dueño: bruno; design/contracts/blocks/product-card.md, _comun.md §1 regla 3,
// §27, #909, #915). Un solo objeto, importado por las tres variantes.
export const props = {
  product: { type: Object, required: true },
  prices: { type: Object, default: undefined },
  busy: { type: Boolean, default: false },
  locale: { type: String, default: undefined },
  labels: { type: Object, default: () => ({}) }
}

export const emits = ['navigate', 'open', 'add']
