// GbQuickView · la `Props` de la sección (dueño: bruno; design/contracts/blocks/quick-view.md, _comun.md §1 regla 3, §27,
// #909, #919). Un solo objeto, importado por las tres variantes: la misma `Props` que Product overview más `open`, `from` y
// los textos `close`, `full` y `dialog` (en `labels`). Comparte el panel con E4 por common/ProductPanel.js.
export const props = {
  product: { type: Object, required: true },
  open: { type: Boolean, default: undefined },
  // El disparador, tal cual a `from` de GDialog (#583): `id` o elemento (sin DOM en SSR, el tipo de elemento es Object)
  from: { type: [String, typeof HTMLElement === 'undefined' ? Object : HTMLElement], default: undefined },
  selection: { type: Object, default: undefined },
  quantity: { type: Number, default: undefined },
  prices: { type: Object, default: undefined },
  busy: { type: Boolean, default: false },
  locale: { type: String, default: undefined },
  labels: { type: Object, required: true }
}

// `navigate` del enlace a la ficha completa (item = product) y del enlace a las opiniones (item = product.reviews)
export const emits = ['update:open', 'add', 'select', 'update:selection', 'update:quantity', 'navigate']
