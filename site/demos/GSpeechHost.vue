<script setup>
import { onBeforeUnmount, provide, ref } from 'vue'
import { createSpeech, speechKey, GSpeechHost, GSpeechTrigger } from '@grana/vue/speech'
import { createSimulatedSpeechAdapter } from '@grana/vue/testing'

// Motor simulado y sin micrófono (input 'self'); en tu aplicación, el adaptador de tu motor (Whisper local, etc.)
const adapter = createSimulatedSpeechAdapter({
  latency: 900,
  input: { format: 'self' },
  script: {
    conversation: [
      { speaker: 'A', text: 'Buenos días, ¿qué le trae hoy por aquí?' },
      { speaker: 'B', text: 'Desde hace tres días me duele la espalda, sobre todo por la mañana.' },
      { speaker: 'A', text: '¿El dolor se irradia hacia alguna pierna?' },
      { speaker: 'B', text: 'No, se queda en la zona baja, y empeora cuando estoy sentado.' }
    ]
  }
})
const resultado = ref('')
const speech = createSpeech({
  adapter,
  language: 'es',
  offset: { top: 'var(--vp-nav-height)' }, // la pill flotante, bajo la cabecera fija del sitio
  roles: [{ id: 'pro', label: 'Profesional' }, { id: 'pac', label: 'Paciente' }],
  onComplete: (t) => { resultado.value = `onComplete: ${t.segments.length} fragmentos entregados a la aplicación.` },
  labels: {
    region: 'Grabación de voz', openPanel: 'abrir panel', closePanel: 'Cerrar panel', duration: 'Duración:',
    actions: { start: 'Empezar a grabar', cancel: 'Cancelar', pause: 'Pausar', resume: 'Reanudar', retry: 'Reintentar', finish: 'Finalizar', discard: 'Descartar', discardAsk: '¿Descartar la grabación? Se borran la transcripción y el audio temporal. No se puede deshacer.', discardConfirm: 'Sí, descartar', closeSession: 'Cerrar sesión', dismiss: 'Cerrar', retrySegment: 'Reintentar fragmento', hideActivity: 'Ocultar actividad',
      review: 'Revisar', reviewCompleted: 'Revisar transcripción', discardAskUsed: (n) => `¿Descartar la grabación? El texto ya insertado en ${n === 1 ? '1 campo' : n + ' campos'} se queda en el formulario.` },
    speakerRole: '{role} ({letter})',
    review: { title: 'Revisar transcripción', close: 'Cerrar revisión' },
    states: {
      requesting: { short: 'Pidiendo permiso', long: 'Esperando el permiso del micrófono', longGranted: 'Activando el micrófono' },
      ready: { short: 'Listo', long: 'Listo para grabar. El micrófono sigue apagado' },
      listening: { short: 'Grabando', long: 'Grabando' },
      speech: { short: 'Voz detectada', long: 'Grabando · voz detectada' },
      transcribing: { short: 'Transcribiendo', long: 'Grabando · transcribiendo' },
      paused: { short: 'En pausa', long: 'En pausa. El micrófono no está capturando' },
      processing: { short: 'Procesando', long: 'Micrófono apagado. Procesando el audio pendiente' },
      reconnecting: { short: 'Reconectando', shortLive: 'Reconectando · grabando', long: 'Reconectando con el servicio. La grabación está en pausa', longLive: 'Reconectando con el servicio. La grabación continúa' },
      denied: { short: 'Permiso denegado', long: 'Permiso del micrófono denegado' },
      unavailable: { short: 'Sin micrófono', long: 'Micrófono no disponible' },
      error: { short: 'Error', long: 'Error en la grabación' },
      completed: { short: 'Lista', long: 'Transcripción lista' }
    },
    mode: { dictation: 'Dictado en «{target}»', conversation: 'Conversación · {speakers}' },
    expectedSpeakers: { label: 'Participantes previstos', options: { 1: '1 participante', 2: '2 participantes', many: 'Varios participantes' } },
    noDiarization: 'El motor no distingue hablantes: la transcripción saldrá sin etiquetas.',
    consent: { label: 'He avisado a los participantes de que se graba', required: 'Marca la casilla para empezar a grabar.' },
    speaker: 'Hablante {letter}', unassigned: 'Sin asignar', attempt: 'Intento {attempt}', signalFlat: 'No llega sonido del micrófono. Comprueba que no esté silenciado.',
    pending: (n) => (n === 1 ? '1 fragmento pendiente' : n + ' fragmentos pendientes'), pendingNone: 'Todo transcrito', progress: 'Procesando el audio pendiente',
    privacy: { device: 'Procesamiento en este dispositivo.', local: 'Procesamiento en el servicio local de tu organización.', remote: 'Procesamiento en un servicio externo.' },
    audio: { none: 'El audio no se guarda.', memory: 'Audio temporal en memoria; se elimina al finalizar.', disk: 'Audio temporal cifrado en este equipo; se elimina al finalizar.', deleted: 'Audio temporal eliminado.', notConfirmed: 'El motor no confirmó la eliminación del audio temporal.' },
    transcript: {
      title: 'Transcripción', empty: 'Todavía no hay texto.', partialFlag: 'provisional', partialPrefix: 'Texto provisional:', failed: 'No se pudo transcribir', failedLost: 'El audio de este fragmento se perdió.',
      cols: { select: 'Selección', time: 'Hora', speaker: 'Hablante', text: 'Texto', actions: 'Acciones' },
      row: { select: 'Seleccionar fragmento de las {time}', actions: 'Acciones del fragmento de las {time}', changeSpeaker: ', cambiar hablante' },
      flags: { corrected: 'Corregido', removed: 'Eliminado', stale: 'Cambió después de insertarlo', speaker: 'Hablante cambiado (motor: {speaker})', used: 'Usado en {targets}' },
      diff: { original: 'Original del motor:', changes: 'Cambios:', originalSpeaker: 'Hablante del motor: {speaker}', deleted: '(eliminado: {text})', inserted: '(añadido: {text})' },
      editor: { group: 'Editar fragmento de las {time}', field: 'Texto del fragmento de las {time}', hint: 'Intro guarda · Esc cancela · el original del motor no cambia', save: 'Guardar', cancel: 'Cancelar' },
      menu: { edit: 'Editar texto', showOriginal: 'Ver original', hideOriginal: 'Ocultar original', revert: 'Volver al original', remove: 'Eliminar', restore: 'Restaurar', copy: 'Copiar fragmento', newSpeaker: 'Nuevo hablante', insert: 'Insertar en {target}', engineSpeaker: 'Volver al del motor ({speaker})' },
      bar: { label: 'Acciones de la transcripción', selectAll: 'Seleccionar todo', countNone: 'Ninguno seleccionado', count: (n) => (n === 1 ? '1 seleccionado' : n + ' seleccionados'), assign: 'Asignar hablante', remove: 'Eliminar selección', restore: 'Restaurar selección', undo: 'Deshacer', redo: 'Rehacer', nothingUndo: 'Nada que deshacer', nothingRedo: 'Nada que rehacer', undoWhat: 'Deshacer: {what}', redoWhat: 'Rehacer: {what}', copy: 'Copiar', copyText: 'Copiar texto', copyFull: 'Copiar con hablantes y horas', changes: 'Mostrar cambios', speakers: 'Hablantes', more: 'Más' },
      history: { edit: 'corrección de las {time}', revert: 'vuelta al original de las {time}', remove: 'eliminación', restore: 'restauración', speaker: 'cambio de hablante', role: 'cambio de rol', merge: 'unión de hablantes', unmerge: 'separación de hablantes', addSpeaker: 'nuevo hablante' },
      keyboard: 'Teclado: flechas para moverte · Intro o F2 edita · Mayús+Espacio selecciona · Mayús+flechas amplía · Supr elimina o restaura · Ctrl+Z / Ctrl+Mayús+Z deshace y rehace · Ctrl+C copia la selección.',
      noDiarization: 'El motor no distingue hablantes. Marca fragmentos y usa «Asignar hablante», o cambia el hablante de cada fragmento.',
      newer: (n) => (n === 1 ? '1 fragmento nuevo · Ir al final' : n + ' fragmentos nuevos · Ir al final'),
      speakers: { title: 'Hablantes y roles', help: 'El motor solo distingue voces; los roles los pone quien revisa. Cambiar un rol o unir hablantes no modifica el transcript original.', noRole: 'Sin rol', mergeWith: 'Unir con', merge: 'Unir', unmerge: 'Separar', add: 'Añadir hablante', role: 'Rol: {speaker}', count: (n) => (n === 1 ? '1 fragmento' : n + ' fragmentos'), mergedInto: 'Unido a {speaker}' },
      insert: { title: 'Insertar en el formulario', what: 'Qué', textNone: 'Texto seleccionado (selecciona texto en la transcripción)', target: 'Campo', where: 'Dónde', end: 'Al final', cursor: 'En la posición del cursor', unknown: '(sin posición conocida)', withSpeakers: 'Con hablantes', preview: 'Vista previa', undo: 'Deshacer inserción', uses: (n) => 'Usos de esta transcripción (' + n + ')', nothing: 'No hay texto que insertar.', all: 'Todo ({count})', segments: 'Fragmentos marcados ({count})', text: 'Texto seleccionado «{text}»', selection: 'Sustituir la selección del campo «{text}»', go: 'Insertar en {target}', done: 'Insertado en {target}: {what}.', use: '{target} · {what}' },
      what: { segments: (n) => (n === 1 ? '1 fragmento' : n + ' fragmentos'), text: 'texto seleccionado' },
      announce: {
        edited: 'Fragmento de las {time} corregido. El original se conserva.', emptied: 'Texto vacío: el fragmento de las {time} queda eliminado. Puedes restaurarlo.',
        removed: (n) => (n === 1 ? 'Fragmento de las {time} eliminado. Puedes restaurarlo.' : n + ' fragmentos eliminados. Puedes restaurarlos.'), restored: (n) => (n === 1 ? 'Fragmento de las {time} restaurado.' : n + ' fragmentos restaurados.'),
        reverted: 'Fragmento de las {time}: vuelve al original del motor.', speaker: (n) => (n === 1 ? 'Fragmento de las {time}: {speaker}.' : n + ' fragmentos: {speaker}.'),
        role: '{speaker}: {role}.', merged: '{from} unido a {into}. El original del motor no cambia.', unmerged: '{from} separado otra vez.', added: '{speaker} añadido.',
        undone: 'Deshecho: {what}.', redone: 'Rehecho: {what}.', nothingUndo: 'Nada que deshacer.', nothingRedo: 'Nada que rehacer.',
        selected: (n) => (n === 1 ? '1 fragmento seleccionado.' : n + ' fragmentos seleccionados.'), selectedNone: 'Ningún fragmento seleccionado.',
        copied: 'Copiado: {what}.', copyFailed: 'No se pudo copiar al portapapeles.',
        inserted: 'Insertado en {target}: {what}. Puedes deshacerlo.', insertUndone: 'Inserción en {target} deshecha.', insertUndoFailed: 'No se puede deshacer: {target} cambió después de la inserción.',
        changesShown: 'Cambios visibles.', changesHidden: 'Cambios ocultos.'
      }
    },
    trigger: { dictate: 'Dictar en {target}', conversation: 'Grabar conversación', view: 'Ver grabación', busy: 'Hay una grabación en curso. Mayús+F8 para ir a ella.' },
    note: { partialPrefix: 'Texto provisional:', notInserted: (n) => (n === 1 ? '1 fragmento dictado sin insertar.' : n + ' fragmentos dictados sin insertar.'), insert: 'Insertar', inserted: 'Dictado insertado.', undo: 'Deshacer dictado' },
    announce: {
      requesting: 'Esperando el permiso del micrófono.', ready: 'Listo para grabar. El micrófono sigue apagado.', startDictation: 'Grabando. Dictado en {target}.', startConversation: 'Grabando conversación.',
      resumed: 'Grabando de nuevo.', paused: 'En pausa. El micrófono no está capturando.', processing: 'Micrófono apagado. Procesando el audio pendiente.',
      completedDictation: 'Dictado terminado. Texto añadido a {target}.', completedConversation: (n) => 'Transcripción lista: ' + n + (n === 1 ? ' fragmento.' : ' fragmentos.') + ' Abre el panel para revisarla.',
      reconnecting: 'Se perdió el servicio de transcripción. Reconectando. La grabación continúa.', reconnectingHeld: 'Se perdió el servicio de transcripción. Reconectando. La grabación está en pausa.',
      restored: 'Servicio de transcripción restablecido.', restoredHeld: 'Servicio restablecido. La grabación sigue en pausa: pulsa Reanudar.', inserted: 'Texto añadido a {target}.',
      undone: 'Inserción deshecha.', undoFailed: 'No se puede deshacer: el campo cambió después de insertar.', discarded: 'Grabación descartada. Transcripción y audio temporal eliminados.',
      discardedUnconfirmed: 'Grabación descartada. El motor no confirmó la eliminación del audio.', closed: 'Sesión de grabación cerrada.', signalFlat: 'No llega sonido del micrófono.',
      segmentFailed: 'No se pudo transcribir un fragmento. La grabación continúa.', busy: 'Ya hay una grabación en curso.', consentRequired: 'Marca la casilla de aviso a los participantes para empezar.'
    },
    errors: {
      'permission-denied': { title: 'Permiso del micrófono denegado', what: 'El navegador no permite usar el micrófono.', fix: 'Permite el micrófono en la configuración del sitio y pulsa Reintentar.' },
      'no-device': { title: 'Micrófono no disponible', what: 'No se encontró ningún micrófono.', fix: 'Conecta un micrófono y pulsa Reintentar.' },
      'device-busy': { title: 'Micrófono no disponible', what: 'El micrófono está en uso por otra aplicación o no responde.', fix: 'Ciérrala y pulsa Reintentar.' },
      'device-disconnected': { title: 'Micrófono desconectado', what: 'El micrófono se desconectó a los {at}.', fix: 'Conecta un micrófono y pulsa Reanudar, o finaliza.' },
      interrupted: { title: 'Grabación interrumpida', what: 'La captura se interrumpió a los {at}.', fix: 'Pulsa Reanudar para seguir, o finaliza.' },
      'service-unavailable': { title: 'Servicio de transcripción no disponible', what: 'El servicio de transcripción no responde.', fix: 'Comprueba que esté activo y pulsa Reintentar.' },
      'processing-failed': { title: 'Fragmento sin transcribir', what: 'No se pudo transcribir el fragmento {range}.', fix: '' },
      'storage-full': { title: 'Sin espacio para el audio temporal', what: 'No queda espacio; la captura se detuvo a los {at}.', fix: 'Libera espacio y pulsa Reanudar, o finaliza con lo transcrito.' },
      'remote-not-allowed': { title: 'Motor no permitido', what: 'El motor procesa el audio fuera de tu organización y la aplicación no lo permite.', fix: 'No se activó el micrófono.' },
      unsupported: { title: 'Micrófono no disponible', what: 'Este navegador o contexto no permite capturar audio.', fix: '' }
    },
    capture: { continues: 'La grabación continúa.', paused: 'La grabación está en pausa.', stopped: 'La grabación se detuvo.', none: 'No se grabó nada.' },
    audioFate: { processing: 'El audio ya capturado se sigue transcribiendo.', kept: 'El audio afectado se guarda temporalmente y se elimina al finalizar.', lost: 'El audio afectado se perdió.' },
    kept: 'Lo transcrito hasta ahora se conserva.'
  },
})
provide(speechKey, speech)
onBeforeUnmount(() => speech.discard())
</script>

<template>
  <div class="demo">
    <p class="nota">Prepara una conversación (el micrófono sigue apagado), empieza a grabar y abre el panel desde la pill: corrige, pausa, finaliza y revisa.</p>
    <div class="fila">
      <GSpeechTrigger mode="conversation" />
      <span>Estado: <strong>{{ speech.state.status }}</strong></span>
    </div>
    <p v-if="resultado" class="nota">{{ resultado }}</p>
    <GSpeechHost />
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-3); }
.fila { display: flex; flex-wrap: wrap; align-items: center; gap: var(--g-space-3); }
.fila > :first-child { margin: 0; }
.nota { margin: 0; }
</style>
