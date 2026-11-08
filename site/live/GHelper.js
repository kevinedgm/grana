// Ficha interactiva de GHelper.
import { h } from 'vue'
import { GBtn } from '@grana/vue'

const en = () => typeof document !== 'undefined' && document.documentElement.lang.startsWith('en')

export default {
  exclude: ['open', 'id', 'offset'],
  text: ['ariaLabel', 'contentLabel', 'closeLabel'],
  base: {
    ariaLabel: { es: 'Dónde encontrar el folio', en: 'Where to find the folio' },
    contentLabel: { es: 'Dónde encontrar el folio', en: 'Where to find the folio' },
    closeLabel: { es: 'Cerrar', en: 'Close' }
  },
  slots: [
    {
      name: 'content',
      scope: '{ close }',
      code: '<p>El folio está en la esquina superior derecha de la receta, junto al código QR.</p>\n<g-btn variant="ghost" size="sm" @click="close">Entendido</g-btn>',
      render: ({ close }) => [
        h('p', en() ? 'The folio is in the top right corner of the printed prescription, next to the QR code.' : 'El folio está en la esquina superior derecha de la receta, junto al código QR.'),
        h(GBtn, { variant: 'ghost', size: 'sm', onClick: close }, () => (en() ? 'Got it' : 'Entendido'))
      ]
    }
  ],
  cases: [
    {
      title: { es: 'Ayuda junto a un título', en: 'Help next to a heading' },
      why: { es: 'inline (por defecto): el botón queda en la línea de lo que explica y el contenido se abre en la capa superior. Para una definición corta, no para instrucciones críticas.', en: 'inline (default): the button sits on the line of what it explains and the content opens in the top layer. For a short definition, not critical instructions.' }
    },
    {
      title: { es: 'Ayuda que abre hacia arriba', en: 'Help opening upward' },
      why: { es: 'content-placement fija hacia dónde se abre; si no cabe, el motor lo voltea. Útil cuando el pie de página tapa el lado habitual.', en: 'content-placement sets where it opens; if it does not fit the engine flips it. Useful when a footer covers the usual side.' },
      props: { contentPlacement: 'top-end' }
    }
  ]
}
