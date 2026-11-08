// GPageIndex (page-index.md): modelo y avisos, aria-current="location", navigate con la guarda de #505, foco al destino,
// pila de ancho, relevo en fases (#1047) y línea de lectura (api.md «Lugar actual», #1039)
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import GPageIndex from './GPageIndex.vue'

const ITEMS = [{ id: 'uso', label: 'Ejemplos' }, { id: 'api', label: 'API' }, { id: 'teclado', label: 'Teclado y foco', extra: 7 }]
const tick = async (n = 3) => { for (let i = 0; i < n; i++) await nextTick() }
const flushRaf = () => new Promise((r) => setTimeout(r, 40))
let page
const sections = (tops) => {
  page = document.createElement('main')
  ITEMS.forEach((it, i) => {
    const h = document.createElement('h2')
    h.id = it.id
    h.textContent = it.label
    h.getBoundingClientRect = () => ({ top: tops[i], bottom: tops[i] + 30, left: 0, right: 100, width: 100, height: 30 })
    page.append(h)
  })
  document.body.append(page)
}
const mk = (props = {}) => mount(GPageIndex, { attachTo: document.body, props: { items: ITEMS, label: 'En esta página', ...props } })
const openMenu = async (w) => { await w.find('.g-page-index__trigger').trigger('click'); await tick() }

beforeEach(() => {
  HTMLElement.prototype.showPopover ||= function () {}
  HTMLElement.prototype.hidePopover ||= function () {}
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((fn) => setTimeout(fn, 0))
})
afterEach(() => { document.body.innerHTML = ''; history.replaceState(null, '', location.pathname); vi.restoreAllMocks() })

describe('GPageIndex · anatomía', () => {
  it('nav con nombre; disparador de menú con key, pila de todas las etiquetas (aria-hidden) y la actual; icono decorativo', () => {
    const w = mk({ modelValue: 'api', class: 'mia', 'data-x': '1', id: 'pi' })
    const nav = w.find('nav')
    expect(nav.attributes('aria-label')).toBe('En esta página')
    expect(nav.attributes('id')).toBe('pi')
    expect(nav.classes()).toEqual(expect.arrayContaining(['g-page-index', 'g-page-index--appearance-relay', 'mia']))
    expect(nav.attributes('data-x')).toBe('1')
    const b = w.find('button.g-page-index__trigger')
    expect(b.attributes('aria-haspopup')).toBe('menu')
    expect(b.attributes('aria-expanded')).toBe('false')
    expect(b.attributes('type')).toBe('button')
    expect(w.find('.g-page-index__key').text()).toBe('En esta página')
    expect(w.find('.g-page-index__stack').attributes('aria-hidden')).toBe('true')
    expect(w.findAll('.g-page-index__ghost').map((g) => g.text())).toEqual(['Ejemplos', 'API', 'Teclado y foco'])
    expect(w.find('.g-page-index__current').text()).toBe('API')
    expect(w.find('.g-page-index__icon').attributes('aria-hidden')).toBe('true')
    expect(w.find('.g-page-index__icon svg').exists()).toBe(true)
    expect(b.text().replace(/\s+/g, ' ')).toContain('En esta página')
  })

  it('sin actual: is-empty y la celda vacía (la pila sigue)', () => {
    const w = mk({ track: false })
    expect(w.find('nav').classes()).toContain('is-empty')
    expect(w.find('.g-page-index__current').text()).toBe('')
    expect(w.findAll('.g-page-index__ghost')).toHaveLength(3)
  })

  it('la lista es la de GMenu: enlaces a #id, aria-current="location" en uno solo', async () => {
    const w = mk({ modelValue: 'api', track: false })
    await openMenu(w)
    const items = w.findAll('.g-menu__item')
    expect(items.map((a) => a.attributes('href'))).toEqual(['#uso', '#api', '#teclado'])
    expect(items.map((a) => a.attributes('aria-current'))).toEqual([undefined, 'location', undefined])
    expect(w.find('.g-page-index__trigger').attributes('aria-current')).toBeUndefined()
  })
})

