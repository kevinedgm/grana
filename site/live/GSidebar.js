// Ficha interactiva de GSidebar. Controles desde GSidebar.meta.json.
// El anfitrión pone el marco (contenedor con altura y la página al lado) y hace lo que la aplicación haría:
// cancelar el href y guardar el destino, y el botón que abre el drawer cuando se pide ese formato.
import { defineComponent, h, ref } from 'vue'
import { GAvatar, GBtn, GIcon, GSidebar } from '@grana/vue'

const en = () => typeof document !== 'undefined' && document.documentElement.lang.startsWith('en')

const Host = defineComponent({
  name: 'GranaLiveSidebar',
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    const formato = ref({ mode: '', overlay: false })
    const drawer = ref(false)
    return () => {
      const wantsDrawer = attrs.mode === 'drawer'
      const frame = {
        position: 'relative', display: 'flex', blockSize: 'calc(var(--g-space-1) * 120)', overflow: 'hidden',
        border: 'var(--g-border-width) solid var(--g-color-border)', borderRadius: 'var(--g-radius-md)'
      }
      return h('div', { style: frame }, [
        h(GSidebar, {
          ...attrs,
          contained: true,
          open: wantsDrawer && drawer.value,
          style: { flex: 'none' },
          onNavigate: (e) => {
            e.event.preventDefault()
            attrs.onNavigate?.(e)
            attrs['onUpdate:modelValue']?.(e.item.id)
          },
          'onUpdate:open': (v) => { drawer.value = v },
          onModeChange: (e) => { formato.value = e; attrs.onModeChange?.(e) }
        }, slots),
        h('div', {
          style: {
            flex: '1 1 auto', minInlineSize: 0, overflow: 'auto', padding: 'var(--g-space-4)',
            paddingBlockEnd: formato.value.mode === 'navbar' ? 'calc(var(--g-sidebar-bar) + var(--g-space-4))' : undefined
          }
        }, [
          h('p', { class: 'g-m-0 g-mb-2' }, [en() ? 'Current page: ' : 'Página actual: ', h('strong', attrs.modelValue)]),
          h('p', { class: 'g-m-0 g-mb-2' }, [en() ? 'Layout: ' : 'Formato: ', h('strong', formato.value.mode)]),
          // En drawer la barra es una hoja modal: la aplicación pone el botón que la abre.
          wantsDrawer ? h(GBtn, { variant: 'outline', onClick: () => { drawer.value = true } }, () => (en() ? 'Open navigation' : 'Abrir navegación')) : null
        ])
      ])
    }
  }
})

const menu = {
  es: [
    { label: 'Principal', items: [
      { id: 'inicio', label: 'Inicio', href: '#inicio', icon: 'house' },
      { id: 'bandeja', label: 'Bandeja', href: '#bandeja', icon: 'inbox', badge: 12, badgeLabel: '12 sin leer' },
      { id: 'agenda', label: 'Agenda', href: '#agenda', icon: 'calendar', dot: true, badgeLabel: 'Hay citas nuevas' }
    ] },
    { label: 'Clínica', items: [
      { id: 'pacientes', label: 'Pacientes', icon: 'users', children: [
        { id: 'activos', label: 'Activos', href: '#activos' },
        { id: 'alta', label: 'De alta', href: '#alta' }
      ] },
      { id: 'reportes', label: 'Reportes', href: '#reportes', icon: 'chart-column' },
      { id: 'facturacion', label: 'Facturación', icon: 'credit-card', disabled: true }
    ] },
    { id: 'ajustes', label: 'Ajustes', href: '#ajustes', icon: 'settings' }
  ],
  en: [
    { label: 'Main', items: [
      { id: 'inicio', label: 'Home', href: '#inicio', icon: 'house' },
      { id: 'bandeja', label: 'Inbox', href: '#bandeja', icon: 'inbox', badge: 12, badgeLabel: '12 unread' },
      { id: 'agenda', label: 'Calendar', href: '#agenda', icon: 'calendar', dot: true, badgeLabel: 'New appointments' }
    ] },
    { label: 'Clinic', items: [
      { id: 'pacientes', label: 'Patients', icon: 'users', children: [
        { id: 'activos', label: 'Active', href: '#activos' },
        { id: 'alta', label: 'Discharged', href: '#alta' }
      ] },
      { id: 'reportes', label: 'Reports', href: '#reportes', icon: 'chart-column' },
      { id: 'facturacion', label: 'Billing', icon: 'credit-card', disabled: true }
    ] },
    { id: 'ajustes', label: 'Settings', href: '#ajustes', icon: 'settings' }
  ]
}

