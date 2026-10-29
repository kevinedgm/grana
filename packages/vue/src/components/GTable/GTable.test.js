import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, h } from 'vue'
import GTable from './GTable.vue'
import GBtn from '../GBtn/GBtn.vue'

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

  it('una recarga que no se ve y acaba con el mismo recuento se vuelve a anunciar (hallazgo 7): la región se vacía al empezar', async () => {
    const w = mk({ labels: all })
    await w.setProps({ loading: true })
    await at(150)
    await w.setProps({ loading: false })
    await flush()
    expect(region(w).text()).toBe('3 resultados')
    const writes = []
    const mo = new MutationObserver(() => writes.push(region(w).element.textContent))
    mo.observe(region(w).element, { childList: true, characterData: true, subtree: true })
    await w.setProps({ loading: true })
    await at(100)
    expect(region(w).text()).toBe('') // vacía al empezar: el mismo texto al final es un cambio
    await w.setProps({ loading: false })
    await flush()
    expect(region(w).text()).toBe('3 resultados')
    mo.disconnect()
    expect(writes).toEqual(['', '3 resultados'])
    w.unmount()
  })

  it('el anuncio del orden escrito en el mismo ciclo que empieza la carga no se vacía', async () => {
    const w = mk({ labels: all, sortMode: 'external' })
    await w.findAll('th button')[0].trigger('click')
    await w.setProps({ loading: true })
    await flush()
    expect(region(w).text()).toMatch(/^Ordenado por/)
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
    // #555: la única acción del vacío, outline con color="brand" explícito (no el valor por defecto de GBtn)
    expect(b.classes()).toEqual(expect.arrayContaining(['g-btn--variant-outline', 'g-btn--color-brand']))
    expect(fil.findComponent(GBtn).vm.$.vnode.props?.color).toBe('brand')
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

describe('GTable · recuento con filtros cambiados desde fuera (L3 de card-group, enmienda de #265)', () => {
  const region = (w) => w.find('p.g-table__sr[aria-live="polite"]')
  const vencidas = [{ key: 'estado', op: 'in', value: ['vencido'] }]
  it('no anuncia en la carga inicial, con o sin filtros', async () => {
    const w = mk({ filters: vencidas })
    await flush()
    expect(region(w).text()).toBe('')
    w.unmount()
  })
  it('local: la prop filters cambiada desde fuera anuncia el recuento, igual que la barra', async () => {
    const w = mk()
    await w.setProps({ filters: vencidas })
    await flush()
    expect(region(w).text()).toBe('1 resultados')
    await w.setProps({ filters: [] })
    await flush()
    expect(region(w).text()).toBe('3 resultados')
    w.unmount()
  })
  it('desde la barra con v-model: un solo anuncio (el eco de la prop no repite)', async () => {
    const texts = []
    const w = mk({ 'onUpdate:filters': (f) => w.setProps({ filters: f }) })
    const sr = region(w).element
    new MutationObserver(() => texts.push(sr.textContent)).observe(sr, { childList: true, characterData: true, subtree: true })
    w.findComponent({ name: 'GFilterBar' }).vm.$emit('update:filters', vencidas)
    await flush()
    await wait(0)
    expect(region(w).text()).toBe('1 resultados')
    expect(texts.filter((t) => t === '1 resultados')).toHaveLength(1)
    w.unmount()
  })
  it('local cargando: el cambio externo no anuncia el recuento viejo; lo anuncia el fin de la carga', async () => {
    const w = mk({ labels: { ...labels, loading: 'Cargando clientes…' } })
    await w.setProps({ filters: vencidas, loading: true })
    await flush()
    expect(region(w).text()).not.toBe('1 resultados')
    await w.setProps({ loading: false })
    await wait(420)
    await flush()
    expect(region(w).text()).toBe('1 resultados')
    w.unmount()
  })
  it('external sin carga: espera a que lleguen las filas del filtro nuevo', async () => {
    const w = mk({ filterMode: 'external' })
    await w.setProps({ filters: vencidas })
    await flush()
    expect(region(w).text()).toBe('') // los datos aún no han llegado: el recuento sería el viejo
    await w.setProps({ rows: [rows[2]] })
    await flush()
    expect(region(w).text()).toBe('1 resultados')
    w.unmount()
  })
  it('external con carga: anuncia al terminar la carga, no al cambiar el filtro', async () => {
    const w = mk({ filterMode: 'external', labels: { ...labels, loading: 'Cargando clientes…' } })
    await w.setProps({ filters: vencidas, loading: true })
    await flush()
    expect(region(w).text()).not.toContain('resultados')
    await w.setProps({ loading: false, rows: [rows[2]] })
    await wait(420)
    await flush()
    expect(region(w).text()).toBe('1 resultados')
    w.unmount()
  })
  it('external con filas en el mismo ciclo que el filtro: anuncia el recuento nuevo', async () => {
    const w = mk({ filterMode: 'external' })
    await w.setProps({ filters: vencidas, rows: [rows[2]] })
    await flush()
    expect(region(w).text()).toBe('1 resultados')
    w.unmount()
  })
})

// ---------------------------------------------------------------------------------------------------------------------
// Filas por página, activación de fila y estado de fila (table.md, #592 a #602, #650)
// ---------------------------------------------------------------------------------------------------------------------
const many = Array.from({ length: 25 }, (_, i) => ({ id: `r${i + 1}`, nombre: `Cliente ${i + 1}`, correo: `c${i + 1}@x.com`, ini: 'C', plan: 'Pro', estado: 'activo', total: i + 1 }))
const sizeLabels = { ...labels, range: 'Filas {from}–{to} de {total}', pagination: { ...labels.pagination, pageSize: 'Filas por página' } }
const region = (w) => w.find('p.g-table__sr[aria-live="polite"]')
const sizeInputs = (w) => w.findAll('.g-pagination__size-input')
// Filas de 40px; la fila i del <tbody> empieza en i × 40 − offset (el resto mide 0)
const rowBoxes = (offset = 100) => vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
  if (this.matches('tbody tr.g-table__row')) {
    const top = [...this.parentNode.rows].filter((r) => r.classList.contains('g-table__row')).indexOf(this) * 40 - offset
    return { top, bottom: top + 40, height: 40, left: 0, right: 400, width: 400, x: 0, y: top }
  }
  return { top: 0, bottom: 0, height: 0, left: 0, right: 0, width: 0, x: 0, y: 0 }
})
const press = (el, init = {}) => {
  el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 10, clientY: 10 }))
  const e = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, detail: 1, clientX: 10, clientY: 10, ...init })
  el.dispatchEvent(e)
  return e
}

