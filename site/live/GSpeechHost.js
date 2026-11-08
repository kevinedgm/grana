// Ficha interactiva de GSpeechHost. La voz es un servicio (entrada propia @grana/vue/speech): no está registrado
// globalmente, así que la ficha monta un anfitrión con un gestor REAL de createSpeech y el motor simulado de
// @grana/vue/testing (sin micrófono, sin red). Las fichas de GSpeechPill, GSpeechTrigger y GTranscript reutilizan
// `labelsFor`, `useT` y `useDemoSpeech` de este archivo. Los textos de la voz van en español e inglés (según el idioma de la página).
import { useData } from 'vitepress'
import { defineComponent, getCurrentInstance, h, onBeforeUnmount, provide, ref } from 'vue'
import { GTextarea } from '@grana/vue'
import { createSpeech, GSpeechHost, GSpeechTrigger, speechKey } from '@grana/vue/speech'
import { createSimulatedSpeechAdapter } from '@grana/vue/testing'

// Todos los textos que el gestor y el panel necesitan (Grana no trae textos por defecto).
export const speechLabelsEs = {
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
}

// The same labels in English (the site picks one by page language).
export const speechLabelsEn = {
  region: 'Voice recording', openPanel: 'open panel', closePanel: 'Close panel', duration: 'Duration:',
  actions: { start: 'Start recording', cancel: 'Cancel', pause: 'Pause', resume: 'Resume', retry: 'Retry', finish: 'Finish', discard: 'Discard', discardAsk: 'Discard the recording? The transcript and temporary audio are deleted. This cannot be undone.', discardConfirm: 'Yes, discard', closeSession: 'Close session', dismiss: 'Close', retrySegment: 'Retry segment', hideActivity: 'Hide activity',
    review: 'Review', reviewCompleted: 'Review transcript', discardAskUsed: (n) => `Discard the recording? The text already inserted in ${n === 1 ? '1 field' : n + ' fields'} stays in the form.` },
  speakerRole: '{role} ({letter})',
  review: { title: 'Review transcript', close: 'Close review' },
  states: {
    requesting: { short: 'Asking permission', long: 'Waiting for microphone permission', longGranted: 'Turning the microphone on' },
    ready: { short: 'Ready', long: 'Ready to record. The microphone is still off' },
    listening: { short: 'Recording', long: 'Recording' },
    speech: { short: 'Voice detected', long: 'Recording · voice detected' },
    transcribing: { short: 'Transcribing', long: 'Recording · transcribing' },
    paused: { short: 'Paused', long: 'Paused. The microphone is not capturing' },
    processing: { short: 'Processing', long: 'Microphone off. Processing the pending audio' },
    reconnecting: { short: 'Reconnecting', shortLive: 'Reconnecting · recording', long: 'Reconnecting to the service. Recording is paused', longLive: 'Reconnecting to the service. Recording continues' },
    denied: { short: 'Permission denied', long: 'Microphone permission denied' },
    unavailable: { short: 'No microphone', long: 'Microphone unavailable' },
    error: { short: 'Error', long: 'Recording error' },
    completed: { short: 'Done', long: 'Transcript ready' }
  },
  mode: { dictation: 'Dictation into “{target}”', conversation: 'Conversation · {speakers}' },
  expectedSpeakers: { label: 'Expected participants', options: { 1: '1 participant', 2: '2 participants', many: 'Several participants' } },
  noDiarization: 'The engine does not tell speakers apart: the transcript will have no labels.',
  consent: { label: 'I have told the participants they are being recorded', required: 'Tick the box to start recording.' },
  speaker: 'Speaker {letter}', unassigned: 'Unassigned', attempt: 'Attempt {attempt}', signalFlat: 'No sound reaches the microphone. Check that it is not muted.',
  pending: (n) => (n === 1 ? '1 segment pending' : n + ' segments pending'), pendingNone: 'All transcribed', progress: 'Processing the pending audio',
  privacy: { device: 'Processed on this device.', local: 'Processed by your organization’s local service.', remote: 'Processed by an external service.' },
  audio: { none: 'Audio is not saved.', memory: 'Temporary audio in memory; deleted on finish.', disk: 'Temporary encrypted audio on this computer; deleted on finish.', deleted: 'Temporary audio deleted.', notConfirmed: 'The engine did not confirm deleting the temporary audio.' },
  transcript: {
    title: 'Transcript', empty: 'No text yet.', partialFlag: 'provisional', partialPrefix: 'Provisional text:', failed: 'Could not transcribe', failedLost: 'The audio of this segment was lost.',
    cols: { select: 'Selection', time: 'Time', speaker: 'Speaker', text: 'Text', actions: 'Actions' },
    row: { select: 'Select segment from {time}', actions: 'Actions for the segment from {time}', changeSpeaker: ', change speaker' },
    flags: { corrected: 'Corrected', removed: 'Removed', stale: 'Changed after inserting', speaker: 'Speaker changed (engine: {speaker})', used: 'Used in {targets}' },
    diff: { original: 'Engine original:', changes: 'Changes:', originalSpeaker: 'Engine speaker: {speaker}', deleted: '(removed: {text})', inserted: '(added: {text})' },
    editor: { group: 'Edit segment from {time}', field: 'Text of the segment from {time}', hint: 'Enter saves · Esc cancels · the engine original does not change', save: 'Save', cancel: 'Cancel' },
    menu: { edit: 'Edit text', showOriginal: 'Show original', hideOriginal: 'Hide original', revert: 'Back to original', remove: 'Remove', restore: 'Restore', copy: 'Copy segment', newSpeaker: 'New speaker', insert: 'Insert into {target}', engineSpeaker: 'Back to the engine’s ({speaker})' },
    bar: { label: 'Transcript actions', selectAll: 'Select all', countNone: 'None selected', count: (n) => (n === 1 ? '1 selected' : n + ' selected'), assign: 'Assign speaker', remove: 'Remove selection', restore: 'Restore selection', undo: 'Undo', redo: 'Redo', nothingUndo: 'Nothing to undo', nothingRedo: 'Nothing to redo', undoWhat: 'Undo: {what}', redoWhat: 'Redo: {what}', copy: 'Copy', copyText: 'Copy text', copyFull: 'Copy with speakers and times', changes: 'Show changes', speakers: 'Speakers', more: 'More' },
    history: { edit: 'correction from {time}', revert: 'back to original from {time}', remove: 'removal', restore: 'restoration', speaker: 'speaker change', role: 'role change', merge: 'speaker merge', unmerge: 'speaker split', addSpeaker: 'new speaker' },
    keyboard: 'Keyboard: arrows to move · Enter or F2 edits · Shift+Space selects · Shift+arrows extends · Delete removes or restores · Ctrl+Z / Ctrl+Shift+Z undoes and redoes · Ctrl+C copies the selection.',
    noDiarization: 'The engine does not tell speakers apart. Mark segments and use “Assign speaker”, or change the speaker of each segment.',
    newer: (n) => (n === 1 ? '1 new segment · Go to end' : n + ' new segments · Go to end'),
    speakers: { title: 'Speakers and roles', help: 'The engine only tells voices apart; roles are set by the reviewer. Changing a role or merging speakers does not change the original transcript.', noRole: 'No role', mergeWith: 'Merge with', merge: 'Merge', unmerge: 'Split', add: 'Add speaker', role: 'Role: {speaker}', count: (n) => (n === 1 ? '1 segment' : n + ' segments'), mergedInto: 'Merged into {speaker}' },
    insert: { title: 'Insert into the form', what: 'What', textNone: 'Selected text (select text in the transcript)', target: 'Field', where: 'Where', end: 'At the end', cursor: 'At the cursor position', unknown: '(position unknown)', withSpeakers: 'With speakers', preview: 'Preview', undo: 'Undo insertion', uses: (n) => 'Uses of this transcript (' + n + ')', nothing: 'There is no text to insert.', all: 'Everything ({count})', segments: 'Marked segments ({count})', text: 'Selected text “{text}”', selection: 'Replace the field’s selection “{text}”', go: 'Insert into {target}', done: 'Inserted into {target}: {what}.', use: '{target} · {what}' },
    what: { segments: (n) => (n === 1 ? '1 segment' : n + ' segments'), text: 'selected text' },
    announce: {
      edited: 'Segment from {time} corrected. The original is kept.', emptied: 'Empty text: the segment from {time} is removed. You can restore it.',
      removed: (n) => (n === 1 ? 'Segment from {time} removed. You can restore it.' : n + ' segments removed. You can restore them.'), restored: (n) => (n === 1 ? 'Segment from {time} restored.' : n + ' segments restored.'),
      reverted: 'Segment from {time}: back to the engine original.', speaker: (n) => (n === 1 ? 'Segment from {time}: {speaker}.' : n + ' segments: {speaker}.'),
      role: '{speaker}: {role}.', merged: '{from} merged into {into}. The engine original does not change.', unmerged: '{from} split again.', added: '{speaker} added.',
      undone: 'Undone: {what}.', redone: 'Redone: {what}.', nothingUndo: 'Nothing to undo.', nothingRedo: 'Nothing to redo.',
      selected: (n) => (n === 1 ? '1 segment selected.' : n + ' segments selected.'), selectedNone: 'No segment selected.',
      copied: 'Copied: {what}.', copyFailed: 'Could not copy to the clipboard.',
      inserted: 'Inserted into {target}: {what}. You can undo it.', insertUndone: 'Insertion into {target} undone.', insertUndoFailed: 'Cannot undo: {target} changed after the insertion.',
      changesShown: 'Changes visible.', changesHidden: 'Changes hidden.'
    }
  },
  trigger: { dictate: 'Dictate into {target}', conversation: 'Record conversation', view: 'View recording', busy: 'A recording is in progress. Shift+F8 to go to it.' },
  note: { partialPrefix: 'Provisional text:', notInserted: (n) => (n === 1 ? '1 dictated segment not inserted.' : n + ' dictated segments not inserted.'), insert: 'Insert', inserted: 'Dictation inserted.', undo: 'Undo dictation' },
  announce: {
    requesting: 'Waiting for microphone permission.', ready: 'Ready to record. The microphone is still off.', startDictation: 'Recording. Dictation into {target}.', startConversation: 'Recording conversation.',
    resumed: 'Recording again.', paused: 'Paused. The microphone is not capturing.', processing: 'Microphone off. Processing the pending audio.',
    completedDictation: 'Dictation finished. Text added to {target}.', completedConversation: (n) => 'Transcript ready: ' + n + (n === 1 ? ' segment.' : ' segments.') + ' Open the panel to review it.',
    reconnecting: 'The transcription service was lost. Reconnecting. Recording continues.', reconnectingHeld: 'The transcription service was lost. Reconnecting. Recording is paused.',
    restored: 'Transcription service restored.', restoredHeld: 'Service restored. Recording is still paused: press Resume.', inserted: 'Text added to {target}.',
    undone: 'Insertion undone.', undoFailed: 'Cannot undo: the field changed after inserting.', discarded: 'Recording discarded. Transcript and temporary audio deleted.',
    discardedUnconfirmed: 'Recording discarded. The engine did not confirm deleting the audio.', closed: 'Recording session closed.', signalFlat: 'No sound reaches the microphone.',
    segmentFailed: 'Could not transcribe a segment. Recording continues.', busy: 'A recording is already in progress.', consentRequired: 'Tick the participant notice box to start.'
  },
  errors: {
    'permission-denied': { title: 'Microphone permission denied', what: 'The browser does not allow using the microphone.', fix: 'Allow the microphone in the site settings and press Retry.' },
    'no-device': { title: 'Microphone unavailable', what: 'No microphone was found.', fix: 'Connect a microphone and press Retry.' },
    'device-busy': { title: 'Microphone unavailable', what: 'The microphone is in use by another application or not responding.', fix: 'Close it and press Retry.' },
    'device-disconnected': { title: 'Microphone disconnected', what: 'The microphone disconnected at {at}.', fix: 'Connect a microphone and press Resume, or finish.' },
    interrupted: { title: 'Recording interrupted', what: 'Capture was interrupted at {at}.', fix: 'Press Resume to continue, or finish.' },
    'service-unavailable': { title: 'Transcription service unavailable', what: 'The transcription service is not responding.', fix: 'Check that it is running and press Retry.' },
    'processing-failed': { title: 'Segment not transcribed', what: 'Could not transcribe segment {range}.', fix: '' },
    'storage-full': { title: 'No room for temporary audio', what: 'There is no space left; capture stopped at {at}.', fix: 'Free up space and press Resume, or finish with what is transcribed.' },
    'remote-not-allowed': { title: 'Engine not allowed', what: 'The engine processes audio outside your organization and the application does not allow it.', fix: 'The microphone was not turned on.' },
    unsupported: { title: 'Microphone unavailable', what: 'This browser or context cannot capture audio.', fix: '' }
  },
  capture: { continues: 'Recording continues.', paused: 'Recording is paused.', stopped: 'Recording stopped.', none: 'Nothing was recorded.' },
  audioFate: { processing: 'The audio already captured is still being transcribed.', kept: 'The affected audio is kept temporarily and deleted on finish.', lost: 'The affected audio was lost.' },
  kept: 'What has been transcribed so far is kept.'
}

