// La salida no retrasa el cierre, pero el panel no se vacía mientras se funde (#1005; api.md «Paneles anclados»).
// transitionMs se fija: jsdom no tiene transiciones, y sin ellas (0 ms) el panel se vacía en el acto.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import GHelper from './GHelper/GHelper.vue'
import GFilterBar from './GFilterBar/GFilterBar.vue'
import GCombobox from './GCombobox/GCombobox.vue'
import { transitionMs } from '../utils/motion.js'

vi.mock('../utils/motion.js', () => ({ transitionMs: vi.fn(() => 120) }))

const flush = async () => { for (let i = 0; i < 5; i++) await nextTick() }
const open = (el) => el.hasAttribute('data-open')

beforeEach(() => {
  vi.useFakeTimers()
  transitionMs.mockReturnValue(120)
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }
  HTMLElement.prototype.showPopover = function () { this.setAttribute('data-open', '') }
  HTMLElement.prototype.hidePopover = function () { this.removeAttribute('data-open') }
  const m = Element.prototype.matches
  vi.spyOn(Element.prototype, 'matches').mockImplementation(function (s) { return s === ':popover-open' ? this.hasAttribute('data-open') : m.call(this, s) })
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); document.body.innerHTML = '' })

describe('GHelper · salida', () => {
  const mk = () => mount(GHelper, {
    attachTo: document.body,
    props: { ariaLabel: 'Ayuda', contentLabel: 'Ayuda del campo', closeLabel: 'Cerrar', adaptive: false },
    slots: { content: () => [h('p', { class: 'texto' }, 'Puedo ayudarte')] }
  })
  const content = (w) => w.find('.g-helper__content')
  const openIt = async (w) => { await w.find('.g-helper__trigger').trigger('click'); await flush() }

  it('cierra en el acto, conserva el contenido inerte con su lado y lo vacía al acabar', async () => {
    const w = mk()
    await openIt(w)
    const side = content(w).attributes('data-side')
    await w.find('.g-helper__trigger').trigger('click')
    await flush()
    expect(open(content(w).element)).toBe(false)
    expect(w.find('.g-helper__trigger').attributes('aria-expanded')).toBe('false')
    expect(w.emitted('toggle').at(-1)[0]).toEqual({ open: false, presentation: 'popover' })
    expect(w.find('.texto').exists()).toBe(true)
    expect(content(w).attributes('data-side')).toBe(side)
    expect(content(w).attributes('inert')).toBeDefined()
    vi.advanceTimersByTime(119)
    await flush()
    expect(w.find('.texto').exists()).toBe(true)
    vi.advanceTimersByTime(1)
    await flush()
    expect(w.find('.texto').exists()).toBe(false)
    expect(content(w).attributes('inert')).toBeUndefined()
    w.unmount()
  })

  it('reabrir a mitad cancela el vaciado', async () => {
    const w = mk()
    await openIt(w)
    await w.find('.g-helper__trigger').trigger('click')
    await flush()
    vi.advanceTimersByTime(60)
    await openIt(w)
    vi.advanceTimersByTime(500)
    await flush()
    expect(w.find('.texto').exists()).toBe(true)
    expect(content(w).attributes('inert')).toBeUndefined()
    w.unmount()
  })

  it('sin transición (0 ms) se vacía en el acto', async () => {
    transitionMs.mockReturnValue(0)
    const w = mk()
    await openIt(w)
    await w.find('.g-helper__trigger').trigger('click')
    await flush()
    expect(w.find('.texto').exists()).toBe(false)
    w.unmount()
  })
})

