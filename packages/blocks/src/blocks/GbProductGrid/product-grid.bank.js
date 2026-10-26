// Banco único de GbProductGrid (dueño: bruno; product-grid.md «Banco», _comun.md §7 y §33): el mismo juego pasa igual por
// las tres variantes en Vitest, en el playground y en el spec. Barro y Agave, categoría «Textiles»: doce productos de la
// tienda común y variaciones (con y sin `href`, con opciones obligatorias, uno no disponible con su motivo, uno con la
// referencia de precio nombrada, uno en inglés externo y el mínimo con la palabra larga de §7), `total` 32, `pageSize` 12,
// `page` 1, facetas Material, Tinte y Talla (EG con `count: 0`), un filtro elegido (Tinte: Grana cochinilla), tres órdenes,
// región MXN y `labels` completos. Sin errores a propósito: con él, ninguna variante avisa. `states` da los estados de
// prueba del playground (?estado=…): carga primera con `sample`, refresco, error con lo conocido, vacío y vacío por filtros.
import { CARD_LABELS, LOCALE, PRICES, PRODUCTS as ALL, asProduct, mxn, photos } from '../bank/ecommerce.js'

const P = Object.fromEntries(Object.entries(ALL).map(([k, p]) => [k, asProduct(p)]))

/** Doce textiles: los de la tienda y sus variaciones, en el orden en que los da la aplicación (el bloque no ordena). */
export const PRODUCTS = [
  P.huipil,
  P.rebozo,
  { ...P.rebozo, id: 'rebozo-anil', name: 'Rebozo de algodón teñido con añil', photos: photos([['rebozoAnil', 'Rebozo de color añil, doblado']]), href: '/tienda/rebozo-anil', price: { value: mxn(2600), compareAt: mxn(2900), compareLabel: 'Precio de lista' }, options: undefined, optionsSummary: undefined, rating: { average: 4.9, count: 41 } },
  { ...P.rebozo, id: 'camino-mesa', name: 'Camino de mesa de lana de Teotitlán', photos: photos([['textiles', 'Camino de mesa de lana con grecas']]), href: '/tienda/camino-de-mesa', price: { value: mxn(1300) }, options: undefined, optionsSummary: undefined, rating: { average: 4.7, count: 23 } },
  { ...P.rebozo, id: 'tapete-grecas', name: 'Tapete de lana con grecas', photos: photos([['textiles', 'Tapete de lana con grecas rojas']]), href: '/tienda/tapete-grecas', price: { value: mxn(5800) }, options: undefined, optionsSummary: undefined, badge: 'Nuevo', rating: undefined },
  { ...P.huipil, id: 'blusa-bordada', name: 'Blusa bordada de Santo Tomás Jalieza', photos: photos([['huipil', 'Blusa blanca con bordado de pájaros']]), price: { value: mxn(1450) }, badge: undefined, rating: { average: 4.4, count: 12 } },
  { ...P.rebozo, id: 'servilletas', name: 'Juego de servilletas de algodón', photos: photos([['textiles', 'Seis servilletas dobladas']]), href: '/tienda/servilletas', price: { value: mxn(620) }, options: undefined, optionsSummary: undefined, available: 'Vuelve el 2 de diciembre', rating: undefined },
  { ...P.rebozo, id: 'bolsa-telar', name: 'Bolsa de telar de cintura', photos: photos([['rebozoNatural', 'Bolsa de algodón natural con asa trenzada']]), href: '/tienda/bolsa-telar', price: { value: mxn(780) }, options: undefined, optionsSummary: undefined, rating: { average: 4.8, count: 66 } },
  { ...P.rebozo, id: 'chal-seda', name: 'Chal de seda de San Pedro Cajonos', photos: photos([['rebozoGrana', 'Chal de seda teñido con grana']]), href: '/tienda/chal-seda', price: { value: mxn(4200) }, options: undefined, optionsSummary: undefined, rating: { average: 5, count: 9 } },
  { ...P.rebozo, id: 'cojin-lana', name: 'Funda de cojín de lana', photos: photos([['textiles', 'Funda de cojín con rombos']]), href: undefined, price: { value: mxn(890) }, options: undefined, optionsSummary: undefined, rating: { average: 4.5, count: 0 } },
  P.chocolate,
  { ...P.minimo, photos: photos([['regalos', 'Tarjeta de regalo en una caja con papel picado']]) }
]