describe('GTable · filas por página (#592 a #596)', () => {
  it('con pageSizes y sin pageSize, el menor de la lista; pie acoplado y rango sin role=status', () => {
    const w = mk({ rows: many, pageSizes: [25, 10], labels: sizeLabels })
    expect(names(w)).toHaveLength(10)
    expect(w.find('.g-pagination').classes()).toContain('g-pagination--dock')
    expect(sizeInputs(w).map((i) => i.element.checked)).toEqual([true, false])
    expect(w.find('.g-pagination__range').attributes('role')).toBeUndefined()
    w.unmount()
  })
  it('sin labels.range el rango del pie conserva role=status', () => {
    const w = mk({ rows: many, pageSize: 10 })
    expect(w.find('.g-pagination__range').attributes('role')).toBe('status')
    expect(w.find('.g-pagination').classes()).not.toContain('g-pagination--dock')
    w.unmount()
  })
  it('update:pageSize y después update:page en el mismo manejador; sin fila a la vista, el principio de la página', async () => {
    const log = []
    const w = mk({ rows: many, pageSizes: [10, 25], page: 2, labels: sizeLabels, 'onUpdate:pageSize': (n) => log.push(`size:${n}`), 'onUpdate:page': (n) => log.push(`page:${n}`) })
    await sizeInputs(w)[1].setValue(true)
    expect(log).toEqual(['size:25', 'page:1'])
    await flush()
    expect(names(w)).toHaveLength(25)
    w.unmount()
  })
  it('la fila ancla es la del foco: su página con el tamaño nuevo', async () => {
    const pages = []
    const w = mk({ rows: many, pageSizes: [5, 10], pageSize: 10, page: 2, selectable: true, labels: sizeLabels, 'onUpdate:page': (n) => pages.push(n) })
    w.findAll('tbody .g-table__select input')[3].element.focus() // fila 14 (índice 13)
    await sizeInputs(w)[0].setValue(true)
    expect(pages).toEqual([3])
    await flush()
    expect(names(w)).toEqual(['Cliente 11', 'Cliente 12', 'Cliente 13', 'Cliente 14', 'Cliente 15'])
    w.unmount()
  })
  it('sin foco, la primera fila a la vista al menos a medias; se sujeta en su sitio, se marca is-here y las nuevas is-new', async () => {
    const scroll = vi.fn()
    vi.stubGlobal('scrollBy', scroll)
    window.scrollBy = scroll
    const pages = []
    const w = mk({ rows: many, pageSizes: [10, 25], page: 2, labels: sizeLabels, 'onUpdate:page': (n) => pages.push(n) })
    rowBoxes(100) // índice 2 (Cliente 13): de −20 a 20, la mitad a la vista
    await sizeInputs(w)[1].setValue(true)
    expect(pages).toEqual([1])
    await flush()
    // Cliente 13 pasa al índice 12 (top 380): la ventana se desplaza 400px para dejarla donde estaba
    expect(scroll).toHaveBeenCalledWith({ top: 400, behavior: 'instant' })
    const trs = w.findAll('tbody tr.g-table__row')
    expect(trs[12].classes()).toContain('is-here')
    expect(trs[12].classes()).not.toContain('is-new')
    expect(trs[0].classes()).toContain('is-new')
    expect(trs[15].classes()).not.toContain('is-new')
    w.unmount()
  })
  it('animationend g-table-here quita is-here', async () => {
    window.scrollBy = vi.fn()
    const w = mk({ rows: many, pageSizes: [10, 25], labels: sizeLabels })
    rowBoxes(0)
    await sizeInputs(w)[1].setValue(true)
    await flush()
    const tr = w.find('tbody tr.is-here')
    expect(tr.exists()).toBe(true)
    const e = new Event('animationend', { bubbles: true })
    Object.defineProperty(e, 'animationName', { value: 'g-table-here' })
    tr.element.cells[0].dispatchEvent(e)
    await flush()
    expect(w.find('tbody tr.is-here').exists()).toBe(false)
    w.unmount()
  })
  it('cambio de tamaño por props (sin pie): la tabla sigue a la prop', async () => {
    const w = mk({ rows: many, pageSize: 10 })
    await w.setProps({ pageSize: 5 })
    await flush()
    expect(names(w)).toHaveLength(5)
    w.unmount()
  })
})

