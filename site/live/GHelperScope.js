// Ficha interactiva de GHelperScope: su ámbito fija la referencia de un GHelper flotante.
import { h } from 'vue'
import { GHelper, GSurface, GInput, GBtn } from '@grana/vue'

const en = () => typeof document !== 'undefined' && document.documentElement.lang.startsWith('en')

export default {
  exclude: [],
  block: true,
  base: { 'aria-label': { es: 'Datos de facturación', en: 'Billing data' } },
  slots: [
    {
      name: 'default',
      code: '<g-surface level="outlined" padding="lg">\n  <g-input label="RFC" name="rfc" />\n</g-surface>\n<g-helper mode="float" placement="top-end" attach="edge" aria-label="Ayuda con la facturación" content-label="Ayuda con la facturación" close-label="Cerrar">\n  <template #content="{ close }">\n    <p>Usa el RFC con homoclave.</p>\n    <g-btn variant="ghost" size="sm" @click="close">Entendido</g-btn>\n  </template>\n</g-helper>',
      render: () => [
        h(GSurface, { level: 'outlined', padding: 'lg' }, () => h(GInput, { label: 'RFC', name: 'rfc' })),
        h(GHelper, {
          mode: 'float', placement: 'top-end', attach: 'edge',
          ariaLabel: en() ? 'Billing help' : 'Ayuda con la facturación',
          contentLabel: en() ? 'Billing help' : 'Ayuda con la facturación',
          closeLabel: en() ? 'Close' : 'Cerrar'
        }, {
          content: ({ close }) => [
            h('p', en() ? 'Use the RFC with its homoclave as shown on your tax certificate.' : 'Usa el RFC con homoclave tal como aparece en tu constancia fiscal.'),
            h(GBtn, { variant: 'ghost', size: 'sm', onClick: close }, () => (en() ? 'Got it' : 'Entendido'))
          ]
        })
      ]
    }
  ],
  cases: [
    {
      title: { es: 'Ayuda flotante sobre el borde de una región', en: 'Floating help on a region edge' },
      why: { es: 'El ámbito es la referencia de attach="edge": el disparador queda en el borde de esta región, no de la página. Sin ámbito, el ancla es el contenedor posicionado más cercano.', en: 'The scope is the reference for attach="edge": the trigger sits on this region’s edge, not the page’s. Without a scope, the anchor is the nearest positioned container.' }
    },
    {
      title: { es: 'Ámbito como sección con nombre', en: 'Scope as a named section' },
      why: { es: 'as="section" con aria-label hace del ámbito una región con nombre; con un div, es solo geometría.', en: 'as="section" with aria-label makes the scope a named region; a div is just geometry.' },
      props: { as: 'section' }
    }
  ]
}