describe('GPageIndex · modelo y avisos', () => {
  it('avisos 1 (sin id o label), 2 (repetido, gana el primero), 4 (appearance), 5 (sin label)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(GPageIndex, { props: { appearance: 'list', track: false, items: [{ id: 'a', label: 'A' }, { id: 'a', label: 'B' }, { label: 'C' }, { id: 'd', label: '  ' }] } })
    expect(w.findAll('.g-page-index__ghost').map((g) => g.text())).toEqual(['A'])
    const t = warn.mock.calls.map((c) => c[0]).join('\n')
    for (const k of [1, 2, 4, 5]) expect(t).toContain(`(aviso ${k})`)
  })

  it('aviso 3 (scroller no encontrado) y 6 (ningún id en el documento)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mk({ scroller: '#nada' })
    await tick()
    const t = warn.mock.calls.map((c) => c[0]).join('\n')
    expect(t).toContain('(aviso 3)')
    expect(t).toContain('(aviso 6)')
  })

  it('un modelValue sin item se trata como ninguno; desde fuera no se emite', async () => {
    const w = mk({ modelValue: 'zzz', track: false })
    expect(w.find('nav').classes()).toContain('is-empty')
    await w.setProps({ modelValue: 'uso' })
    await tick()
    expect(w.find('.g-page-index__current').text()).toBe('Ejemplos')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })
})

describe('GPageIndex · elegir una sección', () => {
  it('clic primario: reemite navigate con el item original, pasa la actual y lleva el foco al destino (tabindex="-1")', async () => {
    sections([800, 1600, 2400])
    const w = mk({ track: false })
    await openMenu(w)
    const a = w.findAll('.g-menu__item')[2]
    a.element.addEventListener('click', (e) => e.preventDefault()) // jsdom no navega
    await a.trigger('click', { button: 0 })
    await tick(4)
    await new Promise((r) => setTimeout(r, 0))
    const ev = w.emitted('navigate')[0][0]
    expect(ev.item).toEqual(ITEMS[2])
    expect(ev.event).toBeInstanceOf(Event)
    expect(w.emitted('update:modelValue').at(-1)[0]).toBe('teclado')
    const h = document.getElementById('teclado')
    expect(h.getAttribute('tabindex')).toBe('-1')
    expect(document.activeElement).toBe(h)
  })

  it('un destino ya enfocable no recibe tabindex', async () => {
    sections([800, 1600, 2400])
    const link = document.createElement('a')
    link.href = '#x'
    link.id = 'uso'
    document.getElementById('uso').replaceWith(link)
    const w = mk({ track: false })
    await openMenu(w)
    const a = w.findAll('.g-menu__item')[0]
    await a.trigger('click', { button: 0 })
    await tick(4)
    await new Promise((r) => setTimeout(r, 0))
    expect(link.hasAttribute('tabindex')).toBe(false)
    expect(document.activeElement).toBe(link)
  })

  it('cancelado: no cambia la actual ni mueve el foco', async () => {
    sections([800, 1600, 2400])
    const w = mount(GPageIndex, { attachTo: document.body, props: { items: ITEMS, label: 'X', track: false, onNavigate: ({ event }) => event.preventDefault() } })
    await openMenu(w)
    await w.findAll('.g-menu__item')[1].trigger('click', { button: 0 })
    await tick(4)
    await new Promise((r) => setTimeout(r, 0))
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(document.getElementById('api').hasAttribute('tabindex')).toBe(false)
  })

  it('modificadores y botón central: sin navigate (guarda de #505)', async () => {
    sections([800, 1600, 2400])
    const w = mk({ track: false })
    await openMenu(w)
    const a = w.findAll('.g-menu__item')[1]
    a.element.addEventListener('click', (e) => e.preventDefault())
    await a.trigger('click', { button: 0, ctrlKey: true })
    await a.trigger('click', { button: 0, shiftKey: true })
    expect(w.emitted('navigate')).toBeUndefined()
  })

  it('el destino no está en el documento: aviso 6 y el foco se queda', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mk({ track: false })
    await openMenu(w)
    const a = w.findAll('.g-menu__item')[1]
    a.element.addEventListener('click', (e) => e.preventDefault())
    await a.trigger('click', { button: 0 })
    await tick(4)
    expect(warn.mock.calls.map((c) => c[0]).join('\n')).toContain('#api no está en el documento (aviso 6)')
  })
})