describe('GTable · anuncio del rango (#596)', () => {
  it('cambio de página local: anuncia el rango en el ciclo siguiente; nada al montar', async () => {
    const w = mk({ rows: many, pageSize: 10, labels: sizeLabels })
    await flush()
    expect(region(w).text()).toBe('')
    await w.findAll('.g-pagination__page')[1].trigger('click')
    await flush()
    expect(region(w).text()).toBe('Filas 11–20 de 25')
    w.unmount()
  })
  it('cambio de tamaño: el rango nuevo', async () => {
    const w = mk({ rows: many, pageSizes: [10, 25], labels: sizeLabels })
    await sizeInputs(w)[1].setValue(true)
    await flush()
    expect(region(w).text()).toBe('Filas 1–25 de 25')
    w.unmount()
  })
  it('sin labels.range, como antes: el cambio de página no escribe en la región', async () => {
    const w = mk({ rows: many, pageSize: 10 })
    await w.findAll('.g-pagination__page')[1].trigger('click')
    await flush()
    expect(region(w).text()).toBe('')
    w.unmount()
  })
  it('filtros antes que el rango: un filtro que vuelve a la página 1 anuncia el recuento', async () => {
    const w = mk({ rows: many, pageSize: 10, page: 2, labels: sizeLabels })
    await w.setProps({ filters: [{ key: 'total', op: 'gt', value: 20 }] })
    await flush()
    expect(region(w).text()).toBe('5 resultados')
    w.unmount()
  })
  it('servidor con loading en el mismo ciclo: el rango sale al llegar, en lugar de results', async () => {
    let w = null
    w = mk({ rows: many.slice(0, 10), total: 25, pageSize: 10, labels: { ...sizeLabels, loading: 'Cargando…' }, 'onUpdate:page': (p) => w.setProps({ page: p, loading: true }) })
    await w.findAll('.g-pagination__page')[1].trigger('click')
    await flush()
    expect(region(w).text()).toBe('')
    await w.setProps({ loading: false, rows: many.slice(10, 20) })
    await flush()
    await wait(20)
    await flush()
    expect(region(w).text()).toBe('Filas 11–20 de 25')
    w.unmount()
  })
  it('servidor con error al llegar: labels.failed, no el rango', async () => {
    let w = null
    w = mk({ rows: many.slice(0, 10), total: 25, pageSize: 10, labels: { ...sizeLabels, failed: 'No se pudo cargar', retry: 'Reintentar' }, 'onUpdate:page': (p) => w.setProps({ page: p, loading: true }) })
    await w.findAll('.g-pagination__page')[1].trigger('click')
    await flush()
    await w.setProps({ loading: false, error: true })
    await flush()
    await wait(20)
    await flush()
    expect(region(w).text()).toBe('No se pudo cargar')
    w.unmount()
  })
  it('servidor tras un cambio de tamaño: el esqueleto con las filas que van a llegar', async () => {
    let w = null
    w = mk({ rows: many.slice(0, 10), total: 25, pageSizes: [10, 25], labels: sizeLabels, 'onUpdate:pageSize': (n) => w.setProps({ pageSize: n, loading: true }) })
    await sizeInputs(w)[1].setValue(true)
    await flush()
    const sk = w.findAll('tbody tr')
    expect(sk).toHaveLength(25)
    expect(sk.every((r) => r.attributes('aria-hidden') === 'true')).toBe(true)
    w.unmount()
  })
})

