// Ficha interactiva de GWidgetGrid. Controles desde GWidgetGrid.meta.json.
import { h } from 'vue'
import { GIcon, GMetric, GWidget } from '@grana/vue'

const widgets = {
  ingresos: { title: 'Ingresos', icon: 'wallet', label: 'Ingresos del mes', value: '$48.2k', trend: '+12%', direction: 'up', color: 'success' },
  citas: { title: 'Citas hoy', icon: 'calendar', label: 'Citas', value: 18, trend: '−3', direction: 'down', color: 'warning' },
  meta: { title: 'Pacientes nuevos', icon: 'users', label: 'Esta semana', value: 7, trend: '+2', direction: 'up', color: 'success' }
}
const widgetLabels = { actions: 'Acciones de' }

export default {
  exclude: ['presets', 'label'],
  controls: ['editable', 'columns', 'maxColumns', 'maxRows', 'density'],
  block: true,
  model: { value: [{ id: 'ingresos', w: 2, h: 2 }, { id: 'citas', w: 1, h: 2 }, { id: 'meta', w: 1, h: 2 }], var: 'layout' },
  base: {
    label: { es: 'Panel de la clínica', en: 'Clinic dashboard' },
    labels: {
      grab: 'Mover {title}. Posición {position} de {count}', grabRole: 'elemento reordenable',
      resize: 'Cambiar el tamaño de {title}: {columns} × {rows}',
      grabbed: '{title} recogido. Posición {position} de {count}. Usa las flechas y Espacio para soltar.',
      moved: 'Posición {position} de {count}', dropped: '{title} soltado en la posición {position} de {count}',
      cancelled: 'Movimiento cancelado. {title} vuelve a la posición {position}',
      resized: '{title}: {columns} × {rows}', removed: '{title} quitado',
      moveBefore: 'Mover antes', moveAfter: 'Mover después', size: 'Tamaño', remove: 'Quitar',
      presets: { s: 'Pequeño', m: 'Mediano', l: 'Grande', wide: 'Ancho', tall: 'Alto' },
      empty: 'Sin widgets'
    }
  },
  text: ['label'],
  code: { labels: ':labels="textos"' },
  script: '// textos: tus labels ({ grab, resize, grabbed, moved, dropped, cancelled, resized, removed, moveBefore, moveAfter, size, remove, presets, empty })',
  slots: [
    {
      name: 'item',
      scope: '{ id }',
      code: `<g-widget :title="widgets[id].title" :labels="{ actions: 'Acciones de' }">
  <template #icon><g-icon :name="widgets[id].icon" /></template>
  <g-metric :label="widgets[id].label" :value="widgets[id].value" :trend="widgets[id].trend"
            :direction="widgets[id].direction" :trend-color="widgets[id].color" size="lg" />
</g-widget>`,
      render: ({ id }) => {
        const w = widgets[id]
        return h(GWidget, { title: w.title, labels: widgetLabels, updatedText: 'Hace 5 min' }, {
          icon: () => h(GIcon, { name: w.icon }),
          default: () => h(GMetric, { label: w.label, value: w.value, trend: w.trend, direction: w.direction, trendColor: w.color, size: 'lg' })
        })
      }
    }
  ],
  cases: [
    {
      title: { es: 'Panel que el usuario organiza', en: 'Dashboard the user arranges' },
      why: { es: 'editable activa reordenar y redimensionar con asas y teclado; el layout es un dato que tu aplicación guarda. Sin editable, es solo una rejilla de lectura.', en: 'editable enables reordering and resizing with handles and keyboard; the layout is data your app stores. Without editable, it is a read-only grid.' },
      props: { editable: true }
    },
    {
      title: { es: 'Rejilla de lectura', en: 'Read-only grid' },
      why: { es: 'Sin editable, los widgets no se mueven ni muestran asas: para un panel fijo que ya definió el administrador.', en: 'Without editable, widgets do not move or show handles: for a fixed dashboard the admin already defined.' },
      props: { editable: false }
    },
    {
      title: { es: 'Dos columnas como máximo', en: 'Two columns at most' },
      why: { es: 'columns fija el número de columnas; maxColumns solo pone el tope cuando se calcula solo. Úsalo para paneles dentro de una columna lateral.', en: 'columns fixes the number of columns; maxColumns only caps it when computed automatically. Use it for panels inside a side column.' },
      props: { columns: 2, editable: true }
    }
  ]
}
