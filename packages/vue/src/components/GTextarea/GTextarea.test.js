import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import GTextarea from './GTextarea.vue'

const root = (w) => w.find('.g-textarea')
const field = (w) => w.find('textarea')

afterEach(() => vi.restoreAllMocks())

describe('GTextarea · render y clases', () => {
  it('renderiza un <textarea> nativo con las clases por defecto', () => {
    const w = mount(GTextarea, { props: { label: 'Comentario' } })
    expect(field(w).element.tagName).toBe('TEXTAREA')
    expect(root(w).classes()).toEqual(expect.arrayContaining([
      'g-textarea', 'g-textarea--variant-outline', 'g-textarea--size-md', 'g-textarea--density-default', 'g-textarea--resize-vertical'
    ]))
    expect(w.find('.g-textarea__label').attributes('for')).toBe(field(w).attributes('id'))
    expect(field(w).attributes('rows')).toBe('3')
  })

  it('las clases siguen a las props', () => {
    const w = mount(GTextarea, { props: { label: 'x', variant: 'soft', size: 'lg', density: 'compact', color: 'accent', rounded: 'lg', block: true, disabled: true, readonly: true, loading: true, error: 'Mal' } })
    expect(root(w).classes()).toEqual(expect.arrayContaining([
      'g-textarea--variant-soft', 'g-textarea--size-lg', 'g-textarea--density-compact', 'g-textarea--color-accent', 'g-textarea--rounded-lg', 'g-textarea--block', 'is-disabled', 'is-readonly', 'is-loading', 'is-invalid'
    ]))
  })

  it('cada prop enumerada tiene validador; `solid` no es una variante válida (DECISIONS.md #28)', () => {
    for (const name of ['variant', 'size', 'density', 'color', 'rounded', 'resize']) expect(GTextarea.props[name].validator('valor-invalido')).toBe(false)
    expect(GTextarea.props.variant.validator('soft')).toBe(true)
    expect(GTextarea.props.variant.validator('solid')).toBe(false)
    expect(GTextarea.props.resize.validator('horizontal')).toBe(false)
  })

  it('genera un id estable y deriva de él los de ayuda y error', () => {
    const w = mount(GTextarea, { props: { label: 'x', hint: 'a', id: 't' } })
    expect(field(w).attributes('id')).toBe('t')
    expect(w.find('.g-textarea__hint').attributes('id')).toBe('t-hint')
    expect(w.find('.g-textarea__message').attributes('id')).toBe('t-message')
    expect(field(mount(GTextarea, { props: { label: 'x' } })).attributes('id')).toMatch(/^g-textarea-/)
  })

  it('sin color ni rounded no emite esas clases', () => {
    const c = root(mount(GTextarea, { props: { label: 'x' } })).classes().join(' ')
    expect(c).not.toContain('--color-')
    expect(c).not.toContain('--rounded-')
  })
})

describe('GTextarea · modelo', () => {
  it('refleja modelValue y emite el valor escrito', async () => {
    const w = mount(GTextarea, { props: { label: 'x', modelValue: 'hola' } })
    expect(field(w).element.value).toBe('hola')
    await field(w).setValue('hola\nmundo')
    expect(w.emitted('update:modelValue')).toEqual([['hola\nmundo']])
    await w.setProps({ modelValue: 'otro' })
    expect(field(w).element.value).toBe('otro')
  })

  it('una escucha @input del consumidor ya ve el v-model actualizado (como un <textarea v-model> nativo)', async () => {
    let seen = null
    const Wrap = {
      components: { GTextarea },
      data: () => ({ v: '' }),
      methods: { onInput() { seen = this.v } },
      template: '<g-textarea v-model="v" label="x" @input="onInput"></g-textarea>'
    }
    const w = mount(Wrap)
    await w.find('textarea').setValue('abc')
    expect(seen).toBe('abc')
  })
})

