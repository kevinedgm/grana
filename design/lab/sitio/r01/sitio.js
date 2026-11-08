// Prototipo de kiwi (r01) del MARCO del sitio de documentación. No es el Layout.vue de VitePress ni un componente:
// es un banco para decidir estructura e identidad. Usa componentes REALES de dist/ (GAppShell, GSidebar, GPageHeader,
// GBreadcrumbs, GCombobox, GMenu, GBtn, GBadge, GIcon, GContainer) con Vue global y los tokens reales del tema por
// defecto. Lo que no existe como componente (filtro del índice, estaciones, mesa) es del prototipo, en sitio.css.
// ?c=A|B|C  &p=comp|home|guide  &theme=dark  &lang=en  &q=<filtro de A>  &mesa=0|1 (C)
;(function () {
  const { createApp, h, ref, computed, watch, onMounted, onBeforeUnmount, nextTick } = Vue
  const Q = new URLSearchParams(location.search)
  const C = ['A', 'B', 'C'].includes(Q.get('c')) ? Q.get('c') : 'A'
  const P = ['comp', 'home', 'guide'].includes(Q.get('p')) ? Q.get('p') : 'comp'
  const LANG = Q.get('lang') === 'en' ? 'en' : 'es'
  document.documentElement.lang = LANG
  const D = window.SITIO_DATOS

  // ---------- Iconos: solo Lucide (design/lab/lucide-icons.js) ----------
  const NAMES = ['search', 'menu', 'panel-left', 'chevron-down', 'chevron-right', 'chevron-left', 'globe', 'external-link', 'flag', 'diamond',
    'list', 'users', 'activity', 'settings', 'target', 'refresh-cw', 'folder', 'file-text', 'paperclip', 'x', 'copy', 'arrow-right', 'split', 'check', 'chevrons-up-down']
  const icons = Grana.createIcons(NAMES.map((n) => `<svg class="lucide lucide-${n}" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${window.LUCIDE_ICONS[n]}</svg>`))

  // ---------- Textos (es/en; la interfaz del marco, no el contenido) ----------
  const T = {
    es: {
      skip: 'Saltar al contenido', nav: 'Documentación', onPage: 'En esta página', filter: 'Filtrar el índice', filterPh: 'Nombre o número', filterHint: '/',
      count: (n, t) => `${n} de ${t} páginas`, none: (q) => `Ningún título con «${q}»`, inText: 'En el texto', search: 'Buscar en la documentación', searchPh: 'Buscar',
      dark: 'Tema oscuro', lang: 'Idioma', version: 'Versión 0.1.0-beta.0', beta: 'beta', menu: 'Abrir el índice', close: 'Cerrar', drawer: 'Índice de la documentación',
      collapse: 'Contraer el índice', expand: 'Expandir el índice', more: 'Más', moreActive: 'contiene la página actual', copy: 'Copiar importación', actions: 'Acciones de la página',
      start: 'Empezar', components: 'Componentes', blocks: 'Blocks', tools: 'Herramientas', project: 'Proyecto', crumbs: 'Ruta', up: 'Subir a {label}', path: 'Ruta hasta {label}', doors: 'Otras páginas en {label}',
      pin: (s) => `Fijar «${s}» en la mesa`, unpin: (s) => `Quitar «${s}» de la mesa`, mesa: 'Mesa de consulta', mesaBtn: 'Mesa', open: 'Abrir en su página', mesaEmpty: 'Fija aquí una tabla de props, un atajo o un token mientras lees otra página. La mesa te acompaña al navegar.',
      footer: 'Licencia MIT. Iconos de Lucide (ISC). Fuente Instrument Sans (SIL OFL).', prev: 'Anterior', next: 'Siguiente', station: 'Estación'
    },
    en: {
      skip: 'Skip to content', nav: 'Documentation', onPage: 'On this page', filter: 'Filter the index', filterPh: 'Name or number', filterHint: '/',
      count: (n, t) => `${n} of ${t} pages`, none: (q) => `No title with “${q}”`, inText: 'In the text', search: 'Search the docs', searchPh: 'Search',
      dark: 'Dark theme', lang: 'Language', version: 'Version 0.1.0-beta.0', beta: 'beta', menu: 'Open the index', close: 'Close', drawer: 'Documentation index',
      collapse: 'Collapse the index', expand: 'Expand the index', more: 'More', moreActive: 'contains the current page', copy: 'Copy import', actions: 'Page actions',
      start: 'Get started', components: 'Components', blocks: 'Blocks', tools: 'Tools', project: 'Project', crumbs: 'Path', up: 'Up to {label}', path: 'Path to {label}', doors: 'Other pages in {label}',
      pin: (s) => `Pin “${s}” to the desk`, unpin: (s) => `Remove “${s}” from the desk`, mesa: 'Reference desk', mesaBtn: 'Desk', open: 'Open on its page', mesaEmpty: 'Pin a props table, a shortcut or a token here while you read another page. The desk follows you.',
      footer: 'MIT License. Lucide icons (ISC). Instrument Sans font (SIL OFL).', prev: 'Previous', next: 'Next', station: 'Station'
    }
  }[LANG]

  // ---------- Índice (datos reales del sitio, instantánea en datos.js) ----------
  const pad = (n) => String(n).padStart(2, '0')
  const GUIDE_ICON = { 'getting-started': 'flag', theming: 'diamond', utilities: 'list', accessibility: 'users', personality: 'activity', cli: 'settings', playground: 'target', changelog: 'refresh-cw', project: 'folder' }
  const START = ['getting-started', 'theming', 'utilities', 'accessibility', 'personality']
  const TOOLS = ['cli', 'playground']
  const PROJ = ['changelog', 'project']
  const gItem = (slug) => { const g = D.guide.find((x) => x.slug === slug); return { id: 'g-' + slug, label: g.label, href: '#', ico: GUIDE_ICON[slug] } }
  const ALL_COMPONENTS = D.groups.flatMap((g) => g.items.map((i) => ({ ...i, group: g.label })))
  const CURRENT = ALL_COMPONENTS.find((c) => c.name === 'GCombobox')
  const CUR_GROUP = D.groups.find((g) => g.label === CURRENT.group)
  const activeId = P === 'comp' ? 'c-' + CURRENT.slug : P === 'guide' ? 'g-theming' : null

  function buildNav (q) {
    const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    const nq = norm(q.trim())
    const isNum = /^\d{1,2}$/.test(nq)
    const hit = (label, n) => !nq || (isNum ? n === Number(nq) || pad(n).startsWith(nq) : norm(label).includes(nq) || norm(label.replace(/^G/, '')).startsWith(nq))
    const groups = []
    const push = (label, items) => { if (items.length) groups.push({ label, items }) }
    push(T.start, START.map(gItem).filter((i) => !isNum && hit(i.label)))
    for (const g of D.groups) push(`${g.label}`, g.items.filter((i) => hit(i.name, i.n)).map((i) => ({ id: 'c-' + i.slug, label: i.name, href: '#', num: i.n })))
    push(T.blocks, D.blocks.filter((b) => !isNum && hit(b.label)).map((b) => ({ id: 'b-' + b.label, label: b.label, href: '#', ico: 'folder' })))
    push(T.tools, TOOLS.map(gItem).filter((i) => !isNum && hit(i.label)))
    push(T.project, PROJ.map(gItem).filter((i) => !isNum && hit(i.label)))
    const total = 5 + ALL_COMPONENTS.length + D.blocks.length + TOOLS.length + PROJ.length
    const shown = groups.reduce((s, g) => s + g.items.length, 0)
    return { groups, total, shown }
  }

  // Coincidencias en el texto (simuladas: en el sitio saldrían del índice local de VitePress, MiniSearch)
  const TEXT_HITS = [
    { id: 't-1', label: 'GCombobox · Props · filter', href: '#sec-api', words: 'filter filtro props combobox' },
    { id: 't-2', label: 'GSelect · Teclado · Tab elige', href: '#', words: 'tab teclado elige select' },
    { id: 't-3', label: 'Tematización · Modo oscuro', href: '#', words: 'oscuro dark tema theming' },
    { id: 't-4', label: 'GForm · Errores al enviar', href: '#', words: 'errores enviar form submit' },
    { id: 't-5', label: 'GTable · Filas por página', href: '#', words: 'filas pagina table paginacion' }
  ]

  // ---------- Secciones de la ficha (estaciones de contrato §3: el número es el del contrato de documentación) ----------
  const SECTIONS = [
    { id: 'sec-ficha', st: 4, label: 'Prueba en vivo' },
    { id: 'sec-uso', st: 6, label: 'Ejemplos' },
    { id: 'sec-api', st: 7, label: 'API' },
    { id: 'sec-teclado', st: 8, label: 'Teclado y foco' },
    { id: 'sec-a11y', st: 9, label: 'Accesibilidad' },
    { id: 'sec-pers', st: 10, label: 'Personalidad' },
    { id: 'sec-tema', st: 11, label: 'Tema' },
    { id: 'sec-alcance', st: 12, label: 'Alcance' },
    { id: 'sec-verif', st: 13, label: 'Verificación' }
  ]
  const GUIDE_SECTIONS = [
    { id: 'sec-g1', st: 1, label: 'Qué pone el tema' }, { id: 'sec-g2', st: 2, label: 'Configuración con @grana/cli' },
    { id: 'sec-g3', st: 3, label: 'Modo oscuro' }, { id: 'sec-g4', st: 4, label: 'Tema por región' }, { id: 'sec-g5', st: 5, label: 'Comprobar el contraste' }
  ]
  const PAGE_SECTIONS = P === 'guide' ? GUIDE_SECTIONS : P === 'comp' ? SECTIONS : []

  // ---------- Opciones de la búsqueda (paleta de B y C) ----------
  const SEARCH_OPTIONS = [
    { label: T.components, options: ALL_COMPONENTS.map((c) => ({ value: 'c:' + c.slug, code: pad(c.n), label: c.name, kind: 'comp', facts: [{ label: 'Grupo', value: c.group, priority: 2 }, { label: 'Estado', value: c.status || '—', priority: 1 }] })) },
    { label: 'Secciones', options: [
      { value: 's:combobox-api', code: '§7', label: 'GCombobox · API', description: 'Props, eventos y slots' },
      { value: 's:combobox-kb', code: '§8', label: 'GCombobox · Teclado y foco', description: 'Intro, Tab, Esc y la superficie' },
      { value: 's:select-kb', code: '§8', label: 'GSelect · Teclado y foco', description: 'Tab elige si moviste la activa' },
      { value: 's:form-a11y', code: '§9', label: 'GForm · Accesibilidad', description: 'Resumen de errores y foco al enviar' }
    ] },
    { label: 'Guías', options: D.guide.map((g) => ({ value: 'g:' + g.slug, label: g.label, description: 'Guía', icon: GUIDE_ICON[g.slug] })) }
  ]

  // ---------- Mesa de C (sessionStorage; persiste al navegar) ----------
  const MESA_SEED = [
    { id: 'm-form-kb', title: 'GForm · §8 Teclado y foco', from: 'GForm', rows: [['Intro', 'Envía; con errores, foco al resumen'], ['Esc', 'Nada (no es un diálogo)']] },
    { id: 'm-accent', title: 'Tema · --g-color-accent', from: 'Tematización', rows: [['claro', '#0B63CE'], ['oscuro', '#3383F0']] }
  ]

  const mq = (s) => window.matchMedia(s)

  const app = createApp({
    setup () {
      const dark = ref(document.documentElement.dataset.theme === 'dark')
      watch(dark, (v) => document.documentElement.setAttribute('data-theme', v ? 'dark' : 'light'))
      const narrow = ref(mq('(max-width: 767px)').matches)
      const navMode = ref('expanded')
      const drawerOpen = ref(false)
      const collapsed = ref(false)
      const filter = ref(Q.get('q') || '')
      const nav = computed(() => buildNav(filter.value))
      const textHits = computed(() => {
        const q = filter.value.trim().toLowerCase()
        if (q.length < 3 || /^\d+$/.test(q)) return []
        return TEXT_HITS.filter((t) => t.words.includes(q) || t.label.toLowerCase().includes(q))
      })
      const navItems = computed(() => {
        const g = nav.value.groups.slice()
        if (C === 'A' && textHits.value.length) g.push({ label: T.inText, items: textHits.value.map((t) => ({ ...t, ico: 'file-text' })) })
        return g
      })
      const announce = ref('')
      let annT = 0
      watch(filter, (q) => {
        clearTimeout(annT)
        annT = setTimeout(() => { announce.value = !q.trim() ? '' : nav.value.shown ? T.count(nav.value.shown, nav.value.total) : T.none(q.trim()) }, 600)
      })
      const current = ref(PAGE_SECTIONS[0] && PAGE_SECTIONS[0].id)
      const currentSection = computed(() => PAGE_SECTIONS.find((s) => s.id === current.value) || PAGE_SECTIONS[0])
      const outlineItems = computed(() => PAGE_SECTIONS.map((s) => ({ id: s.id, label: (C === 'B' ? `§${s.st}  ` : '') + s.label, href: '#' + s.id, current: s.id === current.value })))
      const searchModel = ref(null)
      const onPick = (v) => { searchModel.value = v; nextTick(() => { searchModel.value = null }); if (v && v.startsWith('s:combobox')) location.hash = v.endsWith('kb') ? 'sec-teclado' : 'sec-api' }
      // Mesa (C)
      let stored = null
      try { stored = JSON.parse(sessionStorage.getItem('sitio-r01-mesa') || 'null') } catch {}
      const mesa = ref(stored || (Q.get('mesa') === '0' ? [] : MESA_SEED.slice()))
      watch(mesa, (v) => { try { sessionStorage.setItem('sitio-r01-mesa', JSON.stringify(v)) } catch {} }, { deep: true })
      const mesaOpen = ref(Q.get('mesa') !== '0')
      const mesaSheet = ref(false)
      const pinned = (id) => mesa.value.some((m) => m.id === 'p-' + id)
      const togglePin = (s) => {
        const id = 'p-' + s.id
        if (pinned(s.id)) mesa.value = mesa.value.filter((m) => m.id !== id)
        else mesa.value = [{ id, title: `GCombobox · §${s.st} ${s.label}`, from: 'GCombobox', rows: s.id === 'sec-api' ? [['appearance', "'field' | 'palette'"], ['filter', 'Boolean = true'], ['labels', 'Object (sin defecto)']] : [['…', 'extracto de la sección']] }, ...mesa.value]
      }
      // `/` abre la búsqueda (fuera de un campo editable); Esc lo resuelve cada pieza
      const onKey = (e) => {
        if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
        const t = e.target
        if (t.closest && t.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]')) return
        e.preventDefault()
        if (C === 'A') {
          if (narrow.value) { drawerOpen.value = true; nextTick(() => setTimeout(() => document.querySelector('dialog[open] .sx-filter__input')?.focus(), 60)) } else document.querySelector('.sx-filter__input')?.focus()
        } else document.querySelector('.sx-search input')?.focus()
      }
      // Lectura: la sección actual sigue al desplazamiento (la que cruza la línea de lectura, un tercio del visor)
      let io = null
      const onScroll = () => {
        const line = window.innerHeight / 3
        let id = PAGE_SECTIONS[0] && PAGE_SECTIONS[0].id
        for (const s of PAGE_SECTIONS) { const el = document.getElementById(s.id); if (el && el.getBoundingClientRect().top <= line) id = s.id }
        current.value = id
      }
      const onResize = () => { narrow.value = mq('(max-width: 767px)').matches }
      onMounted(() => {
        document.addEventListener('keydown', onKey)
        window.addEventListener('scroll', onScroll, { passive: true })
        window.addEventListener('resize', onResize)
        onScroll()
        window.__sx = { ready: true, get current () { return current.value }, get shown () { return nav.value.shown }, get mesa () { return mesa.value.length } }
      })
      onBeforeUnmount(() => { document.removeEventListener('keydown', onKey); window.removeEventListener('scroll', onScroll); if (io) io.disconnect() })

      const crumbs = computed(() => {
        if (P === 'home') return []
        if (P === 'guide') return [{ label: 'Grana', href: '#' }, { label: T.start, href: '#', children: [{ label: T.start, href: '#' }, { label: T.components, href: '#' }, { label: T.blocks, href: '#' }, { label: T.tools, href: '#' }] }, { label: 'Tematización', children: START.map((s) => ({ label: gItem(s).label, href: '#' })) }]
        return [
          { label: T.components, href: '#', children: D.groups.map((g) => ({ label: g.label, href: '#' })) },
          { label: CUR_GROUP.label, href: '#', children: CUR_GROUP.items.map((i) => ({ label: `${pad(i.n)} ${i.name}`, href: '#' })) },
          { label: CURRENT.name }
        ]
      })
      const langItems = [
        { id: 'es', label: 'Español', lang: 'es', hreflang: 'es', href: '?' + new URLSearchParams({ ...Object.fromEntries(Q), lang: 'es' }), current: LANG === 'es' },
        { id: 'en', label: 'English', lang: 'en', hreflang: 'en', href: '?' + new URLSearchParams({ ...Object.fromEntries(Q), lang: 'en' }), current: LANG === 'en' }
      ]
      return { C, P, T, D, pad, dark, narrow, navMode, drawerOpen, collapsed, filter, nav, navItems, textHits, announce, current, currentSection, outlineItems, PAGE_SECTIONS, SECTIONS,
        CURRENT, CUR_GROUP, ALL_COMPONENTS, activeId, crumbs, langItems, SEARCH_OPTIONS, searchModel, onPick, mesa, mesaOpen, mesaSheet, pinned, togglePin, START, gItem }
    },
    template: `
<g-app-shell :labels="{ skip: T.skip }" :class="'sx sx--' + C + ' sx--p-' + P" :data-narrow="narrow ? '' : undefined">
  <template #header>
    <div class="sx-band">
      <g-btn v-if="C !== 'B' && narrow" class="sx-menu" variant="ghost" color="neutral" icon :aria-label="T.menu" @click="drawerOpen = true"><g-icon name="menu"></g-icon></g-btn>
      <a v-if="C === 'B' || narrow" class="sx-brand" href="?"><img :src="dark ? '../../../../site/public/logo-dark.svg' : '../../../../site/public/logo.svg'" alt="" class="sx-brand__logo"><span>Grana</span></a>
      <g-badge v-if="!narrow" class="sx-version" variant="outline" color="neutral" size="sm" :label="T.version">0.1.0 · {{ T.beta }}</g-badge>
      <g-breadcrumbs v-if="crumbs.length && !narrow" class="sx-crumbs" :items="crumbs" :labels="{ nav: T.crumbs, up: T.up, path: T.path, children: T.doors }" @navigate="$event.event && $event.event.preventDefault()"></g-breadcrumbs>
      <span v-if="C === 'A' || !narrow" class="sx-band__gap"></span>
      <div v-if="C !== 'A'" class="sx-search">
        <g-combobox appearance="palette" :aria-label="T.search" :placeholder="T.searchPh + '…'" aria-keyshortcuts="/" :options="SEARCH_OPTIONS" :model-value="searchModel" @update:model-value="onPick"
          :labels="{ close: T.close, noResults: 'Sin resultados para «{text}»', results: (n) => n + ' resultados', partial: (n, t) => n + ' de ' + t + ' resultados', more: 'Mostrar más ({shown} de {total})', loading: 'Buscando…', preview: 'Vista previa', previewEmpty: 'Mueve la selección para ver la ficha' }">
          <template #prepend><g-icon name="search"></g-icon></template>
        </g-combobox>
        <kbd v-if="!narrow" class="sx-kbd" aria-hidden="true">/</kbd>
      </div>
      <g-btn v-if="C === 'A' && narrow" variant="ghost" color="neutral" icon :aria-label="T.filter" @click="drawerOpen = true"><g-icon name="search"></g-icon></g-btn>
      <g-btn v-if="C === 'C' && !narrow" class="sx-mesa-btn" variant="ghost" color="neutral" :aria-expanded="String(mesaOpen)" aria-controls="sx-mesa" @click="mesaOpen = !mesaOpen">
        <template #prepend><g-icon name="split"></g-icon></template>{{ T.mesaBtn }}<template #append><span class="sx-count">{{ mesa.length }}</span></template>
      </g-btn>
      <g-menu :items="langItems" :label="T.lang" align="end">
        <template #trigger="{ attrs }"><g-btn v-if="narrow" v-bind="attrs" variant="ghost" color="neutral" icon :aria-label="T.lang + ': ' + (LANG === 'en' ? 'English' : 'Español')"><g-icon name="globe"></g-icon></g-btn><g-btn v-else v-bind="attrs" variant="ghost" color="neutral"><template #prepend><g-icon name="globe"></g-icon></template>{{ LANG === 'en' ? 'English' : 'Español' }}</g-btn></template>
      </g-menu>
      <g-btn v-if="narrow" class="sx-theme" variant="ghost" color="neutral" icon :aria-label="T.dark" :aria-pressed="String(dark)" @click="dark = !dark"><span class="sx-theme__dot" aria-hidden="true"></span></g-btn>
      <g-btn v-else class="sx-theme" variant="ghost" color="neutral" :aria-pressed="String(dark)" @click="dark = !dark"><template #prepend><span class="sx-theme__dot" aria-hidden="true"></span></template>{{ T.dark }}</g-btn>
    </div>
  </template>

  <template v-if="C !== 'B'" #nav>
    <g-sidebar :model-value="activeId" v-model:open="drawerOpen" v-model:collapsed="collapsed" :items="navItems" :label="T.nav" :mode="narrow ? 'drawer' : (C === 'C' ? 'rail' : 'expanded')" mobile="drawer"
      :overlay="C === 'C'" :search="C === 'A'" density="compact" :labels="{ collapse: T.collapse, expand: T.expand, more: T.more, moreActive: T.moreActive, drawer: T.drawer, close: T.close, search: T.filter }"
      @navigate="$event.event && $event.event.preventDefault()">
      <template #logo="{ collapsed }"><a class="sx-brand" href="?"><img :src="dark ? '../../../../site/public/logo-dark.svg' : '../../../../site/public/logo.svg'" alt="" class="sx-brand__logo"><span v-if="!collapsed">Grana</span></a></template>
      <template #toggle-icon><g-icon name="panel-left"></g-icon></template>
      <template v-if="C === 'A'" #search>
        <div class="sx-filter">
          <label class="sx-filter__box">
            <span class="sx-sr">{{ T.filter }}</span>
            <g-icon name="search" class="sx-filter__icon"></g-icon>
            <input class="sx-filter__input" type="search" v-model="filter" :placeholder="T.filterPh" autocomplete="off" spellcheck="false" enterkeyhint="go"
              aria-describedby="sx-filter-count" @keydown.esc="filter ? (filter = '', $event.stopPropagation()) : null">
            <kbd v-if="!filter" class="sx-kbd" aria-hidden="true">/</kbd>
          </label>
          <p id="sx-filter-count" class="sx-filter__count" :class="{ 'is-empty': filter && !nav.shown }">{{ filter ? (nav.shown ? T.count(nav.shown, nav.total) : T.none(filter.trim())) : T.count(nav.total, nav.total) }}</p>
          <div class="sx-sr" role="status" aria-live="polite">{{ announce }}</div>
        </div>
      </template>
      <template #icon="{ item }"><span v-if="item.num" class="sx-num">{{ pad(item.num) }}</span><g-icon v-else-if="item.ico" :name="item.ico"></g-icon></template>
    </g-sidebar>
  </template>

  <div class="sx-frame" :class="{ 'has-rail': C === 'B' && P !== 'home' && !narrow, 'has-mesa': C === 'C' && mesaOpen && !narrow }">
    <!-- B · estaciones: el índice de la página es la navegación principal de la página -->
    <nav v-if="C === 'B' && P !== 'home' && !narrow" class="sx-stations" :aria-label="T.onPage">
      <ol class="sx-stations__list">
        <li v-for="s in PAGE_SECTIONS" :key="s.id">
          <a class="sx-station" :href="'#' + s.id" :aria-current="s.id === current ? 'location' : undefined"><span class="sx-station__n">{{ P === 'comp' ? '§' + s.st : pad(s.st) }}</span><span class="sx-station__l">{{ s.label }}</span></a>
        </li>
      </ol>
    </nav>

    <div class="sx-page">
      <!-- Portada -->
      <template v-if="P === 'home'">
        <section class="sx-hero" aria-labelledby="sx-h1">
          <p class="sx-eyebrow">Componentes Vue 3 · tema por tokens</p>
          <h1 id="sx-h1" class="sx-display">La librería trae la estructura;<br>tu tema pone el color.</h1>
          <div class="sx-hero__cta"><g-btn href="#">Empezar</g-btn><g-btn href="#" variant="outline" color="neutral">npm i @grana/vue</g-btn></div>
        </section>
        <section v-if="C === 'B'" class="sx-catalog" aria-labelledby="sx-cat">
          <h2 id="sx-cat" class="sx-h2">{{ ALL_COMPONENTS.length }} componentes</h2>
          <div v-for="g in D.groups" :key="g.label" class="sx-catalog__group">
            <h3 class="sx-catalog__title">{{ g.label }} <span class="sx-muted">{{ pad(g.items[0].n) }}–{{ pad(g.items[g.items.length - 1].n) }}</span></h3>
            <ul class="sx-catalog__list">
              <li v-for="i in g.items" :key="i.slug"><a href="#" class="sx-tile"><span class="sx-tile__n">{{ pad(i.n) }}</span><span class="sx-tile__name">{{ i.name }}</span></a></li>
            </ul>
          </div>
        </section>
        <section v-else class="sx-starts" aria-label="Empezar">
          <a v-for="s in START.slice(0, 3)" :key="s" href="#" class="sx-start"><g-icon :name="gItem(s).ico"></g-icon><span>{{ gItem(s).label }}</span><g-icon name="arrow-right"></g-icon></a>
        </section>
      </template>

      <!-- Guía y ficha -->
      <g-container v-else width="full" gutter="none">
        <g-page-header :title="P === 'comp' ? CURRENT.name : 'Tematización'" :eyebrow="P === 'comp' ? 'Componente ' + pad(CURRENT.n) + ' · ' + CUR_GROUP.label : 'Guía'"
          :description="P === 'comp' ? 'Búsqueda con resultados de la aplicación: el campo se abre, o una paleta con vista previa. El color lo pone tu tema.' : 'Qué pone tu tema, cómo se deriva con @grana/cli y cómo se comprueba.'"
          :labels="{ actions: T.actions }">
          <template v-if="narrow" #trail><g-breadcrumbs :items="crumbs" :labels="{ nav: T.crumbs, up: T.up, path: T.path, children: T.doors }" @navigate="$event.event && $event.event.preventDefault()"></g-breadcrumbs></template>
          <template v-if="P === 'comp'" #meta>
            <g-badge color="success" variant="soft" size="sm">candidate</g-badge>
            <code class="sx-code">import { GCombobox } from '@grana/vue/combobox'</code>
          </template>
          <template v-if="C === 'A' || narrow" #actions="{ narrow: n }">
            <g-menu :items="outlineItems" :label="T.onPage">
              <template #trigger="{ attrs }"><g-btn v-bind="attrs" variant="outline" color="neutral" class="sx-relay"><span class="sx-relay__k">{{ T.onPage }} ·</span> <span class="sx-relay__v">{{ C === 'B' && P === 'comp' ? '§' + currentSection.st + ' ' : '' }}{{ currentSection.label }}</span><template #append><g-icon name="chevrons-up-down"></g-icon></template></g-btn></template>
            </g-menu>
            <g-btn v-if="P === 'comp' && !n" variant="ghost" color="neutral"><template #prepend><g-icon name="copy"></g-icon></template>{{ T.copy }}</g-btn>
          </template>
        </g-page-header>

        <nav v-if="C === 'C' && !narrow" class="sx-inline-toc" :aria-label="T.onPage">
          <span class="sx-inline-toc__k" aria-hidden="true">{{ T.onPage }}</span>
          <ul><li v-for="s in PAGE_SECTIONS" :key="s.id"><a :href="'#' + s.id" :aria-current="s.id === current ? 'location' : undefined">{{ s.label }}</a></li></ul>
        </nav>

        <div class="sx-content">
          <section v-for="(s, i) in PAGE_SECTIONS" :key="s.id" :id="s.id" class="sx-sec" :aria-labelledby="s.id + '-h'">
            <div class="sx-sec__head">
              <h2 :id="s.id + '-h'" class="sx-h2"><span v-if="C === 'B'" class="sx-h2__n">{{ P === 'comp' ? '§' + s.st : pad(s.st) }}</span>{{ s.label }}</h2>
              <g-btn v-if="C === 'C'" size="sm" variant="ghost" color="neutral" icon :aria-pressed="String(pinned(s.id))" :aria-label="pinned(s.id) ? T.unpin(s.label) : T.pin(s.label)" @click="togglePin(s)"><g-icon name="paperclip"></g-icon></g-btn>
            </div>
            <template v-if="P === 'comp' && s.id === 'sec-ficha'">
              <div class="sx-ficha">
                <div class="sx-ficha__stage">
                  <g-combobox label="Diagnóstico principal" :options="[{ value: 'E11.9', code: 'E11.9', label: 'Diabetes tipo 2 sin complicaciones' }, { value: 'I10', code: 'I10', label: 'Hipertensión esencial' }]"
                    :labels="{ close: 'Cerrar', noResults: 'Sin resultados para «{text}»', results: (n) => n + ' resultados', loading: 'Buscando…' }"></g-combobox>
                </div>
                <dl class="sx-ficha__reads">
                  <div><dt>Fondo</dt><dd><code class="sx-code">--g-color-surface</code></dd></div>
                  <div><dt>Texto</dt><dd><code class="sx-code">--g-color-text</code></dd></div>
                  <div><dt>Borde</dt><dd><code class="sx-code">--g-color-border-control</code></dd></div>
                  <div><dt>Radio</dt><dd><code class="sx-code">--g-radius-shape</code></dd></div>
                </dl>
              </div>
            </template>
            <template v-else-if="P === 'comp' && s.id === 'sec-api'">
              <div class="sx-table-wrap" tabindex="-1">
                <table class="sx-table">
                  <thead><tr><th scope="col">Prop</th><th scope="col">Tipo y defecto</th><th scope="col">Qué hace</th></tr></thead>
                  <tbody>
                    <tr><td><code class="sx-code">appearance</code></td><td><code class="sx-code">'field' | 'palette' = 'field'</code></td><td>El campo se abre o una paleta con vista previa.</td></tr>
                    <tr><td><code class="sx-code">options</code></td><td><code class="sx-code">Array = []</code></td><td>Opciones y grupos; la aplicación las entrega, sin <code class="sx-code">fetch</code>.</td></tr>
                    <tr><td><code class="sx-code">filter</code></td><td><code class="sx-code">Boolean = true</code></td><td>Filtro local; con <code class="sx-code">false</code> filtra la aplicación al recibir <code class="sx-code">search</code>.</td></tr>
                    <tr><td><code class="sx-code">labels</code></td><td><code class="sx-code">Object = {}</code></td><td>Textos, sin valores por defecto.</td></tr>
                  </tbody>
                </table>
              </div>
            </template>
            <template v-else-if="P === 'comp' && s.id === 'sec-teclado'">
              <table class="sx-table"><thead><tr><th scope="col">Tecla</th><th scope="col">Efecto</th></tr></thead>
                <tbody><tr><td><kbd class="sx-kbd">Intro</kbd></td><td>Elige la activa y cierra.</td></tr><tr><td><kbd class="sx-kbd">Tab</kbd></td><td>Sale sin elegir.</td></tr><tr><td><kbd class="sx-kbd">Esc</kbd></td><td>Cierra y conserva el texto.</td></tr></tbody></table>
            </template>
            <p class="sx-p">{{ i % 2 ? 'Frases cortas en segunda persona: pruébalo con Tab en la ficha. Cada ejemplo dice su porqué y nada de relleno; las cifras salen de la auditoría de coco con su nivel de evidencia.' : 'La documentación refleja su fuente y nunca la reemplaza. Lo reservado va como «Reservado» con su decisión, o no va. La página enseña el componente real y el código que lo produce.' }}</p>
            <p class="sx-p sx-muted">Texto de relleno para desplazar la página y probar que la sección actual sigue a la lectura.</p>
          </section>
          <nav class="sx-neighbors" aria-label="Páginas vecinas">
            <a href="#" class="sx-neighbor"><span class="sx-muted">← {{ T.prev }}</span><span>{{ P === 'comp' ? '23 GSelect' : 'Empezar' }}</span></a>
            <a href="#" class="sx-neighbor sx-neighbor--next"><span class="sx-muted">{{ T.next }} →</span><span>{{ P === 'comp' ? '25 GTimeField' : '@grana/cli' }}</span></a>
          </nav>
        </div>
      </g-container>
    </div>

    <!-- C · la mesa -->
    <aside v-if="C === 'C' && (narrow ? mesaSheet : mesaOpen)" id="sx-mesa" class="sx-mesa" :class="{ 'is-sheet': narrow }" :aria-label="T.mesa" tabindex="-1">
      <div class="sx-mesa__head"><h2 class="sx-mesa__title">{{ T.mesa }} <span class="sx-count">{{ mesa.length }}</span></h2>
        <g-btn v-if="narrow" size="sm" variant="ghost" color="neutral" icon :aria-label="T.close" @click="mesaSheet = false"><g-icon name="x"></g-icon></g-btn></div>
      <p v-if="!mesa.length" class="sx-p sx-muted">{{ T.mesaEmpty }}</p>
      <ul class="sx-mesa__list">
        <li v-for="m in mesa" :key="m.id" class="sx-pin">
          <div class="sx-pin__head"><h3 class="sx-pin__title">{{ m.title }}</h3>
            <g-btn size="sm" variant="ghost" color="neutral" icon :aria-label="T.unpin(m.title)" @click="mesa = mesa.filter((x) => x.id !== m.id)"><g-icon name="x"></g-icon></g-btn></div>
          <table class="sx-table sx-table--pin"><tbody><tr v-for="r in m.rows" :key="r[0]"><th scope="row"><code class="sx-code">{{ r[0] }}</code></th><td>{{ r[1] }}</td></tr></tbody></table>
          <a href="#" class="sx-pin__from">{{ T.open }} · {{ m.from }}</a>
        </li>
      </ul>
    </aside>
  </div>

  <div v-if="C === 'C' && narrow && P !== 'home'" class="sx-mesa-tab"><g-btn variant="solid" color="brand" :aria-expanded="String(mesaSheet)" aria-controls="sx-mesa" @click="mesaSheet = !mesaSheet"><template #prepend><g-icon name="split"></g-icon></template>{{ T.mesaBtn }} · {{ mesa.length }}</g-btn></div>
  <template #footer><p class="sx-footer">{{ T.footer }}</p></template>
</g-app-shell>`
  })
  app.use(Grana.default || Grana)
  app.use(icons)
  app.use(GranaAppShell.default || GranaAppShell)
  app.use(GranaPageHeader.default || GranaPageHeader)
  app.use(GranaCombobox.default || GranaCombobox)
  app.config.globalProperties.LANG = LANG
  app.mount('#app')
})()
