// Ficha interactiva de GIcon. Mide 1em: la ficha lo agranda con el tamaño de letra del contenedor.
import { h } from 'vue'
import { GIcon } from '@grana/vue'

export default {
  exclude: [],
  text: ['name', 'label'],
  base: { name: 'calendar' },
  codeFor: (state, slots, tpl) => `<!-- mide 1em: el tamaño lo da la letra del contenedor -->\n<span style="font-size: 3rem">\n  ${tpl}\n</span>`,
  host: (props) => h('span', { style: { fontSize: '3rem', lineHeight: 1, display: 'inline-flex' } }, [h(GIcon, props)]),
  cases: [
    {
      title: { es: 'Decorativo junto a su texto', en: 'Decorative next to its text' },
      why: { es: 'Sin label es decorativo (aria-hidden): el texto de al lado ya dice lo mismo.', en: 'Without label it is decorative (aria-hidden): the text next to it says the same.' },
      props: { name: 'lock' }
    },
    {
      title: { es: 'Icono que informa solo', en: 'Icon that informs on its own' },
      why: { es: 'Con label es una imagen con nombre; úsalo cuando no hay texto cerca que diga lo mismo.', en: 'With label it is a named image; use it when no nearby text says the same.' },
      props: { name: 'bell', label: { es: 'Con recordatorio', en: 'With reminder' } }
    },
    {
      title: { es: 'Flecha que se invierte en RTL', en: 'Arrow that flips in RTL' },
      why: { es: 'flipRtl espeja los iconos con dirección (flechas) en idiomas de derecha a izquierda; no lo uses en símbolos que no tienen lado.', en: 'flipRtl mirrors directional icons (arrows) in right-to-left languages; do not use it on symbols with no side.' },
      props: { name: 'arrow-right', flipRtl: true }
    }
  ]
}
