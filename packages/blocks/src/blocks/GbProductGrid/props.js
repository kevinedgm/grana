// GbProductGrid · la `Props` de la sección (dueño: bruno; design/contracts/blocks/product-grid.md, _comun.md §1 regla 3,
// §27, #909, #916). Un solo objeto, importado por las tres variantes. El bloque no filtra ni ordena: dice lo que la
// aplicación le da y emite lo que la persona pide (filtros, orden y página son estado de vista con v-model).
export const props = {
  title: { type: String, required: true },
  description: { type: String, default: undefined },
  products: { type: Array, required: true },
  total: { type: Number, default: undefined },
  page: { type: Number, default: undefined },
  pageSize: { type: Number, default: undefined },
  facets: { type: Array, default: undefined },
  filters: { type: Object, default: undefined },
  sorts: { type: Array, default: undefined },
  sort: { type: String, default: undefined },
  loading: { type: Boolean, default: false },
  error: { type: [Boolean, String], default: false },
  sample: { type: Array, default: undefined },
  prices: { type: Object, required: true },
  busy: { type: Array, default: undefined },
  locale: { type: String, default: undefined },
  labels: { type: Object, required: true }
}

// `add`, `open` y `navigate` son los de la tarjeta (product-card.md), reemitidos; `retry` el de GLoadRegion
export const emits = ['update:filters', 'update:sort', 'update:page', 'add', 'open', 'navigate', 'retry']

/** Productos por página recomendados (C7 por encima). */
export const MAX_PRODUCTS = 48
