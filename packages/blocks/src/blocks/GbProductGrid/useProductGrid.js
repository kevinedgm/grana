// GbProductGrid · lo que comparten las tres variantes (dueño: bruno; product-grid.md «Piezas»). Avisos C3, C5, C7, EC1, EC5,
// PG1 (un valor de `filters` que no está en `facets`), PG2 (`sort` que no está en `sorts`), PG3 (`total` menor que la
// página) y PG4 (`labels.facetOption` sin {label}, #935). Sin filtrar ni ordenar: los productos salen en el orden en que llegan.
//   - Filtros, orden y página: copia propia (sin v-model funciona igual) que la prop sustituye; cada cambio emite un valor
//     NUEVO (`update:filters` con un objeto nuevo y arreglos nuevos; nunca muta lo recibido).
//   - Facetas → `TagItem` de GTagGroup (alternar): id «clave:valor», la cuenta en la etiqueta, `facet` con el nombre (racimo),
//     una opción con `count: 0` no elegida a la vista y deshabilitada (lo no disponible se dice, §27 regla 1).
//   - La región: `items` de GLoadRegion es null hasta la primera respuesta (molde de `sample`), después la página.
//   - El vacío: sin filtros `cause="none"`; con filtros `cause="filtered"` con un filtro de GEmpty por valor elegido
//     («clave:valor», su etiqueta y la `count` de la opción: cuántos volverían quitándolo) y `total`.
import { computed, ref, watch } from 'vue'
import { useLocale, fill } from '../common/locale.js'
import { countText, productKey, shopRegion } from '../common/ecommerce.js'
import { isProduct } from '../common/ProductCard.js'
import { has } from '../common/text.js'
import { MAX_PRODUCTS } from './props.js'

const SEP = '\u0000'
const fkey = (k, v) => `${k}${SEP}${String(v)}`

