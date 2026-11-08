import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, postcssIsolateStyles } from 'vitepress'
import { layerVitepress } from './postcss-layer.mjs'
import { LOCALES, UI } from './i18n.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const site = path.resolve(here, '..')
const dataFile = path.join(site, 'src/.site-data.json')
if (!fs.existsSync(dataFile)) throw new Error('Falta site/src/: ejecuta antes `node site/scripts/generate.mjs` (lo hacen docs:dev y docs:build)')

// GitHub Pages de un repositorio de proyecto: https://kevinedgm.github.io/grana/
const base = process.env.GRANA_SITE_BASE || '/grana/'

/** URL de una página (`components/btn.md` → `/grana/components/btn.html`) y la de su gemela en el otro idioma. */
function pageHref(relativePath) {
  const rel = relativePath.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '.html')
  return base + rel
}
function twinPath(relativePath) {
  return relativePath.startsWith(LOCALES.en.prefix) ? relativePath.slice(LOCALES.en.prefix.length) : LOCALES.en.prefix + relativePath
}

export default defineConfig({
  srcDir: 'src',
  base,
  title: 'Grana',
  cleanUrls: false,
  lastUpdated: false,
  // Comprobación de enlaces muertos activa: un enlace interno roto detiene el build.
  ignoreDeadLinks: false,
  head: [
    // Tema antes de pintar (sitio-marco.md §7): VitePress pone la clase `dark` con su propio script (clave
    // `vitepress-theme-appearance`: auto · light · dark); este escribe a la vez `data-theme` para los tokens de Grana.
    [
      'script',
      {},
      `;(()=>{try{var p=localStorage.getItem('vitepress-theme-appearance')||'auto';var d=p==='auto'?matchMedia('(prefers-color-scheme: dark)').matches:p==='dark';document.documentElement.setAttribute('data-theme',d?'dark':'light')}catch(e){}})()`
    ],
    // Instrument Serif: titulares de la documentación (marca de Grana). Poppins: punto de partida «Bitácoras» del playground.
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Poppins:wght@400;500;600;700&display=swap' }]
  ],
  // Página gemela en el otro idioma (sitio-marco.md §4): `<link rel="alternate" hreflang>` en cada página.
  transformHead({ pageData }) {
    if (pageData.isNotFound || !pageData.relativePath) return []
    const self = pageData.relativePath
    const twin = twinPath(self)
    const enSelf = self.startsWith(LOCALES.en.prefix)
    const es = enSelf ? twin : self
    const en = enSelf ? self : twin
    return [
      ['link', { rel: 'alternate', hreflang: 'es', href: pageHref(es) }],
      ['link', { rel: 'alternate', hreflang: 'en', href: pageHref(en) }]
    ]
  },
  locales: {
    root: { label: LOCALES.es.label, lang: 'es', description: UI.es.description },
    en: { label: LOCALES.en.label, lang: 'en', link: '/en/', description: UI.en.description }
  },
  // El marco es propio (theme/Layout.vue, sin DefaultTheme.Layout): de la configuración del tema solo queda la
  // búsqueda local, que construye el índice `@localSearchIndex` de «En el texto» (sitio-marco.md §6.3).
  themeConfig: {
    search: { provider: 'local' }
  },
  // Al saltar a un `#ancla` (enlace del contenido), la sección queda bajo la banda de GAppShell y el zócalo pegado de
  // GPageHeader (≈ su alto con el relevo; medido en el sitio construido).
  scrollOffset: { selector: '.g-app-shell__header', padding: 88 },
  markdown: {
    // Sin numeración ni comprobaciones extra: el contenido es el de los README.
    theme: { light: 'github-light', dark: 'github-dark' },
    // `page.headers` con los h2 (ids del ancla de markdown-it): las secciones de GPageIndex (sitio-marco.md §6.2).
    headers: { level: [2] }
  },
  vite: {
    // El logo vive en site/public; con srcDir «src» VitePress buscaría site/src/public (que el generador vacía): 404 del logo.
    publicDir: path.join(site, 'public'),
    resolve: {
      alias: {
        '@site-demos': path.join(site, 'demos'),
        '@gen-demos': path.join(site, 'src/.demos'),
        // Fichas interactivas (site/live/G<Nombre>.js) y los meta.json de los componentes, su fuente de controles.
        '@site-live': path.join(site, 'live'),
        '@grana-components': path.resolve(site, '../packages/vue/src/components')
      },
      dedupe: ['vue']
    },
    css: {
      postcss: {
        // 1. Los estilos de documento de VitePress no entran en los ejemplos vivos (.vp-raw).
        // 2. Todo el CSS de VitePress va en la capa `vitepress`, anterior a las de Grana
        //    (receta de DECISIONS #516: los estilos de elemento de terceros, en una capa previa).
        plugins: [postcssIsolateStyles({ includeFiles: [/vp-doc\.css/, /base\.css/] }), layerVitepress()]
      }
    },
    // Las páginas importan el paquete construido (`dist/`), como lo haría una aplicación.
    ssr: { noExternal: ['@grana/vue', '@grana/blocks'] },
    build: { chunkSizeWarningLimit: 2000 }
  }
})
