// Lo común de los bancos de Ecommerce (dueño: bruno; _comun.md §33, #909 a #914): la tienda «Barro y Agave» (Oaxaca; mezcal,
// textiles teñidos con grana cochinilla y añil, barro negro y verde), la misma región de precios y los mismos textos de
// tarjeta, calificación y precio, exportados una vez para que la misma tarjeta se lea igual en Product card, Product grid y
// Cart. Solo bancos (Vitest, playground y spec): no lo importa ningún bloque ni la entrada. Sin red: fotos de bank/fotos.js.
// Ninguna variante avisa con estos datos (§7). Las partes B y C añaden aquí lo suyo (opiniones, pasos del pago…).
import { foto, LONG_WORD } from './fotos.js'
import { cartTotals } from '../../cartTotals.js'

export const STORE = 'Barro y Agave'
export const LOCALE = 'es-MX'
export const mxn = (amount) => ({ amount, currency: 'MXN' })
export const usd = (amount, approximate = true) => ({ amount, currency: 'USD', ...(approximate ? { approximate } : {}) })

/** Región de precios de la tienda (MXN, IVA incluido) y sus textos (los de GPriceScope/GPrice: §27 regla 1). */
export const PRICES = { currency: 'MXN', taxes: 'IVA incluido' }
export const PRICE_LABELS = {
  onRequest: 'Precio a consultar', approx: 'aprox.', total: 'Total', free: 'Gratis', before: 'Antes',
  range: '{min} a {max}', saving: 'Ahorras {amount}', legend: 'Precios en {name} ({code})'
}

/** La calificación en palabras (§27 regla 5), con singular y plural. */
export const RATING = (r) => `${r.average} de ${r.max} · ${r.countText} ${r.count === 1 ? 'opinión' : 'opiniones'}`

/** `ProductCardLabels`: el mismo juego en Product card, Product grid (`labels.card`) y Cart. */
export const CARD_LABELS = {
  add: 'Añadir al carrito',
  choose: 'Elegir opciones',
  busy: 'Añadiendo…',
  unavailable: 'No disponible',
  rating: RATING,
  noReviews: 'Todavía sin opiniones',
  price: PRICE_LABELS,
  external: 'se abre en otra pestaña'
}

/** `n` fotos (Photo de GGallery: alt obligatorio) de las claves dadas. */
export const photos = (keys, w = 1200, h = 1500) => keys.map(([key, alt], i) => ({ id: `${key}-${i + 1}`, src: foto(key, w, h), thumb: foto(key, 240, 300), width: w, height: h, alt }))

const COLOR = {
  key: 'color', label: 'Color', values: [
    { value: 'grana', label: 'Grana', photo: 0 },
    { value: 'anil', label: 'Añil', photo: 1, available: 'Vuelve el 2 de diciembre' },
    { value: 'natural', label: 'Natural', photo: 2 }
  ]
}

