// Ficha interactiva de GStack. Controles desde GStack.meta.json.
import { h } from 'vue'

const caja = (t) => h('div', { style: 'padding:var(--g-space-2) var(--g-space-3);border:1px solid var(--g-color-border);border-radius:var(--g-radius-md)' }, t)

export default {
  // as cambia la etiqueta; horizontal/vertical alinean según la orientación y se prueban en los casos.
  exclude: ['as', 'vertical'],
  block: true,
  slots: [
    {
      name: 'default',
      code: '<div>Resumen</div>\n<div>Detalle</div>\n<div>Historial</div>',
      render: () => [caja('Resumen'), caja('Detalle'), caja('Historial')]
    }
  ],
  cases: [
    {
      title: { es: 'Secciones de una página', en: 'Page sections' },
      why: { es: 'Una pila vertical con gap lg separa bloques grandes; el espacio es del contenedor, no de cada hijo.', en: 'A vertical stack with gap lg separates large blocks; the space belongs to the container, not to each child.' },
      props: { gap: 'lg' }
    },
    {
      title: { es: 'Lista de renglones con separadores', en: 'List of rows with dividers' },
      why: { es: 'divided dibuja un filete entre hijos con gap sm; no lo uses si los hijos ya son tarjetas con borde.', en: 'divided draws a rule between children with gap sm; do not use it if the children are already bordered cards.' },
      props: { divided: true, gap: 'sm' }
    },
    {
      title: { es: 'Barra de acciones', en: 'Action bar' },
      why: { es: 'horizontal con gap sm y alineación al final: los hijos se parten en líneas en pantallas estrechas en vez de desbordar.', en: 'horizontal with gap sm and end alignment: buttons wrap onto lines on narrow screens instead of overflowing.' },
      props: { orientation: 'horizontal', gap: 'sm', horizontal: 'end' }
    },
    {
      title: { es: 'Contenido compacto', en: 'Compact content' },
      why: { es: 'density compact reduce el espacio en una zona densa (paneles laterales); no la mezcles en la misma vista con default.', en: 'density compact tightens the space in a dense zone (side panels); do not mix it with default in the same view.' },
      props: { density: 'compact', gap: 'sm' }
    }
  ]
}
