// Banco único de GbCart (dueño: bruno; cart.md «Banco», _comun.md §7 y §33). El carrito común de Barro y Agave
// (bank/ecommerce.js): mezcal espadín × 2 (con su total de `byLine`), rebozo de algodón Grana × 1 (la elección Color · Grana,
// con la referencia de precio nombrada) y el plato de barro verde, que ya no queda. Los totales los da `cartTotals` (Grana
// suma en un solo sitio, §27 regla 4) con el IVA incluido, el envío por calcular y el umbral del envío gratis. Estados para
// el playground y el spec: `busy` en una línea, el umbral sin alcanzar, el carrito vacío y el cajón abierto. Sin errores
// a propósito: con él, ninguna variante avisa.
import { cartTotals } from '../../cartTotals.js'
import { CART_LINES, LOCALE, PIECES, PRICES, PRICE_LABELS, PRODUCTS, mxn } from '../bank/ecommerce.js'

const OPTIONS = {
  currency: 'MXN',
  shipping: { label: 'Envío', amount: null },
  taxes: [{ label: 'Incluye IVA', rate: 0.16, included: true }],
  goals: [{ id: 'envio', label: 'el envío gratis', target: mxn(3000) }],
  labels: { subtotal: 'Subtotal', total: (n) => `por ${PIECES(n)}` }
}
const base = [
  CART_LINES[0],
  { ...CART_LINES[1], compareAt: mxn(2600), compareLabel: 'Precio de lista', note: 'Teñido a pedido: sale del taller en 5 días.' },
  CART_LINES[2],
  // El mínimo (§7): solo lo obligatorio, con el nombre largo sin espacios de la prueba de 320 px
  { id: 'l4', product: { id: PRODUCTS.minimo.id, name: PRODUCTS.minimo.name }, quantity: 1, unitPrice: mxn(500) }
]
/** Las líneas con el total de cada una (de `byLine`: la aplicación lo copia a `CartLine.total`) y sus totales. */
export function cart(lines) {
  const totals = cartTotals(lines, OPTIONS)
  return { lines: lines.map((l) => (totals.byLine[String(l.id)] ? { ...l, total: totals.byLine[String(l.id)] } : l)), totals }
}
const full = cart(base)

export const LABELS = {
  quantity: (name) => `Cantidad de ${name}`,
  decrement: 'Quitar una',
  increment: 'Añadir una',
  remove: (name) => `Quitar ${name}`,
  removeText: 'Quitar',
  removed: (name) => `Quitaste ${name}`,
  undo: 'Deshacer',
  unavailable: 'Ya no está disponible',
  excluded: (n) => (n === 1 ? 'Un artículo ya no está disponible y no entra en tu pedido.' : `${n} artículos ya no están disponibles y no entran en tu pedido.`),
  forQuantity: (n) => `por ${PIECES(n)}`,
  each: 'c/u',
  eachLabel: 'cada una',
  summary: 'Resumen',
  total: 'Total',
  pending: 'Se calcula en el siguiente paso',
  goal: 'Te faltan {remaining} para {label}',
  goalReached: (label) => `Ya tienes ${label}`,
  empty: { title: 'Tu carrito está vacío', description: 'Lo que añadas desde la tienda aparece aquí.' },
  close: 'Cerrar el carrito',
  dialog: {},
  price: PRICE_LABELS,
  external: 'se abre en otra pestaña'
}

export const props = {
  title: 'Tu carrito',
  lines: full.lines,
  totals: full.totals,
  prices: PRICES,
  actions: [
    { label: 'Pagar', href: '/pago' },
    { label: 'Seguir comprando', href: '/tienda' }
  ],
  assurance: 'Devoluciones gratis en 30 días.',
  locale: LOCALE,
  labels: LABELS,
  // La huella necesita quien escuche (CA3): el playground y el spec quitan y devuelven la línea como la aplicación
  onRemove: () => {},
  onRestore: () => {}
}

const sinRebozo = cart([base[0], base[2]])
export const states = {
  ocupado: { busy: ['l1'] },
  umbral: { lines: sinRebozo.lines, totals: sinRebozo.totals },
  vacio: { lines: [], totals: cart([]).totals },
  abierto: { open: true }
}

/** Lo que hace la aplicación (playground y spec): cambia la cantidad, quita la línea y la devuelve a su sitio con su
 *  cantidad; los totales se vuelven a pedir a `cartTotals` (el bloque no suma). */
export function app(view, events, n) {
  const cur = () => (view.lines || props.lines).map(({ total, ...l }) => l)
  const set = (lines) => Object.assign(view, cart(lines))
  return {
    onChange: (p) => { events.push(['change', n, p.line.id, p.quantity]); set(cur().map((l) => (l.id === p.line.id ? { ...l, quantity: p.quantity } : l))) },
    onRemove: (p) => { events.push(['remove', n, p.line.id]); set(cur().filter((l) => l.id !== p.line.id)) },
    onRestore: (p) => {
      events.push(['restore', n, p.line.id])
      const lines = cur()
      const { total, ...line } = p.line
      lines.splice(Math.min(p.index, lines.length), 0, line)
      set(lines)
    }
  }
}
