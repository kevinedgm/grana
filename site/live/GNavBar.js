// Ficha interactiva de GNavBar. Controles desde GNavBar.meta.json.
// El anfitrión hace lo que la aplicación haría: cancelar el href y guardar la ruta actual (la ficha no sale de la página).
import { defineComponent, h, ref, watch } from 'vue'
import { GBtn } from '@grana/vue'
import { GNavBar } from '@grana/vue/nav-bar'

const en = () => typeof document !== 'undefined' && document.documentElement.lang.startsWith('en')

const Host = defineComponent({
  name: 'GranaLiveNavBar',
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    const ruta = ref(attrs.current)
    watch(() => attrs.current, (v) => { ruta.value = v })
    return () => h(GNavBar, {
      ...attrs,
      current: ruta.value,
      onNavigate: (e) => {
        e.event.preventDefault()
        attrs.onNavigate?.(e)
        ruta.value = e.item.href
      }
    }, slots)
  }
})

const items = {
  es: [
    { id: 'guide', label: 'Guía', href: '/getting-started', activeMatch: '^/(getting-started|theming)' },
    { id: 'components', label: 'Componentes', href: '/components/btn', activeMatch: '^/components/' },
    { id: 'playground', label: 'Playground', href: '/theme-playground' },
    { id: 'github', label: 'GitHub', href: 'https://github.com/kevinedgm/grana', external: true }
  ],
  en: [
    { id: 'guide', label: 'Guide', href: '/getting-started', activeMatch: '^/(getting-started|theming)' },
    { id: 'components', label: 'Components', href: '/components/btn', activeMatch: '^/components/' },
    { id: 'playground', label: 'Playground', href: '/theme-playground' },
    { id: 'github', label: 'GitHub', href: 'https://github.com/kevinedgm/grana', external: true }
  ]
}

export default {
  // La barra corta por el ancho de la ventana (48rem y 80rem): la ficha lo enseña a 1280 y a 375 px. Sin router: id y current fijos.
  exclude: ['id', 'current', 'items', 'labels', 'label'],
  block: true,
  host: Host,
  imports: ["import { GNavBar } from '@grana/vue/nav-bar'"],
  base: {
    label: { es: 'Secciones', en: 'Sections' },
    items,
    current: '/components/btn',
    labels: {
      es: { more: 'Más opciones', menu: 'Menú', newTab: ', se abre en otra pestaña' },
      en: { more: 'More options', menu: 'Menu', newTab: ', opens in a new tab' }
    }
  },
  code: { items: ':items="secciones"', labels: ':labels="textos"' },
  slots: [
    { name: 'brand', code: '<a href="/">Grana</a>', render: () => h('a', { href: '#', onClick: (e) => e.preventDefault(), style: 'font-weight:600;color:inherit;text-decoration:none' }, 'Grana') },
    {
      name: 'search', optional: true, on: true, code: { es: '<g-btn variant="outline" color="neutral" size="sm">Buscar</g-btn>', en: '<g-btn variant="outline" color="neutral" size="sm">Search</g-btn>' },
      render: () => h(GBtn, { variant: 'outline', color: 'neutral', size: 'sm' }, () => (en() ? 'Search' : 'Buscar'))
    },
    {
      name: 'actions', optional: true, on: true, scope: '{ place }', code: { es: '<g-btn variant="ghost" color="neutral" size="sm">ES</g-btn>', en: '<g-btn variant="ghost" color="neutral" size="sm">EN</g-btn>' },
      render: () => h(GBtn, { variant: 'ghost', color: 'neutral', size: 'sm' }, () => (en() ? 'EN' : 'ES'))
    }
  ],
  cases: [
    {
      title: { es: 'Secciones de un sitio, con la actual por ruta', en: 'Site sections, current by route' },
      why: { es: 'La actual sale de current y activeMatch, no de location: el HTML del servidor ya trae aria-current y nada cambia al hidratar.', en: 'The current one comes from current and activeMatch, not location: the server HTML already carries aria-current and nothing changes on hydration.' },
      props: {}, slots: { search: true, actions: true }
    },
    {
      title: { es: 'Solo enlaces', en: 'Links only' },
      why: { es: 'Sin búsqueda ni acciones la barra queda en la marca y los enlaces; los huecos que no se llenan no dejan espacio.', en: 'Without search or actions the bar keeps the brand and the links; unused slots leave no gap.' },
      props: {}, slots: { search: false, actions: false }
    }
  ]
}
