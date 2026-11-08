// Ficha interactiva de GFormActions.
import { h } from 'vue'
import { GBtn } from '@grana/vue'

const en = () => typeof document !== 'undefined' && document.documentElement.lang.startsWith('en')

export default {
  block: true,
  text: ['status'],
  base: { status: { es: 'Cambios sin guardar', en: 'Unsaved changes' } },
  slots: [
    {
      name: 'default',
      code: '<g-btn type="reset" variant="ghost">Restablecer</g-btn>\n<g-btn type="submit" variant="outline" formnovalidate>Guardar borrador</g-btn>\n<g-btn type="submit">Guardar nota</g-btn>',
      render: () => [
        h(GBtn, { type: 'reset', variant: 'ghost' }, () => (en() ? 'Reset' : 'Restablecer')),
        h(GBtn, { type: 'submit', variant: 'outline', formnovalidate: true }, () => (en() ? 'Save draft' : 'Guardar borrador')),
        h(GBtn, { type: 'submit' }, () => (en() ? 'Save note' : 'Guardar nota'))
      ]
    }
  ],
  cases: [
    {
      title: { es: 'Barra de acciones con estado', en: 'Action bar with status' },
      why: { es: 'Secundarias antes y una sola primaria al final; status es una línea viva que dice qué pasó (guardado, sin guardar).', en: 'Secondary actions first and a single primary last; status is a live line saying what happened (saved, unsaved).' }
    },
    {
      title: { es: 'Barra pegada en un formulario largo', en: 'Sticky bar in a long form' },
      why: { es: 'sticky deja las acciones a la vista mientras se desplaza; innecesario si el formulario cabe en pantalla.', en: 'sticky keeps actions in view while scrolling; unnecessary when the form fits the screen.' },
      props: { sticky: true }
    },
    {
      title: { es: 'Barra compacta', en: 'Compact bar' },
      why: { es: 'density="compact" en paneles y hojas donde cada línea cuenta.', en: 'density="compact" in panels and sheets where every line counts.' },
      props: { density: 'compact' }
    }
  ]
}
