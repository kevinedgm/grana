<script>
// GTable · tabla de datos con columnas compuestas, filtros, orden, selección, paginación y tarjetas (dueño: bruno)
// Contrato: design/contracts/table.md · Estilo: GTable.css (coco) · Estructura: design/lab/table/r01/ y r02/.
// Campos ≠ columnas: una columna puede componer varios campos (leading + title + subtitle). Un solo <table> con roles
// explícitos se dibuja como tabla o como tarjetas según el ancho del contenedor (DECISIONS.md #109 a #111).
// Carga, vacío y error con el motor común (table.md «Carga, vacío y error con el motor común», #540): retraso de 200 ms
// (filas de antes inertes o esqueleto invisible), mínimo de 400 ms, espera larga a los 5 s, esqueleto quieto con las filas
// que había a la vista, `error` con barra de fallo o GEmpty cause="error", vacío por defecto con GEmpty y foco por rowKey.
// Filas por página y la fila ancla (#592 a #596), la puerta (A), el despliegue (B) y el estado de fila (#597 a #600, #650).
import { defineComponent, h, ref, shallowRef, computed, watch, nextTick, onMounted, onUpdated, onBeforeUnmount, provide, reactive, useId } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import { fill } from '../../utils/template.js'
import { applyFilters } from '../../utils/filters.js'
import GIcon from '../GIcon/GLibIcon.js'
import GFilterBar from '../GFilterBar/GFilterBar.vue'
import GPagination from '../GPagination/GPagination.vue'
import GBtn from '../GBtn/GBtn.vue'
import GEmpty from '../GEmpty/GEmpty.vue'
import GBadge from '../GBadge/GBadge.vue'
import { createLoadPhase, rememberFocus, restoreFocus } from '../../utils/loadPhase.js'
import { pagerKey, pageSizeList } from '../../utils/tablePager.js'
import { transitionMs } from '../../utils/motion.js'
import { nextFrame } from '../GForm/formContext.js'

const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const toPx = (value) => {
  const n = parseFloat(value)
  if (Number.isNaN(n)) return NaN
  if (/rem\s*$|em\s*$/.test(value)) return n * parseFloat(getComputedStyle(document.documentElement).fontSize)
  return n
}
const locale = () => (typeof document !== 'undefined' && document.documentElement.lang) || undefined
// Texto de un label que puede ser plantilla con {title} o función (row) => string
const rowText = (label, row, title) => (typeof label === 'function' ? label(row) : fill(label, { title }))
// Constantes de diseño (no tokens ni props): «aquí estabas» sin animación (#594) y arrastre que no es clic (#599)
const HERE_MS = 1300
const DRAG_PX = 5
// Estado de fila (#600): color de GBadge e icono decorativo por valor (error lee danger, como GCard #133)
const STATUS = { error: ['danger', 'circle-alert'], warning: ['warning', 'triangle-alert'], info: ['info', 'info'], success: ['success', 'circle-check'] }
// Destinos que ya son un control: el clic de fila de B no se reenvía (excepción 2 de #599)
const CONTROL = 'a[href],button,input,select,textarea,label,summary,[contenteditable]:not([contenteditable=false]),[tabindex]:not([tabindex="-1"]),' +
  'button link checkbox radio switch tab option menuitem menuitemcheckbox menuitemradio combobox textbox slider spinbutton treeitem'.split(' ').map((r) => `[role=${r}]`).join()

