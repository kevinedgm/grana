import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, h } from 'vue'
import GTable from './GTable.vue'

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }
  HTMLElement.prototype.showPopover = function () { this.setAttribute('data-open', '') }
  HTMLElement.prototype.hidePopover = function () { this.removeAttribute('data-open') }
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); document.body.innerHTML = '' })

const columns = [
  { key: 'cliente', label: 'Cliente', leading: 'ini', title: 'nombre', subtitle: 'correo', sortable: true, filter: { type: 'text' } },
  { key: 'plan', label: 'Plan', sortable: true },
  { key: 'estado', label: 'Estado', filter: { type: 'enum', options: ['activo', 'pausado', 'vencido'], suggest: true } },
  { key: 'total', label: 'Total', align: 'end', sortable: true, format: (v) => `$${v}`, filter: { type: 'number', unit: '$' } }
]
const rows = [
  { id: 'a', nombre: 'Ana Torres', correo: 'ana@x.com', ini: 'AT', plan: 'Pro', estado: 'activo', total: 3393 },
  { id: 'b', nombre: 'Bruno Díaz', correo: 'bruno@x.com', ini: 'BD', plan: 'Básico', estado: 'pausado', total: 1931 },
  { id: 'c', nombre: 'Carla Ruiz', correo: 'carla@x.com', ini: 'CR', plan: 'Equipo', estado: 'vencido', total: 2662 }
]
const labels = {
  selectAll: 'Seleccionar todo', selectRow: 'Seleccionar {title}', rowActions: 'Acciones de {title}', actionsHeader: 'Acciones', selectedCount: '{count} seleccionados',
  sortBy: 'Ordenar por', ascending: 'ascendente', descending: 'descendente', sorted: 'Ordenado por {label}, {direction}', empty: 'Sin clientes', emptyFiltered: 'Ningún cliente cumple', clearFilters: 'Limpiar filtros', results: '{count} resultados',
  filters: { group: 'Filtros', add: 'Agregar', clear: 'Limpiar', filterBy: 'Filtrar por {label}', edit: 'Editar {summary}', remove: 'Quitar {summary}', apply: 'Aplicar', cancel: 'Cancelar', required: 'Falta', ops: { gt: 'mayor que', in: 'es cualquiera de', contains: 'contiene' } },
  pagination: { nav: 'Paginación', previous: 'Anterior', next: 'Siguiente', page: 'Página {page}', range: '{from}–{to} de {total}' }
}
const mk = (props = {}, opts = {}) => mount(GTable, { attachTo: document.body, props: { columns, rows, caption: 'Clientes', labels, ...props }, ...opts })
const names = (w) => w.findAll('tbody .g-table__title').map((t) => t.text())
const flush = async () => { for (let i = 0; i < 4; i++) await nextTick() }
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

describe('GTable · estructura', () => {
  it('tabla con caption, roles explícitos y encabezados con scope', () => {
    const w = mk()
    const t = w.find('table')
    expect(t.attributes('role')).toBe('table')
    expect(w.find('caption').text()).toBe('Clientes')
    expect(w.findAll('th').every((th) => th.attributes('role') === 'columnheader' && th.attributes('scope') === 'col')).toBe(true)
    expect(w.findAll('tbody tr')).toHaveLength(3)
    expect(w.findAll('tbody td').every((td) => td.attributes('role') === 'cell')).toBe(true)
    w.unmount()
  })
  it('columna compuesta: inicio decorativo, título y subtítulo bajo un solo encabezado; principal', () => {
    const w = mk()
    const td = w.find('tbody td.g-table__cell--composite')
    expect(td.classes()).toContain('g-table__cell--primary')
    expect(td.find('.g-table__leading').attributes('aria-hidden')).toBe('true')
    expect(td.find('.g-table__title').text()).toBe('Ana Torres')
    expect(td.find('.g-table__subtitle').text()).toBe('ana@x.com')
    expect(w.findAll('thead th').map((t) => t.text())).toEqual(['Cliente', 'Plan', 'Estado', 'Total'])
    w.unmount()
  })
  it('etiqueta de tarjeta aria-hidden en cada celda; formato y alineación', () => {
    const w = mk()
    const total = w.findAll('tbody tr')[0].findAll('td').at(-1)
    expect(total.classes()).toContain('g-table__cell--end')
    expect(total.find('.g-table__label').attributes('aria-hidden')).toBe('true')
    expect(total.text()).toBe('Total$3393')
    w.unmount()
  })
  it('slots cell-{key} y leading-{key} reciben la fila', () => {
    const w = mk({}, { slots: { 'cell-estado': ({ value }) => h('b', { class: 'badge' }, value), 'leading-cliente': ({ row }) => h('i', row.ini.toLowerCase()) } })
    expect(w.findAll('.badge').map((b) => b.text())).toEqual(['activo', 'pausado', 'vencido'])
    expect(w.find('.g-table__leading i').text()).toBe('at')
    w.unmount()
  })
  it('aria-label va a la tabla; class y data-* a la raíz', () => {
    const w = mk({ caption: undefined }, { attrs: { 'aria-label': 'Clientes', class: 'mia', 'data-x': '1' } })
    expect(w.find('table').attributes('aria-label')).toBe('Clientes')
    expect(w.classes()).toContain('mia')
    expect(w.attributes('data-x')).toBe('1')
    expect(w.attributes('aria-label')).toBeUndefined()
    w.unmount()
  })
  it('avisa sin nombre', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(GTable, { props: { columns: [{ key: 'a', label: 'A' }], rows: [] } })
    expect(warn.mock.calls.some((c) => /caption/.test(c[0]))).toBe(true)
  })
})

