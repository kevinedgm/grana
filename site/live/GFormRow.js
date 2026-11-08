// Ficha interactiva de GFormRow.
import { h } from 'vue'
import { GInput } from '@grana/vue'

const en = () => typeof document !== 'undefined' && document.documentElement.lang.startsWith('en')

export default {
  block: true,
  slots: [
    {
      name: 'default',
      code: '<g-input class="g-form-w-lg" label="Calle" name="calle" required />\n<g-input class="g-form-w-xs" label="Núm. ext." name="ext" required />\n<g-input class="g-form-w-xs" label="Núm. int." name="int" />',
      render: () => [
        h(GInput, { class: 'g-form-w-lg', label: en() ? 'Street' : 'Calle', name: 'calle', required: true }),
        h(GInput, { class: 'g-form-w-xs', label: en() ? 'Ext. no.' : 'Núm. ext.', name: 'ext', required: true }),
        h(GInput, { class: 'g-form-w-xs', label: en() ? 'Int. no.' : 'Núm. int.', name: 'int' })
      ]
    }
  ],
  cases: [
    {
      title: { es: 'Dirección: la calle manda, los números caben', en: 'Address: street leads, numbers fit' },
      why: { es: 'Los anchos de pista (g-form-w-*) dicen cuánto necesita cada campo; la fila se parte en líneas completas cuando no caben.', en: 'Track widths (g-form-w-*) say how much each field needs; the row wraps into full lines when they do not fit.' }
    },
    {
      title: { es: 'Fila que no debe partirse', en: 'Row that must not wrap' },
      why: { es: 'keep mantiene los campos juntos aunque quede apretado; solo para pares que significan una sola cosa (día / mes).', en: 'keep holds fields together even when tight; only for pairs that mean one thing (day / month).' },
      props: { keep: true }
    },
    {
      title: { es: 'Fila compacta en captura repetitiva', en: 'Compact row for repetitive entry' },
      why: { es: 'density propia de la fila; hereda la del formulario si no se indica.', en: 'Row-level density; inherits the form’s when not set.' },
      props: { density: 'compact' }
    }
  ]
}