describe('GTextarea · filas, autosize y tirador', () => {
  it('rows llega al <textarea>; un valor inválido avisa y se usa 1', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(field(mount(GTextarea, { props: { label: 'x', rows: 5 } })).attributes('rows')).toBe('5')
    expect(field(mount(GTextarea, { props: { label: 'x', rows: 0 } })).attributes('rows')).toBe('1')
    expect(field(mount(GTextarea, { props: { label: 'x', rows: 2.5 } })).attributes('rows')).toBe('1')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('rows'))
  })

  it('resize: vertical por defecto, none si se pide, y none siempre con autosize', () => {
    expect(root(mount(GTextarea, { props: { label: 'x' } })).classes()).toContain('g-textarea--resize-vertical')
    expect(root(mount(GTextarea, { props: { label: 'x', resize: 'none' } })).classes()).toContain('g-textarea--resize-none')
    const a = root(mount(GTextarea, { props: { label: 'x', autosize: true, resize: 'vertical' } }))
    expect(a.classes()).toContain('g-textarea--resize-none')
    expect(a.classes()).toContain('g-textarea--autosize')
  })

  it('maxRows sin autosize avisa; maxRows menor que rows avisa', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(GTextarea, { props: { label: 'x', maxRows: 4 } })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('autosize'))
    warn.mockClear()
    mount(GTextarea, { props: { label: 'x', autosize: true, rows: 4, maxRows: 2 } })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('mayor o igual'))
  })

  // jsdom no calcula diseño: se fijan el interlineado, el relleno y scrollHeight a mano.
  const prepare = (w, { scrollHeight }) => {
    const el = field(w).element
    el.style.lineHeight = '20px'
    el.style.paddingTop = '8px'
    el.style.paddingBottom = '8px'
    Object.defineProperty(el, 'scrollHeight', { configurable: true, get: () => scrollHeight.value })
    return el
  }

  it('autosize mide scrollHeight y pone --_autoh (mínimo rows, tope maxRows)', async () => {
    const scrollHeight = { value: 56 }
    const w = mount(GTextarea, { props: { label: 'x', autosize: true, rows: 2, maxRows: 4, modelValue: '' } })
    const el = prepare(w, { scrollHeight })
    await w.setProps({ modelValue: 'una línea' })
    await nextTick(); await nextTick()
    // rows 2 → 2 × 20 + 16 = 56
    expect(el.style.getPropertyValue('--_autoh')).toBe('56px')
    expect(root(w).classes()).not.toContain('is-capped')

    scrollHeight.value = 96 // 4 líneas = 4 × 20 + 16
    await w.setProps({ modelValue: 'a\nb\nc\nd' })
    await nextTick(); await nextTick()
    expect(el.style.getPropertyValue('--_autoh')).toBe('96px')
    expect(root(w).classes()).not.toContain('is-capped')

    scrollHeight.value = 176 // 8 líneas: pasa el máximo
    await w.setProps({ modelValue: 'a\nb\nc\nd\ne\nf\ng\nh' })
    await nextTick(); await nextTick()
    expect(el.style.getPropertyValue('--_autoh')).toBe('96px')
    expect(root(w).classes()).toContain('is-capped')
  })

  it('sin maxRows crece sin límite y nunca hay is-capped', async () => {
    const scrollHeight = { value: 56 }
    const w = mount(GTextarea, { props: { label: 'x', autosize: true, rows: 2, modelValue: '' } })
    const el = prepare(w, { scrollHeight })
    scrollHeight.value = 1016
    await w.setProps({ modelValue: 'x\n'.repeat(50) })
    await nextTick(); await nextTick()
    expect(el.style.getPropertyValue('--_autoh')).toBe('1016px')
    expect(root(w).classes()).not.toContain('is-capped')
  })

  it('vuelve a medir ante cualquier cambio de tamaño (ResizeObserver), no solo del ancho', async () => {
    let notify
    const RO = class { constructor(cb) { notify = cb } observe() {} disconnect() {} }
    vi.stubGlobal('ResizeObserver', RO)
    const scrollHeight = { value: 56 }
    const w = mount(GTextarea, { props: { label: 'x', autosize: true, rows: 2, modelValue: 'a' } })
    const el = prepare(w, { scrollHeight })
    await nextTick()
    // el tema cambia el interlineado (mismo ancho): el observador avisa y la altura se recalcula
    el.style.lineHeight = '36px'
    scrollHeight.value = 88 // 2 × 36 + 16
    notify([{ contentRect: { width: 300 } }])
    expect(el.style.getPropertyValue('--_autoh')).toBe('88px')
    vi.unstubAllGlobals()
  })

  it('sin autosize no hay --_autoh ni is-capped', async () => {
    const w = mount(GTextarea, { props: { label: 'x', modelValue: '' } })
    await w.setProps({ modelValue: 'a\nb\nc' })
    await nextTick()
    expect(field(w).element.style.getPropertyValue('--_autoh')).toBe('')
    expect(root(w).classes()).not.toContain('is-capped')
  })

  it('al quitar autosize se retira --_autoh', async () => {
    const scrollHeight = { value: 56 }
    const w = mount(GTextarea, { props: { label: 'x', autosize: true, modelValue: '' } })
    const el = prepare(w, { scrollHeight })
    await w.setProps({ modelValue: 'a' })
    await nextTick(); await nextTick()
    expect(el.style.getPropertyValue('--_autoh')).not.toBe('')
    await w.setProps({ autosize: false })
    await nextTick()
    expect(el.style.getPropertyValue('--_autoh')).toBe('')
  })
})

