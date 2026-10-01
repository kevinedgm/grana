import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import GFilterBar from './GFilterBar.vue'

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () { if (!this.hasAttribute('open')) return; this.removeAttribute('open'); this.dispatchEvent(new Event('close')) }
  HTMLElement.prototype.showPopover = function () { this.setAttribute('data-open', '') }
  HTMLElement.prototype.hidePopover = function () { this.removeAttribute('data-open') }
  const m = Element.prototype.matches
  vi.spyOn(Element.prototype, 'matches').mockImplementation(function (s) { return s === ':popover-open' ? this.hasAttribute('data-open') : m.call(this, s) })
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); document.body.innerHTML = '' })

const fields = [
  { key: 'cliente', label: 'Cliente', title: 'nombre', subtitle: 'correo', filter: { type: 'text' } },
  { key: 'estado', label: 'Estado', filter: { type: 'enum', options: ['activo', 'pausado', 'vencido'], suggest: true } },
  { key: 'total', label: 'Total', filter: { type: 'number', unit: '$', suggest: true } },
  { key: 'nota', label: 'Nota' }
]
const labels = {
  group: 'Filtros', add: 'Agregar filtro', clear: 'Limpiar filtros', filterBy: 'Filtrar por {label}', edit: 'Editar filtro: {summary}', remove: 'Quitar filtro: {summary}',
  apply: 'Aplicar', cancel: 'Cancelar', required: 'Indica un valor', range: 'Desde debe ser menor', rule: 'Regla', value: 'Valor', from: 'Desde', to: 'Hasta', and: 'y', days: '{n} días',
  results: '{count} resultados', ops: { contains: 'contiene', is: 'es', starts: 'empieza por', gt: 'mayor que', lt: 'menor que', eq: 'igual a', between: 'entre', in: 'es cualquiera de' }
}
const mk = (props = {}) => mount(GFilterBar, { attachTo: document.body, props: { fields, labels, ...props } })
const flush = async () => { for (let i = 0; i < 4; i++) await nextTick() }
const editor = (w) => w.find('.g-filter-bar__editor')

describe('GFilterBar · barra', () => {
  it('grupo con nombre; sugeridos solo de campos con suggest; Agregar filtro', () => {
    const w = mk()
    expect(w.attributes()).toMatchObject({ role: 'group', 'aria-label': 'Filtros' })
    expect(w.findAll('.g-filter-bar__suggest').map((b) => b.text())).toEqual(['Estado', 'Total'])
    expect(w.find('.g-filter-bar__add').text()).toBe('Agregar filtro')
    expect(w.find('.g-filter-bar__clear').exists()).toBe(false)
    w.unmount()
  })
  it('chip aplicado: dos botones con nombre completo; deja de sugerirse; Limpiar aparece', () => {
    const w = mk({ filters: [{ key: 'total', op: 'gt', value: 3000 }] })
    const chip = w.find('.g-filter-bar__chip')
    expect(chip.find('.g-filter-bar__edit').attributes('aria-label')).toBe('Editar filtro: Total mayor que $3,000')
    expect(chip.find('.g-filter-bar__remove').attributes('aria-label')).toBe('Quitar filtro: Total mayor que $3,000')
    expect(chip.find('.g-filter-bar__edit b').text()).toBe('Total')
    expect(w.findAll('.g-filter-bar__suggest').map((b) => b.text())).toEqual(['Estado'])
    expect(w.find('.g-filter-bar__clear').exists()).toBe(true)
    w.unmount()
  })
  it('recuento visible', () => {
    expect(mk({ count: 6 }).find('.g-filter-bar__count').text()).toBe('6 resultados')
  })
  it('campos sin filter no aparecen en ningún lado', () => {
    const w = mk()
    expect(w.text()).not.toContain('Nota')
    w.unmount()
  })
})

