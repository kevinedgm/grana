// «En el texto» (design/contracts/sitio-marco.md §6.3): con una consulta no numérica de 3 o más caracteres, el sitio
// carga la primera vez el índice local de VitePress del idioma actual (`@localSearchIndex`, ≈ 1,6 MB) y MiniSearch, y
// añade al final del índice el grupo `{ label: 'En el texto', filterable: false, items }` con como mucho 5 secciones
// que no repiten un título ya visible.
//
// `@localSearchIndex` es la única pieza no documentada de VitePress que usa el sitio (§1): versión fijada (1.6.4) y una
// prueba de forma en scripts/generate.test.mjs (claves por idioma, carga perezosa que devuelve el JSON de MiniSearch,
// campos `id`, `title`, `titles`). Las opciones de MiniSearch son las del cuadro de búsqueda de VitePress 1.6.4.
import { shallowRef, ref, watch } from 'vue'
import { inBrowser } from 'vitepress'
import { wantsText } from './frameNav.js'

export { wantsText, textItems } from './frameNav.js'

const MINISEARCH_OPTIONS = {
  fields: ['title', 'titles', 'text'],
  storeFields: ['title', 'titles'],
  searchOptions: { fuzzy: 0.2, prefix: true, boost: { title: 4, text: 2, titles: 1 } }
}

/** Estado de «En el texto» para el índice: `hits` (resultados brutos) de la consulta y el idioma actuales. */
export function useTextSearch(query, localeIndex) {
  const hits = shallowRef([])
  const loading = ref(false)
  const engines = new Map() // localeIndex → Promise<MiniSearch>
  let seq = 0
  const engine = (locale) => {
    if (!engines.has(locale)) {
      engines.set(locale, Promise.all([import('@localSearchIndex'), import('minisearch')]).then(async ([idx, ms]) => {
        const load = idx.default[locale]
        if (typeof load !== 'function') return null
        const json = (await load())?.default
        if (typeof json !== 'string') return null
        // ESM o interoperabilidad CJS según el empaquetado: la clase está en `default` o es el propio módulo.
        const MiniSearch = typeof ms.default?.loadJSON === 'function' ? ms.default : typeof ms.loadJSON === 'function' ? ms : ms.default?.default
        return MiniSearch.loadJSON(json, MINISEARCH_OPTIONS)
      }).catch((e) => { try { if (process.env.NODE_ENV !== "production") console.warn("[sitio] «En el texto» no se pudo cargar:", e) } catch {} return null }))
    }
    return engines.get(locale)
  }
  if (inBrowser) {
    watch([query, localeIndex], async ([q, locale]) => {
      const my = ++seq
      if (!wantsText(q)) {
        hits.value = []
        loading.value = false
        return
      }
      loading.value = true
      const ms = await engine(locale)
      if (my !== seq) return
      loading.value = false
      hits.value = ms ? ms.search(q.trim()).slice(0, 20) : []
    })
  }
  return { hits, loading }
}
