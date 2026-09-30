import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import GSwitch from './GSwitch.vue'

const root = (w) => w.find('.g-switch')
const input = (w) => w.find('input')

afterEach(() => vi.restoreAllMocks())

describe('GSwitch · render y clases', () => {
  it('renderiza un <input type="checkbox" role="switch"> nativo con las clases por defecto', () => {
    const w = mount(GSwitch, { props: { label: 'Avisos' } })
    expect(input(w).attributes('type')).toBe('checkbox')
    expect(input(w).attributes('role')).toBe('switch')
    expect(root(w).classes()).toEqual(expect.arrayContaining([
      'g-switch', 'g-switch--size-md', 'g-switch--density-default', 'g-switch--color-brand', 'g-switch--label-end'
    ]))
    expect(w.find('.g-switch__row').element.tagName).toBe('LABEL')
    expect(w.find('.g-switch__row').attributes('for')).toBe(input(w).attributes('id'))
  })

  it('el <input> va dentro de g-switch__control, antes de los iconos', () => {
    const w = mount(GSwitch, { props: { label: 'x' }, slots: { 'icon-on': '✓', 'icon-off': '✕' } })
    const control = w.find('.g-switch__control').element
    expect(control.firstElementChild.tagName).toBe('INPUT')
    expect([...control.children].map((c) => c.getAttribute('class'))).toEqual([
      'g-switch__input',
      'g-icon g-switch__mark g-switch__mark--off', 'g-icon g-switch__mark g-switch__mark--on', 'g-icon g-switch__mark g-switch__mark--busy',
      'g-switch__icon g-switch__icon--on', 'g-switch__icon g-switch__icon--off'
    ])
  })

  it('las marcas del riel son iconos de Lucide decorativos (minus, check y loader-circle)', () => {
    const w = mount(GSwitch, { props: { label: 'x' } })
    const marks = w.findAll('.g-switch__control svg.g-switch__mark')
    expect(marks).toHaveLength(3)
    for (const m of marks) expect(m.attributes('aria-hidden')).toBe('true')
    expect(marks[0].html()).toContain('M5 12h14')
    expect(marks[1].html()).toContain('M20 6 9 17l-5-5')
  })

  it('las clases siguen a las props', () => {
    const w = mount(GSwitch, { props: { label: 'x', size: 'lg', density: 'compact', color: 'accent', labelPosition: 'start', disabled: true, readonly: true, loading: true, error: 'Mal' } })
    expect(root(w).classes()).toEqual(expect.arrayContaining([
      'g-switch--size-lg', 'g-switch--density-compact', 'g-switch--color-accent', 'g-switch--label-start', 'is-disabled', 'is-readonly', 'is-loading', 'is-invalid'
    ]))
  })

  it('cada prop enumerada tiene validador; `variant` y `required` no existen (DECISIONS.md #47)', () => {
    for (const name of ['labelPosition', 'size', 'density', 'color']) expect(GSwitch.props[name].validator('valor-invalido')).toBe(false)
    expect(GSwitch.props.labelPosition.validator('start')).toBe(true)
    expect(GSwitch.props.variant).toBeUndefined()
    expect(GSwitch.props.required).toBeUndefined()
  })

  it('genera un id estable y deriva de él los de etiqueta, ayuda y error', () => {
    const w = mount(GSwitch, { props: { label: 'x', hint: 'a', id: 's' } })
    expect(input(w).attributes('id')).toBe('s')
    expect(w.find('.g-switch__label').attributes('id')).toBe('s-label')
    expect(w.find('.g-switch__hint').attributes('id')).toBe('s-hint')
    expect(w.find('.g-switch__error').attributes('id')).toBe('s-error')
    expect(input(mount(GSwitch, { props: { label: 'x' } })).attributes('id')).toMatch(/^g-switch-/)
  })

  it('g-switch--icons solo con un slot de icono; los iconos son aria-hidden', () => {
    expect(root(mount(GSwitch, { props: { label: 'x' } })).classes()).not.toContain('g-switch--icons')
    const w = mount(GSwitch, { props: { label: 'x' }, slots: { 'icon-on': '✓' } })
    expect(root(w).classes()).toContain('g-switch--icons')
    expect(w.find('.g-switch__icon--on').attributes('aria-hidden')).toBe('true')
    expect(w.find('.g-switch__icon--off').exists()).toBe(false)
  })
})

describe('GSwitch · modelo', () => {
  it('refleja modelValue y emite true/false al alternar', async () => {
    const w = mount(GSwitch, { props: { label: 'x', modelValue: false } })
    expect(input(w).element.checked).toBe(false)
    await input(w).setValue(true)
    expect(w.emitted('update:modelValue')).toEqual([[true]])
    await w.setProps({ modelValue: true })
    expect(input(w).element.checked).toBe(true)
    await input(w).setValue(false)
    expect(w.emitted('update:modelValue')[1]).toEqual([false])
  })

  it('es controlado: si el consumidor no actualiza el modelo, el <input> vuelve a su estado', async () => {
    const w = mount(GSwitch, { props: { label: 'x', modelValue: false } })
    await input(w).setValue(true)
    await nextTick()
    expect(input(w).element.checked).toBe(false)
  })

  it('el clic en la etiqueta alterna el interruptor', async () => {
    const w = mount(GSwitch, { attachTo: document.body, props: { label: 'Avisos', modelValue: false } })
    w.find('.g-switch__label').element.click()
    expect(w.emitted('update:modelValue')).toEqual([[true]])
    w.unmount()
  })
})

