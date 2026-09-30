import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import GCheckbox from './GCheckbox.vue'

const root = (w) => w.find('.g-checkbox')
const input = (w) => w.find('input')

afterEach(() => vi.restoreAllMocks())

describe('GCheckbox · render y clases', () => {
  it('renderiza un <input type="checkbox"> nativo con las clases por defecto', () => {
    const w = mount(GCheckbox, { props: { label: 'Acepto' } })
    expect(input(w).attributes('type')).toBe('checkbox')
    expect(root(w).classes()).toEqual(expect.arrayContaining([
      'g-checkbox', 'g-checkbox--layout-default', 'g-checkbox--size-md', 'g-checkbox--density-default', 'g-checkbox--color-brand'
    ]))
    expect(w.find('.g-checkbox__row').element.tagName).toBe('LABEL')
    expect(w.find('.g-checkbox__row').attributes('for')).toBe(input(w).attributes('id'))
  })

  it('las clases siguen a las props', () => {
    const w = mount(GCheckbox, { props: { label: 'x', layout: 'chip', size: 'lg', density: 'compact', color: 'accent', disabled: true, readonly: true, error: 'Mal' } })
    expect(root(w).classes()).toEqual(expect.arrayContaining([
      'g-checkbox--layout-chip', 'g-checkbox--size-lg', 'g-checkbox--density-compact', 'g-checkbox--color-accent', 'is-disabled', 'is-readonly', 'is-invalid'
    ]))
  })

  it('cada prop enumerada tiene validador; `variant` no existe (DECISIONS.md #36)', () => {
    for (const name of ['layout', 'size', 'density', 'color']) expect(GCheckbox.props[name].validator('valor-invalido')).toBe(false)
    expect(GCheckbox.props.layout.validator('card')).toBe(true)
    expect(GCheckbox.props.variant).toBeUndefined()
  })

  it('genera un id estable y deriva de él los de etiqueta, ayuda, dato y error', () => {
    const w = mount(GCheckbox, { props: { label: 'Acepto', id: 'c' } })
    expect(input(w).attributes('id')).toBe('c')
    expect(w.find('.g-checkbox__label').attributes('id')).toBe('c-label')
    expect(w.find('.g-checkbox__error').attributes('id')).toBe('c-error')
    expect(input(mount(GCheckbox, { props: { label: 'x' } })).attributes('id')).toMatch(/^g-checkbox-/)
  })
})

describe('GCheckbox · modelo', () => {
  it('booleano: refleja modelValue y emite true/false al alternar', async () => {
    const w = mount(GCheckbox, { props: { label: 'x', modelValue: false } })
    expect(input(w).element.checked).toBe(false)
    await input(w).setValue(true)
    expect(w.emitted('update:modelValue')).toEqual([[true]])
    await w.setProps({ modelValue: true })
    expect(input(w).element.checked).toBe(true)
    await input(w).setValue(false)
    expect(w.emitted('update:modelValue')[1]).toEqual([false])
  })

  it('con `value`, el modelo es un arreglo: agrega y quita', async () => {
    const w = mount(GCheckbox, { props: { label: 'x', value: 'a', modelValue: ['b'] } })
    expect(input(w).element.checked).toBe(false)
    await input(w).setValue(true)
    expect(w.emitted('update:modelValue')[0]).toEqual([['b', 'a']])
    await w.setProps({ modelValue: ['b', 'a'] })
    expect(input(w).element.checked).toBe(true)
    await input(w).setValue(false)
    expect(w.emitted('update:modelValue')[1]).toEqual([['b']])
  })

  it('con `value` y modelo booleano parte de un arreglo vacío', async () => {
    const w = mount(GCheckbox, { props: { label: 'x', value: 3 } })
    await input(w).setValue(true)
    expect(w.emitted('update:modelValue')[0]).toEqual([[3]])
  })

  it('el valor nativo del <input> es `value`', () => {
    expect(input(mount(GCheckbox, { props: { label: 'x', value: 'plan-a' } })).element.value).toBe('plan-a')
  })

  it('es controlada: si el consumidor no actualiza el modelo, el <input> vuelve a su estado', async () => {
    const w = mount(GCheckbox, { props: { label: 'x', modelValue: false } })
    await input(w).setValue(true)
    await nextTick()
    expect(input(w).element.checked).toBe(false)
  })
})

