// Entrada de pruebas `@grana/vue/testing` (dueño: bruno): adaptadores simulados, sin red. speech.md §4.7 y file-field.md.
import type { SimulatedSpeechAdapter, SimulatedSpeechAdapterOptions, SimulatedUploader, SimulatedUploaderOptions } from '../shared.js'

/** Adaptador de voz simulado: provisional palabra a palabra, hablantes por guion y fallos inyectables. */
export declare function createSimulatedSpeechAdapter(options?: SimulatedSpeechAdapterOptions): SimulatedSpeechAdapter
/** Adaptador de subida simulado: progreso por pasos, fallos por nombre de archivo y `AbortError` al cancelar. */
export declare function createSimulatedUploader(options?: SimulatedUploaderOptions): SimulatedUploader
