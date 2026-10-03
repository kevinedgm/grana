// Textos de ejemplo de la Fase 2 para las pruebas (dueño: bruno). Solo lo importan los *.test.js: no se exporta ni se
// empaqueta. Redacción de kiwi (design/lab/speech/r02/index.html, objeto L) con los nombres de clave de speech.md §27.
export const F2_LABELS = {
  speakerRole: '{role} ({letter})',
  actions: {
    review: 'Revisar',
    reviewCompleted: 'Revisar transcripción',
    discardAskUsed: (n) => (n === 1 ? '¿Descartar la grabación? El texto insertado en 1 campo se queda.' : '¿Descartar la grabación? El texto insertado en {count} campos se queda.')
  },
  review: { title: 'Revisar transcripción', close: 'Cerrar revisión' },
  transcript: {
    cols: { select: 'Selección', time: 'Hora', speaker: 'Hablante', text: 'Texto', actions: 'Acciones' },
    row: { select: 'Seleccionar fragmento de las {time}', actions: 'Acciones del fragmento de las {time}', changeSpeaker: ', cambiar hablante' },
    flags: { corrected: 'Corregido', removed: 'Eliminado', stale: 'Cambió después de insertarlo', speaker: 'Hablante cambiado (motor: {speaker})', used: 'Usado en {targets}' },
    diff: { original: 'Original del motor:', changes: 'Cambios:', originalSpeaker: 'Hablante del motor: {speaker}', deleted: '(eliminado: {text})', inserted: '(añadido: {text})' },
    editor: { group: 'Editar fragmento de las {time}', field: 'Texto del fragmento de las {time}', hint: 'Intro guarda · Esc cancela · el original del motor no cambia', save: 'Guardar', cancel: 'Cancelar' },
    menu: { edit: 'Editar texto', showOriginal: 'Ver original', hideOriginal: 'Ocultar original', revert: 'Volver al original', remove: 'Eliminar', restore: 'Restaurar', copy: 'Copiar fragmento', newSpeaker: 'Nuevo hablante', insert: 'Insertar en {target}', engineSpeaker: 'Volver al del motor ({speaker})' },
    bar: {
      label: 'Acciones de la transcripción', selectAll: 'Seleccionar todo', countNone: 'Ninguno seleccionado', count: (n) => (n === 1 ? '1 seleccionado' : '{count} seleccionados'),
      assign: 'Asignar hablante', remove: 'Eliminar selección', restore: 'Restaurar selección', undo: 'Deshacer', redo: 'Rehacer',
      nothingUndo: 'Nada que deshacer', nothingRedo: 'Nada que rehacer', undoWhat: 'Deshacer: {what}', redoWhat: 'Rehacer: {what}',
      copy: 'Copiar', copyText: 'Copiar texto', copyFull: 'Copiar con hablantes y horas', changes: 'Mostrar cambios', speakers: 'Hablantes', more: 'Más'
    },
    history: { edit: 'corrección de las {time}', revert: 'vuelta al original de las {time}', remove: 'eliminación', restore: 'restauración', speaker: 'cambio de hablante', role: 'cambio de rol', merge: 'unión de hablantes', unmerge: 'separación de hablantes', addSpeaker: 'nuevo hablante' },
    keyboard: 'Teclado: flechas para moverte · Intro o F2 edita · Mayús+Espacio selecciona · Supr elimina o restaura · Ctrl+Z deshace · Ctrl+C copia.',
    noDiarization: 'El motor no distingue hablantes. Marca fragmentos y usa «Asignar hablante».',
    newer: (n) => (n === 1 ? '1 fragmento nuevo · Ir al final' : '{count} fragmentos nuevos · Ir al final'),
    speakers: {
      title: 'Hablantes y roles', help: 'El motor solo distingue voces; los roles los pone quien revisa.', noRole: 'Sin rol', mergeWith: 'Unir con', merge: 'Unir',
      unmerge: 'Separar', add: 'Añadir hablante', role: 'Rol: {speaker}', count: (n) => (n === 1 ? '1 fragmento' : '{count} fragmentos'), mergedInto: 'Unido a {speaker}'
    },
    insert: {
      title: 'Insertar en el formulario', what: 'Qué', textNone: 'Texto seleccionado (selecciona texto en la transcripción)', target: 'Campo', where: 'Dónde',
      end: 'Al final', cursor: 'En la posición del cursor', unknown: '(sin posición conocida)', withSpeakers: 'Con hablantes', preview: 'Vista previa',
      undo: 'Deshacer inserción', uses: 'Usos de esta transcripción', nothing: 'No hay texto que insertar.',
      all: 'Todo ({count})', segments: 'Fragmentos marcados ({count})', text: 'Texto seleccionado «{text}»', selection: 'Sustituir la selección del campo «{text}»',
      go: 'Insertar en {target}', done: 'Insertado en {target}: {what}.', use: '{target} · {what} · {time}'
    },
    what: { segments: (n) => (n === 1 ? '1 fragmento' : '{count} fragmentos'), text: 'texto seleccionado' },
    announce: {
      edited: 'Fragmento de las {time} corregido. El original se conserva.',
      emptied: 'Texto vacío: el fragmento de las {time} queda eliminado. Puedes restaurarlo.',
      removed: (n) => (n === 1 ? 'Fragmento de las {time} eliminado. Puedes restaurarlo.' : '{count} fragmentos eliminados. Puedes restaurarlos.'),
      restored: (n) => (n === 1 ? 'Fragmento de las {time} restaurado.' : '{count} fragmentos restaurados.'),
      reverted: 'Fragmento de las {time}: vuelve al original del motor.',
      speaker: (n) => (n === 1 ? 'Fragmento de las {time}: {speaker}.' : '{count} fragmentos: {speaker}.'),
      role: '{speaker}: {role}.', merged: '{from} unido a {into}.', unmerged: '{from} separado otra vez.', added: '{speaker} añadido.',
      undone: 'Deshecho: {what}.', redone: 'Rehecho: {what}.', nothingUndo: 'Nada que deshacer.', nothingRedo: 'Nada que rehacer.',
      selected: (n) => (n === 1 ? '1 fragmento seleccionado.' : '{count} fragmentos seleccionados.'), selectedNone: 'Ningún fragmento seleccionado.',
      copied: 'Copiado: {what}.', copyFailed: 'No se pudo copiar al portapapeles.',
      inserted: 'Insertado en {target}: {what}. Puedes deshacerlo.', insertUndone: 'Inserción en {target} deshecha.', insertUndoFailed: 'No se puede deshacer: {target} cambió después de la inserción.',
      changesShown: 'Cambios visibles.', changesHidden: 'Cambios ocultos.'
    }
  }
}