describe('GPageIndex · línea de lectura', () => {
  it('la actual es la última cuyo borde superior cruzó la línea (tercio del visor); antes de la primera, ninguna', async () => {
    Object.defineProperty(document.documentElement, 'clientHeight', { configurable: true, value: 900 })
    Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: 5000 })
    sections([500, 1200, 2000])
    const w = mk()
    await flushRaf()
    expect(w.emitted('update:modelValue')).toBeUndefined() // null → null
    expect(w.find('nav').classes()).toContain('is-empty')
    document.getElementById('uso').getBoundingClientRect = () => ({ top: 200, bottom: 230 })
    window.dispatchEvent(new Event('scroll'))
    await flushRaf()
    expect(w.emitted('update:modelValue').at(-1)[0]).toBe('uso')
    expect(w.find('.g-page-index__current').text()).toBe('Ejemplos') // el primer valor, sin transición
    expect(w.find('.g-page-index__current').attributes('data-phase')).toBeUndefined()
  })

  it('al montar, location.hash que coincide es la actual', async () => {
    history.replaceState(null, '', '#api')
    sections([2000, 2000, 2000])
    const w = mk()
    await tick()
    expect(w.emitted('update:modelValue')[0][0]).toBe('api')
  })

  it('track=false: sin escuchas; refresh() vuelve a leer', async () => {
    const add = vi.spyOn(window, 'addEventListener')
    const w = mk({ track: false })
    await tick()
    expect(add.mock.calls.some((c) => c[0] === 'scroll')).toBe(false)
    expect(typeof w.vm.refresh).toBe('function')
  })
})

describe('GPageIndex · relevo en fases (#1047)', () => {
  it('sale (data-phase="out" + data-dir), cambia el texto con in y vuelve a reposo; ráfaga instantánea con is-burst', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
    const w = mk({ modelValue: 'uso', track: false })
    const cur = () => w.find('.g-page-index__current')
    vi.setSystemTime(Date.now() + 5000)
    await w.setProps({ modelValue: 'teclado' })
    await nextTick()
    expect(cur().attributes('data-phase')).toBe('out')
    expect(cur().attributes('data-dir')).toBe('down')
    expect(cur().text()).toBe('Ejemplos')
    cur().element.dispatchEvent(Object.assign(new Event('transitionend'), { propertyName: 'opacity' }))
    await nextTick()
    expect(cur().text()).toBe('Teclado y foco')
    expect(cur().attributes('data-phase')).toBe('in')
    await nextTick()
    vi.advanceTimersByTime(20)
    await nextTick()
    expect(cur().attributes('data-phase')).toBeUndefined()
    expect(cur().attributes('data-dir')).toBeUndefined()
    // Otro cambio a menos de 600 ms: instantáneo, sin fases
    vi.setSystemTime(Date.now() + 100)
    await w.setProps({ modelValue: 'api' })
    await nextTick()
    expect(cur().text()).toBe('API')
    expect(cur().classes()).toContain('is-burst')
    expect(cur().attributes('data-phase')).toBeUndefined()
    // Fuera de la ventana: subiendo, data-dir="up" y sin is-burst
    vi.setSystemTime(Date.now() + 1000)
    await w.setProps({ modelValue: 'uso' })
    await nextTick()
    expect(cur().classes()).not.toContain('is-burst')
    expect(cur().attributes('data-dir')).toBe('up')
    vi.useRealTimers()
  })

  it('durante la salida gana el último destino (no se encadenan relevos)', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
    const w = mk({ modelValue: 'uso', track: false })
    const cur = () => w.find('.g-page-index__current')
    vi.setSystemTime(Date.now() + 5000)
    await w.setProps({ modelValue: 'api' })
    await nextTick()
    expect(cur().attributes('data-phase')).toBe('out')
    vi.setSystemTime(Date.now() + 700)
    await w.setProps({ modelValue: 'teclado' })
    await nextTick()
    cur().element.dispatchEvent(Object.assign(new Event('transitionend'), { propertyName: 'opacity' }))
    await nextTick()
    expect(cur().text()).toBe('Teclado y foco')
    vi.useRealTimers()
  })
})
