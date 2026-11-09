// Banco de coco (r03-estilo): el marco calcado de kiwi (navbar/r01, r03) con el GSidebar REAL en appearance="index"
// (dist/: piel de GSidebar.css, grupos plegables, marca y número de bruno). Sin indice.css ni indice.js.
// URL: ?p=comp|guide  &theme=dark  &dir=rtl  &ap=default (la apariencia de siempre con los grupos plegables)
;(() => {
  const { createApp, ref, watch, onMounted, onBeforeUnmount, nextTick } = Vue
  const Q = new URLSearchParams(location.search)
  const P = Q.get('p') === 'guide' ? 'guide' : 'comp'
  const AP = Q.get('ap') === 'default' ? 'default' : 'index'
  const D = window.SITIO_DATOS
  const S = window.SECCIONES
  const NUM = window.NUMEROS || {}
  const NAMES = ['search', 'menu', 'x', 'chevron-down', 'chevron-right', 'sun', 'moon', 'languages', 'ellipsis', 'align-left', 'arrow-up-right']
  const svg = (n) => `<svg class="lucide lucide-${n}" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${window.LUCIDE_ICONS[n]}</svg>`
  const icons = Grana.createIcons(NAMES.filter((n) => window.LUCIDE_ICONS[n]).map(svg))
  const pad = (n) => String(n).padStart(2, '0')

  const T = {
    nav: 'Secciones', skip: 'Saltar al contenido', search: 'Buscar', more: 'Más opciones', menu: 'Menú', newTab: 'se abre en otra pestaña',
    lang: 'Cambiar idioma', appearance: 'Apariencia', toDark: 'Tema oscuro', onPage: 'En esta página', top: 'Volver arriba', index: 'Documentación',
    filter: 'Filtrar el índice', filterPlaceholder: 'Filtrar', filterHint: '/', filterClear: 'Vaciar el filtro',
    filterCount: (n, t) => (n === t ? `${t} páginas` : `${n} de ${t} páginas`), filterNone: (q) => `Nada coincide con «${q}»`
  }
  const NAV = [
    { id: 'guide', label: 'Guía', href: '#guide', activeMatch: '^/(getting-started|theming|cli|utilities|accessibility|personality|project)' },
    { id: 'components', label: 'Componentes', href: '#components', activeMatch: '^/components/' },
    { id: 'blocks', label: 'Blocks', href: '#blocks', activeMatch: '^/blocks/' },
    { id: 'playground', label: 'Playground', href: '#playground', activeMatch: '^/playground' },
    { id: 'changelog', label: 'Cambios', href: '#changelog', activeMatch: '^/changelog' },
    { id: 'github', label: 'GitHub', href: 'https://github.com/kevinedgm/grana', external: true }
  ]
  // El índice del original en las rutas que no son /blocks/: «Guía» (no plegable) + los nueve grupos de componentes
  // (collapsed: false en VitePress = plegables y abiertos). Propuesta de modelo: { id, label, items, collapsible, collapsed }
  const items = [
    { id: 'g-guide', label: 'Guía', items: D.guide.map((g) => ({ id: 'p-' + g.slug, label: g.label, href: '#' + g.slug })) },
    ...D.groups.map((g, gi) => ({ id: 'g-' + gi, label: g.label, collapsible: true, collapsed: false,
      items: g.items.map((i) => ({ id: 'c-' + i.slug, label: i.name, href: '#c-' + i.slug, code: pad(NUM[i.name] || i.n), keywords: [i.slug] })) }))
  ]
  const byId = new Map(items.flatMap((g) => g.items.map((i) => [i.id, i])))

  const app = createApp({
    components: { ProtoNavBar: window.ProtoNavBar, ProtoPageIndex: window.ProtoPageIndex },
    setup() {
      const dark = ref(Q.get('theme') === 'dark')
      watch(dark, (v) => document.documentElement.setAttribute('data-theme', v ? 'dark' : 'light'))
      const drawerOpen = ref(false)
      const langOpen = ref(false)
      const query = ref('')
      const sidebarMode = ref('expanded')
      const section = ref(null)
      const sidebar = ref(null)
      const current = ref(P === 'comp' ? 'c-combobox' : 'p-getting-started')
      const page = P === 'comp' ? S.combobox : S.empezar
      const title = ref(byId.get(current.value).label)
      const langItems = [
        { id: 'es', label: 'Español', href: '#es', lang: 'es', hreflang: 'es', current: true },
        { id: 'en', label: 'English', href: '#en', lang: 'en', hreflang: 'en' }
      ]
      // Navegación de una aplicación de una página: el índice persiste (no se vuelve a montar) y solo cambia el actual
      watch(current, (id) => { title.value = byId.get(id)?.label || '' })
      const onKey = (e) => {
        const t = e.target
        const editable = t.closest && t.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]')
        if (e.key === '/' && !editable && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); sidebar.value && sidebar.value.focusFilter() }
      }
      onMounted(async () => {
        document.addEventListener('keydown', onKey)
        await nextTick()
      })
      onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
      const filler = (it, i) => `Sección ${i + 1} de la ficha. El texto es de relleno y mide como un párrafo de documentación, con suficiente largo para que la lectura recorra la página.`
      return { T, NAV, P, AP, page, items, current, title, langItems, langOpen, dark, drawerOpen, query, sidebarMode, section, sidebar, filler,
        logo: '../../../../site/public/logo.svg', logoDark: '../../../../site/public/logo-dark.svg' }
    },
    template: `
<g-app-shell :labels="{ skip: T.skip }">
  <template #header>
    <proto-nav-bar :items="NAV" :current="P === 'comp' ? '/components/combobox' : '/getting-started'" :label="T.nav"
      :labels="{ more: T.more, menu: T.menu, newTab: T.newTab }">
      <template #brand><a class="mk-brand" href="#home"><img :src="dark ? logoDark : logo" alt=""><span>Grana</span></a></template>
      <template #search>
        <button class="mk-search" type="button" :aria-label="T.search" aria-keyshortcuts="Control+K Meta+K">
          <g-icon name="search"></g-icon><span class="mk-search__text">{{ T.search }}</span>
          <span class="mk-search__keys" aria-hidden="true"><kbd>⌘</kbd><kbd>K</kbd></span>
        </button>
      </template>
      <template #actions="{ place }">
        <template v-if="place === 'bar'">
          <span class="nb__sep" aria-hidden="true"></span>
          <g-menu v-model="langOpen" :items="langItems" :label="T.lang" align="end">
            <template #trigger="{ attrs }"><button v-bind="attrs" class="mk-lang" type="button" :aria-label="T.lang"><g-icon name="languages"></g-icon><g-icon class="mk-lang__chev" name="chevron-down"></g-icon></button></template>
          </g-menu>
          <span class="nb__sep" aria-hidden="true"></span>
          <g-switch class="mk-theme" v-model="dark" :label="T.toDark" color="neutral">
            <template #icon-on><g-icon name="moon"></g-icon></template><template #icon-off><g-icon name="sun"></g-icon></template>
          </g-switch>
        </template>
        <template v-else>
          <div class="mk-row"><span>{{ T.appearance }}</span>
            <g-switch class="mk-theme" v-model="dark" :label="T.toDark" color="neutral">
              <template #icon-on><g-icon name="moon"></g-icon></template><template #icon-off><g-icon name="sun"></g-icon></template>
            </g-switch>
          </div>
        </template>
      </template>
    </proto-nav-bar>
  </template>

  <template #nav>
    <g-sidebar ref="sidebar" :appearance="AP" :items="items" v-model="current" v-model:open="drawerOpen" v-model:query="query"
      :label="T.index" mode="auto" mobile="drawer" :breakpoints="{ expanded: 960 }"
      filter filter-keyshortcuts="/" @mode-change="(e) => (sidebarMode = e.mode)"
      :labels="{ collapse: 'Contraer', expand: 'Expandir', drawer: T.index, close: 'Cerrar el índice', more: 'Más', moreActive: 'Más (aquí)',
        filter: T.filter, filterPlaceholder: T.filterPlaceholder, filterHint: T.filterHint, filterClear: T.filterClear, filterCount: T.filterCount, filterNone: T.filterNone, groupCurrent: 'contiene la página actual' }">
      <template #logo><a class="mk-brand" href="#home"><img :src="dark ? logoDark : logo" alt=""><span>Grana</span></a></template>
      <template #search-icon><g-icon name="search"></g-icon></template>
    </g-sidebar>
  </template>

  <div class="mk-local">
    <button class="mk-local__menu" type="button" :hidden="sidebarMode !== 'drawer'" aria-haspopup="dialog" @click="drawerOpen = true"><g-icon name="align-left"></g-icon>{{ T.menu }}</button>
    <proto-page-index class="mk-local__index" id="pi-fold" fold :align="sidebarMode === 'drawer' ? 'end' : 'start'" :items="page.items" :label="T.onPage" :labels="{ top: T.top }" v-model="section"></proto-page-index>
  </div>
  <div class="mk-doc">
    <article class="mk-content mk-prose">
      <h1 tabindex="-1">{{ title }}</h1>
      <template v-for="(it, i) in page.items" :key="it.id">
        <h2 v-if="it.level === 2" :id="it.id">{{ it.label }}</h2>
        <h3 v-else :id="it.id">{{ it.label }}</h3>
        <p>{{ filler(it, i) }}</p>
      </template>
    </article>
    <div class="mk-aside"><div class="mk-aside__inner">
      <proto-page-index id="pi-list" :items="page.items" :label="T.onPage" :labels="{ top: T.top }" v-model="section"></proto-page-index>
    </div></div>
  </div>
</g-app-shell>`
  })
  app.use(Grana.default || Grana)
  app.use(icons)
  app.use(GranaAppShell.default || GranaAppShell)
  app.use(GranaSidebarFilter.default || GranaSidebarFilter)
  window.__marco = app.mount('#app')
})()
