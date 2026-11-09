// Ficha interactiva de GPageIndex. Controles desde GPageIndex.meta.json.
// Las secciones de la ficha no existen en esta página: track va en false y el anfitrión cancela el salto;
// la actual es solo el modelo (en la aplicación real sigue la lectura).
import { defineComponent, h } from 'vue'
import { GPageIndex } from '@grana/vue/page-index'

const Host = defineComponent({
  name: 'GranaLivePageIndex',
  inheritAttrs: false,
  setup(_, { attrs }) {
    return () => h(GPageIndex, {
      ...attrs,
      onNavigate: (e) => {
        e.event.preventDefault()
        attrs.onNavigate?.(e)
        attrs['onUpdate:modelValue']?.(e.item.id)
      }
    })
  }
})

const items = {
  es: [
    { id: 'uso', label: 'Uso' },
    { id: 'ejemplos', label: 'Ejemplos' },
    { id: 'e1', label: 'Un ejemplo', level: 3 },
    { id: 'api', label: 'API' },
    { id: 'tema', label: 'Tema' }
  ],
  en: [
    { id: 'uso', label: 'Usage' },
    { id: 'ejemplos', label: 'Examples' },
    { id: 'e1', label: 'An example', level: 3 },
    { id: 'api', label: 'API' },
    { id: 'tema', label: 'Theme' }
  ]
}

export default {
  exclude: ['id', 'track', 'scroller', 'items', 'labels', 'label'],
  text: [],
  block: true,
  host: Host,
  imports: ["import { GPageIndex } from '@grana/vue/page-index'", "import '@grana/vue/page-index-list'   // solo con appearance=\"list\""],
  model: { prop: 'modelValue', value: 'api', var: 'actual' },
  base: {
    label: { es: 'En esta página', en: 'On this page' },
    items,
    track: false,
    labels: {
      es: {
        findHint: 'Escribe para buscar', matches: '{count} coincidencias', matchesOne: '1 coincidencia', none: 'Sin coincidencias',
        opened: 'Abierta', openedLive: 'Abierta en segundo plano', copied: 'Enlace copiado', copiedLive: 'Enlace copiado al portapapeles',
        top: 'Volver arriba'
      },
      en: {
        findHint: 'Type to search', matches: '{count} matches', matchesOne: '1 match', none: 'No matches',
        opened: 'Opened', openedLive: 'Opened in the background', copied: 'Link copied', copiedLive: 'Link copied to the clipboard',
        top: 'Back to top'
      }
    }
  },
  code: { items: ':items="secciones"', labels: ':labels="textos"' },
  cases: [
    {
      title: { es: 'Índice en el zócalo de una página', en: 'Index in a page header band' },
      why: { es: 'El botón dice dónde estás y no cambia de ancho al cambiar de sección; ocupa una línea en vez de una columna.', en: 'The button says where you are and keeps its width as the section changes; it takes one line instead of a column.' },
      props: { appearance: 'relay' }
    },
    {
      title: { es: 'Columna «En esta página»', en: '“On this page” column' },
      why: { es: 'En una página ancha la lista queda a la vista, con los títulos de nivel 3 colgando de su sección; el marcador sigue la actual.', en: 'On a wide page the list stays in view, with level 3 headings hanging from their section; the marker follows the current one.' },
      props: { appearance: 'list' }
    },
    {
      title: { es: 'Lista plegada en una barra local', en: 'Folded list in a local bar' },
      why: { es: 'En estrecho la columna no cabe: con fold pasa a un botón con panel y «Volver arriba» como primer enlace.', en: 'When narrow the column does not fit: with fold it becomes a button with a panel and “Back to top” as the first link.' },
      props: { appearance: 'list', fold: true }
    }
  ]
}
