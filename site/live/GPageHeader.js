// Ficha interactiva de GPageHeader. Controles desde GPageHeader.meta.json.
import { h } from 'vue'
import { GBtn, GBadge } from '@grana/vue'
import { GPageHeader } from '@grana/vue/page-header'

export default {
  // sticky se fija en false: pegado, el encabezado se fijaría sobre la navegación del sitio.
  exclude: ['sticky', 'id', 'headingLevel'],
  text: ['title', 'eyebrow', 'description'],
  block: true,
  host: GPageHeader,
  imports: ["import { GPageHeader } from '@grana/vue/page-header'"],
  base: {
    title: { es: 'Expediente 2026-09-EX', en: 'File 2026-09-EX' },
    eyebrow: { es: 'Consulta externa', en: 'Outpatient' },
    description: { es: 'Actualizado hace 2 horas.', en: 'Updated 2 hours ago.' },
    sticky: false,
    headingLevel: 2,
    labels: { es: { actions: 'Acciones del expediente' }, en: { actions: 'File actions' } }
  },
  slots: [
    { name: 'meta', optional: true, on: false, code: '<g-badge color="info">Activo</g-badge>', render: () => h(GBadge, { color: 'info' }, () => 'Activo') },
    {
      name: 'actions', optional: true, on: true,
      code: '<g-btn variant="outline" color="neutral">Descargar</g-btn>\n<g-btn>Archivar</g-btn>',
      render: () => [h(GBtn, { variant: 'outline', color: 'neutral' }, () => 'Descargar'), h(GBtn, null, () => 'Archivar')]
    }
  ],
  cases: [
    {
      title: { es: 'Cabecera de un expediente', en: 'Header of a file' },
      why: { es: 'Título, estado y las acciones de la página en un solo sitio; el h1 es del encabezado, no repitas otro.', en: 'Title, status and the page actions in one place; the h1 belongs to the header, do not add another.' },
      props: {}, slots: { meta: true, actions: true }
    },
    {
      title: { es: 'Solo título', en: 'Title only' },
      why: { es: 'Una pantalla simple no necesita descripción ni acciones; el resto de huecos se omite sin dejar espacio.', en: 'A simple screen needs no description or actions; the other slots are omitted without leaving space.' },
      props: { eyebrow: '', description: '' }, slots: { actions: false }
    },
    {
      title: { es: 'Sobre un plano de marca', en: 'On a brand plane' },
      why: { es: 'zone brand para pantallas de identidad fuerte; la acción principal cambia a tinta invertida sola.', en: 'zone brand for strongly branded screens; the primary action switches to inverted ink by itself.' },
      props: { zone: 'brand' }, slots: { actions: true }
    }
  ]
}
