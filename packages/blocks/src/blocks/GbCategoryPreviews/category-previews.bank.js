// Banco único de GbCategoryPreviews (dueño: bruno; category-previews.md «Banco», _comun.md §7 y §33). Barro y Agave: Mezcal
// (18), Textiles (32), Barro negro (24), Barro verde (vacía: count 0), Cocina oaxaqueña (con descripción y sin cuenta), una
// en inglés con lang («Gifts», con el nombre largo sin espacios de la prueba de 320 px) y una externa (el mercado de la
// cooperativa); `action` «Ver toda la tienda». Sin errores a propósito: con él, ninguna variante avisa.
import { LONG_WORD, media } from '../bank/fotos.js'
import { LOCALE } from '../bank/ecommerce.js'

const m = (key) => media(key, 1200, 900)

export const props = {
  title: 'Recorre la tienda',
  description: 'Lo que hacen los talleres y palenques de los Valles Centrales.',
  locale: LOCALE,
  categories: [
    { id: 'mezcal', name: 'Mezcal', href: '/tienda/mezcal', media: m('espadin'), count: 18 },
    { id: 'textiles', name: 'Textiles', href: '/tienda/textiles', media: m('textiles'), count: 32, description: 'Rebozos, huipiles y tapetes teñidos con grana cochinilla y añil.' },
    { id: 'barro-negro', name: 'Barro negro', href: '/tienda/barro-negro', media: m('jarro'), count: 24 },
    { id: 'barro-verde', name: 'Barro verde', href: '/tienda/barro-verde', media: m('plato'), count: 0 },
    { id: 'cocina', name: 'Cocina oaxaqueña', href: '/tienda/cocina', media: m('cocina'), description: 'Chocolate de metate, moles y chapulines.' },
    { id: 'gifts', name: 'Gifts', lang: 'en', href: '/tienda/regalos', media: m('regalos'), count: 1240, description: `Boxes ready to travel; ${LONG_WORD}.` },
    { id: 'mercado', name: 'Mercado de la cooperativa', href: 'https://cooperativa-tlacolula.example/', external: true, media: m('desayuno') }
  ],
  action: { label: 'Ver toda la tienda', href: '/tienda' },
  labels: { count: '{name} · {count} piezas', empty: '{name} · Vuelve pronto', external: 'se abre en otra pestaña' }
}
