import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import GInput from './GInput.vue'

const root = (w) => w.find('.g-input')
const field = (w) => w.find('input')

afterEach(() => vi.restoreAllMocks())

describe('GInput · render y clases', () => {
  it('renderiza las clases por defecto y un <input type="text">', () => {
    const w = mount(GInput, { props: { label: 'Nombre' } })
    expect(root(w).classes()).toEqual(expect.arrayContaining([
      'g-input', 'g-input--variant-outline', 'g-input--size-md', 'g-input--density-default'
    ]))
    expect(root(w).classes().some((c) => c.startsWith('g-input--color-') || c.startsWith('g-input--rounded-'))).toBe(false)
    expect(field(w).attributes('type')).toBe('text')
  })

  it('las clases siguen a las props', () => {
    const w = mount(GInput, { props: { label: 'x', variant: 'soft', size: 'lg', density: 'compact', color: 'danger', rounded: 'pill', block: true, disabled: true, readonly: true, loading: true, error: 'Mal' } })
    expect(root(w).classes()).toEqual(expect.arrayContaining([
      'g-input--variant-soft', 'g-input--size-lg', 'g-input--density-compact', 'g-input--color-danger',
      'g-input--rounded-pill', 'g-input--block', 'is-disabled', 'is-readonly', 'is-loading', 'is-invalid'
    ]))
  })

  it('cada prop enumerada tiene validador que rechaza valores fuera de la lista', () => {
    for (const name of ['variant', 'size', 'density', 'color', 'rounded', 'type']) {
      expect(GInput.props[name].validator('valor-invalido')).toBe(false)
    }
    expect(GInput.props.variant.validator('soft')).toBe(true)
    // variantes que no aplican a un campo (DECISIONS.md #28)
    for (const v of ['solid', 'ghost', 'link']) expect(GInput.props.variant.validator(v)).toBe(false)
    for (const t of ['text', 'email', 'password', 'search', 'tel', 'url']) expect(GInput.props.type.validator(t)).toBe(true)
    expect(GInput.props.type.validator('number')).toBe(false)
  })
})

describe('GInput · v-model y atributos', () => {
  it('muestra modelValue y emite update:modelValue al escribir', async () => {
    const w = mount(GInput, { props: { label: 'x', modelValue: 'ana' } })
    expect(field(w).element.value).toBe('ana')
    await field(w).setValue('ana@')
    expect(w.emitted('update:modelValue')).toEqual([['ana@']])
  })

  it('class y style van a la raíz; el resto de atributos, al <input>', () => {
    const w = mount(GInput, {
      props: { label: 'x' },
      attrs: { class: 'mio', style: 'margin: 0', name: 'correo', placeholder: 'ana@…', autocomplete: 'email', maxlength: '20', 'data-x': '1' }
    })
    expect(root(w).classes()).toContain('mio')
    expect(root(w).attributes('style')).toContain('margin')
    expect(field(w).classes()).not.toContain('mio')
    const a = field(w).attributes()
    expect(a.name).toBe('correo')
    expect(a.placeholder).toBe('ana@…')
    expect(a.autocomplete).toBe('email')
    expect(a.maxlength).toBe('20')
    expect(a['data-x']).toBe('1')
    expect(root(w).attributes('name')).toBeUndefined()
  })

  it('las escuchas del consumidor llegan al <input> nativo', async () => {
    const onFocus = vi.fn()
    const onBlur = vi.fn()
    const w = mount(GInput, { props: { label: 'x' }, attrs: { onFocus, onBlur } })
    await field(w).trigger('focus')
    await field(w).trigger('blur')
    expect(onFocus).toHaveBeenCalledTimes(1)
    expect(onBlur).toHaveBeenCalledTimes(1)
  })

  it('el tipo pasa al <input>', () => {
    for (const type of ['email', 'search', 'tel', 'url']) {
      expect(field(mount(GInput, { props: { label: 'x', type } })).attributes('type')).toBe(type)
    }
  })
})