/** Los productos de la tienda (§33). */
export const PRODUCTS = {
  espadin: {
    id: 'espadin-sola',
    name: 'Mezcal espadín «Tierra de Sola» 750 ml',
    maker: 'Palenque Hernández · Sola de Vega',
    summary: 'Destilado en olla de barro; notas de fruta madura y humo suave.',
    href: '/tienda/mezcal-espadin-tierra-de-sola',
    photos: photos([['espadin', 'Botella de mezcal espadín con etiqueta de papel amate']]),
    price: { value: mxn(890) },
    facts: [{ label: 'Contenido', value: '750 ml' }, { label: 'Grado', value: '47 % Alc. Vol.' }, { label: 'Maguey', value: 'Espadín' }, { label: 'Destilación', value: 'Olla de barro' }],
    rating: { average: 4.8, count: 312 }
  },
  tobala: {
    id: 'tobala',
    name: 'Mezcal tobalá 750 ml',
    maker: 'Palenque Hernández · Sola de Vega',
    summary: 'Maguey silvestre de la sierra; se cosecha una vez cada quince años.',
    href: '/tienda/mezcal-tobala',
    photos: photos([['tobala', 'Botella de mezcal tobalá junto a una jícara']]),
    price: { value: mxn(1650), compareAt: mxn(1850), compareLabel: 'Precio de lista' },
    facts: [{ label: 'Contenido', value: '750 ml' }, { label: 'Grado', value: '48 % Alc. Vol.' }],
    rating: { average: 4.9, count: 87 }
  },
  rebozo: {
    id: 'rebozo-grana',
    name: 'Rebozo de algodón teñido con grana cochinilla',
    maker: 'Taller Mendoza · Teotitlán del Valle',
    summary: 'Tejido en telar de cintura; cada color sale de un tinte natural.',
    href: '/tienda/rebozo-de-algodon',
    photos: photos([['rebozoGrana', 'Rebozo de color grana, doblado'], ['rebozoAnil', 'Rebozo de color añil, doblado'], ['rebozoNatural', 'Rebozo de color natural, doblado']]),
    price: { value: mxn(2400) },
    optionsSummary: '3 colores',
    options: [COLOR],
    variants: [
      { id: 'rebozo-grana', options: { color: 'grana' }, photo: 0, max: 4 },
      { id: 'rebozo-anil', options: { color: 'anil' }, photo: 1, available: 'Vuelve el 2 de diciembre' },
      { id: 'rebozo-natural', options: { color: 'natural' }, photo: 2, max: 6 }
    ],
    rating: { average: 5, count: 2 }
  },
  huipil: {
    id: 'huipil-san-antonino',
    name: 'Huipil bordado de San Antonino',
    maker: 'Taller Mendoza · San Antonino Castillo Velasco',
    summary: 'Flores bordadas a mano en hilo de algodón; cada pieza tarda tres semanas.',
    photos: photos([['huipil', 'Huipil de manta natural con flores bordadas']]),
    price: { value: mxn(3200) },
    badge: 'Últimas 3 piezas',
    optionsSummary: '4 tallas · 2 colores',
    facts: [{ label: 'Tela', value: 'Manta de algodón' }, { label: 'Bordado', value: 'A mano' }, { label: 'Lavado', value: 'A mano, en frío' }],
    // Un solo huipil en toda la tienda (EC-B2): las mismas opciones y variantes en la tarjeta, la ficha (Product overview y
    // Quick view las toman de aquí y les añaden fotos y SKU), el carrito, el pedido y el historial
    options: [
      { key: 'talla', label: 'Talla', values: [{ value: 'ch', label: 'CH' }, { value: 'm', label: 'M' }, { value: 'g', label: 'G' }, { value: 'eg', label: 'EG' }] },
      { key: 'color', label: 'Color', values: [{ value: 'natural', label: 'Natural' }, { value: 'grana', label: 'Grana' }] }
    ],
    variants: [
      { id: 'huipil-ch-natural', options: { talla: 'ch', color: 'natural' }, max: 2 },
      { id: 'huipil-m-natural', options: { talla: 'm', color: 'natural' }, max: 3 },
      { id: 'huipil-g-natural', options: { talla: 'g', color: 'natural' }, available: false },
      { id: 'huipil-eg-natural', options: { talla: 'eg', color: 'natural' }, max: 1 },
      { id: 'huipil-m-grana', options: { talla: 'm', color: 'grana' }, price: { value: mxn(3400) }, max: 2 },
      { id: 'huipil-g-grana', options: { talla: 'g', color: 'grana' }, price: { value: mxn(3400) }, max: 1 }
    ],
    rating: { average: 4.7, count: 58 }
  },
  jarro: {
    id: 'jarro-barro-negro',
    name: 'Jarro de barro negro de San Bartolo Coyotepec',
    maker: 'Familia Nieto · San Bartolo Coyotepec',
    summary: 'Bruñido a mano con cuarzo; para agua o flores, no para el fuego.',
    href: '/tienda/jarro-de-barro-negro',
    photos: photos([['jarro', 'Jarro de barro negro bruñido']]),
    price: { value: mxn(480) },
    facts: [{ label: 'Alto', value: '18 cm' }],
    rating: { average: 4.6, count: 0 }
  },
  plato: {
    id: 'plato-atzompa',
    name: 'Plato de barro verde de Atzompa',
    maker: 'Cooperativa de Santa María Atzompa',
    href: '/tienda/plato-de-barro-verde',
    photos: photos([['plato', 'Plato de barro verde vidriado']]),
    price: { value: mxn(350) },
    available: 'Vuelve el 2 de diciembre'
  },
  // En inglés (§7): la tienda vende también a quien visita Oaxaca
  chocolate: {
    id: 'chocolate-metate',
    name: 'Stone-ground Oaxacan chocolate',
    lang: 'en',
    summary: 'Cacao and cinnamon, ground on a metate in Tlacolula.',
    // Externo (§7): se vende en la tienda de la cooperativa
    href: 'https://cooperativa-tlacolula.example/chocolate',
    external: true,
    photos: photos([['cocina', 'Tableta de chocolate de metate']]),
    price: { value: mxn(260), unit: '/ 500 g', unitLabel: 'por medio kilo' }
  },
  // El mínimo (§7): solo lo obligatorio; con el nombre largo sin espacios de la prueba de 320 px
  minimo: { id: 'tarjeta-regalo', name: `Tarjeta de regalo ${LONG_WORD}`, price: { value: mxn(500) } }
}

