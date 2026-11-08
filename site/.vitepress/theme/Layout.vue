<script setup>
// Marco del sitio de documentación hecho con Grana: concepto A «El índice se escribe» (design/contracts/sitio-marco.md,
// DECISIONS.md #1034 a #1047; prototipo design/lab/sitio/r01/). Ya no pinta DefaultTheme.Layout: el chasis es
// GAppShell (banda · índice · página · pie), el índice es GSidebar con filtro y números estables, la cabecera es
// GPageHeader con GPageIndex (relevo) en sus acciones y el contenido va en GContainer. De VitePress solo se usa la API
// pública (Content, useData, useRoute, useRouter, onContentUpdated, withBase, inBrowser) y `@localSearchIndex` para
// «En el texto» (textSearch.js). Sin <style>: el CSS del marco es de coco (grana-site.css).
//
// `vp-raw` en el índice, la miga, el idioma y la cabecera: el router de VitePress escucha los clics en *captura* y
// cancela el de todo enlace interno antes que los componentes, así que GSidebar, GBreadcrumbs, GMenu y GPageIndex
// verían su `navigate` ya cancelado (el drawer no se cerraba y el relevo no llevaba el foco a la sección). Con
// `.vp-raw` VitePress no los toca: el marco navega con `router.go` desde su `navigate` y el relevo deja el salto a
// `#ancla` al navegador (con el `scroll-padding` de GAppShell) y lleva el foco a la sección.
//
// SSR e hidratación (§10): el primer render no lee matchMedia, location ni localStorage; supone el marco ancho
// (≥ 1024: índice expandido con la marca, banda con versión y miga). Lo estrecho se corrige al montar con `hidden`
// en los envoltorios marcados con `site-band__wide` / `site-band__narrow` / `site-band__brand`; coco puede adelantarlo
// con media queries en grana-site.css (mismas clases) para que tampoco cambie nada al montar en un teléfono.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Content, inBrowser, onContentUpdated, useData, useRoute, useRouter, withBase } from 'vitepress'
import siteData from '../../src/.site-data.json'
import { UI } from '../i18n.mjs'
import { useAppearance } from './appearance.js'
import { useTextSearch, textItems, wantsText } from './textSearch.js'
import { crumbsFor, findInNav, labelsByPath, routeId, twinPath, withBaseItems } from './frameNav.js'

const REPO_URL = 'https://github.com/kevinedgm/grana'
const NARROW = '(max-width: 767.98px)'

const { page, frontmatter, localeIndex, site } = useData()
const route = useRoute()
const router = useRouter()
const { mode: themeMode, isDark } = useAppearance()
const mounted = ref(false)
// El logo oscuro, solo tras montar (isDark del servidor es claro); coco puede adelantarlo con `.dark` en CSS.
const darkLogo = computed(() => mounted.value && isDark.value)

// ---------- Idioma y textos ----------
const locale = computed(() => (localeIndex.value === 'en' ? 'en' : 'es'))
const F = computed(() => UI[locale.value].frame)
const T = computed(() => UI[locale.value])
const base = computed(() => site.value.base)

// ---------- Estado del marco (cliente) ----------
const narrow = ref(false) // < 768: banda compacta y miga en el zócalo
const sidebarMode = ref('expanded') // lo decide GSidebar (mode="auto", cortes de 1024)
const drawerMode = computed(() => sidebarMode.value === 'drawer')
const drawerOpen = ref(false)
const query = ref('')
const sidebar = ref(null)
const header = ref(null)
const pageIndex = ref(null)

// ---------- Índice (GSidebar) ----------
const navGroups = computed(() => withBaseItems(siteData.nav[locale.value], withBase).map((g) => ({ ...g, anchorHref: g.anchor ? withBase(g.anchor) : undefined })))
const currentId = computed(() => routeId(route.path, base.value))
const current = computed(() => findInNav(siteData.nav[locale.value], currentId.value))

