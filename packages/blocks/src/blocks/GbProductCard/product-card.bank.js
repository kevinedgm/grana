// Banco único de GbProductCard (dueño: bruno; product-card.md «Banco», _comun.md §7 y §33). Los datos son los de la tienda
// común (bank/ecommerce.js). `props` es una tarjeta (el huipil: maker, badge «Últimas 3 piezas», optionsSummary, facts,
// opciones obligatorias y rating); `each` monta una tarjeta por producto en cada variante (playground y spec): el tobalá
// (compareAt con compareLabel), el plato (no disponible con motivo), el jarro (sin opciones: «Añadir»; sin opiniones), el
// espadín, el chocolate (en inglés, externo) y el mínimo (solo en 03: en 01 y 02 avisaría PC1, sin foto). Sin errores a
// propósito: con él, ninguna variante avisa.
import { CARD_LABELS, LOCALE, PRICES, PRODUCTS as ALL, asProduct } from '../bank/ecommerce.js'

// La tarjeta recibe `Product` (sin variantes: son de la ficha)
const PRODUCTS = Object.fromEntries(Object.entries(ALL).map(([k, p]) => [k, asProduct(p)]))

export const props = {
  product: PRODUCTS.huipil,
  prices: PRICES,
  locale: LOCALE,
  labels: CARD_LABELS
}

export const each = {
  prop: 'product',
  // La horizontal va en renglones (la rejilla de la aplicación le da el ancho entero); las demás, en tarjetas iguales
  hints: { '02': 'g-adapt-full' },
  items: [
    { value: PRODUCTS.huipil },
    { value: PRODUCTS.tobala },
    { value: PRODUCTS.plato },
    { value: PRODUCTS.jarro },
    { value: PRODUCTS.espadin },
    { value: PRODUCTS.chocolate },
    { value: PRODUCTS.minimo, only: ['03'] }
  ]
}
