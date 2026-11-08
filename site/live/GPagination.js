// Ficha interactiva de GPagination. Controles desde GPagination.meta.json.
// El tamaño de página es del consumidor (v-model:pageSize): el anfitrión lo guarda para que el selector funcione en la ficha.
import { defineComponent, h, ref, watch } from 'vue'
import { GPagination } from '@grana/vue'

const Host = defineComponent({
  name: 'GranaLivePagination',
  inheritAttrs: false,
  setup(_, { attrs }) {
    const size = ref(attrs.pageSize)
    watch(() => attrs.pageSize, (v) => { size.value = v })
    return () => h(GPagination, {
      ...attrs,
      pageSize: size.value,
      'onUpdate:pageSize': (v) => { size.value = v; attrs['onUpdate:pageSize']?.(v) }
    })
  }
})

export default {
  host: Host,
  exclude: ['labels'],
  model: { prop: 'page', value: 3, var: 'pagina' },
  block: true,
  code: { pageSize: 'v-model:page-size="porPagina"' },
  script: 'const porPagina = ref(10)',
  base: {
    total: 124,
    pageSize: 10,
    labels: {
      es: {
        nav: 'Paginación de pedidos', previous: 'Página anterior', next: 'Página siguiente', page: 'Página {page}',
        range: '{from}–{to} de {total}', compact: 'Página {page} de {pages}', pageSize: 'Pedidos por página'
      },
      en: {
        nav: 'Order pagination', previous: 'Previous page', next: 'Next page', page: 'Page {page}',
        range: '{from}–{to} of {total}', compact: 'Page {page} of {pages}', pageSize: 'Orders per page'
      }
    }
  },
  cases: [
    {
      title: { es: 'Lista de pedidos paginada en el servidor', en: 'Server-paged order list' },
      why: {
        es: 'page y total bastan: tu aplicación pide la página y Grana solo pinta los botones. Con auto, si no caben, cae a la forma compacta.',
        en: 'page and total are enough: your app fetches the page and Grana only paints the buttons. With auto, if they do not fit, it falls back to compact.'
      },
      props: {}
    },
    {
      title: { es: 'Elegir cuántas filas ver', en: 'Choose how many rows to see' },
      why: {
        es: 'pageSizes añade el selector; al cambiar, la primera fila que veías sigue en la nueva página. Sin pageSizes no hay selector: no lo pongas si el tamaño es fijo.',
        en: 'pageSizes adds the selector; on change, the first row you saw stays on the new page. Without pageSizes there is no selector: skip it if the size is fixed.'
      },
      props: { total: 450, pageSizes: [10, 25, 50, 100] }
    },
    {
      title: { es: 'Muchísimas páginas', en: 'Very many pages' },
      why: {
        es: 'siblings controla cuántas páginas vecinas se ven; el resto se abrevia con elipsis. Más vecinas ayudan a saltar, pero ensanchan la barra.',
        en: 'siblings sets how many neighbor pages show; the rest collapse into an ellipsis. More neighbors help jumping but widen the bar.'
      },
      props: { total: 4800, siblings: 2 }
    },
    {
      title: { es: 'Panel estrecho', en: 'Narrow panel' },
      why: {
        es: 'responsive compact fuerza «Página 3 de 13» con anterior y siguiente cuando sabes que el contenedor es pequeño (un lateral, una tarjeta).',
        en: 'responsive compact forces “Page 3 of 13” with previous and next when you know the container is small (a side panel, a card).'
      },
      props: { responsive: 'compact' }
    }
  ]
}
