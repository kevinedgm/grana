// Entrada `@grana/vue/speech` (dueño: bruno). design/contracts/speech.md §1, DECISIONS.md #238: la captura de voz no
// viaja en `@grana/vue`; quien no la usa no la paga. Se construye aparte (vite.speech.config.js → dist/speech.js y
// dist/speech.umd.js, global GranaSpeech) con Vue y `@grana/vue` como externos: lo compartido con el paquete principal
// (GBtn, GIcon, topModal, reservas de borde, canales…) llega de `@grana/vue` vía `__shared` (src/shared.js), sin copia.
// El CSS de la captura sigue en grana.css.
import { createSpeech as createManager, useSpeech, useSpeechTarget, speechKey } from './components/GSpeechHost/speech.js'
import GSpeechHost from './components/GSpeechHost/GSpeechHost.vue'
import GSpeechPill from './components/GSpeechPill/GSpeechPill.vue'
import GSpeechTrigger from './components/GSpeechTrigger/GSpeechTrigger.vue'
import GTranscript from './components/GTranscript/GTranscript.vue'
import { createTranscript } from './components/GTranscript/transcript.js'

const components = { GSpeechHost, GSpeechPill, GSpeechTrigger, GTranscript }

// El gestor es también plugin: `app.use(speech)` lo provee y registra sus componentes (también GTranscript, F2 #251) si
// no lo estaban (§1).
export function createSpeech(options) {
  const speech = createManager(options)
  const provide = speech.install
  speech.install = function install(app) {
    provide(app)
    for (const [name, component] of Object.entries(components)) {
      if (!app.component(name)) app.component(name, component)
    }
  }
  return speech
}

export { useSpeech, speechKey, GSpeechHost, GSpeechPill, GSpeechTrigger }
// Fase 2 (§21 a §24): vista de revisión, modelo del transcript y registro de destinos
export { GTranscript, createTranscript, useSpeechTarget }