// Idioma de la página (el de VitePress); fuera del sitio, español
export const useLang = () => { try { return useData().lang } catch { return ref('es') } }
export const labelsFor = (lang) => (lang === 'en' ? speechLabelsEn : speechLabelsEs)

export const rolesFor = (lang) => (lang === 'en' ? [{ id: 'pro', label: 'Professional' }, { id: 'pac', label: 'Patient' }] : [{ id: 'pro', label: 'Profesional' }, { id: 'pac', label: 'Paciente' }])
export const roles = rolesFor('es')
const dictadoEn = ['Reports lower back pain for three days.', 'No fever or weight loss.', 'Improves when walking.']
const conversacionEn = [
  { speaker: 'A', text: 'Good morning, what brings you in today?' },
  { speaker: 'B', text: 'My back has hurt for three days, mostly in the morning.' },
  { speaker: 'A', text: 'Does the pain spread down either leg?' },
  { speaker: 'B', text: 'No, it stays low down, and it gets worse when I sit.' }
]
const dictadoEs = ['Refiere dolor lumbar de tres días de evolución.', 'Sin fiebre ni pérdida de peso.', 'Mejora al caminar.']
const conversacionEs = [
  { speaker: 'A', text: 'Buenos días, ¿qué le trae hoy por aquí?' },
  { speaker: 'B', text: 'Desde hace tres días me duele la espalda, sobre todo por la mañana.' },
  { speaker: 'A', text: '¿El dolor se irradia hacia alguna pierna?' },
  { speaker: 'B', text: 'No, se queda en la zona baja, y empeora cuando estoy sentado.' }
]

