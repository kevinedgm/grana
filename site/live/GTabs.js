// Ficha interactiva de GTabs. Controles desde GTabs.meta.json.
import { h } from 'vue'

const cuenta = {
  es: [
    { id: 'general', label: 'General', icon: 'house', text: 'Nombre de la cuenta, zona horaria e idioma.' },
    { id: 'mensajes', label: 'Mensajes', icon: 'mail', count: 8, countLabel: '8 sin leer', text: 'Tienes 8 mensajes sin leer del equipo de soporte.' },
    { id: 'facturas', label: 'Facturas', icon: 'file-text', badge: 'Nuevo', text: 'Ya puedes descargar las facturas de octubre en PDF.' },
    { id: 'seguridad', label: 'Seguridad', icon: 'lock', status: 'attention', statusLabel: 'requiere atención', text: 'Activa la verificación en dos pasos.' },
    { id: 'integraciones', label: 'Integraciones', icon: 'zap', disabled: true }
  ],
  en: [
    { id: 'general', label: 'General', icon: 'house', text: 'Account name, time zone and language.' },
    { id: 'mensajes', label: 'Messages', icon: 'mail', count: 8, countLabel: '8 unread', text: 'You have 8 unread messages from support.' },
    { id: 'facturas', label: 'Invoices', icon: 'file-text', badge: 'New', text: 'October invoices are ready to download as PDF.' },
    { id: 'seguridad', label: 'Security', icon: 'lock', status: 'attention', statusLabel: 'needs attention', text: 'Turn on two-step verification.' },
    { id: 'integraciones', label: 'Integrations', icon: 'zap', disabled: true }
  ]
}

const periodos = {
  es: [{ id: 'dia', label: 'Día' }, { id: 'semana', label: 'Semana' }, { id: 'mes', label: 'Mes' }],
  en: [{ id: 'dia', label: 'Day' }, { id: 'semana', label: 'Week' }, { id: 'mes', label: 'Month' }]
}

const secciones = {
  es: ['Resumen', 'Pacientes', 'Citas', 'Recetas', 'Laboratorio', 'Facturación', 'Reportes', 'Archivo'].map((label) => ({ id: label.toLowerCase(), label, text: label + ': contenido de la sección.' })),
  en: ['Overview', 'Patients', 'Visits', 'Prescriptions', 'Laboratory', 'Billing', 'Reports', 'Archive'].map((label) => ({ id: label.toLowerCase(), label, text: label + ': section content.' }))
}

export default {
  // detached separa la cabecera de los paneles (receta de GDialog); id y labelledby se enseñan en el README.
  exclude: ['id', 'labelledby', 'detached'],
  model: { prop: 'modelValue', value: null, var: 'activa' },
  text: ['label'],
  block: true,
  base: {
    label: { es: 'Ajustes de la cuenta', en: 'Account settings' },
    items: cuenta,
    labels: {
      es: { more: 'Más pestañas', menu: 'Todas las pestañas', loading: '{label}: cargando', loaded: '{label}: listo' },
      en: { more: 'More tabs', menu: 'All tabs', loading: '{label}: loading', loaded: '{label}: ready' }
    }
  },
  slots: [
    {
      name: 'panel', scope: '{ item }', optional: true, on: true,
      code: '<p class="g-p-4 g-m-0">{{ item.text }}</p>',
      render: ({ item }) => h('p', { class: 'g-p-4 g-m-0' }, item.text)
    }
  ],
  cases: [
    {
      title: { es: 'Ajustes con señales por pestaña', en: 'Settings with a signal per tab' },
      why: {
        es: 'Contador, insignia y estado (cada uno con su texto accesible) avisan sin abrir la pestaña. Más de una señal por pestaña recarga la cabecera.',
        en: 'Count, badge and status (each with its accessible text) warn without opening the tab. More than one signal per tab overloads the header.'
      },
      props: {}
    },
    {
      title: { es: 'Selector de periodo, sin paneles', en: 'Period selector, no panels' },
      why: {
        es: 'segmented y sin slot panel: las pestañas son un control de vista y la página cambia fuera. Si cambian secciones de contenido, usa paneles.',
        en: 'segmented with no panel slot: the tabs are a view control and the page changes outside. If content sections change, use panels.'
      },
      props: { appearance: 'segmented', items: periodos, label: { es: 'Periodo del informe', en: 'Report period' } },
      slots: { panel: false }
    },
    {
      title: { es: 'Secciones de ajustes en vertical', en: 'Settings sections, vertical' },
      why: {
        es: 'orientation vertical y pill para una lista lateral de secciones, con flechas arriba y abajo. En un ancho justo, prefiere la horizontal con «Más».',
        en: 'vertical orientation and pill for a side list of sections, with up and down arrows. In tight widths, prefer horizontal with “More”.'
      },
      props: { orientation: 'vertical', appearance: 'pill' }
    },
    {
      title: { es: 'Muchas secciones en poco ancho', en: 'Many sections in little width' },
      why: {
        es: 'overflow more manda las que no caben a un menú «Más» y la activa siempre se ve. Con pocas pestañas el desplazamiento o nada bastan.',
        en: 'overflow more sends the ones that do not fit to a “More” menu and the active one always shows. With few tabs, scrolling or nothing is enough.'
      },
      props: { overflow: 'more', items: secciones, label: { es: 'Secciones', en: 'Sections' } }
    },
    {
      title: { es: 'Solo icono cuando el espacio aprieta', en: 'Icon only when space is tight' },
      why: {
        es: 'label-mode auto deja solo el icono si no caben los textos y los muestra como pista; exige que cada pestaña tenga icono.',
        en: 'label-mode auto drops to icon only if the texts do not fit and shows them as a hint; every tab needs an icon.'
      },
      props: { labelMode: 'auto', appearance: 'pill' }
    }
  ]
}