describe('GTable · la puerta (#597, #598)', () => {
  const href = (r) => `#c-${r.id}`
  it('rowHref: <a class="g-table__door" href> dentro del título, con la flecha decorativa tras el texto', () => {
    const w = mk({ rowHref: href })
    expect(w.classes()).toContain('has-door')
    expect(w.classes()).not.toContain('has-detail')
    const a = w.find('tbody tr a.g-table__door')
    expect(a.attributes('href')).toBe('#c-a')
    expect(a.text()).toBe('Ana Torres')
    expect(a.element.parentElement.classList.contains('g-table__title')).toBe(true)
    const arrow = w.find('tbody tr .g-table__door-arrow')
    expect(arrow.attributes('aria-hidden')).toBe('true')
    expect(arrow.element.previousElementSibling.classList.contains('g-table__text')).toBe(true)
    expect(arrow.find('svg').classes()).toContain('g-icon--flip-rtl')
    w.unmount()
  })
  it('navigate con clic primario y luego update:lastOpened; la fila queda is-last-opened', async () => {
    const w = mk({ rowHref: href })
    press(w.find('tbody a.g-table__door').element)
    await flush()
    const nav = w.emitted('navigate')
    expect(nav).toHaveLength(1)
    expect(nav[0][0]).toMatchObject({ key: 'a', href: '#c-a', row: rows[0] })
    expect(nav[0][0].event).toBeInstanceOf(MouseEvent)
    expect(w.emitted('update:lastOpened')).toEqual([['a']])
    expect(w.findAll('tbody tr')[0].classes()).toContain('is-last-opened')
    w.unmount()
  })
  it('guarda de #505: sin navigate con modificadores, otro botón, defaultPrevented o el segundo clic', async () => {
    const w = mk({ rowHref: href })
    const a = w.find('tbody a.g-table__door').element
    const block = (e) => e.preventDefault()
    document.addEventListener('click', block)
    for (const init of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }, { detail: 2 }]) press(a, init)
    w.element.addEventListener('click', block, { capture: true })
    press(a)
    document.removeEventListener('click', block)
    await flush()
    expect(w.emitted('navigate')).toBeUndefined()
    expect(w.emitted('update:lastOpened')).toBeUndefined()
    w.unmount()
  })
  it('Intro (click con detail 0) navega', async () => {
    const w = mk({ rowHref: href })
    press(w.find('tbody a.g-table__door').element, { detail: 0 })
    expect(w.emitted('navigate')).toHaveLength(1)
    w.unmount()
  })
  it('activatable: <button type=button> que emite activate y update:lastOpened; convive con rowHref', async () => {
    const w = mk({ activatable: true, rowHref: (r) => (r.id === 'a' ? '#c-a' : null) })
    const doors = w.findAll('tbody .g-table__door')
    expect(doors[0].element.tagName).toBe('A')
    expect(doors[1].element.tagName).toBe('BUTTON')
    expect(doors[1].attributes('type')).toBe('button')
    expect(w.findAll('tbody tr')[1].find('.g-table__door-arrow').exists()).toBe(false)
    await doors[1].trigger('click')
    expect(w.emitted('activate')[0][0]).toMatchObject({ key: 'b', row: rows[1] })
    expect(w.emitted('update:lastOpened')).toEqual([['b']])
    w.unmount()
  })
  it('columna principal simple: la puerta envuelve el valor', () => {
    const cols = [{ key: 'plan', label: 'Plan', primary: true }, { key: 'estado', label: 'Estado' }]
    const w = mk({ columns: cols, rowHref: href })
    const a = w.find('tbody a.g-table__door')
    expect(a.text()).toBe('Pro')
    expect(a.element.parentElement.classList.contains('g-table__title')).toBe(true)
    w.unmount()
  })
  it('lastOpened al montar con la fila a la vista: is-last-opened e is-here, que se quita sin animación tras HERE_MS', async () => {
    rowBoxes(0)
    const w = mk({ rowHref: href, lastOpened: 'b' })
    await flush()
    const tr = () => w.findAll('tbody tr')[1]
    expect(tr().classes()).not.toContain('is-here') // se mide un cuadro después de montar (contenedor con v-cloak)
    await wait(40)
    await flush()
    expect(tr().classes()).toEqual(expect.arrayContaining(['is-last-opened', 'is-here']))
    await wait(1400)
    expect(tr().classes()).not.toContain('is-here')
    expect(tr().classes()).toContain('is-last-opened')
    w.unmount()
  })
  it('lastOpened fuera de la vista: rastro sin is-here; una clave que no está no marca nada', async () => {
    const w = mk({ rowHref: href, lastOpened: 'b' })
    await flush()
    await wait(40)
    await flush()
    expect(w.findAll('tbody tr')[1].classes()).toContain('is-last-opened')
    expect(w.find('tbody tr.is-here').exists()).toBe(false)
    await w.setProps({ lastOpened: 'zz' })
    expect(w.find('tbody tr.is-last-opened').exists()).toBe(false)
    w.unmount()
  })
  it('el foco vuelve a la puerta del rastro desde fuera de la tabla: is-here; desde dentro, no', async () => {
    const w = mk({ rowHref: href, lastOpened: 'b' })
    await flush()
    const doors = w.findAll('tbody .g-table__door')
    doors[1].element.dispatchEvent(new FocusEvent('focusin', { bubbles: true, relatedTarget: doors[0].element }))
    await flush()
    expect(w.find('tbody tr.is-here').exists()).toBe(false)
    doors[1].element.dispatchEvent(new FocusEvent('focusin', { bubbles: true, relatedTarget: null }))
    await flush()
    expect(w.findAll('tbody tr')[1].classes()).toContain('is-here')
    w.unmount()
  })
})