const { hits } = useTextSearch(query, localeIndex)
const pageLabels = computed(() => labelsByPath(siteData.nav[locale.value]))
const textHits = computed(() => {
  if (!wantsText(query.value) || !hits.value.length) return []
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const q = norm(query.value.trim())
  // Lo que el filtro ya deja ver (mismas reglas: etiqueta o palabras clave) no se repite en «En el texto».
  const visible = []
  for (const g of siteData.nav[locale.value]) for (const it of g.items) {
    const hit = (x) => norm(x.label).includes(q) || (x.keywords || []).some((k) => norm(k).includes(q))
    if (hit(it)) visible.push(it.label)
    for (const c of it.children || []) if (hit(c)) visible.push(c.label)
  }
  return textItems(hits.value, {
    visible,
    pageLabel: (path) => pageLabels.value.get(routeId(path, base.value))
  })
})
const sidebarItems = computed(() => {
  const groups = navGroups.value
  if (!textHits.value.length) return groups
  return [...groups, { id: 'g-text', label: F.value.inText, filterable: false, items: textHits.value }]
})
const sidebarLabels = computed(() => {
  const f = F.value
  const extra = () => (textHits.value.length ? f.inTextCount(textHits.value.length) : '')
  return {
    collapse: f.collapse, expand: f.expand, drawer: f.drawer, close: f.close, more: f.more, moreActive: f.moreActive,
    filter: f.filter, filterPlaceholder: f.filterPlaceholder, filterHint: f.filterHint, filterClear: f.filterClear,
    filterCount: (n, total) => [f.filterCount(n, total), extra()].filter(Boolean).join(' · '),
    filterNone: (q) => [f.filterNone(q), extra()].filter(Boolean).join('; ')
  }
})

function go(href) {
  drawerOpen.value = false
  router.go(href)
}
// El índice: con el evento cancelado, GSidebar no cierra el drawer ni emite update:modelValue (sidebar.md «Eventos»).
function onNavigate({ item, event }) {
  if (!item?.href || item.external) return
  event?.preventDefault()
  go(item.href)
}
function onLang({ item, event }) {
  if (!item?.href) return
  event?.preventDefault()
  router.go(item.href)
}
function onCrumb({ item, event }) {
  if (!item?.href) return
  event?.preventDefault()
  go(item.href)
}
function onMode({ mode }) {
  sidebarMode.value = mode
  if (mode !== 'drawer') drawerOpen.value = false
}
function openDrawer() {
  drawerOpen.value = true
}
function focusFilter() {
  sidebar.value?.focusFilter()
}

// ---------- Banda: marca, versión, miga, idioma y tema ----------
const homeHref = computed(() => withBase(locale.value === 'en' ? '/en/' : '/'))
const logoLight = withBase('/logo.svg')
const logoDark = withBase('/logo-dark.svg')
const crumbLabels = computed(() => ({ nav: F.value.crumbs, up: F.value.up, path: F.value.path, children: F.value.doors }))
const crumbs = computed(() =>
  page.value.isNotFound || frontmatter.value.layout === 'home'
    ? []
    : crumbsFor(navGroups.value, currentId.value, {
        componentsLabel: T.value.pages['components/'],
        componentsHref: withBase(locale.value === 'en' ? '/en/components/' : '/components/'),
        blocksLabel: T.value.pages['blocks/']
      })
)
const LANGS = [
  { id: 'es', label: 'Español' },
  { id: 'en', label: 'English' }
]
const langItems = computed(() =>
  LANGS.map((l) => ({
    id: l.id, label: l.label, lang: l.id, hreflang: l.id,
    href: withBase(twinPath(route.path, base.value, l.id)),
    current: l.id === locale.value ? 'page' : undefined
  }))
)
const langOpen = ref(false)
const themeMenuOpen = ref(false)
const langName = computed(() => LANGS.find((l) => l.id === locale.value).label)
const themeOptions = computed(() => [
  { value: 'auto', label: F.value.themeSystem, icon: 'monitor' },
  { value: 'light', label: F.value.themeLight, icon: 'sun' },
  { value: 'dark', label: F.value.themeDark, icon: 'moon' }
])
const themeMenuItems = computed(() => themeOptions.value.map((o) => ({ type: 'radio', id: o.value, label: o.label, icon: o.icon, checked: themeMode.value === o.value })))
const themeIcon = computed(() => themeOptions.value.find((o) => o.value === themeMode.value)?.icon ?? 'monitor')
const themeName = computed(() => `${F.value.theme}: ${themeOptions.value.find((o) => o.value === themeMode.value)?.label}`)
function onThemeSelect({ id }) {
  themeMode.value = id
}