describe('GFilterBar · salida', () => {
  const fields = [
    { key: 'estado', label: 'Estado', filter: { type: 'enum', options: ['activo', 'pausado'], suggest: true } },
    { key: 'total', label: 'Total', filter: { type: 'number', suggest: true } }
  ]
  const labels = { group: 'Filtros', add: 'Agregar', clear: 'Limpiar', filterBy: 'Filtrar por {label}', edit: 'Editar {summary}', remove: 'Quitar {summary}', apply: 'Aplicar', cancel: 'Cancelar', required: 'Indica', rule: 'Regla', value: 'Valor', from: 'Desde', to: 'Hasta', ops: {} }
  const mk = () => mount(GFilterBar, { attachTo: document.body, props: { fields, labels } })
  const editor = (w) => w.find('.g-filter-bar__editor')
  const title = (w) => w.find('.g-filter-bar__editor-title')
  const suggest = (w, i) => w.findAll('.g-filter-bar__suggest')[i]
  const openIt = async (w, i) => { await suggest(w, i).trigger('click'); await flush() }

  it('data-side físico desde placeEditor', async () => {
    const w = mk()
    await openIt(w, 0)
    expect(editor(w).attributes('data-side')).toBe('bottom')
    w.unmount()
  })

  it('cancelar: se cierra en el acto, título y cuerpo siguen, inertes, y el foco vuelve ya', async () => {
    const w = mk()
    await openIt(w, 0)
    await editor(w).trigger('keydown', { key: 'Escape' })
    await flush()
    expect(open(editor(w).element)).toBe(false)
    expect(title(w).text()).toBe('Filtrar por Estado')
    expect(editor(w).find('fieldset').exists()).toBe(true)
    expect(editor(w).attributes('inert')).toBeDefined()
    expect(document.activeElement).toBe(suggest(w, 0).element)
    vi.advanceTimersByTime(120)
    await flush()
    expect(title(w).exists()).toBe(false)
    expect(editor(w).attributes('inert')).toBeUndefined()
    w.unmount()
  })

  it('abrir otro chip a mitad de salida cancela el vaciado y pinta el nuevo', async () => {
    const w = mk()
    await openIt(w, 0)
    await editor(w).trigger('keydown', { key: 'Escape' })
    await flush()
    vi.advanceTimersByTime(40)
    await openIt(w, 1)
    expect(title(w).text()).toBe('Filtrar por Total')
    vi.advanceTimersByTime(500)
    await flush()
    expect(title(w).text()).toBe('Filtrar por Total')
    expect(editor(w).attributes('inert')).toBeUndefined()
    w.unmount()
  })

  it('un campo que desaparece durante la salida vacía el editor sin romper', async () => {
    const w = mk()
    await openIt(w, 0)
    await editor(w).trigger('keydown', { key: 'Escape' })
    await flush()
    await w.setProps({ fields: fields.slice(1) })
    await flush()
    expect(title(w).exists()).toBe(false)
    w.unmount()
  })
})

describe('GCombobox · salida de A', () => {
  const OPTIONS = [{ value: 'a', label: 'Alfa' }, { value: 'b', label: 'Beta' }]
  const LABELS = { clear: 'Limpiar', close: 'Cerrar', loading: 'Buscando', noResults: 'Sin resultados', results: (n) => `${n}` }
  const mk = async () => {
    const w = mount(GCombobox, { attachTo: document.body, props: { label: 'Letra', labels: LABELS, options: OPTIONS, delay: 0 } })
    await flush()
    return w
  }
  const popup = (w) => w.find('.g-combobox__popup')
  const field = (w) => w.find('input.g-combobox__field')
  const openIt = async (w) => { await field(w).trigger('keydown', { key: 'ArrowDown' }); await flush() }
  const close = async (w) => { await field(w).trigger('keydown', { key: 'Escape' }); await flush() }

  it('cierra en el acto; filas, is-empty e is-up se conservan hasta acabar la salida', async () => {
    const w = await mk()
    await openIt(w)
    expect(w.findAll('[role="option"]').length).toBe(2)
    await close(w)
    expect(open(popup(w).element)).toBe(false)
    expect(field(w).attributes('aria-expanded')).toBe('false')
    expect(w.find('.g-combobox').classes()).not.toContain('is-open')
    expect(popup(w).classes()).not.toContain('is-empty')
    expect(popup(w).attributes('inert')).toBeDefined()
    expect(w.findAll('[role="option"]').length).toBe(2)
    vi.advanceTimersByTime(120)
    await flush()
    expect(w.findAll('[role="option"]').length).toBe(0)
    expect(popup(w).classes()).toContain('is-empty')
    expect(popup(w).attributes('inert')).toBeUndefined()
    w.unmount()
  })

  it('reabrir a mitad cancela la limpieza', async () => {
    const w = await mk()
    await openIt(w)
    await close(w)
    vi.advanceTimersByTime(50)
    await openIt(w)
    vi.advanceTimersByTime(500)
    await flush()
    expect(w.findAll('[role="option"]').length).toBe(2)
    expect(popup(w).classes()).not.toContain('is-empty')
    w.unmount()
  })
})