export function useProductGrid(props, emit, warn) {
  const locale = useLocale(props)
  const L = computed(() => props.labels || {})
  const need = (key, what) => {
    if (has(L.value[key]) || typeof L.value[key] === 'function' || (L.value[key] && typeof L.value[key] === 'object')) return L.value[key]
    try { if (process.env.NODE_ENV !== 'production') warn(`C5:${key}`, `falta labels.${key} (${what}): se pinta sin ese texto (C5).`) } catch {}
    return undefined
  }

  // Los productos de la página, en su orden, con su clave (EC5; id repetido, C3: el índice)
  const rows = computed(() => {
    const list = Array.isArray(props.products) ? props.products : []
    try { if (process.env.NODE_ENV !== 'production' && list.length > MAX_PRODUCTS) warn('C7', `products con ${list.length} elementos; se recomiendan hasta ${MAX_PRODUCTS} por página: se pintan todos (C7).`) } catch {}
    const seen = new Set()
    return list.map((product, index) => {
      let key = productKey(product, index, 'product', warn)
      if (seen.has(key)) {
        try { if (process.env.NODE_ENV !== 'production') warn(`C3:${key}`, `products: id «${String(product.id)}» repetido; se usa el índice (C3).`) } catch {}
        key = `i:${index}`
      }
      seen.add(key)
      return { key, product, index }
    })
  })
  const keyOf = (product) => {
    const r = rows.value.find((x) => x.product === product)
    return r ? r.key : product && product.id !== undefined ? `id:${String(product.id)}` : undefined
  }
  const region = computed(() => shopRegion(props.prices, rows.value.some((r) => isProduct(r.product)), warn))
  const busyOf = (product) => Array.isArray(props.busy) && product && props.busy.includes(product.id)

  // Facetas y filtros
  const facets = computed(() => (Array.isArray(props.facets) ? props.facets : []).filter((f) => f && has(f.key) && has(f.label) && Array.isArray(f.options)).map((f) => ({ ...f, options: f.options.filter((o) => o && o.value !== undefined && o.value !== null && has(o.label)) })))
  const localFilters = ref({ ...(props.filters || {}) })
  watch(() => props.filters, (v) => { localFilters.value = { ...(v || {}) } })
  /** Lo elegido que existe en `facets` (PG1: lo demás se ignora). */
  const filters = computed(() => {
    const out = {}
    for (const [k, vals] of Object.entries(localFilters.value || {})) {
      const f = facets.value.find((x) => x.key === k)
      for (const v of Array.isArray(vals) ? vals : []) {
        if (f && f.options.some((o) => o.value === v)) (out[k] = out[k] || []).push(v)
        else {
          try { if (process.env.NODE_ENV !== 'production') warn(`PG1:${k}:${String(v)}`, `filters.${k} incluye «${String(v)}», que no está en facets: se ignora (PG1).`) } catch {}
        }
      }
    }
    return out
  })
  const isOn = (k, v) => Boolean(filters.value[k] && filters.value[k].includes(v))
  const anyFilter = computed(() => Object.values(filters.value).some((x) => x.length))
  const setFilters = (next) => {
    localFilters.value = next
    emit('update:filters', next)
  }
  /** Alterna un valor: un objeto nuevo con arreglos nuevos (lo recibido no se toca). */
  const toggle = (k, v, on) => {
    const next = {}
    for (const [key, vals] of Object.entries(filters.value)) next[key] = [...vals]
    const cur = next[k] || []
    next[k] = on ? (cur.includes(v) ? cur : [...cur, v]) : cur.filter((x) => x !== v)
    if (!next[k].length) delete next[k]
    setFilters(next)
  }
  const clear = () => setFilters({})
  // C5 de los textos de las facetas
  watch(() => facets.value.length, (n) => { if (n) { need('facets', 'nombre del grupo de facetas'); need('clear', '«Quitar filtros»'); need('emptyFiltered', 'vacío por filtros') } }, { immediate: true })
  /** La etiqueta de una opción con cuenta: `labels.facetOption` (plantilla con {label} y {count}, o función; #935). El bloque
   *  no escribe el separador; sin el texto (C5) o sin {label} (PG4), la etiqueta va sola. */
  const optionLabel = (o) => {
    if (!Number.isFinite(o.count)) return o.label
    const t = L.value.facetOption
    if (typeof t === 'function') return String(t(o.label, o.count))
    if (!has(t)) {
      try { if (process.env.NODE_ENV !== 'production') warn('C5:facetOption', 'hay opciones de faceta con count y falta labels.facetOption («{label} · {count}»): se pinta la etiqueta sola (C5).') } catch {}
      return o.label
    }
    if (!t.includes('{label}')) {
      try { if (process.env.NODE_ENV !== 'production') warn('PG4', 'labels.facetOption no lleva {label}: se pinta la etiqueta sola (PG4).') } catch {}
      return o.label
    }
    return fill(t, { label: o.label, count: countText(o.count, locale.value) })
  }
  /** Los `TagItem` de una faceta (o de todas, con `facet` para el racimo). */
  const tagItems = (only) => facets.value.filter((f) => !only || f.key === only).flatMap((f) => f.options.map((o) => {
    const pressed = isOn(f.key, o.value)
    return { id: fkey(f.key, o.value), label: optionLabel(o), pressed, facet: only ? undefined : f.label, disabled: o.count === 0 && !pressed, fk: f.key, fv: o.value }
  }))
  const onToggle = ({ item, pressed }) => { if (item && item.fk !== undefined) toggle(item.fk, item.fv, pressed) }
  /** 02: lo elegido de una faceta, en palabras (peek) y su cuenta (meta). */
  const chosenIn = (f) => f.options.filter((o) => isOn(f.key, o.value)).map((o) => o.label)
  const listText = (items) => {
    if (!items.length) return ''
    try { return new Intl.ListFormat(locale.value, { type: 'conjunction' }).format(items) } catch { return items.join(', ') }
  }

  // El vacío por filtros: un filtro de GEmpty por valor elegido; `relax` lo quita
  const emptyFilters = computed(() => facets.value.flatMap((f) => f.options.filter((o) => isOn(f.key, o.value)).map((o) => ({ key: fkey(f.key, o.value), label: o.label, ...(Number.isFinite(o.count) ? { count: o.count } : {}) }))))
  const relax = (key) => {
    const [k, v] = String(key).split(SEP)
    const f = facets.value.find((x) => x.key === k)
    const o = f && f.options.find((x) => String(x.value) === v)
    if (o) toggle(k, o.value, false)
  }

  // Orden
  const sorts = computed(() => (Array.isArray(props.sorts) ? props.sorts.filter((s) => s && has(s.value) && has(s.label)) : []))
  const localSort = ref(props.sort)
  watch(() => props.sort, (v) => { localSort.value = v })
  const sortValue = computed(() => {
    const v = localSort.value
    if (!has(v)) return null
    if (sorts.value.some((s) => s.value === v)) return v
    try { if (process.env.NODE_ENV !== 'production') warn(`PG2:${v}`, `sort = «${v}» no está en sorts: el selector queda sin selección (PG2).`) } catch {}
    return null
  })
  const sortLabel = computed(() => (sorts.value.length ? need('sort', 'rótulo del orden («Ordenar por»)') : undefined))
  const setSort = (v) => {
    localSort.value = v
    emit('update:sort', v)
  }

  // Cuenta y página
  const count = computed(() => {
    const n = rows.value.length
    if (Number.isFinite(props.total)) {
      if (props.total < n) {
        try { if (process.env.NODE_ENV !== 'production') warn('PG3', `total (${props.total}) es menor que los productos de la página (${n}): se usa ${n} (PG3).`) } catch {}
        return n
      }
      return props.total
    }
    return n
  })
  const countLabel = computed(() => {
    const t = need('count', '«{count} productos»')
    if (typeof t === 'function') return String(t(count.value))
    return has(t) ? fill(t, { count: countText(count.value, locale.value) }) : ''
  })
  const localPage = ref(Number.isInteger(props.page) && props.page > 0 ? props.page : 1)
  watch(() => props.page, (v) => { if (Number.isInteger(v) && v > 0) localPage.value = v })
  const paged = computed(() => Number.isFinite(props.total) && Number.isFinite(props.pageSize) && props.pageSize > 0)
  const setPage = (v) => {
    localPage.value = v
    emit('update:page', v)
  }

  // La región: null hasta la primera respuesta (molde con `sample`); después, la página
  const known = ref(!props.loading)
  watch(() => props.loading, (v) => { if (!v) known.value = true })
  const items = computed(() => (!known.value && props.loading && !rows.value.length ? null : rows.value.map((r) => r.product)))
  const sample = computed(() => (Array.isArray(props.sample) && props.sample.length ? props.sample : null))
  const emptyLabels = computed(() => {
    const e = anyFilter.value ? (L.value.emptyFiltered || need('emptyFiltered', 'vacío por filtros')) : need('empty', 'vacío sin productos')
    return e && typeof e === 'object' ? e : {}
  })
  const retry = () => emit('retry', { event: null })
  // EC1 y C5 de los textos que siempre hacen falta
  need('empty', 'vacío sin productos')
  need('card', 'los textos de la tarjeta')

  return { locale, L, rows, keyOf, region, busyOf, facets, filters, isOn, anyFilter, tagItems, onToggle, clear, chosenIn, listText, emptyFilters, relax, sorts, sortValue, sortLabel, setSort, count, countLabel, page: localPage, paged, setPage, items, sample, emptyLabels, retry, need }
}
