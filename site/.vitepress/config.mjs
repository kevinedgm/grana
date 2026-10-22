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
const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'))

// GitHub Pages de un repositorio de proyecto: https://kevinedgm.github.io/grana/
const base = process.env.GRANA_SITE_BASE || '/grana/'

function themeFor(locale) {
  const U = UI[locale]
  const T = U.theme
  const p = '/' + LOCALES[locale].prefix
  return {
    nav: [
      { text: U.nav.guide, link: p + 'getting-started', activeMatch: `^${p}(getting-started|theming|cli|accessibility|personality|project)` },
      { text: U.nav.components, link: p + 'components/', activeMatch: `^${p}components/` },
      { text: U.nav.playground, link: p + 'playground', activeMatch: `^${p}playground` },
      { text: U.nav.changelog, link: p + 'changelog' },
      { text: U.nav.github, link: 'https://github.com/kevinedgm/grana' }
    ],
    sidebar: data.sidebar[locale],
    outline: { level: [2, 3], label: T.outline },
    docFooter: { prev: T.prev, next: T.next },
    darkModeSwitchLabel: T.appearance,
    lightModeSwitchTitle: T.toLight,
    darkModeSwitchTitle: T.toDark,
    sidebarMenuLabel: T.menu,
    returnToTopLabel: T.top,
    langMenuLabel: T.langMenu,
    skipToContentLabel: T.skip,
    notFound: T.notFound,
    footer: { message: T.footer }
  }
}

function searchTranslations(locale) {
  const S = UI[locale].theme.search
  return {
    button: { buttonText: S.button, buttonAriaLabel: S.buttonAria },
    modal: {
      displayDetails: S.detailed,
      resetButtonTitle: S.reset,
      backButtonTitle: S.back,
      noResultsText: S.noResults,
      footer: { selectText: S.select, navigateText: S.navigate, closeText: S.close }
    }
  }
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
    // Sincroniza el tema de Grana (data-theme) con la apariencia de VitePress antes de pintar.
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
  locales: {
    root: { label: LOCALES.es.label, lang: 'es', description: UI.es.description, themeConfig: themeFor('es') },
    en: { label: LOCALES.en.label, lang: 'en', link: '/en/', description: UI.en.description, themeConfig: themeFor('en') }
  },
  themeConfig: {
    logo: {
      light: '/logo.svg',
      dark: '/logo-dark.svg',
      alt: ''
    },
    search: {
      provider: 'local',
      options: {
        locales: {
          root: { translations: searchTranslations('es') },
          en: { translations: searchTranslations('en') }
        }
      }
    }
  },
  markdown: {
    // Sin numeración ni comprobaciones extra: el contenido es el de los README.
    theme: { light: 'github-light', dark: 'github-dark' }
  },
  vite: {
    resolve: {
      alias: {
        '@site-demos': path.join(site, 'demos'),
        '@gen-demos': path.join(site, 'src/.demos')
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
    ssr: { noExternal: ['@grana/vue'] },
    build: { chunkSizeWarningLimit: 2000 }
  }
})
