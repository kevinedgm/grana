import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import GBadge from './GBadge.vue'

afterEach(() => vi.restoreAllMocks())

const badge = (w) => w.find('.g-badge')
const mk = (props = {}, slots = {}, opts = {}) => mount(GBadge, { props, slots, ...opts })

describe('GBadge · render y clases', () => {
  it('una insignia de texto es un <span> con las clases por defecto', () => {
    const w = mk({}, { default: 'Activo' })
    expect(badge(w).element.tagName).toBe('SPAN')
    expect(badge(w).classes()).toEqual(expect.arrayContaining(['g-badge', 'g-badge--variant-soft', 'g-badge--color-neutral', 'g-badge--size-md', 'g-badge--kind-text']))
    expect(w.find('.g-badge__text').text()).toBe('Activo')
  })

  it('las clases siguen a las props', () => {
    const w = mk({ variant: 'glass', color: 'danger', size: 'lg' }, { default: 'x' })
    expect(badge(w).classes()).toEqual(expect.arrayContaining(['g-badge--variant-glass', 'g-badge--color-danger', 'g-badge--size-lg']))
  })

  it('cada prop enumerada tiene validador; ghost y link no son variantes de una insignia', () => {
    for (const n of ['variant', 'color', 'size', 'shape', 'placement']) expect(GBadge.props[n].validator('valor-invalido')).toBe(false)
    expect(GBadge.props.variant.validator('glass')).toBe(true)
    expect(GBadge.props.variant.validator('ghost')).toBe(false)
    expect(GBadge.props.size.validator('xl')).toBe(false)
    expect(GBadge.props.dot).toBeUndefined()
  })

  it('no es interactiva: sin tabindex, sin rol y sin eventos declarados', () => {
    const w = mk({}, { default: 'x' })
    expect(badge(w).attributes('tabindex')).toBeUndefined()
    expect(badge(w).attributes('role')).toBeUndefined()
    expect(GBadge.emits).toBeUndefined()
  })
})

describe('GBadge · modos', () => {
  it('texto con figura (punto) y con icono, en ese orden', () => {
    const w = mk({ shape: 'circle' }, { default: 'Activo', icon: () => h('i', 'I') })
    const kids = [...badge(w).element.children].map((c) => (c.getAttribute('class') ?? '').split(' ').find((x) => x.startsWith('g-badge__')))
    expect(kids).toEqual(['g-badge__shape', 'g-badge__icon', 'g-badge__text'])
    expect(w.find('.g-badge__shape').classes()).toContain('g-badge__shape--circle')
    expect(w.find('.g-badge__shape').attributes('aria-hidden')).toBe('true')
    expect(w.find('svg.g-badge__shape').attributes('fill')).toBe('currentColor')
    expect(w.find('.g-badge__icon').attributes('aria-hidden')).toBe('true')
  })

  it('solo icono: modo icon, icono decorativo y nombre por label', () => {
    const w = mk({ label: 'Notificaciones' }, { icon: () => h('i', 'I') })
    expect(badge(w).classes()).toContain('g-badge--kind-icon')
    expect(w.find('.g-badge__icon').exists()).toBe(true)
    expect(w.find('.g-badge__sr').text()).toBe('Notificaciones')
    expect(w.find('.g-badge__text').exists()).toBe(false)
  })

  it('solo figura: modo figure, figura decorativa y nombre por label', () => {
    const w = mk({ shape: 'triangle', label: 'Error' })
    expect(badge(w).classes()).toContain('g-badge--kind-figure')
    expect(w.find('.g-badge__shape--triangle').attributes('aria-hidden')).toBe('true')
    expect(w.find('.g-badge__sr').text()).toBe('Error')
  })

  it('contador: modo count con tope (99+) y el texto visible oculto a lectores', () => {
    const w = mk({ count: 100, label: '100 mensajes sin leer' })
    expect(badge(w).classes()).toContain('g-badge--kind-count')
    expect(w.find('.g-badge__text').text()).toBe('99+')
    expect(w.find('.g-badge__text').attributes('aria-hidden')).toBe('true')
    expect(w.find('.g-badge__sr').text()).toBe('100 mensajes sin leer')
  })

  it('el tope es configurable y 99 no lleva +', () => {
    expect(mk({ count: 99, label: 'x' }).find('.g-badge__text').text()).toBe('99')
    expect(mk({ count: 15, max: 9, label: 'x' }).find('.g-badge__text').text()).toBe('9+')
    expect(mk({ count: 9, max: 9, label: 'x' }).find('.g-badge__text').text()).toBe('9')
  })

  it('contador en cero no se renderiza salvo showZero', () => {
    expect(mk({ count: 0, label: 'x' }).find('.g-badge').exists()).toBe(false)
    const w = mk({ count: 0, label: 'Sin mensajes', showZero: true })
    expect(badge(w).exists()).toBe(true)
    expect(w.find('.g-badge__text').text()).toBe('0')
  })

  it('precedencia: count > texto > figura > icono', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const a = mk({ count: 5, shape: 'circle', label: 'x' }, { default: 'Texto', icon: () => h('i', 'I') })
    expect(badge(a).classes()).toContain('g-badge--kind-count')
    expect(a.find('.g-badge__shape').exists()).toBe(false)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('ignora el slot'))
    const b = mk({ shape: 'circle' }, { default: 'Texto' })
    expect(badge(b).classes()).toContain('g-badge--kind-text')
    const c = mk({ shape: 'square', label: 'x' }, { icon: () => h('i', 'I') })
    expect(badge(c).classes()).toContain('g-badge--kind-figure')
  })

  it('sin contenido no se renderiza y avisa', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mk()
    expect(w.find('.g-badge').exists()).toBe(false)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('no tiene contenido'))
  })

  it('un slot que devuelve solo un comentario o vacío no cuenta como contenido', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mk({}, { default: () => [], icon: () => [] })
    expect(w.find('.g-badge').exists()).toBe(false)
  })
})

