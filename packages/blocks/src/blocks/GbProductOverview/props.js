// GbProductOverview · la `Props` de la sección (dueño: bruno; design/contracts/blocks/product-overview.md, _comun.md §1
// regla 3, §27, #909, #918). Un solo objeto, importado por las tres variantes. Quick view (E5) tiene la misma `Props` más
// `open`, `from` y tres textos (quick-view.md), en su propio props.js: comparten el panel por common/ProductPanel.js.
export const props = {
  product: { type: Object, required: true },
  selection: { type: Object, default: undefined },
  quantity: { type: Number, default: undefined },
  prices: { type: Object, default: undefined },
  busy: { type: Boolean, default: false },
  locale: { type: String, default: undefined },
  labels: { type: Object, required: true }
}

// `navigate` solo del enlace a las opiniones (`product.reviews`, item = product.reviews)
export const emits = ['add', 'select', 'update:selection', 'update:quantity', 'navigate']
