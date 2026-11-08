// Ficha interactiva de GContainer. Controles desde GContainer.meta.json.
import { h } from 'vue'

const parrafo = (t) => h('p', { style: 'margin:0' }, t)

export default {
  // as cambia el elemento (main/section/article): en la página del sitio ya hay un main.
  exclude: ['as'],
  block: true,
  slots: [
    {
      name: 'default',
      code: '<p>Una columna con margen propio…</p>',
      render: () => [
        parrafo('Un contenedor limita el ancho de la página y le da un margen que se adapta al visor.'),
        parrafo('Cambia width para verlo crecer; el contenido sigue alineado con el resto de la página.')
      ]
    }
  ],
  cases: [
    {
      title: { es: 'Página de aplicación', en: 'Application page' },
      why: { es: 'width lg (el valor por defecto) centrado: el ancho de trabajo de casi toda pantalla de gestión.', en: 'width lg (the default) centered: the working width of almost every management screen.' },
      props: { width: 'lg' }
    },
    {
      title: { es: 'Texto largo para leer', en: 'Long text to read' },
      why: { es: 'reading + prose fija una medida de lectura cómoda; no la uses para tablas ni paneles, que necesitan ancho.', en: 'reading + prose sets a comfortable reading measure; do not use it for tables or panels, which need width.' },
      props: { width: 'reading', prose: true }
    },
    {
      title: { es: 'Formulario estrecho', en: 'Narrow form' },
      why: { es: 'sm para un inicio de sesión o un asistente corto: una columna que no se estira en pantallas grandes.', en: 'sm for a sign-in or a short wizard: a column that does not stretch on large screens.' },
      props: { width: 'sm' }
    },
    {
      title: { es: 'Alineado al inicio junto a una navegación', en: 'Start-aligned next to a navigation' },
      why: { es: 'horizontal start pega la columna a la navegación lateral; centrado dejaría un hueco a cada lado.', en: 'horizontal start pins the column to the side navigation; centered would leave a gap on each side.' },
      props: { width: 'md', horizontal: 'start' }
    }
  ]
}
