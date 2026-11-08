// Ficha interactiva de GAdaptiveLayout. Controles desde GAdaptiveLayout.meta.json.
import { h } from 'vue'
import { GInput } from '@grana/vue'

const campo = (label, extra = {}) => h(GInput, { label, name: label, ...extra })

export default {
  block: true,
  slots: [
    {
      name: 'default',
      code: '<g-input label="Calle" name="calle" />\n<g-input label="Número" name="numero" class="g-adapt-short" />\n<g-input label="Código postal" name="cp" class="g-adapt-short" />\n<g-input label="Colonia" name="colonia" />',
      render: () => [
        campo('Calle'),
        campo('Número', { class: 'g-adapt-short' }),
        campo('Código postal', { class: 'g-adapt-short' }),
        campo('Colonia')
      ]
    }
  ],
  cases: [
    {
      title: { es: 'Dirección sin filas ni columnas', en: 'Address without rows or columns' },
      why: { es: 'Cada campo declara su necesidad (g-adapt-short) y el layout los reparte según el ancho disponible.', en: 'Each field declares its need (g-adapt-short) and the layout distributes them by available width.' },
      props: { gap: 'md' }
    },
    {
      title: { es: 'Densidad compacta', en: 'Compact density' },
      why: { es: 'density compact y gap sm en un panel lateral estrecho; en un formulario normal usa filas explícitas (GFormRow).', en: 'density compact and gap sm in a narrow side panel; in a normal form use explicit rows (GFormRow).' },
      props: { density: 'compact', gap: 'sm' }
    },
    {
      title: { es: 'Centrado', en: 'Centered' },
      why: { es: 'horizontal center para un conjunto corto que no llena el ancho; no para formularios largos.', en: 'horizontal center for a short set that does not fill the width; not for long forms.' },
      props: { horizontal: 'center', gap: 'lg' }
    }
  ]
}