describe('GTable · despliegue B (#599)', () => {
  const detailLabels = { ...labels, detail: 'Cliente {title}' }
  const slots = {
    detail: ({ row, close, href: hr }) => h('div', { class: 'ficha' }, [h('span', { class: 'txt' }, row.nombre), h('a', { class: 'abrir', href: hr || '#' }, 'Abrir'), h('button', { class: 'cerrar', onClick: close }, 'Cerrar')]),
    'row-actions': () => h('button', { class: 'mas' }, '…'),
    'cell-estado': ({ value }) => h('button', { class: 'ctl' }, value)
  }
  const mkB = (props = {}) => mk({ labels: detailLabels, selectable: true, ...props }, { slots })
  const door = (w, i = 0) => w.findAll('tbody tr.g-table__row')[i].find('.g-table__door')
  it('botón de divulgación con chevrón; aria-controls solo desplegada; la ficha va tras su fila', async () => {
    const w = mkB({ rowHref: (r) => `#c-${r.id}` })
    expect(w.classes()).toEqual(expect.arrayContaining(['has-detail']))
    expect(w.classes()).not.toContain('has-door')
    const d = door(w)
    expect(d.element.tagName).toBe('BUTTON')
    expect(d.attributes('aria-expanded')).toBe('false')
    expect(d.attributes('aria-controls')).toBeUndefined()
    expect(d.element.firstElementChild.classList.contains('g-table__door-chevron')).toBe(true)
    expect(d.element.firstElementChild.getAttribute('aria-hidden')).toBe('true')
    expect(w.find('.g-table__door-arrow').exists()).toBe(false)
    await d.trigger('click')
    expect(w.emitted('update:expanded')).toEqual([[['a']]])
    expect(door(w).attributes('aria-expanded')).toBe('true')
    const tr = w.findAll('tbody tr')[0]
    expect(tr.classes()).toContain('is-expanded')
    const det = w.findAll('tbody tr')[1]
    expect(det.classes()).toEqual(expect.arrayContaining(['g-table__detail', 'is-open']))
    const cell = det.find('td.g-table__detail-cell')
    expect(cell.attributes('colspan')).toBe('6')
    const body = cell.find('.g-table__detail-body')
    expect(body.attributes('role')).toBe('group')
    expect(body.attributes('aria-label')).toBe('Cliente Ana Torres')
    expect(door(w).attributes('aria-controls')).toBe(body.attributes('id'))
    expect(body.find('.g-table__detail-content .ficha').exists()).toBe(true)
    expect(body.find('.abrir').attributes('href')).toBe('#c-a')
    w.unmount()
  })
  it('Esc dentro de la ficha: pliega, el foco a la puerta, sin propagar; se desmonta al terminar', async () => {
    const w = mkB({ expanded: ['a'] })
    const outer = vi.fn()
    document.addEventListener('keydown', outer)
    const btn = w.find('.cerrar').element
    btn.focus()
    const e = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    btn.dispatchEvent(e)
    document.removeEventListener('keydown', outer)
    expect(e.defaultPrevented).toBe(true)
    expect(outer).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(door(w).element)
    expect(w.emitted('update:expanded')).toEqual([[[]]])
    await flush()
    expect(door(w).attributes('aria-expanded')).toBe('false')
    expect(door(w).attributes('aria-controls')).toBeUndefined()
    expect(w.find('tbody tr.g-table__detail').exists()).toBe(true) // plegándose
    await wait(80)
    await flush()
    expect(w.find('tbody tr.g-table__detail').exists()).toBe(false)
    w.unmount()
  })
  it('transitionend de grid-template-rows en la propia ficha la desmonta; la de un hijo no', async () => {
    const w = mkB({ expanded: ['a'] })
    const body = w.find('.g-table__detail-body').element
    await door(w).trigger('click')
    const ev = (target) => { const e = new Event('transitionend', { bubbles: true }); Object.defineProperty(e, 'propertyName', { value: 'grid-template-rows' }); target.dispatchEvent(e) }
    ev(w.find('.ficha').element)
    await flush()
    expect(w.find('tbody tr.g-table__detail').exists()).toBe(true)
    ev(body)
    await flush()
    expect(w.find('tbody tr.g-table__detail').exists()).toBe(false)
    w.unmount()
  })
  it('Esc ya atendido dentro (defaultPrevented): no pliega', async () => {
    const w = mkB({ expanded: ['a'] })
    const btn = w.find('.cerrar').element
    btn.addEventListener('keydown', (e) => e.preventDefault())
    btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    expect(w.emitted('update:expanded')).toBeUndefined()
    w.unmount()
  })
  it('close() del alcance pliega y devuelve el foco a la puerta', async () => {
    const w = mkB({ expanded: ['a'] })
    await w.find('.cerrar').trigger('click')
    expect(w.emitted('update:expanded')).toEqual([[[]]])
    expect(document.activeElement).toBe(door(w).element)
    w.unmount()
  })
  it('se depura con un solo update:expanded cuando las filas cambian', async () => {
    const w = mkB({ expanded: ['a', 'c'] })
    await w.setProps({ rows: rows.slice(0, 2) })
    await flush()
    expect(w.emitted('update:expanded')).toEqual([[['a']]])
    w.unmount()
  })
  it('desplegada al montar: is-instant, que se quita tras dos cuadros', async () => {
    const w = mkB({ expanded: ['b'] })
    expect(w.find('tbody tr.g-table__detail').classes()).toContain('is-instant')
    await wait(60)
    await flush()
    expect(w.find('tbody tr.g-table__detail').classes()).not.toContain('is-instant')
    w.unmount()
  })
  it('el segundo clic de un doble clic en la puerta no vuelve a plegar', async () => {
    const w = mkB()
    const d = door(w).element
    d.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, detail: 1 }))
    d.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, detail: 2 }))
    expect(w.emitted('update:expanded')).toEqual([[['a']]])
    w.unmount()
  })
  it('clic de fila reenviado: el foco a la puerta y despliega', async () => {
    const w = mkB()
    const plan = w.findAll('tbody tr')[0].findAll('td')[2].element // Plan (tras la casilla y la compuesta)
    press(plan)
    expect(document.activeElement).toBe(door(w).element)
    expect(w.emitted('update:expanded')).toEqual([[['a']]])
    w.unmount()
  })
  describe('excepciones del clic reenviado (una por excepción)', () => {
    const cellAt = (w, i) => w.findAll('tbody tr')[0].findAll('td')[i].element
    const none = (w) => expect(w.emitted('update:expanded')).toBeUndefined()
    it('1 · botón no primario o con modificadores', () => {
      const w = mkB()
      for (const init of [{ button: 1 }, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }]) press(cellAt(w, 2), init)
      none(w)
      w.unmount()
    })
    it('2 · dentro de un control de la celda', () => {
      const w = mkB()
      press(w.find('tbody tr .ctl').element)
      none(w)
      w.unmount()
    })
    it('3 · en las celdas de selección y de acciones, aunque caiga en su relleno', () => {
      const w = mkB()
      press(w.find('tbody tr td.g-table__select').element)
      press(w.find('tbody tr td.g-table__actions').element)
      none(w)
      w.unmount()
    })
    it('4 · con texto seleccionado dentro de la fila', () => {
      const w = mkB()
      vi.stubGlobal('getSelection', () => ({ isCollapsed: false, toString: () => 'Pro', containsNode: () => true }))
      press(cellAt(w, 2))
      none(w)
      w.unmount()
    })
    it('5 · arrastre de más de 5px entre pointerdown y click', () => {
      const w = mkB()
      const el = cellAt(w, 2)
      el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 10, clientY: 10 }))
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, detail: 1, clientX: 20, clientY: 10 }))
      none(w)
      w.unmount()
    })
    it('6 · el segundo clic de un doble clic', () => {
      const w = mkB()
      press(cellAt(w, 2), { detail: 2 })
      none(w)
      w.unmount()
    })
    it('7 · dentro de la propia ficha o con defaultPrevented', () => {
      const w = mkB({ expanded: ['a'] })
      press(w.find('.ficha .txt').element)
      expect(w.emitted('update:expanded')).toBeUndefined()
      const plan = cellAt(w, 2)
      plan.addEventListener('click', (e) => e.preventDefault())
      press(plan)
      expect(w.emitted('update:expanded')).toBeUndefined()
      w.unmount()
    })
  })
})

