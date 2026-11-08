// Ficha interactiva de GTag (GTagGroup comparte página: se documenta en su README, aquí solo la etiqueta suelta).
import { h } from 'vue'
import { GIcon } from '@grana/vue'

export default {
  exclude: ['href', 'pressed', 'color', 'categories', 'colorKey', 'labels'],
  text: ['label'],
  base: { label: { es: 'Penicilina', en: 'Penicillin' }, labels: { remove: { es: 'Quitar {label}', en: 'Remove {label}' } } },
  imports: ["import { GTag } from '@grana/vue/tag'"],
  slots: [
    { name: 'lead', optional: true, on: false, code: '<g-icon name="tag" />', render: () => h(GIcon, { name: 'tag' }) }
  ],
  cases: [
    {
      title: { es: 'Categoría que solo se lee', en: 'Category that is only read' },
      why: { es: 'Sin acción: ni foco ni interacción; si el texto no cabe, se parte en líneas. Para repartir color por categoría, categories exige que el tema las defina.', en: 'No action: no focus or interaction; if the text does not fit it wraps. To spread color by category, categories requires the theme to define them.' },
      props: { label: { es: 'Cardiología', en: 'Cardiology' } }
    },
    {
      title: { es: 'Color estable por categoría', en: 'Stable color per category' },
      why: { es: 'categories (el mismo número que la entrada del tema) reparte el color por el texto con un hash estable: la misma etiqueta siempre sale del mismo color.', en: 'categories (the same number as the theme entry) spreads color by text with a stable hash: the same tag always gets the same color.' },
      props: { label: { es: 'Cardiología', en: 'Cardiology' }, categories: 8 }
    },
    {
      title: { es: 'Dato que se puede quitar', en: 'Data that can be removed' },
      why: { es: 'removable añade el botón de quitar con su nombre (labels.remove); para quitar varias a la vez y poder deshacer, usa GTagGroup.', en: 'removable adds the remove button with its name (labels.remove); to remove several and allow undo, use GTagGroup.' },
      props: { removable: true }
    },
    {
      title: { es: 'Filtro que se enciende y apaga', en: 'Filter that toggles' },
      why: { es: 'pressed booleano la vuelve un botón de alternar (aria-pressed); en la ficha se muestra encendida, con v-model:pressed la controlas tú.', en: 'a boolean pressed makes it a toggle button (aria-pressed); the live example shows it on, with v-model:pressed you control it.' },
      props: { label: { es: 'Solo pendientes', en: 'Pending only' }, pressed: true }
    },
    {
      title: { es: 'Con icono delante', en: 'With a leading icon' },
      why: { es: 'El hueco lead es decorativo; no sustituye al texto. Para una persona, un GAvatar xs.', en: 'The lead slot is decorative; it does not replace the text. For a person, an xs GAvatar.' },
      props: { label: { es: 'Vue', en: 'Vue' } }, slots: { lead: true }
    }
  ]
}