describe('GCheckbox · indeterminada', () => {
  it('se aplica a la PROPIEDAD del DOM (no al atributo)', async () => {
    const w = mount(GCheckbox, { props: { label: 'x', indeterminate: true } })
    expect(input(w).element.indeterminate).toBe(true)
    expect(input(w).attributes('indeterminate')).toBeUndefined()
    await w.setProps({ indeterminate: false })
    expect(input(w).element.indeterminate).toBe(false)
  })

  it('al activarla emite update:indeterminate=false y la vuelve a aplicar si el prop sigue en true', async () => {
    const w = mount(GCheckbox, { props: { label: 'x', indeterminate: true, modelValue: false } })
    await input(w).setValue(true)
    expect(w.emitted('update:indeterminate')).toEqual([[false]])
    await nextTick()
    expect(input(w).element.indeterminate).toBe(true)
  })

  it('sin indeterminate no emite update:indeterminate', async () => {
    const w = mount(GCheckbox, { props: { label: 'x' } })
    await input(w).setValue(true)
    expect(w.emitted('update:indeterminate')).toBeUndefined()
  })
})

describe('GCheckbox · estados', () => {
  it('disabled y required usan atributos nativos; required trae marca aria-hidden', () => {
    const w = mount(GCheckbox, { props: { label: 'x', disabled: true, required: true } })
    expect(input(w).attributes('disabled')).toBeDefined()
    expect(input(w).attributes('required')).toBeDefined()
    expect(w.find('.g-checkbox__required').attributes('aria-hidden')).toBe('true')
  })

  it('readonly: aria-readonly, enfocable, y el clic se cancela sin emitir', async () => {
    const w = mount(GCheckbox, { props: { label: 'x', readonly: true, modelValue: true } })
    expect(input(w).attributes('aria-readonly')).toBe('true')
    expect(input(w).attributes('disabled')).toBeUndefined()
    await input(w).trigger('click')
    expect(input(w).element.checked).toBe(true)
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('sin error: región viva vacía y sin aria-invalid', () => {
    const w = mount(GCheckbox, { props: { label: 'x', id: 'c' } })
    const region = w.find('.g-checkbox__error')
    expect(region.attributes('aria-live')).toBe('polite')
    expect(region.text()).toBe('')
    expect(input(w).attributes('aria-invalid')).toBeUndefined()
    expect(input(w).attributes('aria-describedby')).toBeUndefined()
  })

  it('con error: aria-invalid, aria-describedby y texto en la región viva (fuera del <label>)', () => {
    const w = mount(GCheckbox, { props: { label: 'x', id: 'c', hint: 'Ayuda', error: 'Obligatoria' } })
    expect(input(w).attributes('aria-invalid')).toBe('true')
    expect(input(w).attributes('aria-describedby')).toBe('c-hint c-error')
    expect(w.find('.g-checkbox__error').text()).toBe('Obligatoria')
    expect(w.find('label').text()).not.toContain('Obligatoria')
  })

  it('respeta un aria-describedby del consumidor', () => {
    const w = mount(GCheckbox, { props: { label: 'x', id: 'c', hint: 'Ayuda' }, attrs: { 'aria-describedby': 'ext' } })
    expect(input(w).attributes('aria-describedby')).toBe('ext c-hint')
  })
})

describe('GCheckbox · nombre accesible y atributos', () => {
  it('aria-labelledby apunta a la etiqueta; la ayuda queda fuera del nombre', () => {
    const w = mount(GCheckbox, { props: { label: 'Envío', hint: 'Llega mañana', id: 'c' } })
    expect(input(w).attributes('aria-labelledby')).toBe('c-label')
    expect(w.find('#c-hint').exists()).toBe(true)
  })

  it('sin label, conserva el aria-label del consumidor (no pone aria-labelledby)', () => {
    const w = mount(GCheckbox, { attrs: { 'aria-label': 'Marcar fila' } })
    expect(input(w).attributes('aria-label')).toBe('Marcar fila')
    expect(input(w).attributes('aria-labelledby')).toBeUndefined()
  })

  it('class y style van a la raíz; el resto de atributos, al <input>', () => {
    const w = mount(GCheckbox, { props: { label: 'x' }, attrs: { class: 'mio', style: 'margin: 0', name: 'plan', 'data-x': '1' } })
    expect(root(w).classes()).toContain('mio')
    expect(root(w).attributes('style')).toContain('margin')
    expect(input(w).attributes('name')).toBe('plan')
    expect(input(w).attributes('data-x')).toBe('1')
    expect(root(w).attributes('name')).toBeUndefined()
  })

  it('las escuchas del consumidor llegan al <input> nativo', async () => {
    const onFocus = vi.fn()
    const w = mount(GCheckbox, { props: { label: 'x' }, attrs: { onFocus } })
    await input(w).trigger('focus')
    expect(onFocus).toHaveBeenCalledTimes(1)
  })

  it('avisa en desarrollo sin nombre accesible; no avisa con label, aria-label o aria-labelledby', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(GCheckbox)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('nombre accesible'))
    warn.mockClear()
    mount(GCheckbox, { props: { label: 'x' } })
    mount(GCheckbox, { attrs: { 'aria-label': 'x' } })
    mount(GCheckbox, { attrs: { 'aria-labelledby': 'x' } })
    expect(warn).not.toHaveBeenCalled()
  })
})