describe('GTable · estado de fila (#600)', () => {
  const rowStatus = (r) => (r.id === 'a' ? { status: 'error', text: 'Vencido' } : r.id === 'b' ? { status: 'warning', text: 'En pausa', key: 'estado' } : null)
  it('data-status, etiqueta GBadge junto al título, has-row-status y aria-describedby de la puerta; sin role en filas', () => {
    const w = mk({ rowStatus, rowHref: (r) => `#c-${r.id}` })
    expect(w.classes()).toContain('has-row-status')
    const [a, b, c] = w.findAll('tbody tr')
    expect(a.attributes('data-status')).toBe('error')
    expect(a.attributes('role')).toBe('row')
    const badge = a.find('.g-table__cell--primary .g-table__composite > .g-table__status > .g-badge')
    expect(badge.exists()).toBe(true)
    expect(badge.classes()).toEqual(expect.arrayContaining(['g-badge--variant-soft', 'g-badge--size-sm', 'g-badge--color-danger']))
    expect(badge.text()).toBe('Vencido')
    expect(badge.find('.g-badge__icon').attributes('aria-hidden')).toBe('true')
    expect(a.find('.g-table__door').attributes('aria-describedby')).toBe(badge.attributes('id'))
    expect(c.attributes('data-status')).toBeUndefined()
    expect(c.find('.g-table__door').attributes('aria-describedby')).toBeUndefined()
    expect(b.attributes('data-status')).toBe('warning')
    w.unmount()
  })
  it('sello en la causa: con key de una columna, la etiqueta va en esa celda tras su valor', () => {
    const w = mk({ rowStatus, rowHref: (r) => `#c-${r.id}` })
    const b = w.findAll('tbody tr')[1]
    const cause = b.find('td.g-table__cell--cause')
    expect(cause.attributes('data-status')).toBe('warning')
    expect(cause.text()).toBe('EstadopausadoEn pausa')
    expect(cause.find('.g-table__status .g-badge--color-warning').exists()).toBe(true)
    expect(b.find('.g-table__cell--primary .g-table__status').exists()).toBe(false)
    expect(b.find('.g-table__door').attributes('aria-describedby')).toBe(cause.find('.g-badge').attributes('id'))
    w.unmount()
  })
  it('una key que no es columna cae junto al título', () => {
    const w = mk({ rowStatus: () => ({ status: 'info', text: 'Nota', key: 'nada' }) })
    expect(w.find('tbody .g-table__cell--primary .g-table__status').exists()).toBe(true)
    expect(w.find('td.g-table__cell--cause').exists()).toBe(false)
    w.unmount()
  })
  it('avisos: status fuera de la lista (se ignora) y sin text (sin etiqueta)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mk({ rowStatus: (r) => (r.id === 'a' ? { status: 'raro', text: 'X' } : r.id === 'b' ? { status: 'success' } : null) })
    const [a, b] = w.findAll('tbody tr')
    expect(a.attributes('data-status')).toBeUndefined()
    expect(b.attributes('data-status')).toBe('success')
    expect(b.find('.g-table__status').exists()).toBe(false)
    const msgs = warn.mock.calls.map((c) => c[0])
    expect(msgs.some((m) => m.startsWith('[Grana] <GTable>') && m.includes('«raro»'))).toBe(true)
    expect(msgs.some((m) => m.includes('rowStatus sin text'))).toBe(true)
    w.unmount()
  })
})

