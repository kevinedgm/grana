<script setup>
// Marco del sitio de documentación: el diseño del sitio anterior (VitePress 1.6.4 vestido con Grana, 1d11c448), hecho con
// componentes reales de Grana (design/contracts/sitio-marco.md, DECISIONS.md #1052 a #1070). Del concepto A se conservan
// el filtro del índice (`/`) y los números estables 01–79.
//
//   GAppShell header="pinned-wide"   banda de 64 · índice · página · pie (solo portada)
//     #header  GNavBar   marca · «Buscar ⌘K» · Guía/Componentes/Blocks/Playground/Cambios/GitHub · idioma · tema
//     #nav     GSidebar appearance="index" con filtro F1 y números al final (no en la portada)
//     #default barra local (< 80rem: «Menú» + GPageIndex fold) · documento (Content.vp-doc + anterior/siguiente)
//              · columna «En esta página» (GPageIndex list, ≥ 80rem). Portada: VPHome con la marca (BrandHero en
//              `home-hero-before`: logo W2, «La impresión», lema y acciones; manual de marca v1) y debajo las ventajas
//              y el cuerpo de la portada del original
//   GCombobox appearance="command"  búsqueda modal de texto completo (@localSearchIndex + MiniSearch)
//
// Las clases `site-*` son las que espera grana-site.css (coco; su cabecera). Sin <style>. Los cortes del visor son CSS
// (§10): el primer render no lee matchMedia, location ni localStorage.
//
// `vp-raw` en el índice, la barra local y la columna: el router de VitePress escucha los clics en *captura* y cancela los
// enlaces internos antes que Grana (GSidebar no cerraría el cajón; GPageIndex no llevaría el foco a la sección). Con
// `.vp-raw` VitePress no los toca: el índice navega con `router.go` desde su `navigate` y GPageIndex deja el salto a
// `#ancla` al navegador (con el `scroll-padding` de GAppShell) y lleva el foco a la sección.
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
import { Content, inBrowser, onContentUpdated, useData, useRoute, useRouter, withBase } from 'vitepress'
import VPHome from 'vitepress/dist/client/theme-default/components/VPHome.vue'
import BrandHero from './BrandHero.vue'
import siteData from '../../src/.site-data.json'
import { UI, LOCALES } from '../i18n.mjs'
import { useAppearance } from './appearance.js'
import { useSiteSearch } from './textSearch.js'
import { navBarItems, pageSections, routeId, twinPath, withBaseItems } from './frameNav.js'

const { page, frontmatter, localeIndex, site } = useData()
const route = useRoute()
const router = useRouter()
const { mode: themeMode, isDark } = useAppearance()

// VPHero lo inyecta el Layout del tema por defecto: sin imagen de hero en el sitio (la portada ya no lleva `hero`).
provide('hero-image-slot-exists', computed(() => false))

// ---------- Idioma y textos ----------
const locale = computed(() => (localeIndex.value === 'en' ? 'en' : 'es'))
const U = computed(() => UI[locale.value])
const F = computed(() => UI[locale.value].frame)
const base = computed(() => site.value.base)
const prefix = computed(() => LOCALES[locale.value].prefix)

