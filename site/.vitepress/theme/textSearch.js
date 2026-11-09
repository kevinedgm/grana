// Búsqueda modal de texto completo (design/contracts/sitio-marco.md §6.3, #1056): GCombobox appearance="command"
// alimentado por el índice local de VitePress del idioma actual (`@localSearchIndex`, ≈ 1,6 MB) y MiniSearch, cargados
// con la primera búsqueda. `filter: false` + `search` + `loading`: el sitio consulta su índice y entrega las opciones.
//
// `@localSearchIndex` es la única pieza no documentada de VitePress que usa el sitio (§1): versión fijada (1.6.4) y una
// prueba de forma en scripts/generate.test.mjs. Las opciones de MiniSearch son las del cuadro de búsqueda de VitePress.
import { shallowRef, ref } from 'vue'
import { searchOptions } from './frameNav.js'

const MINISEARCH_OPTIONS = {
  fields: ['title', 'titles', 'text'],
  storeFields: ['title', 'titles'],
  searchOptions: { fuzzy: 0.2, prefix: true, boost: { title: 4, text: 2, titles: 1 } }
}

export function useSiteSearch(localeIndex) {
  const options = shallowRef([])
  const loading = ref(false)
  const engines = new Map() // localeIndex → Promise<MiniSearch | null>
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
      }).catch(() => null))
    }
    return engines.get(locale)
  }
  // Regla de «Datos» de combobox.md: `loading` en el mismo manejador que `search`
  async function search(text) {
    const my = ++seq
    const q = (text || '').trim()
    if (!q) {
      options.value = []
      loading.value = false
      return
    }
    loading.value = true
    const ms = await engine(localeIndex.value)
    if (my !== seq) return
    loading.value = false
    options.value = ms ? searchOptions(ms.search(q)) : []
  }
  /** Carga el índice por adelantado (al abrir la búsqueda). */
  const warm = () => { engine(localeIndex.value) }
  return { options, loading, search, warm }
}