describe('GInput · etiqueta, ayuda y error', () => {
  it('la etiqueta se asocia con for/id y se puede fijar el id', () => {
    const w = mount(GInput, { props: { label: 'Correo', id: 'correo' } })
    expect(w.find('label').attributes('for')).toBe('correo')
    expect(field(w).attributes('id')).toBe('correo')
    expect(w.find('label').text()).toBe('Correo')
  })

  it('genera un id estable cuando no se da', () => {
    const w = mount(GInput, { props: { label: 'Correo' } })
    const id = field(w).attributes('id')
    expect(id).toMatch(/^g-input-/)
    expect(w.find('label').attributes('for')).toBe(id)
  })

  it('required: atributo nativo y marca visual aria-hidden', () => {
    const w = mount(GInput, { props: { label: 'Correo', required: true } })
    expect(field(w).attributes('required')).toBeDefined()
    expect(w.find('.g-input__required').attributes('aria-hidden')).toBe('true')
  })

  it('sin error: la región viva existe, vacía, y no hay aria-invalid ni referencia', () => {
    const w = mount(GInput, { props: { label: 'x', id: 'c' } })
    const region = w.find('.g-input__error')
    expect(region.exists()).toBe(true)
    expect(region.attributes('aria-live')).toBe('polite')
    expect(region.attributes('id')).toBe('c-error')
    expect(region.text()).toBe('')
    expect(field(w).attributes('aria-invalid')).toBeUndefined()
    expect(field(w).attributes('aria-describedby')).toBeUndefined()
  })

  it('con error: texto en la región viva, aria-invalid y aria-describedby', () => {
    const w = mount(GInput, { props: { label: 'x', id: 'c', error: 'Falta el dominio.' } })
    expect(w.find('.g-input__error').text()).toBe('Falta el dominio.')
    expect(field(w).attributes('aria-invalid')).toBe('true')
    expect(field(w).attributes('aria-describedby')).toBe('c-error')
  })

  it('ayuda y error se enlazan juntos en aria-describedby', () => {
    const w = mount(GInput, { props: { label: 'x', id: 'c', hint: 'Ayuda', error: 'Mal' } })
    expect(field(w).attributes('aria-describedby')).toBe('c-hint c-error')
    expect(w.find('#c-hint').text()).toBe('Ayuda')
  })

  it('respeta un aria-describedby del consumidor', () => {
    const w = mount(GInput, { props: { label: 'x', id: 'c', hint: 'Ayuda' }, attrs: { 'aria-describedby': 'ext' } })
    expect(field(w).attributes('aria-describedby')).toBe('ext c-hint')
  })

  it('los slots label, hint y error sustituyen a las props (el error solo con error)', async () => {
    const w = mount(GInput, {
      props: { id: 'c', error: 'x' },
      slots: { label: 'Etiqueta <b>rica</b>', hint: 'Ayuda rica', error: 'Error <i>rico</i>' }
    })
    expect(w.find('label').html()).toContain('<b>rica</b>')
    expect(w.find('#c-hint').text()).toBe('Ayuda rica')
    expect(w.find('.g-input__error').html()).toContain('<i>rico</i>')
    await w.setProps({ error: undefined })
    expect(w.find('.g-input__error').text()).toBe('')
  })
})

describe('GInput · estados', () => {
  it('disabled y readonly usan atributos nativos', () => {
    const d = mount(GInput, { props: { label: 'x', disabled: true } })
    expect(field(d).attributes('disabled')).toBeDefined()
    const r = mount(GInput, { props: { label: 'x', readonly: true } })
    expect(field(r).attributes('readonly')).toBeDefined()
    expect(field(r).attributes('disabled')).toBeUndefined()
  })

  it('loading: indicador y aria-busy, sin bloquear la escritura', async () => {
    const w = mount(GInput, { props: { label: 'x', loading: true } })
    expect(w.find('.g-input__loader').exists()).toBe(true)
    expect(w.find('.g-input__loader').attributes('aria-hidden')).toBe('true')
    expect(field(w).attributes('aria-busy')).toBe('true')
    expect(field(w).attributes('disabled')).toBeUndefined()
    expect(field(w).attributes('readonly')).toBeUndefined()
    await field(w).setValue('sigo escribiendo')
    expect(w.emitted('update:modelValue')).toEqual([['sigo escribiendo']])
  })

  it('sin loading no hay indicador ni aria-busy', () => {
    const w = mount(GInput, { props: { label: 'x' } })
    expect(w.find('.g-input__loader').exists()).toBe(false)
    expect(field(w).attributes('aria-busy')).toBeUndefined()
  })
})

