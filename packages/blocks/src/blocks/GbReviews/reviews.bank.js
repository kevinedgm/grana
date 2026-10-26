// Banco único de GbReviews (dueño: bruno; reviews.md «Banco», _comun.md §7 y §33): el mismo juego pasa igual por las tres
// variantes en Vitest, en el playground y en el spec. Las opiniones del huipil: `summary` 4.6 de 5 con 128 opiniones y su
// distribución (5: 92, 4: 21, 3: 8, 2: 3, 1: 4; suma 128); cinco opiniones (una con título, una en inglés con `lang="en"` y dos
// párrafos que viene de otro sitio con enlace externo, una de 2 de 5 con la respuesta de la tienda, una verificada con lo que
// compró —Talla M · Color Grana—, una mínima con la palabra larga de §7); `total` 128, `pageSize` 5 y la acción «Escribir una
// opinión». Sin errores a propósito: con él, ninguna variante avisa.
import { LONG_WORD } from '../bank/fotos.js'
import { LOCALE, STORE } from '../bank/ecommerce.js'

export const REVIEWS = [
  { id: 'r1', rating: 5, title: 'Igual que en la foto', quote: 'El bordado es todavía más bonito en persona. Llegó en dos días a Monterrey, bien envuelto en papel de china.', author: { name: 'Mariana López', place: 'Monterrey' }, date: '2026-10-12', verified: true, options: [{ key: 'talla', label: 'Talla', value: 'M' }, { key: 'color', label: 'Color', value: 'Grana' }] },
  { id: 'r2', rating: 4, quote: 'Beautiful embroidery and a lovely, soft cotton.\n\nIt runs a little large: I usually wear a M and the CH fits me well.', lang: 'en', author: { name: 'Emily Carter', place: 'Portland' }, date: '2026-09-28', source: { label: 'Google', href: 'https://www.google.com/maps/place/barro-y-agave', external: true } },
  { id: 'r3', rating: 2, quote: 'La talla G me quedó chica; el color es precioso pero tuve que cambiarlo.', author: { name: 'Rocío Hernández', place: 'Puebla' }, date: '2026-09-02', verified: true, options: [{ key: 'talla', label: 'Talla', value: 'G' }, { key: 'color', label: 'Color', value: 'Natural' }], reply: { author: STORE, quote: 'Gracias por contarnos, Rocío. Ya ajustamos la tabla de medidas: la G es como una M grande. Te escribimos para el cambio.', date: '2026-09-03' } },
  { id: 'r4', rating: 5, quote: `Lo compré para la boda de mi hermana y todas preguntaron por él; ${LONG_WORD}.`, author: { name: 'Fernanda Ruiz' }, date: '2026-08-15', verified: 'Compra en la tienda de Oaxaca' },
  { id: 'r5', rating: 3, quote: 'Bonito.', author: { name: 'Luis' }, date: '2026-07-30' }
]

export const LABELS = {
  average: 'Calificación media',
  outOf: 'de {max}',
  count: (n) => `${new Intl.NumberFormat('es-MX').format(n)} ${n === 1 ? 'opinión' : 'opiniones'}`,
  noReviews: 'Todavía sin opiniones',
  score: '{value} de {max}',
  row: (r) => `${r.value} de ${r.max}: ${r.countText} (${r.percent})`,
  distribution: 'Cómo se reparten',
  verified: 'Compra verificada',
  bought: 'Compró',
  reply: (author) => `Respuesta de ${author}`,
  pagination: { nav: 'Páginas de opiniones', previous: 'Página anterior', next: 'Página siguiente', page: 'Página {page}', range: 'Opiniones {from} a {to} de {total}', compact: 'Página {page} de {pages}' },
  external: 'se abre en otra pestaña'
}

export const props = {
  title: 'Opiniones',
  description: 'De quienes compraron este huipil.',
  summary: { average: 4.6, count: 128, distribution: [{ value: 5, count: 92 }, { value: 4, count: 21 }, { value: 3, count: 8 }, { value: 2, count: 3 }, { value: 1, count: 4 }] },
  reviews: REVIEWS,
  total: 128,
  page: 1,
  pageSize: 5,
  action: { label: 'Escribir una opinión', href: '/tienda/huipil-bordado-de-san-antonino/opinar' },
  locale: LOCALE,
  labels: LABELS
}

export const slots = {}

/** Estados de prueba (playground `?estado=…`): sin opiniones todavía. */
export const states = {
  vacio: { summary: { average: 0, count: 0 }, reviews: [], total: 0 }
}
