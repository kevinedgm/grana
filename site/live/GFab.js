// Ficha interactiva de GFab (entrada propia @grana/vue/fab). Controles desde GFab.meta.json.
// El anfitrión pone el marco de la pantalla (anchor="container"): el FAB real se ancla dentro y no al visor de la página.
import { defineComponent, h } from 'vue'
import { GFab } from '@grana/vue/fab'

const Host = defineComponent({
  name: 'GranaLiveFab',
  inheritAttrs: false,
  setup(_, { attrs }) {
    const frame = {
      position: 'relative', blockSize: 'calc(var(--g-space-1) * 110)',
      border: 'var(--g-border-width) solid var(--g-color-border-strong)', borderRadius: 'var(--g-radius-md)'
    }
    return () => h('div', { style: frame }, h(GFab, { ...attrs, anchor: 'container' }))
  }
})

const todas = {
  es: [
    { id: 'sample', label: 'Nueva muestra', icon: 'pencil', description: 'Registro con código de barras' },
    { id: 'photo', label: 'Subir imagen', icon: 'image' },
    { id: 'note', label: 'Nueva nota', icon: 'file-text' },
    { id: 'upload', label: 'Subir archivo', icon: 'upload', description: 'PDF, imagen o CSV' },
    { id: 'agenda', label: 'Programar toma', icon: 'calendar' },
    { id: 'csv', label: 'Exportar CSV', icon: 'download', group: 'Exportar', description: 'Lo filtrado, en UTF-8' },
    { id: 'print', label: 'Imprimir etiquetas', icon: 'printer', group: 'Exportar' },
    { id: 'purge', label: 'Vaciar borradores', icon: 'trash', group: 'Mantenimiento', danger: true, confirm: '¿Vaciar los 12 borradores?', confirmLabel: 'Vaciar' }
  ],
  en: [
    { id: 'sample', label: 'New sample', icon: 'pencil', description: 'Entry with barcode' },
    { id: 'photo', label: 'Upload image', icon: 'image' },
    { id: 'note', label: 'New note', icon: 'file-text' },
    { id: 'upload', label: 'Upload file', icon: 'upload', description: 'PDF, image or CSV' },
    { id: 'agenda', label: 'Schedule collection', icon: 'calendar' },
    { id: 'csv', label: 'Export CSV', icon: 'download', group: 'Export', description: 'What is filtered, in UTF-8' },
    { id: 'print', label: 'Print labels', icon: 'printer', group: 'Export' },
    { id: 'purge', label: 'Empty drafts', icon: 'trash', group: 'Maintenance', danger: true, confirm: 'Empty the 12 drafts?', confirmLabel: 'Empty' }
  ]
}

const una = {
  es: [{ id: 'nota', label: 'Nueva nota', icon: 'file-text' }],
  en: [{ id: 'nota', label: 'New note', icon: 'file-text' }]
}

const comandos = {
  es: [
    { id: 'nuevo', label: 'Nuevo paciente', icon: 'user' },
    { id: 'cita', label: 'Agendar cita', icon: 'calendar' },
    { id: 'receta', label: 'Emitir receta', icon: 'file-text' },
    { id: 'csv', label: 'Exportar CSV', icon: 'download', group: 'Exportar' },
    { id: 'pdf', label: 'Exportar PDF', icon: 'download', group: 'Exportar' },
    { id: 'imprimir', label: 'Imprimir listado', icon: 'printer', group: 'Exportar' }
  ],
  en: [
    { id: 'nuevo', label: 'New patient', icon: 'user' },
    { id: 'cita', label: 'Book appointment', icon: 'calendar' },
    { id: 'receta', label: 'Issue prescription', icon: 'file-text' },
    { id: 'csv', label: 'Export CSV', icon: 'download', group: 'Export' },
    { id: 'pdf', label: 'Export PDF', icon: 'download', group: 'Export' },
    { id: 'imprimir', label: 'Print list', icon: 'printer', group: 'Export' }
  ]
}

export default {
  host: Host,
  // anchor lo fija el anfitrión (el marco); offset es un objeto de longitudes CSS; el modelo de apertura es interno.
  exclude: ['anchor', 'offset', 'id', 'labels', 'main', 'closeOnSelect'],
  imports: ["import { GFab } from '@grana/vue/fab'"],
  text: ['label'],
  block: true,
  base: {
    label: { es: 'Crear y capturar', en: 'Create and capture' },
    items: todas,
    labels: {
      es: {
        more: 'Más acciones ({count})', moreShort: 'Más acciones', cancel: 'Cancelar', findHint: 'Escribe para filtrar',
        matches: '{count} coincidencias', matchesOne: '1 coincidencia', none: 'Ninguna acción con', busy: 'En curso…', done: 'Hecho', failed: 'No se pudo'
      },
      en: {
        more: 'More actions ({count})', moreShort: 'More actions', cancel: 'Cancel', findHint: 'Type to filter',
        matches: '{count} matches', matchesOne: '1 match', none: 'No action with', busy: 'Working…', done: 'Done', failed: 'Failed'
      }
    }
  },
  cases: [
    {
      title: { es: 'Captura frecuente en una pantalla de trabajo', en: 'Frequent capture on a work screen' },
      why: {
        es: 'La pila: salen las acciones que caben, la más usada pegada al botón (el orden del arreglo es el de frecuencia). Si ninguna domina, no pongas main.',
        en: 'The stack: the actions that fit come out, the most used next to the button (array order is frequency order). If none dominates, skip main.'
      },
      props: {}
    },
    {
      title: { es: 'Una acción domina: «Nueva muestra»', en: 'One action dominates: “New sample”' },
      why: {
        es: 'main hace del botón esa acción con su nombre visible y una cola abre el resto, con filtro al escribir. Si la principal miente, el botón miente.',
        en: 'main turns the button into that action with its visible name and a tail opens the rest, filtering as you type. If the main action lies, the button lies.'
      },
      props: { main: 'sample' }
    },
    {
      title: { es: 'Un único atajo', en: 'A single shortcut' },
      why: {
        es: 'Con una sola acción el botón es esa acción: un toque la ejecuta, sin menú. Un menú de un elemento es un paso de sobra.',
        en: 'With a single action the button is that action: one tap runs it, no menu. A one-item menu is a wasted step.'
      },
      props: { items: una }
    },
    {
      title: { es: 'Panel con grupos y descripciones', en: 'Panel with groups and descriptions' },
      why: {
        es: 'appearance panel muestra siempre el panel agrupado y descrito: para comandos que se leen antes de elegir (exportar, mantenimiento); la pila no pinta descripciones.',
        en: 'appearance panel always shows the grouped, described panel: for commands you read before choosing (export, maintenance); the stack paints no descriptions.'
      },
      props: { appearance: 'panel', items: comandos }
    },
    {
      title: { es: 'Acción destructiva con confirmación en el sitio', en: 'Destructive action with in-place confirmation' },
      why: {
        es: 'danger con confirm pide la confirmación dentro del FAB (con cancel). Úsalo si la acción es reversible solo con esfuerzo; si ofreces «Deshacer», confirm: false.',
        en: 'danger with confirm asks for confirmation inside the FAB (with cancel). Use it when the action is hard to undo; if you offer “Undo”, confirm: false.'
      },
      props: { appearance: 'panel' }
    }
  ]
}
