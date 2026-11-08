// Ficha interactiva de GBtn. Los controles salen de GBtn.meta.json; aquí solo lo que el ejemplo necesita.
import { h } from 'vue'
import { GIcon } from '@grana/vue'

export default {
  // href cambia el elemento a <a> y navega; icon exige aria-label; done y los textos de anuncio se ven en «Casos».
  exclude: ['href', 'icon', 'tooltip', 'done', 'doneText', 'type'],
  slots: [
    { name: 'prepend', optional: true, on: false, code: '<g-icon name="save" />', render: () => h(GIcon, { name: 'save' }) },
    { name: 'default', text: { es: 'Guardar', en: 'Save' } }
  ],
  cases: [
    {
      title: { es: 'Acción principal de un formulario', en: 'Primary action of a form' },
      why: { es: 'Una por vista: solid con el color de marca. Las demás acciones bajan a soft u outline.', en: 'One per view: solid in the brand color. Other actions step down to soft or outline.' },
      props: { variant: 'solid', color: 'brand' }, slots: { prepend: true }
    },
    {
      title: { es: 'Acción destructiva secundaria', en: 'Secondary destructive action' },
      why: { es: 'outline + danger avisa sin competir con la acción principal; confirma antes de borrar.', en: 'outline + danger warns without competing with the primary action; confirm before deleting.' },
      props: { variant: 'outline', color: 'danger' }
    },
    {
      title: { es: 'Guardado en curso', en: 'Saving in progress' },
      why: { es: 'loading conserva el ancho y el foco; loadingText se anuncia si la espera llega a verse (200 ms).', en: 'loading keeps the width and focus; loadingText is announced if the wait becomes visible (200 ms).' },
      props: { loading: true, loadingText: { es: 'Guardando…', en: 'Saving…' } }
    },
    {
      title: { es: 'Acción compacta en una barra de herramientas', en: 'Compact action in a toolbar' },
      why: { es: 'ghost + neutral y size sm para no cargar la barra; el área táctil sigue en ≥ 24 px.', en: 'ghost + neutral and size sm to keep the bar light; the touch target stays ≥ 24 px.' },
      props: { variant: 'ghost', color: 'neutral', size: 'sm' }, slots: { prepend: true }
    }
  ]
}
