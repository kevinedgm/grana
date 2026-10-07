// API de la entrada `@grana/vue/speech` que no son componentes (dueño: bruno). speech.md §1 y §24.
import type { InjectionKey } from 'vue'
import type { Speech, SpeechOptions, SpeechTarget, Transcript, TranscriptData } from '../shared.js'

/** Crea el gestor de la captura de voz; es plugin: `app.use(speech)` lo provee y registra sus componentes. */
export declare function createSpeech(options: SpeechOptions): Speech
/** Inyecta el gestor provisto; sin gestor o fuera de `setup`, `undefined`. */
export declare function useSpeech(): Speech | undefined
export declare const speechKey: InjectionKey<Speech>
/** Modelo del transcript (estado puro, apto para SSR). Carga un JSON de la F1 o la F2. */
export declare function createTranscript(data?: Partial<TranscriptData>): Transcript
/** Registra un destino mientras viva el componente que lo llama; devuelve la función para darlo de baja. */
export declare function useSpeechTarget(target: SpeechTarget, options?: { speech?: Speech }): () => void
