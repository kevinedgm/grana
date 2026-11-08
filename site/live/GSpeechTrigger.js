// Ficha interactiva de GSpeechTrigger. Controles desde GSpeechTrigger.meta.json. Servicio de voz (@grana/vue/speech):
// ver GSpeechHost.js, que trae el gestor real (createSpeech + motor simulado, sin micrófono ni red) y los textos.
import { defineComponent, h, ref } from 'vue'
import { GTextarea } from '@grana/vue'
import { GSpeechHost, GSpeechTrigger } from '@grana/vue/speech'
import { columna, idUnico, nota, useDemoSpeech, useT } from './GSpeechHost.js'

const ficha = defineComponent({
  name: 'GranaLiveSpeechTrigger',
  inheritAttrs: false,
  setup(_, { attrs }) {
    const campo = idUnico('gl-voz-obs')
    const texto = ref('')
    const t = useT()
    useDemoSpeech()
    return () => {
      const dictado = (attrs.mode || 'dictation') === 'dictation'
      return h('div', { style: columna }, [
        h('div', [
          h(GTextarea, { id: campo, name: 'observaciones', label: t('Observaciones', 'Notes'), rows: 3, modelValue: texto.value, 'onUpdate:modelValue': (v) => { texto.value = v } }),
          // El disparador va justo después del campo, como hermano (no dentro)
          h(GSpeechTrigger, { ...attrs, for: dictado ? campo : undefined })
        ]),
        nota(dictado ? t('Pulsa el micrófono: el texto confirmado entra en el cursor; pulsa otra vez para terminar.', 'Press the microphone: confirmed text goes in at the cursor; press again to finish.') : t('Prepara la conversación: abre el panel con el micrófono todavía apagado.', 'Prepare the conversation: opens the panel with the microphone still off.')),
        h(GSpeechHost)
      ])
    }
  }
})

export default {
  host: ficha,
  exclude: ['for', 'targetLabel', 'speech'],
  block: true,
  codeFor: (state) => {
    const attrs = []
    if (state.mode && state.mode !== 'dictation') attrs.push(`mode="${state.mode}"`)
    if (state.mode !== 'conversation') attrs.unshift('for="obs"')
    if (state.size && state.size !== 'md') attrs.push(`size="${state.size}"`)
    if (state.density && state.density !== 'default') attrs.push(`density="${state.density}"`)
    if (state.disabled) attrs.push('disabled')
    const campo = state.mode === 'conversation' ? '' : '<g-textarea id="obs" v-model="form.obs" label="Observaciones" />\n'
    return `<!-- main.js: app.use(Grana).use(speech), con speech = createSpeech({ adapter: miMotor, language: 'es', labels: textos }) -->
${campo}<!-- el disparador va justo después del campo, como hermano -->
<g-speech-trigger ${attrs.join(' ')} />
<g-speech-host />`.replace('<g-speech-trigger  />', '<g-speech-trigger />')
  },
  cases: [
    {
      title: { es: 'Dictado en las observaciones de un formulario', en: 'Dictation into a form’s notes' },
      why: { es: 'El disparador va justo después del campo (hermano, no dentro): solo el texto confirmado entra en el cursor, sin mover el foco, y el campo sigue siendo tuyo con su v-model.', en: 'The trigger goes right after the field (sibling, not inside): only confirmed text goes in at the cursor, without moving focus, and the field stays yours with its v-model.' },
      props: {}
    },
    {
      title: { es: 'Grabar una conversación', en: 'Record a conversation' },
      why: { es: 'mode conversation no necesita campo: prepara la sesión sin abrir el micrófono (participantes, consentimiento) y abre el panel. Úsalo para consultas con varios hablantes.', en: 'mode conversation needs no field: it prepares the session without opening the microphone (participants, consent) and opens the panel. Use it for consultations with several speakers.' },
      props: { mode: 'conversation' }
    },
    {
      title: { es: 'Disparador grande en una barra táctil', en: 'Large trigger in a touch bar' },
      why: { es: 'size y density son los de GBtn: lg o xl para móvil y uso con guantes; el área táctil sigue en ≥ 44 px con puntero grueso.', en: 'size and density are those of GBtn: lg or xl for mobile and use with gloves; the touch target stays ≥ 44 px with a coarse pointer.' },
      props: { size: 'lg', density: 'comfortable' }
    },
    {
      title: { es: 'Dictado no disponible', en: 'Dictation unavailable' },
      why: { es: 'disabled cuando el campo es de solo lectura o falta permiso; la alternativa a ocultarlo es explicar por qué en una ayuda junto al campo.', en: 'disabled when the field is read-only or permission is missing; the alternative to hiding it is explaining why in a hint next to the field.' },
      props: { disabled: true }
    }
  ]
}
