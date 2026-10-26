// Banco único de GbProductOverview (dueño: bruno; product-overview.md «Banco», _comun.md §7 y §33): el mismo juego pasa
// igual por las tres variantes en Vitest, en el playground y en el spec. El Huipil bordado de San Antonino del banco común
// como ficha (`ProductDetail`): nueve fotos en tres grupos (Natural, Grana y Detalle), opciones Talla (CH/M/G/EG) y Color
// (Natural/Grana, con foto por color), seis variantes con `max` y una agotada (G Natural), las de Grana con su precio, dos
// combinaciones sin variante (CH y EG en Grana), `facts`, descripción en dos párrafos (uno con la palabra larga de §7),
// apartados «Cuidados» y «Envío y devoluciones», `rating`, `reviews: { href: '#opiniones' }` y `note`; región MXN y
// `labels` completos. Sin errores a propósito: con él, ninguna variante avisa. Quick view (E5) usa este mismo banco.
import { LONG_WORD, foto } from '../bank/fotos.js'
import { LOCALE, PRICES, PRICE_LABELS, PRODUCTS, RATING, mxn } from '../bank/ecommerce.js'

/** Textos de GGallery (los de su contrato) para la ficha de la tienda. */
export const GALLERY_LABELS = {
  total: (n) => `${n} ${n === 1 ? 'foto' : 'fotos'}`,
  count: '{index} de {total}',
  groupCount: '{group} · {index} de {total}',
  position: '{index} de {total}',
  announce: '{position}. {alt}.',
  first: 'Primera foto',
  last: 'Última foto',
  prev: 'Foto anterior',
  next: 'Foto siguiente',
  close: 'Cerrar',
  zoom: 'Ampliar',
  viewer: '{title}, galería',
  groups: 'Colores y detalle',
  groupLink: (n, v) => `${v.group}, ${n} ${n === 1 ? 'foto' : 'fotos'}`,
  broken: 'No se pudo cargar esta foto: {alt}',
  carousel: 'carrusel',
  slide: 'foto'
}

const PH = [
  ['huipil', 'natural', 'Huipil natural con flores bordadas, de frente'],
  ['huipil', 'natural', 'Huipil natural, la espalda'],
  ['huipil', 'natural', 'Huipil natural doblado sobre una silla de palma'],
  ['rebozoGrana', 'grana', 'Huipil teñido con grana cochinilla, de frente'],
  ['rebozoGrana', 'grana', 'Huipil grana, la espalda'],
  ['rebozoGrana', 'grana', 'Huipil grana en el telar del taller'],
  ['textiles', 'detalle', 'Las flores bordadas a mano, de cerca'],
  ['textiles', 'detalle', 'El cuello con su punto de cruz'],
  ['textiles', 'detalle', 'El hilo de algodón antes de bordar']
]
const PHOTOS = PH.map(([key, group, alt], i) => ({ id: `h${i + 1}`, src: foto(key, 1200, 1500), thumb: foto(key, 240, 300), width: 1200, height: 1500, alt, group }))

/** La primera foto de cada color en `PHOTOS`. */
const COLOR_PHOTO = { natural: 0, grana: 3 }

/** El huipil como ficha (`ProductDetail`). */
export const DETAIL = {
  ...PRODUCTS.huipil,
  price: { value: mxn(3200), lead: 'desde' },
  photos: PHOTOS,
  groups: [
    { value: 'natural', label: 'Natural', id: 'fotos-natural' },
    { value: 'grana', label: 'Grana', id: 'fotos-grana' },
    { value: 'detalle', label: 'El bordado', id: 'fotos-detalle' }
  ],
  optionsSummary: '4 tallas · 2 colores',
  // Las opciones y variantes del huipil común (EC-B2), con la foto de cada color y el SKU de la ficha
  options: PRODUCTS.huipil.options.map((o) => (o.key === 'color' ? { ...o, values: o.values.map((v) => ({ ...v, photo: COLOR_PHOTO[v.value] })) } : o)),
  variants: PRODUCTS.huipil.variants.map((v) => ({ ...v, ...(v.options.color === 'grana' ? { photo: COLOR_PHOTO.grana } : {}), sku: `HSA-${v.options.talla.toUpperCase()}-${v.options.color === 'grana' ? 'G' : 'N'}` })),
  facts: [
    { label: 'Tela', value: 'Manta de algodón' },
    { label: 'Bordado', value: 'A mano, punto de cruz y pepenado' },
    { label: 'Largo', value: '68 cm (talla M)' },
    { label: 'Lavado', value: 'A mano, en frío' }
  ],
  description: `Cada huipil sale del taller de la familia Mendoza en San Antonino Castillo Velasco: tres semanas de bordado a mano sobre manta de algodón.\n\nLas flores cambian un poco de una pieza a otra; ${LONG_WORD}.`,
  sections: [
    { id: 'cuidados', title: 'Cuidados', body: 'Lava a mano en agua fría con jabón neutro y seca a la sombra.', items: ['No uses blanqueador', 'Plancha por el revés'] },
    { id: 'envio', title: 'Envío y devoluciones', body: 'Sale en dos días hábiles desde Oaxaca.\n\nSi la talla no te queda, lo cambias en 30 días.' }
  ],
  rating: { average: 4.6, count: 128 },
  reviews: { href: '#opiniones' },
  note: 'Hecho a mano: cada pieza cambia un poco.'
}

/** `OverviewLabels` (product-overview.md «Textos»): los mismos en Product overview y Quick view. */
export const OVERVIEW_LABELS = {
  add: 'Añadir al carrito',
  busy: 'Añadiendo…',
  quantity: 'Cantidad',
  decrement: 'Quitar una',
  increment: 'Añadir una',
  choose: 'Elige {option}',
  unavailable: 'No disponible en esta combinación',
  unavailableValue: '{value}, agotada',
  photos: 'Fotos del huipil',
  facts: 'Ficha',
  details: 'Descripción',
  tabs: 'Sobre el huipil',
  rating: RATING,
  noReviews: 'Todavía sin opiniones',
  reviews: 'Leer las opiniones',
  gallery: GALLERY_LABELS,
  price: PRICE_LABELS,
  external: 'se abre en otra pestaña'
}

export const props = {
  product: DETAIL,
  prices: PRICES,
  locale: LOCALE,
  labels: OVERVIEW_LABELS
}

export const slots = {}
