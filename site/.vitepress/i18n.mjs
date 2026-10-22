// Textos de la interfaz del sitio (no de los componentes): navegación, títulos de página,
// avisos y cabeceras de las tablas generadas. El contenido viene de los README (español como
// fuente; README.en.md cuando existe). Una clave sin traducción cae al español.

export const LOCALES = {
  es: { prefix: '', lang: 'es', label: 'Español' },
  en: { prefix: 'en/', lang: 'en', label: 'English' }
}

export const UI = {
  es: {
    siteTitle: 'Grana',
    description: 'Componentes Vue 3 con tema por tokens: la librería trae la estructura y tu tema pone el color.',
    hero: {
      text: 'Componentes Vue 3 con tema por tokens',
      tagline: 'The only bug you’ll want in your UI. La librería trae la estructura; tu tema pone el color.',
      start: 'Empezar',
      components: 'Ver componentes'
    },
    pages: {
      'getting-started': 'Empezar',
      theming: 'Tematización',
      cli: '@grana/cli',
      accessibility: 'Accesibilidad',
      personality: 'Personalidad',
      'components/': 'Componentes',
      project: 'Proyecto',
      changelog: 'Cambios',
      playground: 'Playground de tema'
    },
    tools: {
      playground: 'Elige color, forma, espaciado y tipografía y mira en vivo cómo cambian los componentes de Grana. El tema se deriva con el motor de @grana/cli y se exporta como configuración o como tokens.'
    },
    nav: { guide: 'Guía', components: 'Componentes', playground: 'Playground', changelog: 'Cambios', github: 'GitHub' },
    groups: { guide: 'Guía', other: 'Otros' },
    categories: {},
    component: {
      tag: 'Etiqueta',
      status: 'Estado',
      entry: 'Entrada',
      since: 'Desde',
      import: 'Importación',
      example: 'Ejemplo',
      live: 'Ejemplo vivo',
      api: 'Referencia de la API',
      apiNote: 'Generada desde',
      props: 'Props',
      events: 'Eventos',
      slots: 'Slots',
      methods: 'Métodos y expuesto',
      prop: 'Prop',
      type: 'Tipo',
      values: 'Valores',
      default: 'Por defecto',
      notes: 'Notas',
      required: 'obligatoria',
      event: 'Evento',
      payload: 'Payload',
      when: 'Cuándo',
      slot: 'Slot',
      scope: 'Alcance',
      content: 'Contenido',
      none: 'Ninguno.',
      source: 'Fuente de esta página'
    },
    pending: {
      title: 'Traducción pendiente',
      body: ''
    },
    theme: {
      outline: 'En esta página',
      prev: 'Anterior',
      next: 'Siguiente',
      appearance: 'Apariencia',
      toLight: 'Cambiar a tema claro',
      toDark: 'Cambiar a tema oscuro',
      menu: 'Menú',
      top: 'Volver arriba',
      langMenu: 'Cambiar idioma',
      skip: 'Saltar al contenido',
      notFound: {
        title: 'PÁGINA NO ENCONTRADA',
        quote: 'Esta página no existe o cambió de sitio.',
        linkLabel: 'ir al inicio',
        linkText: 'Volver al inicio'
      },
      search: {
        button: 'Buscar',
        buttonAria: 'Buscar en la documentación',
        placeholder: 'Buscar en la documentación',
        reset: 'Borrar la búsqueda',
        back: 'Cerrar la búsqueda',
        detailed: 'Alternar la vista detallada',
        noResults: 'Sin resultados para',
        select: 'para elegir',
        navigate: 'para moverte',
        close: 'para cerrar'
      },
      footer: 'Licencia MIT. Iconos de Lucide (ISC). Fuente Instrument Sans (SIL OFL).'
    }
  },
  en: {
    siteTitle: 'Grana',
    description: 'Vue 3 components themed with tokens: the library brings the structure, your theme brings the color.',
    hero: {
      text: 'Vue 3 components themed with tokens',
      tagline: 'The only bug you’ll want in your UI. The library brings the structure; your theme brings the color.',
      start: 'Get started',
      components: 'Browse components'
    },
    pages: {
      'getting-started': 'Getting started',
      theming: 'Theming',
      cli: '@grana/cli',
      accessibility: 'Accessibility',
      personality: 'Personality',
      'components/': 'Components',
      project: 'Project',
      changelog: 'Changelog',
      playground: 'Theme playground'
    },
    tools: {
      playground: 'Pick color, shape, spacing and type and watch Grana components change live. The theme is derived with the @grana/cli engine and exports as a config or as tokens.'
    },
    nav: { guide: 'Guide', components: 'Components', playground: 'Playground', changelog: 'Changelog', github: 'GitHub' },
    groups: { guide: 'Guide', other: 'Other' },
    // Las categorías del índice de componentes salen de los `###` de «Componentes» del README.
    categories: {
      'Estructura de página': 'Page structure',
      'Acciones y navegación': 'Actions and navigation',
      'Campos de entrada': 'Input fields',
      'Estructura de formularios': 'Form structure',
      Datos: 'Data',
      'Superficies y composición': 'Surfaces and composition',
      Paneles: 'Dashboards',
      'Avisos y estado': 'Notices and status',
      'Captura de voz': 'Voice capture'
    },
    component: {
      tag: 'Tag',
      status: 'Status',
      entry: 'Entry',
      since: 'Since',
      import: 'Import',
      example: 'Example',
      live: 'Live example',
      api: 'API reference',
      apiNote: 'Generated from',
      props: 'Props',
      events: 'Events',
      slots: 'Slots',
      methods: 'Methods and exposed',
      prop: 'Prop',
      type: 'Type',
      values: 'Values',
      default: 'Default',
      notes: 'Notes',
      required: 'required',
      event: 'Event',
      payload: 'Payload',
      when: 'When',
      slot: 'Slot',
      scope: 'Scope',
      content: 'Content',
      none: 'None.',
      source: 'Source of this page'
    },
    pending: {
      title: 'Translation pending',
      body: 'This page has not been translated yet. It shows the Spanish source, which is the reference text.'
    },
    theme: {
      outline: 'On this page',
      prev: 'Previous page',
      next: 'Next page',
      appearance: 'Appearance',
      toLight: 'Switch to light theme',
      toDark: 'Switch to dark theme',
      menu: 'Menu',
      top: 'Return to top',
      langMenu: 'Change language',
      skip: 'Skip to content',
      notFound: {
        title: 'PAGE NOT FOUND',
        quote: 'This page does not exist or has moved.',
        linkLabel: 'go to home',
        linkText: 'Take me home'
      },
      search: {
        button: 'Search',
        buttonAria: 'Search the documentation',
        placeholder: 'Search the documentation',
        reset: 'Reset search',
        back: 'Close search',
        detailed: 'Toggle detailed list',
        noResults: 'No results for',
        select: 'to select',
        navigate: 'to navigate',
        close: 'to close'
      },
      footer: 'MIT License. Icons by Lucide (ISC). Instrument Sans font (SIL OFL).'
    }
  }
}

export function t(locale, path) {
  const get = (obj) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj)
  const value = get(UI[locale])
  return value == null || value === '' ? get(UI.es) : value
}
