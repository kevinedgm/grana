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
