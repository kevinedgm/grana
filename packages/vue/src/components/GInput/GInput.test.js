import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import GInput from './GInput.vue'
import GBtn from '../GBtn/GBtn.vue'

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

describe('GInput · botón de acción (slot action)', () => {
  const withAction = (props = {}) => mount(GInput, {
    props: { label: 'Correo', ...props },
    slots: { action: (scope) => h('button', { type: 'submit', class: 'mi-btn', 'data-size': scope.size, 'data-density': scope.density, disabled: scope.disabled || undefined }, 'Ir') }
  })

  it('la fila existe siempre; sin slot no hay acción ni clase', () => {
    const w = mount(GInput, { props: { label: 'x' } })
    expect(w.find('.g-input__row').exists()).toBe(true)
    expect(w.find('.g-input__row > .g-input__control').exists()).toBe(true)
    expect(w.find('.g-input__action').exists()).toBe(false)
    expect(root(w).classes()).not.toContain('g-input--has-action')
  })

  it('con el slot: envoltura después de la caja, dentro de la fila, y clase en la raíz', () => {
    const w = withAction()
    expect(root(w).classes()).toContain('g-input--has-action')
    const kids = w.find('.g-input__row').element.children
    expect(kids[0].className).toBe('g-input__control')
    expect(kids[1].className).toBe('g-input__action')
    expect(w.find('.g-input__action .mi-btn').exists()).toBe(true)
  })

  it('el slot recibe size, density y disabled del campo y los actualiza', async () => {
    const w = withAction({ size: 'lg', density: 'compact' })
    let b = w.find('.mi-btn')
    expect(b.attributes('data-size')).toBe('lg')
    expect(b.attributes('data-density')).toBe('compact')
    expect(b.attributes('disabled')).toBeUndefined()
    await w.setProps({ disabled: true, size: 'xs' })
    b = w.find('.mi-btn')
    expect(b.attributes('disabled')).toBeDefined()
    expect(b.attributes('data-size')).toBe('xs')
  })

  it('la acción NO se oculta a tecnologías de apoyo (no es decorativa)', () => {
    const w = withAction()
    expect(w.find('.g-input__action').attributes('aria-hidden')).toBeUndefined()
  })

  it('orden del documento: input, botón mostrar y luego la acción', () => {
    const w = mount(GInput, {
      props: { label: 'Clave', type: 'password', showPasswordLabel: 'Mostrar', hidePasswordLabel: 'Ocultar' },
      slots: { action: () => h('button', { class: 'mi-btn' }, 'Ir') }
    })
    const html = w.find('.g-input__row').html()
    expect(html.indexOf('<input')).toBeLessThan(html.indexOf('g-input__toggle'))
    expect(html.indexOf('g-input__toggle')).toBeLessThan(html.indexOf('mi-btn'))
  })

  it('un click en la acción no emite update:modelValue', async () => {
    const w = withAction()
    await w.find('.mi-btn').trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('el error describe al campo y no toca la acción', () => {
    const w = withAction({ id: 'c', error: 'Mal' })
    expect(w.find('input').attributes('aria-invalid')).toBe('true')
    expect(w.find('.mi-btn').attributes('aria-invalid')).toBeUndefined()
    expect(w.find('.g-input__row').text()).not.toContain('Mal')
  })

  it('integración con un GBtn real: hereda tamaño y densidad, y el submit del formulario ejecuta la acción una vez', async () => {
    const onSubmit = vi.fn((e) => e.preventDefault())
    const Wrap = {
      components: { GInput, GBtn },
      setup: () => ({ onSubmit }),
      template: `<form @submit="onSubmit"><g-input label="Correo" size="sm" density="compact"><template #action="{ size, density, disabled }"><g-btn type="submit" :size="size" :density="density" :disabled="disabled">Suscribirse</g-btn></template></g-input></form>`
    }
    const w = mount(Wrap, { attachTo: document.body })
    const btn = w.find('.g-input__action .g-btn')
    expect(btn.classes()).toEqual(expect.arrayContaining(['g-btn--size-sm', 'g-btn--density-compact']))
    expect(btn.attributes('type')).toBe('submit')
    await btn.trigger('click')
    expect(onSubmit).toHaveBeenCalledTimes(1)
    w.unmount()
  })
})