/** El `Product` de una ficha (`ProductDetail`): sin lo que solo lleva la ficha (variantes, grupos, descripción…). */
export const asProduct = ({ variants, groups, description, sections, note, reviews, ...p }) => p

// ── Carrito, pedido e historial (los usan las partes B y C) ──

/** Las tres líneas del carrito (§33): mezcal × 2, rebozo Grana × 1 y el plato, que ya no está. */
export const CART_LINES = [
  { id: 'l1', product: { id: 'espadin-sola', name: PRODUCTS.espadin.name, href: PRODUCTS.espadin.href, photos: PRODUCTS.espadin.photos, maker: PRODUCTS.espadin.maker }, quantity: 2, max: 6, unitPrice: mxn(890) },
  { id: 'l2', product: { id: 'rebozo-grana', name: PRODUCTS.rebozo.name, href: PRODUCTS.rebozo.href, photos: PRODUCTS.rebozo.photos.slice(0, 1), maker: PRODUCTS.rebozo.maker }, variant: 'rebozo-grana', options: [{ key: 'color', label: 'Color', value: 'Grana' }], quantity: 1, max: 4, unitPrice: mxn(2400) },
  { id: 'l3', product: { id: 'plato-atzompa', name: PRODUCTS.plato.name, href: PRODUCTS.plato.href, photos: PRODUCTS.plato.photos }, quantity: 1, unitPrice: mxn(350), available: 'Ya no queda' }
]
/** Las opciones de cartTotals de la tienda: IVA incluido 16 %, envío por calcular y el umbral de envío gratis. */
export const CART_OPTIONS = {
  currency: 'MXN',
  shipping: { label: 'Envío', amount: null, note: 'Se calcula con tu código postal' },
  taxes: [{ label: 'Incluye IVA', rate: 0.16, included: true }],
  goals: [{ id: 'envio-gratis', label: 'Envío gratis desde $3,000', target: mxn(3000) }],
  labels: { subtotal: 'Subtotal', total: (n) => `por ${n} ${n === 1 ? 'pieza' : 'piezas'}` }
}
/** Los totales del carrito, de cartTotals (Grana suma en un solo sitio, §27 regla 4). */
export const CART_TOTALS = cartTotals(CART_LINES, CART_OPTIONS)

// ── Pedido e historial (parte C: Order summary, Checkout y Order history; §33) ──

