// Ficha interactiva de GMenu. Controles desde GMenu.meta.json.
import { h } from 'vue'
import { GBtn, GIcon } from '@grana/vue'

const en = () => typeof document !== 'undefined' && document.documentElement.lang.startsWith('en')

const acciones = {
  es: [
    { id: 'editar', label: 'Renombrar', icon: 'pencil', shortcut: 'F2', keyshortcuts: 'F2' },
    { id: 'duplicar', label: 'Duplicar', icon: 'copy' },
    { id: 'mover', label: 'Mover a…', icon: 'folder', disabled: true },
    { label: 'Exportar como', icon: 'download', items: [{ id: 'pdf', label: 'PDF' }, { id: 'csv', label: 'Hoja de cálculo' }] },
    { type: 'separator' },
    { id: 'eliminar', label: 'Eliminar', icon: 'trash', danger: true }
  ],
  en: [
    { id: 'editar', label: 'Rename', icon: 'pencil', shortcut: 'F2', keyshortcuts: 'F2' },
    { id: 'duplicar', label: 'Duplicate', icon: 'copy' },
    { id: 'mover', label: 'Move to…', icon: 'folder', disabled: true },
    { label: 'Export as', icon: 'download', items: [{ id: 'pdf', label: 'PDF' }, { id: 'csv', label: 'Spreadsheet' }] },
    { type: 'separator' },
    { id: 'eliminar', label: 'Delete', icon: 'trash', danger: true }
  ]
}

const vista = {
  es: [
    { type: 'group', label: 'Mostrar', items: [
      { type: 'checkbox', id: 'notas', label: 'Notas al margen', checked: true },
      { type: 'checkbox', id: 'reglas', label: 'Reglas' }
    ] },
    { type: 'separator' },
    { type: 'group', label: 'Ordenar', items: [
      { type: 'radio', id: 'nombre', label: 'Por nombre', checked: true },
      { type: 'radio', id: 'fecha', label: 'Por fecha' }
    ] }
  ],
  en: [
    { type: 'group', label: 'Show', items: [
      { type: 'checkbox', id: 'notas', label: 'Margin notes', checked: true },
      { type: 'checkbox', id: 'reglas', label: 'Rulers' }
    ] },
    { type: 'separator' },
    { type: 'group', label: 'Sort', items: [
      { type: 'radio', id: 'nombre', label: 'By name', checked: true },
      { type: 'radio', id: 'fecha', label: 'By date' }
    ] }
  ]
}

const enlaces = {
  es: [
    { id: 'perfil', label: 'Mi perfil', href: '#perfil', current: true },
    { id: 'ayuda', label: 'Centro de ayuda', href: '#ayuda' },
    { id: 'docs', label: 'Documentación', href: 'https://example.org/docs', target: '_blank', external: true }
  ],
  en: [
    { id: 'perfil', label: 'My profile', href: '#perfil', current: true },
    { id: 'ayuda', label: 'Help center', href: '#ayuda' },
    { id: 'docs', label: 'Documentation', href: 'https://example.org/docs', target: '_blank', external: true }
  ]
}

export default {
  exclude: ['id', 'labels'],
  model: { prop: 'modelValue', value: false, var: 'abierto' },
  text: ['label'],
  base: {
    label: { es: 'Acciones del documento', en: 'Document actions' },
    items: acciones,
    labels: {
      es: {
        external: ', otro sitio', newTab: ', abre en una pestaña nueva', destExternal: 'Otro sitio', destNewTab: 'Pestaña nueva',
        opened: 'Abierta', openedLive: 'Abierto en segundo plano', copied: 'Enlace copiado', copiedLive: 'Enlace copiado al portapapeles'
      },
      en: {
        external: ', external site', newTab: ', opens in a new tab', destExternal: 'External site', destNewTab: 'New tab',
        opened: 'Opened', openedLive: 'Opened in the background', copied: 'Link copied', copiedLive: 'Link copied to the clipboard'
      }
    }
  },
  slots: [
    {
      name: 'trigger', scope: '{ attrs }',
      code: { es: '<g-btn v-bind="attrs" variant="outline">Acciones</g-btn>', en: '<g-btn v-bind="attrs" variant="outline">Actions</g-btn>' },
      render: ({ attrs }) => h(GBtn, { ...attrs, variant: 'outline' }, { default: () => (en() ? 'Actions' : 'Acciones'), append: () => h(GIcon, { name: 'chevron-down' }) })
    }
  ],
  cases: [
    {
      title: { es: 'Acciones de una fila o un documento', en: 'Actions of a row or document' },
      why: {
        es: 'Acciones con icono, un submenú y la destructiva al final tras un separador. Si hay una acción dominante, ponla como botón y deja el resto aquí.',
        en: 'Actions with icons, a submenu and the destructive one last after a separator. If one action dominates, make it a button and keep the rest here.'
      },
      props: { items: acciones }
    },
    {
      title: { es: 'Ajustes de vista con casillas y opciones', en: 'View settings with checkboxes and options' },
      why: {
        es: 'Casillas y radios no cierran el menú: se cambian varias seguidas. Guardar el estado es de la aplicación; el menú solo emite la intención.',
        en: 'Checkboxes and radios do not close the menu: several can be changed in a row. Keeping the state is the app’s job; the menu only emits the intent.'
      },
      props: { items: vista, label: { es: 'Vista del documento', en: 'Document view' } }
    },
    {
      title: { es: 'Menú de cuenta con enlaces', en: 'Account menu with links' },
      why: {
        es: 'Con href cada elemento es un <a> que emite navigate (no select) y un enlace externo lleva su icono y pie de destino. Para acciones sin página, usa elementos normales.',
        en: 'With href each item is an <a> that emits navigate (not select) and an external link carries its icon and destination footer. For actions without a page, use regular items.'
      },
      props: { items: enlaces, label: { es: 'Cuenta', en: 'Account' } }
    },
    {
      title: { es: 'Menú junto al borde inferior', en: 'Menu near the bottom edge' },
      why: {
        es: 'side="top" y align="end" para un disparador al pie o a la derecha de la pantalla; con auto el menú ya se voltea solo si no cabe.',
        en: 'side="top" and align="end" for a trigger at the bottom or right of the screen; with auto the menu already flips if it does not fit.'
      },
      props: { side: 'top', align: 'end', density: 'compact' }
    }
  ]
}
