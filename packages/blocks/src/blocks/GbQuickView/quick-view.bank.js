// Banco único de GbQuickView (dueño: bruno; quick-view.md «Banco», _comun.md §7 y §33): el de Product overview (el huipil)
// con su ficha completa (`href`), `open: true` (abierta, para Vitest y para el estado `?estado=abierta` del playground),
// `from` con el id del disparador y los textos de E4 más `close` y `full`. Sin errores a propósito: con él, ninguna variante
// avisa (el playground monta un disparador por variante y abre con `open { event }`).
import { DETAIL, OVERVIEW_LABELS } from '../GbProductOverview/product-overview.bank.js'
import { LOCALE, PRICES } from '../bank/ecommerce.js'

export const QV_LABELS = { ...OVERVIEW_LABELS, close: 'Cerrar', full: 'Ver la ficha completa' }

export const props = {
  product: { ...DETAIL, href: '/tienda/huipil-bordado-de-san-antonino' },
  open: true,
  from: 'qv-disparador',
  prices: PRICES,
  locale: LOCALE,
  labels: QV_LABELS
}

export const slots = {}