describe('GTextarea · estados', () => {
  it('disabled, readonly y required usan atributos nativos; required trae marca aria-hidden', () => {
    const w = mount(GTextarea, { props: { label: 'x', disabled: true, readonly: true, required: true } })
    expect(field(w).attributes('disabled')).toBeDefined()
    expect(field(w).attributes('readonly')).toBeDefined()
    expect(field(w).attributes('required')).toBeDefined()
    expect(w.find('.g-textarea__required').attributes('aria-hidden')).toBe('true')
  })

  it('loading: aria-busy, anillo y NO bloquea la escritura', async () => {
    const w = mount(GTextarea, { props: { label: 'x', loading: true } })
    expect(field(w).attributes('aria-busy')).toBe('true')
    expect(field(w).attributes('disabled')).toBeUndefined()
    expect(w.find('.g-textarea__loader').attributes('aria-hidden')).toBe('true')
    await field(w).setValue('sigo escribiendo')
    expect(w.emitted('update:modelValue')).toEqual([['sigo escribiendo']])
  })

  it('sin error: región viva vacía y sin aria-invalid', () => {
    const w = mount(GTextarea, { props: { label: 'x' } })
    const err = w.find('.g-textarea__message')
    expect(err.exists()).toBe(true)
    expect(err.attributes('aria-live')).toBe('polite')
    expect(err.text()).toBe('')
    expect(field(w).attributes('aria-invalid')).toBeUndefined()
    expect(field(w).attributes('aria-describedby')).toBeUndefined()
  })

  it('con error: aria-invalid, aria-describedby y texto en la región viva', () => {
    const w = mount(GTextarea, { props: { label: 'x', error: 'Muy corto', id: 't' } })
    expect(field(w).attributes('aria-invalid')).toBe('true')
    expect(field(w).attributes('aria-describedby')).toBe('t-message')
    expect(w.find('.g-textarea__message').text()).toBe('Muy corto')
  })

  it('respeta un aria-describedby del consumidor y le suma ayuda y error', () => {
    const w = mount(GTextarea, { props: { label: 'x', hint: 'a', error: 'b', id: 't' }, attrs: { 'aria-describedby': 'ext' } })
    expect(field(w).attributes('aria-describedby')).toBe('ext t-hint t-message')
  })

  it('los slots label, hint y error sustituyen a las props (el error solo con error)', async () => {
    const w = mount(GTextarea, { props: { error: 'x' }, slots: { label: '<b id="lb">Rico</b>', hint: '<i>Ayuda</i>', error: '<u>Falla</u>' } })
    expect(w.find('#lb').exists()).toBe(true)
    expect(w.find('.g-textarea__hint i').exists()).toBe(true)
    expect(w.find('.g-textarea__message u').exists()).toBe(true)
    await w.setProps({ error: undefined })
    expect(w.find('.g-textarea__message u').exists()).toBe(false)
  })
})

