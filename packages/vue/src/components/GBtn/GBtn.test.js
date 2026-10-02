import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import GBtn from './GBtn.vue'

const root = (wrapper) => wrapper.find('.g-btn')

afterEach(() => vi.restoreAllMocks())

describe('GBtn · render y clases', () => {
  it('renderiza <button type="button"> con las clases por defecto', () => {
    const w = mount(GBtn, { slots: { default: 'Guardar' } })
    const el = root(w)
    expect(el.element.tagName).toBe('BUTTON')
    expect(el.attributes('type')).toBe('button')
    expect(el.classes()).toEqual(expect.arrayContaining([
      'g-btn', 'g-btn--color-brand', 'g-btn--variant-solid', 'g-btn--size-md', 'g-btn--density-default'
    ]))
    expect(el.classes().some((c) => c.startsWith('g-btn--rounded-'))).toBe(false)
    expect(el.find('.g-btn__label').text()).toBe('Guardar')
  })

  it('las clases siguen a las props', async () => {
    const w = mount(GBtn, { props: { color: 'danger', variant: 'outline', size: 'lg', density: 'compact', rounded: 'pill', block: true } })
    expect(root(w).classes()).toEqual(expect.arrayContaining([
      'g-btn--color-danger', 'g-btn--variant-outline', 'g-btn--size-lg', 'g-btn--density-compact', 'g-btn--rounded-pill', 'g-btn--block'
    ]))
  })

  it('cada prop enumerada tiene validador que rechaza valores fuera de la lista', () => {
    for (const name of ['color', 'variant', 'size', 'density', 'rounded', 'type']) {
      expect(GBtn.props[name].validator('valor-invalido')).toBe(false)
    }
    expect(GBtn.props.color.validator('accent')).toBe(true)
  })
})

describe('GBtn · activación', () => {
  it('emite click al activarse', async () => {
    const w = mount(GBtn)
    await root(w).trigger('click')
    expect(w.emitted('click')).toHaveLength(1)
  })

  it('disabled: atributo nativo y sin click', async () => {
    const w = mount(GBtn, { props: { disabled: true } })
    expect(root(w).attributes('disabled')).toBeDefined()
    expect(root(w).classes()).toContain('is-disabled')
    await root(w).trigger('click')
    expect(w.emitted('click')).toBeUndefined()
  })

  it('sin loading respeta el aria-disabled del consumidor (enfocable, sin disabled nativo)', () => {
    const w = mount(GBtn, { attrs: { 'aria-disabled': 'true' }, slots: { default: 'Dictar' } })
    const el = w.find('button')
    expect(el.attributes('aria-disabled')).toBe('true')
    expect(el.attributes('disabled')).toBeUndefined()
  })

  it('loading: aria-disabled y aria-busy, SIN disabled nativo, y sin click', async () => {
    const w = mount(GBtn, { props: { loading: true } })
    const el = root(w)
    expect(el.attributes('disabled')).toBeUndefined()
    expect(el.attributes('aria-disabled')).toBe('true')
    expect(el.attributes('aria-busy')).toBe('true')
    await el.trigger('click')
    expect(w.emitted('click')).toBeUndefined()
  })

  it('loading con type="submit": cancela el envío del formulario', () => {
    const w = mount(GBtn, { props: { loading: true, type: 'submit' } })
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    root(w).element.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
  })

  it('el @click del consumidor no llega al elemento nativo durante loading', async () => {
    const onClick = vi.fn()
    const w = mount(GBtn, { props: { loading: true }, attrs: { onClick } })
    await root(w).trigger('click')
    expect(onClick).not.toHaveBeenCalled()
  })
})

describe('GBtn · enlace', () => {
  it('con href renderiza <a href> sin type', () => {
    const w = mount(GBtn, { props: { href: '/reservas' } })
    const el = root(w)
    expect(el.element.tagName).toBe('A')
    expect(el.attributes('href')).toBe('/reservas')
    expect(el.attributes('type')).toBeUndefined()
  })

  it('href + disabled: sin href, aria-disabled, fuera del tabulado y con rol link', () => {
    const w = mount(GBtn, { props: { href: '/reservas', disabled: true } })
    const el = root(w)
    expect(el.attributes('href')).toBeUndefined()
    expect(el.attributes('aria-disabled')).toBe('true')
    expect(el.attributes('tabindex')).toBe('-1')
    expect(el.attributes('role')).toBe('link')
  })
})

