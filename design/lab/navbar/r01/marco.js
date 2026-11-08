// Marco del sitio calcado del anterior, hecho con componentes REALES de dist/ donde existen (GAppShell, GSidebar con
// el filtro de @grana/vue/sidebar-filter y los números 01–79, GMenu de idioma con elementos-enlace, GSwitch de tema con
// sol y luna, GDialog + GCombobox palette para «Buscar», GIcon) y los dos prototipos de kiwi que faltan:
// ProtoNavBar (navbar/r01/navbar.js → GNavBar) y ProtoPageIndex (page-index/r01/page-index.js → GPageIndex list).
// URL: ?p=comp|guide|blocks|home  &theme=dark  &glide=1 (P1)  &mark=1 (P2)  &follow=0 (PI-P1)  &landing=1 (PI-P2)  &lang=en
;(() => {
  const { createApp, ref, computed, watch, onMounted, onBeforeUnmount, nextTick } = Vue
  const Q = new URLSearchParams(location.search)
  const P = Q.get('p') || 'comp'
  const D = window.SITIO_DATOS
  const S = window.SECCIONES
  const NUM = window.NUMEROS || {}
  const NAMES = ['search', 'menu', 'x', 'chevron-down', 'chevron-right', 'sun', 'moon', 'languages', 'ellipsis', 'align-left', 'arrow-up-right', 'folder', 'book-open', 'rocket', 'palette', 'terminal', 'accessibility', 'sparkles', 'list', 'globe']
  const svg = (n) => `<svg class="lucide lucide-${n}" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${window.LUCIDE_ICONS[n]}</svg>`
  const icons = Grana.createIcons(NAMES.filter((n) => window.LUCIDE_ICONS[n]).map(svg))

  const T = {
    nav: 'Secciones', skip: 'Saltar al contenido', search: 'Buscar', searchAria: 'Buscar en la documentación', more: 'Más opciones', menu: 'Menú',
    newTab: 'se abre en otra pestaña', lang: 'Cambiar idioma', appearance: 'Apariencia', toDark: 'Tema oscuro', onPage: 'En esta página', top: 'Volver arriba',
    index: 'Documentación', prev: 'Anterior', next: 'Siguiente', footer: 'Licencia MIT. Iconos de Lucide (ISC). Fuente Instrument Sans (SIL OFL).',
    filter: 'Filtrar el índice', filterPlaceholder: 'Nombre o número', filterHint: '/', filterClear: 'Vaciar el filtro',
    filterCount: (n, t) => (n === t ? `${t} entradas` : `${n} de ${t}`), filterNone: (q) => `Nada coincide con «${q}»`
  }
  const NAV = [
    { id: 'guide', label: 'Guía', href: '#guide', activeMatch: '^/(getting-started|theming|cli|utilities|accessibility|personality|project)' },
    { id: 'components', label: 'Componentes', href: '#components', activeMatch: '^/components/' },
    { id: 'blocks', label: 'Blocks', href: '#blocks', activeMatch: '^/blocks/' },
    { id: 'playground', label: 'Playground', href: '#playground', activeMatch: '^/playground' },
    { id: 'changelog', label: 'Cambios', href: '#changelog', activeMatch: '^/changelog' },
    { id: 'github', label: 'GitHub', href: 'https://github.com/kevinedgm/grana', external: true }
  ]
  const ROUTE = { comp: '/components/combobox', guide: '/getting-started', blocks: '/blocks/', home: '/' }
  const PAGE = { comp: S.combobox, guide: S.empezar, blocks: S.blocks }
  const PAGER = { comp: ['GSelect', 'GTimeField'], guide: [null, 'Tematización'], blocks: [null, 'Marketing'] }
  const pad = (n) => String(n).padStart(2, '0')

  // Índice: guía + grupos de componentes con su número estable (site/scripts/numeros.json) + Blocks
  const sidebarItems = () => {
    const known = new Set(D.groups.flatMap((g) => g.items.map((i) => i.name)))
    const extra = Object.keys(NUM).filter((n) => !known.has(n))
    return [
      { id: 'g-guide', label: 'Guía', items: D.guide.map((g) => ({ id: 'p-' + g.slug, label: g.label, href: '#' + g.slug })) },
      ...D.groups.map((g, gi) => ({ id: 'g-' + gi, label: g.label, items: [...g.items, ...(gi === 1 ? extra.map((n) => ({ name: n, slug: n.toLowerCase(), n: NUM[n] })) : [])].map((i) => ({ id: 'c-' + i.slug, label: i.name, href: '#c-' + i.slug, code: pad(NUM[i.name] || i.n) })) })),
      { id: 'g-blocks', label: 'Blocks', items: D.blocks.map((b) => ({ id: 'b-' + b.label, label: b.label, href: '#b-' + b.label })) }
    ]
  }

  const app = createApp({
    components: { ProtoNavBar: window.ProtoNavBar, ProtoPageIndex: window.ProtoPageIndex },
    setup() {
      const dark = ref(Q.get('theme') === 'dark')
      watch(dark, (v) => document.documentElement.setAttribute('data-theme', v ? 'dark' : 'light'))
      const drawerOpen = ref(false)
      const langOpen = ref(false)
      const query = ref('')
      const searchOpen = ref(false)
      const sidebarMode = ref('expanded')
      const section = ref(null)
      const nb = ref(null)
      const sidebar = ref(null)
      const isHome = P === 'home'
      const page = PAGE[P]
      const items = sidebarItems()
      const currentId = P === 'comp' ? 'c-combobox' : P === 'guide' ? 'p-getting-started' : P === 'blocks' ? 'b-Marketing' : null
      const langItems = [
        { id: 'es', label: 'Español', href: '#es', lang: 'es', hreflang: 'es', current: true },
        { id: 'en', label: 'English', href: '#en', lang: 'en', hreflang: 'en' }
      ]
      const searchOptions = [{ label: 'Componentes', options: Object.keys(NUM).map((n) => ({ value: n, code: pad(NUM[n]), label: n })) }]
      const onKey = (e) => {
        const t = e.target
        const editable = t.closest && t.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]')
        // `/` → el filtro del índice (lo conservado de A); Ctrl/⌘+K → «Buscar» (lo del sitio anterior). Pregunta N-Q1.
        if (e.key === '/' && !editable && !e.metaKey && !e.ctrlKey && !e.altKey && !isHome) { e.preventDefault(); sidebar.value && sidebar.value.focusFilter() }
        if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); searchOpen.value = true }
      }
      onMounted(() => document.addEventListener('keydown', onKey))
      onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
      const filler = (it, i) => it.level === 3
        ? 'Texto de la subsección: el prototipo conserva el orden y los títulos reales de la ficha y rellena el cuerpo para que la lectura recorra la página.'
        : `Sección ${i + 1} de la ficha real. El componente real del paquete con el tema real; el texto es de relleno y mide como un párrafo de documentación, con suficiente largo para que la línea de lectura cruce cada título a su tiempo.`
      return { langOpen, T, NAV, ROUTE, P, isHome, page, items, currentId, langItems, searchOptions, dark, drawerOpen, query, searchOpen, sidebarMode, section, nb, sidebar, filler, PAGER,
        glide: Q.get('glide') === '1', mark: Q.get('mark') === '1', follow: Q.get('follow') !== '0', landing: Q.get('landing') === '1',
        logo: '../../../../site/public/logo.svg', logoDark: '../../../../site/public/logo-dark.svg' }
    },
    template: `
<g-app-shell :labels="{ skip: T.skip }">
  <template #header>
    <proto-nav-bar ref="nb" :items="NAV" :current="ROUTE[P]" :label="T.nav" :glide="glide" :mark="mark"
      :labels="{ more: T.more, menu: T.menu, newTab: T.newTab }">
      <template #brand><a class="mk-brand" href="#home"><img :src="dark ? logoDark : logo" alt=""><span>Grana</span></a></template>
      <template #search>
        <button class="mk-search" type="button" :aria-label="T.searchAria" aria-keyshortcuts="Control+K Meta+K" @click="searchOpen = true">
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
          <nav :aria-label="T.lang">
            <ul class="mk-langs"><li v-for="l in langItems" :key="l.id"><a :href="l.href" :lang="l.lang" :hreflang="l.hreflang" :aria-current="l.current ? 'page' : null">{{ l.label }}</a></li></ul>
          </nav>
          <div class="mk-row"><span>{{ T.appearance }}</span>
            <g-switch class="mk-theme" v-model="dark" :label="T.toDark" color="neutral">
              <template #icon-on><g-icon name="moon"></g-icon></template><template #icon-off><g-icon name="sun"></g-icon></template>
            </g-switch>
          </div>
        </template>
      </template>
    </proto-nav-bar>
  </template>

  <template v-if="!isHome" #nav>
    <g-sidebar ref="sidebar" class="mk-sidebar" :items="items" :model-value="currentId" v-model:open="drawerOpen" v-model:query="query"
      :label="T.index" mode="auto" mobile="drawer" :breakpoints="{ expanded: 960, rail: 960 }" density="compact"
      filter filter-keyshortcuts="/" @mode-change="(e) => (sidebarMode = e.mode)"
      :labels="{ collapse: 'Contraer', expand: 'Expandir', drawer: T.index, close: 'Cerrar', more: 'Más', moreActive: 'Más (aquí)',
        filter: T.filter, filterPlaceholder: T.filterPlaceholder, filterHint: T.filterHint, filterClear: T.filterClear, filterCount: T.filterCount, filterNone: T.filterNone }">
      <template #logo><a class="mk-brand" href="#home"><img :src="dark ? logoDark : logo" alt=""><span>Grana</span></a></template>
    </g-sidebar>
  </template>

  <section v-if="isHome" class="mk-home">
    <h1 tabindex="-1">Grana<br>Componentes Vue 3<br>con tema por tokens</h1>
    <p>The only bug you’ll want in your UI. La librería trae la estructura; tu tema pone el color.</p>
    <p><g-btn href="#guide">Empezar</g-btn> <g-btn href="#components" variant="soft" color="neutral">Ver componentes</g-btn></p>
  </section>
  <template v-else>
    <div class="mk-local">
      <button class="mk-local__menu" type="button" :hidden="sidebarMode !== 'drawer'" aria-haspopup="dialog" @click="drawerOpen = true"><g-icon name="align-left"></g-icon>{{ T.menu }}</button>
      <proto-page-index class="mk-local__index" id="pi-fold" fold :align="sidebarMode === 'drawer' ? 'end' : 'start'" :items="page.items" :label="T.onPage" :labels="{ top: T.top }" v-model="section" :landing="landing"></proto-page-index>
    </div>
    <div class="mk-doc">
      <article class="mk-content mk-prose">
        <h1 tabindex="-1">{{ page.h1 }}</h1>
        <template v-for="(it, i) in page.items" :key="it.id">
          <h2 v-if="it.level === 2" :id="it.id">{{ it.label }}</h2>
          <h3 v-else :id="it.id">{{ it.label }}</h3>
          <p>{{ filler(it, i) }}</p>
          <p v-if="it.level === 2 && i % 3 === 0">{{ filler(it, i) }} {{ filler(it, i) }}</p>
        </template>
        <nav class="mk-pager" aria-label="Páginas vecinas">
          <a v-if="PAGER[P][0]" href="#prev"><small>{{ T.prev }}</small><b>{{ PAGER[P][0] }}</b></a>
          <a v-if="PAGER[P][1]" class="is-next" href="#next"><small>{{ T.next }}</small><b>{{ PAGER[P][1] }}</b></a>
        </nav>
      </article>
      <div class="mk-aside">
        <div class="mk-aside__inner">
          <proto-page-index id="pi-list" :items="page.items" :label="T.onPage" :labels="{ top: T.top }" v-model="section" :follow="follow" :landing="landing"></proto-page-index>
        </div>
      </div>
    </div>
  </template>

  <template v-if="isHome" #footer><p class="mk-foot">{{ T.footer }}</p></template>
</g-app-shell>
<g-dialog v-model="searchOpen" :title="T.searchAria" size="md" :labels="{ close: 'Cerrar' }">
  <g-combobox appearance="palette" :label="T.search" :options="searchOptions" :labels="{ empty: 'Sin resultados', clear: 'Vaciar' }"></g-combobox>
</g-dialog>`
  })
  app.use(Grana.default || Grana)
  app.use(icons)
  app.use(GranaAppShell.default || GranaAppShell)
  app.use(GranaSidebarFilter.default || GranaSidebarFilter)
  app.use(GranaCombobox.default || GranaCombobox)
  window.__marco = app.mount('#app')
})()
