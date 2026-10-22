import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { Comment, createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import GSection from './GSection.vue'

afterEach(() => vi.restoreAllMocks())
const warns = () => vi.spyOn(console, 'warn').mockImplementation(() => {})
const texts = (spy) => spy.mock.calls.map((c) => c[0])

// Tres secciones anidadas (más una cuarta) para medir niveles y profundidades
const nested = (props = {}) => mount({
  render: () => h(GSection, { title: 'A', ...props }, () => h(GSection, { title: 'B' }, () => h(GSection, { title: 'C' }, () => h(GSection, { title: 'D' }))))
})

describe('GSection · estructura', () => {
  it('section con cabecera, título, cuerpo y clases del contrato', () => {
    const w = mount(GSection, { props: { title: 'Firmantes' }, slots: { default: '<p>x</p>' } })
    expect(w.element.tagName).toBe('SECTION')
    expect(w.classes()).toEqual(['g-section', 'g-section--depth-1'])
    expect(w.find('.g-section__head .g-section__titles h2.g-section__title').text()).toBe('Firmantes')
    expect(w.find('.g-section__body p').exists()).toBe(true)
    expect(w.find('.g-section__desc').exists()).toBe(false)
    expect(w.find('.g-section__actions').exists()).toBe(false)
    expect(w.find('.g-section__body').classes()).toEqual(['g-section__body'])
  })

  it('el título lleva dir="auto" e id {id}-title', () => {
    const w = mount(GSection, { props: { title: 'T', id: 'sec' } })
    const t = w.find('.g-section__title')
    expect(t.attributes('dir')).toBe('auto')
    expect(t.attributes('id')).toBe('sec-title')
    expect(w.attributes('id')).toBe('sec')
  })

  it('sin id propio se genera uno y la raíz no lo lleva', () => {
    const w = mount(GSection, { props: { title: 'T' } })
    expect(w.find('.g-section__title').attributes('id')).toMatch(/-title$/)
    expect(w.attributes('id')).toBeUndefined()
  })

  it('description por prop o por slot (el slot gana)', () => {
    expect(mount(GSection, { props: { title: 'T', description: 'd' } }).find('.g-section__desc').text()).toBe('d')
    const w = mount(GSection, { props: { title: 'T', description: 'd' }, slots: { description: 'otra' } })
    expect(w.find('.g-section__desc').text()).toBe('otra')
  })

  it('slot title sustituye a la prop', () => {
    const w = mount(GSection, { slots: { title: '<bdi>X-1</bdi>' } })
    expect(w.find('.g-section__title bdi').text()).toBe('X-1')
  })

  it('actions: grupo con nombre al final de la cabecera', () => {
    const w = mount(GSection, { props: { title: 'T', labels: { actions: 'Acciones de T' } }, slots: { actions: '<button>Añadir</button>' } })
    const g = w.find('.g-section__head > .g-section__actions')
    expect(g.attributes('role')).toBe('group')
    expect(g.attributes('aria-label')).toBe('Acciones de T')
    expect(g.find('button').exists()).toBe(true)
  })

  it('landmark pone aria-labelledby al título; sin él, nada', () => {
    const w = mount(GSection, { props: { title: 'T', landmark: true } })
    expect(w.attributes('aria-labelledby')).toBe(w.find('.g-section__title').attributes('id'))
    expect(mount(GSection, { props: { title: 'T' } }).attributes('aria-labelledby')).toBeUndefined()
  })

  it('un slot de solo comentarios no cuenta como contenido', () => {
    const w = mount(GSection, { props: { title: 'T' }, slots: { actions: () => [h(Comment)] } })
    expect(w.find('.g-section__actions').exists()).toBe(false)
  })
})

describe('GSection · nivel y profundidad', () => {
  it('niveles automáticos h2 › h3 › h4 › h4', () => {
    const w = nested()
    expect(w.findAll('.g-section__title').map((n) => n.element.tagName)).toEqual(['H2', 'H3', 'H4', 'H4'])
  })

  it('profundidad con tope 3 en la clase', () => {
    const w = nested()
    expect(w.findAll('section').map((n) => n.classes().find((c) => c.includes('depth')))).toEqual(['g-section--depth-1', 'g-section--depth-2', 'g-section--depth-3', 'g-section--depth-3'])
  })

  it('headingLevel fijado gana y las de dentro cuentan desde él; el tamaño sigue la profundidad', () => {
    const w = nested({ headingLevel: 3 })
    expect(w.findAll('.g-section__title').map((n) => n.element.tagName)).toEqual(['H3', 'H4', 'H4', 'H4'])
    expect(w.find('section').classes()).toContain('g-section--depth-1')
  })

  it('fijado en una anidada: las siguientes cuentan desde ella', () => {
    const w = mount({ render: () => h(GSection, { title: 'A' }, () => h(GSection, { title: 'B', headingLevel: 2 }, () => h(GSection, { title: 'C' }))) })
    expect(w.findAll('.g-section__title').map((n) => n.element.tagName)).toEqual(['H2', 'H2', 'H3'])
  })

  it('el nivel reacciona al cambio de headingLevel', async () => {
    const w = mount(GSection, { props: { title: 'T' } })
    await w.setProps({ headingLevel: 4 })
    expect(w.find('.g-section__title').element.tagName).toBe('H4')
  })

  it('se renderiza en SSR con ids estables', async () => {
    const html = await renderToString(createSSRApp({ render: () => h(GSection, { title: 'S', landmark: true }) }))
    expect(html).toContain('<h2')
    expect(html).toMatch(/aria-labelledby="([^"]+-title)"[\s\S]*id="\1"/)
  })
})

describe('GSection · avisos de desarrollo', () => {
  it('aviso 1: sin title ni slot title', () => {
    const spy = warns()
    mount(GSection)
    expect(texts(spy).some((t) => t.includes('[Grana GSection]') && t.includes('falta title'))).toBe(true)
  })

  it('aviso 2: slot actions sin labels.actions', () => {
    const spy = warns()
    mount(GSection, { props: { title: 'T' }, slots: { actions: '<button>x</button>' } })
    expect(texts(spy).some((t) => t.includes('labels.actions'))).toBe(true)
  })

  it('aviso 3: headingLevel fuera de 2 a 4 y se usa el automático', () => {
    const spy = warns()
    const w = mount(GSection, { props: { title: 'T', headingLevel: 1 } })
    expect(w.find('.g-section__title').element.tagName).toBe('H2')
    expect(texts(spy).some((t) => t.includes('headingLevel="1"'))).toBe(true)
  })

  it('aviso 4: nivel automático 2 dentro de un .g-dialog', () => {
    const spy = warns()
    const host = document.createElement('div')
    host.className = 'g-dialog'
    document.body.appendChild(host)
    mount(GSection, { props: { title: 'T' }, attachTo: host })
    expect(texts(spy).some((t) => t.includes('GDialog'))).toBe(true)
    host.remove()
  })

  it('un uso correcto no avisa (ni con headingLevel="3" dentro de un diálogo)', () => {
    const spy = warns()
    const host = document.createElement('div')
    host.className = 'g-dialog'
    document.body.appendChild(host)
    mount(GSection, { props: { title: 'T', headingLevel: 3, labels: { actions: 'a' } }, slots: { actions: '<button>x</button>' }, attachTo: host })
    expect(spy).not.toHaveBeenCalled()
    host.remove()
  })

  it('importar el módulo no tiene efectos (#444)', async () => {
    const spy = warns()
    vi.resetModules()
    await import('./GSection.vue')
    expect(spy).not.toHaveBeenCalled()
  })
})