describe('GInput · iconos y contador', () => {
  it('prepend y append se envuelven con aria-hidden', () => {
    const w = mount(GInput, { props: { label: 'x' }, slots: { prepend: '<i>a</i>', append: '<i>b</i>' } })
    expect(w.find('.g-input__prepend').attributes('aria-hidden')).toBe('true')
    expect(w.find('.g-input__append').attributes('aria-hidden')).toBe('true')
  })

  it('counter con maxlength muestra n/máx, aria-hidden', async () => {
    const w = mount(GInput, { props: { label: 'x', counter: true, modelValue: 'hola' }, attrs: { maxlength: '20' } })
    const c = w.find('.g-input__counter')
    expect(c.text()).toBe('4/20')
    expect(c.attributes('aria-hidden')).toBe('true')
    await w.setProps({ modelValue: 'hola mundo' })
    expect(w.find('.g-input__counter').text()).toBe('10/20')
  })

  it('counter sin maxlength no se muestra y avisa en desarrollo', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(GInput, { props: { label: 'x', counter: true } })
    expect(w.find('.g-input__counter').exists()).toBe(false)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('maxlength'))
  })
})

describe('GInput · contraseña', () => {
  const pw = { label: 'Contraseña', type: 'password', showPasswordLabel: 'Mostrar contraseña', hidePasswordLabel: 'Ocultar contraseña' }

  it('el botón alterna type y su texto, sin aria-pressed; sigue siendo type="button"', async () => {
    const w = mount(GInput, { props: pw })
    const btn = () => w.find('.g-input__toggle')
    expect(field(w).attributes('type')).toBe('password')
    expect(btn().attributes('type')).toBe('button')
    expect(btn().attributes('aria-pressed')).toBeUndefined()
    expect(btn().text()).toBe('Mostrar contraseña')
    expect(btn().attributes('aria-controls')).toBe(field(w).attributes('id'))
    expect(btn().attributes('aria-label')).toBeUndefined()
    await btn().trigger('click')
    expect(field(w).attributes('type')).toBe('text')
    expect(btn().attributes('aria-pressed')).toBeUndefined()
    expect(btn().text()).toBe('Ocultar contraseña')
    await btn().trigger('click')
    expect(field(w).attributes('type')).toBe('password')
  })

  it('el botón va después del <input> en el orden del documento', () => {
    const w = mount(GInput, { props: pw })
    const html = w.find('.g-input__control').html()
    expect(html.indexOf('<input')).toBeLessThan(html.indexOf('g-input__toggle'))
  })

  it('sin las dos etiquetas no hay botón y se avisa en desarrollo', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(GInput, { props: { label: 'x', type: 'password', showPasswordLabel: 'Mostrar' } })
    expect(w.find('.g-input__toggle').exists()).toBe(false)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('showPasswordLabel'))
  })

  it('en otros tipos no hay botón', () => {
    const w = mount(GInput, { props: { ...pw, type: 'text' } })
    expect(w.find('.g-input__toggle').exists()).toBe(false)
  })

  it('con disabled el botón también se deshabilita', () => {
    const w = mount(GInput, { props: { ...pw, disabled: true } })
    expect(w.find('.g-input__toggle').attributes('disabled')).toBeDefined()
  })
})

describe('GInput · nombre accesible (aviso en desarrollo)', () => {
  it('avisa sin label, slot label, aria-label ni aria-labelledby', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(GInput)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('nombre accesible'))
  })

  it('no avisa con label, aria-label o aria-labelledby', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(GInput, { props: { label: 'x' } })
    mount(GInput, { attrs: { 'aria-label': 'Buscar' } })
    mount(GInput, { attrs: { 'aria-labelledby': 'otro' } })
    expect(warn).not.toHaveBeenCalled()
  })
})