describe('GSwitch · estados', () => {
  it('disabled usa el atributo nativo y no emite', async () => {
    const w = mount(GSwitch, { props: { label: 'x', disabled: true } })
    expect(input(w).attributes('disabled')).toBeDefined()
  })

  it('readonly: aria-readonly, enfocable, y el clic se cancela sin emitir', async () => {
    const w = mount(GSwitch, { props: { label: 'x', readonly: true, modelValue: true } })
    expect(input(w).attributes('aria-readonly')).toBe('true')
    expect(input(w).attributes('disabled')).toBeUndefined()
    await input(w).trigger('click')
    expect(input(w).element.checked).toBe(true)
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('loading: aria-busy y NO bloquea (el cambio se emite igual)', async () => {
    const w = mount(GSwitch, { props: { label: 'x', loading: true, modelValue: false } })
    expect(input(w).attributes('aria-busy')).toBe('true')
    expect(input(w).attributes('disabled')).toBeUndefined()
    await input(w).setValue(true)
    expect(w.emitted('update:modelValue')).toEqual([[true]])
  })

  it('sin loading no hay aria-busy', () => {
    expect(input(mount(GSwitch, { props: { label: 'x' } })).attributes('aria-busy')).toBeUndefined()
  })

  it('sin error: región viva vacía y sin aria-invalid', () => {
    const w = mount(GSwitch, { props: { label: 'x' } })
    const err = w.find('.g-switch__error')
    expect(err.exists()).toBe(true)
    expect(err.attributes('aria-live')).toBe('polite')
    expect(err.text()).toBe('')
    expect(input(w).attributes('aria-invalid')).toBeUndefined()
    expect(input(w).attributes('aria-describedby')).toBeUndefined()
  })

  it('con error: aria-invalid, aria-describedby y texto en la región viva (fuera del <label>)', () => {
    const w = mount(GSwitch, { props: { label: 'x', error: 'Actívalo', id: 's' } })
    expect(input(w).attributes('aria-invalid')).toBe('true')
    expect(input(w).attributes('aria-describedby')).toBe('s-error')
    expect(w.find('.g-switch__error').text()).toBe('Actívalo')
    expect(w.find('.g-switch__row').find('.g-switch__error').exists()).toBe(false)
  })

  it('respeta un aria-describedby del consumidor y le suma ayuda y error', () => {
    const w = mount(GSwitch, { props: { label: 'x', hint: 'a', error: 'b', id: 's' }, attrs: { 'aria-describedby': 'ext' } })
    expect(input(w).attributes('aria-describedby')).toBe('ext s-hint s-error')
  })

  it('los slots label, hint y error sustituyen a las props (el error solo con error)', async () => {
    const w = mount(GSwitch, { props: { error: 'x' }, slots: { label: '<b id="lb">Rico</b>', hint: '<i>Ayuda</i>', error: '<u>Falla</u>' } })
    expect(w.find('#lb').exists()).toBe(true)
    expect(w.find('.g-switch__hint i').exists()).toBe(true)
    expect(w.find('.g-switch__error u').exists()).toBe(true)
    await w.setProps({ error: undefined })
    expect(w.find('.g-switch__error u').exists()).toBe(false)
  })
})

describe('GSwitch · nombre accesible y atributos', () => {
  it('aria-labelledby apunta a la etiqueta; la ayuda queda fuera del nombre', () => {
    const w = mount(GSwitch, { props: { label: 'x', hint: 'a', id: 's' } })
    expect(input(w).attributes('aria-labelledby')).toBe('s-label')
  })

  it('sin label, conserva el aria-label del consumidor (no pone aria-labelledby)', () => {
    const w = mount(GSwitch, { attrs: { 'aria-label': 'Modo avión' } })
    expect(input(w).attributes('aria-label')).toBe('Modo avión')
    expect(input(w).attributes('aria-labelledby')).toBeUndefined()
  })

  it('class y style van a la raíz; el resto de atributos, al <input>', () => {
    const w = mount(GSwitch, { props: { label: 'x' }, attrs: { class: 'mio', style: 'color: red', name: 'avisos', 'data-x': '1' } })
    expect(root(w).classes()).toContain('mio')
    expect(root(w).attributes('style')).toContain('color')
    expect(input(w).attributes('name')).toBe('avisos')
    expect(input(w).attributes('data-x')).toBe('1')
    expect(root(w).attributes('name')).toBeUndefined()
  })

  it('las escuchas del consumidor llegan al <input> nativo', async () => {
    const onFocus = vi.fn()
    const w = mount(GSwitch, { props: { label: 'x' }, attrs: { onFocus } })
    await input(w).trigger('focus')
    expect(onFocus).toHaveBeenCalledTimes(1)
  })

  it('el rol lo controla el componente (siempre switch)', () => {
    const w = mount(GSwitch, { props: { label: 'x' }, attrs: { role: 'checkbox' } })
    expect(input(w).attributes('role')).toBe('switch')
  })

  it('avisa en desarrollo sin nombre accesible; no avisa con label, aria-label o aria-labelledby', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(GSwitch)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('nombre accesible'))
    warn.mockClear()
    mount(GSwitch, { props: { label: 'x' } })
    mount(GSwitch, { attrs: { 'aria-label': 'x' } })
    mount(GSwitch, { attrs: { 'aria-labelledby': 'x' } })
    expect(warn).not.toHaveBeenCalled()
  })
})

describe('GSwitch · orden de las escuchas', () => {
  it('una escucha @change del consumidor ya ve el v-model actualizado (como un <input v-model> nativo)', async () => {
    let seen = null
    const Wrap = {
      components: { GSwitch },
      data: () => ({ v: false }),
      methods: { onChange() { seen = this.v } },
      template: '<g-switch v-model="v" label="x" @change="onChange"></g-switch>'
    }
    const w = mount(Wrap)
    await w.find('input').setValue(true)
    expect(seen).toBe(true)
    await w.find('input').setValue(false)
    expect(seen).toBe(false)
  })
})