describe('GCheckbox · estructura tarjeta', () => {
  const slots = { icon: '<i class="mi-icono">i</i>', meta: '$99' }

  it('icon (aria-hidden) y meta solo existen en layout="card"', () => {
    const card = mount(GCheckbox, { props: { label: 'Express', layout: 'card', id: 'c' }, slots })
    expect(card.find('.g-checkbox__icon').attributes('aria-hidden')).toBe('true')
    expect(card.find('.g-checkbox__meta').text()).toBe('$99')
    expect(card.find('.g-checkbox__meta').attributes('aria-hidden')).toBeUndefined()
    const plain = mount(GCheckbox, { props: { label: 'Express' }, slots })
    expect(plain.find('.g-checkbox__icon').exists()).toBe(false)
    expect(plain.find('.g-checkbox__meta').exists()).toBe(false)
  })

  it('en la tarjeta el dato destacado forma parte del nombre; la descripción, de la descripción', () => {
    const w = mount(GCheckbox, { props: { label: 'Express', hint: '24 horas', layout: 'card', id: 'c' }, slots })
    expect(input(w).attributes('aria-labelledby')).toBe('c-label c-meta')
    expect(input(w).attributes('aria-describedby')).toBe('c-hint')
  })

  it('los slots label, hint y error sustituyen a las props (el error solo con error)', async () => {
    const w = mount(GCheckbox, { props: { id: 'c', error: 'x' }, slots: { label: 'Etiqueta <b>rica</b>', hint: 'Ayuda rica', error: 'Error <i>rico</i>' } })
    expect(w.find('.g-checkbox__label').html()).toContain('<b>rica</b>')
    expect(w.find('#c-hint').text()).toBe('Ayuda rica')
    expect(w.find('.g-checkbox__error').html()).toContain('<i>rico</i>')
    await w.setProps({ error: undefined })
    expect(w.find('.g-checkbox__error').text()).toBe('')
  })
})

describe('GCheckbox · orden de las escuchas', () => {
  it('una escucha @change del consumidor ya ve el v-model actualizado (como un <input v-model> nativo)', async () => {
    let seen = null
    const Wrap = {
      components: { GCheckbox },
      data: () => ({ v: false }),
      methods: { onChange() { seen = this.v } },
      template: '<g-checkbox v-model="v" label="x" @change="onChange"></g-checkbox>'
    }
    const w = mount(Wrap)
    await w.find('input').setValue(true)
    expect(seen).toBe(true)
    await w.find('input').setValue(false)
    expect(seen).toBe(false)
  })
})