const simple = {
  es: [
    { id: 'inicio', label: 'Inicio', href: '#inicio', icon: 'house' },
    { id: 'bandeja', label: 'Bandeja', href: '#bandeja', icon: 'inbox' },
    { id: 'agenda', label: 'Agenda', href: '#agenda', icon: 'calendar' },
    { id: 'reportes', label: 'Reportes', href: '#reportes', icon: 'chart-column' },
    { id: 'ajustes', label: 'Ajustes', href: '#ajustes', icon: 'settings' }
  ],
  en: [
    { id: 'inicio', label: 'Home', href: '#inicio', icon: 'house' },
    { id: 'bandeja', label: 'Inbox', href: '#bandeja', icon: 'inbox' },
    { id: 'agenda', label: 'Calendar', href: '#agenda', icon: 'calendar' },
    { id: 'reportes', label: 'Reports', href: '#reportes', icon: 'chart-column' },
    { id: 'ajustes', label: 'Settings', href: '#ajustes', icon: 'settings' }
  ]
}

export default {
  host: Host,
  // contained lo pone el anfitrión (el marco de la ficha); open, mobile, container y labels van en el README.
  exclude: ['contained', 'open', 'mobile', 'container', 'labels', 'closeOnNavigate'],
  model: { prop: 'modelValue', value: 'inicio', var: 'actual' },
  block: true,
  text: ['label'],
  code: { search: 'search' },
  imports: [],
  base: {
    label: { es: 'Principal', en: 'Main' },
    items: menu,
    labels: {
      es: {
        collapse: 'Contraer la barra lateral', expand: 'Expandir la barra lateral', more: 'Más', moreActive: 'contiene la página actual',
        drawer: 'Navegación', close: 'Cerrar', search: 'Buscar', searchHint: 'Ctrl K'
      },
      en: {
        collapse: 'Collapse the sidebar', expand: 'Expand the sidebar', more: 'More', moreActive: 'contains the current page',
        drawer: 'Navigation', close: 'Close', search: 'Search', searchHint: 'Ctrl K'
      }
    }
  },
  slots: [
    {
      name: 'logo', scope: '{ collapsed }',
      code: { es: '<g-icon name="leaf" /><span v-if="!collapsed">Clínica Reforma</span>', en: '<g-icon name="leaf" /><span v-if="!collapsed">Reforma Clinic</span>' },
      render: ({ collapsed }) => [h(GIcon, { name: 'leaf' }), collapsed ? null : h('span', en() ? 'Reforma Clinic' : 'Clínica Reforma')]
    },
    { name: 'toggle-icon', code: '<g-icon name="chevron-left" flip-rtl />', render: () => h(GIcon, { name: 'chevron-left', flipRtl: true }) },
    { name: 'more-icon', code: '<g-icon name="ellipsis-vertical" />', render: () => h(GIcon, { name: 'ellipsis-vertical' }) },
    { name: 'search-icon', code: '<g-icon name="search" />', render: () => h(GIcon, { name: 'search' }) },
    {
      name: 'user', scope: '{ collapsed }', optional: true, on: true,
      code: '<g-avatar name="Ana García" :label="collapsed ? \'Ana García\' : undefined" />\n<span v-if="!collapsed">Ana García</span>',
      render: ({ collapsed }) => h('span', { class: 'g-flex g-items-center g-gap-2' }, [
        h(GAvatar, { name: 'Ana García', label: collapsed ? 'Ana García' : undefined }),
        collapsed ? null : h('span', 'Ana García')
      ])
    }
  ],
  cases: [
    {
      title: { es: 'Navegación principal de una aplicación', en: 'Main navigation of an app' },
      why: {
        es: 'Grupos, un padre con hijos, un contador y un punto de aviso; en automático decide el ancho del contenedor (expandida, riel o barra inferior). Para pocos destinos, GTabs.',
        en: 'Groups, a parent with children, a counter and a dot; in auto the container width decides (expanded, rail or bottom bar). For few destinations, GTabs.'
      },
      props: { mode: 'expanded' }
    },
    {
      title: { es: 'Riel que se expande sobre el contenido', en: 'Rail that expands over the content' },
      why: {
        es: 'rail con overlay deja el diseño fijo y la barra crece encima al expandirla; úsalo cuando el contenido no puede moverse (una tabla ancha).',
        en: 'rail with overlay keeps the layout fixed and the bar grows on top when expanded; use it when the content cannot move (a wide table).'
      },
      props: { mode: 'rail', overlay: true }
    },
    {
      title: { es: 'Con búsqueda y barra inferior en teléfono', en: 'With search and a bottom bar on phones' },
      why: {
        es: 'search añade el disparador (tu paleta de comandos escucha search); en un contenedor estrecho la barra pasa a navbar con barCount destinos y «Más».',
        en: 'search adds the trigger (your command palette listens to search); in a narrow container the bar becomes a navbar with barCount destinations and “More”.'
      },
      props: { mode: 'auto', search: true, items: simple, barCount: 4 }
    },
    {
      title: { es: 'Barra flotante con otro color', en: 'Floating bar with another color' },
      why: {
        es: 'variant floating la despega del borde y color accent marca el destino actual con el acento; mantén un solo color por aplicación.',
        en: 'variant floating lifts it off the edge and color accent marks the current destination with the accent; keep a single color per app.'
      },
      props: { mode: 'expanded', variant: 'floating', color: 'accent', density: 'compact' }
    }
  ]
}