describe('GTable · avisos de desarrollo de filas por página y activación', () => {
  const warns = () => vi.spyOn(console, 'warn').mockImplementation(() => {})
  const said = (spy, text) => spy.mock.calls.some((c) => String(c[0]).startsWith('[Grana] <GTable>') && String(c[0]).includes(text))
  it('pageSizes sin labels.pagination.pageSize ni labels.range', () => {
    const spy = warns()
    const w = mk({ rows: many, pageSizes: [10, 25] })
    expect(said(spy, 'labels.pagination.pageSize')).toBe(true)
    expect(said(spy, 'labels.range')).toBe(true)
    w.unmount()
  })
  it('activatable con el slot detail y detail sin labels.detail', () => {
    const spy = warns()
    const w = mk({ activatable: true }, { slots: { detail: () => h('p', 'x') } })
    expect(said(spy, 'activatable se ignora')).toBe(true)
    expect(said(spy, 'labels.detail')).toBe(true)
    expect(w.find('tbody .g-table__door').attributes('aria-expanded')).toBe('false')
    w.unmount()
  })
  it('rowHref con un slot cell-{key} en la columna principal: sin puerta y aviso', () => {
    const spy = warns()
    const w = mk({ rowHref: (r) => `#${r.id}` }, { slots: { 'cell-cliente': ({ row }) => h('b', row.nombre) } })
    expect(w.find('.g-table__door').exists()).toBe(false)
    expect(said(spy, 'cell-cliente')).toBe(true)
    w.unmount()
  })
  it('una puerta con título vacío', () => {
    const spy = warns()
    const w = mk({ activatable: true, rows: [{ ...rows[0], nombre: '' }] })
    expect(said(spy, 'título vacío')).toBe(true)
    w.unmount()
  })
  it('sin avisos con todo bien puesto', () => {
    const spy = warns()
    const w = mk({ rows: many, pageSizes: [10, 25], labels: { ...sizeLabels, detail: 'Cliente {title}' }, rowHref: (r) => `#${r.id}`, rowStatus: () => ({ status: 'info', text: 'Nota' }) }, { slots: { detail: () => h('p', 'x') } })
    expect(spy.mock.calls.filter((c) => String(c[0]).startsWith('[Grana] <GTable>'))).toEqual([])
    w.unmount()
  })
})

