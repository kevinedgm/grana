<script setup>
import { ref, shallowRef } from 'vue'
import { createTranscript, GTranscript } from '@grana/vue/speech'

// Lo que guardó la aplicación con toJSON(): literal del motor, correcciones, roles y un uso. Sin sesión ni micrófono.
const GUARDADO = {
  id: 'consulta-guardada', mode: 'conversation', createdAt: '2026-09-12T10:04:00.000Z', expectedSpeakers: 2,
  speakers: [{ id: 'spk_0', role: 'pro', mergedInto: null, origin: 'engine' }, { id: 'spk_1', role: 'pac', mergedInto: null, origin: 'engine' }],
  segments: [
    { id: 's1', t0: 0, t1: 3200, literal: 'Buenos días, ¿cómo ha seguido?', engineSpeaker: 'spk_0', corrected: null, speaker: null, removed: false, failed: false },
    { id: 's2', t0: 3600, t1: 8100, literal: 'Mejor, el dolor bajo bastante desde el martes.', engineSpeaker: 'spk_1', corrected: 'Mejor, el dolor bajó bastante desde el martes.', speaker: null, removed: false, failed: false },
    { id: 's3', t0: 8400, t1: 9900, literal: 'Eh, bueno.', engineSpeaker: 'spk_1', corrected: null, speaker: null, removed: true, failed: false },
    { id: 's4', t0: 10200, t1: 14800, literal: '¿Ha vuelto a tener molestias con la luz?', engineSpeaker: 'spk_1', corrected: null, speaker: 'spk_0', removed: false, failed: false },
    { id: 's5', t0: 15100, t1: 18300, literal: 'Solo una vez, el jueves por la noche.', engineSpeaker: 'spk_1', corrected: null, speaker: null, removed: false, failed: false },
    { id: 's6', t0: 18700, t1: 23900, literal: 'Bien. Mantenemos el plan y revisamos en dos semanas.', engineSpeaker: 'spk_0', corrected: null, speaker: null, removed: false, failed: false }
  ],
  derived: [{ id: 'd1', kind: 'insert', createdBy: 'user', at: '2026-09-12T10:20:00.000Z', target: { id: 'plan', label: 'Plan' }, position: 'end', sourceSegmentIds: ['s6'], text: 'Mantenemos el plan y revisamos en dos semanas.', sources: { s6: 'Bien. Mantenemos el plan y revisamos en dos semanas.' } }]
}
const transcript = shallowRef(createTranscript(GUARDADO))
const restablecer = () => { transcript.value = createTranscript(GUARDADO) }

// Destino: el modelo del formulario, no el DOM (funciona aunque el campo no esté montado)
const plan = ref('Ibuprofeno 400 mg cada 8 h si hay dolor.\nMantenemos el plan y revisamos en dos semanas.')
const destinos = [{ id: 'plan', label: 'Plan', get: () => plan.value, set: (v) => { plan.value = v }, field: 'demo-plan' }]
const roles = [{ id: 'pro', label: 'Profesional' }, { id: 'pac', label: 'Paciente' }]

// Sin gestor de voz, los textos van como prop (Grana no trae textos)
const labels = {
  speaker: 'Hablante {letter}', unassigned: 'Sin asignar', speakerRole: '{role} ({letter})',
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
  }
}
</script>

<template>
  <div class="demo">
    <div class="barra">
      <h3 id="demo-tx-title" class="titulo">Consulta del 12 de septiembre</h3>
      <g-btn size="sm" variant="ghost" color="neutral" @click="restablecer">Volver a la guardada</g-btn>
    </div>
    <GTranscript :transcript="transcript" labelledby="demo-tx-title" :labels="labels" :roles="roles" :targets="destinos" max-height="420px" />
    <g-textarea id="demo-plan" v-model="plan" name="plan" label="Plan" :rows="3"></g-textarea>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-4); }
.barra { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--g-space-2); }
.titulo { margin: 0; }
</style>