describe('GTextarea · contador y aviso hablado', () => {
  it('muestra n/máx (aria-hidden) solo con counter y maxlength', async () => {
    const w = mount(GTextarea, { props: { label: 'x', counter: true, modelValue: 'hola' }, attrs: { maxlength: 40 } })
    expect(w.find('.g-textarea__counter').text()).toBe('4/40')
    expect(w.find('.g-textarea__counter').attributes('aria-hidden')).toBe('true')
    await w.setProps({ modelValue: 'hola\nmundo' })
    expect(w.find('.g-textarea__counter').text()).toBe('10/40')
  })

  it('sin maxlength no hay contador y avisa en desarrollo', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(GTextarea, { props: { label: 'x', counter: true } })
    expect(w.find('.g-textarea__counter').exists()).toBe(false)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('maxlength'))
  })

  it('la región viva existe siempre (vacía) y es aria-live polite', () => {
    const w = mount(GTextarea, { props: { label: 'x' } })
    const live = w.find('.g-textarea__count-live')
    expect(live.exists()).toBe(true)
    expect(live.attributes('aria-live')).toBe('polite')
    expect(live.text()).toBe('')
  })

  it('counterText se llama SOLO al cambiar de nivel (90% y límite), no en cada tecla', async () => {
    const counterText = vi.fn((nivel, max) => (nivel === 'limit' ? `Límite: ${max}` : `Cerca: ${max}`))
    const w = mount(GTextarea, { props: { label: 'x', counter: true, counterText, modelValue: 'a'.repeat(50) }, attrs: { maxlength: 100 } })
    const live = () => w.find('.g-textarea__count-live').text()
    expect(counterText).not.toHaveBeenCalled() // el estado inicial no se anuncia
    expect(live()).toBe('')
    for (const n of [80, 89]) await w.setProps({ modelValue: 'a'.repeat(n) })
    expect(counterText).not.toHaveBeenCalled()
    await w.setProps({ modelValue: 'a'.repeat(90) })
    expect(counterText).toHaveBeenCalledTimes(1)
    expect(counterText).toHaveBeenLastCalledWith('near', 100)
    expect(live()).toBe('Cerca: 100')
    for (const n of [92, 95, 99]) await w.setProps({ modelValue: 'a'.repeat(n) })
    expect(counterText).toHaveBeenCalledTimes(1)
    await w.setProps({ modelValue: 'a'.repeat(100) })
    expect(counterText).toHaveBeenCalledTimes(2)
    expect(counterText).toHaveBeenLastCalledWith('limit', 100)
    expect(live()).toBe('Límite: 100')
    await w.setProps({ modelValue: 'a'.repeat(10) })
    expect(live()).toBe('')
    expect(counterText).toHaveBeenCalledTimes(2)
  })

  it('el 90% se redondea hacia arriba (maxlength 25 → 23)', async () => {
    const counterText = vi.fn(() => 'aviso')
    const w = mount(GTextarea, { props: { label: 'x', counterText, modelValue: '' }, attrs: { maxlength: 25 } })
    await w.setProps({ modelValue: 'a'.repeat(22) })
    expect(counterText).not.toHaveBeenCalled()
    await w.setProps({ modelValue: 'a'.repeat(23) })
    expect(counterText).toHaveBeenCalledWith('near', 25)
  })

  it('sin counterText no hay aviso hablado', async () => {
    const w = mount(GTextarea, { props: { label: 'x', counter: true, modelValue: '' }, attrs: { maxlength: 10 } })
    await w.setProps({ modelValue: 'a'.repeat(10) })
    expect(w.find('.g-textarea__count-live').text()).toBe('')
  })

  it('el aviso del contador no entra en aria-describedby', async () => {
    const w = mount(GTextarea, { props: { label: 'x', hint: 'a', counterText: () => 'x', id: 't' }, attrs: { maxlength: 10 } })
    expect(field(w).attributes('aria-describedby')).toBe('t-hint')
  })
})

