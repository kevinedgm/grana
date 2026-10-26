// Banco único de GbOrderHistory (dueño: bruno; order-history.md «Banco», _comun.md §7 y §33). Los cinco pedidos de Barro y
// Agave (bank/ecommerce.js): pendiente de pago, en preparación, enviado (con su seguimiento de cuatro pasos y el
// transportista externo), entregado (en USD aproximado y sin href: se abre con `open`) y cancelado; tres con lo comprado.
// `total` 12 y `pageSize` 5: la paginación del servidor. Estados para el playground y el spec: `loading` (primera carga),
// `error` y vacío. Sin errores a propósito: con él, ninguna variante avisa.
import { LOCALE, ORDERS, PIECES, PRICES, PRICE_LABELS, TIME_ZONE } from '../bank/ecommerce.js'

export const props = {
  title: 'Tus pedidos',
  orders: ORDERS,
  total: 12,
  page: 1,
  pageSize: 5,
  prices: PRICES,
  timeZone: TIME_ZONE,
  locale: LOCALE,
  labels: {
    reference: 'Pedido',
    date: 'Fecha',
    status: 'Estado',
    total: 'Total',
    count: PIECES,
    open: 'Ver el pedido {reference}',
    tracking: 'Seguir el envío',
    progress: 'Seguimiento del pedido {reference}',
    detail: 'Pedido {title}',
    empty: { title: 'Todavía no tienes pedidos', description: 'Cuando compres algo, lo verás aquí con su estado y su seguimiento.' },
    table: { loading: 'Cargando tus pedidos…', results: '{count} pedidos', failed: 'No pudimos cargar tus pedidos', retry: 'Reintentar', range: 'Pedidos {from} a {to} de {total}' },
    region: { loading: 'Cargando tus pedidos…', slow: 'Sigue cargando…', loaded: '{count} pedidos', refreshing: 'Actualizando', failed: 'No pudimos cargar tus pedidos', retry: 'Reintentar' },
    stepper: { complete: 'hecho', current: 'en curso', pending: 'pendiente', error: 'con error', warning: 'con aviso', disabled: 'no disponible', optional: 'opcional', progress: 'Paso {current} de {total}', showAll: 'Ver todos los pasos', hideAll: 'Ocultar los pasos' },
    pagination: { nav: 'Páginas de pedidos', previous: 'Página anterior', next: 'Página siguiente', page: 'Página {page}', range: 'Pedidos {from} a {to} de {total}', compact: 'Página {page} de {pages}' },
    price: PRICE_LABELS,
    external: 'se abre en otra pestaña'
  }
}

export const states = {
  cargando: { orders: [], loading: true },
  error: { orders: [], error: 'No pudimos cargar tus pedidos. Revisa tu conexión.' },
  vacio: { orders: [], total: 0 }
}