// El gestor de la ficha: motor simulado y sin micrófono (input 'self'). En tu aplicación, el adaptador de tu motor.
export const useT = () => { const lang = useLang(); return (es, en) => (lang.value === 'en' ? en : es) }

export function useDemoSpeech(extra = {}) {
  const lang = useLang().value
  const en = lang === 'en'
  const speech = createSpeech({
    adapter: createSimulatedSpeechAdapter({ latency: 900, input: { format: 'self' }, script: { dictation: en ? dictadoEn : dictadoEs, conversation: en ? conversacionEn : conversacionEs } }),
    language: en ? 'en' : 'es',
    offset: { top: 'var(--vp-nav-height)' }, // la pill flotante, bajo la cabecera fija del sitio
    roles: rolesFor(lang),
    labels: labelsFor(lang),
    ...extra
  })
  provide(speechKey, speech)
  onBeforeUnmount(() => speech.discard())
  return speech
}

export const idUnico = (pref) => pref + '-' + getCurrentInstance().uid
export const columna = 'display:grid;gap:var(--g-space-3)'
export const fila = 'display:flex;flex-wrap:wrap;align-items:center;gap:var(--g-space-3)'
export const nota = (texto) => h('p', { style: 'margin:0' }, texto)

const ficha = defineComponent({
  name: 'GranaLiveSpeechHost',
  inheritAttrs: false,
  props: { scenario: { type: String, default: 'conversation' } },
  setup(props) {
    const campo = idUnico('gl-voz-obs')
    const texto = ref('')
    const resultado = ref('')
    const t = useT()
    const speech = useDemoSpeech({ onComplete: (tr) => { resultado.value = 'onComplete: ' + tr.segments.length + t(' fragmentos entregados a la aplicación.', ' segments handed to the application.') } })
    return () => h('div', { style: columna }, [
      props.scenario === 'dictation'
        ? h('div', [
          h(GTextarea, { id: campo, name: 'obs', label: t('Observaciones', 'Notes'), rows: 3, modelValue: texto.value, 'onUpdate:modelValue': (v) => { texto.value = v } }),
          h(GSpeechTrigger, { for: campo })
        ])
        : h('div', { style: fila }, [h(GSpeechTrigger, { mode: 'conversation' }), h('span', [t('Estado: ', 'Status: '), h('strong', speech.state.status)])]),
      nota(props.scenario === 'dictation' ? t('Pulsa el micrófono: la pill flotante muestra el estado; el texto confirmado entra en el campo.', 'Press the microphone: the floating pill shows the status; confirmed text goes into the field.') : t('Prepara la conversación (el micrófono sigue apagado), empieza a grabar y abre el panel desde la pill.', 'Prepare the conversation (the microphone stays off), start recording and open the panel from the pill.')),
      resultado.value ? nota(resultado.value) : null,
      h(GSpeechHost)
    ])
  }
})