describe('GTable · orden', () => {
  it('local: un clic asc, otro desc; aria-sort; anuncio; compuesta ordena por title', async () => {
    const w = mk()
    const btn = () => w.findAll('.g-table__sort')[2] // Total
    await btn().trigger('click')
    expect(w.findAll('thead th')[3].attributes('aria-sort')).toBe('ascending')
    expect(names(w)).toEqual(['Bruno Díaz', 'Carla Ruiz', 'Ana Torres'])
    await btn().trigger('click')
    expect(w.findAll('thead th')[3].attributes('aria-sort')).toBe('descending')
    expect(names(w)).toEqual(['Ana Torres', 'Carla Ruiz', 'Bruno Díaz'])
    expect(w.emitted('update:sort').map((e) => e[0])).toEqual([{ key: 'total', direction: 'ascending' }, { key: 'total', direction: 'descending' }])
    expect(w.find('[aria-live="polite"].g-table__sr').text()).toBe('Ordenado por Total, descendente')
    await w.findAll('.g-table__sort')[0].trigger('click')
    expect(names(w)).toEqual(['Ana Torres', 'Bruno Díaz', 'Carla Ruiz'])
    w.unmount()
  })
  it('external: solo emite', async () => {
    const w = mk({ sortMode: 'external' })
    await w.findAll('.g-table__sort')[2].trigger('click')
    expect(w.emitted('update:sort')[0][0]).toEqual({ key: 'total', direction: 'ascending' })
    expect(names(w)).toEqual(['Ana Torres', 'Bruno Díaz', 'Carla Ruiz'])
    w.unmount()
  })
  it('el foco se queda en el botón de orden', async () => {
    const w = mk()
    const b = w.findAll('.g-table__sort')[2]
    b.element.focus()
    await b.trigger('click'); await flush()
    expect(document.activeElement).toBe(w.findAll('.g-table__sort')[2].element)
    w.unmount()
  })
})

describe('GTable · selección', () => {
  it('casilla por fila con nombre; «todo» mixto y luego completo; clase is-selected sin aria-selected', async () => {
    const w = mk({ selectable: true })
    const boxes = w.findAll('tbody input[type=checkbox]')
    expect(boxes[0].attributes('aria-label')).toBe('Seleccionar Ana Torres')
    await boxes[0].setValue(true)
    const all = w.find('thead input[type=checkbox]')
    expect(all.element.indeterminate).toBe(true)
    expect(w.findAll('tr.is-selected')).toHaveLength(1)
    expect(w.find('tr[aria-selected]').exists()).toBe(false)
    await all.trigger('change')
    expect(w.emitted('update:selected').at(-1)[0]).toEqual(['a', 'b', 'c'])
    expect(all.element.checked).toBe(true)
    await all.trigger('change')
    expect(w.emitted('update:selected').at(-1)[0]).toEqual([])
    expect(w.find('.g-table__count').text()).toBe('0 seleccionados')
    w.unmount()
  })
})