// ---------- Página ----------
const currentPath = computed(() => routeId(route.path, base.value))
const isHome = computed(() => frontmatter.value.layout === 'home')
// `layout: page` (herramientas como el playground de tema): ancho completo, sin columna de lectura ni «En esta página»
const isPage = computed(() => frontmatter.value.layout === 'page')
const isBlocks = computed(() => /^\/(en\/)?blocks\//.test(currentPath.value + '/'))
const sections = computed(() => (isHome.value || isPage.value || page.value.isNotFound ? [] : pageSections(page.value.headers)))
const section = ref(null)
const nb = (n) => (n ? { text: n.text, href: withBase(n.link) } : null)
const prev = computed(() => nb(frontmatter.value.prev))
const next = computed(() => nb(frontmatter.value.next))

// ---------- Estado del marco (cliente) ----------
const mounted = ref(false)
const wide960 = ref(true) // ≥ 60rem: la columna izquierda a la vista (el plegado se alinea al inicio)
const drawerOpen = ref(false)
const query = ref('')
const sidebar = ref(null)
const search = ref(null)
const langOpen = ref(false)
const apple = ref(false)

// ---------- Barra superior (GNavBar) ----------
const navItems = computed(() => navBarItems(U.value.nav, prefix.value, withBase))
const navLabels = computed(() => ({ more: F.value.moreOptions, menu: F.value.menu, newTab: F.value.newTab }))
const homeHref = computed(() => withBase('/' + prefix.value))
const logoLight = withBase('/logo.svg')
const logoDark = withBase('/logo-dark.svg')
function onNavBar({ item, event }) {
  if (!item?.href || item.external || event?.defaultPrevented) return
  event.preventDefault()
  router.go(item.href)
}

// Idioma: ruta equivalente (§3.3)
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
const langMenuLabels = computed(() => ({ opened: F.value.opened, openedLive: F.value.openedLive, copied: F.value.copied, copiedLive: F.value.copiedLive }))
function onLang({ item, event }) {
  if (!item?.href) return
  event?.preventDefault()
  langOpen.value = false
  router.go(item.href)
}
function onLangLink(event, href) {
  if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  router.go(href)
}

// Tema de dos estados (§3.4): el interruptor enseña el tema resuelto y escribe `dark` o `light`. Hasta montar, apagado
// (el servidor no sabe el tema; los colores ya los puso el <head>, sin destello).
const darkOn = computed({
  get: () => mounted.value && isDark.value,
  set: (v) => { themeMode.value = v ? 'dark' : 'light' }
})

// ---------- Índice izquierdo (GSidebar appearance="index") ----------
const sidebarItems = computed(() => withBaseItems((isBlocks.value ? siteData.blocksSidebar : siteData.sidebar)[locale.value], withBase))
const currentId = computed(() => {
  const id = currentPath.value
  // los ids del índice son las rutas sin base ni `.html` (las páginas de índice terminan en «/»)
  return id
})
const sidebarLabels = computed(() => {
  const f = F.value
  return {
    collapse: f.collapse, expand: f.expand, drawer: f.drawer, close: f.close, more: f.more, moreActive: f.moreActive, groupCurrent: f.groupCurrent,
    filter: f.filter, filterPlaceholder: f.filterShort, filterHint: f.filterHint, filterClear: f.filterClear,
    filterCount: f.filterCount, filterNone: f.filterNone
  }
})
function onNavigate({ item, event }) {
  if (!item?.href || item.external) return
  event?.preventDefault()
  drawerOpen.value = false
  router.go(item.href)
}
function openDrawer() {
  drawerOpen.value = true
}
// El filtro del índice (extensión @grana/vue/sidebar-filter, #1050) vive solo en GSidebar y aquí.
function focusFilter() {
  sidebar.value?.focusFilter()
}

// ---------- En esta página (GPageIndex list: columna y plegada, mismo v-model; PI-L5) ----------
const pageIndexLabels = computed(() => ({ top: F.value.top }))
const pageIndexes = ref([])
const setIndex = (el) => { if (el && !pageIndexes.value.includes(el)) pageIndexes.value.push(el) }

// ---------- Búsqueda modal (GCombobox appearance="command", §6.3) ----------
const { options: searchOpts, loading: searchLoading, search: runSearch, warm } = useSiteSearch(localeIndex)
const cmdLabels = computed(() => F.value.cmd)
function openSearch() {
  warm()
  search.value?.open()
}
function onSearchSelect({ option, event }) {
  const href = String(option.value)
  if (event && (event.ctrlKey || event.metaKey)) {
    window.open(href, '_blank', 'noopener')
    return
  }
  router.go(href)
}

// ---------- Teclado: ⌘K/Ctrl+K a la búsqueda (también desde un campo) y `/` al filtro (en la portada, a la búsqueda) ----------
function onKey(e) {
  if (e.defaultPrevented || e.isComposing) return
  const k = (e.key || '').toLowerCase()
  if (k === 'k' && (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey) {
    e.preventDefault()
    openSearch()
    return
  }
  const editable = e.target?.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])')
  if (e.key === '/' && !editable && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault()
    if (isHome.value) openSearch()
    else focusFilter()
  }
}

