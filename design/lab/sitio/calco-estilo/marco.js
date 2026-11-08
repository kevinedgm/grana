// Banco de estilo del calco (coco): el marco del sitio con las CLASES DEL SITIO que espera grana-site.css (su cabecera) y
// componentes reales de dist donde ya existen (GAppShell, GSidebar con filtro, GMenu, GSwitch, GCard, GIcon). GNavBar y
// GPageIndex list/fold van con el marcado del contrato (navbar.js, page-index.js) y la búsqueda es la superficie de
// GCombobox appearance="command" escrita a mano con su anatomía (combobox.md «Modo comando»), sobre un <dialog> real.
// Datos: los de kiwi (sitio/r01/datos.js, page-index/r01/secciones.js, navbar/r01/numeros.js).
// URL: ?p=comp|guide|blocks|home  &theme=dark  &dir=rtl
;(() => {
  const { createApp, ref, watch, onMounted, onBeforeUnmount, nextTick } = Vue
  const Q = new URLSearchParams(location.search)
  const P = Q.get('p') || 'comp'
  if (Q.get('dir') === 'rtl') document.documentElement.setAttribute('dir', 'rtl')
  const D = window.SITIO_DATOS
  const S = window.SECCIONES
  const NUM = window.NUMEROS || {}
  const NAMES = ['search', 'menu', 'x', 'chevron-down', 'chevron-right', 'sun', 'moon', 'languages', 'ellipsis', 'align-left', 'arrow-up-right', 'arrow-up', 'arrow-down', 'corner-down-left']
  const svg = (n) => `<svg class="lucide lucide-${n}" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${window.LUCIDE_ICONS[n]}</svg>`
  const icons = Grana.createIcons(NAMES.filter((n) => window.LUCIDE_ICONS[n]).map(svg))
  const T = { nav: 'Secciones', skip: 'Saltar al contenido', search: 'Buscar', searchAria: 'Buscar en la documentación', more: 'Más opciones', menu: 'Menú', newTab: 'se abre en otra pestaña', lang: 'Cambiar idioma', appearance: 'Apariencia', theme: 'Tema oscuro', onPage: 'En esta página', top: 'Volver arriba', index: 'Documentación', prev: 'Anterior', next: 'Siguiente', footer: 'Licencia MIT. Iconos de Lucide (ISC). Fuente Instrument Sans (SIL OFL).' }
  const NAV = [
    { id: 'guide', label: 'Guía', href: '#guide', activeMatch: '^/(getting-started|theming)' },
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
  const sidebarItems = () => [
    { id: 'g-guide', label: 'Guía', items: D.guide.map((g) => ({ id: 'p-' + g.slug, label: g.label, href: '#' + g.slug })) },
    ...D.groups.map((g, gi) => ({ id: 'g-' + gi, label: g.label, items: g.items.map((i) => ({ id: 'c-' + i.slug, label: i.name, href: '#c-' + i.slug, code: pad(NUM[i.name] || i.n) })) })),
    { id: 'g-blocks', label: 'Blocks', items: D.blocks.map((b) => ({ id: 'b-' + b.label, label: b.label, href: '#b-' + b.label })) }
  ]
  const app = createApp({
    components: { BancoNavBar: window.BancoNavBar, BancoPageIndex: window.BancoPageIndex },
    setup() {
      const dark = ref(Q.get('theme') === 'dark')
      watch(dark, (v) => { document.documentElement.setAttribute('data-theme', v ? 'dark' : 'light'); document.documentElement.classList.toggle('dark', v) })
      const drawerOpen = ref(false); const langOpen = ref(false); const query = ref(''); const section = ref(null)
      const search = ref(null); const term = ref('comb'); const narrow = ref(false)
      const isHome = P === 'home'
      const items = sidebarItems()
      const currentId = P === 'comp' ? 'c-combobox' : P === 'guide' ? 'p-getting-started' : P === 'blocks' ? 'b-Marketing' : null
      const langItems = [{ id: 'es', label: 'Español', href: '#es', lang: 'es', hreflang: 'es', current: true }, { id: 'en', label: 'English', href: '#en', lang: 'en', hreflang: 'en' }]
      const results = [
        { id: 'r1', page: 'GCombobox', label: 'GCombobox', frag: 'GCombobox › Uso · el campo se abre y busca en el catálogo' },
        { id: 'r2', page: 'GCombobox', label: 'Modo comando', frag: 'GCombobox › Opciones · appearance="command" abre una búsqueda modal' },
        { id: 'r3', page: 'GSelect', label: 'Cuándo usar GCombobox', frag: 'GSelect › Fronteras · con muchas opciones, GCombobox' }
      ]
      const openSearch = () => { narrow.value = innerWidth <= 520; search.value.showModal(); nextTick(() => { const f = search.value.querySelector('input'); f.focus(); f.select() }) }
      const onKey = (e) => { if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); openSearch() } }
      const onScroll = () => { if (isHome) document.documentElement.toggleAttribute('data-top', scrollY === 0) }
      onMounted(() => { document.addEventListener('keydown', onKey); addEventListener('scroll', onScroll, { passive: true }) })
      onBeforeUnmount(() => { document.removeEventListener('keydown', onKey); removeEventListener('scroll', onScroll) })
      const mark = (txt) => txt.replace(/(comb)/i, '<mark class="g-summary__mark">$1</mark>')
      const filler = (it, i) => it.level === 3 ? 'Texto de la subsección: el banco conserva el orden y los títulos reales de la ficha.' : `Sección ${i + 1} de la ficha real. El texto es de relleno y mide como un párrafo de documentación, con suficiente largo para que la línea de lectura cruce cada título a su tiempo.`
      return { T, NAV, ROUTE, P, isHome, page: PAGE[P], items, currentId, langItems, dark, drawerOpen, langOpen, query, section, search, term, narrow, results, openSearch, mark, filler, PAGER,
        logo: '../../../../site/public/logo.svg', logoDark: '../../../../site/public/logo-dark.svg', breakpoints: { expanded: 960, rail: 960 } }
    },
    template: `
<g-app-shell class="g-app-shell--header-pinned-wide" :labels="{ skip: T.skip }">
  <template #header>
    <banco-nav-bar :items="NAV" :current="ROUTE[P]" :label="T.nav" :labels="{ more: T.more, menu: T.menu, newTab: T.newTab }">
      <template #brand><a class="site-brand" href="#home"><img class="site-brand__logo site-brand__logo--light" :src="logo" alt=""><img class="site-brand__logo site-brand__logo--dark" :src="logoDark" alt=""><span class="site-brand__name">Grana</span></a></template>
      <template #search>
        <button class="site-search" type="button" :aria-label="T.searchAria" aria-haspopup="dialog" aria-keyshortcuts="Control+K Meta+K" @click="openSearch">
          <g-icon class="site-search__icon" name="search"></g-icon><span class="site-search__text">{{ T.search }}</span>
          <span class="site-search__keys" aria-hidden="true"><kbd class="site-search__mod">Ctrl</kbd><kbd>K</kbd></span>
        </button>
      </template>
      <template #actions="{ place }">
        <template v-if="place === 'bar'">
          <g-menu v-model="langOpen" :items="langItems" :label="T.lang" align="end">
            <template #trigger="{ attrs }"><button v-bind="attrs" class="site-lang" type="button" :aria-label="T.lang"><g-icon name="languages"></g-icon><g-icon class="site-lang__chev" name="chevron-down"></g-icon></button></template>
          </g-menu>
          <g-switch class="site-theme" v-model="dark" size="sm" :aria-label="T.theme" color="neutral">
            <template #icon-on><g-icon name="moon"></g-icon></template><template #icon-off><g-icon name="sun"></g-icon></template>
          </g-switch>
        </template>
        <template v-else>
          <nav :aria-label="T.lang"><ul class="site-langs"><li v-for="l in langItems" :key="l.id"><a :href="l.href" :lang="l.lang" :hreflang="l.hreflang" :aria-current="l.current ? 'page' : null">{{ l.label }}</a></li></ul></nav>
          <div class="site-appearance"><span class="site-appearance__label">{{ T.appearance }}</span>
            <g-switch class="site-theme" v-model="dark" size="sm" :aria-label="T.theme" color="neutral">
              <template #icon-on><g-icon name="moon"></g-icon></template><template #icon-off><g-icon name="sun"></g-icon></template>
            </g-switch>
          </div>
        </template>
      </template>
    </banco-nav-bar>
  </template>
  <template v-if="!isHome" #nav>
    <g-sidebar :items="items" :model-value="currentId" v-model:open="drawerOpen" v-model:query="query" :label="T.index" mode="auto" mobile="drawer" :breakpoints="breakpoints" density="compact" filter
      :labels="{ collapse: 'Contraer', expand: 'Expandir', drawer: T.index, close: 'Cerrar', more: 'Más', moreActive: 'Más (aquí)', filter: 'Filtrar el índice', filterPlaceholder: 'Nombre o número', filterHint: '/', filterClear: 'Vaciar', filterCount: (n, t) => n + ' de ' + t, filterNone: (q) => 'Nada coincide con ' + q }">
      <template #logo><a class="site-brand" href="#home"><img class="site-brand__logo site-brand__logo--light" :src="logo" alt=""><img class="site-brand__logo site-brand__logo--dark" :src="logoDark" alt=""><span class="site-brand__name">Grana</span></a></template>
    </g-sidebar>
  </template>
  <section v-if="isHome" class="banco-home vp-doc"><h1>Grana</h1><p>La librería trae la estructura; tu tema pone el color.</p><p v-for="n in 30" :key="n">Párrafo de relleno de la portada para poder desplazarla.</p></section>
  <template v-else>
    <div class="site-local">
      <button class="site-local__menu" type="button" aria-haspopup="dialog" @click="drawerOpen = true"><g-icon name="align-left"></g-icon>{{ T.menu }}</button>
      <banco-page-index class="site-local__index" id="pi-fold" fold :align="'start'" :items="page.items" :label="T.onPage" :labels="{ top: T.top }" v-model="section"></banco-page-index>
    </div>
    <div class="site-doc"><div class="site-doc__inner">
      <article class="site-content">
        <div class="vp-doc">
          <h1 tabindex="-1">{{ page.h1 }}</h1>
          <template v-for="(it, i) in page.items" :key="it.id">
            <h2 v-if="it.level === 2" :id="it.id">{{ it.label }}</h2><h3 v-else :id="it.id">{{ it.label }}</h3>
            <p>{{ filler(it, i) }}</p>
          </template>
        </div>
        <nav class="site-pager" aria-label="Páginas vecinas"><div class="site-pager__list">
          <g-card v-if="PAGER[P][0]" class="site-pager__card" href="#prev"><span class="site-pager__label">{{ T.prev }}</span><span class="site-pager__title">{{ PAGER[P][0] }}</span></g-card>
          <g-card v-if="PAGER[P][1]" class="site-pager__card is-next" href="#next"><span class="site-pager__label">{{ T.next }}</span><span class="site-pager__title">{{ PAGER[P][1] }}</span></g-card>
        </div></nav>
      </article>
      <aside class="site-aside"><div class="site-aside__inner">
        <banco-page-index id="pi-list" :items="page.items" :label="T.onPage" :labels="{ top: T.top }" v-model="section"></banco-page-index>
      </div></aside>
    </div></div>
  </template>
  <template v-if="isHome" #footer><p class="site-footer">{{ T.footer }}</p></template>
</g-app-shell>
<div class="g-combobox g-combobox--appearance-command" id="search">
  <dialog ref="search" class="g-dialog g-dialog--bare g-dialog--size-lg g-dialog--mobile-sheet g-combobox-surface" :class="narrow ? 'g-combobox-surface--sheet' : 'g-combobox-surface--command'" id="search-surface" :aria-label="T.searchAria" @click.self="search.close()">
    <div class="g-dialog__body">
      <div class="g-combobox__search">
        <span class="g-combobox__search-icon" aria-hidden="true"><g-icon name="search"></g-icon></span>
        <input class="g-combobox__search-field" role="combobox" aria-expanded="true" aria-controls="search-list" aria-labelledby="search-surface" aria-autocomplete="list" v-model="term" placeholder="Buscar en la documentación">
      </div>
      <div class="g-combobox__surface-body"><div class="g-combobox__panel">
        <ul class="g-combobox__list" id="search-list" role="listbox" :aria-label="T.searchAria">
          <li v-for="r in results" :key="r.id" class="g-combobox__option" role="option" :aria-selected="'false'">
            <div class="g-summary g-summary--layout-row"><span class="g-summary__title" v-html="mark(r.label)"></span><span class="g-summary__fact-value" style="display:block;color:var(--g-color-text-muted)" v-html="mark(r.frag)"></span></div>
          </li>
        </ul>
      </div></div>
      <div class="g-combobox__hints"><span><kbd><g-icon name="arrow-up"></g-icon></kbd><kbd><g-icon name="arrow-down"></g-icon></kbd>para moverte</span><span><kbd>Intro</kbd>para elegir</span><span><kbd>esc</kbd>para cerrar</span></div>
    </div>
  </dialog>
</div>`
  })
  app.use(Grana.default || Grana)
  app.use(icons)
  app.use(GranaAppShell.default || GranaAppShell)
  app.use(GranaSidebarFilter.default || GranaSidebarFilter)
  window.__marco = app.mount('#app')
})()