describe('GTable · filtros', () => {
  it('integra GFilterBar si alguna columna declara filter; filtra localmente y vuelve a la página 1', async () => {
    const w = mk({ pageSize: 2 })
    expect(w.find('.g-filter-bar').exists()).toBe(true)
    await w.findAll('.g-pagination__page')[1].trigger('click')
    await w.setProps({ filters: [{ key: 'total', op: 'gt', value: 2000 }] })
    expect(names(w)).toEqual(['Ana Torres', 'Carla Ruiz'])
    expect(w.find('.g-filter-bar__count').text()).toBe('2')
    w.unmount()
  })
  it('aplicar desde la barra emite update:filters y update:page 1', async () => {
    const w = mk({ pageSize: 2, page: 2 })
    w.findComponent({ name: 'GFilterBar' }).vm.$emit('update:filters', [{ key: 'estado', op: 'in', value: ['activo'] }])
    await flush()
    expect(w.emitted('update:filters')[0][0]).toEqual([{ key: 'estado', op: 'in', value: ['activo'] }])
    expect(w.emitted('update:page')[0][0]).toBe(1)
    expect(names(w)).toEqual(['Ana Torres'])
    expect(w.find('[aria-live="polite"].g-table__sr').text()).toBe('1 resultados')
    w.unmount()
  })
  it('texto en compuesta busca en título y subtítulo', async () => {
    const w = mk({ filters: [{ key: 'cliente', op: 'contains', value: 'bruno@' }] })
    expect(names(w)).toEqual(['Bruno Díaz'])
    w.unmount()
  })
  it('vacío por filtros con Limpiar; vacío real distinto', async () => {
    const w = mk({ filters: [{ key: 'total', op: 'gt', value: 99999 }] })
    expect(w.find('.g-table__empty').text()).toContain('Ningún cliente cumple')
    await w.find('.g-table__empty button').trigger('click')
    expect(w.emitted('update:filters').at(-1)[0]).toEqual([])
    const e = mk({ rows: [] })
    expect(e.find('.g-table__empty').text()).toBe('Sin clientes')
    expect(e.find('.g-table__empty').attributes('colspan')).toBe('4')
    w.unmount(); e.unmount()
  })
  it('Limpiar desde el vacío no deja el foco en body (pasa a la barra de filtros)', async () => {
    const w = mk({ filters: [{ key: 'total', op: 'gt', value: 99999 }] })
    const btn = w.find('.g-table__empty button')
    btn.element.focus()
    expect(document.activeElement).toBe(btn.element)
    await btn.trigger('click')
    await w.setProps({ filters: [] })
    await nextTick(); await nextTick()
    expect(document.activeElement).not.toBe(document.body)
    expect(w.element.contains(document.activeElement)).toBe(true)
    w.unmount()
  })
  it('el recuento de resultados se anuncia una sola vez (lo anuncia la barra de filtros)', async () => {
    const w = mk({ labels: { ...labels, filters: { ...labels.filters, results: '{count} resultados' } } })
    expect(w.find('.g-filter-bar__sr').text()).toBe('')
    expect(w.findAll('[aria-live="polite"]').filter((n) => n.element.classList.contains('g-table__sr')).length).toBe(1)
    w.unmount()
  })
  it('el recuento de seleccionados es una región de estado', () => {
    const w = mk({ selectable: true })
    expect(w.find('.g-table__count').attributes('role')).toBe('status')
    w.unmount()
  })
  it('filterMode external: no filtra', () => {
    const w = mk({ filterMode: 'external', filters: [{ key: 'total', op: 'gt', value: 99999 }] })
    expect(names(w)).toHaveLength(3)
    w.unmount()
  })
})

describe('GTable · paginación', () => {
  it('local con pageSize; external con total', async () => {
    const w = mk({ pageSize: 2 })
    expect(names(w)).toEqual(['Ana Torres', 'Bruno Díaz'])
    expect(w.find('.g-pagination__range').text()).toBe('1–2 de 3')
    await w.findAll('.g-pagination__page')[1].trigger('click')
    expect(names(w)).toEqual(['Carla Ruiz'])
    expect(w.emitted('update:page')[0][0]).toBe(2)
    const x = mk({ pageSize: 2, total: 40, rows: rows.slice(0, 2) })
    expect(x.find('.g-pagination__range').text()).toBe('1–2 de 40')
    expect(names(x)).toHaveLength(2)
    w.unmount(); x.unmount()
  })
})