/** La zona de la tienda: la fecha del pedido y la entrega se dicen en la hora de Oaxaca. */
export const TIME_ZONE = 'America/Mexico_City'
/** «{count} piezas» (Cart, Order summary, Order history). */
export const PIECES = (n) => `${n} ${n === 1 ? 'pieza' : 'piezas'}`
/** El pedido común (§33): BYA-2611-07, tres líneas con la MISMA elección que el carrito (la elección viaja, §27 regla 3). */
export const ORDER = {
  reference: { code: 'BYA-2611-07', label: 'Número de pedido' },
  placedAt: '2026-11-07T10:42:00-06:00',
  lines: [
    { id: 'o1', name: PRODUCTS.espadin.name, href: PRODUCTS.espadin.href, photo: PRODUCTS.espadin.photos[0], quantity: 2, unitPrice: mxn(890), total: mxn(1780) },
    { id: 'o2', name: PRODUCTS.rebozo.name, href: PRODUCTS.rebozo.href, photo: PRODUCTS.rebozo.photos[0], options: CART_LINES[1].options, quantity: 1, unitPrice: mxn(2400), total: mxn(2400) },
    { id: 'o3', name: PRODUCTS.jarro.name, href: PRODUCTS.jarro.href, photo: PRODUCTS.jarro.photos[0], quantity: 1, unitPrice: mxn(480), total: mxn(480) }
  ],
  totals: {
    lines: [
      { label: 'Subtotal', amount: mxn(4660), kind: 'subtotal' },
      { label: 'Descuento OAXACA10', amount: mxn(-466), kind: 'discount' },
      { label: 'Envío estándar', amount: mxn(99), kind: 'shipping' },
      { label: 'Incluye IVA', amount: mxn(578.48), kind: 'tax', included: true }
    ],
    total: { value: mxn(4293), label: 'por 4 piezas' }
  },
  shipping: { label: 'Envío a domicilio', method: 'Estándar, de 3 a 5 días', address: ['Ana Ruiz', 'Macedonio Alcalá 202, Centro', '68000 Oaxaca de Juárez, Oax.'], date: '2026-11-12', note: 'Te escribimos por WhatsApp cuando salga del taller.' },
  payment: { label: 'Pago', value: 'Tarjeta terminada en 4242' },
  note: 'Cada pieza está hecha a mano: puede cambiar un poco respecto a la foto.'
}
/** Textos de un pedido (Order summary y el pedido de Checkout). */
export const ORDER_LABELS = {
  lines: 'Lo que compraste',
  quantity: PIECES,
  total: 'Total',
  pending: 'Se calcula en el siguiente paso',
  placedAt: 'Pedido el {date}',
  delivery: 'Llega el {date}',
  reference: 'Número de pedido',
  price: PRICE_LABELS,
  external: 'se abre en otra pestaña'
}
const progress = (current) => ({
  steps: [
    { id: 'pagado', label: 'Pagado', date: '2026-11-07' },
    { id: 'preparado', label: 'Preparado', date: '2026-11-08' },
    { id: 'enviado', label: 'Enviado', date: '2026-11-09' },
    { id: 'entregado', label: 'Entregado' }
  ],
  current
})
/** El historial (§33): cinco pedidos, uno por estado (pendiente, en preparación, enviado, entregado, cancelado); el
 *  entregado en USD aproximado y sin `href` (se abre con `open`); tres con lo comprado. */
export const ORDERS = [
  { id: 'BYA-2611-12', reference: { code: 'BYA-2611-12', label: 'Pedido' }, placedAt: '2026-11-12', status: 'pending', statusText: 'Pendiente de pago', total: mxn(890), count: 1, href: '/cuenta/pedidos/BYA-2611-12', note: 'Paga antes del 14 de noviembre para apartar la pieza.' },
  { id: 'BYA-2611-09', reference: { code: 'BYA-2611-09', label: 'Pedido' }, placedAt: '2026-11-09', status: 'preparing', statusText: 'En preparación', total: mxn(3200), count: 1, href: '/cuenta/pedidos/BYA-2611-09', lines: [{ id: 'h1', name: PRODUCTS.huipil.name, options: [{ key: 'talla', label: 'Talla', value: 'M' }, { key: 'color', label: 'Color', value: 'Natural' }], quantity: 1, total: mxn(3200) }] },
  { id: 'BYA-2611-07', reference: ORDER.reference, placedAt: ORDER.placedAt, status: 'shipped', statusText: 'Enviado', total: ORDER.totals.total.value, count: 4, href: '/cuenta/pedidos/BYA-2611-07', lines: ORDER.lines, progress: progress('enviado'), tracking: { label: 'Estafeta · guía 7012 3344 5566', href: 'https://rastreo.example/7012334455', external: true }, note: 'Llega el jueves 12 de noviembre' },
  { id: 'BYA-2610-21', reference: { code: 'BYA-2610-21', label: 'Pedido' }, placedAt: '2026-10-21', status: 'delivered', statusText: 'Entregado', total: usd(52), count: 1, lines: [{ id: 'h2', name: PRODUCTS.chocolate.name, lang: 'en', quantity: 1, total: usd(52) }] },
  { id: 'BYA-2610-03', reference: { code: 'BYA-2610-03', label: 'Pedido' }, placedAt: '2026-10-03', status: 'cancelled', statusText: 'Cancelado', total: mxn(480), count: 1, href: '/cuenta/pedidos/BYA-2610-03', note: 'Cancelado a petición tuya; el reembolso ya se hizo.' }
]
