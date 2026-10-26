// Banco único de GbOrderSummary (dueño: bruno; order-summary.md «Banco», _comun.md §7 y §33). El pedido común de Barro y
// Agave (bank/ecommerce.js): BYA-2611-07, tres líneas (mezcal × 2, rebozo Grana × 1 con la misma elección que el carrito,
// jarro × 1), desglose con subtotal, descuento OAXACA10, envío estándar e IVA incluido, la entrega en Oaxaca y el pago como
// texto de la aplicación. Sin errores a propósito: con él, ninguna variante avisa.
import { LOCALE, ORDER, ORDER_LABELS, PRICES, TIME_ZONE } from '../bank/ecommerce.js'

export const props = {
  title: 'Tu pedido',
  order: ORDER,
  prices: PRICES,
  actions: [
    { label: 'Ver el seguimiento', href: '/cuenta/pedidos/BYA-2611-07' },
    { label: 'Seguir comprando', href: '/tienda' }
  ],
  timeZone: TIME_ZONE,
  locale: LOCALE,
  labels: ORDER_LABELS
}
