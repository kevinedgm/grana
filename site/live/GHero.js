// Ficha interactiva de GHero. Controles desde GHero.meta.json.
import { h } from 'vue'
import { GBtn } from '@grana/vue'
import { GHero } from '@grana/vue/hero'

// Imagen propia de la ficha: un SVG en línea (sin red). En tu aplicación, la foto real.
const foto = (a, b) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`)}`
const alt = { es: 'Patio de cantera verde al atardecer', en: 'Green quarry-stone courtyard at dusk' }

export default {
  exclude: ['id', 'headingLevel', 'view', 'paused', 'priority', 'detail', 'views', 'look', 'appearance'],
  text: ['title', 'eyebrow', 'lead', 'aside'],
  block: true,
  host: GHero,
  imports: ["import { GHero } from '@grana/vue/hero'"],
  base: {
    title: { es: 'Casa Alcalá', en: 'Casa Alcalá' },
    eyebrow: { es: 'Hotel boutique · Centro histórico', en: 'Boutique hotel · Historic center' },
    lead: { es: 'Doce habitaciones alrededor de un patio de cantera.', en: 'Twelve rooms around a quarry-stone courtyard.' },
    aside: { es: 'Desayuno incluido · Llegada desde las 15:00', en: 'Breakfast included · Check-in from 3 pm' },
    headingLevel: 2,
    priority: false,
    media: { src: foto('#3f6b52', '#c9b27c'), width: 800, height: 1000, alt: 'Patio' },
    labels: { es: { views: 'Vistas del hotel', pause: 'Pausar movimiento' }, en: { views: 'Hotel views', pause: 'Pause motion' } }
  },
  code: { media: ':media="media"', views: ':views="views"' },
  slots: [
    {
      name: 'actions',
      code: '<g-btn size="lg" href="#reservar">Reservar</g-btn>',
      render: () => h(GBtn, { size: 'lg', href: '#reservar' }, () => 'Reservar')
    }
  ],
  cases: [
    {
      title: { es: 'Portada de un sitio de reservas', en: 'Cover of a booking site' },
      why: { es: 'La ventana (por defecto) enmarca una foto vertical junto al titular; una sola acción principal.', en: 'The window (default) frames a vertical photo next to the headline; one primary action.' },
      props: { appearance: 'window' }
    },
    {
      title: { es: 'Marco recto', en: 'Straight frame' },
      why: { es: 'frame rect para marcas sobrias; el arco es la forma propia de Grana, no obligatoria.', en: 'frame rect for sober brands; the arch is Grana’s own shape, not mandatory.' },
      props: { frame: 'rect' }
    },
    {
      title: { es: 'Varias vistas a elegir', en: 'Several views to choose from' },
      why: { es: 'views (2 a 4) deja al visitante cambiar de foto; si solo hay una imagen, déjalo en window.', en: 'views (2 to 4) lets the visitor switch photo; with a single image, stay with window.' },
      props: {
        appearance: 'views', frame: '',
        views: [
          { value: 'patio', label: 'Patio', media: { src: foto('#3f6b52', '#c9b27c'), width: 800, height: 1000, alt: 'Patio' } },
          { value: 'cuarto', label: 'Habitación', media: { src: foto('#6b4f3f', '#e2d6c4'), width: 800, height: 1000, alt: 'Habitación' } }
        ]
      }
    }
  ]
}
