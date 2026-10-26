// GbOrderHistory · la `Props` de la sección (dueño: bruno; design/contracts/blocks/order-history.md, _comun.md §1 regla 3,
// §27, #909, #924). Un solo objeto, importado por las tres variantes.
export const props = {
  title: { type: String, required: true },
  orders: { type: Array, required: true },
  total: { type: Number, default: undefined },
  page: { type: Number, default: undefined },
  pageSize: { type: Number, default: undefined },
  loading: { type: Boolean, default: false },
  error: { type: [Boolean, String], default: false },
  prices: { type: Object, default: undefined },
  timeZone: { type: String, default: undefined },
  locale: { type: String, default: undefined },
  labels: { type: Object, required: true }
}

export const emits = ['open', 'navigate', 'update:page', 'retry']

/** Estados de un pedido y su color (order-history.md «El estado»): el texto lo dice siempre; el color acompaña. */
export const STATUS_COLOR = { pending: 'neutral', paid: 'neutral', preparing: 'neutral', shipped: 'info', delivered: 'success', cancelled: 'warning', returned: 'warning' }
/** Estados que no avanzan: sin GStepper (un cancelado no finge avanzar). */
export const STOPPED = ['cancelled', 'returned']
/** Pedidos recomendados como máximo por página (C7). */
export const MAX_ORDERS = 50
