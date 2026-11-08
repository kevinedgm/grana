// Ficha interactiva de GCard. Controles desde GCard.meta.json.
import { h } from 'vue'
import { GBtn, GIcon } from '@grana/vue'

export default {
  exclude: ['as', 'href', 'target', 'rel', 'name', 'value', 'id', 'current', 'selectable', 'selectType', 'skeleton', 'retryable', 'empty', 'headingLevel', 'titleLines', 'descriptionLines', 'rounded', 'mediaPosition', 'interaction', 'meta', 'menu', 'badgeColor'],
  controls: ['title', 'subtitle', 'description', 'eyebrow', 'badge', 'level', 'padding', 'density', 'color', 'orientation', 'expandable', 'status', 'loading', 'disabled'],
  text: ['title', 'subtitle', 'description', 'eyebrow', 'badge', 'statusText'],
  block: true,
  base: {
    title: { es: 'Proyecto Atlas', en: 'Atlas project' },
    subtitle: { es: 'Equipo de datos', en: 'Data team' },
    description: { es: 'Panel de indicadores trimestrales con corte por región.', en: 'Quarterly indicators dashboard split by region.' },
    statusText: { es: 'Falta la fuente de datos de octubre.', en: 'The October data source is missing.' },
    labels: {
      es: { menu: 'Acciones de', loading: 'Cargando tarjeta', loaded: 'Tarjeta cargada', retry: 'Reintentar', empty: 'Aún no hay proyectos', expand: 'Mostrar más', collapse: 'Mostrar menos' },
      en: { menu: 'Actions for', loading: 'Loading card', loaded: 'Card loaded', retry: 'Retry', empty: 'No projects yet', expand: 'Show more', collapse: 'Show less' }
    }
  },
  slots: [
    { name: 'lead', optional: true, on: false, code: '<g-icon name="folder" />', render: () => h(GIcon, { name: 'folder' }) },
    { name: 'actions', optional: true, on: false, code: '<g-btn variant="outline" size="sm">Abrir</g-btn>', render: () => h(GBtn, { variant: 'outline', size: 'sm' }, () => 'Abrir') }
  ],
  ignore: ['navigate', 'expand'],
  cases: [
    {
      title: { es: 'Tarjeta de proyecto con acción', en: 'Project card with an action' },
      why: { es: 'Título, resumen y una acción al pie: la acción es un botón real, no toda la tarjeta clicable.', en: 'Title, summary and one action at the bottom: the action is a real button, not a clickable card.' },
      props: { level: 'outlined' }, slots: { lead: true, actions: true }
    },
    {
      title: { es: 'Tarjeta con estado', en: 'Card with a status' },
      why: { es: 'status + statusText cuenta qué pasó dentro de la propia tarjeta; para un fallo global usa un aviso, no cada tarjeta.', en: 'status + statusText tells what happened inside the card itself; for a global failure use an alert, not every card.' },
      props: { status: 'warning', statusText: { es: 'Falta la fuente de datos de octubre.', en: 'The October data source is missing.' } }
    },
    {
      title: { es: 'Tarjeta que se carga', en: 'Card that loads' },
      why: { es: 'loading conserva la forma de la tarjeta y anuncia el cambio con labels.loading y labels.loaded.', en: 'loading keeps the card shape and announces the change with labels.loading and labels.loaded.' },
      props: { loading: true }
    },
    {
      title: { es: 'Descripción larga que se despliega', en: 'Long description that expands' },
      why: { es: 'expandable recorta el texto y deja leer el resto sin salir de la lista; no lo uses con textos cortos.', en: 'expandable clips the text and lets you read the rest without leaving the list; do not use it with short texts.' },
      props: { expandable: true, description: { es: 'Panel de indicadores trimestrales con corte por región, canal y tamaño de cuenta. Incluye la comparación contra el año anterior y las notas del equipo de análisis sobre los cambios de metodología.', en: 'Quarterly indicators dashboard split by region, channel and account size. It includes the year-over-year comparison and the analysis team notes on methodology changes.' } }
    }
  ]
}