describe('GTable · acciones, estados y modo', () => {
  it('slot row-actions por fila, con su columna y encabezado oculto', () => {
    const w = mk({}, { slots: { 'row-actions': ({ row }) => h('button', { class: 'act' }, row.id) } })
    expect(w.findAll('td.g-table__actions .act').map((b) => b.text())).toEqual(['a', 'b', 'c'])
    expect(w.find('th.g-table__actions .g-table__sr').text()).toBe('Acciones')
    w.unmount()
  })
  it('loading: aria-busy, is-loading y filas esqueleto', () => {
    const w = mk({ loading: true, loadingRows: 2 })
    expect(w.find('table').attributes('aria-busy')).toBe('true')
    expect(w.classes()).toContain('is-loading')
    expect(w.findAll('tbody tr').every((r) => r.attributes('aria-hidden') === 'true')).toBe(true)
    expect(w.findAll('tbody tr')).toHaveLength(2)
    expect(w.findAll('.g-table__skeleton')).toHaveLength(8)
    w.unmount()
  })
  it('responsive cards/table por prop; auto mide el contenedor (suma de mínimos × space)', async () => {
    expect(mk({ responsive: 'cards' }).classes()).toContain('g-table--mode-cards')
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ width: 400, height: 0, top: 0, left: 0, right: 400, bottom: 0 })
    const w = mk({ selectable: true }, { attrs: { style: '--g-space-1: 4px' } })
    await nextTick()
    // (40 + 24 + 24 + 24 + 10) × 4 = 488 > 400 → tarjetas
    expect(w.classes()).toContain('g-table--mode-cards')
    expect(w.find('.g-table__bar-cards select').exists()).toBe(true)
    w.unmount()
  })
  it('controles de tarjetas: ordenar por y dirección', async () => {
    const w = mk({ responsive: 'cards' })
    const [by, dir] = w.findAll('.g-table__bar select')
    await by.setValue('total')
    expect(names(w)).toEqual(['Bruno Díaz', 'Carla Ruiz', 'Ana Torres'])
    await dir.setValue('descending')
    expect(names(w)).toEqual(['Ana Torres', 'Carla Ruiz', 'Bruno Díaz'])
    w.unmount()
  })
  it('appearance, density y maxHeight', () => {
    const w = mk({ appearance: 'surface', density: 'compact', maxHeight: '20rem' })
    expect(w.classes()).toEqual(expect.arrayContaining(['g-table--appearance-surface', 'g-table--density-compact']))
    expect(w.find('.g-table__scroll').attributes('style')).toContain('--_max-height: 20rem')
    w.unmount()
  })
  it('validadores', () => {
    const v = (n) => GTable.props[n].validator
    expect(v('responsive')('list')).toBe(false)
    expect(v('appearance')('surface')).toBe(true)
    expect(v('sortMode')('server')).toBe(false)
  })
})