// ---------- Portada «arriba del todo» (§3.5): data-top en <html> mientras scrollY === 0 ----------
function syncTop() {
  if (!inBrowser) return
  document.documentElement.toggleAttribute('data-top', isHome.value && window.scrollY === 0)
}

// ---------- Foco al cambiar de ruta (§8): al h1 del contenido tras el contenido nuevo; no en la primera carga ni con #ancla ----------
let pendingFocus = false
watch(() => route.path, () => {
  pendingFocus = true
  // En el cajón, GSidebar pinta el <dialog> fuera de su raíz (y de `.vp-raw`): el router de VitePress se lleva el clic
  // y GSidebar no ve su `navigate`. Cambiar de página cierra el cajón igual.
  drawerOpen.value = false
  query.value = ''
  nextTick(syncTop)
})
onContentUpdated(() => {
  for (const pi of pageIndexes.value) pi?.refresh?.()
  if (!pendingFocus) return
  pendingFocus = false
  nextTick(() => {
    const hash = decodeURIComponent(location.hash.slice(1))
    const target = (hash && document.getElementById(hash)) || document.querySelector('main h1')
    if (!target) return
    if (target.tabIndex < 0 && !target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
    target.focus({ preventScroll: true })
  })
})

let mq = null
const onMq = () => { wide960.value = !!mq?.matches }
onMounted(() => {
  mounted.value = true
  apple.value = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent)
  mq = matchMedia('(min-width: 60rem)')
  onMq()
  mq.addEventListener('change', onMq)
  document.addEventListener('keydown', onKey)
  window.addEventListener('scroll', syncTop, { passive: true })
  syncTop()
})
onBeforeUnmount(() => {
  mq?.removeEventListener('change', onMq)
  document.removeEventListener('keydown', onKey)
  window.removeEventListener('scroll', syncTop)
})
</script>

