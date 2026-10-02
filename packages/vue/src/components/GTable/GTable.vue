<script>
// GTable · tabla de datos con columnas compuestas, filtros, orden, selección, paginación y tarjetas (dueño: bruno)
// Contrato: design/contracts/table.md · Estilo: GTable.css (coco) · Estructura: design/lab/table/r01/ y r02/.
// Campos ≠ columnas: una columna puede componer varios campos (leading + title + subtitle). Un solo <table> con roles
// explícitos se dibuja como tabla o como tarjetas según el ancho del contenedor (DECISIONS.md #109 a #111).
import { defineComponent, h, ref, computed, watch, nextTick, onMounted, onBeforeUnmount, provide } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import { fill } from '../../utils/template.js'
import { applyFilters } from '../../utils/filters.js'
import GIcon from '../GIcon/GIcon.vue'
import GFilterBar from '../GFilterBar/GFilterBar.vue'
import GPagination from '../GPagination/GPagination.vue'

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
    total: { type: Number, default: undefined },
    responsive: { type: String, default: 'auto', validator: oneOf(['auto', 'table', 'cards']) },
    appearance: { type: String, default: 'lines', validator: oneOf(['lines', 'surface']) },
    density: { type: String, default: 'default', validator: oneOf(['default', 'comfortable', 'compact']) },
    maxHeight: { type: String, default: undefined },
    loading: Boolean,
    loadingRows: { type: Number, default: 3, validator: (v) => v >= 1 },
    labels: { type: Object, default: () => ({}) }
  },
  emits: ['update:sort', 'update:selected', 'update:filters', 'update:page'],
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
    const live = ref('')
    provide('g-table-announces-results', true) // la tabla anuncia el recuento: la barra de filtros integrada no lo repite
    if (isDev && props.labels && !props.labels.sorted && Array.isArray(props.columns) && props.columns.some((c) => c.sortable)) {
      console.warn('[Grana] <GTable> tiene columnas ordenables: define labels.sorted para anunciar el cambio de orden.')
    }
    if (isDev && props.selectable && props.labels && !props.labels.selectedCount) {
      console.warn('[Grana] <GTable> con selección: define labels.selectedCount para anunciar cuántas filas hay seleccionadas.')
    }

    // ---- Columnas ----
    const cols = computed(() => props.columns)
    const primary = computed(() => cols.value.find((c) => c.primary) || cols.value.find((c) => c.title) || cols.value[0])
    const isComposite = (c) => Boolean(c.title)
    const sortField = (c) => c.sortBy || c.title || c.key
    const titleOf = (row) => { const p = primary.value; return p ? row[p.title || p.key] : '' }
    const keyOf = (row) => row[props.rowKey]

    // ---- Datos: filtrar → ordenar → paginar ----
    const filtered = computed(() => (props.filterMode === 'local' ? applyFilters(props.rows, cols.value, filtersState.value) : props.rows))
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
    const pages = computed(() => (props.pageSize ? Math.max(1, Math.ceil(totalCount.value / props.pageSize)) : 1))
    // Página efectiva: nunca más allá de la última (p. ej. tras filtrar)
    const currentPage = computed(() => Math.min(Math.max(1, pageState.value), pages.value))
    const visible = computed(() => {
      if (!props.pageSize || external.value) return sorted.value
      const start = (currentPage.value - 1) * props.pageSize
      return sorted.value.slice(start, start + props.pageSize)
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
      if (props.labels.sorted && col) live.value = fill(props.labels.sorted, { label: col.label, direction: props.labels[next.direction] || next.direction })
    }

    // ---- Filtros ----
    const hasFilters = computed(() => cols.value.some((c) => c.filter))
    const onFilters = (f) => {
      setFilters(f)
      if (pageState.value !== 1) setPage(1)
      nextTick(() => { if (props.labels.results) live.value = fill(props.labels.results, { count: totalCount.value }) })
    }
    const clearFilters = () => {
      const lost = root.value && root.value.querySelector('.g-table__empty')?.contains(document.activeElement)
      onFilters([])
      // El botón «Limpiar» desaparece con el vacío: el foco pasa a «Agregar filtro» (o a la tabla) en vez de caer en body
      if (lost) nextTick(() => (root.value?.querySelector('.g-filter-bar button') || root.value?.querySelector('table'))?.focus?.())
    }
    // Filtros cambiados desde fuera: también vuelven a la página 1
    watch(() => props.filters, () => { if (pageState.value !== 1) setPage(1) })

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
    const cellContent = (c, row) => {
      const value = row[c.key]
      const slot = slots[`cell-${c.key}`]
      if (isComposite(c) && !slot) {
        const lead = slots[`leading-${c.key}`]
        return h('span', { class: 'g-table__composite' }, [
          lead ? h('span', { class: 'g-table__leading', 'aria-hidden': 'true' }, lead({ row }))
            : c.leading ? h('span', { class: 'g-table__leading', 'aria-hidden': 'true' }, String(row[c.leading] ?? '')) : null,
          h('span', { class: 'g-table__text' }, [
            h('span', { class: 'g-table__title' }, String(row[c.title] ?? '')),
            c.subtitle ? h('span', { class: 'g-table__subtitle' }, String(row[c.subtitle] ?? '')) : null
          ])
        ])
      }
      if (slot) return slot({ row, value, column: c })
      return c.format ? c.format(value, row) : value ?? ''
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
    const body = () => {
      if (props.loading) {
        return Array.from({ length: props.loadingRows }, (_, i) => h('tr', { role: 'row', class: 'g-table__row', 'aria-hidden': 'true', key: `sk-${i}` }, [
          props.selectable ? h('td', { role: 'cell', class: 'g-table__select' }) : null,
          ...cols.value.map((c) => h('td', { role: 'cell', class: ['g-table__cell', { 'g-table__cell--primary': c === primary.value }], key: c.key }, [h('span', { class: 'g-table__skeleton' })])),
          slots['row-actions'] ? h('td', { role: 'cell', class: 'g-table__actions' }) : null
        ]))
      }
      if (!visible.value.length) {
        const filteredEmpty = filtersState.value.length > 0
        const content = slots.empty
          ? slots.empty({ filtered: filteredEmpty, clear: clearFilters })
          : filteredEmpty
            ? [L().emptyFiltered, ' ', h('button', { type: 'button', class: 'g-filter-bar__clear', onClick: clearFilters }, L().clearFilters)]
            : L().empty
        return [h('tr', { role: 'row', key: 'empty' }, [h('td', { role: 'cell', class: 'g-table__empty', colspan: colCount() }, content)])]
      }
      return visible.value.map((row) => {
        const k = keyOf(row)
        const sel = selectedSet.value.has(k)
        const title = titleOf(row)
        return h('tr', { role: 'row', class: ['g-table__row', { 'is-selected': sel }], key: k }, [
          props.selectable ? h('td', { role: 'cell', class: 'g-table__select' }, [
            h('input', { type: 'checkbox', checked: sel, 'aria-label': L().selectRow ? rowText(L().selectRow, row, title) : String(title), onChange: (e) => toggleRow(k, e.target.checked) })
          ]) : null,
          ...cols.value.map((c) => h('td', {
            role: 'cell', key: c.key,
            class: ['g-table__cell', { 'g-table__cell--composite': isComposite(c), 'g-table__cell--primary': c === primary.value, 'g-table__cell--end': c.align === 'end' }]
          }, [h('span', { class: 'g-table__label', 'aria-hidden': 'true' }, c.label), cellContent(c, row)])),
          slots['row-actions'] ? h('td', { role: 'cell', class: 'g-table__actions' }, slots['row-actions']({ row })) : null
        ])
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
      class: [attrs.class, 'g-table', `g-table--mode-${mode.value}`, `g-table--appearance-${props.appearance}`, `g-table--density-${props.density}`, { 'is-loading': props.loading }]
    }, [
      hasFilters.value ? h(GFilterBar, {
        fields: cols.value, filters: filtersState.value, count: totalCount.value, labels: L().filters || {},
        'onUpdate:filters': onFilters
      }) : null,
      bar(),
      h('div', { class: 'g-table__scroll', style: props.maxHeight ? { '--_max-height': props.maxHeight } : undefined }, [
        h('table', { class: 'g-table__table', role: 'table', 'aria-busy': props.loading ? 'true' : 'false', ...tableAttrs() }, [
          props.caption ? h('caption', { class: 'g-table__caption' }, props.caption) : null,
          header(),
          h('tbody', { role: 'rowgroup' }, body())
        ])
      ]),
      props.pageSize ? h(GPagination, {
        page: currentPage.value, total: totalCount.value, pageSize: props.pageSize, labels: L().pagination || {},
        'onUpdate:page': setPage
      }) : null,
      h('p', { class: 'g-table__sr', 'aria-live': 'polite' }, live.value)
    ])
  },
  inheritAttrs: false
})
</script>
