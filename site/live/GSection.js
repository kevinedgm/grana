// Ficha interactiva de GSection. Controles desde GSection.meta.json.
import { h } from 'vue'
import { GBtn } from '@grana/vue'

export default {
  exclude: ['id', 'headingLevel'],
  text: ['title', 'description'],
  block: true,
  base: {
    title: { es: 'Facturación', en: 'Billing' },
    description: { es: 'Datos fiscales y método de pago de la cuenta.', en: 'Tax details and payment method of the account.' },
    labels: { es: { actions: 'Acciones de la sección' }, en: { actions: 'Section actions' } }
  },
  slots: [
    {
      name: 'actions', optional: true, on: false,
      code: '<g-btn variant="outline" size="sm">Editar</g-btn>',
      render: () => h(GBtn, { variant: 'outline', size: 'sm' }, () => 'Editar')
    },
    {
      name: 'default',
      code: '<p>Plan Equipo · 10 personas · se renueva el 1 de diciembre.</p>',
      render: () => h('p', { style: 'margin:0' }, 'Plan Equipo · 10 personas · se renueva el 1 de diciembre.')
    }
  ],
  cases: [
    {
      title: { es: 'Bloque de una pantalla de ajustes', en: 'Block of a settings screen' },
      why: { es: 'Título y descripción agrupan los campos relacionados; el nivel del encabezado lo decide la anidación, no tú.', en: 'Title and description group related fields; the heading level comes from nesting, not from you.' },
      props: {}
    },
    {
      title: { es: 'Sección con acción propia', en: 'Section with its own action' },
      why: { es: 'El slot actions queda al final de la cabecera con su nombre accesible (labels.actions); una sola acción, no una barra.', en: 'The actions slot sits at the end of the header with its accessible name (labels.actions); one action, not a toolbar.' },
      props: {}, slots: { actions: true }
    },
    {
      title: { es: 'Región navegable', en: 'Navigable region' },
      why: { es: 'landmark la expone como región para saltar a ella con el lector; solo en secciones principales, no en cada subsección.', en: 'landmark exposes it as a region to jump to with a screen reader; only for main sections, not every subsection.' },
      props: { landmark: true }
    }
  ]
}