describe('GBtn · anuncio de carga (loadingText, #257)', () => {
  it('con loadingText la región de estado existe, fuera del botón, y solo se llena al cargar', async () => {
    const w = mount(GBtn, { props: { loadingText: 'Guardando…' } })
    const status = w.find('.g-btn__status')
    expect(status.exists()).toBe(true)
    expect(status.attributes('role')).toBe('status')
    expect(root(w).element.contains(status.element)).toBe(false)
    expect(status.text()).toBe('')
    await w.setProps({ loading: true })
    expect(status.text()).toBe('Guardando…')
    await w.setProps({ loading: false })
    expect(status.text()).toBe('')
  })

  it('sin loadingText no hay región de estado, cargue o no', async () => {
    const w = mount(GBtn, { props: { loading: true } })
    expect(w.find('.g-btn__status').exists()).toBe(false)
    expect(w.find('[role="status"]').exists()).toBe(false)
    await w.setProps({ loading: false })
    expect(w.find('.g-btn__status').exists()).toBe(false)
  })

  it('loadingText y loading en el mismo cambio: la región se monta vacía y el texto llega en el ciclo siguiente', async () => {
    vi.useFakeTimers()
    try {
      const w = mount(GBtn)
      expect(w.find('.g-btn__status').exists()).toBe(false)
      await w.setProps({ loading: true, loadingText: 'Guardando…' })
      const status = w.find('.g-btn__status')
      expect(status.exists()).toBe(true)
      expect(status.text()).toBe('')
      vi.advanceTimersByTime(60)
      await w.vm.$nextTick()
      expect(w.find('.g-btn__status').text()).toBe('Guardando…')
    } finally {
      vi.useRealTimers()
    }
  })

  it('montado con loading y loadingText: región vacía al montar y texto después', async () => {
    vi.useFakeTimers()
    try {
      const w = mount(GBtn, { props: { loading: true, loadingText: 'Enviando…' } })
      expect(w.find('.g-btn__status').text()).toBe('')
      vi.advanceTimersByTime(60)
      await w.vm.$nextTick()
      expect(w.find('.g-btn__status').text()).toBe('Enviando…')
      await w.setProps({ loading: false })
      expect(w.find('.g-btn__status').text()).toBe('')
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('GBtn · atributos, slots y accesibilidad', () => {
  it('los atributos del consumidor van al botón, no a la región de estado', () => {
    const w = mount(GBtn, { attrs: { id: 'guardar', 'data-test': 'x', class: 'mi-clase' } })
    const el = root(w)
    expect(el.attributes('id')).toBe('guardar')
    expect(el.attributes('data-test')).toBe('x')
    expect(el.classes()).toContain('mi-clase')
    const w2 = mount(GBtn, { props: { loadingText: 'Guardando…' }, attrs: { id: 'guardar' } })
    expect(w2.find('.g-btn__status').attributes('id')).toBeUndefined()
  })

  it('el consumidor no puede anular los atributos controlados', () => {
    const w = mount(GBtn, { props: { loading: true }, attrs: { 'aria-busy': 'false' } })
    expect(root(w).attributes('aria-busy')).toBe('true')
  })

  it('prepend y append se envuelven como decorativos', () => {
    const w = mount(GBtn, { slots: { default: 'Guardar', prepend: '<svg />', append: '<svg />' } })
    expect(w.find('.g-btn__prepend').attributes('aria-hidden')).toBe('true')
    expect(w.find('.g-btn__append').attributes('aria-hidden')).toBe('true')
  })

  it('sin slots prepend/append no renderiza sus envolturas', () => {
    const w = mount(GBtn, { slots: { default: 'Guardar' } })
    expect(w.find('.g-btn__prepend').exists()).toBe(false)
    expect(w.find('.g-btn__append').exists()).toBe(false)
  })

  it('icon sin aria-label avisa en desarrollo', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(GBtn, { props: { icon: true } })
    expect(warn).toHaveBeenCalledOnce()
  })

  it('icon con aria-label no avisa', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(GBtn, { props: { icon: true }, attrs: { 'aria-label': 'Eliminar' } })
    expect(warn).not.toHaveBeenCalled()
  })
})