describe('GTextarea · nombre accesible y atributos', () => {
  it('la etiqueta se asocia con for/id; sin label conserva el aria-label del consumidor', () => {
    const w = mount(GTextarea, { attrs: { 'aria-label': 'Notas' } })
    expect(w.find('.g-textarea__label').exists()).toBe(false)
    expect(field(w).attributes('aria-label')).toBe('Notas')
  })

  it('class y style van a la raíz; el resto de atributos, al <textarea>', () => {
    const w = mount(GTextarea, { props: { label: 'x' }, attrs: { class: 'mio', style: 'color: red', name: 'notas', placeholder: 'Escribe', maxlength: 50, 'data-x': '1' } })
    expect(root(w).classes()).toContain('mio')
    expect(root(w).attributes('style')).toContain('color')
    expect(field(w).attributes('name')).toBe('notas')
    expect(field(w).attributes('placeholder')).toBe('Escribe')
    expect(field(w).attributes('maxlength')).toBe('50')
    expect(field(w).attributes('data-x')).toBe('1')
    expect(root(w).attributes('name')).toBeUndefined()
  })

  it('las escuchas del consumidor llegan al <textarea> nativo', async () => {
    const onFocus = vi.fn()
    const w = mount(GTextarea, { props: { label: 'x' }, attrs: { onFocus } })
    await field(w).trigger('focus')
    expect(onFocus).toHaveBeenCalledTimes(1)
  })

  it('avisa en desarrollo sin nombre accesible; no avisa con label, aria-label o aria-labelledby', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(GTextarea)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('nombre accesible'))
    warn.mockClear()
    mount(GTextarea, { props: { label: 'x' } })
    mount(GTextarea, { attrs: { 'aria-label': 'x' } })
    mount(GTextarea, { attrs: { 'aria-labelledby': 'x' } })
    expect(warn).not.toHaveBeenCalled()
  })

  it('no tiene slots de prefijo, sufijo ni acción', () => {
    const w = mount(GTextarea, { props: { label: 'x' }, slots: { prepend: '<i>x</i>', append: '<i>y</i>', action: '<b>z</b>' } })
    expect(w.find('i').exists()).toBe(false)
    expect(w.find('b').exists()).toBe(false)
  })
})

describe('GTextarea · personalidad I1: is-ready (#304, #306)', () => {
  it('is-ready no está al montar y llega dos cuadros después (tras el primer pintado)', async () => {
    const w = mount(GTextarea, { props: { label: 'Comentario', error: 'Mal' }, attachTo: document.body })
    const r = () => w.find('.g-textarea')
    expect(r().classes()).not.toContain('is-ready')
    await new Promise((res) => requestAnimationFrame(() => res()))
    await nextTick()
    expect(r().classes()).not.toContain('is-ready') // un cuadro no basta
    await vi.waitFor(() => expect(r().classes()).toContain('is-ready'), { timeout: 1000 })
    w.unmount()
  })
  it('desmontado antes de los dos cuadros: no escribe nada ni falla', async () => {
    const w = mount(GTextarea, { props: { label: 'Comentario', error: 'Mal' }, attachTo: document.body })
    const el = w.find('.g-textarea').element
    w.unmount()
    await new Promise((res) => setTimeout(res, 80))
    expect(el.classList.contains('is-ready')).toBe(false)
  })
  it('en SSR (renderToString) no hay is-ready', async () => {
    const { createSSRApp, h } = await import('vue')
    const { renderToString } = await import('vue/server-renderer')
    const html = await renderToString(createSSRApp({ render: () => h(GTextarea, { label: 'Comentario', error: 'Mal' }) }))
    expect(html).toContain('g-textarea')
    expect(html).not.toContain('is-ready')
  })
})
