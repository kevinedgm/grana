// Ficha interactiva de GInputGroup (partes: GInputGroupSelect, GInputGroupInput, GInputGroupText).
import { h } from 'vue'
import { GInputGroupSelect, GInputGroupInput, GInputGroupText } from '@grana/vue'

const en = () => typeof document !== 'undefined' && document.documentElement.lang.startsWith('en')

export default {
  exclude: ['id', 'valid', 'warning', 'name', 'mark'],
  block: true,
  text: ['label', 'hint', 'error'],
  base: {
    label: { es: 'Teléfono', en: 'Phone' },
    hint: { es: 'Código de país y número, como un solo dato.', en: 'Country code and number, as a single value.' },
    name: 'telefono',
    style: '--g-form-min: 50'
  },
  slots: [
    {
      name: 'default',
      code: '<g-input-group-select name="pais" part-label="Código de país" :options="paises" />\n<g-input-group-input name="numero" principal type="tel" placeholder="951 123 4567" />',
      render: () => [
        h(GInputGroupSelect, { name: 'pais', partLabel: en() ? 'Country code' : 'Código de país', options: [{ value: '+52', label: 'MX +52' }, { value: '+1', label: 'US +1' }, { value: '+34', label: 'ES +34' }] }),
        h(GInputGroupInput, { name: 'numero', principal: true, type: 'tel', placeholder: '951 123 4567' })
      ]
    }
  ],
  cases: [
    {
      title: { es: 'Teléfono: código + número', en: 'Phone: code + number' },
      why: { es: 'Un solo dato en dos controles fusionados; la parte principal (principal) lleva el foco y el nombre del grupo.', en: 'One value in two merged controls; the principal part carries focus and the group name.' }
    },
    {
      title: { es: 'Con error del grupo', en: 'With a group error' },
      why: { es: 'El error es del dato completo, no de una parte; si cada parte se valida aparte, usa campos sueltos.', en: 'The error belongs to the whole value, not a part; if each part validates on its own, use separate fields.' },
      props: { error: { es: 'Escribe los 10 dígitos del número.', en: 'Enter the 10 digits of the number.' } }
    },
    {
      title: { es: 'Variante suave y compacta', en: 'Soft, compact variant' },
      why: { es: 'variant="soft" y size="sm" en barras de filtros y captura densa; en formularios normales deja outline.', en: 'variant="soft" and size="sm" in filter bars and dense entry; keep outline in regular forms.' },
      props: { variant: 'soft', size: 'sm' }
    }
  ]
}