// ---------- Página ----------
const isHome = computed(() => frontmatter.value.layout === 'home')
const isNotFound = computed(() => !!page.value.isNotFound)
const comp = computed(() => frontmatter.value.component || null)
const eyebrow = computed(() => {
  const c = comp.value
  if (c?.code) return F.value.componentEyebrow(c.code, c.group)
  if (c) return F.value.blockEyebrow(c.group)
  return current.value?.parent?.label ?? current.value?.group?.label ?? undefined
})
const STATUS_COLOR = { candidate: 'success', draft: 'warning', stable: 'brand' }
const sections = computed(() => (page.value.headers || []).filter((h) => h.level === 2 && h.slug).map((h) => ({ id: h.slug, label: h.title })))
// Gestos de los elementos-enlace de GMenu (#577: abrir en otra pestaña, copiar el enlace), en el índice y en el idioma.
const linkGestures = computed(() => ({ opened: F.value.opened, openedLive: F.value.openedLive, copied: F.value.copied, copiedLive: F.value.copiedLive }))
const pageIndexLabels = computed(() => ({ findHint: F.value.findHint, matches: F.value.matches, matchesOne: F.value.matchesOne, none: F.value.matchesNone, ...linkGestures.value }))
// Fichas, Blocks y herramientas a lo ancho; las guías, a la medida de lectura (sitio-marco.md §2).
const isReading = computed(() => !comp.value && frontmatter.value.layout !== 'page' && !/^\/(en\/)?(components|blocks)\//.test(currentId.value + '/'))
const neighbours = computed(() => [frontmatter.value.prev, frontmatter.value.next].some(Boolean))
const nb = (n) => (n ? { ...n, title: n.code ? `${n.code} ${n.text}` : n.text, href: withBase(n.link) } : null)
const prev = computed(() => nb(frontmatter.value.prev))
const next = computed(() => nb(frontmatter.value.next))

const copied = ref(false)
let copiedT = 0
async function copyImport() {
  try {
    await navigator.clipboard.writeText(comp.value.import)
    copied.value = true
    clearTimeout(copiedT)
    copiedT = setTimeout(() => { copied.value = false }, 2000)
  } catch {}
}

// ---------- Portada ----------
const hero = computed(() => frontmatter.value.hero || {})
const heroActions = computed(() => (hero.value.actions || []).map((a, i) => ({ id: i, label: a.text, href: withBase(a.link) })))
const heroMedia = computed(() => ({ src: withBase('/logo.svg'), width: 480, height: 480, decorative: true }))
const features = computed(() => (frontmatter.value.features || []).map((f, i) => ({ id: i, title: f.title, description: f.details })))
const stats = computed(() => [
  { id: 'c', value: siteData.components.length, label: F.value.statComponents, source: `@grana/vue ${siteData.version}` },
  { id: 'b', value: siteData.blocks.length, label: F.value.statBlocks, source: '@grana/blocks' },
  { id: 'l', value: 2, label: F.value.statLocales, source: F.value.nav }
])

// ---------- Pie ----------
const footerBrand = computed(() => ({ name: 'Grana', href: homeHref.value }))
const footerGroups = computed(() => [
  {
    title: F.value.project,
    links: [
      { label: T.value.pages.changelog, href: withBase(locale.value === 'en' ? '/en/changelog.html' : '/changelog.html') },
      { label: T.value.pages.project, href: withBase(locale.value === 'en' ? '/en/project.html' : '/project.html') },
      { label: 'GitHub', href: REPO_URL, external: true }
    ]
  }
])

// ---------- Teclado: `/`, Ctrl+K y ⌘K hacia el filtro (§8; GSidebar no escucha el documento) ----------
function onKey(e) {
  if (e.defaultPrevented || e.isComposing) return
  const k = (e.key || '').toLowerCase()
  const editable = e.target?.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])')
  const slash = e.key === '/' && !editable && !e.ctrlKey && !e.metaKey && !e.altKey
  const cmdK = k === 'k' && (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey
  if (!slash && !cmdK) return
  e.preventDefault()
  focusFilter()
}