describe('GTable · una sola luz (#960 a #962)', () => {
  it('div.g-table__highlight[aria-hidden] primer hijo de g-table__scroll, antes del <table>', () => {
    const w = mk()
    const sc = w.find('.g-table__scroll').element
    expect(sc.firstElementChild.className).toBe('g-table__highlight')
    expect(sc.firstElementChild.tagName).toBe('DIV')
    expect(sc.firstElementChild.getAttribute('aria-hidden')).toBe('true')
    expect(sc.firstElementChild.nextElementSibling.tagName).toBe('TABLE')
  })
  it('sin capa en appearance="surface" ni en mode="cards" (#961)', () => {
    expect(mk({ appearance: 'surface' }).find('.g-table__highlight').exists()).toBe(false)
    expect(mk({ responsive: 'cards' }).find('.g-table__highlight').exists()).toBe(false)
  })
  const setup = (props = {}) => {
    const frames = []
    vi.stubGlobal('requestAnimationFrame', (f) => { frames.push(f); return frames.length })
    const w = mk(props)
    const run = () => frames.splice(0).forEach((f) => f())
    const host = w.find('.g-table__scroll').element
    const move = (el) => {
      document.elementFromPoint = () => el
      el.dispatchEvent(Object.assign(new Event('pointermove', { bubbles: true }), { pointerType: 'mouse', clientX: 5, clientY: 5 }))
      run()
    }
    return { w, host, move, run }
  }
  it('llana: la fila entera; la cabecera apaga; el puntero no mueve el foco', () => {
    const { w, host, move } = setup()
    move(w.findAll('tbody td')[2].element)
    expect(host.classList.contains('has-highlight')).toBe(true)
    move(w.find('thead th').element)
    expect(host.classList.contains('has-highlight')).toBe(false)
    expect(document.activeElement).toBe(document.body)
  })
  it('A · La puerta: solo la celda principal de una fila con puerta', () => {
    const { w, host, move } = setup({ rowHref: (r) => `/c/${r.id}` })
    move(w.findAll('tbody tr')[0].findAll('td')[1].element)
    expect(host.classList.contains('has-highlight')).toBe(false)
    move(w.find('tbody td.g-table__cell--primary .g-table__door').element)
    expect(host.classList.contains('has-highlight')).toBe(true)
  })
  it('cargando: apagada y nada se registra; al cambiar las filas se apaga hasta el siguiente movimiento', async () => {
    const { w, host, move } = setup()
    move(w.findAll('tbody td')[1].element)
    expect(host.classList.contains('has-highlight')).toBe(true)
    await w.setProps({ rows: [...rows].reverse() })
    await flush()
    expect(host.classList.contains('has-highlight')).toBe(false)
    await w.setProps({ loading: true })
    await flush()
    move(w.findAll('tbody td')[1].element)
    expect(host.classList.contains('has-highlight')).toBe(false)
  })
  it('un render del padre con las mismas filas en línea no apaga la luz', async () => {
    const { w, host, move } = setup()
    move(w.findAll('tbody td')[1].element)
    await w.setProps({ rows: rows.map((r) => ({ ...r })) })
    await flush()
    expect(host.classList.contains('has-highlight')).toBe(true)
  })
})
