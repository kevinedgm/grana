import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import GStack from './GStack.vue'

afterEach(() => vi.restoreAllMocks())
const warns = () => vi.spyOn(console, 'warn').mockImplementation(() => {})

describe('GStack · render y clases', () => {
  it('es un div vertical md por defecto, sin h, v ni divided', () => {
    const w = mount(GStack, { slots: { default: '<p>a</p><p>b</p>' } })
    expect(w.element.tagName).toBe('DIV')
    expect(w.classes()).toEqual(['g-stack', 'g-stack--orientation-vertical', 'g-stack--gap-md', 'g-stack--density-default'])
    expect(w.findAll('p')).toHaveLength(2)
  })

  it('as cambia la etiqueta; ul y ol llevan role="list" (#827) y un role de la aplicación gana', () => {
    const div = mount(GStack, { props: { as: 'section' } })
    expect(div.element.tagName).toBe('SECTION')
    expect(div.attributes('role')).toBeUndefined()
    expect(mount(GStack, { props: { as: 'ul' } }).attributes('role')).toBe('list')
    expect(mount(GStack, { props: { as: 'ol' } }).attributes('role')).toBe('list')
    expect(mount(GStack, { props: { as: 'ul' }, attrs: { role: 'menu' } }).attributes('role')).toBe('menu')
  })

  it('gap y density siguen a las props', () => {
    const w = mount(GStack, { props: { gap: 'lg', density: 'compact' } })
    expect(w.classes()).toEqual(expect.arrayContaining(['g-stack--gap-lg', 'g-stack--density-compact']))
  })

  it('horizontal actúa en los dos ejes', () => {
    expect(mount(GStack, { props: { horizontal: 'center' } }).classes()).toContain('g-stack--h-center')
    expect(mount(GStack, { props: { orientation: 'horizontal', horizontal: 'end' } }).classes()).toContain('g-stack--h-end')
  })

  it('vertical solo actúa en orientación horizontal', () => {
    warns()
    expect(mount(GStack, { props: { orientation: 'horizontal', vertical: 'bottom' } }).classes()).toContain('g-stack--v-bottom')
    expect(mount(GStack, { props: { vertical: 'top' } }).classes().some((c) => c.includes('--v-'))).toBe(false)
  })

  it('divided solo actúa en orientación vertical', () => {
    warns()
    expect(mount(GStack, { props: { divided: true } }).classes()).toContain('g-stack--divided')
    expect(mount(GStack, { props: { orientation: 'horizontal', divided: true } }).classes()).not.toContain('g-stack--divided')
  })

  it('los valores fuera de lista caen al default', () => {
    warns()
    const w = mount(GStack, { props: { orientation: 'diag', gap: 'xl', density: 'tiny', horizontal: 'left' } })
    expect(w.classes()).toEqual(['g-stack', 'g-stack--orientation-vertical', 'g-stack--gap-md', 'g-stack--density-default'])
  })

  it('el slot admite hijos de componente y no añade envoltorios', () => {
    const w = mount(GStack, { slots: { default: () => [h('i'), h('b')] } })
    expect(w.element.children).toHaveLength(2)
  })

  it('se renderiza en SSR', async () => {
    const html = await renderToString(createSSRApp({ render: () => h(GStack, { gap: 'sm' }, () => 'x') }))
    expect(html).toContain('g-stack--gap-sm')
  })
})

describe('GStack · avisos de desarrollo', () => {
  it('aviso 1: etiqueta interactiva o main (una vez por instancia)', async () => {
    const spy = warns()
    const w = mount(GStack, { props: { as: 'button' } })
    await w.setProps({ gap: 'sm' })
    const text = spy.mock.calls.map((c) => c[0]).filter((t) => t.includes('as="button"'))
    expect(text).toHaveLength(1)
    expect(text[0]).toContain('[Grana GStack]')
    mount(GStack, { props: { as: 'main' } })
    expect(spy.mock.calls.some((c) => c[0].includes('as="main"'))).toBe(true)
  })

  it('aviso 2: valores fuera de lista', () => {
    const spy = warns()
    mount(GStack, { props: { gap: 'xl', vertical: undefined } })
    expect(spy.mock.calls.some((c) => c[0].includes('gap="xl"'))).toBe(true)
  })

  it('aviso 3: vertical en vertical y divided en horizontal', () => {
    const spy = warns()
    mount(GStack, { props: { vertical: 'top' } })
    mount(GStack, { props: { orientation: 'horizontal', divided: true } })
    const t = spy.mock.calls.map((c) => c[0])
    expect(t.some((x) => x.includes('vertical solo actúa'))).toBe(true)
    expect(t.some((x) => x.includes('divided solo actúa'))).toBe(true)
  })

  it('un uso correcto no avisa', () => {
    const spy = warns()
    mount(GStack, { props: { orientation: 'horizontal', vertical: 'center', horizontal: 'end' } })
    mount(GStack, { props: { divided: true, as: 'section' } })
    expect(spy).not.toHaveBeenCalled()
  })

  it('importar el módulo no tiene efectos (#444)', async () => {
    const spy = warns()
    vi.resetModules()
    await import('./GStack.vue')
    expect(spy).not.toHaveBeenCalled()
  })
})
