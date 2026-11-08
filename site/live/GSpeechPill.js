// Ficha interactiva de GSpeechPill. Servicio de voz (@grana/vue/speech): ver GSpeechHost.js, que trae el gestor
// real (createSpeech + motor simulado, sin micrófono ni red) y los textos.
import { defineComponent, h } from 'vue'
import { GInput, GSurface } from '@grana/vue'
import { GSpeechHost, GSpeechPill, GSpeechTrigger } from '@grana/vue/speech'
import { columna, idUnico, nota, useDemoSpeech, useT } from './GSpeechHost.js'

const ficha = defineComponent({
  name: 'GranaLiveSpeechPill',
  inheritAttrs: false,
  props: { scenario: { type: String, default: 'header' } },
  setup(props) {
    const campo = idUnico('gl-voz-motivo')
    const t = useT()
    useDemoSpeech()
    return () => h('div', { style: columna }, [
      h(GSurface, { as: 'header', level: 'outlined', padding: 'sm', style: 'display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:var(--g-space-2);min-block-size:calc(var(--g-space-1) * 21)' }, () => [
        h('strong', t('Consulta · Lucía Herrera', 'Consultation · Lucía Herrera')),
        props.scenario === 'header' ? h(GSpeechPill) : null
      ]),
      h('div', [h(GInput, { id: campo, name: 'motivo', label: t('Motivo de consulta', 'Reason for visit') }), h(GSpeechTrigger, { for: campo })]),
      nota(props.scenario === 'header' ? t('Empieza a dictar: la pill aparece en la cabecera con el estado, la duración, Pausar y Finalizar.', 'Start dictating: the pill appears in the header with the status, duration, Pause and Finish.') : t('Sin GSpeechPill en la página, empieza a dictar: el anfitrión muestra su pill flotante en el borde.', 'With no GSpeechPill on the page, start dictating: the host shows its floating pill at the edge.')),
      h(GSpeechHost)
    ])
  }
})

export default {
  host: ficha,
  controls: [],
  exclude: ['speech'],
  block: true,
  hidden: ['scenario'],
  codeFor: (state) => `<!-- main.js: app.use(Grana).use(speech), con speech = createSpeech({ adapter: miMotor, language: 'es', labels: textos }) -->
${state.scenario === 'header'
    ? `<header>
  <strong>Consulta · Lucía Herrera</strong>
  <g-speech-pill />
</header>
`
    : ''}<g-input id="motivo" v-model="form.motivo" label="Motivo de consulta" />
<g-speech-trigger for="motivo" />
<g-speech-host />`,
  cases: [
    {
      title: { es: 'Estado de la grabación en la cabecera', en: 'Recording status in the header' },
      why: { es: 'Pon la pill donde quieras que se vea la grabación (cabecera, barra de herramientas): se ve el estado, la duración, Pausar y Finalizar sin abrir el panel. Reserva sitio: con menos de unos 160 px desborda.', en: 'Put the pill where you want the recording seen (header, toolbar): status, duration, Pause and Finish show without opening the panel. Reserve room: below about 160 px it overflows.' },
      props: { scenario: 'header' }
    },
    {
      title: { es: 'Sin pill propia: la flotante de respaldo', en: 'No pill of your own: the fallback floating one' },
      why: { es: 'Es opcional: si no montas GSpeechPill, el anfitrión muestra una pill flotante en el borde. Mientras hay sesión hay exactamente una pill visible y operable.', en: 'It is optional: if you do not mount GSpeechPill, the host shows a floating pill at the edge. While a session exists there is exactly one visible, operable pill.' },
      props: { scenario: 'floating' }
    }
  ]
}
