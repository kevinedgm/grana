// Ficha interactiva de GSurface. Controles desde GSurface.meta.json.
import { h } from 'vue'

export default {
  // as cambia la etiqueta; zone brand cambia el plano de color (se ve en el caso).
  exclude: ['as'],
  block: true,
  slots: [
    {
      name: 'default',
      code: '<p>Plan Pro · 3 asientos · $36 al mes</p>',
      render: () => h('p', { style: 'margin:0' }, 'Plan Pro · 3 asientos · $36 al mes')
    }
  ],
  cases: [
    {
      title: { es: 'Panel de contenido', en: 'Content panel' },
      why: { es: 'outlined es la superficie neutra por defecto; sube a raised solo si debe despegarse del fondo.', en: 'outlined is the neutral default surface; go up to raised only if it must lift off the background.' },
      props: { level: 'outlined', padding: 'md' }
    },
    {
      title: { es: 'Tarjeta que se levanta', en: 'Card that lifts' },
      why: { es: 'raised con padding lg para un bloque destacado; no apiles varios raised, perderían jerarquía.', en: 'raised with padding lg for a highlighted block; do not stack several raised, they lose hierarchy.' },
      props: { level: 'raised', padding: 'lg' }
    },
    {
      title: { es: 'Zona hundida para un resumen', en: 'Sunken zone for a summary' },
      why: { es: 'tone sunken con inset marca un área secundaria dentro de otra superficie.', en: 'tone sunken with inset marks a secondary area inside another surface.' },
      props: { level: 'inset', tone: 'sunken', padding: 'sm' }
    },
    {
      title: { es: 'Plano de marca', en: 'Brand plane' },
      why: { es: 'zone brand pinta la zona con la tinta de marca para una franja de identidad; úsala una vez por vista.', en: 'zone brand paints the zone with the brand ink for an identity strip; use it once per view.' },
      props: { zone: 'brand', level: 'flat', padding: 'lg' }
    }
  ]
}