// Enmienda de #265 por #540: labels.loading se escribe cuando el esqueleto se VE (200 ms), no en el ciclo siguiente a
// `loading: true`; una carga que no se ve solo anuncia su fin. Las pruebas que esperaban el texto en el ciclo siguiente
// esperan ahora los 200 ms (cambio de contrato, no regresión).
describe('GTable · carga y anuncios (#265, enmienda de #540)', () => {
  const region = (w) => w.find('p.g-table__sr[aria-live="polite"]')
  const withLoading = { ...labels, loading: 'Cargando clientes…' }

  it('al verse la carga (200 ms) escribe labels.loading y lo mantiene; antes, nada', async () => {
    const w = mk({ labels: withLoading })
    expect(region(w).text()).toBe('')
    await w.setProps({ loading: true })
    await flush()
    expect(region(w).text()).toBe('')
    await wait(230)
    expect(region(w).text()).toBe('Cargando clientes…')
    await flush()
    expect(region(w).text()).toBe('Cargando clientes…')
    w.unmount()
  })
  it('montada ya con loading: la región existe vacía y el texto llega al verse la carga', async () => {
    const w = mk({ labels: withLoading, loading: true })
    expect(region(w).exists()).toBe(true)
    expect(region(w).text()).toBe('')
    await flush()
    expect(region(w).text()).toBe('')
    await wait(230)
    expect(region(w).text()).toBe('Cargando clientes…')
    w.unmount()
  })
  it('al terminar anuncia el recuento ya actualizado (total, si existe)', async () => {
    const w = mk({ labels: withLoading, loading: true, rows: [], total: 0 })
    await flush()
    await w.setProps({ loading: false, rows, total: 120 })
    await flush()
    expect(region(w).text()).toBe('120 resultados')
    w.unmount()
  })
  it('al terminar sin total anuncia las filas filtradas', async () => {
    const w = mk({ labels: withLoading, loading: true, filters: [{ key: 'total', op: 'gt', value: 2000 }] })
    await flush()
    await w.setProps({ loading: false })
    await flush()
    expect(region(w).text()).toBe('2 resultados')
    w.unmount()
  })
  it('al terminar con 0 filas se anuncia igual {count: 0}', async () => {
    const w = mk({ labels: withLoading, loading: true })
    await flush()
    await w.setProps({ loading: false, rows: [] })
    await flush()
    expect(region(w).text()).toBe('0 resultados')
    w.unmount()
  })
  it('sin labels.results la región se vacía al terminar (con aviso de desarrollo, una vez)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { results, ...sinResults } = withLoading
    const w = mk({ labels: sinResults, loading: true })
    await wait(230)
    expect(region(w).text()).toBe('Cargando clientes…')
    await w.setProps({ loading: false })
    await wait(420) // se vio: el mínimo de 400 ms
    await flush()
    expect(region(w).text()).toBe('')
    await w.setProps({ loading: true })
    await w.setProps({ loading: false })
    await flush()
    const avisos = warn.mock.calls.filter((c) => String(c[0]).includes('labels.results'))
    expect(avisos).toHaveLength(1)
    w.unmount()
  })
  it('loading sin labels.loading: aviso de desarrollo una sola vez y la región sigue vacía', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mk({ loading: true })
    await flush()
    expect(region(w).text()).toBe('')
    await w.setProps({ loading: false })
    await w.setProps({ loading: true })
    await flush()
    const avisos = warn.mock.calls.filter((c) => String(c[0]).includes('labels.loading'))
    expect(avisos).toHaveLength(1)
    w.unmount()
  })
  it('con ambos textos no hay avisos de carga', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mk({ labels: withLoading, loading: true })
    await flush()
    await w.setProps({ loading: false })
    await flush()
    expect(warn.mock.calls.filter((c) => /labels\.(loading|results)/.test(String(c[0])))).toHaveLength(0)
    w.unmount()
  })
  it('el orden externo escrito en el mismo ciclo en que empieza la carga no se pisa', async () => {
    const w = mk({ labels: withLoading, sortMode: 'external', 'onUpdate:sort': () => w.setProps({ loading: true }) })
    await w.findAll('.g-table__sort')[2].trigger('click')
    await flush()
    expect(w.props('loading')).toBe(true)
    expect(region(w).text()).toBe('Ordenado por Total, ascendente')
    await w.setProps({ loading: false })
    await flush()
    expect(region(w).text()).toBe('3 resultados')
    w.unmount()
  })
  it('un orden anterior sí lo reemplaza el texto de carga cuando esta empieza más tarde', async () => {
    const w = mk({ labels: withLoading })
    await w.findAll('.g-table__sort')[2].trigger('click')
    await new Promise((r) => setTimeout(r, 5))
    expect(region(w).text()).toBe('Ordenado por Total, ascendente')
    await w.setProps({ loading: true })
    await wait(230)
    expect(region(w).text()).toBe('Cargando clientes…')
    w.unmount()
  })
  it('filtro externo: si la tabla ya está cargando no se anuncia el recuento viejo', async () => {
    const w = mk({ labels: withLoading, filterMode: 'external', 'onUpdate:filters': () => w.setProps({ loading: true }) })
    w.findComponent({ name: 'GFilterBar' }).vm.$emit('update:filters', [{ key: 'estado', op: 'in', value: ['activo'] }])
    await wait(230)
    expect(w.props('loading')).toBe(true)
    expect(region(w).text()).toBe('Cargando clientes…')
    await w.setProps({ loading: false, rows: [rows[0]] })
    await wait(420)
    await flush()
    expect(region(w).text()).toBe('1 resultados')
    w.unmount()
  })
  it('las filas esqueleto siguen aria-hidden y la región queda fuera del <table aria-busy>', async () => {
    const w = mk({ labels: withLoading, loading: true, loadingRows: 2 })
    await flush()
    expect(w.findAll('tbody tr').every((r) => r.attributes('aria-hidden') === 'true')).toBe(true)
    expect(w.find('tbody').text()).toBe('')
    expect(w.find('table').attributes('aria-busy')).toBe('true')
    expect(w.find('table').element.contains(region(w).element)).toBe(false)
    expect(w.findAll('[aria-live="polite"]').filter((n) => n.element.classList.contains('g-table__sr')).length).toBe(1)
    expect(w.find('[role="status"]').exists()).toBe(false)
    w.unmount()
  })
})