<template>
  <GAppShell header="pinned-wide" :labels="{ skip: F.skip }">
    <template #header>
      <GNavBar :items="navItems" :current="currentPath" :label="F.sections" :labels="navLabels" @navigate="onNavBar">
        <template #brand>
          <a class="site-brand" :href="homeHref">
            <img class="site-brand__logo site-brand__logo--light" :src="logoLight" alt="" width="24" height="24">
            <img class="site-brand__logo site-brand__logo--dark" :src="logoDark" alt="" width="24" height="24">
            <span class="site-brand__name">Grana</span>
          </a>
        </template>
        <template #search>
          <button class="site-search" type="button" :aria-label="F.searchAria" aria-haspopup="dialog" aria-keyshortcuts="Control+K Meta+K" @click="openSearch">
            <GIcon class="site-search__icon" name="search" />
            <span class="site-search__text">{{ F.search }}</span>
            <span class="site-search__keys" aria-hidden="true"><kbd class="site-search__mod">{{ apple ? '⌘' : 'Ctrl' }}</kbd><kbd>K</kbd></span>
          </button>
        </template>
        <template #actions="{ place }">
          <template v-if="place === 'bar'">
            <GMenu id="site-lang" v-model="langOpen" :items="langItems" :label="F.langMenu" align="end" :labels="langMenuLabels" @navigate="onLang">
              <template #trigger="{ attrs }">
                <button v-bind="attrs" class="site-lang" type="button" :aria-label="F.langMenu"><GIcon name="languages" /><GIcon class="site-lang__chev" name="chevron-down" /></button>
              </template>
            </GMenu>
            <GSwitch v-model="darkOn" class="site-theme" size="sm" color="neutral" :aria-label="F.themeSwitch">
              <template #icon-on><GIcon name="moon" /></template>
              <template #icon-off><GIcon name="sun" /></template>
            </GSwitch>
          </template>
          <template v-else>
            <nav :aria-label="F.langMenu">
              <ul class="site-langs">
                <li v-for="l in langItems" :key="l.id">
                  <a :href="l.href" :lang="l.lang" :hreflang="l.hreflang" :aria-current="l.current ? 'page' : undefined" @click="onLangLink($event, l.href)">{{ l.label }}</a>
                </li>
              </ul>
            </nav>
            <div class="site-appearance">
              <span class="site-appearance__label">{{ F.appearance }}</span>
              <GSwitch v-model="darkOn" class="site-theme" size="sm" color="neutral" :aria-label="F.themeSwitch">
                <template #icon-on><GIcon name="moon" /></template>
                <template #icon-off><GIcon name="sun" /></template>
              </GSwitch>
            </div>
          </template>
        </template>
      </GNavBar>
    </template>

    <template v-if="!isHome" #nav>
      <GSidebar
        ref="sidebar"
        class="vp-raw"
        appearance="index"
        :items="sidebarItems"
        :model-value="currentId"
        v-model:open="drawerOpen"
        v-model:query="query"
        :label="F.nav"
        mode="auto"
        mobile="drawer"
        :breakpoints="{ expanded: 960 }"
        filter
        filter-keyshortcuts="/"
        :labels="sidebarLabels"
        @navigate="onNavigate"
      >
        <template #logo>
          <a class="site-brand" :href="homeHref">
            <img class="site-brand__logo site-brand__logo--light" :src="logoLight" alt="" width="24" height="24">
            <img class="site-brand__logo site-brand__logo--dark" :src="logoDark" alt="" width="24" height="24">
            <span class="site-brand__name">Grana</span>
          </a>
        </template>
        <template #search-icon><GIcon name="search" /></template>
      </GSidebar>
    </template>

    <!-- Portada: el marco sin índice ni barra local; la marca (BrandHero) y debajo el contenido de la portada del original -->
    <VPHome v-if="isHome">
      <template #home-hero-before><BrandHero /></template>
    </VPHome>

    <template v-else>
      <div class="site-local vp-raw">
        <button class="site-local__menu" type="button" aria-haspopup="dialog" @click="openDrawer"><GIcon name="text-align-start" />{{ F.menu }}</button>
        <GPageIndex v-if="sections.length" :ref="setIndex" v-model="section" class="site-local__index" appearance="list" fold :align="wide960 ? 'start' : 'end'" :items="sections" :label="F.onPage" :labels="pageIndexLabels" />
      </div>
      <div class="site-doc" :class="{ 'site-doc--page': isPage }">
        <div class="site-doc__inner">
          <article class="site-content">
            <Content :class="{ 'vp-doc': !isPage }" />
            <nav v-if="prev || next" class="site-pager" :aria-label="F.neighbours">
              <div class="site-pager__list">
                <GCard v-if="prev" class="site-pager__card" interaction="link" :href="prev.href">
                  <template #eyebrow><span class="site-pager__label">{{ F.prev }}</span></template>
                  <template #title><span class="site-pager__title">{{ prev.text }}</span></template>
                </GCard>
                <GCard v-if="next" class="site-pager__card is-next" interaction="link" :href="next.href">
                  <template #eyebrow><span class="site-pager__label">{{ F.next }}</span></template>
                  <template #title><span class="site-pager__title">{{ next.text }}</span></template>
                </GCard>
              </div>
            </nav>
          </article>
          <aside v-if="sections.length" class="site-aside vp-raw">
            <div class="site-aside__inner">
              <GPageIndex :ref="setIndex" v-model="section" appearance="list" :items="sections" :label="F.onPage" :labels="pageIndexLabels" />
            </div>
          </aside>
        </div>
      </div>
    </template>

    <template v-if="isHome" #footer>
      <p class="site-footer">{{ U.theme.footer }}</p>
    </template>
  </GAppShell>

  <GCombobox
    id="site-search"
    ref="search"
    appearance="command"
    :label="F.searchAria"
    :placeholder="F.searchAria"
    :filter="false"
    :options="searchOpts"
    :loading="searchLoading"
    :limit="20"
    :labels="cmdLabels"
    @search="runSearch"
    @select="onSearchSelect"
  >
    <template #hints>
      <span><kbd><GIcon name="arrow-up" /></kbd><kbd><GIcon name="arrow-down" /></kbd>{{ F.cmd.move }}</span>
      <span><kbd><GIcon name="corner-down-left" /></kbd>{{ F.cmd.select }}</span>
      <span><kbd>esc</kbd>{{ F.cmd.esc }}</span>
    </template>
  </GCombobox>
</template>