describe('GBadge · nombre accesible', () => {
  it('con texto visible y sin label, el texto se lee tal cual', () => {
    const w = mk({}, { default: 'Activo' })
    expect(w.find('.g-badge__text').attributes('aria-hidden')).toBeUndefined()
    expect(w.find('.g-badge__sr').exists()).toBe(false)
  })

  it('con texto visible y label, el label se lee EN LUGAR del texto (sin duplicar)', () => {
    const w = mk({ label: 'Estado: activo' }, { default: 'Activo' })
    expect(w.find('.g-badge__text').attributes('aria-hidden')).toBe('true')
    expect(w.find('.g-badge__sr').text()).toBe('Estado: activo')
  })

  it('sin texto visible y sin label avisa; un contador sin label deja visible su número para lectores', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mk({ count: 12 })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('necesita `label`'))
    expect(w.find('.g-badge__text').attributes('aria-hidden')).toBeUndefined()
    warn.mockClear()
    mk({ shape: 'circle' })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('necesita `label`'))
    warn.mockClear()
    mk({ shape: 'circle', label: 'Ok' })
    mk({}, { default: 'Texto' })
    expect(warn).not.toHaveBeenCalled()
  })
})

describe('GBadge · anclada', () => {
  it('con el slot anchor, la raíz es el envoltorio y la insignia va DESPUÉS del destino', () => {
    const w = mk({ count: 3, label: '3 sin leer' }, { anchor: '<button id="t">Bandeja</button>' })
    const root = w.find('.g-badge-anchor')
    expect(root.exists()).toBe(true)
    expect(root.classes()).toContain('g-badge-anchor--top-end')
    const kids = [...root.element.children]
    expect(kids[0].id).toBe('t')
    expect(kids[1].classList.contains('g-badge')).toBe(true)
  })

  it('placement cambia la clase del envoltorio', () => {
    const w = mk({ count: 3, label: 'x', placement: 'bottom-start' }, { anchor: '<b>x</b>' })
    expect(w.find('.g-badge-anchor').classes()).toContain('g-badge-anchor--bottom-start')
  })

  it('contador en cero anclado: solo queda el destino', () => {
    const w = mk({ count: 0, label: 'x' }, { anchor: '<b id="t">x</b>' })
    expect(w.find('.g-badge-anchor').exists()).toBe(true)
    expect(w.find('#t').exists()).toBe(true)
    expect(w.find('.g-badge').exists()).toBe(false)
  })

  it('placement sin anchor avisa', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mk({ placement: 'top-start' }, { default: 'x' })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('solo actúa con el slot'))
  })
})

describe('GBadge · atributos y avisos', () => {
  it('class, style, data-* y role van a la raíz (la insignia)', () => {
    const w = mk({}, { default: 'x' }, { attrs: { class: 'mio', style: 'color: red', 'data-x': '1', role: 'status' } })
    expect(badge(w).classes()).toContain('mio')
    expect(badge(w).attributes('data-x')).toBe('1')
    expect(badge(w).attributes('role')).toBe('status')
    expect(badge(w).attributes('style')).toContain('color')
  })

  it('con anchor, los atributos van al envoltorio', () => {
    const w = mk({ count: 1, label: 'x' }, { anchor: '<b>x</b>' }, { attrs: { class: 'mio', 'data-x': '1' } })
    expect(w.find('.g-badge-anchor').classes()).toContain('mio')
    expect(w.find('.g-badge-anchor').attributes('data-x')).toBe('1')
    expect(w.find('.g-badge').classes()).not.toContain('mio')
  })

  it('count inválido y max inválido avisan', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mk({ count: -2, label: 'x' })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('entero mayor o igual que 0'))
    warn.mockClear()
    mk({ count: 2, max: 0, label: 'x' })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('max'))
  })

  it('reacciona: al subir el contador cambia el texto y al llegar a cero desaparece', async () => {
    const w = mk({ count: 98, label: 'x' })
    expect(w.find('.g-badge__text').text()).toBe('98')
    await w.setProps({ count: 120 })
    expect(w.find('.g-badge__text').text()).toBe('99+')
    await w.setProps({ count: 0 })
    expect(w.find('.g-badge').exists()).toBe(false)
  })
})