// Motor común (table.md «Carga, vacío y error con el motor común», #540; load-region.md #531 a #539)
describe('GTable · motor común de carga (#540)', () => {
  const region = (w) => w.find('p.g-table__sr[aria-live="polite"]')
  const all = { ...labels, loading: 'Cargando clientes…', slow: 'Sigue cargando clientes…', failed: 'No se pudieron cargar los clientes.', retry: 'Reintentar' }
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })
  const at = async (ms) => { vi.advanceTimersByTime(ms); await flush() }

  it('refresco con filas: dentro del retraso siguen a la vista con el <tbody> inerte; a los 200 ms, tantas filas esqueleto como había', async () => {
    const w = mk({ labels: all, pageSize: 2 })
    expect(names(w)).toEqual(['Ana Torres', 'Bruno Díaz'])
    await w.setProps({ loading: true })
    await at(100)
    expect(names(w)).toEqual(['Ana Torres', 'Bruno Díaz'])
    expect(w.find('tbody').attributes('inert')).toBe('')
    expect(w.classes()).toContain('is-pending')
    expect(w.find('.g-table__skeleton').exists()).toBe(false)
    expect(region(w).text()).toBe('')
    await at(120)
    expect(w.classes()).not.toContain('is-pending')
    expect(w.findAll('tbody tr')).toHaveLength(2) // las que había a la vista, no loadingRows (3)
    expect(w.findAll('tbody tr').every((r) => r.attributes('aria-hidden') === 'true')).toBe(true)
    expect(region(w).text()).toBe('Cargando clientes…')
    w.unmount()
  })

  it('primera carga: loadingRows filas esqueleto invisibles (is-pending) que reservan el sitio; nunca el texto de vacío', async () => {
    const w = mk({ labels: all, loading: true, rows: [], loadingRows: 4 })
    expect(w.classes()).toContain('is-pending')
    expect(w.findAll('tbody tr')).toHaveLength(4)
    expect(w.find('.g-empty').exists()).toBe(false)
    await at(250)
    expect(w.classes()).not.toContain('is-pending')
    w.unmount()
  })

  it('una carga de menos de 200 ms no enseña esqueleto ni anuncia el inicio; solo su fin', async () => {
    const w = mk({ labels: all })
    await w.setProps({ loading: true })
    await at(150)
    await w.setProps({ loading: false })
    await flush()
    expect(w.find('.g-table__skeleton').exists()).toBe(false)
    expect(region(w).text()).toBe('3 resultados')
    w.unmount()
  })

  it('mínimo de 400 ms a la vista; la tabla pinta su copia hasta el final de la fase', async () => {
    const w = mk({ labels: all })
    await w.setProps({ loading: true })
    await at(250)
    await w.setProps({ loading: false, rows: [rows[2]] })
    await at(300)
    expect(w.find('.g-table__skeleton').exists()).toBe(true)
    expect(w.find('table').attributes('aria-busy')).toBe('true')
    await at(110)
    expect(names(w)).toEqual(['Carla Ruiz'])
    expect(w.find('table').attributes('aria-busy')).toBe('false')
    expect(w.find('tbody').attributes('inert')).toBeUndefined()
    expect(region(w).text()).toBe('1 resultados')
    w.unmount()
  })

  it('celdas esqueleto de una columna align end llevan g-table__cell--end; la casilla y las acciones, su celda vacía', async () => {
    const w = mk({ labels: all, loading: true, selectable: true }, { slots: { 'row-actions': () => h('button', 'x') } })
    const cells = w.findAll('tbody tr')[0].findAll('td')
    expect(cells[0].classes()).toContain('g-table__select')
    expect(cells.at(-2).classes()).toContain('g-table__cell--end')
    expect(cells.at(-1).classes()).toContain('g-table__actions')
    expect(w.find('table').attributes('tabindex')).toBe('-1')
    w.unmount()
  })

  it('a los 5 s: is-slow, p.g-table__slow como último hijo del área desplazable y un anuncio, una vez', async () => {
    const w = mk({ labels: all })
    await w.setProps({ loading: true })
    const slow = w.find('.g-table__scroll > p.g-table__slow')
    expect(slow.exists()).toBe(true)
    expect(slow.element.parentElement.lastElementChild).toBe(slow.element)
    await at(4900)
    expect(w.classes()).not.toContain('is-slow')
    await at(150)
    expect(w.classes()).toContain('is-slow')
    expect(region(w).text()).toBe('Sigue cargando clientes…')
    expect(slow.text()).toBe('Sigue cargando clientes…')
    await w.setProps({ loading: false })
    await flush()
    expect(w.classes()).not.toContain('is-slow')
    expect(region(w).text()).toBe('3 resultados')
    w.unmount()
  })

  it('error con filas: se quedan, usables, con la barra de fallo antes del área; anuncia failed en lugar de results; retry', async () => {
    const w = mk({ labels: all })
    await w.setProps({ loading: true })
    await at(250)
    await w.setProps({ loading: false, error: true })
    await at(400)
    expect(names(w)).toEqual(['Ana Torres', 'Bruno Díaz', 'Carla Ruiz'])
    expect(w.find('tbody').attributes('inert')).toBeUndefined()
    const bar = w.find('.g-table__failed')
    expect(bar.exists()).toBe(true)
    expect(bar.element.nextElementSibling.classList.contains('g-table__scroll')).toBe(true)
    expect(bar.find('.g-table__failed-icon').attributes('aria-hidden')).toBe('true')
    expect(bar.find('.g-table__failed-icon svg').exists()).toBe(true)
    expect(bar.find('p.g-table__failed-text').text()).toBe('No se pudieron cargar los clientes.')
    const btn = bar.find('button.g-btn')
    expect(btn.classes()).toEqual(expect.arrayContaining(['g-btn--size-sm', 'g-btn--variant-soft', 'g-btn--color-neutral']))
    expect(w.classes()).toContain('is-failed')
    expect(region(w).text()).toBe('No se pudieron cargar los clientes.')
    await btn.trigger('click')
    expect(w.emitted('retry')).toHaveLength(1)
    // Mientras corre la carga siguiente, la barra no se pinta
    await w.setProps({ loading: true, error: false })
    expect(w.find('.g-table__failed').exists()).toBe(false)
    w.unmount()
  })

  it('el error se aplica al terminar la carga, no antes', async () => {
    const w = mk({ labels: all })
    await w.setProps({ loading: true })
    await at(250)
    await w.setProps({ error: true })
    expect(w.find('.g-table__failed').exists()).toBe(false)
    await w.setProps({ loading: false })
    await at(400)
    expect(w.find('.g-table__failed').exists()).toBe(true)
    w.unmount()
  })

  it('error sin filas: GEmpty cause="error" con labels.failed y «Reintentar» (sm soft neutral); el slot error lo sustituye', async () => {
    const w = mk({ labels: all, rows: [], loading: true })
    await w.setProps({ loading: false, error: true })
    await flush()
    const e = w.find('td.g-table__empty > .g-empty.g-empty--cause-error')
    expect(e.exists()).toBe(true)
    expect(e.find('.g-empty__title').text()).toBe('No se pudieron cargar los clientes.')
    const btn = e.find('.g-empty__actions button.g-btn')
    expect(btn.classes()).toEqual(expect.arrayContaining(['g-btn--size-sm', 'g-btn--variant-soft', 'g-btn--color-neutral']))
    await btn.trigger('click')
    expect(w.emitted('retry')).toHaveLength(1)
    expect(w.find('.g-table__failed').exists()).toBe(false)
    expect(region(w).text()).toBe('No se pudieron cargar los clientes.')
    const s = mk({ labels: all, rows: [], error: true }, { slots: { error: ({ retry }) => h('button', { class: 'mine', onClick: retry }, 'Otra vez'), empty: () => h('i', 'vacío') } })
    expect(s.find('.g-table__empty .mine').exists()).toBe(true)
    expect(s.find('.g-table__empty i').exists()).toBe(false)
    await s.find('.mine').trigger('click')
    expect(s.emitted('retry')).toHaveLength(1)
    w.unmount(); s.unmount()
  })

  it('announceError: false pinta la barra o el vacío de error pero no anuncia nada al terminar', async () => {
    const w = mk({ labels: all, announceError: false })
    await w.setProps({ loading: true })
    await at(250)
    expect(region(w).text()).toBe('Cargando clientes…')
    await w.setProps({ loading: false, error: true })
    await at(400)
    expect(w.find('.g-table__failed').exists()).toBe(true)
    expect(region(w).text()).toBe('')
    w.unmount()
  })

  it('vacío por defecto con GEmpty: none con labels.empty; filtered con labels.emptyFiltered y «Limpiar filtros» (mismo clear)', async () => {
    const e = mk({ rows: [] })
    const none = e.find('td.g-table__empty > .g-empty')
    expect(none.classes()).toContain('g-empty--cause-none')
    expect(none.find('.g-empty__title').text()).toBe('Sin clientes')
    expect(none.find('button').exists()).toBe(false)
    const f = mk({ filters: [{ key: 'total', op: 'gt', value: 99999 }] })
    const fil = f.find('td.g-table__empty > .g-empty')
    expect(fil.classes()).toContain('g-empty--cause-filtered')
    expect(fil.find('.g-empty__title').text()).toBe('Ningún cliente cumple')
    const b = fil.find('.g-empty__actions button.g-btn')
    expect(b.text()).toBe('Limpiar filtros')
    await b.trigger('click')
    expect(f.emitted('update:filters').at(-1)[0]).toEqual([])
    expect(f.find('.g-filter-bar__clear').exists()).toBe(false)
    e.unmount(); f.unmount()
  })

  it('foco (#534): del <tbody> al <table> al empezar y, al llegar, a la misma fila por rowKey y al mismo índice', async () => {
    const w = mk({ labels: all }, { slots: { 'row-actions': ({ row }) => [h('button', { class: 'ver' }, `Ver ${row.id}`), h('button', { class: 'ed' }, `Editar ${row.id}`)] } })
    const target = w.findAll('tbody tr')[1].find('.ed')
    target.element.focus()
    await w.setProps({ loading: true })
    expect(document.activeElement).toBe(w.find('table').element)
    await at(250)
    // Llega con otro orden: Bruno (b) pasa a ser la primera fila
    await w.setProps({ loading: false, rows: [rows[1], rows[0], rows[2]] })
    await at(400)
    expect(document.activeElement.textContent).toBe('Editar b')
    w.unmount()
  })

  it('foco: si la fila ya no existe, se queda en el <table>; nunca en body', async () => {
    const w = mk({ labels: all }, { slots: { 'row-actions': ({ row }) => h('button', { class: 'ver' }, `Ver ${row.id}`) } })
    w.findAll('tbody .ver')[2].element.focus()
    await w.setProps({ loading: true })
    await w.setProps({ loading: false, rows: rows.slice(0, 2) })
    await flush()
    expect(document.activeElement).toBe(w.find('table').element)
    w.unmount()
  })

  it('foco: con el foco fuera de la tabla, la carga no lo toca', async () => {
    const out = document.createElement('button')
    document.body.append(out)
    const w = mk({ labels: all })
    out.focus()
    await w.setProps({ loading: true })
    await at(250)
    await w.setProps({ loading: false })
    await at(400)
    expect(document.activeElement).toBe(out)
    w.unmount()
  })

  it('«Reintentar» de la barra con el foco: al empezar la carga el foco pasa al <table>', async () => {
    const w = mk({ labels: all, error: true })
    const btn = w.find('.g-table__failed button')
    btn.element.focus()
    await w.setProps({ loading: true, error: false })
    expect(document.activeElement).toBe(w.find('table').element)
    w.unmount()
  })

  it('avisos nuevos: error sin labels.failed ni retry ni slot error (una vez cada uno)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mk({ labels: { ...labels, loading: 'C' } })
    await w.setProps({ loading: true })
    await w.setProps({ loading: false, error: true })
    await w.setProps({ loading: true })
    await w.setProps({ loading: false })
    const msgs = warn.mock.calls.map((c) => String(c[0]))
    expect(msgs.filter((m) => m.includes('labels.failed'))).toHaveLength(1)
    expect(msgs.filter((m) => m.includes('labels.retry'))).toHaveLength(1)
    w.unmount()
  })

  it('sin pulso ni animación: nada en el componente escribe animation (el CSS es quieto, #539)', () => {
    const w = mk({ labels: all, loading: true })
    expect(w.html()).not.toMatch(/animation/)
    w.unmount()
  })

  it('validadores y props nuevas', () => {
    expect(GTable.props.error).toBe(Boolean)
    expect(GTable.props.announceError.default).toBe(true)
    expect(GTable.emits).toContain('retry')
  })
})
