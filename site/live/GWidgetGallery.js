// Ficha interactiva de GWidgetGallery. Controles desde GWidgetGallery.meta.json. Es una hoja: un botón la abre.
import { h } from 'vue'
import { GMetric, GWidget } from '@grana/vue'

const items = [
  { id: 'revenue', title: 'Ingresos', category: 'Finanzas', description: 'Ingresos del periodo con tendencia y meta.', sizes: ['m', 'l'], unique: true, value: '$48.2k' },
  { id: 'debts', title: 'Cuentas por cobrar', category: 'Finanzas', description: 'Saldo pendiente de pacientes y aseguradoras.', sizes: ['s', 'm'], value: '$9.6k' },
  { id: 'agenda', title: 'Citas de hoy', category: 'Agenda', description: 'Citas confirmadas, pendientes y canceladas.', sizes: ['s', 'm', 'l'], value: '18' },
  { id: 'team', title: 'Tareas del equipo', category: 'Equipo', description: 'Tareas abiertas por persona.', sizes: ['m', 'l'], value: '12' }
]
const widgetLabels = { actions: 'Acciones de' }

export default {
  exclude: ['id', 'categories'],
  controls: ['size', 'density'],
  text: ['title', 'description'],
  model: { value: false, var: 'abierta' },
  trigger: { label: { es: 'Añadir widget', en: 'Add widget' }, value: true },
  base: {
    title: { es: 'Añadir widget', en: 'Add widget' },
    description: { es: 'Elige un widget y su tamaño inicial; se añade al final del panel.', en: 'Pick a widget and its initial size; it is added at the end of the panel.' },
    items,
    sizes: [{ id: 's', label: 'Pequeño (1×1)' }, { id: 'm', label: 'Mediano (2×1)' }, { id: 'l', label: 'Grande (2×2)' }],
    added: { revenue: 1 },
    labels: {
      search: 'Buscar widgets', all: 'Todas', categories: 'Categoría', add: 'Añadir', size: 'Tamaño inicial',
      results: 'Resultados: {count}', empty: 'Ningún widget coincide con la búsqueda.', added: 'Ya añadido', addedCount: 'En el panel: {count}',
      addedShort: 'Añadido', addedToPanel: '{title} añadido', alreadyAdded: '{title} ya está en el panel', close: 'Cerrar', list: 'Widgets disponibles'
    }
  },
  code: { items: ':items="items"', sizes: ':sizes="sizes"', added: ':added="{ revenue: 1 }"', labels: ':labels="textos"' },
  script: '// items: [{ id, title, category, description, sizes, unique }]; sizes: [{ id, label }]\n// textos: tus labels ({ search, all, categories, add, size, results, empty, added, … })',
  slots: [
    {
      name: 'preview',
      scope: '{ item }',
      code: '<g-widget :title="item.title" :eyebrow="item.category" level="m" :labels="{ actions: \'Acciones de\' }">\n  <g-metric :label="item.title" :value="item.value" size="lg" />\n</g-widget>',
      render: ({ item }) => h(GWidget, { title: item.title, eyebrow: item.category, level: 'm', labels: widgetLabels }, () => h(GMetric, { label: item.title, value: item.value, size: 'lg' }))
    }
  ],
  cases: [
    {
      title: { es: 'Catálogo para añadir al panel', en: 'Catalog to add to the panel' },
      why: { es: 'Buscar, filtrar por categoría y ver una vista previa real del widget antes de añadirlo. La galería solo emite add: tu aplicación inserta el widget en el layout.', en: 'Search, filter by category and see a real preview of the widget before adding it. The gallery only emits add: your app inserts the widget into the layout.' },
      props: {}
    },
    {
      title: { es: 'Widget único ya añadido', en: 'Single widget already added' },
      why: { es: 'unique con added marca el widget con texto («Ya añadido») y deja su botón enfocable pero inactivo; los repetibles muestran cuántos hay.', en: 'unique with added marks the widget with text (“Already added”) and leaves its button focusable but inactive; repeatable ones show how many exist.' },
      props: { added: { revenue: 1, agenda: 2 } }
    },
    {
      title: { es: 'Catálogo con tamaños de panel', en: 'Catalog with panel sizes' },
      why: { es: 'sizes enseña los tamaños con los nombres de tu rejilla; cada widget solo ofrece los que admite (sizes del item) y el primero es el inicial.', en: 'sizes shows the sizes with your grid’s names; each widget offers only those it supports (the item’s sizes) and the first is the initial one.' },
      props: { size: 'md' }
    }
  ]
}
