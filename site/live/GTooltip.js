// Ficha interactiva de GTooltip. Controles desde GTooltip.meta.json.
// El hijo cambia con kind: «description» solo tiene sentido en un control que ya tiene nombre (un botón con texto);
// el resto, en un botón de solo icono, que es el caso que necesita el nombre.
import { defineComponent, h } from 'vue'
import { GBtn, GIcon, GTooltip } from '@grana/vue'

const en = () => typeof document !== 'undefined' && document.documentElement.lang.startsWith('en')
const named = (kind) => kind === 'description'

const Host = defineComponent({
  name: 'GranaLiveTooltip',
  inheritAttrs: false,
  setup(_, { attrs }) {
    return () => h(GTooltip, attrs, {
      default: () => (named(attrs.kind)
        ? h(GBtn, { variant: 'outline' }, () => (en() ? 'Publish' : 'Publicar'))
        : h(GBtn, { icon: true, variant: 'ghost' }, () => h(GIcon, { name: 'copy' })))
    })
  }
})

export default {
  host: Host,
  exclude: ['id', 'disabled'],
  text: ['text', 'detail', 'shortcut', 'keyshortcuts'],
  base: {
    text: { es: 'Duplicar', en: 'Duplicate' },
    shortcut: 'Ctrl D',
    keyshortcuts: 'Control+D'
  },
  // El hijo depende de kind: se escribe a mano para que el código copiado sea el uso real.
  codeFor: (state, _slots, tpl) => {
    const child = named(state.kind)
      ? `<g-btn variant="outline">${en() ? 'Publish' : 'Publicar'}</g-btn>`
      : '<g-btn icon variant="ghost"><g-icon name="copy" /></g-btn>'
    return tpl.replace(/\s*\/>$/, `>\n  ${child}\n</g-tooltip>`)
  },
  cases: [
    {
      title: { es: 'Botón de solo icono', en: 'Icon-only button' },
      why: {
        es: 'El texto es el nombre del control (kind label): sin él, el botón no tiene nombre. Con un atajo, ponlo en shortcut y en keyshortcuts.',
        en: 'The text is the control’s name (kind label): without it the button has none. With a shortcut, set shortcut and keyshortcuts.'
      },
      props: { kind: 'label' }
    },
    {
      title: { es: 'Aclarar un botón que ya tiene nombre', en: 'Clarify an already-named button' },
      why: {
        es: 'El texto pasa a describirlo (kind description, o auto): úsalo para una consecuencia, no para repetir el nombre. Si lo importante no puede faltar, ponlo visible en la página.',
        en: 'The text describes it (kind description, or auto): use it for a consequence, not to repeat the name. If it is essential, put it visibly on the page.'
      },
      props: {
        kind: 'description', shortcut: '', keyshortcuts: '',
        text: { es: 'Visible para todo el equipo de la clínica', en: 'Visible to the whole clinic team' }
      }
    },
    {
      title: { es: 'Dos tiempos: nombre y luego detalle', en: 'Two stages: name, then detail' },
      why: {
        es: 'Con detail la etiqueta crece si el puntero se queda quieto. Recorrer una barra tapa poco; leer con intención recibe más. El lector oye todo al instante.',
        en: 'With detail the label grows if the pointer rests. Sweeping a bar covers little; reading with intent gets more. Screen readers hear everything at once.'
      },
      props: {
        kind: 'label', shortcut: '', keyshortcuts: '',
        text: { es: 'Marcar para revisión', en: 'Flag for review' },
        detail: { es: 'Avisa al responsable del expediente', en: 'Notifies the record owner' }
      }
    },
    {
      title: { es: 'Etiqueta al lado, en una barra vertical', en: 'Label at the side, in a vertical bar' },
      why: {
        es: 'placement right (lógico) para controles apilados junto a un borde, donde abajo estorba. Sin placement ya elige bottom, o right en un grupo vertical.',
        en: 'placement right (logical) for stacked controls by an edge, where below gets in the way. Without placement it picks bottom, or right in a vertical group.'
      },
      props: { kind: 'label', placement: 'right', shortcut: '', keyshortcuts: '' }
    }
  ]
}
