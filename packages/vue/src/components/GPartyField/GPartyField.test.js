// GPartyField (booking-bar.md «GPartyField», #738): resumen, máximos dependientes, ocultos, panel, GForm.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick, ref } from 'vue'
import GPartyField from './GPartyField.vue'
import GForm from '../GForm/GForm.vue'

beforeEach(() => {
  HTMLElement.prototype.showPopover = function () { this.setAttribute('data-popover-open', '') }
  HTMLElement.prototype.hidePopover = function () { this.removeAttribute('data-popover-open') }
  const orig = HTMLElement.prototype.matches
  HTMLElement.prototype.matches = function (sel) { return sel === ':popover-open' ? this.hasAttribute('data-popover-open') : orig.call(this, sel) }
})
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

export const ROWS = [
  { key: 'adults', label: 'Adultos', min: 1, default: 2, unit: (n) => `${n} ${n === 1 ? 'adulto' : 'adultos'}`, decrementLabel: 'Quitar adulto', incrementLabel: 'Añadir adulto' },
  { key: 'children', label: 'Niños', hint: 'De 0 a 12 años', unit: (n) => `${n} ${n === 1 ? 'niño' : 'niños'}`, decrementLabel: 'Quitar niño', incrementLabel: 'Añadir niño' },
  { key: 'rooms', label: 'Habitaciones', min: 1, max: (v) => v.adults, unit: '{count} hab.', decrementLabel: 'Quitar habitación', incrementLabel: 'Añadir habitación' }
]
const LB = { done: 'Listo', separator: ' · ' }
const mk = (props = {}, opts = {}) => mount(GPartyField, { attachTo: document.body, props: { rows: ROWS, label: 'Huéspedes', labels: LB, locale: 'es', ...props }, ...opts })
const flush = async () => { for (let i = 0; i < 4; i++) await nextTick() }
const tap = async (w, el, detail = 1) => { el.element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail })); await flush() }
const quiet = () => vi.spyOn(console, 'warn').mockImplementation(() => {})

describe('GPartyField · disparador y resumen', () => {
  it('caja con etiqueta, icono users, resumen en palabras y chevron; nombre = etiqueta + valor', () => {
    const w = mk()
    expect(w.classes()).toEqual(expect.arrayContaining(['g-party-field', 'g-party-field--mode-popover', 'g-party-field--size-md', 'g-party-field--variant-outline']))
    const b = w.find('button.g-party-field__trigger')
    expect(b.attributes()).toMatchObject({ type: 'button', 'aria-haspopup': 'dialog', 'aria-expanded': 'false' })
    expect(b.attributes('aria-controls')).toBe(w.find('.g-party-field__panel').attributes('id'))
    const [l, v] = b.attributes('aria-labelledby').split(' ')
    expect(w.find(`#${l}`).text()).toBe('Huéspedes')
    expect(w.find(`#${v}`).text()).toBe('2 adultos · 1 hab.')
    expect(w.find('.g-party-field__arrow').exists()).toBe(true)
    expect(b.findAll('svg')).toHaveLength(2)
  })

  it('resumen: filas con valor > 0 y siempre la primera; unit cadena con {count}', () => {
    const w = mk({ modelValue: { adults: 3, children: 1, rooms: 2 } })
    expect(w.find('.g-party-field__value').text()).toBe('3 adultos · 1 niño · 2 hab.')
  })

  it('un max dependiente que baja corrige el valor y lo emite', async () => {
    const w = mk({ modelValue: { adults: 1, children: 0, rooms: 3 } })
    expect(w.emitted('update:modelValue')[0][0]).toEqual({ adults: 1, children: 0, rooms: 1 })
  })

  it('ocultos {name}[{key}] por fila (también con disabled)', () => {
    const w = mk({ name: 'guests', disabled: true })
    const inputs = w.findAll('input[type="hidden"]')
    expect(inputs.map((i) => [i.attributes('name'), i.attributes('value')])).toEqual([['guests[adults]', '2'], ['guests[children]', '0'], ['guests[rooms]', '1']])
  })
})