export default defineComponent({
  name: 'GTable',
  props: {
    columns: { type: Array, default: () => [] },
    rows: { type: Array, default: () => [] },
    rowKey: { type: String, default: 'id' },
    caption: { type: String, default: undefined },
    sort: { type: Object, default: null },
    sortMode: { type: String, default: 'local', validator: oneOf(['local', 'external']) },
    selectable: Boolean,
    selected: { type: Array, default: () => [] },
    filters: { type: Array, default: () => [] },
    filterMode: { type: String, default: 'local', validator: oneOf(['local', 'external']) },
    page: { type: Number, default: 1 },
    pageSize: { type: Number, default: undefined, validator: (v) => v >= 1 },
    pageSizes: { type: Array, default: undefined },
    total: { type: Number, default: undefined },
    responsive: { type: String, default: 'auto', validator: oneOf(['auto', 'table', 'cards']) },
    appearance: { type: String, default: 'lines', validator: oneOf(['lines', 'surface']) },
    density: { type: String, default: 'default', validator: oneOf(['default', 'comfortable', 'compact']) },
    maxHeight: { type: String, default: undefined },
    loading: Boolean,
    loadingRows: { type: Number, default: 3, validator: (v) => v >= 1 },
    error: Boolean,
    announceError: { type: Boolean, default: true },
    rowHref: { type: Function, default: undefined },
    activatable: Boolean,
    lastOpened: { type: [String, Number], default: null },
    expanded: { type: Array, default: () => [] },
    rowStatus: { type: Function, default: undefined },
    labels: { type: Object, default: () => ({}) }
  },
  emits: ['update:sort', 'update:selected', 'update:filters', 'update:page', 'update:pageSize', 'retry', 'navigate', 'activate', 'update:lastOpened', 'update:expanded'],
  setup(props, { emit, slots, attrs }) {
    if (isDev && !props.caption && !attrs['aria-label'] && !attrs['aria-labelledby']) {
      console.warn('[Grana] <GTable> necesita caption, aria-label o aria-labelledby (nombre de la tabla).')
    }

    // ---- Estado: v-model opcional (sin él, la tabla gestiona su propio estado) ----
    const mirror = (prop, event) => {
      const state = ref(props[prop])
      watch(() => props[prop], (v) => { state.value = v })
      const set = (v) => { state.value = v; emit(event, v) }
      return [state, set]
    }
    const [sortState, setSort] = mirror('sort', 'update:sort')
    const [selectedState, setSelected] = mirror('selected', 'update:selected')
    const [filtersState, setFilters] = mirror('filters', 'update:filters')
    const [pageState, setPage] = mirror('page', 'update:page')
    const [sizeState, setPageSize] = mirror('pageSize', 'update:pageSize')
    const [lastState, setLast] = mirror('lastOpened', 'update:lastOpened')
    const [expandedState, setExpanded] = mirror('expanded', 'update:expanded')
    const live = ref('')
    provide('g-table-announces-results', true) // la tabla anuncia el recuento: la barra de filtros integrada no lo repite
    if (isDev && props.labels && !props.labels.sorted && Array.isArray(props.columns) && props.columns.some((c) => c.sortable)) {
      console.warn('[Grana] <GTable> tiene columnas ordenables: define labels.sorted para anunciar el cambio de orden.')
    }
    if (isDev && props.selectable && props.labels && !props.labels.selectedCount) {
      console.warn('[Grana] <GTable> con selección: define labels.selectedCount para anunciar cuántas filas hay seleccionadas.')
    }

    // ---- Carga (#265, #540): la región viva única anuncia «cargando» al VERSE la carga y, al terminar, el recuento ----
    // Marca de «orden escrito en este ciclo»: si la carga empieza en el mismo ciclo, el anuncio del orden no se pisa.
    // Se limpia con una tarea (no con un microtask): el watcher de `loading` corre en el vaciado de Vue, después de los microtasks ya encolados.
    let sortedThisTick = false
    let resized = false // el tamaño cambió en este ciclo (esqueleto con las filas que van a llegar)
    let rangeOnArrive = false // el rango espera al final de la carga y sale en lugar de results (#596)
    let warnedLoading = false
    let warnedResults = false
    const warned = new Set()
    const warnOnce = (id, msg) => {
      if (!isDev || warned.has(id)) return
      warned.add(id)
      console.warn(`[Grana] <GTable> ${msg}`)
    }
    const markSorted = () => {
      sortedThisTick = true
      setTimeout(() => { sortedThisTick = false }, 0)
    }
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      if (props.pageSizes && !props.labels.pagination?.pageSize) warnOnce('size', 'con pageSizes: define labels.pagination.pageSize (nombre del selector de filas por página).')
      if (props.pageSizes && !props.labels.range) warnOnce('range', 'con pageSizes: define labels.range para anunciar el rango («Filas {from}–{to} de {total}»).')
      if (slots.detail && props.activatable) warnOnce('act', 'con el slot detail, activatable se ignora: la puerta despliega la ficha.')
      if (slots.detail && !props.labels.detail) warnOnce('detail', 'con el slot detail: define labels.detail (nombre del grupo de la ficha, con {title}).')
    }
    const warnLoadStart = () => {
      if (isDev && !warnedLoading && !props.labels.loading) {
        warnedLoading = true
        console.warn('[Grana] <GTable> con loading: define labels.loading para anunciar la carga (aria-busy solo no lo anuncia la mayoría de lectores).')
      }
    }

    // La tabla pinta SU COPIA de las filas: las nuevas esperan a la llegada (retraso y mínimo incluidos, #540 punto 3)
    const paintedRows = shallowRef(props.rows)
    const appliedError = ref(props.error) // el error se aplica al terminar la carga (punto 7)
    const keepRows = ref(false) // dentro del retraso, las filas que había siguen a la vista (inertes)
    const skeletonRows = ref(props.loadingRows) // tantas como había a la vista, o loadingRows en la primera carga
    let mounted = false
    let startSorted = false
    let focusMem = null
    const phase = createLoadPhase({
      onShow() {
        // Enmienda de #265: «cargando» se escribe cuando el esqueleto se ve; una carga que no se ve solo anuncia su fin
        if (!startSorted && props.labels.loading) live.value = props.labels.loading
      },
      onSlow() {
        if (props.labels.slow) live.value = props.labels.slow
      },
      onArrive() {
        paintedRows.value = props.rows
        appliedError.value = props.error
        if (appliedError.value && !slots.error) {
          if (!props.labels.failed) warnOnce('failed', 'con error: define labels.failed (texto del fallo, visible y anunciado) o el slot error.')
          if (!props.labels.retry) warnOnce('retry', 'con error: define labels.retry («Reintentar») o el slot error.')
        }
        // En el ciclo siguiente: el recuento (o el fallo) ya actualizado y el foco de vuelta a su fila (#534)
        nextTick(() => {
          if (appliedError.value) live.value = props.announceError ? props.labels.failed || '' : ''
          else if (rangeOnArrive) announceRange()
          else live.value = props.labels.results ? fill(props.labels.results, { count: totalCount.value }) : ''
          rangeOnArrive = false
          if (focusMem) {
            const mem = focusMem
            focusMem = null
            restoreFocus(tableEl.value, mem, findRow)
          }
        })
      }
    })
    const ph = phase.state
    const begin = (arm) => {
      // Filas a la vista ahora (antes de montar no se ha visto nada: primera carga)
      const shown = mounted && !ph.busy && !appliedErrorRow() ? visible.value.length : 0
      const kind = phase.start({ arm })
      if (kind !== 'new') return
      startSorted = sortedThisTick
      // La región viva se vacía al empezar (#14): una recarga que no se ve y acaba con el mismo recuento vuelve a
      // anunciarse (hallazgo 7). El orden escrito en este mismo ciclo no se pisa
      if (!startSorted) live.value = ''
      // Tras un cambio de tamaño (enmienda de #540 punto 2): las filas que van a llegar, ya en el gesto
      const sz = sizeEff.value
      keepRows.value = shown > 0 && !resized
      skeletonRows.value = resized && sz ? Math.max(1, Math.min(sz, external.value ? props.total - (currentPage.value - 1) * sz : sz))
        : shown > 0 ? (sz ? Math.min(shown, sz) : shown) : props.loadingRows
      warnLoadStart()
      captureFocus()
    }
    watch(() => props.loading, (now) => {
      if (now) { pendingCount = false; begin(true); return }
      if (isDev && !warnedResults && !props.labels.results) {
        warnedResults = true
        console.warn('[Grana] <GTable> terminó de cargar: define labels.results para anunciar cuántas filas hay.')
      }
      phase.stop()
    })
    // Fuera de una carga, filas y error se aplican al cambiar
    watch(() => props.rows, (v) => { if (!ph.busy) paintedRows.value = v })
    watch(() => props.error, (v) => { if (!ph.busy) appliedError.value = v })
    onMounted(() => {
      mounted = true
      // Montada ya cargando: la región existe vacía desde el montaje (#14) y el texto llega al verse la carga
      if (props.loading) phase.arm()
    })
    onBeforeUnmount(() => phase.dispose())

    // ---- Columnas ----
    const cols = computed(() => props.columns)
    const primary = computed(() => cols.value.find((c) => c.primary) || cols.value.find((c) => c.title) || cols.value[0])
    const isComposite = (c) => Boolean(c.title)
    const sortField = (c) => c.sortBy || c.title || c.key
    const titleOf = (row) => { const p = primary.value; return p ? row[p.title || p.key] : '' }
    const keyOf = (row) => row[props.rowKey]

    // ---- Datos: filtrar → ordenar → paginar ----
    const filtered = computed(() => (props.filterMode === 'local' ? applyFilters(paintedRows.value, cols.value, filtersState.value) : paintedRows.value))
    const collator = computed(() => new Intl.Collator(locale(), { numeric: true, sensitivity: 'base' }))
    const sorted = computed(() => {
      const s = sortState.value
      if (!s || props.sortMode !== 'local') return filtered.value
      const col = cols.value.find((c) => c.key === s.key)
      if (!col) return filtered.value
      const f = sortField(col)
      const dir = s.direction === 'descending' ? -1 : 1
      return [...filtered.value].sort((a, b) => {
        const x = a[f], y = b[f]
        if (x == null && y == null) return 0
        if (x == null) return 1
        if (y == null) return -1
        return (typeof x === 'number' && typeof y === 'number' ? x - y : collator.value.compare(String(x), String(y))) * dir
      })
    })
    const external = computed(() => props.total !== undefined)
    const totalCount = computed(() => (external.value ? props.total : filtered.value.length))
    // Tamaño efectivo (#593): el del v-model o, con pageSizes y sin él, el primero (el menor) de la lista
    const sizeEff = computed(() => sizeState.value || pageSizeList(props.pageSizes).sizes[0])
    const docked = computed(() => pageSizeList(props.pageSizes).sizes.length > 0)
    const pages = computed(() => (sizeEff.value ? Math.max(1, Math.ceil(totalCount.value / sizeEff.value)) : 1))
    // Página efectiva: nunca más allá de la última (p. ej. tras filtrar)
    const currentPage = computed(() => Math.min(Math.max(1, pageState.value), pages.value))
    const visible = computed(() => {
      const sz = sizeEff.value
      if (!sz || external.value) return sorted.value
      const start = (currentPage.value - 1) * sz
      return sorted.value.slice(start, start + sz)
    })

    // ---- Selección (página visible) ----
    const selectedSet = computed(() => new Set(selectedState.value))
    const pageKeys = computed(() => visible.value.map(keyOf))
    const pageSelected = computed(() => pageKeys.value.filter((k) => selectedSet.value.has(k)).length)
    const toggleRow = (k, on) => setSelected(on ? [...selectedState.value, k] : selectedState.value.filter((x) => x !== k))
    const toggleAll = () => {
      const all = pageKeys.value.length > 0 && pageSelected.value === pageKeys.value.length
      const page = new Set(pageKeys.value)
      setSelected(all ? selectedState.value.filter((k) => !page.has(k)) : [...selectedState.value, ...pageKeys.value.filter((k) => !selectedSet.value.has(k))])
    }

    // ---- Orden ----
    const sortBy = (key, direction) => {
      const s = sortState.value
      const next = direction ? { key, direction } : s && s.key === key ? { key, direction: s.direction === 'ascending' ? 'descending' : 'ascending' } : { key, direction: 'ascending' }
      setSort(next)
      const col = cols.value.find((c) => c.key === key)
      if (props.labels.sorted && col) { live.value = fill(props.labels.sorted, { label: col.label, direction: props.labels[next.direction] || next.direction }); markSorted() }
    }

    // ---- Filtros ----
    const hasFilters = computed(() => cols.value.some((c) => c.filter))
    // Recuento tras un cambio de filtros (#265 + L3 de card-group): el mismo canal y el mismo texto venga el cambio de la
    // barra o de la prop `filters` (tarjetas, búsqueda propia, URL). Nunca en la carga inicial (el watcher no es inmediato).
    // Con la tabla cargando, el fin de la carga anuncia el nuevo (#540). Con filterMode 'external' el recuento es de los
    // datos que trae la aplicación: espera a que lleguen (fin de la carga, o filas o total nuevos sin carga).
    let ownFilters = null // el último valor emitido por la barra: su eco por v-model no se anuncia otra vez
    let pendingCount = false // filtro externo cambiado y datos aún sin llegar
    let filteredThisTick = false // los filtros cambiaron en este ciclo: su recuento gana al rango (#596)
    let rowsFresh = false // filas o total cambiados en este mismo ciclo (pueden llegar junto al filtro)
    const announceCount = () => { if (props.labels.results) live.value = fill(props.labels.results, { count: totalCount.value }) }
    const filtersChanged = () => {
      if (props.filterMode !== 'external') {
        nextTick(() => { if (!props.loading) announceCount() })
        return
      }
      const rowsAt = props.rows
      const totalAt = props.total
      pendingCount = true
      nextTick(() => {
        if (!pendingCount) return
        if (props.loading || ph.busy) { pendingCount = false; return } // la llegada anuncia
        if (rowsFresh || props.rows !== rowsAt || props.total !== totalAt) { pendingCount = false; announceCount() }
      })
    }
    const markFiltered = () => {
      filteredThisTick = true
      setTimeout(() => { filteredThisTick = false }, 0)
    }
    const onFilters = (f) => {
      markFiltered()
      ownFilters = f
      setFilters(f)
      if (pageState.value !== 1) setPage(1)
      filtersChanged()
    }
    const clearFilters = () => {
      const lost = root.value && root.value.querySelector('.g-table__empty')?.contains(document.activeElement)
      onFilters([])
      // El botón «Limpiar» desaparece con el vacío: el foco pasa a «Agregar filtro» (o a la tabla) en vez de caer en body
      if (lost) nextTick(() => (root.value?.querySelector('.g-filter-bar button') || root.value?.querySelector('table'))?.focus?.())
    }
    // Filtros cambiados desde fuera: también vuelven a la página 1
    watch(() => props.filters, (f) => {
      markFiltered()
      if (pageState.value !== 1) setPage(1)
      if (f === ownFilters) return // eco del v-model de la barra: ya anunciado
      ownFilters = null
      filtersChanged()
    })
    // filterMode 'external' sin carga: el recuento se anuncia cuando llegan las filas (o el total) del filtro nuevo
    watch([() => props.rows, () => props.total], () => {
      rowsFresh = true
      setTimeout(() => { rowsFresh = false }, 0)
      if (!pendingCount || props.loading || ph.busy) return
      pendingCount = false
      nextTick(announceCount)
    })

    // ---- Foco durante la carga (#534): del <tbody> (o de la barra de fallo) al <table>, y de vuelta por rowKey ----
    const tableEl = ref(null)
    const tbodyEl = ref(null)
    const failedEl = ref(null)
    const findRow = (key) => {
      const i = visible.value.findIndex((r) => keyOf(r) === key)
      const body = tbodyEl.value
      return i >= 0 && body && !ph.busy ? withDetail(rowsOf()[i]) : null
    }
    // La ficha cuenta como parte de su fila (#534): sus enfocables siguen a los de la fila, con la misma clave
    const withDetail = (tr) => {
      const det = tr && tr.nextElementSibling?.classList.contains('g-table__detail') ? tr.nextElementSibling : null
      return !det ? tr || null : { querySelectorAll: (q) => [...tr.querySelectorAll(q), ...det.querySelectorAll(q)] }
    }
    function captureFocus() {
      const t = tableEl.value
      if (!t || typeof document === 'undefined') return
      const a = document.activeElement
      const inBody = tbodyEl.value && tbodyEl.value.contains(a)
      const inBar = failedEl.value && failedEl.value.contains(a)
      if (!a || (!inBody && !inBar)) return
      focusMem = { key: null, index: 0 }
      let tr = inBody ? a.closest('tr') : null
      if (tr && tr.classList.contains('g-table__detail')) tr = tr.previousElementSibling // la ficha cuenta con su fila
      const i = tr ? rowsOf().indexOf(tr) : -1
      const row = i >= 0 ? visible.value[i] : null
      if (row) focusMem = rememberFocus(withDetail(tr), keyOf(row), a)
      t.focus({ preventScroll: true })
    }
    // ¿Se ve la fila de error (fallo sin filas)?
    function appliedErrorRow() { return Boolean(appliedError.value) && !visible.value.length }
    const failedBar = computed(() => !ph.busy && Boolean(appliedError.value) && visible.value.length > 0)
    const retry = () => emit('retry')
    // Montada ya cargando: primera carga (estado en setup, temporizadores al montar; nada en el servidor)
    if (props.loading) begin(false)

    // ---- Filas reales a la vista: claves e índice base de lo pintado (lo escribe el render; la fila ancla lo lee) ----
    const scrollEl = ref(null)
    const pagerRef = ref(null)
    const uid = useId()
    let lastKeys = []
    let lastBase = 0
    const rowsOf = () => (tbodyEl.value ? [...tbodyEl.value.rows].filter((r) => r.classList.contains('g-table__row') && !r.hasAttribute('aria-hidden')) : [])

    // ---- La fila ancla (#594): la tabla es su dueña y su GPagination la pide una vez al elegir el tamaño ----
    let hold = null // { key, top, index }: la fila (o la ranura del esqueleto) que no se mueve
    let prevKeys = new Set()
    const stuck = ref(false)
    const half = (el, top, bottom) => {
      const r = el.getBoundingClientRect()
      return r.height > 0 && Math.min(r.bottom, bottom) - Math.max(r.top, top) >= r.height / 2
    }
    const anchor = () => {
      const list = rowsOf()
      hold = null
      prevKeys = new Set(lastKeys)
      if (!list.length) return null
      // 1. El foco dentro de una fila (o de su ficha); 2. la primera fila a la vista al menos a medias, bajo la cabecera
      // pegajosa y sobre el pie acoplado; 3. sin la tabla a la vista, la primera de la página sin sujetar nada
      const a = document.activeElement
      let tr = a && tbodyEl.value.contains(a) ? a.closest('tr') : null
      if (tr && tr.classList.contains('g-table__detail')) tr = tr.previousElementSibling
      let i = list.indexOf(tr)
      if (i < 0) {
        let top = 0
        let bottom = innerHeight
        const sc = props.maxHeight && scrollEl.value
        const nav = stuck.value && pagerRef.value?.$el
        if (sc) { const r = sc.getBoundingClientRect(); top = Math.max(0, r.top); bottom = Math.min(bottom, r.bottom) }
        if (tableEl.value.tHead) top = Math.max(top, tableEl.value.tHead.getBoundingClientRect().bottom)
        if (nav) bottom = Math.min(bottom, nav.getBoundingClientRect().top)
        i = list.findIndex((r) => half(r, top, bottom) || (r.nextElementSibling?.classList.contains('g-table__detail') && half(r.nextElementSibling, top, bottom)))
      }
      if (i >= 0) hold = { key: lastKeys[i], top: list[i].getBoundingClientRect().top, index: lastBase + i }
      return { index: lastBase + Math.max(0, i) }
    }
    // Compensa el desplazamiento (área desplazable con maxHeight, luego la ventana) en el mismo cuadro: Δ ≤ 1px
    const shift = (el, top) => {
      let d = el.getBoundingClientRect().top - top
      const sc = scrollEl.value
      if (Math.abs(d) >= 0.5 && sc && sc.scrollHeight > sc.clientHeight) {
        const b = sc.scrollTop
        sc.scrollBy({ top: d, behavior: 'instant' })
        d -= sc.scrollTop - b
      }
      if (Math.abs(d) >= 0.5) window.scrollBy({ top: d, behavior: 'instant' })
      // Red de seguridad sin el pie acoplado: el control con el foco no queda fuera de la vista (WCAG 2.4.7, 2.4.11)
      const f = document.activeElement
      if (!stuck.value && f && root.value?.contains(f) && !tbodyEl.value.contains(f)) {
        const r = f.getBoundingClientRect()
        if (r.top < 0 || r.bottom > innerHeight) f.scrollIntoView({ block: 'nearest' })
      }
    }
    // Cambio del tamaño efectivo por cualquier vía (pie o props): síncrono, con lo pintado aún en el DOM
    watch(sizeEff, (n, o) => {
      if (!mounted || !o) return
      resized = true
      setTimeout(() => { resized = false }, 0)
      if (!hold) anchor()
    }, { flush: 'sync' })
    onUpdated(() => {
      if (!hold) return
      if (ph.busy) {
        // Servidor: la ranura del esqueleto de la posición del ancla se sujeta donde estaba la fila
        const s = tbodyEl.value.rows[hold.index - (currentPage.value - 1) * sizeEff.value]
        if (s && s.hasAttribute('aria-hidden')) shift(s, hold.top)
        return
      }
      const { key, top } = hold
      const i = lastKeys.indexOf(key)
      hold = null
      if (i < 0) return
      shift(rowsOf()[i], top)
      fresh.value = new Set(lastKeys.filter((k) => !prevKeys.has(k)))
      markHere(key)
    })

    // «Aquí estabas» (is-here) y filas que entran (is-new): se quitan en animationend o, sin animación, tras HERE_MS
    const hereKey = ref(null)
    const fresh = ref(new Set())
    let hereTimer = 0
    const markHere = (k) => {
      hereKey.value = k
      clearTimeout(hereTimer)
      nextFrame(() => {
        const tr = tbodyEl.value?.querySelector('.is-here')
        const moving = (re) => [tr, tr?.cells[0]].some((el) => el && re.test(getComputedStyle(el).animationName))
        if (!moving(/g-table-new|g-table-here/)) fresh.value = new Set()
        if (!moving(/g-table-here/)) hereTimer = setTimeout(() => { if (hereKey.value === k) hereKey.value = null }, HERE_MS)
      })
    }
    const onAnimationend = (e) => {
      if (/g-table-here/.test(e.animationName)) hereKey.value = null
      else if (/g-table-new/.test(e.animationName) && fresh.value.size) fresh.value = new Set()
    }

    // ---- Pie acoplado (#595): acoplado ahora (IntersectionObserver) y su alto en --_dock-size (ResizeObserver) ----
    const dockSize = ref(0)
    let io = null
    let ro = null
    const observeDock = () => {
      io?.disconnect()
      ro?.disconnect()
      io = ro = null
      const nav = docked.value && pagerRef.value?.$el
      if (!(nav instanceof Element)) { stuck.value = false; return }
      if (typeof IntersectionObserver !== 'undefined') {
        // Acoplado = tocando el borde inferior de la vista (raíz recortada 1px): visible pero no entero
        io = new IntersectionObserver(([e]) => {
          stuck.value = e.isIntersecting && e.intersectionRatio < 1 && Boolean(e.rootBounds) && e.boundingClientRect.bottom > e.rootBounds.bottom
        }, { rootMargin: '0px 0px -1px 0px', threshold: [0, 1] })
        io.observe(nav)
      }
      if (typeof ResizeObserver !== 'undefined') {
        ro = new ResizeObserver(() => raf(() => { const hgt = nav.getBoundingClientRect().height; if (hgt !== dockSize.value) dockSize.value = hgt }))
        ro.observe(nav)
      }
    }
    onMounted(observeDock)
    watch([docked, pagerRef], observeDock, { flush: 'post' })
    onBeforeUnmount(() => { io?.disconnect(); ro?.disconnect(); clearTimeout(hereTimer) })
    provide(pagerKey, reactive({ anchor, dock: docked, stuck, announcesRange: computed(() => Boolean(props.labels.range)) }))

    // ---- Anuncio del rango (#596): una vez, en el ciclo siguiente, por cualquier vía; filtros > orden > rango ----
    const announceRange = () => {
      const n = totalCount.value
      const sz = sizeEff.value || n
      live.value = n ? fill(props.labels.range, { from: (currentPage.value - 1) * sz + 1, to: Math.min(currentPage.value * sz, n), total: n })
        : props.labels.results ? fill(props.labels.results, { count: 0 }) : ''
    }
    watch([currentPage, sizeEff], () => {
      if (!props.labels.range) return
      nextTick(() => {
        if (filteredThisTick || sortedThisTick) return
        if (props.loading || ph.busy) rangeOnArrive = true
        else announceRange()
      })
    })

    // ---- La puerta (#597, #598) y el rastro ----
    // Enlace (#505 con #574): navigate solo con clic primario sin modificadores ni defaultPrevented, o Intro (click con detail 0)
    const openLink = (e, row, k, href) => {
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.defaultPrevented || e.detail > 1) return
      emit('navigate', { row, key: k, href, event: e })
      setLast(k)
    }
    const activate = (e, row, k) => {
      emit('activate', { row, key: k, event: e })
      setLast(k)
    }
    // El rastro se ilumina cuando el foco vuelve a su puerta desde fuera de la tabla (cierre de un diálogo de detalle)
    const onFocusin = (e) => {
      const t = e.target
      const k = lastState.value
      // WebKit: clic de ratón en <a> no enfoca el enlace; el relatedTarget puede ser <table tabindex=-1>,
      // que no cuenta como "foco desde dentro" (es el ancla de foco del recipiente, no un control real)
      const fromInside = e.relatedTarget && root.value.contains(e.relatedTarget) && e.relatedTarget !== tableEl.value
      if (k == null || !t.classList.contains('g-table__door') || fromInside) return
      if (lastKeys[rowsOf().indexOf(t.closest('tr'))] === k) markHere(k)
    }
    // Vuelta de una ruta: la fila del rastro a la vista se ilumina (la tabla no desplaza hasta ella).
    // Se mide un cuadro después de montar: al montar, el contenedor de la aplicación puede seguir oculto (v-cloak) y la fila mide 0
    onMounted(() => nextFrame(() => {
      const i = lastState.value == null ? -1 : lastKeys.indexOf(lastState.value)
      const r = i >= 0 && rowsOf()[i]?.getBoundingClientRect()
      if (r && r.height && r.bottom > 0 && r.top < innerHeight) markHere(lastState.value)
    }))

    // ---- Despliegue (B, #599): fichas montadas al desplegar y desmontadas al terminar de plegar ----
    const expSet = computed(() => new Set(expandedState.value))
    const closing = ref(new Set())
    const instant = ref(new Set(props.expanded))
    const settleInstant = () => nextFrame(() => nextFrame(() => { instant.value = new Set() }))
    onMounted(settleInstant)
    // Al llegar la carga, las fichas que siguen vuelven en su sitio sin animar
    watch(() => ph.busy, (b) => {
      if (b || !expandedState.value.length) return
      instant.value = new Set(expandedState.value)
      settleInstant()
    })
    const doorOf = (k) => rowsOf()[lastKeys.indexOf(k)]?.querySelector('.g-table__door')
    const unmountDetail = (k) => {
      if (!closing.value.has(k)) return
      const s = new Set(closing.value)
      s.delete(k)
      closing.value = s
    }
    watch(expandedState, (now, before) => {
      const gone = (before || []).filter((k) => !now.includes(k))
      if (!gone.length) return
      closing.value = new Set([...closing.value, ...gone])
      // Respaldo del transitionend (sin transición, con movimiento reducido, no llega)
      nextTick(() => gone.forEach((k) => {
        const b = document.getElementById(`${uid}-d${lastKeys.indexOf(k)}`)
        setTimeout(() => { if (!expSet.value.has(k)) unmountDetail(k) }, transitionMs(b) + 50)
      }))
    })
    const fold = (k, focus) => {
      if (focus) doorOf(k)?.focus({ preventScroll: true }) // a la puerta ANTES de plegar (2.4.3)
      setExpanded(expandedState.value.filter((x) => x !== k))
    }
    const toggle = (e, k) => {
      if (e.detail > 1) return // el segundo clic de un doble clic no vuelve a plegar (#650)
      if (expSet.value.has(k)) fold(k)
      else setExpanded([...expandedState.value, k])
    }
    // Se depura al cambiar las filas: las claves que ya no están se quitan con un solo update:expanded
    watch(visible, (v) => {
      const keys = new Set(v.map(keyOf))
      const keep = expandedState.value.filter((k) => keys.has(k))
      if (keep.length !== expandedState.value.length) setExpanded(keep)
    })
    // Clic de fila reenviado (solo B): un manejador en el <tbody>; nunca desde un control, la casilla, las acciones, una
    // selección de texto, un arrastre, el segundo clic de un doble clic, la ficha o un clic ya atendido
    let down = null
    const onPointerdown = (e) => { down = [e.clientX, e.clientY] }
    const onBodyClick = (e) => {
      const t = e.target
      const tr = t.closest?.('tr')
      const from = down
      down = null
      if (!slots.detail || !tr || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.detail > 1 || e.defaultPrevented) return
      if (!tr.classList.contains('g-table__row') || tr.hasAttribute('aria-hidden')) return
      const c = t.closest(`${CONTROL},.g-table__select,.g-table__actions`)
      if (c && tr.contains(c)) return
      const sel = typeof getSelection === 'function' && getSelection()
      if (sel && !sel.isCollapsed && sel.toString() && sel.containsNode(tr, true)) return
      if (from && Math.hypot(e.clientX - from[0], e.clientY - from[1]) > DRAG_PX) return
      const door = tr.querySelector('.g-table__door')
      if (!door) return
      door.focus({ preventScroll: true })
      door.click()
    }
    const onDetailKey = (e, k) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      e.preventDefault()
      e.stopPropagation()
      fold(k, true)
    }

    // ---- Estado de fila (#600) ----
    const statusOf = (row) => {
      const st = props.rowStatus ? props.rowStatus(row) : null
      if (!st) return null
      if (!STATUS[st.status]) {
        if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') warnOnce('status', `rowStatus devolvió status «${st.status}»: usa info, success, warning o error (se ignora).`)
        return null
      }
      if (!st.text && typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') warnOnce('text', 'rowStatus sin text: la etiqueta necesita su texto (sin él solo se pintan tono y forma).')
      return st
    }

    // ---- Modo tabla / tarjetas por el ancho del contenedor ----
    const root = ref(null)
    const width = ref(0)
    const space = ref(NaN)
    const need = computed(() => {
      const units = cols.value.reduce((s, c) => s + (c.min || (isComposite(c) ? 40 : 24)), 0) + (props.selectable ? 10 : 0) + (slots['row-actions'] ? 10 : 0)
      return units * space.value
    })
    const mode = computed(() => {
      if (props.responsive !== 'auto') return props.responsive
      if (!width.value || Number.isNaN(space.value)) return 'table'
      return width.value < need.value ? 'cards' : 'table'
    })
    let observer = null
    let frame = 0
    let pending = 0
    const raf = (f) => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(f) : setTimeout(f, 16))
    const caf = (id) => (typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame(id) : clearTimeout(id))
    onMounted(() => {
      if (!root.value) return
      space.value = toPx(getComputedStyle(root.value).getPropertyValue('--g-space-1'))
      width.value = root.value.getBoundingClientRect().width
      if (typeof ResizeObserver !== 'undefined') {
        // La escritura va al cuadro siguiente y solo si cambia: dentro de la devolución, WebKit avisa «ResizeObserver loop completed» (#169)
        observer = new ResizeObserver((e) => {
          const w = e[e.length - 1]?.contentRect?.width
          if (!w) return
          pending = w
          if (frame) return
          frame = raf(() => {
            frame = 0
            if (pending && pending !== width.value) width.value = pending
            pending = 0
          })
        })
        observer.observe(root.value)
      }
    })
    onBeforeUnmount(() => { if (observer) observer.disconnect(); if (frame) caf(frame) })

    // ---- Render ----
    const L = () => props.labels
    // La puerta de la fila (A enlace, botón, o B divulgación) con el título como nombre; null sin puerta
    const door = (row, r, text) => {
      const d = r.detail
      const sid = r.st && r.st.text ? `${uid}-s${r.i}` : undefined
      const base = { class: 'g-table__door', 'aria-describedby': sid }
      if (d) {
        return h('button', {
          ...base, type: 'button', 'aria-expanded': String(r.open), 'aria-controls': r.open ? `${uid}-d${r.i}` : undefined,
          onClick: (e) => toggle(e, r.k)
        }, [h('span', { class: 'g-table__door-chevron', 'aria-hidden': 'true' }, [h(GIcon, { name: 'chevron-right', class: 'g-icon--flip-rtl' })]), text])
      }
      if (r.href) return h('a', { ...base, href: r.href, onClick: (e) => openLink(e, row, r.k, r.href) }, text)
      if (props.activatable) return h('button', { ...base, type: 'button', onClick: (e) => activate(e, row, r.k) }, text)
      return null
    }
    const arrow = (r) => (r.href && !r.detail ? h('span', { class: 'g-table__door-arrow', 'aria-hidden': 'true' }, [h(GIcon, { name: 'arrow-right', class: 'g-icon--flip-rtl' })]) : null)
    const badge = (r) => {
      const st = r.st
      if (!st || !st.text) return null
      const [color, icon] = STATUS[st.status]
      return h('span', { class: 'g-table__status' }, [h(GBadge, { id: `${uid}-s${r.i}`, variant: 'soft', size: 'sm', color }, {
        icon: () => h(GIcon, { name: icon }),
        default: () => st.text
      })])
    }
    const cellContent = (c, row, r) => {
      const value = row[c.key]
      const slot = slots[`cell-${c.key}`]
      const primaryCell = c === primary.value && r
      if (isComposite(c) && !slot) {
        const lead = slots[`leading-${c.key}`]
        const title = String(row[c.title] ?? '')
        const d = primaryCell && door(row, r, title)
        return h('span', { class: 'g-table__composite' }, [
          lead ? h('span', { class: 'g-table__leading', 'aria-hidden': 'true' }, lead({ row }))
            : c.leading ? h('span', { class: 'g-table__leading', 'aria-hidden': 'true' }, String(row[c.leading] ?? '')) : null,
          h('span', { class: 'g-table__text' }, [
            h('span', { class: 'g-table__title' }, d || title),
            c.subtitle ? h('span', { class: 'g-table__subtitle' }, String(row[c.subtitle] ?? '')) : null
          ]),
          primaryCell ? arrow(r) : null,
          primaryCell && !r.cause ? badge(r) : null
        ])
      }
      if (slot) return slot({ row, value, column: c })
      const out = c.format ? c.format(value, row) : value ?? ''
      if (primaryCell) {
        const d = door(row, r, String(out))
        if (d) return [h('span', { class: 'g-table__title' }, d), arrow(r), r.cause ? null : badge(r)]
        return r.cause ? out : [out, badge(r)]
      }
      return r && r.cause === c.key ? [out, badge(r)] : out
    }
    const header = () => {
      const s = sortState.value
      const cells = []
      if (props.selectable) {
        cells.push(h('th', { role: 'columnheader', scope: 'col', class: 'g-table__select' }, [
          h('input', {
            type: 'checkbox', 'aria-label': L().selectAll,
            checked: pageKeys.value.length > 0 && pageSelected.value === pageKeys.value.length,
            indeterminate: pageSelected.value > 0 && pageSelected.value < pageKeys.value.length,
            disabled: !pageKeys.value.length,
            onChange: toggleAll
          })
        ]))
      }
      cols.value.forEach((c) => {
        const active = s && s.key === c.key
        cells.push(h('th', {
          role: 'columnheader', scope: 'col', key: c.key,
          class: c.align === 'end' ? 'g-table__cell--end' : undefined,
          'aria-sort': active ? s.direction : undefined
        }, c.sortable
          ? [h('button', { type: 'button', class: 'g-table__sort', onClick: () => sortBy(c.key) }, [
              c.label,
              h(GIcon, { class: 'g-table__sort-icon', name: active ? (s.direction === 'ascending' ? 'arrow-up' : 'arrow-down') : 'chevrons-up-down' })
            ])]
          : c.label))
      })
      if (slots['row-actions']) cells.push(h('th', { role: 'columnheader', scope: 'col', class: 'g-table__actions' }, [h('span', { class: 'g-table__sr' }, L().actionsHeader)]))
      return h('thead', { role: 'rowgroup' }, [h('tr', { role: 'row' }, cells)])
    }
    const colCount = () => cols.value.length + (props.selectable ? 1 : 0) + (slots['row-actions'] ? 1 : 0)
    const skeleton = () => Array.from({ length: skeletonRows.value }, (_, i) => h('tr', { role: 'row', class: 'g-table__row', 'aria-hidden': 'true', key: `sk-${i}` }, [
      props.selectable ? h('td', { role: 'cell', class: 'g-table__select' }) : null,
      ...cols.value.map((c) => h('td', {
        role: 'cell', key: c.key,
        class: ['g-table__cell', { 'g-table__cell--primary': c === primary.value, 'g-table__cell--end': c.align === 'end' }]
      }, [h('span', { class: 'g-table__skeleton' })])),
      slots['row-actions'] ? h('td', { role: 'cell', class: 'g-table__actions' }) : null
    ]))
    const stateRow = (key, content) => [h('tr', { role: 'row', key }, [h('td', { role: 'cell', class: 'g-table__empty', colspan: colCount() }, content)])]
    const body = () => {
      // Cargando: dentro del retraso, las filas de antes (inertes, en el <tbody>); si no había, el esqueleto invisible
      // (is-pending); desde que se ve, el esqueleto con las filas que había a la vista. Nunca el texto de vacío.
      if (ph.busy && !(ph.pending && keepRows.value)) return skeleton()
      if (!visible.value.length) {
        if (appliedError.value) {
          // Fallo sin filas (enmienda de #327): el slot error o GEmpty cause="error" con «Reintentar»
          return stateRow('error', slots.error
            ? slots.error({ retry })
            : [h(GEmpty, { cause: 'error', title: L().failed || '' }, {
                actions: () => h(GBtn, { size: 'sm', variant: 'soft', color: 'neutral', onClick: retry }, () => L().retry)
              })])
        }
        const filteredEmpty = filtersState.value.length > 0
        // Vacío por defecto con GEmpty (#540 punto 8); con el slot, manda el slot
        return stateRow('empty', slots.empty
          ? slots.empty({ filtered: filteredEmpty, clear: clearFilters })
          : filteredEmpty
            ? [h(GEmpty, { cause: 'filtered', title: L().emptyFiltered || '' }, {
                actions: () => h(GBtn, { size: 'sm', variant: 'outline', color: 'brand', onClick: clearFilters }, () => L().clearFilters)
              })]
            : [h(GEmpty, { cause: 'none', title: L().empty || '' })])
      }
      const detail = slots.detail
      const keys = cols.value.map((c) => c.key)
      lastKeys = visible.value.map(keyOf)
      lastBase = (currentPage.value - 1) * (sizeEff.value || 0)
      if ((typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') && !detail && (props.rowHref || props.activatable) && primary.value && slots[`cell-${primary.value.key}`]) {
        warnOnce('slot', `rowHref/activatable con el slot cell-${primary.value.key} en la columna principal: no se pinta la puerta (ponla tú en el slot).`)
      }
      return visible.value.flatMap((row, i) => {
        const k = keyOf(row)
        const sel = selectedSet.value.has(k)
        const title = titleOf(row)
        const st = props.rowStatus ? statusOf(row) : null
        const href = props.rowHref ? props.rowHref(row) || undefined : undefined
        const open = Boolean(detail) && expSet.value.has(k)
        const r = { k, i, st, href, detail: Boolean(detail), open, cause: st && st.text && st.key && st.key !== primary.value?.key && keys.includes(st.key) ? st.key : null }
        if ((typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') && (detail || href || props.activatable) && !String(title ?? '').trim()) {
          warnOnce('empty', 'Una fila con puerta tiene el título vacío: la puerta se queda sin nombre accesible.')
        }
        const tr = h('tr', {
          role: 'row', key: k, 'data-status': st ? st.status : undefined,
          class: ['g-table__row', { 'is-selected': sel, 'is-last-opened': lastState.value != null && lastState.value === k, 'is-here': hereKey.value === k, 'is-new': fresh.value.has(k), 'is-expanded': open }]
        }, [
          props.selectable ? h('td', { role: 'cell', class: 'g-table__select' }, [
            h('input', { type: 'checkbox', checked: sel, 'aria-label': L().selectRow ? rowText(L().selectRow, row, title) : String(title), onChange: (e) => toggleRow(k, e.target.checked) })
          ]) : null,
          ...cols.value.map((c) => h('td', {
            role: 'cell', key: c.key, 'data-status': r.cause === c.key ? st.status : undefined,
            class: ['g-table__cell', { 'g-table__cell--composite': isComposite(c), 'g-table__cell--primary': c === primary.value, 'g-table__cell--end': c.align === 'end', 'g-table__cell--cause': r.cause === c.key }]
          }, [h('span', { class: 'g-table__label', 'aria-hidden': 'true' }, c.label), cellContent(c, row, r)])),
          slots['row-actions'] ? h('td', { role: 'cell', class: 'g-table__actions' }, slots['row-actions']({ row })) : null
        ])
        if (!detail || !(open || closing.value.has(k))) return [tr]
        return [tr, h('tr', { role: 'row', key: `d-${k}`, class: ['g-table__detail', { 'is-open': open, 'is-instant': instant.value.has(k) }] }, [
          h('td', { role: 'cell', class: 'g-table__detail-cell', colspan: colCount() }, [
            h('div', {
              class: 'g-table__detail-body', role: 'group', id: `${uid}-d${i}`, 'aria-label': fill(L().detail || '', { title }),
              onKeydown: (e) => onDetailKey(e, k),
              onTransitionend: (e) => { if (e.target === e.currentTarget && e.propertyName === 'grid-template-rows' && !expSet.value.has(k)) unmountDetail(k) }
            }, [h('div', { class: 'g-table__detail-content' }, detail({ row, key: k, href: href || null, close: () => fold(k, true) }))])
          ])
        ])]
      })
    }
    const bar = () => {
      const s = sortState.value
      const sortable = cols.value.filter((c) => c.sortable)
      const kids = []
      if (props.selectable) {
        kids.push(h('label', { class: 'g-table__bar-cards' }, [
          h('input', {
            type: 'checkbox',
            checked: pageKeys.value.length > 0 && pageSelected.value === pageKeys.value.length,
            indeterminate: pageSelected.value > 0 && pageSelected.value < pageKeys.value.length,
            onChange: toggleAll
          }),
          L().selectAll
        ]))
      }
      if (sortable.length) {
        kids.push(h('label', { class: 'g-table__bar-cards' }, [
          L().sortBy,
          h('select', { value: s ? s.key : '', onChange: (e) => (e.target.value ? sortBy(e.target.value, s?.direction || 'ascending') : setSort(null)) }, [
            h('option', { value: '' }, '—'),
            ...sortable.map((c) => h('option', { value: c.key, selected: s && s.key === c.key }, c.label))
          ])
        ]))
        kids.push(h('label', { class: 'g-table__bar-cards' }, [
          h('span', { class: 'g-table__sr' }, L().sortBy),
          h('select', { value: s?.direction || 'ascending', disabled: !s, onChange: (e) => s && sortBy(s.key, e.target.value) }, [
            h('option', { value: 'ascending', selected: s?.direction !== 'descending' }, L().ascending),
            h('option', { value: 'descending', selected: s?.direction === 'descending' }, L().descending)
          ])
        ]))
      }
      if (slots.toolbar) kids.push(...slots.toolbar())
      if (props.selectable && L().selectedCount) kids.push(h('span', { class: 'g-table__count', role: 'status' }, fill(L().selectedCount, { count: selectedState.value.length })))
      return kids.length ? h('div', { class: 'g-table__bar' }, kids) : null
    }

    // El nombre accesible va a la tabla; el resto de atributos (class, style, data-*, escuchas) a la raíz
    const tableAttrs = () => ({ 'aria-label': attrs['aria-label'], 'aria-labelledby': attrs['aria-labelledby'], 'aria-describedby': attrs['aria-describedby'] })
    const rootAttrs = () => Object.fromEntries(Object.entries(attrs).filter(([k]) => !['aria-label', 'aria-labelledby', 'aria-describedby'].includes(k)))

    return () => h('div', {
      ...rootAttrs(),
      ref: root,
      style: [attrs.style, docked.value && dockSize.value ? { '--_dock-size': `${dockSize.value}px` } : null],
      class: [attrs.class, 'g-table', `g-table--mode-${mode.value}`, `g-table--appearance-${props.appearance}`, `g-table--density-${props.density}`, {
        'has-door': !slots.detail && Boolean(props.rowHref || props.activatable),
        'has-detail': Boolean(slots.detail),
        'has-row-status': Boolean(props.rowStatus),
        'is-loading': props.loading,
        'is-pending': ph.pending,
        'is-slow': ph.slow,
        'is-failed': failedBar.value
      }]
    }, [
      hasFilters.value ? h(GFilterBar, {
        fields: cols.value, filters: filtersState.value, count: totalCount.value, labels: L().filters || {},
        'onUpdate:filters': onFilters
      }) : null,
      bar(),
      // Barra de fallo con filas a la vista: en flujo, antes del área desplazable; las filas de antes siguen usables
      failedBar.value ? h('div', { ref: failedEl, class: 'g-table__failed' }, [
        h('span', { class: 'g-table__failed-icon', 'aria-hidden': 'true' }, [h(GIcon, { name: 'circle-alert' })]),
        h('p', { class: 'g-table__failed-text' }, L().failed),
        h(GBtn, { size: 'sm', variant: 'soft', color: 'neutral', onClick: retry }, () => L().retry)
      ]) : null,
      h('div', { ref: scrollEl, class: 'g-table__scroll', style: props.maxHeight ? { '--_max-height': props.maxHeight } : undefined }, [
        h('table', { ref: tableEl, class: 'g-table__table', role: 'table', tabindex: '-1', 'aria-busy': ph.busy || props.loading ? 'true' : 'false', ...tableAttrs() }, [
          props.caption ? h('caption', { class: 'g-table__caption' }, props.caption) : null,
          header(),
          h('tbody', {
            ref: tbodyEl, role: 'rowgroup', inert: ph.busy ? '' : undefined,
            onClick: onBodyClick, onPointerdown, onFocusin, onAnimationend
          }, body())
        ]),
        // Espera larga (5 s): último hijo del área desplazable, superpuesto al pie (el CSS lo oculta fuera de is-slow)
        L().slow ? h('p', { class: 'g-table__slow' }, L().slow) : null
      ]),
      sizeEff.value ? h(GPagination, {
        ref: pagerRef, page: currentPage.value, total: totalCount.value, pageSize: sizeEff.value, pageSizes: props.pageSizes, labels: L().pagination || {},
        'onUpdate:page': setPage, 'onUpdate:pageSize': setPageSize
      }) : null,
      h('p', { class: 'g-table__sr', 'aria-live': 'polite' }, live.value)
    ])
  },
  inheritAttrs: false
})
</script>