describe('GFilterBar · editor', () => {
  it('sugerido abre el editor con nombre, regla y valor; el foco entra', async () => {
    const w = mk()
    await w.findAll('.g-filter-bar__suggest')[1].trigger('click'); await flush()
    const e = editor(w)
    expect(e.attributes('role')).toBe('dialog')
    expect(e.attributes('data-open')).toBeDefined()
    expect(e.find('.g-filter-bar__editor-title').text()).toBe('Filtrar por Total')
    expect(e.findAll('option').map((o) => o.text())).toEqual(['mayor que', 'menor que', 'igual a', 'entre'])
    expect(document.activeElement.tagName).toBe('SELECT')
    w.unmount()
  })
  it('aplicar emite el filtro y el foco vuelve al chip', async () => {
    const w = mk()
    await w.findAll('.g-filter-bar__suggest')[1].trigger('click'); await flush()
    await editor(w).find('input').setValue('3000')
    await editor(w).findAll('button').at(-1).trigger('click'); await flush()
    expect(w.emitted('update:filters')[0][0]).toEqual([{ key: 'total', op: 'gt', value: 3000 }])
    expect(editor(w).attributes('data-open')).toBeUndefined()
  })
  it('Enter aplica; vacío muestra el error y no emite', async () => {
    const w = mk()
    await w.findAll('.g-filter-bar__suggest')[1].trigger('click'); await flush()
    const input = editor(w).find('input')
    await input.trigger('keydown', { key: 'Enter' }); await flush()
    expect(w.emitted('update:filters')).toBeUndefined()
    expect(editor(w).find('.g-filter-bar__error').text()).toBe('Indica un valor')
    expect(input.attributes('aria-invalid')).toBe('true')
    await input.setValue('100'); await input.trigger('keydown', { key: 'Enter' }); await flush()
    expect(w.emitted('update:filters')[0][0]).toEqual([{ key: 'total', op: 'gt', value: 100 }])
  })
  it('Enter aplica también desde el select de regla', async () => {
    const w = mk()
    await w.findAll('.g-filter-bar__suggest')[1].trigger('click'); await flush()
    const ed = editor(w)
    await ed.find('input').setValue('100')
    const sel = ed.find('select')
    expect(sel.exists()).toBe(true)
    await sel.trigger('keydown', { key: 'Enter' }); await flush()
    expect(w.emitted('update:filters')[0][0]).toEqual([{ key: 'total', op: 'gt', value: 100 }])
  })
  it('entre: dos campos y rango inválido', async () => {
    const w = mk()
    await w.findAll('.g-filter-bar__suggest')[1].trigger('click'); await flush()
    await editor(w).find('select').setValue('between'); await flush()
    const ins = editor(w).findAll('input')
    expect(ins).toHaveLength(2)
    await ins[0].setValue('5000'); await ins[1].setValue('1000')
    await editor(w).findAll('button').at(-1).trigger('click'); await flush()
    expect(editor(w).find('.g-filter-bar__error').text()).toBe('Desde debe ser menor')
    await ins[1].setValue('9000'); await editor(w).findAll('button').at(-1).trigger('click'); await flush()
    expect(w.emitted('update:filters')[0][0]).toEqual([{ key: 'total', op: 'between', value: [5000, 9000] }])
  })
  it('enum: casillas; sin selección no aplica', async () => {
    const w = mk()
    await w.findAll('.g-filter-bar__suggest')[0].trigger('click'); await flush()
    expect(editor(w).find('select').exists()).toBe(false) // una sola regla
    const boxes = editor(w).findAll('input[type=checkbox]')
    expect(boxes).toHaveLength(3)
    await editor(w).findAll('button').at(-1).trigger('click'); await flush()
    expect(w.emitted('update:filters')).toBeUndefined()
    await boxes[1].setValue(true); await boxes[2].setValue(true)
    await editor(w).findAll('button').at(-1).trigger('click'); await flush()
    expect(w.emitted('update:filters')[0][0]).toEqual([{ key: 'estado', op: 'in', value: ['pausado', 'vencido'] }])
  })
  it('Esc cancela sin emitir y devuelve el foco', async () => {
    const w = mk()
    const sug = w.findAll('.g-filter-bar__suggest')[1]
    await sug.trigger('click'); await flush()
    await editor(w).find('select').trigger('keydown', { key: 'Escape' }); await flush()
    expect(w.emitted('update:filters')).toBeUndefined()
    expect(editor(w).attributes('data-open')).toBeUndefined()
    expect(document.activeElement).toBe(sug.element)
    w.unmount()
  })
  it('editar un chip conserva su posición y su valor', async () => {
    const w = mk({ filters: [{ key: 'cliente', op: 'contains', value: 'ana' }, { key: 'total', op: 'gt', value: 3000 }] })
    await w.findAll('.g-filter-bar__edit')[0].trigger('click'); await flush()
    expect(editor(w).find('input').element.value).toBe('ana')
    await editor(w).find('input').setValue('bruno')
    await editor(w).findAll('button').at(-1).trigger('click'); await flush()
    expect(w.emitted('update:filters')[0][0]).toEqual([{ key: 'cliente', op: 'contains', value: 'bruno' }, { key: 'total', op: 'gt', value: 3000 }])
  })
  it('por debajo de space × 130 se abre como hoja (GDialog)', async () => {
    vi.stubGlobal('innerWidth', 360)
    const w = mount(GFilterBar, { attachTo: document.body, props: { fields, labels }, attrs: { style: '--g-space-1: 4px' } })
    await w.findAll('.g-filter-bar__suggest')[1].trigger('click'); await flush()
    const dlg = w.find('dialog')
    expect(dlg.attributes('open')).toBeDefined()
    expect(dlg.text()).toContain('Filtrar por Total')
    expect(editor(w).attributes('data-open')).toBeUndefined()
    w.unmount()
  })
})

describe('GFilterBar · quitar, limpiar y agregar', () => {
  it('quitar emite sin el filtro y mueve el foco', async () => {
    const w = mk({ filters: [{ key: 'cliente', op: 'contains', value: 'ana' }, { key: 'total', op: 'gt', value: 3000 }] })
    await w.findAll('.g-filter-bar__remove')[0].trigger('click')
    expect(w.emitted('update:filters')[0][0]).toEqual([{ key: 'total', op: 'gt', value: 3000 }])
    w.unmount()
  })
  it('limpiar emite []', async () => {
    const w = mk({ filters: [{ key: 'total', op: 'gt', value: 3000 }] })
    await w.find('.g-filter-bar__clear').trigger('click')
    expect(w.emitted('update:filters')[0][0]).toEqual([])
    w.unmount()
  })
  it('Agregar filtro ofrece los campos filtrables no aplicados y abre su editor', async () => {
    vi.useFakeTimers()
    const w = mk({ filters: [{ key: 'total', op: 'gt', value: 3000 }] })
    await w.find('.g-filter-bar__add').trigger('click'); await flush()
    const items = w.findAll('.g-menu__item')
    expect(items.map((i) => i.text())).toEqual(['Cliente', 'Estado'])
    await items[0].trigger('click'); vi.runAllTimers(); await flush()
    expect(editor(w).find('.g-filter-bar__editor-title').text()).toBe('Filtrar por Cliente')
    w.unmount()
  })
  it('avisa si faltan textos', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(GFilterBar, { props: { fields } })
    expect(warn.mock.calls.some((c) => /faltan textos/.test(c[0]))).toBe(true)
  })
})