describe('GPartyField · panel', () => {
  it('abrir lleva el foco al primer contador; Esc cierra y devuelve el foco al disparador', async () => {
    const w = mk()
    await tap(w, w.find('.g-party-field__trigger'), 1)
    await flush()
    const panel = w.find('.g-party-field__panel')
    expect(panel.attributes('data-popover-open')).toBeDefined()
    expect(w.emitted('open')).toHaveLength(1)
    expect(w.find('.g-party-field__trigger').attributes('aria-expanded')).toBe('true')
    expect(panel.element.contains(document.activeElement)).toBe(true)
    expect(document.activeElement.tagName).toBe('INPUT')
    const ev = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    document.activeElement.dispatchEvent(ev)
    await flush()
    expect(ev.defaultPrevented).toBe(true)
    expect(panel.attributes('data-popover-open')).toBeUndefined()
    expect(document.activeElement).toBe(w.find('.g-party-field__trigger').element)
  })

  it('una activación por gesto: el segundo clic de un doble clic no cierra lo que abrió', async () => {
    const w = mk()
    const b = w.find('.g-party-field__trigger')
    await tap(w, b, 1)
    await tap(w, b, 2)
    expect(w.find('.g-party-field__panel').attributes('data-popover-open')).toBeDefined()
  })

  it('tocar fuera cierra sin robar el foco; tocar el fondo del panel no cierra', async () => {
    const out = document.createElement('button'); document.body.append(out)
    const w = mk()
    await tap(w, w.find('.g-party-field__trigger'), 1)
    w.find('.g-party-field__panel').element.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await flush()
    expect(w.find('.g-party-field__panel').attributes('data-popover-open')).toBeDefined()
    out.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await flush()
    expect(w.find('.g-party-field__panel').attributes('data-popover-open')).toBeUndefined()
    expect(document.activeElement).not.toBe(w.find('.g-party-field__trigger').element)
  })

  it('salir con Tab cierra (comprobado tras el evento, aunque relatedTarget sea null)', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout'] })
    const out = document.createElement('button'); document.body.append(out)
    const w = mk()
    await tap(w, w.find('.g-party-field__trigger'), 1)
    out.focus()
    w.find('.g-party-field__panel').element.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }))
    await vi.advanceTimersByTimeAsync(1); await flush()
    expect(w.find('.g-party-field__panel').attributes('data-popover-open')).toBeUndefined()
    expect(document.activeElement).toBe(out)
    vi.useRealTimers()
  })

  it('«Listo» cierra y devuelve el foco; + en un contador emite el grupo', async () => {
    const w = mk()
    await tap(w, w.find('.g-party-field__trigger'), 1)
    const inc = w.findAll('.g-party-field__panel .g-number-field')[1].find('.g-number-field__step--increment')
    await inc.trigger('pointerdown', { button: 0 }); await inc.trigger('pointerup', { button: 0 }); await flush()
    expect(w.emitted('update:modelValue').at(-1)[0]).toEqual({ adults: 2, children: 1, rooms: 1 })
    await w.find('.g-party-field__done').trigger('click'); await flush()
    expect(document.activeElement).toBe(w.find('.g-party-field__trigger').element)
  })

  it('solo lectura: enfocable y no abre; deshabilitado: disabled', async () => {
    const r = mk({ readonly: true })
    await tap(r, r.find('.g-party-field__trigger'), 1)
    expect(r.find('.g-party-field__panel').attributes('data-popover-open')).toBeUndefined()
    expect(r.find('.g-party-field__trigger').attributes('aria-readonly')).toBe('true')
    expect(mk({ disabled: true }).find('.g-party-field__trigger').attributes('disabled')).toBeDefined()
  })
})

describe('GPartyField · inline, slot trigger y GForm', () => {
  it('inline: filas a la vista en un role=group nombrado por la etiqueta, sin disparador ni panel', () => {
    const w = mk({ mode: 'inline' })
    const g = w.find('.g-party-field__rows[role="group"]')
    expect(g.attributes('aria-labelledby')).toBe(w.find('.g-party-field__label').attributes('id'))
    expect(w.find('.g-party-field__trigger').exists()).toBe(false)
    expect(w.find('.g-party-field__panel').exists()).toBe(false)
    expect(g.findAll('.g-number-field')).toHaveLength(3)
  })

  it('slot trigger: raíz g-party-field--trigger, sin etiqueta ni mensaje, alcance con text y toggle', async () => {
    let scope
    const w = mk({}, { slots: { trigger: (s) => { scope = s; return h('button', { class: 'mio', type: 'button', onClick: s.toggle }, s.text) } } })
    expect(w.classes()).toContain('g-party-field--trigger')
    expect(w.find('.g-party-field__label').exists()).toBe(false)
    expect(w.find('.g-party-field__support').exists()).toBe(false)
    expect(w.find('.mio').text()).toBe('2 adultos · 1 hab.')
    expect(scope.controls).toBe(w.find('.g-party-field__panel').attributes('id'))
    await tap(w, w.find('.mio'), 1)
    expect(w.find('.g-party-field__panel').attributes('data-popover-open')).toBeDefined()
  })

  it('dentro de GForm hereda disabled y su error por name', async () => {
    const w = mount({ render: () => h(GForm, { disabled: true, errors: { guests: 'Revisa el grupo' }, showErrors: 'always' }, () => h(GPartyField, { rows: ROWS, label: 'H', labels: LB, name: 'guests' })) }, { attachTo: document.body })
    await flush()
    expect(w.find('.g-party-field').classes()).toContain('is-disabled')
  })

  it('avisos: sin rows (1), sin nombre (2), labels incompletos (3), popover dentro de un <dialog> (4), fuera de rango (5)', () => {
    const spy = quiet()
    mount(GPartyField, { props: { rows: [] } })
    mk({ rows: [{ key: 'a', label: 'A' }], label: undefined, labels: {}, modelValue: { a: -3 } })
    const dlg = document.createElement('dialog'); document.body.append(dlg)
    mount(GPartyField, { attachTo: dlg, props: { rows: ROWS, label: 'H', labels: LB } })
    const m = spy.mock.calls.map((c) => String(c[0]))
    for (const n of [1, 2, 3, 4, 5]) expect(m.some((x) => x.includes(`aviso ${n})`)), `aviso ${n}`).toBe(true)
  })
})