const SETUP = `<!-- main.js: app.use(Grana).use(speech), con speech = createSpeech({ adapter: miMotor, language: 'es', labels: textos })
     «adapter» es el de tu motor (Whisper local, etc.) y registra <g-speech-host>, <g-speech-pill> y <g-speech-trigger> -->`

export default {
  host: ficha,
  controls: [],
  exclude: ['speech'],
  block: true,
  hidden: ['scenario'], // lo usa solo el anfitrión de la ficha, no es una prop del componente
  codeFor: (state) => state.scenario === 'dictation'
    ? `${SETUP}
<g-textarea id="obs" v-model="form.obs" label="Observaciones" />
<g-speech-trigger for="obs" />
<g-speech-host />`
    : `${SETUP}
<g-speech-trigger mode="conversation" />
<g-speech-host />`,
  cases: [
    {
      title: { es: 'Conversación con revisión', en: 'Conversation with review' },
      why: { es: 'Un solo anfitrión, lo más alto posible: la sesión de conversación abre el panel con hablantes, pausa, finalizar y «Revisar». Úsalo cuando necesitas una transcripción que alguien corrija.', en: 'A single host, as high as possible: the conversation session opens the panel with speakers, pause, finish and “Review”. Use it when you need a transcript someone will correct.' },
      props: { scenario: 'conversation' }
    },
    {
      title: { es: 'Dictado a un campo del formulario', en: 'Dictation into a form field' },
      why: { es: 'Con un disparador de dictado el texto confirmado entra en el cursor sin mover el foco; el anfitrión solo pinta la pill flotante y el panel. Si no necesitas grabar, no montes el anfitrión.', en: 'With a dictation trigger the confirmed text goes in at the cursor without moving focus; the host only paints the floating pill and the panel. If you do not need recording, do not mount the host.' },
      props: { scenario: 'dictation' }
    }
  ]
}