// ---------- Foco al cambiar de ruta (§8): al h1, tras el contenido nuevo; no en la primera carga ni con #ancla ----------
let pendingFocus = false
watch(() => route.path, () => {
  pendingFocus = true
  // En drawer, GSidebar pinta el <dialog> fuera de su raíz (y de `.vp-raw`): el router de VitePress se lleva el clic
  // y GSidebar no ve su `navigate`. Cambiar de página cierra el drawer igual.
  drawerOpen.value = false
})
onContentUpdated(() => {
  pageIndex.value?.refresh?.()
  if (!pendingFocus) return
  pendingFocus = false
  nextTick(() => {
    const hash = inBrowser ? decodeURIComponent(location.hash.slice(1)) : ''
    const target = hash && document.getElementById(hash)
    if (target) {
      if (target.tabIndex < 0 && !target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
      target.focus({ preventScroll: true })
    } else header.value?.focus?.()
  })
})

let mq = null
const onMq = () => { narrow.value = !!mq?.matches }
onMounted(() => {
  mounted.value = true
  mq = matchMedia(NARROW)
  onMq()
  mq.addEventListener('change', onMq)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  mq?.removeEventListener('change', onMq)
  document.removeEventListener('keydown', onKey)
  clearTimeout(copiedT)
})
</script>

<template>
  <GAppShell class="site-frame" :labels="{ skip: F.skip }">
    <template #header>
      <!-- Banda (§4): cada pieza en su envoltorio, hijo directo de la banda flexible de GAppShell. Lo estrecho (< 768)
           y la marca (con el índice en drawer, < 1024) se corrigen al montar con `hidden`; ver la nota de arriba. -->
      <div class="site-band__narrow" :hidden="!narrow">
        <GBtn class="site-band__menu" variant="ghost" color="neutral" icon :aria-label="F.menu" @click="openDrawer"><GIcon name="menu" /></GBtn>
      </div>
      <div class="site-band__brand" :hidden="!drawerMode">
        <a class="site-brand" :href="homeHref"><img class="site-brand__logo" :src="darkLogo ? logoDark : logoLight" alt="" width="24" height="24"><span class="site-brand__name">Grana</span></a>
      </div>
      <div class="site-band__wide" :hidden="narrow">
        <GBadge class="site-band__version" variant="outline" color="neutral" size="sm" :label="F.version(siteData.version)">{{ siteData.version }}</GBadge>
      </div>
      <div class="site-band__wide site-band__crumbs g-grow g-min-w-0 vp-raw" :hidden="narrow || !crumbs.length">
        <GBreadcrumbs v-if="crumbs.length" :items="crumbs" :labels="crumbLabels" @navigate="onCrumb" />
      </div>
      <div class="site-band__narrow g-ms-auto" :hidden="!narrow">
        <GBtn class="site-band__filter" variant="ghost" color="neutral" icon :aria-label="F.filter" aria-keyshortcuts="/ Control+K Meta+K" @click="focusFilter"><GIcon name="search" /></GBtn>
      </div>
      <div class="site-band__lang g-ms-auto vp-raw">
        <GMenu v-model="langOpen" :items="langItems" :label="F.language" align="end" :labels="linkGestures" @navigate="onLang">
          <template #trigger="{ attrs }">
            <GBtn v-if="narrow" v-bind="attrs" variant="ghost" color="neutral" icon :aria-label="`${F.language}: ${langName}`"><GIcon name="languages" /></GBtn>
            <GBtn v-else v-bind="attrs" variant="ghost" color="neutral" :aria-label="`${F.language}: ${langName}`"><template #prepend><GIcon name="languages" /></template>{{ langName }}</GBtn>
          </template>
        </GMenu>
      </div>
      <div class="site-band__wide" :hidden="narrow">
        <GRadioGroup class="site-band__theme" :model-value="themeMode" :options="themeOptions" appearance="segmented" label-mode="icon" size="sm" :field="false" :aria-label="F.theme" @update:model-value="(v) => (themeMode = v)" />
      </div>
      <div class="site-band__narrow" :hidden="!narrow">
        <GMenu v-model="themeMenuOpen" :items="themeMenuItems" :label="F.theme" align="end" @select="onThemeSelect">
          <template #trigger="{ attrs }"><GBtn v-bind="attrs" variant="ghost" color="neutral" icon :aria-label="themeName"><GIcon :name="themeIcon" /></GBtn></template>
        </GMenu>
      </div>
    </template>

    <template #nav>
      <!-- El filtro del índice (filter, v-model:query, filter-keyshortcuts, labels del filtro, focusFilter) vive solo aquí y en
           focusFilter() de arriba: cuando salga a su extensión (@grana/vue/sidebar-filter), basta con su import y app.use()
           en index.js. -->
      <GSidebar
        ref="sidebar"
        class="vp-raw"
        :items="sidebarItems"
        :model-value="currentId"
        v-model:open="drawerOpen"
        v-model:query="query"
        :label="F.nav"
        mode="auto"
        mobile="drawer"
        :breakpoints="{ expanded: 1024, rail: 1024 }"
        filter
        filter-keyshortcuts="/ Control+K Meta+K"
        :labels="sidebarLabels"
        @navigate="onNavigate"
        @mode-change="onMode"
      >
        <template #logo>
          <a class="site-brand" :href="homeHref">
            <img class="site-brand__logo" :src="darkLogo ? logoDark : logoLight" alt="" width="24" height="24">
            <span class="site-brand__name">Grana</span>
          </a>
        </template>
        <template v-if="narrow" #header>
          <GBadge class="site-band__version" variant="outline" color="neutral" size="sm" :label="F.version(siteData.version)">{{ siteData.version }}</GBadge>
        </template>
      </GSidebar>
    </template>

    <!-- Portada: mismo marco, sin GPageHeader ni índice de la página; compuesta con Blocks -->
    <template v-if="isHome">
      <GContainer width="xl">
        <GStack gap="lg">
          <GbHero01 :title="hero.text || 'Grana'" eyebrow="Grana" :lead="hero.tagline" :media="heroMedia" :actions="heroActions" />
          <GbStats01 :title="F.stats" :items="stats" />
          <GbFeatures01 v-if="features.length" :title="F.features" :items="features" />
          <Content class="vp-doc" />
        </GStack>
      </GContainer>
    </template>

    <!-- 404: mismo marco, sin miga y sin foco automático en el filtro -->
    <template v-else-if="isNotFound">
      <GPageHeader ref="header" :title="F.notFound.title" :description="F.notFound.description" :sticky="false" :labels="{ actions: F.actions }">
        <template #actions><GBtn :href="homeHref">{{ F.notFound.home }}</GBtn></template>
      </GPageHeader>
    </template>

    <template v-else>
      <GPageHeader ref="header" class="vp-raw" :title="frontmatter.title || page.title" :eyebrow="eyebrow" :description="frontmatter.description" :labels="{ actions: F.actions }">
        <template v-if="narrow && crumbs.length" #trail>
          <GBreadcrumbs :items="crumbs" :labels="crumbLabels" @navigate="onCrumb" />
        </template>
        <template v-if="comp" #meta>
          <GBadge v-if="comp.status" :color="STATUS_COLOR[comp.status] || 'neutral'" variant="soft" size="sm" :label="`${F.status}: ${comp.status}`">{{ comp.status }}</GBadge>
          <code class="site-import">{{ comp.import }}</code>
        </template>
        <template #actions="{ narrow: headerNarrow }">
          <GPageIndex v-if="sections.length" ref="pageIndex" :items="sections" :label="F.onPage" :labels="pageIndexLabels" />
          <GBtn v-if="comp && !headerNarrow" variant="ghost" color="neutral" @click="copyImport"><template #prepend><GIcon name="copy" /></template>{{ copied ? F.importCopied : F.copy }}</GBtn>
        </template>
      </GPageHeader>
      <GContainer :width="isReading ? 'reading' : 'xl'" :prose="isReading">
        <Content class="vp-doc" />
        <nav v-if="neighbours" class="site-neighbours" :aria-label="F.neighbours">
          <GSplit ratio="1:1" gap="md">
            <template #start>
              <GCard v-if="prev" interaction="link" :href="prev.href" :eyebrow="F.prev" :title="prev.title" />
            </template>
            <template #end>
              <GCard v-if="next" interaction="link" :href="next.href" :eyebrow="F.next" :title="next.title" />
            </template>
          </GSplit>
        </nav>
      </GContainer>
    </template>

    <template #footer>
      <GbFooter01 as="div" :brand="footerBrand" :groups="footerGroups" :note="T.theme.footer" :labels="{ nav: F.footerNav, external: F.external }" />
    </template>
  </GAppShell>
</template>
