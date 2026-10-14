<script setup>
import { onBeforeUnmount, provide, ref } from 'vue'
import { createSpeech, speechKey, GSpeechHost, GSpeechTrigger } from '@grana/vue/speech'
import { createSimulatedSpeechAdapter } from '@grana/vue/testing'

// Motor simulado y sin micrófono (input 'self'): en tu aplicación, el adaptador de tu motor
const adapter = createSimulatedSpeechAdapter({
  latency: 900,
  input: { format: 'self' },
  script: { dictation: ['Refiere dolor lumbar de tres días de evolución.', 'Sin fiebre ni pérdida de peso.', 'Mejora al caminar.'] }
})
const speech = createSpeech({
  adapter,
  language: 'es',
  offset: { top: 'var(--vp-nav-height)' }, // la pill flotante, bajo la cabecera fija del sitio
  labels: {
    region: 'Grabación de voz', openPanel: 'abrir panel', closePanel: 'Cerrar panel', duration: 'Duración:',
    actions: { start: 'Empezar a grabar', cancel: 'Cancelar', pause: 'Pausar', resume: 'Reanudar', retry: 'Reintentar', finish: 'Finalizar', discard: 'Descartar', discardAsk: '¿Descartar la grabación? Se borran la transcripción y el audio temporal.', discardConfirm: 'Sí, descartar', closeSession: 'Cerrar sesión', dismiss: 'Cerrar', retrySegment: 'Reintentar fragmento', hideActivity: 'Ocultar actividad' },
    states: {
      requesting: { short: 'Pidiendo permiso', long: 'Esperando el permiso del micrófono', longGranted: 'Activando el micrófono' },
      ready: { short: 'Listo', long: 'Listo para grabar. El micrófono sigue apagado' },
      listening: { short: 'Grabando', long: 'Grabando' },
      speech: { short: 'Voz detectada', long: 'Grabando · voz detectada' },
      transcribing: { short: 'Transcribiendo', long: 'Grabando · transcribiendo' },
      paused: { short: 'En pausa', long: 'En pausa. El micrófono no está capturando' },
      processing: { short: 'Procesando', long: 'Micrófono apagado. Procesando el audio pendiente' },
      reconnecting: { short: 'Reconectando', shortLive: 'Reconectando · grabando', long: 'Reconectando. La grabación está en pausa', longLive: 'Reconectando. La grabación continúa' },
      denied: { short: 'Permiso denegado', long: 'Permiso del micrófono denegado' },
      unavailable: { short: 'Sin micrófono', long: 'Micrófono no disponible' },
      error: { short: 'Error', long: 'Error en la grabación' },
      completed: { short: 'Lista', long: 'Transcripción lista' }
    },
    mode: { dictation: 'Dictado en «{target}»', conversation: 'Conversación · {speakers}' },
    speaker: 'Hablante {letter}', unassigned: 'Sin asignar', attempt: 'Intento {attempt}', signalFlat: 'No llega sonido del micrófono.',
    pending: (n) => (n === 1 ? '1 fragmento pendiente' : `${n} fragmentos pendientes`), pendingNone: 'Todo transcrito', progress: 'Procesando el audio pendiente',
    privacy: { device: 'Procesamiento en este dispositivo.', local: 'Procesamiento en el servicio local de tu organización.', remote: 'Procesamiento en un servicio externo.' },
    audio: { none: 'El audio no se guarda.', memory: 'Audio temporal en memoria; se elimina al finalizar.', disk: 'Audio temporal cifrado en este equipo.', deleted: 'Audio temporal eliminado.', notConfirmed: 'El motor no confirmó la eliminación del audio temporal.' },
    transcript: { title: 'Transcripción', empty: 'Todavía no hay texto.', partialFlag: 'provisional', partialPrefix: 'Texto provisional:', failed: 'No se pudo transcribir', failedLost: 'El audio de este fragmento se perdió.' },
    trigger: { dictate: 'Dictar en {target}', conversation: 'Grabar conversación', view: 'Ver grabación', busy: 'Hay una grabación en curso. Mayús+F8 para ir a ella.' },
    note: { partialPrefix: 'Texto provisional:', notInserted: (n) => (n === 1 ? '1 fragmento dictado sin insertar.' : `${n} fragmentos dictados sin insertar.`), insert: 'Insertar', inserted: 'Dictado insertado.', undo: 'Deshacer dictado' },
    announce: {
      requesting: 'Esperando el permiso del micrófono.', ready: 'Listo para grabar.', startDictation: 'Grabando. Dictado en {target}.', startConversation: 'Grabando conversación.',
      resumed: 'Grabando de nuevo.', paused: 'En pausa. El micrófono no está capturando.', processing: 'Procesando el audio pendiente.',
      completedDictation: 'Dictado terminado. Texto añadido a {target}.', completedConversation: (n) => `Transcripción lista: ${n} fragmentos.`,
      reconnecting: 'Reconectando. La grabación continúa.', reconnectingHeld: 'Reconectando. La grabación está en pausa.', restored: 'Servicio restablecido.', restoredHeld: 'Servicio restablecido. Pulsa Reanudar.',
      inserted: 'Texto añadido a {target}.', undone: 'Inserción deshecha.', undoFailed: 'No se puede deshacer: el campo cambió.', discarded: 'Grabación descartada.',
      discardedUnconfirmed: 'Grabación descartada. El motor no confirmó la eliminación del audio.', closed: 'Sesión de grabación cerrada.', signalFlat: 'No llega sonido del micrófono.',
      segmentFailed: 'No se pudo transcribir un fragmento.', busy: 'Ya hay una grabación en curso.', consentRequired: 'Marca la casilla de aviso para empezar.'
    },
    capture: { continues: 'La grabación continúa.', paused: 'La grabación está en pausa.', stopped: 'La grabación se detuvo.', none: 'No se grabó nada.' },
    audioFate: { processing: 'El audio capturado se sigue transcribiendo.', kept: 'El audio afectado se guarda temporalmente.', lost: 'El audio afectado se perdió.' },
    kept: 'Lo transcrito hasta ahora se conserva.'
  }
})
provide(speechKey, speech)
onBeforeUnmount(() => speech.discard())

const observaciones = ref('')
</script>

<template>
  <div class="demo">
    <div>
      <g-textarea id="demo-obs" v-model="observaciones" name="observaciones" label="Observaciones" :rows="4"></g-textarea>
      <GSpeechTrigger for="demo-obs" />
    </div>
    <p class="nota">Pulsa el micrófono: el texto confirmado entra en el cursor; pulsa otra vez para terminar.</p>
    <GSpeechHost />
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-3); }
.nota { margin: 0; }
</style>