/** Las facetas de la categoría con sus cuentas (las da la aplicación: cuántos quedarían eligiendo cada valor). */
export const FACETS = [
  { key: 'material', label: 'Material', options: [{ value: 'algodon', label: 'Algodón', count: 18 }, { value: 'lana', label: 'Lana', count: 9 }, { value: 'seda', label: 'Seda', count: 5 }] },
  { key: 'tinte', label: 'Tinte', options: [{ value: 'grana', label: 'Grana cochinilla', count: 12 }, { value: 'anil', label: 'Añil', count: 10 }, { value: 'natural', label: 'Natural', count: 10 }] },
  { key: 'talla', label: 'Talla', options: [{ value: 'ch', label: 'CH', count: 6 }, { value: 'm', label: 'M', count: 8 }, { value: 'g', label: 'G', count: 4 }, { value: 'eg', label: 'EG', count: 0 }] }
]

export const LABELS = {
  count: (n) => `${n} ${n === 1 ? 'producto' : 'productos'}`,
  facets: 'Filtrar',
  clear: 'Quitar filtros',
  facetOption: '{label} · {count}',
  sort: 'Ordenar por',
  empty: { title: 'Todavía no hay textiles', description: 'Vuelve pronto: el taller está tejiendo.' },
  emptyFiltered: { title: 'Ningún textil con esos filtros', description: 'Quita uno para ver más.' },
  card: CARD_LABELS,
  region: {
    loading: 'Cargando textiles',
    slow: 'Sigue cargando…',
    loaded: ({ count }) => `${count} ${count === 1 ? 'producto' : 'productos'}`,
    refreshing: 'Actualizando',
    failed: 'No se pudo actualizar. Lo que ves es lo último que llegó.',
    retry: 'Reintentar'
  },
  emptyLabels: { relax: 'Quitar «{label}»', returns: (n) => `vuelven ${n}`, clear: 'Quitar todos', before: 'Antes había {total}; con {filters}, ninguno.' },
  tags: {},
  pagination: { nav: 'Páginas de textiles', previous: 'Página anterior', next: 'Página siguiente', page: 'Página {page}', range: '{from} a {to} de {total}', compact: 'Página {page} de {pages}' }
}

export const props = {
  title: 'Textiles',
  description: 'Tejidos en telar y bordados a mano en los Valles Centrales.',
  products: PRODUCTS,
  total: 32,
  page: 1,
  pageSize: 12,
  facets: FACETS,
  filters: { tinte: ['grana'] },
  sorts: [{ value: 'nuevo', label: 'Lo más nuevo' }, { value: 'precio-asc', label: 'Precio de menor a mayor' }, { value: 'precio-desc', label: 'Precio de mayor a menor' }],
  sort: 'nuevo',
  prices: PRICES,
  locale: LOCALE,
  labels: LABELS
}

export const slots = {}

/** Estados de prueba (playground `?estado=…` y Vitest). La muestra del molde: tres productos con los campos de verdad. */
const SAMPLE = PRODUCTS.slice(0, 3).map((p, i) => ({ ...p, id: `muestra-${i}` }))
export const states = {
  carga: { products: [], loading: true, sample: SAMPLE },
  refresco: { loading: true },
  error: { error: true },
  vacio: { products: [], total: 0, filters: {} },
  filtrado: { products: [], total: 0, filters: { tinte: ['grana'], talla: ['g'] } }
}
