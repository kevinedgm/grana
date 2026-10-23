// Banco único de GbPromo (dueño: bruno; promo.md «Banco», _comun.md §7 y §33). «Temporada de muertos: 10 % en barro negro»
// hasta el 2 de noviembre a las 23:59 en la hora de la tienda (sin zona: la de Oaxaca), el código OAXACA10, las
// condiciones, la foto del jarro y dos acciones (la colección y las condiciones). Sin errores a propósito: con él,
// ninguna variante avisa (EC7 avisaría pasado el 2 de noviembre de 2026: las pruebas fijan la fecha).
import { media } from '../bank/fotos.js'
import { LOCALE } from '../bank/ecommerce.js'

export const props = {
  title: 'Temporada de muertos: 10 % en barro negro',
  description: 'Jarros, cántaros y figuras de San Bartolo Coyotepec para el altar.',
  media: media('jarro', 1600, 900),
  until: '2026-11-02T23:59',
  timeZone: 'America/Mexico_City',
  code: { value: 'OAXACA10', label: 'Código' },
  terms: 'En compras desde $1,500 MXN de barro negro. No acumulable con otras promociones.',
  locale: LOCALE,
  actions: [
    { id: 'coleccion', label: 'Ver el barro negro', href: '/tienda/barro-negro' },
    { id: 'condiciones', label: 'Condiciones', href: '#promo' }
  ],
  labels: { until: 'Hasta el {date}', copy: 'Copiar código', external: 'se abre en otra pestaña' }
}
